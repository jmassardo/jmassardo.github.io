---
layout: post
title: "Migrating to GitHub Actions, Part 1: Making the Case for Change"
date: 2026-06-03 10:00:00 -0500
category: Blog
tags: [github, github-actions, ci-cd, devops, migration, platform-engineering, best-practices, enterprise]
excerpt: "Migrating CI/CD platforms isn't just a technical project - it's an organizational change initiative. Here's how to build the case, identify what matters, and plan a migration that people will actually support."
---

*This is Part 1 of a three-part series on migrating to GitHub Actions at scale. [Part 2: What Good Looks Like](/blog/2026/06/03/migrating-to-github-actions-part-2-what-good-looks-like/) covers the target architecture. [Part 3: Building the Lego Blocks](/blog/2026/06/03/migrating-to-github-actions-part-3-building-the-lego-blocks/) gets into hands-on implementation.*

---

Picture this: your organization runs three different CI/CD platforms. Jenkins handles the legacy Java apps. Some teams adopted CircleCI two years ago. A handful of teams are on TeamCity. And now there's a smattering of GitHub Actions workflows from a proof of concept last quarter.

Each team has their own pipeline scripts, their own patterns, their own tribal knowledge about why the build breaks every third Tuesday. Onboarding a new developer means spending a week just figuring out which CI system their team uses and how to read the logs.

You can live with this. Organizations do it every day. But at some point, the cost of maintaining parallel systems, retraining across platforms, and duplicating security controls starts to compound. When that happens, consolidation stops being a nice-to-have and becomes a strategic imperative.

This post is about recognizing that moment, building a compelling case for migration, and setting up a project people will actually rally behind.

## Change for Change's Sake Isn't a Strategy

Nobody wants to migrate CI/CD platforms. It's painful, it's risky, and it's one of those projects where success means "everything still works the same but different." That's a hard sell.

Before you write a single line of YAML, you need to answer one question: **why are we doing this?**

And "because GitHub Actions is newer" isn't an answer. Neither is "because our VP saw a demo at a conference." You need a real, specific, defensible reason that connects to problems people actually feel.

Here are some reasons that hold up:

### Consolidation: Eliminating Platform Sprawl

If your organization maintains multiple CI/CD platforms, every one of them carries its own overhead:

- **Separate security reviews** for each platform's integration points
- **Separate runner/agent infrastructure** to patch, scale, and monitor
- **Separate expertise silos** - your Jenkins experts don't know CircleCI, and vice versa
- **Separate onboarding paths** for every team that uses a different system

The math is straightforward. If you spend 2 FTEs maintaining Jenkins, 1.5 on CircleCI, and 0.5 on random other tools, that's 4 FTEs of platform maintenance. Consolidating to one platform doesn't eliminate all of that, but it compresses it significantly and lets you invest the savings in making that one platform excellent.

### Standardization: Making the Right Thing Easy

When every team builds their own pipelines from scratch, you get a thousand variations of the same patterns. Some teams pin their dependencies. Some don't. Some run security scans. Some skip them. Some deploy with rollback capability. Some YOLO straight to production.

The promise of a well-architected Actions platform isn't just "one CI system" - it's **template workflows and reusable components that make the right thing the easy thing**. When a Java team can adopt a standardized workflow in five minutes instead of spending a week writing pipeline scripts, you've fundamentally changed the economics of doing the right thing.

We'll dig deep into this architecture in [Part 2](/blog/2026/06/03/migrating-to-github-actions-part-2-what-good-looks-like/) and [Part 3](/blog/2026/06/03/migrating-to-github-actions-part-3-building-the-lego-blocks/).

### Developer Experience: Reducing Context Switching

If your source code is in GitHub, there's a real productivity argument for having CI/CD in GitHub too. Developers stay in one interface. PR status checks, workflow logs, deployment history, and environment approvals all live in the same place as the code. No more bouncing between tabs, no more "check the Jenkins dashboard" Slack messages.

This sounds like a minor quality-of-life improvement until you multiply it by hundreds of developers and thousands of builds per day. Context switching is expensive, and every tool boundary is a context switch.

### Compliance: One Platform to Audit

For organizations with regulatory requirements (SOC2, PCI, HIPAA, FedRAMP), fewer platforms means fewer audit surfaces. One set of access controls. One audit log. One secrets management strategy. One OIDC integration. One set of environment protection rules.

Compare that to explaining to your auditor how you enforce consistent deployment controls across three different CI/CD systems with three different permission models.

## This Is an Organizational Change, Not Just a Technical One

This is where most migrations go sideways. Someone on the platform team writes a beautiful technical migration plan, gets leadership approval, and then wonders why adoption stalls at 20%.

The reason is simple: **a CI/CD migration changes how people work every single day**. It changes their muscle memory. It changes which Slack channels they monitor. It changes how they debug failures. It changes their entire inner loop.

That makes this an organizational change initiative, and those require a different playbook than a typical infrastructure project.

### Identify Your Stakeholders (All of Them)

A CI/CD migration touches more groups than you'd expect:

| Stakeholder | What They Care About |
|---|---|
| **Development teams** | "Will my builds still work? Will I have to rewrite everything?" |
| **Security/InfoSec** | "How do we enforce policies? How are secrets managed? What's the audit story?" |
| **Platform/SRE team** | "How do we scale this? How do we monitor it? Who's on call?" |
| **Management/Leadership** | "What's the timeline? What's the risk? What's the ROI?" |
| **Compliance** | "Can we prove that required controls are enforced?" |

Each group needs a tailored message. Developers need to know their pain points are getting solved, not just relocated. Security needs to see that the new platform is at least as secure as what they have today. Leadership needs a timeline and risk mitigation plan.

### Find Your Champions

You can't mandate adoption from the top down and expect enthusiasm. Find 2-3 development teams who are already frustrated with the current system and would love to be early adopters. These teams become your proof points, your feedback loop, and your evangelists.

The best champions are:

- **Credible** with their peers (not just management-friendly)
- **Vocal** about problems with the current system
- **Willing** to tolerate some rough edges during the pilot phase
- **Representative** of different tech stacks and team sizes

### Address the Fear Factor

You already know what developers are thinking when they hear "we're migrating CI/CD":

- "Great, another thing I have to learn while still hitting my sprint commitments"
- "My pipelines work fine. Why are you breaking them?"
- "Last time we migrated something, it took six months longer than promised"

These aren't irrational concerns. Acknowledge them. Your enablement plan needs to account for the fact that developers have day jobs, and learning a new CI/CD platform isn't usually in their sprint plans.

Practical steps:

- **Provide training in the format people actually use.** Office hours, pair programming sessions, and working examples beat slide decks every time.
- **Don't ask teams to migrate during crunch time.** Coordinate with release schedules.
- **Make the migration do something for them,** not just to them. Faster builds? Easier debugging? Less boilerplate? Lead with the carrot.

## The Self-Assessment: Where Are You Today?

Before you can plan a migration, you need an honest inventory of what you're migrating from. This isn't just a technical audit - it's a political one. You need to understand which teams depend on which platforms, which pipelines are critical path, and where the bodies are buried.

### Pipeline Inventory

For each CI/CD platform currently in use, catalog:

| Dimension | Questions to Answer |
|---|---|
| **Volume** | How many pipelines exist? How many run daily? |
| **Criticality** | Which pipelines gate production deployments? |
| **Complexity** | Simple build-test? Or multi-stage with approvals, environment-specific configs, and conditional logic? |
| **Dependencies** | What plugins, integrations, or custom tooling do pipelines rely on? |
| **Ownership** | Which team owns each pipeline? Is there an owner at all? |

That last question is more important than it looks. Orphaned pipelines - pipelines where nobody knows who wrote them or why they exist - are some of the riskiest to migrate because there's nobody to validate that the migration is correct.

### Infrastructure Audit

Map out your current runner/agent infrastructure:

- **Where are agents running?** On-prem VMs? Cloud instances? Kubernetes? Developer laptops? (Please say no to that last one.)
- **What's the network topology?** Can agents reach internal services? Do they need VPN access? Are they in a DMZ?
- **How are they provisioned and maintained?** Golden images? Ansible? "Someone SSHed in and installed stuff three years ago"?
- **What's the scaling model?** Static pool? Auto-scaling? "We add more when people complain"?

This maps directly to your runner strategy for Actions. If your current agents need private network access to deploy to internal services, you'll need [self-hosted runners or GitHub-hosted runners with private networking](https://docs.github.com/en/actions/using-github-hosted-runners/connecting-to-a-private-network/about-private-networking-with-github-hosted-runners). If you need GPU or ARM architectures, that drives you toward [larger runners](https://docs.github.com/en/actions/using-github-hosted-runners/managing-larger-runners). We covered runner scaling patterns in depth in [our earlier post on the topic](/blog/2026/04/29/github-actions-runner-scaling-patterns/).

### Security and Compliance Baseline

Document your current security posture so you can prove that migration maintains (or improves) it:

- **How are secrets managed today?** Vault? Platform-native secrets? Environment variables that someone exports manually?
- **What access controls exist?** Who can modify pipelines? Who can trigger deployments?
- **Are there required checks?** Security scans, linting, tests that must pass before deployment?
- **How is the audit trail captured?** Logs? SIEM integration? "We check when something goes wrong"?

On the Actions side, you'll want to evaluate:

- **OIDC federation** for cloud credentials (eliminates stored secrets entirely)
- **Organization-level policies** for which Actions are allowed
- **Environment protection rules** for deployment gates
- **GITHUB_TOKEN** default permissions (set to read-only, always)
- **SHA pinning** for third-party Actions (tags are mutable, SHAs are not)

If you're using [repository rulesets](/blog/2026/03/10/scaling-github-rulesets-with-custom-properties/), you can enforce required workflows at scale using custom properties to target the right repos automatically.

### Plugin and Integration Mapping

Plugin mapping is where migrations stall. Every CI platform has its own ecosystem, and your teams depend on specific integrations. Build a mapping table:

| Current Plugin/Integration | GitHub Actions Equivalent | Gap? |
|---|---|---|
| SonarQube scanner plugin | `SonarSource/sonarqube-scan-action` | None |
| Artifactory upload | `jfrog/setup-jfrog-cli` | None |
| Custom deployment script | Custom composite action | **Needs development** |
| Internal notification bot | Custom action or workflow step | **Needs development** |

Items in the "Needs development" column are your risk items. Build these before the teams that depend on them begin migration. This is also where [custom Actions](/blog/2026/06/03/migrating-to-github-actions-part-3-building-the-lego-blocks/) come in.

## Planning the Migration

With the self-assessment complete, you can build a realistic plan. The keyword here is **phased**. Big-bang CI/CD migrations have a terrible track record. Phased rollouts let you learn, adjust, and build confidence incrementally.

### Phase 0: Foundation (Weeks 1-2)

Before any team migrates a single pipeline:

- **Deploy runner infrastructure.** Set up runner groups, configure networking, validate scaling behavior.
- **Implement security policies.** OIDC integration, secrets management, Action allowlists, default token permissions.
- **Build the reusable workflow library.** Create the template workflows and reusable components that teams will consume. (This is the subject of [Part 2](/blog/2026/06/03/migrating-to-github-actions-part-2-what-good-looks-like/) and [Part 3](/blog/2026/06/03/migrating-to-github-actions-part-3-building-the-lego-blocks/) in this series.)
- **Set up monitoring.** You need to see workflow run times, failure rates, and runner utilization from day one.

Phase 0 is unglamorous but critical. Skip it, and pilot teams hit infrastructure issues unrelated to pipeline logic, which kills confidence fast.

### Phase 1: Pilot (Weeks 3-4)

Select 2-3 teams for the pilot. Good pilot candidates:

- Have relatively simple pipelines (build, test, maybe a non-production deploy)
- Are enthusiastic about the migration (your champions from earlier)
- Represent different tech stacks (a Java team, a Python team, a Node team)

During the pilot:

- **Run dual pipelines.** Keep the old system running alongside Actions until you're confident the new workflows produce identical results.
- **Measure everything.** Build times, test pass rates, developer feedback.
- **Iterate on templates.** The pilot teams are your design partners. Their feedback shapes the reusable workflows that everyone else will use.

### Phase 2: CI Migration (Weeks 5-8)

Expand to remaining teams, starting with CI workloads (build and test, not deployment):

- Roll out team by team, not all at once
- Provide office hours and pairing sessions for teams doing manual conversion
- Use [GitHub Actions Importer](https://docs.github.com/en/actions/migrating-to-github-actions/using-github-actions-importer-to-automate-migrations/about-github-actions-importer) where applicable for automated conversion
- Decommission old pipelines for migrated repos (don't leave them running in parallel forever)

### Phase 3: CD Migration (Weeks 9-12)

Production deployments are the high-stakes phase:

- Implement [environment protection rules](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment) with required reviewers and wait timers
- Validate OIDC credentials work for production cloud environments
- Test rollback procedures before you need them
- Coordinate with change management processes

### Phase 4: Decommission (Week 13+)

The unsexy but essential final phase:

- Sweep for any remaining unmigrated pipelines
- Archive old CI/CD configuration (don't delete it yet - you might need to reference it)
- Decommission old agent/runner infrastructure
- Update documentation and runbooks
- Run a retrospective

### Success Metrics

Define these before you start, not after:

| Metric | How to Measure |
|---|---|
| **Migration progress** | % of repos migrated by milestone |
| **Build performance** | Mean workflow run time vs. baseline |
| **Reliability** | Workflow failure rate vs. baseline |
| **Developer satisfaction** | Survey at Phase 2 and Phase 4 |
| **Onboarding speed** | Time for a new team to adopt standard workflows |

### Risk Register

Every migration has risks. Name them explicitly so you can manage them:

| Risk | Mitigation |
|---|---|
| Runner infrastructure isn't ready on time | Start Phase 0 early; have a fallback to GitHub-hosted runners |
| Custom plugins have no Actions equivalent | Identify in self-assessment; build custom actions before teams need them |
| Teams don't have bandwidth to migrate | Coordinate with sprint planning; provide migration assistance |
| Security review blocks the timeline | Involve InfoSec from day one, not as a gate at the end |
| Migration takes longer than estimated | Phased approach limits blast radius; extend timeline rather than cutting corners |

## What Comes Next

If you've made it this far, you've got the organizational alignment piece. You know *why* you're migrating, you've inventoried *what* you're migrating from, and you've got a phased plan for *how* to get there.

But we haven't talked about the most important part: **what does the target state actually look like?** How do you structure template workflows, reusable workflows, and custom Actions so that the platform team can manage standards centrally while development teams retain autonomy?

That's exactly what [Part 2: What Good Looks Like](/blog/2026/06/03/migrating-to-github-actions-part-2-what-good-looks-like/) covers. We'll walk through the architecture of a layered workflow system where dev teams pick a template, that template calls standardized reusable workflows, and those workflows compose security scanning, SRE operations, and language-specific best practices - all managed by the teams who own those concerns.

## Summary and Key Takeaways

**Pre-flight checklist:**

- [ ] **Find your real reason.** Consolidation, standardization, developer experience, compliance - pick the ones that resonate with your organization.
- [ ] **Treat this as an organizational change,** not just a technical project. Identify stakeholders, find champions, address fears.
- [ ] **Do the self-assessment honestly.** Inventory pipelines, audit infrastructure, map plugins, document security controls.
- [ ] **Plan in phases.** Foundation, pilot, CI migration, CD migration, decommission. Each phase has entry and exit criteria.
- [ ] **Define success metrics upfront.** You can't prove the migration was worth it if you didn't measure the baseline.
- [ ] **Involve security from day one.** Not as a gate at the end, but as a design partner from the start.

A CI/CD migration done right is a force multiplier. Done wrong, it's a multi-month distraction that makes everyone's life harder. The difference is almost entirely in the planning.

*Next up: [Part 2 - What Good Looks Like](/blog/2026/06/03/migrating-to-github-actions-part-2-what-good-looks-like/)*
