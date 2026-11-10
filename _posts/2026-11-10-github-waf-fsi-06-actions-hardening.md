---
layout: post
title: "GitHub Well-Architected for Financial Services, Part 6: CI/CD and GitHub Actions Hardening"
date: 2026-11-10 10:06:00 -0600
category: Blog
tags: [github, well-architected, financial-services, compliance, security, governance, github-actions, ci-cd, devops, supply-chain]
excerpt: "Apply GitHub Well-Architected to an FI delivery platform with reusable golden paths, independent production authorization, efficient CI, accountable runner capacity, and rehearsed recovery."
permalink: /blog/github-waf-financial-services/actions-hardening/
---

*This post is part of the [GitHub Well-Architected for Financial Services](/blog/github-waf-financial-services/) series.*

**Previous:** [Part 5: Code Scanning and Software Supply Chain](/blog/github-waf-financial-services/code-scanning-supply-chain/) | **Next:** [Part 7: Copilot and AI Agents](/blog/github-waf-financial-services/copilot-and-agents/)

{::options toc_levels="2" /}

**In this post**

* Contents
{:toc}

> **A friendly note:** This information is meant to be guidance to help navigate a complex topic. Please validate these patterns with your compliance and/or regulatory reporting team(s).

## Leadership brief

- **Why it matters:** The systems that build and release software can disrupt delivery or become a route into production if compromised.
- **Your decision:** Fund a shared delivery service with enough capacity, support, and recovery capability to handle critical releases without bypassing approval.
- **Accountability:** The platform owner runs the delivery service; business-service owners remain responsible for release readiness and authorized production changes.
- **Ask for:** Critical-release delays, failed or unauthorized deployment attempts, operating costs, and the latest exercise showing delivery can recover from disruption.

---

Build and deployment infrastructure must keep releases moving without becoming an uncontrolled route into production. That requires maintained workflows, sufficient capacity, isolated execution, and independent release authorization. A delayed critical fix is a service problem to resolve, not a reason to bypass those controls.

This chapter applies [GitHub Well-Architected](https://learn.github.com/well-architected/library/application-security/recommendations/actions-security/) to operating that delivery service. It covers supported workflows, execution permissions, runner isolation, production authorization, and recovery, with evidence that the controls work during routine releases and disruption.

The service builds on [Part 3's change controls](/blog/github-waf-financial-services/change-control/), [Part 4's credential protections](/blog/github-waf-financial-services/secrets-protection/), and [Part 5's software security and release evidence](/blog/github-waf-financial-services/code-scanning-supply-chain/). The same delivery controls apply to application and infrastructure changes, regardless of who wrote the code.

## Apply the five WAF pillars to the delivery service

| Pillar | FI platform application | How we verify it |
|---|---|---|
| **Governance** | Define execution policy, production authority, cost owners, and exceptions | Policy drift tests, independent decisions, and named budget/capacity ownership |
| **Architecture** | Separate untrusted CI from deployment; design isolated runners and recovery paths | Boundary tests, dependency maps, and outage rehearsals |
| **Application Security** | Pin approved code, scope identity, reject unsafe inputs, and verify artifacts at the target | Negative tests plus per-release authorization/provenance records |
| **Collaboration** | Maintain reusable golden paths with contribution and support processes | Onboarding exercises, reviewed changes, and consumer upgrade records |
| **Productivity** | Reduce feedback delay, redundant work, and avoidable compute spend | Queue/execution latency, reruns, cache correctness, and cost per workload |

**Two contracts, not one giant gate:** required checks, independent production approval, runner boundaries, and evidence completeness are mandatory institutional controls. Onboarding time, p95 queue delay, and build cost are engineering service objectives. Missing a latency target should trigger capacity or workflow work, not permission to skip required checks.

## Golden paths: make the supported route worth adopting

**What we do.** Publish a small catalog of supported delivery patterns rather than one enormous workflow with 80 boolean inputs. Start with a banking API, a packaged web service, and an infrastructure plan/apply path.

**Why.** Shared workflows concentrate maintenance and make controls consistent. They also become a common dependency, so platform engineering must own compatibility, support, and safe upgrades. Follow WAF's [reusability guidance](https://learn.github.com/well-architected/library/collaboration/recommendations/scaling-actions-reusability/) and GitHub's [reusable workflow documentation](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows).

**How.** Give each catalog entry a named maintainer/deputy and an explicit contract:

| Contract element | What an adopting team needs |
|---|---|
| Inputs and outputs | Supported build command, artifact format/digest, test reports, and release metadata |
| Security boundary | Required token scopes, explicit secret inputs, runner group, and deployment request identity |
| Policy integration | Part 3's independently required checks and Control 4's target authorization |
| Compatibility | Supported toolchains, tested examples, immutable approved workflow commit, upgrade/deprecation window |
| Operations | Support contact, incident route, capacity class, known limitations, and recovery runbook |

Prefer explicit secret passing over blanket inheritance; a build path should not receive deployment secrets. A reusable workflow is a delivery component, **not automatically an enforcing policy**. Require the relevant controls independently so a repository cannot remove them by replacing its caller YAML.

Onboard a payments API with a short, repeatable sequence:

1. Reconcile classification, service ownership, compliance scope, and network requirements.
2. Select the catalog path and approved immutable commit. Register runner access, dependency sources, and the artifact registry.
3. Run a synthetic non-production build and deployment request. Confirm successful output and deliberate denial for a missing check, unauthorized identity, or mismatched digest.
4. Record the support handoff, rollback/recovery route, and first production change evidence.

For infrastructure, separate read-oriented planning from authorized application and protect plan/state contents. Do not quietly let PR jobs inherit production apply privileges.

Treat central workflow changes like product releases. Test them against representative consumer repositories, pilot the new immutable revision, publish migration notes, and track consumer upgrades. Urgent security changes need an accelerated approved rollout, not an unreviewed mutable reference.

**Verify.** Monthly, onboard a clean representative repository and record manual steps, support contacts, time to first useful check, and failure recovery. A one-business-day non-production onboarding objective is a starting service target, not a regulatory promise. Quarterly, reconcile deployed workflow revisions and unsupported consumers; do not confuse catalog publication with adoption.

## The requirements

**Applicability:** [Part 1's deployment baseline](/blog/github-waf-financial-services/platform-foundation/#choosing-your-deployment-model) defaults to **GHEC with data residency, including EMU**; GHES comparisons use **3.22**. Consume its [approved classification](/blog/github-waf-financial-services/platform-foundation/#data-classification-with-custom-properties) and [network boundaries](/blog/github-waf-financial-services/platform-foundation/#network-boundaries-ip-allow-lists). Missing classification blocks release.

Mappings **contribute to**, not satisfy, requirements. Second line validates applicability, design, evidence, and gaps. Follow [Part 1's GA production baseline](/blog/github-waf-financial-services/platform-foundation/#feature-availability-and-preview-controls) and [Part 3's rollout lifecycle](/blog/github-waf-financial-services/change-control/#roll-out-with-evaluate-mode-and-rule-insights); only active, tested GA controls count. Preview features are excluded from production.

These requirements govern pipeline outcomes, not a particular CI/CD product.

| ID | Regulation and citation | What it asks for (paraphrase) |
|---|---|---|
| [US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance) | [FFIEC IT Examination Handbook, Development, Acquisition, and Maintenance](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance) | Governance and risk management across building, buying, and maintaining software, including change management and vendor-sourced code. |
| [US-FFIEC-INFOSEC](https://ithandbook.ffiec.gov/it-booklets/information-security) | [FFIEC IT Examination Handbook, Information Security](https://ithandbook.ffiec.gov/it-booklets/information-security) | Controls that protect confidentiality, integrity, and availability, backed by governance and risk identification. |
| [US-FFIEC-AIO](https://ithandbook.ffiec.gov/it-booklets/architecture-infrastructure-and-operations) | [FFIEC IT Examination Handbook, Architecture, Infrastructure, and Operations](https://ithandbook.ffiec.gov/it-booklets/architecture-infrastructure-and-operations) | Sound architecture, infrastructure (on-premises and cloud), and operations practices. |
| [US-3PRM-2023](https://www.occ.gov/news-issuances/bulletins/2023/bulletin-2023-17.html) | [Interagency Guidance on Third-Party Relationships (OCC Bulletin 2023-17 / Fed SR 23-4)](https://www.occ.gov/news-issuances/bulletins/2023/bulletin-2023-17.html) | A risk-tiered lifecycle for third-party relationships: due diligence, contracting, monitoring, and termination. |
| [CA-OSFI-B13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | [OSFI Guideline B-13, Technology and Cyber Risk Management](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | Risk-based management of technology and cyber risk across governance, operations, resilience, and cybersecurity. |
| [CA-AMF-ICT](https://lautorite.qc.ca/en/professionals/insurers/guidelines/operational-risk/guideline-on-information-and-communications-technology-risk-management) | [AMF Guideline on ICT Risk Management (Québec)](https://lautorite.qc.ca/en/professionals/insurers/guidelines/operational-risk/guideline-on-information-and-communications-technology-risk-management) | ICT governance and risk management lifecycle for AMF-regulated institutions. |
| [MX-CNBV-CUB](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) | [CNBV Circular Única de Bancos (Mexico)](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) | Technology risk, information security, operational risk, and IT outsourcing provisions for banks. |
| [EU-DORA-9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9) | [DORA Art. 9, Protection and prevention](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9) | Continuous monitoring and control of ICT systems, with tools and policies that protect resilience, integrity, and confidentiality. |
| [EU-DORA-RTS-CHANGE](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | [Commission Delegated Regulation (EU) 2024/1774, Art. 17 / Art. 38](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | ICT change management requirements under the full and simplified frameworks. |
| [EU-DORA-28-30](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_28) | [DORA Arts. 28 to 30, ICT third-party risk](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_28) | The financial entity stays fully responsible when using ICT third parties, with contractual and concentration-risk expectations. |
| [INT-PCI-7.2](https://www.pcisecuritystandards.org/document_library/) | [PCI DSS v4.0.1, Req. 7.2](https://www.pcisecuritystandards.org/document_library/) | Least-privilege, need-to-know access with documented models and periodic review. |
| [INT-PCI-10.4](https://www.pcisecuritystandards.org/document_library/) | [PCI DSS v4.0.1, Req. 10.4](https://www.pcisecuritystandards.org/document_library/) | Automated daily review of security event and critical system logs. |
| [INT-PCI-12.8](https://www.pcisecuritystandards.org/document_library/) | [PCI DSS v4.0.1, Req. 12.8](https://www.pcisecuritystandards.org/document_library/) | Maintain and monitor third-party service providers and their security responsibilities. |
| [INT-SWIFT-CSCF-OVERVIEW](https://www.swift.com/myswift/customer-security-programme) | [SWIFT Customer Security Controls Framework (overview)](https://www.swift.com/myswift/customer-security-programme) | Secure your environment, know and limit access, detect and respond. |
| [INT-NIST-SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) | [NIST SP 800-218, Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final) | Secure development practices, including protecting build and distribution environments (PO.5). |

## Deployment model differences

Validate runners, OIDC issuers, and newer policies for your deployment.

| Topic | GHEC (personal accounts) | GHEC with EMU | GHEC with data residency (GHE.com) | GHES |
|---|---|---|---|---|
| GitHub-hosted and larger runners | Yes | Yes | Regional availability; validate selected region and runner capabilities. macOS runners [currently unavailable](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency) | **Not supported**; self-hosted only ([docs](https://docs.github.com/en/enterprise-server@3.22/admin/managing-github-actions-for-your-enterprise/managing-access-to-actions-from-githubcom/about-using-actions-in-your-enterprise)) |
| Azure private networking for hosted runners | Yes, larger runners only | Yes | Yes, but [supported regions differ](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/configuring-private-networking-for-hosted-compute-products/about-azure-private-networking-for-github-hosted-runners-in-your-enterprise) | N/A |
| OIDC issuer for cloud trust | `token.actions. githubusercontent.com` | Same | `token.actions.SUBDOMAIN.ghe.com` ([docs](https://docs.github.com/en/enterprise-cloud@latest/actions/reference/security/oidc)) | `HOSTNAME/_services/token` ([GHES 3.22 docs](https://docs.github.com/en/enterprise-server@3.22/actions/reference/security/oidc)) |
| Public actions | Marketplace available | Same | Marketplace unavailable; some actions hard-code `api.github.com` | Requires GitHub Connect to use GitHub.com actions |
| Fork PRs from outside collaborators | Relevant for any public repos | Managed users cannot create public repos | No public repos | Relevant if instance allows public repos |
| SHA pinning policy | Yes | Yes | Yes | Yes ([GHES 3.22](https://docs.github.com/en/enterprise-server@3.22/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise)) |
| Workflow execution protections and lockfiles | Check release status and availability | Same | Check GHE.com availability | Do not assume parity; validate against GHES 3.22 |
| Artifact attestations | Yes | Yes | Yes | Not available |
| Max retention for runs, artifacts, logs (private/internal) | 400 days | 400 days | 400 days | 400 days |

**Before go-live:** set GHE.com's subdomain issuer in every cloud trust. GHES requires ephemeral self-hosted isolation and governed runner groups; ARC is optional.

## Separate branch validation from privileged execution

**A branch is a collaboration mechanism, not a trust boundary.** [Part 1's preference for keeping contributions in the governed repository](/blog/github-waf-financial-services/platform-foundation/#enterprise-policies-closing-the-data-boundary) reduces uncontrolled copies; it does not make every contributor's code safe to execute with production access. GitHub explicitly warns that repository writers can access repository secrets through workflows ([secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use#use-secrets-for-sensitive-information)).

### Enforce the boundary before execution

- **Branch validation:** run unreviewed code on isolated, disposable runners without production credentials, production-network access, or access to privileged runner groups. Any unavoidable test/package credentials must be narrowly scoped, non-production, and treated as accessible to contributors. Do not give branch jobs general repository-write permissions.
- **Secret placement:** keep production credentials out of repository secrets and organization secrets shared with application repositories. Where stored deployment credentials remain necessary, use protected environment secrets. Log masking is not a data-loss prevention boundary.
- **Production environments:** use explicit selected branch/tag rules, independent required reviewers, and disabled administrator bypass as in Control 4. Do not allow PR merge refs or feature branches. [Environment rules match the triggering ref](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments#deployment-branches-and-tags), not every revision a job might check out; bind the actual source and artifact to the approved release too.
- **Cloud authorization:** enforce Control 3's trust restrictions at the cloud provider and Control 4's independent broker. Trusting only the repository is insufficient. A branch job requesting `id-token: write`, omitting the environment, or naming a different environment must not obtain a production-capable role. Environment-bound subjects still require the environment's branch and approval protections.
- **Privileged execution:** restrict deployment runners to approved workflows and separate them from branch-validation infrastructure. Do not execute unreviewed scripts, tests, or local actions after releasing privileged credentials. Treat branch-produced artifacts and caches as untrusted; do not promote them into privileged execution without the reviewed-revision, digest, and authorization checks.

**Review is necessary, but it happens too late to protect an already-running branch job.** CODEOWNERS, branch protection, required checks, read-only token defaults, and pinned actions are useful controls, not substitutes for this separation. Application code and build scripts can misuse inherited privileges even when `.github/workflows/` is unchanged. Apply [Part 3's active push restrictions](/blog/github-waf-financial-services/change-control/#push-rulesets-guard-the-files-that-guard-everything-else) to control files, but enforce credential, runner, network, and deployment boundaries independently.

### Verify the boundary

Use an isolated, production-equivalent test repository with synthetic credentials and harmless authorization probes. Test as an ordinary repository writer, not an administrator. Record the effective configuration, tested revision, allow/deny result, and enforcing system; never print real secrets or test disclosure to an external destination.

| Test | Required result |
|---|---|
| Push a new branch workflow or modify an existing one, then open a same-repository PR | Protected workflow edits are rejected unless independently authorized; any permitted branch validation has no production credentials or privileges, for both push and PR triggers |
| Change a build script or test without changing the workflow | Validation still runs without production access; workflow-file review is not credited as isolation |
| Request the production environment from a feature branch; omit it or name a new environment | Production access is denied; no repository/org secret or cloud-trust fallback supplies it |
| Request cloud identity from an unapproved branch, environment, or workflow | Provider trust or the independent broker denies production-capable access |
| Target a deployment runner or a production-network endpoint from branch validation | Runner authorization and network controls deny access, including on self-hosted infrastructure |
| Submit an unreviewed artifact or reuse branch-controlled cache data in a privileged path | No unreviewed code executes with privilege; source/artifact mismatch or missing authorization blocks release |
| Run an approved release, then repeat with approval withdrawn or the artifact changed | The approved release succeeds; the changed or unauthorized attempt is denied independently at the target |

Repeat after changes to secrets, environments, trust policies, runner access, or shared workflows. If a mandatory denial fails, suspend the affected privileged path until corrected; a clean merge check does not compensate.

## Control 1: Govern what code runs in the pipeline

### What we do

Set the enterprise policy to **Allow enterprise, and select non-enterprise, actions and reusable workflows**. Disable blanket GitHub-authored and Marketplace verified-creator allowances. Approve **specific immutable SHAs**, not repository wildcards. Turn on **Require actions to be pinned to a full-length commit SHA**. Host shared actions and reusable workflows in a dedicated internal organization with protected change review.

### Why

Actions execute third-party code with your credentials. WAF's [security guidance](https://learn.github.com/well-architected/library/application-security/recommendations/actions-security/) recommends SHA pinning and a central allowlist; a verified-creator badge is **not security assurance**. [Central reusability governance](https://learn.github.com/well-architected/library/collaboration/recommendations/scaling-actions-reusability/) adds a dedicated organization, contribution guidelines, and quarterly reviews. This supports **[US-3PRM-2023](https://www.occ.gov/news-issuances/bulletins/2023/bulletin-2023-17.html)**, **[EU-DORA-28-30](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_28)**, **[INT-PCI-12.8](https://www.pcisecuritystandards.org/document_library/)**, and **[US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance)**.

### How

Manage full-SHA entries in [enterprise policy](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise) through the documented API, with independent change approval and a maintained institutional allowlist.

Inspect the [Actions permissions API](https://docs.github.com/en/enterprise-cloud@latest/rest/actions/permissions) for organization eligibility, selected-action policy, SHA-pinning enforcement, category-wide allowances, and exact approved action references. Keep the approved allowlist under independent change control; compare effective enterprise/org settings with that baseline and investigate drift.

**A SHA proves immutability, not approval or provenance.** Resolve/peel the intended upstream release tag and compare its commit; fork-network resolution is insufficient. Review source/transitive actions, record advisories and available maintainer/signature evidence, then obtain platform-security approval. Never automatically promote Dependabot SHA bumps.

For each approved action, retain upstream repository/release identity, the resolved full commit SHA, source-review outcome, security review, approval owner, and review date. The allowlist must identify an institution-approved immutable revision, not merely a familiar action name.

**Trade-off:** pinned actions receive Dependabot version updates, not security alerts. Quarterly allowlist review covers that gap.

Enterprise-owned actions remain allowed by this category. Pin internal actions/reusable workflows to **verified, approved immutable commits**, protect central repos, and enforce the dependency manifest with a central required check. Review local/composite actions and transitive calls too. Until that gate exists, document the internal-action enforcement gap.

**[Workflow lockfiles](https://docs.github.com/en/enterprise-cloud@latest/actions/concepts/security/workflow-dependency-lockfiles)** inventory/pin actions, **not reusable workflow calls**. Retain full-SHA allowlist entries, never `@*`. Validate release status, entitlement, and terms; reviewed SHAs and central checks remain the baseline.

### Verify

- **Monthly:** Export `GET /enterprises/{enterprise}/actions/permissions` and `/selected-actions`. Diff against the approved JSON in your policy repo. Any drift is a finding.
- **Continuous:** Alert on the `business.update_actions_settings` audit log event, which records old and new policy values and the updated patterns ([audit log events](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise)).
- **Per update:** match each SHA to its approved upstream release and change ticket. Negative-test a random unapproved SHA, a fork-only commit, and an internal mutable reference.
- **Quarterly:** Review every allowlisted third-party action: maintainer health, open advisories, and whether anyone still uses it.

## Control 2: Least-privilege GITHUB_TOKEN

### What we do

Set the enterprise default `GITHUB_TOKEN` permission to **read-only**. Keep **Allow GitHub Actions to create and approve pull requests** disabled. In workflows, declare `permissions: {}` at the top and grant scopes per job.

### Why

Least privilege supports **[INT-PCI-7.2](https://www.pcisecuritystandards.org/document_library/)** and **[US-FFIEC-INFOSEC](https://ithandbook.ffiec.gov/it-booklets/information-security)**. WAF's [Actions guidance](https://learn.github.com/well-architected/library/application-security/recommendations/actions-security/) recommends restricted defaults and job-level scopes. Blocking bot PR approval preserves [Part 3's independent review](/blog/github-waf-financial-services/change-control/).

### How

[Enterprises created before February 2, 2023 default to read/write](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise#workflow-permissions); newer ones default to read-only. Verify rather than assume.

Through the [Actions permissions API](https://docs.github.com/en/enterprise-cloud@latest/rest/actions/permissions), confirm read-only default workflow permissions and that Actions cannot create or approve pull requests under the adopted policy. Inspect effective settings at each relevant scope and reconcile them with approved exceptions.

Review workflow/job permission declarations against their actual tasks. Branch-validation jobs should receive only the repository-read permissions they need; grant additional scopes only for an approved job purpose. Inspect workflow identity/version, event, runner class, requested scopes, and the independent controls limiting what those scopes can reach.

**The default is not a ceiling:** writers can raise workflow permissions. Protect `.github/workflows/**` through Part 3's active push restrictions and review, Control 5's available GA execution policies, and [workflow code scanning](https://docs.github.com/en/actions/reference/security/secure-use). Merge-time checks do not prevent a branch job from running first; enforce the [branch execution boundary](#separate-branch-validation-from-privileged-execution) before granting privileges. Select runners under Control 6's authorized-egress and isolation requirements.

### Verify

- **Monthly:** `GET /enterprises/{enterprise}/actions/permissions/workflow` should return `"default_workflow_permissions": "read"` and `"can_approve_pull_request_reviews": false`.
- **Continuous:** Alert on `business.set_default_workflow_permissions`.
- **Quarterly:** Sample workflows across critical repositories for top-level `write-all` or broad write scopes.

## Control 3: OIDC to cloud providers, not stored credentials

### What we do

Replace stored cloud keys with [OIDC](https://docs.github.com/en/actions/concepts/security/openid-connect) **deployment request roles**, never direct production-write access. Bind trust to issuer, audience, repository identity, environment, and approved immutable reusable workflow where supported. Control 4's broker owns production changes.

### Why

A stored cloud key can outlive both the job and its developer. OIDC exchanges a GitHub-issued token for a short-lived cloud credential. **Issued credentials still need protection, and their lifetime follows provider policy, not necessarily job end.** This supports least privilege ([INT-PCI-7.2](https://www.pcisecuritystandards.org/document_library/)), credential protection ([EU-DORA-9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9)), and secure build environments ([INT-NIST-SSDF](https://csrc.nist.gov/pubs/sp/800/218/final)). The WAF [SSDF guide](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) recommends OIDC under **PO.5**.

### How

`id-token: write` permits token requests, **not repository writes**. Environment-bound trust prevents request-role access before protection rules pass. An [environment subject](https://docs.github.com/en/actions/reference/security/oidc) looks like `repo:octo-org/octo-repo:environment:Production`.

**Federation prerequisites:** configure least-privilege cloud trust and Control 4's independent production authorization before enabling the job. Pin provider login actions to approved full SHAs. Register the chosen runner label and validate actual GitHub/API egress under Control 6; a standard hosted runner is not suitable under an IP allowlist. For Azure, `client-id`, `tenant-id`, and `subscription-id` identify the federation configuration, not stored cloud passwords. See [Configuring OIDC in Azure](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-azure). A login action alone does not authorize production deployment.

**Immutable subjects:** repositories created after July 15, 2026 include owner/repository IDs by default (`repo:octo-org@123456/octo-repo@456789:...`). Opt older repositories in at org/repo level so recycled names cannot inherit trust. This rollout excludes GHES.

[Custom-property claims](https://docs.github.com/en/actions/concepts/security/openid-connect#using-repository-custom-properties-as-oidc-claims) use `repo_property_*`, such as `repo_property_data_classification`. Use only centrally governed properties; classification proves neither release approval nor SoD.

### Verify

- **Monthly:** Secret scanning and a secrets inventory (see [Part 4](/blog/github-waf-financial-services/secrets-protection/)) should show zero cloud access keys in Actions secrets.
- **Quarterly:** export cloud trust policies. Confirm exact `sub`, environment/immutable-ID bindings where supported, and request-only permissions with no direct production-write role.
- **Continuous:** Cloud provider sign-in logs show workload identity sign-ins tied to the GitHub issuer. Correlate them with workflow run IDs in your SIEM.

## Control 4: Environments and separation of duties for deployments

### What we do

Every production deployment job references a `production` environment with:

- **Required reviewers** set to a release-approver team (not individuals).
- **Prevent self-review** enabled.
- **Allow administrators to bypass** disabled.
- **Deployment branches and tags** restricted to `main` and release tags.
- Environment-scoped secrets and variables only.

These settings need an **independent production broker**, outside application administration. It rejects approvers who authored/committed **any release change**, including bot-initiated releases.

### Why

**Prevent self-review** checks only the run initiator. A bot-initiated release can therefore let authors approve their own code. Environment approval alone does not establish production SoD.

### How

Per the [deployments and environments reference](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments):

- You can list up to six users or teams as required reviewers; only one needs to approve.
- **Prevent self-review** blocks the initiator, not the complete contributor set.
- Admin bypass is enabled by default; explicitly disable it.
- Environment secrets are unavailable to a job until a required reviewer approves it.
- Custom deployment protection rules are **public preview** and excluded from production, including supplemental gates. Use the GA deployment-platform/broker enforcement below.

**Deployment-side authorization contract (design specification, not runnable code):**

| Gate input or decision | Required behavior |
|---|---|
| Release identity | Bind approval to artifact digest, source head SHA, prior production digest/SHA, target environment, change ticket, and policy version. |
| Current ITSM authorization | Immediately before production execution, query authoritative ITSM state independently of PR/queue checks. Require an independently approved, non-cancelled change, a window containing current UTC time, and a verified mapping from approved scope/version to the final reviewed/merged revision and artifact. Missing, stale, out-of-scope or expired evidence denies authorization. Use a short-lived single-use execution authorization and revalidate if execution is delayed. |
| Contributor population | Independently enumerate the complete release delta from the previous production baseline, including merged PR authors, all commit authors/committers, and accountable human requesters of automated changes. Squash/rebase must not hide contributors. |
| Identity resolution | Resolve contributors and approvers to trusted institution identities. Email strings in Git commits alone are spoofable. Missing identities, incomplete pagination, API errors, or ambiguous release ancestry deny authorization. |
| Independent approval | Every required production approver must be outside the entire contributor set, requester set, and run-initiator set. Resolve bot initiation to accountable humans; a bot is not a SoD exemption. |
| Enforcement | Only the broker has production-write privileges. Actions can submit requests; app writers cannot alter gate policy, mint approval records, or assume a direct production-write role. |
| Approval lifecycle | The broker validates signed approval, approved approver role, exact digest/target, expiry, and single-use request ID. New commits/digests invalidate approvals. Expired, missing, revoked, replayed, or self-authored approvals deny deployment. |
| Provenance and evidence | Enforce Part 5's attestation/SBOM policy at the target and require the archived merge/release evidence manifest. Record both denied and allowed decisions. |

Implement, test, and approve this contract before enabling production. Missing independent contributor resolution or target enforcement blocks production until an approved alternative meets the objective.

Separate **CAB scope approval** from **digest-bound release approval**. In-scope review changes rerun technical/review gates and bind new evidence without automatically requiring a new CAB decision; changed artifacts need new release approval. [Part 3](/blog/github-waf-financial-services/change-control/#link-every-change-to-a-ticket) defines scope mapping and ITSM reruns. PR/queue checks never replace the broker's current-time authorization.

**During incidents:** use Control 9's audited emergency lifecycle, not undocumented admin bypass.

### Verify

- **Per deployment:** `GET /repos/{owner}/{repo}/actions/runs/{run_id}/approvals` returns the review history for a run ([REST docs](https://docs.github.com/en/rest/actions/workflow-runs)). Pair it with `GET /repos/{owner}/{repo}/deployments?environment=production` ([deployments API](https://docs.github.com/en/rest/deployments/deployments)) for the full chain.
- **Continuous:** Stream `workflows.approve_workflow_job` and `workflows.reject_workflow_job`, plus `environment.update_protection_rule` and `environment.remove_protection_rule`, to your SIEM ([audit log events](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise)).
- **Per deployment:** archive the broker's contributor set, identity resolution, signed approvals, source/artifact digests, and allow/deny decision. Compare the approver against **all release authors/committers**, not just the initiator.
- **Per deployment:** retain the authoritative ITSM state/version, query timestamp, implementation window, scope mapping and execution-authorization expiry alongside the decision. Negative-test a window closing or change being cancelled after PR/queue checks pass, an approval arriving after an earlier failure, an execution delay past authorization expiry, and an in-scope versus out-of-scope review commit. Stale checks never permit production; an updated approval must generate a new decision.
- **Quarterly:** negative-test bot initiation with an author approver, squash/rebase, unknown identity, empty or paginated contributor responses, API failure, changed digest, expired/replayed approval, and deletion of the repository's verification step. Each must deny at the target. These are implementation acceptance tests, not claims that the integration is already deployed.

Use the [enterprise audit-log API](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/using-the-audit-log-api-for-your-enterprise), [workflow run approvals](https://docs.github.com/en/rest/actions/workflow-runs), and [deployments API](https://docs.github.com/en/rest/deployments/deployments) to correlate actor, run/environment, approval time, deployment revision, and target outcome. These records complement, not replace, the broker's independent contributor and authorization decision.

## Control 5: Workflow execution policies and central safeguards

### What we do

Use [Part 3's centrally required policy workflows](/blog/github-waf-financial-services/change-control/#required-status-checks-and-merge-queue) to enforce approved action dependencies, job permissions, and workflow triggers. Use **workflow execution protections** to restrict sensitive workflows' actors and events.

### Why

Repository-controlled YAML cannot be its own authority for execution policy. Central checks and independent production authorization support **[US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance)**, **[EU-DORA-RTS-CHANGE](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774)**, and **[EU-DORA-9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9)**.

### How

Reject unapproved dependencies, permission elevation, and unsafe triggers through Part 3's trusted gates. Ruleset workflows cannot use most CodeQL actions; retain [Part 5's separate scanner controls](/blog/github-waf-financial-services/code-scanning-supply-chain/#merge-protection-findings-block-the-merge-not-the-release).

[Workflow execution protections](https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/administer/control-workflow-execution) are configured under **Actions > Policies** at enterprise, org, or repo level. Per [About Actions policies](https://docs.github.com/en/enterprise-cloud@latest/actions/concepts/about-actions-policies), you get:

- **Actor rules:** separate who contributes code from who can run workflows.
- **Event rules:** allow or block events such as `pull_request_target` and `workflow_dispatch`.
- **Require lockfile:** block targeted workflows not onboarded to the lockfile.

Block `pull_request_target` by default; restrict deployment dispatch to release actors. Validate feature status/availability. GA review, central checks, scoped credentials, and the broker remain the baseline; Evaluate/preview policies are not enforcement.

### Verify

- **Continuous:** Alert on `workflows.actions_policy_violation` and on `repository_ruleset.update` or `repository_ruleset.destroy`.
- **Monthly:** Export rulesets and execution policies through the REST API and diff against your policy repo.

## Control 6: Runner strategy

### What we do

| Workload | Runner choice | Why |
|---|---|---|
| CI on pull requests in IP-allowlisted organizations | Linux/Windows larger hosted runner with authorized static egress, or ephemeral self-hosted runner behind authorized NAT | Standard hosted and macOS larger runners cannot supply supported static-IP egress |
| CI without an IP allowlist, under an approved deployment exception | Standard GitHub-hosted | Ephemeral, isolated VM per job |
| Deployments to private networks (Azure, or on-premises via ExpressRoute/VPN) | Larger runners with Azure private networking | Private connectivity, no inbound ports, runner groups for access control |
| Specialized hardware, restricted-network, or GHES | Ephemeral self-hosted; ARC where Kubernetes is appropriate | Validate required control-plane and dependency connectivity; self-hosting does not imply offline operation |
| Anything | Persistent self-hosted runners | **No.** Not for production pipelines. |

At the enterprise level, disable repository-level self-hosted runners. Put every non-standard runner in a runner group restricted to specific organizations, repositories, and (for production) **selected workflows**.

### Why

Runner isolation supports **[INT-NIST-SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) PO.5**, **[INT-SWIFT-CSCF-OVERVIEW](https://www.swift.com/myswift/customer-security-programme)**, and **[US-FFIEC-AIO](https://ithandbook.ffiec.gov/it-booklets/architecture-infrastructure-and-operations)**. Include hosted runners in the provider inventory (**[US-3PRM-2023](https://www.occ.gov/news-issuances/bulletins/2023/bulletin-2023-17.html)**, **[EU-DORA-28-30](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_28)**, **[INT-PCI-12.8](https://www.pcisecuritystandards.org/document_library/)**).

[Hosted isolation differs from self-hosted persistence risk](https://docs.github.com/en/actions/reference/security/secure-use#hardening-for-self-hosted-runners). WAF recommends [Azure private networking](https://learn.github.com/well-architected/library/architecture/recommendations/hosted-runner-private-networking/) for private connectivity, not as a substitute for egress authorization.

### How

- **Static egress:** [Linux/Windows larger runners support static IPs; macOS larger runners do not](https://docs.github.com/en/actions/concepts/runners/larger-runners). Validate selected-region capabilities and actual `GITHUB_TOKEN` repository/API access. Never admit broad, changing standard-runner IP ranges to work around the boundary.
- **Azure private networking:** available for supported larger runners and uses dynamic runner IPs ([docs](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/configuring-private-networking-for-hosted-compute-products/about-azure-private-networking-for-github-hosted-runners-in-your-enterprise)). Route egress through an institution-controlled, authorized NAT where required and test GitHub/API access. Private connectivity alone does not satisfy an enterprise IP allowlist. Follow [GitHub's IP-allowlist runner guidance](https://docs.github.com/en/enterprise-cloud@latest/organizations/keeping-your-organization-secure/managing-allowed-ip-addresses-for-your-organization).
- **ARC:** use [ephemeral Kubernetes scale sets](https://docs.github.com/en/actions/concepts/runners/actions-runner-controller), following [autoscaling guidance](https://docs.github.com/en/actions/reference/runners/self-hosted-runners). [WAF's ARC guidance](https://learn.github.com/well-architected/library/architecture/recommendations/deploying-actions-runner-controller/) requires dedicated security boundaries, no spot instances, and Kubernetes expertise. You own cluster security; ARC adds none.
- **Runner groups:** restrict production runner groups to approved, immutable reusable workflows under the [runner group docs](https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/manage-runners/self-hosted-runners/manage-access). Runner access limits execution; it does not replace Control 4's broker authorization or grant direct production-write access.
- **Optional:** [disable standard hosted runners](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise#disabling-standard-hosted-runners) to force governed runner groups.

### Verify

- **Monthly:** `GET /enterprises/{enterprise}/actions/permissions/self-hosted-runners` confirms repo-level runners are disabled. Export runner groups and their repository and workflow access lists.
- **Continuous:** Alert on `org.runner_group_updated`, `org.runner_group_runners_added`, and any `org.self_hosted_runner_online` event from a runner you do not recognize.
- **Quarterly:** Confirm runner images and ARC are current. Self-hosted runners on GHEC must stay within 30 days of the latest runner release, per the WAF ARC guidance.

## Operate CI performance, cost, and capacity

**What we do.** Treat CI as a measured service with workload owners, not an unlimited pile of free YAML. Platform engineering owns fleet capacity and health; service teams own test design and demand; the budget owner agrees spending and escalation thresholds.

**Why.** WAF's [effective CI guidance](https://learn.github.com/well-architected/library/productivity/recommendations/effective-ci/) belongs beside hardening. Long queues and flaky checks encourage reruns and unsafe workarounds. Overprovisioning every job buys a larger bill, not necessarily a faster release.

**How.** First separate **queue time, execution time, approval wait, and archive/broker delay**. Measure p50/p95 by workload and runner class. A two-minute test behind a twenty-minute queue needs a different fix from a twenty-minute compiler step.

| Improvement | Practical application | Boundary to preserve |
|---|---|---|
| Remove duplicate work | Review overlapping push/PR triggers; cancel obsolete PR validation | Preserve required checks and reviewed-revision binding; retain required evidence |
| Right-size execution | Benchmark banking API builds on approved runner sizes; bound matrix parallelism | Do not move sensitive work to an unauthorized runner to save money |
| Cache selectively | Cache package downloads using OS/toolchain/lockfile-aware keys | Treat restored data as untrusted; never cache credentials or rely on caches for release inventory |
| Improve tests | Run cheap deterministic feedback early; isolate and fix flaky tests with owners and expiry | Do not silently drop mandatory security or release tests |
| Control storage | Separate short-lived scratch output from governed release/evidence records | Honor Control 8 and Part 1 retention; do not delete required evidence to meet a budget |

Use [dependency caching](https://docs.github.com/en/actions/concepts/workflows-and-actions/dependency-caching) only after confirming trust and access boundaries. A cache miss must remain a correct build. Periodically run an uncached representative build to expose hidden downloads, revoked registry credentials, and incomplete lockfiles.

For replaceable **PR validation only**, define cancellation behavior that avoids spending capacity on superseded revisions:

Define concurrency groups for replaceable PR validation so obsolete work for the same PR can be cancelled without affecting another PR or release. Inspect cancellation behavior, retained evidence, required-check completion, and the distinction between validation and non-idempotent production work.

See [concurrency behavior](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency). Do not apply this cancellation pattern to production deployments, migrations, or non-idempotent infrastructure changes. Concurrency is not a transactional lock or independent production authorization; Control 4's broker still governs execution and duplicate requests.

Assign cost/capacity ownership explicitly:

- **Platform owner:** runner pools, image lifecycle, concurrency ceilings, scaling limits, and on-call diagnostics.
- **Service owner:** expected demand, expensive matrices, flaky-test cleanup, and planned release peaks.
- **Budget owner:** spending review and escalation. Attribute runner minutes, storage, and self-hosted infrastructure costs by workload where billing and internal telemetry permit.
- **Release operations:** prioritize incident delivery using approved pool reservations or scheduling arrangements. Verify these locally; do not assume GitHub provides a cross-workload priority queue.

Start with illustrative objectives such as p95 queue delay below two minutes for routine PRs and actionable feedback within ten minutes for a representative API. Baseline first, agree capacity, and publish exceptions for large builds. Budget alerts are signals, not authorization to stop a critical payments fix without the continuity decision.

**Verify.** Review queue/execution trends, cancellation/rerun rates, spend per workload, and supported-path adoption monthly. Compare before/after changes using equivalent workloads. Track mandatory-control failures separately; fast green checks with missing coverage are not a productivity win.

## Control 7: Untrusted input (fork PRs, pull_request_target, and script injection)

### What we do

- Require approval for **all outside collaborators** before fork PR workflows run.
- In private and internal repositories, **disable fork PR workflows by default**. An approved, time-limited exception must state the need, isolate execution, require approval, and never send write tokens or secrets.
- Block `pull_request_target` by default. Grant exceptions per workflow, after security review.
- Never insert contributor-controlled values directly into shell instructions; pass them as structured data and inspect downstream handling.

### Why

Attackers do not need repository access if your workflow runs their code with your secrets. This is integrity protection ([EU-DORA-9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9), [US-FFIEC-INFOSEC](https://ithandbook.ffiec.gov/it-booklets/information-security)) and secure development practice ([INT-NIST-SSDF](https://csrc.nist.gov/pubs/sp/800/218/final)).

### How

**[Fork approvals](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise#fork-pull-request-workflows-from-outside-collaborators):** require approval for **all outside collaborators**, retaining the reviewed UI setting where a supported API export is unavailable. **`pull_request_target` runs regardless of these approvals.**

Inspect the private/internal fork-workflow settings through the [Actions permissions API](https://docs.github.com/en/rest/actions/permissions). The baseline disables fork PR execution, write-token delivery, and secret/variable delivery. Retain the approval policy for any separately approved fork-enabled test environment and prove its behavior with the negative tests below.

**[`pull_request_target`](https://docs.github.com/en/enterprise-cloud@latest/actions/reference/security/securely-using-pull_request_target)** exposes base-repository privilege. Executing PR-head code, untrusted inputs, or artifacts can compromise it. Verified November 6, 2026: GitHub's documented **December 2, 2026** enforcement covers affected public repos using its default pre-GA policy, not a universal block today. Enforce your own private/internal and public-exception controls. Treat `workflow_run` artifacts as untrusted too.

**Script injection.** Apply the input-handling principles in the [secure use reference](https://docs.github.com/en/actions/reference/security/secure-use#good-practices-for-mitigating-script-injection-attacks).

Treat PR titles, issue bodies, branch names, and other contributor-controlled values as data, never interpolated shell instructions. Use an action that accepts structured inputs or pass values through intermediate environment variables with appropriate quoting. Review scripts and downstream consumers too; changing the input mechanism does not make an unsafe command safe. Test with harmless synthetic metacharacters and retain the result.

### Verify

- **Monthly:** Review and retain the enterprise UI contributor-approval setting and export the private/internal fork-workflow policy above. Alert on `business.set_actions_fork_pr_approvals_policy` and `business.set_actions_private_fork_pr_approvals_policy`.
- **Quarterly negative test:** in an isolated, fork-enabled test repo, submit synthetic outside PRs, including from a previously accepted contributor. Confirm `pull_request` waits for human approval. Separately prove private/internal fork PRs run nothing under the disabled default. Retain results; use no secrets or production runners.
- **Continuous:** Code scanning alerts on workflow files (see [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/)) should be triaged within your vulnerability SLA.
- **Quarterly:** Search the codebase for `pull_request_target` and confirm each hit has a documented exception.

## Control 8: Retention, logs, and attestations as evidence

### What we do

Set private/internal retention to **400 days** and stream audit events. Independently archive production run/deployment records and Part 5's required provenance.

### Why

Since **October 1, 2026**, [retention policy](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise#artifact-and-log-retention) covers **checks, workflow runs, and commit statuses** as well as logs/artifacts. The default is **90 days**. Review it now.

GitHub is not your long-term system of record. [Part 1's evidence standard](/blog/github-waf-financial-services/platform-foundation/#evidence-retention-and-integrity) owns record-type schedules, immutable storage, signed hashes, access separation, and retrieval tests. The domain contract below defines what to capture, when, and how missing evidence blocks deployment.

### How

Use the [Actions permissions API](https://docs.github.com/en/rest/actions/permissions) to inspect retention settings, and the [workflow runs API](https://docs.github.com/en/rest/actions/workflow-runs) for run/attempt identity, status, timestamps, logs, artifacts, and approval records through the supported companion endpoints. Confirm the configured native retention matches institutional policy, within plan limits; independently archive required records before expiry. Native retention alone is not the evidence service.

**Archive service requirements:**

1. **Population:** centrally approved repository/workflow inventory, every production deployment attempt (success, failure, cancellation, rejection, rerun, and emergency), its build runs, and all protected-branch merges. Reconcile with independent target deployment logs, not just successful GitHub runs.
2. **Collection:** an independently administered service consumes events and runs an **hourly paginated API backfill**, with a rolling seven-day overlap, durable cursors, retries, rate-limit handling, and idempotent run/attempt keys. Capture checks, suites, statuses, rule results and reviews **at merge**; capture deployment approvals, artifact digests, and target verification decisions **at deployment**. Collect completed-run logs, artifacts, approvals, deployment records, SBOMs, and attestation bundles within **24 hours**. Do not wait until day 400.
3. **Release binding:** apply Part 1's archive controls with manifests binding source IDs, collection timestamps, collector identity, source/artifact SHA, run/attempt ID, and policy version. A repository log or hash without the release binding is insufficient.
4. **Completeness:** reconcile inventory, merges, workflow attempts and target deployments **daily**, and have second line review a monthly report. API errors, missing pages, deleted runs, inaccessible repositories, and unexplained count differences create collection incidents. Never advance a cursor over an unresolved gap or silently treat an empty response as success.
5. **Merge and deploy evidence:** the release broker requires a complete archived merge/check manifest before normal deployment. Post-run archival gaps block subsequent releases until resolved or activated through Control 9's approved emergency lifecycle.
6. **Availability:** keep required recent logs immediately queryable under Part 1's schedule; test retrieval/hash verification monthly and restore a sampled release quarterly. Alert on stream/backfill lag well before source retention expires.

`workflows.completed_workflow_run` is available through REST, streaming, or exports, **not the web UI**. Use streaming with backfill.

**Attestation enforcement:** consume [Part 5's SBOM/provenance policy and qualified SLSA assessment](/blog/github-waf-financial-services/code-scanning-supply-chain/#build-provenance-artifact-attestations-and-slsa). The target verifies the exact artifact-bound evidence before deployment; archive bundles, artifact, and approved trust material for [offline verification](https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/secure-your-work/use-artifact-attestations/verify-attestations-offline). GHES has no artifact attestations: use Part 5's external signing alternative or approved lower-provenance compensating controls, never assume parity.

### Verify

- **Monthly:** `GET .../artifact-and-log-retention` returns 400. Alert on `business.set_actions_retention_limit`.
- **Daily:** reconcile the complete population against the archive and independent target records; page on missing evidence and collection failures.
- **Monthly:** second line reviews completeness, immutable-retention settings, access, signed hashes, and retrieval tests.
- **Daily (automated):** SIEM rules review applicable Actions events. This **contributes to** PCI log review; it does not cover every system in the PCI scope by itself.

## Control 9: Resilience of CI/CD

### What we do

For critical workloads, operate runner recovery and delivery continuity alongside security controls. Keep deployment logic in versioned scripts, maintain an alternate audited invocation path with its own short-lived identity, and rehearse both routine fleet failures and control-plane outages.

### Why

Operational resilience expectations (including applicable DORA, [OSFI B-13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management), and FFIEC guidance) extend beyond preventing compromise. The institution must understand whether it can deliver a fix when its runner pool, registry, identity provider, or CI control plane fails. "We'll wait for the status page to go green" is not a continuity plan.

### How

Following [WAF's resilience guidance](https://learn.github.com/well-architected/library/architecture/recommendations/designing-resilient-ci-cd/), preserve portable deployment scripts, approved artifacts, immutable release IDs, tooling, and attestation/trust bundles. Use the GitHub Status API to identify the failure; do not switch paths when both depend on the failed service.

**Runner service runbook:** distinguish a runner-capacity incident from a GitHub outage before invoking emergency access.

| Failure | Prepared response | Acceptance evidence |
|---|---|---|
| Approved runner image breaks builds | Drain affected capacity; provision fresh ephemeral workers from the last approved image | Successful representative build and cleanup; image/version recorded |
| Pool saturation at a release peak | Apply agreed concurrency limits and provision approved reserve capacity | Queue recovery without crossing runner/network boundaries |
| Runner host or ARC cluster failure | Recreate workers in a separately approved failure domain where supported | No inherited workspace; correct group, image, egress, and identity |
| Package registry or network dependency fails | Use approved mirrors/retained packages where permitted, or pause | Integrity and licensing checks still pass; no fallback to arbitrary public downloads |
| CI control plane unavailable | Use the independently reachable recovery path below for approved artifacts | Same authorization, provenance, and evidence obligations enforced |

A runner group is an access boundary, not a high-availability guarantee. For self-hosted capacity, document autoscaling limits, registration dependencies, image sources, teardown verification, and who answers the pager. For hosted capacity, document regional availability, quotas, provider escalation, and tested alternatives.

Define recovery objectives against the **business service**, such as the latest acceptable time to deliver a payments incident fix. Record dependencies on GitHub, registries, cloud APIs, DNS, identity/PAM, the broker, and the archive. Two pools behind the same failed NAT are not two recovery paths.

Keep reserve capacity within the approved cost envelope and exercise it. Drain/rebuild suspect workers rather than reusing a potentially compromised workspace to meet a queue target. A temporary recovery image must still meet the institution's security and provenance requirements.

**Concrete emergency lifecycle:** the same independently governed deployment broker is reachable from a hardened recovery workstation through the institution's identity system, without Actions. This is a required platform design, not a runnable institution adapter:

1. The recovery operator submits an emergency change with outage evidence, target, immutable artifact digest, contributor manifest, and rollback plan. If GitHub is unavailable, use the signed continuity copy from the immutable archive. Missing or unverifiable inputs deny activation.
2. An incident commander and an independent release-control approver authorize activation. Neither may be a release author/committer or requester. The deployment approver separately passes Control 4's full contributor-set check.
3. Privileged access management issues a **single-target, single-digest, single-use grant lasting at most 60 minutes**, bound to the approved incident and authenticated operator. There is no standing recovery production-write identity or permanent secret.
4. The broker enforces the same target attestation/SBOM and SoD policy, verifies approved offline trust material when needed, and logs operator, approvers, grant, commands/decisions, digests, and results to the independent immutable archive.
5. Expiry or completion revokes the grant automatically; security verifies revocation and absence of direct production-role access. New artifacts require new approval. Replay and expired grants fail closed.
6. Before normal pipelines resume, reconcile target state with the change/release ledger to prevent duplicate deployment. Within **one business day**, link the emergency evidence and grant revocation to normal change records, with independent reconciliation sign-off.

If the broker, identity/PAM service, or durable evidence sink is also unavailable, stop and invoke the separately approved manual BCM procedure; do not improvise a privileged bypass. For source continuity, see [repository mirroring](https://learn.github.com/well-architected/library/architecture/recommendations/building-resilience-with-repository-mirroring/) and [Part 1's provider exit standard](/blog/github-waf-financial-services/platform-foundation/#provider-exit-and-concentration-risk).

### Verify

- **Semi-annually (or per your BCM schedule):** Run a tabletop or live rehearsal. Keep the record: who activated, what was deployed, approvals, and reconciliation.
- **Quarterly:** exercise lost runner capacity, a failed image rollout, and an unavailable dependency using synthetic/non-production workloads. Measure time to resume delivery, confirm fresh-worker isolation and authorized egress, and assign corrective work with owners.
- **At each continuity exercise:** show which dependencies are genuinely independent and compare measured recovery with the business-service objective. A missed objective is a resilience finding; it never waives production authorization.
- **After each use:** Confirm temporary credentials were revoked and the deployment was reconciled into normal history.

## Control matrix

| Control | Requirement IDs | GitHub feature | Evidence | Cadence |
|---|---|---|---|---|
| Approved action code and SHA pinning | [US-3PRM-2023](https://www.occ.gov/news-issuances/bulletins/2023/bulletin-2023-17.html), [EU-DORA-28-30](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_28), [INT-PCI-12.8](https://www.pcisecuritystandards.org/document_library/), [US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance) | Exact-SHA selected-actions policy; central dependency gate | Approved digest/provenance register; policy export; update approvals | Per update; monthly drift; quarterly review |
| Read-only GITHUB_TOKEN | [INT-PCI-7.2](https://www.pcisecuritystandards.org/document_library/), [US-FFIEC-INFOSEC](https://ithandbook.ffiec.gov/it-booklets/information-security) | Workflow permissions policy | `/actions/permissions/workflow` export; `business.set_default_workflow_permissions` | Monthly |
| OIDC, no stored cloud keys | [INT-PCI-7.2](https://www.pcisecuritystandards.org/document_library/), [EU-DORA-9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9), [INT-NIST-SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) | Request-only OIDC roles; immutable identity where supported; governed property claims | Cloud trust policy export; secrets inventory | Monthly inventory; quarterly trust review |
| Production SoD, including bot-initiated releases | [EU-DORA-RTS-CHANGE](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774), [US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance), [CA-OSFI-B13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management), [MX-CNBV-CUB](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) | Environments supplemental; trusted external deployment broker mandatory | Full contributor manifest; independent signed approvals; target deny/allow decision | Per deployment; quarterly negative tests |
| Execution policy and central safeguards | [US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance), [EU-DORA-RTS-CHANGE](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774), [EU-DORA-9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9) | Part 3 required GA gates; supported action/token/actor/event policies; central checks and broker enforcement | Policy export; `workflows.actions_policy_violation`; negative tests | Continuous; monthly |
| Runner isolation | [INT-NIST-SSDF](https://csrc.nist.gov/pubs/sp/800/218/final), [INT-SWIFT-CSCF-OVERVIEW](https://www.swift.com/myswift/customer-security-programme), [US-FFIEC-AIO](https://ithandbook.ffiec.gov/it-booklets/architecture-infrastructure-and-operations), [CA-AMF-ICT](https://lautorite.qc.ca/en/professionals/insurers/guidelines/operational-risk/guideline-on-information-and-communications-technology-risk-management) | Hosted and larger runners, Azure private networking, ARC, runner groups | Runner group export; runner audit events | Monthly; quarterly patch review |
| Supported golden paths | Engineering service standard; supports [US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance) governance, not a standalone regulatory requirement | Approved reusable workflows, catalog contracts, pilot upgrades | Onboarding tests, consumer versions, support and deprecation records | Monthly onboarding sample; per upgrade |
| CI efficiency and capacity ownership | Engineering service objectives; no universal regulatory latency or cost threshold | Workload telemetry, approved pools, concurrency and cache controls | Queue/execution trends, reruns, workload cost and named capacity/budget owners | Monthly; planned release peaks |
| Untrusted input controls | [EU-DORA-9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9), [US-FFIEC-INFOSEC](https://ithandbook.ffiec.gov/it-booklets/information-security), [INT-NIST-SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) | Fork PR policies, event rules, code scanning | Fork policy export; code scanning alerts | Monthly; continuous |
| Retention and log archive | [INT-PCI-10.4](https://www.pcisecuritystandards.org/document_library/), [INT-PCI-10.5.1](https://www.pcisecuritystandards.org/document_library/), [EU-DORA-9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9) | Retention policy plus independent scheduled archive | Merge-time checks; signed hashed manifests; target/population reconciliation | Hourly backfill; daily reconcile; monthly second-line review |
| CI/CD resilience | [CA-OSFI-B13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management), [US-FFIEC-AIO](https://ithandbook.ffiec.gov/it-booklets/architecture-infrastructure-and-operations); applicable [DORA continuity obligations beyond Art. 9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554) | Runner recovery, portable deployment logic, independently governed recovery identity | Capacity/image recovery tests, measured recovery, emergency approval and reconciliation records | Quarterly runner exercises; semi-annual continuity rehearsal |

## Summary and key takeaways

A well-architected FI delivery platform gives teams a supported way to ship, not just a list of things they cannot do. Reusable paths, fast feedback, and owned capacity make the controls sustainable.

Keep execution, identity, independent production authorization, and evidence as hard boundaries. Treat queue delay, onboarding friction, cost, and recovery performance as operational work with owners. You need both columns; neither a secure outage nor a fast compromise is the target architecture.

**Start here:**

- [ ] Publish supported API, packaged-service, and infrastructure paths with maintainers, immutable revisions, explicit inputs, and tested onboarding.
- [ ] Switch the enterprise Actions policy to selected actions, disable blanket verified-creator access, and require full-length SHA pinning. Manage the allowlist as code.
- [ ] Confirm read-only default token permissions, independently approved per-job scopes, and that Actions cannot approve pull requests.
- [ ] Remove stored cloud keys; bind OIDC request roles to environment and immutable identity claims. Protect provider-issued credentials for their full lifetime.
- [ ] Configure production environments and deploy the independent target gate that blocks **all release authors/committers**, even on bot-initiated runs.
- [ ] Use Part 3's required gates for action/token/trigger policy; restrict deployment actors and block `pull_request_target` with active controls.
- [ ] Disable repository-level self-hosted runners. Use runner groups restricted to selected workflows for production.
- [ ] Baseline queue/execution/approval delay, reruns, and workload cost. Assign capacity and budget owners; publish service objectives separately from gates.
- [ ] Cancel only replaceable validation work, keep cache misses correct, and preserve mandatory test and evidence coverage.
- [ ] Keep private/internal fork workflows off by default; document exceptions, approvals, and isolated secret-free execution.
- [ ] Set retention to 400 days; implement timed capture, hourly backfill, daily reconciliation, and missing-evidence release gating.
- [ ] Exercise runner/image recovery, approved reserve capacity, and an independently reachable deployment path without relaxing target controls.

**First implementation slice:** onboard one payments API through a catalog path. Trace its check latency, runner demand, approval, artifact, target decision, and archived evidence. Then fail its runner pool in non-production and prove the recovery route works. That tests the platform, not just the YAML.

**Previous:** [Part 5: Code Scanning and Software Supply Chain](/blog/github-waf-financial-services/code-scanning-supply-chain/)
**Next:** [Part 7: Copilot and AI Agents](/blog/github-waf-financial-services/copilot-and-agents/)

## References

### Further reading

Use **The requirements** for regulatory citations and each control's inline links for procedures. Part 3 owns generic gate construction; Part 5 owns attestation semantics.

- [Effective CI](https://learn.github.com/well-architected/library/productivity/recommendations/effective-ci/) for pipeline design beyond hardening.
- [Ruleset rule reference](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) for platform policy authors.
- [Artifact attestation concepts](https://docs.github.com/en/actions/concepts/security/artifact-attestations) for provenance background.
- [Federal Reserve SR 23-4](https://www.federalreserve.gov/supervisionreg/srletters/SR2304.htm), the Fed publication of interagency third-party guidance.
- [DORA full regulation](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554) for applicability beyond the cited articles.
