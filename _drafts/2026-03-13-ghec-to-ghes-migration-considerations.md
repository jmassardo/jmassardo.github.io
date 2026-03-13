---
layout: post
title: "GHEC to GHES Migration: A Practical Planning Guide"
date: 2026-03-13 10:00:00 -0500
category: Blog
tags: [github, ghes, ghec, migration, devops, infrastructure, security, best-practices]
excerpt: "A comprehensive reference for planning a migration from GitHub Enterprise Cloud to GitHub Enterprise Server, covering feature parity, identity, Actions, infrastructure, and the items that are easy to overlook."
---

There are good reasons to migrate from GitHub Enterprise Cloud (GHEC) to GitHub Enterprise Server (GHES) - regulatory requirements, data residency mandates, or a shift in hosting strategy. It is a supported path, but it's more than moving repositories. You're transitioning from a fully managed platform to one your team owns and operates.

Beyond the repo migration itself, there's a broader set of considerations around identity, secrets, Actions runners, infrastructure, and integrations that all need planning. This post is a reference guide covering those considerations, organized by area, so you can build a complete migration plan.

## Feature and Version Parity

GHES releases trail GHEC, so it's important to check the [GHES release notes](https://docs.github.com/en/enterprise-server@latest/admin/release-notes) to confirm which features are available on your target version. Some GHEC-only features (like Copilot-managed networking and metered billing features) may not be available on GHES.

Some REST and GraphQL API endpoints also behave differently or are absent on GHES. Review the [REST API docs](https://docs.github.com/en/enterprise-server@latest/rest) filtered by GHES version to confirm your existing tooling and automation will work as expected.

[GitHub Connect](https://docs.github.com/en/enterprise-server@latest/admin/configuring-settings/configuring-github-connect/about-github-connect) can bridge some gaps by enabling unified search, unified contributions, and server statistics. It does require outbound connectivity from GHES to GHEC, so verify that works for your network environment.

**Recommended step:** Inventory the GHEC features your teams depend on and validate them against your target GHES version before committing to the migration.

## Migration Tooling: What GEI Covers

[GitHub Enterprise Importer (GEI)](https://docs.github.com/en/migrations/using-github-enterprise-importer) is the supported migration path. It handles repos, PRs, and issues well, and the full list of supported data is in the [migration support matrix](https://docs.github.com/en/migrations/using-github-enterprise-importer/understanding-github-enterprise-importer/migration-support-for-github-enterprise-importer).

**Items that require separate handling (not migrated by GEI):**

- Webhooks
- Deploy keys
- Repository rulesets (branch protection rules migrate with caveats)
- GitHub Actions workflow run history
- Discussions
- Stars, watchers, and fork relationships
- Repository-level GitHub Apps installations
- Dependabot alerts and settings
- Code scanning alerts and configurations
- Secret scanning alerts

Each of these items needs a remediation plan. For migrations involving many repos, it's worth scripting or automating the recreation of these items.

## Identity and Access

Identity management is typically the area that requires the most planning in a GHEC-to-GHES migration.

### Commit Attribution

User identities change when moving between platforms. GEI creates [mannequins](https://docs.github.com/en/migrations/using-github-enterprise-importer/completing-your-migration-with-github-enterprise-importer/reclaiming-mannequins-for-github-enterprise-importer) for unmapped users that need to be reclaimed post-migration. Historical `git blame` and contribution graphs will be affected unless email addresses match between the two platforms.

### Authentication

GHES requires its own authentication configuration. The options are [SAML SSO](https://docs.github.com/en/enterprise-server@latest/admin/managing-iam/using-saml-for-enterprise-iam/about-saml-for-enterprise-iam), [LDAP](https://docs.github.com/en/enterprise-server@latest/admin/managing-iam/using-ldap-for-enterprise-iam/using-ldap), or [built-in auth](https://docs.github.com/en/enterprise-server@latest/admin/managing-iam/using-built-in-authentication/configuring-built-in-authentication). GHEC IdP configuration doesn't carry over, so plan for a fresh setup.

### Tokens, Keys, and Apps

- **PATs, SSH keys, GPG keys**: Users must regenerate tokens and re-add keys against the new GHES instance. Existing GHEC tokens won't work.
- **GitHub Apps and OAuth Apps**: Must be re-registered on GHES. Client IDs and secrets change. Every third-party integration needs reconfiguration.
- **Team and org structure**: Org and team membership doesn't migrate automatically. Plan to script this via the API or use GEI's org-level migration.

### Enterprise Managed Users (EMUs)

GHES doesn't have EMUs - it uses its own IAM model. If you're currently using EMUs on GHEC, the approach to user lifecycle management will be on you to manage with the LDAP/SAML/SCIM configurations.

## Secrets, Packages, and Artifacts

These items all require manual handling during the migration.

- **Secrets**: Actions secrets, Dependabot secrets, and Codespaces secrets are not migrated by GEI. Inventory and re-create them on GHES. Using a secrets vault (HashiCorp Vault, Azure Key Vault) as the canonical source simplifies this and makes it repeatable.
- **GitHub Packages**: Packages don't migrate. You'll need to re-publish or mirror them. If you use GHCR (Container Registry), plan to retag and push images to the GHES registry. See the [GHES Packages docs](https://docs.github.com/en/enterprise-server@latest/admin/packages/getting-started-with-github-packages-for-your-enterprise).
- **Releases and release assets**: GEI migrates releases but verify asset integrity post-migration.
- **Actions artifacts**: Workflow run artifacts and logs don't migrate. If you need historical artifacts, archive them before migration.

## GitHub Actions

Actions typically requires the most infrastructure planning in a GHEC-to-GHES migration.

### Self-Hosted Runners Are Required

GHES doesn't include GitHub-hosted runners, so you'll need to provision and manage [self-hosted runners](https://docs.github.com/en/enterprise-server@latest/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners). Key areas to plan for:

- **Runner groups and labels** to match existing workflow targeting
- **Ephemeral vs. persistent** runner strategy
- **Autoscaling** with [Actions Runner Controller (ARC)](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/about-actions-runner-controller) or a custom solution
- **Network egress** for runners to pull dependencies

### Actions Availability

`actions/*` and marketplace actions need to be accessible from GHES. The two options are:

1. Synced via [GitHub Connect actions sharing](https://docs.github.com/en/enterprise-server@latest/admin/configuring-settings/configuring-github-connect/enabling-automatic-access-to-githubcom-actions-using-github-connect), OR
2. Manually mirrored or vendored into the GHES instance

Workflows that reference `uses: actions/checkout@v4` will fail if the action isn't accessible on GHES. Audit all action references in your workflows before migration to identify what needs to be synced or mirrored.

### Storage

GHES requires external blob storage (S3, Azure Blob, MinIO) for Actions logs, artifacts, and caches. See [enabling Actions on GHES](https://docs.github.com/en/enterprise-server@latest/admin/managing-github-actions-for-your-enterprise/getting-started-with-github-actions-for-your-enterprise/getting-started-with-github-actions-for-github-enterprise-server).

### Reusable Workflows and Composite Actions

If these reference GHEC-hosted repos, they need to move too. Walk the full dependency tree of your workflows, not just the top-level files.

## Infrastructure and Operations

With GHES, your team takes on platform operations. Here are the key areas to plan for.

### Compute

Follow the [GHES hardware recommendations](https://docs.github.com/en/enterprise-server@latest/admin/installing-your-enterprise/setting-up-a-github-enterprise-server-instance/installing-github-enterprise-server-on-your-platform). Minimum specs vary by user count. Be generous with CPU and RAM, especially with Actions enabled.

### Storage

- Root disk plus data disk (SSD strongly recommended, NFS not supported for the data volume)
- External blob storage for Actions, Packages, and Dependabot
- Plan for growth - repos, LFS objects, and packages accumulate over time

### High Availability

GHES supports [HA replica configuration](https://docs.github.com/en/enterprise-server@latest/admin/monitoring-and-managing-your-instance/configuring-high-availability/about-high-availability-configuration). It's much easier to configure HA from the start than to add it later, so factor this into the initial deployment plan.

### Backup and DR

Configure [GitHub Enterprise Server Backup Utilities](https://docs.github.com/en/enterprise-server@latest/admin/backing-up-and-restoring-your-instance/configuring-backups-on-your-instance) on a separate host. Validate restores as part of the deployment process and determine your RPO and RTO before going live.

### Upgrades

You own the upgrade lifecycle now. GHES releases roughly quarterly, and you need to plan maintenance windows. See the [upgrade overview](https://docs.github.com/en/enterprise-server@latest/admin/upgrading-your-instance/preparing-to-upgrade/overview-of-the-upgrade-process). Hotpatches help, but feature upgrades require downtime.

### Monitoring

Set up [monitoring with collectd](https://docs.github.com/en/enterprise-server@latest/admin/monitoring-and-managing-your-instance/monitoring-your-instance/configuring-collectd-for-your-instance) and external log forwarding. On GHEC this is managed for you, so on GHES you'll want monitoring in place from the start.

### Network

GHES needs specific [network ports](https://docs.github.com/en/enterprise-server@latest/admin/configuring-settings/configuring-network-settings/network-ports) open. Plan for firewall rules, DNS, TLS certificates, and potentially a load balancer for HA.

## Security Features

### Advanced Security Licensing

GHAS features (code scanning, secret scanning, Dependabot) require a separate license on GHES. Confirm your GHES license includes [GitHub Advanced Security](https://docs.github.com/en/enterprise-server@latest/admin/managing-code-security/managing-github-advanced-security-for-your-enterprise/enabling-github-advanced-security-for-your-enterprise).

### Configurations That Don't Carry Over

- **Code scanning configs**: CodeQL analysis configurations in workflows port over, but any GHEC-side default setup configurations need to be re-enabled.
- **Audit log streaming**: GHEC's audit log streaming to SIEM tools needs to be reconfigured for GHES's [audit log](https://docs.github.com/en/enterprise-server@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise) and [log forwarding](https://docs.github.com/en/enterprise-server@latest/admin/monitoring-and-managing-your-instance/monitoring-your-instance/log-forwarding).
- **IP allow lists**: GHEC IP allow lists don't apply. Now you handle this at the network and firewall layer.

## Copilot

Copilot Business and Enterprise work with GHES but require [GitHub Connect](https://docs.github.com/en/enterprise-server@latest/admin/configuring-settings/configuring-github-connect/enabling-github-connect) and specific configuration. Certain Copilot features (like Copilot Chat on github.com) are GHEC-only.

Org-level Copilot policies need to be reconfigured on the GHES instance. Don't assume settings carry over.

## Commonly Overlooked Items

These items are easy to miss during planning but worth reviewing early:

| Item | What to Know |
|------|-------------|
| **GitHub Pages** | Supported, but it's a subdomain of your GHES hostname. Custom domain setup differs from GHEC. |
| **Rulesets** | If you've adopted rulesets on GHEC, verify GHES version support. Rulesets were added in GHES 3.11+. |
| **Webhooks** | All org and repo webhooks must be recreated. Inventory them before migration. |
| **LFS objects** | Should migrate with GEI, but verify. LFS storage on GHES is local disk. |
| **Pre-receive hooks** | GHES supports [pre-receive hooks](https://docs.github.com/en/enterprise-server@latest/admin/enforcing-policies/enforcing-policy-with-pre-receive-hooks/about-pre-receive-hooks) and GHEC doesn't. This is actually an advantage you can leverage. |
| **Projects (V2)** | Support on GHES varies by version. Check your target release. |

## Recommended Approach

1. **Inventory first**: Build a spreadsheet covering repos, secrets, webhooks, apps, teams, and runner configurations. A complete inventory makes the rest of the planning much smoother.
2. **Dry-run on staging**: Stand up a staging GHES instance and run a full trial migration. Use GEI's `--queue-only` mode for large orgs.
3. **Audit the migration log**: GEI produces detailed logs. Review them thoroughly - warnings can surface items that need attention before cutover.
4. **Validate before cutover**: Verify commit history, PR state, issue links, Actions workflows, and package availability on staging before migrating production.
5. **Script the gaps**: Automate the recreation of webhooks, secrets, team memberships, and app registrations. This makes the process repeatable and reduces manual error.
6. **Communicate the timeline**: Give teams advance notice. PATs need regenerating, SSH keys need re-adding, and bookmarks need updating. Clear communication helps the transition go smoothly.

## Summary and Key Takeaways

- **GEI handles the core migration well**, but there's a clear list of items it doesn't cover. Plan for those gaps early.
- **Identity needs the most attention.** Mannequin reclamation, auth reconfiguration, and token regeneration affect every user.
- **Actions requires the most infrastructure work.** Self-hosted runners, action mirroring, and blob storage are net-new operational responsibilities.
- **Platform operations are now yours.** Upgrades, monitoring, HA, and backups need staffing and process from day one.
- **A staging dry-run is essential.** A full trial migration surfaces issues before they affect production.

The migration is absolutely doable with the right planning. The repos themselves move in hours. The broader ecosystem - identity, integrations, infrastructure - takes longer and benefits from a thorough, phased approach.
