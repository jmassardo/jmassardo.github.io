---
layout: post
title: "GitHub Well-Architected for Financial Services, Part 3: Source Code Management and Change Control"
date: 2026-11-10 10:03:00 -0600
category: Blog
tags: [github, well-architected, financial-services, compliance, security, governance, change-management, rulesets, sox]
excerpt: "Make financial-services repositories easy to find, maintain, and contribute to, with clear ownership, effective reviews, risk-tiered change controls, and evidence that follows the release."
permalink: /blog/github-waf-financial-services/change-control/
---

*This post is part of the [GitHub Well-Architected for Financial Services](/blog/github-waf-financial-services/) series.*

**Previous:** [Part 2: Identity and Access Management](/blog/github-waf-financial-services/identity-and-access/) | **Next:** [Part 4: Secrets Protection](/blog/github-waf-financial-services/secrets-protection/)

{::options toc_levels="2" /}

**In this post**

* Contents
{:toc}

## Leadership brief

- **Why it matters:** Software changes can disrupt customer services or compromise financial records. Effective change control reduces that risk without delaying necessary fixes.
- **Your decision:** Require clear ownership, independent review, and release authorization proportionate to risk, with a separately governed emergency process.
- **Accountability:** Engineering owns implementation and testing; designated change authorities authorize production release. Control owners verify that the required independent review and authorization occurred.
- **Ask for:** Evidence that production releases match what was reviewed and authorized, alongside trends in approval delays, failed changes, and emergency exceptions.

---

Good change control starts before a pull request. Teams need to find the authoritative repository, identify its owner, understand who depends on it, and reach reviewers who can assess the proposed change. Approval requirements cannot compensate for missing ownership or unfamiliar reviewers.

This chapter follows that path from repository ownership and contribution guidance through independent review, release authorization, and production evidence. It explains how to protect those decisions in GitHub, handle emergency changes without losing accountability, and verify that the released software is the version that was approved.

> **Applicability:** The regulatory mappings identify requirements these controls can support; they do not establish compliance or certification. Apply Part 1's [deployment decision](/blog/github-waf-financial-services/platform-foundation/#choosing-your-deployment-model), [classification schema](/blog/github-waf-financial-services/platform-foundation/#data-classification-with-custom-properties), and [GA production baseline](/blog/github-waf-financial-services/platform-foundation/#feature-availability-and-preview-controls). GHES guidance targets the **3.22 GA release series**. Preview features are excluded from production. Validate institutional integrations and operating evidence before relying on the controls.

## WAF outcomes for source and change

| Pillar | Apply it here | Verify the engineering outcome |
|---|---|---|
| **Governance** | Name maintainers, change authorities, control owners, and risk-tiered contribution rules. | No active repository lacks an accountable team; exceptions have independent authority and expiry. |
| **Architecture** | Document component boundaries, consumers, compatibility, and release dependencies. | A library or infrastructure change has a known impact and a tested rollback/recovery path. |
| **Application Security** | Protect source, control files, review independence, and release provenance. | Negative tests reject unauthorized revisions and checks cannot be spoofed by local workflows. |
| **Collaboration** | Support discoverability, contribution guidance, maintainer response, and controlled inner source. | Banking and payments teams can improve shared code without expanding access to restricted systems. |
| **Productivity** | Keep changes reviewable, checks actionable, and queues observable. | Review wait and rework decrease without higher defect escape or weakened accountability. |

Use the [WAF DevOps feedback principles](https://learn.github.com/well-architected/library/collaboration/recommendations/applying-devops-methodology/) to improve the whole journey. Counting approvals alone tells you very little about whether anyone understood the change.

## Repository ownership, discoverability, and documentation

### What: every repository has a maintained contract

**Assign an accountable owning team and an operational maintainer route to every active repository.** Ownership includes code quality, support, dependency updates, documentation, contribution triage, and retirement.

The governance-approved `owner-team` and `app-id` from [Part 1](/blog/github-waf-financial-services/platform-foundation/#data-classification-with-custom-properties) remain the authoritative inventory links. `CODEOWNERS` routes path-level review; it does not replace business ownership or change authority.

### Why: discovery and maintenance are delivery capabilities

When teams cannot find a supported library, they build another one. When they cannot reach its maintainers, they copy it. Both choices multiply patching, compatibility, and evidence work.

Clear ownership also makes incidents less theatrical. Release operations should not need Git archaeology to find someone authorized to explain a banking application's rollback.

### How: publish the information a contributor needs

Use a descriptive repository name, a concise About description, and a consistent README. Link the repository to its service catalog entry and record the actual support route.

| Repository information | Minimum useful content |
|---|---|
| Purpose and status | What it does, supported consumers, active/maintenance/deprecated status, and replacement if retiring |
| Ownership | Owning team, maintainer contact, support hours, and incident escalation |
| Setup and tests | Prerequisites, approved dependency sources, safe test-data guidance, and verified build/test commands |
| Architecture | Boundaries, important dependencies, design decisions, and links to interface contracts |
| Contribution | Issue/PR route, expected tests and documentation, reviewer routing, and response expectations |
| Release and recovery | Version/compatibility policy, release authority, deployment runbook, rollback constraints, and recovery references |
| Information handling | Classification reference and where sensitive operational details belong |

GitHub [surfaces a repository README](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes) and [contribution guidelines](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/setting-guidelines-for-repository-contributors). Put `CONTRIBUTING.md` where GitHub recognizes it, and keep operational commands specific to the actual project.

For a shared payment-amount library, verify that the documentation answers these questions:

| Documentation area | What contributors should be able to establish |
|---|---|
| Purpose and consumers | What the library does and which banking or payments services depend on it |
| Ownership and support | The accountable team, support route, and incident escalation |
| Build and test | Maintained prerequisites, project-tested procedures, and synthetic test data |
| Compatibility and release | Supported versions, compatibility commitments, release process, and migration guidance |
| Contributing | How to propose a change, obtain review, and satisfy release authorization |

Validate the documentation with a new contributor before admitting the repository as supported. A list of headings without maintained project information is not completed onboarding.

Use an approved, non-sensitive vocabulary for discovery, such as `shared-library`, `banking`, or `terraform-module`. **[Topic names are always public](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics), even when created in a private repository.** Never use client names, confidential projects, or information-barrier labels as topics.

Topics and names help discovery; governance-owned properties control scope. Do not treat a searchable tag as an access boundary or an authoritative compliance inventory.

At ownership transfer, reconcile team grants, code owners, service-catalog records, support coverage, and open work. When retiring a repository, document consumers and replacement, apply retention requirements, revoke unused integrations, and archive through the approved lifecycle.

### Verify: prove someone else can use it

At onboarding and material ownership changes, ask an engineer outside the owning team to find the repository, identify maintainers, run safe tests, and propose a small documentation change.

Review active-repository ownership coverage and stale/deprecated entries monthly. Critical banking services need current runbooks and backup maintainer coverage, not just a team slug that resolves.

## Controlled inner source across financial business lines

### What: share contributions without sharing everything

**Let approved teams improve shared code through a documented maintainer model.** Start with a library or infrastructure module used by more than one business line.

Inner source does not require making every repository internal. Internal visibility grants broad enterprise read; private repositories with scoped teams can support collaboration where need-to-know requires it.

### Why: reuse needs a contribution path

A retail banking team should be able to fix a shared validation bug without forking an unsupported copy. Payments maintainers still own compatibility, review quality, and release decisions.

The goal is lower duplication and faster shared fixes, not bypassing information barriers. MNPI, customer-specific data, credentials, and regulated workloads retain their handling requirements.

### How: establish the contribution agreement

1. **Approve the sharing boundary.** The business owner and governance classify the repository, audience, consumer relationships, and contribution rights. Use [Part 2's team-based access](/blog/github-waf-financial-services/identity-and-access/#least-privilege-base-permissions-and-roles), not ad hoc direct grants.
2. **Publish the entry point.** Maintainers explain when an issue or design proposal should precede a PR, how to request access, and which changes need consumer consultation.
3. **Make safe testing possible.** Supply synthetic fixtures and interface/contract tests. Do not require contributors to access production customer data or every consuming application.
4. **Preserve maintainer accountability.** External-to-team contributors propose changes; eligible owners review and release them. Broad contribution rights do not imply release authority, bypass, or control-file ownership.
5. **Coordinate adoption.** Record affected consumers, compatibility decisions, release notes, and migration responsibilities. Banking and payments owners agree how breaking changes will be introduced.
6. **Fund maintenance.** Agree a response target and a backup reviewer route. If contribution demand exceeds capacity, prioritize it openly rather than leaving PRs to age indefinitely.

For the rounding fix, the banking contributor supplies a failing synthetic test and proposed correction. Payments maintainers review currency and posting semantics; both consumer teams run relevant contract tests. Release operations publishes the approved version, and consuming applications follow their own change paths.

Controlled branches in the shared repository replace the need for casual forks under this series' default fork restrictions. Any permitted fork still needs Part 1's explicit boundary review.

**Risk-tier the contribution path without weakening mandatory controls:**

| Change context | Collaboration and review focus | Accountable decision |
|---|---|---|
| Non-executable documentation | Accuracy, discoverability, sensitive information, and whether content changes operational instructions | Maintainer confirms scope; apply the approved change policy rather than assuming all Markdown is low risk |
| Shared banking/payments library | Compatibility, dependency consumers, domain tests, and coordinated adoption | Library owner and affected service owners decide compatibility and rollout within their authority |
| Infrastructure repository | Plan/impact review, environment boundaries, recovery, and blast radius | Infrastructure owner plus independent authorized reviewers/change authority |
| Critical payments or regulated banking change | Business behavior, security, final-revision review, authorization, release window, and fallback | Domain owners, independent change authority, and release operations fulfill separate duties |

These are institutional operating patterns, not regulatory exemptions. The restrictive all-repository baseline below remains active. Governance must approve and test any scoped relaxation; a repository maintainer cannot declare their own work out of scope.

### Verify: measure collaboration that produces maintained code

Track time to maintainer response, contribution completion, abandoned PRs, adoption across consumers, and recurring requests for duplicate libraries. Review the reasons, not a contributor leaderboard.

Sample a cross-business-line contribution quarterly. Demonstrate scoped access, useful review, consumer testing, documented adoption, and retained authorization where required. Failure to route a legitimate contribution is a platform defect worth fixing.

## The requirements

Regulations set a floor your policies must meet. The second line validates applicability and adequacy; GitHub configuration contributes evidence but does not establish compliance by itself.

| ID | Regulation and citation | What it asks for (paraphrased) |
|---|---|---|
| [US-SOX-404](https://www.govinfo.gov/content/pkg/USCODE-2023-title15/pdf/USCODE-2023-title15-chap98-subchapII-sec7262.pdf) | [Sarbanes-Oxley Act §404, 15 U.S.C. §7262](https://www.govinfo.gov/content/pkg/USCODE-2023-title15/pdf/USCODE-2023-title15-chap98-subchapII-sec7262.pdf) | Annual assessment of internal control over financial reporting, with auditor attestation for accelerated filers. Program change management is a core ITGC beneath it. |
| [US-PCAOB-AS2201](https://pcaobus.org/oversight/standards/auditing-standards/details/AS2201) | [PCAOB AS 2201](https://pcaobus.org/oversight/standards/auditing-standards/details/AS2201) | How auditors test those controls (top-down, risk-based). PCAOB publishes amendments effective December 15, 2026; auditors must select the applicable version and audit-period provisions. |
| [US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance) | [FFIEC IT Handbook: Development, Acquisition, and Maintenance](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance) | Examiner expectations for SDLC governance, QA, and change management. |
| [US-NYDFS-500.8](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | [23 NYCRR §500.8, Application Security](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Written procedures for secure in-house development and testing of external software. |
| [US-NYDFS-500.6](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | [23 NYCRR §500.6, Audit Trail](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | To the extent applicable and based on risk assessment, retain material-financial-transaction reconstruction records at least five years and cybersecurity audit trails at least three years. Not every GitHub record is a financial transaction record. |
| [CA-OSFI-B13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | [OSFI Guideline B-13, Technology and Cyber Risk Management](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | Section 2.5 (Principle 8): controlled change and release management, including emergency changes (2.5.1), segregation of duties so one person cannot develop, authorize, and move code to production (2.5.2), and traceable change records (2.5.3). |
| [CA-AMF-ICT](https://lautorite.qc.ca/en/professionals/insurers/guidelines/operational-risk/guideline-on-information-and-communications-technology-risk-management) | [AMF Guideline on ICT Risk Management](https://lautorite.qc.ca/en/professionals/insurers/guidelines/operational-risk/guideline-on-information-and-communications-technology-risk-management) | Quebec's [B-13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) analogue: ICT governance and documented risk-management practices. |
| [MX-CNBV-CUB](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) | [CNBV Circular Única de Bancos](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) | Master bank rulebook with technology-risk and information-security provisions. Have compliance map the specific articles. |
| [EU-DORA-RTS-CHANGE](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | [Commission Delegated Regulation (EU) 2024/1774, Art. 17 (Art. 38 simplified)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | ICT change procedures must include independence between those who approve and those who request and implement changes (17(1)(b)), documented change details, fallback procedures, and emergency change procedures with after-the-fact review and approval (17(1)(f) and (g)). |
| [INT-PCI-6.2](https://www.pcisecuritystandards.org/document_library/) | [PCI DSS v4.0.1, Req. 6.2.1 to 6.2.4](https://www.pcisecuritystandards.org/document_library/) | Custom software follows secure development standards and is reviewed before release. |
| [INT-PCI-10.2](https://www.pcisecuritystandards.org/document_library/) | [PCI DSS v4.0.1, Req. 10.2](https://www.pcisecuritystandards.org/document_library/) | Audit logs capture administrative actions, such as ruleset and bypass changes. |
| [INT-PCI-10.5.1](https://www.pcisecuritystandards.org/document_library/) | [PCI DSS v4.0.1, Req. 10.5.1](https://www.pcisecuritystandards.org/document_library/) | Applicable audit log history: at least 12 months, with the most recent three months immediately available for analysis. |
| [INT-NIST-SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) | [NIST SP 800-218 (SSDF) v1.1](https://csrc.nist.gov/pubs/sp/800/218/final) | Reference framework. PS.1 (protect code from tampering) and PS.3 (protect releases) map directly here. |

The common thread: **independent approval**, **controlled implementation**, and **reconstructable evidence**. Ownership, documentation, and collaboration make those duties executable by real engineering teams.

## Deployment model differences

Change-control features are mostly consistent across GitHub deployment models. Here is where they actually differ.

| Model | What changes for this topic |
|---|---|
| **GHEC (personal accounts)** | Full ruleset stack: repository, organization, and [enterprise-level rulesets](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-code-governance). Repositories in personal namespaces sit outside your org rulesets, so keep regulated code in organizations. |
| **GHEC with EMU** | Same feature set, plus enterprise rulesets can target **all repositories owned by users in your enterprise**, closing the personal-namespace gap. Managed users cannot push to repositories outside the enterprise, which simplifies your fork story. |
| **GHEC with data residency (GHE.com)** | EMU-only, so the EMU notes apply. None of the change-control features in this post appear on the [GHE.com unavailable features list](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency). GitHub Marketplace is unavailable, so ticketing or status-check apps must be installed from their source. |
| **GHES (3.22)** | Organization and repository rulesets, push rulesets, Evaluate mode, rule insights, [required workflows](https://docs.github.com/en/enterprise-server@3.22/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#require-workflows-to-pass-before-merging), and [immutable releases](https://docs.github.com/en/enterprise-server@3.22/code-security/concepts/supply-chain-security/immutable-releases) are documented. Plan on org-level rulesets per organization rather than assuming enterprise code-governance parity. [Ruleset history](https://docs.github.com/en/enterprise-server@3.22/organizations/managing-organization-settings/managing-rulesets-for-repositories-in-your-organization) only covers changes made after upgrading to 3.17 or later. You own log retention for the appliance. |

**Takeaway:** if you run multiple GHES organizations, store your rulesets as JSON in a repo and apply them with the API so every org gets the same baseline.

## Prerequisites: independent review and trusted control owners

Before deploying rulesets, connect repository ownership to independent code reviewers, change authorities, policy maintainers, and evidence collectors. Staff backup coverage for critical paths. No one approves their own source change, ITSM authorization, bypass elevation, or policy SHA promotion.

- Final source review must come from someone other than the author and last pusher; owned paths need code-owner approval. Dismiss stale reviews and prohibit workflow approvals.
- Application developers cannot write to the central workflow repository or access its ITSM credentials. Its maintainers need independent review too.
- Implement and test the authoritative ITSM adapter, trusted revision mapper, IdP/PAM exception automation, archive, and reconciler. JSON and job names alone do not supply those controls.

The [review configuration](#pull-request-review-and-separation-of-duties) below implements source independence.

## Link every change to a ticket

Every regulated PR links to an **authoritative ITSM change record**. The PR explains what changes, why it is needed, how it was tested, which consumers are affected, and how to recover.

A pinned central workflow checks pre-merge eligibility; [Part 6's independent production broker](/blog/github-waf-financial-services/actions-hardening/#control-4-environments-and-separation-of-duties-for-deployments) performs final current-state authorization. A clickable reference does neither.

[DORA RTS 17(1)(d)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) requires documented purpose, scope, and timeline; [B-13 2.5.3](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) requires traceability. Configure [autolinks](https://docs.github.com/en/enterprise-cloud@latest/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/configuring-autolinks-to-reference-external-resources) for identifiers such as `CHG0012345`. GitHub [closing keywords](https://docs.github.com/en/enterprise-cloud@latest/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue) link issues only on default-branch PRs. An issue is an approval record only under an independently governed institutional process.

**Institution-owned integration:** `change-authorization.yml` calls a trusted ITSM adapter. This post supplies the contract, not a working ServiceNow/Jira adapter.

| Decision | Required evidence and fail-closed behavior |
|---|---|
| Record exists and applies | Query authoritative ITSM; bind immutable repository/application ID, PR, target branch and approved scope/version. Reject missing, ambiguous, or unrelated records. |
| Independent authorization | Approver has the appropriate role and is not the requester, author, or implementer. Archive identity and approval time; peer code review is not ITSM authorization. |
| Approved and in window | PR/queue checks report eligibility at check time. Immediately before production execution, the independent broker queries approved/non-cancelled state and the window, binds short-lived single-use authorization to artifact/target, and revalidates delayed execution. Cached green results never authorize production. |
| Scope-to-revision mapping | CAB approves scope, risk, acceptance criteria, and permitted mapping policy. On each update, trusted automation compares the final reviewed revision/candidate to that scope and reruns technical checks. In-policy review commits need no new CAB approval. Scope, risk, acceptance-criteria, ticket, or policy changes require independent reapproval. Unknown/out-of-scope differences fail closed. |
| Final revision binding | Retain reviewed head SHA, base/candidate, resulting merged commit/tree, ticket and mapping-policy versions, and mapping evidence. Bind the release artifact to them. Reviews must cover the final reviewed revision; merge binding records what merged, not atomic merge-click authorization. |
| Trusted execution | SHA-pinned central workflow and dependencies, least-privilege ITSM identity, no untrusted PR script execution, and approved static-egress runners under the enterprise IP allowlist. |
| Service unavailable | Fail on timeout, permission error, incomplete response, unknown identity, or stale cache. Only independently approved emergency procedures permit a logged exception. |

A payments ticket for repository ID `42` cannot authorize another repository. Review commit `def456` may retain CAB approval when the trusted mapper proves it stays in scope and final review/checks pass. An unprovable mapping requires reapproval, not automatic emergency promotion.

**Verify:** test in/out-of-scope mapping, state-change reruns, approval arriving after a failed check, and post-check expiry/revocation. Demonstrate final revision binding, deployment-side revalidation, and archival before reliance. Archive workflow SHA, reviewed/candidate/merged revisions, mapping evidence, ITSM version/approver/time/window, and the broker's deployment decision.

## Use rulesets as the policy engine

### What we do

Define rulesets at **enterprise** level (GHEC) or **organization** level (GHES). The restrictive baseline targets **all repositories**, including unclassified ones. Governance-owned properties select added controls or approved relaxations; repository rulesets may tighten, never weaken, that baseline.

### Why

Unlike per-repository branch protection, [rulesets](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets) scale central policy:

- **Multiple rulesets layer** on the same branch, and the most restrictive version of each rule wins. A repo admin cannot weaken an org ruleset by adding a looser one.
- **Anyone with read access can view active rulesets**, so auditors can inspect protections without admin rights.
- **Enforcement status changes without deleting** the ruleset, and Evaluate mode lets you test before you block.
- Rulesets also layer with any remaining branch protection rules, so migration is not a big-bang cutover.

The [WAF tiered model](https://learn.github.com/well-architected/library/governance/recommendations/managing-repositories-at-scale/rulesets-best-practices/) supports [US-SOX-404](https://www.govinfo.gov/content/pkg/USCODE-2023-title15/pdf/USCODE-2023-title15-chap98-subchapII-sec7262.pdf), [US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance), [CA-OSFI-B13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) (2.5.1), and [EU-DORA-RTS-CHANGE](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774).

### How

The end-state policy targets default and release branches in every repository. Relaxations need governance approval and independently tested targeting. The platform owner must implement and acceptance-test the central workflows before making them required.

Declare the approved design in the protected policy repository and apply it through [Part 1's event-driven configuration-management pattern](/blog/github-waf-financial-services/platform-foundation/#manage-configuration-as-reviewed-policy), modeled on [safe-settings](https://github.com/github-community-projects/safe-settings). Independent review and dry-run validation precede application by a dedicated service; approved policy merges and supported configuration-change events drive reconciliation.

Use the documented [organization rules API](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/rules) or [enterprise rules API](https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/rules) for the applicable scope. Verify that the chosen implementation supports the required rule types and events on the deployed release; a repository-settings tool is not automatically an enterprise-policy manager. Inspect targeting, enforcement, bypass actors, review requirements, and required-workflow identities rather than treating a successful API update as proof of control.

| Policy element | Required outcome |
|---|---|
| Scope and enforcement | Default and release branches in every in-scope repository have active protection, including branch creation |
| Destructive changes | Unauthorized deletion and force pushes are blocked |
| Review | Two eligible approvals, code-owner review, stale-review dismissal, independent approval after the last push, and resolved review threads |
| Merge method | The approved squash-merge process preserves the reviewed revision and release evidence |
| Required workflows | Build/test and change-authorization gates come from the approved central repository, path, and immutable commit |
| Exceptions | Only independently authorized, time-bound PR bypass is permitted; push and signing exceptions remain separate |

The platform owner maintains the institution-specific policy and its application service. Retain the approved policy commit, effective difference, independent approval, affected resources, and verified outcome. Require tested targeting, failure handling, and a rollback plan before activation. Native rulesets remain the preventive boundary; later drift correction is not a substitute for preventing unauthorized changes.

**Design choices:**

- **App identity is not workflow identity.** `integration_id: 15368` only identifies GitHub Actions. A developer-controlled workflow can emit the same job name from the same app. It is not our trusted gate.
- **`workflows` pins the source repository, path, and commit SHA**, using the API's documented `sha` field. Pin actions and reusable workflows inside that source too. SHA changes require independent approval and an archived policy version.
- **Merge queue** needs workflows that handle `merge_group` and validate the candidate revision. The authorization service must bind approved PR revisions to that candidate, not reuse a stale green decision.
- **Two approvals** are this series' conservative GA floor for every PR, not a claim that every cited regulation prescribes that number. Staff independent reviewers, provide backup coverage, and add path-specific requirements where needed; code review still does not replace ITSM authorization.
- Migrating from branch protection? Use [converting branch protections to rulesets](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/converting-branch-protections-to-rulesets) and then remove the old rule once the ruleset is active.

GitHub also publishes prebuilt starting points in [`github/ruleset-recipes`](https://github.com/github/ruleset-recipes). Treat them as drafts to adapt, not finished controls.

### Verify

- **Configuration:** compare the controller's approved policy commit with independently captured effective rulesets and bypass actors. Test rejection of unapproved policy, restoration of unauthorized drift, exception expiry, failed application, and missed-event recovery. Monthly, review retained configuration versions, application outcomes, and change records rather than rediscovering changes with scheduled API requests.
- **Change history:** [ruleset history](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-rulesets-for-repositories-in-your-organization#using-ruleset-history) keeps 180 days of iterations with compare, restore, and JSON download. Note that the **bypass list is excluded** from the exported JSON, so capture bypass actors from the API too.
- **Audit log:** `repository_ruleset.create`, `.update`, and `.destroy` events record who changed what, including `ruleset_bypass_actors_added` and `ruleset_old_enforcement` fields ([audit log events reference](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise)). Alert on any regulated-tier ruleset moving from `active` to `disabled` or `evaluate`.

## Classify repositories with custom properties

Consume [Part 1's canonical schema and governance](/blog/github-waf-financial-services/platform-foundation/#data-classification-with-custom-properties), including the CMDB `app-id`. For SOX scope and [B-13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) traceability, ruleset targeting must follow that inventory, not "the 14 repos we remembered."

**Fail-safe targeting:** the restrictive baseline covers **all repositories**, including missing/invalid classification. Properties select added controls or independently approved relaxations; repository actors cannot edit targeting values.

**Verify:** enumerate organizations and repositories with pagination, including managed-user repositories where applicable, and join properties to CMDB IDs. Require **100% classification of active repositories**. Alert immediately on compliance removal, criticality/classification downgrade, or lost `app-id`; review compliance-removal changes weekly. Governance approves targeting changes and tests the resulting protections. Preview CMDB sync is not required: a reviewed GA API/manual process must provide the same reconciliation.

## Pull request review and separation of duties

### What we do

On regulated branches, every change needs an approving review from someone who is **not the author and not the last person to push**. Code owners must approve changes to the paths they own. New commits invalidate old approvals. Workflows cannot approve pull requests.

### Why

[OSFI B-13 2.5.2](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) and [DORA RTS 17(1)(b)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) require independent approval; [PCI DSS 6.2](https://www.pcisecuritystandards.org/document_library/) expects pre-release review. [Bypassing reviews](https://learn.github.com/well-architected/library/scenarios/anti-patterns/) defeats that chain.

Engineering needs more than eligible identities. Review should find business-logic errors, incompatible interfaces, unsafe infrastructure changes, and missing operational documentation before consumers discover them.

### How

| Gap an auditor will probe | Control that closes it |
|---|---|
| Developer approves their own change | Built in: [pull request authors cannot approve their own pull requests](https://docs.github.com/en/enterprise-cloud@latest/pull-requests/how-tos/review-pull-requests/reviewing-proposed-changes-in-a-pull-request). |
| Reviewer approves, then pushes more code and merges | **Require approval of the most recent reviewable push**: an approval must come from someone other than the last pusher. |
| Author sneaks commits in after approval | **Dismiss stale approvals when new commits are pushed** resets approvals when the diff changes. |
| Change to payments code reviewed by someone outside the payments team | **Require review from code owners**, with teams as owners. |
| A workflow approves its own pull request | Keep [GitHub Actions blocked from creating or approving pull requests](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization#preventing-github-actions-from-creating-or-approving-pull-requests) (the default for new organizations). |
| Someone dismisses the blocking review | Restrict who can dismiss reviews on targeted branches. |

Last-push approval [does not dismiss stale reviews](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets). Enable both controls for regulated repositories.

**Make the review effective:**

- **Author:** keep the change cohesive; explain behavior before/after, impacted consumers, tests, risks, and rollback. Separate unrelated refactoring so reviewers can follow the intent.
- **Domain reviewer:** challenge business invariants. For a payments change, inspect rounding, duplicate processing, retry behavior, and error handling where relevant.
- **Technical reviewer:** examine security, compatibility, infrastructure impact, and failure behavior. Run or inspect targeted tests rather than treating passing CI as complete analysis.
- **Maintainer:** coordinate cross-line consumer feedback and ensure documentation/release notes match the implementation. Resolve disagreements on the record.
- **Platform owner:** keep checks fast enough to use and failures understandable. Route infrastructure/check failures separately from application defects.

Set first-response and review-completion expectations with maintainers by risk tier. Escalate a stalled critical change to backup reviewers; do not lower independence or turn bypass into the normal queue-management tool.

For a shared banking library, a second approval from someone who cannot explain the compatibility impact adds less value than a well-staffed domain review. Meet the configured approval floor **and** verify review quality.

**CODEOWNERS done right.** Per [About code owners](https://docs.github.com/en/enterprise-cloud@latest/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners), owners need explicit write access, enterprise teams are not supported as code owners, and invalid lines are silently skipped. Keep the file in `.github/` and make the platform team own the file itself, as the [WAF governance policies page](https://learn.github.com/well-architected/library/governance/recommendations/governance-policies-best-practices/) recommends.

Assign a default owning team, domain reviewers for payments and ledger logic, and platform reviewers for infrastructure and repository-control files. Require the platform team to review changes to CODEOWNERS itself. Inspect recognized file location, path coverage, team eligibility, and parsing errors; then test that representative changes actually request the intended reviewers.

**Distinct AI attribution caveat:** GitHub documents an additional approval for unattributed Copilot PRs in **public preview**, on by default. Exclude that feature from the production baseline; verify the effective setting rather than assuming defaults are GA. This series requires two approvals for every PR using GA controls. If a preview dependency cannot be disabled or excluded, do not enable the affected agent workflow in production. [Part 7](/blog/github-waf-financial-services/copilot-and-agents/) covers agent governance; the ownership and review duties here apply regardless of who or what drafted the code.

### Verify

- **CODEOWNERS health:** the [list CODEOWNERS errors API](https://docs.github.com/en/enterprise-cloud@latest/rest/repos/repos#list-codeowners-errors) on every regulated repo, weekly. A broken line means a path with no required owner.
- **Per-change evidence:** archive author, eligible reviewers, review states/commit IDs and merger. The collector and reconciliation design below must be implemented and validated to produce a complete population.
- **Settings drift:** `GET /orgs/{org}/actions/permissions/workflow` should return `can_approve_pull_request_reviews: false`. Check monthly.
- **Review effectiveness:** sample payment, banking-app, infrastructure, and shared-library changes according to risk. Check that reviews addressed relevant behavior and tests, not only approval eligibility. Correlate escaped defects, rework, and repeated emergency fixes with review gaps.
- **Review flow:** inspect time to first response, waiting versus active review time, change size, and reruns. Improve documentation, staffing, test reliability, or change decomposition before adding another approval.

## Required status checks and merge queue

### What we do

Central SHA-pinned workflows check build/test, [ITSM eligibility](#link-every-change-to-a-ticket), and [Part 5 security policy](/blog/github-waf-financial-services/code-scanning-supply-chain/). High-traffic repositories use a **merge queue**. These are check-time eligibility decisions, never atomic merge-click or current production authorization.

### Why

[NYDFS 500.8](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) and [FFIEC DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance) need defined technical criteria; [DORA RTS 17(1)(a)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) needs security verification. Central, versioned workflows make those criteria independently governable.

Reliable checks and merge queues also reduce rebase churn and broken shared branches. Measure queue time, flaky-check reruns, and time to actionable failure so the delivery benefit remains visible.

### How

- **Protect the source repository independently.** Central policy maintainers cannot approve their own changes. Require independent code-owner approvals, stale-review dismissal, last-push approval, and no developer bypass on its protected branches. Restrict ruleset edits and workflow SHA promotion to governance; alert on drift and bypass-list changes. Application developers cannot write to this repository.
- **Do not execute PR code in the authorization trust boundary.** Parse untrusted PR metadata as data; never evaluate it. The central ITSM adapter gets narrowly scoped credentials, not application workflows or fork code.
- **Use [Require workflows to pass before merging](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#require-workflows-to-pass-before-merging)** at the org or enterprise level for org-wide gates. Visibility rules apply (an internal workflow repo can only serve internal and private repos), and most CodeQL actions cannot run as ruleset workflows (only `upload-sarif`).
- **Availability is an implementation gate.** Verify the required-workflow rule on the selected hosting model and version. Where unsupported, use an institution-controlled, dedicated GitHub App check source backed by an external authorization service, not Actions job names. Give developers neither its credentials nor its decision API; independently validate this alternative before reliance.
- **Merge queue and deployment gates are repo-level.** Both "Require merge queue" and "Require deployments to succeed before merging" are not available in org-level rulesets. Add them with a small repo-level ruleset that layers on top of the org baseline. Remember that a [merge queue](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue) waits for checks on `merge_group` events, so update your CI triggers first.
- **Queue checks are not atomic authorization.** ITSM state/windows can change after `merge_group`. Governance continuously reconciles relied-upon queue configuration and alerts on removal/weakening. Part 6's broker authorizes production independently, denying stale, expired, cancelled, or unmapped changes without relying on a queue. Policy requiring fresh source-merge authorization additionally needs an independent merger with exclusive merge authority and tested revalidation.
- **ITSM changes must trigger new decisions.** A trusted integration receives approval, cancellation, scope, and window changes and reruns/replaces the applicable PR/candidate eligibility result. Schedule expiry invalidation, durably retain incoming events, and monitor processing failures. Recover identified gaps through supported redelivery or targeted current-state retrieval. Approval arriving after a failed check must cause a rerun; revocation must not leave a stale green result. Missing events or delayed checks cannot authorize production because the broker performs its own current-state query.

### Verify

- Rule suites with `fail` results show checks doing their job. A regulated repo with zero failures over a quarter is worth a look; it may mean the checks are not running.
- Diff repository IDs, workflow paths and SHAs in exported ruleset JSON against the approved standard. Quarterly negative tests must reject a local fake passing job, nonexistent/unapproved tickets, out-of-scope revisions, and ITSM outages. Separately prove that the production broker rejects a window closing or approval being revoked **after** a green PR/queue check, and that later ITSM approval triggers a new eligibility check. Test queue removal alerts where the queue is relied upon.

## Commit provenance: signed commits and vigilant mode

### What we do

Require signed commits on regulated branches. Encourage (but do not pretend to enforce) vigilant mode for engineers in regulated teams. With EMU, add a commit metadata rule restricting author email to your corporate domain.

### Why

Git lets anyone set an author name. A verified signature binds a commit to a signing key and helps detect tampering; it does not establish independent approval or the human who wrote every line. A GitHub-signed squash commit identifies the platform's signing operation, **not developer non-repudiation**. Keep original PR commits and reviews in the archive. The [WAF NIST SSDF implementation guide](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) recommends signing methods that need human action, such as a hardware key.

### How

- Put `required_signatures` in a **separate ruleset**. Enforcement is per ruleset, so signing rollout must not put authorization and review controls into Evaluate. The end state is active; an adoption percentage is not evidence of full coverage.
- Mind the sharp edge: **unsigned commits on a PR branch can block a squash merge**, even though GitHub signs the squash commit ([available rules](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#require-signed-commits)). Teach rebase-and-sign early.
- **Vigilant mode is a personal setting** that flags a user's unsigned commits as "Unverified." You cannot enforce it from the org ([vigilant mode docs](https://docs.github.com/en/enterprise-cloud@latest/authentication/managing-commit-signature-verification/displaying-verification-statuses-for-all-of-your-commits)), so it belongs in onboarding, not your control narrative.
- Verification is **persistent**: a verified commit stays verified after key rotation or a developer's departure ([about commit signature verification](https://docs.github.com/en/enterprise-cloud@latest/authentication/managing-commit-signature-verification/about-commit-signature-verification)). Handy when an auditor samples a change from eleven months ago.

Use the [organization rules API](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/rules) to maintain and inspect a separate, active signature ruleset for default and release branches across the approved population. Confirm that required signatures are present, exclusions are justified, and no standing bypass grants undermine enforcement. Retain its policy version separately from review and authorization rules.

Validate squash behavior with human and bot PRs before activation. A separate signing exception requires its own approved JIT actor and reconciliation; the branch-policy bypass does not automatically bypass this ruleset.

### Verify

- The commits API exposes verification status and a `verified_at` timestamp. Sample regulated merges quarterly and confirm `verified: true`.
- Rule insights in Evaluate mode show how many pushes would fail before you flip to Active.

## Push rulesets: guard the files that guard everything else

### What we do

A push ruleset on regulated repos blocks direct changes to control files (`.github/workflows/**`, `.github/CODEOWNERS`, IaC directories), blocks binary extensions, and caps file size. Changes to those paths go through a delegated bypass request reviewed by platform engineering.

### Why

If someone can edit the workflow that runs your required checks, or the CODEOWNERS file that picks your reviewers, they can rewrite the control. [SSDF PS.1](https://csrc.nist.gov/pubs/sp/800/218/final) in the [WAF SSDF guide](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) recommends exactly this pattern for `.github/workflows/**`, `CODEOWNERS`, IaC, and security policy files.

**Merge review is not an execution boundary.** A same-repository branch workflow may run before anyone reviews the PR. Active push rules can block protected-path edits before acceptance, but application code, tests, build scripts, and local actions can also execute through an unchanged workflow. An approved control-file bypass does not approve that code for production privileges. Retain the independent review gates and enforce [Part 6's separation of branch validation from privileged execution](/blog/github-waf-financial-services/actions-hardening/#separate-branch-validation-from-privileged-execution).

### How

Per [About rulesets](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets), push rulesets apply to private and internal repositories and their **entire fork network**, with no branch targeting. Only bypass actors on the root repository can bypass in forks. Path and extension rules accept up to 200 entries, and path and size rules support allowed exceptions (handy for the Gradle wrapper JAR).

With **delegated bypass**, a blocked contributor requests an exception, the bypass list reviews it, and requests expire if nobody acts within 7 days ([managing org rulesets](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-rulesets-for-repositories-in-your-organization#managing-requests-to-bypass-push-rules)).

**Push bypass is not branch bypass.** The [organization rules API](https://docs.github.com/en/rest/orgs/rules#create-an-organization-repository-ruleset) says `pull_request` bypass is **only applicable to branch rulesets**, not push or tag rulesets. A push rule blocks the commit before a PR exists.

Keep any human push-bypass team empty by default. A second party approves JIT membership for a ticket, repository, exact revision, and short expiry (for example, 60 minutes). IdP automation expires membership, alerts on use, and reconciles each push. Independently approved delegated push requests are preferred for ordinary control-file edits; actors with bypass privileges must not use them to approve their own changes. Neither path bypasses the separate branch review and authorization gates.

Pilot in a disposable test repository. Use time-boxed Evaluate only if supported for that push rule and hosting model; otherwise test outside production while existing controls stay active.

### Verify

Pull bypass requests from the [org bypass requests API](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/bypass-requests) monthly. Each approved request should map to a ticket.

## Releases: tag rulesets and immutable releases

### What we do

Release tags are protected by a tag ruleset (restrict creation, updates, and deletion to the release automation identity). Immutable releases are enabled at the org level for regulated repositories.

### Why

"What exactly was deployed on March 3rd?" should have exactly one answer forever. Moving a tag after the fact breaks that, and it breaks the link between approved change and deployed artifact that [B-13 2.5.3](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) and [SSDF PS.3](https://csrc.nist.gov/pubs/sp/800/218/final) care about.

### How

- The legacy tag protection docs now redirect to rulesets, which tells you where GitHub wants you. Create a **tag ruleset** (pattern such as `v*`) with restrict creations, updates, and deletions, and add only your release app as a bypass actor.
- Turn on [immutable releases](https://docs.github.com/en/enterprise-cloud@latest/code-security/concepts/supply-chain-security/immutable-releases). Once published, the tag cannot move or be deleted, assets cannot change, and GitHub generates a **release attestation**. Enable it org-wide or for selected repos via [preventing changes to your releases](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/prevent-release-changes). It applies to future releases only.
- Publish as draft, attach assets, then publish. Otherwise you will be fighting your own immutability.

### Verify

Releases show an **Immutable** label. Quarterly, sample production releases and confirm the label plus the attestation. [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/) covers verifying attestations.

## Bypass lists: who, why, and how it is audited

### What we do

- **No standing human bypass** on regulated rulesets.
- One **branch break-glass team** with `bypass_mode: pull_request`. Membership is empty by default, approved independently, and granted just in time through your IdP group with automatic expiry ([Part 2](/blog/github-waf-financial-services/identity-and-access/) covers identity plumbing).
- Separate push exceptions use tightly controlled JIT `always` only where necessary. Do not grant a broad standing AppSec bypass or copy branch-only modes into a push ruleset.
- Automation that must bypass (release apps, Dependabot where you allow it) is listed explicitly, by app, with a documented reason.
- **Never use `exempt`** for anything in regulated scope.

### Why

Two WAF pages appear to disagree. The [governance policies page](https://learn.github.com/well-architected/library/governance/recommendations/governance-policies-best-practices/) says bypass "should not be allowed." The [rulesets page](https://learn.github.com/well-architected/library/governance/recommendations/managing-repositories-at-scale/rulesets-best-practices/) allows it "only to roles/teams with clear break-glass standard operating procedures" and warns about "impossible merge" situations. Zero bypass sounds great until CI is down mid-incident and the only exit is disabling the ruleset, which is far worse evidence. A scoped, logged bypass beats an untracked disable.

### How

The bypass mode is where the audit trail lives or dies. From the [org rules API](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/rules) and [creating org rulesets](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/creating-rulesets-for-repositories-in-your-organization#granting-bypass-permissions-for-your-branch-or-tag-ruleset):

| Mode | Behavior | Our stance |
|---|---|---|
| `always` | Actor can push directly or merge past rules | Scoped release automation; independently approved, expiring human JIT push exception only where needed |
| `pull_request` | Actor can bypass through a PR only; supported for **branch** rulesets only | Branch break-glass team, empty by default |
| `exempt` | Rules are not run for that actor and **no bypass audit entry is created** | Never in regulated scope |

### Verify

- Audit log `protected_branch.policy_override` captures overrides, with a `rule_suite_id` you can resolve for detail.
- `repository_ruleset.update` with `ruleset_bypass_actors_added` flags anyone expanding the bypass list. Alert on it in your SIEM.
- Rule insights shows the repos with the most bypasses. The WAF suggests a weekly review cadence; we agree.

## Emergency changes

### What we do

Emergency changes still go through a pull request. The difference is who can merge and when the review happens:

1. On-call engineer opens a PR referencing an `EMG` ticket.
2. If a second engineer is available, they approve normally. That is the preferred path even at 2 AM.
3. If ordinary review cannot finish in time, a separate authorized duty manager approves the incident commander's JIT elevation in the IdP/PAM system. Record the incident, repository, PR/revision, purpose, approver and expiry. No self-elevation; membership expires automatically within 60 minutes unless a fresh independent approval extends it.
4. The incident commander merges using **PR-only branch bypass**. Automation records the override and creates a post-implementation review (PIR) with a fixed deadline of two business days using the institution's calendar.
5. An authorized reviewer independent of the author, implementer, merger and elevation approver verifies the exact merged revision, tests, ITSM approval, and deployment. A closed issue without this decision is not a completed PIR.
6. Daily reconciliation fails and alerts the control owner for missing tickets, late/self-approved PIRs, unapproved elevation, or membership surviving expiry. Escalate overdue items to the second line, and retain expiry and review evidence.

### Why

[DORA RTS Art. 17(1)(f)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) and (g) require emergency procedures with "adequate safeguards" and after-the-fact documentation, re-evaluation, and approval. [OSFI B-13 2.5.1](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) asks your standard to define emergency change controls. Notice neither says "skip review." They say review later, on the record.

### How

The control-monitoring service correlates streamed audit events and supported change webhooks with approval and elevation records. Use the [org rule suites API](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/rule-suites) for targeted evaluation details during an investigation or recovery, not recurring bypass discovery.

Collect rule-suite ID, repository, ref, actor, push time, result, and available rule details. Join each bypass to its approval, authorized actor, exact revision, permitted time window, and post-incident review. Missing matches and activity outside the approved scope must enter the incident process.

Route unmatched or unauthorized bypasses into the institution's incident-management process. Correlate `protected_branch.policy_override` audit events with the same approval and exception records; an event or API result alone does not establish an authorized emergency.

### Verify

Every emergency bypass must have authoritative approval, a valid JIT interval, automatic removal, and an independent, timely PIR. Planned push-file exceptions have their own approved change records. Reconcile daily, report quarterly, and test self-elevation, automatic expiry and overdue-PIR alerting.

## Roll out with Evaluate mode and rule insights

**Operating baseline:** publish **Active** end-state JSON. Evaluate is rollout, not an operating control. Governance assigns a pilot owner/deadline, **at most four weeks**; existing active controls remain in force. Only active controls count toward coverage.

Phase through test repositories, pilot teams, and the whole tier before enforcement, using [WAF DevOps feedback principles](https://learn.github.com/well-architected/library/collaboration/recommendations/applying-devops-methodology/). [Evaluate](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets#using-ruleset-enforcement-statuses) is documented for GHEC/GHES; Free/Pro/Team list only Active/Disabled. [Rule insights](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-rulesets-for-repositories-in-your-organization#viewing-the-rule-insights-dashboard) supplies evaluations, bypass hot spots, and CSV exports.

**Acceptance:** require negative tests, no unexplained bypasses, complete targeting, functioning archive/reconciliation, and control-owner approval. Retain CSV and acceptance records. Escalate expired pilots to the second line; the operating period starts only when enforcement and supporting controls work.

Pilot with representative payments, banking-app, infrastructure, and shared-library maintainers. Publish what contributors will see, how to fix ordinary failures, and where to escalate platform defects.

Compare review wait, check duration, queue failures, and bypass demand before and after rollout. A successful rollout improves predictability while preserving the required protection; a lower failure count alone is not proof.

## Evidence for auditors

### What we do

Capture change evidence **at merge**, at every direct protected-branch update, and at deployment, using supported webhooks, audit streaming, and deployment-system events. Store it outside GitHub in an immutable, access-controlled archive. Reconcile retained events and archive receipts to identify missing captures before upstream retention expires. Record any UI-only evidence and manual validation rather than claiming everything is API-generated.

### Why

Auditors test **design** (is it configured?) and **operating effectiveness** (did it work all period?). The [WAF SSDF guide](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) says to stream audit logs to a SIEM "for long-term retention that exceeds GitHub's default retention periods." Supports [US-NYDFS-500.6](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500), [INT-PCI-10.2](https://www.pcisecuritystandards.org/document_library/), and [US-PCAOB-AS2201](https://pcaobus.org/oversight/standards/auditing-standards/details/AS2201).

### How

Know the windows; most are shorter than your audit period:

| Source | What it proves | Retention you get |
|---|---|---|
| Pull request and review metadata | Author, final head SHA, review commit IDs/times, merger, ticket | Repository lifecycle is not a retention guarantee; archive at merge |
| Checks, runs, commit statuses, logs and artifacts | Gate results and exact workflow/candidate identity | On github.com, follow Actions retention since [October 1, 2026](https://github.blog/changelog/2026-10-01-actions-retention-now-covers-checks-runs-and-statuses/), including third-party checks/statuses; default 90 days. Archive at merge, not quarter end. Verify GHE.com/GHES behavior separately. |
| [Enterprise audit log](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise) | Ruleset changes, overrides, property changes | 180 days (Git events: 7 days) unless [streamed](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise) |
| Ruleset history | Every ruleset iteration (bypass list excluded) | 180 days |
| [Rule suites API](https://docs.github.com/en/enterprise-cloud@latest/rest/repos/rule-suites) | Supplemental evaluation details for an investigated change; not a continuous event feed | Time-window filters include `hour`, `day`, `week`, and `month`; verify source availability during recovery |
| Rule insights CSV | Aggregated evaluations and bypass hot spots | Export on demand |

Stream audit events continuously and use supported webhooks to trigger change-evidence capture. Establish a ruleset baseline, then capture full ruleset details, including bypass actors, when policy changes occur. API requests should enrich a specific event, support an investigation, or recover an identified gap, not discover changes through recurring queries. Rule-suite detail metadata is capped at 50 entries, so it is not the complete reviews/checks population; do not assume event coverage is equivalent to every rule evaluation.

Authenticate webhook deliveries, persist them durably before acknowledging receipt, and deduplicate by delivery/event identity. Monitor receiver health, queue lag, processing failures, stream configuration changes, and archive receipts. GitHub [does not automatically redeliver failed webhook deliveries](https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/redelivering-webhooks); define an owned incident response using supported redelivery and bounded recovery before the documented delivery/source retention expires. Retries within the institution's durable queue do not recover events that never reached it.

**Archive standard:** Part 1 owns [retention, integrity, and capture manifests](/blog/github-waf-financial-services/platform-foundation/#evidence-retention-and-integrity), including legal classification and holds. For source changes, capture check outcomes **at merge** with exact run/check IDs, retain later completion supplements, and flag missing required results.

### Complete population, not a capped search

The institution must operate and validate an evidence service that uses these interfaces for initial baselines, event-triggered enrichment, and bounded investigation/recovery. Reconcile the resulting records across the complete change population; these are not scheduled inventory queries:

| Source | Information to collect and reconcile |
|---|---|
| [Pull requests API](https://docs.github.com/en/rest/pulls/pulls) | All merged changes in the period, repository/PR IDs, target branch, final head revision, merge revision, and merge time |
| [Reviews API](https://docs.github.com/en/rest/pulls/reviews) | Reviewer identity, review state, reviewed commit, submission time, and dismissal history from companion events |
| [Branches API](https://docs.github.com/en/rest/branches/branches) | Current branch names and head revisions, reconciled with historical policy and branch events |
| [Rulesets API](https://docs.github.com/en/rest/repos/rules) | Effective protection, required gates, bypass actors, policy versions, and changes over the audit period |

Do not substitute a capped pull-request listing or search result: result limits can silently omit changes. Enumerate organizations, repositories and applicable branch rules with pagination, then include **all protected branches**, not only `main`. Include branches created, renamed, deleted or differently protected during the period from historical policy and event records.

1. At each merge, archive PR metadata, all review pages and dismissal events, original commits, final head/base and merge SHA, checks/statuses/runs, central workflow SHAs, ITSM approval/window, effective rulesets and bypass actors. Record original push actor/time from events, not spoofable commit author dates.
2. Continuously capture protected-branch before/after SHAs, direct pushes, bypasses, release-app updates and tag/release events. Traverse the commit graph between snapshots with paginated APIs or a verified mirror; retain deleted/force-pushed history from event-time capture.
3. Reconcile branch updates to merged PRs or explicit approved direct-push exceptions, and reconcile all production deployments (including external emergency paths) to approved revisions and artifact digests. No unexplained commit, update or deployment may disappear from the report.
4. An approval counts only if it covers the **final reviewed head SHA**, precedes merge, follows the last reviewable push, is not dismissed/superseded, and comes from an eligible independent reviewer. Check code-owner requirements and separately prove independent ITSM authorization. Missing timing/identity evidence is an exception, not a pass.
5. Prove information-produced-by-the-entity completeness and accuracy: inventory totals, every pagination cursor/page, period/time-zone filters, API errors and permission scope, branch-event/commit/deployment counts, duplicate handling, and archive receipts. Fail and alert on missing pages, permission gaps, missing check captures, or unreconciled records.

Run daily reconciliation over retained event records, archive receipts, the independently maintained service inventory, and release/deployment ledgers; review a signed monthly completeness report. This is an evidence assessment, not recurring GitHub API collection. Receiver-health monitoring and cross-source discrepancies must trigger investigation and recovery before evidence expires. An apparently healthy event feed alone does not prove completeness: unresolved scope or delivery gaps block sign-off. Quarterly, internal audit validates the population and sampling methodology, including direct pushes, release branches, dismissed/stale reviews and absent archives.

### Verify

One quarter before external testing, give internal audit the collector and reconciled population for independent extraction and sampling.

## Control matrix

Rows **contribute to** requirements. Second-line compliance validates applicability, residual gaps, and operating evidence.

| Control | Contributes to requirement IDs | GitHub feature / institutional control | Evidence | Cadence |
|---|---|---|---|---|
| Central, tiered branch policy | [US-SOX-404](https://www.govinfo.gov/content/pkg/USCODE-2023-title15/pdf/USCODE-2023-title15-chap98-subchapII-sec7262.pdf), [US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance), [CA-OSFI-B13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management), [EU-DORA-RTS-CHANGE](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774), [MX-CNBV-CUB](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) | Enterprise/org rulesets | Ruleset JSON export, ruleset history, `repository_ruleset.*` events | Monthly export, real-time alert on disable |
| Accurate regulated scope | [US-SOX-404](https://www.govinfo.gov/content/pkg/USCODE-2023-title15/pdf/USCODE-2023-title15-chap98-subchapII-sec7262.pdf), [US-PCAOB-AS2201](https://pcaobus.org/oversight/standards/auditing-standards/details/AS2201), [CA-OSFI-B13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | Governance-owned properties, restrictive default | 100% active-repo coverage, downgrade alerts, CMDB reconciliation | Continuous alert, quarterly validation |
| Independent approval | [US-SOX-404](https://www.govinfo.gov/content/pkg/USCODE-2023-title15/pdf/USCODE-2023-title15-chap98-subchapII-sec7262.pdf), [CA-OSFI-B13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management), [EU-DORA-RTS-CHANGE](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774), [INT-PCI-6.2](https://www.pcisecuritystandards.org/document_library/), [CA-AMF-ICT](https://lautorite.qc.ca/en/professionals/insurers/guidelines/operational-risk/guideline-on-information-and-communications-technology-risk-management) | PR rules: approvals, last-push approval, dismiss stale, code owners | PR review records, exceptions report | Per change, quarterly population |
| Defined quality and security gates | [US-NYDFS-500.8](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500), [US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance), [EU-DORA-RTS-CHANGE](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | Central SHA-pinned required workflows, protected source repo, merge queue | Exact workflow identity and results archived at merge; spoofing negative tests | Per change, quarterly test |
| Commit provenance | [CA-OSFI-B13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management), [INT-NIST-SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) | Required signatures | Commit `verified` and `verified_at` | Quarterly sample |
| Protect control files | [INT-NIST-SSDF](https://csrc.nist.gov/pubs/sp/800/218/final), [CA-OSFI-B13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | Push rulesets, delegated bypass | Bypass requests API | Monthly |
| Release integrity | [CA-OSFI-B13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management), [INT-NIST-SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) | Tag rulesets, immutable releases | Immutable label, release attestation | Quarterly sample |
| Controlled bypass | [US-SOX-404](https://www.govinfo.gov/content/pkg/USCODE-2023-title15/pdf/USCODE-2023-title15-chap98-subchapII-sec7262.pdf), [EU-DORA-RTS-CHANGE](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774), [INT-PCI-10.2](https://www.pcisecuritystandards.org/document_library/) | PR-only branch bypass; separately approved JIT push exceptions; no `exempt` | Override, approval, expiry and push reconciliation | Daily reconcile, weekly review |
| Change authorization and traceability | [US-SOX-404](https://www.govinfo.gov/content/pkg/USCODE-2023-title15/pdf/USCODE-2023-title15-chap98-subchapII-sec7262.pdf), [CA-OSFI-B13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management), [EU-DORA-RTS-CHANGE](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | Central eligibility workflow, trusted scope mapper and independent production broker | Independent scope approval, final revision mapping, current-state in-window deployment decision | Per update, revision binding at merge, authorization at deploy |
| Emergency change review | [EU-DORA-RTS-CHANGE](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774), [CA-OSFI-B13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | IdP/PAM JIT, rule-suite detection, institutional PIR automation | Independent elevation and timely independent final-revision PIR | Daily fail-closed reconciliation |
| Evidence retention and completeness | [US-NYDFS-500.6](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500), [INT-PCI-10.2](https://www.pcisecuritystandards.org/document_library/), [INT-PCI-10.5.1](https://www.pcisecuritystandards.org/document_library/), [US-PCAOB-AS2201](https://pcaobus.org/oversight/standards/auditing-standards/details/AS2201) | Event-time archive, paginated collectors, independent reconciler | Immutable controlled archive, hashes/receipts, complete branch and deployment population | At merge/update/deploy, daily reconciliation |

## Summary and key takeaways

**Good change management makes shared engineering safer and easier to sustain.** Teams can find the code, reach its owners, understand how to contribute, and get meaningful review without inventing their own release process.

Central rulesets, independent authorization, protected releases, and durable evidence preserve that collaboration through production. Keep the distinction clear: ownership enables decisions, review challenges the implementation, change authority approves the risk, and release operations executes the authorized deployment.

Start here:

- [ ] Reconcile owning teams and service IDs for every active repository; maintain backup coverage for critical services.
- [ ] Publish usable READMEs, contribution guidance, tested setup instructions, compatibility policy, and release/recovery links.
- [ ] Establish a controlled shared-library contribution path across business lines, with scoped access and explicit consumer responsibilities.
- [ ] Measure maintainer response, review wait, rework, flaky checks, and escaped defects. Improve flow without weakening independence.
- [ ] Consume Part 1's governance-owned properties; validate `app-id` mapping and restrictive coverage for missing/invalid classification.
- [ ] Build baseline, production, and regulated rulesets at the enterprise (GHEC) or org (GHES) level, stored as JSON in a policy repo.
- [ ] Turn on approvals, code owner review, dismiss stale approvals, and last-push approval for the regulated tier.
- [ ] Pin required workflows to approved central repository paths and SHAs; protect the source with independent approvals and no developer bypass.
- [ ] Add push rulesets protecting `.github/workflows/**`, `CODEOWNERS`, and IaC paths.
- [ ] Protect release tags with tag rulesets and enable immutable releases.
- [ ] Require independently approved, expiring JIT branch bypass; govern push exceptions separately and ban `exempt`.
- [ ] Publish active end-state rulesets; time-box Evaluate separately without weakening existing controls.
- [ ] Build and test the ITSM state-change integration, trusted scope-to-revision mapper, and independent broker's current-state, in-window production authorization.
- [ ] Separate signing rollout from authorization; do not claim GitHub squash signatures identify code authors.
- [ ] Automate bypass detection, expiry and independent PIR deadlines.
- [ ] Archive checks at merge and reconcile all protected branches, direct pushes and deployments with uncapped paginated APIs.
- [ ] Obtain second-line validation of every contributes-to mapping and internal-audit validation of report completeness.

**Start here:** take one shared-library fix from discovery to consumer adoption. Ask a second team to follow the documented path, then verify both useful review and the complete authorization/evidence trail. Use the gaps as the next platform backlog.

Previously: [Part 2: Identity and Access Management](/blog/github-waf-financial-services/identity-and-access/), which covers the teams and IdP groups these rulesets depend on. Next up: [Part 4: Secrets Protection](/blog/github-waf-financial-services/secrets-protection/), where push protection and delegated bypass get the FSI treatment.

## References

**Verification date:** November 6, 2026 for the implementation-driving ruleset API, signing, required-workflow, retention and PCAOB-version claims. Recheck hosting-model availability and applicable terms before deployment.

Sources are linked in [The requirements](#the-requirements) and beside each procedure. Additional implementation references:

- [Custom properties best practices](https://learn.github.com/well-architected/library/governance/recommendations/managing-repositories-at-scale/custom-properties-best-practices/)
- [Creating rulesets for repositories in your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/creating-rulesets-for-repositories-in-your-organization)
- [Managing rulesets for repositories in your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-rulesets-for-repositories-in-your-organization)
- [GitHub Pre-release License Terms](https://docs.github.com/en/site-policy/github-terms/github-pre-release-license-terms)
- [Managing custom properties for repositories in your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-custom-properties-for-repositories-in-your-organization)
- [Custom properties (enterprise)](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-organizations-in-your-enterprise/custom-properties)
- [REST API: custom properties](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/custom-properties)
- [PCAOB AS 2201 version effective December 15, 2026](https://pcaobus.org/oversight/standards/auditing-standards/details/as-2201--an-audit-of-internal-control-over-financial-reporting-that-is-integrated-with-an-audit-of-financial-statements-(effective-on-12-15-2026))
