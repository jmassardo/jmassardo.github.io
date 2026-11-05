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

> **A friendly note:** This information is meant to be guidance to help navigate a complex topic. Please validate these patterns with your compliance and/or regulatory reporting team(s).

## Leadership brief

> - **The risk:** An unreviewed or self-approved change reaches a system that feeds financial reporting, payments, or customer data. That is a SOX ITGC deficiency, a DORA change-management gap, and an OSFI B-13 segregation-of-duties finding all at once.
> - **Our position:** Every change to a regulated repository flows through a pull request. Someone other than the last person to touch it approves it, required checks pass, and only then does it land on a protected branch. Policy is defined centrally with **rulesets** and targeted with **custom properties**, not configured repo by repo.
> - **Exceptions are designed, not improvised:** a small break-glass group can bypass for pull requests only, every bypass is logged, and every emergency change gets a post-implementation review.
> - **The evidence:** pull request records (author, approvers, checks, linked ticket), ruleset change history, audit log events, and rule insights exports. All of it is queryable by API, so quarterly change populations become a script instead of a scramble.

Picture the third week of your SOX testing window. The external auditor sends a polite email: "Please provide the population of changes to the general ledger application for Q3, plus evidence that each change was approved by someone other than the developer before deployment."

Somewhere, an engineer opens a spreadsheet and starts taking screenshots. Another discovers a repo admin turned off branch protection "for an hour" in August. Nobody can say who approved the long-weekend hotfix.

This is not a tooling gap. GitHub already has the controls; they were just never configured as **controls**: centrally defined, consistently applied, and producing evidence on their own. Let's fix that.

## The requirements

Regulations are baselines, not checklists. Your organization decides how it meets or exceeds each one; the GitHub configuration is how you prove you did what your policy says.

| ID | Regulation and citation | What it asks for (paraphrased) |
|---|---|---|
| US-SOX-404 | [Sarbanes-Oxley Act §404, 15 U.S.C. §7262](https://www.govinfo.gov/content/pkg/USCODE-2023-title15/pdf/USCODE-2023-title15-chap98-subchapII-sec7262.pdf) | Annual assessment of internal control over financial reporting, with auditor attestation for accelerated filers. Program change management is a core ITGC beneath it. |
| US-PCAOB-AS2201 | [PCAOB AS 2201](https://pcaobus.org/oversight/standards/auditing-standards/details/AS2201) | How auditors test those controls (top-down, risk-based). Amendments apply to audits on or after Dec 15, 2026. |
| US-FFIEC-DAM | [FFIEC IT Handbook: Development, Acquisition, and Maintenance](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance) | Examiner expectations for SDLC governance, QA, and change management. |
| US-NYDFS-500.8 | [23 NYCRR §500.8, Application Security](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Written procedures for secure in-house development and testing of external software. |
| US-NYDFS-500.6 | [23 NYCRR §500.6, Audit Trail](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Audit trails supporting detection, response, and reconstruction, with defined retention. |
| CA-OSFI-B13 | [OSFI Guideline B-13, Technology and Cyber Risk Management](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | Section 2.5 (Principle 8): controlled change and release management, including emergency changes (2.5.1), segregation of duties so one person cannot develop, authorize, and move code to production (2.5.2), and traceable change records (2.5.3). |
| CA-AMF-ICT | [AMF Guideline on ICT Risk Management](https://lautorite.qc.ca/en/professionals/insurers/guidelines/operational-risk/guideline-on-information-and-communications-technology-risk-management) | Quebec's B-13 analogue: ICT governance and documented risk-management practices. |
| MX-CNBV-CUB | [CNBV Circular Única de Bancos](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) | Master bank rulebook with technology-risk and information-security provisions. Have compliance map the specific articles. |
| EU-DORA-RTS-CHANGE | [Commission Delegated Regulation (EU) 2024/1774, Art. 17 (Art. 38 simplified)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | ICT change procedures must include independence between those who approve and those who request and implement changes (17(1)(b)), documented change details, fallback procedures, and emergency change procedures with after-the-fact review and approval (17(1)(f) and (g)). |
| INT-PCI-6.2 | [PCI DSS v4.0.1, Req. 6.2.1 to 6.2.4](https://www.pcisecuritystandards.org/document_library/) | Custom software follows secure development standards and is reviewed before release. |
| INT-PCI-10.2 | [PCI DSS v4.0.1, Req. 10.2](https://www.pcisecuritystandards.org/document_library/) | Audit logs capture administrative actions, such as ruleset and bypass changes. |
| INT-NIST-SSDF | [NIST SP 800-218 (SSDF) v1.1](https://csrc.nist.gov/pubs/sp/800/218/final) | Reference framework. PS.1 (protect code from tampering) and PS.3 (protect releases) map directly here. |

The common thread: **changes are approved before they land**, **the approver is independent of the implementer**, and **you can reconstruct what happened later**. The rest is vocabulary.

## Deployment model differences

Change-control features are mostly consistent across GitHub deployment models. Here is where they actually differ.

| Model | What changes for this topic |
|---|---|
| **GHEC (personal accounts)** | Full ruleset stack: repository, organization, and [enterprise-level rulesets](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-code-governance). Repositories in personal namespaces sit outside your org rulesets, so keep regulated code in organizations. |
| **GHEC with EMU** | Same feature set, plus enterprise rulesets can target **all repositories owned by users in your enterprise**, closing the personal-namespace gap. Managed users cannot push to repositories outside the enterprise, which simplifies your fork story. |
| **GHEC with data residency (GHE.com)** | EMU-only, so the EMU notes apply. None of the change-control features in this post appear on the [GHE.com unavailable features list](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency). GitHub Marketplace is unavailable, so ticketing or status-check apps must be installed from their source. |
| **GHES (3.22)** | Organization and repository rulesets, push rulesets, Evaluate mode, rule insights, and [immutable releases](https://docs.github.com/en/enterprise-server@latest/code-security/concepts/supply-chain-security/immutable-releases) are documented. The enterprise code governance rulesets page is **not** published for GHES, so plan on org-level rulesets per organization. [Ruleset history](https://docs.github.com/en/enterprise-server@latest/organizations/managing-organization-settings/managing-rulesets-for-repositories-in-your-organization) only covers changes made after upgrading to 3.17 or later. You own log retention for the appliance. |

**Takeaway:** if you run multiple GHES organizations, store your rulesets as JSON in a repo and apply them with the API so every org gets the same baseline.

## Use rulesets as the policy engine

### What we do

Rulesets replace legacy branch protection for anything regulated. We define them at the **enterprise** level (GHEC) or **organization** level (GHES), target them dynamically by custom property, and tier them: baseline, production, and regulated. Repo-level rulesets are allowed for teams that want to be stricter, never looser.

### Why

Branch protection works, but it does not scale as a control. Per [About rulesets](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets), rulesets differ in ways auditors care about:

- **Multiple rulesets layer** on the same branch, and the most restrictive version of each rule wins. A repo admin cannot weaken an org ruleset by adding a looser one.
- **Anyone with read access can view active rulesets**, so auditors can inspect protections without admin rights.
- **Enforcement status changes without deleting** the ruleset, and Evaluate mode lets you test before you block.
- Rulesets also layer with any remaining branch protection rules, so migration is not a big-bang cutover.

The [WAF rulesets best practices](https://learn.github.com/well-architected/library/governance/recommendations/managing-repositories-at-scale/rulesets-best-practices/) page explicitly calls out SOX and PCI DSS environments needing evidence that "code changes follow proper authorization and review processes," and recommends exactly this tiered model. It maps to US-SOX-404, US-FFIEC-DAM, CA-OSFI-B13 (2.5.1), and EU-DORA-RTS-CHANGE.

### How

Here is our opinionated regulated-tier ruleset. It targets the default branch and release branches in any repo tagged `SOX` or `PCI-DSS`, starts in Evaluate mode, and allows a break-glass team to bypass **only through a pull request**.

```json
{
  "name": "regulated-tier-protected-branches",
  "target": "branch",
  "enforcement": "evaluate",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH", "refs/heads/release/**/*"],
      "exclude": []
    },
    "repository_property": {
      "include": [
        { "name": "compliance-frameworks", "property_values": ["SOX", "PCI-DSS"], "source": "custom" }
      ],
      "exclude": []
    }
  },
  "bypass_actors": [
    { "actor_id": 1234567, "actor_type": "Team", "bypass_mode": "pull_request" }
  ],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "required_signatures" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": true,
        "require_last_push_approval": true,
        "required_review_thread_resolution": true,
        "allowed_merge_methods": ["squash"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          { "context": "build-and-test", "integration_id": 15368 },
          { "context": "change-ticket", "integration_id": 15368 }
        ]
      }
    }
  ]
}
```

Apply it with the [organization rules API](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/rules):

```bash
gh api -X POST /orgs/YOUR-ORG/rulesets --input regulated-tier.json
```

A few notes on the choices:

- **`integration_id: 15368`** is the GitHub Actions app. Pinning the source means a random integration with write access cannot post a fake green `build-and-test` status. The [available rules doc](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) covers how expected sources work.
- **Strict status checks** make the branch be up to date before merge. On busy repos, pair this with a merge queue (covered below) so developers are not stuck in rebase purgatory.
- **One approval** is the floor for this tier, matching the WAF production tier. Raise it, or add team-based **required reviewers** on specific paths, for high-risk areas like payment routing.
- Migrating from branch protection? Use [converting branch protections to rulesets](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/converting-branch-protections-to-rulesets) and then remove the old rule once the ruleset is active.

GitHub also publishes prebuilt starting points in [`github/ruleset-recipes`](https://github.com/github/ruleset-recipes). Treat them as drafts to adapt, not finished controls.

### Verify

- **Configuration:** `GET /orgs/{org}/rulesets` (plus [`GET /enterprises/{enterprise}/rulesets/{ruleset_id}`](https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/rules) for enterprise rulesets) exported to your evidence store monthly. Diff against the JSON in your policy repo; any drift is a finding.
- **Change history:** [ruleset history](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-rulesets-for-repositories-in-your-organization#using-ruleset-history) keeps 180 days of iterations with compare, restore, and JSON download. Note that the **bypass list is excluded** from the exported JSON, so capture bypass actors from the API too.
- **Audit log:** `repository_ruleset.create`, `.update`, and `.destroy` events record who changed what, including `ruleset_bypass_actors_added` and `ruleset_old_enforcement` fields ([audit log events reference](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise)). Alert on any regulated-tier ruleset moving from `active` to `disabled` or `evaluate`.

## Classify repositories with custom properties

### What we do

Every repository gets required custom properties at creation. At minimum: `compliance-frameworks` (multi-select), `data-classification`, `business-criticality`, and an `app-id` that ties back to the CMDB. Rulesets target the properties, never hand-maintained repo lists.

### Why

Scoping is the first thing an auditor tests. If your SOX control applies to "the 14 repos we remembered," the population is wrong before testing starts. The [WAF custom properties best practices](https://learn.github.com/well-architected/library/governance/recommendations/managing-repositories-at-scale/custom-properties-best-practices/) page uses nearly this exact schema for a financial services repo. It notes that properties "create clear documentation of why certain repositories have specific security controls." That supports US-SOX-404 scoping and CA-OSFI-B13 traceability (2.5.3).

### How

Follow [managing custom properties for repositories in your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-custom-properties-for-repositories-in-your-organization). Two settings matter more than the rest:

- **Require this property for all repositories**, ideally with **Require explicit user-specified values** so nobody silently inherits a default.
- **Do not enable "Allow repository actors to set this property"** on any property used for ruleset targeting. Otherwise a repo admin can drop `SOX` from their repo and walk out of the control. Keep value edits with a governance team that holds the org-level "Edit custom properties values" permission.

On GHEC you can also define **organization custom properties** at the enterprise level and target enterprise rulesets at groups of orgs ([custom properties overview](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-organizations-in-your-enterprise/custom-properties)). Syncing values from an external system such as a CMDB is in **public preview**.

### Verify

- Audit log events `custom_property_value.create`, `.update`, and `.destroy` show every reclassification. Review changes that remove a compliance value weekly.
- Coverage report: list repos via the [custom properties API](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/custom-properties) and reconcile against the CMDB quarterly. The WAF target is 90% or better coverage of active repos; for regulated scope, aim for 100%.

## Pull request review and separation of duties

### What we do

On regulated branches, every change needs an approving review from someone who is **not the author and not the last person to push**. Code owners must approve changes to the paths they own. New commits invalidate old approvals. Workflows cannot approve pull requests.

### Why

This is the heart of the ITGC. OSFI B-13 2.5.2 says the same person should not "develop, authorize, execute and move code." DORA RTS Art. 17(1)(b) asks for independence between approvers and implementers. PCI DSS 6.2 expects code review before release. The [WAF anti-patterns page](https://learn.github.com/well-architected/library/scenarios/anti-patterns/) lists "Bypassing Code Reviews" for good reason.

### How

Here is how the separation-of-duties chain actually works, using GitHub's own behavior:

| Gap an auditor will probe | Control that closes it |
|---|---|
| Developer approves their own change | Built in: [pull request authors cannot approve their own pull requests](https://docs.github.com/en/enterprise-cloud@latest/pull-requests/how-tos/review-pull-requests/reviewing-proposed-changes-in-a-pull-request). |
| Reviewer approves, then pushes more code and merges | **Require approval of the most recent reviewable push**: an approval must come from someone other than the last pusher. |
| Author sneaks commits in after approval | **Dismiss stale approvals when new commits are pushed** resets approvals when the diff changes. |
| Change to payments code reviewed by someone outside the payments team | **Require review from code owners**, with teams as owners. |
| A workflow approves its own pull request | Keep [GitHub Actions blocked from creating or approving pull requests](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization#preventing-github-actions-from-creating-or-approving-pull-requests) (the default for new organizations). |
| Someone dismisses the blocking review | Restrict who can dismiss reviews on targeted branches. |

The docs are candid about a trade-off here. Last-push approval alone does not dismiss stale reviews, and "if you are concerned about pull requests being hijacked ... it is safer to dismiss stale reviews" ([available rules](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)). For regulated repos, turn on both.

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

**AI-authored changes.** Rulesets now require one additional human approval when Copilot opens a pull request that is not attributed to a person. That setting is in **public preview** and on by default. [Part 7](/blog/github-waf-financial-services/copilot-and-agents/) covers agent governance in depth.

### Verify

- **CODEOWNERS health:** the [list CODEOWNERS errors API](https://docs.github.com/en/enterprise-cloud@latest/rest/repos/repos#list-codeowners-errors) on every regulated repo, weekly. A broken line means a path with no required owner.
- **Per-change evidence:** each merged PR records author, reviewers, review states, the commits reviewed, and who merged. The evidence script later in this post turns that into a population.
- **Settings drift:** `GET /orgs/{org}/actions/permissions/workflow` should return `can_approve_pull_request_reviews: false`. Check monthly.

## Required status checks and merge queue

### What we do

Required checks gate every regulated merge: build and test, the change-ticket check, and the security checks from [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/). Central checks run as **ruleset workflows** from a versioned internal repo so teams cannot quietly edit them. High-traffic repos use a **merge queue**.

### Why

Approval proves a human looked. Checks prove the change met defined criteria, which is what NYDFS 500.8 and FFIEC DAM ask your procedures to define. DORA RTS Art. 17(1)(a) asks for verification that security requirements were met. The WAF rulesets guidance recommends centralizing critical workflows and keeping them "in internal reusable workflow repos and version them."

### How

- **Pin check sources** with `integration_id`, as in the ruleset above.
- **Use [Require workflows to pass before merging](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#require-workflows-to-pass-before-merging)** at the org or enterprise level for org-wide gates. Visibility rules apply (an internal workflow repo can only serve internal and private repos), and most CodeQL actions cannot run as ruleset workflows (only `upload-sarif`).
- **Merge queue and deployment gates are repo-level.** Both "Require merge queue" and "Require deployments to succeed before merging" are not available in org-level rulesets. Add them with a small repo-level ruleset that layers on top of the org baseline. Remember that a [merge queue](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue) waits for checks on `merge_group` events, so update your CI triggers first.

### Verify

- Rule suites with `fail` results show checks doing their job. A regulated repo with zero failures over a quarter is worth a look; it may mean the checks are not running.
- Diff the required check list in exported ruleset JSON against your documented standard each quarter.

## Commit provenance: signed commits and vigilant mode

### What we do

Require signed commits on regulated branches. Encourage (but do not pretend to enforce) vigilant mode for engineers in regulated teams. With EMU, add a commit metadata rule restricting author email to your corporate domain.

### Why

Git lets anyone set any author name. Signing gives you non-repudiation for the commits that form your change record, supporting CA-OSFI-B13 2.5.3 integrity and SSDF PS.1. The [WAF NIST SSDF implementation guide](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) adds a nuance: prefer signing methods that need a human action (passphrase, biometric, hardware key). Malware can read a key file but cannot press your fingerprint sensor.

### How

- Add `required_signatures` to the regulated ruleset. The WAF suggests waiting for roughly 80% signing adoption; run in Evaluate until then.
- Mind the sharp edge: **unsigned commits on a PR branch can block a squash merge**, even though GitHub signs the squash commit ([available rules](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#require-signed-commits)). Teach rebase-and-sign early.
- **Vigilant mode is a personal setting** that flags a user's unsigned commits as "Unverified." You cannot enforce it from the org ([vigilant mode docs](https://docs.github.com/en/enterprise-cloud@latest/authentication/managing-commit-signature-verification/displaying-verification-statuses-for-all-of-your-commits)), so it belongs in onboarding, not your control narrative.
- Verification is **persistent**: a verified commit stays verified after key rotation or a developer's departure ([about commit signature verification](https://docs.github.com/en/enterprise-cloud@latest/authentication/managing-commit-signature-verification/about-commit-signature-verification)). Handy when an auditor samples a change from eleven months ago.

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

One caution from the WAF: "Push rulesets can block legitimate automation if not tested; pilot them first." Evaluate mode is your friend here.

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

- **No standing human "always" bypass** on regulated rulesets.
- One **break-glass team** with `bypass_mode: pull_request`. Membership is empty by default and granted just in time through your IdP group ([Part 2](/blog/github-waf-financial-services/identity-and-access/) covers the identity plumbing).
- Automation that must bypass (release apps, Dependabot where you allow it) is listed explicitly, by app, with a documented reason.
- **Never use `exempt`** for anything in regulated scope.

### Why

Two WAF pages appear to disagree. The [governance policies page](https://learn.github.com/well-architected/library/governance/recommendations/governance-policies-best-practices/) says bypass "should not be allowed." The [rulesets page](https://learn.github.com/well-architected/library/governance/recommendations/managing-repositories-at-scale/rulesets-best-practices/) allows it "only to roles/teams with clear break-glass standard operating procedures" and warns about "impossible merge" situations. Zero bypass sounds great until CI is down mid-incident and the only exit is disabling the ruleset, which is far worse evidence. A scoped, logged bypass beats an untracked disable.

### How

The bypass mode is where the audit trail lives or dies. From the [org rules API](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/rules) and [creating org rulesets](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/creating-rulesets-for-repositories-in-your-organization#granting-bypass-permissions-for-your-branch-or-tag-ruleset):

| Mode | Behavior | Our stance |
|---|---|---|
| `always` | Actor can push directly or merge past rules | Release automation only, if needed |
| `pull_request` | Actor must open a PR, "creating a clear trail ... in the pull request and audit log," then may bypass to merge | Break-glass team |
| `exempt` | Rules are not run for that actor and **no bypass audit entry is created** | Never in regulated scope |

### Verify

- Audit log `protected_branch.policy_override` captures overrides, with a `rule_suite_id` you can resolve for detail.
- `repository_ruleset.update` with `ruleset_bypass_actors_added` flags anyone expanding the bypass list. Alert on it in your SIEM.
- Rule insights shows the repos with the most bypasses. The WAF suggests a weekly review cadence; we agree.

## Roll out with Evaluate mode and rule insights

**What we do:** every new or tightened rule starts in **Evaluate**, runs at least one sprint, and moves to **Active** only after the friction is understood.

**Why:** a control that breaks every pipeline on day one gets bypassed on day two. The WAF recommends phasing (test repos, pilot teams, whole tier, then enforce), which also hands you a documented rollout. It is the [WAF DevOps principles](https://learn.github.com/well-architected/library/collaboration/recommendations/applying-devops-methodology/) of automation and rapid feedback, applied to controls.

**How:** [Evaluate](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets#using-ruleset-enforcement-statuses) is documented for GHEC and GHES; the Free, Pro, and Team docs list only Active and Disabled. The [rule insights dashboard](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-rulesets-for-repositories-in-your-organization#viewing-the-rule-insights-dashboard) aggregates evaluations, highlights bypass hot spots, and exports CSV.

**Verify:** keep the CSV export from the day you flip to Active. It proves the control was tested before enforcement.

## Link every change to a ticket

### What we do

Every regulated PR references a change record (ServiceNow, Jira, or a GitHub issue). A required status check enforces it. Autolinks make the reference clickable.

### Why

DORA RTS 17(1)(d) wants documented purpose, scope, and timeline. B-13 2.5.3 wants traceability. Your CAB already has the change record; the PR just needs to point at it. The WAF anti-patterns page also recommends you "link issues to the code changes that address them."

### How

- **[Configure autolinks](https://docs.github.com/en/enterprise-cloud@latest/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/configuring-autolinks-to-reference-external-resources)** so `CHG0012345` links to your ITSM tool.
- **For GitHub issues**, [closing keywords](https://docs.github.com/en/enterprise-cloud@latest/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue) like `Fixes #123` create the link, but only when the PR targets the default branch.
- **Enforce with a check**, not a commit-message rule. GitHub's own docs say metadata restrictions are for consistency and "are not intended to replace security measures." A PR-level check is also friendlier to squash merges.

{% raw %}
```yaml
# .github/workflows/change-ticket.yml (or a ruleset workflow in your central repo)
name: change-ticket
on:
  pull_request:
    types: [opened, edited, synchronize, reopened]
permissions: {}
jobs:
  change-ticket:
    runs-on: ubuntu-latest
    steps:
      - name: Require a change ticket reference
        env:
          PR_TITLE: ${{ github.event.pull_request.title }}
          PR_BODY: ${{ github.event.pull_request.body }}
        run: |
          if printf '%s\n%s' "$PR_TITLE" "$PR_BODY" | grep -Eq '\b(CHG|EMG)[0-9]{7}\b'; then
            echo "Change ticket reference found."
          else
            echo "::error::Add a change ticket (for example CHG0012345) to the PR title or body."
            exit 1
          fi
```
{% endraw %}

Passing the title and body through environment variables (rather than inlining them in the script) avoids script injection from a crafted PR title. [Part 6](/blog/github-waf-financial-services/actions-hardening/) goes deeper on that class of bug.

### Verify

The `change-ticket` context appears in each PR's status check rollup. The evidence export below captures it per change.

## Emergency changes

### What we do

Emergency changes still go through a pull request. The difference is who can merge and when the review happens:

1. On-call engineer opens a PR referencing an `EMG` ticket.
2. If a second engineer is available, they approve normally. That is the preferred path even at 2 AM.
3. If not, an incident commander is added to the break-glass IdP group and merges using the **PR-only bypass**.
4. Automation detects the bypass and opens a post-implementation review issue assigned to the code owners.
5. Within your defined window (we suggest two business days), a code owner reviews and approves the merged change, and the break-glass membership is removed.

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

Every bypass in the period should have an `EMG` ticket and a closed post-implementation review. Count mismatches quarterly; zero is the target, and any gap goes to your control owner.

## Evidence for auditors

### What we do

We produce change evidence from APIs on a schedule, store it outside GitHub with retention matching policy, and never rely on screenshots.

### Why

Auditors test **design** (is it configured?) and **operating effectiveness** (did it work all period?). The [WAF SSDF guide](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) says to stream audit logs to a SIEM "for long-term retention that exceeds GitHub's default retention periods." Supports US-NYDFS-500.6, INT-PCI-10.2, and US-PCAOB-AS2201.

### How

Know the windows; most are shorter than your audit period:

| Source | What it proves | Retention you get |
|---|---|---|
| Pull request record | Author, approvers, commits reviewed, checks, ticket, merger | Lives with the repo |
| [Enterprise audit log](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise) | Ruleset changes, overrides, property changes | 180 days (Git events: 7 days) unless [streamed](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise) |
| Ruleset history | Every ruleset iteration (bypass list excluded) | 180 days |
| [Rule suites API](https://docs.github.com/en/enterprise-cloud@latest/rest/repos/rule-suites) | Every pass, fail, and bypass evaluation | Queryable by `hour`, `day`, `week`, or `month` |
| Rule insights CSV | Aggregated evaluations and bypass hot spots | Export on demand |

So: stream the audit log, export rule suites at least monthly, and snapshot rulesets via API each month.

Here is a quarterly population export, plus an exceptions report listing merged PRs with no approval from someone other than the author:

```bash
gh pr list --repo acme-bank/gl-app --state merged --limit 1000 \
  --search "base:main merged:2026-07-01..2026-09-30" \
  --json number,title,author,mergedBy,mergedAt,reviews,commits,statusCheckRollup,url \
  > gl-app-2026Q3-changes.json

jq -r '.[] | . as $pr
  | [$pr.reviews[] | select(.state == "APPROVED" and .author.login != $pr.author.login)] as $approvals
  | select(($approvals | length) == 0)
  | "\($pr.number)\t\($pr.mergedBy.login)\t\($pr.url)"' gl-app-2026Q3-changes.json
```

Every line in that exceptions report should match a bypass with an emergency ticket. If it does not, you found the problem before the auditor did, which is the whole point.

### Verify

Do a dry run with internal audit one quarter before external testing. Hand them the scripts and let them pull their own sample. Auditors trust evidence they extracted themselves far more than evidence you curated.

## Control matrix

| Control | Requirement IDs | GitHub feature | Evidence | Cadence |
|---|---|---|---|---|
| Central, tiered branch policy | US-SOX-404, US-FFIEC-DAM, CA-OSFI-B13, EU-DORA-RTS-CHANGE, MX-CNBV-CUB | Enterprise/org rulesets | Ruleset JSON export, ruleset history, `repository_ruleset.*` events | Monthly export, real-time alert on disable |
| Accurate regulated scope | US-SOX-404, US-PCAOB-AS2201, CA-OSFI-B13 | Required custom properties | Property coverage report, `custom_property_value.*` events | Weekly review, quarterly CMDB reconcile |
| Independent approval | US-SOX-404, CA-OSFI-B13, EU-DORA-RTS-CHANGE, INT-PCI-6.2, CA-AMF-ICT | PR rules: approvals, last-push approval, dismiss stale, code owners | PR review records, exceptions report | Per change, quarterly population |
| Defined quality and security gates | US-NYDFS-500.8, US-FFIEC-DAM, EU-DORA-RTS-CHANGE | Required status checks, ruleset workflows, merge queue | Status check rollup per PR, rule suite fails | Per change, quarterly diff |
| Commit provenance | CA-OSFI-B13, INT-NIST-SSDF | Required signatures | Commit `verified` and `verified_at` | Quarterly sample |
| Protect control files | INT-NIST-SSDF, CA-OSFI-B13 | Push rulesets, delegated bypass | Bypass requests API | Monthly |
| Release integrity | CA-OSFI-B13, INT-NIST-SSDF | Tag rulesets, immutable releases | Immutable label, release attestation | Quarterly sample |
| Controlled bypass | US-SOX-404, EU-DORA-RTS-CHANGE, INT-PCI-10.2 | PR-only bypass actors, no `exempt` | `protected_branch.policy_override`, rule insights | Weekly review |
| Change traceability | CA-OSFI-B13, EU-DORA-RTS-CHANGE | Ticket check, autolinks | `change-ticket` check per PR | Per change |
| Emergency change review | EU-DORA-RTS-CHANGE, CA-OSFI-B13 | Rule suites `bypass` query, issues | EMG ticket plus closed review per bypass | Daily detection, quarterly reconcile |
| Evidence retention | US-NYDFS-500.6, INT-PCI-10.2, US-PCAOB-AS2201 | Audit log streaming, API exports | SIEM retention, export archive | Continuous, monthly exports |

## Summary and key takeaways

Change control on GitHub is not about turning on more settings. It is about making the settings **central**, **targeted**, and **self-documenting** so the evidence exists before anyone asks for it.

Start here:

- [ ] Define required custom properties (`compliance-frameworks`, `data-classification`, `business-criticality`, `app-id`) and lock value edits to a governance team.
- [ ] Build baseline, production, and regulated rulesets at the enterprise (GHEC) or org (GHES) level, stored as JSON in a policy repo.
- [ ] Turn on approvals, code owner review, dismiss stale approvals, and last-push approval for the regulated tier.
- [ ] Pin required status checks to their source app and centralize shared gates as ruleset workflows.
- [ ] Add push rulesets protecting `.github/workflows/**`, `CODEOWNERS`, and IaC paths.
- [ ] Protect release tags with tag rulesets and enable immutable releases.
- [ ] Replace standing bypass with a JIT break-glass team using PR-only bypass; ban `exempt`.
- [ ] Roll every change through Evaluate mode and keep the rule insights export.
- [ ] Enforce change ticket references with a required check.
- [ ] Automate bypass detection and post-implementation reviews for emergency changes.
- [ ] Stream the audit log, export rule suites monthly, and rehearse the quarterly population pull with internal audit.

Previously: [Part 2: Identity and Access Management](/blog/github-waf-financial-services/identity-and-access/), which covers the teams and IdP groups these rulesets depend on. Next up: [Part 4: Secrets Protection](/blog/github-waf-financial-services/secrets-protection/), where push protection and delegated bypass get the FSI treatment.

## References

### GitHub Well-Architected

- [Rulesets best practices](https://learn.github.com/well-architected/library/governance/recommendations/managing-repositories-at-scale/rulesets-best-practices/)
- [Custom properties best practices](https://learn.github.com/well-architected/library/governance/recommendations/managing-repositories-at-scale/custom-properties-best-practices/)
- [Governance policies best practices](https://learn.github.com/well-architected/library/governance/recommendations/governance-policies-best-practices/)
- [Applying DevOps methodology](https://learn.github.com/well-architected/library/collaboration/recommendations/applying-devops-methodology/)
- [NIST SSDF implementation](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/)
- [Anti-patterns](https://learn.github.com/well-architected/library/scenarios/anti-patterns/)

### GitHub Docs

- [About rulesets](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [Available rules for rulesets](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [Creating rulesets for repositories in your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/creating-rulesets-for-repositories-in-your-organization)
- [Managing rulesets for repositories in your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-rulesets-for-repositories-in-your-organization)
- [Enforcing code governance in your enterprise with rulesets](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-code-governance)
- [Converting branch protections to rulesets](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/converting-branch-protections-to-rulesets)
- [REST API: organization rules](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/rules)
- [REST API: enterprise rules](https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/rules)
- [REST API: repository rule suites](https://docs.github.com/en/enterprise-cloud@latest/rest/repos/rule-suites)
- [REST API: organization rule suites](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/rule-suites)
- [REST API: organization push rule bypass requests](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/bypass-requests)
- [Managing custom properties for repositories in your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-custom-properties-for-repositories-in-your-organization)
- [Custom properties (enterprise)](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-organizations-in-your-enterprise/custom-properties)
- [REST API: custom properties](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/custom-properties)
- [About code owners](https://docs.github.com/en/enterprise-cloud@latest/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [REST API: list CODEOWNERS errors](https://docs.github.com/en/enterprise-cloud@latest/rest/repos/repos#list-codeowners-errors)
- [Reviewing proposed changes in a pull request](https://docs.github.com/en/enterprise-cloud@latest/pull-requests/how-tos/review-pull-requests/reviewing-proposed-changes-in-a-pull-request)
- [Disabling or limiting GitHub Actions for your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization#preventing-github-actions-from-creating-or-approving-pull-requests)
- [Managing a merge queue](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)
- [About commit signature verification](https://docs.github.com/en/enterprise-cloud@latest/authentication/managing-commit-signature-verification/about-commit-signature-verification)
- [Displaying verification statuses for all of your commits (vigilant mode)](https://docs.github.com/en/enterprise-cloud@latest/authentication/managing-commit-signature-verification/displaying-verification-statuses-for-all-of-your-commits)
- [Immutable releases](https://docs.github.com/en/enterprise-cloud@latest/code-security/concepts/supply-chain-security/immutable-releases)
- [Preventing changes to your releases](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/prevent-release-changes)
- [Configuring autolinks to reference external resources](https://docs.github.com/en/enterprise-cloud@latest/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/configuring-autolinks-to-reference-external-resources)
- [Linking a pull request to an issue](https://docs.github.com/en/enterprise-cloud@latest/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue)
- [Audit log events for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise)
- [About the audit log for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise)
- [Streaming the audit log for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise)
- [Feature overview for GitHub Enterprise Cloud with data residency](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency)
- [GHES: Managing rulesets for repositories in your organization](https://docs.github.com/en/enterprise-server@latest/organizations/managing-organization-settings/managing-rulesets-for-repositories-in-your-organization)
- [GHES: Immutable releases](https://docs.github.com/en/enterprise-server@latest/code-security/concepts/supply-chain-security/immutable-releases)
- [`github/ruleset-recipes`](https://github.com/github/ruleset-recipes)

### Regulatory sources

- [Sarbanes-Oxley Act §404, 15 U.S.C. §7262](https://www.govinfo.gov/content/pkg/USCODE-2023-title15/pdf/USCODE-2023-title15-chap98-subchapII-sec7262.pdf)
- [PCAOB AS 2201](https://pcaobus.org/oversight/standards/auditing-standards/details/AS2201)
- [FFIEC IT Handbook: Development, Acquisition, and Maintenance](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance)
- [NYDFS 23 NYCRR Part 500](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500)
- [OSFI Guideline B-13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management)
- [AMF Guideline on ICT Risk Management](https://lautorite.qc.ca/en/professionals/insurers/guidelines/operational-risk/guideline-on-information-and-communications-technology-risk-management)
- [CNBV Circular Única de Bancos](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf)
- [Commission Delegated Regulation (EU) 2024/1774 (DORA RTS on ICT risk management)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774)
- [PCI DSS document library](https://www.pcisecuritystandards.org/document_library/)
- [NIST SP 800-218 (SSDF)](https://csrc.nist.gov/pubs/sp/800/218/final)
