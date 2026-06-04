---
layout: post
title:  "Measuring GenAI Effectiveness Part 1: Data Collection"
date:   2026-03-10 10:00:00 -0500
category: Blog
tags: [ai, copilot, devops, github, metrics, developer-tools, best-practices]
excerpt: "Copilot adoption numbers don't tell you if AI is making your team better. Here's how to collect the metrics that actually matter."
---

Stop me if you've heard this one: your organization rolls out GitHub Copilot, everyone's excited, and a few weeks later someone asks, "So... is it working?"

Then someone pulls up a dashboard showing seat counts and acceptance rates, everyone nods approvingly, and the conversation moves on. But here's the thing - **you just measured gym memberships, not fitness.**

Knowing that 200 people have Copilot seats and 30% of suggestions get accepted tells you about adoption. It tells you nothing about whether your developers are actually shipping better software, faster. That's a fundamentally different question, and it requires fundamentally different data.

This is Part 1 of a 4-part series where we build a complete GenAI effectiveness measurement system from scratch. By the end, you'll have:

1. **Data collection** (this post) - Scripts that pull Copilot usage, PR health, and issue lifecycle metrics from the GitHub API
2. **[A dashboard](/blog/2026/03/10/measuring-genai-effectiveness-dashboard/)** - A static GitHub Pages site that visualizes trends over time
3. **[Alerting](/blog/2026/03/10/measuring-genai-effectiveness-alerting/)** - Automated detection of declining metrics and wasted spend
4. **[Enterprise scaling](/blog/2026/03/10/measuring-genai-effectiveness-scaling/)** - How to evolve this pattern when you have 100k repos across 100 orgs

Everything we build lives in a companion repo you can fork and deploy today: [**jmassardo/copilot-metrics-dashboard**](https://github.com/jmassardo/copilot-metrics-dashboard)

## What Should We Actually Measure?

Before we write a single line of code, let's figure out what we're trying to learn. We need metrics across three categories:

| Category | What It Tells You | Example Metrics |
|----------|------------------|-----------------|
| **Copilot Usage** | Are people using the tool? | Acceptance rate, active users, seat utilization |
| **PR Health** | Is code moving faster through review? | PR lifespan, time to first review, merge rate |
| **Issue Lifecycle** | Is the team resolving work faster? | Issue lifespan, backlog trend, stale issue count |

The magic happens when you look at these **side by side**. If Copilot acceptance rates are high but PR lifespan is getting worse, something's off. Maybe developers are accepting more suggestions but the code quality is tanking and reviews are taking longer. That's a signal you'd never see from Copilot metrics alone.

## The APIs We Need

We're targeting **GitHub Enterprise Cloud with Copilot Business**, so we'll use these REST API endpoints:

### Copilot Metrics

```
GET /orgs/{org}/copilot/metrics
```

This returns up to 28 days of daily usage data including:
- `total_active_users` and `total_engaged_users`
- Code completion stats (suggestions, acceptances, lines) broken down by editor and language
- Chat stats (turns, insertions, copy events)

```
GET /orgs/{org}/copilot/billing/seats
```

This returns every seat assignment with:
- Who has a seat and when it was assigned
- Last activity date and editor
- Whether the seat is pending cancellation

### PR and Issue Data

```
GET /repos/{owner}/{repo}/pulls?state=closed
GET /repos/{owner}/{repo}/pulls/{number}/reviews
GET /repos/{owner}/{repo}/issues?state=closed
GET /repos/{owner}/{repo}/issues/{number}/comments
```

Standard REST API endpoints. Nothing fancy, but we'll need to paginate through them and calculate derived metrics like lifespan and time-to-first-review ourselves.

## Setting Up API Access

You need a token with the right scopes. Here are your options:

**Personal Access Token (classic):**

| Scope | Why |
|-------|-----|
| `manage_billing:copilot` | Copilot metrics and seat data |
| `repo` | PR and issue data on private repos |
| `read:org` | Org repo discovery |

**Fine-grained PAT:**

| Permission | Level | Why |
|-----------|-------|-----|
| `Copilot Business` | Organization (read) | Copilot metrics |
| `Members` | Organization (read) | Org member data |
| `Issues` | Repository (read) | Issue data |
| `Pull requests` | Repository (read) | PR data |
| `Metadata` | Repository (read) | Repo discovery |

A **GitHub App** works too (same permissions), and is the better choice if you want to avoid tying this to a personal account.

## The Collection Scripts

Let's walk through the key parts of each collector. Full source is in the [companion repo](https://github.com/jmassardo/copilot-metrics-dashboard/tree/main/scripts).

### Configuration

Everything is driven by environment variables so there's nothing to hardcode:

```python
# scripts/config.py

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_API_BASE = os.environ.get("GITHUB_API_BASE", "https://api.github.com")
GITHUB_ORG = os.environ.get("GITHUB_ORG", "")

# Comma-separated list, or leave empty to auto-discover
GITHUB_REPOS = [
    r.strip()
    for r in os.environ.get("GITHUB_REPOS", "").split(",")
    if r.strip()
]

def get_headers():
    return {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "X-GitHub-Api-Version": "2022-11-28",
    }
```

If you don't specify repos, the config module auto-discovers them from the org (sorted by most recently pushed, capped at 50 to be kind to rate limits).

### Collecting Copilot Metrics

The Copilot metrics collector hits two endpoints and produces a processed summary:

```python
# scripts/collect_copilot_metrics.py

def collect_copilot_metrics() -> dict:
    """GET /orgs/{org}/copilot/metrics"""
    resp = requests.get(
        f"{GITHUB_API_BASE}/orgs/{GITHUB_ORG}/copilot/metrics",
        headers=get_headers(),
        params={"per_page": 28, "page": 1},
    )
    resp.raise_for_status()
    return {
        "metrics": resp.json(),
        "collected_at": datetime.now(timezone.utc).isoformat(),
    }


def collect_copilot_seats() -> dict:
    """GET /orgs/{org}/copilot/billing/seats - paginated"""
    all_seats = []
    page = 1
    while True:
        resp = requests.get(
            f"{GITHUB_API_BASE}/orgs/{GITHUB_ORG}/copilot/billing/seats",
            headers=get_headers(),
            params={"per_page": 100, "page": page},
        )
        resp.raise_for_status()
        data = resp.json()
        seats = data.get("seats", [])
        if not seats:
            break
        all_seats.extend(seats)
        if len(all_seats) >= data.get("total_seats", 0):
            break
        page += 1
    # ... classify as active/inactive/never_used
```

The processor then walks through the raw metrics to extract acceptance rates, language breakdowns, and editor breakdowns into a clean daily time series.

### Collecting PR Metrics

For each tracked repo, we pull closed PRs (recent) and open PRs, then fetch reviews for each:

```python
# scripts/collect_pr_metrics.py

def calculate_pr_metrics(pr: dict, reviews: list[dict]) -> dict:
    created = datetime.fromisoformat(pr["created_at"].replace("Z", "+00:00"))
    closed = pr.get("closed_at")

    # PR lifespan: time from open to close
    lifespan_hours = None
    if closed:
        close_dt = datetime.fromisoformat(closed.replace("Z", "+00:00"))
        lifespan_hours = round((close_dt - created).total_seconds() / 3600, 2)

    # Time to first review: first non-bot review submission
    time_to_first_review_hours = None
    submitted_reviews = [
        r for r in reviews
        if r.get("state") in ("APPROVED", "CHANGES_REQUESTED", "COMMENTED")
        and r.get("submitted_at")
    ]
    if submitted_reviews:
        first = min(submitted_reviews, key=lambda r: r["submitted_at"])
        review_dt = datetime.fromisoformat(first["submitted_at"].replace("Z", "+00:00"))
        time_to_first_review_hours = round(
            (review_dt - created).total_seconds() / 3600, 2
        )

    return {
        "lifespan_hours": lifespan_hours,
        "time_to_first_review_hours": time_to_first_review_hours,
        "review_cycles": len([r for r in reviews if r.get("state") == "CHANGES_REQUESTED"]),
        "total_changes": pr.get("additions", 0) + pr.get("deletions", 0),
        "was_merged": pr.get("merged_at") is not None,
        # ... other fields
    }
```

We then aggregate into medians, P90s, merge rates, and weekly throughput. The important thing here is we're using **median** instead of mean. One monster PR that sat open for 3 weeks shouldn't skew your entire picture.

### Collecting Issue Metrics

Similar pattern - pull open and closed issues, fetch comments, calculate lifecycle metrics:

```python
# scripts/collect_issue_metrics.py

def calculate_issue_metrics(issue: dict, comments: list[dict]) -> dict:
    created = datetime.fromisoformat(issue["created_at"].replace("Z", "+00:00"))

    # Time to first response (first comment NOT from the author)
    author = issue["user"]["login"]
    non_author_comments = [c for c in comments if c["user"]["login"] != author]
    time_to_first_response_hours = None
    if non_author_comments:
        first = min(non_author_comments, key=lambda c: c["created_at"])
        comment_dt = datetime.fromisoformat(first["created_at"].replace("Z", "+00:00"))
        time_to_first_response_hours = round(
            (comment_dt - created).total_seconds() / 3600, 2
        )

    # Stale detection: open + no activity in 30 days
    last_activity_dt = datetime.fromisoformat(
        issue.get("updated_at", issue["created_at"]).replace("Z", "+00:00")
    )
    is_stale = issue["state"] == "open" and (now - last_activity_dt).days > 30

    return {
        "lifespan_hours": lifespan_hours,
        "time_to_first_response_hours": time_to_first_response_hours,
        "is_stale": is_stale,
        # ... other fields
    }
```

We also track **weekly throughput** (issues opened vs. closed) and calculate a **backlog delta** to detect whether the issue backlog is growing or shrinking over time.

### Data Storage

Each collection run saves timestamped JSON files:

```
data/
├── copilot/
│   ├── metrics_2026-03-10.json    # Raw API response
│   ├── seats_2026-03-10.json      # Seat assignments
│   └── summary_2026-03-10.json    # Processed daily summary
├── pulls/
│   └── pr_metrics_2026-03-10.json # PR data + aggregates
└── issues/
    └── issue_metrics_2026-03-10.json # Issue data + aggregates
```

No database required. The daily JSON files accumulate over time, and the site generator (covered in Part 2) merges them into a rolling historical view. Simple, portable, and easy to debug.

## Running It

### Locally

```bash
export GITHUB_TOKEN="ghp_your_token_here"
export GITHUB_ORG="your-org"

python scripts/collect_copilot_metrics.py
python scripts/collect_pr_metrics.py
python scripts/collect_issue_metrics.py
```

### Via GitHub Actions

The companion repo includes a workflow that runs all three collectors on a nightly cron:

```yaml
on:
  schedule:
    - cron: '0 5 * * *'  # 5 AM UTC (midnight ET)
  workflow_dispatch: {}

steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-python@v5
    with:
      python-version: '3.12'
  - run: pip install -r requirements.txt

  - name: Collect Copilot metrics
    env:
      GITHUB_TOKEN: ${{ secrets.METRICS_GITHUB_TOKEN }}
      GITHUB_ORG: ${{ vars.GITHUB_ORG }}
    run: python scripts/collect_copilot_metrics.py

  - name: Collect PR metrics
    env:
      GITHUB_TOKEN: ${{ secrets.METRICS_GITHUB_TOKEN }}
      GITHUB_ORG: ${{ vars.GITHUB_ORG }}
    run: python scripts/collect_pr_metrics.py

  - name: Collect issue metrics
    env:
      GITHUB_TOKEN: ${{ secrets.METRICS_GITHUB_TOKEN }}
      GITHUB_ORG: ${{ vars.GITHUB_ORG }}
    run: python scripts/collect_issue_metrics.py
```

The workflow commits the collected data back to the repo, so your historical data grows automatically with each run.

## What's Next

We've got data flowing. In **[Part 2: Building the Dashboard](/blog/2026/03/10/measuring-genai-effectiveness-dashboard/)**, we'll take all this raw data and turn it into a GitHub Pages dashboard with trend charts, summary cards, and a dark theme that won't burn your retinas during a late-night metrics review.

The full source code for everything in this series is available at [**jmassardo/copilot-metrics-dashboard**](https://github.com/jmassardo/copilot-metrics-dashboard).

## Closing

*Have questions about measuring GenAI effectiveness or want to share how your team tracks developer productivity? Find me on [GitHub](https://github.com/jmassardo), [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), or [Bluesky](https://bsky.app/profile/jmassardo.bsky.social).*
