---
layout: post
title: "Automation as an Engineering Discipline, Not a Shortcut"
date: 2026-03-13 10:00:00 -0500
category: Blog
tags: [automation, engineering, devops, reliability, best-practices]
excerpt: "Automation is frequently introduced to 'go faster.' But speed alone is a poor justification. Poorly designed automation can amplify failures. Automation should reduce fragility, not hide it."
---

"Let's automate it."

Music to every engineer's ears. Who doesn't want to replace tedious manual work with elegant automated solutions?

But here's the thing: automation isn't magic. It's engineering. And like all engineering, it has tradeoffs, risks, and failure modes.

Bad automation doesn't just fail to help. It actively makes things worse. It amplifies errors. It hides problems. It creates new categories of failure that didn't exist before.

Let's talk about what it means to treat automation as a discipline, not a shortcut.

## The "Go Faster" Trap

The most common justification for automation is speed. "We can deploy faster if we automate." "We can respond to incidents faster if we automate." "We can onboard faster if we automate."

Speed is good. But speed is a side effect, not a goal. If you optimize purely for speed, you'll create fast automation that's also brittle, opaque, and dangerous.

Consider: a script that deploys to production in 30 seconds is faster than a human who takes 5 minutes. But if the script can also destroy production in 30 seconds when something goes wrong, have you actually improved the situation?

## What Can Go Wrong

### Automation Amplifies Errors

When a human makes a mistake, it affects one thing. When automation makes a mistake, it can affect everything.

Delete the wrong file manually? You deleted one file. Automate that deletion? You might delete the file across every server simultaneously.

This is the automation paradox: the same properties that make automation powerful (speed, scale, consistency) also make it dangerous.

### Automation Hides Problems

Manual processes have a feature: human attention. When someone does something manually, they see what's happening. They notice when things look wrong. They adapt.

Automation removes that attention. Problems that a human would catch get processed automatically. The system looks healthy because all the automated checks pass, but underneath, something is quietly going wrong.

### Automation Creates New Failure Modes

Before automation, "the deploy script has a bug" wasn't a failure mode. Now it is. Before automation, "the automated cleanup job deleted production data" wasn't a risk. Now it is.

Every piece of automation is a new system component. It can fail. It can interact badly with other components. It adds complexity even as it removes manual effort.

### Automation Can Be Hard to Override

Good automation has escape hatches. Bad automation doesn't.

When the automated process is doing the wrong thing and you can't stop it or override it, you're not in control of your system anymore. The automation is.

## Automation as Engineering

So how do you do automation right? By treating it as engineering, not scripting.

### Intentionality

Don't automate just because you can. Automate because you've thought through the tradeoffs and decided it's worth it.

Questions to ask:
- What problem is this automation solving?
- What are the risks if it goes wrong?
- What are the failure modes?
- Is this the right thing to automate, or should it stay manual for safety?

### Observability

You should be able to see what your automation is doing. Logs, metrics, audit trails.

When something goes wrong (and eventually it will), you need to be able to answer: What did the automation do? When? Why? What was the state before and after?

Black-box automation that does things invisibly is a liability.

### Reversibility

Can you undo what the automation did?

Good automation either makes reversible changes or is very careful about irreversible ones. Delete operations are dangerous. State modifications can be dangerous. Think about how to recover when automation does the wrong thing.

This might mean:
- Soft deletes instead of hard deletes
- Backups before destructive operations
- Change records that allow rollback
- Confirmation steps for high-risk actions

### Gradual Rollout

Don't automate everything at once. Start small. Automate one step. See how it goes. Automate the next step.

This is the same principle as incremental deployment for code changes. Gradual rollout limits blast radius and gives you feedback before you're fully committed.

### Testing

Yes, your automation code needs tests.

This is obvious for application code, but people often skip it for "scripts." That script that runs in production at 3 AM is production code. Test it like production code.

### Escape Hatches

Always have a way to stop or override the automation.

- Kill switches that halt automated processes
- Manual approval gates for high-risk operations
- Ability to run manually when automation can't be trusted
- Clear documentation on how to intervene

### Rate Limiting and Circuit Breakers

Automation that goes wrong should stop itself before it causes maximum damage.

If your automated cleanup script is deleting way more files than expected, it should notice and stop. If your deployment automation is seeing failures, it should halt rather than continuing to roll out bad code.

Build in safeguards that trip before disaster is complete.

## When Not to Automate

Not everything should be automated. Some things are better left manual.

### Rare Operations

If you do something once a year, automating it might cost more than it saves. The automation will probably be broken when you need it anyway because it hasn't been tested in a year.

### High-Risk Operations with Low Volume

Some operations are dangerous enough that human attention is a feature. "Delete all customer data for GDPR compliance" might be something you want a human to think about and confirm.

### Operations Requiring Judgment

Automation is good at following rules. It's bad at judgment calls. If the operation requires nuanced human judgment, automating it means either removing the judgment (risky) or building very complex decision logic (expensive and probably buggy).

### When You Don't Understand the Process

If you can't clearly articulate what the manual process is and why, you're not ready to automate it. Automation encodes your understanding. If your understanding is wrong, the automation will be wrong at scale.

## Automation Maturity

Think of automation maturity as a ladder:

1. **Manual:** Humans do everything. Slow but adaptable.
2. **Documented:** Humans follow runbooks. Still manual but more consistent.
3. **Semi-automated:** Automation handles parts of the process. Human oversight and approval for key steps.
4. **Automated with guardrails:** Automation handles the process but has safeguards, monitoring, and easy override.
5. **Full autonomous:** Automation handles everything including recovery from failures.

Most organizations should aim for level 4. Level 5 is only appropriate for well-understood, low-risk processes where you have extremely high confidence in the automation.

## TL;DR

- Automation is engineering with tradeoffs, not a magic shortcut
- Bad automation amplifies errors, hides problems, creates new failure modes, and can be hard to override
- Treat automation as a discipline: intentionality, observability, reversibility, gradual rollout, testing, escape hatches, rate limiting
- Not everything should be automated. Rare operations, high-risk low-volume tasks, and operations requiring judgment may be better manual
- Automation should reduce fragility, not hide it. If your automation makes the system harder to understand or control, you've gone backward.

---

*Have automation horror stories? Or examples of automation done right? I'm collecting both. Reach out on [GitHub](https://github.com/jmassardo) or [LinkedIn](https://www.linkedin.com/in/jenna-massardo/).*
