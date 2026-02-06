---
layout: post
title: "Scaling Teams Breaks More Often Than Scaling Software"
date: 2026-02-27 10:00:00 -0500
category: Blog
tags: [engineering, scaling, leadership, teams, conways-law]
excerpt: "Software systems scale more predictably than human systems. Communication paths, ownership boundaries, and decision latency degrade as teams grow. Scaling teams requires as much intentional architecture as scaling code."
---

Here's an uncomfortable truth: most engineering organizations are better at scaling their software than scaling their teams.

We've got horizontal scaling, auto-scaling, sharding strategies, caching layers, and CDNs. We've studied distributed systems theory. We know about CAP theorem and eventual consistency.

But add ten people to a team and watch coordination collapse. Double the org and wonder why everything takes longer. Triple it and lose track of who owns what.

Software scales. Teams... teams are harder.

## Why Human Systems Are Different

Distributed software systems have a property that human systems don't: determinism. A load balancer routes requests the same way every time. A cache either has the data or it doesn't. A database query returns a predictable result.

Human systems are messy. Communication is lossy. Context is incomplete. People have bad days. People have different priorities. People interpret the same message in different ways.

When software systems scale, you add capacity and tune parameters. When human systems scale, you add complexity in ways that don't follow predictable curves.

## The Communication Path Problem

Here's the classic math: a team of n people has n(n-1)/2 potential communication paths. A team of 5 has 10 paths. A team of 10 has 45. A team of 20 has 190.

Communication paths grow quadratically while team size grows linearly. This is why adding people to a late project makes it later, and why "just hire more engineers" rarely solves velocity problems.

Beyond raw numbers, communication quality degrades with scale:

- **More misunderstandings.** More people means more chances for messages to be misinterpreted.
- **More coordination overhead.** Syncing up becomes a larger percentage of everyone's time.
- **More context loss.** Information that was implicit in a small team needs to be explicit in a large one.
- **More latency.** Decisions that took a conversation now take a meeting. Meetings that took an hour now take a week to schedule.

## Conway's Law as Lived Reality

You've probably heard Conway's Law: organizations design systems that mirror their communication structure.

This is usually treated as a fun observation, a kind of "huh, isn't that interesting" fact for architecture discussions. But it's actually a warning.

If your teams are organized poorly, your system will be organized poorly. If communication between Team A and Team B is difficult, the interface between System A and System B will be awkward. If ownership is unclear in the org, ownership will be unclear in the architecture.

And the reverse: when you change your architecture, you often need to change your org structure to match. If you don't, the mismatch creates constant friction.

## Common Failure Modes When Scaling

### The Coordination Tax

As teams grow, more time goes to coordination and less to actual work. Meetings multiply. Slack threads grow longer. Decision-making slows down.

At some point, you're spending more time talking about work than doing work. And the people doing the talking start to feel like that's their job, which means even more meetings.

### The Ownership Vacuum

When a team is small, ownership is implicit. Everyone knows who's responsible for what because everyone knows everything.

When a team grows, those implicit understandings break down. "I thought you owned that." "I thought it was their responsibility." "Wait, nobody owns this?"

Gaps form where things fall through. Overlaps form where people step on each other. Both cause problems.

### The Knowledge Silo

Small teams share context naturally. You overhear conversations. You see the commits. You're in the same room (or the same Slack channel with low enough traffic to actually follow).

Large teams can't maintain shared context. Information fragments into silos. Different groups develop different mental models of the same system. Integration becomes painful because nobody has the full picture.

### The Decision Bottleneck

In a small team, decisions happen quickly. Someone proposes something, a few people weigh in, done.

In a large org, decisions need buy-in from multiple stakeholders. Calendars don't align. People who need to approve things are overloaded. Decisions queue up behind other decisions.

The result: either everything takes forever, or people start making decisions without proper input and deal with the consequences later.

### The Culture Drift

Culture is maintained through shared experience. When you grow fast, new people outnumber old people. The original culture gets diluted. Pockets develop their own subcultures. What used to be "how we do things" becomes "how some of us do things."

This isn't necessarily bad. Sometimes cultures need to evolve. But unmanaged drift creates inconsistency and confusion.

## Scaling Requires Intentional Architecture

Here's the point: scaling teams isn't something that happens to you. It's something you design.

Just like you architect software systems for scale, you need to architect organizations for scale. That means:

### Team Boundaries

How do you divide people into teams? What's the right size? (Spoiler: smaller than you think. Two-pizza teams exist for a reason.)

Good team boundaries:
- Minimize cross-team dependencies
- Create clear ownership
- Allow teams to make decisions autonomously
- Match the architecture you want to have (or want to create)

### Communication Structures

How does information flow? Where are the explicit channels? Where are the implicit ones?

At scale, you need:
- Clear escalation paths
- Defined interfaces between teams (yes, like APIs, but for humans)
- Mechanisms for cross-team coordination that don't require everyone in a room
- Documentation that replaces tribal knowledge

### Decision Rights

Who can decide what? What requires consensus vs. consultation vs. autonomous action?

Unclear decision rights create bottlenecks and frustration. Clear decision rights let people move fast without stepping on each other.

### Knowledge Management

How do you keep people informed without drowning them in information?

This means:
- Good documentation (seriously)
- Intentional knowledge sharing (guild meetings, tech talks, internal blog posts)
- Onboarding that actually works
- Systems that make information discoverable

### Cultural Transmission

How do you preserve what matters about your culture as you grow?

This isn't about enforcing conformity. It's about being intentional about values, norms, and expectations. New people can't absorb culture by osmosis at scale. You have to teach it.

## The Inverse Conway Maneuver

Here's a power move: instead of letting your org structure drive your architecture, design your architecture and then restructure your org to match.

Want a microservices architecture? Organize into small teams with clear service ownership. Want a monolith? Organize for tighter collaboration.

This is hard. Reorgs are painful. But fighting against Conway's Law is even more painful in the long run.

## TL;DR

- Human systems don't scale as predictably as software systems
- Communication paths grow quadratically; coordination overhead increases faster than team size
- Conway's Law is a warning: your system will mirror your org structure, for better or worse
- Common failure modes: coordination tax, ownership vacuum, knowledge silos, decision bottlenecks, culture drift
- Scaling teams requires intentional architecture: team boundaries, communication structures, decision rights, knowledge management, and cultural transmission
- Consider the inverse Conway maneuver: design your target architecture, then restructure your org to support it

---

*Scaled a team successfully? Have war stories about scaling gone wrong? I'm always interested in hearing how organizations navigate growth. Find me on [GitHub](https://github.com/jmassardo) or [LinkedIn](https://www.linkedin.com/in/jenna-massardo/).*
