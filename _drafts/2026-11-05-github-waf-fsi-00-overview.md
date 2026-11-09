---
layout: post
title: "GitHub Well-Architected for Financial Services: Series Overview and Compliance Crosswalk"
date: 2026-11-05 10:00:00 -0600
category: Blog
tags: [github, well-architected, financial-services, compliance, security, governance, regulatory, enterprise]
excerpt: "An opinionated, requirement-by-requirement guide to running GitHub at a bank, insurer, or payments company, built on GitHub Well-Architected and mapped to regulations across the US, Canada, LATAM, and the EU."
permalink: /blog/github-waf-financial-services/
---

*This post is part of the [GitHub Well-Architected for Financial Services](/blog/github-waf-financial-services/) series.*

- **Overview and Compliance Crosswalk** (you are here)
- [Part 1: Platform Foundation and Data Boundaries](/blog/github-waf-financial-services/platform-foundation/)
- [Part 2: Identity and Access Management](/blog/github-waf-financial-services/identity-and-access/)
- [Part 3: Source Code Management and Change Control](/blog/github-waf-financial-services/change-control/)
- [Part 4: Secrets Protection](/blog/github-waf-financial-services/secrets-protection/)
- [Part 5: Code Scanning and Software Supply Chain](/blog/github-waf-financial-services/code-scanning-supply-chain/)
- [Part 6: CI/CD and GitHub Actions Hardening](/blog/github-waf-financial-services/actions-hardening/)
- [Part 7: Copilot and AI Agents](/blog/github-waf-financial-services/copilot-and-agents/)
- [The Leadership Brief](/blog/github-waf-financial-services/leadership-brief/)

> **A friendly note:** Validate these patterns with your compliance and regulatory reporting teams.

## Leadership brief

- **The risk:** GitHub holds source code, build pipelines, and AI-assisted engineering. Misconfiguration exposes customer data, credentials, and production changes.
- **Our position:** Data boundaries, identity, and change control come before AI governance.
- **The approach:** Each control answers what, why, how, and how to verify.
- **The evidence:** Control matrices identify regulatory contributions and retained records, not certified coverage or operating effectiveness.
- **Scope:** Regulations from the US, Canada, LATAM (Brazil, Mexico, Colombia, Chile, Peru, Argentina), and the EU, plus PCI DSS and NIST reference frameworks.

---

Imagine a bank's Copilot review: spreadsheets, a model risk committee, a 14-page acceptable use policy. Then someone asks, "Can our developers create public repositories?" The room goes quiet.

That is why this series exists. AI controls cannot fix a public customer extract, a contractor's stale access, or an unreviewed production deployment. **The platform is the control plane.**

This guide applies [GitHub Well-Architected](https://learn.github.com/well-architected/library/overview/) to banks, credit unions, insurers, payment processors, and capital markets firms. It is written for GitHub admins, platform engineers, and security engineers, with short leadership summaries and a [dedicated CIO/CISO brief](/blog/github-waf-financial-services/leadership-brief/).

## Compliance is a baseline, not a finish line

### Regulations are guideposts

Regulations describe **outcomes**, rarely implementations. [DORA Article 9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9) asks for ICT security that protects the availability, authenticity, integrity, and confidentiality of data. [NYDFS 23 NYCRR 500.12](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) requires multi-factor authentication. Neither one tells you to click a specific checkbox in a GitHub enterprise settings page.

Regulators set a **baseline**; institutions choose implementations suited to their risk, size, and complexity. Two banks can meet it differently. Think 2+2=4: count two dots beside two more, put two apples beside another two, snap together two pairs of counting cubes, or start at 2 on a number line and hop forward twice. Different methods, same answer. Nobody needs to mandate the apples, but you still have to show that you ended up with four.

This series does not say "do this and you'll pass." It provides:

- "Here's the requirement, in plain English."
- "Here's where GitHub Well-Architected points you."
- "Here's a setting or control for **your organization's implementation**."
- "Here's how you prove it."

### Auditors check that you did what you said you'd do

**Auditors check that you did what you said you would do.**

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
| **Why we do it** | The requirement(s) it supports and the Well-Architected guidance behind it | Risk, compliance, and audit |
| **How we do it** | Where the setting lives, plus a snippet when it helps | GitHub admins |
| **How we verify it** | The evidence, where it lives, and how often to check | Internal audit and second line |

If you remember nothing else from this series, remember the fourth row. A control without verification is a hope, not a control.

### Your policy adds requirements; it does not replace them

**Your policy adds an audit obligation**, not a substitute for regulation. If it requires critical vulnerabilities fixed within 15 days, auditors test for 15 days even when the regulation says "timely."

Write adequate policies, fund their controls, and collect evidence. Escalate gaps with owners and remediation dates rather than rewriting the floor.

## What GitHub Well-Architected brings to the table

[GitHub Well-Architected](https://learn.github.com/well-architected/library/overview/) is GitHub's framework of best practices for running GitHub at scale. It's open source ([github/github-well-architected](https://github.com/github/github-well-architected)) and organized in [layers](https://learn.github.com/well-architected/library/overview/layers/): pillars, design principles, checklists, and recommendations.

The five pillars map well to how regulated organizations think about technology risk:

| Pillar | What it covers | Where it shows up in this series |
|---|---|---|
| [Governance](https://learn.github.com/well-architected/library/governance/overview/) | Enterprise policies, rulesets, custom properties, access, agent governance | Parts 1, 2, 3, 7 |
| [Application Security](https://learn.github.com/well-architected/library/application-security/overview/) | Secret scanning, code scanning, dependency management, threat modeling | Parts 4, 5 |
| [Architecture](https://learn.github.com/well-architected/library/architecture/overview/) | Resilience, runners, networking, repository strategy | Parts 1, 6 |
| [Collaboration](https://learn.github.com/well-architected/library/collaboration/overview/) | DevOps practices, reusable workflows, inner source | Parts 3, 6 |
| [Productivity](https://learn.github.com/well-architected/library/productivity/overview/) | Copilot adoption, effective CI, engineering metrics | Parts 6, 7 |

Start with two framework resources:

- **[NIST SSDF implementation scenario](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/):** practice-by-practice GitHub implementations, tagged for finance. Use alongside Parts 3, 5, and 6.
- **[Assessment](https://learn.github.com/well-architected/library/overview/about-the-assessment/) and [getting started checklist](https://learn.github.com/well-architected/library/overview/getting-started-checklist/):** capture a baseline before changing controls. Auditors love a documented "before."

**This series adds** regulatory mapping, topic-specific recommendations, and verification. Follow the linked Well-Architected and GitHub Docs procedures for step-by-step setup.

## Scope and deployment baseline

The series defaults to **GHEC with data residency, including Enterprise Managed Users**. [Part 1](/blog/github-waf-financial-services/platform-foundation/#choosing-your-deployment-model) owns the decision criteria, separation benefits, data-flow exceptions, and alternatives. Each technical part covers its deployment-specific differences; GHES comparisons use **3.22**, subject to the actual plan and release.

Examples are design patterns, not implemented controls until institution-specific IDs, integrations, and approvals are completed and tested. Second line validates applicability and adequacy; internal audit determines its testing independently. [Part 1's preview controls](/blog/github-waf-financial-services/platform-foundation/#feature-availability-and-preview-controls) govern feature reliance; local caveats remain with each feature.

## The regulatory landscape we cover

These representative sources cover four regions and cross-industry standards. Add your state, provincial, and sector-specific obligations; most regimes ask for similar **control families**.

### United States

- [FFIEC IT Examination Handbook](https://ithandbook.ffiec.gov/it-booklets/information-security) (Information Security; [Development, Acquisition, and Maintenance](https://ithandbook.ffiec.gov/it-booklets/development-acquisition-and-maintenance); [Architecture, Infrastructure, and Operations](https://ithandbook.ffiec.gov/it-booklets/architecture-infrastructure-and-operations); [Business Continuity Management](https://ithandbook.ffiec.gov/it-booklets/business-continuity-management))
- GLBA safeguards: [FTC Safeguards Rule, 16 CFR Part 314](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-314) and the [Interagency Guidelines, 12 CFR Part 30 Appendix B](https://www.ecfr.gov/current/title-12/chapter-I/part-30/appendix-Appendix%20B%20to%20Part%2030)
- [NYDFS 23 NYCRR Part 500](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) (as amended in 2023) and the [NYDFS industry letter on AI cybersecurity risks](https://www.dfs.ny.gov/industry-guidance/industry-letters/il20241016-cyber-risks-ai-and-strategies-combat-related-risks)
- [Sarbanes-Oxley Section 404](https://www.govinfo.gov/content/pkg/USCODE-2023-title15/pdf/USCODE-2023-title15-chap98-subchapII-sec7262.pdf) and [PCAOB AS 2201](https://pcaobus.org/oversight/standards/auditing-standards/details/AS2201) (the source of IT general controls testing)
- Model risk: [Federal Reserve SR 26-2](https://www.federalreserve.gov/supervisionreg/srletters/sr2602.htm) and [OCC Bulletin 2026-13](https://www.occ.gov/news-issuances/bulletins/2026/bulletin-2026-13.html), which superseded SR 11-7 and OCC 2011-12 in April 2026
- [Interagency Guidance on Third-Party Relationships](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) (2023)
- SEC [Regulation S-P amendments](https://www.federalregister.gov/documents/2024/06/03/2024-11116/regulation-s-p-privacy-of-consumer-financial-information-and-safeguarding-customer-information) (2024) for broker-dealers and investment advisers

### Canada

- [OSFI Guideline B-13, Technology and Cyber Risk Management](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management)
- [OSFI Guideline B-10, Third-Party Risk Management](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/third-party-risk-management-guideline)
- [OSFI Guideline E-21, Operational Risk Management and Resilience](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/operational-risk-management-resilience-guideline)
- [OSFI Guideline E-23, Model Risk Management](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/guideline-e-23-model-risk-management-2027) (explicitly includes AI; effective 2027)
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
- [EU AI Act, Regulation (EU) 2024/1689](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) (note that high-risk timelines were pushed out by the 2026 Digital Omnibus; see Part 7)
- [EBA Guidelines on ICT and security risk management](https://www.eba.europa.eu/activities/single-rulebook/regulatory-activities/internal-governance/guidelines-ict-and-security-risk-management) (largely superseded by DORA for in-scope entities, but still relevant for some)

### Cross-industry standards and reference frameworks

- [PCI DSS v4.0.1](https://www.pcisecuritystandards.org/document_library/) (Requirements 6, 7, 8, 10, and 12.8/12.9 do most of the work for us)
- [SWIFT Customer Security Programme](https://www.swift.com/myswift/customer-security-programme) (the full control set is member-gated, so we reference it generally)
- [NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework) and [NIST SP 800-218 SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) as common reference models

## The crosswalk

The guidance **contributes to** these representative requirements; it does not independently satisfy them. Each technical part supplies its requirements, controls, and evidence matrix.

| Control family | Representative requirements | Where we cover it |
|---|---|---|
| **Data boundaries and residency** (no public exposure, data stays where it should) | GLBA Safeguards (16 CFR 314); NYDFS 500.3; OSFI B-13; CMN 4,893; LGPD; GDPR Art. 25 and 44; DORA Arts. 5-16 | [Part 1](/blog/github-waf-financial-services/platform-foundation/) |
| **Audit logging and monitoring** | NYDFS 500.6; PCI DSS 10.2 and 10.4; DORA RTS 2024/1774 Art. 12; FFIEC Information Security | [Part 1](/blog/github-waf-financial-services/platform-foundation/), plus evidence in every part |
| **Resilience, backup, and recovery** | DORA Art. 12; FFIEC BCM; OSFI E-21; NYDFS 500.16 | [Part 1](/blog/github-waf-financial-services/platform-foundation/) |
| **Third-party and ICT provider risk** (GitHub itself is a third party) | Interagency TPRM guidance; NYDFS 500.11; OSFI B-10; DORA Arts. 28-30; PCI DSS 12.8 and 12.9; AMF TPRM | [Part 1](/blog/github-waf-financial-services/platform-foundation/), [Part 7](/blog/github-waf-financial-services/copilot-and-agents/) |
| **Identity, MFA, and least privilege** | NYDFS 500.7 and 500.12; PCI DSS 7.2 and 8.3/8.4; DORA RTS Arts. 20-21; 12 CFR 30 App. B; SBS 504-2021; BCRA A 7724 | [Part 2](/blog/github-waf-financial-services/identity-and-access/) |
| **Change management and separation of duties** | SOX 404 / PCAOB AS 2201 (ITGCs); DORA RTS Art. 17; FFIEC DAM; PCI DSS 6.2; CNBV CUB | [Part 3](/blog/github-waf-financial-services/change-control/), [Part 6](/blog/github-waf-financial-services/actions-hardening/) |
| **Secrets and cryptographic material** | NYDFS 500.15 (key protection support, not encryption coverage); DORA RTS Art. 6; GDPR Art. 32; CMN 4,893; CMF RAN 20-10 | [Part 4](/blog/github-waf-financial-services/secrets-protection/) |
| **Secure development and vulnerability management** | NYDFS 500.8; PCI DSS 6.2 and 6.3; DORA RTS Art. 10; FFIEC DAM; NIST SSDF | [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/) |
| **Pipeline integrity and deployment control** | DORA Art. 9; OSFI B-13; FFIEC AIO; SWIFT CSCF; NIST SSDF PO.5 | [Part 6](/blog/github-waf-financial-services/actions-hardening/) |
| **AI and model risk** | SR 26-2 / OCC 2026-13 (scope distinction, not a generative-AI mandate); OSFI E-23; EU AI Act Arts. 4 and 26 (where applicable); NYDFS AI industry letter | [Part 7](/blog/github-waf-financial-services/copilot-and-agents/) |

Read the crosswalk with these limits:

- **Scope:** compliance owns the authoritative applicability inventory. SOX, PCI, AI high-risk duties, and model governance do not apply uniformly; second line documents each determination.
- **Residual controls:** record requirements and evidence not covered here. GitHub scanning is not PCI DSS 6.4.2 runtime web protection. AI Act Article 50 transparency needs a separate use-case assessment.

## How each part is structured

Every technical part follows the same layout so you can jump straight to what you need:

1. **Leadership brief** at the top (three to five bullets).
2. **The requirements**: a table of the specific regulatory requirements relevant to the topic, with links to the official sources.
3. **Deployment model differences**: what changes between GHEC, EMU, data residency, and GHES for this topic.
4. **Control sections**: what we do, why, how, and how to verify.
5. **Control matrix**: contributing requirements, features, evidence, and cadence. Validate design, integrations, gaps, and the evidence population before claiming implementation.
6. **Summary and key takeaways**: a checklist you can work through.
7. **References**: Well-Architected, GitHub Docs, and regulatory sources.

## Suggested reading paths

Choose a path through the overview, seven technical parts, and leadership brief:

| You are... | Start with | Then read |
|---|---|---|
| **A GitHub admin standing up a new enterprise** | Part 1, Part 2 | Part 3, Part 6 |
| **An AppSec lead** | Part 4, Part 5 | Part 3, Part 6 |
| **Running a Copilot rollout** | Part 1, Part 2 | Part 7 (don't skip ahead; the platform comes first) |
| **Internal audit or second line** | This post | The control matrix at the end of each part |
| **A CIO, CISO, or senior leader** | [The Leadership Brief](/blog/github-waf-financial-services/leadership-brief/) | The leadership brief at the top of each part |

## Summary and key takeaways

- **Platform first:** boundaries, identity, and change control before AI.
- **Regulations are baselines:** adequate institution policies add obligations.
- **Enforce, then prove:** retain operating evidence and human decisions over time.
- **Use the four questions.** What we do, why we do it, how we do it, and how we verify it.
- **Pick your deployment model on purpose.** Use the [Part 1 decision criteria](/blog/github-waf-financial-services/platform-foundation/#choosing-your-deployment-model) to approve the residency default or an alternative.
- **Follow the topic owners.** Part 1 defines the shared foundation; later parts apply it to identity, change, security, pipelines, and AI.
- **Start with Well-Architected:** assessment, SSDF scenario, and pillar checklists.

**Start here:** [Part 1: Platform Foundation and Data Boundaries](/blog/github-waf-financial-services/platform-foundation/).

## References

Framework resources are linked in [What GitHub Well-Architected brings to the table](#what-github-well-architected-brings-to-the-table); official regulatory sources are in [the landscape](#the-regulatory-landscape-we-cover). Technical parts link the procedures and citations relevant to their controls.
