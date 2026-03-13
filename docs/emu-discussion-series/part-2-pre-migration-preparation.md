# The Complete Guide to Migrating to GitHub Enterprise Managed Users - Part 2: Pre-Migration Preparation

> **📚 Series: The Complete Guide to Migrating to GitHub Enterprise Managed Users**
> This is **Part 2 of 6** in the EMU migration guide series.
>
> | Part | Topic |
> |------|-------|
> | [Part 1: Discovery & Decision](https://github.com/orgs/community/discussions/189382) | Define goals, evaluate fit, get buy-in |
> | **[Part 2: Pre-Migration Preparation](https://github.com/orgs/community/discussions/189383)** (You are here) | Inventory, cleanup, IdP readiness, user communication |
> | [Part 3: Identity & Access Setup](https://github.com/orgs/community/discussions/189384) | Configure SCIM, provision users, set up teams |
> | [Part 4: Security & Compliance](https://github.com/orgs/community/discussions/189385) | Audit logging, security hardening, CI/CD, integrations |
> | [Part 5: Migration Execution](https://github.com/orgs/community/discussions/189386) | Run GEI, migrate repos, reclaim mannequins |
> | [Part 6: Validation & Adoption](https://github.com/orgs/community/discussions/189387) | Testing, user training, OSS strategy, go-live |

---

# Phase 2: Pre-Migration Preparation

*Cleaning up the old environment and getting ready to move.*

This phase is where you do the unglamorous but critical work: auditing what you have, cleaning up what you don't need, and ensuring your identity infrastructure is ready. Skipping this phase leads to painful surprises during migration.

## Pre-Migration Requirements Checklist

Before you even think about scheduling a migration window, you need to ensure your foundation is solid.

### 1. Identity Provider Readiness

EMU requires a compatible identity provider. GitHub has "paved-path" integrations with these partner IdPs:

| Identity Provider | SAML SSO | OIDC SSO | SCIM Provisioning |
|-------------------|----------|----------|-------------------|
| Microsoft Entra ID (Azure AD) | ✅ | ✅ | ✅ |
| Okta | ✅ | ❌ | ✅ |
| PingFederate | ✅ | ❌ | ✅ |

**Critical Note:** The combination of Okta and Entra ID for SSO and SCIM (in either order) is explicitly **not supported**. GitHub's SCIM API will return errors if this combination is configured.

If you're using a non-partner IdP, you can still configure EMU, but your system must:
- Adhere to GitHub's integration guidelines
- Provide authentication using SAML 2.0 specification
- Provide user lifecycle management using SCIM 2.0 specification
- Communicate with GitHub's REST API for SCIM

See [Configuring SCIM provisioning for Enterprise Managed Users](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/provisioning-user-accounts-for-enterprise-managed-users/configuring-scim-provisioning-for-enterprise-managed-users) for detailed setup instructions.

### 2. Inventory Your Current State

Before migrating, you need a complete picture of what you're moving. Use the [`gh-repo-stats`](https://github.com/mona-actions/gh-repo-stats/) extension for GitHub CLI to generate a full inventory:

```bash
# Install the extension
gh extension install mona-actions/gh-repo-stats

# Generate inventory for your organization
gh repo-stats --org your-org-name --output inventory.csv
```

Your inventory should capture:
- Repository names and owners
- Last updated timestamps
- Pull request and issue counts
- Repository sizes (especially large files)
- Team structures and permissions
- Active integrations and webhooks
- GitHub Actions workflows

### 3. Assess Repository Sizes

Large repositories can significantly impact migration time and success. Use [`git-sizer`](https://github.com/github/git-sizer) to analyze each repository:

```bash
# Clone the repository
git clone --mirror https://github.com/org/repo.git

# Navigate to the cloned repo
cd repo.git

# Get the size of the largest file
git-sizer --no-progress -j | jq ".max_blob_size"

# Get total size of all files
git-sizer --no-progress -j | jq ".unique_blob_size"
```

If you have files over 100MB in your repository history, consider using [Git LFS](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage) or rewriting history before migration.

### 4. User Communication Plan

This is often overlooked, but arguably the most important step. Your users will experience:
- New usernames (their handle plus your enterprise shortcode)
- Loss of ability to contribute to public repositories
- Different authentication flow
- Potential loss of contribution history if not properly attributed

Start communicating early and often. Create documentation, hold training sessions, and set up a support channel for questions.

### 5. Pre-Migration Cleanup

**Don't migrate your mess; clean house first.** Every piece of technical debt, every abandoned repository, every stale PR you migrate is technical debt you're paying to move. Take this opportunity to start fresh.

#### Archive Unused Repositories

Identify and archive repositories that are no longer actively maintained:

```bash
# Find repositories with no activity in the last year
gh api graphql -f query='
query($org: String!, $cursor: String) {
  organization(login: $org) {
    repositories(first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        name
        pushedAt
        isArchived
        defaultBranchRef {
          target {
            ... on Commit {
              committedDate
            }
          }
        }
      }
    }
  }
}' -f org=YOUR_ORG | jq '.data.organization.repositories.nodes[] | 
  select(.isArchived == false) | 
  select(.pushedAt < (now - 31536000 | todate)) | 
  .name'
```

Before archiving, consider:
- [ ] Has this repository been superseded by another project?
- [ ] Are there any active forks that should be migrated instead?
- [ ] Does it contain documentation that should be preserved elsewhere?
- [ ] Are there any secrets or credentials that need to be rotated first?

Archive repositories using:

```bash
# Archive a single repository
gh repo archive OWNER/REPO

# Bulk archive from a list
while read repo; do
  gh repo archive "$repo" --yes
  echo "Archived: $repo"
done < repos-to-archive.txt
```

> **Note:** Archived repositories can still be migrated if needed, but they signal to your team that the content is historical rather than active.

#### Close Stale Pull Requests

Open PRs that haven't been touched in months are rarely going to be merged. Close them before migration to avoid polluting your new environment:

```bash
# Find PRs older than 90 days with no recent activity
gh pr list --repo OWNER/REPO --state open --json number,title,updatedAt,author \
  --jq '.[] | select(.updatedAt < (now - 7776000 | todate))'

# Close stale PRs with a comment explaining why
gh pr close PR_NUMBER --repo OWNER/REPO \
  --comment "Closing as part of pre-migration cleanup. This PR has been inactive for >90 days. Please reopen against the new repository location if still needed."
```

For bulk operations, create a script:

```bash
#!/bin/bash
# close-stale-prs.sh - Close PRs older than specified days

REPO="$1"
DAYS="${2:-90}"
CUTOFF_DATE=$(date -d "$DAYS days ago" +%Y-%m-%d 2>/dev/null || date -v-${DAYS}d +%Y-%m-%d)

gh pr list --repo "$REPO" --state open --json number,title,updatedAt --jq '.[]' | \
while read -r pr; do
  PR_NUM=$(echo "$pr" | jq -r '.number')
  UPDATED=$(echo "$pr" | jq -r '.updatedAt' | cut -d'T' -f1)
  
  if [[ "$UPDATED" < "$CUTOFF_DATE" ]]; then
    echo "Closing PR #$PR_NUM: $(echo "$pr" | jq -r '.title')"
    gh pr close "$PR_NUM" --repo "$REPO" \
      --comment "🧹 Closing as part of pre-migration cleanup to EMU. This PR has been inactive since $UPDATED. If still relevant, please recreate after migration."
  fi
done
```

#### Clean Up Stale Issues

Similar to PRs, old issues that have gone cold should be triaged:

```bash
# Find issues with no activity in 6 months
gh issue list --repo OWNER/REPO --state open --json number,title,updatedAt,labels \
  --jq '.[] | select(.updatedAt < (now - 15552000 | todate))'

# Close with a descriptive label and comment
gh issue close ISSUE_NUMBER --repo OWNER/REPO \
  --comment "Closing as part of pre-migration housekeeping. If this issue is still relevant, please reopen or create a new issue in our new location."
```

Consider creating a "stale" or "pre-migration-triage" label to tag issues that need review before migration.

#### Prune Dead Branches

Every repository accumulates branches over time. Clean them up:

```bash
# List merged branches (safe to delete)
git branch -r --merged main | grep -v main | grep -v HEAD

# List branches with no commits in 6 months
for branch in $(git branch -r | grep -v HEAD); do
  last_commit=$(git log -1 --format="%ci" "$branch" 2>/dev/null | cut -d' ' -f1)
  if [[ "$last_commit" < "$(date -d '6 months ago' +%Y-%m-%d 2>/dev/null || date -v-6m +%Y-%m-%d)" ]]; then
    echo "$branch - last commit: $last_commit"
  fi
done

# Delete remote branches (be careful!)
git push origin --delete branch-name
```

GitHub also provides branch protection rules that can help prevent branch sprawl post-migration. See [Managing a branch protection rule](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule).

#### Audit and Remove Unused Integrations

Review OAuth apps, GitHub Apps, and webhooks before migration:

```bash
# List all webhooks in an organization
gh api orgs/YOUR_ORG/hooks --jq '.[] | {id, name, active, config: .config.url}'

# List installed GitHub Apps
gh api orgs/YOUR_ORG/installations --jq '.installations[] | {id, app_slug, permissions}'
```

For each integration, ask:
- [ ] Is this integration still actively used?
- [ ] Does the integration support EMU? (Check with the vendor)
- [ ] Are there EMU-compatible alternatives?
- [ ] Who owns this integration and can validate its necessity?

Remove integrations that are no longer needed - they won't migrate cleanly anyway, and orphaned webhooks are a security risk.

#### Clean Up Teams and Access

Review your team structure and membership:

```bash
# List all teams and their member counts
gh api orgs/YOUR_ORG/teams --jq '.[] | {name, slug, members_count: .members_count}'

# List team members
gh api orgs/YOUR_ORG/teams/TEAM_SLUG/members --jq '.[].login'
```

Questions to address:
- [ ] Are there teams with no members or no repository access?
- [ ] Are there duplicate teams that should be consolidated?
- [ ] Do team names follow your naming conventions?
- [ ] Are nested teams structured appropriately for your IdP groups?

Remember: In EMU, team membership is managed via your IdP. This is a great opportunity to align your GitHub team structure with your IdP groups.

#### Remove Secrets and Sensitive Data

This is critical. Before migration:

1. **Rotate all secrets** - Any token, API key, or credential in your code should be rotated to prevent the possiblity of comprimise from a leaked secret.
2. **Check for committed secrets** - Use [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning) or tools like [truffleHog](https://github.com/trufflesecurity/trufflehog) or [gitleaks](https://github.com/gitleaks/gitleaks)
3. **Review Actions secrets** - Document all repository and organization secrets that will need to be recreated

```bash
# Check for exposed secrets using gitleaks
gitleaks detect --source . --verbose

# List organization secrets (names only, not values)
gh api orgs/YOUR_ORG/actions/secrets --jq '.secrets[].name'

# List repository secrets
gh api repos/OWNER/REPO/actions/secrets --jq '.secrets[].name'
```

> **⚠️ Important:** Secrets don't migrate automatically. You'll need to recreate them in your new EMU environment. Use this as an opportunity to implement proper secrets management with tools like [HashiCorp Vault](https://www.vaultproject.io/) or [Azure Key Vault](https://azure.microsoft.com/en-us/products/key-vault).

#### Create a Cleanup Checklist

Track your progress with a checklist:

| Category | Task | Owner | Status |
|----------|------|-------|--------|
| Repositories | Identify repos with no activity >1 year | | ☐ |
| Repositories | Archive or delete unused repositories | | ☐ |
| Repositories | Document repos that should NOT migrate | | ☐ |
| Pull Requests | Close PRs inactive >90 days | | ☐ |
| Pull Requests | Merge or close PRs that are ready | | ☐ |
| Issues | Triage issues inactive >6 months | | ☐ |
| Issues | Close issues that are no longer relevant | | ☐ |
| Branches | Delete merged branches | | ☐ |
| Branches | Delete stale feature branches | | ☐ |
| Integrations | Audit all OAuth and GitHub Apps | | ☐ |
| Integrations | Remove unused webhooks | | ☐ |
| Integrations | Verify EMU compatibility for remaining integrations | | ☐ |
| Teams | Review and consolidate team structure | | ☐ |
| Teams | Map teams to IdP groups | | ☐ |
| Security | Scan for committed secrets | | ☐ |
| Security | Rotate all credentials | | ☐ |
| Security | Document secrets for recreation | | ☐ |

The goal is simple: **migrate only what you need, and migrate it clean.** Your future self will thank you.

---

> **📚 EMU Migration Guide Series Navigation**
>
> ⬅️ **Previous: [Part 1 - Discovery & Decision](https://github.com/orgs/community/discussions/189382)**
> ➡️ **Next: [Part 3 - Identity & Access Setup](https://github.com/orgs/community/discussions/189384)**
>
> ---
> *This is Part 2 of a 6-part series on migrating to GitHub Enterprise Managed Users. Found this helpful? Give it a 👍 and share it with your team! Got questions or something I missed? Drop a comment below.*
