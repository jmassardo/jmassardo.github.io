---
layout: post
title: "GitHub Well-Architected for Financial Services, Part 4: Secrets Protection"
date: 2026-11-05 10:04:00 -0600
category: Blog
tags: [github, well-architected, financial-services, compliance, security, governance, secret-scanning, push-protection, devsecops]
excerpt: "Block secrets at the push, gate every bypass behind a reviewer, and treat every leak as compromised: an opinionated GitHub Secret Protection baseline for banks, insurers, and payments firms, with the evidence auditors expect."
permalink: /blog/github-waf-financial-services/secrets-protection/
---

*This post is part of the [GitHub Well-Architected for Financial Services](/blog/github-waf-financial-services/) series.*

- [Overview and Compliance Crosswalk](/blog/github-waf-financial-services/)
- [Part 1: Platform Foundation and Data Boundaries](/blog/github-waf-financial-services/platform-foundation/)
- [Part 2: Identity and Access Management](/blog/github-waf-financial-services/identity-and-access/)
- [Part 3: Source Code Management and Change Control](/blog/github-waf-financial-services/change-control/)
- **Part 4: Secrets Protection** (you are here)
- [Part 5: Code Scanning and Software Supply Chain](/blog/github-waf-financial-services/code-scanning-supply-chain/)
- [Part 6: CI/CD and GitHub Actions Hardening](/blog/github-waf-financial-services/actions-hardening/)
- [Part 7: Copilot and AI Agents](/blog/github-waf-financial-services/copilot-and-agents/)
- [The Leadership Brief](/blog/github-waf-financial-services/leadership-brief/)

> **Applicability:** mappings contribute to requirements, not certification. Follow Part 1's [deployment decision](/blog/github-waf-financial-services/platform-foundation/#choosing-your-deployment-model), [classification schema](/blog/github-waf-financial-services/platform-foundation/#data-classification-with-custom-properties), and [feature/preview controls](/blog/github-waf-financial-services/platform-foundation/#feature-availability-and-preview-controls). GHES examples use **3.22**. Preview evaluation needs permitted terms and synthetic data; risk acceptance cannot waive production restrictions.

## Leadership brief

- **The risk:** A leaked credential is the shortest path from an honest developer mistake to a reportable incident. One database password in one commit lives in every clone, fork, and backup of that repository.
- **Our position:** Block secrets at push time in every repository, require a named reviewer to approve any bypass, and treat every detected secret as compromised. Rotate first, clean history second.
- **The investment:** GitHub Secret Protection licensed for all private and internal repositories, enabled and enforced centrally from the enterprise, not repo by repo.
- **The evidence:** Reconciled coverage and bypass decisions, plus provider-confirmed revocation times joined to alert detection and exposure records. Alert closure is not containment evidence.

---

A developer hardcodes a staging connection string "just for now" and pushes it to an internal repository. Two years and 4,000 clones later, the examiner finds it. Internal means enterprise-readable, not safe for secrets.

[GitHub Secret Protection](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security) helps **block leaks before they land**. Anything that slips through needs issuer-confirmed revocation and evidence, not just alert closure. [Part 6](/blog/github-waf-financial-services/actions-hardening/) owns pipeline identity.

## The requirements

Regulations require credential protection, controlled access, incident response, and evidence, not a named GitHub setting.

| ID | Regulation and citation | What it asks for |
|---|---|---|
| US-FFIEC-INFOSEC | [FFIEC IT Examination Handbook, Information Security booklet](https://ithandbook.ffiec.gov/it-booklets/information-security) | Examiner expectations for controls protecting confidentiality, integrity, and availability, including how authentication material is protected. |
| US-GLBA-314 | [GLBA Safeguards Rule, 16 CFR Part 314](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-314) | A written, risk-based security program covering access controls, encryption, and incident response. |
| US-OCC-30-AppB | [12 CFR Part 30, Appendix B](https://www.ecfr.gov/current/title-12/chapter-I/part-30/appendix-Appendix%20B%20to%20Part%2030) | Comprehensive information security program for OCC-regulated banks, including access controls and incident response. |
| US-NYDFS-500.15 | [23 NYCRR 500.15, Encryption of Nonpublic Information](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Encryption of nonpublic information, which only works if the keys and credentials stay protected. |
| US-SEC-RegSP-2024 | [SEC Regulation S-P amendments (2024)](https://www.federalregister.gov/documents/2024/06/03/2024-11116/regulation-s-p-privacy-of-consumer-financial-information-and-safeguarding-customer-information) | Written incident-response programs for unauthorized access to customer information, with customer notification. |
| CA-OSFI-B13 | [OSFI Guideline B-13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | Risk-based technology and cyber risk management, including cybersecurity controls. |
| BR-CMN-4893 | [CMN Resolution 4,893 (Brazil)](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf) | A formal cybersecurity policy with supporting controls. |
| MX-CNBV-CUB | [CNBV Circular Única de Bancos (Mexico)](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) | Technology risk and information security provisions for banks. |
| CO-SFC-CBJ-006-2025 | [SFC Circular Básica Jurídica, CE 006 de 2025 (Colombia)](https://www.superfinanciera.gov.co/publicaciones/10115528/circular-basica-juridica-ce-00625/) | Information security and cybersecurity risk management for supervised entities. |
| CL-CMF-20-10 | [CMF RAN Capítulo 20-10 (Chile)](https://www.cmfchile.cl/portal/normativa/624/articles-29310_doc_pdf.pdf) | Baseline information security and cybersecurity management for banks. |
| PE-SBS-504 | [Resolución SBS N° 504-2021 (Peru)](https://intranet2.sbs.gob.pe/dv_int_cn/2046/v2.0/Adjuntos/504-2021.R.pdf) | Information security and cybersecurity management regulation. |
| AR-BCRA-A7724 | [BCRA Comunicación "A" 7724 (Argentina)](https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A7724.pdf) | Minimum requirements for technology and information security risk management. |
| EU-DORA-9 | [DORA Art. 9, Protection and prevention](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9) | Security tools and policies that protect the confidentiality and integrity of data at rest, in use, and in transit. |
| EU-DORA-RTS-CRYPTO | [Delegated Regulation (EU) 2024/1774, Arts. 6-7](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | Cryptographic controls and the full key-management lifecycle. |
| EU-GDPR-32 | [GDPR Art. 32, Security of processing](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679) | Risk-proportionate technical measures, plus regular testing of their effectiveness. |
| INT-PCI-6.2 | [PCI DSS v4.0.1, Req. 6.2](https://www.pcisecuritystandards.org/document_library/) | Documented secure-coding standards and review of bespoke code before release. |
| INT-NIST-SSDF | [NIST SP 800-218 (SSDF)](https://csrc.nist.gov/pubs/sp/800/218/final) | Reference practices for protecting software and the development toolchain (reference framework, not binding). |

DORA's key-management RTS and NYDFS 500.15 address broader cryptographic controls. Secret detection **contributes to** key protection; it does not implement encryption, key custody, or a full key lifecycle. Second-line compliance validates each mapping and its remaining controls.

## Deployment model differences

| Capability | GHEC (personal accounts) | GHEC with EMU | GHEC with data residency (GHE.com) | GHES 3.22 |
|---|---|---|---|---|
| **Licensing** | Paid for private and internal repos; public repos free | Same | Paid for all repos | Paid for all repos ([billing](https://docs.github.com/en/enterprise-server@3.22/billing/concepts/product-billing/github-advanced-security)) |
| **Push protection for users** | On by default, protects pushes to public repos | Managed users can't create public repos, so limited relevance | Same as EMU | Not available ("only available on GitHub.com") |
| **Partner program** | Covers public repos and npm packages | No public repos in the enterprise, so not your backstop | Same as EMU | Not applicable |
| **Public monitoring** | Available | Available | Verified-domain attribution only | No GHES documentation |
| **AI-detected secrets and AI regex generator** | Available | Available | No exception listed in the [GHE.com feature overview](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency) | No GHES 3.22 documentation |
| **Validity checks** | Available | Available | Available | Site admin must enable for the instance first ([docs](https://docs.github.com/en/enterprise-server@3.22/code-security/how-tos/secure-your-secrets/customize-leak-detection/enable-validity-checks)) |
| **User-owned repos scanned** | Public repos only (free tier) | Yes | Yes | Yes, when licensed |
| **Platform prerequisites** | None | None | None | SSSE3 CPU flag and Management Console enablement ([docs](https://docs.github.com/en/enterprise-server@3.22/code-security/how-tos/secure-at-scale/configure-enterprise-security/configure-specific-tools/configure-secret-scanning)) |

Sources: [secret scanning availability](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning) and [public monitoring](https://docs.github.com/en/code-security/concepts/secret-security/public-monitoring). **GHES shops** get the core (scanning, push protection, custom patterns, delegated bypass, validity checks) but not AI detection or public monitoring, so lean harder on custom patterns.

<a id="control-8-historical-scanning-and-your-day-zero-baseline"></a>

## Admission: historical scanning and your day-zero baseline

**Before enforcement:** run the free [secret risk assessment](https://docs.github.com/en/code-security/concepts/secret-security/secret-security-with-github) for Team/Enterprise organizations to size existing exposure and estimate preventable leaks. It is a point-in-time baseline, not proof of ongoing coverage.

Enablement [scans all Git history and branches, issues, PRs, discussions, and wikis](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning). New secret types trigger periodic rescans. Confirm every admitted repository's backfill completion and assign existing exposures under Control 7's deadlines; rollout is not a remediation grace period.

**Verify:** retain the pre-rollout assessment and per-repository `GET /repos/{owner}/{repo}/secret-scanning/scan-history` results. Correlate `secret_scanning_scan.completed` events and backfill completion to the inventory. Repeat admission checks for new organizations and transfers. This supplies the historical-exposure baseline for US-FFIEC-INFOSEC and CA-OSFI-B13.

## Control 1: License and enforce Secret Protection centrally

**What we do.** License all private/internal repositories. Enforce one **enterprise security configuration** and make it the new-repository default; repo/org owners cannot disable it.

**Why.** "Only critical repos" leaves exposure wherever credentials actually land. [WAF security configurations](https://learn.github.com/well-architected/library/application-security/recommendations/enforce-ghas-at-scale/) and [SSDF PO.3](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) support complete coverage for US-FFIEC-INFOSEC, EU-DORA-9, and CA-OSFI-B13.

**How.** GitHub Advanced Security is now sold as two products. **GitHub Secret Protection** covers secret scanning, push protection, AI-detected secrets, custom patterns, delegated bypass, and delegated alert dismissal. **GitHub Code Security** covers code scanning and supply chain ([Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/)). Billing is per [unique active committer over 90 days](https://docs.github.com/en/billing/concepts/product-billing/github-advanced-security).

In the enterprise's **Settings > Advanced Security**, [create a custom configuration](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-at-scale/configure-enterprise-security/establish-complete-coverage/create-custom-configuration) with these settings:

| Setting | Our default |
|---|---|
| Secret Protection | Enabled |
| Validity checks | Enabled |
| Extended metadata | Non-production evaluation only where agreement permits; GA owner inventory is the production baseline |
| Generic patterns | Enabled |
| Scan for AI-detected secrets | Enabled |
| Push protection | Enabled |
| Push protection for AI-detected secrets | Permitted non-production pilot only (public preview, consumes AI credits); GA detection and DLP remain |
| Bypass privileges | Specific actors (see Control 3) |
| Prevent direct alert dismissals | Enabled |
| Use as default for new repositories | All repositories |
| Enforce configuration | Enforce for repository and organization owners |

[Apply it](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-at-scale/configure-enterprise-security/establish-complete-coverage/apply-custom-configuration) to **All repositories**, including archived repositories where scanning still runs. Two gotchas:

- **Transferred repositories don't pick up the default.** Apply a configuration manually after a transfer; add that to your transfer runbook.
- **Enforcement makes REST API changes silently fail.** Per [configuration enforcement](https://docs.github.com/en/code-security/reference/security-at-scale/configuration-enforcement), the call "will appear to succeed, but no enablement statuses will change." Great for control integrity. Confusing at 2 a.m.

**Verify.** Export the **Coverage** view in [security overview](https://docs.github.com/en/code-security/concepts/security-at-scale/security-overview) [to CSV](https://docs.github.com/en/code-security/how-tos/view-and-interpret-data/analyze-organization-data/export-data) monthly. Alert on `business_secret_scanning.disable`, `repository_secret_scanning.disable`, and `repository_secret_scanning_push_protection.disable` from the [enterprise audit log events](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise). Any of those outside an approved change is an incident, not a curiosity.

Reconcile configuration attachment and backfill completion to a **paginated enterprise repository inventory**, including transfers and archived repositories. The target is 100% of in-scope repositories, not just those visible to one security-manager account. Missing organizations, permissions, classification or configuration are failed coverage, not zero findings.

## Control 2: Push protection everywhere

**What we do.** Push protection is on for every repository, generic patterns included. Developers on personal-account GHEC keep **push protection for users** on. Every block message links to an internal "what to do now" page.

**Why.** Post-commit detection starts after copying has begun. Organization-wide blocking contributes to EU-DORA-9, EU-DORA-RTS-CRYPTO, US-NYDFS-500.15, INT-PCI-6.2, and [SSDF PW.5](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/).

**How.** [Push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection) blocks four categories of secrets:

1. **Partner patterns** (provider-issued tokens like cloud keys)
2. **Generic patterns** (private keys, connection strings), once [generic pattern scanning](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enabling-secret-scanning-for-generic-patterns) is enabled
3. **Custom patterns** you define (Control 5)
4. **AI-detected generic secrets** such as passwords (public preview)

Supported push surfaces include command-line pushes, web UI commits, file uploads, and REST API requests, with coverage varying by secret type. Then tune under **Global settings**, per [configuring global settings](https://docs.github.com/en/code-security/how-tos/secure-at-scale/configure-organization-security/establish-complete-coverage/configure-global-settings):

- **Resource link for blocked commits:** point it at your runbook (remove the secret, request a bypass, who to call).
- **Pattern configurations** (public preview): evaluate only where permitted by the applicable agreement. GA supported provider/custom pattern blocking and reviewed DLP policies are the production alternatives.

**Push protection for AI-detected secrets** may detect passwords without fixed token formats. Per the [enablement docs](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/prevent-future-leaks/enable-ai-push-protection), it is public preview and consumes **Secret Protection AI credits** on every scanned push. Use synthetic data in a permitted non-production pilot with a hard budget. GA patterns and institution-owned DLP/detective scans remain the production baseline, including when credits run out. Have legal and model-risk owners review the [AI features application card](https://docs.github.com/en/code-security/responsible-use/security-and-quality-ai-features).

**Push protection for users** is [developer-managed](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/prevent-future-leaks/manage-user-push-protection), on by default, and blocks supported secrets in *any* public repository. Personal-account onboarding must confirm it is on, including for weekend side projects.

**Verify.** Check the Coverage view in security overview for push protection enablement. Watch for `secret_scanning_push_protection.disable` and `*_push_protection_pattern_configuration.updated` events. Derive production bypass metrics from GA alert/audit exports. The [push protection metrics](https://docs.github.com/en/code-security/how-tos/view-and-interpret-data/analyze-organization-data/viewing-metrics-for-secret-scanning-push-protection) preview dashboard is supplemental only, where permitted.

## Control 3: Delegated bypass and delegated dismissal (yes, turn them on)

**What we do.** Delegated bypass is **on** for every repository. A named reviewer group approves or denies every bypass request. Exemptions are limited to migration bots and similar automation with a documented business case. Delegated alert dismissal is also on, so closing an alert as "false positive" or "won't fix" takes a second person.

**Why.** Default write access permits self-attested bypass. [Delegated review](https://learn.github.com/well-architected/library/application-security/recommendations/enforce-ghas-at-scale/) supplies independent decisions for US-FFIEC-INFOSEC, EU-DORA-9, and US-OCC-30-AppB. Tune new patterns through reviewed exceptions, not unrestricted developer bypass.

**How.** In the security configuration, set **Bypass privileges** to **Specific actors**, following [enabling delegated bypass](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/manage-bypass-requests/enable-delegated-bypass). Our recommended setup:

- **Reviewers:** central AppSec plus trained security champions per business unit, via a custom role with the "review and manage secret scanning bypass requests" permission (not org owner).
- **Exemptions:** trusted automation only. The docs warn exemptions "may lead to leaked secrets." Each one needs a ticket and an owner.

Require an approver independent of requester/author. Verify role and delegated-review availability; preview/unavailable features need GA security-manager review, independently approved tickets, and reconciliation.

**Privilege gap:** reviewers may themselves bypass. Separate review duties from application contribution. Require an independent ticket decision for reviewer-originated pushes, alert on actual bypass, and fail reconciliation for absent/self-approved decisions. Implement and test this supplement; delegated settings alone cannot prove it.

Per [bypass requests](https://docs.github.com/en/code-security/concepts/secret-security/bypass-requests), reviewers see the requester, repository, commit hash, timestamp, and file path. Requests **expire after 7 days**; we set an internal SLA of one business day. A GitHub App with the bypass-request permission can also automate first-pass review.

For dismissals, enable **Prevent direct alert dismissals** ([delegated alert dismissal](https://docs.github.com/en/code-security/how-tos/manage-security-alerts/manage-secret-scanning-alerts/enable-delegated-dismissal)). Dismissal requests also expire after a week, so staff the reviewer bench before you flip it on.

**Verify.** These audit log events are your exception register:

| Event | What it proves |
|---|---|
| `secret_scanning_push_protection_request.request` / `.approve` / `.deny` | Every bypass had a request and a decision |
| `secret_scanning_push_protection.bypass` | A bypass occurred (should always trace to an approval or an exempt actor) |
| `secret_scanning_closure_request.approve` / `.deny` | Dismissals were reviewed by someone else |
| `org_secret_scanning_push_protection_bypass_list.add` / `.remove` | Who changed the reviewer and exemption list |

Reconcile monthly: every `bypass` event should map to an approved request or a documented exempt actor. Catch the orphans before the auditor does.

## Control 4: Close the escape hatch in `secret_scanning.yml`

**What we do.** Block changes to `.github/secret_scanning.yml` across all repos with an org push ruleset. Path exclusions go through the security team.

**Why.** Anyone with write access can add that file and use `paths-ignore` to [exclude directories](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/customize-leak-detection/exclude-folders-and-files) from scanning *and* push protection. Matching alerts close as "ignored by configuration" and don't even fire alert webhooks. That's a quiet off switch for your control. WAF's [enforce GHAS at scale](https://learn.github.com/well-architected/library/application-security/recommendations/enforce-ghas-at-scale/) recommends exactly this push ruleset.

**How.** [Push rulesets](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) apply to private and internal repositories and their whole fork network. Create one via the [organization rulesets API](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/rules):

```json
{
  "name": "protect-secret-scanning-config",
  "target": "push",
  "enforcement": "active",
  "conditions": {
    "repository_name": { "include": ["~ALL"], "exclude": [] }
  },
  "bypass_actors": [
    { "actor_id": 1234567, "actor_type": "Team", "bypass_mode": "always" }
  ],
  "rules": [
    {
      "type": "file_path_restriction",
      "parameters": {
        "restricted_file_paths": [".github/secret_scanning.yml"]
      }
    }
  ]
}
```

**Template prerequisite:** replace `actor_id` with a dedicated AppSec **JIT push-exception team**, empty by default. Apply [Part 3's push-exception lifecycle](/blog/github-waf-financial-services/change-control/#push-rulesets-guard-the-files-that-guard-everything-else), not standing AppSec membership or branch-only `pull_request` mode. This placeholder is not deployable verbatim.

An independent security/control owner approves the **exact exclusion, repository, and revision** in ITSM. Prefer independently approved delegated requests; if JIT elevation is necessary, cap membership at **60 minutes** with automatic expiry. Retain reason, exact diff, expiry/revalidation date, code-owner review, and every elevated push. Fail reconciliation on out-of-scope use or self-approval. Push permission never replaces branch review or central eligibility checks.

**Verify.** Enumerate organizations/repositories and ruleset detail pages with pagination; confirm active enforcement and approved bypass actors. Fetch `.github/secret_scanning.yml` from each relevant branch/ref, including fork roots and historical changes, instead of using capped code search as a population. Reconcile every exclusion and protected-file push to its independent approval and JIT/delegated decision. Alert on membership surviving expiry.

## Control 5: Teach it your secrets with custom patterns

**What we do.** Define enterprise-level custom patterns for every **internally issued credential format** (service tokens, API gateway keys, internal signing key IDs). Push protection is on for each one once it passes a dry run. For **regulated data formats** like internal account numbers, we define alert-only patterns as a backstop to DLP, not a replacement for it.

**Why.** Partner patterns know cloud providers. They have no idea what your core banking platform's tokens look like. Custom patterns close that gap for EU-DORA-RTS-CRYPTO, US-GLBA-314, and US-NYDFS-500.15. Catching account numbers in code also supports EU-GDPR-32.

**How.** [Custom patterns](https://docs.github.com/en/code-security/concepts/secret-security/custom-patterns) are regexes defined at enterprise, org, or repo level. Rules of the road from the [reference](https://docs.github.com/en/code-security/reference/secret-security/custom-patterns):

- **Hyperscan, not full PCRE.** A subset of PCRE syntax, no option modifiers. Keep it simple and use the before/after/must-match fields instead of one monster regex.
- **Limits:** 500 patterns per org or enterprise, 100 per repo.
- **Always dry run** (up to 1,000 sample results). Push protection can only be enabled after publishing.

Once published, a pattern scans the **entire Git history on all branches** ([defining custom patterns](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/customize-leak-detection/define-custom-patterns)), so your first publish doubles as a historical audit. Org-level patterns can live as code via the [custom patterns REST API](https://docs.github.com/en/rest/secret-scanning/custom-patterns) (bulk create, up to 100 per call). Two illustrative patterns for a fictional bank:

```json
{
  "patterns": [
    {
      "name": "Acme internal service token",
      "pattern": "acmesvc_[A-Za-z0-9]{40}"
    },
    {
      "name": "Acme deposit account number (labeled)",
      "pattern": "[0-9]{12}",
      "start_delimiter": "acct_no[\"']?[ ]*[:=][ ]*[\"']?",
      "must_not_match": ["^0{12}$", "^9999"]
    }
  ]
}
```

```bash
gh api -X POST "/orgs/$ORG/secret-scanning/custom-patterns" --input patterns.json
```

- **Token pattern:** fixed prefix and length simplify detection. Ask issuers to prefix unstructured tokens.
- **Account number pattern:** require a label; a bare 12-digit regex matches timestamps too. Keep it **alert-only** to avoid disruptive blocking.
- **Card numbers (PANs):** regex can't run a Luhn check. Use a labeled, alert-only pattern at most, and keep your PCI DSS DLP tooling as the primary control. Any suspected PAN opens the PCI scope procedure below; a pattern match alone does not establish the tenant's scope.

Dry run every regex in the UI before enabling push protection. The [AI regex generator](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/customize-leak-detection/generating-regular-expressions-for-custom-patterns-with-ai) proposes up to three candidates from a plain-language description, no Copilot subscription required. Review its output like any other code.

**Generic and AI-detected secrets.** Enable [generic patterns](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enabling-secret-scanning-for-generic-patterns) for private keys and connection strings, and [AI-detected secrets](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enabling-secret-scanning-for-ai-detected-secrets) for unstructured passwords (separate alert list, no Copilot subscription needed). Until you've measured their precision, give them a longer triage SLA than provider patterns (Control 7).

**Verify.** Audit events `business_secret_scanning_custom_pattern.publish` / `.update` / `.delete` and `*_custom_pattern_push_protection.enabled` / `.disabled` show who changed detection logic. Keep the pattern JSON in a repo with CODEOWNERS, and review it quarterly against current token formats.

## Control 6: Validity checks, partner revocation, and public monitoring

**What we do.** Enable supported GA validity checks and public monitoring for GHEC enterprises. Maintain a GA credential-owner inventory; extended metadata is supplemental preview only where permitted. The partner program is a backstop, not proof of revocation.

**Why.** [WAF prioritization](https://learn.github.com/well-architected/library/application-security/recommendations/prioritizing-alerts/) puts active secrets first, unknown next, and confirmed-inactive last. This supports US-SEC-RegSP-2024 and US-GLBA-314 without treating 3,000 alerts equally.

**How.**

- **[Validity checks](https://docs.github.com/en/code-security/concepts/secret-security/validity-checks)** periodically test the secret with its issuer and label the alert `active`, `inactive`, or `unknown`, typically using least-intrusive GET requests. Obtain legal/privacy approval for the data flow and endpoint, including any host/URL context sent with the token. Unsupported or unknown validity is not evidence of inactivity.
- **Extended metadata** (public preview) adds owner and scope details where the provider shares them, which shortens the "whose key is this?" hunt.
- **[Partner program](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning-for-partners):** when a partner-pattern secret appears in a *public* repository or npm package, GitHub notifies the provider, who may revoke it. GitHub also revokes its own PATs leaked publicly. For a GitHub PAT leaked in a private repo, you can click **Report leak** on the alert. On EMU and GHE.com, your enterprise code can't be public, so this mostly protects you from leaks *outside* your enterprise.
- **[Public monitoring](https://docs.github.com/en/code-security/concepts/secret-security/public-monitoring)** fills that outside gap. It attributes secrets found in any public repo on GitHub to your enterprise, by membership or by verified domain. Alerts land in enterprise-level security overview. [Enable it](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-at-scale/configure-enterprise-security/manage-your-coverage/enabling-public-monitoring-for-your-enterprise) under enterprise **Settings > Advanced Security**. On GHE.com, configure a verified domain, because it's your only attribution method there.

**Verify.** Audit events `*_secret_scanning_automatic_validity_checks.enabled` / `.disabled` and `*_secret_scanning_extended_metadata.*` prove the settings stayed on. The public monitoring alerts API (`GET /enterprises/{enterprise}/secret-scanning/public-monitoring-alerts`, in the [enterprise secret scanning REST docs](https://docs.github.com/en/enterprise-cloud@latest/rest/secret-scanning/secret-scanning)) gives you a monthly export.

## Control 7: Triage SLAs and the remediation workflow

**What we do.** Every alert gets a severity, owner and deadline. **Revoke the old credential first, then decide about history.** Creating a replacement or closing an alert does not prove the exposed credential stopped working.

**Why.** Auditors need proof that actual containment met policy. The matrix maps this incident lifecycle to applicable US, EU, and LATAM requirements; alert closure cannot substitute for issuer evidence.

### Our default SLAs

These are **our starting numbers**, not regulatory figures. Calibrate them with your incident response and compliance teams.

| Alert condition | Severity | Containment or triage deadline | Administrative closure deadline |
|---|---|---|---|
| `validity: active`, or publicly leaked (`is_publicly_leaked` API filter) | Critical | Provider-confirmed old credential revocation within 4 elapsed hours | 2 business days |
| Provider or custom pattern, `validity: unknown` | High | 1 business day | 5 business days |
| Approved push protection bypass (`is_bypassed`) | High | Review within 1 business day | Per the type above |
| Generic pattern or AI-detected | Medium | Triage within 3 business days | 10 business days |
| `validity: inactive` | Low | Confirm with owner | 30 days |

Bump severity one level (capped at Critical) for PCI/SOX or high-risk exposure using governance-owned `compliance-frameworks`, `data-classification`, and `business-criticality`. Missing classification uses the restrictive tier. Apply that tier's deadline.

Internal containment/triage starts at detection (`created_at` for a GitHub alert, or an earlier credible detection). Business-day deadlines use the institution's calendar/time zone. A record becomes overdue when current time exceeds its deadline; **exactly four hours is at the Critical boundary**, not overdue, and four hours plus one second is overdue. Legal notification uses separate triggers below, never this SLA clock.

Where conditions overlap, the highest severity and shortest applicable deadline win. An active production password does not get a three-day generic-pattern delay.

<a id="the-workflow"></a>

### Containment and issuer-confirmed revocation

Adapt GitHub's [leaked-secret procedure](https://docs.github.com/en/code-security/tutorials/remediate-leaked-secrets/remediating-a-leaked-secret):

1. **Record detection and exposure separately**, assign the credential owner, and immediately engage incident response/legal for reportability assessment. Use sanitized metadata and owner inventories; do not copy the secret into a ticket or evidence export.
2. **Rotate and revoke the old credential.** If downtime is a real concern, issue a replacement, cut over, then revoke the exposed credential within the deadline. Record replacement/cutover and provider-effective revocation separately.
3. **Find every consumer:** org code search, repo and org secrets, deploy keys, installed apps.
4. **Check for misuse** in GitHub and provider logs over the entire known exposure window, not only since detection. A credential leak merits immediate incident assessment; reportability depends on each law's trigger, not just confirmed exploitation.
5. **Decide on history** (below).
6. **Verify containment before closure.** Require provider confirmation with an effective revocation timestamp or a fresh, post-remediation `inactive` validity result where supported. A previously cached inactive value, owner assertion, unknown result or `resolution: revoked` is insufficient. If only inactivity is proven, record verification time as an upper bound, not an invented exact revocation time.
7. **Close as `revoked`** only after retaining that evidence and independent review, with a sanitized ticket link in the [alert timeline](https://docs.github.com/en/code-security/how-tos/manage-security-alerts/manage-secret-scanning-alerts/resolving-alerts). False positives/test data need distinct approved decisions and cannot inflate containment success.

<a id="separate-detection-exposure-containment-and-closure"></a>

### Timestamps and incident-response handoff

Incident command takes immediate ownership of potential misuse; legal/privacy and regulatory reporting assess reportability using the [separate clock reference](#incident-determination-and-notification-clocks). Detection starts internal triage, not every legal clock.

The institution-owned incident register must join all alerts, open or resolved, to these fields:

| Field | Evidence and use |
|---|---|
| `first_exposure_at` and confidence | Earliest known secret-bearing commit date and first server push where available, or issue/log/prompt creation time. Commit dates are not trusted proof of first exposure. Keep the source and any uncertainty; unknown is not zero. |
| `detected_at` | Earliest credible detection; GitHub `created_at` records alert creation, not the original exposure. |
| `rotated_at`, `revoked_at`, `verified_inactive_at` | Replacement time, provider-effective old credential revocation, and fresh inactivity verification with issuer/validation evidence. These are different events. |
| `resolved_at` | Administrative alert closure only. |
| Severity, deadline, owner and legal clock events | Governed tier, calendar version, determinations/awareness, reporting deadlines and receipts. |

Report **detection latency** (`detected_at - first_exposure_at`), **containment latency** (`revoked_at - detected_at`), **total exposure** (`revoked_at - first_exposure_at`), and **administrative closure time** separately. With only inactivity verification, label the durations as upper bounds. Open/unverified alerts remain overdue or age to the reporting cutoff; do not drop them.

For example, a credential committed in 2024, detected at 10:00 today and confirmed revoked at 13:00 has three-hour containment latency but roughly two years of known exposure. Closing its alert tomorrow changes neither measurement.

## History cleanup and PAN scope events

### Should you rewrite history?

Rotation neutralizes a credential. Rewriting history doesn't, because every clone and fork keeps its copy. The [removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) page lists the side effects, including broken PR diffs and **stripped commit signatures** (awkward after [Part 3](/blog/github-waf-financial-services/change-control/)). GitHub Support only helps "in cases where we determine that the risk can't be mitigated by rotating affected credentials." Our rule:

- **Rotatable secret, now revoked:** don't rewrite by default. Document the decision on the alert.
- **Non-rotatable data** (account numbers, customer PII, card data): rewrite with `git-filter-repo --sensitive-data-removal`, engage GitHub Support, and treat it as a potential privacy incident.

### PAN findings are PCI scope events

The **PCI program owner**, with the QSA as appropriate, validates suspected PANs and determines scope using [PCI DSS scoping requirements](https://www.pcisecuritystandards.org/document_library/). Do not automatically declare the entire GitHub tenant in scope.

1. Restrict access and preserve minimal, controlled incident evidence. Assess affected repositories, clones/forks, backups, CI runners/logs/artifacts, integrations and connected systems against actual storage/processing/transmission and security-impacting access.
2. Document data flows, segmentation, provider responsibilities and any scope expansion or justified exclusions. Prevent additional copying; route privacy/reporting assessment through the [legal clock register](#incident-determination-and-notification-clocks).
3. Remove confirmed cardholder data under an approved cleanup plan. Coordinate clone/fork cleanup and request **GitHub Support removal of cached views and PR references** where eligible. A force push alone does not purge them.
4. Re-scan and validate cleanup, record support receipts and residual copies, and update the PCI inventory, assessment and DLP controls. The PCI owner signs off scope and closure.

## Burn down the backlog

Use [security campaigns](https://docs.github.com/en/code-security/concepts/security-at-scale/about-security-campaigns) to group alerts, assign owners, and set deadlines. WAF suggests targeting all valid provider-pattern secret alerts within 30 days, a solid first campaign. Campaigns are GHEC-only per WAF, so GHES shops need issue-based tracking.

**Verify.** Pull data with the [secret scanning REST API](https://docs.github.com/en/rest/secret-scanning/secret-scanning), always with `hide_secret=true`. The last place you want a live credential is your evidence folder.

```bash
# Read-only alert metadata extract, NOT a containment-SLA report.
set -euo pipefail
: "${ORG:?Set ORG}"
gh api -X GET "/orgs/$ORG/secret-scanning/alerts" \
  -F hide_secret=true -F per_page=100 --paginate \
  --jq '.[] | [.number, .repository.full_name, .secret_type, .validity,
               .resolution, .created_at, .resolved_at] | @csv'

# Open critical alerts right now
gh api -X GET "/orgs/$ORG/secret-scanning/alerts" \
  -f state=open -f validity=active -F hide_secret=true --paginate \
  --jq '.[] | [.number, .repository.full_name, .secret_type, .created_at] | @csv'
```

The enterprise endpoint (`GET /enterprises/{enterprise}/secret-scanning/alerts`) supports similar filters but only returns authorized organizations. Reconcile the caller's scope to the inventory, including managed-user repositories where applicable. The API's default secret-type population may omit generic patterns; request supported generic token names explicitly and collect AI-detected alerts through their documented surface. Record any API/export gap, not a fictitious complete population.

Join these sanitized metadata extracts to the institutional incident register and provider evidence. This post does **not** implement that integration. Monthly reporting includes all open/closed alerts, confirmed containment, unknown revocation/exposure, overdue triage by actual tier/calendar, and notification compliance. Fail and alert for API/permission failures, missing pages or unmatched incidents; an empty extract requires an independently validated zero population.

<a id="control-9-fewer-secrets-to-leak-oidc-and-scoped-platform-secrets"></a>

## Control 8: Fewer secrets to leak (OIDC and scoped platform secrets)

**What we do.** The best secret is the one that doesn't exist. Cloud deployments use **Actions OIDC** instead of stored keys. The secrets that remain are scoped as narrowly as GitHub allows, with production credentials behind environment protection.

**Why.** Fewer long-lived credentials reduce exposure for EU-DORA-RTS-CRYPTO and US-NYDFS-500.15. WAF recommends [managed secrets/rotation](https://learn.github.com/well-architected/library/application-security/checklist/) and [OIDC/short-lived credentials](https://learn.github.com/well-architected/library/application-security/recommendations/securing-developer-workspace/).

**How.** Use [Part 6's OIDC implementation](/blog/github-waf-financial-services/actions-hardening/#control-3-oidc-to-cloud-providers-not-stored-credentials) to remove standing cloud keys. Keep the remaining stores distinct:

- **[Actions secrets](https://docs.github.com/en/actions/concepts/security/secrets):** scope org secrets to **selected** repositories, never `all`. Put production credentials in **environment secrets** with required reviewers. Prefer GitHub Apps over PATs for automation.
- **[Dependabot secrets](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/configure-access-to-private-registries)** are a separate store; Dependabot-triggered workflows see only those, never Actions secrets ([Dependabot on Actions](https://docs.github.com/en/code-security/reference/supply-chain-security/troubleshoot-dependabot/dependabot-on-actions)). Keep them read-only registry credentials.
- **[Codespaces secrets](https://docs.github.com/en/codespaces/managing-codespaces-for-your-organization/managing-development-environment-secrets-for-your-repository-or-organization)** also use org access policies. Scope them tightly, non-production credentials only.

**Verify.** Inventory secret scoping and age quarterly with the GitHub CLI:

```bash
for app in actions dependabot codespaces; do
  gh secret list --org "$ORG" --app "$app" \
    --json name,visibility,numSelectedRepos,updatedAt
done
```

Flag any org secret with `visibility: all` or an `updatedAt` older than your rotation standard. The [Actions secrets REST API](https://docs.github.com/en/rest/actions/secrets) exposes the same fields. Track stored cloud credentials over time; the count should fall as OIDC adoption rises.

<a id="control-10-secrets-outside-repository-history"></a>

## Control 9: Secrets outside repository history

GitHub's [documented scanning surfaces](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning) include Git history, issues, PRs, discussions and wikis. Do **not** infer full coverage of runtime outputs, workspaces or AI sessions.

| Surface | Production coverage / institution-owned prerequisite |
|---|---|
| Actions logs and artifacts | Secret masking is not comprehensive detection. Avoid echoing credentials, use synthetic negative tests for transformations/masking failures, and deploy approved detective scans of retained logs/artifacts. Restrict download and archive access. See [secure use of Actions](https://docs.github.com/en/actions/reference/security/secure-use). |
| Codespaces and runner workspaces/caches | Non-production credentials only; approved endpoint/workspace scanning and DLP, cleanup on teardown and cache expiry, least-privilege secret distribution. Confirm coverage with platform owners. |
| Copilot prompts, session logs and transcripts | No credentials/customer data in prompts; institution-approved endpoint DLP and available session/telemetry scanning. Restrict log visibility and collection. Record UI-only/export or agent-path gaps and privacy constraints rather than claiming repository scanning covers them. |
| Clones, forks, mirrors and evidence/SIEM archives | Owner-managed DLP/detective scanning and classified access boundaries. Sanitized metadata in ordinary evidence; raw secret-bearing evidence only in a separately authorized incident vault. Account for every copy in containment and purge decisions. |

AppSec maintains a coverage register with **surface, owner, detector, cadence, retention, last negative test, gap and target date**. Missing coverage needs a tested GA alternative or named, time-limited second-line risk acceptance that cannot waive legal/contractual obligations. Validate detection with synthetic canaries, not live credentials. A secret on any surface uses the same provider-verification and incident-clock process.

<a id="incident-determination-and-notification-clocks"></a>

## Reference: incident determination and notification clocks

This reference supports the **institutional incident-response runbook**, not the secret-triage SLA. Incident command coordinates immediate assessment. Legal/privacy and regulatory reporting decide applicability and record each trigger, deadline, basis, and submission receipt in UTC. Preserve detection even when it precedes awareness or determination; never wait for weekly review to start a legal clock.

| Regime | Exact trigger and required clock |
|---|---|
| [NYDFS 500.1(g), 500.17(a)](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Notify as promptly as possible, no later than **72 hours after determining** a cybersecurity incident occurred at the entity, affiliate or third-party service provider. The definition covers an event impacting the entity and requiring government/self-regulatory/supervisory notice, likely material harm to a material part of normal operations, or ransomware in a material part of information systems. Detection of every secret is not this determination. Maintain ongoing updates. |
| [GDPR Art. 33(1)-(2), Art. 34](https://eur-lex.europa.eu/eli/reg/2016/679/oj) | Controller notifies the supervisory authority without undue delay and, where feasible, within **72 hours of awareness of a personal data breach**, unless unlikely to risk individuals' rights/freedoms; explain delay and permit phased information. Processor informs controller without undue delay. High-risk breaches require communication to data subjects without undue delay, subject to Art. 34 exceptions. |
| [DORA 2025/301 Art. 5](https://eur-lex.europa.eu/eli/reg_del/2025/301/oj), [classification RTS 2024/1772](https://eur-lex.europa.eu/eli/reg_del/2024/1772/oj) | Major ICT incident initial notification as early as possible, within **four hours of major classification** and no later than **24 hours from awareness of the ICT incident**. If classified major after those 24 hours, notify within four hours of classification. Intermediate within 72 hours of initial notification, updated on recovery; final within one month of intermediate/latest updated intermediate. Apply entity-specific weekend/holiday rules only where Art. 5 permits. |
| [SEC Regulation S-P, 17 CFR 248.30(a)(4)-(5)](https://www.govinfo.gov/content/pkg/FR-2024-06-03/html/2024-11116.htm) | Covered institution notifies affected individuals as soon as practicable, no later than **30 days after awareness that unauthorized access to/use of customer information occurred or is reasonably likely**. A documented reasonable investigation may establish no substantial harm/inconvenience is reasonably likely; only specified Attorney General procedures permit delay. Service-provider procedures require notice to the institution as soon as possible, within 72 hours of provider awareness of a security breach resulting in unauthorized access to a customer information system it maintains. |
| [FTC Safeguards Rule 314.4(j)](https://www.ftc.gov/business-guidance/blog/2024/05/safeguards-rule-notification-requirement-now-effect) | For FTC-covered financial institutions, notify FTC as soon as possible, within **30 days of discovery** of a notification event involving at least 500 consumers: unauthorized acquisition of unencrypted customer information, with access presumed acquisition absent reliable contrary evidence. Compromised encryption keys make information unencrypted for this purpose. This is not a universal bank/GLBA clock. |

Legal must add applicable prudential, national, state, and contractual notifications, validate entity-specific applicability, and test the register. **A four-hour containment SLA never replaces a notification deadline.**

## Control matrix

Every row **contributes to** its cited requirements, not complete satisfaction. Second-line compliance validates applicability and companion controls before audit/examiner reliance. In particular, scanning does not satisfy NYDFS encryption or DORA key-management obligations.

| Control | Contributes to requirement IDs | GitHub feature / institutional control | Evidence | Cadence |
|---|---|---|---|---|
| Historical admission baseline | US-FFIEC-INFOSEC, CA-OSFI-B13 | Secret risk assessment, scan history API | Pre-rollout report; `secret_scanning_scan.completed` events | Before rollout; new orgs/transfers |
| Central licensing and enforcement | US-FFIEC-INFOSEC, EU-DORA-9, CA-OSFI-B13 | Enterprise security configuration (enforced) | Coverage CSV export; `*_secret_scanning.disable` audit alerts | Monthly; real-time alerting |
| Push protection everywhere | EU-DORA-9, EU-DORA-RTS-CRYPTO, US-NYDFS-500.15, INT-PCI-6.2, INT-NIST-SSDF | GA supported provider/generic/custom patterns; DLP | Reconciled coverage; GA audit/alert exports; `*_push_protection.disable` events | Monthly |
| Governed bypass and dismissal | US-FFIEC-INFOSEC, US-OCC-30-AppB, EU-DORA-9 | Delegated bypass, delegated alert dismissal | `secret_scanning_push_protection_request.*`, `.bypass`, `secret_scanning_closure_request.*` events | Monthly reconciliation |
| Exclusion file lockdown | US-FFIEC-INFOSEC, EU-DORA-9 | Active push ruleset; independent delegated/JIT exception and branch review | Paginated config inventory; approved diff, bypass and automatic-expiry reconciliation | Daily exceptions, quarterly validation |
| Custom patterns for internal secrets and data formats | EU-DORA-RTS-CRYPTO, US-GLBA-314, US-NYDFS-500.15, EU-GDPR-32 | GA custom patterns and DLP; permitted AI features supplemental only | Pattern JSON, approval and dry-run evidence; `*_custom_pattern.*` events | Quarterly review |
| Validity, partner, and public monitoring | US-GLBA-314, US-SEC-RegSP-2024, EU-DORA-9 | GA validity checks, owner inventory, partner/public monitoring | Fresh inactivity or provider revocation confirmation; public monitoring export | Per incident, monthly |
| Triage SLAs and remediation | US-SEC-RegSP-2024, US-GLBA-314, US-OCC-30-AppB, EU-DORA-9, BR-CMN-4893, MX-CNBV-CUB, CO-SFC-CBJ-006-2025, CL-CMF-20-10, PE-SBS-504, AR-BCRA-A7724 | Alert API plus institution-owned incident/provider register | Separate exposure, detection, confirmed containment and closure metrics; open/unverified breaches included | Monthly to risk committee |
| Legal notification | US-SEC-RegSP-2024, US-GLBA-314, EU-GDPR-32; NYDFS 500.17, GDPR 33-34 and DORA 19/2025/301 where applicable | Institutional legal/incident clock register | Exact trigger decisions, deadlines, notification receipts or justified non-reportability | Immediate assessment, ongoing updates |
| PAN scope and cleanup | INT-PCI-6.2; PCI DSS scope/12.5.2 where applicable | PCI owner/QSA, DLP, approved purge process | Scope/data-flow assessment, clone/fork cleanup, Support purge receipts and revalidation | Every PAN event |
| Credential minimization and scoping | EU-DORA-RTS-CRYPTO, US-NYDFS-500.15, INT-NIST-SSDF | Actions OIDC, environment secrets, scoped org secrets | `gh secret list` inventory; count of stored cloud credentials | Quarterly |
| Secrets outside repositories | US-FFIEC-INFOSEC, US-GLBA-314, EU-DORA-9, EU-GDPR-32 | Institution-owned log/artifact/workspace/session detection and DLP | Surface coverage register, synthetic-canary tests, approved gaps | Defined by surface, quarterly gap review |
| Evidence integrity and retention | NYDFS 500.6 and PCI 10.5.1 where applicable | Independent immutable archive and population reconciler | Sanitized manifests/hashes, access/retention policy, receipts, complete capture report | Continuous capture, monthly reconciliation |

Apply [Part 1's evidence retention and integrity standard](/blog/github-waf-financial-services/platform-foundation/#evidence-retention-and-integrity) to the reconciled alert, bypass, incident, and issuer-confirmation population. **Secret values never belong in the routine audit archive.**

## Summary and key takeaways

Blocking is the first layer. Staff independent reviewers, prove old credentials stopped working, and reconcile the evidence. A history rewrite is not revocation.

**Your checklist:**

- [ ] License GitHub Secret Protection for all private and internal repositories.
- [ ] Run the pre-rollout risk assessment and verify every repository's historical backfill before admission.
- [ ] Create one enterprise security configuration, apply it to all repos, set it as the default, and enforce it for repo and org owners.
- [ ] Turn on push protection with generic patterns; add a resource link to your internal runbook.
- [ ] Evaluate preview features with synthetic data only where the applicable agreement permits; keep GA alternatives in production.
- [ ] Enable delegated bypass with a staffed reviewer group and a one-business-day SLA; keep exemptions rare and ticketed.
- [ ] Enable delegated alert dismissal.
- [ ] Block `.github/secret_scanning.yml` with an org push ruleset.
- [ ] Publish custom patterns for internal token formats (push protection on) and labeled account-number formats (alert-only).
- [ ] Enable supported validity checks and (on GHEC) public monitoring; maintain credential-owner inventory.
- [ ] Measure provider-confirmed revocation separately from detection, exposure and alert closure. Require fresh verification before `revoked` closure.
- [ ] Have legal validate and exercise regime-specific notification clocks; give every PAN finding to the PCI owner for scope assessment.
- [ ] Move cloud deployments to OIDC; scope org secrets to selected repos; put production credentials behind environments.
- [ ] Build the institution-owned incident/provider evidence join and tier/calendar SLA report, including open and unverified records.
- [ ] Reconcile paginated coverage/bypass populations into an immutable controlled archive.
- [ ] Document detection coverage or approved gaps for logs, artifacts, workspaces, Copilot sessions and external copies.

**Start here:** run the free secret risk assessment this week. The number it produces will make every other conversation on this list easier.

Previously: [Part 3: Source Code Management and Change Control](/blog/github-waf-financial-services/change-control/). Next up: [Part 5: Code Scanning and Software Supply Chain](/blog/github-waf-financial-services/code-scanning-supply-chain/), where we apply the same enforce-centrally, verify-continuously approach to vulnerabilities in your code and dependencies.

## References

**Verification date:** November 6, 2026 for push-bypass modes, validity-check limitations, alert API filters, pre-release terms, and the cited retention/notification/scoping provisions. Recheck feature availability and entity-specific legal obligations before implementation.

Sources are linked in [The requirements](#the-requirements), the [notification-clock reference](#incident-determination-and-notification-clocks), and beside each procedure. Further reading:

- [Delegated bypass for push protection](https://docs.github.com/en/code-security/concepts/secret-security/delegated-bypass)
- [Push-ruleset bypass mode schema](https://docs.github.com/en/rest/orgs/rules#create-an-organization-repository-ruleset) (generic lifecycle owned by Part 3)
- [GitHub Pre-release License Terms](https://docs.github.com/en/site-policy/github-terms/github-pre-release-license-terms)
- [OpenID Connect](https://docs.github.com/en/actions/concepts/security/openid-connect)
