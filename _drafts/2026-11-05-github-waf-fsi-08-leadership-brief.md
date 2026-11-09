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

- **The risk:** Source code, pipelines, deployment credentials, and AI agents meet in GitHub. Treat it as a privileged production system.
- **Our position:** Data boundaries, identity, and change control come before AI governance.
- **Your decisions:** deployment model, identity strategy, central policy ownership, security licensing, and AI risk posture.
- **The evidence:** Automate supported collection; fund manual approvals, access reviews, and transcript spot checks. Screenshots and dashboards alone cannot prove operation over an audit period.
- **The investment:** A funded platform team owning GitHub as a product, not everyone's side project.

---

GitHub often arrives team by team, then quietly becomes critical infrastructure. Now your board asks: *Could customer data reach a public repository? Who approved the payments change? Who governs the AI vendor? Can you prove it?*

This executive edition of the nine-post series focuses on what to **decide**, **fund**, and **ask for**. Linked technical parts provide implementation detail.

## How to think about compliance here

Regulations set **baselines**, not blueprints. [DORA](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554), [NYDFS Part 500](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500), [OSFI B-13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management), and [CMN 4,893](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf) require outcomes: protect data, control access and change, oversee third parties. Translate applicable outcomes into policy.

**Examiners test both policy adequacy and execution.** An independent-approver policy needs sampled approvals; an MFA policy needs enforcement evidence. Meeting a weak policy is no safe harbor. Second line defines the floor, leadership funds controls, engineering implements them.

Ask four questions: **What is the control? Which requirement or risk does it address? How is it enforced? What proves it operated?** GitHub can generate evidence only if collection, retention, integrity, and completeness are configured. Use Part 1's [evidence standard](/blog/github-waf-financial-services/platform-foundation/#evidence-retention-and-integrity); series matrices show contributions to requirements, not certification.

## Five decisions only leadership can make

These calls need executive ownership: they cross cost, risk appetite, and organizational boundaries.

### 1. Which deployment model?

Options are Enterprise Cloud with personal accounts, **EMU**, or **data residency (including EMU)**, and self-hosted **Enterprise Server**.

**Our recommendation:** Default to **Enterprise Cloud with data residency, including EMU**. Its `*.ghe.com` subdomain adds separation, managed identities, and regional storage for covered data, not dedicated physical infrastructure or universal in-region processing. Apply Part 1's [deployment criteria](/blog/github-waf-financial-services/platform-foundation/#choosing-your-deployment-model), including storage exceptions and lawful transfers. EMU on github.com is an alternative, not the default. Choose Enterprise Server only for a genuine self-hosting requirement; fund patching, backup, high availability, and their evidence.

**Why it matters:** EMU gives your IdP account ownership and prevents managed users from creating public repositories, closing a common exposure path. Details: [Part 1](/blog/github-waf-financial-services/platform-foundation/).

### 2. Who owns identity?

Make the IdP authoritative for access, MFA, and conditional access. HR departures should automatically remove GitHub access, including residual tokens/app grants.

**Ask your team:** "If a contractor's engagement ended last Friday, show me that every credential they held in GitHub is gone." Details: [Part 2](/blog/github-waf-financial-services/identity-and-access/).

### 3. Is policy central or per-team?

Enterprise enforcement prevents repo-admin opt-outs, but needs central ownership.

**Our recommendation:** Platform owns enterprise policies, rulesets, approved pipeline components, and runners. Governance owns [control-selecting properties](/blog/github-waf-financial-services/platform-foundation/#data-classification-with-custom-properties): 100% classification, restrictive new/unclassified defaults, no business-line self-downgrades. Base permissions are None/Read; write access needs approved team grants. Details: [Part 3](/blog/github-waf-financial-services/change-control/) and [Part 6](/blog/github-waf-financial-services/actions-hardening/).

### 4. Do we license security everywhere?

**Secret Protection** and **Code Security** are separately licensed. Critical-only coverage leaves credentials and vulnerable libraries elsewhere. Examiners will ask about those gaps.

**Our recommendation:** Secret Protection on every private and internal repository. Code Security on everything in regulatory scope, with a plan to expand. Details: [Part 4](/blog/github-waf-financial-services/secrets-protection/) and [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/).

### 5. What's our AI risk posture?

AI requires a documented risk posture. Regulatory scope differs:

- US [SR 26-2](https://www.federalreserve.gov/supervisionreg/srletters/sr2602.htm)/[OCC 2026-13](https://www.occ.gov/news-issuances/bulletins/2026/bulletin-2026-13.html) superseded SR 11-7/OCC 2011-12 in April 2026 and exclude generative/agentic AI. Applicable third-party, security, and SDLC duties remain.
- In Canada, [OSFI E-23](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/guideline-e-23-model-risk-management-2027) takes effect May 1, 2027 and does include AI.
- EU [AI Act](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) measures supporting staff literacy already apply. [The 2026 Omnibus](https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng) sets high-risk dates of December 2, 2027 (Annex III) and August 2, 2028 (Annex I); these are not blanket coding-assistant duties.
- [NYDFS](https://www.dfs.ny.gov/industry-guidance/industry-letters/il20241016-cyber-risks-ai-and-strategies-combat-related-risks) has told regulated entities to account for AI risks within their existing Part 500 programs.

**Our recommendation:** Treat agents as **untrusted contributors** facing the same review, scanning, and approval gates as humans. Lock enterprise policy, review model/preview exceptions, and govern GitHub and model providers through TPRM. Details: [Part 7](/blog/github-waf-financial-services/copilot-and-agents/).

No preview is the sole regulatory control. Fund a tested GA fallback and an explicit, expiring risk decision for remaining gaps; exceptions cannot waive law or [vendor production restrictions](/blog/github-waf-financial-services/platform-foundation/#feature-availability-and-preview-controls). Fund the [provider exit plan](/blog/github-waf-financial-services/platform-foundation/#provider-exit-and-concentration-risk): replacement hosting/deployment, recoverable evidence, identity transition, and rehearsal. Vendor reports are not a tested way out.

## What "good" looks like, and the evidence to ask for

Bring this outcome/evidence table to risk committee:

| Outcome | Evidence you should be able to request | Series part |
|---|---|---|
| **Public exposure and lower-control fork destinations are blocked** | Enforced enterprise policy, complete classification inventory, approved fork destinations, and SIEM alerts on boundary changes | [Part 1](/blog/github-waf-financial-services/platform-foundation/) |
| **We keep a complete, durable audit trail** | Continuous streaming, immutable archives of merge/check and deployment evidence, approved retention schedule, and completeness/restore tests; GitHub's native retention is not the archive | [Part 1](/blog/github-waf-financial-services/platform-foundation/) |
| **Only the right people have access, and it ends when it should** | IdP-driven provisioning reports, credential inventory exports, quarterly access reviews with sign-off | [Part 2](/blog/github-waf-financial-services/identity-and-access/) |
| **Changes are authorized independently** | ITSM authorization linked to the revision and implementation window, final-commit review evidence, centrally enforced required workflows, and independent emergency elevation/PIR records | [Part 3](/blog/github-waf-financial-services/change-control/) |
| **Secrets are blocked before they land** | Push protection coverage across all repositories; bypass approvals; time-to-revoke against a written SLA | [Part 4](/blog/github-waf-financial-services/secrets-protection/) |
| **Vulnerabilities are found and fixed on time** | Tier-specific coverage and SLA reports, patch-availability dates, release-build SBOMs and provenance; separate runtime web protection evidence for PCI DSS 6.4.2 | [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/) |
| **Pipeline integrity and deployment independence are enforced** | Approved action SHAs and provenance, short-lived credentials, and a trusted gate proving the deployment approver did not author or commit any change in the release; bot initiation does not prove independence | [Part 6](/blog/github-waf-financial-services/actions-hardening/) |
| **AI is governed like any other contributor and vendor** | IdP-linked seats, provider/model approvals, policy history, available agent audit events in the SIEM, independently reviewed changes, training records, privacy-approved session evidence and explicit export gaps; previews are supplemental | [Part 7](/blog/github-waf-financial-services/copilot-and-agents/) |
| **GitHub is managed as a third party** | Service-scoped assurance review, report-period/bridge coverage, subservice and customer-control assessment, provider/register inventory where required, and a tested exit/concentration-risk plan ([reports](https://docs.github.com/en/enterprise-cloud@latest/admin/overview/accessing-compliance-reports-for-your-enterprise)) | [Part 1](/blog/github-waf-financial-services/platform-foundation/) |

Request repeatable exports and retained judgment/UI-only sign-offs. Fund independent access reviews, vendor/legal assessment, emergency approvals, training, and transcript spot checks. Ask which exports are unavailable and who owns each gap; necessary screenshots still cannot prove completeness/history.

## Questions to ask your team this quarter

Ask these directly:

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

**Someone owns the product.** Fund a platform team responsible for:

- Enterprise policies, rulesets, and security configurations, all managed as code
- The approved list of pipeline components and shared workflows
- Runner infrastructure and network connectivity
- Copilot policy, model approvals, and AI usage budgets
- The evidence pipeline: audit log streaming, metrics exports, and quarterly control reports
- Classification completeness, expiring exceptions, archive integrity, and tested provider exit

Second line defines requirements and reviews evidence; internal audit tests controls; engineering consumes guardrails and builds the business.

Start with [GitHub Well-Architected](https://learn.github.com/well-architected/library/overview/)'s free [assessment](https://learn.github.com/well-architected/library/overview/about-the-assessment/) and [governance checklist](https://learn.github.com/well-architected/library/governance/checklist/). Retain that baseline.

## A 90-day plan

A planning sequence that gets the highest-risk exposures closed first, **not a promise of audit readiness in 90 days**:

| Planning window | Focus | Configuration milestone |
|---|---|---|
| **Days 1-30** | Data boundaries and evidence | Block public exposure in the existing deployment, start durable evidence collection, capture the assessment baseline, and approve deployment/migration and retention plans |
| **Days 31-60** | Identity and change control | IdP-driven provisioning, token policies enforced, central rulesets on regulated repositories, push protection everywhere |
| **Days 61-90** | Supply chain, pipelines, and AI | Validate tier-aware scanning, action provenance, independent release approvals, target-side verification, and enterprise Copilot policy; close gaps before enabling regulated use |

EMU/data-residency migration can take substantially longer than a month; existing deployments may move faster. Preserve current protections through migration and time-boxed Evaluate rollout. Sequence matters more than dates.

Track **configured**, **design-tested and enforced**, and **operating with complete retained evidence** separately. A control's operating period starts only after design tests pass and enforcement and collection are live, not at project kickoff or Evaluate enablement. Internal audit agrees the period and population; effectiveness needs evidence throughout. Report gaps and migration dependencies, not day-90 "audit readiness."

## Metrics worth reporting upward

Report program health, not activity volume:

- **Coverage:** percentage of repositories with push protection and code scanning enforced
- **Classification:** 100% of active repositories classified, with restrictive baseline coverage while classification is pending
- **Timeliness:** tier-aware vulnerability remediation and provider-confirmed secret revocation within SLA, not just alert closure
- **Change integrity:** percentage of changes to regulated systems with independent approval (target: 100%, with every exception explained)
- **Access hygiene:** number of long-lived credentials, trending down
- **Exceptions:** count and age of open policy exceptions and bypasses
- **Evidence health:** missing merge/deployment records, archive failures, and unresolved completeness differences

Combine GitHub APIs/security overview with IdP, ITSM, credential-provider, deployment-platform, and archive records. Reconcile populations and retain human decisions. Automation cannot invent external facts.

## Summary and key takeaways

- **GitHub is a privileged production system.** Govern it like one.
- **Platform before AI.** Copilot governance means nothing if code can leak through a public repository.
- **Make the five decisions:** deployment model, identity ownership, central policy, security licensing, and AI posture.
- **Demand evidence, not assurances.** Every control needs durable records of its operation, whether machine-generated or independently signed off.
- **Fund the platform team.** It's the cheapest control you'll ever buy.
- **Regulations are the floor.** Your policy defines the standard you're held to, so write one you can meet and prove.

**Your move:** Send the [series overview](/blog/github-waf-financial-services/) to your GitHub platform owner and your second-line risk partner, and ask for the evidence table above at your next review.

## References

Authorities and assessment tools are linked beside the decisions above. For the deployment decision:

- [Choosing an enterprise type for GitHub Enterprise Cloud](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/enterprise-fundamentals/choose-an-enterprise-type)
- [About Enterprise Managed Users](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/enterprise-managed-users)
- [About GitHub Enterprise Cloud with data residency](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-github-enterprise-cloud-with-data-residency)

The full list of regulatory sources by jurisdiction is in the [series overview](/blog/github-waf-financial-services/#the-regulatory-landscape-we-cover).
