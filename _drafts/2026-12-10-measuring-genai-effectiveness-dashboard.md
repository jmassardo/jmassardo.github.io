---
layout: post
title:  "Measuring GenAI Effectiveness Part 2: Building the Dashboard"
date: 2026-12-10 10:00:00 -0600
category: Blog
tags: [ai, copilot, devops, github, metrics, developer-tools, best-practices]
excerpt: "Raw data is useless if nobody looks at it. Here's how to build a static GitHub Pages dashboard that turns your metrics into actionable trends."
---

In **[Part 1](/blog/2026/03/10/measuring-genai-effectiveness-data-collection/)**, we built Python scripts that collect Copilot usage, PR health, and issue lifecycle metrics from the GitHub API. Now we have daily JSON files piling up in a `data/` directory.

Raw data sitting in JSON files helps nobody. In this post, we'll turn that data into a static dashboard that:

- **Merges daily snapshots** into rolling historical trends
- **Renders interactive charts** with Chart.js (no backend required)
- **Deploys automatically** to GitHub Pages on every collection run
- **Works on any screen** with a responsive dark theme

The result is a single-page dashboard your team can bookmark and check anytime. No Grafana instance to manage, no database to maintain.

**November 3, 2026 update:** feed this dashboard normalized current Copilot usage reports from Part 1, not the retired metrics endpoint. Treat companion snippets as implementation patterns until your fork's migration is verified.

**Static does not mean private.** A private repository does not automatically make its Pages site private. Confirm [Pages access control](https://docs.github.com/en/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site) before deploying internal metrics. Publish only approved aggregates, never seat identities or raw private-repository records.

## The Data Pipeline

Before we can render charts, we need to process our accumulated daily JSON files into a single `dashboard.json` that the frontend consumes. Here's the flow:

```mermaid
flowchart LR
    subgraph inputs["Daily JSON Snapshots"]
        C["data/copilot/summary_*.json"]
        P["data/pulls/pr_metrics_*.json"]
        I["data/issues/issue_metrics_*.json"]
    end
    C --> G["generate_site.py"]
    P --> G
    I --> G
    G --> D["site/data/dashboard.json"]
```

### Merging Historical Data

The site generator reads every daily snapshot, deduplicates by **report day**, and trims to the dashboard window (default: 90 days). Download time is not activity time. The latest report only covers 28 days; a wider chart needs retained history or backfill.

```python
# scripts/generate_site.py

def merge_copilot_history() -> dict:
    data_path = get_data_path("copilot")
    history = {"daily": {}, "seats_history": []}

    for filepath in sorted(glob.glob(os.path.join(data_path, "summary_*.json"))):
        summary = load_json(filepath)
        for day in summary.get("daily", []):
            date = day.get("date", "")
            if date:
                # Latest collection wins for each date
                history["daily"][date] = day

        if "seats" in summary:
            seats_entry = {
                "date": summary.get("collected_at", "")[:10],
                **summary["seats"],
            }
            history["seats_history"] = [
                s for s in history["seats_history"]
                if s["date"] != seats_entry["date"]
            ]
            history["seats_history"].append(seats_entry)

    # Trim to dashboard window
    cutoff = (datetime.now(timezone.utc) - timedelta(days=DASHBOARD_DAYS)).strftime("%Y-%m-%d")
    history["daily"] = {k: v for k, v in history["daily"].items() if k >= cutoff}
    history["seats_history"] = sorted(
        (s for s in history["seats_history"] if s["date"] >= cutoff),
        key=lambda s: s["date"],
    )

    return history
```

The same pattern applies for PR and issue data. Each gets merged into a rolling history, then everything is combined into a single JSON structure the dashboard reads.

### The Dashboard Data Structure

The generated `dashboard.json` has three top-level sections. This is a synthetic, one-day example, not a GitHub API response:

```json
{
  "summary": {
    "generated_at": "2026-03-10T05:00:00Z",
    "copilot": { "acceptance_rate": 28.5, "active_users": 142, "report_end_day": "2026-03-07" },
    "seats": { "total": 200, "active": 142, "inactive": 38, "never_used": 20, "utilization_pct": 71 },
    "prs": { "median_lifespan_hours": 18.3, "median_ttfr_hours": 4.2, "merge_rate_pct": 91.2 },
    "issues": { "open": 87, "stale": 12, "median_lifespan_hours": 72.1 }
  },
  "alerts": [],
  "charts": {
    "copilot": { "dates": ["2026-03-07"], "acceptance_rate": [28.5], "active_users": [142] },
    "seats": { "dates": ["2026-03-10"], "total": [200], "active": [142] },
    "prs": { "dates": ["2026-03-10"], "median_lifespan": [18.3], "median_ttfr": [4.2] },
    "issues": { "dates": ["2026-03-10"], "open_issues": [87], "stale_issues": [12] },
    "pr_throughput": { "weeks": [], "merged": [] },
    "issue_throughput": { "weeks": [], "opened": [], "closed": [] }
  }
}
```

The `summary` object powers the top-level cards. The `charts` object provides time series arrays that map directly to Chart.js datasets. This keeps the JavaScript dead simple - just fetch, map, and render.

Store missing metrics as `null`, not zero. Include collection freshness, report end date, repository coverage, and PR sample sizes. The legacy `never_used` key means **no recorded activity**, not established non-use. Daily active users and seat activity over 30 days are different populations.

## The Static Dashboard

We're using plain HTML + CSS + JavaScript with [Chart.js](https://www.chartjs.org/docs/latest/) loaded from a version-pinned CDN URL or hosted locally. Zero build tools. Zero npm packages. Zero bundlers. You can understand the entire frontend by reading three files.

### Summary Cards

The top of the dashboard shows at-a-glance numbers with color coding:

```javascript
// site/js/dashboard.js

function renderSummaryCards(summary) {
    // Acceptance rate - green if >= 25%, yellow if >= 15%, red otherwise
    if (summary.copilot) {
        const rate = summary.copilot.acceptance_rate;
        const el = document.getElementById('valAcceptanceRate');
        el.textContent = Number.isFinite(rate) ? `${rate}%` : 'No data';
        el.className = 'card-value ' + (!Number.isFinite(rate) ? '' :
            rate >= 25 ? 'good' : rate >= 15 ? 'warning' : 'bad');
    }

    // Seat utilization
    if (summary.seats) {
        const el = document.getElementById('valActiveUsers');
        el.textContent = `${summary.seats.active}`;
        document.getElementById('detailActiveUsers').textContent =
            `of ${summary.seats.total} seats (${summary.seats.utilization_pct}% utilized)`;
    }

    // PR lifespan - show in hours or days depending on scale
    if (summary.prs) {
        const hours = summary.prs.median_lifespan_hours;
        const el = document.getElementById('valPRLifespan');
        el.textContent = !Number.isFinite(hours) ? 'No data' :
            hours < 24 ? `${hours.toFixed(1)}h` : `${(hours / 24).toFixed(1)}d`;
        el.className = 'card-value ' + (!Number.isFinite(hours) ? '' :
            hours <= 24 ? 'good' : hours <= 48 ? 'warning' : 'bad');
    }
    // ... more cards
}
```

Six cards across the top: Acceptance Rate, Active Users, PR Lifespan, Time to Review, Merge Rate, and Open Issues. Each one turns green/yellow/red based on health thresholds. A quick glance tells you if something needs attention.

These thresholds are **starter settings**, not universal productivity standards. Show status text as well as color. Compare acceptance only within the same completion definition, and calculate period rates from summed acceptances divided by summed suggestions.

### Chart Rendering

Each chart section uses a reusable helper that standardizes the Chart.js config for our dark theme:

```javascript
function createLineChart(canvasId, labels, datasets, yAxisLabel = '') {
    const ctx = document.getElementById(canvasId);
    return new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: {
                    display: datasets.length > 1,
                    position: 'top',
                    labels: { usePointStyle: true, boxWidth: 8 },
                },
            },
            scales: {
                x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } },
                y: { title: { display: !!yAxisLabel, text: yAxisLabel }, beginAtZero: true },
            },
        },
    });
}
```

Then rendering a specific chart is just a matter of wiring data to the helper:

```javascript
// Acceptance Rate Trend
createLineChart('chartAcceptanceRate', copilot.dates, [
    {
        label: 'Acceptance Rate (%)',
        data: copilot.acceptance_rate,
        borderColor: '#3fb950',
        backgroundColor: 'rgba(63, 185, 80, 0.2)',
        fill: true,
        tension: 0.3,
    },
], '%');
```

### The Chart Layout

The dashboard has four major sections, each with a 2-column responsive grid:

**Copilot Usage**
- Acceptance Rate Trend (line)
- Daily Active Users (line, with separate CLI or agent series where available)
- Suggestions & Acceptances (grouped bar)
- Chat Activity (line)

**Seat Utilization**
- Seat Allocation Over Time (multi-line: total, active, inactive, never used)
- Language Breakdown (doughnut - top 10 languages by suggestions)

**Pull Request Health**
- PR Lifespan Trend (dual line: median + P90)
- Time to First Review (line)
- Weekly PR Throughput (bar)
- Merge Rate Trend (line)

**Issue Health**
- Open & Stale Issues (dual line)
- Issue Lifespan Trend (line)
- Weekly Issue Throughput (grouped bar: opened vs. closed) - full width

### The CSS

We're using GitHub's dark theme colors for a clean look:

```css
:root {
    --bg-primary: #0d1117;
    --bg-secondary: #161b22;
    --border: #30363d;
    --text-primary: #e6edf3;
    --text-secondary: #8b949e;
    --accent-blue: #58a6ff;
    --accent-green: #3fb950;
    --accent-yellow: #d29922;
    --accent-red: #f85149;
}
```

Use `grid-template-columns: repeat(auto-fit, minmax(min(100%, 400px), 1fr))` so the grid can shrink below 400px on phones. Cards use a 6-across grid that drops to 2 on tablets and 1 on phones.

## Deploying to GitHub Pages

Add these **steps inside a deployment job** after collection and restricted history retrieval. The job needs `pages: write`, `id-token: write`, `contents: read`, a `github-pages` environment, and concurrency control. Follow the [official custom Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages):

```yaml
- name: Generate dashboard data
  run: python scripts/generate_site.py

- name: Deploy to GitHub Pages
  uses: actions/upload-pages-artifact@v4
  with:
    path: site/

- name: Deploy Pages
  uses: actions/deploy-pages@v4
```

After each nightly collection run, the workflow:

1. Generates fresh `dashboard.json` from all accumulated data
2. Saves raw history to restricted storage and checks that `site/` contains only approved aggregates
3. Uploads and deploys only the sanitized `site/` directory to GitHub Pages

One prerequisite: go to **Settings > Pages** in your repo and set the source to **GitHub Actions**.

## Reading the Dashboard

Let's talk about what "good" looks like on each section:

**Copilot Usage:** Investigate changes in acceptance and user counts against feature mix, telemetry coverage, editor versions, and report freshness. More agent use can reduce inline completions without reducing value.

**Seat Utilization:** Investigate "no recorded activity" and "inactive" seats before calling them waste. Leave, onboarding, telemetry gaps, and legitimate infrequent use matter. Estimate recoverable spend from confirmed reclaimable seats and your actual contracted seat rate, not a hardcoded list price.

**PR Health:** A falling **time to merge** can indicate faster flow; faster closure can also mean rejected PRs. Watch merge rate, PR size, sample counts, and the P90. Time to first human review helps surface review bottlenecks.

**Issue Health:** The throughput chart is the key one here. If the "opened" bars are consistently taller than "closed", your backlog is growing. The stale issue count climbing means things are falling through the cracks.

**The composite view:** Correlations help you choose the next investigation. Acceptance rising alongside faster merges does not prove Copilot caused the change. Backlog growth does not prove you're shipping bugs. Pair comparable cohorts with rework, defect data, and developer feedback.

## Summary and Key Takeaways

- Show report freshness and coverage next to the attractive charts.
- Preserve missing values and label starter thresholds.
- Publish aggregates only, verify site visibility, and use trends to ask better questions.

## What's Next

We have data collection and a dashboard. But nobody's going to stare at charts every day. In **[Part 3: Alerting on What Matters](/blog/2026/03/10/measuring-genai-effectiveness-alerting/)**, we'll build an automated alert system that surfaces problems before they become crises, including detecting wasted seats, declining metrics, and review bottlenecks.

Full source code: [**jmassardo/copilot-metrics-dashboard**](https://github.com/jmassardo/copilot-metrics-dashboard)

## Closing

*Have questions about building developer productivity dashboards? Find me on [GitHub](https://github.com/jmassardo), [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), or [Bluesky](https://bsky.app/profile/jmassardo.bsky.social).*
