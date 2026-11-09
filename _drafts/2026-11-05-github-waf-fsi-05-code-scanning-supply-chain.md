---
layout: post
title: "GitHub Well-Architected for Financial Services, Part 5: Code Scanning and Software Supply Chain"
date: 2026-11-05 10:05:00 -0600
category: Blog
tags: [github, well-architected, financial-services, compliance, security, governance, code-scanning, supply-chain, dependabot, sbom]
excerpt: "How a regulated financial institution turns CodeQL, Dependabot, dependency review, and artifact attestations into enforced controls with remediation SLAs and evidence an examiner can actually test."
permalink: /blog/github-waf-financial-services/code-scanning-supply-chain/
---

*This post is part of the [GitHub Well-Architected for Financial Services](/blog/github-waf-financial-services/) series.*

- [Overview and Compliance Crosswalk](/blog/github-waf-financial-services/)
- [Part 1: Platform Foundation and Data Boundaries](/blog/github-waf-financial-services/platform-foundation/)
- [Part 2: Identity and Access Management](/blog/github-waf-financial-services/identity-and-access/)
- [Part 3: Source Code Management and Change Control](/blog/github-waf-financial-services/change-control/)
- [Part 4: Secrets Protection](/blog/github-waf-financial-services/secrets-protection/)
- **Part 5: Code Scanning and Software Supply Chain** (you are here)
- [Part 6: CI/CD and GitHub Actions Hardening](/blog/github-waf-financial-services/actions-hardening/)
- [Part 7: Copilot and AI Agents](/blog/github-waf-financial-services/copilot-and-agents/)
- [The Leadership Brief](/blog/github-waf-financial-services/leadership-brief/)

> **A friendly note:** This information is meant to be guidance to help navigate a complex topic. Please validate these patterns with your compliance and/or regulatory reporting team(s).

## Leadership brief

- **The risk:** A vulnerable or malicious third-party package can sit in payment, lending, or trading systems for months without active detection.
- **Our position:** Scanning needs **enforcement**, **risk-based prioritization**, and **measured remediation SLAs**, not just dashboards.
- **What we deploy:** GitHub Code Security on every in-scope repository, applied centrally through enforced security configurations. Rulesets block merges on high-severity findings, and security campaigns burn down existing debt.
- **The evidence:** Security overview metrics (coverage, age of alerts, mean time to remediate), audit log events for every dismissal and configuration change, SBOM exports, and verifiable build provenance for what you ship.

---

An examiner asks for your card service's component inventory, the detection and remediation dates for its last critical vulnerability, and proof that production runs the reviewed code.

"Each team handles that differently" makes for a long week. GitHub can supply evidence, but buying a license is not a control. **Coverage, enforcement, and durable records** are.

## The requirements

Regulators rarely name tools. They ask for secure development, vulnerability management, and a component inventory. The full crosswalk lives in the [series overview](/blog/github-waf-financial-services/).

**Applicability:** [Part 1's deployment baseline](/blog/github-waf-financial-services/platform-foundation/#choosing-your-deployment-model) defaults to **GHEC with data residency, including EMU**; GHES comparisons use **3.22**. Use its [centrally approved classification](/blog/github-waf-financial-services/platform-foundation/#data-classification-with-custom-properties) for scanner targeting. Missing classification blocks release.

**Reliance limits:** mappings **contribute to**, not satisfy, requirements. Second line validates applicability, design, operating evidence, and compensating controls. Follow [Part 1's feature and preview controls](/blog/github-waf-financial-services/platform-foundation/#feature-availability-and-preview-controls); local availability gaps below still apply.

| ID | Regulation and citation | What it asks for (paraphrase) |
|---|---|---|
| US-FFIEC-DAM | [FFIEC IT Handbook, Development, Acquisition, and Maintenance](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance) | Govern building, buying, and maintaining software, including vendor-sourced code and QA. |
| US-NYDFS-500.8 | [23 NYCRR 500.8, Application Security](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Written procedures for secure in-house development and for testing externally developed software. |
| US-SEC-CYBER-2023 | [SEC cybersecurity disclosure rule (Release 33-11216)](https://www.federalregister.gov/documents/2023/08/04/2023-16194/cybersecurity-risk-management-strategy-governance-and-incident-disclosure) | Annual disclosure of cyber risk management and governance, which drives board reporting on supply chain risk. |
| CA-OSFI-B13 | [OSFI Guideline B-13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | Risk-based management of technology and cyber risk. |
| CA-AMF-ICT | [AMF ICT Risk Management Guideline](https://lautorite.qc.ca/en/professionals/insurers/guidelines/operational-risk/guideline-on-information-and-communications-technology-risk-management) | Quebec's analogue to B-13: ICT governance, risk lifecycle, documentation. |
| BR-CMN-4893 | [CMN Resolution 4,893/2021 (Brazil)](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf) | A formal cybersecurity policy, which your vulnerability process implements. |
| MX-CNBV-CUB | [CNBV Circular Única de Bancos (Mexico)](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) | Technology-risk and information-security provisions for banks. |
| CL-CMF-20-10 | [CMF RAN Chapter 20-10 (Chile)](https://www.cmfchile.cl/portal/normativa/624/articles-29310_doc_pdf.pdf) | Minimum information-security and cybersecurity baseline for banks. |
| EU-DORA-9 | [DORA Art. 9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9) | Continuous monitoring and security tools that protect integrity and confidentiality. |
| EU-DORA-RTS-PATCH | [Delegated Regulation (EU) 2024/1774, Art. 10](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | Vulnerability identification and patch deployment processes. |
| INT-PCI-6.2 | [PCI DSS v4.0.1, Req. 6.2.1-6.2.4](https://www.pcisecuritystandards.org/document_library/) | Secure-coding standards, training, and code review before release. |
| INT-PCI-6.3 | [PCI DSS v4.0.1, Req. 6.3.1-6.3.3](https://www.pcisecuritystandards.org/document_library/) | Identify and risk-rank vulnerabilities in custom and third-party components; keep a component inventory. |
| INT-PCI-6.4.2 | [PCI DSS v4.0.1, Req. 6.4.2](https://www.pcisecuritystandards.org/document_library/) | An automated technical solution in front of public-facing web applications continually detects and prevents web-based attacks. This is an external runtime control, not GitHub scanning. |
| INT-NIST-SSDF | [NIST SP 800-218, SSDF v1.1](https://csrc.nist.gov/pubs/sp/800/218/final) | Reference practices: protect the software (PS), produce well-secured software (PW), respond to vulnerabilities (RV). |

**PCI boundary:** since March 31, 2025, annual application testing is not an alternative to **6.4.2**. The institution's external WAF control owns coverage, origin-bypass prevention, current protection, logs, and blocking or immediate investigation of alerts. AppSec owns SAST/DAST and secure-development evidence under **6.2/6.3**. Link each public application's release record to its WAF inventory entry and operating tests. A SARIF upload does not put protection in front of a web application.

## Deployment model differences

Check GHES and AI-assisted feature availability before rollout.

| Capability | GHEC (personal accounts) | GHEC with EMU | GHEC with data residency (GHE.com) | GHES |
|---|---|---|---|---|
| GitHub Code Security | Purchasable | Purchasable | Purchasable | Purchasable; required for **all** repos, including public |
| Code scanning runners | GitHub-hosted or self-hosted | Same | Same | **Self-hosted only** (no GitHub-hosted runners) |
| Copilot Autofix | Yes | Yes | Not listed as unavailable | **Not in the GHES 3.22 Code Security feature list** |
| Agentic autofix | Yes | **No** (not available for EMU-owned repos) | No (GHE.com is EMU-only) | Not in the GHES 3.22 feature list |
| Security campaigns | Yes | Yes | Not listed as unavailable | Not in the GHES 3.22 feature list |
| Dependabot | Built in | Built in | Built in; org/enterprise **dependency insights unavailable** | Requires **GitHub Connect** and **self-hosted runners**; advisories sync hourly |
| Open source license compliance policy | Yes | Yes | Yes (explicitly supported) | Not available (GHEC feature) |
| Artifact attestations | Yes | Yes | Yes | **Not available** |
| Third-party scanners from Marketplace | Yes | Restricted install | Marketplace **unavailable**; install actions from source | Requires GitHub Connect / actions sync |

Sources: [About GitHub Advanced Security](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security), [GHES 3.22 Advanced Security features](https://docs.github.com/en/enterprise-server@3.22/get-started/learning-about-github/about-github-advanced-security), [About autofix for code scanning](https://docs.github.com/en/code-security/concepts/code-scanning/autofix-for-code-scanning), [Enabling Dependabot for GHES](https://docs.github.com/en/enterprise-server@3.22/admin/configuring-settings/configuring-github-connect/enabling-dependabot-for-your-enterprise), [GHE.com feature overview](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency), [About open source license compliance](https://docs.github.com/en/code-security/concepts/supply-chain-security/open-source-license-compliance).

**GHES takeaway:** budget for institution-owned remediation tracking, autofix alternatives, and build provenance alongside the scanning/enforcement core.

## Threat modeling: decide what "bad" looks like first

### What we do

Every Critical application has a **threat model** stored in its repo, reviewed through CODEOWNERS, and updated at design time and on significant change.

### Why

Scanners find known bug classes; threat models expose design risks such as broken trust boundaries. SSDF **PW.1/PW.2** and PCI **6.2** support design-time security, not PCI **6.4.2** runtime protection. The WAF [application security checklist](https://learn.github.com/well-architected/library/application-security/checklist/) recommends regular, cross-functional modeling as threats change. [Part 1](/blog/github-waf-financial-services/platform-foundation/) owns the GitHub platform risk assessment.

### How

- Keep `docs/threat-model.md` in each Critical repo, owned in CODEOWNERS by security.
- Translate design risks into scanner coverage and tests. CodeQL default setup's **threat models (public preview)** add local taint sources for Java/Kotlin and C#, useful for batch and back-office apps. See [About setup types](https://docs.github.com/en/code-security/concepts/code-scanning/setup-types).
- Keep a reviewed design model and GA scanner configuration as the baseline. Preview coverage is supplemental; any permitted gap requires named AppSec acceptance, expiry, and second-line approval under Part 1's preview controls.

### Verify

Annually, the owner attests that the model is current, backed by commit history. Missing or stale models are SDLC findings.

## Coverage: GitHub Code Security everywhere it matters

### What we do

Every repository touching production, customer data, or regulated processes gets **GitHub Code Security**, through an enterprise configuration set to **"Enforce for repository and organization owners."**

**Procurement:** Advanced Security comprises **Secret Protection** ([Part 4](/blog/github-waf-financial-services/secrets-protection/)) and **Code Security** (scanning, Autofix, AI Scan, campaigns, custom Dependabot triage, dependency review, security overview). Dependency graph and Dependabot alerts are in all plans. See [product coverage](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security).

### Why

Coverage supports **US-NYDFS-500.8**, **INT-PCI-6.3**, **EU-DORA-9**, and SSDF **RV.1**. WAF's [Enforce GHAS at scale](https://learn.github.com/well-architected/library/application-security/recommendations/enforce-ghas-at-scale/) combines classification, security configurations, and supplemental rulesets.

### How

1. Consume [Part 1's approved properties](/blog/github-waf-financial-services/platform-foundation/#data-classification-with-custom-properties): `business-criticality`, `compliance-frameworks`, internet exposure, deployment scope, and license-policy rollout state. Reconcile scanner coverage against the application inventory daily. Missing or invalid classification blocks release, never excludes a repository from scanning.
2. Build an enterprise configuration under **Enterprise settings > Advanced Security > Security configurations**. Enable Code Security, default setup, dependency graph, automatic dependency submission, Dependabot alerts, security updates, and **Prevent direct alert dismissals** for both code scanning and Dependabot. See [Creating a custom security configuration for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-at-scale/configure-enterprise-security/establish-complete-coverage/create-custom-configuration).
3. Select **"Enabled with advanced setup allowed"** to enable default setup without overwriting existing CodeQL workflows.
4. Apply to **All repositories**, auto-applying to new private/internal repos and protecting archived repos when restored. See [Applying an enterprise configuration](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-at-scale/configure-enterprise-security/establish-complete-coverage/apply-custom-configuration).

### Verify

- **Monthly:** export the **Coverage** view from [security overview](https://docs.github.com/en/code-security/concepts/security-at-scale/security-overview) as CSV. Any in-scope repo without scanning is a finding.
- **Continuously:** alert on `security_configuration.update`, `security_configuration.delete`, and `security_configuration_policy.update` from the [enterprise audit log](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise). Weakening the baseline should page someone.
- **Quarterly:** reconcile attachment status from the [security configurations API](https://docs.github.com/en/rest/code-security/configurations) against your application inventory.

## Code scanning: default setup first, advanced where it earns its keep

### What we do

**CodeQL default setup is the baseline** for eligible repositories. Use advanced setup for custom builds, matrices, query packs, or unsupported schedules. Third-party SAST, container, and DAST tools upload **SARIF** into the same queue.

### Why

Repeatable testing supports **INT-PCI-6.2**, **US-FFIEC-DAM**, and **US-NYDFS-500.8**. WAF's [SSDF guide](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) maps code analysis to **PW.7** and executable testing to **PW.8**. Neither DAST nor container scans replace PCI **6.4.2** runtime protection.

Default setup reduces maintenance: it scans default/protected branch pushes, PRs, and weekly, adds new languages, and **reverts failed configuration changes**. See [setup types](https://docs.github.com/en/code-security/concepts/code-scanning/setup-types).

CodeQL supports **C/C++, C#, Java, and Rust without a build** ([compiled-language coverage](https://docs.github.com/en/code-security/concepts/code-scanning/codeql/codeql-for-compiled-languages)). The `github-codeql-config-file` property supplies shared configuration without forcing advanced setup.

### How

- **Default setup:** handled by the security configuration above. On GHES, label self-hosted runners `code-scanning` so default setup has somewhere to run.
- **Advanced setup at scale:** standardize one tested workflow per build pattern and roll it out with a script. GitHub documents this approach in [Configuring advanced setup for code scanning with CodeQL at scale](https://docs.github.com/en/code-security/how-tos/secure-at-scale/configure-organization-security/configure-specific-tools/configuring-advanced-setup-for-code-scanning-with-codeql-at-scale).
- **Third-party tools:** upload SARIF with `github/codeql-action/upload-sarif`, and set a `category` per tool so results don't overwrite each other. See [Uploading a SARIF file to GitHub](https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/integrate-with-existing-tools/upload-sarif-file).

```yaml
# .github/workflows/container-scan.yml (third-party scanner -> code scanning)
name: Container scan
on:
  pull_request:
  push:
    branches: [main]
permissions:
  contents: read
  security-events: write
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332 # v4.1.7
      # Run your approved scanner here and write results.sarif
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@24ebe4642ec51bc5869e9a70b929865f60c3d0b1 # v4.31.5
        with:
          sarif_file: results.sarif
          category: container-scanner
```

**Fragment prerequisites:** supply an approved scanner and `results.sarif`. SHAs were checked against [checkout v4.1.7](https://github.com/actions/checkout/releases/tag/v4.1.7) and [CodeQL action v4.31.5](https://github.com/github/codeql-action/releases/tag/v4.31.5) on **November 6, 2026**; [Part 6](/blog/github-waf-financial-services/actions-hardening/) owns institution approval. Here and in dependency review below, `ubuntu-latest` requires an approved non-allowlisted exception; otherwise select Part 6's authorized static-egress runner.

**[AI Scan](https://docs.github.com/en/code-security/concepts/code-scanning/ai-scan):** verify release status and deployment availability. Keep GA scanning as enforcement; any permitted preview coverage gap needs named AppSec acceptance, expiry, and second-line approval under [Part 1's preview controls](/blog/github-waf-financial-services/platform-foundation/#feature-availability-and-preview-controls).

### Verify

- Use the **tool status page** per repo and the Coverage view in security overview to confirm scans are actually succeeding, not just "enabled."
- Query `GET /orgs/{org}/code-scanning/alerts` via the [code scanning REST API](https://docs.github.com/en/rest/code-scanning/code-scanning) and confirm each in-scope repo has recent analyses from every required tool.
- **Cadence:** coverage weekly (automated), tool inventory quarterly.

## Merge protection: findings block the merge, not the release

### What we do

An **active organization ruleset** requires code scanning results on the default branch. It blocks merges when CodeQL reports **High or higher** security alerts or **Errors**. A central dependency review workflow also gates merges. Coverage includes Critical/High repositories **and every PCI/SOX repository**, even one rated Low.

### Why

Enforcement supports **INT-PCI-6.2**, **US-NYDFS-500.8**, and SSDF **PW.7**. WAF's [SSDF guide](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) and [dependency checklist](https://learn.github.com/well-architected/library/application-security/recommendations/managing-dependency-threats/) recommend required scanning at `High or higher`.

### How

Org-level rules need GitHub Enterprise. [Merge protection](https://docs.github.com/en/code-security/concepts/code-scanning/merge-protection) blocks threshold findings, **unfinished analysis, and missing tool configuration**. Losing scanning must not open the merge gate.

This **scanner-specific active-state template** uses the [REST API for rules](https://docs.github.com/en/rest/orgs/rules). Follow [Part 3's central gate construction](/blog/github-waf-financial-services/change-control/#required-status-checks-and-merge-queue). Replace the repository ID and `sha` with the verified, approved immutable central commit before deployment; `refs/heads/main` is not a substitute.

```json
{
  "name": "fsi-critical-merge-protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] },
    "repository_property": {
      "include": [
        { "name": "business-criticality", "property_values": ["Critical", "High"] }
      ],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "code_scanning",
      "parameters": {
        "code_scanning_tools": [
          { "tool": "CodeQL", "security_alerts_threshold": "high_or_higher", "alerts_threshold": "errors" }
        ]
      }
    },
    {
      "type": "workflows",
      "parameters": {
        "workflows": [
          { "repository_id": 123456789, "path": ".github/workflows/dependency-review.yml", "sha": "VERIFIED_APPROVED_CENTRAL_WORKFLOW_COMMIT_SHA" }
        ]
      }
    }
  ],
  "bypass_actors": [
    { "actor_id": 4242, "actor_type": "Team", "bypass_mode": "pull_request" }
  ]
}
```

**Scope is a union.** Create a second active ruleset with identical rules, including only `compliance-frameworks: ["PCI-DSS", "SOX"]`. Keep `business-criticality` in the first ruleset; another property in its include array does not establish OR. Reconcile the union against the approved inventory, including Medium/Low PCI/SOX test repos.

Reject unresolved placeholders and mutable internal references in policy CI. [Part 3](/blog/github-waf-financial-services/change-control/#required-status-checks-and-merge-queue) defines central workflow approval and pinning.

Scanner-specific boundaries:

- **Pilot acceptance:** prove required-tool failures and the full Critical/High plus PCI/SOX union block merges before activation. Use [Part 3's Evaluate lifecycle](/blog/github-waf-financial-services/change-control/#roll-out-with-evaluate-mode-and-rule-insights), not Evaluate as enforcement.
- **Scanner exceptions:** the PR-only team entry uses [Part 3's audited bypass lifecycle](/blog/github-waf-financial-services/change-control/#bypass-lists-who-why-and-how-it-is-audited). Retain the affected tool, findings, and security acceptance with the ticket.
- **Coverage limits:** merge protection skips merge queue groups and Dependabot PRs analyzed by default setup; alert lines must exist in the PR diff. Record these gaps in the control narrative.
- **License enforcement:** use the required workflow's GA `allow-licenses` gate. Add enterprise license-compliance rules only after verifying release status and availability. A preview rule cannot be the sole license control.

### Verify

- **Rule Insights** and the rule suites API show rule activity and Evaluate-mode failures. See [Managing rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository).
- Alert on `repository_ruleset.update` and `repository_ruleset.destroy` in the audit log.
- **At merge:** archive check suites, check runs, statuses, rule evaluations, reviewed head SHA, scanner/workflow identity, and bypass approvals under [Part 1's evidence standard](/blog/github-waf-financial-services/platform-foundation/#evidence-retention-and-integrity). Reconcile completeness daily; missing merge evidence blocks release.
- **Monthly:** sample Critical/High and PCI/SOX merges, including Low-tier PCI/SOX repos, against the archive. **Quarterly:** review every bypass against a change ticket.

## Triage, exceptions, and remediation SLAs

### What we do

Prioritize using GitHub metadata (**severity, CWE, EPSS, scope, Autofix support**) and institution context (**criticality, internet exposure, regulatory scope**). Assign an SLA; dismissals require independent security approval.

### Why

Risk ranking and measured remediation support **INT-PCI-6.3**, **EU-DORA-RTS-PATCH**, and SSDF **RV.2**. WAF's [prioritization guide](https://learn.github.com/well-architected/library/application-security/recommendations/prioritizing-alerts/) combines alert metadata, approved properties, and time-bound campaigns.

### How

**Start with an SLA table.** This is a starting point, not regulatory text. Your policy owns the numbers.

| Security severity | Critical or internet-facing repo, or PCI/SOX scope | All other in-scope repos |
|---|---|---|
| Critical | 7 days | 15 days |
| High | 30 days | 45 days |
| Medium | 90 days | 90 days |
| Low | 180 days or documented risk acceptance | 180 days or documented risk acceptance |

**Keep two clocks:** the institution's finding SLA starts at first detection, without resetting on re-export, dismissal, or reopening. PCI **6.3.3** requires applicable patches for **critical vulnerabilities, risk-ranked under 6.3.1**, within one month of release. Other patches follow the institution's risk-assessed timeframe. Our policy also applies the one-month cap to High dependency findings in PCI scope, a stricter institution choice, not PCI's exact wording. Advisory publication is not automatically patch availability. Record the vendor's fixed version, applicable package, release date, and source URL. Missing patch metadata is an evidence gap, not permission to declare compliance.

**Production context:** [linked artifacts](https://docs.github.com/en/code-security/concepts/supply-chain-security/linked-artifacts) enable `has:deployment`, `runtime-risk`, and `artifact-registry` filters. Use them to prioritize, not reset clocks or exclude build dependencies. See [production-context triage](https://docs.github.com/en/code-security/tutorials/secure-your-organization/prioritize-alerts-in-production-code).

**Dismissals:** GA **Prevent direct alert dismissals** routes requests to security managers ([configuration](https://docs.github.com/en/code-security/how-tos/manage-security-alerts/manage-code-scanning-alerts/enable-delegated-alert-dismissal)). If unavailable or preview, restrict dismissal access, require independent exception-system approval, and reconcile every API/audit dismissal daily. Preview approval alone is not enforcement.

**Autofix:** enabled by default for CodeQL, available on Code Security private/internal repos **including EMU**, and consumes no AI credits. **Agentic autofix** opens draft PRs but excludes EMU-owned repos. [Review and test all generated changes](https://docs.github.com/en/code-security/concepts/code-scanning/autofix-for-code-scanning); normal review/rulesets still apply.

### Verify

Run this normalized-evidence evaluator weekly for **all severities, dependency scopes, and open/closed findings**. Advisory dates alone do not prove patch availability.

```python
# sla_report.py; Python 3, standard library only
# Usage: python3 sla_report.py evidence.json
import calendar
import json
import sys
from datetime import datetime, timedelta, timezone

THRESHOLDS = {
    "critical": (7, 15), "high": (30, 45),
    "medium": (90, 90), "low": (180, 180),
}

def timestamp(value):
    result = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if result.tzinfo is None:
        raise ValueError("timezone required")
    return result

def one_month(start):
    year = start.year + (start.month == 12)
    month = start.month % 12 + 1
    day = min(start.day, calendar.monthrange(year, month)[1])
    return start.replace(year=year, month=month, day=day)

data = json.load(open(sys.argv[1], encoding="utf-8"))
now = timestamp(data["as_of"]) if "as_of" in data else datetime.now(timezone.utc)
inventory = data["repositories"]
if data["population_complete"] is not True or not inventory:
    raise ValueError("incomplete export: do not report SLA compliance")

for repo in inventory.values():
    tier = repo["business-criticality"]
    scopes = repo["compliance-frameworks"]
    if (tier not in {"Critical", "High", "Medium", "Low"}
            or not isinstance(scopes, list)
            or not isinstance(repo["internet-facing"], bool)
            or repo["classification-approved"] is not True):
        raise ValueError("unapproved or invalid classification")

for alert in data["alerts"]:
    repo = inventory[alert["repository"]]
    tier = repo["business-criticality"]
    scopes = repo["compliance-frameworks"]
    pci = "PCI-DSS" in scopes
    top = tier == "Critical" or repo["internet-facing"] or bool(
        {"PCI-DSS", "SOX"}.intersection(scopes))
    severity = alert["severity"].lower()
    severity = "medium" if severity == "moderate" else severity
    days = THRESHOLDS[severity][0 if top else 1]
    due = timestamp(alert["first_detected_at"]) + timedelta(days=days)
    patch_gap = False
    if alert["kind"] not in {"code-scanning", "dependabot"}:
        raise ValueError("unknown alert source")
    if alert["kind"] == "dependabot" and pci:
        # Institution risk ranking is separate from GitHub severity.
        if not isinstance(alert.get("pci_patch_critical"), bool):
            raise ValueError("missing institution PCI patch risk ranking")
    if (alert["kind"] == "dependabot" and pci
            and (alert["pci_patch_critical"] or severity in {"critical", "high"})):
        patch = alert.get("applicable_patch")
        if not patch or not patch.get("source_url") or not patch.get("fixed_version"):
            patch_gap = True
        else:
            due = min(due, one_month(timestamp(patch["available_at"])))
    # fixed_at means verified remediation, not merely dismissed_at.
    end = timestamp(alert["fixed_at"]) if alert.get("fixed_at") else now
    print(json.dumps({
        "id": alert["id"], "repository": alert["repository"],
        "sla_days": days, "due": due.isoformat(),
        "finding_sla_breached": end > (
            timestamp(alert["first_detected_at"]) + timedelta(days=days)),
        "status": ("PATCH_EVIDENCE_GAP" if patch_gap else
                   "BREACH" if end > due else "WITHIN_DEADLINE"),
    }))
```

Input example (save as `evidence.json`; patch dates must come from your verified vendor register):

```json
{
  "as_of": "2026-11-06T10:00:00-06:00",
  "population_complete": true,
  "repositories": {
    "my-bank/payments-api": {
      "business-criticality": "Low",
      "compliance-frameworks": ["PCI-DSS"],
      "internet-facing": false,
      "classification-approved": true
    }
  },
  "alerts": [{
    "id": "code-scanning:1",
    "repository": "my-bank/payments-api",
    "kind": "code-scanning",
    "severity": "critical",
    "first_detected_at": "2026-10-25T10:00:00-05:00",
    "fixed_at": null
  }]
}
```

The example reports a **7-day breach despite Low criticality**. Collector requirements:

- Paginate both alert APIs; retain first detection and closed findings; join approved properties and independently verified patch metadata.
- Include boolean `pci_patch_critical` for PCI dependencies and `fixed_version`, `available_at`, `source_url` for applicable patches.
- Set `population_complete` only after full inventory reconciliation. Empty inventory, unknown classification, missing repositories, or absent PCI ranking abort reporting.
- Treat patch gaps as findings even before SLA expiry. Dismissals and risk acceptances never change raw breach results.

## Security campaigns: burning down the debt you already have

### What we do

Use scoped, owned **security campaigns** for existing debt. Campaigns never extend alert SLAs: Critical findings in Critical repos still have **7 days**.

### Why

A dated remediation plan supports **EU-DORA-RTS-PATCH**, **INT-PCI-6.3**, and SSDF **RV.2**. WAF's [prioritization guide](https://learn.github.com/well-architected/library/application-security/recommendations/prioritizing-alerts/) targets Critical, Autofix-supported alerts and high-risk property values.

### How

Per [About security campaigns](https://docs.github.com/en/code-security/concepts/security-at-scale/about-security-campaigns) and [Creating and managing security campaigns](https://docs.github.com/en/code-security/how-tos/manage-security-alerts/remediate-alerts-at-scale/creating-managing-security-campaigns):

- Build from a template or a filter. Filtering to `autofix:supported` alerts favors quick wins. Keep each campaign at **1,000 alerts or fewer**.
- Set a **due date** (your SLA, made visible) and **campaign managers**, who must be org owners or security managers.
- Turn on **"Create issues"** for code campaigns so each repo gets a tracking issue.
- Code campaigns cover default-branch alerts only. **Secret scanning** campaigns are in **public preview**.

### Verify

At close, snapshot the **Campaigns** view or [API](https://docs.github.com/en/rest/campaigns/campaigns) and retain risk acceptances for remaining findings.

## Dependabot: alerts, security updates, and version updates

### What we do

- **Dependabot alerts** and **security updates** are on for every repo through the security configuration.
- **Version updates** are on for Critical and High repos through a standard `dependabot.yml`, with **grouping** and a **cooldown**.
- **Custom auto-triage rules** dismiss known noise and keep the queue honest.
- **Malware alerts** are enabled.
- **No auto-merge** of dependency updates without human review.

### Why

Dependency management supports **INT-PCI-6.3**, **US-FFIEC-DAM**, and **EU-DORA-RTS-PATCH**. WAF's [dependency threats guide](https://learn.github.com/well-architected/library/application-security/recommendations/managing-dependency-threats/) warns that compromised maintainers ship malware as **patch releases**. Passing tests does not rule out a backdoor.

### How

```yaml
# .github/dependabot.yml (template for Critical/High repos)
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    cooldown:
      default-days: 7
      semver-major-days: 30
    groups:
      security-fixes:
        applies-to: security-updates
        patterns: ["*"]
      routine-minor-and-patch:
        applies-to: version-updates
        update-types: ["minor", "patch"]
    labels: ["dependencies"]
```

Why these choices, per the [Dependabot options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference):

- **`cooldown`** ages version updates beyond the 3-day default to reduce exposure to newly hijacked releases. It **never delays security updates**.
- **`groups` with `applies-to`** batches reviews without reducing scrutiny.

**Auto-triage:** GitHub presets are available to everyone. **Custom** rules (by severity, package, CWE, and more) need Code Security. Auto-dismissals are logged as `repository_vulnerability_alert.auto_dismiss` and can be reopened. See [auto-triage rules](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-auto-triage-rules) and [security updates](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-security-updates).

**[Malware alerts](https://docs.github.com/en/code-security/concepts/supply-chain-security/malware-alerts):** the auto-dismiss preset addresses internal/public package-name collisions. Treat that as a **dependency confusion** risk; fix scoped private registries rather than hiding alerts.

**GHES note:** Dependabot updates need GitHub Connect and self-hosted runners, and only GitHub-reviewed advisories sync to the instance (hourly).

### Verify

- Security overview **Dependabot metrics** and the `GET /orgs/{org}/dependabot/alerts` [API](https://docs.github.com/en/rest/dependabot/alerts), which supports filtering by `severity`, `scope`, and `epss_percentage`.
- Audit log: `dependabot_alerts.disable` and `dependabot_security_updates.disable` should be rare events that someone explains.
- **Quarterly:** sample merged Dependabot PRs and confirm a human approved each one.

## Dependency review and license policy: guard the front door

### What we do

Every PR runs the **dependency review action**, required org-wide through a ruleset. It fails on **High or Critical** vulnerabilities in **runtime, development, and unknown** scope. Build tools execute in CI too. The action's GA `allow-licenses` gate is the baseline; enterprise license policy can supplement it after availability and release-status validation.

### Why

Rejecting vulnerable dependencies before merge avoids a later emergency change. This supports **INT-PCI-6.3**, **US-NYDFS-500.8**, and SSDF **PW.4**; license review supports **US-FFIEC-DAM** acquisition governance.

### How

**Policy payload:** use this dependency-review workflow with the scanner ruleset above and [Part 3's central gate recipe](/blog/github-waf-financial-services/change-control/#required-status-checks-and-merge-queue). See [Enforcing dependency review across an organization](https://docs.github.com/en/code-security/how-tos/secure-at-scale/configure-organization-security/configure-specific-tools/enforce-dependency-review).

```yaml
# my-bank/security-workflows/.github/workflows/dependency-review.yml
name: Dependency review
on:
  pull_request:
permissions:
  contents: read
  pull-requests: write
jobs:
  dependency-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332 # v4.1.7
      - uses: actions/dependency-review-action@3c4e3dcb1aa7874d2c16be7d79418e9b7efd6261 # v4.8.2
        with:
          fail-on-severity: high
          fail-on-scopes: runtime, development, unknown
          allow-licenses: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC
          show-openssf-scorecard: true
          warn-on-openssf-scorecard-level: 3
          comment-summary-in-pr: on-failure
```

Use `allow-licenses`; `deny-licenses` is **deprecated** ([action README](https://github.com/actions/dependency-review-action)).

The SHA was checked against [upstream v4.8.2](https://github.com/actions/dependency-review-action/releases/tag/v4.8.2) on November 6, 2026; obtain institution approval before use. Pin the workflow, internal configuration, and actions under Part 3's central gate contract.

**Scorecard warns; it does not gate.** Intake requires score **3 or higher** plus maintainer/provenance review; lower or missing scores need a named AppSec owner's dated exception. An independent required check must bind that decision to the exact package/version. This snippet omits it; deploy and test it, including missing scores, before claiming enforcement.

**Enterprise license policy (GHEC, including data residency):** define allowed licenses under **Enterprise > Policies > License compliance**, and give exception approvers the **Enterprise Open-Source License Manager** role. Enforce with the "Require license compliance results before merging" rule (`license_compliance_scanning` in the API), which checks **direct and transitive** dependencies. Stage rollout with a custom property (inactive, evaluate, active). See [Configuring open source license policies](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/configure-license-policies).

### Verify

- Rule Insights shows dependency review and license results per PR.
- License exception approvals by the License Manager role are your exception register. Review them quarterly with legal.
- [Dependency review](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review) depends on graph completeness. Spot-check automatic dependency submission for build-resolved ecosystems.

## SBOMs: an inventory you can hand over

### What we do

We generate an **SPDX SBOM in the release build from the actual packaged artifact**, using an approved, pinned SBOM generator. The build records the source commit, resolved dependencies, generator version/configuration, and artifact digest. We attest that SBOM against the same shipped digest and archive both.

### Why

A release SBOM answers "are we affected?" without rebuilding history. It supports **INT-PCI-6.3** and WAF's [comprehensive-inventory principle](https://learn.github.com/well-architected/library/application-security/design-principles/).

### How

The [dependency graph SBOM export](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/export-dependencies-as-sbom) and [SBOM API](https://docs.github.com/en/rest/dependency-graph/sboms) are **repository inventory snapshots**, not release-artifact evidence. The endpoint has no release-commit selector. Renaming a current snapshot `v1.4.2.spdx.json` does not bind it to that release.

Generate after packaging, inventory runtime components actually present, and preserve a separate build-tool/development inventory. Include containers, vendored binaries, generated assets, and package-manager resolution, not just manifest declarations. Attest the output using `sbom-path` in the next section. Validate coverage against the artifact before publication; incomplete generation blocks release.

### Verify

Every production release record includes the build-generated SBOM, its attestation, and the artifact digest. Quarterly, reproduce a sampled inventory from the archived artifact and compare it with the SBOM. Repository snapshots remain supplemental inventory evidence.

## Build provenance: artifact attestations and SLSA

### What we do

Every production artifact carries **build provenance and an SBOM attestation**. Critical builds use an isolated, SHA-pinned reusable workflow, with SLSA level assessed against the full build design. The **deployment target**, not repository-controlled YAML, enforces verification before accepting the artifact.

### Why

Linking the shipped binary to reviewed source supports SSDF **PS.2**, **EU-DORA-9**, and **US-FFIEC-DAM**. WAF's [SSDF guide](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) uses attestations and immutable releases.

Per [Artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations), GitHub documents an attested Actions build pattern for **SLSA v1.0 Build Level 2** and an isolated reusable-workflow pattern for **Level 3**. A reusable workflow alone is not a level certification: validate isolation, provenance, protected workflow inputs, and the remaining requirements. Private repositories use GitHub's Sigstore instance without a public transparency log; still classify and restrict access to retained build metadata.

An attestation links source and build instructions; it **does not guarantee artifact security**. Scanning and review remain necessary.

### How

```yaml
# Inside the shared, reusable build workflow
permissions:
  id-token: write
  contents: read
  attestations: write
steps:
  # ... build steps produce dist/payments-api.tar.gz and sbom.spdx.json
  - name: Attest build provenance
    uses: actions/attest@c32b4b8b198b65d0bd9d63490e847ff7b53989d4 # v4.0.0
    with:
      subject-path: 'dist/payments-api.tar.gz'
  - name: Attest SBOM
    uses: actions/attest@c32b4b8b198b65d0bd9d63490e847ff7b53989d4 # v4.0.0
    with:
      subject-path: 'dist/payments-api.tar.gz'
      sbom-path: 'sbom.spdx.json'
```

This is a build-workflow fragment, not a complete SBOM generator. The action reference was verified against [upstream attest v4.0.0](https://github.com/actions/attest/releases/tag/v4.0.0) on November 6, 2026. Institution approval and central/internal workflow SHAs remain deployment prerequisites.

Use CLI verification for diagnostics. `--signer-repo` restricts signer repository identity; it does **not** pin the workflow version or implement target enforcement:

```bash
gh attestation verify dist/payments-api.tar.gz \
  --owner my-bank \
  --signer-repo my-bank/build-workflows
```

**Target policy:** the platform-security-owned admission controller or deployment broker accepts only the exact approved artifact digest. It verifies provenance and SBOM signatures, expected issuer/source repository, approved workflow path and immutable commit, subject digest, and approved release/change record. Missing, invalid, stale, or mismatched evidence denies deployment. Application writers cannot edit or bypass that policy, and Actions OIDC roles have no direct production-write path around it. Use [attestation policy verification](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/enforce-artifact-attestations) appropriate to your platform. Deployment is not enabled until negative tests prove the target rejects artifacts after the repository verification step is removed.

Procedures: [Using artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations) and [Achieving SLSA v1 Build Level 3](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/increase-security-rating). Use [immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases) where available and GA. Otherwise, an access-controlled immutable artifact registry and digest-pinned release manifest provide the enforcing alternative.

**Consuming, not just producing:** the [dependency threats guide](https://learn.github.com/well-architected/library/application-security/recommendations/managing-dependency-threats/) recommends verifying provenance on what you pull in (for npm, `npm audit signatures` in CI) and preferring dependencies that publish attestations.

**GHES:** no artifact attestations. Use an external signing service or document compensating controls for a lower provenance level.

### Verify

- Archive the **target's allow/deny decision**, verified claims, policy version, artifact digest, SBOM, attestations, and approved change record per release. A deploy-job log alone is not enforcement evidence.
- [Linked artifacts](https://docs.github.com/en/code-security/concepts/supply-chain-security/linked-artifacts) connect build/deployment metadata and export provenance evidence.
- **Quarterly:** pick a production artifact at random and verify it end to end in front of your second line.

## Evidence: security overview is your audit binder

Security overview exposes **alert age, MTTR, net resolve rate, and introduced versus prevented** ([metric definitions](https://docs.github.com/en/code-security/reference/security-at-scale/overview-dashboard-metrics)). [Export CSVs](https://docs.github.com/en/code-security/how-tos/view-and-interpret-data/analyze-organization-data/export-data) from overview, risk, coverage, and PR views for second/third-line review.

Our monthly evidence pack:

| Artifact | Source | Answers |
|---|---|---|
| Coverage CSV | Security overview > Coverage | "Is everything in scope actually scanned?" |
| MTTR and alert age | Security overview > Overview | "Are you meeting your SLA?" |
| Introduced vs. prevented | Security overview > Overview (Prevention) | "Does enforcement work?" |
| SLA breach report | REST API script above | "Which findings are late, and who owns them?" |
| Dismissal and bypass log | Audit log stream + Rule Insights | "Who made exceptions, and were they approved?" |
| Campaign closeout snapshots | Campaigns view / campaigns REST API | "What's your plan for legacy debt?" |
| SBOMs and attestation verifications | Release records | "What's in production, and where did it come from?" |

These views reflect **default branches** and only show alerts from enabled features. An empty dashboard on an unscanned repo proves nothing, which is why the coverage CSV comes first.

**Archive, don't bookmark:** [Part 1](/blog/github-waf-financial-services/platform-foundation/#evidence-retention-and-integrity) owns record retention, integrity, access, and retrieval standards. This chapter's population includes all in-scope repositories and required tools, open and closed findings with first-detection history, dismissals/auto-dismissals, patch-release metadata, exceptions, campaigns, and every shipped component/provenance record. Capture scanner/check evidence **at merge** and artifact-bound SBOM/provenance evidence **at release/deployment**, not at the monthly export. Use [Part 6's collector contract](/blog/github-waf-financial-services/actions-hardening/#control-8-retention-logs-and-attestations-as-evidence) for hourly paginated backfill, seven-day overlap, durable cursors, retries, and idempotency.

Reconcile the complete population daily. Missing pages, tool results, patch metadata, or release evidence are findings, never proof of compliance. Missing required merge or artifact evidence blocks release; post-run collection gaps block subsequent releases under Part 6's archive-failure gate.

## Control matrix

| Control | Requirement IDs | GitHub feature | Evidence | Cadence |
|---|---|---|---|---|
| Code Security on all in-scope repos, enforced | US-NYDFS-500.8, INT-PCI-6.3, EU-DORA-9, CA-OSFI-B13 | Enterprise security configuration (enforced) + custom properties | Coverage CSV; `security_configuration.*` audit events | Monthly; continuous alerting |
| CodeQL + third-party SARIF scanning | INT-PCI-6.2, US-FFIEC-DAM, INT-NIST-SSDF (PW.7, PW.8) | Default/advanced setup, `upload-sarif` | Tool status; analyses per repo via API | Weekly |
| Merge protection on high-severity findings | INT-PCI-6.2, US-NYDFS-500.8, CA-AMF-ICT | Org ruleset `code_scanning` rule | Rule Insights; `repository_ruleset.*` events; bypass review | Monthly sample; quarterly bypass review |
| Risk-ranked triage with SLAs | INT-PCI-6.3, EU-DORA-RTS-PATCH, BR-CMN-4893, MX-CNBV-CUB | Alert metadata, custom properties, production context filters | SLA breach report; MTTR and alert age | Weekly report; monthly review |
| Approved dismissals only | INT-PCI-6.3, US-NYDFS-500.8, CL-CMF-20-10 | GA delegated dismissal or independent exception approval with restricted access | `code_scanning.alert_closure_*`, `repository_vulnerability_alert.dismiss`; exception register | Daily reconciliation; monthly review |
| Legacy debt burn-down | EU-DORA-RTS-PATCH, INT-PCI-6.3, INT-NIST-SSDF (RV.2) | Security campaigns + Copilot Autofix | Campaign snapshots at close | Quarterly |
| Dependency patching | INT-PCI-6.3, EU-DORA-RTS-PATCH, US-FFIEC-DAM | Dependabot alerts, security/version updates, auto-triage, malware alerts | Dependabot metrics; human-approved PR sample | Monthly; quarterly sample |
| Block vulnerable/non-compliant dependencies at PR | INT-PCI-6.3, US-NYDFS-500.8, INT-NIST-SSDF (PW.4) | Dependency review action (required workflow), license compliance ruleset | Rule Insights; license exception register | Per PR; quarterly |
| Component inventory | INT-PCI-6.3, US-FFIEC-DAM | Build-generated artifact SBOM and SBOM attestation; graph export supplemental | SBOM and shipped digest | Per release; quarterly sample |
| Build provenance and release integrity | INT-NIST-SSDF (PS.2), EU-DORA-9, US-FFIEC-DAM | Isolated reusable workflow, attestations, external target policy, immutable registry | Target verification decision; policy version and artifact digest | Per deploy; quarterly negative tests |
| Application threat modeling | INT-PCI-6.2, INT-NIST-SSDF (PW.1, PW.2) | Threat model + CODEOWNERS; GA testing baseline; preview scans supplemental | File history; owner attestation | Design time/significant change; annual attestation |
| Public web application protection (external dependency) | INT-PCI-6.4.2 | **Not GitHub:** institution WAF/runtime protection | WAF coverage, origin-bypass tests, protection configuration and logs | Continuous; per release coverage check |
| Board and leadership reporting | US-SEC-CYBER-2023, CA-OSFI-B13 | Security overview metrics | Monthly evidence pack | Monthly; quarterly to board |

## Summary and key takeaways

Buying scanners is easy. Operate a **closed loop** of coverage, merge blocking, risk-based SLAs, approved exceptions, and durable evidence.

**Your checklist:**

- [ ] Threat-model each Critical application before scanner setup; refresh on significant change.
- [ ] Consume Part 1's approved classification and prove complete, fail-closed scanner coverage.
- [ ] Enforce Code Security, default setup, Dependabot, and GA delegated dismissal or independent approval fallback.
- [ ] Stream `security_configuration.*`, `repository_ruleset.*`, and dismissal events to your SIEM.
- [ ] Upload third-party scanner results as SARIF, one `category` per tool.
- [ ] Deploy active rulesets covering Critical/High **and** PCI/SOX repositories, with verified central workflow SHAs. Timebox Evaluate separately.
- [ ] Publish an SLA table and automate a weekly breach report.
- [ ] Launch campaigns without extending the 7-day Critical/top-tier SLA.
- [ ] Standardize `dependabot.yml` with cooldown and grouping. No unreviewed auto-merge.
- [ ] Generate and attest an SBOM from the actual release artifact at build time.
- [ ] Enforce provenance and SBOM verification at the deployment target, outside application writers' control.
- [ ] Capture merge/release evidence on time; reconcile daily and block releases on required-evidence gaps.
- [ ] Hand the monthly evidence pack to your second line before the examiner asks.

**Previous:** [Part 4: Secrets Protection](/blog/github-waf-financial-services/secrets-protection/)
**Next:** [Part 6: CI/CD and GitHub Actions Hardening](/blog/github-waf-financial-services/actions-hardening/), where we lock down the pipeline that produces all those attestations.

## References

### Source note

**Verified November 6, 2026:** PCI DSS v4.0.1 **6.3.3, 6.4.2, and 10.5.1** were checked on printed pages **148, 152, and 252** of the [SSC-authored university-hosted copy](https://www.usu.edu/controllers/files/pci-dss-v4-0-1.pdf). The [official SSC library](https://www.pcisecuritystandards.org/document_library/) PDF returned HTTP 403. Before reliance, second line must retain the official licensed copy and verify integrity; checking a mirror does not verify publisher-copy integrity.

NYDFS **500.6(a)-(b)** was checked in the [official Part 500 PDF](https://www.dfs.ny.gov/system/files/documents/2026/10/NYCRR-part-500-Cybersecurity-Regulation_1.pdf), pages **8-9**, the same day. Apply its scope and exemptions using Part 1's record-type schedule, not blanket five-year retention.

### Further reading

Regulatory sources are linked in **The requirements**; implementation procedures sit beside their controls.

- [GitHub repository threat model](https://learn.github.com/well-architected/library/application-security/recommendations/threat-model/) for Part 1's platform assessment.
- [Custom properties best practices](https://learn.github.com/well-architected/library/governance/recommendations/managing-repositories-at-scale/custom-properties-best-practices/) for classification owners.
- [Enabling security features at scale](https://docs.github.com/en/code-security/concepts/security-at-scale/organization-security) for organization-wide rollout.
- [GitHub pre-release terms](https://docs.github.com/en/site-policy/github-terms/github-pre-release-license-terms) for preview evaluations.
