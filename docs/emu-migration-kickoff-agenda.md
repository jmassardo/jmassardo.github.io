# EMU Migration Kickoff: Planning Session Agenda

**Duration:** 120 minutes  
**Focus Areas:** Organizational Structure, Integrations, Identity Management  
**Phase Alignment:** Discovery & Decision, Pre-Migration Preparation

---

## Meeting Objectives

By the end of this session, we will:
1. Understand your current GitHub organizational structure and future state goals
2. Identify all integrations that need EMU compatibility assessment
3. Define your identity management requirements and IdP readiness
4. Establish next steps and assign owners for discovery tasks

---

## Agenda

| Time | Duration | Topic |
|------|----------|-------|
| 0:00 | 10 min | Introductions & Meeting Goals |
| 0:10 | 25 min | Current State: Organizational Structure |
| 0:35 | 25 min | Identity Management & IdP Readiness |
| 1:00 | 10 min | Break |
| 1:10 | 25 min | Integrations & Toolchain Assessment |
| 1:35 | 15 min | Migration Goals & Success Criteria |
| 1:50 | 10 min | Next Steps & Action Items |

---

## Section 1: Introductions & Meeting Goals (10 min)

### Attendee Introductions
- Name, role, and relationship to the migration project
- What does success look like for you personally?

### Set Expectations
- This is a discovery session, not a decision-making session
- Goal is to surface unknowns and identify what we need to research
- All questions are good questions

---

## Section 2: Current State - Organizational Structure (25 min)

### Enterprise & Organization Topology

**Questions to Ask:**

1. **Current GitHub footprint:**
   - How many GitHub organizations do you currently have?
   - Are they under a single enterprise, or separate?
   - Are you currently on GHEC, GHES, or a mix?

2. **Organization purpose and structure:**
   - What is the purpose of each organization? (Business unit, product line, environment separation, etc.)
   - Do you plan to consolidate or maintain the same structure post-migration?
   - Are there organizations that should NOT be migrated?

3. **Repository inventory:**
   - Approximately how many repositories total?
   - What's the breakdown of active vs. archived vs. dormant repositories?
   - Are there any exceptionally large repositories (>5GB, large file history)?
   - Do you have repositories with LFS enabled?

4. **Visibility and access patterns:**
   - Do you currently have public repositories? What's their purpose?
   - How do you use internal visibility today?
   - Any cross-organization collaboration patterns we should know about?

5. **Team structure:**
   - How are teams currently organized in GitHub?
   - Do team structures mirror your IdP groups, or are they GitHub-native?
   - How many teams exist today? Are they actively managed or organic/stale?

### Discovery Tasks to Assign:
- [ ] Run `gh-repo-stats` to generate repository inventory
- [ ] Document organization purposes and post-migration plan for each
- [ ] Identify repositories requiring special handling (large files, public, etc.)

---

## Section 3: Identity Management & IdP Readiness (25 min)

### Current Identity State

**Questions to Ask:**

1. **Identity Provider:**
   - What is your primary identity provider? (Entra ID, Okta, PingFederate, other)
   - Is your IdP the source of truth for all employee access, or just some systems?
   - Do you have multiple IdPs (e.g., different regions, acquired companies)?

2. **Current GitHub authentication:**
   - Do you currently use SAML SSO with GitHub?
   - If yes, is it enforced or optional?
   - How do users currently authenticate to GitHub?

3. **User lifecycle today:**
   - What happens to a user's GitHub access when they leave the company?
   - How long does offboarding typically take?
   - Are there any known orphaned accounts or access issues?

4. **SCIM experience:**
   - Do you currently use SCIM provisioning with any applications?
   - If yes, which applications and how has the experience been?
   - Who manages SCIM configurations in your organization?

### EMU-Specific Identity Questions

5. **Username considerations:**
   - What attribute would you use for GitHub usernames? (email prefix, employee ID, sAMAccountName, etc.)
   - Are there naming conflicts you're aware of? (common names, contractors with same names as employees)
   - What is your enterprise shortcode, and do users understand the `handle_shortcode` format?

6. **IdP group strategy:**
   - How are groups structured in your IdP today?
   - Do you have existing groups that map to GitHub access needs?
   - Who owns group membership decisions? (Team leads, managers, automated?)
   - Are you prepared to manage GitHub team membership exclusively through IdP groups?

7. **Privileged access:**
   - How will you designate enterprise owners and organization admins?
   - Do you have a process for privileged access reviews?
   - Will admin access be tied to IdP groups or managed differently?

8. **External collaborators:**
   - Do you work with contractors, vendors, or partners who need GitHub access?
   - How are external users managed in your IdP today?
   - Are you familiar with EMU's guest collaborator model?

9. **Conditional Access (if using Entra ID with OIDC):**
   - Do you use Conditional Access Policies today?
   - What policies would you want to apply to GitHub access? (Location, device compliance, risk-based)
   - Are you planning to use SAML or OIDC for EMU authentication?

### IdP Readiness Checklist:
- [ ] Confirm IdP is on the supported list (Entra ID, Okta, PingFederate)
- [ ] Identify IdP administrator who will configure SCIM
- [ ] Review existing group structure for GitHub team mapping
- [ ] Determine username attribute and test for conflicts
- [ ] Document external collaborator requirements

---

## Break (10 min)

---

## Section 4: Integrations & Toolchain Assessment (25 min)

### Integration Inventory

**Questions to Ask:**

1. **CI/CD and build systems:**
   - What CI/CD platforms integrate with GitHub today? (GitHub Actions, Jenkins, CircleCI, Azure DevOps, etc.)
   - How do pipelines authenticate to GitHub? (GitHub Apps, PATs, GITHUB_TOKEN)
   - Do you use self-hosted runners? Where are they hosted?

2. **GitHub Apps:**
   - What GitHub Apps are installed in your organizations?
   - Which are critical vs. nice-to-have?
   - Do you have any custom/internal GitHub Apps?

3. **OAuth applications:**
   - What third-party tools have OAuth access to your GitHub organizations?
   - Are all of these actively used?
   - Who authorized these, and is there an approval process?

4. **Webhooks:**
   - Where do you send webhook events? (Slack, monitoring, custom systems)
   - Are there any webhooks to external systems that might not support EMU patterns?

5. **IDE and developer tooling:**
   - What IDEs do developers use? (VS Code, JetBrains, etc.)
   - Any special GitHub authentication patterns for developer workstations?
   - Do you use GitHub Copilot? At what tier?

6. **Security and compliance tools:**
   - Do you use GitHub Advanced Security? (Code scanning, secret scanning, Dependabot)
   - Any third-party security tools that integrate with GitHub? (Snyk, SonarQube, etc.)
   - SIEM integration for audit logs?

7. **Project management and collaboration:**
   - Do you use GitHub Projects, Issues, or Discussions?
   - Integration with external project management? (Jira, Azure Boards, etc.)
   - Any automation that creates/updates issues?

### Integration Compatibility Assessment

8. **Authentication patterns:**
   - How do integrations currently authenticate? (PATs, GitHub Apps, OAuth, SSH keys)
   - Are there any integrations using user-level tokens that would be affected by username changes?
   - Any integrations that assume public repository access?

9. **Known issues or concerns:**
   - Are there integrations you're worried about?
   - Any vendor relationships we should engage for EMU compatibility?
   - Custom scripts or automation that interact with GitHub API?

### Integration Discovery Tasks:
- [ ] Export list of installed GitHub Apps per organization
- [ ] Audit OAuth application authorizations
- [ ] Document webhook destinations and purposes
- [ ] Identify integrations using PATs that need to be rotated
- [ ] Contact vendors for EMU compatibility confirmation

---

## Section 5: Migration Goals & Success Criteria (15 min)

### Defining Success

**Questions to Ask:**

1. **Primary drivers:**
   - What is the #1 reason you're migrating to EMU?
   - Who is the executive sponsor, and what do they care most about?
   - Are there compliance or audit requirements driving the timeline?

2. **Timeline and constraints:**
   - Is there a target completion date? What's driving it?
   - Are there blackout periods we need to avoid? (Code freezes, busy seasons)
   - Any dependencies on other projects? (IdP migrations, infrastructure changes)

3. **Risk tolerance:**
   - How do you feel about a phased rollout vs. big bang?
   - Which teams would be good candidates for early migration?
   - What would make you pause or roll back the migration?

4. **Success metrics:**
   - How will you measure migration success?
   - What does "done" look like?
   - Post-migration, what metrics matter? (Time to revoke access, user satisfaction, etc.)

### Success Criteria Documentation:

| Goal | Metric | Target | Owner |
|------|--------|--------|-------|
| Example: Security | Time to revoke access on termination | < 1 hour | |
| Example: Compliance | Audit findings related to access management | Zero | |
| | | | |
| | | | |
| | | | |

---

## Section 6: Next Steps & Action Items (10 min)

### Immediate Actions (Before Next Meeting)

| Action Item | Owner | Due Date |
|-------------|-------|----------|
| Run repository inventory (`gh-repo-stats`) | | |
| Document current organization structure | | |
| Confirm IdP administrator availability | | |
| Export installed GitHub Apps and OAuth apps | | |
| Review IdP group structure for team mapping | | |
| Identify pilot team for early migration | | |
| Schedule IdP configuration working session | | |

### Follow-Up Sessions to Schedule

1. **IdP Deep Dive** (60-90 min)
   - SCIM configuration walkthrough
   - Username normalization testing
   - Group-to-team mapping design

2. **Integration Compatibility Review** (60 min)
   - Review integration audit results
   - Identify EMU blockers
   - Plan remediation for incompatible integrations

3. **Migration Planning** (90 min)
   - Define migration waves
   - Create detailed timeline
   - Establish rollback criteria

### Open Questions Parking Lot

| Question | Owner to Research | Notes |
|----------|-------------------|-------|
| | | |
| | | |
| | | |

---

## Reference Materials

- [About Enterprise Managed Users](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/understanding-iam-for-enterprises/about-enterprise-managed-users)
- [Abilities and restrictions of managed user accounts](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts)
- [Configuring SCIM provisioning for EMU](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/provisioning-user-accounts-for-enterprise-managed-users/configuring-scim-provisioning-for-enterprise-managed-users)
- [Username considerations for external authentication](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/managing-iam-for-your-enterprise/username-considerations-for-external-authentication)

---

## Notes

*(Space for meeting notes)*
