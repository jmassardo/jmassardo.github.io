---
layout: post
title: "GitHub Well-Architected for Financial Services, Part 2: Identity and Access Management"
date: 2026-11-05 10:02:00 -0600
category: Blog
tags: [github, well-architected, financial-services, compliance, security, governance, identity, access-management, least-privilege]
excerpt: "Who can get into your GitHub enterprise, what they can touch, and how fast you can take it away: an opinionated identity and access baseline for banks, insurers, and payment firms, with the evidence auditors will ask for."
permalink: /blog/github-waf-financial-services/identity-and-access/
---

*This post is part of the [GitHub Well-Architected for Financial Services](/blog/github-waf-financial-services/) series.*

- [Series Overview and Compliance Crosswalk](/blog/github-waf-financial-services/)
- [Part 1: Platform Foundation and Data Boundaries](/blog/github-waf-financial-services/platform-foundation/)
- **Part 2: Identity and Access Management**
- [Part 3: Source Code Management and Change Control](/blog/github-waf-financial-services/change-control/)
- [Part 4: Secrets Protection](/blog/github-waf-financial-services/secrets-protection/)
- [Part 5: Code Scanning and Software Supply Chain](/blog/github-waf-financial-services/code-scanning-supply-chain/)
- [Part 6: CI/CD and GitHub Actions Hardening](/blog/github-waf-financial-services/actions-hardening/)
- [Part 7: Copilot and AI Agents](/blog/github-waf-financial-services/copilot-and-agents/)
- [The Leadership Brief](/blog/github-waf-financial-services/leadership-brief/)

> **Applicability:** mappings contribute to requirements, not certification. Compliance confirms scope and exemptions. Follow Part 1's [deployment decision](/blog/github-waf-financial-services/platform-foundation/#choosing-your-deployment-model) and [feature/preview controls](/blog/github-waf-financial-services/platform-foundation/#feature-availability-and-preview-controls); GHES references use **3.22**. The [DPA](https://github.com/customer-terms/github-data-protection-agreement) excludes previews unless expressly covered. Validate availability and applicable terms before reliance.

## Leadership brief

> - **The risk:** A departed engineer's valid token or over-privileged service account can expose code, production, and customer data.
> - **Our position:** The data-residency/EMU default puts humans under IdP control, except the setup user. Enforce MFA, verify credential-path coverage, use SCIM, and minimize standing privilege.
> - **Machine access:** GitHub Apps are the default for automation. Fine-grained tokens are the governed exception, with approval and a maximum lifetime. Classic tokens are restricted.
> - **The evidence:** Audit log events for every role, token, and membership change; an enterprise credential inventory export; membership reports; and a quarterly access review with documented sign-off.

HR terminates 40 contractors after a reorg. Three weeks later, a forgotten job still pulls code with one contractor's personal access token. The token never got the memo.

Offboarding means finding every credential, role, and app grant, not just disabling a human. Here's the IAM baseline and evidence that prove access ended.

## The requirements

Use the [compliance crosswalk](/blog/github-waf-financial-services/) for applicability. This part expands PCI account-lifecycle and MFA citations; institutional policy cannot lower the applicable legal or contractual floor.

| ID | Regulation and citation | What it asks for (paraphrase) |
|---|---|---|
| US-FFIEC-INFOSEC | [FFIEC IT Examination Handbook, Information Security booklet](https://ithandbook.ffiec.gov/it-booklets/information-security) | Examiner framework for an information security program, including controls that protect confidentiality, integrity, and availability. |
| US-GLBA-314 | [GLBA Safeguards Rule, 16 CFR Part 314](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-314) | A written, risk-based security program that includes access controls. |
| US-OCC-30-AppB | [Interagency Guidelines, 12 CFR Part 30 Appendix B](https://www.ecfr.gov/current/title-12/chapter-I/part-30/appendix-Appendix%20B%20to%20Part%2030) | A comprehensive written security program for OCC-regulated banks, including access controls. |
| US-NYDFS-500.7 | [23 NYCRR §500.7, Access Privileges and Management](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Least-privilege access, periodic review, and removal of unnecessary privileged accounts. |
| US-NYDFS-500.12 | [23 NYCRR §500.12, Multi-Factor Authentication](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | MFA for any individual accessing any covered information system, subject to applicable exemptions; §500.12(b) permits CISO-approved reasonably equivalent or more secure compensating controls, reviewed at least annually. |
| US-NYDFS-500.14 | [23 NYCRR §500.14, Training and Monitoring](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Monitoring for unauthorized access or tampering. |
| CA-OSFI-B13 | [OSFI Guideline B-13, Technology and Cyber Risk Management](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | Risk-based management of technology and cyber risk, including cyber security controls. |
| PE-SBS-504 | [Resolución SBS N° 504-2021 (Peru)](https://intranet2.sbs.gob.pe/dv_int_cn/2046/v2.0/Adjuntos/504-2021.R.pdf) | The information security and cybersecurity management framework your access controls roll up to. |
| AR-BCRA-A7724 | [BCRA Comunicación "A" 7724 (Argentina)](https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A7724.pdf) | Minimum requirements for governing technology and information security risk. |
| EU-DORA-RTS-ACCESS | [Commission Delegated Regulation (EU) 2024/1774, Arts. 20-21](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | Identity management (unique identity per person or system) and access control policies built on it. |
| INT-PCI-7.2 | [PCI DSS v4.0.1, Req. 7.2](https://www.pcisecuritystandards.org/document_library/) | Need-to-know access by job function, a documented access model, and periodic review. |
| INT-PCI-8.2.5 | [PCI DSS v4.0.1, Req. 8.2.5](https://www.pcisecuritystandards.org/document_library/) | Revoke access for terminated users immediately. |
| INT-PCI-8.2.6 | [PCI DSS v4.0.1, Req. 8.2.6](https://www.pcisecuritystandards.org/document_library/) | Remove or disable inactive user accounts within 90 days of inactivity. |
| INT-PCI-8.3 | [PCI DSS v4.0.1, Req. 8.3](https://www.pcisecuritystandards.org/document_library/) | Strong authentication for users and administrators. |
| INT-PCI-8.4 | [PCI DSS v4.0.1, Req. 8.4](https://www.pcisecuritystandards.org/document_library/) | MFA for applicable non-console administrative access into the CDE, all access into the CDE, and remote network access that could access or impact the CDE; apply the standard's specific exceptions. |
| INT-SWIFT-CSCF-OVERVIEW | [SWIFT Customer Security Controls Framework (overview)](https://www.swift.com/myswift/customer-security-programme) | "Know and limit access" is one of three core objectives. |
| INT-NIST-CSF | [NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework) | Reference taxonomy; identity and access controls live under the Protect function. |

**Auditors test:** policy adequacy, configuration, operating effectiveness, and timely remediation. A checkbox is not sustained operation.

## Deployment model differences

Part 1 owns deployment selection. Here are the **IAM consequences**.

| Topic | GHEC (personal accounts) | GHEC with EMU | GHEC with data residency (GHE.com) | GHES |
|---|---|---|---|---|
| **Account owner** | The developer | Your IdP | Your IdP ([EMU is required](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/enterprise-fundamentals/choose-an-enterprise-type)) | Your instance |
| **Authentication** | GitHub login, then SAML SSO | SAML, or OIDC with Entra ID | Same as EMU | Built-in, or [SAML, LDAP, or CAS](https://docs.github.com/en/enterprise-server@3.22/admin/concepts/identity-and-access-management/identity-and-access-management-fundamentals) |
| **Provisioning** | [Org-level SCIM only](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-saml-single-sign-on-for-your-organization/about-scim-for-organizations); grants org access, not accounts | [SCIM required](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/configuring-scim-provisioning-for-users) | Same as EMU (SCIM URL is on your `SUBDOMAIN.ghe.com`) | JIT, plus [optional SCIM with SAML](https://docs.github.com/en/enterprise-server@3.22/admin/managing-iam/provisioning-user-accounts-with-scim/user-provisioning-with-scim-on-ghes) |
| **MFA** | GitHub 2FA (enforceable) plus IdP MFA | IdP only | IdP only | Instance 2FA for built-in/LDAP; IdP for SAML/CAS |
| **Conditional access** | GitHub IP allow list | [IdP CAP via OIDC (Entra ID)](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/configuring-authentication-for-enterprise-managed-users/about-support-for-your-idps-conditional-access-policy) or GitHub IP allow list | Same as EMU | Your network perimeter |
| **External collaborators** | Outside collaborators on repositories | [Guest collaborators](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/enabling-guest-collaborators), provisioned via IdP | Same as EMU | Local or IdP accounts |
| **Enterprise custom roles** | [Public preview](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-roles-in-your-enterprise/create-custom-roles) | Public preview | Public preview | [Public preview in 3.22](https://docs.github.com/en/enterprise-server@3.22/admin/managing-accounts-and-repositories/managing-roles-in-your-enterprise/create-custom-roles) |

**GHE.com specifics:** the setup user's shortcode is randomly generated, and API, SCIM, and SSH endpoints all move to your subdomain. Update IdP apps, scripts, and allow lists accordingly ([GHE.com feature overview](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency)).

## Account model: data residency with EMU by default

**Identity consequence:** the [Part 1 default](/blog/github-waf-financial-services/platform-foundation/#choosing-your-deployment-model) includes EMU. The IdP owns managed human accounts; the setup user remains a GitHub-credential exception. PATs and SSH remain non-interactive access paths.

[Managed-user restrictions](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts) limit organizations to private/internal repositories and prevent participation outside the enterprise. Open-source work needs separate personal accounts and an approved separate environment. Existing personal-account enterprises use the SAML/SCIM controls below, not EMU assumptions.

**How:**

1. Use the deployment and region approved in Part 1's decision record.
2. Follow [Getting started with Enterprise Managed Users](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/getting-started-with-enterprise-managed-users): secure the setup user, configure authentication, then configure SCIM.
3. Use one partner IdP for fully supported authentication and provisioning. Standards-conformant alternatives have limited support, not a universal prohibition.

**Verify:**

- Enterprise settings show "managed users" as the enterprise type. Screenshot it once for the control file.
- Reconcile IdP assignments with the [enterprise membership export](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/exporting-membership-information-for-your-enterprise) daily and certify quarterly. Explain setup, guest, suspended, and service identities rather than expecting raw counts to match without normalization.

## Authentication protocol and conditional access

**What we do:**

- **Entra ID shops:** prefer OIDC for authentication. Use GitHub's GA enterprise IP allow list by default; selecting the IdP CAP list is a separate, reviewed network decision.
- **Okta or PingFederate:** use SAML, and pair it with GitHub's IP allow list.
- **Personal-account enterprises:** configure SAML at the **enterprise** level, not per organization.

**Why:** GitHub [recommends OIDC for Entra ID](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/getting-started-with-enterprise-managed-users). That does not mean CAP protects every credential or continuously enforces MFA and device posture.

With per-organization SAML, personal-account members [can access internal repositories without SAML](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/using-saml-for-enterprise-iam/deciding-whether-to-configure-saml-for-your-enterprise-or-your-organizations). Enterprise SAML closes that gap and prevents org overrides.

**What CAP does and does not do** ([source](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/configuring-authentication-for-enterprise-managed-users/about-support-for-your-idps-conditional-access-policy)):

| CAP behavior | Detail |
|---|---|
| Enforces | IdP **IP conditions** for documented user interactions and PAT/SSH authentication; extended web-session protection requires the preview option |
| Does not enforce | Device compliance conditions |
| MFA | Enforced only at IdP sign-in |
| Skips | Deploy keys, and GitHub Apps acting as themselves (installation tokens) |
| Preview | Extended CAP protection for web sessions is in **public preview** |
| Can block (plan for it) | PATs used in Actions, Codespaces, github.dev, and Enterprise Importer runs from dynamic IPs |

Preview web-session CAP cannot be the sole network control. Use GitHub's GA IP list with OIDC, or document the IdP list's residual coverage and named risk acceptance where lawful. Device posture needs verified endpoint/IdP controls, not GitHub CAP.

**How:**

- Follow [Configuring OIDC for Enterprise Managed Users](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/configuring-authentication-for-enterprise-managed-users/configuring-oidc-for-enterprise-managed-users). Each Entra tenant supports only one OIDC integration. A second enterprise from the same tenant must use SAML.
- Session length is an IdP decision. The default OIDC token lifetime is one hour and is tuned with an Entra token lifetime policy. For SAML, GitHub's default login period is [24 hours unless your IdP specifies otherwise](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-single-sign-on/about-authentication-with-single-sign-on).
- For personal-account enterprises, follow [Configuring SAML SSO for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/using-saml-for-enterprise-iam/configuring-saml-single-sign-on-for-your-enterprise).

**Verify:**

- Audit log: `business.enable_saml`, `business.disable_saml`, and `business.update_saml_provider_settings` should be rare and tied to change tickets. Alert on any of them.
- Keep an export of the CAP policy that targets the GitHub app in your IdP, reviewed with your other CAP policies.

## MFA: where it actually happens

**What we do:** MFA is enforced at the IdP with phishing-resistant methods. Where GitHub itself holds credentials, we also require GitHub 2FA with secure methods only.

**Why:** the current **NYDFS 500.12(a)** requires MFA for **any individual accessing any information systems** of a covered entity, subject to exemptions. For an entity qualifying under **500.19(a)**, MFA remains required for remote access to its systems, remote access to third-party applications exposing nonpublic information, and privileged accounts **except service accounts that prohibit interactive login**. Other applicable 500.19 exemptions require a documented determination.

Under **500.12(b)**, if the entity has a CISO, the CISO may approve **reasonably equivalent or more secure compensating controls in writing**, reviewed periodically and at least annually. This is not a generic waiver for difficult integrations. PCI MFA scope comes from **8.4**, not 8.3 alone, and must be reviewed separately.

The [DFS MFA FAQs](https://www.dfs.ny.gov/cybersecurity/faqs) allow SSO token sharing without a fresh challenge, but prohibit direct application/API bypass. **PATs are not universal CISO exceptions.** Retain each path's MFA chain or applicable approved compensating controls.

Inventory human PAT/SSH paths separately from non-interactive service identities, installation tokens, deploy keys, and the setup user. Test issuance, SSO authorization, network restrictions, expiry, revocation, and direct API/Git access. A short-lived token or IP restriction alone is not MFA. Block any required-MFA path that has neither adequate MFA nor lawful, approved compensating controls.

| Model | Where MFA lives | What to configure |
|---|---|---|
| **EMU / GHE.com** | IdP only. Managed users have [no password or 2FA stored on GitHub](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts). | IdP MFA policy for the GitHub app. GitHub 2FA on the setup user. |
| **GHEC personal accounts** | Both: GitHub login (2FA), then IdP (SAML) | Enterprise policy to [require 2FA and require secure methods](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-security-settings-in-your-enterprise). Secure methods are passkeys, security keys, authenticator apps, and GitHub Mobile. SMS is out. |
| **GHES with SAML or CAS** | IdP only. Org-level 2FA enforcement is [not available](https://docs.github.com/en/enterprise-server@3.22/organizations/keeping-your-organization-secure/managing-two-factor-authentication-for-your-organization/requiring-two-factor-authentication-in-your-organization). | IdP MFA policy. |
| **GHES with built-in or LDAP** | The GHES appliance | Require 2FA in every organization. |

**Heads-up:** requiring 2FA removes outside collaborators (bots included) who lack it. Announce first, then flip it.

**Verify:**

- `business.enable_two_factor_requirement` and `org.enable_two_factor_requirement` events exist; `*.disable_two_factor_requirement` events should never appear without a ticket.
- For personal-account orgs, this returns an empty list when you are healthy:

```bash
# Personal-account diagnostic. Requires organization-owner visibility.
set -euo pipefail
: "${ORG:?Set ORG}"
disabled=$(gh api --paginate "/orgs/$ORG/members?filter=2fa_disabled&per_page=100" --jq '.[].login')
insecure=$(gh api --paginate "/orgs/$ORG/members?filter=2fa_insecure&per_page=100" --jq '.[].login')
printf 'Missing 2FA:\n%s\nInsecure methods:\n%s\n' "$disabled" "$insecure"
[[ -z "$disabled" && -z "$insecure" ]]
```

- The enterprise membership export includes each user's 2FA status and how secure it is. Attach it to the quarterly review.
- For EMU, your evidence is the IdP's MFA policy plus IdP sign-in logs for the GitHub app.
- Keep an authentication-path matrix with identity type, information system/CDE scope, factors, SSO/token linkage, bypass tests, exception basis, approval owner, and annual review date. Test direct API and Git paths, not just browser sign-in.

## Provisioning, deprovisioning, and team sync

**What we do:** Provision humans through IdP assignments and repository access through linked teams, not manual grants. The setup-user exception is governed below.

**Why:** US-NYDFS-500.7, INT-PCI-7.2, and EU-DORA-RTS-ACCESS need timely removal. Without [SCIM for organizations](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-saml-single-sign-on-for-your-organization/about-scim-for-organizations), disabling a personal-account user's IdP access **does not remove org membership**; authorized tokens can outlive sessions.

**How (EMU):**

- [Configure SCIM](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/configuring-scim-provisioning-for-users). GitHub invalidates sessions and disables the account **when it receives the deprovisioning request**, not merely when an HR or IdP record changes. Measure end-to-end propagation.
- [Link teams to IdP groups](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/managing-team-memberships-with-identity-provider-groups). Adding a user to a linked team adds them to the org; removing the link removes org membership gained that way. GitHub runs a daily reconciliation job as a backstop.
- Grant repository access to those teams, never to individuals. Linked teams cannot have maintainers, which is a feature: membership changes go through the IdP.

**How (GHEC personal accounts):**

- Enable [org-level SCIM](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-saml-single-sign-on-for-your-organization/about-scim-for-organizations) (Entra ID, Okta, or OneLogin). SCIM is not available at the enterprise level without EMU.
- Use [team synchronization](https://docs.github.com/en/enterprise-cloud@latest/organizations/organizing-members-into-teams/synchronizing-a-team-with-an-identity-provider-group) for team membership. Groups over 5,000 members are not supported.
- Set the [unaffiliated users policy](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/control-offboarding) to remove users from the enterprise when they lose their last org membership. (This policy is not available for EMU, which doesn't need it.)

**How (GHES):** With SAML and no SCIM, GitHub's docs say you [must manually suspend](https://docs.github.com/en/enterprise-server@3.22/admin/managing-iam/using-saml-for-enterprise-iam/configuring-saml-single-sign-on-for-your-enterprise) removed users, or they keep working via tokens and SSH keys. Enable SCIM, or turn on [LDAP Sync](https://docs.github.com/en/enterprise-server@3.22/admin/managing-iam/using-ldap-for-enterprise-iam/using-ldap) so disabled directory accounts get suspended on the next run.

**Removal deadline:** revoke all leavers **immediately**, including PCI 8.2.5 populations. Complete planned removals at HR's effective timestamp; contain unplanned/high-risk departures immediately on notification. Daily reconciliation is a backstop, not the SLA.

The IAM owner must implement a trusted HR-to-IdP/SCIM workflow with an on-call fallback, retries, and completion verification. Record HR effective time, notification time, IdP disable, SCIM delivery, GitHub suspension/removal, credential remediation, and negative access tests. Treat any residual access after the deadline as an incident, not a permitted grace period. Review independent app grants and deploy keys that may survive the creator; revoke or reassign them based on scope and risk.

**Inactivity deadline:** use a daily authoritative inactivity feed and remove/disable inactive human accounts by **60 days** under this baseline, never later than **90 days** where PCI 8.2.6 applies. The GitHub dormant report is a 30-day **candidate list**, not a complete inactivity clock: it excludes PAT/SSH/app access and some private Git activity. Correlate IdP and credential/activity telemetry; separately govern non-interactive accounts, emergency accounts, leave arrangements, and any applicable standard exceptions.

IAM must test automated disablement through supported provisioning before production. A downloaded report is not enforcement. Unknown/stale telemetry opens an investigation, never resets inactivity.

**Verify:**

- **Joiner/leaver testing:** reconcile **all** HR leavers with completed removal records daily. Internal audit approves the quarterly sample method, size, and strata, including privileged, contractor, high-risk, and failed-sync cases. Show effective-time comparisons and denied browser/PAT/SSH access, not just an IdP checkbox.
- **SCIM health:** alert on `external_identity.scim_api_failure` and `external_group.scim_api_failure`. A failing sync is a silent offboarding failure.
- **Dormant accounts:** reconcile the [candidate report](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/managing-dormant-users) with the daily inactivity feed. Retain disablement decisions and completion events. Test just before, exactly at, and just after the 60-day internal boundary and the applicable 90-day maximum.
- **Failure drills:** exercise a lost HR event, failed SCIM call, stale feed, and unavailable IdP. Prove escalation and supported emergency containment work without claiming a queued request is completed revocation.

## Least privilege: base permissions and roles

**What we do:**

- **Base permission:** `No permission` (or `Read` if you run a deliberate innersource program). Never `Write` or `Admin`.
- **Org owners:** at least two, and as few as possible beyond that.
- **Everyone else:** predefined or custom roles scoped to the job.
- **Security team:** the security manager role, not owner.

**Why:** INT-PCI-7.2 and US-NYDFS-500.7 require documented job-based access. WAF recommends custom roles over owner access, never Admin as a repository default.

**Where each tool fits:**

| Layer | Tool | FSI default |
|---|---|---|
| Enterprise | Enterprise owner | 2-3 named humans plus break-glass (next section) |
| Enterprise | [Enterprise custom roles](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-roles-in-your-enterprise/create-custom-roles) (**public preview**) | Non-production pilot where terms permit. GA fallback: narrowly controlled owner execution and exported evidence for independent reviewers. |
| Enterprise | [Enterprise security manager](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-roles-in-your-enterprise/abilities-of-roles) (**public preview**) | GA fallback: organization security manager assigned in every in-scope organization, reconciled centrally |
| Organization | [Security manager](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-peoples-access-to-your-organization-with-roles/managing-security-managers-in-your-organization) (GA) | Assigned to the AppSec team. Read on all repos, write on security alerts. |
| Organization | [Custom organization roles](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-peoples-access-to-your-organization-with-roles/permissions-of-custom-organization-roles) | e.g. an auditor role with "View organization audit log" |
| Repository | [Custom repository roles](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/about-custom-repository-roles) | Up to 20; inherit from a base role and add permissions |
| Repository | [Base permission](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/setting-base-permissions-for-an-organization) | None or Read |

**Two facts worth knowing:**

- Internal repositories remain enterprise-readable with base permission None. Sensitive repositories must be private.
- Enterprise owners [lack org content access by default](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-roles-in-your-enterprise/abilities-of-roles), but can join any org with an audit event.

**How:** prefer **enforced enterprise None** with explicit team grants. If organizations choose their own base permission for an approved innersource design, permit only None/Read in the institution standard and reconcile daily. GitHub's enforced enterprise value is not a configurable ceiling that lets every organization choose a lower value ([repository management policies](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise)). Restrict outside collaborator invitations to approved owners.

**Verify:**

```bash
# Read-only diagnostics, not the complete access-review population.
set -euo pipefail
: "${ORG:?Set ORG}"
gh api --paginate "/orgs/$ORG/members?role=admin&per_page=100" --jq '.[].login'
gh api "/orgs/$ORG/organization-roles" --jq '.roles[] | {id, name, permissions}'
gh api --paginate "/orgs/$ORG/outside_collaborators?per_page=100" --jq '.[].login'
```

Export paginated **user and team assignments** for every [organization role](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/organization-roles). Add direct grants, role definitions, inheritance, and enterprise roles from the complete review population below. Validate empty results against permissions and inventory.

Audit events to alert on: `business.add_admin`, `org.update_member` (role changes), `organization_role.assign`, `enterprise_role.assign`, and `org.update_default_repository_permission`.

## Privileged and break-glass accounts

**What we do:** Day-to-day administration uses named, IdP-provisioned accounts with the narrowest role that works. One break-glass path exists, sealed in your privileged access management (PAM) vault and alarmed.

**Why:** US-NYDFS-500.7 limits privileged access and its use. Apply the MFA scope and exemptions above to emergency access too. You still need a tested path when the IdP is down, without turning the vault into a self-service admin vending machine.

**How:**

- **EMU:** the [setup user](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/setup-user) (`<shortcode>_admin`) is your break-glass account. GitHub says it is only for configuring auth and provisioning, SCIM, and regaining access during an IdP problem. Enable GitHub 2FA on it and store credentials in your PAM tool.
- **All GHEC models:** download the [SSO recovery codes](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/managing-recovery-codes-for-your-enterprise/downloading-your-enterprise-accounts-single-sign-on-recovery-codes) and seal them alongside it.
- **Org ownership:** keep at least two owners per org. GitHub's [role guidance](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-peoples-access-to-your-organization-with-roles/roles-in-an-organization) says "no less than two."
- **GHES:** keep one built-in site admin for when SAML or LDAP breaks, with 2FA, in the vault.

**Dual-control checkout:** require a linked incident/change record **before retrieval**, approval by a second authorized person independent of the requester, and PAM enforcement of that approval. Record who requested, approved, retrieved, and used the credential, with start/end times and authorized scope. No self-approval. During an outage, use a preauthorized emergency record and independent approver, then reconcile to ITSM when restored.

Seal password, 2FA material, and recovery codes with access designed for dual control. Alert at checkout and on use. Afterward, rotate/reset affected credentials, replace used recovery material, revoke temporary access, and obtain independent review. Test that one person cannot retrieve the complete emergency credential set.

**The setup user's SCIM token:** GitHub requires a classic PAT with **no expiration** and at least `scim:enterprise` scope ([setup procedure](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/getting-started-with-enterprise-managed-users)). Record a **named exception** for this credential, owned by the IAM lead, with quarterly reapproval and **rotation at most every 90 days**, plus immediate rotation on suspected exposure or custodian change.

Keep only the required scope and store the value in the protected provisioning configuration and approved vault, never a developer workflow. Rotate by issuing a replacement, updating provisioning, testing a joiner/leaver, then revoking the old token. Alert on unexpected provisioning source/volume, setup-user use outside approved configuration, and any token use outside SCIM. Where telemetry cannot attribute every use, document that detection gap and additional monitoring rather than claiming perfect coverage.

**Verify:** alert on setup-user interactive/configuration activity and distinguish expected, monitored SCIM calls from emergency account use. Correlate credential hashes where emitted with IdP provisioning logs. Test dual approval, retrieval, rotation, and recovery annually; archive checkout and independent post-use review.

## Personal access tokens

**What we do:**

- Restrict **classic PATs** from accessing enterprise organizations.
- Require **approval** for fine-grained PATs.
- Set a **maximum lifetime of 90 days or less** for ordinary PATs, including administrator PATs.
- Prefer **GitHub Apps** for anything long-lived.

**Why:** PATs are bearer credentials. Their scope, ownership, issuance, and revocation contribute to access control; **PAT lifetime is not MFA** and does not by itself satisfy PCI authentication requirements. Prefer fine-grained PATs with independent approval and [GitHub's governance guidance](https://learn.github.com/well-architected/library/governance/recommendations/governance-policies-best-practices/).

**How:** All three are enterprise policies on one [PAT policy page](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-personal-access-tokens-in-your-enterprise). Facts to plan around:

- The default maximum lifetime for fine-grained tokens is 366 days. Classic tokens have no expiration requirement until you set one.
- Lifetime policy blocks non-compliant tokens; it does not revoke them. Users find out when API calls fail.
- **Do not routinely enable "Exempt administrators."** GitHub recommends it for SCIM continuity, but the checkbox exempts administrators as a class, **not a single named token**. Test provisioning with the proposed lifetime policy before rollout. If the deployment requires that broad switch, escalate a separately approved technical exception: inventory every affected admin credential, enforce the ordinary lifetime independently, reconcile daily, and record the broader enforcement gap. The named SCIM exception alone does not make the UI exemption token-scoped.
- Only fine-grained tokens go through approval. That is why classic tokens must be restricted, not just discouraged.
- On EMU, enterprise PAT policies also cover user namespaces because the enterprise owns the accounts.

The same controls exist on [GHES 3.22](https://docs.github.com/en/enterprise-server@3.22/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-personal-access-tokens-in-your-enterprise).

**Yes, but my audit log collector uses a classic PAT.** Fair point. The [enterprise audit log REST API](https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/audit-log) currently requires a classic PAT or OAuth token. Prefer audit log streaming (Part 1). If you must poll, document the exception, scope the token to `read:audit_log`, and own it with a service identity.

**Verify:**

- `personal_access_token.expiration_limit_set`, `personal_access_token.access_restriction_enabled`, and `personal_access_token.request_created` / `access_granted` / `request_denied` events give you the full approval trail.
- Org owners can [review and revoke fine-grained tokens](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/reviewing-and-revoking-personal-access-tokens-in-your-organization) in the UI. The [REST endpoints](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/personal-access-tokens) (`GET /orgs/{org}/personal-access-tokens`) can only be called by a GitHub App. That's a nice nudge toward building your review tooling as an App.
- Reconcile privileged tokens and named exceptions daily. Test that an over-limit ordinary administrator token is denied, provisioning continues with the approved SCIM credential, and revoked replacement tokens cannot work. A policy that blocks use does not delete the credential.

## GitHub Apps, OAuth apps, and deploy keys

**What we do:**

- **GitHub Apps** are the default for integrations and automation, installed at the enterprise level when broadly needed.
- **OAuth apps** require owner approval and an exception record.
- **Deploy keys** are disabled at the enterprise level, with documented exceptions.

**Why:** EU-DORA-RTS-ACCESS includes machine identities. [GitHub Apps](https://docs.github.com/en/enterprise-cloud@latest/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps) offer fine-grained permissions, repository scope, and short-lived tokens; WAF prefers them over OAuth.

Deploy keys are a blind spot. Per [GitHub's docs](https://docs.github.com/en/enterprise-cloud@latest/authentication/connecting-to-github-with-ssh/managing-deploy-keys), they never expire, survive the creator's removal, and with write access act like a repo admin. They also bypass IdP CAP IP conditions.

**How:**

- [OAuth app access restrictions](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions) are on by default for new orgs. Keep them on. Note that privileged OAuth apps bypass this.
- [Restrict repository admins from installing GitHub Apps](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/limiting-oauth-app-and-github-app-access-requests-and-installations) so installs route through owner approval.
- Disable deploy keys in [enterprise repository policies](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise). Warning: this disables **existing** keys immediately. Inventory first.

```bash
# Read-only deploy-key diagnostic. Requires full repository/key inventory access.
set -euo pipefail
: "${ORG:?Set ORG}"
repos=$(gh api --paginate "/orgs/$ORG/repos?type=all&per_page=100" --jq '.[].full_name')
[[ -n "$repos" ]] || { printf 'UNKNOWN: empty repository inventory\n'; exit 2; }
while IFS= read -r repo; do
  [[ -n "$repo" ]] || continue
  gh api --paginate "/repos/$repo/keys?per_page=100" \
    --jq ".[] | [\"$repo\", .id, .title, .read_only, .created_at] | @csv"
done <<< "$repos"
```

Reconcile the observed repository count with the approved population. A hidden repository, denied key endpoint, or failed page makes the inventory incomplete. Installed apps and deploy keys require separate inventories; the enterprise credential CSV is not a complete list of every short-lived installation token or deploy key.

**Verify:** `integration_installation.create` / `destroy`, `org.oauth_app_access_approved`, and `public_key.create` (fires for both user SSH keys and deploy keys). Review the installed app list and permissions quarterly.

## SSH certificate authorities

**What we do:** Issue short-lived SSH certificates from a corporate CA and require certificates for **SSH Git access**. Govern HTTPS/PAT access separately; an SSH certificate requirement does not disable HTTPS.

**Why:** [Daily-expiring certificates](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-git-access-to-your-organizations-repositories/about-ssh-certificate-authorities) limit stolen-key exposure and centralize command-line access. This contributes to INT-PCI-8.3 and US-NYDFS-500.7.

**How:** the CA verifies MFA and current eligibility, signs a short-lived certificate bound to the GitHub login, and logs issuance. Protect its key in signing infrastructure, not `./ca-key` on a laptop. Local signing is not a production access control.

- Add the CA at the [enterprise level](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-security-settings-in-your-enterprise), then require SSH certificates.
- CAs added before March 27, 2024 can issue non-expiring certs. **Upgrade** them.
- Certificates work under SAML SSO without per-credential authorization.
- GHES 3.22 supports SSH CAs too ([enterprise security policies](https://docs.github.com/en/enterprise-server@3.22/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-security-settings-in-your-enterprise)).

**Verify:** `ssh_certificate_authority.create` / `destroy` and `ssh_certificate_requirement.enable` / `disable` events. Your CA's issuance log is the other half of the evidence.

## Network and session controls

Apply Part 1's [network boundary policy](/blog/github-waf-financial-services/platform-foundation/#network-boundaries-ip-allow-lists). For IAM, **coverage follows the credential path**, not the authentication protocol. Entra OIDC can use GitHub's GA IP list; selecting the IdP list deactivates it. Neither network restriction substitutes for MFA.

**How:**

- GitHub's allow list covers PATs, OAuth tokens, SSH keys (including deploy keys), and app tokens, including `GITHUB_TOKEN`.
- With EMU, turn on **user-level enforcement** so the list also covers user-owned repositories and forks.
- Add your integrations' ranges, or allow installed GitHub Apps. WAF essentials warns that missing ranges make integrations "silently fail."
- Test CI credentials from approved fixed egress using [Part 6's runner design](/blog/github-waf-financial-services/actions-hardening/). Do not widen the list to standard hosted-runner ranges.
- CAP does not cover deploy keys or installation tokens acting as an app. GitHub's list also has documented exceptions, including some user-account app installations and EMU provisioning. Inventory and mitigate these paths explicitly.
- On GHES, the instance sits inside your network, so this is a firewall and load balancer job.

**Verify:** diff enterprise and organization-added entries against the approved network inventory quarterly. Test allowed and denied browser, PAT, SSH, deploy-key, and installation-token paths, including CI's `GITHUB_TOKEN`. Retain results and remediate coverage gaps.

## Credential revocation and incident response

**What we do:** Rehearse three moves: revoke one user's credentials, revoke a credential type, and lock down SSO for everyone.

**Why:** US-NYDFS-500.14 expects you to detect and respond to unauthorized access. When a laptop is stolen or a token leaks, minutes matter.

**How:**

| Situation | Action | Source |
|---|---|---|
| Assess exposure | Export the enterprise **credential inventory** (CSV of PATs, OAuth tokens, App tokens, SSH keys) | [Reviewing credentials](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/respond-to-incidents/reviewing-credentials-in-your-enterprise) |
| One compromised user | Revoke SSO authorizations; on EMU, also delete their tokens and SSH keys | [Revoking authorizations](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/respond-to-incidents/revoke-authorizations-or-tokens) |
| One credential type | Revoke a type (e.g. all classic PATs) enterprise-wide | Same page |
| Major incident | Lock down SSO for everyone except enterprise owners | [Locking down SSO](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/respond-to-incidents/lock-down-sso) |
| Token found in the wild | Submit it to the unauthenticated revocation API | [Credential revocation API](https://docs.github.com/en/enterprise-cloud@latest/rest/credentials/revoke) |

Use the supported UI or build an authorized runbook from the current [credential authorization REST reference](https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/credential-authorizations). No apply-verbatim destructive command is provided here. The implementation must verify enterprise/model, target identity, credential type, approval, endpoint permissions, and completion.

Revocation endpoints may return **202 Accepted** for queued work. That is not completed containment. Check subsequent inventory and deny tests, and use IdP/SCIM suspension immediately where appropriate. Destroying credentials is available for EMU; personal-account SSO revocation does not delete the underlying token. Installation tokens and deploy keys need separate remediation at their management layer.

**Verify:** The audit log records `hashed_token` for token-authenticated events. Use the credential inventory export to [trace everything a compromised token did](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/identifying-audit-log-events-performed-by-an-access-token). Run a tabletop at least annually and keep the notes.

## Access reviews and the evidence pack

**What we do:** A quarterly access review, owned by the business, with a repeatable evidence pack.

**Why:** US-NYDFS-500.7 and INT-PCI-7.2 require periodic review; the [WAF checklist](https://learn.github.com/well-architected/library/governance/checklist/) also calls for discrepancy closure. Part 1's [evidence archive](/blog/github-waf-financial-services/platform-foundation/#evidence-retention-and-integrity) is a prerequisite because GitHub's audit log is not long-term retention.

**The quarterly evidence pack:**

1. **Membership export** (UI) with 2FA status, roles, and SAML `NameID`.
2. **Credential inventory export** (UI) showing every active token and key.
3. **Complete access population**, not just privileged names: enterprise/org roles, custom-role definitions and user/team assignments, base permissions, internal-repo exposure, team/nested-team membership, every repository's team grants and **direct collaborator grants**, and **repository custom roles** with effective permissions. Include outside/guest collaborators and pending grants. Use paginated [collaborator](https://docs.github.com/en/enterprise-cloud@latest/rest/collaborators/collaborators), [team](https://docs.github.com/en/enterprise-cloud@latest/rest/teams/teams), and [custom repository role APIs](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/custom-roles), supplemented by supported exports.
4. **Outside or guest collaborators** with their sponsor and end date.
5. **Installed GitHub Apps and approved OAuth apps** with permissions.
6. **Dormant users report.**
7. **Audit log extract** of privileged changes for the review period:

   ```bash
   # Read-only diagnostic. Set the actual review period, not a hard-coded quarter.
   set -euo pipefail
   : "${ENTERPRISE:?Set ENTERPRISE}" "${START_DATE:?Set YYYY-MM-DD}" "${END_DATE:?Set YYYY-MM-DD}"
   gh api -X GET --paginate "/enterprises/$ENTERPRISE/audit-log" \
     -f phrase="action:business.add_admin created:$START_DATE..$END_DATE" -f per_page=100
   ```

   Repeat for `org.update_member`, `organization_role.assign`, `enterprise_role.assign`, and `personal_access_token.access_granted`.

8. **Independent reviewer sign-off** with decisions (keep, remove, change) and closure tickets. Nobody certifies their own access; another authorized business/control owner reviews the reviewer's entitlements.

**Prove completeness before review:** discover all enterprise organizations, reconcile every repository ID with the approved inventory, and validate collector permissions. Record collection time, filters, page counts, source counts, failed endpoints, and duplicate handling. Match direct and inherited grants to current HR/IdP identities and app sponsors. Missing or inaccessible populations block sign-off. Internal audit agrees sampling only **after** population completeness, using documented risk-based selection instead of a fixed ten-person sample.

**Verify the review:** assign removal owners/deadlines, track overdue decisions, and prove removal with events and denied-access tests. Archive source exports, collection manifests, approvals, and closure records under [Part 1's retention and integrity standard](/blog/github-waf-financial-services/platform-foundation/#evidence-retention-and-integrity). Controlled, completeness-tested UI exports are valid evidence, not automatically generated evidence.

## Control matrix

**Every row contributes to the named requirements only.** Adequacy and applicability require second-line approval.

| Control | Contributes to requirement IDs | GitHub feature | Evidence | Cadence |
|---|---|---|---|---|
| IdP-owned accounts | EU-DORA-RTS-ACCESS, US-NYDFS-500.7, US-GLBA-314 | Enterprise Managed Users | Enterprise type; IdP vs. membership reconciliation | Once; daily reconciliation; quarterly certification |
| Central auth and conditional access | US-NYDFS-500.12, US-NYDFS-500.14, INT-SWIFT-CSCF-OVERVIEW | OIDC + CAP, or enterprise SAML + IP allow list | SAML/OIDC and `ip_allow_list.*` audit events; CAP export | Continuous alerts; quarterly |
| Human MFA and credential-path coverage | US-NYDFS-500.12, INT-PCI-8.3, INT-PCI-8.4 | IdP MFA; GitHub 2FA; governed credential paths | MFA-chain and bypass tests; applicable exemptions/compensating approvals; sign-in evidence | Quarterly; compensating controls at least annually |
| Immediate leaver removal and inactivity control | US-NYDFS-500.7, INT-PCI-7.2, INT-PCI-8.2.5, INT-PCI-8.2.6, EU-DORA-RTS-ACCESS | Trusted HR workflow, SCIM, IdP suspension and reconciliation | Complete leaver timestamps/deny tests; daily inactivity and disablement evidence | Immediate removal; daily reconciliation; quarterly independent sample |
| Least privilege roles | INT-PCI-7.2, US-NYDFS-500.7, US-OCC-30-AppB | Base permissions, custom and security manager roles | Role holder lists; role/permission audit events | Quarterly |
| Break-glass | US-NYDFS-500.7, US-NYDFS-500.12 | PAM dual-control checkout; setup user; recovery codes | Prior incident/change, independent approval, checkout/use/rotation and denied single-person retrieval | Per use; annual drill |
| Token governance | INT-PCI-8.3, EU-DORA-RTS-ACCESS | Classic PAT restriction, fine-grained approval, max lifetime | `personal_access_token.*` events; credential inventory | Continuous; quarterly |
| Integration governance | EU-DORA-RTS-ACCESS, US-FFIEC-INFOSEC | GitHub Apps, OAuth restrictions, deploy key policy | `integration_installation.*`, `org.oauth_app_access_*`, `public_key.create` | Quarterly |
| Short-lived SSH Git credentials | US-NYDFS-500.7, EU-DORA-RTS-ACCESS | Protected SSH CA; HTTPS governed separately | Issuance/MFA/eligibility logs, expiry tests, CA custody evidence | Quarterly |
| Incident revocation | US-NYDFS-500.14, CA-OSFI-B13 | Credential inventory, revocation, SSO lockdown | Runbook; tabletop record; `hashed_token` traces | Annual test |
| Periodic access review | US-NYDFS-500.7, INT-PCI-7.2, AR-BCRA-A7724, PE-SBS-504 | Complete exports, paginated REST, audit log and archive | Reconciled direct/inherited/custom-role population, independent sign-off, approved sampling and closure | Quarterly |

## Summary and key takeaways

Every later control in this series assumes you know who is acting and that their access is current. Get identity right and the rest gets easier to evidence.

**Your checklist:**

- [ ] Implement the approved account model; personal-account enterprises enforce enterprise SAML.
- [ ] Prefer Entra OIDC authentication where appropriate; default to the GA GitHub IP list and test every credential/CI path.
- [ ] Enforce phishing-resistant MFA at the IdP; on personal accounts, also require GitHub 2FA with secure methods.
- [ ] Implement immediate leaver removal, daily completion checks, and automated inactivity disablement with tested failure paths.
- [ ] Set base permission to None or Read, keep org owners at two or three, and use custom and security manager roles.
- [ ] Require independently approved PAM checkout before emergency retrieval. Rotate the named SCIM exception within 90 days; do not silently exempt all admins.
- [ ] Restrict classic PATs, require fine-grained PAT approval, and set a maximum lifetime.
- [ ] Default to GitHub Apps; keep OAuth restrictions on; disable deploy keys after inventory.
- [ ] Stand up an SSH CA with short-lived certificates and require it.
- [ ] Script and rehearse credential revocation and SSO lockdown.
- [ ] Review the complete direct/inherited/custom-role population independently, reconcile counts, and archive evidence and timely closure.

**Previous:** [Part 1: Platform Foundation and Data Boundaries](/blog/github-waf-financial-services/platform-foundation/)

**Next:** [Part 3: Source Code Management and Change Control](/blog/github-waf-financial-services/change-control/), where we put these identities to work in rulesets, reviews, and separation of duties.

## References

Regulatory sources are linked in [The requirements](#the-requirements); procedures are linked beside each control. Further reading:

- [Essentials of governance and administration with GitHub Enterprise](https://learn.github.com/well-architected/library/governance/recommendations/governance-administration-essentials/)
- [Securing the developer workspace](https://learn.github.com/well-architected/library/application-security/recommendations/securing-developer-workspace/)
- [Restricting network traffic to your enterprise with an IP allow list](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/hardening-security-for-your-enterprise/restricting-network-traffic-to-your-enterprise-with-an-ip-allow-list)
- [About the audit log for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise)
- [Audit log events for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise)
- [Larger-runner capabilities](https://docs.github.com/en/enterprise-cloud@latest/actions/concepts/runners/larger-runners) (implementation owned by Part 6)
- [GitHub Pre-release License Terms](https://docs.github.com/en/site-policy/github-terms/github-pre-release-license-terms)
