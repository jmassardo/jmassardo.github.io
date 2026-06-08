---
layout: post
title:  "Structuring GitHub Teams at Scale in Enterprise Managed Users"
date: 2026-06-29 10:00:00 -0500
category: Blog
tags: [github, devops, enterprise, security, best-practices, emu, automation]
excerpt: "A practical guide to designing a GitHub team structure that scales cleanly in EMU environments - from IdP group mapping to nested team hierarchies to day-to-day access management."
---

If you've recently deployed or inherited a GitHub Enterprise Managed Users (EMU) environment, you've probably asked some version of "okay, so how are we supposed to set up these teams?" The docs explain the mechanics. What they don't always spell out is the *design philosophy* - the decisions you make upfront that either make your org easy to manage at 200 people or a complete nightmare at 2,000.

Let's be real: team structure is one of those things that's very easy to get wrong, and very hard to fix later without disrupting access for real people in production.

This post is your practical guide to getting it right from the start.

## EMU Teams: What's Different

Before we get into structure, a quick primer on what makes EMU teams different from a regular GitHub org.

In a standard GitHub organization, you manage team membership manually (or through org owner actions). Anyone can be added to any team by an org owner or team maintainer.

In an EMU environment:
- **User accounts are provisioned by your IdP** (Entra ID, Okta, PingFederate) via SCIM
- **Team membership can be driven by IdP groups** via team synchronization
- **Users cannot change their own profile** or create accounts outside the enterprise
- **Visibility is constrained** - EMU members can only see and interact with repos inside your enterprise

The key implication for team design: **your GitHub team structure and your IdP group structure become tightly coupled.** The design decisions you make here live in two systems simultaneously, so you need a coherent strategy that works in both.

## The Core Concepts: Roles, Teams, and Access

Let's level-set on vocabulary before diving into structure:

| Concept | What It Controls |
|---------|-----------------|
| **Enterprise role** | Enterprise-level access (member, owner, guest collaborator) |
| **Organization role** | Org-level access (member, owner, billing manager) |
| **Team** | Access to specific repositories within an org |
| **Repository role** | Read, triage, write, maintain, or admin |

In EMU, the enterprise role is assigned via your IdP (mapped to a SCIM attribute). Organization membership is managed by IdP group SCIM provisioning. **Repository access is managed through teams.** This means teams are your primary lever for controlling who can do what to your code.

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

### Model 2: Layered Teams with Parent-Child Nesting (Recommended for Scale)

Use GitHub's nested team feature to create a hierarchy where permissions cascade:

```
org-members                    (base: read access to shared repos)
├── engineering                (write access to engineering-owned repos)
│   ├── platform               (write + admin on infra repos)
│   ├── frontend               (write on frontend repos)
│   └── backend                (write on backend repos)
├── security                   (read everywhere, write on security tooling repos)
│   └── security-admins        (admin on security repos)
├── data                       (write on data repos)
└── contractors                (read-only; specific repos added individually)
```

**How nested teams work:** Child teams inherit all parent permissions. If you grant `engineering` write access to a repo, all of `platform`, `frontend`, and `backend` also get write access automatically. You then add more granular permissions at the child level for repos specific to that sub-team.

**Pro:** Clean permission inheritance, @mentions work at any level, scales to hundreds of teams without permission sprawl.  
**Con:** Requires upfront planning to get the hierarchy right. Reorganizing later is non-trivial.

**The lesson:** For any org with more than a few hundred engineers sorted into actual sub-disciplines, use the nested model.

## Mapping IdP Groups to GitHub Teams

Here's where the rubber meets the road in EMU environments. The key feature is **team synchronization with IdP groups** - this lets your IdP group membership automatically determine GitHub team membership.

The setup flow:
1. Create teams in GitHub (or let SCIM provision them)
2. Link each team to one or more IdP groups
3. As users are added/removed from IdP groups, GitHub team membership updates automatically

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

**Option B: Multiple IdP groups map to one GitHub team (N:1 mapping)**  
- More flexible - you can map "engineering-fulltime" + "engineering-contractors" to the same GitHub team
- Useful when you have complex IdP group structures you can't control
- Requires clear documentation of which groups map where

The more pragmatic route for most enterprises: **start with 1:1 mapping**, document it clearly, and introduce N:1 patterns only when you have a specific reason.

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
- Persists after someone leaves or changes roles
- Creates invisible permission sprawl that's hard to audit
- Breaks the mental model of "if you're in this team, you have this access"

The only exception is outside collaborators for genuine third-party access - and even then, consider whether a dedicated `contractors` team is a better pattern.

**Access assignment pattern:**
1. New engineer joins → Added to IdP group → SCIM provisions EMU account → Added to appropriate GitHub teams automatically
2. Engineer changes teams → Updated in IdP → Team membership updates → Access updates
3. Engineer leaves → Deprovisioned in IdP → EMU account suspended → Access revoked

Zero manual GitHub admin work in the steady state. That's the goal.

## The Five Teams You Probably Need

Regardless of your specific org structure, most EMU enterprises end up needing these five team archetypes:

**1. `all-members` (or `org-members`)**  
Everyone in the org. Grants read access to internal shared repos (documentation, runbooks, standards). Often the parent team of your entire hierarchy. Map to your "all engineers" IdP group.

**2. `[discipline]-write`**  
Teams with write access to their discipline's repos. Most of your engineers live here. Example: `engineering-write`, `data-write`.

**3. `[discipline]-admins`**  
Small teams with admin access on specific repos for people who manage settings, branch protection, webhooks, etc. Keep these small and audited. Don't over-provision admin.

**4. `security` (read-everywhere)**  
A cross-cutting team that gets read access to all active repos. Critical for security reviews, incident response, and compliance. Use a nested structure if you need to differentiate between security-readonly and security-write.

**5. `contractors` or `external-collaborators`**  
A carefully scoped team for non-employees. Read-only by default, with specific write grants added on a per-project basis. **Key:** make this team membership time-limited if your IdP supports conditional access or expiry.

## Scaling to Multiple Organizations

Large enterprises often carve GitHub into multiple organizations (by business unit, by product area, by security boundary). In EMU, this works, but adds complexity:

- Each organization has its own team structure
- A user can be a member of multiple orgs in the same enterprise
- Team synchronization works per-org - you need separate team links in each org

**Recommendation:** If you have multiple orgs, keep a consistent naming convention across all of them. `acme-bu1-engineering-platform` and `acme-bu2-engineering-platform` make it clear which org's team you're looking at.

A cross-org "enterprise teams" feature exists for allocating access across orgs from a central enterprise-level view, but at the time of writing it's still maturing. Teams remain primarily an org-level construct.

## Access Auditing and Ongoing Hygiene

The work doesn't stop after setup. Here's what good EMU team hygiene looks like on an ongoing basis:

**Monthly:**
- Review teams with no members (these accumulate over time as IdP groups change)
- Check for repos with direct user access grants (there shouldn't be any, but verify)

**Quarterly:**
- Audit admin team membership - do all these people still need admin?
- Review contractor team membership - are there expired engagements still in here?
- Check if any teams have both a parent and unrelated direct repo access (this is usually a mistake)

**On org changes:**
- When an engineer changes disciplines, update their IdP group membership - GitHub updates automatically
- When a team is disbanded, archive or remove the GitHub team and its IdP group
- When a new product team spins up, provision the IdP group and GitHub team in tandem before anyone joins

## Common Pitfalls to Avoid

Let's be real about the mistakes everyone makes:

**Too many team maintainers.** Team maintainers can add anyone in the org to a team. In an EMU environment where you want IdP to drive access, having lots of team maintainers undermines that model. Keep maintainers to a minimum.

**"Just add them directly."** When access needs to happen fast, the path of least resistance is a direct repo collaborator grant. Resist this. The 5-minute shortcut creates permanent hygiene debt.

**Org owner mismanagement.** Org owner is effectively admin on everything in the org. In EMU environments, org owner should map to a tightly controlled IdP group with very few members. Don't make people org owners just to unblock them - give them the specific access they actually need.

**One team with all permissions.** Some orgs create a "platform" or "devops" team and just bulk-grant it admin on everything. Easy to manage, terrible for security. Use principle of least privilege - give teams access to the repos they actually need.

**Forgetting about GitHub Apps.** GitHub Apps authenticate as themselves and can have repo access outside your team model. Include Apps in your access audit. An App with stale, overly broad permissions is a security gap that your IdP-enforced team hygiene won't catch.

## Summary and Key Takeaways

Here's your action plan for getting GitHub EMU team structure right:

**Getting started:**
1. Map your org's functional groups before you create any GitHub teams
2. Design a nested parent-child hierarchy based on those groups
3. Agree on a naming convention (GitHub teams + IdP groups) and write it down
4. Establish the "never direct user access" rule as a firm policy

**Setting it up:**
1. Create your base teams and link them to IdP groups via SCIM/team sync
2. Grant parent-level access to shared repos, child-level access to specific repos
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
- [Synchronizing a team with an identity provider group](https://docs.github.com/en/enterprise-cloud@latest/organizations/organizing-members-into-teams/synchronizing-a-team-with-an-identity-provider-group)
- [Managing team memberships with identity provider groups](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/using-enterprise-managed-users-for-iam/managing-team-memberships-with-identity-provider-groups)
- [Repository roles for an organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization)
- [Roles in an enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/user-management/managing-users-in-your-enterprise/roles-in-an-enterprise)
