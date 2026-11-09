---
layout: post
title: "GitHub Well-Architected for Financial Services, Part 3: Source Code Management and Change Control"
date: 2026-11-05 10:03:00 -0600
category: Blog
tags: [github, well-architected, financial-services, compliance, security, governance, change-management, rulesets, sox]
excerpt: "Turn SOX, DORA, OSFI, and PCI change-management expectations into enforced GitHub rulesets, real separation of duties, and evidence your auditors can pull without a screenshot marathon."
permalink: /blog/github-waf-financial-services/change-control/
---

*This post is part of the [GitHub Well-Architected for Financial Services](/blog/github-waf-financial-services/) series.*

- [Overview and Compliance Crosswalk](/blog/github-waf-financial-services/)
- [Part 1: Platform Foundation and Data Boundaries](/blog/github-waf-financial-services/platform-foundation/)
- [Part 2: Identity and Access Management](/blog/github-waf-financial-services/identity-and-access/)
- **Part 3: Source Code Management and Change Control**
- [Part 4: Secrets Protection](/blog/github-waf-financial-services/secrets-protection/)
- [Part 5: Code Scanning and Software Supply Chain](/blog/github-waf-financial-services/code-scanning-supply-chain/)
- [Part 6: CI/CD and GitHub Actions Hardening](/blog/github-waf-financial-services/actions-hardening/)
- [Part 7: Copilot and AI Agents](/blog/github-waf-financial-services/copilot-and-agents/)
- [The Leadership Brief](/blog/github-waf-financial-services/leadership-brief/)

> **Applicability:** mappings contribute to requirements, not certification. Follow Part 1's [deployment decision](/blog/github-waf-financial-services/platform-foundation/#choosing-your-deployment-model), [classification schema](/blog/github-waf-financial-services/platform-foundation/#data-classification-with-custom-properties), and [feature/preview controls](/blog/github-waf-financial-services/platform-foundation/#feature-availability-and-preview-controls). GHES examples use **3.22**. Validate institutional integrations and operating evidence before reliance.

## Leadership brief

> - **The risk:** An unreviewed or self-approved financial-system change creates SOX ITGC, DORA change-management, and OSFI segregation-of-duties gaps.
> - **Our position:** Independent code review and independent change authorization are separate gates. Centrally pinned **required workflows** check pre-merge eligibility; the independently controlled deployment gate revalidates authoritative ITSM state and the implementation window before production execution.
> - **Exceptions are designed, not improvised:** branch bypass is PR-only, with independently approved JIT membership and automatic expiry. Push rulesets need a separately controlled exception because they do not support PR-only bypass.
> - **The evidence:** archive reviews, check results, workflow identity, ITSM decisions, and ruleset configuration **at merge**, then reconcile every protected branch update and production deployment. GitHub retention is not an audit archive.

The auditor asks for every Q3 general-ledger change and proof of independent approval before deployment. An engineer starts collecting screenshots. Another discovers branch protection was disabled "for an hour."

GitHub supplies enforcement primitives, not an authorization or evidence program. Let's connect them without mistaking a green badge for a control.

## The requirements

Regulations set a floor your policies must meet. The second line validates applicability and adequacy; GitHub configuration contributes evidence but does not establish compliance by itself.

| ID | Regulation and citation | What it asks for (paraphrased) |
|---|---|---|
| US-SOX-404 | [Sarbanes-Oxley Act §404, 15 U.S.C. §7262](https://www.govinfo.gov/content/pkg/USCODE-2023-title15/pdf/USCODE-2023-title15-chap98-subchapII-sec7262.pdf) | Annual assessment of internal control over financial reporting, with auditor attestation for accelerated filers. Program change management is a core ITGC beneath it. |
| US-PCAOB-AS2201 | [PCAOB AS 2201](https://pcaobus.org/oversight/standards/auditing-standards/details/AS2201) | How auditors test those controls (top-down, risk-based). PCAOB publishes amendments effective December 15, 2026; auditors must select the applicable version and audit-period provisions. |
| US-FFIEC-DAM | [FFIEC IT Handbook: Development, Acquisition, and Maintenance](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance) | Examiner expectations for SDLC governance, QA, and change management. |
| US-NYDFS-500.8 | [23 NYCRR §500.8, Application Security](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Written procedures for secure in-house development and testing of external software. |
| US-NYDFS-500.6 | [23 NYCRR §500.6, Audit Trail](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | To the extent applicable and based on risk assessment, retain material-financial-transaction reconstruction records at least five years and cybersecurity audit trails at least three years. Not every GitHub record is a financial transaction record. |
| CA-OSFI-B13 | [OSFI Guideline B-13, Technology and Cyber Risk Management](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | Section 2.5 (Principle 8): controlled change and release management, including emergency changes (2.5.1), segregation of duties so one person cannot develop, authorize, and move code to production (2.5.2), and traceable change records (2.5.3). |
| CA-AMF-ICT | [AMF Guideline on ICT Risk Management](https://lautorite.qc.ca/en/professionals/insurers/guidelines/operational-risk/guideline-on-information-and-communications-technology-risk-management) | Quebec's B-13 analogue: ICT governance and documented risk-management practices. |
| MX-CNBV-CUB | [CNBV Circular Única de Bancos](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) | Master bank rulebook with technology-risk and information-security provisions. Have compliance map the specific articles. |
| EU-DORA-RTS-CHANGE | [Commission Delegated Regulation (EU) 2024/1774, Art. 17 (Art. 38 simplified)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | ICT change procedures must include independence between those who approve and those who request and implement changes (17(1)(b)), documented change details, fallback procedures, and emergency change procedures with after-the-fact review and approval (17(1)(f) and (g)). |
| INT-PCI-6.2 | [PCI DSS v4.0.1, Req. 6.2.1 to 6.2.4](https://www.pcisecuritystandards.org/document_library/) | Custom software follows secure development standards and is reviewed before release. |
| INT-PCI-10.2 | [PCI DSS v4.0.1, Req. 10.2](https://www.pcisecuritystandards.org/document_library/) | Audit logs capture administrative actions, such as ruleset and bypass changes. |
| INT-PCI-10.5.1 | [PCI DSS v4.0.1, Req. 10.5.1](https://www.pcisecuritystandards.org/document_library/) | Applicable audit log history: at least 12 months, with the most recent three months immediately available for analysis. |
| INT-NIST-SSDF | [NIST SP 800-218 (SSDF) v1.1](https://csrc.nist.gov/pubs/sp/800/218/final) | Reference framework. PS.1 (protect code from tampering) and PS.3 (protect releases) map directly here. |

The common thread: **independent approval**, **controlled implementation**, and **reconstructable evidence**.

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

Before deploying rulesets, assign independent code reviewers, change authorities, policy maintainers, and evidence collectors. No one approves their own source change, ITSM authorization, bypass elevation, or policy SHA promotion.

- Final source review must come from someone other than the author and last pusher; owned paths need code-owner approval. Dismiss stale reviews and prohibit workflow approvals.
- Application developers cannot write to the central workflow repository or access its ITSM credentials. Its maintainers need independent review too.
- Implement and test the authoritative ITSM adapter, trusted revision mapper, IdP/PAM exception automation, archive, and reconciler. JSON and job names alone do not supply those controls.

The [review configuration](#pull-request-review-and-separation-of-duties) below implements source independence.

## Link every change to a ticket

Every regulated PR links to an **authoritative ITSM change record**. A pinned central workflow checks pre-merge eligibility; [Part 6's independent production broker](/blog/github-waf-financial-services/actions-hardening/#control-4-environments-and-separation-of-duties-for-deployments) performs final current-state authorization. A clickable reference does neither.

DORA RTS 17(1)(d) requires documented purpose, scope, and timeline; B-13 2.5.3 requires traceability. Configure [autolinks](https://docs.github.com/en/enterprise-cloud@latest/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/configuring-autolinks-to-reference-external-resources) for identifiers such as `CHG0012345`. GitHub [closing keywords](https://docs.github.com/en/enterprise-cloud@latest/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue) link issues only on default-branch PRs. An issue is an approval record only under an independently governed institutional process.

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

The [WAF tiered model](https://learn.github.com/well-architected/library/governance/recommendations/managing-repositories-at-scale/rulesets-best-practices/) supports US-SOX-404, US-FFIEC-DAM, CA-OSFI-B13 (2.5.1), and EU-DORA-RTS-CHANGE.

### How

This **active end-state template** targets default and release branches in every repository. Relaxations need governance approval and independently tested targeting.

Replace the team ID, central repository ID, and both workflow SHAs with approved real values. The all-zero SHAs are placeholders, not deployable workflows. The central workflows described below must exist and pass acceptance tests first.

```json
{
  "name": "regulated-tier-protected-branches",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH", "refs/heads/release/**/*"],
      "exclude": []
    },
    "repository_name": { "include": ["~ALL"], "exclude": [] }
  },
  "bypass_actors": [
    { "actor_id": 1234567, "actor_type": "Team", "bypass_mode": "pull_request" }
  ],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 2,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": true,
        "require_last_push_approval": true,
        "required_review_thread_resolution": true,
        "allowed_merge_methods": ["squash"]
      }
    },
    {
      "type": "workflows",
      "parameters": {
        "do_not_enforce_on_create": false,
        "workflows": [
          {
            "repository_id": 7654321,
            "path": ".github/workflows/build-and-test.yml",
            "sha": "0000000000000000000000000000000000000000"
          },
          {
            "repository_id": 7654321,
            "path": ".github/workflows/change-authorization.yml",
            "sha": "0000000000000000000000000000000000000000"
          }
        ]
      }
    }
  ]
}
```

After replacing placeholders and validating the central workflows, the platform owner can deploy the approved JSON through the [organization rules API](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/rules). This template is not an apply-verbatim configuration.

**Design choices:**

- **App identity is not workflow identity.** `integration_id: 15368` only identifies GitHub Actions. A developer-controlled workflow can emit the same job name from the same app. It is not our trusted gate.
- **`workflows` pins the source repository, path, and commit SHA**, using the API's documented `sha` field. Pin actions and reusable workflows inside that source too. SHA changes require independent approval and an archived policy version.
- **Merge queue** needs workflows that handle `merge_group` and validate the candidate revision. The authorization service must bind approved PR revisions to that candidate, not reuse a stale green decision.
- **Two approvals** are this template's conservative GA floor, including AI-authored changes, without relying on the preview unattributed-Copilot approval feature. Staff independent reviewers and add path-specific requirements where needed; code review still does not replace ITSM authorization.
- Migrating from branch protection? Use [converting branch protections to rulesets](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/converting-branch-protections-to-rulesets) and then remove the old rule once the ruleset is active.

GitHub also publishes prebuilt starting points in [`github/ruleset-recipes`](https://github.com/github/ruleset-recipes). Treat them as drafts to adapt, not finished controls.

### Verify

- **Configuration:** `GET /orgs/{org}/rulesets` (plus [`GET /enterprises/{enterprise}/rulesets/{ruleset_id}`](https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/rules) for enterprise rulesets) exported to your evidence store monthly. Diff against the JSON in your policy repo; any drift is a finding.
- **Change history:** [ruleset history](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-rulesets-for-repositories-in-your-organization#using-ruleset-history) keeps 180 days of iterations with compare, restore, and JSON download. Note that the **bypass list is excluded** from the exported JSON, so capture bypass actors from the API too.
- **Audit log:** `repository_ruleset.create`, `.update`, and `.destroy` events record who changed what, including `ruleset_bypass_actors_added` and `ruleset_old_enforcement` fields ([audit log events reference](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise)). Alert on any regulated-tier ruleset moving from `active` to `disabled` or `evaluate`.

## Classify repositories with custom properties

Consume [Part 1's canonical schema and governance](/blog/github-waf-financial-services/platform-foundation/#data-classification-with-custom-properties), including the CMDB `app-id`. For SOX scope and B-13 traceability, ruleset targeting must follow that inventory, not "the 14 repos we remembered."

**Fail-safe targeting:** the restrictive baseline covers **all repositories**, including missing/invalid classification. Properties select added controls or independently approved relaxations; repository actors cannot edit targeting values.

**Verify:** enumerate organizations and repositories with pagination, including managed-user repositories where applicable, and join properties to CMDB IDs. Require **100% classification of active repositories**. Alert immediately on compliance removal, criticality/classification downgrade, or lost `app-id`; review compliance-removal changes weekly. Governance approves targeting changes and tests the resulting protections. Preview CMDB sync is not required: a reviewed GA API/manual process must provide the same reconciliation.

## Pull request review and separation of duties

### What we do

On regulated branches, every change needs an approving review from someone who is **not the author and not the last person to push**. Code owners must approve changes to the paths they own. New commits invalidate old approvals. Workflows cannot approve pull requests.

### Why

OSFI B-13 2.5.2 and DORA RTS 17(1)(b) require independent approval; PCI DSS 6.2 expects pre-release review. [Bypassing reviews](https://learn.github.com/well-architected/library/scenarios/anti-patterns/) defeats that chain.

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

**CODEOWNERS done right.** Per [About code owners](https://docs.github.com/en/enterprise-cloud@latest/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners), owners need explicit write access, enterprise teams are not supported as code owners, and invalid lines are silently skipped. Keep the file in `.github/` and make the platform team own the file itself, as the [WAF governance policies page](https://learn.github.com/well-architected/library/governance/recommendations/governance-policies-best-practices/) recommends:

```text
# .github/CODEOWNERS
*                         @acme-bank/gl-app-maintainers
/src/payments/            @acme-bank/payments-reviewers
/src/ledger/posting/      @acme-bank/ledger-reviewers
/infra/                   @acme-bank/platform-engineering
/.github/                 @acme-bank/platform-engineering
/.github/CODEOWNERS       @acme-bank/platform-engineering
```

**AI-authored changes.** GitHub documents an additional approval for unattributed Copilot PRs in **public preview**, on by default. Our production template instead requires two approvals for every PR as a GA alternative; it does not depend on that preview setting. Legal must verify applicable feature terms before evaluation. [Part 7](/blog/github-waf-financial-services/copilot-and-agents/) covers agent governance in depth.

### Verify

- **CODEOWNERS health:** the [list CODEOWNERS errors API](https://docs.github.com/en/enterprise-cloud@latest/rest/repos/repos#list-codeowners-errors) on every regulated repo, weekly. A broken line means a path with no required owner.
- **Per-change evidence:** archive author, eligible reviewers, review states/commit IDs and merger. The collector and reconciliation design below must be implemented and validated to produce a complete population.
- **Settings drift:** `GET /orgs/{org}/actions/permissions/workflow` should return `can_approve_pull_request_reviews: false`. Check monthly.

## Required status checks and merge queue

### What we do

Central SHA-pinned workflows check build/test, [ITSM eligibility](#link-every-change-to-a-ticket), and [Part 5 security policy](/blog/github-waf-financial-services/code-scanning-supply-chain/). High-traffic repositories use a **merge queue**. These are check-time eligibility decisions, never atomic merge-click or current production authorization.

### Why

NYDFS 500.8 and FFIEC DAM need defined technical criteria; DORA RTS 17(1)(a) needs security verification. Central, versioned workflows make those criteria independently governable.

### How

- **Protect the source repository independently.** Central policy maintainers cannot approve their own changes. Require independent code-owner approvals, stale-review dismissal, last-push approval, and no developer bypass on its protected branches. Restrict ruleset edits and workflow SHA promotion to governance; alert on drift and bypass-list changes. Application developers cannot write to this repository.
- **Do not execute PR code in the authorization trust boundary.** Parse untrusted PR metadata as data; never evaluate it. The central ITSM adapter gets narrowly scoped credentials, not application workflows or fork code.
- **Use [Require workflows to pass before merging](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#require-workflows-to-pass-before-merging)** at the org or enterprise level for org-wide gates. Visibility rules apply (an internal workflow repo can only serve internal and private repos), and most CodeQL actions cannot run as ruleset workflows (only `upload-sarif`).
- **Availability is an implementation gate.** Verify the required-workflow rule on the selected hosting model and version. Where unsupported, use an institution-controlled, dedicated GitHub App check source backed by an external authorization service, not Actions job names. Give developers neither its credentials nor its decision API; independently validate this alternative before reliance.
- **Merge queue and deployment gates are repo-level.** Both "Require merge queue" and "Require deployments to succeed before merging" are not available in org-level rulesets. Add them with a small repo-level ruleset that layers on top of the org baseline. Remember that a [merge queue](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue) waits for checks on `merge_group` events, so update your CI triggers first.
- **Queue checks are not atomic authorization.** ITSM state/windows can change after `merge_group`. Governance continuously reconciles relied-upon queue configuration and alerts on removal/weakening. Part 6's broker authorizes production independently, denying stale, expired, cancelled, or unmapped changes without relying on a queue. Policy requiring fresh source-merge authorization additionally needs an independent merger with exclusive merge authority and tested revalidation.
- **ITSM changes must trigger new decisions.** A trusted integration receives approval, cancellation, scope, and window changes and reruns/replaces the applicable PR/candidate eligibility result. Schedule expiry invalidation and reconcile missed events by polling. Approval arriving after a failed check must cause a rerun; revocation must not leave a stale green result. Missing events or delayed checks cannot authorize production because the broker performs its own current-state query.

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

```json
{
  "name": "regulated-commit-signatures",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "repository_name": { "include": ["~ALL"], "exclude": [] },
    "ref_name": {
      "include": ["~DEFAULT_BRANCH", "refs/heads/release/**/*"],
      "exclude": []
    }
  },
  "bypass_actors": [],
  "rules": [{ "type": "required_signatures" }]
}
```

Validate squash behavior with human and bot PRs before activation. A separate signing exception requires its own approved JIT actor and reconciliation; the branch-policy bypass does not automatically bypass this ruleset.

### Verify

- The commits API exposes verification status and a `verified_at` timestamp. Sample regulated merges quarterly and confirm `verified: true`.
- Rule insights in Evaluate mode show how many pushes would fail before you flip to Active.

## Push rulesets: guard the files that guard everything else

### What we do

A push ruleset on regulated repos blocks direct changes to control files (`.github/workflows/**`, `.github/CODEOWNERS`, IaC directories), blocks binary extensions, and caps file size. Changes to those paths go through a delegated bypass request reviewed by platform engineering.

### Why

If someone can edit the workflow that runs your required checks, or the CODEOWNERS file that picks your reviewers, they can rewrite the control. SSDF PS.1 in the [WAF SSDF guide](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) recommends exactly this pattern for `.github/workflows/**`, `CODEOWNERS`, IaC, and security policy files.

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

"What exactly was deployed on March 3rd?" should have exactly one answer forever. Moving a tag after the fact breaks that, and it breaks the link between approved change and deployed artifact that B-13 2.5.3 and SSDF PS.3 care about.

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

DORA RTS Art. 17(1)(f) and (g) require emergency procedures with "adequate safeguards" and after-the-fact documentation, re-evaluation, and approval. OSFI B-13 2.5.1 asks your standard to define emergency change controls. Notice neither says "skip review." They say review later, on the record.

### How

Detect bypasses from the [org rule suites API](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/rule-suites) on a schedule:

```bash
gh api --paginate \
  "/orgs/YOUR-ORG/rulesets/rule-suites?rule_suite_result=bypass&time_period=day" \
  --jq '.[] | [.id, .repository_name, .ref, .actor_name, .pushed_at] | @tsv'
```

Feed each result into an issue-creation step, or stream the audit log to your SIEM and trigger on `protected_branch.policy_override`.

### Verify

Every emergency bypass must have authoritative approval, a valid JIT interval, automatic removal, and an independent, timely PIR. Planned push-file exceptions have their own approved change records. Reconcile daily, report quarterly, and test self-elevation, automatic expiry and overdue-PIR alerting.

## Roll out with Evaluate mode and rule insights

**Operating baseline:** publish **Active** end-state JSON. Evaluate is rollout, not an operating control. Governance assigns a pilot owner/deadline, **at most four weeks**; existing active controls remain in force. Only active controls count toward coverage.

Phase through test repositories, pilot teams, and the whole tier before enforcement, using [WAF DevOps feedback principles](https://learn.github.com/well-architected/library/collaboration/recommendations/applying-devops-methodology/). [Evaluate](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets#using-ruleset-enforcement-statuses) is documented for GHEC/GHES; Free/Pro/Team list only Active/Disabled. [Rule insights](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-rulesets-for-repositories-in-your-organization#viewing-the-rule-insights-dashboard) supplies evaluations, bypass hot spots, and CSV exports.

**Acceptance:** require negative tests, no unexplained bypasses, complete targeting, functioning archive/reconciliation, and control-owner approval. Retain CSV and acceptance records. Escalate expired pilots to the second line; the operating period starts only when enforcement and supporting controls work.

## Evidence for auditors

### What we do

Capture change evidence **at merge**, at every direct protected-branch update, and at deployment. Store it outside GitHub in an immutable, access-controlled archive. A scheduled reconciler detects missing captures before upstream retention expires. Record any UI-only evidence and manual validation rather than claiming everything is API-generated.

### Why

Auditors test **design** (is it configured?) and **operating effectiveness** (did it work all period?). The [WAF SSDF guide](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) says to stream audit logs to a SIEM "for long-term retention that exceeds GitHub's default retention periods." Supports US-NYDFS-500.6, INT-PCI-10.2, and US-PCAOB-AS2201.

### How

Know the windows; most are shorter than your audit period:

| Source | What it proves | Retention you get |
|---|---|---|
| Pull request and review metadata | Author, final head SHA, review commit IDs/times, merger, ticket | Repository lifecycle is not a retention guarantee; archive at merge |
| Checks, runs, commit statuses, logs and artifacts | Gate results and exact workflow/candidate identity | On github.com, follow Actions retention since [October 1, 2026](https://github.blog/changelog/2026-10-01-actions-retention-now-covers-checks-runs-and-statuses/), including third-party checks/statuses; default 90 days. Archive at merge, not quarter end. Verify GHE.com/GHES behavior separately. |
| [Enterprise audit log](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise) | Ruleset changes, overrides, property changes | 180 days (Git events: 7 days) unless [streamed](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise) |
| Ruleset history | Every ruleset iteration (bypass list excluded) | 180 days |
| [Rule suites API](https://docs.github.com/en/enterprise-cloud@latest/rest/repos/rule-suites) | Every pass, fail, and bypass evaluation | Queryable by `hour`, `day`, `week`, or `month` |
| Rule insights CSV | Aggregated evaluations and bypass hot spots | Export on demand |

Stream audit events continuously, poll rule suites daily with overlap and deduplication, and snapshot full ruleset details including bypass actors monthly and on policy change. Rule-suite detail metadata is capped at 50 entries, so it is not the complete reviews/checks population.

**Archive standard:** Part 1 owns [retention, integrity, and capture manifests](/blog/github-waf-financial-services/platform-foundation/#evidence-retention-and-integrity), including legal classification and holds. For source changes, capture check outcomes **at merge** with exact run/check IDs, retain later completion supplements, and flag missing required results.

### Complete population, not a capped search

The institution must build and validate the collector and reconciler. These are **read-only API building blocks**, not a complete evidence pipeline:

```bash
set -euo pipefail
: "${ORG:?Set ORG}" "${REPO:?Set REPO}" "${PR:?Set PR number}"
# Follow every Link page; filter merged_at locally over the audit period.
gh api --paginate "/repos/$ORG/$REPO/pulls?state=closed&per_page=100" \
  --jq '.[] | select(.merged_at != null) | [.number, .base.ref, .head.sha, .merge_commit_sha, .merged_at] | @tsv'
# Reviews must be joined to the final revision, not counted by state alone.
gh api --paginate "/repos/$ORG/$REPO/pulls/$PR/reviews?per_page=100" \
  --jq '.[] | [.id, .user.id, .state, .commit_id, .submitted_at] | @tsv'
gh api --paginate "/repos/$ORG/$REPO/branches?per_page=100" \
  --jq '.[] | [.name, .commit.sha] | @tsv'
```

Do not substitute `gh pr list --limit 1000` or the search API: search caps can silently omit changes. Enumerate organizations, repositories and applicable branch rules with pagination, then include **all protected branches**, not only `main`. Include branches created, renamed, deleted or differently protected during the period from historical policy and event records.

1. At each merge, archive PR metadata, all review pages and dismissal events, original commits, final head/base and merge SHA, checks/statuses/runs, central workflow SHAs, ITSM approval/window, effective rulesets and bypass actors. Record original push actor/time from events, not spoofable commit author dates.
2. Continuously capture protected-branch before/after SHAs, direct pushes, bypasses, release-app updates and tag/release events. Traverse the commit graph between snapshots with paginated APIs or a verified mirror; retain deleted/force-pushed history from event-time capture.
3. Reconcile branch updates to merged PRs or explicit approved direct-push exceptions, and reconcile all production deployments (including external emergency paths) to approved revisions and artifact digests. No unexplained commit, update or deployment may disappear from the report.
4. An approval counts only if it covers the **final reviewed head SHA**, precedes merge, follows the last reviewable push, is not dismissed/superseded, and comes from an eligible independent reviewer. Check code-owner requirements and separately prove independent ITSM authorization. Missing timing/identity evidence is an exception, not a pass.
5. Prove information-produced-by-the-entity completeness and accuracy: inventory totals, every pagination cursor/page, period/time-zone filters, API errors and permission scope, branch-event/commit/deployment counts, duplicate handling, and archive receipts. Fail and alert on missing pages, permission gaps, missing check captures, or unreconciled records.

Run the reconciler daily and review a signed monthly completeness report. Catch webhook delivery failures by independent polling; do not wait until a quarterly report discovers expired evidence. Quarterly, internal audit validates the population and sampling methodology, including direct pushes, release branches, dismissed/stale reviews and absent archives.

### Verify

One quarter before external testing, give internal audit the collector and reconciled population for independent extraction and sampling.

## Control matrix

Rows **contribute to** requirements. Second-line compliance validates applicability, residual gaps, and operating evidence.

| Control | Contributes to requirement IDs | GitHub feature / institutional control | Evidence | Cadence |
|---|---|---|---|---|
| Central, tiered branch policy | US-SOX-404, US-FFIEC-DAM, CA-OSFI-B13, EU-DORA-RTS-CHANGE, MX-CNBV-CUB | Enterprise/org rulesets | Ruleset JSON export, ruleset history, `repository_ruleset.*` events | Monthly export, real-time alert on disable |
| Accurate regulated scope | US-SOX-404, US-PCAOB-AS2201, CA-OSFI-B13 | Governance-owned properties, restrictive default | 100% active-repo coverage, downgrade alerts, CMDB reconciliation | Continuous alert, quarterly validation |
| Independent approval | US-SOX-404, CA-OSFI-B13, EU-DORA-RTS-CHANGE, INT-PCI-6.2, CA-AMF-ICT | PR rules: approvals, last-push approval, dismiss stale, code owners | PR review records, exceptions report | Per change, quarterly population |
| Defined quality and security gates | US-NYDFS-500.8, US-FFIEC-DAM, EU-DORA-RTS-CHANGE | Central SHA-pinned required workflows, protected source repo, merge queue | Exact workflow identity and results archived at merge; spoofing negative tests | Per change, quarterly test |
| Commit provenance | CA-OSFI-B13, INT-NIST-SSDF | Required signatures | Commit `verified` and `verified_at` | Quarterly sample |
| Protect control files | INT-NIST-SSDF, CA-OSFI-B13 | Push rulesets, delegated bypass | Bypass requests API | Monthly |
| Release integrity | CA-OSFI-B13, INT-NIST-SSDF | Tag rulesets, immutable releases | Immutable label, release attestation | Quarterly sample |
| Controlled bypass | US-SOX-404, EU-DORA-RTS-CHANGE, INT-PCI-10.2 | PR-only branch bypass; separately approved JIT push exceptions; no `exempt` | Override, approval, expiry and push reconciliation | Daily reconcile, weekly review |
| Change authorization and traceability | US-SOX-404, CA-OSFI-B13, EU-DORA-RTS-CHANGE | Central eligibility workflow, trusted scope mapper and independent production broker | Independent scope approval, final revision mapping, current-state in-window deployment decision | Per update, revision binding at merge, authorization at deploy |
| Emergency change review | EU-DORA-RTS-CHANGE, CA-OSFI-B13 | IdP/PAM JIT, rule-suite detection, institutional PIR automation | Independent elevation and timely independent final-revision PIR | Daily fail-closed reconciliation |
| Evidence retention and completeness | US-NYDFS-500.6, INT-PCI-10.2, INT-PCI-10.5.1, US-PCAOB-AS2201 | Event-time archive, paginated collectors, independent reconciler | Immutable controlled archive, hashes/receipts, complete branch and deployment population | At merge/update/deploy, daily reconciliation |

## Summary and key takeaways

Change control on GitHub is not about turning on more settings. It is about making the settings **central**, **targeted**, and **self-documenting** so the evidence exists before anyone asks for it.

Start here:

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
