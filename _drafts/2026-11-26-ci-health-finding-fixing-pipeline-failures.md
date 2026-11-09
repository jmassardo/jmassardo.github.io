---
layout: post
title: "CI Health at Enterprise Scale: Finding and Fixing Pipeline Failures Across Hundreds of Orgs"
date: 2026-11-26 10:00:00 -0600
category: Blog
tags: [ci, devops, github-actions, pipelines, reliability, automation, enterprise, platform-engineering]
excerpt: "A flaky, red pipeline is a tax on every engineer. At enterprise scale  -  hundreds of orgs, tens of thousands of repos  -  that tax becomes existential. Here's how a CI/CD platform team approaches health at scale."
---

A red pipeline is easy to ignore when it's one team's problem. But when you're responsible for CI health across hundreds of GitHub organizations and tens of thousands of repositories, "someone will fix it" is not a strategy.

At enterprise scale, CI health isn't a developer experience nicety  -  it's an operational and business risk. A systemic flakiness problem that costs each developer 20 minutes a day multiplied across 5,000 engineers is 1,600+ engineering hours lost every single day.

This post covers two levels: the fundamentals that apply to any team, and the platform engineering patterns that let a central CI/CD team actually manage health at fleet scale.

**Fact-check anchor: November 3, 2026.** Enterprise policy examples below use current rulesets, not the retired standalone required-workflows feature.

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

That's a sample, not a 30-day census. For a date-bounded export, use the [workflow runs REST API](https://docs.github.com/en/rest/actions/workflow-runs#list-workflow-runs-for-a-repository) with `created`, `per_page=100`, and pagination. Filtered searches return at most **1,000 runs**, so partition busy repositories into smaller time windows.

**Missing checks are not passing checks.** Track expected workflows by event and commit, then distinguish success, failure, cancellation, skipped jobs, pending checks, and missing coverage. A quiet dashboard can mean broken triggers or missing access, not healthy CI.

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
- Replace or remove unreliable tests only after deciding how to preserve the coverage they were meant to provide

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
- Running only affected tests on PRs while keeping an always-reported required gate
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

You cannot manage what you cannot see. Use the GitHub **REST Actions API** for run, job, and log data. GraphQL helps with repository metadata and ownership. Access is limited to the repositories your identity can read; an enterprise role alone does not make every private repo observable.

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

Subscribe to [`workflow_run` webhooks](https://docs.github.com/en/webhooks/webhook-events-and-payloads#workflow_run) through organization webhooks or a GitHub App installed on the target repositories. A read-only collector typically needs **Actions: read** plus repository metadata access; add **Contents: read** only for workflow inventory.

The payload identifies the repository, workflow, branch, actor, conclusion, and run timestamps. Fetch [jobs for each run attempt](https://docs.github.com/en/rest/actions/workflow-jobs#list-jobs-for-a-workflow-run-attempt) to calculate execution duration and queue wait accurately. `updated_at` is not a dedicated completion-duration field.

Validate webhook signatures, deduplicate deliveries, and key records by repository, run ID, and attempt. Backfill through REST to cover missed deliveries and re-runs. Track `workflow_job` events if you need job-level live queue telemetry.

Key metrics to track per repo, per org, and fleet-wide:

- **Pass rate** (rolling 7-day and 30-day)
- **Suspected flaky rate**  -  failed runs that later succeeded at the same SHA (correlate with test results before calling a test flaky)
- **P50/P95 duration** per workflow
- **Queue wait time**  -  distinguish job queue delay from environment approval waits and dependency waits
- **Re-run rate**  -  a proxy for flakiness when you don't have test-level data

This data pipeline is your single most valuable investment in CI fleet health. Without it, you're flying blind.

### 2. Standardize with Reusable Workflows and Composite Actions

One of the biggest enterprise CI anti-patterns is 40,000 repos each with subtly different workflow files. Some pin action versions. Some don't. Some have timeouts. Most don't. Half use a deprecated runner label.

When every repo is a snowflake, you can't fix systemic problems at scale. An action deprecation becomes 40,000 individual PRs. A security patch to a shared build step requires hunting down every consumer.

**The fix: reusable workflows and composite actions as a platform product.**

Reusable workflows (`.github/workflows/` in a shared repo, called with `uses:`) let you define the standard build, test, and deploy patterns once. Teams consume them with minimal configuration:

```yaml
# In any repo's .github/workflows/ci.yml
name: CI
on:
  push:
  pull_request:
  merge_group:
permissions:
  contents: read
jobs:
  build:
    uses: my-org/platform-workflows/.github/workflows/build.yml@v2
    with:
      language: java
      java-version: '21'
```

The platform team owns the implementation. Teams own the configuration. The sample assumes a real shared `build.yml` with those inputs, authorized cross-repository access, and no required secrets. Pass named secrets only when needed, rather than automatically using `secrets: inherit`.

**Versioning matters.** `@v2` above is an illustrative rolling major tag, not an immutable pin. Moving it updates consumers on their next run, but also changes their trusted code without a consumer PR. For production, pin the verified full commit SHA and use update PRs for rollout. Keep release tags for human-friendly versioning. See [reusing workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows) and [secure action pinning](https://docs.github.com/en/actions/reference/security/secure-use#using-third-party-actions).

### 3. Policy Enforcement at Scale with Required Workflows

Reusable workflows only help if teams use them. The current mechanism is a branch ruleset's **Require workflows to pass before merging** rule, configured at the organization or enterprise level. Use [required workflows through repository rules](https://github.blog/changelog/2023-10-11-requiring-workflows-with-repository-rules-is-generally-available/), not the retired standalone Actions required-workflows mechanism.

Use required workflows to enforce non-negotiable platform standards:

- Mandatory platform validation implemented by compatible workflows
- License compliance checks
- Required status checks before merge

Target the intended repositories and PR-only branches, then pilot in **Evaluate** mode before activating enforcement. This gates merges, not every push or every repository-creation event. Document authorized bypass actors and exceptions rather than promising nobody can opt out.

Ruleset workflows support `pull_request`, `pull_request_target`, and `merge_group`, not arbitrary CI event coverage. Include `merge_group` when using a merge queue. Avoid privileged `pull_request_target` execution of untrusted code. Source-repository visibility and Actions sharing policies must allow every target repository to use the workflow.

Ruleset workflows ignore event filters such as `paths`, `branches`, and `types`, and use the supported events' default activity types. Target branches through the ruleset itself. Keep mandatory gates always reported; a skipped workflow is not evidence that your baseline ran.

**CodeQL is a special case:** ruleset workflows cannot use `github/codeql-action/init` or `analyze`; `upload-sarif` is the exception. Use supported code scanning setup and the **Require code scanning results** rule instead. See [available rules and workflow restrictions](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#require-workflows-to-pass-before-merging) and [ruleset troubleshooting](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/troubleshooting-rules).

### 4. Fleet-Wide Remediation: Automation at Scale

Some problems aren't detectable until they're already widespread  -  a newly deprecated action, a runner label being retired, a required environment variable being renamed. When you find one of these, you have a choice: file 10,000 tickets, or automate the fix.

**Pattern: The Fleet Remediation Bot**

Build or adopt tooling that can:
1. Query the GitHub API to find all repos matching a condition (e.g., "all repos using `actions/checkout@v2`")
2. Open a PR in each repo with the fix applied
3. Track PR status across the fleet
4. Report on adoption progress over time

The GitHub CLI with scripting handles the basics. At scale, you'll want a proper service with rate limit handling, backoff, and state tracking.

```python
# inventory.py - read-only example; requires Python 3 and authenticated gh
import json
import re
import subprocess
import sys
from urllib.parse import quote

org = sys.argv[1]  # python3 inventory.py my-org

def api(endpoint, *args):
    result = subprocess.run(
        ["gh", "api", endpoint, *args],
        check=True, capture_output=True, text=True,
    )
    return result.stdout

pages = json.loads(api(f"orgs/{quote(org, safe='')}/repos?per_page=100",
                       "--paginate", "--slurp"))
for repo in (r for page in pages for r in page):
    if repo["archived"] or repo["disabled"]:
        continue
    name = repo["full_name"]
    try:
        # Read all workflow files at the same default-branch snapshot.
        branch = quote(repo["default_branch"], safe="")
        sha = json.loads(api(f"repos/{name}/commits/{branch}"))["sha"]
        entries = json.loads(api(
            f"repos/{name}/contents/.github/workflows?ref={sha}"
        ))
        for entry in entries:
            if entry["type"] != "file" or not entry["name"].endswith((".yml", ".yaml")):
                continue
            path = quote(entry["path"], safe="/")
            content = api(
                f"repos/{name}/contents/{path}?ref={sha}",
                "-H", "Accept: application/vnd.github.raw+json",
            )
            if re.search(r"actions/checkout@v2(?:[.\s'\"#]|$)", content):
                print(f"MATCH\t{name}\t{entry['path']}\t{sha}")
    except subprocess.CalledProcessError as error:
        # A 404 may mean no workflow directory OR hidden/inaccessible content.
        print(f"UNKNOWN\t{name}\t{error.stderr.strip()}", file=sys.stderr)
```

This is a **candidate inventory**, not a YAML parser or proof of absence. It scans visible, active repositories on the default branch only. Comments can match, and reusable-workflow dependencies need separate inspection.

The [Contents API](https://docs.github.com/en/rest/repos/contents#get-repository-content) has a **1,000-entry directory limit**; use Git Trees for unusually large directories. An installation token only sees that installation's repositories. Run across every required installation/org, record unknowns, and honor primary/secondary rate limits. See [CLI pagination](https://cli.github.com/manual/gh_api).

Review candidates before opening remediation PRs. GitHub Apps are a good fleet identity: keep collection read-only and grant the separate remediation installation only the needed Contents, Pull requests, and Workflows write permissions. No blanket enterprise-admin token required.

### 5. Ownership Mapping: Who Fixes What

At 40,000 repos, "everyone owns their own CI" is not a coherent strategy. You need a model that answers: when a repo's CI health degrades, who is responsible and how do they find out?

**Pattern: CODEOWNERS for CI health**

Extend your ownership model to include workflow files explicitly. A `CODEOWNERS` entry like:

```
.github/workflows/  @my-org/platform-ci-team @my-org/repo-owner-team
```

...requests reviews from those teams when they are visible and have explicit write access. Require code-owner review in your ruleset if it must block merging. Listing two owners does not require both to approve; one owner's approval can satisfy code-owner review. See [CODEOWNERS behavior](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners).

For fleet-level ownership reporting, build a registry that maps repos to accountable teams. The Teams API provides access relationships, not an authoritative service owner, so join it with your service catalog and CODEOWNERS. Now you can answer: "Which teams have the worst CI pass rates?" and route those insights to engineering leadership.

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
