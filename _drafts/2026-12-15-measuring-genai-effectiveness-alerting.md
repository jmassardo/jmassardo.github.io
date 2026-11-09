---
layout: post
title:  "Measuring GenAI Effectiveness Part 3: Alerting on What Matters"
date: 2026-12-15 10:00:00 -0600
category: Blog
tags: [ai, copilot, devops, github, metrics, developer-tools, best-practices]
excerpt: "Dashboards are great until nobody looks at them. Here's how to build automated alerts that surface declining metrics and wasted spend before they become problems."
---

Dashboards are great. You know what's not great? Expecting busy people to check a dashboard every day.

In **[Part 1](/blog/2026/03/10/measuring-genai-effectiveness-data-collection/)** we built data collection. In **[Part 2](/blog/2026/03/10/measuring-genai-effectiveness-dashboard/)** we built a dashboard. Now let's make sure the important stuff finds **you** instead of waiting for you to find it.

In this post, we'll build an alerting system that evaluates every metric against configurable thresholds and surfaces problems in two ways:

1. **On the dashboard** - A prominent alerts banner at the top of the page
2. **In the workflow logs** - Clear output for integration with Slack, email, or your notification system of choice

## What's Worth Alerting On?

Not everything deserves an alert. Alert fatigue is real, and if everything is "critical," nothing is. Let's be strategic about what we flag.

### Copilot Alerts (License Health)

| Alert | Why It Matters | Default Threshold |
|-------|---------------|-------------------|
| Inactive seats | License review candidates | 30+ days without recorded activity |
| No recorded activity | Onboarding or telemetry investigation | No recorded activity after a 14-day grace period |
| Acceptance rate drop | Completion adoption change | 10pp week-over-week |
| Low active user rate | Poor adoption | Below 50% of seats |

Estimate potential savings from **confirmed reclaimable seats multiplied by your contracted seat rate**. No recorded activity is not proof of wasted spend. Verify telemetry coverage, leave, onboarding, and the billing cancellation rules before reclaiming anything.

**November 3, 2026 update:** alert on normalized current Copilot usage reports, not the retired metrics API. These are daily management signals, not production incidents or a causal scorecard for AI effectiveness.

### PR Health Alerts (Development Velocity)

| Alert | Why It Matters | Default Threshold |
|-------|---------------|-------------------|
| PR lifespan too high | Code sitting in review too long | Median > 48 hours |
| Slow time to first review | Review bottleneck | Median > 24 hours |

PR health alerts tell you if the development process itself is degrading. This happens more than you'd think, especially when teams grow. New contributors don't know the review norms, reviewers get overloaded, and suddenly PRs are sitting for days.

### Issue Health Alerts (Operational Health)

| Alert | Why It Matters | Default Threshold |
|-------|---------------|-------------------|
| Growing backlog | More opened than closed for weeks | 3+ consecutive weeks |
| Stale issues | Work falling through the cracks | 10+ stale issues |

A growing issue backlog is a leading indicator of team health problems. Maybe scope is creeping. Maybe the team is understaffed. Maybe issues are being created but nobody's triaging them. Whatever the cause, you want to catch it early.

## The Alert Engine

The alert generator runs as part of site generation. **Check freshness before health**: suppress usage conclusions when collection fails or the report is stale beyond its two-full-UTC-day processing allowance. Raise a separate data-quality alert, never silently replace missing input with zero.

This excerpt shows the seat-review path. Its counts must use disjoint categories, exclude new seats inside the grace period, and come from a fresh billing snapshot:

```python
# scripts/generate_site.py
from datetime import datetime, timezone

def generate_alerts(copilot_history, pr_history, issue_history) -> list[dict]:
    alerts = []
    now = datetime.now(timezone.utc).isoformat()

    # --- Copilot: Unused seats ---
    seats_history = copilot_history.get("seats_history", [])
    if seats_history:
        latest = max(seats_history, key=lambda s: s["date"])
        if any(latest.get(k) is None for k in ("inactive", "never_used", "total")):
            return [{
                "severity": "warning", "category": "data",
                "title": "Seat summary incomplete",
                "detail": "Do not infer license health from missing counts.",
                "timestamp": now,
            }]
        inactive = latest["inactive"]
        never_used = latest["never_used"]
        total = latest["total"]
        waste_count = inactive + never_used

        if waste_count > 0:
            alerts.append({
                "severity": "warning" if waste_count < 10 else "critical",
                "category": "copilot",
                "title": "Copilot Seats Need Activity Review",
                "detail": (
                    f"{waste_count} of {total} seats need review "
                    f"({inactive} inactive 30+ days, {never_used} with no recorded activity). "
                    "Confirm telemetry coverage and actual license need before reclaiming."
                ),
                "timestamp": now,
            })
    return alerts
```

Each alert gets a severity (`critical`, `warning`, or `info`), a category, and the actual numbers. Use "no recorded activity" for the legacy `never_used` field. A count is evidence to investigate, not permission to cancel seats.

### Acceptance Rate Trend Detection

This one compares **two contiguous seven-day windows ending on the latest completed report day**, weighted by suggestion volume. Here is a self-contained helper for normalized daily summaries:

```python
from datetime import date, timedelta

def acceptance_drop(daily, report_end_day, threshold_pp=10, min_suggestions=100):
    end = date.fromisoformat(report_end_day)
    days = [(end - timedelta(days=n)).isoformat() for n in range(14)]
    if any(
        d not in daily or
        any(daily[d].get(k) is None
            for k in ("total_suggestions", "total_acceptances"))
        for d in days
    ):
        return {"status": "no_data", "reason": "Incomplete 14-day window"}

    def rate(window):
        suggestions = sum(daily[d]["total_suggestions"] for d in window)
        accepted = sum(daily[d]["total_acceptances"] for d in window)
        return 100 * accepted / suggestions if suggestions >= min_suggestions else None

    recent, previous = rate(days[:7]), rate(days[7:])
    if recent is None or previous is None:
        return {"status": "no_data", "reason": "Insufficient suggestion volume"}
    drop = previous - recent
    return {
        "status": "warning" if drop >= threshold_pp else "ok",
        "drop_pp": drop,
        "previous_pct": previous,
        "recent_pct": recent,
    }
```

Zero acceptances are valid data and must stay in the calculation. Missing days are not weekends with zero usage. Weekly windows reduce noise, but shifts in language, feature mix, or telemetry still need investigation.

### PR and Issue Alerts

```python
    # PR lifespan
    pr_snapshots = pr_history.get("snapshots", {})
    if pr_snapshots:
        latest = pr_snapshots[max(pr_snapshots)]
        median_lifespan = latest.get("median_lifespan_hours")

        if median_lifespan is not None and median_lifespan > ALERTS["pr_lifespan_hours"]:
            alerts.append({
                "severity": "warning",
                "category": "pr",
                "title": "PR Lifespan Exceeds Threshold",
                "detail": (
                    f"Median PR lifespan is {median_lifespan:.1f} hours "
                    f"(threshold: {ALERTS['pr_lifespan_hours']}h)."
                ),
                "timestamp": now,
            })

    # Issue backlog growing
    issue_snapshots = issue_history.get("snapshots", {})
    if issue_snapshots:
        latest = issue_snapshots[max(issue_snapshots)]
        growing_weeks = latest.get("backlog_growing_weeks", 0)

        if growing_weeks >= ALERTS["issue_backlog_growing_weeks"]:
            alerts.append({
                "severity": "critical" if growing_weeks >= 5 else "warning",
                "category": "issue",
                "title": "Issue Backlog Growing",
                "detail": (
                    f"Issue backlog has been growing for {growing_weeks} "
                    f"consecutive weeks."
                ),
                "timestamp": now,
            })
```

Notice the escalation on the backlog alert: 3 weeks is a warning, 5 weeks is critical. Backlogs can creep up slowly, and a 3-week warning gives you time to course correct before it becomes a crisis.

These are additional fragments inside the generator. Require fresh snapshots and sufficient PR samples, and calculate backlog growth from **complete calendar weeks**. A missing week cannot count as growth. Route these to a team review channel, not a pager.

## Configuring Thresholds

Every threshold is driven by environment variables so you can tune them without touching code:

```yaml
# Under the job's env: mapping in GitHub Actions
env:
  ALERT_SEAT_INACTIVE_DAYS: '30'
  ALERT_ACCEPTANCE_RATE_DROP: '10.0'
  ALERT_PR_LIFESPAN_HOURS: '48'
  ALERT_TIME_TO_FIRST_REVIEW_HOURS: '24'
  ALERT_ISSUE_BACKLOG_GROWING_WEEKS: '3'
  ALERT_MIN_ACTIVE_USER_PCT: '50.0'
  ALERT_NEW_SEAT_INACTIVE_DAYS: '14'
```

**Start with the defaults.** Seriously. Resist the urge to customize everything on day one. Run with defaults for 2-3 weeks, see what fires, and then adjust. If `ALERT_PR_LIFESPAN_HOURS: 48` triggers constantly because your team's normal is 72 hours, bump it up. If `ALERT_ACCEPTANCE_RATE_DROP: 10.0` never fires, lower it. The right thresholds are the ones that match **your team's** normal cadence.

## Dashboard Alert Rendering

Alerts show up as a banner at the top of the dashboard, sorted by severity:

```javascript
// site/js/dashboard.js

function renderAlerts(alerts) {
    const section = document.getElementById('alertsSection');
    const list = document.getElementById('alertsList');
    list.replaceChildren();
    section.classList.toggle('hidden', !alerts || alerts.length === 0);
    if (!alerts || alerts.length === 0) return;

    const order = { critical: 0, warning: 1, info: 2 };
    const sorted = [...alerts].sort((a, b) =>
        (order[a.severity] ?? 3) - (order[b.severity] ?? 3));

    for (const alert of sorted) {
        const item = document.createElement('div');
        const severity = Object.hasOwn(order, alert.severity) ? alert.severity : 'info';
        item.className = `alert-item ${severity}`;
        for (const field of ['category', 'title', 'detail']) {
            const text = document.createElement('div');
            text.className = `alert-${field}`;
            text.textContent = alert[field] ?? '';
            item.appendChild(text);
        }
        list.appendChild(item);
    }
}
```

Each alert gets a colored left border (red for critical, yellow for warning, blue for info) and a subtle background tint. If there are no alerts, the section stays hidden. You only see the banner when something needs attention.

## Extending: Slack / Email Notifications

The workflow logs every alert during the generation step:

```
Evaluating alerts...
  3 active alerts
  🔴 [copilot] Unused Copilot Seats Detected
  🟡 [pr] PR Lifespan Exceeds Threshold
  🔵 [issue] Stale Issues Accumulating
```

To get these into Slack, add a step after site generation:

```yaml
- name: Send Slack alerts
  if: success()
  env:
    SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK_URL }}
  run: |
    test -f site/data/alerts.json || { echo "Missing alerts output"; exit 1; }
    ALERTS=$(cat site/data/alerts.json)
    COUNT=$(echo "$ALERTS" | python -c "import sys,json; print(len(json.load(sys.stdin)))")
    if [ "$COUNT" -gt "0" ]; then
      CRITICAL=$(echo "$ALERTS" | python -c "import sys,json; print(len([a for a in json.load(sys.stdin) if a['severity']=='critical']))")
      WARNING=$(echo "$ALERTS" | python -c "import sys,json; print(len([a for a in json.load(sys.stdin) if a['severity']=='warning']))")
      curl --fail-with-body --max-time 30 -X POST "$SLACK_WEBHOOK" \
        -H 'Content-type: application/json' \
        -d "{\"text\": \"📊 Copilot Metrics Dashboard: ${COUNT} alerts (${CRITICAL} critical, ${WARNING} warning). <https://jmassardo.github.io/copilot-metrics-dashboard/|View Dashboard>\"}"
    fi
```

Since the alerts are saved as a standalone `alerts.json` file, you can integrate with any notification system. Follow [Slack's incoming webhook documentation](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/) and replace the example dashboard URL.

Send a separate workflow-failure notification when collection fails. In production, deduplicate by alert key and report day, notify on state changes, and define a recovery message. A nightly copy of the same warning is how useful alerts become wallpaper.

## The Alert Playbook

Alerts are only useful if you know what to do when they fire. Here's a quick reference:

| Alert | First Step |
|-------|-----------|
| **Seat Activity Review** | Review the restricted billing export, verify telemetry and leave, then confirm need with the owner before reclaiming a seat. |
| **Acceptance Rate Declining** | Check the language and editor breakdowns. Did a model update roll out? Did the team start working in a language Copilot handles poorly? |
| **Low Active User Rate** | Verify coverage and the activity window, then investigate onboarding. Don't divide overlapping organization-wide usage by seats assigned only in a shell organization. |
| **PR Lifespan Too High** | Look at the P90 vs median spread. If P90 is much worse, you have a few bad PRs dragging things out. If median itself is high, it's a systemic review bottleneck. |
| **Slow Time to First Review** | Do you have enough reviewers? Are reviews concentrated on a few people? Consider implementing a review rotation or auto-assignment. |
| **Growing Issue Backlog** | Triage session time. Are issues well-scoped? Is the team closing outdated issues? Sometimes the fix is better issue hygiene, not more velocity. |
| **Stale Issues** | Schedule a quarterly stale issue sweep. If nobody's touched it in 30 days, it either needs prioritization or closing. |

## What's Next

We've got collection, visualization, and alerting. But everything we've built so far assumes a single org with a manageable number of repos. What happens when you need to do this at enterprise scale - 100 orgs, 100,000 repos, rate limits that laugh at your pagination loops?

In **[Part 4: Scaling for the Enterprise](/blog/2026/03/10/measuring-genai-effectiveness-scaling/)**, we'll redesign the architecture from pull-based polling to event-driven streaming.

Full source code: [**jmassardo/copilot-metrics-dashboard**](https://github.com/jmassardo/copilot-metrics-dashboard)

## Summary and Key Takeaways

- Alert on missing or stale collection separately from usage changes.
- Use complete windows, weighted rates, grace periods, and meaningful sample sizes.
- Define an owner and playbook. Adoption alerts are investigation prompts, not proof of AI effectiveness.

## Closing

*Building an alerting system for your dev metrics? I'd love to hear what thresholds work for your team. Find me on [GitHub](https://github.com/jmassardo), [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), or [Bluesky](https://bsky.app/profile/jmassardo.bsky.social).*
