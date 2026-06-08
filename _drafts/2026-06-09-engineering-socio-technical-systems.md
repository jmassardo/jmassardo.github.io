---
layout: post
title: "Engineering Is a Socio-Technical System (and We Keep Pretending It Isn't)"
date: 2026-06-09 10:00:00 -0500
category: Blog
tags: [engineering, leadership, culture, systems-thinking, devops]
excerpt: "Modern engineering failures rarely stem from code alone. They emerge from the messy intersection of people, incentives, tooling, and organizational structure. It's time we stopped pretending otherwise."
---

Here's a fun thought experiment: Think about the last major incident at your organization. Now ask yourself, was it really caused by a bug? Or was it caused by the on-call engineer who didn't know they owned that service, the alert that fired but went to the wrong channel, the runbook that was last updated in 2019, and the manager who had been pushing the team to ship faster for three straight quarters?

If you're being honest, it was probably all of the above. Welcome to socio-technical systems.

## What Is a Socio-Technical System?

The term sounds academic because it is. It comes from organizational research dating back to the 1950s, studying how technical systems and human systems interact. The core insight? You can't optimize one without affecting the other.

In engineering terms: your architecture, your team structure, your deployment tooling, your oncall rotation, your promotion criteria, and your Slack channels are all part of the same system. Change one, and you change the others, whether you meant to or not.

## Why We Keep Pretending It's Just Technical

Engineers like technical problems. They're solvable. You can grep for them. They have stack traces.

People problems are messier. Incentive misalignment doesn't show up in your monitoring. Communication breakdowns don't trigger PagerDuty. Burned-out engineers don't throw exceptions (well, not the kind you can catch).

So we default to what we know. We redesign the database schema instead of redesigning the ownership model. We add more automated tests instead of asking why requirements keep changing mid-sprint. We blame the code because blaming the org chart feels above our pay grade.

## The Components You're Probably Ignoring

Let's break down the "socio" side of your socio-technical system:

### Communication Paths

How does information flow through your organization? If your architecture requires two teams to coordinate but those teams never talk, you've got a design flaw that no amount of API documentation will fix.

Conway's Law isn't just a fun observation. It's a warning. Your system will reflect your communication structure, for better or worse.

### Ownership Boundaries

Who owns what? More importantly, who *thinks* they own what? Unclear ownership creates gaps where problems fall through and overlaps where people step on each other's toes. Both lead to incidents.

### Reward Systems

What gets people promoted at your company? If it's shipping features, don't be surprised when reliability suffers. If it's firefighting, don't be surprised when fires keep mysteriously starting. People respond to incentives, and your system will reflect whatever behavior you're actually rewarding.

### Knowledge Distribution

Where does critical knowledge live? If it's in one person's head, that's not institutional knowledge. That's a single point of failure with a commute.

## Designing Holistically

Okay, so engineering is a socio-technical system. Now what?

First, **stop treating organizational design as someone else's job**. If you're a senior engineer or engineering leader, the org structure is part of your system. You should have opinions about it.

Second, **apply systems thinking to people problems**. When something breaks, ask the same questions you'd ask about a technical failure. What were the inputs? What were the feedback loops? Where did the signal get lost?

Third, **make the implicit explicit**. Document ownership. Clarify escalation paths. Write down the things everyone "just knows" because new people don't know them, and tired people forget them.

Fourth, **design for failure in human systems too**. People get sick. People quit. People have bad days. Your system should handle that gracefully, just like it handles server failures.

## The Payoff

Organizations that embrace the socio-technical reality tend to have:

- Fewer surprises during incidents (because ownership is clear)
- Better knowledge sharing (because it's designed in, not accidental)
- Lower attrition (because people aren't constantly fighting the system)
- More sustainable velocity (because they're not burning people out for short-term gains)

None of this is rocket science. It's just uncomfortable because it requires acknowledging that the hard problems aren't always in the code.

## A Practical Review Lens for Incidents

If you want this to be actionable, change how you run incident reviews. Most postmortems still bias toward technical artifacts because those are easiest to point at.

Use a four-lens check every time:

1. **Technical lens:** What failed in code, configuration, or infrastructure?
2. **Coordination lens:** Where did handoffs, ownership, or escalation break down?
3. **Incentive lens:** What pressure or goals made the risky path feel rational?
4. **Learning lens:** What system change prevents recurrence without heroics?

This keeps reviews from devolving into "add one more alert" and forces the organization to address structural causes.

## Design Interventions That Actually Work

A socio-technical diagnosis is useful only if it changes daily behavior. Start with interventions that reduce ambiguity and cognitive load:

- **Explicit service ownership maps.** Every critical service has a primary team, secondary backup, and escalation path.
- **Operational readiness gates.** No service is production-ready without runbooks, alert routes, and recovery instructions.
- **Cross-team interface contracts.** If one team's deploy can break another team's runtime, define coordination points explicitly.
- **Incentive alignment.** Reward reliability and maintainability outcomes, not just feature throughput.

Small structural changes compound fast. They prevent repeat incidents, reduce blame cycles, and make engineering work feel less chaotic.

## TL;DR

- Engineering systems include the humans operating them, not just the technology
- Failures usually emerge from the interaction between technical and social factors
- Communication paths, ownership boundaries, incentives, and knowledge distribution all shape outcomes
- Treating engineering as purely technical leads to blind spots, burnout, and brittle systems
- Design your organization as intentionally as you design your architecture

---

*Got thoughts on socio-technical systems? Found a great way to make your org acknowledge the "socio" part? I'd love to hear about it. Find me on [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), [Bluesky](https://bsky.app/profile/jmassardo.bsky.social), or [GitHub](https://github.com/jmassardo).*
