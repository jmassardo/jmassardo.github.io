---
layout: post
title: "AI is a Failure"
date: 2026-01-12 10:00:00 -0500
category: Blog
tags: [ai, devops, transformation, leadership]
excerpt: "AI is a failure. There, I said it. But probably not for the reasons you think."
---

AI is a failure. There, I said it. Now before you close this tab or fire off an angry comment, hear me out, because it's probably not what you think.

## The Pattern We Keep Repeating

AI is a failure in the same way DevOps was a failure. The same way cloud was a failure. The same way containers, Kubernetes, microservices, and about a hundred other pieces of technology have been failures. Not because the technology doesn't work. It absolutely does. The failure happens because organizations keep making the same mistake: they think they can just *run* AI on things and have them magically get better. Spoiler alert: that's not how any of this works.

## You Can't Bolt Innovation Onto Dysfunction

Here's the uncomfortable truth that vendors won't tell you and leadership doesn't want to hear: **you have to change your processes and retrain your teams in order to make an AI rollout successful.**

Sound familiar? It should. We've been saying the same thing about every major technology shift for the past two decades:

- "You can't just buy DevOps tools and expect DevOps culture"
- "Lift and shift to the cloud doesn't give you cloud benefits"
- "Containerizing a monolith doesn't make it a microservice"

And now: "Dropping Copilot licenses on your dev team doesn't make them 10x engineers"

We've got running jokes about this in the industry. "Just smear some containers on it, it'll be fine." Or my personal favorite: walking into a vendor booth and asking "Can I buy one DevOps, please?" 

The punchline is always the same: technology doesn't fix organizational problems. It amplifies them.

## The Biplane Problem

Implementing AI is like trying to convert a biplane into a jet while you're still flying it. When you swap out the engine, you stress everything else in the system.

The airframe wasn't designed for those speeds. The controls aren't responsive enough. The pilot isn't trained for the new flight characteristics. And you definitely didn't account for the fuel requirements.

That's exactly what happens when organizations "implement AI". The workflows weren't designed for AI assistance, so people are still following processes built for manual work. The tooling isn't integrated, leaving AI as an awkward add-on rather than a natural part of the developer experience. The team isn't trained, meaning developers don't know how to prompt effectively, what to trust, or when to override. And leadership didn't account for the change curve, so they expected immediate ROI and got frustrated when adoption stalled.

## What Actually Makes AI Implementations Succeed

The organizations seeing real success with AI aren't the ones with the biggest budgets or the flashiest tools. They're the ones doing the boring, unsexy work:

### 1. Process Redesign First

Before rolling out AI tools, successful teams ask: "If we had an AI assistant available for every task, how would we redesign this workflow from scratch?" The answer is rarely "exactly the same, but with AI." How does our change management process change? How does our release process change? Our peer review process? Ideation, user story creation, project management, work item tracking, and so on... We're talking about a system here. Development is only one part, and realistically, it's not even that big of a part from an actual time perspective. 

If a new feture currently takes 45 days from ideation to delivery without AI, that might be 2-3 weeks of ideation and design, days of testing, change management, and release. Realistically, it probably only actually takes a few days to do the actual development work. This means that even if AI completely eliminated the development time, our feature probably still needs 40 days. So we have made some improvement but not the amount of improvement we COULD have.

### 2. Training That Goes Beyond "Here's the Tool"

Effective AI training isn't a one-hour webinar on how to use the chat interface. It's ongoing coaching on:
- How to write effective prompts
- When AI output needs verification
- How to iterate and refine AI assistance
- What tasks are (and aren't) good candidates for AI help

One thing that a lot of people don't understand is, LLMs have personalities. Each one understands and processes information slightly differently, just like other human members on our team. Some are better at certain things than others.

### 3. Cultural Permission to Experiment

Teams need explicit permission to be slower initially while they learn. The productivity gains come after the learning curve, not before. Organizations that demand immediate improvements get neither. We're teaching folks how to use a new tool. We're also teaching them new proceses. This means people need time. They have to adjust and that adjustment takes time.

### 4. Measurement That Accounts for Reality

Stop measuring "AI adoption" by license utilization. And for the love of all things, stop measuring "lines of code" and "code generated by AI". Start measuring outcomes: cycle time, quality, developer satisfaction, time spent on toil vs. creative work. The metrics should tell you if the work is getting better, not just if the tool is being used.

Anyone that's been in the industry knows that measuring productivity is a hard problem to solve. DORA, SPACE, etc. are all testaments that it's not easy. Measurements aren't a good/bad thing. They are trends. They are indicators. Are we getting better over time? If we see sharp changes in our metrics, it means that something significant changed and we need to figure out what happened.

## The Good News

Here's the thing: AI isn't actually a failure. The technology is genuinely transformative. I've seen it dramatically accelerate development, improve code quality, reduce toil, and free up engineers to focus on the interesting problems. But that only happens when organizations treat AI implementation as what it actually is: an organizational transformation that happens to involve technology. Not the other way around.

## The Bottom Line

If your AI rollout is struggling, the problem probably isn't the AI. It's everything around it. Fix your processes. Train your people. Give them time to learn. Measure what matters. Or keep bolting jet engines onto biplanes and wondering why you're not breaking the sound barrier. Your call.

---

*Have you seen AI implementations succeed or fail in your organization? What made the difference? I'd love to hear your war stories. Hit me up on [LinkedIn](https://www.linkedin.com/in/jennamassardo) or [GitHub](https://github.com/jmassardo).*
