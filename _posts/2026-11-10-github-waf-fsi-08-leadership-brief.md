---
layout: post
title: "GitHub Well-Architected for Financial Services: The Leadership Brief"
date: 2026-11-10 10:08:00 -0600
category: Blog
tags: [github, well-architected, financial-services, compliance, security, governance, leadership, risk-management]
excerpt: "Apply all five GitHub Well-Architected pillars in a financial institution: fund platform ownership, resilient delivery, secure development, effective collaboration, and measurable engineering improvement."
permalink: /blog/github-waf-financial-services/leadership-brief/
---

*This post is part of the [GitHub Well-Architected for Financial Services](/blog/github-waf-financial-services/) series.*

**Previous:** [Part 7: Copilot and AI Agents](/blog/github-waf-financial-services/copilot-and-agents/)

{::options toc_levels="2" /}

**In this post**

* Contents
{:toc}

> **A friendly note:** This information is meant to be guidance to help navigate a complex topic. Please validate these patterns with your compliance and/or regulatory reporting team(s).

## Leadership brief

- **Why it matters:** Your institution depends on software changes to serve customers. GitHub needs ownership and investment proportionate to that dependency.
- **Your decision:** Assign an executive sponsor, fund a platform owner, and agree expectations for data protection, delivery, and recovery.
- **Accountability:** Technology, security, and business leaders must resolve competing priorities together. A platform team cannot set the institution's risk appetite for them.
- **Ask for:** A short report on service reliability, delivery delays, unresolved risks, and tested recovery, with owners and decisions needed from leadership.

---

GitHub often arrives team by team, then quietly becomes critical infrastructure. Now your board asks: *Could customer data reach a public repository? Who approved the payments change? Can we still deliver a critical fix if our runners or identity provider fail? Why does a new engineering team need three weeks to make its first release?*

This executive edition of the nine-post series explains how to **apply GitHub Well-Architected in a financial institution**: what to decide, fund, and ask for. Linked technical parts provide implementation detail. The program stands on its own whether or not the institution adopts Copilot.

## What applying WAF means for leadership

Treat the five pillars as a balanced operating agenda, not five separate compliance projects:

| Pillar | Leadership expectation | A useful question |
|---|---|---|
| **Governance** | Accountable owners, clear policy, risk-tiered standards, and expiring exceptions | Who owns the platform and can resolve a cross-business-line policy conflict? |
| **Architecture** | Deliberate topology, supported integrations, isolated execution, and tested recovery | Which delivery dependencies can stop a critical release, and have we rehearsed the response? |
| **Application Security** | Broad protection, actionable findings, and owned remediation | Can teams prevent, find, and resolve exposures without a parallel spreadsheet program? |
| **Collaboration** | Discoverable repositories, clear maintainers, useful reviews, and controlled reuse | Can a team safely contribute to a shared payments library without knowing its maintainer personally? |
| **Productivity** | Predictable onboarding, maintained delivery paths, and reduced waiting and rework | Where does delivery time go, and which platform improvements remove avoidable delay? |

These are this series' financial-services expectations for the [WAF pillars](https://learn.github.com/well-architected/library/overview/). Set institution-specific targets; do not present every engineering service objective as a regulatory requirement. A faster pipeline is valuable, but speed gained by bypassing independent approval is not improvement.

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

<a id="4-do-we-license-security-everywhere"></a>

### 4. Where do we require security coverage?

**Secret Protection** and **Code Security** are separately licensed [by unique active committers, not by repository](https://docs.github.com/en/billing/concepts/product-billing/github-advanced-security). That billing metric does not define the risk population: non-developers and people who only create issues or comments can also expose credentials.

**Our recommendation:** Enable Secret Protection on every private and internal repository and budget capacity for the full GitHub user population as a conservative planning baseline, not a claim that issue-only activity is billable. Include those users in training and response procedures. Enable Code Security on everything in regulatory scope, with a plan to expand. Details: [Part 4](/blog/github-waf-financial-services/secrets-protection/) and [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/).

### 5. What delivery service are we funding?

The platform team needs a service mandate, not just permission to administer settings.

**Our recommendation:** Fund maintained repository templates and shared workflows, documented onboarding, a support and escalation model, runner capacity, and recovery exercises. Agree service objectives with engineering and business owners for access provisioning, review routing, build queues, and recovery. Critical services need a tested response to delivery-platform disruption, not a promise that someone can clone the repository.

**Ask your team:** "Show me a new team's path to its first compliant release, then show me how that release works when a shared dependency fails." Details: [Part 1](/blog/github-waf-financial-services/platform-foundation/), [Part 3](/blog/github-waf-financial-services/change-control/), and [Part 6](/blog/github-waf-financial-services/actions-hardening/).

Fund a production platform built on supported GA releases and GA features only. Beta, preview, and release-candidate capabilities are excluded, even as supplemental controls; risk acceptance does not make them production options under [this series' baseline](/blog/github-waf-financial-services/platform-foundation/#feature-availability-and-preview-controls). If available GA controls cannot meet a mandatory requirement, defer the affected capability. Any separately approved prerelease evaluation must be isolated from production, with synthetic data and no production credentials or regulated data. Fund the [provider exit plan](/blog/github-waf-financial-services/platform-foundation/#provider-exit-and-concentration-risk): replacement hosting/deployment, recoverable evidence, identity transition, and rehearsal. Vendor reports are not a tested way out.

## What "good" looks like, and the evidence to ask for

Bring this outcome/evidence table to risk committee:

| Outcome | Evidence you should be able to request | Series part |
|---|---|---|
| **Public exposure and lower-control fork destinations are blocked** | Enforced enterprise policy, complete classification inventory, approved fork destinations, and SIEM alerts on boundary changes | [Part 1](/blog/github-waf-financial-services/platform-foundation/) |
| **We keep a complete, durable audit trail** | Continuous streaming, immutable archives of merge/check and deployment evidence, approved retention schedule, and completeness/restore tests; GitHub's native retention is not the archive | [Part 1](/blog/github-waf-financial-services/platform-foundation/) |
| **Only the right people have access, and it ends when it should** | IdP-driven provisioning reports, credential inventory exports, quarterly access reviews with sign-off | [Part 2](/blog/github-waf-financial-services/identity-and-access/) |
| **Changes are authorized independently** | ITSM authorization linked to the revision and implementation window, final-commit review evidence, centrally enforced required workflows, and independent emergency elevation/PIR records | [Part 3](/blog/github-waf-financial-services/change-control/) |
| **Secrets are blocked before they land** | Push protection coverage across all repositories; bypass approvals; time-to-revoke against a written SLA | [Part 4](/blog/github-waf-financial-services/secrets-protection/) |
| **Vulnerabilities are found and fixed on time** | Tier-specific coverage and SLA reports, patch-availability dates, release-build SBOMs and provenance; separate runtime web protection evidence for [PCI DSS 6.4.2](https://www.pcisecuritystandards.org/document_library/) | [Part 5](/blog/github-waf-financial-services/code-scanning-supply-chain/) |
| **Pipeline integrity and deployment independence are enforced** | Approved action SHAs and provenance, short-lived credentials, and a trusted gate proving the deployment approver did not author or commit any change in the release; bot initiation does not prove independence | [Part 6](/blog/github-waf-financial-services/actions-hardening/) |
| **Teams can find owners and contribute safely** | Maintainer inventory, current contribution guidance, review-routing tests, and sampled cross-team changes retaining required authorization | [Part 3](/blog/github-waf-financial-services/change-control/) |
| **The supported delivery path is reliable and usable** | Onboarding lead time, runner queue/failure trends, maintained shared workflows, and rehearsed recovery results against institution-approved objectives | [Part 1](/blog/github-waf-financial-services/platform-foundation/), [Part 6](/blog/github-waf-financial-services/actions-hardening/) |
| **GitHub is managed as a third party** | Service-scoped assurance review, report-period/bridge coverage, subservice and customer-control assessment, provider/register inventory where required, and a tested exit/concentration-risk plan ([reports](https://docs.github.com/en/enterprise-cloud@latest/admin/overview/accessing-compliance-reports-for-your-enterprise)) | [Part 1](/blog/github-waf-financial-services/platform-foundation/) |

Request repeatable exports and retained judgment/UI-only sign-offs. Fund independent access reviews, vendor/legal assessment, emergency approvals, and training. Ask which exports are unavailable and who owns each gap; necessary screenshots still cannot prove completeness/history.

**Where Copilot fits:** If adopted, fund its provider/model approval, training, policy, budget, and route-specific evidence as an extension of this operating model. [Part 7](/blog/github-waf-financial-services/copilot-and-agents/) covers the additional risks and regulatory scope. An AI rollout is neither a prerequisite for this program nor a substitute for its delivery and control outcomes.

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
9. How long does a new team wait for access and its first compliant release, and where does it get stuck?
10. When did we last rehearse recovery of a critical delivery path, including identity, runners, artifacts, and approval evidence?

## The operating model

**Someone owns the product.** Fund a platform team responsible for:

- Enterprise policies, rulesets, and security configurations, all managed as code
- The approved list of pipeline components and shared workflows
- Runner infrastructure and network connectivity
- Repository templates, contribution guidance, developer onboarding, and a supported request path
- Shared workflow maintainers, review-routing ownership, runner capacity, and cost allocation
- The evidence pipeline: audit log streaming, metrics exports, and quarterly control reports
- Classification completeness, expiring exceptions, archive integrity, and tested provider exit

Business-service owners identify criticality and delivery needs. Engineering teams own their repositories, reviews, and remediation; the platform team owns the shared service and improvement backlog. Security partners on safe patterns. Second line defines requirements and reviews evidence; internal audit tests controls independently.

Review the service with its users. Repeated access delays, flaky required checks, and abandoned shared workflows are platform defects to fix, not reasons to train people to open another ticket. Central standards should reduce duplicated work, not create a queue for every routine change.

Start with [GitHub Well-Architected](https://learn.github.com/well-architected/library/overview/)'s free [assessment](https://learn.github.com/well-architected/library/overview/about-the-assessment/) and [governance checklist](https://learn.github.com/well-architected/library/governance/checklist/). Retain that baseline.

## A 90-day plan

A planning sequence that gets the highest-risk exposures closed first, **not a promise of audit readiness in 90 days**:

| Planning window | Focus | Configuration milestone |
|---|---|---|
| **Days 1-30** | Ownership, boundaries, and baseline | Name the platform owner, inventory critical delivery paths, block public exposure, start durable evidence collection, capture the five-pillar assessment and onboarding/CI baseline, and approve deployment and retention plans |
| **Days 31-60** | Access, collaboration, and secure change | Establish IdP-driven provisioning, token policy, central rulesets, push protection, repository maintainers, contribution guidance, and a pilot supported delivery path |
| **Days 61-90** | Reliable delivery and continuous improvement | Validate scanning, action provenance, independent release approvals, and target-side verification; rehearse a critical recovery path, measure queue/review delays, and prioritize the next service improvements |

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
- **Developer experience:** onboarding and first-release lead time, review wait time, and recurring support themes
- **Delivery service:** runner queue time, infrastructure-related pipeline failures, flaky-check rework, and recovery exercise results
- **Reuse and stewardship:** adoption of maintained shared workflows and the age of unsupported versions, paired with team feedback

Use trends and service/team-level context, not individual developer rankings or raw commit counts. Agree targets after measuring a baseline; changes in repository mix or release complexity can move a metric without indicating better engineering.

Combine GitHub APIs/security overview with IdP, ITSM, credential-provider, deployment-platform, and archive records. Reconcile populations and retain human decisions. Automation cannot invent external facts.

## Summary and key takeaways

- **GitHub is a privileged production system.** Govern it like one.
- **Apply all five pillars.** Security and audit evidence matter; so do resilience, collaboration, and effective delivery.
- **Make the five decisions:** deployment model, identity ownership, central policy, security coverage, and the delivery service mandate.
- **Demand evidence, not assurances.** Every control needs durable records of its operation, whether machine-generated or independently signed off.
- **Fund the platform team and its improvement backlog.** Shared workflows, clear ownership, and recovery rehearsals need sustained stewardship.
- **Regulations are the floor.** Your policy defines the standard you're held to, so write one you can meet and prove.

**Your move:** Send the [series overview](/blog/github-waf-financial-services/) to your GitHub platform owner and your second-line risk partner, and ask for the evidence table above at your next review.

## References

Authorities and assessment tools are linked beside the decisions above. For the deployment decision:

- [Choosing an enterprise type for GitHub Enterprise Cloud](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/enterprise-fundamentals/choose-an-enterprise-type)
- [About Enterprise Managed Users](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/enterprise-managed-users)
- [About GitHub Enterprise Cloud with data residency](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-github-enterprise-cloud-with-data-residency)

The full list of regulatory sources by jurisdiction is in the [series overview](/blog/github-waf-financial-services/#the-regulatory-landscape-we-cover).
