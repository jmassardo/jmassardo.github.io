---
layout: post
title: "CI Health at Enterprise Scale: Finding and Fixing Pipeline Failures Across Hundreds of Orgs"
date: 2026-06-30 10:00:00 -0500
category: Blog
tags: [ci, devops, github-actions, pipelines, reliability, automation, enterprise, platform-engineering]
excerpt: "A flaky, red pipeline is a tax on every engineer. At enterprise scale  -  hundreds of orgs, tens of thousands of repos  -  that tax becomes existential. Here's how a CI/CD platform team approaches health at scale."
---

A red pipeline is easy to ignore when it's one team's problem. But when you're responsible for CI health across hundreds of GitHub organizations and tens of thousands of repositories, "someone will fix it" is not a strategy.

At enterprise scale, CI health isn't a developer experience nicety  -  it's an operational and business risk. A systemic flakiness problem that costs each developer 20 minutes a day multiplied across 5,000 engineers is 1,600+ engineering hours lost every single day.

This post covers two levels: the fundamentals that apply to any team, and the platform engineering patterns that let a central CI/CD team actually manage health at fleet scale.

## Why CI Health Matters More Than You Think

CI is the first line of defense between a developer's local environment and production. When it's healthy, it's nearly invisible  -  code goes in, tests run, feedback comes back fast. When it's broken, everything slows down.

More importantly, degraded CI health is usually a symptom of deeper problems: unclear ownership, insufficient test coverage, environment drift, or a team that's moving faster than their safety nets can handle.

The cost isn't just time lost waiting for builds. It's:

- **Developer trust erosion**  -  engineers stop believing the pipeline will catch problems
- **Alert fatigue**  -  teams learn to ignore failures, missing real regressions
- **Slower feedback loops**  -  every extra minute of CI time compounds across the team
- **Increased production risk**  -  if you can't trust your CI, you can't trust your deploys

## Diagnosing CI Health

Before you fix anything, you need to understand what's actually broken. Resist the urge to jump directly into fixes. Start with data.

### 1. Categorize Your Failures

Not all failures are equal. Start by classifying them:

- **Real failures**  -  legitimate test failures caused by actual code problems
- **Flaky failures**  -  tests or steps that fail intermittently without code changes
- **Infrastructure failures**  -  runner issues, timeouts, network problems, resource exhaustion
- **Configuration failures**  -  broken environment variables, missing secrets, dependency version drift

Each category has a different resolution strategy. Lumping them together leads to whack-a-mole debugging.

### 2. Measure, Don't Guess

If you're running GitHub Actions, your workflow run history is a goldmine. Look at:

- **Failure rate per workflow**  -  which workflows fail most often?
- **Failure rate per job/step**  -  which specific steps are flaky?
- **Time trends**  -  did failures spike after a recent change?
- **Duration trends**  -  are builds getting slower, increasing timeout risk?

You can query the GitHub API directly, use the GitHub CLI, or pull this into a dashboard with something like Grafana or a simple script.

```bash
# List recent failed runs for a workflow
gh run list --workflow=ci.yml --status=failure --limit=50
```

### 3. Look for Patterns

Once you have data, look for patterns:

- Does the same step fail repeatedly? Likely flaky or environment-dependent.
- Do failures cluster at certain times of day? Possible infrastructure or resource contention.
- Did failures start after a specific PR merged? Likely a real regression.
- Do failures happen only on specific runners or platforms? Infrastructure or environment drift.

## Common Failure Categories and Fixes

### Flaky Tests

Flaky tests are one of the most corrosive CI health problems. They create noise, slow down investigation, and are easy to dismiss.

**Finding them:** Look for tests that fail without corresponding code changes. Track which test names appear across multiple unrelated failures.

**Fixing them:**
- Identify and quarantine flaky tests with a dedicated label or tag
- Investigate root cause  -  race conditions, shared state, timing dependencies, network calls
- Prefer retry-with-backoff for tests with legitimate external dependencies
- Delete tests that can't be made reliable  -  a flaky test provides no signal

**One rule:** never re-run a flaky test to "fix" a failing build without tracking the underlying issue. Re-runs hide problems.

### Infrastructure and Runner Issues

Timeouts, out-of-memory errors, and runner-level failures are often invisible unless you're looking for them.

**Common causes:**
- Builds that have grown to exceed runner resource limits
- Network calls to external services timing out in CI
- Caching issues causing cold starts and slow dependency installs
- Shared runner pools under load at peak times

**Fixes:**
- Audit job resource usage and right-size your runners
- Add explicit timeouts to every job and step  -  don't rely on defaults
- Cache aggressively and verify cache hit rates
- Use self-hosted runners for resource-intensive workloads

### Dependency and Environment Drift

"It works on my machine" often means "my machine has a different environment than CI." This mismatch causes subtle, intermittent failures that are hard to reproduce.

**Prevention:**
- Pin dependencies explicitly  -  use lockfiles (Gemfile.lock, package-lock.json, etc.) and commit them
- Use container-based jobs to enforce environment consistency
- Treat runner OS and toolchain versions as explicit dependencies, not assumptions
- Document required environment versions in your repo

### Long Build Times

Slow CI is a form of CI failure. If builds take 45 minutes, developers stop waiting for feedback and start batching changes, which makes debugging harder.

**Attack slow builds by:**
- Parallelizing independent jobs and test suites
- Using caching for dependencies and build outputs
- Running only affected tests on PRs using path filters
- Profiling job timing and cutting the long tail

## Building a Culture of CI Health

Fixing CI once is easy. Keeping it fixed requires changing how your team thinks about pipeline health.

### Make Health Visible

A dashboard showing pass rate, flaky test count, and average build duration puts CI health in front of the team. What gets measured gets managed.

### Set a "Green by Default" Expectation

Make it clear: the default state of the pipeline is green. A failing main branch is an incident, not background noise. Someone owns getting it back to green.

### Give Tests Clear Ownership

Flaky tests fester when nobody owns them. Tie test files to teams or individuals. When a test consistently fails, there's someone accountable for investigating it.

### Review CI Changes Like Production Changes

Workflow files are infrastructure. Changes to CI should go through the same review process as other critical systems  -  including consideration for how failures could impact the team.

### Automate Flakiness Tracking

Build (or adopt) tooling that automatically tracks which tests are flaky over time. GitHub Actions has some observability built in; third-party tools like BuildPulse, Trunk, or Datadog CI Visibility can automate flakiness detection at scale.

## Practical Starting Point (Single Team)

If your CI is in rough shape and you don't know where to start:

1. **Pull the last 30 days of failed runs** and categorize them
2. **Find your top 5 failure causes** (specific steps, specific workflows)
3. **Eliminate your top flaky test**  -  just one, end to end
4. **Add a timeout to every job that doesn't have one**
5. **Make the failure rate visible** somewhere the team will see it

Don't try to fix everything at once. Pick the highest-signal failures, resolve them fully, and build momentum.

---

## Scaling This to Enterprise: Hundreds of Orgs, Tens of Thousands of Repos

Everything above applies at the team level. But if you're a platform engineering or CI/CD team responsible for the entire company's pipeline fleet, the problems are fundamentally different. You can't manually investigate failing workflows across 40,000 repos. You need systems.

This is a coordination and architecture problem as much as a technical one.

### The Platform Team's Job Is Different

An individual team asking "why is our CI broken?" looks at their own workflow history. A platform team asking "what is the health of our CI fleet?" needs a different mental model entirely.

Your job as a platform team is not to fix every broken pipeline. It's to:

1. **Make health measurable** across the entire fleet
2. **Standardize** the patterns teams use so you can reason about them at scale
3. **Detect systemic problems** before individual teams even notice
4. **Enable teams** to self-serve fixes within guardrails you define

### 1. Centralized Observability: Build the Fleet View

You cannot manage what you cannot see. The GitHub REST and GraphQL APIs give you access to workflow run data across every org and repo  -  but you need to ingest it at scale and put it somewhere queryable.

**Architecture pattern:**

```
GitHub Webhooks (workflow_run events)
        │
        ▼
Event ingestion layer (e.g., Azure Event Hubs, AWS Kinesis, or a simple webhook receiver)
        │
        ▼
Time-series or columnar store (e.g., ClickHouse, BigQuery, or Postgres with partitioning)
        │
        ▼
Dashboards (Grafana, Looker, or a custom internal tool)
```

Subscribe to `workflow_run` webhook events at the organization level. Each event contains the repo, workflow name, conclusion, run duration, head branch, and triggering actor. Pipe these into a data store and you have a real-time fleet health picture.

Key metrics to track per repo, per org, and fleet-wide:

- **Pass rate** (rolling 7-day and 30-day)
- **Flaky rate**  -  runs that failed then succeeded without a code change
- **P50/P95 duration** per workflow
- **Queue wait time**  -  time between trigger and first runner pickup
- **Re-run rate**  -  a proxy for flakiness when you don't have test-level data

This data pipeline is your single most valuable investment in CI fleet health. Without it, you're flying blind.

### 2. Standardize with Reusable Workflows and Composite Actions

One of the biggest enterprise CI anti-patterns is 40,000 repos each with subtly different workflow files. Some pin action versions. Some don't. Some have timeouts. Most don't. Half use a deprecated runner label.

When every repo is a snowflake, you can't fix systemic problems at scale. An action deprecation becomes 40,000 individual PRs. A security patch to a shared build step requires hunting down every consumer.

**The fix: reusable workflows and composite actions as a platform product.**

Reusable workflows (`.github/workflows/` in a shared repo, called with `uses:`) let you define the standard build, test, and deploy patterns once. Teams consume them with minimal configuration:

```yaml
# In any repo's .github/workflows/ci.yml
jobs:
  build:
    uses: my-org/platform-workflows/.github/workflows/build.yml@v2
    with:
      language: java
      java-version: '21'
    secrets: inherit
```

The platform team owns the implementation. Teams own the configuration. When you need to roll out a fix  -  say, updating a pinned action version or adding a security scan step  -  you do it in one place and every consumer gets it on their next run (or immediately, if you control the ref).

**Versioning matters.** Use semver tags on your shared workflow repo. Breaking changes go in major versions. Teams that haven't opted into `@v3` keep getting `@v2`. This lets you innovate without breaking everyone at once.

### 3. Policy Enforcement at Scale with Required Workflows

Reusable workflows only help if teams use them. Required workflows (configurable at the organization level) let you mandate that specific workflows run on all repos in an org, regardless of what's in the repo itself.

Use required workflows to enforce non-negotiable platform standards:

- Security scanning (SAST, secret detection, dependency vulnerability checks)
- License compliance checks
- Required status checks before merge

This means a new repo automatically gets your security baseline the moment it's created, without any action required by the repo owner. The platform team owns the policy; individual teams can't opt out.

### 4. Fleet-Wide Remediation: Automation at Scale

Some problems aren't detectable until they're already widespread  -  a newly deprecated action, a runner label being retired, a required environment variable being renamed. When you find one of these, you have a choice: file 10,000 tickets, or automate the fix.

**Pattern: The Fleet Remediation Bot**

Build or adopt tooling that can:
1. Query the GitHub API to find all repos matching a condition (e.g., "all repos using `actions/checkout@v2`")
2. Open a PR in each repo with the fix applied
3. Track PR status across the fleet
4. Report on adoption progress over time

The GitHub CLI with scripting handles the basics. At scale, you'll want a proper service with rate limit handling, backoff, and state tracking.

```bash
# Find all repos in an org using a deprecated action
gh api graphql --paginate -f query='
  query($endCursor: String) {
    organization(login: "my-org") {
      repositories(first: 100, after: $endCursor) {
        nodes { name }
        pageInfo { hasNextPage endCursor }
      }
    }
  }' | jq -r '.data.organization.repositories.nodes[].name' | while read repo; do
  gh api repos/my-org/$repo/contents/.github/workflows \
    --jq '.[].name' 2>/dev/null | while read workflow; do
    content=$(gh api repos/my-org/$repo/contents/.github/workflows/$workflow --jq '.content' | base64 -d)
    if echo "$content" | grep -q "actions/checkout@v2"; then
      echo "$repo/$workflow"
    fi
  done
done
```

That gives you the inventory. From there, automated PRs via the API (or tools like `multi-gitter`) can push the fix at scale.

### 5. Ownership Mapping: Who Fixes What

At 40,000 repos, "everyone owns their own CI" is not a coherent strategy. You need a model that answers: when a repo's CI health degrades, who is responsible and how do they find out?

**Pattern: CODEOWNERS for CI health**

Extend your ownership model to include workflow files explicitly. A `CODEOWNERS` entry like:

```
.github/workflows/  @my-org/platform-ci-team @repo-owner-team
```

...means both the platform team and the repo team get notified on changes to workflow files. The platform team watches for anti-patterns; the repo team owns their own pipeline health.

For fleet-level ownership reporting, build a registry that maps repos to teams (GitHub's Teams API provides this) and join that against your health metrics. Now you can answer: "Which teams have the worst CI pass rates?" and route those insights to engineering leadership.

### 6. Tiered Response: Triage at Scale

Not every failing repo deserves the same response. Triage your fleet by severity:

| Tier | Condition | Response |
|------|-----------|----------|
| **Critical** | Main branch CI broken on a tier-1 service | Automated alert to team + platform team on-call |
| **High** | Pass rate < 80% for 7+ days | Automated issue filed, reported in weekly health digest |
| **Medium** | Pass rate 80–90% or P95 duration > 30 min | Flagged in dashboard, team notified asynchronously |
| **Low** | Pass rate > 90% but trending down | Visible in fleet dashboard for team self-service |

Automate the triage. Use your webhook-fed data store to run periodic queries and trigger notifications. PagerDuty, GitHub Issues, Slack  -  the delivery mechanism matters less than the consistency.

### 7. Self-Service Tooling for Teams

The platform team can't fix every individual team's CI problems. The goal is to make the right thing easy and the wrong thing hard.

Invest in:

- **A CI health dashboard** teams can use to investigate their own repos
- **Runbooks** linked directly from failure notifications so teams know how to fix common problems
- **Golden path documentation** covering the standard onboarding pattern for new repos
- **A feedback channel** where teams can report platform-level issues they're seeing

The platform team sets the foundation. Individual teams maintain their own pipelines within it. This division works only if the platform is actually easy to use  -  if it isn't, teams work around it, and you're back to snowflakes.

### 8. Treating Platform CI as a Product

The final mindset shift: your CI platform is a product. Your customers are the engineering teams. You have SLAs (implicit or explicit). You need a roadmap. You get feedback. You have to handle breaking changes gracefully.

This means:

- **Versioning your reusable workflows** and communicating breaking changes in advance
- **Running your own CI** on the platform workflows themselves  -  eat your own cooking
- **Tracking adoption** of platform-standard workflows as a product metric
- **Running office hours or async channels** for CI support questions
- **Deprecating old patterns** with migration paths, not just removal

When a platform team operates like a product team, trust in the platform grows. When they operate like infrastructure gatekeepers, teams route around them.

---

## Practical Starting Point (Platform Team)

If you're a platform team inheriting a chaotic fleet:

1. **Stand up webhook ingestion** for `workflow_run` events  -  even a simple database and a basic dashboard. Data first.
2. **Identify your top 10 most-failed workflows across the fleet**  -  you'll find systemic patterns immediately
3. **Publish your first reusable workflow** for the most common build pattern in your stack
4. **Pilot required workflows** in one org with security scanning as the mandatory check
5. **Build the ownership map**  -  repos to teams  -  so you can route health data to the right people

The data pipeline and the ownership map are the two foundations everything else depends on. Get those right and the rest follows.

## Takeaways

- A healthy CI pipeline is invisible. An unhealthy fleet is a silent tax on thousands of engineers.
- Classify failures before fixing them  -  flaky, infrastructure, real, and config failures need different solutions.
- At team scale: measure, categorize, fix the highest-signal problems, build culture.
- At fleet scale: centralize observability, standardize with reusable workflows, enforce policy with required workflows, automate remediation.
- "Re-run to fix" is not a fix at any scale  -  it's debt with compounding interest.
- CI health is a platform product problem at enterprise scale. Treat it like one.

Your pipeline should help your engineers ship faster and safer. At 40,000 repos, that's not a wish  -  it's an engineering discipline.

