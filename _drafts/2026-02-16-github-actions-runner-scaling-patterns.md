---
layout: post
title: "GitHub Actions Runner Scaling Patterns: GitHub-Hosted vs ARC"
date: 2026-02-16 10:00:00 -0500
category: Blog
tags: [github, actions, runners, kubernetes, arc, scaling, devops]
excerpt: "Scaling GitHub Actions runners requires different architectural patterns depending on whether you're using GitHub-hosted runners or Actions Runner Controller. Here's why the approaches are essentially opposite—and how to get each one right."
---

## Introduction

When organizations start scaling GitHub Actions, they inevitably hit the question: how do we organize and scale our runners effectively? The answer depends entirely on which runner infrastructure you're using—and here's the fun part: the best practices are essentially backwards from each other.

If you're using GitHub-hosted runners (including larger runners with private networking), the pattern is: **create runners, organize them into groups, and direct workflows to the appropriate group**.

If you're using Actions Runner Controller (ARC) on Kubernetes, the pattern is: **create multiple clusters with the same runner scale set name but different runner groups**.

Let's break down why these patterns exist and how to implement each one correctly.

---

## Understanding the Core Difference

The fundamental distinction comes down to where scaling happens and who controls it.

### GitHub-Hosted Runners

GitHub manages the infrastructure. You define runner configurations, set concurrency limits, and organize runners into groups. GitHub handles provisioning, scaling, and cleanup. Your job is to direct workflows to the right resources.

**Scaling model**: GitHub scales runners based on demand within your configured limits. You control access and routing through runner groups.

### Actions Runner Controller (ARC)

You manage the infrastructure. ARC runs on your Kubernetes clusters and provisions runner pods on demand. You control everything: cluster sizing, node pools, pod specs, and autoscaling behavior.

**Scaling model**: You scale by deploying more clusters or increasing node capacity. ARC handles pod lifecycle within each cluster.

---

## Pattern 1: GitHub-Hosted Runners

### The Architecture

With GitHub-hosted runners, the scaling pattern follows a top-down approach:

```text
Enterprise
└── Runner Groups (access control layer)
    └── Runners (capacity layer)
        └── Workflows (consumption layer)
```

You create runners with specific configurations (OS, size, software, networking), assign them to runner groups, and grant organizations/repositories access to those groups. Workflows then target groups by name.

### Best Practice: Direct Workflows to Runner Groups

The key insight: **workflows should target runner groups, not individual runner names**.

```yaml
# Good: Target the runner group
jobs:
  build:
    runs-on:
      group: production-linux-runners

# Also good: Target group with labels
jobs:
  build:
    runs-on:
      group: production-linux-runners
      labels: [ubuntu-latest, 4-core]
```

Why runner groups instead of runner names?

1. **Flexibility**: Add or remove runners from a group without changing workflows
2. **Access control**: Manage which orgs/repos can use which resources
3. **Failover**: If one runner is busy, jobs route to another in the group
4. **Maintenance**: Take runners offline for updates without workflow changes

### Organizing Runner Groups

Structure your groups around access patterns and capabilities:

```text
Enterprise Runner Groups
├── general-purpose (all orgs, public repos)
├── private-network (selected orgs, internal resources)
├── high-compute (selected repos, large builds)
└── production-deploy (restricted repos, deployment access)
```

Each group can contain multiple runners with the same or different configurations. The group is your unit of access control; the runners are your unit of capacity.

### Scaling GitHub-Hosted Runners

To scale capacity:

1. **Increase concurrency limits** on existing runners
2. **Add more runners** to existing groups
3. **Create new groups** for new access patterns or capabilities

The scaling lever is always on the runner/group side, not the workflow side.

---

## Pattern 2: Actions Runner Controller (ARC)

### The Architecture

With ARC, the scaling pattern is essentially inverted:

```text
Kubernetes Clusters (capacity layer)
└── Runner Scale Sets (identity layer)
    └── Runner Groups (access control layer)
        └── Workflows (consumption layer)
```

Here's the critical difference: you create **multiple clusters with the same runner scale set name** but register them to **different runner groups**.

### Why This Pattern?

ARC's scaling is tied to Kubernetes cluster capacity. Each cluster has:

- Node limits (how many VMs can run)
- Pod density limits (runners per node)
- Resource constraints (CPU, memory per runner)

When you hit a cluster's capacity, you can't just "add more runners" like you can with GitHub-hosted. You need to add more clusters or scale node capacity. But here's the problem: if every cluster has a uniquely named scale set, your workflows need to know which cluster to target.

The solution: **same scale set name across clusters, different runner groups**.

This is explicitly supported in the [official documentation](https://docs.github.com/en/enterprise-cloud@latest/actions/tutorials/use-actions-runner-controller/deploy-runner-scale-sets#high-availability-and-automatic-failover):

> Runner scale set names are unique within the runner group they belong to. If you want to deploy multiple runner scale sets with the same name, they must belong to different runner groups.

### Best Practice: Consistent Names, Different Groups

Using the official Helm chart configuration:

```yaml
# Cluster A - Region: East US (values-east.yaml)
runnerScaleSetName: "arc-linux-runners"
runnerGroup: "arc-cluster-east"
githubConfigUrl: "https://github.com/your-org"

maxRunners: 30
minRunners: 2

template:
  spec:
    containers:
      - name: runner
        image: ghcr.io/actions/actions-runner:latest
        resources:
          limits:
            cpu: "2"
            memory: "4Gi"
```

```yaml
# Cluster B - Region: West US (values-west.yaml)
runnerScaleSetName: "arc-linux-runners"  # Same name!
runnerGroup: "arc-cluster-west"          # Different group!
githubConfigUrl: "https://github.com/your-org"

maxRunners: 30
minRunners: 2

template:
  spec:
    containers:
      - name: runner
        image: ghcr.io/actions/actions-runner:latest
        resources:
          limits:
            cpu: "2"
            memory: "4Gi"
```

Deploy each with Helm:

```bash
# Cluster A
helm install arc-linux-runners \
  --namespace arc-runners \
  --values values-east.yaml \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set

# Cluster B
helm install arc-linux-runners \
  --namespace arc-runners \
  --values values-west.yaml \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set
```

### How It Works: Job Distribution

When both scale sets are online, jobs assigned to either runner group will be distributed arbitrarily (assignment race). You cannot configure the job assignment algorithm—GitHub handles this. If one cluster goes down, the scale set in the other cluster continues acquiring jobs without any intervention.

This gives you:
- **High availability**: Cluster failure doesn't stop your pipelines
- **Geographic distribution**: Run jobs closer to your resources
- **Capacity headroom**: Scale by adding clusters, not reconfiguring workflows

### How Workflows Target ARC Runners

With this pattern, workflows can target either:

**Option A: Target a specific cluster via runner group**

```yaml
jobs:
  build:
    runs-on:
      group: arc-cluster-east
      labels: [self-hosted, linux, x64]
```

**Option B: Target the scale set name directly**

If both runner groups have access to the same repos, you can use the scale set name in `runs-on`:

```yaml
jobs:
  build:
    runs-on: arc-linux-runners
```

Jobs will be picked up by whichever cluster has capacity first.

**Option C: Create a parent runner group**

Create a runner group at the enterprise level that includes both regional groups, then target that:

```yaml
jobs:
  build:
    runs-on:
      group: arc-all-regions
```

### Scaling ARC

To scale capacity:

1. **Adjust `maxRunners`/`minRunners`** in your Helm values
2. **Scale Kubernetes nodes** in existing clusters
3. **Deploy additional clusters** with the same scale set name (different runner group)
4. **Add runner groups to the same parent group** for unified workflow targeting

The scaling lever is on the infrastructure side (clusters), not the workflow side.

---

## Comparing the Patterns

| Aspect | GitHub-Hosted | ARC |
|--------|---------------|-----|
| **Scaling unit** | Runner/concurrency | Kubernetes cluster + `maxRunners` |
| **Identity granularity** | Individual runner | Scale set name (unique per group) |
| **Access control** | Runner groups | Runner groups |
| **Workflow targeting** | Group name (recommended) | Group name or scale set name |
| **Adding capacity** | Add runners to group | Add clusters with same scale set name |
| **Who manages infra** | GitHub | You |
| **Autoscaling** | Automatic (GitHub-managed) | Listener-based (within `minRunners`/`maxRunners`) |
| **HA pattern** | Multiple runners in group | Same name, different groups across clusters |

### Mental Model

**GitHub-hosted**: Think of runner groups as pools. You fill pools with runners. Workflows draw from pools.

**ARC**: Think of clusters as capacity zones. You name zones consistently. Runner groups aggregate zones. Workflows target groups.

---

## Common Anti-Patterns

### GitHub-Hosted Anti-Patterns

**❌ Targeting specific runner names in workflows**

```yaml
# Bad: Coupled to specific runner
runs-on: my-specific-runner-name
```

This creates brittleness. If that runner goes offline, jobs fail. Use groups instead.

**❌ One runner per group**

Creates unnecessary management overhead and eliminates failover benefits.

**❌ Ignoring concurrency limits**

Queued jobs aren't scaling—they're waiting. Monitor queue depth and increase concurrency.

### ARC Anti-Patterns

**❌ Unique scale set names per cluster without runner groups**

```yaml
# Bad: Now workflows need to know cluster details
# Cluster A values.yaml
runnerScaleSetName: "linux-runners-east"
# Cluster B values.yaml  
runnerScaleSetName: "linux-runners-west"
```

This leaks infrastructure details into workflows and complicates scaling. When you add Cluster C, you have to update workflows.

**❌ Same runner group for multiple scale sets with the same name**

Per the docs: "Runner scale set names are unique within the runner group they belong to." You'll get registration conflicts.

**❌ Single cluster for all workloads**

You'll hit Kubernetes limits (nodes, pods, API server) before you hit GitHub's job limits. Plan for multi-cluster from the start.

**❌ Ignoring `maxRunners` and `minRunners`**

Without `maxRunners`, a burst of jobs can overwhelm your cluster. Without `minRunners`, cold starts delay job pickup. Tune these based on your workload patterns.

**❌ No runner groups, just labels**

Labels work for routing but don't give you the access control granularity of groups. Use runner groups to control which orgs/repos can use which scale sets.

---

## Hybrid Scenarios

Many enterprises use both GitHub-hosted and ARC runners. The patterns still apply—just keep them separate:

```yaml
jobs:
  build:
    runs-on:
      group: github-hosted-builders  # GitHub-hosted
  
  deploy:
    runs-on:
      group: arc-production-cluster  # ARC in private network
    needs: build
```

Use GitHub-hosted for general compute and ARC for specialized workloads requiring:

- Private network access
- Custom hardware (GPUs, ARM)
- Specific compliance requirements
- Cost optimization at scale

As a best practice from the [ARC documentation](https://docs.github.com/en/enterprise-cloud@latest/actions/tutorials/use-actions-runner-controller/deploy-runner-scale-sets#using-arc-across-organizations): create a unique namespace for each organization, or even each runner scale set, to maximize isolation and security.

---

## Takeaways

- **GitHub-hosted**: Create runners, organize into groups, target groups from workflows. Scale by adding runners or increasing concurrency.
- **ARC**: Create clusters with consistent scale set names, assign to different runner groups, target groups from workflows. Scale by adding clusters.
- **Both patterns**: Runner groups are your access control and routing layer. Use them consistently.
- **Key insight**: ARC scale set names must be unique *within a runner group*, not globally. This enables the multi-cluster HA pattern.
- **Avoid**: Coupling workflows to specific runner names or infrastructure details. Let groups abstract the underlying capacity.

The patterns are opposite because the scaling models are opposite. GitHub-hosted scales within a managed platform; ARC scales across your managed clusters. Once you internalize this difference, the best practices make sense.
