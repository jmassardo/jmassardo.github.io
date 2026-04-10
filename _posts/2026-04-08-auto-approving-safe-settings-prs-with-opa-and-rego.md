---
layout: post
title: "Auto-Approving safe-settings PRs with OPA and Rego"
date: 2026-04-08 10:00:00 -0500
category: Blog
tags: [github, devops, automation, security, policy-as-code, ci-cd, opa, rego]
excerpt: "Use OPA and Rego to validate safe-settings YAML configurations in PRs and automatically approve changes that conform to your organization's standards."
---

If you manage GitHub repositories at scale, you've probably found [safe-settings](https://github.com/github/safe-settings). It lets you define your repository configurations -- branch protections, team access, collaborators, labels, and more -- as YAML files stored in a central `admin` repository. Config-as-code for your GitHub org. Beautiful.

Here's the thing though: that `admin` repo fills up with PRs fast. Developers, team leads, and platform engineers are constantly submitting changes to settings files. Most of those changes are completely fine -- adding a new team, updating a description, tweaking a topic. But someone still has to review and approve them, and that rubber-stamp review process is exactly the kind of toil that should be automated.

This post walks through using [Open Policy Agent (OPA)](https://www.openpolicyagent.org/) and its Rego policy language to automatically validate safe-settings YAML files and approve PRs that conform to your standards -- no human reviewer required for the routine stuff.

## The Components

Before building anything, let's get everyone on the same page about what each piece does.

### safe-settings

[safe-settings](https://github.com/github/safe-settings) is a GitHub App that manages repository settings as policy-as-code. All configuration lives in an `admin` repository within your org, structured like this:

```
admin/
├── .github/
│   ├── settings.yml          # Org-wide defaults applied to every repo
│   ├── suborgs/              # Team or project-level overrides
│   │   └── platform-team.yml
│   └── repos/                # Repo-specific overrides
│       └── my-service.yml
```

The hierarchy is: **org-level settings** form the baseline, **suborg-level settings** override them for specific teams or projects, and **repo-level settings** are the most specific. When a PR is opened against the default branch, safe-settings runs in dry-run mode and posts a check with what would change. Merge to default, and the settings are applied.

A typical `settings.yml` looks like this:

```yaml
repository:
  private: true
  has_issues: true
  allow_squash_merge: true
  allow_merge_commit: false
  delete_branch_on_merge: true

branches:
  - name: default
    protection:
      required_pull_request_reviews:
        required_approving_review_count: 1
        dismiss_stale_reviews: true
        require_code_owner_reviews: true
      required_status_checks:
        strict: true
        contexts: []
      enforce_admins: true
      restrictions:
        apps: []
        users: []
        teams: []

teams:
  - name: platform-admins
    permission: admin
  - name: developers
    permission: push
```

### OPA and Rego

[Open Policy Agent (OPA)](https://www.openpolicyagent.org/) is a general-purpose, open source policy engine and a CNCF graduated project. You write policies in **Rego** (pronounced "ray-go") -- a high-level declarative language purpose-built for expressing policies over structured data.

The key insight: your safe-settings YAML files are just structured data. OPA doesn't care whether it's evaluating Kubernetes admission requests, Terraform plans, or safe-settings YAML. If it can be represented as JSON, OPA can reason about it.

A simple Rego policy:

```rego
package main

import rego.v1

deny contains msg if {
    input.repository.visibility == "public"
    msg := "Repositories must not be public"
}
```

OPA evaluates your YAML against these policies and returns either a clean result or a list of violations with descriptive messages.

### conftest

[conftest](https://www.conftest.dev/) is a command-line tool that bridges OPA and your config files. It handles parsing YAML (and HCL, JSON, Dockerfiles, and more), passes the parsed data to OPA, and returns structured results you can act on in CI.

```bash
conftest test .github/settings.yml --policy policy/
```

conftest looks for `deny`, `warn`, and `violation` rules in your Rego policies. `deny` fails the check and sets a non-zero exit code (blocking the pipeline). `warn` surfaces the issue but keeps the exit code clean.

### GitHub Actions

GitHub Actions is the orchestrator that ties everything together. When a PR is opened against the `admin` repo, a workflow:

1. Identifies which settings YAML files changed in the PR
2. Runs conftest against those files with your Rego policies
3. If every check passes, calls the GitHub API to auto-approve the PR

## Defining Your Policy Requirements

Before writing Rego, nail down what "conforming" actually means for your org. A solid starting baseline for safe-settings configurations:

| Requirement | Why |
|---|---|
| Branch protection enabled on default branch | Prevents direct pushes |
| Required reviewers >= 1 | At least one approval before merge |
| `dismiss_stale_reviews` is true | No merging after new commits bypass review |
| `enforce_admins` is true | Admins can't bypass protections |
| Teams can't have `admin` at the repo level | Only org-level teams should be admins |
| Repository must not be public | Enforce private-by-default |

Now let's translate those requirements into Rego.

## Writing the Rego Policies

Create a `policy/` directory in your `admin` repo. Each `.rego` file here will be evaluated by conftest.

### policy/settings.rego

```rego
package main

import rego.v1

# Repository must not be public
deny contains msg if {
    input.repository.visibility == "public"
    msg := "Repository visibility must not be 'public' - use 'private' or 'internal'"
}

# Branch protection must be configured for the default branch
deny contains msg if {
    count([b | b := input.branches[_]; b.name == "default"]) == 0
    msg := "Branch protection must be configured for the 'default' branch"
}

# Required reviewers must be at least 1
deny contains msg if {
    some branch in input.branches
    branch.name == "default"
    branch.protection.required_pull_request_reviews.required_approving_review_count < 1
    msg := "Default branch must require at least 1 approving review"
}

# Stale reviews must be dismissed
deny contains msg if {
    some branch in input.branches
    branch.name == "default"
    branch.protection.required_pull_request_reviews.dismiss_stale_reviews != true
    msg := "Default branch protection must dismiss stale reviews"
}

# enforce_admins must be true
deny contains msg if {
    some branch in input.branches
    branch.name == "default"
    branch.protection.enforce_admins != true
    msg := "Default branch protection must enforce rules for administrators"
}

# No team should have admin permission in a repo-level settings file
deny contains msg if {
    some team in input.teams
    team.permission == "admin"
    msg := sprintf("Team '%v' cannot be granted 'admin' permission at the repo level", [team.name])
}

# Warn (don't block) if strict status checks are disabled
warn contains msg if {
    some branch in input.branches
    branch.name == "default"
    branch.protection.required_status_checks.strict != true
    msg := "Consider enabling strict status checks to require branches be up to date before merging"
}
```

A few notes on this Rego:

- `import rego.v1` uses modern Rego syntax, recommended for OPA v1.x+
- `deny contains msg if { ... }` is a partial set rule -- each matching condition adds a message to the `deny` set
- `warn` rules show violations in the output but don't affect the exit code, so the auto-approval still proceeds for warnings
- conftest evaluates the `main` package by default

### Testing Your Policies

Untested policies will surprise you in production. Create `policy/settings_test.rego`:

```rego
package main

import rego.v1

# A baseline config that should pass all checks
valid_config := {
    "repository": {"visibility": "private"},
    "branches": [{
        "name": "default",
        "protection": {
            "required_pull_request_reviews": {
                "required_approving_review_count": 1,
                "dismiss_stale_reviews": true
            },
            "required_status_checks": {"strict": true, "contexts": []},
            "enforce_admins": true,
            "restrictions": {"apps": [], "users": [], "teams": []}
        }
    }],
    "teams": [
        {"name": "developers", "permission": "push"}
    ]
}

test_valid_config_passes if {
    count(deny) == 0 with input as valid_config
}

test_public_repo_denied if {
    cfg := json.patch(valid_config, [{"op": "replace", "path": "/repository/visibility", "value": "public"}])
    "Repository visibility must not be 'public' - use 'private' or 'internal'" in deny with input as cfg
}

test_insufficient_reviewers_denied if {
    cfg := json.patch(valid_config, [{"op": "replace", "path": "/branches/0/protection/required_pull_request_reviews/required_approving_review_count", "value": 0}])
    count(deny) > 0 with input as cfg
}

test_admin_team_denied if {
    cfg := json.patch(valid_config, [{"op": "add", "path": "/teams/-", "value": {"name": "some-team", "permission": "admin"}}])
    count(deny) > 0 with input as cfg
}

test_no_branch_protection_denied if {
    cfg := json.patch(valid_config, [{"op": "replace", "path": "/branches", "value": []}])
    count(deny) > 0 with input as cfg
}
```

Run them locally:

```bash
conftest verify --policy policy/
```

Get into the habit of running this before every push to the `admin` repo. It's a two-second check that saves you from embarrassing validation gaps.

## The GitHub Actions Workflow

With policies written and tested, wire it all together. Create `.github/workflows/validate-settings.yml` in your `admin` repo:

```yaml
name: Validate and Auto-Approve Settings PRs

on:
  pull_request:
    paths:
      - '.github/settings.yml'
      - '.github/repos/**'
      - '.github/suborgs/**'

permissions:
  contents: read
  pull-requests: write
  checks: write

jobs:
  validate:
    name: Validate Settings
    runs-on: ubuntu-latest
    outputs:
      all_passed: ${{ steps.check.outputs.all_passed }}

    steps:
      - name: Checkout PR
        uses: actions/checkout@v4

      - name: Install conftest
        run: |
          CONFTEST_VERSION="0.57.0"
          curl -sSL "https://github.com/open-policy-agent/conftest/releases/download/v${CONFTEST_VERSION}/conftest_${CONFTEST_VERSION}_Linux_x86_64.tar.gz" \
            | tar xz conftest
          sudo mv conftest /usr/local/bin/

      - name: Get changed settings files
        id: changed-files
        run: |
          files=$(git diff --name-only origin/${{ github.base_ref }}...HEAD \
            | grep -E '^\.github/(settings\.yml|repos/|suborgs/)' || true)
          echo "all_changed_files=$files" >> "$GITHUB_OUTPUT"

      - name: Run OPA policy checks
        id: check
        run: |
          all_passed=true
          for file in ${{ steps.changed-files.outputs.all_changed_files }}; do
            echo "Checking: $file"
            if ! conftest test "$file" --policy policy/ --output github; then
              all_passed=false
            fi
          done
          echo "all_passed=$all_passed" >> "$GITHUB_OUTPUT"

  auto-approve:
    name: Auto-Approve PR
    needs: validate
    runs-on: ubuntu-latest
    if: needs.validate.outputs.all_passed == 'true'

    steps:
      - name: Approve PR
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            await github.rest.pulls.createReview({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
              event: 'APPROVE',
              body: 'All settings files conform to OPA policy. Auto-approving.'
            });
```

A few things worth calling out explicitly:

**`permissions` block** -- `pull-requests: write` is the minimum scope needed for the auto-approve step. Don't grant more than necessary. `checks: write` lets conftest post inline annotations on the PR diff.

**`if` condition on `auto-approve`** -- The approval only triggers when every policy check passes. Any violation skips the job entirely. No approval, PR stays pending until the author fixes it and pushes a new commit.

**`--output github`** -- Tells conftest to emit GitHub Actions annotations alongside the standard output. Failed checks show up as inline comments on the exact lines in the diff. Much cleaner than sifting through raw logs.

## What Happens When Policies Fail

When a PR violates a policy, the workflow posts inline annotations directly on the changed files, like:

```
FAIL - .github/repos/my-service.yml - Team 'some-team' cannot be granted 'admin' permission at the repo level
FAIL - .github/repos/my-service.yml - Default branch must require at least 1 approving review

2 tests, 0 passed, 0 warnings, 2 failures, 0 exceptions
```

No approval is granted. The PR author sees exactly what's wrong, fixes it, and pushes. The workflow reruns automatically, and if everything passes, the auto-approval fires.

## Security Considerations

Before enabling this in production, think through a few things:

**Bot approval and branch protection** -- Your branch protection requires N approvals before merge. This workflow's auto-approval counts as one. If you only require 1 approval, a developer could push a conforming-but-questionable config, get auto-approved, and merge without human eyes. Consider requiring 2 approvals: one from the bot (mechanical correctness) and one from a human (reasonableness).

**CODEOWNERS** -- Use a `CODEOWNERS` file in the `admin` repo to require specific teams to review changes in specific paths. The bot handles "does this meet our schema standards?" while CODEOWNERS handles "is this a reasonable change for this team to make?"

**Token scope** -- The `GITHUB_TOKEN` is scoped to the repository and expires after the workflow run. This is exactly right. Don't use a PAT here unless you have a specific reason to, and if you do, give it the minimum required scopes.

**Policy coverage** -- These policies catch structural issues. They do not catch semantic problems like "this team shouldn't have push access to this particular service." Keep humans in the loop for changes that touch permissions in sensitive repos.

## Final Repository Structure

Here's what your `admin` repo looks like when everything is wired up:

```
admin/
├── .github/
│   ├── settings.yml              # Org-wide defaults
│   ├── suborgs/
│   │   └── platform-team.yml
│   ├── repos/
│   │   └── my-service.yml
│   └── workflows/
│       └── validate-settings.yml # The workflow
└── policy/
    ├── settings.rego             # The OPA policies
    └── settings_test.rego        # Policy unit tests
```

A complete working example with all of this in place (including sample settings files and a full policy suite) is available at [github.com/jmassardo/safe-settings-opa-example](https://github.com/jmassardo/safe-settings-opa-example).

## Summary and Key Takeaways

You now have a complete system: safe-settings manages your repo configs as code, OPA/Rego defines what "valid" looks like, conftest evaluates files against those policies in CI, and GitHub Actions auto-approves PRs that pass.

**Here's your action plan:**

1. **Define your standards first** -- Write down what a conforming settings file looks like before writing any Rego. What fields are required? What values are forbidden? Get agreement from your team before encoding it in policy.

2. **Write and test your policies** -- Use `conftest verify` locally before pushing. Untested policies will fire on things you didn't intend.

3. **Roll out with `warn` before `deny`** -- Introduce new requirements as warnings first. Watch what fires for a week or two, then promote to `deny` once you've verified the signal-to-noise ratio is acceptable.

4. **Layer your approvals** -- Use the bot approval for schema conformance and CODEOWNERS for semantic sign-off. Don't eliminate all human review; eliminate the toil that doesn't require human judgment.

5. **Treat policies like code** -- The `policy/` directory should go through the same PR review, testing, and change management process as everything else. Add a CODEOWNER for it.

The result is a system where routine changes merge with zero manual review time, while genuinely interesting changes still land in front of the right people. That's the goal: not removing humans from the loop, but removing them from the parts of the loop where they add no value.

## Closing

*Have questions or want to share how you're using OPA for GitHub automation? Find me on [GitHub](https://github.com/jmassardo), [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), or [Bluesky](https://bsky.app/profile/jmassardo.bsky.social).*
