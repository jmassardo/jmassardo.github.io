---
layout: post
title: "Technical Debt Is a Leadership Problem, Not an Engineering One"
date: 2026-06-14 10:00:00 -0500
category: Blog
tags: [engineering, technical-debt, leadership, prioritization, devops]
excerpt: "Technical debt is often blamed on careless engineers. But debt accumulates because of prioritization, incentives, and planning decisions made upstream. Addressing it requires ownership at the decision-making level."
---

Let's play a game. Next time someone complains about technical debt at your company, ask them whose fault it is.

Nine times out of ten, the answer will be some variation of: "Engineers made bad decisions" or "We didn't have time to do it right" or "The previous team cut corners."

In other words: it's someone else's fault. Someone technical. Someone who should have known better.

Here's my counter-argument: technical debt is almost never an engineering problem. It's a leadership problem dressed up in engineering clothes.

## What Is Technical Debt, Really?

Ward Cunningham's original metaphor was about shipping something you know isn't ideal in order to learn faster, with the intention of paying it down once you understand the problem better. It was a deliberate, strategic choice.

What we call "technical debt" today is usually something else:
- Deferred maintenance
- Accumulated shortcuts
- Things we said we'd fix later but never did
- Architectural decisions that made sense once but don't anymore
- Stuff that works but nobody wants to touch

The common thread isn't engineering carelessness. It's prioritization. Someone decided, explicitly or implicitly, that other things were more important than addressing this work.

## The Prioritization Chain

Let's trace how debt accumulates:

1. **Business sets aggressive timelines.** There's always pressure to ship faster. New features, competitive deadlines, quarterly targets.

2. **Product prioritizes features over maintenance.** When you're choosing between "customers can do a new thing" and "the code is cleaner," the new thing wins almost every time.

3. **Engineering estimates get squeezed.** "Can you do it faster?" "What if we skip the refactor?" "Let's just get it working and clean it up next sprint."

4. **The cleanup never happens.** Next sprint has its own priorities. The "later" that was promised never arrives.

5. **Repeat for several years.** Now you have a legacy system that everyone complains about but nobody has time to fix.

Notice who's actually making the decisions at each step. It's not usually the engineer writing the code. It's the people controlling priorities and timelines.

## Why Engineers Get Blamed

So if leadership is making the calls, why do engineers take the blame?

**Visibility.** Engineers are the ones who have to work with the debt. They're the ones complaining about it. They're the closest to it. So they become associated with it.

**The "should have" narrative.** "You should have pushed back harder." "You should have written tests." "You should have known this would cause problems." This frames debt as a failure of individual judgment rather than a systemic outcome.

**Diffusion of responsibility.** The PM who pushed for the aggressive timeline has moved on. The VP who set the quarterly target isn't in the codebase. The decisions that created the debt are disconnected from the consequences.

**Technical complexity obscures the cause.** It's easy to look at messy code and blame the people who wrote it. It's harder to see the planning decisions, resource constraints, and priority calls that led to that code being written that way.

## What Leadership Owns

If you're in a leadership position, here's what you actually own about technical debt:

### Prioritization Decisions

Every sprint, every quarter, you're deciding what gets worked on. If maintenance and refactoring never make the cut, debt accumulates. That's not engineering failing to do the work. That's leadership failing to prioritize it.

### Timeline Expectations

When timelines are set without engineering input, or when engineering estimates are overridden by business needs, shortcuts become necessary. Those shortcuts become debt. The timeline decision caused the debt.

### Incentive Structures

What gets rewarded at your company? If it's shipping features, people will ship features. If it's firefighting heroics, people will fight fires. If reducing debt isn't valued, don't be surprised when debt grows.

### Resource Allocation

Do teams have capacity to pay down debt? Or is everyone at 100% utilization on feature work? If there's no slack in the system, there's no room for improvement.

### Culture and Psychological Safety

Can engineers push back on unrealistic timelines without career consequences? Can they advocate for code quality without being labeled "not pragmatic"? If not, they'll quietly cut corners and the debt will accumulate in silence.

## The Feedback Loop Problem

Here's the insidious part: technical debt creates symptoms that leadership often treats with more of the same medicine that created the debt.

**Velocity drops** because the codebase is hard to work with. Response: push for more features to compensate. Result: more shortcuts, more debt.

**Quality declines** because the system is fragile. Response: ship faster to fix bugs. Result: more bugs, more technical debt.

**Engineers burn out** because everything is painful. Response: hire more engineers. Result: new engineers struggle with the complex codebase, velocity drops further.

The leadership actions that created the debt are reinforced by the symptoms of the debt. Breaking this loop requires recognizing that the problem isn't engineering execution. It's the decisions being made about priorities.

## What Actually Works

So how do you address technical debt as a leadership problem?

### Make Debt Visible

You can't prioritize what you can't see. Create mechanisms to surface technical debt to decision-makers. Track it. Quantify it. Show the impact. "This system is responsible for 40% of our incidents" is more compelling than "the code is messy."

### Allocate Capacity Explicitly

Don't make engineers beg for maintenance time. Budget it. Google's famous "20% time" is one model, but even simpler: reserve some percentage of each sprint for non-feature work.

### Connect Decisions to Consequences

When pushing for aggressive timelines, be explicit about what's being traded off. "We're accepting technical debt to hit this deadline." Then track whether that debt gets paid down. If it doesn't, the decision-maker should feel the heat.

### Change Incentives

Reward stability, not just shipping. Recognize engineers who pay down debt, not just those who build new things. Promote people who make sustainable decisions, not just those who deliver heroically.

### Create Accountability

Technical debt should be a topic in leadership conversations, not just engineering retros. If debt is a leadership problem, leaders should be accountable for it.

## The Engineers Still Matter

I'm not saying engineers have no responsibility here. Engineers should:
- Make debt visible and articulate its impact
- Propose practical remediation plans
- Push back (appropriately) on unrealistic timelines
- Make small improvements continuously when possible

But engineers often don't have the authority to prioritize their own work. They can advocate, but they can't decide. The people who can decide are the ones who own the outcome.

## TL;DR

- Technical debt is framed as an engineering problem but it's actually a prioritization problem
- Debt accumulates because of decisions made about timelines, priorities, incentives, and resource allocation
- Those decisions are made by leadership, not by individual engineers
- Engineers get blamed because they're visible and close to the debt, but they often lack authority to address it
- Fixing debt requires leadership accountability: making debt visible, allocating capacity, connecting decisions to consequences, and changing incentives

---

*Dealt with technical debt as a leadership issue? Found ways to get leadership buy-in for paying it down? I'd love to hear what worked. Connect on [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), [Bluesky](https://bsky.app/profile/jmassardo.bsky.social), or [GitHub](https://github.com/jmassardo).*
