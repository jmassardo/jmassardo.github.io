---
layout: post
title: "GitHub Well-Architected for Financial Services: The Leadership Brief"
date: 2026-11-05 10:08:00 -0600
category: Blog
tags: [github, well-architected, financial-services, compliance, security, governance, leadership, risk-management]
excerpt: "A plain-language brief for CIOs, CISOs, and senior leaders on the decisions, investments, and evidence needed to run GitHub safely in a regulated financial institution."
permalink: /blog/github-waf-financial-services/leadership-brief/
---

*This post is part of the [GitHub Well-Architected for Financial Services](/blog/github-waf-financial-services/) series.*

- [Overview and Compliance Crosswalk](/blog/github-waf-financial-services/)
- [Part 1: Platform Foundation and Data Boundaries](/blog/github-waf-financial-services/platform-foundation/)
- [Part 2: Identity and Access Management](/blog/github-waf-financial-services/identity-and-access/)
- [Part 3: Source Code Management and Change Control](/blog/github-waf-financial-services/change-control/)
- [Part 4: Secrets Protection](/blog/github-waf-financial-services/secrets-protection/)
- [Part 5: Code Scanning and Software Supply Chain](/blog/github-waf-financial-services/code-scanning-supply-chain/)
- [Part 6: CI/CD and GitHub Actions Hardening](/blog/github-waf-financial-services/actions-hardening/)
- [Part 7: Copilot and AI Agents](/blog/github-waf-financial-services/copilot-and-agents/)
- **The Leadership Brief** (you are here)

> **A friendly note:** This information is meant to be guidance to help navigate a complex topic. Please validate these patterns with your compliance and/or regulatory reporting team(s).

## Leadership brief

- **The risk:** GitHub is where your source code, build pipelines, deployment credentials, and AI coding agents meet. It's a privileged production system, whether or not your org chart treats it like one.
- **Our position:** Secure the platform before governing the AI. Data boundaries, identity, and change control are prerequisites for any credible Copilot story.
- **The decisions you own:** deployment model, identity strategy, central policy ownership, security licensing, and your AI risk posture. Your teams can't make these alone.
- **The evidence:** Every control in this series produces machine-generated evidence. If your team is collecting screenshots for auditors, something is configured wrong.
- **The investment:** A small, funded platform team that owns GitHub as a product. That costs less than one bad exam finding.

---

Your engineering teams probably adopted GitHub years ago, one team at a time. Then it became the place where everything happens: code, reviews, builds, deployments, and now AI agents that open pull requests on their own. Somewhere along the way, it quietly became one of the most privileged systems in your institution.

Meanwhile, the questions from your board and your examiners got sharper. *How do you know customer data isn't in a public repository? Who approved that change to the payments service? Is the AI writing your code a third-party risk? Can you prove it?*

This brief is the executive edition of an eight-part series written for the engineers who implement these controls. It skips the configuration details and focuses on what leadership needs to **decide**, **fund**, and **ask for**. The technical parts are linked throughout when you want to send someone a specific section.

## How to think about compliance here

Regulations set **baselines**, not blueprints. [DORA](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554), [NYDFS Part 500](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500), [OSFI B-13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management), and [Brazil's CMN Resolution 4,893](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf) all describe outcomes: protect data, control access, manage change, oversee third parties. Your institution decides how to meet or exceed those outcomes, and writes that down as policy.

That's where the real test happens. **Auditors and examiners check that you did what you said you would do.** If your policy says every production change has an independent approver, they'll pull a sample of changes and look for the approver. If your policy says MFA is required, they want proof it's enforced everywhere, not just a policy document.

So the series asks four questions of every control, and you should ask them of your teams:

1. **What do we do?**
2. **Why do we do it?** (Which requirement or risk does it address?)
3. **How do we do it?**
4. **How do we verify it actually got done?**

The fourth question separates a mature program from an expensive one. GitHub can generate most of your evidence automatically, but only if it's configured to.

## Five decisions only leadership can make

Engineers can configure almost everything in this series. These five calls need executive ownership because they involve cost, risk appetite, or organizational boundaries.

### 1. Which deployment model?

GitHub comes in four flavors: GitHub Enterprise Cloud with personal accounts, Enterprise Cloud with **Enterprise Managed Users (EMU)**, Enterprise Cloud with **data residency**, and self-hosted **GitHub Enterprise Server**.

**Our recommendation:** Enterprise Cloud with EMU as the default. Add data residency when a regulator or contract requires in-region storage (EU, Australia, US, and Japan regions are available today). Choose Enterprise Server only when there's a genuine sovereignty or air-gap mandate, because you then own patching, backup, high availability, and the evidence for all of it.

**Why it matters:** With EMU, your identity provider owns every account, and managed users **cannot create public repositories at all**. That single architectural choice removes the most common way code and data escape. Details: [Part 1](/blog/github-waf-financial-services/platform-foundation/).

### 2. Who owns identity?

Your identity provider should be the single source of truth for who can access source code, with MFA and conditional access enforced there. Departures in HR should remove GitHub access automatically, including the tokens and app grants people leave behind.

**Ask your team:** "If a contractor's engagement ended last Friday, show me that every credential they held in GitHub is gone." Details: [Part 2](/blog/github-waf-financial-services/identity-and-access/).

### 3. Is policy central or per-team?

GitHub can enforce controls at the enterprise level, so they can't be quietly turned off by a repository admin. That only works if one team owns those policies and everyone else consumes them.

**Our recommendation:** A central platform team owns enterprise policies, change-control rulesets, the approved list of pipeline components, and the runner fleet. Business-line teams own their code, not the guardrails. Details: [Part 3](/blog/github-waf-financial-services/change-control/) and [Part 6](/blog/github-waf-financial-services/actions-hardening/).

### 4. Do we license security everywhere?

GitHub sells **Secret Protection** and **Code Security** as separate products. The tempting move is to license them only for "critical" repositories. Resist it. Leaked credentials and vulnerable libraries don't respect your tiering, and partial coverage is hard to defend to an examiner.

**Our recommendation:** Secret Protection on every private and internal repository. Code Security on everything in regulatory scope, with a plan to expand. Details: [Part 4](/blog/github-waf-financial-services/secrets-protection/) and [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/).

### 5. What's our AI risk posture?

Copilot and coding agents are now a material part of how software gets written. The regulatory picture is still moving:

- In the US, [SR 26-2](https://www.federalreserve.gov/supervisionreg/srletters/sr2602.htm) and [OCC Bulletin 2026-13](https://www.occ.gov/news-issuances/bulletins/2026/bulletin-2026-13.html) replaced SR 11-7 in April 2026, and they explicitly leave generative and agentic AI out of scope. That's not a pass; it means you govern AI through third-party risk, information security, and SDLC controls instead.
- In Canada, [OSFI E-23](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/guideline-e-23-model-risk-management-2027) takes effect May 1, 2027 and does include AI.
- In the EU, the [AI Act](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) AI literacy obligation (now worded as taking measures to support staff literacy) already applies, while high-risk obligations were pushed to December 2027 and August 2028 by the [2026 Digital Omnibus](https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng).
- [NYDFS](https://www.dfs.ny.gov/industry-guidance/industry-letters/il20241016-cyber-risks-ai-and-strategies-combat-related-risks) has told regulated entities to account for AI risks within their existing Part 500 programs.

**Our recommendation:** Treat AI agents as **untrusted contributors**. Their work passes the same review, scanning, and approval gates as a human's. Lock Copilot policy at the enterprise level, allow new models and preview features by exception, and manage GitHub as an ICT third party under your existing vendor risk program. Details: [Part 7](/blog/github-waf-financial-services/copilot-and-agents/).

## What "good" looks like, and the evidence to ask for

This table is the one to bring to your next risk committee. Each row is an outcome, the evidence your team should be able to produce on request, and where the technical detail lives.

| Outcome | Evidence you should be able to request | Series part |
|---|---|---|
| **Code and data can't leave the enterprise by accident** | Enterprise policy settings showing no public repositories and forks restricted to the enterprise; SIEM alerts on visibility changes | [Part 1](/blog/github-waf-financial-services/platform-foundation/) |
| **We keep a complete, durable audit trail** | Audit log streaming to the SIEM since go-live (GitHub retains web audit events for 180 days and Git events for only 7) | [Part 1](/blog/github-waf-financial-services/platform-foundation/) |
| **Only the right people have access, and it ends when it should** | IdP-driven provisioning reports, credential inventory exports, quarterly access reviews with sign-off | [Part 2](/blog/github-waf-financial-services/identity-and-access/) |
| **No one approves their own change** | Pull request records with independent approvals; ruleset history; logged and reviewed emergency bypasses | [Part 3](/blog/github-waf-financial-services/change-control/) |
| **Secrets are blocked before they land** | Push protection coverage across all repositories; bypass approvals; time-to-revoke against a written SLA | [Part 4](/blog/github-waf-financial-services/secrets-protection/) |
| **Vulnerabilities are found and fixed on time** | Coverage and remediation-time metrics from security overview; SBOM exports; build provenance for released software | [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/) |
| **Pipelines can't be hijacked, and production deploys need a second person** | Approved-actions policy; short-lived cloud credentials; deployment approval history per environment | [Part 6](/blog/github-waf-financial-services/actions-hardening/) |
| **AI is governed like any other contributor and vendor** | Seat assignments tied to IdP groups; policy change history; agent activity in the SIEM; training completion records | [Part 7](/blog/github-waf-financial-services/copilot-and-agents/) |
| **GitHub is managed as a third party** | GitHub's SOC 1, SOC 2, ISO 27001, and PCI DSS reports filed in your vendor risk program ([how to access them](https://docs.github.com/en/enterprise-cloud@latest/admin/overview/accessing-compliance-reports-for-your-enterprise)) | [Part 1](/blog/github-waf-financial-services/platform-foundation/) |

If your team can produce each of these from a query or an export, you're in great shape. If the answer involves screenshots and a long weekend, you've found your roadmap.

## Questions to ask your team this quarter

Use these in your next staff meeting or risk review. They're intentionally blunt.

1. Can anyone in our enterprise create a public repository or fork code outside it today?
2. How long do we keep GitHub audit logs, and where? (If the answer is "in GitHub," we're keeping 180 days at best.)
3. How many personal access tokens exist, who owns them, and when do they expire?
4. Can a repository admin turn off branch protection on a SOX-relevant system? Would we know if they did?
5. What happens when a developer tries to push a database password?
6. What's our remediation SLA for critical vulnerabilities, and what percentage did we meet last quarter?
7. Which third-party actions run in our pipelines, and who approved them?
8. Who can approve a production deployment, and can they approve their own?
9. Which AI models are enabled for our developers, and who decided that?
10. If an AI agent opened a pull request last weekend, who started it and who approved it?

## The operating model

Every part of this series ends in the same place: **someone has to own this.** The institutions that do this well treat GitHub as an internal product with a small platform team behind it.

That team typically owns:

- Enterprise policies, rulesets, and security configurations, all managed as code
- The approved list of pipeline components and shared workflows
- Runner infrastructure and network connectivity
- Copilot policy, model approvals, and AI usage budgets
- The evidence pipeline: audit log streaming, metrics exports, and quarterly control reports

The second line (risk and compliance) defines the requirements and reviews the evidence. Internal audit tests that the controls work. Engineering teams consume the guardrails and spend their time on the business.

Want a starting point? [GitHub Well-Architected](https://learn.github.com/well-architected/library/overview/) includes a free [assessment](https://learn.github.com/well-architected/library/overview/about-the-assessment/) and a [governance checklist](https://learn.github.com/well-architected/library/governance/checklist/). Have your team run the assessment first, so you have a documented baseline. Examiners appreciate seeing where you started.

## A 90-day plan

A practical sequence that gets the highest-risk exposures closed first:

| Window | Focus | Outcome |
|---|---|---|
| **Days 1-30** | Data boundaries and evidence | Public repositories blocked, audit log streaming to the SIEM, Well-Architected assessment baseline captured, deployment model decision documented |
| **Days 31-60** | Identity and change control | IdP-driven provisioning, token policies enforced, central rulesets on regulated repositories, push protection everywhere |
| **Days 61-90** | Supply chain, pipelines, and AI | Code scanning enforced on in-scope repositories, approved-actions policy, deployment approvals, enterprise-locked Copilot policy |

Your starting point will differ. An institution already on EMU skips a big chunk of the first month. One migrating from another platform has a longer runway. The order matters more than the dates.

## Metrics worth reporting upward

Keep it short. These metrics tell a board or risk committee whether the program works:

- **Coverage:** percentage of repositories with push protection and code scanning enforced
- **Timeliness:** percentage of critical vulnerabilities and leaked secrets remediated within SLA
- **Change integrity:** percentage of changes to regulated systems with independent approval (target: 100%, with every exception explained)
- **Access hygiene:** number of long-lived credentials, trending down
- **Exceptions:** count and age of open policy exceptions and bypasses

Each one comes straight from GitHub's APIs and security overview. None of them should require a spreadsheet.

## Summary and key takeaways

- **GitHub is a privileged production system.** Govern it like one.
- **Platform before AI.** Copilot governance means nothing if code can leak through a public repository.
- **Make the five decisions:** deployment model, identity ownership, central policy, security licensing, and AI posture.
- **Demand evidence, not assurances.** Every control should produce data your team can query.
- **Fund the platform team.** It's the cheapest control you'll ever buy.
- **Regulations are the floor.** Your policy defines the standard you're held to, so write one you can meet and prove.

**Your move:** Send the [series overview](/blog/github-waf-financial-services/) to your GitHub platform owner and your second-line risk partner, and ask for the evidence table above at your next review.

## References

### GitHub Well-Architected

- [GitHub Well-Architected overview](https://learn.github.com/well-architected/library/overview/)
- [About the assessment](https://learn.github.com/well-architected/library/overview/about-the-assessment/)
- [Governance checklist](https://learn.github.com/well-architected/library/governance/checklist/)

### GitHub Docs

- [Choosing an enterprise type for GitHub Enterprise Cloud](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/enterprise-fundamentals/choose-an-enterprise-type)
- [About Enterprise Managed Users](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/enterprise-managed-users)
- [About GitHub Enterprise Cloud with data residency](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-github-enterprise-cloud-with-data-residency)
- [Accessing compliance reports for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/overview/accessing-compliance-reports-for-your-enterprise)

### Regulatory sources

- [DORA, Regulation (EU) 2022/2554](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554)
- [EU AI Act, Regulation (EU) 2024/1689](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) and [Regulation (EU) 2026/1744](https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng)
- [NYDFS 23 NYCRR Part 500](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) and the [NYDFS AI industry letter](https://www.dfs.ny.gov/industry-guidance/industry-letters/il20241016-cyber-risks-ai-and-strategies-combat-related-risks)
- [Federal Reserve SR 26-2](https://www.federalreserve.gov/supervisionreg/srletters/sr2602.htm) and [OCC Bulletin 2026-13](https://www.occ.gov/news-issuances/bulletins/2026/bulletin-2026-13.html)
- [OSFI Guideline B-13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) and [OSFI Guideline E-23](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/guideline-e-23-model-risk-management-2027)
- [CMN Resolution 4,893/2021 (Brazil)](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf)

The full list of regulatory sources by jurisdiction is in the [series overview](/blog/github-waf-financial-services/#the-regulatory-landscape-we-cover).
