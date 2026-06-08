---
layout: post
title:  "GitHub Actions Runners: Runner Groups and Azure Private Networking"
date: 2026-06-28 10:00:00 -0500
category: Blog
tags: [github, actions, enterprise, runner, azure, networking, security]
excerpt: "A comprehensive guide to configuring GitHub Actions runners, organizing them with runner groups, and securing CI/CD workflows with Azure Private VNet integration."
---

## Introduction

If you're running GitHub Actions at scale in an enterprise environment, you've probably hit the point where the standard GitHub-hosted runners just don't cut it. Maybe you need access to internal resources behind a firewall, custom hardware configurations, or tighter control over where your code runs. That's where self-hosted runners, runner groups, and Azure Private VNet integration come into play.

In this post, I'll walk you through setting up runners at the enterprise and organization level, organizing them with runner groups for better access control, and (the real fun part) connecting GitHub-hosted runners to your Azure Virtual Network for secure, private connectivity to your internal resources.

## Understanding Runner Types

Before diving into configuration, let's clarify the runner landscape:

### GitHub-Hosted Runners

These are managed by GitHub and come ready to use. They're ephemeral, meaning each job gets a fresh virtual machine. Great for most workloads, but limited when you need:

- Access to private networks or on-premises resources
- Custom software not available in the standard images
- Specific hardware requirements

### Self-Hosted Runners

You deploy and manage these on your own infrastructure. They can be physical machines, VMs, containers, or cloud instances. You get full control but also full responsibility for maintenance, updates, and security.

### Larger Runners (GitHub-Hosted)

Available on GitHub Team and Enterprise Cloud plans, these are beefier GitHub-hosted runners with more vCPUs and memory. The key benefit for this discussion: they support Azure Private VNet integration.

## Setting Up Enterprise Runners

Enterprise-level runners can be shared across all organizations in your enterprise. Here's the hierarchy to understand:

```text
Enterprise
├── Runner Groups (shared across orgs)
│   └── Runners
└── Organizations
    ├── Runner Groups (org-specific)
    │   └── Runners
    └── Repositories
        └── Runners (repo-specific)
```

### Step 1: Enable Actions at the Enterprise Level

First, ensure Actions is enabled for your organizations:

1. Go to your Enterprise settings
2. Navigate to **Policies** > **Actions**
3. Enable Actions for all organizations (or select specific ones)

### Step 2: Create an Enterprise Runner Group

Runner groups are containers that let you control which organizations and repositories can use specific runners.

1. In your Enterprise, go to **Policies** > **Actions** > **Runner groups**
2. Click **New runner group**
3. Name it something descriptive (e.g., `production-runners` or `private-network-runners`)
4. Select which organizations can access this group

### Step 3: Add a Runner to the Group

For self-hosted runners:

1. In the runner group, click **New runner**
2. Select your operating system
3. Follow the download and configuration instructions
4. During configuration, the runner automatically joins the group you created it from

For GitHub-hosted larger runners:

1. Click **New runner** > **New GitHub-hosted runner**
2. Configure the name, platform, image, and size
3. Select your runner group
4. Set the maximum job concurrency

## Organizing with Runner Groups

Runner groups are essential for managing access and organizing your runner fleet. Here's how to use them effectively:

### Access Control Patterns

**Pattern 1: Environment-Based Groups**

```text
├── development-runners (all repos)
├── staging-runners (selected orgs)
└── production-runners (restricted repos only)
```

**Pattern 2: Capability-Based Groups**

```text
├── general-purpose-runners
├── gpu-runners (ML/AI workloads)
├── high-memory-runners (large builds)
└── private-network-runners (internal access)
```

**Pattern 3: Compliance-Based Groups**

```text
├── public-runners (open source projects)
├── internal-runners (internal projects)
└── regulated-runners (SOC2/HIPAA workloads)
```

### Configuring Repository Access

At the organization level, you need to grant repositories access to enterprise runner groups:

1. Go to **Organization Settings** > **Actions** > **Runner groups**
2. Under "Shared by the Enterprise," select the runner group
3. Choose **All repositories** or **Selected repositories**

## Azure Private VNet Integration

This is where things get interesting. Azure Private VNet integration lets you run GitHub-hosted runners inside your Azure Virtual Network. This means your CI/CD jobs can access:

- Private databases and APIs
- On-premises resources via ExpressRoute or VPN
- Internal package registries and artifact stores
- Any resource within your VNet

### Prerequisites

Before you start, you'll need:

- GitHub Enterprise Cloud plan
- Azure subscription with Contributor and Network Contributor roles
- A supported Azure region (see the [official docs](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/configuring-private-networking-for-hosted-compute-products/about-azure-private-networking-for-github-hosted-runners-in-your-enterprise#about-supported-regions) for the full list)

### Step 1: Get Your Enterprise Database ID

You'll need this ID to configure the Azure resources. Use the GraphQL API:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" -X POST \
  -d '{ "query": "query($slug: String!) { enterprise (slug: $slug) { slug databaseId } }" ,
        "variables": {
          "slug": "YOUR_ENTERPRISE_SLUG"
        }
      }' \
https://api.github.com/graphql
```

Your token needs at least `read:enterprise` scope. Save the `databaseId` from the response.

### Step 2: Configure Azure Resources

GitHub provides a Bicep file with the necessary Network Security Group (NSG) rules. Save this as `actions-nsg-deployment.bicep`:

```bicep
@description('NSG for outbound rules')
param location string
param nsgName string = 'actions_NSG'

resource actions_NSG 'Microsoft.Network/networkSecurityGroups@2017-06-01' = {
  name: nsgName
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowVnetOutBoundOverwrite'
        properties: {
          protocol: 'TCP'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: 'VirtualNetwork'
          access: 'Allow'
          priority: 200
          direction: 'Outbound'
        }
      }
      {
        name: 'AllowStorageOutbound'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: 'Storage'
          access: 'Allow'
          priority: 230
          direction: 'Outbound'
        }
      }
      // Additional rules for GitHub IPs required
      // See official docs for complete IP list
    ]
  }
}
```

**Note:** The official Bicep file includes all required GitHub IP addresses. Get the complete file from the [GitHub documentation](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/configuring-private-networking-for-hosted-compute-products/configuring-private-networking-for-github-hosted-runners-in-your-enterprise#prerequisites).

### Step 3: Run the Azure Configuration Script

Here's the script to set up your Azure resources:

```bash
#!/bin/bash
set -e

# Configure these values
export AZURE_LOCATION=eastus
export SUBSCRIPTION_ID=your-subscription-id
export RESOURCE_GROUP_NAME=github-runners-rg
export VNET_NAME=github-runners-vnet
export SUBNET_NAME=github-runners-subnet
export NSG_NAME=github-runners-nsg
export NETWORK_SETTINGS_RESOURCE_NAME=github-network-settings
export DATABASE_ID=your-enterprise-database-id
export API_VERSION=2024-04-02

# Address space - adjust based on expected concurrency
# Add 30% buffer to max concurrent jobs
export ADDRESS_PREFIX=10.0.0.0/16
export SUBNET_PREFIX=10.0.0.0/24

# Login and set subscription
az login --output none
az account set --subscription $SUBSCRIPTION_ID

# Register the GitHub.Network resource provider
az provider register --namespace GitHub.Network

# Create resource group
az group create --name $RESOURCE_GROUP_NAME --location $AZURE_LOCATION

# Deploy NSG rules
az deployment group create \
  --resource-group $RESOURCE_GROUP_NAME \
  --template-file ./actions-nsg-deployment.bicep \
  --parameters location=$AZURE_LOCATION nsgName=$NSG_NAME

# Create VNet and subnet
az network vnet create \
  --resource-group $RESOURCE_GROUP_NAME \
  --name $VNET_NAME \
  --address-prefix $ADDRESS_PREFIX \
  --subnet-name $SUBNET_NAME \
  --subnet-prefixes $SUBNET_PREFIX

# Delegate subnet to GitHub.Network and apply NSG
az network vnet subnet update \
  --resource-group $RESOURCE_GROUP_NAME \
  --name $SUBNET_NAME \
  --vnet-name $VNET_NAME \
  --delegations GitHub.Network/networkSettings \
  --network-security-group $NSG_NAME

# Create network settings resource
az resource create \
  --resource-group $RESOURCE_GROUP_NAME \
  --name $NETWORK_SETTINGS_RESOURCE_NAME \
  --resource-type GitHub.Network/networkSettings \
  --properties "{ \"location\": \"$AZURE_LOCATION\", \"properties\" : { \"subnetId\": \"/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP_NAME/providers/Microsoft.Network/virtualNetworks/$VNET_NAME/subnets/$SUBNET_NAME\", \"businessId\": \"$DATABASE_ID\" }}" \
  --is-full-object \
  --output table \
  --query "{GitHubId:tags.GitHubId, name:name}" \
  --api-version $API_VERSION
```

The script outputs a `GitHubId`. Save this value for the next step.

### Step 4: Create the Network Configuration in GitHub

1. Go to your Enterprise **Settings** > **Hosted compute networking**
2. Click **New network configuration** > **Azure private network**
3. Name your configuration (e.g., `azure-eastus-private`)
4. Click **Add Azure Virtual Network**
5. Enter the `GitHubId` from the previous step
6. Click **Add Azure Virtual Network**

### Step 5: Create a Runner Group with Network Configuration

1. Go to **Settings** > **Actions** > **Runner groups**
2. Create a new runner group
3. Under **Network configurations**, select your new configuration
4. Set organization access policies
5. Click **Create group**

### Step 6: Add Larger Runners to the Group

1. Go to **Settings** > **Actions** > **Runners**
2. Click **New runner** > **New GitHub-hosted runner**
3. Configure the runner (name, platform, image, size)
4. Select the runner group you created with the network configuration
5. Click **Create runner**

## Using Private VNet Runners in Workflows

Reference your runners by the runner name in your workflow:

```yaml
jobs:
  build:
    runs-on: your-private-runner-name
    steps:
      - uses: actions/checkout@v4
      
      - name: Access internal resources
        run: |
          # This can now reach resources in your Azure VNet
          curl https://internal-api.yourcompany.local/health
          
      - name: Connect to private database
        run: |
          psql -h private-db.yourcompany.local -U app -d mydb -c "SELECT 1"
```

## Security Considerations

When using private VNet integration, keep these security practices in mind:

### Block Inbound Connections

GitHub never needs inbound connections to your runners. Block them explicitly:

```bicep
{
  name: 'DenyAllInbound'
  properties: {
    protocol: '*'
    sourcePortRange: '*'
    destinationPortRange: '*'
    sourceAddressPrefix: '*'
    destinationAddressPrefix: '*'
    access: 'Deny'
    priority: 4096
    direction: 'Inbound'
  }
}
```

### Use Private Repositories

If you're using static IPs, forks could potentially run malicious code on your runners via pull requests. Stick to private repos or use careful branch protection rules.

### Monitor Network Traffic

Enable Azure network logging to monitor all traffic to and from your runners:

```bash
az network watcher flow-log create \
  --resource-group $RESOURCE_GROUP_NAME \
  --name runner-flow-logs \
  --nsg $NSG_NAME \
  --storage-account your-storage-account \
  --enabled true
```

### Restrict Runner Group Access

Only grant access to repositories and organizations that genuinely need private network access.

## Troubleshooting

### Common Issues

**Runner not connecting:**
- Verify NSG rules allow outbound traffic to GitHub IPs
- Check that the GitHub.Network resource provider is registered
- Ensure subnet delegation is correctly configured

**Jobs stuck in queued state:**
- Verify runner group has the network configuration attached
- Check that repositories have access to the runner group
- Confirm runners are online and have capacity

**Network timeouts:**
- Review NSG rules for any blocking rules
- Verify internal resources are reachable from the VNet
- Check for any Azure Firewall or route table issues

### Cleanup

To delete everything and start fresh:

```bash
# First, delete the network configuration in GitHub UI

# Then delete Azure resources
az resource delete \
  -g $RESOURCE_GROUP_NAME \
  --name $NETWORK_SETTINGS_RESOURCE_NAME \
  --resource-type 'GitHub.Network/networkSettings' \
  --api-version $API_VERSION

# Delete the entire resource group
az group delete --resource-group $RESOURCE_GROUP_NAME --yes
```

## Summary

Setting up GitHub Actions runners with private VNet integration involves several moving parts, but the payoff is significant: you get the convenience of GitHub-hosted runners with secure access to your internal infrastructure.

**Key Takeaways:**

1. **Start with runner groups** - they're essential for organizing access control at scale
2. **Plan your network architecture** - size your subnet with 30% buffer above max concurrency
3. **Use the official Bicep templates** - don't try to recreate the NSG rules manually
4. **Test thoroughly** - verify internal connectivity before rolling out to production workflows
5. **Monitor everything** - enable network flow logs and review runner usage regularly

## Documentation Links

- [About self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners)
- [Managing larger runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-larger-runners/managing-larger-runners)
- [About Azure private networking](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/configuring-private-networking-for-hosted-compute-products/about-azure-private-networking-for-github-hosted-runners-in-your-enterprise)
- [Configuring private networking for GitHub-hosted runners](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/configuring-private-networking-for-hosted-compute-products/configuring-private-networking-for-github-hosted-runners-in-your-enterprise)
- [Controlling access to larger runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-larger-runners/controlling-access-to-larger-runners)

---

*Have questions about GitHub Actions runners or Azure private networking? Find me on [GitHub](https://github.com/jmassardo), [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), or [Bluesky](https://bsky.app/profile/jmassardo.bsky.social).*
