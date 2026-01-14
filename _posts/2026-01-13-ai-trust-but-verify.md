---
layout: post
title: "AI: Trust, But Verify"
date: 2026-01-13 10:00:00 -0500
category: Blog
tags: [ai, security, devops, best-practices]
excerpt: "AI can be incredibly helpful. It can also wreck your production environment in seconds. Here's how to get the benefits without the disasters."
---

AI can be incredibly helpful. It can also be incredibly dangerous. I realize that sounds dramatic, but stick with me here because this isn't fearmongering. It's the same kind of "eyes wide open" approach we've always taken with powerful tools. And increasingly, the research is backing up what many of us have experienced firsthand.

Think about it this way: we don't give junior developers production database credentials on day one. We don't let untested code deploy straight to prod. We have code reviews, staging environments, and rollback procedures. These aren't signs of distrust. They're signs of healthy engineering practices. AI deserves the same thoughtful approach.

## This Isn't Theoretical Anymore

Scientists recently published a framework identifying [32 different ways AI systems can go rogue](https://www.livescience.com/technology/artificial-intelligence/there-are-32-different-ways-ai-can-go-rogue-scientists-say-from-hallucinating-answers-to-a-complete-misalignment-with-humanity), ranging from hallucinating answers to complete misalignment with human goals. That's not science fiction. That's peer-reviewed research categorizing failure modes we're already seeing in production systems.

Even more concerning, Anthropic's own research on agentic AI systems found that [LLMs can exhibit misaligned strategic behaviors](https://www.anthropic.com/research/agentic-misalignment) when pursuing assigned goals. In testing, models demonstrated behaviors like simulated blackmail or assistance with espionage. These weren't adversarial prompts or jailbreaks. These were emergent behaviors from models trying to accomplish legitimate tasks.

The industry is taking notice. California recently passed legislation specifically targeting [catastrophic risks from frontier AI models](https://www.vox.com/future-perfect/461340/sb53-california-ai-bill-catastrophic-risk-explained), including cyberattacks and autonomous actions that could cause infrastructure damage. When lawmakers are writing bills about AI going off the rails, it's probably worth paying attention.

## The Three Risks That Hit Closest to Home

The existential stuff makes for good headlines, but let's talk about the risks that will actually bite you on a Tuesday afternoon.

### Running Commands Without Oversight

Modern AI coding assistants can execute terminal commands, run scripts, and modify files. That's incredibly powerful when you're scaffolding a new project or running a build. It's terrifying when the AI decides to "help" by running a destructive command it hallucinated.

I've seen AI assistants confidently suggest `rm -rf` commands, attempt to install packages from sketchy sources, and try to modify system configurations. Most of the time it's fine. But "most of the time" isn't good enough when we're talking about production systems or sensitive data. [Industry experts warn](https://www.news.com.au/technology/online/security/expert-warns-about-deadly-risks-of-artificial-intelligence-technology-going-rogue/news-story/726c7cee2d6d17ff85cbc7bc10968743) that autonomous AI systems in healthcare, logistics, and decision-making can produce dangerous outcomes when left unchecked.

The fix is simple: treat AI command execution like you'd treat any automation. Review before running. Use sandboxed environments for experimentation. Don't give AI tools more permissions than they need. If your AI assistant is asking to run something and you don't understand what it does, that's your cue to stop and investigate.

### Misinformation Delivered with Confidence

AI doesn't know what it doesn't know. It will explain deprecated APIs with absolute certainty. It will cite documentation that doesn't exist. It will recommend security practices that were best-in-class five years ago but are now considered vulnerabilities.

The dangerous part isn't that AI gets things wrong. Humans get things wrong too. The dangerous part is that AI delivers incorrect information with the same confidence as correct information. There's no hesitation, no uncertainty, no "I think" or "I'm not sure." It's all presented as fact.

This is especially problematic for developers who are learning new technologies. If you don't already know the right answer, how do you know the AI is wrong? You can end up building on a foundation of confident misinformation, and the bugs that result are incredibly hard to track down because you're not even looking in the right place.

### Hallucinations That Look Like Real Code

AI will invent function names that don't exist, reference libraries that were never published, and create API calls to endpoints that aren't real. It does this seamlessly, mixing hallucinated code with legitimate code in ways that are hard to spot unless you're actively looking.

I've watched AI generate perfectly reasonable-looking code that imports a package, calls its methods, and handles the response, only to discover that the package doesn't exist. The code was syntactically correct, followed best practices, and would have passed a casual code review. It just didn't work.

The worst hallucinations are the subtle ones. Not the obviously fake package names, but the almost-right method signatures or the slightly-wrong configuration options. These pass initial scrutiny and then blow up at runtime in confusing ways. And this isn't just anecdotal. There's a growing catalog of [real-world AI failures](https://www.cio.com/article/190888/5-famous-analytics-and-ai-disasters.html) where AI tools caused data loss, produced harmful outputs, or behaved in ways nobody predicted.

## The Bigger Picture: Loss of Control

Researchers at [safe.ai](https://safe.ai/ai-risk) have documented how loss of control, flawed objectives, or misalignment could cause AI systems to act against human interests, especially in critical systems like infrastructure and optimization tasks. This isn't about Skynet. It's about systems that are technically doing what they were asked to do, but in ways that produce unintended and harmful consequences.

The Anthropic research I mentioned earlier is particularly relevant here. When they tested agentic AI systems, they found models would sometimes take actions that seemed reasonable in isolation but were clearly problematic when you looked at the bigger picture. The AI wasn't "going rogue" in a dramatic sense. It was optimizing for its assigned goal in ways the designers didn't anticipate.

This is why the conversations about [existential risk from AI](https://en.wikipedia.org/wiki/Existential_risk_from_artificial_intelligence) matter, even if they feel abstract. The same patterns that could cause catastrophic problems at scale are already causing smaller problems in our day-to-day work. The difference is just magnitude.

## How to Get the Benefits Without the Disasters

None of this means you shouldn't use AI. The productivity gains are real and significant. But you need guardrails.

**Review everything.** Don't copy-paste AI output without reading it. Don't let AI run commands you haven't vetted. Treat AI suggestions like pull requests from a very enthusiastic junior developer who occasionally makes things up.

**Verify against official sources.** When AI tells you how an API works, check the actual documentation. When it suggests a package, verify it exists and is maintained. When it recommends a security practice, cross-reference with current best practices.

**Use AI for acceleration, not autopilot.** AI is great at generating boilerplate, suggesting approaches, and handling tedious tasks. It's not great at being the sole source of truth. You still need to understand what you're building and why.

**Create feedback loops.** When AI gets something wrong, take note. You'll start to recognize the patterns and know when to be extra skeptical. Some tasks AI handles beautifully. Others require much more verification.

**Limit permissions and scope.** Don't give AI tools access to things they don't need. Run experiments in sandboxed environments. Treat AI agents with the same principle of least privilege you'd apply to any other automated system.

## The Bottom Line

AI is a power tool. Like any power tool, it can help you build amazing things faster than ever before. It can also take your hand off if you're not careful. The research is clear that these risks aren't hypothetical, they're documented, studied, and increasingly regulated.

The people who get the most value from AI aren't the ones who trust it blindly or avoid it entirely. They're the ones who've learned when to trust, when to verify, and when to override.

That's not cynicism. That's just good engineering.

---

*Have thoughts on AI trust and verification? Find me on [GitHub](https://github.com/jmassardo) or [LinkedIn](https://www.linkedin.com/in/jenna-massardo/).*
