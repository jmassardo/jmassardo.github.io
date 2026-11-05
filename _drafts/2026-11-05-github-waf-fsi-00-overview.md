---
layout: post
title: "GitHub Well-Architected for Financial Services: Series Overview and Compliance Crosswalk"
date: 2026-11-05 10:09:00 -0600
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

> **A friendly note:** This information is meant to be guidance to help navigate a complex topic. Please validate these patterns with your compliance and/or regulatory reporting team(s).

## Leadership brief

- **The risk:** GitHub holds your source code, your build pipelines, and increasingly your AI-assisted engineering. Misconfigured, it becomes the easiest path for customer data, credentials, or unreviewed changes to escape your control.
- **Our position:** Platform guardrails come first. Identity, data boundaries, and change control have to be in place before any AI tooling can be considered "governed."
- **The approach:** Every control in this series answers four questions: what we do, why we do it, how we do it, and how we verify it actually got done.
- **The evidence:** Each part ends with a control matrix that maps GitHub settings to specific regulatory requirements and names the evidence your auditors will ask for.
- **Scope:** Regulations from the US, Canada, LATAM (Brazil, Mexico, Colombia, Chile, Peru, Argentina), and the EU, plus PCI DSS and NIST reference frameworks.

---

Here's a conversation I've had more times than I can count. A bank's security team is deep into a Copilot rollout review. There are spreadsheets. There's a model risk committee. Someone has drafted a 14-page acceptable use policy. Then somebody asks, "Can our developers create public repositories?" and the room goes quiet.

That silence is the whole reason this series exists.

You can lock down every AI feature GitHub ships and still have a very bad week because someone pushed a customer extract to a public repo, a contractor kept access after their engagement ended, or a production deploy went out with no second set of eyes. **The platform is the control plane.** Get it right and the shiny stuff on top is much easier to govern. Get it wrong and nothing on top can save you.

This series is an **opinionated** guide to applying [GitHub Well-Architected](https://learn.github.com/well-architected/library/overview/) to GitHub implementations at financial institutions. It covers banks, credit unions, insurers, payment processors, and capital markets firms. It's written for the people doing the implementation: GitHub admins, platform engineers, and security engineers. Each part also opens with a short brief for leadership, and there's a [dedicated leadership edition](/blog/github-waf-financial-services/leadership-brief/) for CIOs and CISOs.

## Compliance is a baseline, not a finish line

Before we touch a single setting, we need a shared understanding of what compliance actually is. Getting this wrong is how organizations end up with expensive tooling and failed exams at the same time.

### Regulations are guideposts

Regulations describe **outcomes**, rarely implementations. [DORA Article 9](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_9) asks for ICT security that protects the availability, authenticity, integrity, and confidentiality of data. [NYDFS 23 NYCRR 500.12](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) requires multi-factor authentication. Neither one tells you to click a specific checkbox in a GitHub enterprise settings page.

That gap is intentional. Regulators set a **baseline**. Each institution decides how it meets or exceeds that baseline based on its own risk appetite, size, and complexity. Two banks can satisfy the same requirement in different ways, and both can be right.

So this series will never say "do this and you'll pass." What it will say is:

- "Here's the requirement, in plain English."
- "Here's where GitHub Well-Architected points you."
- "Here's the setting you adjust, or the kind of control you build, to meet **your organization's implementation** of that requirement."
- "Here's how you prove it."

### Auditors check that you did what you said you'd do

I've said this for years and I'll keep saying it: **auditors are there to make sure you did what you said you were going to do.**

If the regulation says you must have a password policy, an auditor wants to see two things:

1. **That the policy exists.** It's written down, approved, and owned by someone.
2. **That you enforce it.** The systems actually behave the way the policy says, and you have evidence over time, not just a screenshot from this morning.

The second part is where most organizations stumble. A beautiful policy document that says "all access to source code requires MFA" is worthless if your GitHub enterprise still allows accounts that bypass your identity provider. Worse, it's now a documented control failure.

GitHub is actually great at the second part. Settings can be locked at the enterprise level so they can't drift. Rulesets enforce behavior at push and merge time. The audit log records who changed what, and it can be streamed to your SIEM for long-term retention. **The platform can generate your evidence for you**, as long as you configure it to.

### The four questions

Every control in this series follows the same pattern:

| Question | What it means | Who usually cares most |
|---|---|---|
| **What we do** | The opinionated default we recommend | Platform and security engineers |
| **Why we do it** | The requirement(s) it supports and the Well-Architected guidance behind it | Risk, compliance, and audit |
| **How we do it** | Where the setting lives, plus a snippet when it helps | GitHub admins |
| **How we verify it** | The evidence, where it lives, and how often to check | Internal audit and second line |

If you remember nothing else from this series, remember the fourth row. A control without verification is a hope, not a control.

### Your policy is the real requirement

One more nuance that trips people up: once you write a policy, **the policy becomes the thing you're audited against**, not just the regulation. If your secure development standard says "all critical vulnerabilities are remediated within 15 days," the auditor will test for 15 days, even if the regulation only says "timely."

Write policies you can actually meet, then configure GitHub to meet them, then collect the evidence. In that order.

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

Two framework resources deserve special mention for FSIs:

- **The [NIST SSDF implementation scenario](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/)** walks through NIST SP 800-218 practice by practice with GitHub implementations. It's the closest thing in the framework to what this series does, and it's tagged for the finance vertical. Use it alongside Parts 3, 5, and 6.
- **The [Well-Architected assessment](https://learn.github.com/well-architected/library/overview/about-the-assessment/)** and the [getting started checklist](https://learn.github.com/well-architected/library/overview/getting-started-checklist/) give you a baseline score before you start changing things. Run it first. Auditors love a documented "before" state.

**What this series adds:** opinions, the regulatory mapping, and the verification angle. We link to Well-Architected and docs.github.com for procedures rather than rewriting them. If you find yourself wanting the step-by-step for a setting, follow the link.

## Choose your deployment model deliberately

GitHub comes in four deployment patterns, and the right answer for a financial institution depends on data residency, identity strategy, and how much infrastructure you want to own. Every part in this series calls out where the patterns differ for its topic. Here's the short version (details in [Part 1](/blog/github-waf-financial-services/platform-foundation/)).

| | GHEC (personal accounts) | GHEC with EMU | GHEC with data residency | GHES |
|---|---|---|---|---|
| **Hosting** | github.com | github.com | Dedicated `*.ghe.com` subdomain in a chosen region | You host it (on-prem or your cloud) |
| **Identity** | Users bring personal accounts; SAML SSO in front | Accounts owned and provisioned by your IdP (SAML or OIDC, plus SCIM) | Same as EMU (data residency requires EMU) | Built-in, SAML, LDAP, or CAS |
| **Public repos and gists** | Allowed unless you disable by policy | **Not possible** for managed users | **Not possible** | Allowed unless you disable by policy |
| **Contribute outside the enterprise** | Yes | No (read-only on public github.com) | No | N/A (separate instance) |
| **Patching, backup, HA/DR** | GitHub | GitHub | GitHub | **You** |
| **GitHub-hosted Actions runners** | Yes | Yes | Yes (region-specific) | No, self-hosted only |
| **Vendor assurance reports** | SOC 1/2, ISO 27001, PCI DSS AoC, and more | Same | Same | You own most of your own posture |

**Our default opinion for FSIs:** **GHEC with Enterprise Managed Users.** Choose **data residency** when a regulator, a contract, or your data protection officer requires source code and metadata to stay in a specific region (EU, Australia, US, and Japan are available today). Choose **GHES** only when you have a hard requirement for self-hosting and the operations team to back it, because every patch, backup, and failover becomes your evidence to produce. Personal-account GHEC is workable, but you'll spend a lot of effort building controls that EMU gives you by design.

Start with GitHub's official guidance: [Choosing an enterprise type](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/enterprise-fundamentals/choose-an-enterprise-type), [About Enterprise Managed Users](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/enterprise-managed-users), and [About GitHub Enterprise Cloud with data residency](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-github-enterprise-cloud-with-data-residency).

## The regulatory landscape we cover

The series covers four regions plus cross-industry standards. These aren't exhaustive lists, and your institution may answer to additional regulators (state, provincial, or sector-specific). The point is to show the **pattern**: most regimes ask for the same families of controls, phrased differently.

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

Here's where it comes together. Regulations use different words, but they ask for the same **control families**. This table maps each family to representative requirements and the part of the series that covers it. Each part has a detailed requirements table and a control matrix with evidence.

| Control family | Representative requirements | Where we cover it |
|---|---|---|
| **Data boundaries and residency** (no public exposure, data stays where it should) | GLBA Safeguards (16 CFR 314); NYDFS 500.3; OSFI B-13; CMN 4,893; LGPD; GDPR Art. 25 and 44; DORA Arts. 5-16 | [Part 1](/blog/github-waf-financial-services/platform-foundation/) |
| **Audit logging and monitoring** | NYDFS 500.6; PCI DSS 10.2 and 10.4; DORA RTS 2024/1774 Art. 12; FFIEC Information Security | [Part 1](/blog/github-waf-financial-services/platform-foundation/), plus evidence in every part |
| **Resilience, backup, and recovery** | DORA Art. 12; FFIEC BCM; OSFI E-21; NYDFS 500.16 | [Part 1](/blog/github-waf-financial-services/platform-foundation/) |
| **Third-party and ICT provider risk** (GitHub itself is a third party) | Interagency TPRM guidance; NYDFS 500.11; OSFI B-10; DORA Arts. 28-30; PCI DSS 12.8 and 12.9; AMF TPRM | [Part 1](/blog/github-waf-financial-services/platform-foundation/), [Part 7](/blog/github-waf-financial-services/copilot-and-agents/) |
| **Identity, MFA, and least privilege** | NYDFS 500.7 and 500.12; PCI DSS 7.2 and 8.3/8.4; DORA RTS Arts. 20-21; 12 CFR 30 App. B; SBS 504-2021; BCRA A 7724 | [Part 2](/blog/github-waf-financial-services/identity-and-access/) |
| **Change management and separation of duties** | SOX 404 / PCAOB AS 2201 (ITGCs); DORA RTS Art. 17; FFIEC DAM; PCI DSS 6.2; CNBV CUB | [Part 3](/blog/github-waf-financial-services/change-control/), [Part 6](/blog/github-waf-financial-services/actions-hardening/) |
| **Secrets and cryptographic material** | NYDFS 500.15; DORA RTS Art. 6; GDPR Art. 32; CMN 4,893; CMF RAN 20-10 | [Part 4](/blog/github-waf-financial-services/secrets-protection/) |
| **Secure development and vulnerability management** | NYDFS 500.8; PCI DSS 6.2-6.4; DORA RTS Art. 10; FFIEC DAM; NIST SSDF | [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/) |
| **Pipeline integrity and deployment control** | DORA Art. 9; OSFI B-13; FFIEC AIO; SWIFT CSCF; NIST SSDF PO.5 | [Part 6](/blog/github-waf-financial-services/actions-hardening/) |
| **AI and model risk** | SR 26-2 / OCC 2026-13; OSFI E-23; EU AI Act Arts. 4, 26, 50; NYDFS AI industry letter | [Part 7](/blog/github-waf-financial-services/copilot-and-agents/) |

A couple of honest caveats about this table:

- **It's representative, not exhaustive.** Each part goes deeper, and your compliance team will have the authoritative inventory of what applies to you.
- **Applicability varies.** SOX applies to public companies. PCI DSS applies where cardholder data is in scope. The EU AI Act's obligations depend heavily on whether a system is classified as high-risk. Model risk guidance depends on whether your institution treats a given AI tool as a "model." These are judgment calls your second line should make, and document.

## How each part is structured

Every technical part follows the same layout so you can jump straight to what you need:

1. **Leadership brief** at the top (three to five bullets).
2. **The requirements**: a table of the specific regulatory requirements relevant to the topic, with links to the official sources.
3. **Deployment model differences**: what changes between GHEC, EMU, data residency, and GHES for this topic.
4. **Control sections**: what we do, why, how, and how to verify.
5. **Control matrix**: control, requirement IDs, GitHub feature, evidence, and review cadence. This is the table you hand to internal audit.
6. **Summary and key takeaways**: a checklist you can work through.
7. **References**: Well-Architected, GitHub Docs, and regulatory sources.

## Suggested reading paths

Not everyone needs to read all eight posts in order (although I'd be flattered).

| You are... | Start with | Then read |
|---|---|---|
| **A GitHub admin standing up a new enterprise** | Part 1, Part 2 | Part 3, Part 6 |
| **An AppSec lead** | Part 4, Part 5 | Part 3, Part 6 |
| **Running a Copilot rollout** | Part 1, Part 2 | Part 7 (don't skip ahead; the platform comes first) |
| **Internal audit or second line** | This post | The control matrix at the end of each part |
| **A CIO, CISO, or senior leader** | [The Leadership Brief](/blog/github-waf-financial-services/leadership-brief/) | The leadership brief at the top of each part |

## Summary and key takeaways

- **Platform first.** Data boundaries, identity, and change control come before AI governance. A perfectly governed Copilot rollout can't fix a public repo full of customer data.
- **Regulations are baselines.** Your organization decides how it meets or exceeds them, and your written policies become the standard you're audited against.
- **Enforce, then prove.** Auditors want to see that controls exist **and** that they work over time. Configure GitHub to generate that evidence automatically.
- **Use the four questions.** What we do, why we do it, how we do it, and how we verify it.
- **Pick your deployment model on purpose.** GHEC with EMU is our default for FSIs; data residency and GHES are for specific, documented requirements.
- **Lean on Well-Architected.** Run the [assessment](https://learn.github.com/well-architected/library/overview/about-the-assessment/), read the [NIST SSDF scenario](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/), and use the [pillar checklists](https://learn.github.com/well-architected/library/governance/checklist/) as your working backlog.

**Start here:** [Part 1: Platform Foundation and Data Boundaries](/blog/github-waf-financial-services/platform-foundation/).

## References

### GitHub Well-Architected

- [GitHub Well-Architected overview](https://learn.github.com/well-architected/library/overview/)
- [Layers of GitHub Well-Architected](https://learn.github.com/well-architected/library/overview/layers/)
- [About the assessment](https://learn.github.com/well-architected/library/overview/about-the-assessment/)
- [Getting started checklist](https://learn.github.com/well-architected/library/overview/getting-started-checklist/)
- [Implementing the NIST SSDF with GitHub](https://learn.github.com/well-architected/library/scenarios/nist-ssdf-implementation/)
- [Governance](https://learn.github.com/well-architected/library/governance/overview/), [Application Security](https://learn.github.com/well-architected/library/application-security/overview/), [Architecture](https://learn.github.com/well-architected/library/architecture/overview/), [Collaboration](https://learn.github.com/well-architected/library/collaboration/overview/), and [Productivity](https://learn.github.com/well-architected/library/productivity/overview/) pillars
- [github/github-well-architected](https://github.com/github/github-well-architected) on GitHub

### GitHub Docs

- [Choosing an enterprise type for GitHub Enterprise Cloud](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/enterprise-fundamentals/choose-an-enterprise-type)
- [About Enterprise Managed Users](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/enterprise-managed-users)
- [About GitHub Enterprise Cloud with data residency](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-github-enterprise-cloud-with-data-residency)
- [About GitHub Enterprise Server](https://docs.github.com/en/enterprise-server@latest/admin/overview/about-github-enterprise-server)
- [Accessing compliance reports for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/overview/accessing-compliance-reports-for-your-enterprise)

### Regulatory sources

Linked inline in [The regulatory landscape we cover](#the-regulatory-landscape-we-cover). Each part repeats the sources relevant to its topic.
