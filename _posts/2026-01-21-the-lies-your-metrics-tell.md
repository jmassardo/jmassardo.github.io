---
layout: post
title: "The Lies Your Metrics Tell"
date: 2026-01-21 08:00:00 -0500
category: Blog
tags: [engineering, metrics, leadership, devops, measurement, dora, space]
excerpt: "A detailed autopsy of common engineering metrics: what they claim to measure, what they actually measure, and how to use them without being misled."
---

Last week I wrote a [spicy hot take on measuring developer productivity]({% post_url 2026-01-19-youre-measuring-it-wrong %}). The TL;DR: most metrics are being gamed, misused, or both. Goodhart's Law is undefeated.

But "your metrics are bad" isn't particularly actionable. So let's get specific. This post is an autopsy of the usual suspects: what each metric claims to measure, what it actually measures, and how to use it without being misled.

## The Anatomy of a Misleading Metric

Before we dive in, let's understand why metrics lie.

Metrics don't lie on purpose. They're just numbers. The lies come from the gap between what we think a metric means and what it actually captures.

Every metric is a proxy. We can't directly measure "productivity" or "quality" or "team health," so we measure things we hope correlate with them. The problems start when we forget they're proxies and treat them as the real thing.

## Story Points and Velocity

**What it claims to measure:** Team productivity and capacity for planning.

**What it actually measures:** How many arbitrary units a team assigned to work they completed.

**The lies it tells:**

Story points were designed as a planning tool, a way for teams to estimate relative complexity so they could figure out how much work to commit to in a sprint. They were never meant to be a productivity metric.

But somewhere along the line, someone looked at velocity trends and thought "this number going up must mean we're getting better." And thus a planning tool became a performance metric, and everything went sideways.

Here's what happens when velocity becomes a target:

- Teams inflate point estimates so velocity looks better
- Work gets sized to hit a target rather than reflect actual effort
- Simple tasks get extra points "just in case"
- The numbers become meaningless for their original purpose: planning

**What to do instead:**

If you need velocity for planning, use it only internally within the team. Never compare velocities across teams. Never tie velocity to performance reviews. The moment it becomes a performance metric, it stops being useful for planning.

And if you're trying to measure productivity, velocity isn't it. Productivity shows up in outcomes: features delivered, problems solved, customers satisfied. None of those map cleanly to story points.

## Lines of Code

**What it claims to measure:** Developer output.

**What it actually measures:** How many lines of text were added to the codebase.

**The lies it tells:**

I thought we'd killed this metric years ago, but it keeps showing up in "developer productivity platforms" wearing a disguise. Sometimes it's called "code contribution" or "commit volume" or "development activity."

The fundamental problem is that code is not inherently valuable. Sometimes the most productive thing you can do is delete code. Or write 10 clean lines instead of 100 messy ones. Or prevent code from being written by solving the problem a different way.

More code often means more maintenance burden, more potential bugs, more complexity to manage. Measuring lines of code as productivity is like measuring a writer's productivity by word count. It incentivizes verbosity, not value.

**What to do instead:**

Don't measure code volume at all. If you need to understand development activity, look at the outcomes: what problems got solved? What capabilities got added? What technical debt got paid down?

If you're using code volume as a proxy for "are people working," you have a trust problem that metrics won't solve.

## Deployment Frequency

**What it claims to measure:** DevOps maturity and delivery capability.

**What it actually measures:** How many times the deployment pipeline ran.

**The lies it tells:**

Deployment frequency is one of the DORA metrics, and the research behind it is solid: elite teams do deploy more frequently, and frequent deployment correlates with better outcomes.

But correlation isn't causation, and optimizing for the metric isn't the same as achieving what it measures.

I've seen teams hit "daily deployment" targets by:

- Splitting single deployments into multiple smaller ones
- Counting config changes, documentation updates, and README tweaks as deployments
- Removing quality gates that slow down deployment
- Deploying to production and immediately deploying fixes

The dashboard looks great. The actual delivery capability? Unchanged or worse.

**What to do instead:**

Deployment frequency is useful as an indicator, not a target. If it's low, ask why. Is deployment painful? Risky? Manual? Those are problems worth solving.

But track it alongside change failure rate. Frequent deployment with high failure rate isn't maturity. It's just chaos with better automation.

## Mean Time to Resolution (MTTR)

**What it claims to measure:** How quickly you recover from incidents.

**What it actually measures:** How quickly incidents get marked as resolved.

**The lies it tells:**

Low MTTR sounds great. Problems get fixed fast. But optimizing for the number can actually make incident response worse.

Here's what "fast resolution" can look like:

- Apply a quick workaround without understanding root cause
- Mark incident resolved while investigation continues
- Split long incidents into multiple shorter ones
- Close and reopen as a "new" incident when the fix doesn't hold

The result: great MTTR numbers, recurring incidents that look "new" each time, and no actual improvement in reliability.

**What to do instead:**

Track MTTR, but also track incident recurrence. If the same problem keeps coming back, your MTTR is misleading you.

Better yet, break MTTR into its components: time to detection (MTTD), time to engagement, time to mitigation, time to full resolution. Each component tells you something different about your incident response capability.

## Utilization

**What it claims to measure:** Efficiency and resource optimization.

**What it actually measures:** What percentage of time people are assigned to tasks.

**The lies it tells:**

High utilization sounds efficient. Everyone's busy. No wasted capacity.

Here's the problem: complex systems need slack.

At 100% utilization, there's no capacity for:

- Unexpected work (which always shows up)
- Helping colleagues
- Learning and skill development
- Thinking time
- Innovation

High utilization also means high queue times. When everyone is fully booked, any new work has to wait. Lead times increase. Responsiveness decreases.

And the human cost is real. People running at 100% utilization burn out. They make mistakes. They cut corners. They leave.

**What to do instead:**

Aim for sustainable utilization, not maximum utilization. The exact number depends on your context, but most teams do better with 70-80% planned utilization, leaving room for the unplanned.

If leadership is pushing for higher utilization, that's a conversation about capacity planning and expectations, not a metric problem.

## Code Review Metrics

**What they claim to measure:** Code review effectiveness and PR cycle time.

**What they actually measure:** How fast PRs move through the review queue.

**The lies they tell:**

Fast PR reviews sound good. No one wants code sitting in review forever. But optimizing for speed can undermine the actual purpose of code review.

What "fast reviews" can look like:

- Rubber-stamp approvals to clear the queue
- Skipping thorough review for large PRs (too much work)
- Approving with "LGTM" without actually looking
- Avoiding substantive feedback to keep things moving

The metrics look great: low review time, fast merge rates. The code quality? Not captured by the dashboard.

**What to do instead:**

Track review time as an indicator of process health, not a target to minimize. Long review times might indicate:

- PRs are too large
- Reviewers are overloaded
- Reviews need to be prioritized differently

But also track review quality through other means: postmortem analysis of escaped bugs, developer surveys about review usefulness, spot-checking of review comments.

## What Signals Actually Help

So if all these metrics are problematic, what should you look at?

Here are some signals that are harder to game and closer to actual outcomes:

### Customer-Facing Metrics

- Error rates experienced by users
- Time to value for new features
- Customer-reported issues vs. internally caught issues

These connect engineering work to actual impact. They're harder to game because they're further from the activity being measured.

### Resilience Indicators

- Change failure rate (but define "failure" carefully)
- Incident recurrence rate
- Time to detect vs. time to resolve
- Graceful degradation under stress

These tell you about system health, not just activity volume.

### Flow Indicators

- Work in progress (WIP) limits and violations
- Queue depths and wait times
- Full lead time (idea to production), not just cycle time

These help you find bottlenecks and friction in your delivery process.

### Team Health Signals

- Distribution of work across the team (bus factor)
- PTO actually taken
- Ratio of planned to unplanned work
- Survey feedback (if genuinely anonymous and acted upon)

These are leading indicators of sustainability and burnout risk.

## TL;DR

- Story points measure planning estimates, not productivity. Never use them as a performance metric.
- Lines of code measure verbosity, not value. More code is often worse, not better.
- Deployment frequency is an indicator, not a target. Track it with change failure rate for context.
- MTTR can be gamed by closing incidents fast. Track recurrence to see if fixes actually stick.
- High utilization isn't efficiency. It's a lack of slack that reduces resilience and increases burnout.
- Code review speed can undermine review quality. Don't optimize for fast approvals.
- Better signals connect to customer outcomes, system resilience, delivery flow, and team sustainability.

---

*This is Part 2 of a three-part series on engineering metrics. Previously: [You're Measuring It Wrong]({% post_url 2026-01-19-youre-measuring-it-wrong %}). Next: [Metrics That Actually Matter]({% post_url 2026-01-23-metrics-that-actually-matter %}) where we build a framework for choosing measurements that inform without misleading.*

*Got examples of metrics gone wrong (or right)? I'm always collecting war stories. Reach out on [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), [Bluesky](https://bsky.app/profile/jmassardo.bsky.social), or [GitHub](https://github.com/jmassardo).*
