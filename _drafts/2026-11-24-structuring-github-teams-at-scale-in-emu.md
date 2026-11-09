---
layout: post
title:  "Structuring GitHub Teams at Scale in Enterprise Managed Users"
date: 2026-11-24 10:00:00 -0600
category: Blog
tags: [github, devops, enterprise, security, best-practices, emu, automation]
excerpt: "A practical guide to designing a GitHub team structure that scales cleanly in EMU environments - from IdP group mapping to flat access teams to day-to-day access management."
---

If you've recently deployed or inherited a GitHub Enterprise Managed Users (EMU) environment, you've probably asked some version of "okay, so how are we supposed to set up these teams?" The docs explain the mechanics. What they don't always spell out is the *design philosophy* - the decisions you make upfront that either make your org easy to manage at 200 people or a complete nightmare at 2,000.

Let's be real: team structure is one of those things that's very easy to get wrong, and very hard to fix later without disrupting access for real people in production.

This post is your practical guide to getting it right from the start.

**Fact-check anchor: November 3, 2026.** The important constraint: **IdP-connected EMU teams cannot be nested.** Design flat access groups, not an inheritance tree you cannot actually sync.

## EMU Teams: What's Different

Before we get into structure, a quick primer on what makes EMU teams different from a regular GitHub org.

In a standard GitHub organization, you manage team membership manually (or through org owner actions). Anyone can be added to any team by an org owner or team maintainer.

In an EMU environment:
- **User accounts are provisioned by your IdP** (Entra ID, Okta, PingFederate) via SCIM
- **Team membership can be driven by IdP groups** via team synchronization
- **Your IdP controls account identity attributes** rather than individual users
- **Collaboration is constrained** - managed accounts can view public repositories, but cannot contribute outside the enterprise with that account

These restrictions apply to the managed account, not to a person's separate personal account. See [EMU capabilities and restrictions](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/enterprise-managed-users).

The key implication for team design: **your GitHub team structure and your IdP group structure become tightly coupled.** The design decisions you make here live in two systems simultaneously, so you need a coherent strategy that works in both.

## The Core Concepts: Roles, Teams, and Access

Let's level-set on vocabulary before diving into structure:

| Concept | What It Controls |
|---------|-----------------|
| **Enterprise role** | Enterprise-level access (member, owner, guest collaborator) |
| **Organization role** | Org-level access (member, owner, and delegated organization roles) |
| **Team** | Access to specific repositories within an org |
| **Repository role** | Read, triage, write, maintain, or admin |

In EMU, your IdP's `roles` mapping assigns the provisioned enterprise role. That is **not an organization-owner mapping**. Organization owners manage org roles on GitHub; enterprise teams can also carry delegated roles.

Connecting a team to an IdP group adds its members to the organization. Manual organization membership is also supported. **Teams should be your default repository-access mechanism**, but direct grants and organization base permissions still exist. See [SCIM role assignment](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/configuring-scim-provisioning-for-users#assigning-users-and-groups).

## Choosing a Team Structure Model

There's no one-size-fits-all answer, but there are two dominant patterns:

### Model 1: Functional Teams (Common for Smaller Orgs)

Map teams directly to functional groups in your org:
- `engineering`
- `platform-engineering`
- `security`
- `data-science`

**Pro:** Simple, easy to understand, maps well to org chart.  
**Con:** Doesn't scale well. "Engineering" is too broad to give specific repo access, "platform-engineering" ends up needing write on 80% of repos.

### Model 2: Flat, Role-Based Access Teams (Recommended for IdP Sync)

Separate broad shared access from project-specific privileges. Each line below is an independent team with its own IdP group:

```
org-members                    (read on selected shared repos)
platform-write                 (write on infra repos)
platform-admins                (admin on selected infra repos)
frontend-write                 (write on frontend repos)
backend-write                  (write on backend repos)
security-read                  (read on selected private repos)
security-admins                (admin on security tooling repos)
data-write                     (write on data repos)
project-contractors            (explicit access to one project's repos)
```

**How access combines:** A person can belong to several teams. GitHub applies the highest effective repository permission from their access paths. Membership in `org-members` does not automatically make someone a member of `platform-write`.

**Pro:** Compatible with EMU IdP synchronization, explicit grants, predictable access reviews.
**Con:** Shared permissions must be assigned explicitly rather than inherited.

GitHub supports parent-child permission inheritance for **unsynced organization teams**, but an IdP-connected team cannot be either a parent or a child. Don't mix those models accidentally. See [EMU team requirements](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/managing-team-memberships-with-identity-provider-groups).

## Mapping IdP Groups to GitHub Teams

Here's where the rubber meets the road in EMU environments. The key feature is **team synchronization with IdP groups** - this lets your IdP group membership automatically determine GitHub team membership.

The setup flow:
1. Provision users and groups through the EMU application in your IdP
2. Create a flat team in GitHub and link it to **one** provisioned IdP group
3. Manage membership in the IdP; GitHub reconciles membership after group updates and runs a daily reconciliation

For an existing team, remove manually assigned members and nested relationships before linking. Entra ID requires **security groups**; Microsoft 365 groups and nested group memberships are not supported. See [GitHub's connection requirements](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/managing-team-memberships-with-identity-provider-groups#requirements-for-connecting-idp-groups-with-teams) and [Microsoft's provisioning tutorial](https://learn.microsoft.com/en-us/entra/identity/saas-apps/github-enterprise-managed-user-provisioning-tutorial).

```
Entra ID Group: "github-engineering-platform" 
    ↓ (SCIM sync)
GitHub Team: "platform" in org "your-org"
    ↓ (team access)
Repos: infra, platform-tools, deployment-configs (write access)
```

**Critical design decision: how granular should your IdP groups be?**

There are two approaches:

**Option A: One IdP group per GitHub team (1:1 mapping)**  
- Simple to reason about
- Every team change requires an IdP group change
- Works best when your IdP admin and GitHub admin are the same person (or closely coordinated)

**Option B: One IdP group maps to multiple GitHub teams (1:N mapping)**
- Supported across teams in the enterprise, including different organizations
- Useful when the same people need a consistent access bundle across orgs
- Requires documenting every linked team so a group change has a predictable blast radius

The more pragmatic route for most enterprises: **start with 1:1 mapping** and introduce 1:N only for a clear access bundle. If you need a union of populations, maintain one group in your IdP using supported membership rules, not nested Entra groups.

**Keep provisioning credentials separate.** Enterprise SCIM uses a setup-user **personal access token (classic)** with `scim:enterprise`, not a fine-grained PAT or GitHub App installation token. Let the IdP own SCIM writes; don't run competing membership scripts. See [SCIM API prerequisites and write ownership](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/provisioning-users-and-groups-with-scim-using-the-rest-api).

## Team Naming Conventions

Naming seems trivial until you have 200 teams and no one can find anything. Establish a convention up front:

```
{org-segment}-{function}-{scope?}

Examples:
acme-engineering-platform
acme-engineering-frontend
acme-security
acme-security-admins
acme-data-science
acme-contractors
```

**Rules to follow:**
- All lowercase, hyphens as separators
- Include the org segment if you have multiple GitHub orgs in one enterprise
- Distinguish admin teams explicitly (`-admins` suffix)
- Don't use abbreviations that won't be obvious to a new hire in 2 years

Use the same naming convention for your IdP groups. If the GitHub team is `acme-engineering-platform`, the Entra ID group should be `github-acme-engineering-platform` (or similar). The `github-` prefix helps filter in your IdP directory.

## Repository Access Assignment: Do It Through Teams, Always

Here's a rule that will save you enormous pain: **never grant individual user access to repositories.** Every access grant should go through a team.

Why? Because individual user access:
- Doesn't sync with your IdP
- Can persist after a role change, bypassing your team-based access model
- Creates invisible permission sprawl that's hard to audit
- Breaks the mental model of "if you're in this team, you have this access"

A suspended EMU account loses access, but suspension does not clean up every historical grant. Audit those grants before reinstatement. For genuine third-party access, provision **guest collaborators** through your IdP; EMU does not use personal-account outside collaborators. See [EMU guest collaborators](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/enterprise-managed-users).

**Access assignment pattern:**
1. New engineer joins → Added to IdP group → SCIM provisions EMU account → Added to appropriate GitHub teams automatically
2. Engineer changes teams → Updated in IdP → Team membership updates → Access updates
3. Engineer leaves → Deprovisioned in IdP → EMU account suspended → Access revoked

Zero manual GitHub admin work in the steady state. That's the goal.

## The Five Teams You Probably Need

Regardless of your specific org structure, most EMU enterprises end up needing these five team archetypes:

**1. `all-members` (or `org-members`)**  
Everyone who needs shared documentation, runbooks, and standards. Keep this team flat. Internal repositories are already readable by standard enterprise members, so use explicit team grants for selected private shared repositories.

**2. `[discipline]-write`**  
Teams with write access to their discipline's repos. Most of your engineers live here. Example: `engineering-write`, `data-write`.

**3. `[discipline]-admins`**  
Small teams with admin access on specific repos for people who manage settings, branch protection, webhooks, etc. Keep these small and audited. Don't over-provision admin.

**4. `security` (read-everywhere)**  
A cross-cutting team with read access to the private repos it needs. Critical for security reviews, incident response, and compliance. Separate `security-read` and `security-write` teams when permissions differ.

**5. `contractors` or `external-collaborators`**  
A carefully scoped team for provisioned non-employees. Teams have no built-in "read-only default"; grant read explicitly and add project-specific write access only when needed. **Key:** use IdP group membership expiry or access reviews, not conditional access alone, to end engagements.

## Scaling to Multiple Organizations

Large enterprises often carve GitHub into multiple organizations (by business unit, by product area, by security boundary). In EMU, this works, but adds complexity:

- Each organization has its own team structure
- A user can be a member of multiple orgs in the same enterprise
- Team synchronization works per-org - you need separate team links in each org

**Recommendation:** If you have multiple orgs, keep a consistent naming convention across all of them. `acme-bu1-engineering-platform` and `acme-bu2-engineering-platform` make it clear which org's team you're looking at.

**Enterprise teams are now a concrete cross-org option**, not just something to watch. They can sync to an EMU IdP group, join organizations, receive repository access from org administrators, and carry delegated enterprise roles.

As verified November 3, 2026, GitHub documents limits of **2,500 enterprise teams**, **5,000 users per team**, and **1,000 organizations per team**. An IdP group exceeding 5,000 users stops enterprise-team synchronization until it returns below the limit. See [creating enterprise teams](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/create-enterprise-teams).

Removing a user from their last mapped group removes group-derived organization membership, but **manually added members require manual removal**. Check membership origin during offboarding. See [removing organization members](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/managing-team-memberships-with-identity-provider-groups#removing-members-from-organizations).

## Access Auditing and Ongoing Hygiene

The work doesn't stop after setup. Here's what good EMU team hygiene looks like on an ongoing basis:

**Monthly:**
- Review teams with no members (these accumulate over time as IdP groups change)
- Check for repos with direct user access grants (there shouldn't be any, but verify)

**Quarterly:**
- Audit admin team membership - do all these people still need admin?
- Review contractor team membership - are there expired engagements still in here?
- Compare effective repository permissions against the intended IdP access bundles

**On org changes:**
- When an engineer changes disciplines, update their IdP group membership - GitHub updates automatically
- When a team is disbanded, remove its GitHub grants, disconnect/delete the team, and retire the IdP group
- When a new product team spins up, provision the IdP group and GitHub team in tandem before anyone joins

## Common Pitfalls to Avoid

Let's be real about the mistakes everyone makes:

**Confusing synced and manual teams.** IdP-connected teams cannot have team maintainers or manual membership edits. Unsynced teams can, so audit them as a separate access path rather than assuming every team is IdP-controlled.

**"Just add them directly."** When access needs to happen fast, the path of least resistance is a direct repo collaborator grant. Resist this. The 5-minute shortcut creates permanent hygiene debt.

**Org owner mismanagement.** Org owner is effectively admin on everything in the org. Do not assume an IdP enterprise-role assignment grants this role. Keep GitHub org-owner assignments small and audited; use delegated roles when someone only needs a specific administrative capability.

**One team with all permissions.** Some orgs create a "platform" or "devops" team and just bulk-grant it admin on everything. Easy to manage, terrible for security. Use principle of least privilege - give teams access to the repos they actually need.

**Forgetting about GitHub Apps.** GitHub Apps authenticate as themselves and can have repo access outside your team model. Include Apps in your access audit. An App with stale, overly broad permissions is a security gap that your IdP-enforced team hygiene won't catch.

## Summary and Key Takeaways

Here's your action plan for getting GitHub EMU team structure right:

**Getting started:**
1. Map your org's functional groups before you create any GitHub teams
2. Design flat, role-based teams compatible with IdP synchronization
3. Agree on a naming convention (GitHub teams + IdP groups) and write it down
4. Establish the "never direct user access" rule as a firm policy

**Setting it up:**
1. Create your base teams and link them to IdP groups via SCIM/team sync
2. Grant shared-repo and project-specific permissions to separate teams
3. Set up admin teams as small, audited groups
4. Provision your contractor team with explicit read-only grants

**Staying clean:**
1. Monthly team health checks (empty teams, direct access drift)
2. Quarterly admin/contractor access review
3. Treat IdP group changes as the source of truth - GitHub is downstream

The bottom line: in EMU, your GitHub access model is only as good as your IdP group design. Treat them as the same thing, design them together, and your access management essentially runs itself.

## Useful References

- [About Enterprise Managed Users](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/enterprise-managed-users)
- [About organization teams](https://docs.github.com/en/enterprise-cloud@latest/organizations/organizing-members-into-teams/about-teams)
- [Managing EMU team memberships with identity provider groups](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/managing-team-memberships-with-identity-provider-groups)
- [Repository roles for an organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization)
- [Abilities of enterprise roles](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-roles-in-your-enterprise/abilities-of-roles)
