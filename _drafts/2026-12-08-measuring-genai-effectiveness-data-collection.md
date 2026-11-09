---
layout: post
title:  "Measuring GenAI Effectiveness Part 1: Data Collection"
date: 2026-12-08 10:00:00 -0600
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

The [**jmassardo/copilot-metrics-dashboard** companion repo](https://github.com/jmassardo/copilot-metrics-dashboard) supplies the original implementation pattern. **Freshness check, November 3, 2026:** the examples below use the current report API. Migrate any legacy collectors in your fork before deploying; this post is not a claim that every companion script has already been updated.

## What Should We Actually Measure?

Before we write a single line of code, let's figure out what we're trying to learn. We need metrics across three categories:

| Category | What It Tells You | Example Metrics |
|----------|------------------|-----------------|
| **Copilot Usage** | Are people using the tool? | Acceptance rate, active users, seat utilization |
| **PR Health** | Is code moving faster through review? | PR lifespan, time to first review, merge rate |
| **Issue Lifecycle** | Is the team resolving work faster? | Issue lifespan, backlog trend, stale issue count |

The useful part is looking at these **side by side**. High acceptance alongside longer PR lifespans gives you a question to investigate, not a diagnosis of declining code quality.

**Measurement is not causation.** Compare equivalent repositories, work types, PR sizes, and periods. Add developer feedback, rework, and defect or incident measures before claiming effectiveness. A phased rollout with a credible comparison group is stronger evidence than two lines moving together.

## The APIs We Need

We're targeting **GitHub Enterprise Cloud with Copilot Business or Enterprise**. Enable the enterprise's **Copilot usage metrics** policy and confirm report access before scheduling collection.

### Copilot Metrics

```
GET /orgs/{org}/copilot/metrics/reports/organization-28-day/latest
```

The old `/copilot/metrics` endpoint [sunset on April 2, 2026](https://github.blog/changelog/2026-01-29-closing-down-notice-of-legacy-copilot-metrics-apis/). Don't confuse it with the still-current report endpoints.

The [current API](https://docs.github.com/en/rest/copilot/copilot-usage-metrics) returns **`download_links`, `report_start_day`, and `report_end_day`**, not inline daily metrics. Download every signed link promptly and parse the NDJSON. Aggregate 28-day records contain a `day_totals` array.

Use [the documented report fields](https://docs.github.com/en/copilot/reference/copilot-usage-metrics/copilot-usage-metrics), including `daily_active_users` and `totals_by_feature`. For inline completion acceptance, select `feature == "code_completion"` and divide accepted activities by generated activities. Don't mix agent edits with inline suggestions or substitute lines of code for suggestion counts.

Reports can lag by **two full UTC days**. Enterprise history begins October 10, 2025, and is accessible for up to one year; organization history begins December 12, 2025. A 90-day dashboard needs retained daily reports or backfill, not just the latest 28-day download.

```
GET /orgs/{org}/copilot/billing/seats
```

This returns every seat assignment with:
- Who has a seat and when it was assigned
- Last activity date and editor
- Whether the seat is pending cancellation

The [user-management API](https://docs.github.com/en/rest/copilot/copilot-user-management) remains the license source of truth. A null `last_activity_at` means **no recorded activity**, not proof that someone never used Copilot. IDE telemetry settings affect this field.

Current reports include IDE, CLI, and agent-app signals, with coverage varying by field. GitHub.com Chat and GitHub Mobile aren't included in these usage reports. Empty breakdowns can mean missing client telemetry, not zero usage.

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
| `read:org` | Organization reports and seat data (authorized organization owner) |
| `repo` | PR and issue data on private repos |
| `manage_billing:copilot` or `read:enterprise` | Enterprise reports, if collecting at enterprise scope |

**Fine-grained access and GitHub Apps:** report visibility uses the documented **View Organization Copilot Metrics** or **View Enterprise Copilot Metrics** authorization. It is not the same as a blanket `Copilot Business` permission. Repository collection needs read access to **Issues**, **Pull requests**, and **Metadata** for the selected repositories.

Check supported token types and permissions for each endpoint, especially seat management. Don't assume one fine-grained token or installation token covers every report and billing endpoint. Prefer an App for repository automation where supported, and validate the reporting identity separately. The default Actions `GITHUB_TOKEN` does not automatically provide organization-wide metrics access.

## The Collection Scripts

Let's walk through the key parts of each collector. Full source is in the [companion repo](https://github.com/jmassardo/copilot-metrics-dashboard/tree/main/scripts).

### Configuration

Everything is driven by environment variables so there's nothing to hardcode:

```python
# scripts/config.py
import os

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
        "X-GitHub-Api-Version": "2026-03-10",
    }
```

The original configuration auto-discovers recently pushed repositories, capped at 50. **Record that coverage explicitly**: a convenience sample is not the whole organization.

### Collecting Copilot Metrics

Here is the current report-download pattern. It uses `requests`, plus the configuration above:

```python
# scripts/collect_copilot_metrics.py
import json
from datetime import datetime, timezone
import requests

def collect_copilot_metrics() -> dict:
    """Fetch metadata, then download all aggregate NDJSON report files."""
    resp = requests.get(
        f"{GITHUB_API_BASE}/orgs/{GITHUB_ORG}/copilot/metrics/reports/"
        "organization-28-day/latest",
        headers=get_headers(),
        timeout=30,
    )
    resp.raise_for_status()
    metadata = resp.json()
    daily = []
    for link in metadata["download_links"]:
        # Signed URL supplies access. Do not forward the GitHub token.
        report = requests.get(link, timeout=60)
        report.raise_for_status()
        for line in report.text.splitlines():
            if line.strip():
                daily.extend(json.loads(line)["day_totals"])
    return {
        "metrics": daily,
        "report_start_day": metadata["report_start_day"],
        "report_end_day": metadata["report_end_day"],
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
            timeout=30,
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
    return {"seats": all_seats}
```

Normalize API `day` to the dashboard's `date`, and preserve the completion numerator and denominator as `total_acceptances` and `total_suggestions`. Return `acceptance_rate = None` when the denominator is zero. Treat HTTP 204 on daily report endpoints as no report, and 403/404 as conditions to investigate, not successful zero-usage days.

For team reporting, [join daily per-user reports with daily user-teams reports](https://docs.github.com/en/copilot/reference/copilot-usage-metrics/team-level-metrics) on stable `user_id`, day, and scope. Teams with fewer than five seated users are excluded from the membership report. Membership overlaps mean summed team or organization counts are not unique enterprise users.

### Collecting PR Metrics

For each tracked repo, we pull closed PRs (recent) and open PRs, then fetch reviews for each:

```python
# scripts/collect_pr_metrics.py
from datetime import datetime

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
        and r.get("user", {}).get("type") != "Bot"
        and r.get("user", {}).get("id") != pr.get("user", {}).get("id")
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
        "total_changes": (
            pr["additions"] + pr["deletions"]
            if "additions" in pr and "deletions" in pr else None
        ),
        "was_merged": pr.get("merged_at") is not None,
        # ... other fields
    }
```

Fetch [individual PR details](https://docs.github.com/en/rest/pulls/pulls#get-a-pull-request) for `additions` and `deletions`; list responses don't supply those fields reliably. Do not silently treat missing size data as zero.

We then aggregate into medians, P90s, merge rates, and weekly throughput. Separate **open-to-close** duration from **open-to-merge**, exclude author and bot reviews for human TTFR, and show sample sizes. A median of one PR is technically a median and practically a warning label.

The snippet's `review_cycles` is a count of change-request reviews, not a reconstruction of review rounds. Open-to-first-review also includes draft time; use a ready-for-review baseline if that better matches your process.

### Collecting Issue Metrics

Similar pattern - pull open and closed issues, fetch comments, calculate lifecycle metrics:

```python
# scripts/collect_issue_metrics.py
from datetime import datetime, timezone

def calculate_issue_metrics(issue: dict, comments: list[dict]) -> dict:
    created = datetime.fromisoformat(issue["created_at"].replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    closed = issue.get("closed_at")
    lifespan_hours = None
    if closed:
        closed_dt = datetime.fromisoformat(closed.replace("Z", "+00:00"))
        lifespan_hours = (closed_dt - created).total_seconds() / 3600

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

The [issues API](https://docs.github.com/en/rest/issues/issues#list-repository-issues) also returns pull requests. Exclude records containing `pull_request` before calculating issue metrics. Paginate issues, reviews, and comments; a truncated page is not a complete baseline.

We also track **weekly throughput** and backlog changes. Count complete weeks, account for reopening, and label the observation window. Issue age and backlog are flow signals, not direct measures of defect quality.

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

No database required for a small installation. **Keep raw seat, per-user, and private-repository data in restricted storage**, with an explicit retention policy. Never commit it to a public companion fork or Pages artifact. Publish only approved aggregates and suppress small groups; pseudonymous IDs alone don't make activity anonymous.

## Running It

### Locally

```bash
# Supply an authorized reporting token through your secret manager:
export GITHUB_ORG="your-org"

python scripts/collect_copilot_metrics.py
python scripts/collect_pr_metrics.py
python scripts/collect_issue_metrics.py
```

### Via GitHub Actions

The companion repo includes a workflow that runs all three collectors on a nightly cron:

```yaml
name: Collect metrics
on:
  schedule:
    - cron: '0 5 * * *'  # 05:00 UTC; local time varies with DST
  workflow_dispatch: {}

permissions:
  contents: read
jobs:
  collect:
    runs-on: ubuntu-latest
    env:
      GITHUB_TOKEN: ${{ secrets.METRICS_GITHUB_TOKEN }}
      GITHUB_ORG: ${{ vars.GITHUB_ORG }}
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: actions/setup-python@v7
        with:
          python-version: '3.12'
      - run: pip install -r requirements.txt
      - run: python scripts/collect_copilot_metrics.py
      - run: python scripts/collect_pr_metrics.py
      - run: python scripts/collect_issue_metrics.py
```

This workflow assumes you have migrated the companion collectors to the report API. Add a restricted persistence step for history; runner files disappear after the job. The [checkout](https://github.com/actions/checkout) and [setup-python](https://github.com/actions/setup-python) examples use current v7 releases. Pin reviewed revisions in production, and check runner requirements if using self-hosted runners. Scheduled execution is not guaranteed at exactly 05:00.

## Summary and Key Takeaways

- Migrate legacy Copilot endpoints and parse downloaded NDJSON, not report metadata as metrics.
- Store report dates, freshness, coverage, and sample sizes alongside each summary.
- Keep identities private and compare equivalent work before making effectiveness claims.

## What's Next

We've got data flowing. In **[Part 2: Building the Dashboard](/blog/2026/03/10/measuring-genai-effectiveness-dashboard/)**, we'll take all this raw data and turn it into a GitHub Pages dashboard with trend charts, summary cards, and a dark theme that won't burn your retinas during a late-night metrics review.

The full source code for everything in this series is available at [**jmassardo/copilot-metrics-dashboard**](https://github.com/jmassardo/copilot-metrics-dashboard).

## Closing

*Have questions about measuring GenAI effectiveness or want to share how your team tracks developer productivity? Find me on [GitHub](https://github.com/jmassardo), [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), or [Bluesky](https://bsky.app/profile/jmassardo.bsky.social).*
