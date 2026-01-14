---
layout: post
title: "Metrics That Actually Matter in Complex Engineering Systems"
date: 2026-02-04 10:00:00 -0500
category: Blog
tags: [engineering, metrics, observability, devops, leadership]
excerpt: "Not all metrics are harmful. Some are just misunderstood. This post focuses on measurements that reflect flow, resilience, and learning rather than output volume."
---

A few weeks ago, I wrote about [why most engineering metrics are lying to you]({% post_url 2026-01-17-engineering-metrics-lying-to-you %}). The TL;DR: common metrics like velocity, lines of code, and utilization measure activity, not outcomes. They can be gamed. They often mislead.

But that post left a question hanging: if those metrics are bad, what metrics are good?

This post is the answer. Or at least, an attempt at one. Because here's the honest truth: there's no perfect set of metrics. But there are better and worse ones, and understanding what makes a metric useful is more important than any specific dashboard.

## What Makes a Metric Useful?

Before we get to specific metrics, let's establish what we're looking for.

A useful metric should:

**Reflect outcomes, not just activity.** Deployments are activity. Customer impact is an outcome. We want metrics closer to the outcome side.

**Be hard to game.** Any metric that can be gamed will be gamed. Good metrics make gaming difficult or at least obvious.

**Drive conversation, not false certainty.** The best metrics raise questions. "Why did this change?" "What's behind this trend?" They're starting points, not final answers.

**Be actionable.** If a metric goes bad and you can't do anything about it, it's not useful. Useful metrics point toward improvement.

**Balance leading and lagging indicators.** Lagging indicators tell you what happened. Leading indicators warn you what might happen. You need both.

## Metrics That Reflect Flow

Flow is about how smoothly work moves through your system. Not how fast, necessarily. How smoothly.

### Lead Time

How long from "we decided to do this" to "it's in production and working"? This captures the full flow: requirements, development, review, testing, deployment, validation.

Long lead time means friction in the system. Breaking it down by stage helps identify where the friction lives.

Note: this is different from cycle time, which is just the development portion. Lead time captures the full picture.

### Deployment Frequency (With Context)

How often do you deploy? This matters, but only with context.

Deploying once a month because you have thorough testing and stable releases is different from deploying once a month because deployment is terrifying and error-prone.

Deploying ten times a day because you have great CI/CD is different from deploying ten times a day because each deployment breaks something and requires a fix.

The number alone doesn't tell you much. The number plus the context tells you a lot.

### Work in Progress (WIP)

How many things are in flight at once? High WIP usually means low throughput. It means context switching, partial completions, and things blocking other things.

WIP limits are a core principle of flow-based systems like Kanban. If your WIP is consistently high, you're probably going slower than you could be.

### Queue Depths and Wait Times

How long do things wait in various queues? How long for code review? How long in the deploy queue? How long waiting for a dependency?

Queues are where flow goes to die. Tracking them helps you find the bottlenecks.

## Metrics That Reflect Resilience

Resilience is about how well your system handles stress and recovers from problems.

### Change Failure Rate

What percentage of deployments cause problems? Rollbacks, hotfixes, incidents directly attributed to a release.

This is one of the DORA metrics, and it's a good one because it connects velocity to quality. High deployment frequency with high change failure rate isn't good. It's chaos.

### Mean Time to Detection (MTTD)

How long between "something went wrong" and "we know something went wrong"?

This gap is where damage accumulates. If your monitoring and alerting are good, MTTD is short. If they're not, problems fester.

### Mean Time to Recovery (MTTR)

How long from "we know something's wrong" to "it's fixed"?

Note the emphasis on recovery, not just resolution. A quick band-aid that leads to a repeat incident isn't good recovery. Track whether the fix stuck.

### Incident Recurrence Rate

How many of your incidents are repeat variations of previous incidents?

If you keep having the same problem in different disguises, you're not learning from incidents. You're just surviving them.

### Graceful Degradation

This one's qualitative, but important: when things go wrong, how gracefully does the system degrade?

Does it fail completely, or does it maintain partial functionality? Does it shed load intelligently, or does it fall over? Does it fail in ways that are observable and recoverable?

## Metrics That Reflect Learning

Learning is about how well your organization improves over time.

### Time to First Contribution

How long until a new engineer makes their first meaningful contribution?

This reflects onboarding effectiveness, documentation quality, codebase clarity, and team supportiveness. If it takes months for new people to become productive, something is wrong.

### Postmortem Action Completion Rate

When you do postmortems, do the action items actually get done?

A postmortem that generates action items that sit in a backlog forever isn't learning. It's ritual. Track whether the improvements actually happen.

### Alert-to-Incident Ratio

How many alerts fire for each actual incident?

Too many alerts per incident means noise. People start ignoring alerts because they're usually false positives. Too few alerts means your monitoring isn't catching real problems.

### Ratio of Planned to Unplanned Work

How much of your team's capacity goes to planned work versus firefighting and interrupts?

Some unplanned work is inevitable. But if most of your time is reactive, you're not in control of your system. The system is controlling you.

## Metrics That Reflect Team Health

Systems are made of people. Healthy teams build healthy systems.

### Distribution of Load

How is work distributed across the team? If the same three people are in every incident, that's a bus factor problem and a burnout risk.

Look at PR authorship, oncall load, incident participation. Distribution should be roughly even over time.

### PTO Actually Taken

Are people using their vacation? If not, why not?

This is a leading indicator of burnout and a reflection of workload and culture.

### Survey Results (If Done Well)

Regular pulse surveys can surface problems before they become visible in other metrics.

The key is "done well." Questions need to be meaningful. Results need to be acted on. If surveys are ignored, people stop responding honestly.

## Using Metrics Wisely

Here's the most important part: metrics should inform judgment, not replace it.

A dashboard can tell you that something changed. It can't tell you why, or what to do about it. That requires human judgment, context, and conversation.

Use metrics to:
- **Identify trends.** Is this getting better or worse over time?
- **Spot anomalies.** This is different from normal. Why?
- **Start conversations.** What's behind this number?
- **Track improvements.** Did the change we made actually help?

Don't use metrics to:
- **Judge individuals.** Metrics describe system behavior, not individual worth.
- **Set targets in isolation.** "Hit this number" without context creates gaming.
- **Prove you're doing well.** If you only look at metrics when they're good, you're not using them.

## TL;DR

- Useful metrics reflect outcomes, are hard to game, drive conversation, and balance leading with lagging indicators
- Flow metrics: lead time, deployment frequency (with context), WIP, queue depths
- Resilience metrics: change failure rate, MTTD, MTTR, incident recurrence rate
- Learning metrics: time to first contribution, postmortem action completion, alert-to-incident ratio, planned vs. unplanned work
- Team health metrics: load distribution, PTO taken, survey results
- Metrics should inform judgment and start conversations, not replace thinking

---

*Found metrics that actually work for your organization? Have dashboards you're proud of (or ashamed of)? I'm collecting examples. Reach out on [GitHub](https://github.com/jmassardo) or [LinkedIn](https://www.linkedin.com/in/jenna-massardo/).*
