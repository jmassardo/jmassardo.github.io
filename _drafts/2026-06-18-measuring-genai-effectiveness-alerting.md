---
layout: post
title:  "Measuring GenAI Effectiveness Part 3: Alerting on What Matters"
date: 2026-06-18 10:00:00 -0500
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
| Inactive seats | Money wasted | 30+ days inactive |
| Never-used seats | Money wasted | Seat assigned, zero activity |
| Acceptance rate drop | Declining value | 10pp week-over-week |
| Low active user rate | Poor adoption | Below 50% of seats |

Let's be real about the money: Copilot Business costs $19/seat/month. If you have 200 seats and 40 are unused, that's **$760/month** ($9,120/year) you're lighting on fire. That alone justifies building this system.

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

The alert generator runs as part of the site generation step. It reads the merged historical data and evaluates each condition:

```python
# scripts/generate_site.py

def generate_alerts(copilot_history, pr_history, issue_history) -> list[dict]:
    alerts = []
    now = datetime.now(timezone.utc).isoformat()

    # --- Copilot: Unused seats ---
    seats_history = copilot_history.get("seats_history", [])
    if seats_history:
        latest = seats_history[-1]
        inactive = latest.get("inactive", 0)
        never_used = latest.get("never_used", 0)
        total = latest.get("total", 0)
        waste_count = inactive + never_used

        if waste_count > 0:
            alerts.append({
                "severity": "warning" if waste_count < 10 else "critical",
                "category": "copilot",
                "title": "Unused Copilot Seats Detected",
                "detail": (
                    f"{waste_count} of {total} seats are unused "
                    f"({inactive} inactive 30+ days, {never_used} never used). "
                    f"Estimated monthly waste: ${waste_count * 19}/mo."
                ),
                "timestamp": now,
            })
```

Each alert gets a severity (`critical`, `warning`, or `info`), a category, and a human-readable detail string that includes the actual numbers. Nobody wants to see "alert triggered" - they want to see "38 of 200 seats are unused, costing $722/month."

### Acceptance Rate Trend Detection

This one is interesting because we're not just checking a single value. We're comparing rolling averages:

```python
    # Compare last 7 days to previous 7 days
    daily = copilot_history.get("daily", {})
    sorted_days = sorted(daily.keys())

    if len(sorted_days) >= 14:
        recent_7 = sorted_days[-7:]
        prev_7 = sorted_days[-14:-7]

        recent_rates = [
            daily[d]["acceptance_rate"]
            for d in recent_7
            if daily[d].get("acceptance_rate", 0) > 0
        ]
        prev_rates = [
            daily[d]["acceptance_rate"]
            for d in prev_7
            if daily[d].get("acceptance_rate", 0) > 0
        ]

        if recent_rates and prev_rates:
            recent_avg = sum(recent_rates) / len(recent_rates)
            prev_avg = sum(prev_rates) / len(prev_rates)
            drop = prev_avg - recent_avg

            if drop >= ALERTS["acceptance_rate_drop"]:
                alerts.append({
                    "severity": "warning",
                    "category": "copilot",
                    "title": "Copilot Acceptance Rate Declining",
                    "detail": (
                        f"Acceptance rate dropped {drop:.1f} percentage points "
                        f"week-over-week (from {prev_avg:.1f}% to {recent_avg:.1f}%)."
                    ),
                    "timestamp": now,
                })
```

Why 7-day averages instead of day-to-day? Because daily acceptance rates are noisy. Weekends, holidays, and meeting-heavy days all cause dips. Comparing weekly averages smooths out the noise and catches real trends.

### PR and Issue Alerts

```python
    # PR lifespan
    pr_snapshots = pr_history.get("snapshots", {})
    if pr_snapshots:
        latest = list(pr_snapshots.values())[-1]
        median_lifespan = latest.get("median_lifespan_hours")

        if median_lifespan and median_lifespan > ALERTS["pr_lifespan_hours"]:
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
        latest = list(issue_snapshots.values())[-1]
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

## Configuring Thresholds

Every threshold is driven by environment variables so you can tune them without touching code:

```yaml
# In your GitHub Actions workflow or .env file
ALERT_SEAT_INACTIVE_DAYS: 30
ALERT_ACCEPTANCE_RATE_DROP: 10.0
ALERT_PR_LIFESPAN_HOURS: 48
ALERT_TIME_TO_FIRST_REVIEW_HOURS: 24
ALERT_ISSUE_BACKLOG_GROWING_WEEKS: 3
ALERT_MIN_ACTIVE_USER_PCT: 50.0
ALERT_NEW_SEAT_INACTIVE_DAYS: 14
```

**Start with the defaults.** Seriously. Resist the urge to customize everything on day one. Run with defaults for 2-3 weeks, see what fires, and then adjust. If `ALERT_PR_LIFESPAN_HOURS: 48` triggers constantly because your team's normal is 72 hours, bump it up. If `ALERT_ACCEPTANCE_RATE_DROP: 10.0` never fires, lower it. The right thresholds are the ones that match **your team's** normal cadence.

## Dashboard Alert Rendering

Alerts show up as a banner at the top of the dashboard, sorted by severity:

```javascript
// site/js/dashboard.js

function renderAlerts(alerts) {
    if (!alerts || alerts.length === 0) return;

    const section = document.getElementById('alertsSection');
    section.classList.remove('hidden');

    const list = document.getElementById('alertsList');
    const order = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => (order[a.severity] || 3) - (order[b.severity] || 3));

    for (const alert of alerts) {
        const item = document.createElement('div');
        item.className = `alert-item ${alert.severity}`;
        item.innerHTML = `
            <div class="alert-category">${alert.category}</div>
            <div class="alert-title">${alert.title}</div>
            <div class="alert-detail">${alert.detail}</div>
        `;
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
  if: always()
  env:
    SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK_URL }}
  run: |
    ALERTS=$(cat site/data/alerts.json)
    COUNT=$(echo "$ALERTS" | python -c "import sys,json; print(len(json.load(sys.stdin)))")
    if [ "$COUNT" -gt "0" ]; then
      CRITICAL=$(echo "$ALERTS" | python -c "import sys,json; print(len([a for a in json.load(sys.stdin) if a['severity']=='critical']))")
      WARNING=$(echo "$ALERTS" | python -c "import sys,json; print(len([a for a in json.load(sys.stdin) if a['severity']=='warning']))")
      curl -X POST "$SLACK_WEBHOOK" \
        -H 'Content-type: application/json' \
        -d "{\"text\": \"📊 Copilot Metrics Dashboard: ${COUNT} alerts (${CRITICAL} critical, ${WARNING} warning). <https://jmassardo.github.io/copilot-metrics-dashboard/|View Dashboard>\"}"
    fi
```

Since the alerts are saved as a standalone `alerts.json` file, you can integrate with any notification system. Parse the JSON, filter by severity, and send wherever you need.

## The Alert Playbook

Alerts are only useful if you know what to do when they fire. Here's a quick reference:

| Alert | First Step |
|-------|-----------|
| **Unused Copilot Seats** | Export the inactive user list from the billing API. Reach out to managers. Reclaim seats from anyone who's left the team or doesn't need it. |
| **Acceptance Rate Declining** | Check the language and editor breakdowns. Did a model update roll out? Did the team start working in a language Copilot handles poorly? |
| **Low Active User Rate** | This is an adoption problem. Check if there are onboarding gaps. Are new hires getting Copilot training? Is there a team that hasn't started using it? |
| **PR Lifespan Too High** | Look at the P90 vs median spread. If P90 is much worse, you have a few bad PRs dragging things out. If median itself is high, it's a systemic review bottleneck. |
| **Slow Time to First Review** | Do you have enough reviewers? Are reviews concentrated on a few people? Consider implementing a review rotation or auto-assignment. |
| **Growing Issue Backlog** | Triage session time. Are issues well-scoped? Is the team closing outdated issues? Sometimes the fix is better issue hygiene, not more velocity. |
| **Stale Issues** | Schedule a quarterly stale issue sweep. If nobody's touched it in 30 days, it either needs prioritization or closing. |

## What's Next

We've got collection, visualization, and alerting. But everything we've built so far assumes a single org with a manageable number of repos. What happens when you need to do this at enterprise scale - 100 orgs, 100,000 repos, rate limits that laugh at your pagination loops?

In **[Part 4: Scaling for the Enterprise](/blog/2026/03/10/measuring-genai-effectiveness-scaling/)**, we'll redesign the architecture from pull-based polling to event-driven streaming.

Full source code: [**jmassardo/copilot-metrics-dashboard**](https://github.com/jmassardo/copilot-metrics-dashboard)

## Closing

*Building an alerting system for your dev metrics? I'd love to hear what thresholds work for your team. Find me on [GitHub](https://github.com/jmassardo), [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), or [Bluesky](https://bsky.app/profile/jmassardo.bsky.social).*
