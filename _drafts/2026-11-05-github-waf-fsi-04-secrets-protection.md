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

> **A friendly note:** This information is meant to be guidance to help navigate a complex topic. Please validate these patterns with your compliance and/or regulatory reporting team(s).

## Leadership brief

- **The risk:** A leaked credential is the shortest path from an honest developer mistake to a reportable incident. One database password in one commit lives in every clone, fork, and backup of that repository.
- **Our position:** Block secrets at push time in every repository, require a named reviewer to approve any bypass, and treat every detected secret as compromised. Rotate first, clean history second.
- **The investment:** GitHub Secret Protection licensed for all private and internal repositories, enabled and enforced centrally from the enterprise, not repo by repo.
- **The evidence:** Coverage from security overview, bypass approvals in the audit log, and alert exports that show time-to-revoke against a written SLA.

---

Picture the exam finding nobody wants to read: *"Credentials for production systems were identified in source code repositories accessible to a broad population of staff."* Nobody did anything malicious. A developer tested a reconciliation job against a staging database, hardcoded the connection string "just for now," and pushed it to an internal repo. Internal repos are visible to everyone in the enterprise. Two years and 4,000 clones later, that string is still sitting in the history.

You can't train secret handling out of people completely. What you can do is build a system where the leak gets **blocked before it lands**, and where anything that slips through is found, rotated, and documented fast enough that an examiner sees a working control instead of a pile of open alerts.

This part builds that system on [GitHub Secret Protection](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security). Pipeline credentials get a brief look here; [Part 6](/blog/github-waf-financial-services/actions-hardening/) owns the deep dive on Actions.

## The requirements

None of these regulations say "turn on push protection." They do say you must protect credentials and keys, control access to systems, detect and respond to exposure, and prove it. Here's the subset that genuinely applies to secrets handling in source control.

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

DORA's key-management RTS and NYDFS 500.15 are the most explicit. The rest expect credential protection as part of a broader program. Either way, you show the control exists, is enforced, and governs its exceptions.

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

## Control 1: License and enforce Secret Protection centrally

**What we do.** License GitHub Secret Protection for every private and internal repository. Then create one **enterprise security configuration** that enables it, set it as the default for new repositories, and enforce it so repo and org owners can't switch it off.

**Why.** Coverage gaps are the most common finding here. "Enabled on our critical repos" invites "who decided which ones aren't critical?" Central enforcement supports US-FFIEC-INFOSEC, EU-DORA-9, and CA-OSFI-B13. WAF's [enforce GHAS at scale](https://learn.github.com/well-architected/library/application-security/recommendations/enforce-ghas-at-scale/) names security configurations as the recommended way to enforce secret scanning at scale, and the [NIST SSDF scenario](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) uses the same pattern under PO.3.

**How.** GitHub Advanced Security is now sold as two products. **GitHub Secret Protection** covers secret scanning, push protection, AI-detected secrets, custom patterns, delegated bypass, and delegated alert dismissal. **GitHub Code Security** covers code scanning and supply chain ([Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/)). Billing is per [unique active committer over 90 days](https://docs.github.com/en/billing/concepts/product-billing/github-advanced-security).

In the enterprise's **Settings > Advanced Security**, [create a custom configuration](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-at-scale/configure-enterprise-security/establish-complete-coverage/create-custom-configuration) with these settings:

| Setting | Our default |
|---|---|
| Secret Protection | Enabled |
| Validity checks | Enabled |
| Extended metadata | Enabled (public preview) |
| Generic patterns | Enabled |
| Scan for AI-detected secrets | Enabled |
| Push protection | Enabled |
| Push protection for AI-detected secrets | Pilot first (public preview, consumes AI credits) |
| Bypass privileges | Specific actors (see Control 3) |
| Prevent direct alert dismissals | Enabled |
| Use as default for new repositories | All repositories |
| Enforce configuration | Enforce for repository and organization owners |

[Apply it](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-at-scale/configure-enterprise-security/establish-complete-coverage/apply-custom-configuration) to **All repositories**. It lands on archived repos too, which is what you want, since secret scanning still runs there. Two gotchas:

- **Transferred repositories don't pick up the default.** Apply a configuration manually after a transfer; add that to your transfer runbook.
- **Enforcement makes REST API changes silently fail.** Per [configuration enforcement](https://docs.github.com/en/code-security/reference/security-at-scale/configuration-enforcement), the call "will appear to succeed, but no enablement statuses will change." Great for control integrity. Confusing at 2 a.m.

**Verify.** Export the **Coverage** view in [security overview](https://docs.github.com/en/code-security/concepts/security-at-scale/security-overview) [to CSV](https://docs.github.com/en/code-security/how-tos/view-and-interpret-data/analyze-organization-data/export-data) monthly. Alert on `business_secret_scanning.disable`, `repository_secret_scanning.disable`, and `repository_secret_scanning_push_protection.disable` from the [enterprise audit log events](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise). Any of those outside an approved change is an incident, not a curiosity.

## Control 2: Push protection everywhere

**What we do.** Push protection is on for every repository, generic patterns included. Developers on personal-account GHEC keep **push protection for users** on. Every block message links to an internal "what to do now" page.

**Why.** Detection after commit means the secret is already in history, already cloned, and already a remediation project. This is the core preventive control behind EU-DORA-9, EU-DORA-RTS-CRYPTO, and US-NYDFS-500.15, and it supports INT-PCI-6.2. The WAF [NIST SSDF scenario](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) is blunt about it under PW.5: "Always aim to enable secret scanning push protection organization-wide."

**How.** [Push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection) blocks four categories of secrets:

1. **Partner patterns** (provider-issued tokens like cloud keys)
2. **Generic patterns** (private keys, connection strings), once [generic pattern scanning](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enabling-secret-scanning-for-generic-patterns) is enabled
3. **Custom patterns** you define (Control 5)
4. **AI-detected generic secrets** such as passwords (public preview)

Supported push surfaces include command-line pushes, web UI commits, file uploads, and REST API requests, with coverage varying by secret type. Then tune under **Global settings**, per [configuring global settings](https://docs.github.com/en/code-security/how-tos/secure-at-scale/configure-organization-security/establish-complete-coverage/configure-global-settings):

- **Resource link for blocked commits:** point it at your runbook (remove the secret, request a bypass, who to call).
- **Pattern configurations** (public preview): choose which patterns push protection enforces at enterprise and org level. Use the page's alert volume and bypass-rate data to promote high-precision generic patterns into blocking.

**Push protection for AI-detected secrets** is genuinely useful because passwords don't match regexes. Per the [enablement docs](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/prevent-future-leaks/enable-ai-push-protection), it's in public preview and consumes **Secret Protection AI credits** on every scanned push, even clean ones. Pilot it on your highest-risk repos, after setting a budget with "Stop usage when budget limit is reached" as the [billing docs](https://docs.github.com/en/billing/concepts/product-billing/github-advanced-security) recommend. Hand your model risk team the [AI features application card](https://docs.github.com/en/code-security/responsible-use/security-and-quality-ai-features) before you go wide.

**Push protection for users** is a personal setting that [developers manage themselves](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/prevent-future-leaks/manage-user-push-protection). It's on by default and blocks supported secrets from *any* public repository. On personal-account GHEC, add "confirm it's on" to developer onboarding. It's what stands between a work credential and someone's weekend side project.

**Verify.** Check the Coverage view in security overview for push protection enablement. Watch for `secret_scanning_push_protection.disable` and `*_push_protection_pattern_configuration.updated` events. Review the [push protection metrics](https://docs.github.com/en/code-security/how-tos/view-and-interpret-data/analyze-organization-data/viewing-metrics-for-secret-scanning-push-protection) page (public preview) monthly for blocks, bypasses by secret type, and bypassing repositories.

## Control 3: Delegated bypass and delegated dismissal (yes, turn them on)

**What we do.** Delegated bypass is **on** for every repository. A named reviewer group approves or denies every bypass request. Exemptions are limited to migration bots and similar automation with a documented business case. Delegated alert dismissal is also on, so closing an alert as "false positive" or "won't fix" takes a second person.

**Why.** Out of the box, anyone with write access can bypass push protection by picking a reason. Examiners don't love self-attested exceptions. Delegated bypass makes it a **governed exception with an approver**, matching the segregation-of-duties thinking behind US-FFIEC-INFOSEC, EU-DORA-9, and US-OCC-30-AppB. WAF's [enforce GHAS at scale](https://learn.github.com/well-architected/library/application-security/recommendations/enforce-ghas-at-scale/) calls out the write-access default and points to delegated bypass as the fix.

"Won't this slow developers down?" Fair question. Legitimate bypasses get rare once patterns are tuned, and the WAF SSDF scenario covers the rollout: allow bypass while new custom patterns are validated, then tighten once false positive rates are known.

**How.** In the security configuration, set **Bypass privileges** to **Specific actors**, following [enabling delegated bypass](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/manage-bypass-requests/enable-delegated-bypass). Our recommended setup:

- **Reviewers:** central AppSec plus trained security champions per business unit, via a custom role with the "review and manage secret scanning bypass requests" permission (not org owner).
- **Exemptions:** trusted automation only. The docs warn exemptions "may lead to leaked secrets." Each one needs a ticket and an owner.

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

```bash
gh api -X POST "/orgs/$ORG/rulesets" --input protect-secret-scanning-config.json
```

Replace `actor_id` with your AppSec team's ID. Legitimate exclusions (test fixtures with fake keys, vendored docs) then go through a PR that the AppSec team pushes.

**Verify.** Quarterly, list rulesets per org and confirm this one is `active`. Spot-check with code search for `path:.github/secret_scanning.yml` across the enterprise. Every hit should have a matching approval.

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

- **The token pattern** is the ideal case: fixed prefix, fixed length. If your platform team issues unprefixed tokens, ask them to add a prefix. It's a cheap design decision that makes detection dramatically easier.
- **The account number pattern** requires a label in the start delimiter, because a bare 12-digit regex matches every timestamp you own. Keep it **alert-only**; the docs warn that push protection on commonly found patterns "can be disruptive to contributors."
- **Card numbers (PANs):** regex can't run a Luhn check. Use a labeled, alert-only pattern at most, and keep your PCI DSS DLP tooling as the primary control.

Dry run every regex in the UI before enabling push protection. The [AI regex generator](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/customize-leak-detection/generating-regular-expressions-for-custom-patterns-with-ai) proposes up to three candidates from a plain-language description, no Copilot subscription required. Review its output like any other code.

**Generic and AI-detected secrets.** Enable [generic patterns](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enabling-secret-scanning-for-generic-patterns) for private keys and connection strings, and [AI-detected secrets](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enabling-secret-scanning-for-ai-detected-secrets) for unstructured passwords (separate alert list, no Copilot subscription needed). Until you've measured their precision, give them a longer triage SLA than provider patterns (Control 7).

**Verify.** Audit events `business_secret_scanning_custom_pattern.publish` / `.update` / `.delete` and `*_custom_pattern_push_protection.enabled` / `.disabled` show who changed detection logic. Keep the pattern JSON in a repo with CODEOWNERS, and review it quarterly against current token formats.

## Control 6: Validity checks, partner revocation, and public monitoring

**What we do.** Validity checks and extended metadata are on everywhere. Public monitoring is on for GHEC enterprises. We lean on the partner program for public exposure but never treat it as our primary control.

**Why.** You can't treat 3,000 alerts as equally urgent. WAF's [prioritizing alerts](https://learn.github.com/well-architected/library/application-security/recommendations/prioritizing-alerts/) guidance says to address confirmed-active secrets right away and deprioritize confirmed-inactive ones below alerts with unknown validity. That prioritization is how you meet incident-response expectations in US-SEC-RegSP-2024 and US-GLBA-314 without drowning.

**How.**

- **[Validity checks](https://docs.github.com/en/code-security/concepts/secret-security/validity-checks)** periodically test the secret with its issuer and label the alert `active`, `inactive`, or `unknown`, typically using least-intrusive GET requests. Some compliance teams flinch at "we send the secret to the provider." Fair, but the provider issued it. Document the data flow in your third-party risk file and move on.
- **Extended metadata** (public preview) adds owner and scope details where the provider shares them, which shortens the "whose key is this?" hunt.
- **[Partner program](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning-for-partners):** when a partner-pattern secret appears in a *public* repository or npm package, GitHub notifies the provider, who may revoke it. GitHub also revokes its own PATs leaked publicly. For a GitHub PAT leaked in a private repo, you can click **Report leak** on the alert. On EMU and GHE.com, your enterprise code can't be public, so this mostly protects you from leaks *outside* your enterprise.
- **[Public monitoring](https://docs.github.com/en/code-security/concepts/secret-security/public-monitoring)** fills that outside gap. It attributes secrets found in any public repo on GitHub to your enterprise, by membership or by verified domain. Alerts land in enterprise-level security overview. [Enable it](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-at-scale/configure-enterprise-security/manage-your-coverage/enabling-public-monitoring-for-your-enterprise) under enterprise **Settings > Advanced Security**. On GHE.com, configure a verified domain, because it's your only attribution method there.

**Verify.** Audit events `*_secret_scanning_automatic_validity_checks.enabled` / `.disabled` and `*_secret_scanning_extended_metadata.*` prove the settings stayed on. The public monitoring alerts API (`GET /enterprises/{enterprise}/secret-scanning/public-monitoring-alerts`, in the [enterprise secret scanning REST docs](https://docs.github.com/en/enterprise-cloud@latest/rest/secret-scanning/secret-scanning)) gives you a monthly export.

## Control 7: Triage SLAs and the remediation workflow

**What we do.** Every secret scanning alert gets a severity from its metadata, an owner, and a deadline. The rule is **rotate first, then decide about history.** Every closure carries a reason and a comment.

**Why.** Auditors verify you did what your policy says. If your standard promises "credential exposures are contained within 24 hours," your alert data has to prove it. This supports US-SEC-RegSP-2024, US-GLBA-314, US-OCC-30-AppB, EU-DORA-9, and the LATAM regulations (BR-CMN-4893, MX-CNBV-CUB, CO-SFC-CBJ-006-2025, CL-CMF-20-10, PE-SBS-504, AR-BCRA-A7724), which all expect incidents to be detected, handled, and recorded.

### Our default SLAs

These are **our starting numbers**, not regulatory figures. Calibrate them with your incident response and compliance teams.

| Alert condition | Severity | Contain (revoke or rotate) | Close the alert |
|---|---|---|---|
| `validity: active`, or `publicly_leaked: true` | Critical | 4 hours | 2 business days |
| Provider or custom pattern, `validity: unknown` | High | 1 business day | 5 business days |
| Approved push protection bypass (`is_bypassed`) | High | Review within 1 business day | Per the type above |
| Generic pattern or AI-detected | Medium | Triage within 3 business days | 10 business days |
| `validity: inactive` | Low | Confirm with owner | 30 days |

Bump severity one level for repos tagged with a custom property like `regulatory-scope: pci` or `internet-facing: true`. That's the organizational-context step from WAF's [prioritizing alerts](https://learn.github.com/well-architected/library/application-security/recommendations/prioritizing-alerts/) page.

### The workflow

This follows GitHub's [remediating a leaked secret](https://docs.github.com/en/code-security/tutorials/remediate-leaked-secrets/remediating-a-leaked-secret) tutorial, with our opinions layered in:

1. **Identify the owner** via alert metadata, `CODEOWNERS`, and `git log -S`.
2. **Rotate or revoke.** This is the step that actually reduces risk. If downtime is a real concern, issue a new credential, cut over, *then* revoke, on a clock measured in hours.
3. **Find every consumer:** org code search, repo and org secrets, deploy keys, installed apps.
4. **Check for misuse** in GitHub audit logs and the provider's logs for the exposure window. Unauthorized access makes this an incident under your Reg S-P, GLBA, or DORA process, not a hygiene ticket.
5. **Decide on history** (below).
6. **Close the alert** as `revoked` with a comment linking the ticket. The comment lands on the alert timeline as audit evidence ([resolving alerts](https://docs.github.com/en/code-security/how-tos/manage-security-alerts/manage-secret-scanning-alerts/resolving-alerts)).

### Should you rewrite history?

Rotation neutralizes a credential. Rewriting history doesn't, because every clone and fork keeps its copy. The [removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) page lists the side effects, including broken PR diffs and **stripped commit signatures** (awkward after [Part 3](/blog/github-waf-financial-services/change-control/)). GitHub Support only helps "in cases where we determine that the risk can't be mitigated by rotating affected credentials." Our rule:

- **Rotatable secret, now revoked:** don't rewrite by default. Document the decision on the alert.
- **Non-rotatable data** (account numbers, customer PII, card data): rewrite with `git-filter-repo --sensitive-data-removal`, engage GitHub Support, and treat it as a potential privacy incident.

### Burn down the backlog

Use [security campaigns](https://docs.github.com/en/code-security/concepts/security-at-scale/about-security-campaigns) to group alerts, assign owners, and set deadlines. WAF suggests targeting all valid provider-pattern secret alerts within 30 days, a solid first campaign. Campaigns are GHEC-only per WAF, so GHES shops need issue-based tracking.

**Verify.** Pull data with the [secret scanning REST API](https://docs.github.com/en/rest/secret-scanning/secret-scanning), always with `hide_secret=true`. The last place you want a live credential is your evidence folder.

```bash
# Monthly SLA evidence: resolved alerts with time-to-close, secret values hidden
gh api -X GET "/orgs/$ORG/secret-scanning/alerts" \
  -f state=resolved -F hide_secret=true --paginate \
  --jq '.[] | [.number, .repository.full_name, .secret_type, .validity,
               .resolution, .created_at, .resolved_at] | @csv'

# Open critical alerts right now
gh api -X GET "/orgs/$ORG/secret-scanning/alerts" \
  -f state=open -f validity=active -F hide_secret=true --paginate \
  --jq '.[] | [.number, .repository.full_name, .secret_type, .created_at] | @csv'
```

The enterprise endpoint (`GET /enterprises/{enterprise}/secret-scanning/alerts`) supports the same filters. It only returns alerts for orgs where the caller is an owner or security manager, so run it with a dedicated security-manager identity. Compute `resolved_at - created_at` against your SLA table, and report breaches to your risk committee monthly.

## Control 8: Historical scanning and your day-zero baseline

**What we do.** Before enforcement day, run the free **secret risk assessment** to size the problem. After enablement, confirm each repository's backfill scan completed, and keep scan history as evidence.

**Why.** "We turned it on last Tuesday" doesn't answer "what was already in there?" Examiners care about the inventory of existing exposure as much as the prevention going forward (US-FFIEC-INFOSEC, CA-OSFI-B13).

**How.** Per [secret scanning](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning), enablement scans the entire Git history on all branches, plus issues, PRs, discussions, and wikis. GitHub also periodically rescans when new secret types are added. The [secret risk assessment](https://docs.github.com/en/code-security/concepts/secret-security/secret-security-with-github) is a free point-in-time scan for organizations on GitHub Team and Enterprise. It even estimates how many leaks push protection would have prevented, which makes a persuasive slide for the budget conversation.

**Verify.** `GET /repos/{owner}/{repo}/secret-scanning/scan-history` lists the latest incremental and backfill scans per repository. The `secret_scanning_scan.completed` audit event records completions. Keep the pre-rollout risk assessment report as your baseline artifact.

## Control 9: Fewer secrets to leak (OIDC and scoped platform secrets)

**What we do.** The best secret is the one that doesn't exist. Cloud deployments use **Actions OIDC** instead of stored keys. The secrets that remain are scoped as narrowly as GitHub allows, with production credentials behind environment protection.

**Why.** Every long-lived credential is a future alert. Short-lived tokens shrink the blast radius and simplify the key-lifecycle story for EU-DORA-RTS-CRYPTO and US-NYDFS-500.15. WAF's [application security checklist](https://learn.github.com/well-architected/library/application-security/checklist/) calls for secret management tools and regular rotation, and [securing the developer workspace](https://learn.github.com/well-architected/library/application-security/recommendations/securing-developer-workspace/) says to prefer OIDC and short-lived tokens.

**How.** Briefly, because [Part 6](/blog/github-waf-financial-services/actions-hardening/) goes deep:

- **[OIDC](https://docs.github.com/en/actions/concepts/security/openid-connect)** exchanges a GitHub-issued token for a short-lived cloud credential that expires with the job. Nothing to store, rotate, or leak.

  {% raw %}
  ```yaml
  permissions:
    id-token: write
    contents: read
  jobs:
    deploy:
      runs-on: ubuntu-latest
      environment: production
      steps:
        - uses: azure/login@v2
          with:
            client-id: ${{ vars.AZURE_CLIENT_ID }}
            tenant-id: ${{ vars.AZURE_TENANT_ID }}
            subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
  ```
  {% endraw %}

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

## Control matrix

| Control | Requirement IDs | GitHub feature | Evidence | Cadence |
|---|---|---|---|---|
| Central licensing and enforcement | US-FFIEC-INFOSEC, EU-DORA-9, CA-OSFI-B13 | Enterprise security configuration (enforced) | Coverage CSV export; `*_secret_scanning.disable` audit alerts | Monthly; real-time alerting |
| Push protection everywhere | EU-DORA-9, EU-DORA-RTS-CRYPTO, US-NYDFS-500.15, INT-PCI-6.2, INT-NIST-SSDF | Push protection, generic patterns, pattern configurations | Coverage view; push protection metrics; `*_push_protection.disable` events | Monthly |
| Governed bypass and dismissal | US-FFIEC-INFOSEC, US-OCC-30-AppB, EU-DORA-9 | Delegated bypass, delegated alert dismissal | `secret_scanning_push_protection_request.*`, `.bypass`, `secret_scanning_closure_request.*` events | Monthly reconciliation |
| Exclusion file lockdown | US-FFIEC-INFOSEC, EU-DORA-9 | Org push ruleset (`file_path_restriction`) | Ruleset export; code search for `secret_scanning.yml` | Quarterly |
| Custom patterns for internal secrets and data formats | EU-DORA-RTS-CRYPTO, US-GLBA-314, US-NYDFS-500.15, EU-GDPR-32 | Custom patterns, AI regex generator, AI-detected secrets | Pattern JSON in version control; `*_custom_pattern.*` events | Quarterly review |
| Validity, partner, and public monitoring | US-GLBA-314, US-SEC-RegSP-2024, EU-DORA-9 | Validity checks, extended metadata, partner program, public monitoring | Validity-check audit events; public monitoring alert export | Monthly |
| Triage SLAs and remediation | US-SEC-RegSP-2024, US-GLBA-314, US-OCC-30-AppB, EU-DORA-9, BR-CMN-4893, MX-CNBV-CUB, CO-SFC-CBJ-006-2025, CL-CMF-20-10, PE-SBS-504, AR-BCRA-A7724 | Secret scanning alerts API, security campaigns | Time-to-close report (`hide_secret=true`); closure comments | Monthly to risk committee |
| Historical baseline | US-FFIEC-INFOSEC, CA-OSFI-B13 | Secret risk assessment, scan history API | Pre-rollout report; `secret_scanning_scan.completed` events | Once, then on new orgs |
| Credential minimization and scoping | EU-DORA-RTS-CRYPTO, US-NYDFS-500.15, INT-NIST-SSDF | Actions OIDC, environment secrets, scoped org secrets | `gh secret list` inventory; count of stored cloud credentials | Quarterly |

## Summary and key takeaways

Secrets protection is the rare control where the tooling is mature, the regulatory intent is clear, and the evidence is mostly generated for you. The hard parts are organizational: getting reviewers staffed, agreeing on SLAs, and resisting the urge to treat history rewrites as remediation.

**Your checklist:**

- [ ] License GitHub Secret Protection for all private and internal repositories.
- [ ] Create one enterprise security configuration, apply it to all repos, set it as the default, and enforce it for repo and org owners.
- [ ] Turn on push protection with generic patterns; add a resource link to your internal runbook.
- [ ] Pilot push protection for AI-detected secrets with a hard AI-credit budget.
- [ ] Enable delegated bypass with a staffed reviewer group and a one-business-day SLA; keep exemptions rare and ticketed.
- [ ] Enable delegated alert dismissal.
- [ ] Block `.github/secret_scanning.yml` with an org push ruleset.
- [ ] Publish custom patterns for internal token formats (push protection on) and labeled account-number formats (alert-only).
- [ ] Enable validity checks, extended metadata, and (on GHEC) public monitoring.
- [ ] Publish your triage SLA table and the "rotate first" workflow; close alerts as `revoked` with a ticket link.
- [ ] Run the secret risk assessment before rollout and keep it as your baseline.
- [ ] Move cloud deployments to OIDC; scope org secrets to selected repos; put production credentials behind environments.
- [ ] Stand up monthly evidence pulls: coverage CSV, bypass reconciliation, and SLA report.

**Start here:** run the free secret risk assessment this week. The number it produces will make every other conversation on this list easier.

Previously: [Part 3: Source Code Management and Change Control](/blog/github-waf-financial-services/change-control/). Next up: [Part 5: Code Scanning and Software Supply Chain](/blog/github-waf-financial-services/code-scanning-supply-chain/), where we apply the same enforce-centrally, verify-continuously approach to vulnerabilities in your code and dependencies.

## References

### GitHub Well-Architected

- [Application security checklist](https://learn.github.com/well-architected/library/application-security/checklist/)
- [Enforce GHAS at scale](https://learn.github.com/well-architected/library/application-security/recommendations/enforce-ghas-at-scale/)
- [Prioritizing alerts](https://learn.github.com/well-architected/library/application-security/recommendations/prioritizing-alerts/)
- [Securing the developer workspace](https://learn.github.com/well-architected/library/application-security/recommendations/securing-developer-workspace/)
- [NIST SSDF implementation scenario](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/)

### GitHub Docs

- [About GitHub Advanced Security](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security)
- [GitHub Advanced Security license billing](https://docs.github.com/en/billing/concepts/product-billing/github-advanced-security)
- [GitHub Advanced Security license billing (GHES 3.22)](https://docs.github.com/en/enterprise-server@3.22/billing/concepts/product-billing/github-advanced-security)
- [Creating a custom security configuration for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-at-scale/configure-enterprise-security/establish-complete-coverage/create-custom-configuration)
- [Applying a custom security configuration to your enterprise](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-at-scale/configure-enterprise-security/establish-complete-coverage/apply-custom-configuration)
- [Security configuration enforcement](https://docs.github.com/en/code-security/reference/security-at-scale/configuration-enforcement)
- [Configuring global security settings for your organization](https://docs.github.com/en/code-security/how-tos/secure-at-scale/configure-organization-security/establish-complete-coverage/configure-global-settings)
- [Secret scanning](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning)
- [Push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection)
- [Managing push protection for users](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/prevent-future-leaks/manage-user-push-protection)
- [Enabling push protection for AI-detected secrets](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/prevent-future-leaks/enable-ai-push-protection)
- [Enabling scanning for AI-detected secrets](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enabling-secret-scanning-for-ai-detected-secrets)
- [Enabling secret scanning for generic patterns](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enabling-secret-scanning-for-generic-patterns)
- [Delegated bypass for push protection](https://docs.github.com/en/code-security/concepts/secret-security/delegated-bypass)
- [Enabling delegated bypass for push protection](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/manage-bypass-requests/enable-delegated-bypass)
- [Bypass requests for push protection](https://docs.github.com/en/code-security/concepts/secret-security/bypass-requests)
- [Enabling delegated alert dismissal for secret scanning](https://docs.github.com/en/code-security/how-tos/manage-security-alerts/manage-secret-scanning-alerts/enable-delegated-dismissal)
- [Excluding folders and files from secret scanning](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/customize-leak-detection/exclude-folders-and-files)
- [Available rules for rulesets](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [REST API endpoints for rules (organizations)](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/rules)
- [Custom patterns](https://docs.github.com/en/code-security/concepts/secret-security/custom-patterns)
- [Defining custom patterns for secret scanning](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/customize-leak-detection/define-custom-patterns)
- [Custom patterns reference](https://docs.github.com/en/code-security/reference/secret-security/custom-patterns)
- [Generating regular expressions for custom patterns with AI](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/customize-leak-detection/generating-regular-expressions-for-custom-patterns-with-ai)
- [REST API endpoints for secret scanning custom patterns](https://docs.github.com/en/rest/secret-scanning/custom-patterns)
- [Application card: GitHub security and quality AI features](https://docs.github.com/en/code-security/responsible-use/security-and-quality-ai-features)
- [Validity checks](https://docs.github.com/en/code-security/concepts/secret-security/validity-checks)
- [Secret scanning for partners](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning-for-partners)
- [Public monitoring for secret scanning](https://docs.github.com/en/code-security/concepts/secret-security/public-monitoring)
- [Enabling public monitoring for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-at-scale/configure-enterprise-security/manage-your-coverage/enabling-public-monitoring-for-your-enterprise)
- [Remediating a leaked secret in your repository](https://docs.github.com/en/code-security/tutorials/remediate-leaked-secrets/remediating-a-leaked-secret)
- [Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Resolving alerts from secret scanning](https://docs.github.com/en/code-security/how-tos/manage-security-alerts/manage-secret-scanning-alerts/resolving-alerts)
- [About security campaigns](https://docs.github.com/en/code-security/concepts/security-at-scale/about-security-campaigns)
- [Secret security with GitHub (secret risk assessment)](https://docs.github.com/en/code-security/concepts/secret-security/secret-security-with-github)
- [REST API endpoints for secret scanning](https://docs.github.com/en/rest/secret-scanning/secret-scanning)
- [REST API endpoints for secret scanning (enterprise)](https://docs.github.com/en/enterprise-cloud@latest/rest/secret-scanning/secret-scanning)
- [Audit log events for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise)
- [Security overview](https://docs.github.com/en/code-security/concepts/security-at-scale/security-overview)
- [Exporting data from security overview](https://docs.github.com/en/code-security/how-tos/view-and-interpret-data/analyze-organization-data/export-data)
- [Viewing metrics for secret scanning push protection](https://docs.github.com/en/code-security/how-tos/view-and-interpret-data/analyze-organization-data/viewing-metrics-for-secret-scanning-push-protection)
- [OpenID Connect](https://docs.github.com/en/actions/concepts/security/openid-connect)
- [Secrets (GitHub Actions)](https://docs.github.com/en/actions/concepts/security/secrets)
- [REST API endpoints for GitHub Actions secrets](https://docs.github.com/en/rest/actions/secrets)
- [Configuring access to private registries for Dependabot](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/configure-access-to-private-registries)
- [Troubleshooting Dependabot on GitHub Actions](https://docs.github.com/en/code-security/reference/supply-chain-security/troubleshoot-dependabot/dependabot-on-actions)
- [Managing development environment secrets for Codespaces](https://docs.github.com/en/codespaces/managing-codespaces-for-your-organization/managing-development-environment-secrets-for-your-repository-or-organization)
- [Feature overview for GitHub Enterprise Cloud with data residency](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency)
- [Configuring secret scanning for your appliance (GHES 3.22)](https://docs.github.com/en/enterprise-server@3.22/code-security/how-tos/secure-at-scale/configure-enterprise-security/configure-specific-tools/configure-secret-scanning)
- [Enabling validity checks (GHES 3.22)](https://docs.github.com/en/enterprise-server@3.22/code-security/how-tos/secure-your-secrets/customize-leak-detection/enable-validity-checks)

### Regulatory sources

- [FFIEC IT Examination Handbook: Information Security](https://ithandbook.ffiec.gov/it-booklets/information-security)
- [GLBA Safeguards Rule, 16 CFR Part 314](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-314)
- [12 CFR Part 30, Appendix B](https://www.ecfr.gov/current/title-12/chapter-I/part-30/appendix-Appendix%20B%20to%20Part%2030)
- [NYDFS 23 NYCRR Part 500](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500)
- [SEC Regulation S-P amendments (Federal Register)](https://www.federalregister.gov/documents/2024/06/03/2024-11116/regulation-s-p-privacy-of-consumer-financial-information-and-safeguarding-customer-information)
- [OSFI Guideline B-13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management)
- [CMN Resolution 4,893 (Brazil)](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf)
- [CNBV Circular Única de Bancos (Mexico)](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf)
- [SFC Circular Básica Jurídica, CE 006 de 2025 (Colombia)](https://www.superfinanciera.gov.co/publicaciones/10115528/circular-basica-juridica-ce-00625/)
- [CMF RAN Capítulo 20-10 (Chile)](https://www.cmfchile.cl/portal/normativa/624/articles-29310_doc_pdf.pdf)
- [Resolución SBS N° 504-2021 (Peru)](https://intranet2.sbs.gob.pe/dv_int_cn/2046/v2.0/Adjuntos/504-2021.R.pdf)
- [BCRA Comunicación "A" 7724 (Argentina)](https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A7724.pdf)
- [DORA, Regulation (EU) 2022/2554](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9)
- [Commission Delegated Regulation (EU) 2024/1774](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774)
- [GDPR, Regulation (EU) 2016/679](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679)
- [PCI DSS v4.0.1 (document library)](https://www.pcisecuritystandards.org/document_library/)
- [NIST SP 800-218 (SSDF)](https://csrc.nist.gov/pubs/sp/800/218/final)
