---
layout: post
title: "GitHub Well-Architected for Financial Services, Part 1: Platform Foundation and Data Boundaries"
date: 2026-11-05 10:01:00 -0600
category: Blog
tags: [github, well-architected, financial-services, compliance, security, governance, data-residency, enterprise-managed-users, audit-log]
excerpt: "Before you tune a single Copilot policy, decide where your code lives, who can make it public, and how you will prove it to an examiner: here is the opinionated foundation for running GitHub at a regulated financial institution."
permalink: /blog/github-waf-financial-services/platform-foundation/
---

*This post is part of the [GitHub Well-Architected for Financial Services](/blog/github-waf-financial-services/) series.*

- [Series Overview and Compliance Crosswalk](/blog/github-waf-financial-services/)
- **Part 1: Platform Foundation and Data Boundaries**
- [Part 2: Identity and Access Management](/blog/github-waf-financial-services/identity-and-access/)
- [Part 3: Source Code Management and Change Control](/blog/github-waf-financial-services/change-control/)
- [Part 4: Secrets Protection](/blog/github-waf-financial-services/secrets-protection/)
- [Part 5: Code Scanning and Software Supply Chain](/blog/github-waf-financial-services/code-scanning-supply-chain/)
- [Part 6: CI/CD and GitHub Actions Hardening](/blog/github-waf-financial-services/actions-hardening/)
- [Part 7: Copilot and AI Agents](/blog/github-waf-financial-services/copilot-and-agents/)
- [The Leadership Brief](/blog/github-waf-financial-services/leadership-brief/)

> **A friendly note:** This information is meant to be guidance to help navigate a complex topic. Please validate these patterns with your compliance and/or regulatory reporting team(s).

## Leadership brief

- **The risk:** The most expensive GitHub incident at a bank is rarely exotic. It is a developer creating a public repository, a personal fork, or a public gist that contains customer data, internal hostnames, or credentials. Every downstream control (scanning, Copilot policy, rulesets) assumes the code never left the building.
- **Our position:** Run **GitHub Enterprise Cloud with Enterprise Managed Users (EMU)** as the default. Use **data residency (GHE.com)** when a regulator or contract requires in-region storage in a supported region. Reserve **GitHub Enterprise Server (GHES)** for genuine air-gap or sovereignty mandates. Keep personal-account enterprises for open source work only, separate from regulated code.
- **The guardrails:** No public repositories, and forks stay inside the enterprise. Owners gate outside collaborators and deletions. Repositories carry required classification properties, and network access is restricted by IP allow list or IdP conditional access.
- **The evidence:** Audit logs streamed to your SIEM from day one, since GitHub Enterprise Cloud keeps only 180 days (and Git events for just 7). Add automated daily review of policy and visibility changes, tested recovery from an independent mirror, and GitHub's SOC and PCI reports filed in your third-party risk program.

Stop me if you've seen this movie. A bank spends six months building an AI governance framework for Copilot: content exclusions, model allow lists, the works. Then, on a Friday afternoon, an engineer pushes a "quick test" repo to their personal GitHub account. It's public, and it has a config file full of production connection strings.

Put bluntly: **it doesn't matter how well we secure Copilot if people are making public repos with sensitive data.** That is the whole thesis of Part 1. Before identity, rulesets, or secret scanning, you need a platform where sensitive code cannot wander out the door, plus an audit trail that proves it.

This post is opinionated on purpose. We'll pick a deployment model, shape the enterprise, lock down the data boundary, classify what's inside, and build the evidence pipeline examiners will ask for.

## The requirements

Regulations are baselines, not checklists. These are the requirements that most directly shape your platform foundation. Your compliance team decides how your organization implements each one; this table shows where GitHub settings support that implementation.

| ID | Regulation and citation | What it asks for (paraphrase) |
|---|---|---|
| US-FFIEC-INFOSEC | [FFIEC IT Examination Handbook, Information Security](https://ithandbook.ffiec.gov/it-booklets/information-security) | A governed information security program with controls protecting confidentiality, integrity, and availability. |
| US-FFIEC-BCM | [FFIEC IT Examination Handbook, Business Continuity Management](https://ithandbook.ffiec.gov/it-booklets/business-continuity-management) | Continuity strategy, plans, and testing. |
| US-GLBA-314 | [GLBA Safeguards Rule, 16 CFR Part 314](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-314) | A written, risk-based security program covering access controls, vendor oversight, and monitoring. |
| US-OCC-30-AppB | [Interagency Guidelines Establishing Information Security Standards, 12 CFR Part 30 App. B](https://www.ecfr.gov/current/title-12/chapter-I/part-30/appendix-Appendix%20B%20to%20Part%2030) | Comprehensive written security program including access controls and service provider oversight. |
| US-NYDFS-500.3 | [23 NYCRR Part 500, Section 500.3](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | A written, board-approved cybersecurity policy covering access control, data governance, BCM, and more. |
| US-NYDFS-500.6 | [23 NYCRR Part 500, Section 500.6](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Audit trails to detect and respond to cybersecurity events, with defined retention. |
| US-NYDFS-500.11 | [23 NYCRR Part 500, Section 500.11](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Due diligence and contractual protections for third-party service providers. |
| US-NYDFS-500.16 | [23 NYCRR Part 500, Section 500.16](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Written incident response and business continuity plans. |
| US-3PRM-2023 | [Interagency Guidance on Third-Party Relationships (Fed SR 23-4)](https://www.federalreserve.gov/supervisionreg/srletters/SR2304.htm), [OCC Bulletin 2023-17](https://www.occ.gov/news-issuances/bulletins/2023/bulletin-2023-17.html) | Risk-tiered third-party lifecycle: due diligence, contracting, ongoing monitoring, termination. |
| CA-OSFI-B13 | [OSFI Guideline B-13, Technology and Cyber Risk Management](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | Risk-based governance, technology operations, resilience, and cyber security. |
| CA-OSFI-B10 | [OSFI Guideline B-10, Third-Party Risk Management](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/third-party-risk-management-guideline) | Manage third-party risk proportionate to criticality; the institution stays accountable. |
| CA-OSFI-E21 | [OSFI Guideline E-21, Operational Risk Management and Resilience](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/operational-risk-management-resilience-guideline) | Sustain critical operations through disruption, including data risk and change. |
| BR-CMN-4893 | [CMN Resolution 4,893/2021 (Brazil)](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf) | Formal cybersecurity policy and requirements for contracting cloud and data processing services, including overseas providers. |
| MX-CNBV-CUB | [CNBV Circular Única de Bancos (Mexico)](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf) | Technology risk, information security, and IT outsourcing provisions for banks. |
| CO-SFC-CBJ-006-2025 | [SFC Circular Básica Jurídica, CE 006 de 2025 (Colombia)](https://www.superfinanciera.gov.co/publicaciones/10115528/circular-basica-juridica-ce-00625/) | Information security and cybersecurity risk management for supervised entities. |
| CL-CMF-20-10 | [CMF RAN Chapter 20-10 (Chile)](https://www.cmfchile.cl/portal/normativa/624/articles-29310_doc_pdf.pdf) | Baseline information security and cybersecurity management for banks. |
| EU-DORA-5-16 | [DORA, Regulation (EU) 2022/2554, Arts. 5 to 16](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554) | An ICT risk management framework with board accountability, protection, detection, and recovery. |
| EU-DORA-12 | [DORA Art. 12, Backup policies and recovery](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_12) | Documented backup scope and frequency based on criticality, plus restoration procedures. |
| EU-DORA-28-30 | [DORA Arts. 28 to 30, ICT third-party risk](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_28) | Full responsibility despite outsourcing, concentration risk assessment, and mandatory contract terms (including data locations). |
| EU-DORA-RTS-LOGGING | [Delegated Regulation (EU) 2024/1774, Art. 12](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | Logging requirements within the ICT risk management framework. |
| EU-GDPR-25 | [GDPR Art. 25, Data protection by design and by default](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679) | Build protective measures in at design time; only necessary processing by default. |
| EU-GDPR-44 | [GDPR Art. 44, General principle for transfers](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679) | Transfers of personal data outside the EU/EEA must meet Chapter V conditions. |
| INT-PCI-10.2 | [PCI DSS v4.0.1, Req. 10.2](https://www.pcisecuritystandards.org/document_library/) | Audit logs capture administrative actions, access to logs, and authentication changes. |
| INT-PCI-10.4 | [PCI DSS v4.0.1, Req. 10.4](https://www.pcisecuritystandards.org/document_library/) | Daily review of security logs using automated mechanisms. |
| INT-PCI-12.8 | [PCI DSS v4.0.1, Req. 12.8](https://www.pcisecuritystandards.org/document_library/) | Maintain and monitor third-party service providers, including annual compliance checks. |
| INT-PCI-12.9 | [PCI DSS v4.0.1, Req. 12.9](https://www.pcisecuritystandards.org/document_library/) | Service providers acknowledge responsibility and give customers information to support their scoping. |

## Deployment model differences

Here's how the four patterns differ **for this topic**. Identity, Actions, and Copilot differences live in their own parts.

| Topic | GHEC (personal accounts) | GHEC with EMU | GHEC with data residency (GHE.com) | GHES |
|---|---|---|---|---|
| **Public repos** | Allowed unless blocked by policy. Users can always create public repos in their **personal** namespace, outside your control. | Not possible. [Managed users can contribute only to private and internal repositories](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts) in the enterprise. | Not possible ([EMU is required](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-github-enterprise-cloud-with-data-residency)). | "Public" means visible to anyone who can reach the instance. [Private mode](https://docs.github.com/en/enterprise-server@3.22/admin/configuring-settings/hardening-security-for-your-enterprise/enabling-private-mode) requires sign-in. |
| **Gists** | No enterprise control over personal gists. | [Managed users cannot create gists](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts). | [Unavailable](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency). | Available. [Anonymous gists only work when private mode is off](https://docs.github.com/en/enterprise-server@3.22/get-started/writing-on-github/editing-and-sharing-content-with-gists/creating-gists). |
| **GitHub Pages** | Public or private per [org policy](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-the-publication-of-github-pages-sites-for-your-organization). | [Private only](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site). | Private only (EMU). | Instance-wide; [public sites expose every site](https://docs.github.com/en/enterprise-server@3.22/admin/configuring-settings/configuring-user-applications-for-your-enterprise/configuring-github-pages-for-your-enterprise). |
| **Data location** | GitHub.com (US by default). | Same. | [EU, Australia, US, or Japan](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-github-enterprise-cloud-with-data-residency), with [documented exceptions](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-storage-of-your-data-with-data-residency). | Wherever you run it. |
| **Network restriction** | [Enterprise IP allow list](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/hardening-security-for-your-enterprise/restricting-network-traffic-to-your-enterprise-with-an-ip-allow-list). | IP allow list, or IdP conditional access with Entra ID OIDC. | Same as EMU. | Your own network and firewall. |
| **Audit retention** | [180 days; Git events 7 days](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/security-and-compliance/audit-log-for-an-enterprise). Stream to keep more. | Same. | Same; [S3 streaming via OIDC unavailable](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency). | [Indefinite unless you configure otherwise](https://docs.github.com/en/enterprise-server@3.22/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise). |
| **Backup and DR** | GitHub-operated. | GitHub-operated. | GitHub-operated. | **Yours**: [Backup Service](https://docs.github.com/en/enterprise-server@3.22/admin/backing-up-and-restoring-your-instance/about-the-backup-service-for-github-enterprise-server), HA, upgrades. |
| **Vendor reports** | [Compliance tab](https://docs.github.com/en/enterprise-cloud@latest/admin/overview/accessing-compliance-reports-for-your-enterprise) (SOC 1/2, ISO 27001, PCI AoC, more). | Same. | Same. | Hosting controls are yours to evidence. |

## Choosing your deployment model

### What we do

**GHEC with Enterprise Managed Users is the default for regulated financial institutions.** The decision tree is short:

1. **Do you need code stored in a specific region, and is that region offered?** Choose **GHE.com** (data residency). It requires EMU anyway.
2. **Are you prohibited from using SaaS for source code, or need an air gap?** Choose **GHES**, and budget for the operations team it demands.
3. **Everyone else:** Choose **GHEC with EMU**.
4. **Open source program office?** If you publish open source, run it in a **separate** personal-account enterprise or organization, deliberately isolated from regulated code.

### Why

The WAF [governance essentials](https://learn.github.com/well-architected/library/governance/recommendations/governance-administration-essentials/) guidance is clear about the trade-off. In the standard (personal account) model, "what the user does in the context of their own account or other non-enterprise organizations and repositories is not subject to the enterprise's controls." That's the gap the opening anecdote fell through. EMU closes it: no public repos, no gists, no pushing or forking outside the enterprise, and accounts that are suspended when the IdP says so.

This maps directly to **EU-GDPR-25** (protection by default), **US-GLBA-314** and **US-OCC-30-AppB** (access controls), and **US-NYDFS-500.3** (a policy you can actually enforce). "Don't put code in public repos" is a hope. A platform that can't create public repos is a control.

Data residency matters for **EU-GDPR-44**, **EU-DORA-28-30** (data locations in contracts), and **BR-CMN-4893** (overseas cloud contracting). Read the fine print, though. GitHub documents [data stored outside your region](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-storage-of-your-data-with-data-residency), including billing data, **support case data**, and **Copilot data by default** (unless you enable the "Restrict Copilot to data residency compliant models" policy). GitHub also "does not notify you when transfers occur." Have your privacy team read that page before anyone signs.

**The part nobody puts in the slide deck:** both the account model and residency are creation-time choices. The WAF says switching is "not simple" and "requires both migration tools and an additional process." Choose carefully, once.

**When does GHES make sense?** When your regulator, contract, or risk appetite rules out SaaS, or you need residency in a region GHE.com doesn't offer yet. Canadian and LATAM institutions with in-country mandates will hit this. Go in clear-eyed: [upgrades are yours](https://docs.github.com/en/enterprise-server@3.22/admin/overview/about-upgrades-to-new-releases) (feature releases "typically occur quarterly"), and so are HA and backups. You trade a vendor risk for an operational one.

### How

- Walk through GitHub's [Choosing an enterprise type](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/enterprise-fundamentals/choose-an-enterprise-type) questions with security, privacy, and legal in the room.
- For GHE.com, review the [feature overview](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency) for gaps (Marketplace, some preview features, S3 via OIDC streaming).
- Contractors and vendors? EMU's [guest collaborator role](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/enabling-guest-collaborators) gives IdP-provisioned outsiders access without automatic access to every internal repository.

### Verify

Write the decision down. A one-page **architecture decision record** naming the model, the residency region (if any), the out-of-region data exceptions you accepted, and who approved it is exactly the artifact **US-NYDFS-500.3** and **CA-OSFI-B13** reviews look for. Revisit it annually or when GitHub adds a region.

## Enterprise and organization topology

### What we do

**One enterprise for all internal work, and as few organizations as you can defend.** Our default is the WAF's **red-green-sandbox** pattern:

| Organization | Purpose | Base permission |
|---|---|---|
| `acme` (green) | ~90% of repositories, innersource by default | Read or write |
| `acme-restricted` (red) | Need-to-know: PCI cardholder data environment, MNPI, M&A work | None |
| `acme-sandbox` | Experiments and training, nothing production | Read |

Govern everything through **enterprise-level policies**. Organization owners customize within the envelope; they don't redraw it.

### Why

The WAF [governance essentials](https://learn.github.com/well-architected/library/governance/recommendations/governance-administration-essentials/) recommends against mapping organizations to your org chart, because reorgs happen more often than audits. It does list "data classification or regulatory requirements" as a legitimate reason for a separate organization. That's the red org.

For capital markets firms, a red organization also gives you a clean way to implement **information barriers** between, say, research and trading. Fewer organizations means fewer places for policy drift, which supports **US-FFIEC-INFOSEC** and **EU-DORA-5-16** governance expectations.

### How

- Set enterprise policies under **Enterprise > Policies > Member privileges** with **enforced** values rather than "No policy" (details in the next section).
- Keep at least two owners per organization, and no more than you need, per the WAF checklist.
- Resist the "just one more org" request. Teams and repository roles solve most of those asks.

### Verify

Export the list of organizations and owners quarterly. Any org without a documented purpose is a finding waiting to happen.

## Enterprise policies: closing the data boundary

This is the heart of the post. Each setting below is set at the **enterprise** level and enforced on every organization.

### What we do

| Policy | Our setting | Where it lives |
|---|---|---|
| **Repository creation** | Members can create **private** and **internal** only. Public disabled. EMU: block repos in user namespaces. | Member privileges |
| **Default visibility** | Internal (the GHEC default for enterprise-owned orgs). Red org: private only via repository policy. | Repository policy |
| **Visibility changes** | Restricted to owners. | Member privileges |
| **Forking** | Allowed only within the enterprise, never to user accounts. Red org: disabled. | Member privileges |
| **Outside collaborators** | Restricted to enterprise owners (or org owners with a documented approval flow). | Member privileges |
| **Deletion and transfer** | Restricted to owners. | Member privileges plus repository policy |
| **GitHub Pages** | Private only. | EMU enforces; otherwise org setting |
| **Gists** | Not available. | EMU enforces; GHES private mode |

### Why

The WAF [governance policies best practices](https://learn.github.com/well-architected/library/governance/recommendations/governance-policies-best-practices/) list reads like a bank examiner's wish list: disable forking if not needed, restrict visibility changes, prevent members from inviting outside collaborators (the default is "No policy"), and block public repository creation. These settings directly support **US-GLBA-314**, **US-OCC-30-AppB**, **CL-CMF-20-10**, **CO-SFC-CBJ-006-2025**, and **EU-GDPR-25**.

**Forking deserves extra attention.** GitHub's [forks reference](https://docs.github.com/en/enterprise-cloud@latest/pull-requests/reference/forks) says that under the most permissive policies, "you can fork a private repository to your personal account or to an organization where you have permission to create repositories, including an organization in another enterprise." Read that twice. Then note that the enterprise [IP allow list does **not** restrict](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/hardening-security-for-your-enterprise/restricting-network-traffic-to-your-enterprise-with-an-ip-allow-list) "repository forks owned by personal accounts (not managed user accounts)." A personal-account fork is outside both your policy boundary and your network boundary.

### How

**Member privilege policies** cover the basics. Start with [Enforcing repository management policies in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise). It covers repository creation, forking (including where forks can land), outside collaborator invitations, visibility changes, and deletion and transfer. On GHES 3.22, the [same page](https://docs.github.com/en/enterprise-server@3.22/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise) also lets you set the default visibility for new repositories and control anonymous Git read access.

**Repository policies** (currently **public preview**) add targeting and bypass lists on top. See [Governing how people use repositories in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-repositories-in-your-enterprise/governing-how-people-use-repositories-in-your-enterprise). You can restrict permitted visibilities, creation, deletion, transfers out of an organization, and naming. Policies are **additive** with member privileges, so the most restrictive rule wins. That makes them safe to layer. A good first policy: "Repositories with `data-classification` of `Restricted` cannot be made public or transferred out of the organization."

**GitHub Pages:** for non-EMU enterprises, set **Pages creation** to private only in each org's [member privileges](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-the-publication-of-github-pages-sites-for-your-organization). Note that disallowing Pages doesn't unpublish existing sites. On GHES, leave "public sites" off; enabling it makes every Pages site on the instance public.

**GHES:** enable [private mode](https://docs.github.com/en/enterprise-server@3.22/admin/configuring-settings/hardening-security-for-your-enterprise/enabling-private-mode). GitHub's docs say you **must** if the instance is reachable from the internet.

### Verify

Settings drift. Prove they haven't, on a schedule. This script checks the effective org-level values and hunts for public repositories:

```bash
#!/usr/bin/env bash
# Daily boundary check. Requires: gh CLI authenticated as an org owner (or auditor role).
set -euo pipefail
ORGS="acme acme-restricted acme-sandbox"

for org in $ORGS; do
  echo "== $org"
  gh api "orgs/$org" --jq '{
    public_repos_allowed: .members_can_create_public_repositories,
    private_forking:      .members_can_fork_private_repositories,
    public_pages_allowed: .members_can_create_public_pages
  }'
  # Any public repo in an FSI org is an incident, not a warning.
  gh repo list "$org" --visibility public --limit 1000 --json nameWithOwner --jq '.[].nameWithOwner'
done
```

Pair it with audit log alerts on these events from the [enterprise audit log event reference](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise):

| Event | Meaning | Alert? |
|---|---|---|
| `repo.access` | Repository visibility changed | Always |
| `repo.transfer_outgoing`, `repo.destroy` | Repository left or was deleted | Always |
| `business.update_member_repository_creation_permission` | Enterprise creation policy changed | Always |
| `business.update_member_repository_invitation_permission` | Outside collaborator policy changed | Always |
| `private_repository_forking.enable` | Forking policy loosened | Always |
| `repository_visibility_change.enable` | Visibility change policy loosened | Always |
| `members_can_create_public_pages.enable` | Public Pages allowed | Always |
| `org.add_outside_collaborator` | Outsider added to a repo | Review daily |

Every one of these should be rare. Frequent `repo.access` events mean something upstream is wrong.

## Data classification with custom properties

### What we do

**Every repository carries a required, enterprise-defined classification.** Start with a small schema:

| Property | Type | Values | Who sets it |
|---|---|---|---|
| `data-classification` | single select | Public, Internal, Confidential, Restricted | Governance team (or owners on request) |
| `compliance-frameworks` | multi select | SOX, PCI-DSS, GLBA, DORA, None | Governance team |
| `business-criticality` | single select | Critical, High, Medium, Low | Repository admins |
| `owner-team` | string | Team slug | Repository admins |

Yes, "Public" is in the list even with no public repos. It describes the **data** (say, docs headed for publication), not the repository.

### Why

You can't protect what you haven't labeled. The WAF [custom properties best practices](https://learn.github.com/well-architected/library/governance/recommendations/managing-repositories-at-scale/custom-properties-best-practices/) guidance even uses a financial services example (`compliance-frameworks: ["SOX", "PCI-DSS"]`, `data-classification: "Restricted"`). It recommends a **hybrid** ownership model: governance controls compliance properties, while teams self-manage operational ones. That split is the right call for regulated shops.

Classification is how later controls find their targets: SOX rulesets (Part 3), PCI scanning (Part 5), and Copilot content exclusions (Part 7) all key off these properties. It supports **EU-GDPR-25**, **US-NYDFS-500.3** data governance, and **INT-PCI-12.9** scoping.

### How

1. Define properties at the enterprise level: **Enterprise > Policies > Custom properties**. See [Managing custom properties for repositories in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-repositories-in-your-enterprise/managing-custom-properties-for-repositories-in-your-enterprise).
2. Select **Require this property for all repositories**, and enable **Require explicit user-specified values** so new repositories can't silently inherit a default.
3. Leave **Allow repository actors to set this property** **off** for `data-classification` and `compliance-frameworks`.
4. Target repository policies and rulesets at property values, not repo names.

Two caveats worth knowing: an enterprise can have up to 100 property definitions, and Copilot-suggested values and external system sync are both **public preview**.

### Verify

The WAF sets a target of **at least 90% of active repositories** with required properties populated. Measure it with the [custom properties REST API](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/custom-properties):

```bash
# Repositories missing data-classification in an org
gh api --paginate "orgs/acme/properties/values" --jq '
  .[] | select(
    ([.properties[] | select(.property_name == "data-classification" and .value != null)] | length) == 0
  ) | .repository_name'
```

Then search for mismatches using the [`props.` qualifier](https://docs.github.com/en/enterprise-cloud@latest/search-github/searching-on-github/searching-for-repositories), for example `org:acme props.data-classification:Restricted is:internal`. A Restricted repository that's readable by the whole enterprise is a finding. Audit events `custom_property_value.update` and `custom_property_definition.update` show who reclassified what. Run coverage weekly and reconcile against your CMDB quarterly.

## Network boundaries: IP allow lists

### What we do

**Restrict access to corporate egress ranges.** For EMU with Entra ID OIDC, use the IdP's conditional access policy (CAP). Everyone else uses GitHub's enterprise IP allow list. On GHES, the boundary is your own network.

### Why

An allow list means a stolen token or session is far less useful from an attacker's laptop. It supports **US-OCC-30-AppB** and **US-GLBA-314** access controls and **EU-DORA-5-16** protection. The WAF [governance essentials](https://learn.github.com/well-architected/library/governance/recommendations/governance-administration-essentials/) offers one sharp warning: "Missing ranges will cause integrations to silently fail."

### How

Follow [Restricting network traffic to your enterprise with an IP allow list](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/hardening-security-for-your-enterprise/restricting-network-traffic-to-your-enterprise-with-an-ip-allow-list). The details that bite:

- **Pick one model.** With EMU and Entra ID OIDC, using the IdP allow list deactivates GitHub's allow list for all organizations. CAP protection for **web sessions** is in **public preview**.
- **Apps:** enable "IP allow list configuration for installed GitHub Apps." With OIDC, that option only works if you use GitHub's allow list.
- **Actions:** you'll need self-hosted runners or larger runners with static IPs (or Azure private networking). Part 6 covers this.
- **Know the gaps:** public resources accessed anonymously, personal-account forks, and (outside GHE.com) anonymized image URLs aren't covered.

### Verify

Alert on `ip_allow_list.disable` and `ip_allow_list_entry.create`. Review every entry quarterly and remove ranges nobody can explain.

## Audit logging and SIEM streaming

### What we do

**Stream the enterprise audit log to your SIEM on day one, including Git events and API request events, with source IPs displayed.** Retention is governed by your policy, not GitHub's defaults.

### Why

The GHEC audit log keeps [180 days of events and only seven days of Git events](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/security-and-compliance/audit-log-for-an-enterprise). That's nowhere near what **US-NYDFS-500.6**, **EU-DORA-RTS-LOGGING**, or **INT-PCI-10.2** programs expect. **INT-PCI-10.4** requires automated daily review, which you can't do in a web UI. The WAF [policies guidance](https://learn.github.com/well-architected/library/governance/recommendations/governance-policies-best-practices/) calls streaming "often overlooked," and the [governance design principles](https://learn.github.com/well-architected/library/governance/design-principles/) put auditability first.

### How

- Configure [audit log streaming](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise) to Splunk, Azure Event Hubs, Datadog, S3, Azure Blob Storage, or Google Cloud Storage. Prefer S3 with OIDC over access keys where available (not on GHE.com today).
- Enable **API Request Events** on the same page. Only security-relevant endpoints are streamed, but that's what you want.
- Turn on [IP address display](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/displaying-ip-addresses-in-the-audit-log-for-your-enterprise). GitHub notes you're responsible for legal obligations around storing IPs, so loop in privacy (hello, **EU-GDPR-25**).
- Streaming to multiple endpoints is **public preview**. Useful for a SIEM plus a cheap immutable archive.
- **GHES:** logs are [retained indefinitely unless you configure otherwise](https://docs.github.com/en/enterprise-server@3.22/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise), and you can [stream](https://docs.github.com/en/enterprise-server@3.22/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise) or use log forwarding. Ship them off-box anyway.

If streaming is temporarily impossible, the [audit log API](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/using-the-audit-log-api-for-your-enterprise) works as a stopgap (1,750 queries per hour per user and IP):

```bash
# Visibility changes in the last day (GNU date shown; use `date -v-1d` on macOS)
SINCE=$(date -u -d 'yesterday' +%Y-%m-%d)
gh api -X GET "enterprises/acme/audit-log" --paginate \
  -f phrase="action:repo.access created:>=$SINCE" -f per_page=100 \
  --jq '.[] | [.action, .actor, .repo] | @tsv'
```

### Verify

This is where the stream proves itself:

- A **pause buffer** keeps seven days, and a misconfigured stream must be fixed within six days of the health-check email. Alert on `audit_log_streaming.update` and `audit_log_streaming.destroy`, and on silence from the source in your SIEM.
- Keep a dashboard of the boundary events listed earlier. Its existence and daily review is your **INT-PCI-10.4** evidence.
- Run an annual **retention test**: pull an event older than 180 days from your SIEM and show it to an auditor.

## Backup and resilience

### What we do

**GHEC:** treat GitHub's BCDR as the vendor's control, and add a **warm, narrow mirror** of your most critical repositories in a separate failure domain. **GHES:** run the built-in Backup Service, archive off-box, keep HA, and test restores.

### Why

**EU-DORA-12**, **US-FFIEC-BCM**, **CA-OSFI-E21**, and **US-NYDFS-500.16** all expect *you* to own recovery for critical operations, even when a vendor runs the platform. "Our vendor has backups" isn't a recovery plan.

The WAF [repository mirroring](https://learn.github.com/well-architected/library/architecture/recommendations/building-resilience-with-repository-mirroring/) guidance is refreshingly practical. It describes a "rehearsed, break-glass deployment path," not an active-active fantasy. The target is a separate GHES instance or another independently operated Git service.

### How

**Mirroring (any model):**

```bash
# Scheduled job, run while the primary is healthy.
# Mirror only what the emergency procedure needs: default branch plus deployed tags.
git clone --bare https://github.com/acme/payments-api.git
cd payments-api.git
git push https://git.dr.acme.internal/acme/payments-api.git \
  refs/heads/main:refs/heads/main 'refs/tags/release-*:refs/tags/release-*'
```

The WAF's key points, condensed: mirror only what must be deployable (explicit refspecs, not `--mirror`). Keep the mirror, its credentials, and its dependencies in a **separate failure domain**. Deploy from an **exact SHA**. Remember that **settings don't mirror**, so rulesets, teams, secrets, and Actions history stay behind. Then name the humans and drill it.

**GHES backups:** the [Backup Service](https://docs.github.com/en/enterprise-server@3.22/admin/backing-up-and-restoring-your-instance/about-the-backup-service-for-github-enterprise-server) is configured in the Management Console and stores snapshots on a dedicated volume attached to the instance. That's not off-site, so snapshot the volume or configure [remote archives](https://docs.github.com/en/enterprise-server@3.22/admin/backing-up-and-restoring-your-instance/configuring-remote-archives-for-backups). The legacy [backup-utils](https://github.com/github/backup-utils/blob/master/README.md) project notes it "will be retired starting in GitHub Enterprise Server 3.22," so new deployments should start on the service. HA does not replace backups. GitHub's own [HA docs](https://docs.github.com/en/enterprise-server@3.22/admin/monitoring-and-managing-your-instance/configuring-high-availability/about-high-availability-configuration) are explicit that corruption can replicate instantly.

### Verify

- Alert on mirror **freshness**: compare source and mirror object IDs per ref.
- Run at least an annual **deploy-from-mirror drill** (quarterly for Tier 1 services) and file the results as BCM test evidence.
- **GHES:** perform a quarterly restore into a staging instance and record the restore time against your RTO.
- **GHEC:** download the **GitHub.com Services Continuity and Incident Management Plan** from the Compliance tab and attach it to your BCM vendor dependency record.

## Vendor assurance and third-party risk

### What we do

**Put GitHub through your third-party risk program like any critical ICT provider, using the reports GitHub already publishes.** Don't send a 400-question spreadsheet when a SOC 2 Type 2 answers most of it.

### Why

**US-3PRM-2023**, **US-NYDFS-500.11**, **CA-OSFI-B10**, **EU-DORA-28-30**, **MX-CNBV-CUB**, and **INT-PCI-12.8** all require due diligence and ongoing monitoring of providers. **INT-PCI-12.9** is the provider-side counterpart: the provider supplies what you need for scoping. GitHub does that through its PCI DSS Attestation of Compliance.

### How

From the enterprise **Compliance** tab, download the reports listed in [Accessing compliance reports for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/overview/accessing-compliance-reports-for-your-enterprise):

- SOC 1, Type 2 and SOC 2, Type 2
- ISO/IEC 27001:2022 certification
- CSA CAIQ (Level 1) and CSA STAR (Level 2)
- GitHub PCI DSS Attestation of Compliance
- GitHub Bug Bounty quarterly reports
- GitHub.com Services Continuity and Incident Management Plan

The [GitHub Enterprise Cloud Trust Center](https://ghec.github.trust.page/) is the public front door for additional documentation. For **GHES**, remember that the hosting controls (physical, network, patching, backups) live in your environment and your SOC scope.

**Read the complementary user entity controls (CUECs)** if the SOC report includes them. SOC reports typically use that section to list what the customer must do for the provider's controls to hold.

### Verify

Refresh reports annually and track each report's period end date in your vendor inventory. Map any CUECs to your control matrix (below) and name an owner for each.

## Control matrix

| Control | Requirement IDs | GitHub feature | Evidence | Cadence |
|---|---|---|---|---|
| Deployment model decision | US-NYDFS-500.3, CA-OSFI-B13, EU-GDPR-44, EU-DORA-28-30, BR-CMN-4893 | GHEC EMU / GHE.com / GHES | Signed ADR, residency exceptions accepted | Annual |
| Minimal org topology | US-FFIEC-INFOSEC, EU-DORA-5-16 | Enterprise account, red-green-sandbox orgs | Org inventory with purpose and owners | Quarterly |
| No public repos | US-GLBA-314, US-OCC-30-AppB, EU-GDPR-25, CL-CMF-20-10 | EMU; repo creation policy; repository policy | Policy screenshot/API output; zero public repo report | Daily (automated) |
| Forking contained | US-GLBA-314, CO-SFC-CBJ-006-2025 | Enterprise forking policy, EMU | `private_repository_forking.*` events; org API output | Daily alert |
| Outside collaborators gated | US-OCC-30-AppB, US-NYDFS-500.11 | Invitation policy; EMU guest collaborators | `org.add_outside_collaborator` review log | Daily review |
| Deletion/transfer gated | US-FFIEC-INFOSEC, EU-DORA-5-16 | Member privileges; repository policy | `repo.destroy`, `repo.transfer_outgoing` alerts | Daily alert |
| Pages/gists contained | EU-GDPR-25 | EMU; org Pages policy; GHES private mode | `members_can_create_public_pages.*` events | Daily alert |
| Data classification | US-NYDFS-500.3, EU-GDPR-25, INT-PCI-12.9 | Required enterprise custom properties | Coverage report (target 90%+); mismatch search | Weekly |
| Network restriction | US-OCC-30-AppB, EU-DORA-5-16 | IP allow list or IdP CAP | Entry review sign-off; `ip_allow_list.*` alerts | Quarterly |
| Audit log streaming | US-NYDFS-500.6, EU-DORA-RTS-LOGGING, INT-PCI-10.2, INT-PCI-10.4 | Enterprise streaming, API request events, IP display | SIEM ingestion health; daily review dashboard; retention test | Daily / annual |
| Recovery path | EU-DORA-12, US-FFIEC-BCM, CA-OSFI-E21, US-NYDFS-500.16 | Repo mirroring; GHES Backup Service and HA | Freshness alerts; drill and restore records | Quarterly |
| Vendor assurance | US-3PRM-2023, CA-OSFI-B10, EU-DORA-28-30, MX-CNBV-CUB, INT-PCI-12.8 | Compliance tab reports; Trust Center | Current SOC/ISO/PCI reports; CUEC mapping | Annual |

## Summary and key takeaways

The foundation is boring on purpose. Get it right, and every later control in this series has something solid to stand on.

**Your checklist:**

- [ ] Choose **GHEC with EMU** (or GHE.com / GHES for documented reasons) and record the decision in an ADR.
- [ ] Read the [out-of-region data list](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-storage-of-your-data-with-data-residency) with privacy before choosing GHE.com, and enable the Copilot residency policy if you do.
- [ ] Stand up one enterprise with **green, red, and sandbox** organizations. Push back on more.
- [ ] Enforce enterprise policies: no public repos, forks inside the enterprise only, visibility changes and deletions by owners, outside collaborators by owners.
- [ ] Layer **repository policies** (preview) targeting `data-classification` values.
- [ ] Define required enterprise **custom properties** and measure coverage weekly.
- [ ] Configure the **IP allow list** or IdP CAP, including app ranges and runner IPs.
- [ ] **Stream audit logs** with Git events, API request events, and source IPs, and alert on the boundary events.
- [ ] Build a **warm mirror** for Tier 1 repos (or GHES Backup Service with off-site archives) and drill it.
- [ ] File GitHub's **SOC, ISO, and PCI reports** in your vendor program and map the CUECs.

**Start here:** run the boundary-check script against your orgs today. If it prints a single public repository name, you've found your first priority.

**Previous:** [Series Overview and Compliance Crosswalk](/blog/github-waf-financial-services/)
**Next:** [Part 2: Identity and Access Management](/blog/github-waf-financial-services/identity-and-access/), where we make sure the people inside the boundary are who they claim to be, and only have what they need.

## References

### GitHub Well-Architected

- [Layers of GitHub Well-Architected](https://learn.github.com/well-architected/library/overview/layers/)
- [Essentials of governance and administration with GitHub Enterprise](https://learn.github.com/well-architected/library/governance/recommendations/governance-administration-essentials/)
- [Governance policies best practices](https://learn.github.com/well-architected/library/governance/recommendations/governance-policies-best-practices/)
- [Custom properties best practices](https://learn.github.com/well-architected/library/governance/recommendations/managing-repositories-at-scale/custom-properties-best-practices/)
- [Building resilience with repository mirroring](https://learn.github.com/well-architected/library/architecture/recommendations/building-resilience-with-repository-mirroring/)
- [Governance design principles](https://learn.github.com/well-architected/library/governance/design-principles/)
- [Governance checklist](https://learn.github.com/well-architected/library/governance/checklist/)

### GitHub Docs

- [Choosing an enterprise type for GitHub Enterprise Cloud](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/enterprise-fundamentals/choose-an-enterprise-type)
- [Abilities and restrictions of managed user accounts](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts)
- [Enabling guest collaborators](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/enabling-guest-collaborators)
- [About GitHub Enterprise Cloud with data residency](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-github-enterprise-cloud-with-data-residency)
- [About storage of your data with data residency](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-storage-of-your-data-with-data-residency)
- [Feature overview for GitHub Enterprise Cloud with data residency](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency)
- [Enforcing repository management policies in your enterprise (GHEC)](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise)
- [Enforcing repository management policies in your enterprise (GHES 3.22)](https://docs.github.com/en/enterprise-server@3.22/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise)
- [Governing how people use repositories in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-repositories-in-your-enterprise/governing-how-people-use-repositories-in-your-enterprise)
- [Forks](https://docs.github.com/en/enterprise-cloud@latest/pull-requests/reference/forks)
- [Managing the publication of GitHub Pages sites for your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-the-publication-of-github-pages-sites-for-your-organization)
- [Changing the visibility of your GitHub Pages site](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site)
- [Configuring GitHub Pages for your enterprise (GHES 3.22)](https://docs.github.com/en/enterprise-server@3.22/admin/configuring-settings/configuring-user-applications-for-your-enterprise/configuring-github-pages-for-your-enterprise)
- [Enabling private mode (GHES 3.22)](https://docs.github.com/en/enterprise-server@3.22/admin/configuring-settings/hardening-security-for-your-enterprise/enabling-private-mode)
- [Creating gists (GHES 3.22)](https://docs.github.com/en/enterprise-server@3.22/get-started/writing-on-github/editing-and-sharing-content-with-gists/creating-gists)
- [Managing custom properties for repositories in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-repositories-in-your-enterprise/managing-custom-properties-for-repositories-in-your-enterprise)
- [REST API endpoints for custom properties](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/custom-properties)
- [Searching for repositories](https://docs.github.com/en/enterprise-cloud@latest/search-github/searching-on-github/searching-for-repositories)
- [Restricting network traffic to your enterprise with an IP allow list](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/hardening-security-for-your-enterprise/restricting-network-traffic-to-your-enterprise-with-an-ip-allow-list)
- [Audit log for an enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/security-and-compliance/audit-log-for-an-enterprise)
- [Streaming the audit log for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise)
- [Displaying IP addresses in the audit log for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/displaying-ip-addresses-in-the-audit-log-for-your-enterprise)
- [Audit log events for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise)
- [Using the audit log API for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/using-the-audit-log-api-for-your-enterprise)
- [About the audit log for your enterprise (GHES 3.22)](https://docs.github.com/en/enterprise-server@3.22/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise)
- [Streaming the audit log for your enterprise (GHES 3.22)](https://docs.github.com/en/enterprise-server@3.22/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise)
- [About the backup service for GitHub Enterprise Server](https://docs.github.com/en/enterprise-server@3.22/admin/backing-up-and-restoring-your-instance/about-the-backup-service-for-github-enterprise-server)
- [Configuring remote archives for backups (GHES 3.22)](https://docs.github.com/en/enterprise-server@3.22/admin/backing-up-and-restoring-your-instance/configuring-remote-archives-for-backups)
- [About high availability configuration (GHES 3.22)](https://docs.github.com/en/enterprise-server@3.22/admin/monitoring-and-managing-your-instance/configuring-high-availability/about-high-availability-configuration)
- [About upgrades to new releases (GHES 3.22)](https://docs.github.com/en/enterprise-server@3.22/admin/overview/about-upgrades-to-new-releases)
- [GitHub Enterprise Server Backup Utilities README](https://github.com/github/backup-utils/blob/master/README.md)
- [Accessing compliance reports for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/overview/accessing-compliance-reports-for-your-enterprise)
- [GitHub Enterprise Cloud Trust Center](https://ghec.github.trust.page/)
- [REST API endpoints for organizations](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/orgs)

### Regulatory sources

- [FFIEC IT Handbook: Information Security](https://ithandbook.ffiec.gov/it-booklets/information-security)
- [FFIEC IT Handbook: Business Continuity Management](https://ithandbook.ffiec.gov/it-booklets/business-continuity-management)
- [GLBA Safeguards Rule, 16 CFR Part 314](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-314)
- [12 CFR Part 30, Appendix B](https://www.ecfr.gov/current/title-12/chapter-I/part-30/appendix-Appendix%20B%20to%20Part%2030)
- [23 NYCRR Part 500](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500)
- [Federal Reserve SR 23-4](https://www.federalreserve.gov/supervisionreg/srletters/SR2304.htm) and [OCC Bulletin 2023-17](https://www.occ.gov/news-issuances/bulletins/2023/bulletin-2023-17.html)
- [OSFI Guideline B-13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management), [B-10](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/third-party-risk-management-guideline), and [E-21](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/operational-risk-management-resilience-guideline)
- [CMN Resolution 4,893/2021 (Brazil)](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf)
- [CNBV Circular Única de Bancos (Mexico)](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20instituciones%20de%20cr%C3%A9dito.pdf)
- [SFC Circular Básica Jurídica CE 006 de 2025 (Colombia)](https://www.superfinanciera.gov.co/publicaciones/10115528/circular-basica-juridica-ce-00625/)
- [CMF RAN Chapter 20-10 (Chile)](https://www.cmfchile.cl/portal/normativa/624/articles-29310_doc_pdf.pdf)
- [DORA, Regulation (EU) 2022/2554](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554)
- [Commission Delegated Regulation (EU) 2024/1774](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774)
- [GDPR, Regulation (EU) 2016/679](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679)
- [PCI DSS v4.0.1 Document Library](https://www.pcisecuritystandards.org/document_library/)
