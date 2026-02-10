---
layout: post
title: "Complex Systems Fail Quietly Before They Fail Loudly"
date: 2026-03-06 10:00:00 -0500
category: Blog
tags: [engineering, reliability, incidents, systems-thinking, devops]
excerpt: "Major incidents rarely come out of nowhere. They're preceded by subtle warning signs that get normalized or ignored. Organizations that learn to notice weak signals can prevent catastrophe."
---

"We didn't see it coming."

That's what everyone says after a major incident. The system seemed fine. Then suddenly, catastrophically, it wasn't.

But here's the thing: major failures almost never come out of nowhere. They're preceded by warning signs. Small anomalies. Near-misses. Things that almost went wrong but didn't quite.

The signs were there. We just weren't looking.

## The Myth of the Sudden Failure

Complex systems don't flip instantly from "working" to "catastrophically broken." They degrade. They accumulate stress. They develop hidden weaknesses that compound over time.

What looks like sudden failure is usually the culmination of a slow process. The dam doesn't break because of one crack. It breaks because a hundred small cracks finally connected.

This is documented extensively in safety research. Sidney Dekker, Nancy Leveson, Richard Cook all describe how major accidents emerge from the interaction of multiple small factors, each individually tolerable, collectively catastrophic.

Your systems work the same way.

## The Warning Signs We Miss

### Near-Misses

Something almost went wrong but didn't. Maybe a deploy almost took down production but was caught in staging. Maybe an alert fired and then resolved before anyone looked at it. Maybe a customer reported something weird but it "couldn't be reproduced."

Near-misses are information. They're telling you that the conditions for failure exist. The only difference between a near-miss and an incident is luck.

Most organizations don't track near-misses. They track incidents. So the warning signs go unrecorded and unanalyzed.

### Workarounds

When people develop workarounds, it means the system isn't working as designed. "Oh, you have to restart the service every morning or it gets slow." "Yeah, just ignore that error, it always happens."

Workarounds become normal. People stop seeing them as problems. But each workaround is a signal that something is wrong, and the accumulation of workarounds is a signal that many things are wrong.

### Increasing Effort for Constant Output

The system takes more work to maintain. Deploys that used to be simple now require careful coordination. On-call shifts that used to be quiet now have regular pages. The team is working harder just to stay in place.

This is the system telling you it's degrading. The effort increase is compensating for growing fragility.

### Unexplained Success

This one's counterintuitive. Sometimes systems work for reasons nobody can explain. "I'm not sure why that's stable, but don't touch it."

Unexplained success is dangerous because it means you don't understand your system. When conditions change and the unexplained factor stops helping, you won't know what happened.

### Normalization of Deviance

Diane Vaughan coined this term studying the Challenger disaster. It describes how organizations gradually accept risky behaviors as normal.

At first, the deviation is noticed. "That's not supposed to happen." But it doesn't cause immediate harm. So it happens again. And again. Eventually, it's just how things work. The warning sign has been normalized into invisibility.

## Why We Miss the Signs

### Success Bias

When things are working, we assume they're fine. We don't investigate success. We don't ask "why didn't that fail?"

But "working" isn't the same as "healthy." A system can be working despite significant fragility. The fragility just hasn't been tested yet.

### Outcome Bias

We judge decisions by outcomes, not by process. If nothing bad happened, the decision was good. If something bad happened, the decision was bad.

This makes us blind to near-misses. The process was risky, but the outcome was fine, so we conclude everything is fine.

### Alert Fatigue

Too many alerts and they all become noise. People stop reading them. They assume false positive. They assume someone else is handling it.

Alert fatigue isn't a personal failure. It's a systems design failure. But the result is the same: the warning signs are there, and nobody's looking.

### Complexity Hiding

In complex systems, cause and effect are separated in time and space. The thing that breaks at 3 AM was caused by a change made three weeks ago. The connection isn't obvious. So we don't make it.

### The Normality of Operations

Most of the time, things are fine. So "fine" becomes the expected state. When small anomalies appear, they seem like noise against the background of normality. We dismiss them because everything else is working.

## How to Notice Weak Signals

### Track Near-Misses

Create a mechanism for capturing near-misses. Not just incidents, but "things that could have been incidents." Make it low-friction. Review them regularly.

Ask: "What did we learn from the thing that almost went wrong?"

### Document Workarounds

When someone creates a workaround, that's information. Capture it. "We do X because otherwise Y happens." Then ask: why is the workaround necessary? What would it take to fix the underlying issue?

### Monitor for Effort Increase

Are people working harder for the same results? Are deploys taking longer? Are on-call shifts busier? These trends are leading indicators of fragility.

### Investigate Success

Don't just investigate failures. Occasionally investigate successes. "Why did that deploy go smoothly?" "Why didn't we have an incident during peak traffic?"

Sometimes you'll discover that success depended on factors you didn't know about. That's valuable information.

### Calibrate Alerts

If you have too many alerts, people will ignore them. Aggressively tune your alerting. An alert that doesn't require action shouldn't exist. An alert that everyone ignores is worse than no alert.

### Create Psychological Safety for Raising Concerns

People notice weak signals before systems do. But they won't raise concerns if doing so is punished, dismissed, or just ignored.

Make it safe to say "something feels wrong." Make it valued to bring up concerns even if they turn out to be nothing.

### Use Blameless Analysis

When you do have incidents, analyze them without blame. Ask what the system conditions were, not who messed up. This encourages people to surface information instead of hiding it.

## Paying Attention Is Cheaper Than Reacting Late

Here's the economics: fixing a weak signal before it becomes an incident is cheap. Fixing the incident is expensive. Fixing the aftermath is very expensive.

Organizations that learn to notice weak signals can prevent problems before they become visible. Organizations that only react to loud failures are always behind.

The signs are there. The question is whether you're looking.

## TL;DR

- Major incidents are preceded by warning signs: near-misses, workarounds, increasing effort, unexplained success, normalization of deviance
- We miss these signs because of success bias, outcome bias, alert fatigue, complexity hiding, and the normality of operations
- To notice weak signals: track near-misses, document workarounds, monitor for effort increase, investigate success, calibrate alerts, create psychological safety
- Paying attention early is far cheaper than reacting late
- The signs are there. The question is whether you're looking.

---

*Have a story about warning signs you noticed (or missed)? Found good practices for surfacing weak signals? I'd love to hear about it. Connect on [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), [Bluesky](https://bsky.app/profile/jmassardo.bsky.social), or [GitHub](https://github.com/jmassardo).*
