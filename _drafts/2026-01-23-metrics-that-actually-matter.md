---
layout: post
title: "Metrics That Actually Matter"
date: 2026-01-23 10:00:00 -0500
category: Blog
tags: [engineering, metrics, observability, devops, leadership, dora, space]
excerpt: "After tearing down bad metrics, it's time to build something better. A practical framework for measurements that reflect flow, resilience, learning, and team health."
---

In [Part 1 of this series]({% post_url 2026-01-19-youre-measuring-it-wrong %}), I argued that most engineering metrics are being gamed or misused. In [Part 2]({% post_url 2026-01-21-the-lies-your-metrics-tell %}), we did an autopsy on the usual suspects: story points, lines of code, deployment frequency, and friends.

Now comes the hard part: if those metrics are flawed, what should we measure instead?

Here's the honest answer: there's no perfect set of metrics. But there are better and worse ones. And more importantly, there are better and worse ways to use them.

This post is about both.

## What Makes a Metric Useful?

Before we get to specific metrics, let's establish criteria. A useful metric should:

**Reflect outcomes, not just activity.** Deployments are activity. Customer impact is an outcome. We want metrics closer to the outcome side.

**Be hard to game.** Any metric that can be gamed will be gamed. Good metrics make gaming difficult or at least obvious.

**Drive conversation, not false certainty.** The best metrics raise questions. "Why did this change?" "What's behind this trend?" They're starting points, not final answers.

**Be actionable.** If a metric goes bad and you can't do anything about it, it's not useful. Useful metrics point toward improvement.

**Balance leading and lagging indicators.** Lagging indicators tell you what happened. Leading indicators warn you what might happen. You need both.

## Metrics That Reflect Flow

Flow is about how smoothly work moves through your system. Not how fast, necessarily. How smoothly.

### Lead Time (Full Picture)

How long from "we decided to do this" to "it's in production and working"?

This captures the full flow: requirements, development, review, testing, deployment, validation. Long lead time means friction somewhere in the system. Breaking it down by stage helps identify where.

Note the emphasis on full picture. Cycle time (just the development portion) is easier to measure but hides delays in the surrounding process. A team with fast cycle time and slow lead time has good engineering but bad process.

### Work in Progress (WIP)

How many things are in flight at once?

High WIP usually means low throughput. It means context switching, partial completions, and work blocking other work. Little's Law tells us that lead time equals WIP divided by throughput. Want shorter lead times? Reduce WIP.

WIP limits are a core principle of flow-based systems like Kanban. If your WIP is consistently high and rising, you're probably going slower than you could be.

### Queue Depths and Wait Times

How long do things wait in various queues? How long for code review? How long in the deploy queue? How long waiting for a dependency?

Queues are where flow goes to die. Work sitting in a queue isn't delivering value. Tracking queue depths helps you find bottlenecks.

This is one of the most actionable metrics because queues are usually fixable. Long code review queue? Maybe PRs are too big. Maybe reviewers need protected time. Maybe reviews need to be redistributed.

## Metrics That Reflect Resilience

Resilience is about how well your system handles stress and recovers from problems.

### Change Failure Rate (Defined Carefully)

What percentage of deployments cause problems? Rollbacks, hotfixes, incidents directly attributed to a release.

This is one of the DORA metrics, and it's valuable because it connects velocity to quality. High deployment frequency with high change failure rate isn't good. It's chaos.

The key is defining "failure" carefully and consistently. Does a config change that causes a brief spike count? Does a bug found in canary before full rollout count? Get alignment on definitions before tracking.

### Mean Time to Detection (MTTD)

How long between "something went wrong" and "we know something went wrong"?

This gap is where damage accumulates. A problem that's detected in 2 minutes causes less damage than one that runs unnoticed for 2 hours.

MTTD reflects monitoring and alerting quality. If it's high, that's a signal to invest in observability.

### Mean Time to Recovery (MTTR, Properly)

How long from "we know something's wrong" to "it's actually fixed"?

Note the emphasis on "actually fixed." A quick band-aid that leads to a repeat incident isn't real recovery. Track whether fixes stick.

Breaking MTTR into components helps: time to engage (how fast people respond), time to mitigate (how fast bleeding stops), time to full resolution (how fast normal service resumes). Each component points to different improvement areas.

### Incident Recurrence Rate

How many of your incidents are repeat variations of previous incidents?

If you keep having the same problem in different disguises, you're not learning from incidents. You're just surviving them.

This metric is powerful because it's hard to game. Either the same problems keep happening or they don't. And if they keep happening, that's a signal that your postmortem process isn't working.

## Metrics That Reflect Learning

Learning is about how well your organization improves over time.

### Time to First Contribution

How long until a new engineer makes their first meaningful contribution?

This reflects onboarding effectiveness, documentation quality, codebase clarity, and team supportiveness. If it takes months for new people to become productive, something in the system needs attention.

This is also a leading indicator of team health. Teams that can onboard quickly are usually teams with good practices overall.

### Postmortem Action Completion Rate

When you do postmortems, do the action items actually get done?

A postmortem that generates action items that sit in a backlog forever isn't learning. It's ritual. You had the meeting. You wrote the document. You identified improvements. Then nothing changed.

Track whether improvement actions actually happen. If they don't, either the actions weren't important (in which case, why identify them?) or something in your system prevents improvement from happening.

### Alert-to-Incident Ratio

How many alerts fire for each actual incident?

Too many alerts per incident means noise. People start ignoring alerts because they're usually false positives. This is alert fatigue, and it leads to real incidents being missed.

Too few alerts per incident means your monitoring isn't catching problems. Issues run undetected until customers complain.

The right ratio depends on your context, but tracking the trend helps you calibrate your alerting.

## Metrics That Reflect Team Health

Systems are made of people. Healthy teams build healthy systems. Unhealthy teams build systems that reflect their dysfunction.

### Distribution of Work

How is work distributed across the team?

If the same three people are in every incident, that's a bus factor problem and a burnout risk. If one person authors 60% of the code, that's a knowledge concentration risk.

Look at PR authorship, oncall load, incident participation, meeting attendance. Distribution should be roughly even over time. Concentrated workload is a leading indicator of problems.

### PTO Actually Taken

Are people using their vacation time? If not, why not?

This is a leading indicator of burnout and a reflection of workload and culture. Teams where people don't take breaks are teams heading for trouble.

If people aren't taking PTO, ask why. Is the workload too high? Is coverage too thin? Is the culture discouraging time off? These are problems worth solving, and tracking PTO makes them visible.

### Ratio of Planned to Unplanned Work

How much of your team's capacity goes to planned work versus firefighting and interrupts?

Some unplanned work is inevitable. But if most of your time is reactive, you're not in control of your system. The system is controlling you.

High unplanned work means priorities keep shifting, projects keep getting derailed, and people can't focus. It's exhausting and demoralizing. Tracking this ratio helps make the problem visible and creates pressure to address it.

## Using Metrics Wisely

Here's the most important part: metrics should inform judgment, not replace it.

**Use metrics to identify trends.** Is this getting better or worse over time? What changed?

**Use metrics to spot anomalies.** This is different from normal. Why? What happened?

**Use metrics to start conversations.** What's behind this number? What does the team think is going on?

**Use metrics to track improvements.** We made a change. Did it help? How do we know?

**Don't use metrics to judge individuals.** Metrics describe system behavior, not individual worth. Individual-level metrics almost always create perverse incentives.

**Don't use metrics as targets in isolation.** "Hit this number" without context creates gaming. Targets need to be part of a broader conversation about goals and tradeoffs.

**Don't use metrics to prove you're doing well.** If you only look at metrics when they're good, you're not using them. You're just looking for validation.

## Building Your Metrics Practice

So how do you put this into practice? Here's a framework:

### Start with Questions, Not Dashboards

Don't start by asking "what should we measure?" Start by asking "what do we need to understand?"

- Are we delivering value effectively?
- Is our system reliable?
- Is our team sustainable?
- Are we improving over time?

Then choose metrics that help answer those questions. This is the opposite of the common approach, which starts with available data and builds dashboards.

### Fewer Metrics, More Context

A dashboard with 50 metrics is useless. Nobody knows what to focus on, and the signal gets lost in noise.

Choose a small number of metrics (5-10) that matter most for your current situation. Provide context for each: what does normal look like? What would trigger concern? What would we do about it?

### Review Regularly, Adjust as Needed

Metrics should evolve. The right metrics for a team in crisis mode are different from the right metrics for a team in steady state.

Review your metrics regularly. Are they still answering the questions you care about? Are they being gamed? Are there blind spots? Adjust as your situation changes.

### Combine Quantitative and Qualitative

Numbers don't tell the whole story. The best insights often come from combining quantitative metrics with qualitative signals.

Regular retrospectives, skip-level conversations, anonymous surveys, and informal check-ins provide context that dashboards can't. Use both.

## TL;DR

- Useful metrics reflect outcomes, are hard to game, drive conversation, and are actionable
- **Flow metrics:** full lead time, WIP, queue depths and wait times
- **Resilience metrics:** change failure rate (defined carefully), MTTD, MTTR (tracked for real recovery), incident recurrence
- **Learning metrics:** time to first contribution, postmortem action completion, alert-to-incident ratio
- **Team health metrics:** distribution of work, PTO taken, planned vs. unplanned work ratio
- Use metrics to inform judgment and start conversations, not to replace thinking or judge individuals
- Start with questions you need answered, choose fewer metrics with more context, and combine quantitative data with qualitative signals

---

*This is Part 3 of a three-part series on engineering metrics. Previously: [You're Measuring It Wrong]({% post_url 2026-01-19-youre-measuring-it-wrong %}) and [The Lies Your Metrics Tell]({% post_url 2026-01-21-the-lies-your-metrics-tell %}).*

*Building a metrics practice at your organization? Have examples of what works (or doesn't)? I'm always interested in hearing how this plays out in the real world. Reach out on [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), [Bluesky](https://bsky.app/profile/jmassardo.bsky.social), or [GitHub](https://github.com/jmassardo). You can also reach me via [email](mailto:jenna@dxrf.com).*
