---
layout: post
title: "GitHub Well-Architected for Financial Services: Series Overview and Compliance Mapping"
date: 2026-11-10 10:00:00 -0600
category: Blog
tags: [github, well-architected, financial-services, compliance, security, governance, regulatory, enterprise]
excerpt: "How to apply GitHub Well-Architected at a financial institution: govern the platform, design for resilience, secure software, improve collaboration, and make delivery more effective within regulatory requirements."
permalink: /blog/github-waf-financial-services/
---

*This post is part of the [GitHub Well-Architected for Financial Services](/blog/github-waf-financial-services/) series.*

**Next:** [Part 1: Platform Foundation and Data Boundaries](/blog/github-waf-financial-services/platform-foundation/)

{::options toc_levels="2" /}

**In this post**

* Contents
{:toc}

> **A friendly note:** Validate these patterns with your compliance and regulatory reporting teams.

## Leadership brief

- **Why it matters:** The way you run GitHub affects how safely and reliably your institution delivers changes to customer services.
- **Your decision:** Treat it as a business-critical service with a funded owner, common standards, and a plan for disruption.
- **Accountability:** Technology leaders own delivery, security leaders set protection expectations, and business leaders identify which services cannot afford disruption.
- **Ask for:** Evidence that teams can deliver approved changes, protect sensitive information, and recover within agreed limits. Compliance alone is not success.

---

Friday afternoon, a payments team needs to release a fix before the next processing window. The change is ready, but the shared workflow has no clear owner, the runner queue is backed up, and the release approver cannot find the test results. Someone suggests bypassing the pipeline. Naturally, this is when everyone discovers the runbook was last updated by someone who left two years ago.

That is not just a security problem or a developer productivity problem. It is an architecture, ownership, collaboration, and operational resilience problem. The institution needs a delivery platform that helps people make safe changes reliably, including when a business deadline is inconvenient.

**This series is about how to apply GitHub Well-Architected in a financial institution.** Not a checklist for passing an exam, and not a rollout plan for one product.

This guide applies [GitHub Well-Architected](https://learn.github.com/well-architected/library/overview/) to banks, credit unions, insurers, payment processors, and capital markets firms. It is written for GitHub admins, platform engineers, security engineers, and engineering leaders, with short leadership summaries and a [dedicated CIO/CISO brief](/blog/github-waf-financial-services/leadership-brief/).

## Applying WAF in a financial institution

Start with what the institution needs its engineering platform to accomplish. A payments service, an actuarial library, and a public documentation site do not have identical risks. They still need accountable owners, a usable contribution process, and a supported way to build and release.

Use this sequence:

1. **Identify the business services and dependencies.** Inventory repositories, owners, data classifications, integrations, build infrastructure, and release destinations. Record which services depend on each shared component.
2. **Assess all five pillars.** Capture the current state using the WAF assessment and checklists. Look for failure modes and avoidable friction, not just missing security switches.
3. **Choose a common baseline and risk-tiered patterns.** Define enterprise non-negotiables, approved implementation paths, and an owned exception process. Apply additional controls where data sensitivity or business criticality requires them.
4. **Build the supported path.** Provide repository templates, documented access requests, shared workflows, clear review ownership, vulnerability response, and tested recovery procedures. Make the approved path practical enough that teams do not need a workaround to ship.
5. **Verify and improve.** Test enforcement and recovery, retain operating evidence, and measure onboarding time, review delays, pipeline reliability, and remediation. Feed recurring problems into the platform backlog.

For the payments example, success means the team can find its reviewer, use a maintained workflow, obtain runner capacity, retrieve trustworthy results, and release with independent approval. If a dependency fails, the team knows whether to wait, recover, or invoke an authorized emergency procedure. "We had branch protection enabled" answers only a small part of that story.

Regulation shapes these decisions; it does not replace architecture or engineering judgment. The rest of the series connects platform practices to applicable obligations without turning every useful engineering improvement into a claimed regulatory requirement.

## Compliance is a baseline, not a finish line

### Regulations are guideposts

Regulations describe **outcomes**, rarely implementations. [DORA Article 9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9) asks for ICT security that protects the availability, authenticity, integrity, and confidentiality of data. [NYDFS 23 NYCRR 500.12](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) requires multi-factor authentication. Neither one tells you to click a specific checkbox in a GitHub enterprise settings page.

Regulators set a **baseline**; institutions choose implementations suited to their risk, size, and complexity. Two banks can meet it differently. Think 2+2=4: count two dots beside two more, put two apples beside another two, snap together two pairs of counting cubes, or start at 2 on a number line and hop forward twice. Different methods, same answer. Nobody needs to mandate the apples, but you still have to show that you ended up with four.

This series does not say "do this and you'll pass." It connects:

- "Here's the platform outcome and the risk we're addressing."
- "Here's where GitHub Well-Architected points you, and which requirements are relevant."
- "Here's a practical pattern for **your organization's implementation**."
- "Here's how you prove it works and whether it helps teams deliver."

### Auditors check that you did what you said you'd do

If the regulation says you must have a password policy, an auditor wants to see two things:

1. **That the policy exists.** It's written down, approved, and owned by someone.
2. **That you enforce it.** The systems actually behave the way the policy says, and you have evidence over time, not just a screenshot from this morning.

They also assess whether the policy and design are **adequate** for applicable requirements and risk. Following an inadequate policy is still a control failure; engineering cannot lower the floor to match today's tooling.

A policy requiring MFA means little if accounts can bypass your identity provider. Now you have a documented control failure.

GitHub can lock enterprise settings, enforce push/merge rules, and stream audit events. Archive that machine evidence alongside the approvals and external records GitHub cannot supply.

### The four questions

Every control in this series follows the same pattern:

| Question | What it means | Who usually cares most |
|---|---|---|
| **What we do** | The opinionated default we recommend | Platform and security engineers |
| **Why we do it** | The engineering outcome, risk, applicable requirements, and Well-Architected guidance | Engineering leaders, risk, compliance, and audit |
| **How we do it** | Supported configuration/API references, responsibilities, and implementation requirements | GitHub admins |
| **How we verify it** | Enforcement tests, retained evidence, service outcomes, and review cadence | Platform owners, engineering teams, internal audit, and second line |

If you remember nothing else from this series, remember the fourth row. A control without verification is a hope, not a control.

### Your policy adds requirements; it does not replace them

**Your policy adds an audit obligation**, not a substitute for regulation. If it requires critical vulnerabilities fixed within 15 days, auditors test for 15 days even when the regulation says "timely."

Write adequate policies, fund their controls, and collect evidence. Escalate gaps with owners and remediation dates rather than rewriting the floor.

## What GitHub Well-Architected brings to the table

[GitHub Well-Architected](https://learn.github.com/well-architected/library/overview/) is GitHub's framework of best practices for running GitHub at scale. It's open source ([github/github-well-architected](https://github.com/github/github-well-architected)) and organized in [layers](https://learn.github.com/well-architected/library/overview/layers/): pillars, design principles, checklists, and recommendations.

Use all five pillars together. The middle column below is this series' financial-institution application of each pillar, not a replacement for the framework's own guidance:

| Pillar | What it covers | Where it shows up in this series |
|---|---|---|
| [Governance](https://learn.github.com/well-architected/library/governance/overview/) | Accountable platform ownership, enterprise policy, classification, access lifecycle, and time-bound exceptions | Parts 1, 2, 3; capability-specific extension in Part 7 |
| [Application Security](https://learn.github.com/well-architected/library/application-security/overview/) | Secret protection, secure development, vulnerability response, dependency integrity, and actionable developer feedback | Parts 4, 5, 6 |
| [Architecture](https://learn.github.com/well-architected/library/architecture/overview/) | Deployment model, enterprise topology, integrations, runner isolation, service dependencies, and tested recovery | Parts 1, 6 |
| [Collaboration](https://learn.github.com/well-architected/library/collaboration/overview/) | Discoverable repositories, maintained documentation, review ownership, controlled inner source, and shared workflow stewardship | Parts 2, 3, 6 |
| [Productivity](https://learn.github.com/well-architected/library/productivity/overview/) | Usable onboarding, supported delivery paths, effective CI, reduced rework, and outcome-based improvement | Parts 2, 3, 5, 6; optional Copilot adoption in Part 7 |

WAF provides two framework resources as starters:

- **[NIST SSDF implementation scenario](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/):** practice-by-practice GitHub implementations, tagged for finance. Use alongside Parts 3, 5, and 6.
- **[Assessment](https://learn.github.com/well-architected/library/overview/about-the-assessment/) and [getting started checklist](https://learn.github.com/well-architected/library/overview/getting-started-checklist/):** capture a baseline before changing controls. Auditors love a documented "before."

**This series adds** financial-services scenarios, operating responsibilities, topic-specific recommendations, regulatory mapping, and verification. The chapters follow platform capabilities because an actual release crosses several pillars; they are not five disconnected pillar checklists. Follow the linked Well-Architected and GitHub Docs procedures for step-by-step setup.

### What each installment contributes

- **Part 1:** Establish the platform's deployment model, boundaries, ownership, evidence, and continuity arrangements.
- **Part 2:** Give people and services appropriate access, with predictable onboarding, access reviews, and removal.
- **Part 3:** Make repositories understandable and contribution paths usable while retaining independent change authorization.
- **Part 4:** Prevent credential exposure and make rotation and response an owned operational process.
- **Part 5:** Integrate secure development and supply-chain assurance with developer feedback and risk-based remediation.
- **Part 6:** Provide reusable, reliable delivery paths with secure execution, effective CI, and accountable capacity.
- **Part 7:** Apply the established operating model to Copilot where the institution chooses to use it, adding the controls specific to models, context, and agents.

AI adoption does not define the platform’s maturity. Parts 1–6 provide a platform improvement baseline whether or not the institution uses AI development tools. Part 7 applies that baseline to GitHub Copilot; its governance principles also inform other GenAI development tools, but their technical controls require separate validation.

## Scope and deployment baseline

The series defaults to **GHEC with data residency, including Enterprise Managed Users**. [Part 1](/blog/github-waf-financial-services/platform-foundation/#choosing-your-deployment-model) owns the decision criteria, separation benefits, data-flow exceptions, and alternatives. Each technical part covers its deployment-specific differences; GHES comparisons use **3.22**, subject to the actual plan and release.

Examples are design patterns, not implemented controls until institution-specific IDs, integrations, and approvals are completed and tested. Second line validates applicability and adequacy; internal audit determines its testing independently. Production guidance uses supported GA releases and GA features only. Beta, preview, and release-candidate capabilities are excluded, including supplemental controls. [Part 1's GA production baseline](/blog/github-waf-financial-services/platform-foundation/#feature-availability-and-preview-controls) governs feature selection; local caveats identify exclusions and production alternatives.

## The regulatory landscape we cover

These representative sources cover four regions and cross-industry standards. Add your state, provincial, and sector-specific obligations; most regimes ask for similar **control families**.

### United States

- [FFIEC IT Examination Handbook](https://ithandbook.ffiec.gov/it-booklets/information-security) (Information Security; [Development, Acquisition, and Maintenance](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance); [Architecture, Infrastructure, and Operations](https://ithandbook.ffiec.gov/it-booklets/architecture-infrastructure-and-operations); [Business Continuity Management](https://ithandbook.ffiec.gov/it-booklets/business-continuity-management))
- GLBA safeguards: [FTC Safeguards Rule, 16 CFR Part 314](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-314) and the [Interagency Guidelines, 12 CFR Part 30 Appendix B](https://www.ecfr.gov/current/title-12/chapter-I/part-30/appendix-Appendix%20B%20to%20Part%2030)
- [NYDFS 23 NYCRR Part 500](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) (as amended in 2023)
- [Sarbanes-Oxley Section 404](https://www.govinfo.gov/content/pkg/USCODE-2023-title15/pdf/USCODE-2023-title15-chap98-subchapII-sec7262.pdf) and [PCAOB AS 2201](https://pcaobus.org/oversight/standards/auditing-standards/details/AS2201) (the source of IT general controls testing)
- [Interagency Guidance on Third-Party Relationships](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) (2023)
- SEC [Regulation S-P amendments](https://www.federalregister.gov/documents/2024/06/03/2024-11116/regulation-s-p-privacy-of-consumer-financial-information-and-safeguarding-customer-information) (2024) for broker-dealers and investment advisers

### Canada

- [OSFI Guideline B-13, Technology and Cyber Risk Management](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management)
- [OSFI Guideline B-10, Third-Party Risk Management](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/third-party-risk-management-guideline)
- [OSFI Guideline E-21, Operational Risk Management and Resilience](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/operational-risk-management-resilience-guideline)
- Privacy: [PIPEDA](https://laws-lois.justice.gc.ca/eng/acts/P-8.6/index.html) and [Quebec Law 25](https://www.legisquebec.gouv.qc.ca/fr/document/cs/P-39.1)
- Quebec's AMF: [ICT risk management](https://lautorite.qc.ca/en/professionals/insurers/guidelines/operational-risk/guideline-on-information-and-communications-technology-risk-management) and [third-party risk management](https://lautorite.qc.ca/en/professionals/deposit-institutions-and-trust-companies/guidelines/operational-risk/third-party-risk-management-guideline) guidelines

### LATAM

- **Brazil:** [CMN Resolution 4,893/2021](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf) (cybersecurity policy and cloud/data processing), [BCB Resolution 85/2021](https://www.bcb.gov.br/content/about/legislation_norms_docs/BCB_Resolution_No_85_2021.pdf) (payment institutions), and the [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) (Portuguese)
- **Mexico:** [CNBV Circular Única de Bancos](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) and the [2025 LFPDPPP](https://www.diputados.gob.mx/LeyesBiblio/ref/lfpdppp/LFPDPPP_orig_20mar25.pdf) (Spanish)
- **Colombia:** [SFC Circular Básica Jurídica, Circular Externa 006 de 2025](https://www.superfinanciera.gov.co/publicaciones/10115528/circular-basica-juridica-ce-00625/) (Spanish)
- **Chile:** [CMF RAN Chapter 20-10](https://www.cmfchile.cl/portal/normativa/624/articles-29310_doc_pdf.pdf) and the [Cybersecurity Framework Law 21.663](https://www.leychile.cl/Navegar?idNorma=1202434) (Spanish)
- **Peru:** [SBS Resolution 504-2021](https://intranet2.sbs.gob.pe/dv_int_cn/2046/v2.0/Adjuntos/504-2021.R.pdf) (Spanish)
- **Argentina:** [BCRA Communication "A" 7724](https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A7724.pdf) (Spanish)

### European Union

- [DORA, Regulation (EU) 2022/2554](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554) and its [RTS on the ICT risk management framework, Delegated Regulation (EU) 2024/1774](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774)
- [NIS2, Directive (EU) 2022/2555](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2555#art_4) (DORA applies as the sector-specific act for most financial entities)
- [GDPR, Regulation (EU) 2016/679](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679)
- [EBA Guidelines on ICT and security risk management](https://www.eba.europa.eu/activities/single-rulebook/regulatory-activities/internal-governance/guidelines-ict-and-security-risk-management) (largely superseded by DORA for in-scope entities, but still relevant for some)

### Cross-industry standards and reference frameworks

- [PCI DSS v4.0.1](https://www.pcisecuritystandards.org/document_library/) (Requirements 6, 7, 8, 10, and 12.8/12.9 do most of the work for us)
- [SWIFT Customer Security Programme](https://www.swift.com/myswift/customer-security-programme) (the full control set is member-gated, so we reference it generally)
- [NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework) and [NIST SP 800-218 SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) as common reference models

Capability-specific sources, including AI and model-risk applicability, belong with the relevant implementation. [Part 7](/blog/github-waf-financial-services/copilot-and-agents/#the-requirements) carries those sources and scope distinctions rather than making them the regulatory frame for the whole platform.

## Mapping

The guidance **contributes to** these representative requirements; it does not independently satisfy them. Each technical part supplies its requirements, controls, and evidence matrix.

| Control family | Representative requirements | Where we cover it |
|---|---|---|
| **Data boundaries and residency** (no public exposure, data stays where it should) | [GLBA Safeguards (16 CFR 314)](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-314); [NYDFS 500.3](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500); [OSFI B-13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management); [CMN 4,893](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf); [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm); [GDPR Art. 25 and 44](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679#art_25); [DORA Arts. 5-16](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_5) | [Part 1](/blog/github-waf-financial-services/platform-foundation/) |
| **Audit logging and monitoring** | [NYDFS 500.6](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500); [PCI DSS 10.2 and 10.4](https://www.pcisecuritystandards.org/document_library/); [DORA RTS 2024/1774 Art. 12](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774#art_12); [FFIEC Information Security](https://ithandbook.ffiec.gov/it-booklets/information-security) | [Part 1](/blog/github-waf-financial-services/platform-foundation/), plus evidence in every part |
| **Resilience, backup, and recovery** | [DORA Art. 12](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_12); [FFIEC BCM](https://ithandbook.ffiec.gov/it-booklets/business-continuity-management); [OSFI E-21](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/operational-risk-management-resilience-guideline); [NYDFS 500.16](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | [Part 1](/blog/github-waf-financial-services/platform-foundation/) |
| **Third-party and ICT provider risk** (GitHub itself is a third party) | [Interagency TPRM guidance](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management); [NYDFS 500.11](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500); [OSFI B-10](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/third-party-risk-management-guideline); [DORA Arts. 28-30](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_28); [PCI DSS 12.8 and 12.9](https://www.pcisecuritystandards.org/document_library/); [AMF TPRM](https://lautorite.qc.ca/en/professionals/deposit-institutions-and-trust-companies/guidelines/operational-risk/third-party-risk-management-guideline) | [Part 1](/blog/github-waf-financial-services/platform-foundation/), [Part 7](/blog/github-waf-financial-services/copilot-and-agents/) |
| **Identity, MFA, and least privilege** | [NYDFS 500.7 and 500.12](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500); [PCI DSS 7.2 and 8.3/8.4](https://www.pcisecuritystandards.org/document_library/); [DORA RTS Arts. 20-21](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774#art_20); [12 CFR 30 App. B](https://www.ecfr.gov/current/title-12/chapter-I/part-30/appendix-Appendix%20B%20to%20Part%2030); [SBS 504-2021](https://intranet2.sbs.gob.pe/dv_int_cn/2046/v2.0/Adjuntos/504-2021.R.pdf); [BCRA A 7724](https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A7724.pdf) | [Part 2](/blog/github-waf-financial-services/identity-and-access/) |
| **Change management and separation of duties** | [SOX 404](https://www.govinfo.gov/content/pkg/USCODE-2023-title15/pdf/USCODE-2023-title15-chap98-subchapII-sec7262.pdf) / [PCAOB AS 2201](https://pcaobus.org/oversight/standards/auditing-standards/details/AS2201) (ITGCs); [DORA RTS Art. 17](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774#art_17); [FFIEC DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance); [PCI DSS 6.2](https://www.pcisecuritystandards.org/document_library/); [CNBV CUB](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) | [Part 3](/blog/github-waf-financial-services/change-control/), [Part 6](/blog/github-waf-financial-services/actions-hardening/) |
| **Secrets and cryptographic material** | [NYDFS 500.15](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) (key protection support, not encryption coverage); [DORA RTS Art. 6](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774#art_6); [GDPR Art. 32](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679#art_32); [CMN 4,893](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf); [CMF RAN 20-10](https://www.cmfchile.cl/portal/normativa/624/articles-29310_doc_pdf.pdf) | [Part 4](/blog/github-waf-financial-services/secrets-protection/) |
| **Secure development and vulnerability management** | [NYDFS 500.8](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500); [PCI DSS 6.2 and 6.3](https://www.pcisecuritystandards.org/document_library/); [DORA RTS Art. 10](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774#art_10); [FFIEC DAM](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance); [NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) | [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/) |
| **Pipeline integrity and deployment control** | [DORA Art. 9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9); [OSFI B-13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management); [FFIEC AIO](https://ithandbook.ffiec.gov/it-booklets/architecture-infrastructure-and-operations); [SWIFT CSCF](https://www.swift.com/myswift/customer-security-programme); [NIST SSDF PO.5](https://csrc.nist.gov/pubs/sp/800/218/final) | [Part 6](/blog/github-waf-financial-services/actions-hardening/) |
| **AI and model risk** | [SR 26-2](https://www.federalreserve.gov/supervisionreg/srletters/sr2602.htm) / [OCC 2026-13](https://www.occ.gov/news-issuances/bulletins/2026/bulletin-2026-13.html) (scope distinction, not a generative-AI mandate); [OSFI E-23](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/guideline-e-23-model-risk-management-2027); [EU AI Act Arts. 4 and 26](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689#art_4) (where applicable); [NYDFS AI industry letter](https://www.dfs.ny.gov/industry-guidance/industry-letters/il20241016-cyber-risks-ai-and-strategies-combat-related-risks) | [Part 7](/blog/github-waf-financial-services/copilot-and-agents/) |

PCI DSS links point to the official document library; select v4.0.1 and the cited requirements. The full SWIFT CSCF control set requires member access.

Read the mapping with these limits:

- **Scope:** compliance owns the authoritative applicability inventory. SOX, PCI, jurisdictional duties, and capability-specific obligations do not apply uniformly; second line documents each determination.
- **Residual controls:** record requirements and evidence not covered here. GitHub scanning is not [PCI DSS 6.4.2](https://www.pcisecuritystandards.org/document_library/) runtime web protection, and repository backups alone do not restore an end-to-end delivery service.

## How each part is structured

Every technical part follows the same layout so you can jump straight to what you need:

1. **Leadership brief** at the top (three to five bullets).
2. **The requirements**: a table of relevant regulatory requirements with official sources, read alongside the chapter's platform outcomes rather than as its entire purpose.
3. **Deployment model differences**: what changes between GHEC, EMU, data residency, and GHES for this topic.
4. **Control sections**: what we do, why, how, and how to verify.
5. **Control matrix**: contributing requirements, features, evidence, and cadence. Validate design, integrations, gaps, and the evidence population before claiming implementation. Engineering service measures complement these matrices; they are not automatically regulatory obligations.
6. **Summary and key takeaways**: a checklist you can work through.
7. **References**: Well-Architected, GitHub Docs, and regulatory sources.

## Suggested reading paths

Choose a path through the overview, seven technical parts, and leadership brief:

| You are... | Start with | Then read |
|---|---|---|
| **A GitHub admin standing up a new enterprise** | [Part 1](/blog/github-waf-financial-services/platform-foundation/), [Part 2](/blog/github-waf-financial-services/identity-and-access/) | [Part 3](/blog/github-waf-financial-services/change-control/), [Part 6](/blog/github-waf-financial-services/actions-hardening/) |
| **An AppSec lead** | [Part 4](/blog/github-waf-financial-services/secrets-protection/), [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/) | [Part 3](/blog/github-waf-financial-services/change-control/), [Part 6](/blog/github-waf-financial-services/actions-hardening/) |
| **An engineering leader improving delivery** | [Part 3](/blog/github-waf-financial-services/change-control/), [Part 6](/blog/github-waf-financial-services/actions-hardening/) | [Part 2](/blog/github-waf-financial-services/identity-and-access/), [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/) |
| **Responsible for resilience and continuity** | [Part 1](/blog/github-waf-financial-services/platform-foundation/) | [Part 6](/blog/github-waf-financial-services/actions-hardening/), then the evidence and recovery dependencies across each part |
| **Adding Copilot to an existing platform** | [Part 7](/blog/github-waf-financial-services/copilot-and-agents/) | Review its dependencies on [Part 1](/blog/github-waf-financial-services/platform-foundation/), [Part 2](/blog/github-waf-financial-services/identity-and-access/), [Part 3](/blog/github-waf-financial-services/change-control/), [Part 4](/blog/github-waf-financial-services/secrets-protection/), [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/), and [Part 6](/blog/github-waf-financial-services/actions-hardening/) against your existing baseline |
| **Internal audit or second line** | [This post](/blog/github-waf-financial-services/) | Control matrices: [Part 1](/blog/github-waf-financial-services/platform-foundation/#control-matrix), [Part 2](/blog/github-waf-financial-services/identity-and-access/#control-matrix), [Part 3](/blog/github-waf-financial-services/change-control/#control-matrix), [Part 4](/blog/github-waf-financial-services/secrets-protection/#control-matrix), [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/#control-matrix), [Part 6](/blog/github-waf-financial-services/actions-hardening/#control-matrix), [Part 7](/blog/github-waf-financial-services/copilot-and-agents/#control-matrix) |
| **A CIO, CISO, or senior leader** | [The Leadership Brief](/blog/github-waf-financial-services/leadership-brief/) | Leadership briefs: [Part 1](/blog/github-waf-financial-services/platform-foundation/#leadership-brief), [Part 2](/blog/github-waf-financial-services/identity-and-access/#leadership-brief), [Part 3](/blog/github-waf-financial-services/change-control/#leadership-brief), [Part 4](/blog/github-waf-financial-services/secrets-protection/#leadership-brief), [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/#leadership-brief), [Part 6](/blog/github-waf-financial-services/actions-hardening/#leadership-brief), [Part 7](/blog/github-waf-financial-services/copilot-and-agents/#leadership-brief) |

## Summary and key takeaways

- **Apply all five pillars.** Governance, Architecture, Application Security, Collaboration, and Productivity each need real implementation work.
- **Start with business services.** Tailor the common baseline to the institution's data, criticality, delivery needs, and applicable obligations.
- **Make the supported path usable.** Clear ownership, discoverable guidance, timely review, and reliable CI are part of running GitHub well.
- **Regulations are baselines:** adequate institution policies add obligations.
- **Enforce, then prove:** retain operating evidence and human decisions over time.
- **Use the four questions.** What we do, why we do it, how we do it, and how we verify it.
- **Pick your deployment model on purpose.** Use the [Part 1 decision criteria](/blog/github-waf-financial-services/platform-foundation/#choosing-your-deployment-model) to approve the residency default or an alternative.
- **Improve outcomes, not just configuration counts.** Test recovery and control operation; measure onboarding, review delays, pipeline reliability, and remediation.
- **Keep capabilities in proportion.** Part 7 addresses optional Copilot adoption; the rest of the platform has its own purpose and operating model.
- **Start with Well-Architected:** assessment, SSDF scenario, and pillar checklists.

**Start here:** [Part 1: Platform Foundation and Data Boundaries](/blog/github-waf-financial-services/platform-foundation/).

## References

Framework resources are linked in [What GitHub Well-Architected brings to the table](#what-github-well-architected-brings-to-the-table); official regulatory sources are in [the landscape](#the-regulatory-landscape-we-cover). Technical parts link the procedures and citations relevant to their controls.
