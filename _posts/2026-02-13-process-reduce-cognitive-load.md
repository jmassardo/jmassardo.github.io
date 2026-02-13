---
layout: post
title: "Process Exists to Reduce Cognitive Load, Not Control People"
date: 2026-02-13 10:00:00 -0500
category: Blog
tags: [engineering, process, leadership, productivity, culture]
excerpt: "Process gets a bad reputation because it's often implemented poorly. But good process should make work easier, not heavier. It should serve engineers, not police them."
---

Say the word "process" in a room full of engineers and watch the eye rolls begin.

I get it. We've all suffered through mandatory status meetings that could have been Slack messages, approval workflows that added days to simple changes, and documentation requirements that existed purely to satisfy auditors who would never read them.

Bad process is real, and it's everywhere. But here's the thing: the problem isn't process itself. The problem is process designed to control people instead of help them.

Good process is different. Good process is invisible. It reduces decisions, not adds them. It protects your focus instead of fragmenting it.

Let me explain.

## The Real Purpose of Process

At its core, process exists to reduce cognitive load.

Every time you have to think "wait, how do we handle this again?" that's cognitive load. Every time you have to track down the right person to ask permission, that's cognitive load. Every time you're interrupted to answer a question that should be documented somewhere, that's cognitive load.

Cognitive load is finite. You only have so much mental energy in a day. The more you spend on "how do I do this?" the less you have for "what should I actually build?"

Good process answers the routine questions so you can focus on the interesting ones.

## Enabling Process vs. Bureaucratic Control

Here's the distinction that matters:

**Enabling process** makes decisions for you or makes decisions easier. It provides guardrails and defaults so you don't have to think about everything from scratch every time.

Examples:
- A deployment checklist that ensures you don't forget steps
- A PR template that prompts for context reviewers need
- A runbook that tells you exactly what to do when the alert fires
- Default configurations that work for 90% of cases

**Bureaucratic process** adds friction, usually in the name of control or compliance. It requires approval for things that don't need approval. It creates bottlenecks. It treats engineers as risks to be managed rather than professionals to be trusted.

Examples:
- Requiring VP approval for changes that should be team decisions
- Mandatory meetings to discuss work that's already been discussed
- Forms that collect information nobody uses
- Documentation requirements divorced from actual utility

## Signs Your Process Is Actually Helping

How do you know if your process is good? A few signals:

**People follow it voluntarily.** If you removed enforcement, would people still do it? If yes, it's probably useful. If no, ask why it exists.

**It answers questions instead of creating them.** After following the process, you should have fewer decisions to make, not more.

**It's current.** Good process evolves. If your runbook references a system that was decommissioned two years ago, that's not process. That's archaeology.

**It handles the common cases without blocking the uncommon ones.** Good process has defaults and escape hatches. "Here's what you do normally, and here's what you do if that doesn't apply."

**It reduces interruptions.** If the process works, people can self-serve instead of pinging someone. The Slack question "how do I deploy to staging?" should have a documented answer.

## Signs Your Process Is Just Control Theater

And some red flags:

**It exists because someone got in trouble once.** Reactive process created in the wake of an incident, applied broadly to prevent a repeat, even when the repeat is unlikely. "We require two approvals because someone deployed bad code that one time."

**It requires handoffs to people who are just rubber stamps.** If the approver always approves without meaningful review, the approval step adds latency without adding value.

**It's performative.** The process exists to demonstrate that a process exists. It's compliance theater for auditors or executives who want to see paperwork.

**Nobody can explain why it exists.** "We've always done it this way" is not a reason. If no one can articulate what problem the process solves, it's probably not solving one.

**Following it is more work than not following it, with no corresponding benefit.** This seems obvious, but it's amazing how often we accept process overhead without questioning the return.

## Designing Better Process

If you're responsible for defining process (and even if you're not, you can influence it), here's how to make it actually useful:

### Start with the Problem

What decision are you trying to make easier? What mistake are you trying to prevent? What question are you trying to answer? If you can't articulate the problem clearly, you're not ready to design a solution.

### Optimize for the Common Case

80% of the work should be trivially easy. Design the happy path to require minimal friction. Handle the edge cases, but don't let them slow down the routine.

### Build in Escape Hatches

Good process accommodates exceptions. "This is the default, but if you need something different, here's how to request it." The escape hatch shouldn't be "break the rules and hope nobody notices."

### Make it Self-Documenting

The process itself should explain the why, not just the what. When someone asks "why do we do this?" the answer should be in the process definition.

### Review and Prune Regularly

Process accumulates. Every incident adds a new step. Every compliance requirement adds a new form. If you don't actively prune, you end up with layers of sediment from problems that no longer exist.

Make process review a regular practice. "Does this still solve a problem? Is there a lighter-weight way to achieve the same goal?"

## The Culture Component

Process alone isn't enough. You also need a culture that:

- Trusts people to do their jobs without constant oversight
- Distinguishes between "I need approval for safety" and "I need approval because we don't trust engineers"
- Allows questioning of process without penalty
- Treats process as a tool, not a religion

If your culture treats deviation from process as insubordination, your process will become a cage. If it treats process as "the current best way we know to handle this," it stays adaptive.

## TL;DR

- Process exists to reduce cognitive load by answering routine questions and making decisions easier
- Enabling process provides guardrails and defaults; bureaucratic process creates friction and control
- Good process is followed voluntarily, handles common cases efficiently, and has escape hatches for exceptions
- Bad process is performative, creates bottlenecks, and exists because "something bad happened once"
- Process should serve engineers, not police them. If it's not making work easier, question why it exists.

---

*Have a process that actually helps? Or a bureaucratic nightmare you're trying to fix? I'm always interested in hearing how teams navigate this. Find me on [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), [Bluesky](https://bsky.app/profile/jmassardo.bsky.social), or [GitHub](https://github.com/jmassardo).*
