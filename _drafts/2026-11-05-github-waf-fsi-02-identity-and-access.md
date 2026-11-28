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

> **A friendly note:** This information is meant to be guidance to help navigate a complex topic. Please validate these patterns with your compliance and/or regulatory reporting team(s).

## Leadership brief

> - **The risk:** Source code, pipelines, and deployment credentials live in GitHub. A departed engineer's still-valid token or an over-privileged service account is a direct path to production and customer data.
> - **Our position:** Use Enterprise Managed Users (EMU) so your identity provider owns every account. Enforce MFA and conditional access at the IdP, provision and deprovision with SCIM, and grant access through IdP-synced teams with no standing admin.
> - **Machine access:** GitHub Apps are the default for automation. Fine-grained tokens are the governed exception, with approval and a maximum lifetime. Classic tokens are restricted.
> - **The evidence:** Audit log events for every role, token, and membership change; an enterprise credential inventory export; membership reports; and a quarterly access review with documented sign-off.

Picture the Monday after a big reorg. HR has terminated 40 contractors, the IdP shows them disabled, and everyone moves on. Three weeks later, a scheduled job in a forgotten repository is still pulling code with a personal access token owned by one of those contractors. Nobody did anything wrong on purpose. The token simply never got the memo.

Disabling the human is easy. Finding every credential, role, and app grant they left behind is the hard part, and examiners know it. This part lays out an opinionated identity and access baseline for GitHub, plus the evidence trail that proves it works.

## The requirements

These are the requirements this part maps to. IDs come from the series [compliance crosswalk](/blog/github-waf-financial-services/). Treat them as guideposts: your organization decides how its implementation meets or exceeds each one.

| ID | Regulation and citation | What it asks for (paraphrase) |
|---|---|---|
| US-FFIEC-INFOSEC | [FFIEC IT Examination Handbook, Information Security booklet](https://ithandbook.ffiec.gov/it-booklets/information-security) | Examiner framework for an information security program, including controls that protect confidentiality, integrity, and availability. |
| US-GLBA-314 | [GLBA Safeguards Rule, 16 CFR Part 314](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-314) | A written, risk-based security program that includes access controls. |
| US-OCC-30-AppB | [Interagency Guidelines, 12 CFR Part 30 Appendix B](https://www.ecfr.gov/current/title-12/chapter-I/part-30/appendix-Appendix%20B%20to%20Part%2030) | A comprehensive written security program for OCC-regulated banks, including access controls. |
| US-NYDFS-500.7 | [23 NYCRR §500.7, Access Privileges and Management](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Least-privilege access, periodic review, and removal of unnecessary privileged accounts. |
| US-NYDFS-500.12 | [23 NYCRR §500.12, Multi-Factor Authentication](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | MFA for remote access and for all privileged accounts. |
| US-NYDFS-500.14 | [23 NYCRR §500.14, Training and Monitoring](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Monitoring for unauthorized access or tampering. |
| CA-OSFI-B13 | [OSFI Guideline B-13, Technology and Cyber Risk Management](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management) | Risk-based management of technology and cyber risk, including cyber security controls. |
| PE-SBS-504 | [Resolución SBS N° 504-2021 (Peru)](https://intranet2.sbs.gob.pe/dv_int_cn/2046/v2.0/Adjuntos/504-2021.R.pdf) | The information security and cybersecurity management framework your access controls roll up to. |
| AR-BCRA-A7724 | [BCRA Comunicación "A" 7724 (Argentina)](https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A7724.pdf) | Minimum requirements for governing technology and information security risk. |
| EU-DORA-RTS-ACCESS | [Commission Delegated Regulation (EU) 2024/1774, Arts. 20-21](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | Identity management (unique identity per person or system) and access control policies built on it. |
| INT-PCI-7.2 | [PCI DSS v4.0.1, Req. 7.2](https://www.pcisecuritystandards.org/document_library/) | Need-to-know access by job function, a documented access model, and periodic review. |
| INT-PCI-8.3 | [PCI DSS v4.0.1, Req. 8.3/8.4](https://www.pcisecuritystandards.org/document_library/) | Strong authentication and MFA for non-console access into the cardholder data environment. |
| INT-SWIFT-CSCF-OVERVIEW | [SWIFT Customer Security Controls Framework (overview)](https://www.swift.com/myswift/customer-security-programme) | "Know and limit access" is one of three core objectives. |
| INT-NIST-CSF | [NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework) | Reference taxonomy; identity and access controls live under the Protect function. |

**What auditors will actually test:** that you wrote an access policy, that GitHub enforces it, and that you review it on the cadence you promised. Each section below ends with that evidence.

## Deployment model differences

Identity is where the four deployment patterns diverge the most. [Part 1](/blog/github-waf-financial-services/platform-foundation/) covers how to pick one. Here is what changes for IAM.

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

## Account model: EMU by default

**What we do:** Choose an enterprise with managed users. Developers who contribute to open source keep a separate personal account for that work, outside the enterprise.

**Why:** EMU makes your IdP the single source of truth for who exists in GitHub. That is the cleanest way to satisfy unique identity (EU-DORA-RTS-ACCESS), least privilege with removal (US-NYDFS-500.7), and access controls in your written program (US-GLBA-314, US-OCC-30-AppB). The [WAF governance essentials](https://learn.github.com/well-architected/library/governance/recommendations/governance-administration-essentials/) guide frames EMU as the fit when you need "full control of your developers' accounts and a firm separation between the open source community and your company's code." That describes most banks.

What you get for free with managed users ([abilities and restrictions](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts)):

- Accounts authenticate **only** through your IdP. No GitHub-stored password exists to phish.
- Managed users cannot push, open issues, or comment on repositories outside the enterprise. Accidental public pushes stop being a thing.
- Organizations can only hold private and internal repositories.
- Managed users cannot be invited to other enterprises or outside organizations.

**The trade-off:** Engineers who maintain open source need a second, personal account for it, as [Choosing an enterprise type](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/enterprise-fundamentals/choose-an-enterprise-type) notes. For most FSIs that is a small price for a hard boundary.

Already running personal accounts with SAML? That works, and the rest of this post still applies. Switching later means a migration (the WAF calls it an anti-pattern), so if you are pre-launch, decide now.

**How:**

1. Request an EMU enterprise (or GHE.com if residency matters; see Part 1).
2. Follow [Getting started with Enterprise Managed Users](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/getting-started-with-enterprise-managed-users): secure the setup user, configure authentication, then configure SCIM.
3. Use a partner IdP (Entra ID, Okta, or PingFederate) for both authentication and provisioning. GitHub explicitly does not support mixing Okta and Entra ID across SSO and SCIM.

**Verify:**

- Enterprise settings show "managed users" as the enterprise type. Screenshot it once for the control file.
- Run a quarterly reconciliation: IdP app assignments vs. the [enterprise membership export](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/exporting-membership-information-for-your-enterprise). The counts and names should match.

## Authentication protocol and conditional access

**What we do:**

- **Entra ID shops:** use OIDC so GitHub honors your Conditional Access Policy (CAP) IP conditions.
- **Okta or PingFederate:** use SAML, and pair it with GitHub's IP allow list.
- **Personal-account enterprises:** configure SAML at the **enterprise** level, not per organization.

**Why:** GitHub's [Getting started with EMU](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/getting-started-with-enterprise-managed-users) page is direct: "We recommend OIDC, which includes support for Conditional Access Policies (CAP)." One policy then governs GitHub alongside every other corporate app. That gives you consistent remote-access control (US-NYDFS-500.12) and one place to monitor (US-NYDFS-500.14).

For personal-account enterprises, note that with per-organization SAML, members [do not need SAML to access internal repositories](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/using-saml-for-enterprise-iam/deciding-whether-to-configure-saml-for-your-enterprise-or-your-organizations). Enterprise-level SAML closes that gap and organizations cannot override it.

**What CAP does and does not do** ([source](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/configuring-authentication-for-enterprise-managed-users/about-support-for-your-idps-conditional-access-policy)):

| CAP behavior | Detail |
|---|---|
| Enforces | IdP **IP conditions** on web sessions, and on every authentication with a user's PAT or SSH key |
| Does not enforce | Device compliance conditions |
| MFA | Enforced only at IdP sign-in |
| Skips | Deploy keys, and GitHub Apps acting as themselves (installation tokens) |
| Preview | Extended CAP protection for web sessions is in **public preview** |
| Can block (plan for it) | PATs used in Actions, Codespaces, github.dev, and Enterprise Importer runs from dynamic IPs |

**How:**

- Follow [Configuring OIDC for Enterprise Managed Users](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/configuring-authentication-for-enterprise-managed-users/configuring-oidc-for-enterprise-managed-users). Each Entra tenant supports only one OIDC integration. A second enterprise from the same tenant must use SAML.
- Session length is an IdP decision. The default OIDC token lifetime is one hour and is tuned with an Entra token lifetime policy. For SAML, GitHub's default login period is [24 hours unless your IdP specifies otherwise](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-single-sign-on/about-authentication-with-single-sign-on).
- For personal-account enterprises, follow [Configuring SAML SSO for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/using-saml-for-enterprise-iam/configuring-saml-single-sign-on-for-your-enterprise).

**Verify:**

- Audit log: `business.enable_saml`, `business.disable_saml`, and `business.update_saml_provider_settings` should be rare and tied to change tickets. Alert on any of them.
- Keep an export of the CAP policy that targets the GitHub app in your IdP, reviewed with your other CAP policies.

## MFA: where it actually happens

**What we do:** MFA is enforced at the IdP with phishing-resistant methods. Where GitHub itself holds credentials, we also require GitHub 2FA with secure methods only.

**Why:** US-NYDFS-500.12 and INT-PCI-8.3 require MFA for remote and privileged access. The [WAF developer workspace guidance](https://learn.github.com/well-architected/library/application-security/recommendations/securing-developer-workspace/) says to require MFA for all developers, enforced in GitHub or through the IdP. The trick is knowing which one applies to your model.

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
# Members with no 2FA, or with insecure 2FA methods (e.g. SMS)
gh api --paginate "/orgs/$ORG/members?filter=2fa_disabled" --jq '.[].login'
gh api --paginate "/orgs/$ORG/members?filter=2fa_insecure" --jq '.[].login'
```

- The enterprise membership export includes each user's 2FA status and how secure it is. Attach it to the quarterly review.
- For EMU, your evidence is the IdP's MFA policy plus IdP sign-in logs for the GitHub app.

## Provisioning, deprovisioning, and team sync

**What we do:** Every human enters and leaves GitHub through IdP group assignment. Repository access flows from teams that are linked to IdP groups. Nobody gets added by hand.

**Why:** Timely removal is at the heart of US-NYDFS-500.7, INT-PCI-7.2, and EU-DORA-RTS-ACCESS. The WAF lists manual provisioning and ignored offboarding as anti-patterns. Its governance checklist says to "automate user provisioning and de-provisioning."

The nuance that bites personal-account enterprises: without SCIM, removing someone from the IdP does **not** remove them from the org. GitHub's [SCIM for organizations](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-saml-single-sign-on-for-your-organization/about-scim-for-organizations) page warns: "Authorized tokens grant access to the organization even after their sessions expire." That is the opening scenario of this post.

**How (EMU):**

- [Configure SCIM](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/configuring-scim-provisioning-for-users). When you unassign or deactivate a user in the IdP, GitHub invalidates their sessions and disables the account.
- [Link teams to IdP groups](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/managing-team-memberships-with-identity-provider-groups). Adding a user to a linked team adds them to the org; removing the link removes org membership gained that way. GitHub runs a daily reconciliation job as a backstop.
- Grant repository access to those teams, never to individuals. Linked teams cannot have maintainers, which is a feature: membership changes go through the IdP.

**How (GHEC personal accounts):**

- Enable [org-level SCIM](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-saml-single-sign-on-for-your-organization/about-scim-for-organizations) (Entra ID, Okta, or OneLogin). SCIM is not available at the enterprise level without EMU.
- Use [team synchronization](https://docs.github.com/en/enterprise-cloud@latest/organizations/organizing-members-into-teams/synchronizing-a-team-with-an-identity-provider-group) for team membership. Groups over 5,000 members are not supported.
- Set the [unaffiliated users policy](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/control-offboarding) to remove users from the enterprise when they lose their last org membership. (This policy is not available for EMU, which doesn't need it.)

**How (GHES):** With SAML and no SCIM, GitHub's docs say you [must manually suspend](https://docs.github.com/en/enterprise-server@3.22/admin/managing-iam/using-saml-for-enterprise-iam/configuring-saml-single-sign-on-for-your-enterprise) removed users, or they keep working via tokens and SSH keys. Enable SCIM, or turn on [LDAP Sync](https://docs.github.com/en/enterprise-server@3.22/admin/managing-iam/using-ldap-for-enterprise-iam/using-ldap) so disabled directory accounts get suspended on the next run.

**Verify:**

- **Joiner/leaver sampling:** pick 10 leavers from HR each quarter. Show `external_identity.deprovision` (EMU) or `org.remove_member` events with timestamps, and compare to the HR termination date against your SLA.
- **SCIM health:** alert on `external_identity.scim_api_failure` and `external_group.scim_api_failure`. A failing sync is a silent offboarding failure.
- **Dormant accounts:** download the [dormant users report](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/managing-dormant-users) monthly. Docs define dormant as no activity for 30 days.

## Least privilege: base permissions and roles

**What we do:**

- **Base permission:** `No permission` (or `Read` if you run a deliberate innersource program). Never `Write` or `Admin`.
- **Org owners:** at least two, and as few as possible beyond that.
- **Everyone else:** predefined or custom roles scoped to the job.
- **Security team:** the security manager role, not owner.

**Why:** INT-PCI-7.2 and US-NYDFS-500.7 both require access by job function with documented roles. The WAF essentials guide says "do not use Admin as a default repository permission." It also recommends custom roles "rather than granting full owner access at either level." The governance checklist asks you to clearly define and document each role's access rights.

**Where each tool fits:**

| Layer | Tool | FSI default |
|---|---|---|
| Enterprise | Enterprise owner | 2-3 named humans plus break-glass (next section) |
| Enterprise | [Enterprise custom roles](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-roles-in-your-enterprise/create-custom-roles) (**public preview**) | Audit log viewer, org creator. Pilot before you rely on them for a control. |
| Enterprise | [Enterprise security manager](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-roles-in-your-enterprise/abilities-of-roles) (**public preview**) | Central AppSec team |
| Organization | [Security manager](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-peoples-access-to-your-organization-with-roles/managing-security-managers-in-your-organization) (GA) | Assigned to the AppSec team. Read on all repos, write on security alerts. |
| Organization | [Custom organization roles](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-peoples-access-to-your-organization-with-roles/permissions-of-custom-organization-roles) | e.g. an auditor role with "View organization audit log" |
| Repository | [Custom repository roles](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/about-custom-repository-roles) | Up to 20; inherit from a base role and add permissions |
| Repository | [Base permission](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/setting-base-permissions-for-an-organization) | None or Read |

**Two facts worth knowing:**

- Internal repositories are always readable by enterprise members, even with base permission set to none. If a repo holds something sensitive, it should be private, not internal.
- Enterprise owners [do not see organization content by default](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-roles-in-your-enterprise/abilities-of-roles). They can join any org, which generates an audit event. That is a useful separation of duties property.

**How:** Lock base permissions at the enterprise level so orgs cannot drift ([repository management policies](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise)). The same page lets you restrict outside collaborator invitations to org or enterprise owners, which [WAF best practices](https://learn.github.com/well-architected/library/governance/recommendations/governance-policies-best-practices/) recommends.

**Verify:**

```bash
# Org owners: compare to the approved owner list
gh api --paginate "/orgs/$ORG/members?role=admin" --jq '.[].login'

# Every org role (predefined, custom, enterprise-defined) and who holds it
for id in $(gh api "/orgs/$ORG/organization-roles" --jq '.roles[].id'); do
  gh api "/orgs/$ORG/organization-roles/$id/users" --jq ".[] | \"$id,\(.login)\""
done

# Outside collaborators (personal-account enterprises)
gh api --paginate "/orgs/$ORG/outside_collaborators" --jq '.[].login'
```

Audit events to alert on: `business.add_admin`, `org.update_member` (role changes), `organization_role.assign`, `enterprise_role.assign`, and `org.update_default_repository_permission`.

## Privileged and break-glass accounts

**What we do:** Day-to-day administration uses named, IdP-provisioned accounts with the narrowest role that works. One break-glass path exists, sealed in your privileged access management (PAM) vault and alarmed.

**Why:** US-NYDFS-500.7 wants unnecessary privileged accounts gone and US-NYDFS-500.12 wants MFA on all of them. You still need a way in when the IdP is down. The answer: one account, heavily watched.

**How:**

- **EMU:** the [setup user](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/setup-user) (`<shortcode>_admin`) is your break-glass account. GitHub says it is only for configuring auth and provisioning, SCIM, and regaining access during an IdP problem. Enable GitHub 2FA on it and store credentials in your PAM tool.
- **All GHEC models:** download the [SSO recovery codes](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/managing-recovery-codes-for-your-enterprise/downloading-your-enterprise-accounts-single-sign-on-recovery-codes) and seal them alongside it.
- **Org ownership:** keep at least two owners per org. GitHub's [role guidance](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-peoples-access-to-your-organization-with-roles/roles-in-an-organization) says "no less than two."
- **GHES:** keep one built-in site admin for when SAML or LDAP breaks, with 2FA, in the vault.

**The catch with the setup user:** its SCIM token is a classic PAT with [no expiration](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/getting-started-with-enterprise-managed-users). Treat that token like a root credential. Record it as a documented exception in your token policy, store it only in the IdP provisioning config, and rotate it on a schedule.

**Verify:** Alert on any audit log event where `actor:<shortcode>_admin`. Outside a change window, every hit is an incident. Test the break-glass procedure annually and keep the record.

## Personal access tokens

**What we do:**

- Restrict **classic PATs** from accessing enterprise organizations.
- Require **approval** for fine-grained PATs.
- Set a **maximum lifetime** (we suggest 90 days or less; your policy decides).
- Prefer **GitHub Apps** for anything long-lived.

**Why:** PATs are bearer credentials that outlive sessions. INT-PCI-8.3, US-NYDFS-500.7, and EU-DORA-RTS-ACCESS all want credentials tied to an identity, scoped, and governed. WAF essentials says "use fine-grained PATs over classic PATs" with administrator approval, and [WAF best practices](https://learn.github.com/well-architected/library/governance/recommendations/governance-policies-best-practices/) lists the approval flow as a key strategy.

**How:** All three are enterprise policies on one [PAT policy page](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-personal-access-tokens-in-your-enterprise). Facts to plan around:

- The default maximum lifetime for fine-grained tokens is 366 days. Classic tokens have no expiration requirement until you set one.
- Lifetime policy blocks non-compliant tokens; it does not revoke them. Users find out when API calls fail.
- There is an **Exempt administrators** checkbox. GitHub recommends it if you use SCIM, and EMU will warn you about service interruption if you skip it. This ties back to the setup user's SCIM token.
- Only fine-grained tokens go through approval. That is why classic tokens must be restricted, not just discouraged.
- On EMU, enterprise PAT policies also cover user namespaces because the enterprise owns the accounts.

The same controls exist on [GHES 3.22](https://docs.github.com/en/enterprise-server@3.22/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-personal-access-tokens-in-your-enterprise).

**Yes, but my audit log collector uses a classic PAT.** Fair point. The [enterprise audit log REST API](https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/audit-log) currently requires a classic PAT or OAuth token. Prefer audit log streaming (Part 1). If you must poll, document the exception, scope the token to `read:audit_log`, and own it with a service identity.

**Verify:**

- `personal_access_token.expiration_limit_set`, `personal_access_token.access_restriction_enabled`, and `personal_access_token.request_created` / `access_granted` / `request_denied` events give you the full approval trail.
- Org owners can [review and revoke fine-grained tokens](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/reviewing-and-revoking-personal-access-tokens-in-your-organization) in the UI. The [REST endpoints](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/personal-access-tokens) (`GET /orgs/{org}/personal-access-tokens`) can only be called by a GitHub App. That's a nice nudge toward building your review tooling as an App.

## GitHub Apps, OAuth apps, and deploy keys

**What we do:**

- **GitHub Apps** are the default for integrations and automation, installed at the enterprise level when broadly needed.
- **OAuth apps** require owner approval and an exception record.
- **Deploy keys** are disabled at the enterprise level, with documented exceptions.

**Why:** Machine identities count as identities under EU-DORA-RTS-ACCESS ("per person or system"). GitHub's own comparison says GitHub Apps "use fine-grained permissions, give more control over which repositories the app can access, and use short-lived tokens" ([source](https://docs.github.com/en/enterprise-cloud@latest/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps)). WAF essentials recommends "the GitHub App framework over the OAuth framework."

Deploy keys are a blind spot. Per [GitHub's docs](https://docs.github.com/en/enterprise-cloud@latest/authentication/connecting-to-github-with-ssh/managing-deploy-keys), they never expire, survive the creator's removal, and with write access act like a repo admin. They also bypass IdP CAP IP conditions.

**How:**

- [OAuth app access restrictions](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions) are on by default for new orgs. Keep them on. Note that privileged OAuth apps bypass this.
- [Restrict repository admins from installing GitHub Apps](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/limiting-oauth-app-and-github-app-access-requests-and-installations) so installs route through owner approval.
- Disable deploy keys in [enterprise repository policies](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise). Warning: this disables **existing** keys immediately. Inventory first.

```bash
# Inventory deploy keys before you flip the policy
gh repo list "$ORG" --limit 5000 --json nameWithOwner --jq '.[].nameWithOwner' |
while read -r repo; do
  gh api "/repos/$repo/keys" --jq ".[] | \"$repo,\(.id),\(.title),\(.read_only),\(.created_at)\""
done
```

**Verify:** `integration_installation.create` / `destroy`, `org.oauth_app_access_approved`, and `public_key.create` (fires for both user SSH keys and deploy keys). Review the installed app list and permissions quarterly.

## SSH certificate authorities

**What we do:** Issue short-lived SSH certificates from a corporate CA and require them for Git access. Developer-managed SSH keys and PATs stop being the Git path.

**Why:** A certificate that expires daily makes offboarding and key theft far less scary, which is exactly the example in [About SSH certificate authorities](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-git-access-to-your-organizations-repositories/about-ssh-certificate-authorities). WAF essentials recommends a CA to "centrally manage command line access and avoid per-user PAT management." Supports INT-PCI-8.3 and US-NYDFS-500.7.

**How:**

```bash
# Sign a developer's key for one day, bound to their GitHub login
ssh-keygen -s ./ca-key -V '+1d' -I "jdoe-$(date +%F)" \
  -O extension:login@github.com=jdoe_fabrikam ./user-key.pub
```

- Add the CA at the [enterprise level](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-security-settings-in-your-enterprise), then require SSH certificates.
- CAs added before March 27, 2024 can issue non-expiring certs. **Upgrade** them.
- Certificates work under SAML SSO without per-credential authorization.
- GHES 3.22 supports SSH CAs too ([enterprise security policies](https://docs.github.com/en/enterprise-server@3.22/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-security-settings-in-your-enterprise)).

**Verify:** `ssh_certificate_authority.create` / `destroy` and `ssh_certificate_requirement.enable` / `disable` events. Your CA's issuance log is the other half of the evidence.

## Network and session controls

**What we do:** Enforce corporate network conditions on every human and token. With EMU and Entra ID OIDC, use the IdP's CAP. Otherwise, use [GitHub's IP allow list](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/hardening-security-for-your-enterprise/restricting-network-traffic-to-your-enterprise-with-an-ip-allow-list). You pick one; enabling the IdP list deactivates GitHub's.

**Why:** US-NYDFS-500.12 focuses on remote access, and the SWIFT CSCF's "know and limit access" objective is about exactly this kind of boundary.

**How:**

- GitHub's allow list covers PATs, OAuth tokens, SSH keys (including deploy keys), and app tokens, including `GITHUB_TOKEN`.
- With EMU, turn on **user-level enforcement** so the list also covers user-owned repositories and forks.
- Add your integrations' ranges, or allow installed GitHub Apps. WAF essentials warns that missing ranges make integrations "silently fail."
- On GHES, the instance sits inside your network, so this is a firewall and load balancer job.

**Verify:** `ip_allow_list.enable`, `ip_allow_list_entry.create` / `destroy`, and `ip_allow_list.enable_user_level_enforcement`. Diff the allow list against the approved network inventory each quarter.

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

Script the single-user path so on-call can run it at 3 a.m.:

```bash
# EMU: revoke all SSO authorizations AND destroy the user's PATs and SSH keys
gh api -X POST "/enterprises/$ENTERPRISE/credential-authorizations/$USERNAME/revoke" \
  -F revoke_credentials=true
```

The `revoke_credentials` flag applies only to EMU ([REST reference](https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/credential-authorizations)). For personal-account enterprises, revoking an SSO authorization does not delete the underlying token. The user just loses access to your orgs.

**Verify:** The audit log records `hashed_token` for token-authenticated events. Use the credential inventory export to [trace everything a compromised token did](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/identifying-audit-log-events-performed-by-an-access-token). Run a tabletop at least annually and keep the notes.

## Access reviews and the evidence pack

**What we do:** A quarterly access review, owned by the business, with a repeatable evidence pack.

**Why:** US-NYDFS-500.7 and INT-PCI-7.2 both require periodic review. The [WAF governance checklist](https://learn.github.com/well-architected/library/governance/checklist/) says to "conduct periodic access reviews" and "document and address any discrepancies." The audit log keeps only [180 days of events](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise) (seven for Git events). Streaming from Part 1 is a prerequisite.

**The quarterly evidence pack:**

1. **Membership export** (UI) with 2FA status, roles, and SAML `NameID`.
2. **Credential inventory export** (UI) showing every active token and key.
3. **Privileged role list** from the scripts above: org owners, enterprise owners, custom role holders.
4. **Outside or guest collaborators** with their sponsor and end date.
5. **Installed GitHub Apps and approved OAuth apps** with permissions.
6. **Dormant users report.**
7. **Audit log extract** of privileged changes for the quarter:

   ```bash
   gh api --paginate \
     "/enterprises/$ENTERPRISE/audit-log?phrase=action:business.add_admin+created:>=2026-08-01&per_page=100"
   ```

   Repeat for `org.update_member`, `organization_role.assign`, `enterprise_role.assign`, and `personal_access_token.access_granted`.

8. **Reviewer sign-off** with decisions (keep, remove, change) and closure tickets for every removal.

**Verify the review itself:** auditors will sample a "remove" decision and look for the matching audit event, so close the loop in your ticket system.

## Control matrix

| Control | Requirement IDs | GitHub feature | Evidence | Cadence |
|---|---|---|---|---|
| IdP-owned accounts | EU-DORA-RTS-ACCESS, US-NYDFS-500.7, US-GLBA-314 | Enterprise Managed Users | Enterprise type; IdP vs. membership reconciliation | Once; quarterly |
| Central auth and conditional access | US-NYDFS-500.12, US-NYDFS-500.14, INT-SWIFT-CSCF-OVERVIEW | OIDC + CAP, or enterprise SAML + IP allow list | SAML/OIDC and `ip_allow_list.*` audit events; CAP export | Continuous alerts; quarterly |
| MFA everywhere | US-NYDFS-500.12, INT-PCI-8.3 | IdP MFA; GitHub 2FA secure-methods policy | IdP policy; `*.two_factor_requirement` events; 2FA filters; membership export | Quarterly |
| Automated joiner/leaver | US-NYDFS-500.7, INT-PCI-7.2, EU-DORA-RTS-ACCESS | SCIM, IdP group to team sync, unaffiliated users policy | `external_identity.deprovision`, SCIM failure alerts, leaver sample | Continuous; quarterly sample |
| Least privilege roles | INT-PCI-7.2, US-NYDFS-500.7, US-OCC-30-AppB | Base permissions, custom and security manager roles | Role holder lists; role/permission audit events | Quarterly |
| Break-glass | US-NYDFS-500.7, US-NYDFS-500.12 | Setup user, SSO recovery codes | Alerts on setup user actor; annual test record | Continuous; annual |
| Token governance | INT-PCI-8.3, EU-DORA-RTS-ACCESS | Classic PAT restriction, fine-grained approval, max lifetime | `personal_access_token.*` events; credential inventory | Continuous; quarterly |
| Integration governance | EU-DORA-RTS-ACCESS, US-FFIEC-INFOSEC | GitHub Apps, OAuth restrictions, deploy key policy | `integration_installation.*`, `org.oauth_app_access_*`, `public_key.create` | Quarterly |
| Short-lived Git credentials | INT-PCI-8.3, US-NYDFS-500.7 | SSH certificate authority | `ssh_certificate_*` events; CA issuance log | Quarterly |
| Incident revocation | US-NYDFS-500.14, CA-OSFI-B13 | Credential inventory, revocation, SSO lockdown | Runbook; tabletop record; `hashed_token` traces | Annual test |
| Periodic access review | US-NYDFS-500.7, INT-PCI-7.2, AR-BCRA-A7724, PE-SBS-504 | Exports, REST API, audit log | Signed review pack with closure tickets | Quarterly |

## Summary and key takeaways

Every later control in this series assumes you know who is acting and that their access is current. Get identity right and the rest gets easier to evidence.

**Your checklist:**

- [ ] Choose EMU (required for GHE.com). If you are already on personal accounts, enforce SAML at the enterprise level.
- [ ] Use OIDC with CAP if you run Entra ID; otherwise enable GitHub's IP allow list.
- [ ] Enforce phishing-resistant MFA at the IdP; on personal accounts, also require GitHub 2FA with secure methods.
- [ ] Provision and deprovision exclusively via SCIM; grant repo access only through IdP-linked teams.
- [ ] Set base permission to None or Read, keep org owners at two or three, and use custom and security manager roles.
- [ ] Vault the setup user and recovery codes; alert on every setup user action.
- [ ] Restrict classic PATs, require fine-grained PAT approval, and set a maximum lifetime.
- [ ] Default to GitHub Apps; keep OAuth restrictions on; disable deploy keys after inventory.
- [ ] Stand up an SSH CA with short-lived certificates and require it.
- [ ] Script and rehearse credential revocation and SSO lockdown.
- [ ] Run a quarterly access review with the evidence pack above.

**Previous:** [Part 1: Platform Foundation and Data Boundaries](/blog/github-waf-financial-services/platform-foundation/)

**Next:** [Part 3: Source Code Management and Change Control](/blog/github-waf-financial-services/change-control/), where we put these identities to work in rulesets, reviews, and separation of duties.

## References

### GitHub Well-Architected

- [Essentials of governance and administration with GitHub Enterprise](https://learn.github.com/well-architected/library/governance/recommendations/governance-administration-essentials/)
- [GitHub Enterprise policies and best practices](https://learn.github.com/well-architected/library/governance/recommendations/governance-policies-best-practices/)
- [Checklist for governance](https://learn.github.com/well-architected/library/governance/checklist/)
- [Securing the developer workspace](https://learn.github.com/well-architected/library/application-security/recommendations/securing-developer-workspace/)

### GitHub Docs

**Accounts and authentication**

- [Choosing an enterprise type for GitHub Enterprise Cloud](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/enterprise-fundamentals/choose-an-enterprise-type)
- [Getting started with Enterprise Managed Users](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/getting-started-with-enterprise-managed-users)
- [Abilities and restrictions of managed user accounts](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts)
- [Setup user](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/setup-user)
- [Configuring OIDC for Enterprise Managed Users](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/configuring-authentication-for-enterprise-managed-users/configuring-oidc-for-enterprise-managed-users)
- [About support for your IdP's Conditional Access Policy](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/configuring-authentication-for-enterprise-managed-users/about-support-for-your-idps-conditional-access-policy)
- [Configuring SAML single sign-on for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/using-saml-for-enterprise-iam/configuring-saml-single-sign-on-for-your-enterprise)
- [Deciding whether to configure SAML for your enterprise or your organizations](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/using-saml-for-enterprise-iam/deciding-whether-to-configure-saml-for-your-enterprise-or-your-organizations)
- [About authentication with single sign-on](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-single-sign-on/about-authentication-with-single-sign-on)
- [Enforcing policies for security settings in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-security-settings-in-your-enterprise)
- [Downloading your enterprise account's SSO recovery codes](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/managing-recovery-codes-for-your-enterprise/downloading-your-enterprise-accounts-single-sign-on-recovery-codes)
- [Enabling guest collaborators](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/enabling-guest-collaborators)
- [Feature overview for GitHub Enterprise Cloud with data residency](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/feature-overview-for-github-enterprise-cloud-with-data-residency)

**Provisioning**

- [Configuring SCIM provisioning for Enterprise Managed Users](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/configuring-scim-provisioning-for-users)
- [Managing team memberships with identity provider groups](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/managing-team-memberships-with-identity-provider-groups)
- [About SCIM for organizations](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-saml-single-sign-on-for-your-organization/about-scim-for-organizations)
- [Synchronizing a team with an identity provider group](https://docs.github.com/en/enterprise-cloud@latest/organizations/organizing-members-into-teams/synchronizing-a-team-with-an-identity-provider-group)
- [Controlling user offboarding with the unaffiliated users policy](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/control-offboarding)
- [Managing dormant users](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/managing-dormant-users)
- [Exporting membership information for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/exporting-membership-information-for-your-enterprise)

**Roles and permissions**

- [Abilities of roles in an enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-roles-in-your-enterprise/abilities-of-roles)
- [Creating custom roles in an enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-roles-in-your-enterprise/create-custom-roles)
- [Roles in an organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-peoples-access-to-your-organization-with-roles/roles-in-an-organization)
- [Managing security managers in your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-peoples-access-to-your-organization-with-roles/managing-security-managers-in-your-organization)
- [Permissions of custom organization roles](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-peoples-access-to-your-organization-with-roles/permissions-of-custom-organization-roles)
- [About custom repository roles](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/about-custom-repository-roles)
- [Setting base permissions for an organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/setting-base-permissions-for-an-organization)
- [Enforcing repository management policies in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise)

**Programmatic access**

- [Enforcing policies for personal access tokens in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-personal-access-tokens-in-your-enterprise)
- [Reviewing and revoking personal access tokens in your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/reviewing-and-revoking-personal-access-tokens-in-your-organization)
- [REST API: personal access tokens (organizations)](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/personal-access-tokens)
- [Differences between GitHub Apps and OAuth apps](https://docs.github.com/en/enterprise-cloud@latest/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps)
- [About OAuth app access restrictions](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions)
- [Limiting OAuth app and GitHub App access requests and installations](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/limiting-oauth-app-and-github-app-access-requests-and-installations)
- [Managing deploy keys](https://docs.github.com/en/enterprise-cloud@latest/authentication/connecting-to-github-with-ssh/managing-deploy-keys)
- [About SSH certificate authorities](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-git-access-to-your-organizations-repositories/about-ssh-certificate-authorities)
- [Restricting network traffic to your enterprise with an IP allow list](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/hardening-security-for-your-enterprise/restricting-network-traffic-to-your-enterprise-with-an-ip-allow-list)

**Incident response and evidence**

- [Reviewing credentials in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/respond-to-incidents/reviewing-credentials-in-your-enterprise)
- [Revoking authorizations or deleting credentials in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/respond-to-incidents/revoke-authorizations-or-tokens)
- [Locking down single sign-on in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/respond-to-incidents/lock-down-sso)
- [REST API: enterprise credential authorizations](https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/credential-authorizations)
- [REST API: credential revocation](https://docs.github.com/en/enterprise-cloud@latest/rest/credentials/revoke)
- [About the audit log for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise)
- [Audit log events for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise)
- [Identifying audit log events performed by an access token](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/identifying-audit-log-events-performed-by-an-access-token)
- [REST API: enterprise audit log](https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/audit-log)

**GitHub Enterprise Server 3.22**

- [Identity and access management fundamentals](https://docs.github.com/en/enterprise-server@3.22/admin/concepts/identity-and-access-management/identity-and-access-management-fundamentals)
- [User provisioning with SCIM on GHES](https://docs.github.com/en/enterprise-server@3.22/admin/managing-iam/provisioning-user-accounts-with-scim/user-provisioning-with-scim-on-ghes)
- [Configuring SAML SSO for your enterprise (GHES)](https://docs.github.com/en/enterprise-server@3.22/admin/managing-iam/using-saml-for-enterprise-iam/configuring-saml-single-sign-on-for-your-enterprise)
- [Using LDAP](https://docs.github.com/en/enterprise-server@3.22/admin/managing-iam/using-ldap-for-enterprise-iam/using-ldap)
- [Requiring two-factor authentication in your organization (GHES)](https://docs.github.com/en/enterprise-server@3.22/organizations/keeping-your-organization-secure/managing-two-factor-authentication-for-your-organization/requiring-two-factor-authentication-in-your-organization)
- [Enforcing policies for personal access tokens (GHES)](https://docs.github.com/en/enterprise-server@3.22/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-personal-access-tokens-in-your-enterprise)
- [Enforcing policies for security settings (GHES)](https://docs.github.com/en/enterprise-server@3.22/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-security-settings-in-your-enterprise)
- [Creating custom roles in an enterprise (GHES)](https://docs.github.com/en/enterprise-server@3.22/admin/managing-accounts-and-repositories/managing-roles-in-your-enterprise/create-custom-roles)

### Regulatory sources

- [FFIEC IT Examination Handbook, Information Security](https://ithandbook.ffiec.gov/it-booklets/information-security)
- [GLBA Safeguards Rule, 16 CFR Part 314](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-314)
- [12 CFR Part 30, Appendix B](https://www.ecfr.gov/current/title-12/chapter-I/part-30/appendix-Appendix%20B%20to%20Part%2030)
- [23 NYCRR Part 500 (NYDFS)](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500)
- [OSFI Guideline B-13](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management)
- [Resolución SBS N° 504-2021 (Peru)](https://intranet2.sbs.gob.pe/dv_int_cn/2046/v2.0/Adjuntos/504-2021.R.pdf)
- [BCRA Comunicación "A" 7724 (Argentina)](https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A7724.pdf)
- [Commission Delegated Regulation (EU) 2024/1774 (DORA RTS on ICT risk management)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774)
- [PCI DSS v4.0.1 (document library)](https://www.pcisecuritystandards.org/document_library/)
- [SWIFT Customer Security Programme](https://www.swift.com/myswift/customer-security-programme)
- [NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework)
