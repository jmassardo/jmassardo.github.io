# GHEC to GHES Migration: Considerations & Pitfalls

## Feature & Version Parity

- **Feature lag**: GHES releases trail GHEC. Check the [GHES release notes](https://docs.github.com/en/enterprise-server@latest/admin/release-notes) to confirm which features are available on your target version. Some GHEC-only features (like Copilot-managed networking, metered billing features) may never ship to GHES.
- **API differences**: Some REST/GraphQL API endpoints behave differently or are absent on GHES. Review the [REST API docs](https://docs.github.com/en/enterprise-server@latest/rest) filtered by GHES version.
- **GitHub Connect**: You can bridge some gaps (unified search, unified contributions, server statistics) by enabling [GitHub Connect](https://docs.github.com/en/enterprise-server@latest/admin/configuring-settings/configuring-github-connect/about-github-connect), but it requires outbound connectivity from GHES to GHEC.

## Migration Tooling

- **GitHub Enterprise Importer (GEI)**: The supported migration path. It handles repos, PRs, and issues but has [known limitations](https://docs.github.com/en/migrations/using-github-enterprise-importer/understanding-github-enterprise-importer/migration-support-for-github-enterprise-importer). Review the [migration guide for GHEC to GHES](https://docs.github.com/en/migrations/using-github-enterprise-importer).
- **What GEI does NOT migrate**:
  - Webhooks
  - Deploy keys
  - Repository rulesets (branch protection rules migrate with caveats)
  - GitHub Actions workflow run history
  - Discussions
  - Stars / watchers / forks relationships
  - Repository-level GitHub Apps installations
  - Dependabot alerts/settings
  - Code scanning alerts and configurations
  - Secret scanning alerts

## Identity & Access

- **Commit attribution**: User identities change. Mannequins are created for unmapped users. You'll need to [reclaim mannequins](https://docs.github.com/en/migrations/using-github-enterprise-importer/completing-your-migration-with-github-enterprise-importer/reclaiming-mannequins-for-github-enterprise-importer) post-migration. Historical `git blame` and contribution graphs will be affected unless email addresses match.
- **Authentication**: GHES requires you to configure your own auth — [SAML SSO](https://docs.github.com/en/enterprise-server@latest/admin/managing-iam/using-saml-for-enterprise-iam/about-saml-for-enterprise-iam), [LDAP](https://docs.github.com/en/enterprise-server@latest/admin/managing-iam/using-ldap-for-enterprise-iam/using-ldap), or [built-in auth](https://docs.github.com/en/enterprise-server@latest/admin/managing-iam/using-built-in-authentication/configuring-built-in-authentication). GHEC's IdP configuration doesn't carry over.
- **PATs, SSH keys, GPG keys**: Users must regenerate tokens and re-add keys against the new GHES instance. Existing GHEC tokens won't work.
- **GitHub Apps & OAuth Apps**: Must be re-registered on GHES. Client IDs/secrets change. Any third-party integrations need reconfiguration.
- **Team and org structure**: Org/team membership doesn't migrate automatically — plan to script this via the API or use GEI's org-level migration.
- **EMUs (Enterprise Managed Users)**: If you're using EMUs on GHEC, note that GHES doesn't have EMUs — it has its own IAM model. The mental model for user lifecycle management changes significantly.

## Secrets, Packages, & Artifacts

- **Secrets**: Actions secrets, Dependabot secrets, Codespaces secrets — none migrate. Inventory and re-create them. Consider using a vault (HashiCorp Vault, Azure Key Vault) as the canonical source to make this repeatable.
- **GitHub Packages**: Packages don't migrate. You'll need to re-publish or mirror them. If you use GHCR (Container Registry), plan to retag and push images to the GHES registry. See [GHES Packages docs](https://docs.github.com/en/enterprise-server@latest/admin/packages/getting-started-with-github-packages-for-your-enterprise).
- **Releases & release assets**: GEI migrates releases but verify asset integrity post-migration.
- **Actions artifacts**: Workflow run artifacts and logs don't migrate.

## GitHub Actions

- **Self-hosted runners are mandatory**: GHES doesn't have GitHub-hosted runners. You must provision and manage [self-hosted runners](https://docs.github.com/en/enterprise-server@latest/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners). Plan for:
  - Runner groups and labels to match existing workflow targeting
  - Ephemeral vs. persistent runner strategy
  - Autoscaling (ARC or custom) — see [Actions Runner Controller](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/about-actions-runner-controller)
  - Network egress for runners to pull dependencies
- **Actions availability**: `actions/*` and marketplace actions need to be either:
  - Synced via [GitHub Connect actions sharing](https://docs.github.com/en/enterprise-server@latest/admin/configuring-settings/configuring-github-connect/enabling-automatic-access-to-githubcom-actions-using-github-connect), OR
  - Manually mirrored/vendored into the GHES instance
  - This is a **big one** — workflows that reference `uses: actions/checkout@v4` will fail if the action isn't accessible.
- **Actions storage**: GHES requires external blob storage (S3, Azure Blob, MinIO) for Actions logs, artifacts, and caches. See [enabling Actions on GHES](https://docs.github.com/en/enterprise-server@latest/admin/managing-github-actions-for-your-enterprise/getting-started-with-github-actions-for-your-enterprise/getting-started-with-github-actions-for-github-enterprise-server).
- **Reusable workflows & composite actions**: If these reference GHEC-hosted repos, they need to move too.

## Infrastructure & Operations

- **Compute sizing**: Follow the [GHES hardware recommendations](https://docs.github.com/en/enterprise-server@latest/admin/installing-your-enterprise/setting-up-a-github-enterprise-server-instance/installing-github-enterprise-server-on-your-platform). Minimum specs vary by user count but underestimating CPU/RAM is a common mistake — especially with Actions enabled.
- **Storage**:
  - Root disk + data disk (SSD strongly recommended, NFS not supported for the data volume)
  - External blob storage for Actions, Packages, and Dependabot
  - Plan for growth — repos, LFS objects, packages all accumulate
- **High Availability**: GHES supports [HA replica configuration](https://docs.github.com/en/enterprise-server@latest/admin/monitoring-and-managing-your-instance/configuring-high-availability/about-high-availability-configuration). If uptime matters (and it does), plan this from day one — retrofitting is painful.
- **Backup & DR**: Configure [GitHub Enterprise Server Backup Utilities](https://docs.github.com/en/enterprise-server@latest/admin/backing-up-and-restoring-your-instance/configuring-backups-on-your-instance) on a separate host. Test restores. Determine RPO/RTO.
- **Upgrades**: You own the upgrade lifecycle now. GHES releases roughly quarterly, and you need to plan maintenance windows. See [upgrading GHES](https://docs.github.com/en/enterprise-server@latest/admin/upgrading-your-instance/preparing-to-upgrade/overview-of-the-upgrade-process). Hotpatches help but feature upgrades require downtime.
- **Monitoring**: Set up [monitoring with collectd](https://docs.github.com/en/enterprise-server@latest/admin/monitoring-and-managing-your-instance/monitoring-your-instance/configuring-collectd-for-your-instance) and external log forwarding. GHEC did this for you — now it's your responsibility.
- **Network**: GHES needs specific [network ports](https://docs.github.com/en/enterprise-server@latest/admin/configuring-settings/configuring-network-settings/network-ports). Plan for firewall rules, DNS, TLS certificates, and potentially a load balancer for HA.

## Security Features

- **Advanced Security licensing**: GHAS features (code scanning, secret scanning, Dependabot) require a separate license on GHES. Confirm your GHES license includes [GitHub Advanced Security](https://docs.github.com/en/enterprise-server@latest/admin/managing-code-security/managing-github-advanced-security-for-your-enterprise/enabling-github-advanced-security-for-your-enterprise).
- **Code scanning configs**: CodeQL analysis configurations in workflows port over, but any GHEC-side default setup configurations need to be re-enabled.
- **Audit log streaming**: GHEC's audit log streaming to SIEM tools needs to be reconfigured for GHES's [audit log](https://docs.github.com/en/enterprise-server@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise) and [log forwarding](https://docs.github.com/en/enterprise-server@latest/admin/monitoring-and-managing-your-instance/monitoring-your-instance/log-forwarding).
- **IP allow lists**: GHEC IP allow lists don't apply — now you handle this at the network/firewall layer.

## Copilot

- **Copilot availability**: Copilot Business/Enterprise works with GHES but requires [GitHub Connect](https://docs.github.com/en/enterprise-server@latest/admin/configuring-settings/configuring-github-connect/enabling-github-connect) and specific configuration. Certain Copilot features (like Copilot Chat in github.com) are GHEC-only.
- **Copilot policy settings**: Org-level Copilot policies need to be reconfigured on the GHES instance.

## Commonly Overlooked Items

- **GitHub Pages**: GHES supports Pages but it's a subdomain of your GHES hostname — custom domain setup differs from GHEC.
- **Protected branches → Rulesets migration**: If you've adopted rulesets on GHEC, verify GHES version support. Rulesets were added in GHES 3.11+.
- **Webhooks**: All org and repo webhooks must be recreated. Inventory them before migration.
- **LFS objects**: Git LFS objects should migrate with GEI, but verify — LFS storage on GHES is local disk.
- **Pre-receive hooks**: GHES supports [pre-receive hooks](https://docs.github.com/en/enterprise-server@latest/admin/enforcing-policies/enforcing-policy-with-pre-receive-hooks/about-pre-receive-hooks) — a feature GHEC doesn't have. This is actually an advantage you can leverage.
- **Project boards (new Projects)**: Projects (V2) support on GHES varies by version — check your target release.

## Recommended Approach

Do a dry-run migration on a staging GHES instance first. Use GEI's `--queue-only` mode for large orgs, audit the migration log, and validate before cutting over. Build an inventory spreadsheet covering repos, secrets, webhooks, apps, teams, and runner configurations before you start.
