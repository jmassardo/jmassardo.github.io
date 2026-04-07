---
layout: post
title:  "Identifying and Cleaning Up Stale GitHub Repos at Scale"
date:   2026-03-25 10:00:00 -0500
category: Blog
tags: [github, devops, automation, github-actions, api, best-practices]
excerpt: "A practical guide to auditing thousands of GitHub repositories, identifying what's truly stale, and safely archiving or cleaning up the ones you no longer need."
---

Stale repositories are the code equivalent of that pile of boxes in the corner of your garage. You haven't touched them in years, but getting rid of them feels like work, so they just... sit there. The problem is that in GitHub, those boxes accumulate license seats, storage costs, security scanning noise, and cognitive overhead for your entire engineering team.

Here's the thing: identifying and cleaning up stale repos is an entirely automatable problem. Let's talk about how to actually do it.

## What Makes a Repository "Stale"?

Before you start archiving things, define what stale actually means for your organization. There's no universal answer, but here's a useful framework:

| Signal | What It Tells You |
|--------|-------------------|
| No pushes in 12+ months | Code isn't actively changing |
| No issue or PR activity in 12+ months | No one is engaging with it (see note below) |
| No recent GitHub Actions runs | Nothing is being built or deployed |
| No recent clones or traffic | No one is consuming it |
| Original team no longer exists | Ownership is unclear |
| No README or description | Possibly abandoned work-in-progress |

> **A note on issue counts:** Don't use `open_issues_count` as a staleness signal. A repo with zero open issues might just have a team that closes tickets promptly. What you actually want is the `updated_at` timestamp on the most recent issue or comment - that tells you when a human last engaged with the project.

A single signal isn't enough. A repo with no commits might be an archived reference document that people read all the time. A repo with recent commits might be a bot pushing auto-generated content with zero human engagement. **Combine signals** before you make decisions.

**Recommended staleness criteria:** No pushes, no clones, no PR activity, and no CI runs in the last 12 months. That's a pretty safe bar.

## Step 1: Audit Your Org at Scale with the API

The GitHub REST API is your best friend here for a single-org cleanup. The key endpoint is `GET /orgs/{org}/repos`, which returns all repos with metadata including `pushed_at`, `updated_at`, `archived`, and `open_issues_count`.

> **Enterprise scale reality check:** If you're running a GitHub Enterprise with hundreds of organizations and tens of thousands of repos per org, the polling loop below will work - but it won't scale well. Each org requires a separate paginated request cycle. Each signal you want to enrich (last push, last Actions run, last issue activity, traffic) multiplies that into potentially millions of API calls. You'll hit rate limits, burn hours waiting on responses, and still end up with a point-in-time snapshot that's stale by the time you act on it. **The API approach is right for a one-time cleanup. The audit log stream is the right long-term answer for enterprises** - more on that at the end of this post.

Here's a shell script that pulls the data you need:

```bash
#!/bin/bash
# audit-repos.sh - list all org repos with staleness signals
ORG="your-org-name"
TOKEN="ghp_your_token"
CUTOFF_DATE=$(date -d "12 months ago" +%Y-%m-%d 2>/dev/null || date -v-12m +%Y-%m-%d)

PAGE=1
while true; do
  RESPONSE=$(curl -s \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/orgs/$ORG/repos?per_page=100&sort=pushed&direction=asc&page=$PAGE")

  # Check if we got results
  COUNT=$(echo "$RESPONSE" | jq 'length')
  if [ "$COUNT" -eq 0 ]; then
    break
  fi

  # Output: name, pushed_at, archived, open_issues_count, visibility
  echo "$RESPONSE" | jq -r '.[] | [.name, .pushed_at, .archived, .open_issues_count, .visibility] | @csv'
  
  PAGE=$((PAGE + 1))
done
```

> **Token scopes required:** `repo` for private repos, or `public_repo` for public only. Fine-grained tokens need `read:org` and `Contents: Read` permissions.

This gives you a CSV you can load into a spreadsheet or pipe into further processing.

> **Audit log alternative:** If you have [audit log streaming](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise) enabled (GitHub Enterprise Cloud), you can query `repo.create`, `repo.archived`, and `repo.destroy` events directly from your stream instead of polling the REST API. This is more efficient at scale and gives you a persistent event history beyond what polling provides. More on this at the end of the post.

## Step 2: Enrich with Activity Data

`pushed_at` alone won't cut it (bots can inflate it). Cross-reference with actual human activity using the repo activity endpoint:

```bash
# Get recent push activity for a specific repo
curl -s \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$ORG/$REPO/activity?activity_type=push&per_page=5"
```

**Audit log event:** `git.push` fires every time code is pushed to a repo. This event is only available via the REST API, audit log streaming, or JSON/CSV export - it does not appear in the web UI audit log view. If you're streaming audit logs, filtering on `action: git.push` scoped to a specific repo gives you a continuous, low-latency record of actual push activity without polling.

You can also check Actions runs - a repo with no recent workflow runs is likely dormant:

```bash
# Check for recent Actions runs
curl -s \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$ORG/$REPO/actions/runs?per_page=1" \
  | jq '.total_count, .workflow_runs[0].created_at'
```

**Audit log events:** `workflows.created_workflow_run` and `workflows.completed_workflow_run` are emitted for every workflow run. Like `git.push`, these are stream/API/export-only - they don't show in the web UI. If you're streaming, filtering on `action: workflows.completed_workflow_run` gives you a continuous record of CI/CD activity per repo without polling the Actions API on a cron.

### Check Issue and Comment Activity (Not Just Open Count)

Here's where a lot of audits go wrong: they look at `open_issues_count` and call it a day. That's not the signal you want. Instead, check the `updated_at` timestamp on the most recently touched issue - this captures comments, label changes, and assignee updates, not just new issue creation.

```bash
# Get the most recently updated issue or PR (includes comments)
curl -s \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$ORG/$REPO/issues?state=all&sort=updated&direction=desc&per_page=1" \
  | jq '.[0] | {number: .number, title: .title, updated_at: .updated_at, state: .state}'
```

If that returns nothing, the repo has never had an issue. If it returns something, compare `updated_at` against your staleness cutoff - not the issue state.

For a more complete picture, also check the issue comments endpoint directly:

```bash
# Get the most recent comment across all issues
curl -s \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$ORG/$REPO/issues/comments?sort=updated&direction=desc&per_page=1" \
  | jq '.[0] | {issue_url: .issue_url, updated_at: .updated_at, user: .user.login}'
```

A repo where someone left a comment last week is not stale - even if the last code push was two years ago and there are zero open issues sitting in the queue.

> **A note on audit log coverage for issues:** Regular issue activity - opening, closing, commenting, editing - is **not** captured in the audit log. Only administrative actions appear there: `issue.destroy` (permanent deletion) and `issue.pinned`/`issue.unpinned`. The same is true for comments: `issue_comment.destroy` is in the audit log, but creating or editing a comment is not. For staleness detection based on issue engagement, **the REST API approach above is the right tool** - the audit log won't help you here.

### Check Clones and Traffic

Traffic data is a strong signal that a repo is being consumed even when no one is contributing to it. A package repo with zero commits in two years but 500 clones last week is very much alive.

> **Heads up on limitations:** GitHub's traffic API only returns data for the **last 14 days**, and it requires **push access** to the repository. That means you can't run this as a read-only audit across an entire org unless you have admin-level access to each repo. Plan accordingly.

```bash
# Get clone counts for the last 14 days
curl -s \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$ORG/$REPO/traffic/clones" \
  | jq '{total_clones: .count, unique_cloners: .uniques}'
```

```bash
# Get page view counts for the last 14 days
curl -s \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$ORG/$REPO/traffic/views" \
  | jq '{total_views: .count, unique_visitors: .uniques}'
```

If both return `0` unique visitors and `0` clones, that's meaningful signal. If either shows consistent activity, take the repo off your archive list regardless of what the commit history looks like.

Because the window is only 14 days, don't use a single snapshot to make a permanent decision. If you're running the monthly Actions workflow below, consider storing the traffic numbers each run so you can build a rolling 90-day picture over time.

### A Special Case: GitHub Pages Sites

If a repo is serving a GitHub Pages site, the commit history is almost irrelevant - the site could be getting thousands of visits a week while the content hasn't changed in years. That's not stale, that's stable.

The problem is that GitHub has no API for Pages web traffic. The `traffic/views` endpoint above reflects visits to the repo on github.com, not to the published Pages URL (e.g., `https://yourorg.github.io/project-name`). There's no GitHub-native way to see how many people are hitting the live site.

What you can do is check whether Pages is even enabled before making any archiving decision:

```bash
# Check if GitHub Pages is enabled for a repo
curl -s \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$ORG/$REPO/pages" \
  | jq '{status: .status, url: .html_url, custom_domain: .cname}'
```

If this returns a `404`, Pages isn't enabled. If it returns a `status` of `built`, there's a live site. At that point, treat the repo as a **manual review** item regardless of code activity. Check with the owning team, look at any analytics the site may have (Google Analytics, Plausible, etc.), and verify whether anyone depends on the URL before archiving.

> **Note:** Archiving a repo with GitHub Pages enabled will take the site offline. GitHub will stop serving the Pages content. If there are inbound links, SEO value, or users depending on that URL, that's a real impact - not just a housekeeping decision.

**Audit log events for Pages:** `repo.pages_create` fires when a Pages site is enabled on a repo, `repo.pages_destroy` when it's deleted, and `repo.pages_source` when the source branch or folder is changed. If you're streaming audit logs, you can build a real-time inventory of Pages-enabled repos by watching for `repo.pages_create` events - and automatically flag any future new repos that enable Pages for heightened staleness review.

## Step 3: Automate the Audit as a GitHub Actions Workflow

The best audits run automatically. Here's a workflow that generates a stale repo report on a schedule and opens an issue (or comments on an existing one) with the findings:

```yaml
# .github/workflows/stale-repo-audit.yml
name: Stale Repository Audit

on:
  schedule:
    - cron: '0 8 1 * *'   # First of every month, 8am UTC
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - name: Identify stale repos
        id: find-stale
        env:
          GH_TOKEN: ${{ secrets.ORG_READ_TOKEN }}
          ORG: ${{ vars.ORG_NAME }}
        run: |
          CUTOFF=$(date -d "12 months ago" --iso-8601)
          
          # Pull all repos, filter to non-archived, pushed before cutoff
          gh api \
            --paginate \
            "/orgs/$ORG/repos?sort=pushed&direction=asc" \
            --jq ".[] | select(.archived == false) | select(.pushed_at < \"$CUTOFF\") | \
                  \"\(.name) | Last push: \(.pushed_at | split(\"T\")[0]) | Open issues: \(.open_issues_count) | \(.visibility)\"" \
            > stale_repos.txt
          
          # Enrich with last issue activity (updated_at, not open count)
          while IFS='|' read -r name rest; do
            name=$(echo "$name" | xargs)
            LAST_ISSUE=$(gh api "/repos/$ORG/$name/issues?state=all&sort=updated&direction=desc&per_page=1" \
              --jq '.[0].updated_at // "none"' 2>/dev/null)
            echo "$name |$rest| Last issue activity: $LAST_ISSUE"
          done < stale_repos.txt > stale_repos_enriched.txt
          mv stale_repos_enriched.txt stale_repos.txt
          
          COUNT=$(wc -l < stale_repos.txt)
          echo "count=$COUNT" >> "$GITHUB_OUTPUT"

      - name: Create or update tracking issue
        if: steps.find-stale.outputs.count > 0
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          COUNT=${{ steps.find-stale.outputs.count }}
          BODY="## Stale Repository Report - $(date +%Y-%m-%d)\n\n"
          BODY+="Found **$COUNT** repos with no pushes in the last 12 months:\n\n"
          BODY+="| Repo | Last Push | Open Issues | Visibility |\n"
          BODY+="|------|-----------|-------------|------------|\n"
          
          while IFS='|' read -r name pushed issues vis; do
            BODY+="| $name |$pushed |$issues |$vis |\n"
          done < stale_repos.txt
          
          BODY+="\n\nAction required: Review each repo and either archive or confirm it should remain active."
          
          echo -e "$BODY" | gh issue create \
            --repo "$GITHUB_REPOSITORY" \
            --title "Stale Repo Audit: $COUNT repos need review ($(date +%Y-%m))" \
            --label "maintenance" \
            --body-file -
```

Every month, you get a fresh issue with the current state of your org. No more mystery repos.

## Step 4: Categorize Before You Act

Once you have your list, don't just archive everything blindly. Run it through your team and categorize each repo:

| Category | Action |
|----------|--------|
| Actively used but rarely pushed (config, docs) | Mark with `archive:keep` topic, no action |
| Project is genuinely complete | Archive |
| Project was abandoned mid-work | Archive + document in README |
| Looks like a test/personal sandbox | Delete (with approvals) |
| Unknown - original owner left | Assign a new owner for review |
| Has known consumers (package, API) | Check dependents before archiving |

**Pro tip:** Before taking action on anything, use the [dependents graph](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/exploring-the-dependencies-of-a-repository) to see if other repos depend on the one you're considering cleaning up.

## Step 5: Archive via the API

Once you have a list of repos to archive, do it programmatically. One click at a time across 50 repos is not a workflow.

```bash
#!/bin/bash
# archive-repos.sh
# Usage: ./archive-repos.sh repos_to_archive.txt
TOKEN="ghp_your_token"
ORG="your-org-name"

while IFS= read -r REPO; do
  echo "Archiving $ORG/$REPO..."
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X PATCH \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/$ORG/$REPO" \
    -d '{"archived": true}')
  
  if [ "$RESPONSE" -eq 200 ]; then
    echo "  [OK] $REPO archived"
  else
    echo "  [FAIL] $REPO - HTTP $RESPONSE"
  fi
  
  # Be polite to the API
  sleep 0.5
done < "$1"
```

> **What archiving does:** Sets the repo to read-only. All code, issues, PRs, and history remain intact. No one gets locked out - they just can't push or create new issues. It's reversible.

> **What archiving does NOT do:** Delete the repo, free up storage (in most plans), or remove it from search results. It just signals "this is frozen."

**Audit log event:** `repo.archived` fires when a repo is archived. If you're streaming to a SIEM or data warehouse, you can use this event to trigger downstream cleanup automatically - notify the original team, remove the repo from active security scanning queues, update a CMDB, or kick off a documentation workflow.

**Pro tip - stamp the archive date with a custom property:** GitHub [custom properties](https://docs.github.com/en/organizations/managing-organization-settings/managing-custom-properties-for-repositories-in-your-organization) let you attach arbitrary metadata to a repo. Set an `archived_date` property (type: string, format: `YYYY-MM-DD`) at archive time so you have a queryable record of when it happened - not just that it happened.

```bash
# Set a custom property on a repo at archive time
curl -s -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/$ORG/$REPO/properties/values" \
  -d '{"properties": [{"property_name": "archived_date", "value": "'$(date +%Y-%m-%d)'"}]}'
```

You can then query all repos with a given property value across your org - useful for compliance reporting ("show me everything archived in the last year") or for automating deletion workflows after a retention window expires.

## Step 6: Transfer to an Archive Org (Warm Storage)

Archiving in place is the right first move - but some orgs go one step further before considering permanent deletion. The pattern: create a separate GitHub organization (e.g., `yourcompany-archive`) and **transfer** repos there before deleting them. Think of it as warm storage - the code still exists, it's accessible if someone panics two months later, but it's completely out of the way of your main org.

This approach has real practical value:

- Your primary org's repo list stays clean without permanently destroying anything
- You get a clear "last chance" window before deletion - set a policy like "repos transferred to the archive org are deleted after 12 months"
- The archive org can have tighter access controls - no one except platform admins can poke around in there
- It separates the decision to stop using something from the decision to destroy it

To transfer a repo via the API:

```bash
# Transfer a repo to an archive org
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/$ORG/$REPO/transfer" \
  -d "{\"new_owner\": \"yourcompany-archive\"}"
```

> **Token requirements:** The token must have admin access to the source repo and either ownership or admin access on the destination org. Transfer will fail silently if the destination org hasn't granted the token sufficient permissions.

**Audit log events:** `repo.transfer_start` fires when the transfer is initiated, `repo.transfer` fires when the receiving org accepts it. If you're streaming audit logs, you can watch `repo.transfer` events into the archive org as your signal to start the retention clock - and then automate deletion when that clock expires.

A few things to validate before transferring:

- Any deploy keys, webhooks, and GitHub Apps connected to the repo will **not** carry over - they'll need to be re-added if you ever restore the repo
- Team access is lost on transfer. You may want to add the original team as collaborators in the archive org before transferring if you want them to still be able to read the code
- If the repo has GitHub Packages published to it, packages stay in the source org - coordinate separately
- GitHub Actions secrets and variables do **not** transfer

This pattern works best when you have a clear retention policy attached to it. "Repos sit in the archive org for 180 days and are then deleted" is the kind of rule that's easy to automate and easy to communicate.

## Step 7: Deletion (for the Brave)

Deletion is permanent. Only do this for repos you are 100% certain have no value and no consumers. Before deleting:

- Check the dependency graph
- Search your CI/CD config for any references to the repo name
- Export an archive of the code via `GET /repos/{owner}/{repo}/tarball` if you want a local backup
- Get sign-off from leadership or the relevant team lead

```bash
# Export a backup before deletion
curl -L \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$ORG/$REPO/tarball" \
  -o "$REPO-backup.tar.gz"
```

Then delete:

```bash
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/$ORG/$REPO"
```

Note that deleting repos requires the `delete_repo` OAuth scope, or admin permissions on the org. If you transferred to an archive org first, run the delete script against that org, not the source.

**Audit log event:** `repo.destroy` fires when a repo is permanently deleted. This is your paper trail - make sure your audit log stream is capturing this event before you run any bulk delete scripts. If a delete goes wrong, `repo.destroy` is what you'll search for first.

## Operationalizing This Process

A one-time cleanup is great. A repeating process is better. Here's your action plan for making stale repo hygiene a habit:

**Immediate (one-time):**
- Run the audit script against your org
- Generate your initial stale repo list
- Set a triage session with 2-3 senior engineers to categorize

**Ongoing (quarterly):**
- The GitHub Actions workflow above handles monthly reporting automatically
- Quarterly review sessions to act on the report
- Archive or delete based on team input

**Preventive (policy):**
- Require a README and CODEOWNERS for all new repos
- Set a repo naming convention that includes the owning team
- Consider using [repository topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics) like `status:archived`, `status:active`, `status:deprecated` to track state explicitly
- Use [custom properties](https://docs.github.com/en/organizations/managing-organization-settings/managing-custom-properties-for-repositories-in-your-organization) to capture structured metadata like `owning_team`, `archived_date`, and `review_due` - unlike topics, custom properties are typed, can be required, and are queryable via the API across your entire org without parsing free-text strings

## Key Takeaways

- **Define staleness with multiple signals** - last push + no activity + no CI runs is a solid threshold
- **Audit with the API, not by hand** - pagination + jq handles orgs of any size
- **Categorize before acting** - not every old repo should be deleted or even archived
- **Archive first, delete with caution** - archiving is reversible; deletion is not
- **Automate the recurring audit** - a monthly GitHub Actions workflow keeps the list current without manual effort
- **Document your decisions** - update READMEs to explain why a repo is archived or what happened to the project

The goal isn't a perfectly pristine org with zero stale repos. The goal is that when your next new developer starts and browses your org, they can quickly tell what's relevant, what's dormant, and why.

## Keeping the Garage Clean Going Forward

If your organization has grown to the point where you have hundreds of orgs and tens (or hundreds) of thousands of repos, the API-based approach in this post is how you do the initial cleanup - but it's not how you manage that scale going forward. Iterating through every org, paginating every repo list, and hitting enrichment endpoints for each one just to get a current view isn't a system. It's a chore. A slow, expensive, rate-limited chore.

The audit log stream changes the equation. Every event in this post - every `git.push`, every `repo.create`, every `repo.archived` - is emitted to the stream in real time, across every org in your enterprise, without you having to ask for it. Instead of a monthly job asking "what's stale right now?", you get a continuous feed of what's *happening* right now. Process it once as it goes by, update a database, and you always have a current picture without polling anything.

The initial cleanup is work. Getting to a clean state takes effort regardless of how you do it. But keeping it clean? That becomes a solved problem the moment you start treating the audit log as a data source rather than an audit trail. Everything above is a cleanup campaign - you're going back to that pile of boxes and sorting through them. The audit log is what keeps new boxes from piling up in the first place.

Every signal we've discussed throughout this post is also emitted to the [audit log stream](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise). Instead of running a monthly cron job to ask "what's stale right now?", you can build a system that **knows from the moment a repo is created** what governance it needs - and tracks its health continuously.

### Intercept Repos at Creation

`repo.create` fires the instant a new repository is created. Stream this event and you can trigger a provisioning workflow immediately:

- Check for a README - if missing, open an issue or send a Slack message to the creator
- Verify a CODEOWNERS file exists - if not, assign the repo to a default owner team
- Apply a `status:active` topic automatically so the repo is searchable and categorized from day one
- Record the repo in your inventory with metadata (creator, team, date, visibility)

A new repo that enters the org without a README, CODEOWNERS, and team topic is a future stale repo. Stop it there.

### Build a Living Activity Score

Instead of polling the API once a month, stream these events continuously and update a staleness score per repo in real time:

| Audit Event | Signal |
|-------------|--------|
| `git.push` | Code is actively changing |
| `workflows.completed_workflow_run` | CI/CD is running |
| `pull_request.create` or `pull_request.merge` | Humans are collaborating |
| `repo.pages_create` | A live site is attached - flag for manual review |
| `repo.archived` | Explicitly marked frozen - remove from scan queues |
| `repo.destroy` | Permanently deleted - clean up downstream references |

A repo that hasn't seen any of the first three events in 12 months is your stale candidate. No polling required.

### Make Archiving Self-Service

One of the biggest reasons stale repos accumulate is friction. If archiving requires a ticket, a manager approval, and three Slack messages, people won't do it. If there's a `make it easy` button, they will.

Consider adding a repository topic like `ready-to-archive` as a self-service signal. A workflow watching `repo.add_topic` events can detect this, run a final checklist (no open PRs, no active deployments, no Pages site), and automatically archive the repo - or open a tracking issue if the checklist fails.

The goal is closing the loop: the audit log tells you what's happening, the API gives you the data to evaluate it, and GitHub Actions does the work. Put those three things together and you've turned a reactive cleanup campaign into a system that maintains itself.

That's how you stop the boxes from piling up.

## Useful References

- [Archiving repositories](https://docs.github.com/en/repositories/archiving-a-github-repository/archiving-repositories)
- [REST API - List organization repositories](https://docs.github.com/en/rest/repos/repos#list-organization-repositories)
- [REST API - Update a repository](https://docs.github.com/en/rest/repos/repos#update-a-repository) (for archiving)
- [REST API - Delete a repository](https://docs.github.com/en/rest/repos/repos#delete-a-repository)
- [REST API - List repository activities](https://docs.github.com/en/rest/repos/repos#list-repository-activities)
- [GitHub CLI (`gh`) documentation](https://cli.github.com/manual/)
- [Audit log events for your organization](https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/audit-log-events-for-your-organization)
- [Streaming the audit log](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise)
