---
layout: post
title: "Why Most Engineering Metrics Are Lying to You"
date: 2026-01-17 10:00:00 -0500
category: Blog
tags: [engineering, metrics, leadership, devops, measurement]
excerpt: "Engineering leaders love dashboards. But many metrics reward the wrong behaviors and describe activity rather than outcomes. It's time to rethink what we measure and why."
---

Quick quiz: What's your team's velocity? How many story points did you complete last sprint? What's your deployment frequency?

If you answered those questions confidently, congratulations. You have metrics.

Now, harder question: Do any of those numbers actually tell you if your team is healthy, your system is reliable, or your customers are happy?

Yeah. That's the problem.

## The Dashboard Industrial Complex

Somewhere along the way, engineering leadership became obsessed with measurement. And I get it. You can't improve what you can't measure. Data-driven decisions. What gets measured gets managed. All the greatest hits.

The problem isn't measurement itself. The problem is that we've gotten really good at measuring things that are easy to count and really bad at measuring things that actually matter.

## The Usual Suspects (And Why They Lie)

Let's talk about some common engineering metrics and the lies they tell.

### Story Points / Velocity

Story points were invented to help teams estimate relative effort. Somewhere along the way, they became a productivity metric. Now we have teams gaming points, inflating estimates, and optimizing for the number rather than the outcome.

**The lie:** Higher velocity means higher productivity.

**The truth:** Velocity measures how many arbitrary units your team assigned to work they completed. It says nothing about whether that work created value, was done well, or was even the right work to do.

### Lines of Code

I really hoped we'd killed this one by now, but it keeps shambling back like a zombie metric.

**The lie:** More code means more productivity.

**The truth:** Sometimes the most productive thing an engineer does is delete code. Or prevent code from being written in the first place. Or write 10 elegant lines instead of 100 hacky ones.

### Deployment Frequency

This one's from the DORA metrics, which are generally good. But like all metrics, it can be gamed.

**The lie:** More deployments mean better DevOps maturity.

**The truth:** Deploying ten times a day means nothing if each deployment is a config tweak to fix the previous deployment. Frequency without stability is just chaos with better tooling.

### Time to Resolution

Track how fast you close incidents, and you'll get fast incident closure. But fast closure isn't the same as good resolution.

**The lie:** Low MTTR means your incident response is effective.

**The truth:** If you're closing incidents quickly by applying band-aids instead of fixes, you're just creating future incidents. The same problem will return, possibly wearing a disguise.

### Utilization

How much of your engineers' time is spent on "productive" work?

**The lie:** Higher utilization means better efficiency.

**The truth:** 100% utilization means zero slack for unexpected work, learning, helping colleagues, or thinking. It means your system has no resilience and your people have no room to breathe. High utilization is often a warning sign, not an achievement.

## Why Activity Metrics Dominate

So if these metrics are flawed, why do we keep using them?

Simple: they're easy.

Activity metrics are easy to collect. Your ticketing system already tracks story points. Your CI/CD pipeline already counts deployments. Your incident management tool already measures resolution time.

Outcome metrics are hard. How do you measure "system resilience"? How do you quantify "team health"? How do you put a number on "we made a good architectural decision that prevented problems we'll never see"?

So we default to what's countable and pretend it's what's important.

## Better Signals to Consider

I'm not going to give you a perfect alternative dashboard because one doesn't exist. But here are some signals that might tell you more useful things:

### Leading Indicators

- **How often do deployments require rollback?** This tells you about release quality better than deployment frequency alone.
- **How long does it take a new team member to make their first meaningful contribution?** This tells you about onboarding, documentation, and codebase clarity.
- **How often do engineers report being blocked?** This tells you about dependencies, communication, and process friction.

### Resilience Signals

- **What percentage of incidents are truly novel vs. repeat variations?** If you keep having the same incident in different clothes, you're not learning.
- **How gracefully does the system degrade under load?** Not just "does it fail" but "does it fail well."
- **How long until problems are detected?** The gap between "something broke" and "we know something broke" is where damage accumulates.

### Team Health Signals

- **How is workload distributed?** If the same three people are in every incident, that's a bus factor problem and a burnout risk.
- **What's the ratio of planned work to unplanned work?** Too much unplanned work means your system is controlling you, not the other way around.
- **Are people using their PTO?** Seriously. If your team isn't taking breaks, that's a leading indicator of burnout.

### Qualitative Signals

- **Ask your team.** Novel concept, I know. "How confident are you in this release?" "What's the most frustrating part of your workflow?" "What would you change if you could?"
- **Listen in retros.** Not just for action items, but for recurring themes. What keeps coming up? What never gets fixed?
- **Watch for silence.** When people stop raising concerns, that's not a sign that concerns don't exist.

## Metrics as Conversation Starters, Not Answers

Here's the reframe: metrics should inform judgment, not replace it.

A good metric raises questions. "Deployment frequency dropped this month. Why?" "This team's incident rate is higher than others. What's different about their system?"

A bad metric provides false certainty. "Velocity is up 15%, therefore we're doing great."

The dashboard is the beginning of the conversation, not the end.

## TL;DR

- Most common engineering metrics measure activity, not outcomes or health
- Velocity, lines of code, deployment frequency, and utilization can all be gamed or misinterpreted
- Activity metrics dominate because they're easy to collect, not because they're meaningful
- Better signals include leading indicators, resilience measures, team health checks, and qualitative feedback
- Metrics should inform judgment and spark conversations, not replace thinking

---

*Got a metric that actually tells you something useful? Or a horror story about metrics gone wrong? I'm always collecting examples. Find me on [GitHub](https://github.com/jmassardo) or [LinkedIn](https://www.linkedin.com/in/jenna-massardo/).*
