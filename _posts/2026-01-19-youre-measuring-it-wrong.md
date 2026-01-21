---
layout: post
title: "You're Measuring It Wrong"
date: 2026-01-19 10:00:00 -0500
category: Blog
tags: [engineering, metrics, dora, space, productivity, leadership, devops, hot-take]
excerpt: "Your DORA metrics are being gamed. Your SPACE framework is being misused. And that developer productivity dashboard? It's probably making things worse. Here's the uncomfortable truth about measuring engineering productivity."
---

I'm going to say something that might get me uninvited from a few conferences: your engineering metrics are probably making your teams worse, not better.

Not because metrics are inherently bad. But because somewhere between "let's measure what matters" and "let's put this on an executive dashboard," we lost the plot entirely.

And before you @ me with "but DORA is research-backed!" or "SPACE was developed by actual researchers!", yes, I know. That's not the problem. The problem is what happens when well-intentioned frameworks meet organizational dysfunction.

Let me explain.

## The Great Metrics Heist

Here's what happened: smart researchers developed thoughtful frameworks for understanding engineering performance. DORA gave us deployment frequency, lead time, change failure rate, and MTTR. SPACE gave us a multidimensional view of satisfaction, performance, activity, communication, and efficiency.

Then executives got hold of these frameworks and did what executives do: they turned them into KPIs, put them on dashboards, and started holding people accountable to the numbers.

And the moment you tie metrics to performance reviews, promotions, or funding, you've fundamentally changed what those metrics measure.

**Goodhart's Law isn't just a cute aphorism. It's a prophecy.** When a measure becomes a target, it ceases to be a good measure.

## How DORA Gets Weaponized

Let's talk about how each DORA metric gets gamed in the wild.

### Deployment Frequency: The Deploy-O-Matic Trap

Want to increase deployment frequency? Easy. Just count more things as deployments.

I've seen teams hitting "daily deployments" by deploying config changes, updating README files, and splitting what used to be one deployment into five smaller ones. The pipeline is green. The dashboard is happy. The actual cadence of meaningful changes to production? Unchanged.

Even worse, I've watched teams optimize for deployment frequency by removing quality gates. Why wait for proper testing when you can deploy now and fix forward? Sure, you'll have more incidents, but that's a different metric. We'll optimize that one next quarter.

### Lead Time: The Ticket-Splitting Shuffle

Long lead times? No problem. Just redefine when work starts.

Instead of measuring from "customer request" to "value delivered," measure from "ticket created" to "code merged." Then break large pieces of work into smaller tickets that can be closed faster. Your lead time graph goes down. The time from customer need to customer solution? Who's tracking that?

I've seen organizations where the official lead time is 2 days but the actual time from idea to production is 6 weeks. The gap is filled with "pre-work," "discovery," and "backlog refinement" that conveniently happens before anyone starts the clock.

### Change Failure Rate: The Definition Dance

This one's my favorite because it reveals how creative organizations can be when they want to hit a number.

What counts as a failure? A full rollback? A hotfix? A production incident? A customer complaint?

I've seen teams with a 0% change failure rate that have incidents every week. How? Easy. Incidents get attributed to "infrastructure issues," "third-party dependencies," or "configuration drift" instead of the deployment that actually caused them.

Deploy code that breaks things? That's a change failure. Deploy code that works fine but exposes a pre-existing bug? Well, that's not really a *change* failure, is it?

### MTTR: The Fast-Close Special

Mean Time to Recovery is supposed to measure how quickly you restore service. But what it often measures is how quickly you can mark an incident as resolved.

Apply a quick workaround? Close the incident. Root cause still unknown? That's a problem for the post-mortem. Post-mortem never happens? Well, that's not tracked in MTTR.

I've seen teams with fantastic MTTR numbers and recurring incidents that look suspiciously similar. They're great at putting out fires. They're just not great at fire prevention.

## The SPACE Tragedy

SPACE was supposed to be different. It explicitly warned against using any single metric in isolation. It emphasized satisfaction, wellbeing, and the multidimensional nature of productivity.

So naturally, organizations took this thoughtful, nuanced framework and reduced it to... more KPIs on the same dashboard.

"Satisfaction" becomes an annual survey score. "Activity" becomes commit counts. "Efficiency" becomes story points per sprint. The whole point of SPACE was to avoid exactly this kind of reductionism, and we did it anyway.

The original SPACE paper literally says "these dimensions should be used together" and "individual metrics can be misleading." But that doesn't fit on a quarterly business review slide, so here we are.

## The Developer Productivity Platform Problem

Then there's the rise of "developer productivity platforms" that promise to give you visibility into your engineering organization.

These tools measure everything: code commits, PR cycle time, meeting load, focus time, collaboration patterns. They generate impressive dashboards with trend lines and benchmarks.

The pitch is always the same: "We'll help you identify bottlenecks and optimize your engineering investment."

Here's what actually happens:

1. Engineers figure out what's being measured
2. Engineers optimize their behavior to look good on the dashboard
3. Actual productivity stays the same or decreases
4. Leadership concludes the tool is working because the numbers improved
5. Everyone is miserable except the vendor

I've talked to developers at companies using these platforms. Know what they say? "I make sure I commit something every day, even if it's just whitespace changes, because my manager gets a report on commit frequency."

That's not productivity. That's theater.

## The Uncomfortable Truth

Here's the thing nobody wants to say out loud: **we don't know how to measure developer productivity.**

Not really. Not in a way that's both accurate and resistant to gaming. Not in a way that captures the real value of engineering work.

The most valuable thing an engineer did this month might be:

- A conversation that prevented a bad architectural decision
- A code review that caught a subtle security flaw
- A refactor that makes future work easier
- Saying "no" to a feature that would have created technical debt
- Mentoring a junior developer
- Reading documentation instead of hacking together a solution

None of this shows up on your dashboard. None of it moves your DORA metrics. None of it registers on your productivity platform.

Meanwhile, the engineer who shipped a bunch of mediocre code, created a PR backlog, and built something that will need to be rewritten in six months? Great metrics. Very visible. Very measurable.

## "But We Need to Measure Something!"

I hear you. Executives need visibility. Investments need justification. Progress needs tracking.

Fine. But let's at least be honest about what we're doing.

**Option 1: Accept the limitations.** Use metrics as conversation starters, not scorecards. When deployment frequency drops, ask "what's going on?" instead of "who's not meeting targets?" Understand that the numbers are indicators, not the thing itself.

**Option 2: Measure outcomes instead of activity.** This is harder, but more honest. Don't measure how fast you deploy. Measure customer satisfaction. Revenue impact. Time-to-value for new features. These are harder to game because they're closer to actual value creation.

**Option 3: Focus on capability, not metrics.** Instead of tracking DORA numbers, invest in the capabilities that drive good numbers naturally: good CI/CD, test automation, observability, blameless incident response. The metrics will follow if the capabilities are real.

**Option 4: Ask your engineers.** Radical idea: the people doing the work might have insight into what's actually productive and what's theater. Regular retrospectives, anonymous feedback, and genuine conversation will tell you more than any dashboard.

## The Real Problem

I've saved the spiciest take for last.

The obsession with measuring developer productivity is often a symptom of something else: **leadership that doesn't trust their engineers.**

When you trust your engineering team, you don't need a dashboard to tell you if they're productive. You see it in the products they ship, the problems they solve, the reliability of their systems, the quality of their work.

When you don't trust your engineers, no metric will help. You'll just measure distrust with greater precision.

The best engineering organizations I've worked with don't obsess over productivity metrics. They obsess over hiring great people, giving them meaningful problems, removing obstacles, and then getting out of the way.

That doesn't fit in a quarterly business review. It doesn't make for impressive dashboards. It doesn't help vendors sell productivity platforms.

But it works.

## TL;DR: What You Should Actually Do

Look, I know I just spent 1,500 words telling you everything is broken. Here's something constructive:

1. **Stop tying metrics to individual performance.** The moment you do, you've incentivized gaming over genuine improvement.

2. **Use metrics to ask questions, not make judgments.** "Why did lead time increase?" is useful. "Your lead time is too high" is not.

3. **Measure at the team/system level, not individual level.** Individual productivity metrics are almost always counterproductive. Team-level metrics at least align incentives.

4. **Include qualitative signals.** Talk to your engineers. Run retrospectives. Ask what's blocking them. This information won't fit on a dashboard, but it's more valuable than most things that do.

5. **Be honest about uncertainty.** If you don't know whether your team is productive, say so. Pretending metrics tell you something they don't is worse than admitting you're operating on judgment and trust.

6. **Fix the underlying issues.** If you feel the need to monitor developer productivity closely, ask yourself why. What's broken in your organization that makes you distrust the people you hired? Fix that, and the metrics problem solves itself.

---

*This is Part 1 of a three-part series on engineering metrics. Next up: [The Lies Your Metrics Tell]({% post_url 2026-01-21-the-lies-your-metrics-tell %}) where we dissect exactly how common metrics fail and what signals might actually be useful. Part 3, Metrics That Actually Matter, is coming soon.*

*Did this post make you uncomfortable? Good. That means it's working. Have thoughts, counterarguments, or your own horror stories about metrics gone wrong? I'd love to hear them. Find me on [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), [Bluesky](https://bsky.app/profile/jmassardo.bsky.social), or [GitHub](https://github.com/jmassardo). And if you're a vendor selling a developer productivity platform, my DMs are open, but bring data, not just demos.*

