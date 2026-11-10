---
layout: post
title: "GitHub Well-Architected for Financial Services, Part 5: Code Scanning and Software Supply Chain"
date: 2026-11-10 10:05:00 -0600
category: Blog
tags: [github, well-architected, financial-services, compliance, security, governance, code-scanning, supply-chain, dependabot, sbom]
excerpt: "Apply GitHub Well-Architected to secure banking software and shared dependencies through fast developer feedback, accountable risk-based remediation, enforced release controls, and artifact-bound evidence."
permalink: /blog/github-waf-financial-services/code-scanning-supply-chain/
---

*This post is part of the [GitHub Well-Architected for Financial Services](/blog/github-waf-financial-services/) series.*

**Previous:** [Part 4: Secrets Protection](/blog/github-waf-financial-services/secrets-protection/) | **Next:** [Part 6: CI/CD and GitHub Actions Hardening](/blog/github-waf-financial-services/actions-hardening/)

{::options toc_levels="2" /}

**In this post**

* Contents
{:toc}

> **A friendly note:** This information is meant to be guidance to help navigate a complex topic. Please validate these patterns with your compliance and/or regulatory reporting team(s).

## Leadership brief

- **Why it matters:** A weakness in one shared software component can expose several customer services. Finding it is not the same as fixing it.
- **Your decision:** Set security coverage expectations and risk-based repair deadlines, and fund the engineering capacity to meet them.
- **Accountability:** Security prioritizes risk; service owners deliver and verify repairs. Unresolved risks need an accountable decision, not an unattended alert.
- **Ask for:** Which critical services remain exposed, whether repairs met agreed deadlines, and evidence that fixes reached the affected production systems.

---

A shared authentication library has a new vulnerability. It appears in the mobile banking API, a payments adapter, and the infrastructure team's deployment utility. Three repositories, three owners, one patch that can break token validation.

The useful question is not "how many alerts did we close?" We need to know which deployed services are affected, who owns the library fix and consumer upgrades, and how to prove the replacement reached production.

This is where WAF becomes an operating model. Put feedback beside the pull request, standardize supported scanning, and connect findings to accountable remediation and release records. Buying another dashboard will not decide who patches the shared library.

## Apply the five WAF pillars to secure delivery

| Pillar | Application in a financial institution | Evidence of a useful outcome |
|---|---|---|
| **Governance** | Classify repositories; set gate thresholds, remediation policy, and exception authority | Reconciled scope, decision records, and overdue risk ownership |
| **Architecture** | Model trust boundaries; inventory shared components and actual release artifacts | Threat models, consumer maps, artifact-bound SBOMs and provenance |
| **Application Security** | Combine SAST, dependency review, and appropriate runtime testing | Successful required analyses and tested merge/deployment denial |
| **Collaboration** | Route findings to service owners and coordinate shared fixes with maintainers | Accepted work items, linked consumer PRs, independently reviewed exceptions |
| **Productivity** | Return actionable PR feedback and maintain low-friction scanner templates | Feedback latency, actionable-finding rate, and reduced repeat failures |

**Separate two contracts.** Required coverage, thresholds, approved exceptions, and remediation deadlines are mandatory institutional policy. Feedback latency and triage response targets are engineering service objectives. Improve the service without weakening the gate.

For example, target actionable PR feedback within ten minutes for a representative banking API. A slower scan is a platform service problem; a missing required scan remains a blocked merge. The target is illustrative, not a GitHub guarantee or regulatory deadline.

## The requirements

Regulators rarely name tools. They ask for secure development, vulnerability management, and a component inventory. The full crosswalk lives in the [series overview](/blog/github-waf-financial-services/).

**Applicability:** [Part 1's deployment baseline](/blog/github-waf-financial-services/platform-foundation/#choosing-your-deployment-model) defaults to **GHEC with data residency, including EMU**; GHES comparisons use **3.22**. Use its [centrally approved classification](/blog/github-waf-financial-services/platform-foundation/#data-classification-with-custom-properties) for scanner targeting. Missing classification blocks release.

**Reliance limits:** mappings **contribute to**, not satisfy, requirements. Second line validates applicability, design, operating evidence, and compensating controls. Follow [Part 1's GA production baseline](/blog/github-waf-financial-services/platform-foundation/#feature-availability-and-preview-controls): preview capabilities are excluded from production, including supplemental scans. Local availability gaps below still apply.

| ID | Regulation and citation | What it asks for (paraphrase) |
|---|---|---|
| [US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance) | [FFIEC IT Handbook, Development, Acquisition, and Maintenance](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance) | Govern building, buying, and maintaining software, including vendor-sourced code and QA. |
| [US-NYDFS-500.8](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | [23 NYCRR 500.8, Application Security](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Written procedures for secure in-house development and for testing externally developed software. |
| [US-SEC-CYBER-2023](https://www.federalregister.gov/documents/2023/08/04/2023-16194/cybersecurity-risk-management-strategy-governance-and-incident-disclosure) | [SEC cybersecurity disclosure rule (Release 33-11216)](https://www.federalregister.gov/documents/2023/08/04/2023-16194/cybersecurity-risk-management-strategy-governance-and-incident-disclosure) | Annual disclosure of cyber risk management and governance, which drives board reporting on supply chain risk. |
| [CA-OSFI-B13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | [OSFI Guideline B-13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | Risk-based management of technology and cyber risk. |
| [CA-AMF-ICT](https://lautorite.qc.ca/en/professionals/insurers/guidelines/operational-risk/guideline-on-information-and-communications-technology-risk-management) | [AMF ICT Risk Management Guideline](https://lautorite.qc.ca/en/professionals/insurers/guidelines/operational-risk/guideline-on-information-and-communications-technology-risk-management) | Quebec's analogue to [B-13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management): ICT governance, risk lifecycle, documentation. |
| [BR-CMN-4893](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf) | [CMN Resolution 4,893/2021 (Brazil)](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf) | A formal cybersecurity policy, which your vulnerability process implements. |
| [MX-CNBV-CUB](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) | [CNBV Circular Única de Bancos (Mexico)](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) | Technology-risk and information-security provisions for banks. |
| [CL-CMF-20-10](https://www.cmfchile.cl/portal/normativa/624/articles-29310_doc_pdf.pdf) | [CMF RAN Chapter 20-10 (Chile)](https://www.cmfchile.cl/portal/normativa/624/articles-29310_doc_pdf.pdf) | Minimum information-security and cybersecurity baseline for banks. |
| [EU-DORA-9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9) | [DORA Art. 9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9) | Continuous monitoring and security tools that protect integrity and confidentiality. |
| [EU-DORA-RTS-PATCH](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | [Delegated Regulation (EU) 2024/1774, Art. 10](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | Vulnerability identification and patch deployment processes. |
| [INT-PCI-6.2](https://www.pcisecuritystandards.org/document_library/) | [PCI DSS v4.0.1, Req. 6.2.1-6.2.4](https://www.pcisecuritystandards.org/document_library/) | Secure-coding standards, training, and code review before release. |
| [INT-PCI-6.3](https://www.pcisecuritystandards.org/document_library/) | [PCI DSS v4.0.1, Req. 6.3.1-6.3.3](https://www.pcisecuritystandards.org/document_library/) | Identify and risk-rank vulnerabilities in custom and third-party components; keep a component inventory. |
| [INT-PCI-6.4.2](https://www.pcisecuritystandards.org/document_library/) | [PCI DSS v4.0.1, Req. 6.4.2](https://www.pcisecuritystandards.org/document_library/) | An automated technical solution in front of public-facing web applications continually detects and prevents web-based attacks. This is an external runtime control, not GitHub scanning. |
| [INT-NIST-SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) | [NIST SP 800-218, SSDF v1.1](https://csrc.nist.gov/pubs/sp/800/218/final) | Reference practices: protect the software (PS), produce well-secured software (PW), respond to vulnerabilities (RV). |

**PCI boundary:** since March 31, 2025, annual application testing is not an alternative to **6.4.2**. The institution's external WAF control owns coverage, origin-bypass prevention, current protection, logs, and blocking or immediate investigation of alerts. AppSec owns SAST/DAST and secure-development evidence under **6.2/6.3**. Link each public application's release record to its WAF inventory entry and operating tests. A SARIF upload does not put protection in front of a web application.

## Deployment model differences

Check runner, scanner, remediation-tracking, and provenance availability before rollout. Do not design the operating model around a feature your deployment cannot use.

| Capability | GHEC (personal accounts) | GHEC with EMU | GHEC with data residency (GHE.com) | GHES |
|---|---|---|---|---|
| GitHub Code Security | Purchasable | Purchasable | Purchasable | Purchasable; required for **all** repos, including public |
| Code scanning runners | GitHub-hosted or self-hosted | Same | Same | **Self-hosted only** (no GitHub-hosted runners) |
| Optional Copilot Autofix suggestions | Yes | Yes | Not listed as unavailable | **Not in the GHES 3.22 Code Security feature list** |
| Security campaigns | Yes | Yes | Not listed as unavailable | Not in the GHES 3.22 feature list |
| Dependabot | Built in | Built in | Built in; org/enterprise **dependency insights unavailable** | Requires **GitHub Connect** and **self-hosted runners**; advisories sync hourly |
| Open source license compliance policy | Yes | Yes | Yes (explicitly supported) | Not available (GHEC feature) |
| Artifact attestations | Yes | Yes | Yes | **Not available** |
| Third-party scanners from Marketplace | Yes | Restricted install | Marketplace **unavailable**; install actions from source | Requires GitHub Connect / actions sync |

Sources: [About GitHub Advanced Security](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security), [GHES 3.22 Advanced Security features](https://docs.github.com/en/enterprise-server@3.22/get-started/learning-about-github/about-github-advanced-security), [About autofix for code scanning](https://docs.github.com/en/code-security/concepts/code-scanning/autofix-for-code-scanning), [Enabling Dependabot for GHES](https://docs.github.com/en/enterprise-server@3.22/admin/configuring-settings/configuring-github-connect/enabling-dependabot-for-your-enterprise), [GHE.com feature overview](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency), [About open source license compliance](https://docs.github.com/en/code-security/concepts/supply-chain-security/open-source-license-compliance).

**GHES takeaway:** budget for institution-owned remediation tracking and build provenance alongside the scanning/enforcement core. Human-reviewed fixes are the baseline on every deployment; assisted remediation is optional.

## Threat modeling: decide what "bad" looks like first

### What we do

Every Critical application has a **threat model** stored in its repo, reviewed through CODEOWNERS, and updated at design time and on significant change.

### Why

Scanners find known bug classes; threat models expose design risks such as broken trust boundaries. SSDF **PW.1/PW.2** and PCI **6.2** support design-time security, not PCI **6.4.2** runtime protection. The WAF [application security checklist](https://learn.github.com/well-architected/library/application-security/checklist/) recommends regular, cross-functional modeling as threats change. [Part 1](/blog/github-waf-financial-services/platform-foundation/) owns the GitHub platform risk assessment.

### How

- Keep `docs/threat-model.md` in each Critical repo, with the service architect accountable and AppSec participating in CODEOWNERS review.
- For a payment initiation API, model authorization, replay, signing, downstream settlement calls, and privileged deployment changes. For an infrastructure module, model who can change network policy and assume deployment roles.
- Assign each design risk to a test, control, or independently accepted gap. A scanner cannot prove that the correct customer authorized a payment.
- Translate design risks into GA scanner coverage and tests. CodeQL default setup's **threat models (public preview)** are excluded from production. See [About setup types](https://docs.github.com/en/code-security/concepts/code-scanning/setup-types) for configuration boundaries.
- Keep a reviewed design model and GA scanner configuration as the baseline. Cover identified gaps with supported GA scanners, explicit tests, and independent review. If mandatory coverage cannot be achieved, block the affected release rather than enable preview scanning.

### Verify

At significant change and at least annually, the owner demonstrates that the model is current using commit history and linked tests/control decisions. Missing or stale models are SDLC findings. Review a new settlement route before implementation, not only at the annual attestation.

## Coverage: GitHub Code Security everywhere it matters

### What we do

Every repository touching production, customer data, or regulated processes gets **GitHub Code Security**, through an enterprise configuration set to **"Enforce for repository and organization owners."**

**Procurement:** Advanced Security comprises **Secret Protection** ([Part 4](/blog/github-waf-financial-services/secrets-protection/)) and **Code Security** (code scanning and related remediation/supply-chain capabilities). Dependency graph and Dependabot alerts are in all plans. Validate entitlement and deployment availability for each selected capability using [product coverage](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security).

### Why

Coverage supports **[US-NYDFS-500.8](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500)**, **[INT-PCI-6.3](https://www.pcisecuritystandards.org/document_library/)**, **[EU-DORA-9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9)**, and SSDF **RV.1**. WAF's [Enforce GHAS at scale](https://learn.github.com/well-architected/library/application-security/recommendations/enforce-ghas-at-scale/) combines classification, security configurations, and supplemental rulesets.

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

Repeatable testing supports **[INT-PCI-6.2](https://www.pcisecuritystandards.org/document_library/)**, **[US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance)**, and **[US-NYDFS-500.8](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500)**. WAF's [SSDF guide](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) maps code analysis to **PW.7** and executable testing to **PW.8**. Neither DAST nor container scans replace PCI **6.4.2** runtime protection.

Default setup reduces maintenance: it scans default/protected branch pushes, PRs, and weekly, adds new languages, and **reverts failed configuration changes**. See [setup types](https://docs.github.com/en/code-security/concepts/code-scanning/setup-types).

CodeQL supports **C/C++, C#, Java, and Rust without a build** ([compiled-language coverage](https://docs.github.com/en/code-security/concepts/code-scanning/codeql/codeql-for-compiled-languages)). The `github-codeql-config-file` property supplies shared configuration without forcing advanced setup.

### How

- **Default setup:** handled by the security configuration above. On GHES, label self-hosted runners `code-scanning` so default setup has somewhere to run.
- **Advanced setup at scale:** platform engineering owns tested workflows by build pattern, controlled rollout, upgrade support, and coverage reconciliation. Use [Configuring advanced setup for code scanning with CodeQL at scale](https://docs.github.com/en/code-security/how-tos/secure-at-scale/configure-organization-security/configure-specific-tools/configuring-advanced-setup-for-code-scanning-with-codeql-at-scale) for supported implementation options.
- **Third-party tools:** upload SARIF with `github/codeql-action/upload-sarif`, and set a `category` per tool so results don't overwrite each other. See [Uploading a SARIF file to GitHub](https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/integrate-with-existing-tools/upload-sarif-file).

For each approved third-party scanner, inspect the supported repository/language coverage, triggering events, runner boundary, permissions, result format, and upload category. The [code scanning API](https://docs.github.com/en/rest/code-scanning/code-scanning) exposes analyses, SARIF processing status, and alerts. Retain analysis identity, tool/category, source revision, completion status, and resulting findings. A missing or failed upload must remain a coverage failure, not a clean scan.

**Execution prerequisites:** approve scanners and immutable action/workflow versions under [Part 6's operating model](/blog/github-waf-financial-services/actions-hardening/). Use runners with authorized static egress in IP-allowlisted organizations; standard hosted execution requires the separate approved deployment exception.

**Additional detection:** [AI Scan](https://docs.github.com/en/code-security/concepts/code-scanning/ai-scan) is not a prerequisite for this implementation. Do not enable it unless GA status, deployment support, terms, and institutional approval are verified. If it is preview for the selected deployment, exclude it from production. Meet required coverage with approved GA scanners and tests under [Part 1's GA production baseline](/blog/github-waf-financial-services/platform-foundation/#feature-availability-and-preview-controls).

### Verify

- Use the **tool status page** per repo and the Coverage view in security overview to confirm scans are actually succeeding, not just "enabled."
- Query `GET /orgs/{org}/code-scanning/alerts` via the [code scanning REST API](https://docs.github.com/en/rest/code-scanning/code-scanning) and confirm each in-scope repo has recent analyses from every required tool.
- **Cadence:** coverage weekly (automated), tool inventory quarterly.

## Make scanner feedback part of the developer workflow

### What we do

Offer tested scanner configurations for the institution's common workloads: banking APIs, web applications, infrastructure code, and packaged services. Return findings to the PR where possible and link every actionable result to an accountable service team.

### Why

Security feedback is most useful while the author still remembers the change. A weekly spreadsheet of unassigned CWEs is technically information, in the same way a box of receipts is technically accounting.

Supported defaults reduce duplicated setup and inconsistent findings. They also let AppSec spend time on difficult risk decisions instead of debugging the same build configuration in twenty repositories.

### How

1. **Onboard by workload.** Record languages, build system, deployable components, required tools, runner needs, and owner/deputy. Unsupported languages or infrastructure formats require an approved alternative, not a green "enabled" badge.
2. **Make the finding actionable.** Include affected revision, location/data flow, risk explanation, reproducible test or safe validation steps, and the responsible team. Use GitHub's native results where supported; institution-owned ticket routing must preserve the alert identity.
3. **Keep one accountable work item.** Link related scanner findings and affected artifacts without deleting source records. Retain each first-detection timestamp and deadline; deduplication must not restart clocks.
4. **Give reviewers useful guidance.** Add a short security section to the PR template: changed trust boundary, dependency/licensing changes, tests, and outstanding exception IDs. The template prompts discussion; required checks enforce policy.
5. **Support the integrations.** Platform engineering owns failed analyses, template upgrades, and tool outages. Service teams own code fixes. AppSec resolves risk ranking, false positives, and exception decisions.

For the shared authentication library, the library maintainer owns the corrected release and migration notes. Each banking service owner owns adoption and regression tests. Platform engineering can group the work into a campaign, but a central issue marked "fixed" does not prove every deployed consumer upgraded.

### Verify

Sample a PR from each supported workload monthly. Can an author understand the finding, reach the right owner, reproduce the issue safely, and prove remediation? Confirm that scanner failures route to platform support rather than appearing as an empty vulnerability queue.

Track p50/p95 time to actionable feedback, unowned findings, repeat false-positive causes, and reopened fixes. A suggested one-business-day triage acknowledgement objective is a service measure, not permission to delay an urgent production finding.

## Merge protection: findings block the merge, not the release

### What we do

An **active organization ruleset** requires code scanning results on the default branch. It blocks merges when CodeQL reports **High or higher** security alerts or **Errors**. A central dependency review workflow also gates merges. Coverage includes Critical/High repositories **and every PCI/SOX repository**, even one rated Low.

### Why

Enforcement supports **[INT-PCI-6.2](https://www.pcisecuritystandards.org/document_library/)**, **[US-NYDFS-500.8](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500)**, and SSDF **PW.7**. WAF's [SSDF guide](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) and [dependency checklist](https://learn.github.com/well-architected/library/application-security/recommendations/managing-dependency-threats/) recommend required scanning at `High or higher`.

### How

Org-level rules need GitHub Enterprise. [Merge protection](https://docs.github.com/en/code-security/concepts/code-scanning/merge-protection) blocks threshold findings, **unfinished analysis, and missing tool configuration**. Losing scanning must not open the merge gate.

Manage scanner-specific requirements through the [REST API for rules](https://docs.github.com/en/rest/orgs/rules) and [Part 3's central gate design](/blog/github-waf-financial-services/change-control/#required-status-checks-and-merge-queue). Verify effective scope, active enforcement, required tools, severity thresholds, exception authority, and the approved immutable central workflow identity.

| Scanner policy element | What to establish |
|---|---|
| Target population | Critical/High repositories plus every repository in applicable PCI/SOX scope |
| Enforcement | Active rules on protected default/release branches; no silent exclusions |
| Required tools | Approved CodeQL and applicable third-party analyses complete successfully on the reviewed revision |
| Finding thresholds | The adopted alert/security severity thresholds block qualifying findings |
| Dependency gate | The approved immutable central dependency-review workflow is required |
| Exceptions | Only independently approved, time-bound PR bypass; capture the affected tool and findings |

**Scope is a union.** Create a second active ruleset with identical rules, including only `compliance-frameworks: ["PCI-DSS", "SOX"]`. Keep `business-criticality` in the first ruleset; another property in its include array does not establish OR. Reconcile the union against the approved inventory, including Medium/Low PCI/SOX test repos.

Reject missing workflow identities and mutable internal references during policy validation. [Part 3](/blog/github-waf-financial-services/change-control/#required-status-checks-and-merge-queue) defines central workflow approval and pinning.

Scanner-specific boundaries:

- **Pilot acceptance:** prove required-tool failures and the full Critical/High plus PCI/SOX union block merges before activation. Use [Part 3's Evaluate lifecycle](/blog/github-waf-financial-services/change-control/#roll-out-with-evaluate-mode-and-rule-insights), not Evaluate as enforcement.
- **Scanner exceptions:** authorized PR-only bypass uses [Part 3's audited bypass lifecycle](/blog/github-waf-financial-services/change-control/#bypass-lists-who-why-and-how-it-is-audited). Retain the affected tool, findings, and security acceptance with the ticket.
- **Coverage limits:** merge protection skips merge queue groups and Dependabot PRs analyzed by default setup; alert lines must exist in the PR diff. Record these gaps in the control narrative.
- **License enforcement:** use the required workflow's GA `allow-licenses` gate. Add enterprise license-compliance rules only after verifying GA status, availability, and institutional approval. Preview rules are excluded from production.

### Verify

- **Rule Insights** and the rule suites API show rule activity and Evaluate-mode failures. See [Managing rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository).
- Alert on `repository_ruleset.update` and `repository_ruleset.destroy` in the audit log.
- **At merge:** archive check suites, check runs, statuses, rule evaluations, reviewed head SHA, scanner/workflow identity, and bypass approvals under [Part 1's evidence standard](/blog/github-waf-financial-services/platform-foundation/#evidence-retention-and-integrity). Reconcile completeness daily; missing merge evidence blocks release.
- **Monthly:** sample Critical/High and PCI/SOX merges, including Low-tier PCI/SOX repos, against the archive. **Quarterly:** review every bypass against a change ticket.

## Triage, exceptions, and remediation SLAs

### What we do

Prioritize using GitHub metadata (**severity, CWE, EPSS where available, dependency scope**) and institution context (**criticality, internet exposure, regulatory scope, affected deployed artifact**). Assign an owner and deadline; dismissals require independent security approval. Ease of fixing is a planning input, not a risk ranking.

### Why

Risk ranking and measured remediation support **[INT-PCI-6.3](https://www.pcisecuritystandards.org/document_library/)**, **[EU-DORA-RTS-PATCH](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774)**, and SSDF **RV.2**. WAF's [prioritization guide](https://learn.github.com/well-architected/library/application-security/recommendations/prioritizing-alerts/) combines alert metadata, approved properties, and time-bound campaigns.

### How

**Start with an SLA table.** This is a starting point, not regulatory text. Your policy owns the numbers.

**Ownership comes before sorting.** Route application findings to the service owner, shared-library defects to the maintainer plus affected consumers, and scanner failures to platform engineering. AppSec confirms disputed risk decisions; it does not become the default developer for every repository.

Assess credible exploitation, reachability, available fixes, and compensating controls. An exploited internet-facing dependency needs immediate incident assessment even if its severity label is not Critical. A development dependency may execute during a privileged build, so "not runtime" is not a dismissal reason.

**Example:** a vulnerable parser in the payments API gets a service-owned patch and regression test. The same package in a restricted reconciliation tool may have different exposure, but its owner must document that assessment. Missing runtime context means uncertainty, not "unaffected."

| Security severity | Critical or internet-facing repo, or PCI/SOX scope | All other in-scope repos |
|---|---|---|
| Critical | 7 days | 15 days |
| High | 30 days | 45 days |
| Medium | 90 days | 90 days |
| Low | 180 days or documented risk acceptance | 180 days or documented risk acceptance |

**Keep two clocks:** the institution's finding SLA starts at first detection, without resetting on re-export, dismissal, or reopening. PCI **6.3.3** requires applicable patches for **critical vulnerabilities, risk-ranked under 6.3.1**, within one month of release. Other patches follow the institution's risk-assessed timeframe. Our policy also applies the one-month cap to High dependency findings in PCI scope, a stricter institution choice, not PCI's exact wording. Advisory publication is not automatically patch availability. Record the vendor's fixed version, applicable package, release date, and source URL. Missing patch metadata is an evidence gap, not permission to declare compliance.

**Production context:** [linked artifacts](https://docs.github.com/en/code-security/concepts/supply-chain-security/linked-artifacts) enable `has:deployment`, `runtime-risk`, and `artifact-registry` filters. Use them to prioritize, not reset clocks or exclude build dependencies. See [production-context triage](https://docs.github.com/en/code-security/tutorials/secure-your-organization/prioritize-alerts-in-production-code).

**Dismissals:** GA **Prevent direct alert dismissals** routes requests to security managers ([configuration](https://docs.github.com/en/code-security/how-tos/manage-security-alerts/manage-code-scanning-alerts/enable-delegated-alert-dismissal)). If unavailable or preview, restrict dismissal access, require independent exception-system approval, and reconcile every API/audit dismissal daily. Preview approval alone is not enforcement.

**Optional assisted fix:** [Copilot Autofix](https://docs.github.com/en/code-security/concepts/code-scanning/autofix-for-code-scanning) can suggest CodeQL remediations on supported Code Security repositories, including EMU. Review and test suggestions under normal change controls; a generated patch neither changes ownership nor proves a fix. Agent execution and its distinct governance belong in [Part 7](/blog/github-waf-financial-services/copilot-and-agents/).

**Close the loop:** tie the fix to a reviewed revision and successful re-analysis, then establish which release/artifact contains it and whether affected production consumers deployed it. Record code remediation and deployment completion separately. For dependencies without a patch, record interim mitigation, residual risk, independent approval, expiry, and reassessment triggers. Risk acceptance must remain visible alongside raw SLA breaches.

### Verify

The enterprise vulnerability-management service should assess **all severities, dependency scopes, and open/closed findings** weekly. Combine the [code scanning API](https://docs.github.com/en/rest/code-scanning/code-scanning), [Dependabot alerts API](https://docs.github.com/en/rest/dependabot/alerts), approved repository properties, vendor patch records, and verified remediation/release evidence.

| Information | Required assessment |
|---|---|
| Population and classification | Reconciled repositories, business criticality, regulatory scope, internet exposure, and independent classification approval |
| Finding identity and timing | Stable alert/repository IDs, source, normalized severity, and original first-detection time; preserve closed/reopened history |
| Institutional deadline | Apply the earlier table's risk-tiered deadline, including Critical, internet-facing, and PCI/SOX treatment |
| PCI patch applicability | Record institution-assigned patch risk ranking, applicable package/fixed version, verified availability date, and vendor source |
| Patch deadline | For applicable PCI critical patches, and High dependency findings under this institution's stricter policy, apply a calendar-month cap from patch availability; use the earlier applicable deadline |
| Verified repair | Record when the fix was verified, which release/artifact contains it, and which affected production consumers deployed it |
| Reporting result | Show raw finding-SLA breaches, patch-deadline breaches, evidence gaps, approved exceptions, and the accountable owner separately |
| Collection quality | Missing inventory, unapproved classification, unsupported severity/source, absent PCI ranking, or failed collection prevents a complete compliance conclusion |

**Illustrative assessment:** a critical finding in a Low-criticality repository that is in PCI scope still has the institution's **seven-day** finding deadline. Low criticality does not remove regulatory scope. An open finding first detected October 25 and assessed November 6 is overdue; the report must not reset its age because it was re-exported.

The reporting service must:

- Paginate both alert APIs; retain first detection and closed findings; join approved properties and independently verified patch metadata.
- Retain the institution's PCI patch-criticality decision, fixed version, applicable patch availability date, and vendor source.
- Report population completeness only after full inventory reconciliation. Empty inventory, unknown classification, missing repositories, or absent PCI ranking blocks compliance sign-off.
- Treat patch gaps as findings even before SLA expiry. Dismissals and risk acceptances never change raw breach results.

## Security campaigns: burning down the debt you already have

### What we do

Use scoped, owned **security campaigns** for existing debt. Organize around a shared root cause, package migration, or service cohort, not just a large alert count. Campaigns never extend alert SLAs: Critical findings in Critical repos still have **7 days**.

### Why

A dated remediation plan supports **[EU-DORA-RTS-PATCH](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774)**, **[INT-PCI-6.3](https://www.pcisecuritystandards.org/document_library/)**, and SSDF **RV.2**. WAF's [prioritization guide](https://learn.github.com/well-architected/library/application-security/recommendations/prioritizing-alerts/) combines finding metadata with institutional context. Favor the highest risk; easy fixes can be a separate workstream.

### How

Per [About security campaigns](https://docs.github.com/en/code-security/concepts/security-at-scale/about-security-campaigns) and [Creating and managing security campaigns](https://docs.github.com/en/code-security/how-tos/manage-security-alerts/remediate-alerts-at-scale/creating-managing-security-campaigns):

- Build from a template or a risk-based filter. For example, group the shared authentication library's affected banking services with named consumer owners and compatible test plans. Keep each campaign at **1,000 alerts or fewer**.
- Set a **due date** (your SLA, made visible) and **campaign managers**, who must be org owners or security managers.
- Turn on **"Create issues"** for code campaigns so each repo gets a tracking issue.
- Code campaigns cover default-branch alerts only. **Secret scanning** campaigns are in **public preview** and excluded from production; track those findings in institution-owned issues or incident records.

### Verify

At close, snapshot the **Campaigns** view or [API](https://docs.github.com/en/rest/campaigns/campaigns) and retain risk acceptances for remaining findings. Check adoption in affected release records, not only issue completion. Reserve team capacity for recurring dependency maintenance so every update does not require an emergency campaign.

## Dependabot: alerts, security updates, and version updates

### What we do

- **Dependabot alerts** and **security updates** are on for every repo through the security configuration.
- **Version updates** are on for Critical and High repos through a standard `dependabot.yml`, with **grouping** and a **cooldown**.
- **Custom auto-triage rules** handle validated noise through approved, sampled rules. Preserve auto-dismissed findings for evidence and reassessment.
- **Malware alerts** are enabled.
- **No auto-merge** of dependency updates without human review.

### Why

Dependency management supports **[INT-PCI-6.3](https://www.pcisecuritystandards.org/document_library/)**, **[US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance)**, and **[EU-DORA-RTS-PATCH](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774)**. WAF's [dependency threats guide](https://learn.github.com/well-architected/library/application-security/recommendations/managing-dependency-threats/) warns that compromised maintainers ship malware as **patch releases**. Passing tests does not rule out a backdoor.

### How

Use the [Dependabot options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference) to define supported ecosystems/directories, an owned update schedule, cooldowns for routine version updates, and separate groups for security versus routine updates. For Critical/High repositories, agree weekly review capacity, a seven-day routine cooldown, and a longer major-version assessment period. Security updates must not wait for routine cooldowns.

Review the resulting policy against the [Dependabot options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference):

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

Rejecting vulnerable dependencies before merge avoids a later emergency change. This supports **[INT-PCI-6.3](https://www.pcisecuritystandards.org/document_library/)**, **[US-NYDFS-500.8](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500)**, and SSDF **PW.4**; license review supports **[US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance)** acquisition governance.

### How

**Policy ownership:** platform engineering maintains the required dependency-review integration under [Part 3's central gate design](/blog/github-waf-financial-services/change-control/#required-status-checks-and-merge-queue); AppSec owns vulnerability thresholds and dependency-intake decisions.

Inspect dependency-review coverage, required-workflow identity, package/version changes, affected dependency scopes, severity threshold, approved license policy, and the recorded intake decision. Include runtime, development, and unknown scopes; fail qualifying High/Critical findings under the adopted policy. [Enforcement guidance](https://docs.github.com/en/code-security/how-tos/secure-at-scale/configure-organization-security/configure-specific-tools/enforce-dependency-review) and the [dependency review API](https://docs.github.com/en/rest/dependency-graph/dependency-review) describe the supported integration points.

Use `allow-licenses`; `deny-licenses` is **deprecated** ([action README](https://github.com/actions/dependency-review-action)).

Pin the approved workflow, internal configuration, and actions under Part 3's central gate contract. Retain upstream identity, immutable version, institutional approval, and revalidation date.

**Scorecard warns; it does not gate.** Intake requires score **3 or higher** plus maintainer/provenance review; lower or missing scores need a named AppSec owner's dated exception. An independent required check must bind that decision to the exact package/version. Implement and test that integration, including missing scores, before claiming enforcement.

**Enterprise license policy (GHEC, including data residency):** define allowed licenses under **Enterprise > Policies > License compliance**, and give exception approvers the **Enterprise Open-Source License Manager** role. Enforce with the "Require license compliance results before merging" rule (`license_compliance_scanning` in the API), which checks **direct and transitive** dependencies. Stage rollout with a custom property (inactive, evaluate, active). See [Configuring open source license policies](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/configure-license-policies).

### Verify

- Rule Insights shows dependency review and license results per PR.
- License exception approvals by the License Manager role are your exception register. Review them quarterly with legal.
- [Dependency review](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review) depends on graph completeness. Spot-check automatic dependency submission for build-resolved ecosystems.

## SBOMs: an inventory you can hand over

### What we do

We generate an **SPDX SBOM in the release build from the actual packaged artifact**, using an approved, pinned SBOM generator. The build records the source commit, resolved dependencies, generator version/configuration, and artifact digest. We attest that SBOM against the same shipped digest and archive both.

### Why

A release SBOM answers "are we affected?" without rebuilding history. It supports **[INT-PCI-6.3](https://www.pcisecuritystandards.org/document_library/)** and WAF's [comprehensive-inventory principle](https://learn.github.com/well-architected/library/application-security/design-principles/).

### How

The [dependency graph SBOM export](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/export-dependencies-as-sbom) and [SBOM API](https://docs.github.com/en/rest/dependency-graph/sboms) are **repository inventory snapshots**, not release-artifact evidence. The endpoint has no release-commit selector. Renaming a current snapshot `v1.4.2.spdx.json` does not bind it to that release.

Generate after packaging, inventory runtime components actually present, and preserve a separate build-tool/development inventory. Include containers, vendored binaries, generated assets, and package-manager resolution, not just manifest declarations. Attest the output using `sbom-path` in the next section. Validate coverage against the artifact before publication; incomplete generation blocks release.

### Verify

Every production release record includes the build-generated SBOM, its attestation, and the artifact digest. Quarterly, reproduce a sampled inventory from the archived artifact and compare it with the SBOM. Repository snapshots remain supplemental inventory evidence.

## Build provenance: artifact attestations and SLSA

### What we do

Every production artifact carries **build provenance and an SBOM attestation**. Critical builds use an isolated, SHA-pinned reusable workflow, with SLSA level assessed against the full build design. The **deployment target**, not repository-controlled YAML, enforces verification before accepting the artifact.

### Why

Linking the shipped binary to reviewed source supports SSDF **PS.2**, **[EU-DORA-9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9)**, and **[US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance)**. WAF's [SSDF guide](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/) uses attestations and immutable releases.

Per [Artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations), GitHub documents an attested Actions build pattern for **SLSA v1.0 Build Level 2** and an isolated reusable-workflow pattern for **Level 3**. A reusable workflow alone is not a level certification: validate isolation, provenance, protected workflow inputs, and the remaining requirements. Private repositories use GitHub's Sigstore instance without a public transparency log; still classify and restrict access to retained build metadata.

An attestation links source and build instructions; it **does not guarantee artifact security**. Scanning and review remain necessary.

### How

The shared build service must generate an SBOM for the actual release artifact and publish provenance/SBOM attestations bound to its exact digest. Inspect source revision, build identity, approved workflow path and immutable version, subject digest, issuer, and signature-verification results. Use the [artifact attestation guidance](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations) and [attestations API](https://docs.github.com/en/rest/repos/attestations) to collect supported evidence; producing an attestation is not itself a deployment decision.

For sampled releases, retrieve attestations for the artifact's exact digest and compare the verified signer, issuer, source repository/revision, workflow identity/version, and SBOM subject with the approved release record. Retain verification results and policy version. A signer-repository match alone does not pin the workflow version or establish independent target enforcement.

**Target policy:** the platform-security-owned admission controller or deployment broker accepts only the exact approved artifact digest. It verifies provenance and SBOM signatures, expected issuer/source repository, approved workflow path and immutable commit, subject digest, and approved release/change record. Missing, invalid, stale, or mismatched evidence denies deployment. Application writers cannot edit or bypass that policy, and Actions OIDC roles have no direct production-write path around it. Use [attestation policy verification](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/enforce-artifact-attestations) appropriate to your platform. Deployment is not enabled until negative tests prove the target rejects artifacts after the repository verification step is removed.

Procedures: [Using artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations) and [Achieving SLSA v1 Build Level 3](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/increase-security-rating). Use [immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases) where available and GA. Otherwise, an access-controlled immutable artifact registry and digest-pinned release manifest provide the enforcing alternative.

**Consuming, not just producing:** the [dependency threats guide](https://learn.github.com/well-architected/library/application-security/recommendations/managing-dependency-threats/) recommends verifying provenance on incoming dependencies and preferring dependencies that publish attestations. Inspect the package/version, expected publisher, signature/provenance result, and approved exception rather than assuming an available package is trustworthy.

**GHES:** no artifact attestations. Use an external signing service or document compensating controls for a lower provenance level.

### Verify

- Archive the **target's allow/deny decision**, verified claims, policy version, artifact digest, SBOM, attestations, and approved change record per release. A deploy-job log alone is not enforcement evidence.
- [Linked artifacts](https://docs.github.com/en/code-security/concepts/supply-chain-security/linked-artifacts) connect build/deployment metadata and export provenance evidence.
- **Quarterly:** pick a production artifact at random and verify it end to end in front of your second line.

## Evidence: security overview is your audit binder

Security overview is an **index into the evidence**, not the complete audit binder. It exposes **alert age, MTTR, net resolve rate, and introduced versus prevented** ([metric definitions](https://docs.github.com/en/code-security/reference/security-at-scale/overview-dashboard-metrics)). [Export CSVs](https://docs.github.com/en/code-security/how-tos/view-and-interpret-data/analyze-organization-data/export-data) for second/third-line review, then join them to institutional ownership, exception, patch, and release records.

Our monthly evidence pack:

| Artifact | Source | Answers |
|---|---|---|
| Coverage CSV | Security overview > Coverage | "Is everything in scope actually scanned?" |
| MTTR and alert age | Security overview > Overview | "How is the queue trending?" (Not proof of tier-specific SLA compliance) |
| Introduced vs. prevented | Security overview > Overview (Prevention) | "Does enforcement work?" |
| SLA breach report | Reconciled vulnerability-management, classification, patch, and remediation records | "Which findings are late, and who owns them?" |
| Dismissal and bypass log | Audit log stream + Rule Insights | "Who made exceptions, and were they approved?" |
| Campaign closeout snapshots | Campaigns view / campaigns REST API | "What's your plan for legacy debt?" |
| SBOMs and attestation verifications | Release records | "What's in production, and where did it come from?" |
| Feedback and routing measures | PR/check timestamps plus institutional work records | "Can teams act promptly, and where does work get stuck?" |

These views reflect **default branches** and only show alerts from enabled features. An empty dashboard on an unscanned repo proves nothing, which is why the coverage CSV comes first.

Report overdue high-risk findings and unverified production remediation separately from accepted exceptions and developer-service measures. Raw closure counts reward tidying the dashboard; they do not establish lower risk. Never use an average MTTR to hide one overdue critical payment-service finding.

**Archive, don't bookmark:** [Part 1](/blog/github-waf-financial-services/platform-foundation/#evidence-retention-and-integrity) owns record retention, integrity, access, and retrieval standards. This chapter's population includes all in-scope repositories and required tools, open and closed findings with first-detection history, dismissals/auto-dismissals, patch-release metadata, exceptions, campaigns, and every shipped component/provenance record. Capture scanner/check evidence **at merge** and artifact-bound SBOM/provenance evidence **at release/deployment**, not at the monthly export. Use [Part 6's collector contract](/blog/github-waf-financial-services/actions-hardening/#control-8-retention-logs-and-attestations-as-evidence) for hourly paginated backfill, seven-day overlap, durable cursors, retries, and idempotency.

Reconcile the complete population daily. Missing pages, tool results, patch metadata, or release evidence are findings, never proof of compliance. Missing required merge or artifact evidence blocks release; post-run collection gaps block subsequent releases under Part 6's archive-failure gate.

## Control matrix

| Control | Requirement IDs | GitHub feature | Evidence | Cadence |
|---|---|---|---|---|
| Code Security on all in-scope repos, enforced | [US-NYDFS-500.8](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500), [INT-PCI-6.3](https://www.pcisecuritystandards.org/document_library/), [EU-DORA-9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9), [CA-OSFI-B13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | Enterprise security configuration (enforced) + custom properties | Coverage CSV; `security_configuration.*` audit events | Monthly; continuous alerting |
| CodeQL + third-party SARIF scanning | [INT-PCI-6.2](https://www.pcisecuritystandards.org/document_library/), [US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance), [INT-NIST-SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) (PW.7, PW.8) | Default/advanced setup, `upload-sarif` | Tool status; analyses per repo via API | Weekly |
| Merge protection on high-severity findings | [INT-PCI-6.2](https://www.pcisecuritystandards.org/document_library/), [US-NYDFS-500.8](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500), [CA-AMF-ICT](https://lautorite.qc.ca/en/professionals/insurers/guidelines/operational-risk/guideline-on-information-and-communications-technology-risk-management) | Org ruleset `code_scanning` rule | Rule Insights; `repository_ruleset.*` events; bypass review | Monthly sample; quarterly bypass review |
| Risk-ranked triage with SLAs | [INT-PCI-6.3](https://www.pcisecuritystandards.org/document_library/), [EU-DORA-RTS-PATCH](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774), [BR-CMN-4893](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf), [MX-CNBV-CUB](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) | Alert metadata, custom properties, production context filters | SLA breach report; MTTR and alert age | Weekly report; monthly review |
| Approved dismissals only | [INT-PCI-6.3](https://www.pcisecuritystandards.org/document_library/), [US-NYDFS-500.8](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500), [CL-CMF-20-10](https://www.cmfchile.cl/portal/normativa/624/articles-29310_doc_pdf.pdf) | GA delegated dismissal or independent exception approval with restricted access | `code_scanning.alert_closure_*`, `repository_vulnerability_alert.dismiss`; exception register | Daily reconciliation; monthly review |
| Legacy debt burn-down | [EU-DORA-RTS-PATCH](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774), [INT-PCI-6.3](https://www.pcisecuritystandards.org/document_library/), [INT-NIST-SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) (RV.2) | Owned security campaigns and reviewed remediation | Campaign snapshots; downstream adoption evidence | Quarterly |
| Dependency patching | [INT-PCI-6.3](https://www.pcisecuritystandards.org/document_library/), [EU-DORA-RTS-PATCH](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774), [US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance) | Dependabot alerts, security/version updates, auto-triage, malware alerts | Dependabot metrics; human-approved PR sample | Monthly; quarterly sample |
| Block vulnerable/non-compliant dependencies at PR | [INT-PCI-6.3](https://www.pcisecuritystandards.org/document_library/), [US-NYDFS-500.8](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500), [INT-NIST-SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) (PW.4) | Dependency review action (required workflow), license compliance ruleset | Rule Insights; license exception register | Per PR; quarterly |
| Component inventory | [INT-PCI-6.3](https://www.pcisecuritystandards.org/document_library/), [US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance) | Build-generated artifact SBOM and SBOM attestation; graph export supplemental | SBOM and shipped digest | Per release; quarterly sample |
| Build provenance and release integrity | [INT-NIST-SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) (PS.2), [EU-DORA-9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9), [US-FFIEC-DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance) | Isolated reusable workflow, attestations, external target policy, immutable registry | Target verification decision; policy version and artifact digest | Per deploy; quarterly negative tests |
| Application threat modeling | [INT-PCI-6.2](https://www.pcisecuritystandards.org/document_library/), [INT-NIST-SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) (PW.1, PW.2) | Threat model + CODEOWNERS; GA scanners and tests; independent review | File history; owner attestation | Design time/significant change; annual attestation |
| Public web application protection (external dependency) | [INT-PCI-6.4.2](https://www.pcisecuritystandards.org/document_library/) | **Not GitHub:** institution WAF/runtime protection | WAF coverage, origin-bypass tests, protection configuration and logs | Continuous; per release coverage check |
| Board and leadership reporting | [US-SEC-CYBER-2023](https://www.federalregister.gov/documents/2023/08/04/2023-16194/cybersecurity-risk-management-strategy-governance-and-incident-disclosure), [CA-OSFI-B13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | Security overview metrics | Monthly evidence pack | Monthly; quarterly to board |

## Summary and key takeaways

Apply WAF by connecting security feedback to the way banking teams actually deliver. Supported scanner paths reduce setup work; named owners and shared-component coordination turn findings into fixes.

Keep required gates and remediation policy firm. Improve feedback speed and triage quality as an engineering service. Prove what reached production using artifact-bound evidence, not a reassuring dashboard color.

**Your checklist:**

- [ ] Threat-model each Critical application before scanner setup; refresh on significant change.
- [ ] Consume Part 1's approved classification and prove complete, fail-closed scanner coverage.
- [ ] Enforce Code Security, default setup, Dependabot, and GA delegated dismissal or independent approval fallback.
- [ ] Stream `security_configuration.*`, `repository_ruleset.*`, and dismissal events to your SIEM.
- [ ] Upload third-party scanner results as SARIF, one `category` per tool.
- [ ] Publish supported scanning paths and route failed analyses to platform support.
- [ ] Assign service, shared-library, and consumer owners; preserve first detection across linked work items.
- [ ] Deploy active rulesets covering Critical/High **and** PCI/SOX repositories, with verified central workflow SHAs. Timebox Evaluate separately.
- [ ] Publish an SLA table and automate a weekly breach report.
- [ ] Launch campaigns without extending the 7-day Critical/top-tier SLA.
- [ ] Standardize `dependabot.yml` with cooldown and grouping. No unreviewed auto-merge.
- [ ] Generate and attest an SBOM from the actual release artifact at build time.
- [ ] Enforce provenance and SBOM verification at the deployment target, outside application writers' control.
- [ ] Capture merge/release evidence on time; reconcile daily and block releases on required-evidence gaps.
- [ ] Hand the monthly evidence pack to your second line before the examiner asks.

**Try this with one shared dependency:** identify affected deployed services, assign the maintainer and consumer upgrades, and trace one fix from PR feedback through target deployment. Measure the waiting time between those steps. That is your first improvement backlog.

**Previous:** [Part 4: Secrets Protection](/blog/github-waf-financial-services/secrets-protection/)
**Next:** [Part 6: CI/CD and GitHub Actions Hardening](/blog/github-waf-financial-services/actions-hardening/), where we make the delivery platform governed, reusable, efficient, and recoverable.

## References

### Source note

**Verified November 6, 2026:** [PCI DSS v4.0.1](https://www.pcisecuritystandards.org/document_library/) **6.3.3, 6.4.2, and 10.5.1** were checked on printed pages **148, 152, and 252** of the [SSC-authored university-hosted copy](https://www.usu.edu/controllers/files/pci-dss-v4-0-1.pdf). The [official SSC library](https://www.pcisecuritystandards.org/document_library/) PDF returned HTTP 403. Before reliance, second line must retain the official licensed copy and verify integrity; checking a mirror does not verify publisher-copy integrity.

NYDFS **500.6(a)-(b)** was checked in the [official Part 500 PDF](https://www.dfs.ny.gov/system/files/documents/2026/10/NYCRR-part-500-Cybersecurity-Regulation_1.pdf), pages **8-9**, the same day. Apply its scope and exemptions using Part 1's record-type schedule, not blanket five-year retention.

### Further reading

Regulatory sources are linked in **The requirements**; implementation procedures sit beside their controls.

- [GitHub repository threat model](https://learn.github.com/well-architected/library/application-security/recommendations/threat-model/) for Part 1's platform assessment.
- [Custom properties best practices](https://learn.github.com/well-architected/library/governance/recommendations/managing-repositories-at-scale/custom-properties-best-practices/) for classification owners.
- [Enabling security features at scale](https://docs.github.com/en/code-security/concepts/security-at-scale/organization-security) for organization-wide rollout.
- [GitHub pre-release terms](https://docs.github.com/en/site-policy/github-terms/github-pre-release-license-terms) for preview evaluations.
