---
layout: post
title: "Git Worktrees: Work on Multiple Branches Without Losing Your Mind"
date: 2026-06-12 10:00:00 -0500
category: Blog
tags: [git, devops, developer-tools, automation, best-practices]
excerpt: "Git worktrees let you check out multiple branches simultaneously in separate directories. Here is why you should care and how to actually use them."
---

You are deep in a feature branch. Tests are passing, code is flowing, and you are in the zone. Then Slack pings: "Hey, can you review this PR? Also, there is a production bug that needs a hotfix." 

Now you have two choices. You can stash everything, switch branches, do the work, switch back, pop the stash, and pray nothing broke. Or you can just... open another directory that is already on the right branch.

That is what [git worktrees](https://git-scm.com/docs/git-worktree) do.

<!-- more -->

## What Are Worktrees?

Every git repo has a **main working tree** - that is the directory you cloned into. A worktree is an additional checkout of the same repository in a different directory, on a different branch, sharing the same `.git` data.

No second clone. No duplicate downloads. No syncing between copies. One repo, multiple checkouts.

```
~/code/my-app/                    # Main working tree (feature/auth branch)
├── .git/                         # All git data lives here
~/code/my-app-hotfix/             # Worktree (hotfix/login-bug branch)
~/code/my-app-review/             # Worktree (coworker/new-api branch)
```

All three directories share the same commits, tags, remotes, and history. But each has its own working directory and index. You can have different files open in different editors, run different builds, even run different test suites, all at the same time.

## The Basics

### Creating a Worktree

```bash
# Create a worktree for an existing branch
git worktree add ../my-app-hotfix hotfix/login-bug

# Create a worktree AND a new branch in one shot
git worktree add ../my-app-experiment -b experiment/new-cache-layer

# Create a worktree from a remote branch
git fetch origin
git worktree add ../my-app-review origin/coworker/new-api
```

The first argument is the **path** for the new directory. The second is the **branch** to check out. That is it.

**One rule:** each branch can only be checked out in one worktree at a time. Git enforces this to prevent conflicts.

### Listing Worktrees

```bash
git worktree list
```

Output:

```
/Users/you/code/my-app            abc1234 [main]
/Users/you/code/my-app-hotfix     def5678 [hotfix/login-bug]
/Users/you/code/my-app-review     ghi9012 [coworker/new-api]
```

### Removing a Worktree

When you are done with a worktree, clean it up:

```bash
# Remove a worktree (the directory must be clean)
git worktree remove ../my-app-hotfix

# Force remove if there are uncommitted changes
git worktree remove --force ../my-app-hotfix
```

### Pruning Stale Worktrees

If a worktree directory was deleted manually (not via `git worktree remove`), prune the stale references:

```bash
git worktree prune
```

## Practical Patterns

### Pattern 1: Hotfix Without Context Switching

You are on `feature/auth`. A production bug comes in.

```bash
# Create a worktree for the hotfix
git worktree add ../my-app-hotfix -b hotfix/login-bug main

# Open it in a new editor window
cd ../my-app-hotfix
code .

# Fix the bug, commit, push, open a PR
git add -A && git commit -m "Fix login redirect loop"
git push -u origin hotfix/login-bug

# Clean up when the PR is merged
cd ../my-app
git worktree remove ../my-app-hotfix
git branch -d hotfix/login-bug
```

Your feature branch is untouched. No stashing. No context switching. No mental overhead.

### Pattern 2: PR Review With a Running Build

You want to actually run a PR's code, not just read the diff.

```bash
# Check out the PR branch into a worktree
git fetch origin pull/42/head:pr-42
git worktree add ../my-app-pr42 pr-42

# Run it
cd ../my-app-pr42
npm install && npm test

# Done reviewing? Clean up.
cd ../my-app
git worktree remove ../my-app-pr42
git branch -D pr-42
```

### Pattern 3: Parallel AI Agents

This is the big one. Spin up multiple worktrees and point a separate AI agent at each one. Each agent works on its own branch, in its own directory, with zero risk of conflicts.

```bash
# Create worktrees for parallel AI tasks
git worktree add ../my-app-task-1 -b agent/add-tests
git worktree add ../my-app-task-2 -b agent/refactor-api
git worktree add ../my-app-task-3 -b agent/update-docs

# Point your AI tool at each worktree (in separate terminals or containers)
cd ../my-app-task-1 && copilot --autopilot -p "Write tests for the auth module"
cd ../my-app-task-2 && copilot --autopilot -p "Refactor the API layer to use middleware"
cd ../my-app-task-3 && copilot --autopilot -p "Add JSDoc to all exported functions"
```

Three agents, three branches, zero conflicts.

### Pattern 4: Compare Two Branches Side by Side

Need to compare how something works on two different branches?

```bash
git worktree add ../my-app-v2 feature/v2-api

# Now open both directories in your editor and compare directly
# No more switching back and forth
```

## Merging the Work Back

Once work is done in a worktree, the branch exists in your shared git history. Merging is the same as any other branch.

### Option A: Merge Locally

```bash
# From your main working tree
cd ~/code/my-app
git checkout main

git merge agent/add-tests
git merge agent/refactor-api
git merge agent/update-docs
```

If there are conflicts, resolve them one branch at a time. Since the agents were working on separate areas, conflicts should be minimal.

### Option B: Push and Open PRs

```bash
# From each worktree, push the branch
cd ../my-app-task-1 && git push -u origin agent/add-tests
cd ../my-app-task-2 && git push -u origin agent/refactor-api
cd ../my-app-task-3 && git push -u origin agent/update-docs

# Open PRs via GitHub CLI
gh pr create --base main --head agent/add-tests --title "Add auth module tests"
gh pr create --base main --head agent/refactor-api --title "Refactor API to middleware"
gh pr create --base main --head agent/update-docs --title "Add JSDoc documentation"
```

PRs give you code review, CI checks, and an audit trail. This is the safer choice for anything you did not directly supervise.

### Cleanup Script

Here is a quick helper to tear down all your agent worktrees at once:

```bash
#!/bin/bash
# cleanup-worktrees.sh
# Remove all worktrees with "agent/" branches

git worktree list --porcelain | grep "^worktree " | while read -r _ path; do
    branch=$(cd "$path" && git branch --show-current 2>/dev/null)
    if [[ "$branch" == agent/* ]]; then
        echo "Removing worktree: $path (branch: $branch)"
        git worktree remove "$path" --force
        git branch -D "$branch" 2>/dev/null
    fi
done

git worktree prune
echo "Done. Remaining worktrees:"
git worktree list
```

## Things to Watch Out For

- **Shared `.git` data** - All worktrees share the same git objects, refs, and config. A `git gc` in one worktree affects all of them.
- **`node_modules` and build artifacts** - Each worktree needs its own `npm install` or equivalent. Dependencies are not shared across worktrees.
- **Disk space** - Worktrees are lightweight (they share git objects), but each one has its own copy of the working files. For large repos with big assets, this can add up.
- **IDE state** - Some editors/IDEs get confused when the same repo has multiple checkouts. VS Code handles it well. Your mileage may vary.
- **Branch locking** - A branch can only be checked out in one worktree at a time. If you try to add a worktree for a branch that is already checked out, git will refuse.

## Quick Reference

```bash
# Create worktree (existing branch)
git worktree add <path> <branch>

# Create worktree (new branch from current HEAD)
git worktree add <path> -b <new-branch>

# Create worktree (new branch from specific base)
git worktree add <path> -b <new-branch> <base>

# List all worktrees
git worktree list

# Remove a worktree
git worktree remove <path>

# Force remove
git worktree remove --force <path>

# Prune stale worktrees
git worktree prune
```

## Summary and Key Takeaways

Git worktrees solve a simple problem: **you need to be on multiple branches at the same time**. Whether that is a hotfix interrupting your feature work, a PR review you want to run locally, or three AI agents working in parallel, worktrees keep everything clean and isolated.

**Here is your action plan:**

- **Stop stashing and switching.** Use worktrees for any task that pulls you off your current branch.
- **Use the `-b` flag** to create branches and worktrees in one command.
- **Clean up when you are done.** `git worktree remove` is your friend. Run `git worktree prune` periodically.
- **Combine with containers** for AI agent workflows. Each agent gets its own worktree and its own sandbox.
- **Push branches and open PRs** for anything you want reviewed before merging.

Worktrees have been in git since version 2.5 (2015) and most developers have never heard of them. That changes today.
