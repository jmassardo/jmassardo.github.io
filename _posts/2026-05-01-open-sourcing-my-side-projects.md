---
layout: post
title:  "Open Sourcing My Side Projects"
date:   2026-05-01 10:00:00 -0500
category: Blog
tags: [open-source, devops, automation, hardware, github, developer-tools]
excerpt: "I've been building side projects in private repos for a while. Today they all go public."
---

Here is the thing about side projects: you build them because you need something that doesn't exist, or because you want to learn something new, or because it is 11pm and you have an idea you can't let go of. They pile up in private repos. Nobody sees them. They quietly do their job or quietly collect dust.

I've been doing that for a while. Today I'm changing that.

## Why Now?

A few reasons.

**The projects are actually useful.** While some of these projects aren't done and started out as experiements or tinkering, they've become tools I use, show how I've solved various problems, and systems I've actually deployed. If they're useful to me, there's a real chance they're useful to someone else.

**Closed source doesn't make them better.** I'm not protecting any competitive advantage by keeping these private. The only thing keeping them hidden was inertia. Some of them are production ready, others are demonstrators of how to do things but they are all worth sharing.

**Building in public is better.** Issues get filed. People catch bugs you missed. Occasionally someone sends a PR that improves something in a way you didn't think of. None of that happens in a private repo.

## What's Going Public

Five projects are going public today, each with its own post. Here's the quick version:

- **[OctoWatch]({% post_url 2026-05-01-introducing-octowatch %})** - Security analytics for GitHub Enterprise Cloud audit logs. Threat detection, compliance dashboards, and operational visibility, all self-hosted.

- **[GaugeForge]({% post_url 2026-05-01-introducing-gaugeforge %})** - Arduino-driven OBD-II stepper gauge cluster for custom automotive instrument panels. YAML config, desktop GUI, X27 stepper support.

- **[ElectroSim]({% post_url 2026-05-01-introducing-electrosim %})** - Cross-platform Arduino circuit simulator with a full drag-and-drop interface, real-time simulation, and a built-in code editor.

- **[Macro Keyboard]({% post_url 2026-05-01-introducing-macro-keyboard %})** - Electron app + Arduino firmware for a fully programmable physical macro keyboard. Context-aware profiles, YAML config, cross-platform.

- **[Arctos Robot Controller]({% post_url 2026-05-01-introducing-arctos-robot-controller %})** - Web-based controller for multi-axis robotic arms. G-code execution, position replay, real-time WebSocket communication, MKS57D/42D stepper support.

## What to Expect

Each project has a README, contribution guidelines, and a roadmap. They're all works in progress - I'm not shipping finished products, I'm opening up the work.

Issues are open. PRs are welcome. If something is broken, tell me. If something could be better, tell me that too.

Let's see what happens when you stop building in the dark.
