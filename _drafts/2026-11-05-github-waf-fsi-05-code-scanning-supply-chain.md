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

- **The risk:** Most of the code running in your payment, lending, and trading systems was written by someone you have never met. A single vulnerable or malicious package can sit in production for months unless something is actively looking for it.
- **Our position:** Scanning is table stakes. What examiners care about is **enforcement** (vulnerable code can't merge), **prioritization** (critical issues in critical systems get fixed first), and **timeliness** (fixes land inside a documented SLA).
- **What we deploy:** GitHub Code Security on every in-scope repository, applied centrally through enforced security configurations. Rulesets block merges on high-severity findings, and security campaigns burn down existing debt.
- **The evidence:** Security overview metrics (coverage, age of alerts, mean time to remediate), audit log events for every dismissal and configuration change, SBOM exports, and verifiable build provenance for what you ship.

---

Picture the opening meeting of an IT exam. The examiner slides a sheet across the table with three requests. Show me your inventory of third-party components in the card authorization service. Show me how you knew about the last critical library vulnerability, and when you fixed it. Show me that the binary in production was built from the code you reviewed.

If any answer starts with "well, each team handles that differently," you're about to have a long week.

GitHub can answer all three with data instead of anecdotes. The catch: "we bought GitHub Advanced Security" is not a control. A control is a setting that is **on everywhere it should be**, **can't be quietly turned off**, and **leaves evidence**.

## The requirements

Regulators rarely name tools. They ask for secure development, vulnerability management, and a component inventory. The full crosswalk lives in the [series overview](/blog/github-waf-financial-services/).

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
| INT-PCI-6.4 | [PCI DSS v4.0.1, Req. 6.4.1-6.4.2](https://www.pcisecuritystandards.org/document_library/) | Protect public-facing web apps with a WAF or app security testing, at least annually and after significant changes. |
| INT-NIST-SSDF | [NIST SP 800-218, SSDF v1.1](https://csrc.nist.gov/pubs/sp/800/218/final) | Reference practices: protect the software (PS), produce well-secured software (PW), respond to vulnerabilities (RV). |

Nobody says "use CodeQL." They say "find vulnerabilities, rank them, fix them, and prove it."

## Deployment model differences

Most of this part works the same everywhere. A few differences matter, mostly on GHES and around the newer AI-assisted features.

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

**GHES takeaway:** you get the scanning and enforcement core, but you'll build remediation workflows (campaign-style tracking, autofix) and build provenance yourself. Budget for that before your exam cycle, not during it.

## Coverage: GitHub Code Security everywhere it matters

### What we do

Every repository that touches production, customer data, or a regulated process gets **GitHub Code Security**. We apply it through an enterprise **security configuration** set to **"Enforce for repository and organization owners."** Nobody opts out at 4:55 on a Friday.

Naming note for procurement: GitHub Advanced Security is now sold as two products. **GitHub Secret Protection** is covered in [Part 4](/blog/github-waf-financial-services/secrets-protection/). **GitHub Code Security** covers code scanning, Copilot Autofix, AI Scan, security campaigns, custom Dependabot auto-triage rules, dependency review, and security overview. Dependency graph and Dependabot alerts are in all plans. See [About GitHub Advanced Security](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security).

### Why

You can't remediate what you never scanned, and coverage gaps invalidate everything else. This supports **US-NYDFS-500.8**, **INT-PCI-6.3**, **EU-DORA-9**, and SSDF **RV.1**. GitHub Well-Architected's [Enforce GHAS at scale](https://learn.github.com/well-architected/library/application-security/recommendations/enforce-ghas-at-scale/) recommends exactly this pattern: custom properties to classify repos, security configurations to enable features, and rulesets for supplemental enforcement.

### How

1. Create repository **custom properties** for classification. We use `business-criticality` (Critical, High, Medium, Low) and `compliance-frameworks` (multi-select: SOX, PCI-DSS, and so on), following [Custom properties best practices](https://learn.github.com/well-architected/library/governance/recommendations/managing-repositories-at-scale/custom-properties-best-practices/).
2. Build an enterprise configuration under **Enterprise settings > Advanced Security > Security configurations**. Enable Code Security, default setup, dependency graph, automatic dependency submission, Dependabot alerts, security updates, and **Prevent direct alert dismissals** for both code scanning and Dependabot. See [Creating a custom security configuration for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-at-scale/configure-enterprise-security/establish-complete-coverage/create-custom-configuration).
3. Pick **"Enabled with advanced setup allowed"** for default setup. It turns on default setup only where CodeQL isn't already running, so teams with tuned advanced workflows don't get clobbered.
4. Apply to **All repositories** and auto-apply to new private and internal repos. Configurations apply to archived repos too, so an unarchived repo comes back protected. See [Applying a custom security configuration to your enterprise](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-at-scale/configure-enterprise-security/establish-complete-coverage/apply-custom-configuration).

### Verify

- **Monthly:** export the **Coverage** view from [security overview](https://docs.github.com/en/code-security/concepts/security-at-scale/security-overview) as CSV. Any in-scope repo without scanning is a finding.
- **Continuously:** alert on `security_configuration.update`, `security_configuration.delete`, and `security_configuration_policy.update` from the [enterprise audit log](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise). Weakening the baseline should page someone.
- **Quarterly:** reconcile attachment status from the [security configurations API](https://docs.github.com/en/rest/code-security/configurations) against your application inventory.

## Code scanning: default setup first, advanced where it earns its keep

### What we do

**CodeQL default setup is the baseline** for every eligible repository. We move a repo to advanced setup only when there's a concrete reason: a custom build, a matrix, extra query packs, or a scan schedule the default can't express. Third-party SAST, container, and DAST tools upload **SARIF** so every finding lands in one queue.

### Why

**INT-PCI-6.2** expects review for common vulnerability classes before release. **US-FFIEC-DAM** and **US-NYDFS-500.8** expect documented, repeatable testing. The WAF [NIST SSDF implementation guide](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) maps **PW.7** (analyze code) and **PW.8** (test executables) here. PW.8 recommends running DAST and container scans in Actions and uploading SARIF, which also helps with **INT-PCI-6.4**.

The opinion: default setup is **low maintenance**, which in a regulated shop means **fewer silent failures**. Per [About setup types](https://docs.github.com/en/code-security/concepts/code-scanning/setup-types), it scans on pushes to default and protected branches, on PRs, and weekly. It picks up new languages and **reverts to the previous config if a change fails**. Hand-maintained workflows across 4,000 repos don't do that.

The old objection was compiled languages, which the WAF page flags as more likely to fail without proper build steps. That gap has narrowed: CodeQL now analyzes **C/C++, C#, Java, and Rust without a build** ([CodeQL for compiled languages](https://docs.github.com/en/code-security/concepts/code-scanning/codeql/codeql-for-compiled-languages)). A shared config file via the `github-codeql-config-file` repository property covers many cases that used to force advanced setup.

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
      - uses: actions/checkout@v6
      # Run your approved scanner here and write results.sarif
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v4
        with:
          sarif_file: results.sarif
          category: container-scanner
```

(Pin actions to full commit SHAs in production. [Part 6](/blog/github-waf-financial-services/actions-hardening/) covers why.)

**About AI Scan:** [AI Scan](https://docs.github.com/en/code-security/concepts/code-scanning/ai-scan) complements CodeQL. The pull request flavor covers languages CodeQL doesn't, such as PHP and Terraform HCL. The repository flavor is in **public preview**. Both bill as AI credits. Pilot it where you lack CodeQL coverage (IaC is a great candidate), and route it through your [Part 7](/blog/github-waf-financial-services/copilot-and-agents/) AI governance before calling it a primary control.

### Verify

- Use the **tool status page** per repo and the Coverage view in security overview to confirm scans are actually succeeding, not just "enabled."
- Query `GET /orgs/{org}/code-scanning/alerts` via the [code scanning REST API](https://docs.github.com/en/rest/code-scanning/code-scanning) and confirm each in-scope repo has recent analyses from every required tool.
- **Cadence:** coverage weekly (automated), tool inventory quarterly.

## Merge protection: findings block the merge, not the release

### What we do

An **organization ruleset** requires code scanning results on the default branch. It blocks merges when CodeQL reports **High or higher** security alerts or **Errors**. The same ruleset requires the central dependency review workflow and license compliance results. We target it by `business-criticality`, start in **Evaluate** mode, then flip to **Active**.

### Why

Detection without enforcement is a dashboard, not a control. **INT-PCI-6.2** expects issues caught before release, and **US-NYDFS-500.8** expects your procedure followed every time. The [WAF SSDF guide](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) recommends exactly this for **PW.7**: "Require code scanning results" with CodeQL at `High or higher`. The [dependency threats](https://learn.github.com/well-architected/library/application-security/recommendations/managing-dependency-threats/) checklist agrees.

### How

Org-level code scanning rules need a GitHub Enterprise plan. Per [Code scanning merge protection](https://docs.github.com/en/code-security/concepts/code-scanning/merge-protection), the rule blocks a PR when a required tool finds an alert at your threshold, **when analysis is still running, or when the tool isn't configured**. That last one matters: a repo that silently lost scanning can't merge.

Here's the org ruleset via the [REST API for rules](https://docs.github.com/en/rest/orgs/rules):

```json
{
  "name": "fsi-critical-merge-protection",
  "target": "branch",
  "enforcement": "evaluate",
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
          { "repository_id": 123456789, "path": ".github/workflows/dependency-review.yml", "ref": "refs/heads/main" }
        ]
      }
    },
    { "type": "license_compliance_scanning" }
  ],
  "bypass_actors": [
    { "actor_id": 4242, "actor_type": "Team", "bypass_mode": "pull_request" }
  ]
}
```

```bash
gh api --method POST /orgs/my-bank/rulesets --input fsi-critical-merge-protection.json
```

Opinions baked into that JSON:

- **Evaluate first.** Run two to four weeks and read Rule Insights before blocking anyone. You'll find the broken scans before developers do.
- **Bypass is a team, not a person,** and only via pull request. That team is your [Part 3](/blog/github-waf-financial-services/change-control/) emergency change path. Every bypass gets a ticket.
- **Know the limits.** Merge protection skips merge queue groups and Dependabot PRs analyzed by default setup, and alert lines must exist in the PR diff. Put that in your control narrative before an examiner finds it.

### Verify

- **Rule Insights** (and the rule suites API) give you a timeline of ruleset activity, including what would have failed while the ruleset was in Evaluate mode. See [Managing rulesets for a repository](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository).
- Alert on `repository_ruleset.update` and `repository_ruleset.destroy` in the audit log.
- **Monthly:** sample merged PRs into Critical repos and confirm a passing code scanning result existed for each. **Quarterly:** review every bypass against a change ticket.

## Triage, exceptions, and remediation SLAs

### What we do

Every alert gets a **priority from two inputs**: GitHub's metadata (severity, CWE, EPSS, scope, Autofix support) and our context (business criticality, internet exposure, regulatory scope). Each priority has an **SLA**. Dismissals require **approval from security**, not just a developer with write access.

### Why

**INT-PCI-6.3** expects risk-ranking. **EU-DORA-RTS-PATCH** expects a defined vulnerability and patch process. SSDF **RV.2** is the reference practice. WAF's [Prioritizing security alert remediation](https://learn.github.com/well-architected/library/application-security/recommendations/prioritizing-alerts/) gives the three steps we use: understand GitHub's metadata, add organizational context with custom properties, and target high-priority alerts with time-bound campaigns.

An SLA you don't measure is just a wish. Examiners will sample closed critical findings and compare the dates to your policy.

### How

**Start with an SLA table.** This is a starting point, not regulatory text. Your policy owns the numbers.

| Security severity | Critical or internet-facing repo, or PCI/SOX scope | All other in-scope repos |
|---|---|---|
| Critical | 7 days | 15 days |
| High | 30 days | 45 days |
| Medium | 90 days | 90 days |
| Low | 180 days or documented risk acceptance | 180 days or documented risk acceptance |

**Use production context to cut noise.** If you record build and deployment metadata as [linked artifacts](https://docs.github.com/en/code-security/concepts/supply-chain-security/linked-artifacts), you can filter alerts with `has:deployment`, `runtime-risk`, and `artifact-registry`. That way the SLA clock reflects what actually runs. See [Prioritizing alerts using production context](https://docs.github.com/en/code-security/tutorials/secure-your-organization/prioritize-alerts-in-production-code).

**Lock down dismissals.** With **Prevent direct alert dismissals** on, developers request a dismissal and security managers approve or deny it. Each step is audited (`code_scanning.alert_closure_requested`, `_approved`, `_denied`). See [delegated alert dismissal for code scanning](https://docs.github.com/en/code-security/how-tos/manage-security-alerts/manage-code-scanning-alerts/enable-delegated-alert-dismissal). The docs warn this adds friction, so staff the reviewer team first.

**Let Copilot Autofix write the first draft.** It's on by default for CodeQL repos, works on private and internal repos with Code Security (**including EMU**), and doesn't consume AI credits. **Agentic autofix** goes further and opens a draft PR, but isn't available for EMU-owned repos. See [About autofix for code scanning](https://docs.github.com/en/code-security/concepts/code-scanning/autofix-for-code-scanning). The docs say it plainly: **always review and test generated changes before merging.** Autofix PRs face the same review and rulesets as human PRs.

### Verify

Run an SLA breach report weekly and keep the output as evidence:

```bash
ORG=my-bank
DAYS=30
for SEV in critical high; do
  gh api --paginate "/orgs/$ORG/code-scanning/alerts?state=open&severity=$SEV&per_page=100" \
    --jq ".[] | select((now - (.created_at | fromdateiso8601)) > ($DAYS*86400))
          | [\"code-scanning\", .repository.full_name, .number, \"$SEV\", .created_at] | @tsv"
done

gh api --paginate "/orgs/$ORG/dependabot/alerts?state=open&severity=critical,high&scope=runtime&per_page=100" \
  --jq ".[] | select((now - (.created_at | fromdateiso8601)) > ($DAYS*86400))
        | [\"dependabot\", .repository.full_name, .number, .security_advisory.severity, .created_at] | @tsv"
```

Adjust `DAYS` per tier from your SLA table. Pair it with a monthly review of every dismissal (`code_scanning.alert_closed_by_user`, `repository_vulnerability_alert.dismiss`) to confirm each has a valid reason and an approver.

## Security campaigns: burning down the debt you already have

### What we do

New findings are handled by merge protection and SLAs. **Existing** debt is handled by **security campaigns**: time-boxed, scoped, owned, and tracked. We run one campaign per quarter per high-risk theme, such as "all critical SQL injection alerts in Critical repos, due in 30 days."

### Why

Every institution that turns on scanning for the first time finds a backlog. Examiners don't expect zero. They expect a **plan with dates** and evidence of progress. That maps to **EU-DORA-RTS-PATCH**, **INT-PCI-6.3**, and SSDF **RV.2**. The [WAF prioritization guide](https://learn.github.com/well-architected/library/application-security/recommendations/prioritizing-alerts/) recommends the same move: target Critical alerts that have Autofix support, plus custom property values that signal importance, within a fixed window.

### How

Per [About security campaigns](https://docs.github.com/en/code-security/concepts/security-at-scale/about-security-campaigns) and [Creating and managing security campaigns](https://docs.github.com/en/code-security/how-tos/manage-security-alerts/remediate-alerts-at-scale/creating-managing-security-campaigns):

- Build from a template or a filter. Filtering to `autofix:supported` alerts favors quick wins. Keep each campaign at **1,000 alerts or fewer**.
- Set a **due date** (your SLA, made visible) and **campaign managers**, who must be org owners or security managers.
- Turn on **"Create issues"** for code campaigns so each repo gets a tracking issue.
- Code campaigns cover default-branch alerts only. **Secret scanning** campaigns are in **public preview**.

### Verify

The **Campaigns** view in security overview tracks progress. Snapshot it at close (the [campaigns REST API](https://docs.github.com/en/rest/campaigns/campaigns) makes this scriptable) and file it with risk acceptances for anything left open. That one artifact answers "what's your plan for legacy findings?" better than any slide.

## Dependabot: alerts, security updates, and version updates

### What we do

- **Dependabot alerts** and **security updates** are on for every repo through the security configuration.
- **Version updates** are on for Critical and High repos through a standard `dependabot.yml`, with **grouping** and a **cooldown**.
- **Custom auto-triage rules** dismiss known noise and keep the queue honest.
- **Malware alerts** are enabled.
- **No auto-merge** of dependency updates without human review.

### Why

Third-party code is most of your attack surface. **INT-PCI-6.3** covers third-party components, **US-FFIEC-DAM** covers vendor-sourced code, and **EU-DORA-RTS-PATCH** requires a patch process. WAF's [dependency threats](https://learn.github.com/well-architected/library/application-security/recommendations/managing-dependency-threats/) guide makes the no-auto-merge case: compromised maintainers often ship malware as **patch releases** because those get the least scrutiny, and tests won't catch an intentional backdoor.

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

- **`cooldown`** holds version updates until a release has aged (the default is 3 days). We stretch it because brand-new releases are where hijacked packages show up. Cooldown **never delays security updates**.
- **`groups` with `applies-to`** means one thorough review instead of twenty skims. As WAF puts it: batch for efficiency, not reduced scrutiny.

**Auto-triage:** GitHub presets are available to everyone. **Custom** rules (by severity, package, CWE, and more) need Code Security. Auto-dismissals are logged as `repository_vulnerability_alert.auto_dismiss` and can be reopened. See [auto-triage rules](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-auto-triage-rules) and [security updates](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-security-updates).

**Malware:** Dependabot raises [malware alerts](https://docs.github.com/en/code-security/concepts/supply-chain-security/malware-alerts) for dependencies flagged as malicious. Be wary of the preset that auto-dismisses them. It exists for internal packages that share a name with a malicious public one, which is a **dependency confusion** smell. Fix that with scoped private registries, not dismissals.

**GHES note:** Dependabot updates need GitHub Connect and self-hosted runners, and only GitHub-reviewed advisories sync to the instance (hourly).

### Verify

- Security overview **Dependabot metrics** and the `GET /orgs/{org}/dependabot/alerts` [API](https://docs.github.com/en/rest/dependabot/alerts), which supports filtering by `severity`, `scope`, and `epss_percentage`.
- Audit log: `dependabot_alerts.disable` and `dependabot_security_updates.disable` should be rare events that someone explains.
- **Quarterly:** sample merged Dependabot PRs and confirm a human approved each one.

## Dependency review and license policy: guard the front door

### What we do

Every PR that changes a manifest runs the **dependency review action**, required org-wide through a ruleset. It fails on **High or Critical** vulnerabilities in **runtime** scope and warns on low OpenSSF Scorecard scores. For licensing, we use GitHub's **enterprise license compliance policy** on GHEC, enforced by rulesets, with the action's `allow-licenses` as a fallback.

### Why

Fixing a vulnerable dependency after release costs a change window. Rejecting it at the PR costs a comment. This is **INT-PCI-6.3** and **US-NYDFS-500.8** (testing externally developed software) applied as early as possible, plus SSDF **PW.4**. Licensing obligations fit naturally within **US-FFIEC-DAM**'s acquisition scope, and legal will thank you.

### How

**Central workflow:** host it in an `internal` repo, per [Enforce GHAS at scale](https://learn.github.com/well-architected/library/application-security/recommendations/enforce-ghas-at-scale/), and require it with the `workflows` rule above. See [Enforcing dependency review across an organization](https://docs.github.com/en/code-security/how-tos/secure-at-scale/configure-organization-security/configure-specific-tools/enforce-dependency-review).

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
      - uses: actions/checkout@v6
      - uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: high
          fail-on-scopes: runtime
          allow-licenses: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC
          show-openssf-scorecard: true
          warn-on-openssf-scorecard-level: 3
          comment-summary-in-pr: on-failure
```

One heads-up if you're copying older examples (including the one on the WAF page): the action's `deny-licenses` option is **deprecated**. Use `allow-licenses` instead, per the [dependency-review-action README](https://github.com/actions/dependency-review-action).

**Enterprise license policy (GHEC, including data residency):** define allowed licenses under **Enterprise > Policies > License compliance**, and give exception approvers the **Enterprise Open-Source License Manager** role. Enforce with the "Require license compliance results before merging" rule (`license_compliance_scanning` in the API), which checks **direct and transitive** dependencies. Stage rollout with a custom property (inactive, evaluate, active). See [Configuring open source license policies](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/configure-license-policies).

### Verify

- Rule Insights shows dependency review and license results per PR.
- License exception approvals by the License Manager role are your exception register. Review them quarterly with legal.
- The [dependency review concept page](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review) explains that results depend on the dependency graph. Spot-check that automatic dependency submission is working for ecosystems whose dependencies are resolved at build time, or the action has less to compare.

## SBOMs: an inventory you can hand over

### What we do

We export an **SPDX SBOM** from the dependency graph for every release of a Critical or PCI-scoped application. We store it alongside the release and attach a signed SBOM attestation for shipped artifacts.

### Why

**INT-PCI-6.3** calls for a component inventory. The next time a popular library goes sideways, everyone will ask "are we affected?" A per-release SBOM turns a three-day scramble into a query. The WAF [application security design principles](https://learn.github.com/well-architected/library/application-security/design-principles/) list "maintain a comprehensive inventory" as a Mature-level practice.

### How

Export from **Insights > Dependency graph > Export SBOM**, or from the API. See [Exporting a software bill of materials](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/export-dependencies-as-sbom) and the [SBOM REST endpoints](https://docs.github.com/en/rest/dependency-graph/sboms).

```bash
gh api /repos/my-bank/payments-api/dependency-graph/sbom --jq '.sbom' > payments-api-v1.4.2.spdx.json
```

The API also has asynchronous `generate-report` and `fetch-report` endpoints. To bind an SBOM to the exact artifact you shipped, generate it in the build and attest it with `actions/attest` and `sbom-path` (next section).

### Verify

Every production release record includes an SBOM or SBOM attestation; sample quarterly. On GHE.com, org and enterprise **dependency insights** are currently unavailable, so per-repo SBOMs carry the aggregate inventory.

## Build provenance: artifact attestations and SLSA

### What we do

Every artifact we deploy to production is built in GitHub Actions with an **artifact attestation**. Builds for Critical apps run in a **shared reusable workflow** to reach **SLSA v1.0 Build Level 3**. Deployment pipelines **verify the attestation** before release. Releases use **immutable releases** so tags and assets can't be swapped after the fact.

### Why

This is the "prove the binary came from the code you reviewed" question. It maps to SSDF **PS.2**, which the [WAF SSDF guide](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) implements with artifact attestations and immutable releases. It also supports **EU-DORA-9** (integrity) and **US-FFIEC-DAM**.

Per [Artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations), attestations alone give **SLSA v1.0 Build Level 2**. Building in an isolated reusable workflow gets you to **Build Level 3**. Private repos sign with GitHub's own Sigstore instance, which has **no public transparency log**, so build metadata stays off the internet.

Put this warning from the docs in your control narrative: an attestation is **not a guarantee that an artifact is secure**. It links you to source and build instructions. Scanning and review do the "secure" part.

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
    uses: actions/attest@v4
    with:
      subject-path: 'dist/payments-api.tar.gz'
  - name: Attest SBOM
    uses: actions/attest@v4
    with:
      subject-path: 'dist/payments-api.tar.gz'
      sbom-path: 'sbom.spdx.json'
```

Then gate deployment on verification. `--signer-repo` pins the attestation to your blessed build workflow repo:

```bash
gh attestation verify dist/payments-api.tar.gz \
  --owner my-bank \
  --signer-repo my-bank/build-workflows
```

Procedures: [Using artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations) and [Achieving SLSA v1 Build Level 3](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/increase-security-rating). Turn on [immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases) so release tags and assets are locked. That also generates a release attestation consumers can verify.

**Consuming, not just producing:** the [dependency threats guide](https://learn.github.com/well-architected/library/application-security/recommendations/managing-dependency-threats/) recommends verifying provenance on what you pull in (for npm, `npm audit signatures` in CI) and preferring dependencies that publish attestations.

**GHES:** no artifact attestations. Use an external signing service or document compensating controls for a lower provenance level.

### Verify

- The deploy job's verification step output is your per-release evidence. Fail closed.
- The **linked artifacts** page shows how each artifact was built and where it runs, and supports "exporting auditable proof of your artifacts' provenance and integrity" (see [About linked artifacts](https://docs.github.com/en/code-security/concepts/supply-chain-security/linked-artifacts)).
- **Quarterly:** pick a production artifact at random and verify it end to end in front of your second line.

## Threat modeling: decide what "bad" looks like first

### What we do

Every Critical application has a **threat model** stored in its repo, reviewed through CODEOWNERS, and updated at design time and on significant change. We also threat-model **the GitHub platform itself**, starting from GitHub's published model.

### Why

Scanners find known bug classes. Threat models find what scanners can't see, like a broken trust boundary. SSDF **PW.1** and **PW.2** cover design-time security, and **INT-PCI-6.4** keys testing to "significant changes," which a threat model helps define. The WAF [application security checklist](https://learn.github.com/well-architected/library/application-security/checklist/) calls for regular, cross-functional threat modeling kept current as threats change.

WAF also publishes a [threat model for GitHub repositories](https://learn.github.com/well-architected/library/application-security/recommendations/threat-model/), scoped to **source integrity** in the SLSA supply chain model. It walks four questions: what are we working on, what can go wrong, what will we do about it, and did we do a good enough job. It's a ready-made start for your platform risk assessment.

### How

- Keep `docs/threat-model.md` in each Critical repo, owned in CODEOWNERS by security.
- Feed it into scanning. CodeQL default setup supports **threat models (public preview)** that add local sources of tainted data, not just remote ones (Java/Kotlin and C# during the preview). Use it for batch and back-office apps. See [About setup types](https://docs.github.com/en/code-security/concepts/code-scanning/setup-types).
- Feed the WAF model's mitigations (T-07 and T-08 especially) into [Part 6](/blog/github-waf-financial-services/actions-hardening/).

### Verify

Annual owner attestation that the model is current, backed by the file's commit history. Missing or stale models are SDLC findings.

## Evidence: security overview is your audit binder

Security overview pulls the verify steps above into one place your second and third lines can self-serve. Per [Security overview dashboard metrics](https://docs.github.com/en/code-security/reference/security-at-scale/overview-dashboard-metrics), you get **age of alerts**, **mean time to remediate**, **net resolve rate**, and **introduced versus prevented** (the cleanest proof that merge protection works). You can [export CSVs](https://docs.github.com/en/code-security/how-tos/view-and-interpret-data/analyze-organization-data/export-data) from the overview, risk, coverage, and pull request views.

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

## Control matrix

| Control | Requirement IDs | GitHub feature | Evidence | Cadence |
|---|---|---|---|---|
| Code Security on all in-scope repos, enforced | US-NYDFS-500.8, INT-PCI-6.3, EU-DORA-9, CA-OSFI-B13 | Enterprise security configuration (enforced) + custom properties | Coverage CSV; `security_configuration.*` audit events | Monthly; continuous alerting |
| CodeQL + third-party SARIF scanning | INT-PCI-6.2, INT-PCI-6.4, US-FFIEC-DAM, INT-NIST-SSDF (PW.7, PW.8) | Default/advanced setup, `upload-sarif` | Tool status; analyses per repo via API | Weekly |
| Merge protection on high-severity findings | INT-PCI-6.2, US-NYDFS-500.8, CA-AMF-ICT | Org ruleset `code_scanning` rule | Rule Insights; `repository_ruleset.*` events; bypass review | Monthly sample; quarterly bypass review |
| Risk-ranked triage with SLAs | INT-PCI-6.3, EU-DORA-RTS-PATCH, BR-CMN-4893, MX-CNBV-CUB | Alert metadata, custom properties, production context filters | SLA breach report; MTTR and alert age | Weekly report; monthly review |
| Approved dismissals only | INT-PCI-6.3, US-NYDFS-500.8, CL-CMF-20-10 | Delegated alert dismissal (code scanning, Dependabot) | `code_scanning.alert_closure_*`, `repository_vulnerability_alert.dismiss` | Monthly |
| Legacy debt burn-down | EU-DORA-RTS-PATCH, INT-PCI-6.3, INT-NIST-SSDF (RV.2) | Security campaigns + Copilot Autofix | Campaign snapshots at close | Quarterly |
| Dependency patching | INT-PCI-6.3, EU-DORA-RTS-PATCH, US-FFIEC-DAM | Dependabot alerts, security/version updates, auto-triage, malware alerts | Dependabot metrics; human-approved PR sample | Monthly; quarterly sample |
| Block vulnerable/non-compliant dependencies at PR | INT-PCI-6.3, US-NYDFS-500.8, INT-NIST-SSDF (PW.4) | Dependency review action (required workflow), license compliance ruleset | Rule Insights; license exception register | Per PR; quarterly |
| Component inventory | INT-PCI-6.3, US-FFIEC-DAM | SBOM export, SBOM attestations | SBOM per release | Per release; quarterly sample |
| Build provenance and release integrity | INT-NIST-SSDF (PS.2), EU-DORA-9, US-FFIEC-DAM | Artifact attestations, reusable workflows (SLSA L3), immutable releases | `gh attestation verify` output; linked artifacts | Per deploy; quarterly end-to-end test |
| Threat modeling | INT-PCI-6.4, INT-NIST-SSDF (PW.1, PW.2) | Threat model in repo + CODEOWNERS; CodeQL threat models (preview) | File history; owner attestation | Annually and on significant change |
| Board and leadership reporting | US-SEC-CYBER-2023, CA-OSFI-B13 | Security overview metrics | Monthly evidence pack | Monthly; quarterly to board |

## Summary and key takeaways

Scanners are easy to buy and hard to operationalize. Institutions that do well in exams run a **closed loop**: enforced coverage, merge-time blocking, risk-based SLAs, approved exceptions, and evidence that rolls up without a spreadsheet marathon.

**Your checklist:**

- [ ] Classify repos with `business-criticality` and `compliance-frameworks` custom properties.
- [ ] Apply an enforced enterprise security configuration: Code Security, default setup, Dependabot, delegated dismissal.
- [ ] Stream `security_configuration.*`, `repository_ruleset.*`, and dismissal events to your SIEM.
- [ ] Upload third-party scanner results as SARIF, one `category` per tool.
- [ ] Deploy an org ruleset (Evaluate, then Active) for CodeQL, dependency review, and license compliance.
- [ ] Publish an SLA table and automate a weekly breach report.
- [ ] Launch a 30-day security campaign on Critical alerts in Critical repos.
- [ ] Standardize `dependabot.yml` with cooldown and grouping. No unreviewed auto-merge.
- [ ] Export and attest an SBOM per release.
- [ ] Build Critical apps in a reusable workflow with attestations, and verify before deploy.
- [ ] Keep a threat model per Critical app.
- [ ] Hand the monthly evidence pack to your second line before the examiner asks.

**Previous:** [Part 4: Secrets Protection](/blog/github-waf-financial-services/secrets-protection/)
**Next:** [Part 6: CI/CD and GitHub Actions Hardening](/blog/github-waf-financial-services/actions-hardening/), where we lock down the pipeline that produces all those attestations.

## References

### GitHub Well-Architected

- [Enforcing GitHub Advanced Security at scale](https://learn.github.com/well-architected/library/application-security/recommendations/enforce-ghas-at-scale/)
- [Managing dependency threats](https://learn.github.com/well-architected/library/application-security/recommendations/managing-dependency-threats/)
- [Prioritizing security alert remediation](https://learn.github.com/well-architected/library/application-security/recommendations/prioritizing-alerts/)
- [Threat model for GitHub repositories](https://learn.github.com/well-architected/library/application-security/recommendations/threat-model/)
- [Application security checklist](https://learn.github.com/well-architected/library/application-security/checklist/)
- [Application security design principles](https://learn.github.com/well-architected/library/application-security/design-principles/)
- [NIST SSDF implementation](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/)
- [Custom properties best practices](https://learn.github.com/well-architected/library/governance/recommendations/managing-repositories-at-scale/custom-properties-best-practices/)

### GitHub Docs

- [About GitHub Advanced Security](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security)
- [About GitHub Advanced Security (GHES 3.22)](https://docs.github.com/en/enterprise-server@3.22/get-started/learning-about-github/about-github-advanced-security)
- [Enabling security features at scale](https://docs.github.com/en/code-security/concepts/security-at-scale/organization-security)
- [Creating a custom security configuration for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-at-scale/configure-enterprise-security/establish-complete-coverage/create-custom-configuration)
- [Applying a custom security configuration to your enterprise](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-at-scale/configure-enterprise-security/establish-complete-coverage/apply-custom-configuration)
- [REST API: security configurations](https://docs.github.com/en/rest/code-security/configurations)
- [About setup types for code scanning](https://docs.github.com/en/code-security/concepts/code-scanning/setup-types)
- [CodeQL for compiled languages](https://docs.github.com/en/code-security/concepts/code-scanning/codeql/codeql-for-compiled-languages)
- [Configuring advanced setup for code scanning with CodeQL at scale](https://docs.github.com/en/code-security/how-tos/secure-at-scale/configure-organization-security/configure-specific-tools/configuring-advanced-setup-for-code-scanning-with-codeql-at-scale)
- [Uploading a SARIF file to GitHub](https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/integrate-with-existing-tools/upload-sarif-file)
- [About AI Scan](https://docs.github.com/en/code-security/concepts/code-scanning/ai-scan)
- [Code scanning merge protection](https://docs.github.com/en/code-security/concepts/code-scanning/merge-protection)
- [REST API: organization rules](https://docs.github.com/en/rest/orgs/rules)
- [Managing rulesets for a repository (Rule Insights)](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository)
- [About autofix for code scanning](https://docs.github.com/en/code-security/concepts/code-scanning/autofix-for-code-scanning)
- [Enabling delegated alert dismissal for code scanning](https://docs.github.com/en/code-security/how-tos/manage-security-alerts/manage-code-scanning-alerts/enable-delegated-alert-dismissal)
- [REST API: code scanning](https://docs.github.com/en/rest/code-scanning/code-scanning)
- [About security campaigns](https://docs.github.com/en/code-security/concepts/security-at-scale/about-security-campaigns)
- [Creating and managing security campaigns](https://docs.github.com/en/code-security/how-tos/manage-security-alerts/remediate-alerts-at-scale/creating-managing-security-campaigns)
- [About linked artifacts](https://docs.github.com/en/code-security/concepts/supply-chain-security/linked-artifacts)
- [Prioritizing alerts using production context](https://docs.github.com/en/code-security/tutorials/secure-your-organization/prioritize-alerts-in-production-code)
- [Dependabot security updates](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-security-updates)
- [Dependabot options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)
- [Dependabot auto-triage rules](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-auto-triage-rules)
- [Dependabot malware alerts](https://docs.github.com/en/code-security/concepts/supply-chain-security/malware-alerts)
- [REST API: Dependabot alerts](https://docs.github.com/en/rest/dependabot/alerts)
- [Enabling Dependabot for your enterprise (GHES 3.22)](https://docs.github.com/en/enterprise-server@3.22/admin/configuring-settings/configuring-github-connect/enabling-dependabot-for-your-enterprise)
- [Dependency review](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review)
- [Enforcing dependency review across an organization](https://docs.github.com/en/code-security/how-tos/secure-at-scale/configure-organization-security/configure-specific-tools/enforce-dependency-review)
- [About open source license compliance](https://docs.github.com/en/code-security/concepts/supply-chain-security/open-source-license-compliance)
- [Configuring open source license policies](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/configure-license-policies)
- [Exporting a software bill of materials](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/export-dependencies-as-sbom)
- [REST API: SBOM](https://docs.github.com/en/rest/dependency-graph/sboms)
- [Artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations)
- [Using artifact attestations to establish provenance](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations)
- [Achieving SLSA v1 Build Level 3](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/increase-security-rating)
- [Immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases)
- [Security overview](https://docs.github.com/en/code-security/concepts/security-at-scale/security-overview)
- [Security overview dashboard metrics](https://docs.github.com/en/code-security/reference/security-at-scale/overview-dashboard-metrics)
- [Exporting data from security overview](https://docs.github.com/en/code-security/how-tos/view-and-interpret-data/analyze-organization-data/export-data)
- [Audit log events for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise)
- [Feature overview for GHE.com](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency)
- [actions/dependency-review-action](https://github.com/actions/dependency-review-action)

### Regulatory sources

- [FFIEC IT Examination Handbook: Development, Acquisition, and Maintenance](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance)
- [NYDFS 23 NYCRR Part 500](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500)
- [SEC Cybersecurity Risk Management, Strategy, Governance, and Incident Disclosure](https://www.federalregister.gov/documents/2023/08/04/2023-16194/cybersecurity-risk-management-strategy-governance-and-incident-disclosure)
- [OSFI Guideline B-13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management)
- [AMF Guideline on ICT Risk Management](https://lautorite.qc.ca/en/professionals/insurers/guidelines/operational-risk/guideline-on-information-and-communications-technology-risk-management)
- [CMN Resolution 4,893/2021 (Brazil)](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf)
- [CNBV Circular Única de Bancos (Mexico)](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf)
- [CMF RAN Chapter 20-10 (Chile)](https://www.cmfchile.cl/portal/normativa/624/articles-29310_doc_pdf.pdf)
- [DORA, Regulation (EU) 2022/2554](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9)
- [Commission Delegated Regulation (EU) 2024/1774](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774)
- [PCI DSS v4.0.1 (document library)](https://www.pcisecuritystandards.org/document_library/)
- [NIST SP 800-218, SSDF v1.1](https://csrc.nist.gov/pubs/sp/800/218/final)
