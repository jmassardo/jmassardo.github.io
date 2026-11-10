---
layout: post
title: "GitHub Well-Architected for Financial Services, Part 1: Platform Foundation and Data Boundaries"
date: 2026-11-10 10:01:00 -0600
category: Blog
tags: [github, well-architected, financial-services, compliance, security, governance, data-residency, enterprise-managed-users, audit-log]
excerpt: "Run GitHub as a financial institution's engineering platform: clear service ownership, deliberate data boundaries, measurable operations, and rehearsed recovery backed by defensible evidence."
permalink: /blog/github-waf-financial-services/platform-foundation/
---

*This post is part of the [GitHub Well-Architected for Financial Services](/blog/github-waf-financial-services/) series.*

**Previous:** [Series Overview](/blog/github-waf-financial-services/) | **Next:** [Part 2: Identity and Access Management](/blog/github-waf-financial-services/identity-and-access/)

{::options toc_levels="2" /}

**In this post**

* Contents
{:toc}

> **A friendly note:** Validate these patterns with your compliance and regulatory reporting teams.

## Leadership brief

- **Why it matters:** A GitHub outage or data exposure can delay critical fixes and put sensitive business information at risk.
- **Your decision:** Approve where the service runs, where information may go, and how long critical delivery can tolerate an interruption.
- **Accountability:** Name and fund a platform owner responsible for reliable service, data protection, and recovery, including dependencies on GitHub.
- **Ask for:** A tested recovery result against your agreed limits, a clear account of data locations, and named owners for unresolved risks.

---

Creating a GitHub organization is easy. Turning it into a platform that several business lines can depend on takes more than an enterprise license and a helpful administrator.

Before a payments team stores its code or a banking team connects its release process, someone needs to decide where that information belongs, who runs the service, and what happens when a dependency fails. Those decisions are harder to untangle once dozens of teams have built their own arrangements around them.

This post works through that foundation using the GitHub Well-Architected Framework (WAF). We start with ownership and service expectations, then choose a deployment model and organize repositories around information boundaries. From there, we cover the records, recovery arrangements, and provider oversight needed to keep the platform dependable. The access and change controls in [Part 2](/blog/github-waf-financial-services/identity-and-access/) and [Part 3](/blog/github-waf-financial-services/change-control/) build on those choices.

## Apply all five WAF pillars to the platform

The five pillars are **Governance, Architecture, Application Security, Collaboration, and Productivity**. Use them as connected design questions, not five separate approval queues.

| Pillar | Financial-institution application | Engineering outcome and verification |
|---|---|---|
| **Governance** | Assign service ownership, risk tiers, decision rights, and expiring exceptions. | Teams know who can decide. Reconcile ownership and measure unresolved decisions and exceptions. |
| **Architecture** | Choose hosting, organization boundaries, integration paths, and recovery dependencies deliberately. | Release operations survives a rehearsed disruption. Compare measured recovery with approved RTO/RPO. |
| **Application Security** | Apply classification, exposure controls, network restrictions, and audit collection by default. | New repositories enter with working protection. Negative-test provisioning and data-boundary controls. |
| **Collaboration** | Publish the service catalog, support routes, design decisions, and shared contribution model. | Business lines can reuse approved capabilities without bypassing information barriers. Test a cross-team onboarding journey. |
| **Productivity** | Offer repeatable provisioning, clear documentation, and actionable operational feedback. | Engineers spend less time waiting or repairing configuration. Track request-to-ready time and recurring support work. |

These are engineering outcomes **and** inputs to assurance. A quarterly sign-off cannot rescue a platform that prevents teams from shipping routine changes.

## Run the platform as a product

### What: an owned platform service

**Treat GitHub as an internal product with named customers and an operating contract.** The platform team serves application engineers, infrastructure maintainers, security reviewers, release operations, and evidence consumers.

The product owner prioritizes investment and adoption. The operational owner runs the service and incidents. Repository owners remain accountable for their code and business services; the platform team does not inherit every application's production risk.

### Why: maintenance needs a mandate

Ownership turns enterprise policy into a maintained service. It also exposes a common gap: everyone funds new features, but nobody funds access support, recovery tests, or integration maintenance.

Use the [WAF governance design principles](https://learn.github.com/well-architected/library/governance/design-principles/) to make decision rights explicit. The institution remains accountable when GitHub or another provider operates part of the service.

### How: publish the service contract

Publish a short service catalog and review it with representatives from payments, banking applications, infrastructure, and shared-library teams:

| Service | Accountable owner | Supported path and completion condition |
|---|---|---|
| Repository onboarding | Platform product owner | Request, approved classification, team access, baseline controls, and a tested starter workflow |
| Identity and access | IAM service owner | Approved entitlement, working access, prompt removal, and failure escalation |
| Policy and security integration | Platform control owner with AppSec | Versioned baseline, tested updates, exception route, and usable failure messages |
| Release integration | Release operations owner | Supported build/deploy interfaces, incident contacts, and an independent recovery route |
| Evidence and recovery | Named archive and recovery owners | Complete collection, retrieval, restoration, and tested dependency recovery |

One person may hold multiple roles in a small team, but required independent approval and review still need separate authorized people.

**Risk-tier the service, not just its paperwork.** A critical payments repository needs release-window support and more frequent recovery rehearsal. A non-production training repository needs a reliable onboarding path, but not the same operational coverage.

Use the approved business-criticality and regulatory scope to assign support, test cadence, escalation, and residual-risk authority. Missing classification receives the restrictive baseline until reviewed.

Maintain a backlog that combines engineering feedback, operational defects, assurance findings, and provider changes. Publish supported patterns and retirement dates. Do not make each business line rediscover the same integration failure.

### Verify: test the customer journey

Monthly, review service demand, request-to-ready time, support backlog age, incidents, failed provisioning, and overdue control work. Break results down by service tier and business line.

Ask a team unfamiliar with the platform to onboard a small banking application using only the published path. Record manual interventions and fix their causes. Successful documentation works when its author is on vacation.

## Manage configuration as reviewed policy

**Keep the approved configuration in a protected policy repository and apply it through an institution-owned, event-driven service.** Administrators should propose a reviewed change to the desired state, not maintain settings independently through the UI or a collection of scheduled scripts.

The [safe-settings project](https://github.com/github-community-projects/safe-settings) provides a useful reference: centrally stored configuration, layered defaults, pull-request dry runs, and a GitHub App that responds to supported webhook events. This series recommends that service pattern, not the project's optional scheduled synchronization mode. Adopting the project itself still requires institutional assessment of its permissions, supported settings, dependencies, release suitability, and operating support.

### How: separate policy approval from application

| Responsibility | Required operating behavior |
|---|---|
| **Declare** | Platform and control owners maintain the approved baseline in a dedicated repository. Organization, business-unit, and repository-specific settings may add restrictions; mandatory controls cannot be weakened by a lower-level override. |
| **Review** | Protected branches and independent owners govern policy changes. Validate schema, targeting, effective differences, and exceptions in a dry run before approval. Validation must not apply proposed settings or execute contributor-controlled code with administrative credentials. |
| **Apply** | A dedicated GitHub App or equivalent governed service applies an approved policy commit after merge. Keep its credentials and runtime outside application repositories and ordinary branch workflows; scope permissions to the managed controls. |
| **Respond** | Supported repository lifecycle and configuration-change events trigger comparison with the approved desired state. Apply only required differences, deduplicate deliveries, and verify the resulting effective settings. This is event-triggered reconciliation, not recurring API discovery. |
| **Handle exceptions** | Record independently approved scope, reason, authority, and expiry in the policy lifecycle. The service must distinguish an authorized temporary exception from unauthorized drift and restore the baseline when the exception expires. |
| **Operate** | Platform engineering owns delivery health, durable processing, retries, rate limits, recovery, and controlled rollout/rollback. Failed application or verification creates an incident and blocks admission or reliance where a mandatory control is missing. |
| **Prove** | Retain the approved policy commit, reviewers, effective difference, triggering event, affected resources, application identity, outcome, and independently protected evidence of the resulting configuration. An accepted API request is not proof of enforcement. |

**Do not confuse correction with prevention.** A controller can restore a changed setting after an event; it cannot undo an exposure that already occurred. Keep supported native enterprise and organization restrictions as the preventive boundary, and quarantine new or transferred repositories until admission checks pass.

Maintain a coverage register for each managed setting: deployment/version, supported API, triggering events, required permissions, verification, and failure response. Do not assume safe-settings manages every enterprise policy or that every setting emits a usable event. Unsupported controls need a separately owned native or manual process; unresolved mandatory gaps block the affected capability. Configuration management and [audit evidence collection](#evidence-retention-and-integrity) are separate services, even when they share event infrastructure.

### Verify: test the configuration lifecycle

In an isolated test organization, demonstrate a rejected policy change, an approved staged rollout, repository admission, unauthorized drift correction, exception expiry, duplicate delivery, missed-event recovery, and failed application. Prove that unapproved policy cannot reach the administrative runtime, repeated processing causes no unnecessary changes, and missing events or unsupported settings remain visible gaps. Retain the effective configuration and incident/recovery results, not just the controller's success message.

## Operational service objectives

### What: measure the delivery experience

**Set measurable service objectives for the institution-owned platform experience.** Separate GitHub's contractual commitments from the integration, support, and recovery outcomes your team can actually operate.

### Why: reachability is not usability

A reachable GitHub homepage does not mean engineers can sign in, run required checks, publish packages, or complete an authorized release. Availability must follow the delivery journey.

### How: define indicators and responses

Define each indicator's population, measurement point, target, time window, owner, and alert threshold. Set actual targets through business-impact analysis and baseline measurements, not borrowed availability percentages.

| Journey | Useful indicator | Response when the objective is missed |
|---|---|---|
| Approved repository request to first successful test | Elapsed request-to-ready time; failed provisioning rate | Repair the template or integration; route blocked teams to the platform owner |
| Engineer authentication and repository access | Synthetic access success plus real sign-in failures | Joint IAM/platform triage, with the credential path identified |
| Protected change to release eligibility | Required-check availability, queue wait, integration failures | Separate service failures from genuine code failures; do not disable controls to clear a queue |
| Audit event to durable receipt | Ingestion lag, missing intervals, reconciliation errors | Archive incident and supported backfill before source retention expires |
| Recovery authorization to usable release path | Measured restoration time and recovered-data age | Remediate against approved RTO/RPO and repeat the failed scenario |

Use synthetic checks that read approved test resources and avoid customer data. Document their limits; one successful probe does not establish access to every repository.

For example, payments release operations may require coverage during settlement windows. Measure the complete path through identity, Git access, trusted checks, artifact retrieval, and deployment authorization.

Agree an **error-budget response**: when repeated service failures consume the allowed tolerance, prioritize reliability fixes over optional platform changes. Mandatory security remediation still proceeds through controlled change.

### Verify: exercise the operational response

Review the scorecard with service consumers monthly and after material incidents. Assign actions to named owners, preserve measurement gaps as unknowns, and demonstrate alert routing with an injected integration failure.

Keep the regulatory evidence below, but use these measures to answer an additional question: **can teams deliver safely without heroic intervention?**

## The requirements

These requirements shape the foundation; the mappings show how platform controls **contribute to**, rather than certify, compliance. Your compliance team determines which obligations apply and validates scope, exemptions, and control adequacy. Check feature availability against your purchased plan and deployed release using the [GA production baseline](#feature-availability-and-preview-controls).

| ID | Regulation and citation | What it asks for (paraphrase) |
|---|---|---|
| [US-FFIEC-INFOSEC](https://ithandbook.ffiec.gov/it-booklets/information-security) | [FFIEC IT Examination Handbook, Information Security](https://ithandbook.ffiec.gov/it-booklets/information-security) | A governed information security program with controls protecting confidentiality, integrity, and availability. |
| [US-FFIEC-BCM](https://ithandbook.ffiec.gov/it-booklets/business-continuity-management) | [FFIEC IT Examination Handbook, Business Continuity Management](https://ithandbook.ffiec.gov/it-booklets/business-continuity-management) | Continuity strategy, plans, and testing. |
| [US-GLBA-314](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-314) | [GLBA Safeguards Rule, 16 CFR Part 314](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-314) | A written, risk-based security program covering access controls, vendor oversight, and monitoring. |
| [US-OCC-30-AppB](https://www.ecfr.gov/current/title-12/chapter-I/part-30/appendix-Appendix%20B%20to%20Part%2030) | [Interagency Guidelines Establishing Information Security Standards, 12 CFR Part 30 App. B](https://www.ecfr.gov/current/title-12/chapter-I/part-30/appendix-Appendix%20B%20to%20Part%2030) | Comprehensive written security program including access controls and service provider oversight. |
| [US-NYDFS-500.3](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | [23 NYCRR Part 500, Section 500.3](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Written cybersecurity policies, approved at least annually by a senior officer or senior governing body, covering applicable security domains. |
| [US-NYDFS-500.6](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | [23 NYCRR Part 500, Section 500.6](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Audit trails to detect and respond to cybersecurity events, with defined retention. |
| [US-NYDFS-500.11](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | [23 NYCRR Part 500, Section 500.11](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Due diligence and contractual protections for third-party service providers. |
| [US-NYDFS-500.16](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | [23 NYCRR Part 500, Section 500.16](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Written incident response and business continuity plans. |
| [US-3PRM-2023](https://www.federalreserve.gov/supervisionreg/srletters/SR2304.htm) | [Interagency Guidance on Third-Party Relationships (Fed SR 23-4)](https://www.federalreserve.gov/supervisionreg/srletters/SR2304.htm), [OCC Bulletin 2023-17](https://www.occ.gov/news-issuances/bulletins/2023/bulletin-2023-17.html) | Risk-tiered third-party lifecycle: due diligence, contracting, ongoing monitoring, termination. |
| [CA-OSFI-B13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | [OSFI Guideline B-13, Technology and Cyber Risk Management](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | Risk-based governance, technology operations, resilience, and cyber security. |
| [CA-OSFI-B10](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/third-party-risk-management-guideline) | [OSFI Guideline B-10, Third-Party Risk Management](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/third-party-risk-management-guideline) | Manage third-party risk proportionate to criticality; the institution stays accountable. |
| [CA-OSFI-E21](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/operational-risk-management-resilience-guideline) | [OSFI Guideline E-21, Operational Risk Management and Resilience](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/operational-risk-management-resilience-guideline) | Sustain critical operations through disruption, including data risk and change. |
| [BR-CMN-4893](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf) | [CMN Resolution 4,893/2021 (Brazil)](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf) | Formal cybersecurity policy and requirements for contracting cloud and data processing services, including overseas providers. |
| [MX-CNBV-CUB](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) | [CNBV Circular Única de Bancos (Mexico)](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) | Technology risk, information security, and IT outsourcing provisions for banks. |
| [CO-SFC-CBJ-006-2025](https://www.superfinanciera.gov.co/publicaciones/10115528/circular-basica-juridica-ce-00625/) | [SFC Circular Básica Jurídica, CE 006 de 2025 (Colombia)](https://www.superfinanciera.gov.co/publicaciones/10115528/circular-basica-juridica-ce-00625/) | Information security and cybersecurity risk management for supervised entities. |
| [CL-CMF-20-10](https://www.cmfchile.cl/portal/normativa/624/articles-29310_doc_pdf.pdf) | [CMF RAN Chapter 20-10 (Chile)](https://www.cmfchile.cl/portal/normativa/624/articles-29310_doc_pdf.pdf) | Baseline information security and cybersecurity management for banks. |
| [EU-DORA-5-16](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554) | [DORA, Regulation (EU) 2022/2554, Arts. 5 to 16](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554) | An ICT risk management framework with board accountability, protection, detection, and recovery. |
| [EU-DORA-12](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_12) | [DORA Art. 12, Backup policies and recovery](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_12) | Documented backup scope and frequency based on criticality, plus restoration procedures. |
| [EU-DORA-28-30](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_28) | [DORA Arts. 28 to 30, ICT third-party risk](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_28) | Full responsibility despite outsourcing, concentration risk assessment, and mandatory contract terms (including data locations). |
| [EU-DORA-RTS-LOGGING](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | [Delegated Regulation (EU) 2024/1774, Art. 12](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | Logging requirements within the ICT risk management framework. |
| [EU-GDPR-25](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679) | [GDPR Art. 25, Data protection by design and by default](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679) | Build protective measures in at design time; only necessary processing by default. |
| [EU-GDPR-44](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679) | [GDPR Art. 44, General principle for transfers](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679) | Transfers of personal data outside the EU/EEA must meet Chapter V conditions. |
| [INT-PCI-10.2](https://www.pcisecuritystandards.org/document_library/) | [PCI DSS v4.0.1, Req. 10.2](https://www.pcisecuritystandards.org/document_library/) | Audit logs capture administrative actions, access to logs, and authentication changes. |
| [INT-PCI-10.4](https://www.pcisecuritystandards.org/document_library/) | [PCI DSS v4.0.1, Req. 10.4](https://www.pcisecuritystandards.org/document_library/) | Automated review of logs required daily by 10.4.1; other system logs reviewed at a risk-defined frequency under 10.4.2. |
| [INT-PCI-10.5.1](https://www.pcisecuritystandards.org/document_library/) | [PCI DSS v4.0.1, Req. 10.5.1](https://www.pcisecuritystandards.org/document_library/) | At least 12 months of audit log history, with the most recent three months immediately available for analysis. |
| [INT-PCI-12.8](https://www.pcisecuritystandards.org/document_library/) | [PCI DSS v4.0.1, Req. 12.8](https://www.pcisecuritystandards.org/document_library/) | Maintain and monitor third-party service providers, including annual compliance checks. |
| [INT-PCI-12.9](https://www.pcisecuritystandards.org/document_library/) | [PCI DSS v4.0.1, Req. 12.9](https://www.pcisecuritystandards.org/document_library/) | Service providers acknowledge responsibility and give customers information to support their scoping. |

## Deployment model differences

Platform differences follow; detailed identity, pipeline, and optional AI-service behavior belong in their respective parts.

| Topic | GHEC (personal accounts) | GHEC with EMU | GHEC with data residency (GHE.com) | GHES |
|---|---|---|---|---|
| **Public repos** | Allowed unless blocked by policy. Users can always create public repos in their **personal** namespace, outside your control. | Not possible. [Managed users can contribute only to private and internal repositories](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts) in the enterprise. | Not possible ([EMU is required](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-github-enterprise-cloud-with-data-residency)). | "Public" means visible to anyone who can reach the instance. [Private mode](https://docs.github.com/en/enterprise-server@3.22/admin/configuring-settings/hardening-security-for-your-enterprise/enabling-private-mode) requires sign-in. |
| **Gists** | No enterprise control over personal gists. | [Managed users cannot create gists](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts). | [Unavailable](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency). | Available. [Anonymous gists only work when private mode is off](https://docs.github.com/en/enterprise-server@3.22/get-started/writing-on-github/editing-and-sharing-content-with-gists/creating-gists). |
| **GitHub Pages** | Public or private per [org policy](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-the-publication-of-github-pages-sites-for-your-organization). | [Private only](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site). | Private only (EMU). | Instance-wide; [public sites expose every site](https://docs.github.com/en/enterprise-server@3.22/admin/configuring-settings/configuring-user-applications-for-your-enterprise/configuring-github-pages-for-your-enterprise). |
| **Data location** | GitHub.com (US by default). | US | [EU, Australia, US, or Japan](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-github-enterprise-cloud-with-data-residency), with [documented exceptions](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-storage-of-your-data-with-data-residency). | Wherever you run it. |
| **Network restriction** | [Enterprise IP allow list](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/hardening-security-for-your-enterprise/restricting-network-traffic-to-your-enterprise-with-an-ip-allow-list). | IP allow list, or IdP conditional access with Entra ID OIDC. | Same as EMU. | Your own network and firewall. |
| **Audit retention** | [180 days; Git events 7 days](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/security-and-compliance/audit-log-for-an-enterprise). Stream to keep more. | Same. | Same; [S3 streaming via OIDC unavailable](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency). | [Indefinite unless you configure otherwise](https://docs.github.com/en/enterprise-server@3.22/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise). |
| **Backup and DR** | Vendor platform recovery plus institution-owned code and metadata recovery. | Same. | Same, with location constraints for archives too. | **Yours**: [Backup Service](https://docs.github.com/en/enterprise-server@3.22/admin/backing-up-and-restoring-your-instance/about-the-backup-service-for-github-enterprise-server), off-site archives, HA, upgrades. |
| **Vendor reports** | [Compliance tab](https://docs.github.com/en/enterprise-cloud@latest/admin/overview/accessing-compliance-reports-for-your-enterprise) (SOC 1/2, ISO 27001, PCI AoC, more). | Same. | Same. | Hosting controls are yours to evidence. |

## Choosing your deployment model

### What we do

**GHEC with data residency (including Enterprise Managed Users) is the series default.** Choose against documented data flows, identity needs, contractual obligations, and operating capacity:

1. **Default:** choose **GHE.com** in an approved, supported region after reviewing data flows and contractual requirements.
2. **Does a mandate rule out SaaS or require a location the service cannot meet?** Assess **GHES**, including operational resilience, support, and connected-service data flows.
3. **Exception:** GitHub.com with EMU needs a documented rationale and security, privacy, legal, and risk approval.
4. **Open source program office?** If you publish open source, run it in a **separate** personal-account enterprise or organization, deliberately isolated from regulated code.

### Why

The WAF [governance essentials](https://learn.github.com/well-architected/library/governance/recommendations/governance-administration-essentials/) identifies the personal-account gap: enterprise policy cannot govern activity in users' own namespaces or outside organizations. EMU blocks public repos, gists, and external contributions, with IdP-driven account suspension.

This supports **[EU-GDPR-25](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679)**, **[US-GLBA-314](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-314)**, **[US-OCC-30-AppB](https://www.ecfr.gov/current/title-12/chapter-I/part-30/appendix-Appendix%20B%20to%20Part%2030)**, and **[US-NYDFS-500.3](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500)**. EMU constrains managed identities, not separate personal accounts or workstation copying; endpoint and information-handling controls remain necessary.

**Why residency is the default:** it adds a dedicated `*.ghe.com` subdomain, separate from github.com, and a chosen region for code and covered data. That separation goes beyond EMU on github.com. It is not dedicated physical infrastructure or a guarantee that every data category stays in-region.

Residency supports **[EU-GDPR-44](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679)**, **[EU-DORA-28-30](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_28)**, and **[BR-CMN-4893](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf)**, but [out-of-region exceptions](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-storage-of-your-data-with-data-residency) include billing, **support cases**, and **Copilot by default** unless its compliant-model policy is enabled. GitHub does not notify you of each transfer; privacy must review these flows before approval.

**The migration cost matters:** the account model and residency environment are chosen at enterprise creation. Changing environments requires migration planning, not a settings toggle.

**GHES:** use when documented requirements rule out cloud, not an assumed universal in-country mandate. [Upgrades](https://docs.github.com/en/enterprise-server@3.22/admin/overview/about-upgrades-to-new-releases), HA, and backups become your operational responsibility.

### How

- Walk through GitHub's [Choosing an enterprise type](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/enterprise-fundamentals/choose-an-enterprise-type) questions with security, privacy, and legal in the room.
- For GHE.com, review the [feature overview](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency) for gaps (Marketplace, some preview features, S3 via OIDC streaming).
- Contractors and vendors? EMU's [guest collaborator role](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/enabling-guest-collaborators) gives IdP-provisioned outsiders access without automatic access to every internal repository.

### Verify

The **architecture decision record** names model, region, data flows, gaps, approvers, and assessments. It records a decision, not proof of lawful processing or transfers.

For **each control gap**, link a compensating control, accountable owner, implementation evidence, negative test, review/expiry date, and residual-risk decision. An unresolved mandatory-control gap blocks reliance or the affected activity; listing it in an ADR is not acceptance. Reassess the compensation when the service or requirement changes. For example, GHE.com's lack of S3 streaming with OIDC requires the [streaming credential controls below](#audit-logging-and-siem-streaming), or a tested supported alternative destination.

Privacy and legal review the [DPA](https://github.com/customer-terms/github-data-protection-agreement), subprocessors, support access, billing, telemetry, Copilot, and secret-validation data. For **covered personal-data transfers**, document the Chapter V mechanism and required assessment, including transfer impact assessment/supplementary measures where Article 46 reliance requires them. Out-of-region storage is not automatically a covered transfer. Reassess material service, model, region, or subprocessor changes.

### Feature availability and preview controls

**Production uses supported, generally available releases and features only.** A GA platform release can still contain preview features; verify both the release and each capability. GHES 3.22 is the GA reference series, not a promise of cloud parity. Record documentation check date, license/version, release status, applicable terms, assurance scope, owner, and operating evidence for each production capability.

**Beta, preview, and release-candidate capabilities are excluded from this series' production baseline, even as supplemental controls.** Use the documented GA implementation instead. If no GA implementation meets the requirement, do not enable the affected production capability until a supported solution is approved and tested. Risk acceptance is not a route to introducing preview dependencies into this baseline.

**Evaluation is separate from production guidance.** Where institutional policy and applicable terms permit, evaluate prerelease capabilities only in an isolated non-production environment using synthetic data, with no production credentials, regulated data, or connection to production delivery paths. Require a named owner, security and second-line approval, an expiry date, and an exit plan. GA release does not automatically authorize promotion: reassess the released capability and complete normal production approval.

Legal must identify the applicable agreement, including GitHub's [pre-release terms](https://docs.github.com/en/site-policy/github-terms/github-pre-release-license-terms) and [DPA](https://github.com/customer-terms/github-data-protection-agreement). Preview mentions in this series identify unavailable production options, not rollout recommendations. This is the series' conservative implementation standard, not a claim that every regulation imposes an identical release-status rule.

### Platform threat model

Start the platform risk assessment with the WAF [GitHub repository threat model](https://learn.github.com/well-architected/library/application-security/recommendations/threat-model/), scoped to **source integrity in the SLSA supply chain model**. Ask: what are we working on, what can go wrong, what will we do about it, and did we do a good enough job?

Carry its mitigations, especially **T-07/T-08**, into [Part 6's pipeline controls](/blog/github-waf-financial-services/actions-hardening/). This platform assessment complements, rather than replaces, [Part 5's application threat models](/blog/github-waf-financial-services/code-scanning-supply-chain/#threat-modeling-decide-what-bad-looks-like-first).

## Enterprise and organization topology

### What we do

**One internal enterprise, minimal organizations.** Use the WAF's **red-green-sandbox** pattern:

| Organization | Purpose | Base permission |
|---|---|---|
| `acme` (green) | Most repositories, deliberate innersource | None by default; Read only under approved organization-level policy |
| `acme-restricted` (red) | Need-to-know: PCI cardholder data environment, MNPI, M&A work | None |
| `acme-sandbox` | Experiments and training, nothing production | None by default |

Enterprise policy sets the envelope; organization owners cannot redraw it.

Prefer **enforced enterprise base permission None** with explicit team grants. If organizations choose base settings, allow only **None/Read** and reconcile daily; an enforced enterprise Read cannot be lowered by a red organization. Internal visibility grants regular enterprise members read regardless of base permission, so restricted repositories must be private.

### Why

Separate organizations for classification/regulatory boundaries, not org charts. Private red repositories support information barriers such as research versus trading; fewer organizations reduce policy drift (**[US-FFIEC-INFOSEC](https://ithandbook.ffiec.gov/it-booklets/information-security)**, **[EU-DORA-5-16](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554)**).

### How

- Set enterprise policies under **Enterprise > Policies > Member privileges** with **enforced** values rather than "No policy" (details in the next section).
- Keep at least two owners per organization, and no more than you need, per the WAF checklist.
- Resist the "just one more org" request. Teams and repository roles solve most of those asks.

### Verify

Export the list of organizations and owners quarterly. Reconcile each purpose with classification boundaries, support ownership, and actual repository use.

Test a legitimate cross-business-line contribution, such as a banking team proposing a payments-library fix. It should reach the right maintainers without creating another organization or expanding access to restricted code.

## Enterprise policies: closing the data boundary

Enforce enterprise settings where available. Verify organization settings and account-model restrictions separately; organization APIs do not prove every enterprise policy.

### What we do

| Policy | Our setting | Where it lives |
|---|---|---|
| **Repository creation** | Members can create **private** and **internal** only. Public disabled. EMU: block repos in user namespaces. | Member privileges |
| **Default visibility** | Provision unknown/sensitive repositories as private. Internal only after classification and access approval. | Governance-owned provisioning using GA settings and APIs |
| **Visibility changes** | Restricted to owners. | Member privileges |
| **Forking** | Private/internal forking disabled enterprise-wide by default. | Member privileges |
| **Outside collaborators** | Restricted to enterprise owners (or org owners with a documented approval flow). | Member privileges |
| **Deletion and transfer** | Restricted to owners. | Member privileges; independently approved owner actions |
| **GitHub Pages** | Private only, or disabled; remediate previously published public sites. | EMU restrictions; otherwise organization settings and site inventory |
| **Gists** | Unavailable with EMU; GHES private mode disables anonymous access, not signed-in gist creation. | Account model / GHES private mode |

### Why

These WAF [policy defaults](https://learn.github.com/well-architected/library/governance/recommendations/governance-policies-best-practices/) support **[US-GLBA-314](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-314)**, **[US-OCC-30-AppB](https://www.ecfr.gov/current/title-12/chapter-I/part-30/appendix-Appendix%20B%20to%20Part%2030)**, **[CL-CMF-20-10](https://www.cmfchile.cl/portal/normativa/624/articles-29310_doc_pdf.pdf)**, **[CO-SFC-CBJ-006-2025](https://www.superfinanciera.gov.co/publicaciones/10115528/circular-basica-juridica-ce-00625/)**, and **[EU-GDPR-25](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679)** by limiting exposure and unauthorized movement.

Permissive [fork policies](https://docs.github.com/en/enterprise-cloud@latest/pull-requests/reference/forks) allow private code into personal accounts or other enterprises. [IP allowlists do not cover personal-account forks](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/hardening-security-for-your-enterprise/restricting-network-traffic-to-your-enterprise-with-an-ip-allow-list): both boundaries can be lost.

**Prefer branches for collaboration, not for isolation.** Keeping contributions in the governed repository avoids those fork destinations, but a branch is not a security boundary. A repository writer may create or modify a workflow that runs before merge; GitHub warns that writers can access repository secrets through workflows ([secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use#use-secrets-for-sensitive-information)). Protecting `main` and requiring workflow review do not, by themselves, prevent that execution.

The branching model therefore depends on separating ordinary branch builds from privileged work. Unreviewed code gets no production credentials, production-network access, or privileged runners. Production access requires protected environments, independently enforced authorization, and isolated execution. [Part 6's branch execution boundary](/blog/github-waf-financial-services/actions-hardening/#separate-branch-validation-from-privileged-execution) defines the implementation and acceptance tests; [Part 3's push rulesets](/blog/github-waf-financial-services/change-control/#push-rulesets-guard-the-files-that-guard-everything-else) restrict control-file changes before they enter the repository.

### How

Apply [enterprise repository management policies](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise) for the table above. [GHES 3.22](https://docs.github.com/en/enterprise-server@3.22/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise) also controls default visibility and anonymous Git reads.

**Excluded from production:** targeted [repository policies](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-repositories-in-your-enterprise/governing-how-people-use-repositories-in-your-enterprise) are public preview. Do not enable them as production overlays or assume that classification automatically enforces private-only visibility or transfer restrictions.

**Production implementation:** use EMU and enforced member privileges, governance-owned private provisioning, independently approved owner actions, and daily reconciliation. These controls do not reproduce every targeted-policy restriction. If mandatory private-only targeting cannot be enforced with the available GA controls, block the affected provisioning or operation until a tested GA implementation meets the requirement.

**Fork exceptions:** block forks in all three organizations; Confidential, Restricted, and unclassified repositories stay non-forkable. Review [supported destinations](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-the-forking-policy-for-your-organization), then reapply classification, access, rulesets, scanning, and networking before admission. Properties need not propagate. Audit existing networks too.

**Exceptions:** apply [Part 3's rule-type-specific exception lifecycle](/blog/github-waf-financial-services/change-control/) to supported GA controls, with independent, expiring authority rather than standing human bypass. Preview repository-policy allowlists are not part of this production design.

**Pages:** non-EMU organizations permit [private creation only](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-the-publication-of-github-pages-sites-for-your-organization); blocking creation does not unpublish existing sites. Keep GHES "public sites" off: it exposes every site.

**GHES:** enable [private mode](https://docs.github.com/en/enterprise-server@3.22/admin/configuring-settings/hardening-security-for-your-enterprise/enabling-private-mode). GitHub's docs say you **must** if the instance is reachable from the internet.

### Verify

**Production inventory:** reconcile organizations, repositories, forks, and Pages daily, including supported managed-user namespaces. Reconcile those users with IdP/enterprise records and test repository visibility separately; organization enumeration misses them. External personal-account repositories need endpoint/information-handling controls. New/transferred repositories stay private and quarantined until admission checks pass.

Capture enterprise policies through the UI and documented APIs **where available**; no endpoint is assumed to export them all. Check organization settings separately and negative-test creation, visibility changes, transfers, and forks as a non-owner.

Before adopting same-repository branching, also pass [Part 6's branch execution tests](/blog/github-waf-financial-services/actions-hardening/#verify-the-boundary). A blocked fork is not a passing result if the same contributor can reach production privileges from a branch.

**Operate this as an enterprise control, not an administrator's scheduled script.** Platform engineering owns the integrations and collection health; security operations owns alert triage and escalation; governance approves the baseline and exceptions. Use supported GA capabilities and institution-managed monitoring, inventory, and incident-management services.

Use the [reviewed-policy configuration service](#manage-configuration-as-reviewed-policy) to apply supported settings and respond to configuration changes. Inventory and evidence services independently assess scope and outcomes; the controller's current managed set is not proof that every repository has been discovered or admitted.

| Capability | Required operating outcome |
|---|---|
| **Prevent** | Enforce the supported enterprise and organization policies above; quarantine new or transferred repositories until admission checks pass |
| **Detect** | Route relevant audit events into enterprise monitoring and correlate them with repository identity, classification, and approved changes |
| **Reconcile** | Compare the complete inventory and effective configuration with the approved baseline daily; event collection alone does not establish current state or completeness |
| **Operate** | Monitor collection freshness, permissions, pagination, and coverage; route violations, collection failures, and overdue findings to accountable responders |
| **Prove** | Retain configuration captures, reconciliation results, approved exceptions, and remediation evidence in the controlled archive |

Implementation teams can use the documented [Enterprise GraphQL connection](https://docs.github.com/en/enterprise-cloud@latest/graphql/reference/enterprise-admin#enterprise---object) for organization discovery and the [organization repositories API](https://docs.github.com/en/rest/repos/repos#list-organization-repositories) for repository inventory. These are integration inputs, not a complete control: organization discovery does not enumerate managed-user repositories or establish Pages, fork, classification, or policy compliance.

Run collection through a governed service identity outside ordinary repository contributors' control, with tested access to the full population. Reconcile stable IDs and counts with the approved CMDB inventory. Permission gaps, incomplete pagination, stale collection, and unexplained empty responses mean **unknown/failure**, not compliance; genuinely empty organizations require documented verification.

**Check Pages separately**, including archived repositories: collect [`GET /repos/{owner}/{repo}/pages`](https://docs.github.com/en/enterprise-cloud@latest/rest/pages/pages) with tested permissions and record `public`, `html_url`, and `cname`. A 404 means absence only with validated access. Remediate prohibited existing sites and former custom domains; anonymously test both standard and custom URLs.

The monitoring and incident-management integrations must route violations, API/permission errors, missed collection or reconciliation, and unacknowledged findings to named responders under agreed escalation deadlines. Retain collection timestamps and health, inventory IDs/counts, policy captures, site results, reconciliation decisions, and incident closure in the [controlled evidence archive](#evidence-retention-and-integrity). Test both detection and operational failure handling with a seeded violation and interrupted collection in an isolated test environment.

**Derived data keeps its source obligations.** Review logs, exported documentation, build artifacts, support attachments, and shared examples can cross the same boundary as source code. Classify them for the information they contain, and approve their destinations.

For AI services specifically, **agent outputs inherit the highest source classification**. Confidential, Restricted, and unclassified repositories remain out of agent scope until session access, context isolation, and retention are verified. [Part 7](/blog/github-waf-financial-services/copilot-and-agents/#ai-data-session-access-and-privacy) owns those distinct controls; repository privacy alone is not sufficient.

**A simple detection example:** a repository's visibility changes. Monitoring identifies the actor and affected repository, compares the change with its classification and approval record, and routes an unexplained or prohibited change for investigation. The event starts the assessment; it does not, by itself, prove malicious activity.

| Example event | What the detection should establish |
|---|---|
| `repo.access` | Was the visibility change approved, and is the new visibility permitted for this repository? |
| `repo.transfer_outgoing`, `repo.destroy` | Was the transfer or deletion authorized, and have ownership and recovery records been updated? |
| `private_repository_forking.enable` | Does the policy change match an approved exception, or has someone weakened the boundary? |

These are illustrative starting points, not a complete alert catalog or universal severity policy. Correlate changes with actor history, repeated activity, and approved maintenance; route policy violations and unexplained changes under the institution's response process. Confirm event availability and fields against the [official audit-event reference](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise).

For the broader implementation and detection approach, see my earlier posts:

- [Locking Down GitHub Enterprise: A Security-First Approach That Actually Works]({% post_url 2025-09-10-github-enterprise-security-best-practices %}) covers enterprise security configuration, including audit-log streaming.
- [Detecting Bad Actors: Key GitHub Audit Log Events Security Teams Should Monitor]({% post_url 2026-02-10-detecting-bad-actors-github-audit-log %}) covers event selection, baselines, and contextual detection rules.

## Data classification with custom properties

### What we do

**Every repository carries a required, enterprise-defined classification.** Start with a small schema:

| Property | Type | Values | Who sets it |
|---|---|---|---|
| `data-classification` | single select | Public, Internal, Confidential, Restricted | Governance team (or owners on request) |
| `compliance-frameworks` | multi select | SOX, PCI-DSS, GLBA, DORA, None | Governance team |
| `business-criticality` | single select | Critical, High, Medium, Low | Governance team |
| `owner-team` | string | Team slug | Governance if used for targeting; otherwise approved operational owner |
| `app-id` | string | CMDB/ITSM application ID | Governance team |

Yes, "Public" is in the list even with no public repos. It describes the **data** (say, docs headed for publication), not the repository.

Make the same inventory useful to engineers: `owner-team` routes support, `app-id` connects repositories to banking services, and criticality guides release and recovery planning. Classification should help people find the right owner, not merely supply another field to fill in.

### Why

The WAF [property guidance](https://learn.github.com/well-architected/library/governance/recommendations/managing-repositories-at-scale/custom-properties-best-practices/) supports hybrid ownership; here **governance owns every targeting property**, including criticality. Teams propose changes, never approve their own scope reduction. Control organization-owner authority and alert on downgrades.

For features without property targeting, reconcile scope through governed configuration. This supports **[EU-GDPR-25](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679)** and **[US-NYDFS-500.3](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500)**.

### How

1. Define properties at the enterprise level: **Enterprise > Policies > Custom properties**. See [Managing custom properties for repositories in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-repositories-in-your-enterprise/managing-custom-properties-for-repositories-in-your-enterprise).
2. Require properties with **fail-closed defaults**: `Restricted` classification, `Critical` criticality, and all potentially applicable regulated control tiers pending scope review. A default is quarantine, not completed classification.
3. Enable **Require explicit user-specified values** in governed provisioning. GitHub documents that existing repositories without explicit values still inherit defaults. Leave **Allow repository actors to set this property** **off** for every targeting property.
4. Apply an **active all-repository baseline** without property filters. New, missing, invalid, or unclassified entries receive the most restrictive access, change, scanning, and AI settings until governance approves their classification. Targeted overlays must never be the only protection.

Centrally approve and record any relaxation only after classification; a missing property never removes protection.

Keep the organization-level **"Edit custom properties values"** permission with governance. GHEC also supports enterprise-defined [organization custom properties](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-organizations-in-your-enterprise/custom-properties) for targeting enterprise rulesets at groups of organizations.

Only **active** controls count as implemented; use [Part 3's time-boxed rollout](/blog/github-waf-financial-services/change-control/) for evaluation.

An enterprise supports up to 100 property definitions. Copilot-suggested values and external-system synchronization are **public preview** and excluded from production; use a reviewed GA API/manual process with reconciliation to the authoritative inventory.

### Verify

Require **100% explicit, approved active-repository classification**, not non-null inherited defaults. Reconcile all organizations/IDs with the [properties API](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/custom-properties), provisioning, and CMDB. Audit archived data and require admission on unarchive.

Use the [custom properties API](https://docs.github.com/en/rest/orgs/custom-properties) to inspect repository IDs, property definitions, allowed values, and effective values. Join those records to the approved inventory and classification decisions.

| Information to inspect | Assessment |
|---|---|
| Repository population and stable IDs | Every active repository is represented, including new and transferred repositories |
| Classification value and approval record | The value is valid, explicitly approved, and consistent with the business service; an inherited default is not approval |
| Property ownership and change history | Only authorized owners can change targeting values; every downgrade has independent approval |
| Missing, inaccessible, or inconsistent records | Open a coverage exception and retain restrictive controls; do not report complete classification |

Use [`props.` searches](https://docs.github.com/en/enterprise-cloud@latest/search-github/searching-on-github/searching-for-repositories) as diagnostics, not the authoritative population. A Restricted internal repository is a finding. Alert on property definition/value changes and any downgrade; correlate each with an independently approved change. Run admission checks immediately and full coverage daily. Test a missing property and unauthorized downgrade: neither may remove effective protections.

## Network boundaries: IP allow lists

### What we do

**Restrict protected-resource access to approved egress ranges.** GitHub's enterprise IP allow list is the default network control, including for EMU. OIDC authentication can coexist with that choice. Choosing Entra CAP's IP allow list instead requires explicit gap analysis; it is not an equivalent boundary for every credential.

### Why

Approved egress limits stolen-token use (**[US-OCC-30-AppB](https://www.ecfr.gov/current/title-12/chapter-I/part-30/appendix-Appendix%20B%20to%20Part%2030)**, **[US-GLBA-314](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-314)**, **[EU-DORA-5-16](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554)**). Missing integration ranges can also cause silent failures: test both access and denial.

### How

Follow [Restricting network traffic to your enterprise with an IP allow list](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/hardening-security-for-your-enterprise/restricting-network-traffic-to-your-enterprise-with-an-ip-allow-list). The details that bite:

- **Pick one list model.** The IdP list deactivates GitHub's list for all organizations. [Part 2](/blog/github-waf-financial-services/identity-and-access/) covers CAP's credential/session gaps and preview limits; document residual risk and a tested fallback if selecting it.
- **Apps:** enable "IP allow list configuration for installed GitHub Apps." With OIDC, that option only works if you use GitHub's allow list.
- **Actions:** repository access, including `GITHUB_TOKEN`, must use approved egress. Do not admit broad, changing standard hosted-runner ranges to make CI pass. [Part 6](/blog/github-waf-financial-services/actions-hardening/) owns supported runner/static-IP and private-network implementation; validate region, capability, and the actual access path.
- **Know the gaps:** public resources accessed anonymously, personal-account forks, and (outside GHE.com) anonymized image URLs aren't covered.

### Verify

Alert on allow list changes. Review enterprise **and organization-added** entries quarterly; organization owners can expand their own lists. Test browser, PAT, SSH, app, and `GITHUB_TOKEN` requests from allowed and denied networks. For CAP, separately test installation tokens and deploy keys, which it does not cover.

## Audit logging and SIEM streaming

### What we do

**Stream enterprise audit logs on day one, including Git and supported API request events.** Keep a controlled copy independently of GitHub under the [record schedule and archive standard](#evidence-retention-and-integrity).

### Why

GHEC retains [180 days of audit events, seven days of Git events](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/security-and-compliance/audit-log-for-an-enterprise). Independent streaming supports **[US-NYDFS-500.6](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500)**, **[EU-DORA-RTS-LOGGING](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774)**, and **[INT-PCI-10.2](https://www.pcisecuritystandards.org/document_library/)**; applicable **[INT-PCI-10.4](https://www.pcisecuritystandards.org/document_library/)** logs also need automated daily review.

### How

- **Destination selection:** configure [audit log streaming](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise) to an approved supported target, such as Splunk, Azure Event Hubs, Datadog, S3, Azure Blob Storage, or Google Cloud Storage. Follow the destination-specific setup and verify authentication, deployment availability, residency, and retention capabilities. Prefer short-lived or federated identity where the integration supports it; do not assume every target supports the same authentication methods.
- **Ingestion permissions:** use a dedicated streaming identity or credential scoped to the approved destination resource. Grant only the documented permissions needed for delivery and any required encryption operations. Keep read, delete, retention administration, and unrelated access separate from ingestion. If the integration cannot enforce that separation, document the gap and approve tested compensating controls or choose another supported target.
- **Credential lifecycle:** name an owner, vault retained secret copies, independently approve stream administrators, and exclude streaming credentials from application repositories and Actions secrets. Rotate long-lived credentials at most every **90 days** and on relevant administrator departure. For planned rotation, test replacement delivery and archive reconciliation **before** disabling the old credential. Revoke exposed credentials immediately and reconcile any resulting delivery gap; alert on rotation/ingestion failures. Retain identity or credential IDs and evidence, not secret values.
- **Misuse detection:** enable the destination's access and administrative auditing, including data-plane events where supported; verify coverage rather than assuming these are enabled by default. Inspect identity or credential ID, timestamp, source, operation, target resource, and outcome where available. Alert on unexpected access, permission or retention changes, disabled logging, and ingestion failures. If required telemetry is unavailable, document and test compensating detection or choose a destination that meets the monitoring requirement.
- **Reconciliation and testing:** monthly, reconcile the streaming identity/credential inventory, permissions, credential age, and successful delivery. Before production, use a controlled test target to verify denial of unauthorized reads, deletes, retention changes, and unrelated-resource access where applicable. Confirm revoked credentials cannot deliver, failed replacement raises an alert, and recovery reconciles missing events. These tests are implementation prerequisites.
- Enable **API Request Events** on the same page. Only security-relevant endpoints are streamed, but that's what you want.
- Enable [source IP display](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/displaying-ip-addresses-in-the-audit-log-for-your-enterprise) after privacy review of IP storage obligations.
- Multi-endpoint streaming is **preview** and excluded from production. Stream once to an approved durable destination using GA streaming, then use a controlled downstream pipeline to feed the SIEM and immutable archive.
- **GHES:** [default indefinite retention](https://docs.github.com/en/enterprise-server@3.22/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise) is not independent recovery. [Stream](https://docs.github.com/en/enterprise-server@3.22/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise) or forward off-box.

If streaming is temporarily unavailable, treat the loss of delivery as an operational incident with an owner and restoration deadline. Use an approved supported forwarding alternative where available; do not replace streaming with a recurring API collection loop. Missing mandatory evidence blocks reliance on the affected control until coverage is restored or an independently approved alternative meets the requirement.

Use the [audit log API](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/using-the-audit-log-api-for-your-enterprise) for targeted investigation or bounded recovery of an identified gap, within documented rate limits and source retention. Follow every page, deduplicate recovered records, and retain event timestamps, action, actor, affected organization/repository, and available identity/correlation fields. Reconcile recovered records with archive receipts; permission failures, unavailable history, and unresolved gaps remain explicit incidents. An API response is not proof of complete coverage.

### Verify

- A **pause buffer** keeps seven days, and a misconfigured stream must be fixed within six days of the health-check email. Alert on `audit_log_streaming.update` and `audit_log_streaming.destroy`, and on silence from the source in your SIEM.
- Keep a dashboard of the boundary events listed earlier. Its existence and daily review is your **[INT-PCI-10.4](https://www.pcisecuritystandards.org/document_library/)** evidence.
- Run an annual **retention test**: pull an event older than 180 days from your SIEM and show it to an auditor.
- Test retrieval at each applicable retention floor, including the immediately available PCI window, and reconcile stream counts/time ranges with the archive.

## Evidence retention and integrity

The evidence owner and second line approve a schedule by **record type and applicable regime**. Platform retention is not that schedule:

| Applicable record | Minimum | Source |
|---|---|---|
| Material financial-transaction reconstruction records under [NYDFS 500.6(a)(1)](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Five years | [23 NYCRR 500.6(b)](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) |
| Cybersecurity audit trails under [NYDFS 500.6(a)(2)](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Three years | [23 NYCRR 500.6(b)](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) |
| PCI DSS in-scope audit log history | At least 12 months; latest three months immediately available for analysis | [PCI DSS v4.0.1, 10.5.1](https://www.pcisecuritystandards.org/document_library/) |
| Change, deployment, and other control records | Approved legal, audit, contractual, and institution schedule | Applicable requirements and second-line-approved schedule |

Apply the longest applicable obligation and legal holds; document privacy-driven minimization and disposal. These are not blanket periods for every repository, and auditors' SOX workpaper obligations do not define universal GitHub retention.

**Common archive design:**

1. **Capture:** stream audit events continuously, capture configuration on approved changes, and retain protected-branch change metadata including direct pushes and bypasses. Establish an initial configuration baseline and retain versioned snapshots from captured changes. [Part 3](/blog/github-waf-financial-services/change-control/) defines merge-time records; [Part 6](/blog/github-waf-financial-services/actions-hardening/) defines build/deployment capture and backfill. A PR page or scheduled screenshot can miss transient checks.
2. **Recover missed events:** monitor receiver health, durable queues, processing failures, and archive receipts. Use supported redelivery and bounded recovery requests for identified gaps before source history expires, not scheduled API inventory sweeps. Retain delivery IDs, recovery scope, and reconciliation results; unresolved gaps or permission errors are collection incidents, never successful empty inventories.
3. **Protect:** use encrypted, access-controlled immutable/retention-locked storage. Separate archive writers, retention administrators, and contributors. Signed manifests bind hashes to repository/commit/run IDs, timestamps, collector identity, and policy version. Log access and deletion attempts; hashes alone do not prevent replacement.
4. **Prove completeness:** reconcile captured events, archive receipts, the independently maintained service inventory, and release records daily; this assessment uses retained evidence rather than recurring GitHub API queries. Alert on stream/backfill failures and obtain monthly second-line review. Include manual attestations, reviewed UI captures where no API exists, and sign-offs with dates, actors, and scope. Event receipt alone does not establish population completeness.
5. **Test availability:** verify retrieval and hashes monthly, restore a sample quarterly, and test applicable retention floors and recent-log availability. Retain results and remediation.

Classify destinations for the data received and restrict collection to approved scope. Each domain part defines its evidence population, capture deadline, and failure response; these storage mechanisms are the series' design, not technology prescribed uniformly by every cited regulation.

## Backup and resilience

### What we do

**GHEC:** keep a narrow deployment mirror **plus an independent code and metadata recovery archive**. **GHES 3.22:** use the documented Backup Service, off-site archives, and HA. The institution owns scope, RPO/RTO, recovery authorization, and tests.

### Why

**[EU-DORA-12](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_12)**, **[US-FFIEC-BCM](https://ithandbook.ffiec.gov/it-booklets/business-continuity-management)**, **[CA-OSFI-E21](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/operational-risk-management-resilience-guideline)**, and **[US-NYDFS-500.16](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500)** require institution-owned recovery. The WAF [mirror pattern](https://learn.github.com/well-architected/library/architecture/recommendations/building-resilience-with-repository-mirroring/) is a rehearsed break-glass path to a separate GHES/Git service, not active-active operation.

The engineering goal is a **usable, authorized delivery path**. Recovering a Git repository without its packages, identity mappings, or release instructions can leave the payments team just as blocked as before.

### How

**Mirroring (any model):**

Define which approved branches and release tags must be recoverable, who operates the replication service, and how frequently it must capture changes to meet the agreed recovery point. GitHub's [repository duplication guidance](https://docs.github.com/en/repositories/creating-and-managing-repositories/duplicating-a-repository) describes the Git mechanisms; the institution must supply scheduling, access separation, monitoring, and recovery validation.

Mirror deployable refs explicitly, not with `--mirror`; isolate the mirror, credentials, and dependencies in a **separate failure domain**. Deploy an **exact SHA**. Rulesets, teams, secrets, and Actions history do not mirror: assign owners and rehearse the rest.

**Metadata recovery:** export PRs/reviews, approval/dismissal history, comments, issues/releases, settings/rulesets, properties, team access, and policies on an RPO-compliant schedule. Use paginated [PR](https://docs.github.com/en/enterprise-cloud@latest/rest/pulls/pulls), [review](https://docs.github.com/en/enterprise-cloud@latest/rest/pulls/reviews), and [ruleset APIs](https://docs.github.com/en/enterprise-cloud@latest/rest/repos/rules); supplement with supported exports/reviewed UI captures.

Recover transient merge-time evidence under [Part 3's capture requirements](/blog/github-waf-financial-services/change-control/) and the [archive standard](#evidence-retention-and-integrity), not scheduled snapshots alone.

Include required refs, LFS, release assets, packages, and deployment dependencies. Recover secrets through the vault, never plaintext exports. Retain readable historical evidence where APIs cannot recreate original reviews/IDs; archive readability does not prove native restoration.

**GHES:** configure [Backup Service](https://docs.github.com/en/enterprise-server@3.22/admin/backing-up-and-restoring-your-instance/about-the-backup-service-for-github-enterprise-server) in the Management Console, plus validated off-site/[remote archives](https://docs.github.com/en/enterprise-server@3.22/admin/backing-up-and-restoring-your-instance/configuring-remote-archives-for-backups). Its dedicated snapshot volume is not off-site. [backup-utils](https://github.com/github/backup-utils/blob/master/README.md) recommends the built-in service for new deployments. [HA](https://docs.github.com/en/enterprise-server@3.22/admin/monitoring-and-managing-your-instance/configuring-high-availability/about-high-availability-configuration) does not replace backups: corruption can replicate.

**Rehearse the business journey, not just the restore command.** The recovery owner maintains a scenario, expected result, authorized operators, dependency list, and abort criteria for each critical service.

For a payments release drill:

1. Declare the primary code-host path unavailable in an isolated exercise. Start the RTO clock at the approved incident/recovery trigger.
2. Select the last approved release SHA and measure its recovered-data age against RPO. Confirm artifacts, packages, configuration, and readable change evidence are available.
3. Use replacement identity and vault access from the recovery environment. Verify the alternative does not require the failed service to authenticate or retrieve its runbook.
4. Reapply access and change protections, then run tests and an independently authorized deployment to a non-production target. Demonstrate rejection of an unapproved revision too.
5. Reconcile changes made during recovery, define return-to-primary authority, and validate the handback procedure. Record elapsed time, manual steps, missing dependencies, and remediation owners.

Maintain scenarios for accidental repository deletion, lost metadata, unavailable IdP, failed artifact retrieval, and archive corruption. Rotate scenarios by risk tier; a tabletop helps coordination but does not replace a technical restore.

### Verify

- Alert on mirror **freshness**: compare source and mirror object IDs per ref.
- Run at least an annual **deploy-from-mirror drill** (quarterly for Tier 1 services) and file the results as BCM test evidence.
- **GHES:** perform a quarterly restore into a staging instance and record the restore time against your RTO.
- **GHEC:** download the **GitHub.com Services Continuity and Incident Management Plan** from the Compliance tab and attach it to your BCM vendor dependency record.
- Restore a selected change's **code and evidence** into an isolated environment. Verify manifest counts, hashes, chronology, approvals, ruleset configuration, and access restrictions; record any native-restoration limitations.
- Exercise the [provider exit plan](#provider-exit-and-concentration-risk); a mirror alone is not an exit strategy.
- Have release operations and a consuming application team witness the drill. Close recovery gaps with a retest, not only an updated document.

## Vendor assurance and third-party risk

### What we do

**Assess GitHub as an ICT provider under your institution's third-party risk program.** Reports are inputs to a scoped assessment, not substitutes for due diligence or your control responsibilities.

### Why

**[US-3PRM-2023](https://www.federalreserve.gov/supervisionreg/srletters/SR2304.htm)**, **[US-NYDFS-500.11](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500)**, **[CA-OSFI-B10](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/third-party-risk-management-guideline)**, **[EU-DORA-28-30](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_28)**, **[MX-CNBV-CUB](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf)**, and **[INT-PCI-12.8](https://www.pcisecuritystandards.org/document_library/)** require provider due diligence/monitoring. **[INT-PCI-12.9](https://www.pcisecuritystandards.org/document_library/)** covers provider responsibility/scoping information, including GitHub's PCI AoC.

### How

Download [Compliance-tab reports](https://docs.github.com/en/enterprise-cloud@latest/admin/overview/accessing-compliance-reports-for-your-enterprise): SOC 1/2 Type 2, ISO/IEC 27001:2022, CSA CAIQ Level 1/STAR Level 2, PCI AoC, Bug Bounty quarterly reports, and the Services Continuity and Incident Management Plan.

The [Trust Center](https://ghec.github.trust.page/) provides additional documentation. GHES physical, network, patching, and backup controls belong to your environment/SOC scope.

**Check scope:** entity, period, regions, GHE.com, Actions, Copilot features/models, and runners. Record exclusions, previews, and separate-assurance needs; a shared brand does not prove coverage.

Review opinions, exceptions, remediation, complementary user entity controls (**CUECs**), subservice organizations, and the inclusive versus carve-out method. For carved-out providers, obtain suitable separate assurance or document and mitigate the gap. Map CUECs to tested institution controls with named owners.

### Provider exit and concentration risk

Inventory GitHub and the delivery dependencies around it: IdP, DNS/network paths, runners, package registries, secrets/signing services, ITSM, and evidence destinations. Add enabled AI/model providers where applicable.

Record legal provider, service, business function, criticality, regions, subcontractors, assurance scope, contract owner, and renewal/termination terms. For DORA-covered entities, maintain the [Article 28(3) register of ICT contractual arrangements](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_28); distinguish dependencies from direct contracts and assess critical/important functions.

**Connect the register to operations.** For each critical delivery journey, record which dependency can stop it, the escalation route, the tested fallback, and who can invoke it. A provider-status notification needs an institution owner who can determine whether settlement-window releases are affected.

The platform, BCM, and third-party risk owners approve and exercise an exit plan:

1. **Authority:** name the decision maker and triggers: outage, deterioration, unacceptable transfer/subcontractor change, or termination.
2. **Scope:** recover Git history/refs, LFS/packages/releases, issues, PR/review/check evidence, policies/rulesets, identity mappings, pipeline definitions, and deployments. Record export and native-restoration gaps.
3. **Replacement:** identify another code host and build/deploy path, replacement identity/secrets, artifact verification, independent approval, and archived evidence access.
4. **Execution:** document cost, capacity, RTO/RPO, transition assistance, data return/deletion, and rehearse recovery plus an independently approved deployment without the original service.
5. **Concentration:** test whether the alternative still depends on the same cloud, identity, runner infrastructure, artifact store, or enabled model provider. Retain results, gaps, owners, and remediation dates.

[Part 6](/blog/github-waf-financial-services/actions-hardening/) implements pipeline recovery; [Part 7](/blog/github-waf-financial-services/copilot-and-agents/) adds model-provider requirements. A mirror of `main` and a downloaded SOC report are not this plan.

### Verify

Refresh annually and on material changes. Escalate period gaps; assess bridge letters/current evidence without treating them as extensions of an auditor's opinion. Track findings to closure with second-line sign-off.

Review the register, contracts, concentration assessment, and exit rehearsal alongside assurance findings. Include hosted runners, identity, artifacts, and any enabled model-provider dependencies. Feed material changes into the service backlog, threat model, and recovery scenarios.

## Control matrix

**All rows contribute to the listed requirements only.** Compliance validates scope and sufficiency before these become institution controls.

| Control | Contributes to requirement IDs | GitHub feature | Evidence | Cadence |
|---|---|---|---|---|
| Deployment model decision | [US-NYDFS-500.3](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500), [CA-OSFI-B13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management), [EU-GDPR-44](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679), [EU-DORA-28-30](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_28), [BR-CMN-4893](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf) | GHE.com including EMU; documented alternatives | ADR, DPA/data flows, applicable transfer assessments and approvals | Annual and material change |
| Minimal org topology | [US-FFIEC-INFOSEC](https://ithandbook.ffiec.gov/it-booklets/information-security), [EU-DORA-5-16](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554) | Enterprise account, red-green-sandbox orgs | Org inventory with purpose and owners | Quarterly |
| Reviewed configuration management | [US-NYDFS-500.3](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500), [US-FFIEC-INFOSEC](https://ithandbook.ffiec.gov/it-booklets/information-security) | Protected policy repository and event-driven configuration service, with native preventive controls | Approved commits, effective differences, application/verification records, exception expiry, and failure tests | On policy/lifecycle changes; monthly operating review |
| No public repos | [US-GLBA-314](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-314), [US-OCC-30-AppB](https://www.ecfr.gov/current/title-12/chapter-I/part-30/appendix-Appendix%20B%20to%20Part%2030), [EU-GDPR-25](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679), [CL-CMF-20-10](https://www.cmfchile.cl/portal/normativa/624/articles-29310_doc_pdf.pdf) | EMU and enforced member privileges; controlled provisioning and owner actions | Complete inventory, policy captures, negative tests, alerts and closure | Daily reconciliation |
| Forking contained | [US-GLBA-314](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-314), [CO-SFC-CBJ-006-2025](https://www.superfinanciera.gov.co/publicaciones/10115528/circular-basica-juridica-ce-00625/) | Enforced private/internal forking block, EMU | Policy capture; negative tests; existing fork inventory and approved exceptions | Daily alert/reconciliation |
| Outside collaborators gated | [US-OCC-30-AppB](https://www.ecfr.gov/current/title-12/chapter-I/part-30/appendix-Appendix%20B%20to%20Part%2030), [US-NYDFS-500.11](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Invitation policy; EMU guest collaborators | `org.add_outside_collaborator` review log | Daily review |
| Deletion/transfer gated | [US-FFIEC-INFOSEC](https://ithandbook.ffiec.gov/it-booklets/information-security), [EU-DORA-5-16](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554) | Member privileges; repository policy | `repo.destroy`, `repo.transfer_outgoing` alerts | Daily alert |
| Pages/gists contained | [EU-GDPR-25](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679) | EMU; org Pages policy; GHES authenticated access | Complete site inventory, old-site remediation and anonymous URL tests | Daily reconciliation |
| Data classification | [US-NYDFS-500.3](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500), [EU-GDPR-25](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679) | Governance-owned targeting properties; all-repo baseline | 100% approved active inventory; restrictive defaults; downgrade alerts/tests | Admission and daily |
| Network restriction | [US-OCC-30-AppB](https://www.ecfr.gov/current/title-12/chapter-I/part-30/appendix-Appendix%20B%20to%20Part%2030), [EU-DORA-5-16](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554) | GitHub IP allowlist; approved CAP exceptions | Entry review sign-off; `ip_allow_list.*` alerts | Quarterly |
| Audit log streaming | [US-NYDFS-500.6](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500), [EU-DORA-RTS-LOGGING](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774), [INT-PCI-10.2](https://www.pcisecuritystandards.org/document_library/), [INT-PCI-10.4](https://www.pcisecuritystandards.org/document_library/), [INT-PCI-10.5.1](https://www.pcisecuritystandards.org/document_library/) | Streaming to controlled archive and SIEM | Completeness/integrity checks; applicable retention-floor retrieval tests; reviewed alerts | Daily / annual |
| Durable control evidence | [US-NYDFS-500.6](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500), [EU-DORA-RTS-LOGGING](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774), [INT-PCI-10.5.1](https://www.pcisecuritystandards.org/document_library/) | Independent archive and record schedule | Signed manifests, daily completeness reports, retrieval/restore tests, review sign-offs | Daily; monthly review; quarterly restore |
| Recovery path | [EU-DORA-12](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_12), [US-FFIEC-BCM](https://ithandbook.ffiec.gov/it-booklets/business-continuity-management), [CA-OSFI-E21](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/operational-risk-management-resilience-guideline), [US-NYDFS-500.16](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Deployment mirror plus code/metadata archive; GHES backups | Freshness, merge evidence manifests, code-and-metadata restore drills | RPO-based; quarterly drills |
| Vendor assurance and exit | [US-3PRM-2023](https://www.federalreserve.gov/supervisionreg/srletters/SR2304.htm), [CA-OSFI-B10](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/third-party-risk-management-guideline), [EU-DORA-28-30](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_28), [MX-CNBV-CUB](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf), [INT-PCI-12.8](https://www.pcisecuritystandards.org/document_library/) | Reports plus institution TPRM and exit process | Scope/subservice/period-gap assessment, CUECs, register and tested exit plan | Annual and material change |

## Summary and key takeaways

**A well-architected platform makes routine engineering predictable and disruption survivable.** Its value shows up when a team onboards without a ticket maze, shares code within approved boundaries, or recovers an authorized release without improvising.

Data boundaries and evidence remain essential. Pair them with ownership, service objectives, and customer feedback so they support delivery rather than becoming a parallel reporting exercise.

**Your checklist:**

- [ ] Name product, operational, IAM, evidence, and recovery owners; publish supported services and risk-tiered escalation.
- [ ] Establish a protected policy repository and event-driven configuration service; test independent approval, drift response, exception expiry, coverage gaps, and recovery.
- [ ] Baseline request-to-ready time, delivery-path availability, evidence lag, and recovery performance. Agree targets and reliability actions with consumers.
- [ ] Choose **GHEC with data residency, including EMU**; document and approve any alternative.
- [ ] Read the [out-of-region data list](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-storage-of-your-data-with-data-residency) with privacy before choosing GHE.com; separately review Copilot residency policy if enabling that service.
- [ ] Stand up one enterprise with **green, red, and sandbox** organizations. Push back on more.
- [ ] Enforce no public repos and disable private/internal forks by default. Remediate previously public Pages and existing lower-control forks.
- [ ] Use supported GA releases and GA features only in production; exclude preview overlays and dependencies. Keep any approved prerelease evaluation isolated from production, using synthetic data and no production credentials.
- [ ] Require **100% approved classification** of active repositories, governance-owned targeting properties, and restrictive defaults under an all-repo baseline.
- [ ] Configure the **GitHub IP allowlist**; approve CAP exceptions and test app/runner access.
- [ ] **Stream audit logs** with Git events, API request events, and source IPs, and alert on the boundary events.
- [ ] Recover **code and metadata**, archive checks at merge, and test immutable evidence retrieval and completeness.
- [ ] Assess report scope, subservice exclusions, bridge evidence, CUECs, and the shared provider exit plan.
- [ ] Rehearse a payments release recovery across identity, source, artifacts, authorization, and evidence; retest identified gaps.

**Start here:** choose one critical delivery journey and name its service owner. Run the inventory diagnostic, complete boundary verification, and test that journey through onboarding and recovery. Route every violation or unknown result to an accountable owner.

**Previous:** [Series Overview and Compliance Crosswalk](/blog/github-waf-financial-services/)
**Next:** [Part 2: Identity and Access Management](/blog/github-waf-financial-services/identity-and-access/).

## References

Official regulatory sources are linked in [the requirements](#the-requirements); procedures are linked beside each control. Further reading:

- [Governance design principles](https://learn.github.com/well-architected/library/governance/design-principles/)
- [Governance checklist](https://learn.github.com/well-architected/library/governance/checklist/)
- [REST API endpoints for organizations](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/orgs)
