---
layout: post
title: "Continuous Delivery with GitHub Actions: From Green Build to Production"
date: 2026-05-11 10:00:00 -0500
category: Blog
tags: [github, github-actions, ci-cd, devops, automation, best-practices]
excerpt: "Your CI pipeline builds and tests your code. Now what? Here's how to build reliable, safe continuous delivery workflows with GitHub Actions."
---

You've got CI nailed. Your tests run, your builds pass, your artifacts get packaged. Every pull request gets a green checkmark before it merges.

Now comes the hard part: getting that code to production safely, consistently, and without someone manually clicking buttons at 3 PM on a Friday. Because nothing kills momentum like a merge-to-main-to-Slack-DM-to-manual-SSH-to-fingers-crossed deployment process.

This post covers how to build continuous delivery (CD) pipelines with GitHub Actions. We're not starting from scratch - we're picking up where your CI pipeline ends and carrying that artifact all the way to production. If you already have workflows that test, build, and package your code, you're in the right place.

## CI vs. CD: Where One Ends and the Other Begins

These two get conflated constantly, so let's draw a clear line:

| CI (you already have this) | CD (what we're building) |
|---------------------------|--------------------------|
| Run tests | Deploy to environments |
| Build artifacts | Manage environment promotion |
| Package releases | Handle approvals and gates |
| Lint and scan | Roll back when things break |
| Validate PRs | Manage secrets and credentials |

Your CI pipeline answers "is this code safe to ship?" Your CD pipeline answers "how do we ship it safely?"

The distinction matters because the concerns are fundamentally different. CI is about code correctness - does it compile, do the tests pass, are there linting violations? CD is about operational safety - who approved this, which environment is it going to, what happens if it fails, and can we undo it?

Mixing both into one massive workflow file is tempting but creates a maintenance headache. Keep them separate. Let CI focus on validation and CD focus on delivery. They connect through artifacts.

## The Core Pattern: Build Once, Deploy Many

The most important CD principle: **build your artifact once, then deploy that same artifact to every environment.** Don't rebuild for staging. Don't rebuild for production. The thing you tested is the thing you ship.

This sounds obvious, but it's surprisingly common to see pipelines that run `npm run build` or `docker build` separately for each environment. Every rebuild is a chance for something to drift - a different dependency version gets pulled, an environment variable changes the output, a flaky build step produces a slightly different result. You end up deploying something to production that isn't exactly what you tested in staging. That defeats the entire purpose of having a staging environment.

The pattern is straightforward: your CI workflow produces an artifact, uploads it, and then your CD workflow downloads that exact artifact for each deployment target.

Here's what the CI side looks like (you probably have something similar already):

{% raw %}
```yaml
# .github/workflows/ci.yml - Your existing CI (simplified)
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and test
        run: |
          npm ci
          npm test
          npm run build
      - name: Upload artifact
        if: github.ref == 'refs/heads/main'
        uses: actions/upload-artifact@v4
        with:
          name: app-${{ github.sha }}
          path: dist/
          retention-days: 30
```
{% endraw %}

That uploaded artifact is now the single source of truth for this commit. Every deployment downstream pulls this exact artifact - no rebuilding, no "works on my machine" surprises. The `retention-days: 30` gives you a window to redeploy or roll back to any recent build without re-running CI.

For container-based deployments, the equivalent is pushing a Docker image tagged with the commit SHA to a registry. Same principle - build once, tag immutably, pull that exact image in every environment.

## Structuring Your Deployment Workflow

Now for the actual deployment workflow. You have two main approaches here, and which one you pick depends on how many environments you're managing and how much consistency you need across them.

### Option 1: Single Workflow with Environment Jobs

For simpler setups (two or three environments in a linear promotion path), chain deployments in a single workflow using GitHub Environments. Each job targets a different environment and depends on the previous one succeeding.

The `workflow_run` trigger connects this to your CI pipeline - it fires when your CI workflow completes on the `main` branch. The `if` condition ensures you only deploy when CI actually passed (not on failures or cancellations).

{% raw %}
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  workflow_run:
    workflows: ["CI"]
    branches: [main]
    types: [completed]

jobs:
  deploy-staging:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v4
        with:
          name: app-${{ github.event.workflow_run.head_sha }}
          run-id: ${{ github.event.workflow_run.id }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
      - name: Deploy to staging
        run: ./scripts/deploy.sh staging
        env:
          DEPLOY_KEY: ${{ secrets.STAGING_DEPLOY_KEY }}

  smoke-test-staging:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run smoke tests
        run: ./scripts/smoke-test.sh https://staging.example.com

  deploy-production:
    needs: smoke-test-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v4
        with:
          name: app-${{ github.event.workflow_run.head_sha }}
          run-id: ${{ github.event.workflow_run.id }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
      - name: Deploy to production
        run: ./scripts/deploy.sh production
        env:
          DEPLOY_KEY: ${{ secrets.PROD_DEPLOY_KEY }}
```
{% endraw %}

Notice the flow: deploy to staging, run smoke tests against staging, and only then proceed to production. The `needs` keyword creates the dependency chain. If smoke tests fail, the production deployment never starts.

The `environment: production` key on the production job is doing heavy lifting here. It gates the deployment behind whatever protection rules you've configured (required reviewers, wait timers, branch restrictions). We'll cover that in detail in the next section.

This approach works well when your deployment logic is similar across environments and you have a straightforward promotion path. But if you're deploying to five environments, or your dev/staging/production deployments have different steps, the single workflow file gets unwieldy fast.

### Option 2: Reusable Workflow for Multi-Environment Deployments

For more complex setups, or when you want guaranteed consistency across environments, create a reusable deployment workflow and call it per environment. This uses `workflow_call`, which lets one workflow act as a callable function for others.

First, define the reusable workflow with inputs for everything that varies between environments:

{% raw %}
```yaml
# .github/workflows/deploy-to-env.yml
name: Deploy to Environment
on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
      artifact-name:
        required: true
        type: string
      url:
        required: true
        type: string
    secrets:
      deploy-key:
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: ${{ inputs.environment }}
      url: ${{ inputs.url }}
    steps:
      - uses: actions/checkout@v4
      - name: Download artifact
        uses: actions/download-artifact@v4
        with:
          name: ${{ inputs.artifact-name }}
      - name: Deploy
        run: ./scripts/deploy.sh ${{ inputs.environment }}
        env:
          DEPLOY_KEY: ${{ secrets.deploy-key }}

  smoke-test:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run smoke tests
        run: ./scripts/smoke-test.sh ${{ inputs.url }}
```
{% endraw %}

Then your orchestration workflow becomes clean and readable. It calls the same reusable workflow for each environment, just passing different inputs and secrets:

{% raw %}
```yaml
# .github/workflows/cd.yml
name: CD Pipeline
on:
  workflow_run:
    workflows: ["CI"]
    branches: [main]
    types: [completed]

jobs:
  staging:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    uses: ./.github/workflows/deploy-to-env.yml
    with:
      environment: staging
      artifact-name: app-${{ github.event.workflow_run.head_sha }}
      url: https://staging.example.com
    secrets:
      deploy-key: ${{ secrets.STAGING_DEPLOY_KEY }}

  production:
    needs: staging
    uses: ./.github/workflows/deploy-to-env.yml
    with:
      environment: production
      artifact-name: app-${{ github.event.workflow_run.head_sha }}
      url: https://example.com
    secrets:
      deploy-key: ${{ secrets.PROD_DEPLOY_KEY }}
```
{% endraw %}

The reusable workflow approach has a few advantages worth calling out. First, your deployment logic is defined in exactly one place. If you need to add a step (say, notifying a monitoring system), you change it once and every environment gets it. Second, it forces consistency - staging and production follow the exact same steps, which means staging is actually testing your deployment process, not just your code. Third, it's easier to test changes to the deployment process itself - you can modify the reusable workflow and see the effects in a lower environment before it reaches production.

## GitHub Environments: Your Deployment Safety Net

[GitHub Environments](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment) are the backbone of CD in Actions. They give you protection rules, scoped secrets, and deployment history - all without third-party tools.

If you're not using environments yet, you're missing out on the most powerful CD feature Actions has. An environment is essentially a named deployment target with configurable guardrails. When a job references an environment, GitHub enforces whatever rules you've configured before the job is allowed to run.

### Setting Up Environments

Go to **Settings > Environments** in your repo and create environments for each deployment target (staging, production, etc.). Then configure protection rules. Here's what each rule does and when to use it:

**Required reviewers:** Specify team members who must approve before a deployment proceeds. When the workflow hits a job targeting this environment, it pauses and sends a notification to the reviewers. The job won't start until someone approves it. Use this for production. Skip it for dev/staging if your automated tests are solid - you don't want humans blocking every staging deploy when the whole point is fast feedback.

**Wait timer:** Add a delay between approval and deployment. This sounds weird, but it's useful for production deployments during business hours. Someone approves the deploy, then there's a 5-minute window where anyone on the team can see the notification and raise a concern. Think of it as a "speak now or forever hold your peace" buffer.

**Deployment branches and tags:** Restrict which branches can deploy to an environment. This is your last line of defense against accidents. Production should only accept `main` (or your release branch). Staging might accept `main` and `release/*`. A rogue feature branch should never be able to target production, no matter what the workflow file says.

Here's what a well-configured production environment looks like:

```
Production environment rules:
  ├── Required reviewers: @platform-team (1 required)
  ├── Wait timer: 5 minutes
  ├── Branch policy: main only
  └── Secrets: PROD_DEPLOY_KEY, PROD_DB_URL
```

### Environment Secrets

Each environment gets its own secrets, and this is a big deal for security. Your staging deploy key is only available to jobs targeting the staging environment. A compromised dev workflow, a malicious PR, or a misconfigured action can't access production credentials because those secrets simply don't exist outside the production environment context.

This is a meaningful step up from repo-level secrets, where any workflow job can access any secret. With environment-scoped secrets, the blast radius of a compromised secret is limited to that one environment.

{% raw %}
```yaml
# This job can ONLY access staging secrets
deploy-staging:
  environment: staging  # <-- scopes the available secrets
  steps:
    - run: ./deploy.sh
      env:
        # Only available because environment is 'staging'
        DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
```
{% endraw %}

## Deployment Strategies

How you actually cut over traffic to the new version matters a lot. The right strategy depends on your risk tolerance, your infrastructure, and how quickly you need to recover if something goes wrong. Here are the three most common approaches.

### Rolling Deployments

The simplest approach - gradually replace instances of the old version with the new one. Your orchestrator (Kubernetes, ECS, etc.) handles the mechanics: spin up new instances, health check them, drain connections from old instances, shut them down.

The trade-off is straightforward: during the rollout, both old and new versions are serving traffic simultaneously. If your change includes a database migration or an API contract change, you need to make sure both versions can coexist.

{% raw %}
```yaml
- name: Deploy (rolling)
  run: |
    kubectl set image deployment/app \
      app=${{ env.IMAGE }}:${{ github.sha }} \
      --record
    kubectl rollout status deployment/app --timeout=300s
```
{% endraw %}

Good for: services with graceful shutdown handling, stateless apps, teams that want simplicity.

The `kubectl rollout status` command is doing important work here - it waits for the rollout to complete and exits with a non-zero code if it fails. That means your workflow step will fail if the rollout fails, which you can catch in subsequent steps to trigger a rollback.

### Blue-Green Deployments

Blue-green maintains two identical environments: one active (serving traffic) and one idle. You deploy to the idle environment, run your validations against it in isolation, and then switch traffic over all at once.

The beauty of this approach is the rollback story. If something goes wrong after the switch, you flip traffic back to the previous environment. No redeployment, no waiting for instances to spin up - the old version is still running and ready to go.

The downside is cost: you're paying for two full environments at all times. For many teams, that trade-off is worth it for the rollback speed.

{% raw %}
```yaml
- name: Determine target slot
  id: slot
  run: |
    ACTIVE=$(curl -s https://example.com/health | jq -r '.slot')
    if [ "$ACTIVE" = "blue" ]; then
      echo "target=green" >> "$GITHUB_OUTPUT"
    else
      echo "target=blue" >> "$GITHUB_OUTPUT"
    fi

- name: Deploy to inactive slot
  run: ./scripts/deploy.sh ${{ steps.slot.outputs.target }}

- name: Smoke test inactive slot
  run: ./scripts/smoke-test.sh https://${{ steps.slot.outputs.target }}.example.com

- name: Switch traffic
  run: ./scripts/switch-traffic.sh ${{ steps.slot.outputs.target }}
```
{% endraw %}

Good for: zero-downtime requirements, services where fast rollback is critical.

The key step in this workflow is the smoke test against the inactive slot. You're validating the new deployment in complete isolation - real infrastructure, real config, but zero user traffic. Only after that validation passes do you switch the router. If the smoke test fails, the workflow stops and your users never saw the broken version.

### Canary Deployments

Canary is the most cautious approach. You deploy the new version alongside the old one but only route a small percentage of traffic to it (typically 5-10%). Then you watch the metrics. If error rates stay flat and latency looks normal, you gradually increase the traffic percentage until the new version is handling everything.

This gives you real production data about the new version's behavior before committing fully. The trade-off is complexity - you need traffic splitting infrastructure and monitoring that can distinguish between canary and baseline metrics.

{% raw %}
```yaml
- name: Deploy canary (10% traffic)
  run: |
    ./scripts/deploy-canary.sh --version ${{ github.sha }} --weight 10

- name: Monitor canary (5 minutes)
  run: |
    ./scripts/monitor-canary.sh \
      --duration 300 \
      --error-threshold 1.0 \
      --latency-p99-threshold 500

- name: Promote or rollback
  if: success()
  run: ./scripts/promote-canary.sh --version ${{ github.sha }}

- name: Rollback canary
  if: failure()
  run: ./scripts/rollback-canary.sh
```
{% endraw %}

Good for: high-traffic services, risk-sensitive deployments, when you need production data before committing.

The `monitor-canary.sh` script in this example is where the real magic happens - it's watching your metrics system (Datadog, Prometheus, CloudWatch, whatever you use) and comparing the canary's error rate and latency against the baseline. If the canary exceeds your thresholds, the monitoring step fails, the `if: success()` condition on the promote step is false, and the `if: failure()` rollback step runs instead. All automated, no human staring at dashboards required.

### Which Strategy Should You Pick?

Start simple. Rolling deployments work for most services and don't require extra infrastructure. Move to blue-green when you need faster rollbacks. Move to canary when you need production validation before full rollout.

You can also mix strategies - use rolling for low-risk internal services and canary for your customer-facing API. The strategy should match the risk profile of the service, not be a one-size-fits-all decision.

Regardless of which strategy you choose, you need a plan for when things go wrong. That brings us to the most underinvested part of most CD pipelines.

## Automated Rollbacks

Deployments fail. That's not pessimism, it's planning. A config change that looked fine in staging might behave differently under production load. A dependency might time out. A database migration might lock a table longer than expected.

The question isn't whether deployments will fail - it's how fast you recover when they do. Build rollback into your pipeline, not into a runbook that someone has to find and follow at 2 AM.

### Health Check Based Rollback

The most common pattern: deploy, then immediately verify the application is healthy. If the health check fails after a few retries, automatically roll back to the previous version. No human intervention, no Slack threads, no panic.

The trick here is the retry loop. A single failed health check might just mean the app is still starting up. You want to give it a reasonable window (in this example, 10 attempts with 10-second gaps) before declaring the deployment failed. But you also don't want to wait forever while users are getting errors.

```yaml
- name: Deploy
  id: deploy
  run: ./scripts/deploy.sh production

- name: Verify deployment health
  id: health
  run: |
    for i in $(seq 1 10); do
      STATUS=$(curl -s -o /dev/null -w '%{http_code}' https://example.com/health)
      if [ "$STATUS" != "200" ]; then
        echo "Health check failed (attempt $i/10)"
        sleep 10
        continue
      fi
      echo "healthy=true" >> "$GITHUB_OUTPUT"
      exit 0
    done
    echo "healthy=false" >> "$GITHUB_OUTPUT"
    exit 1

- name: Rollback on failure
  if: failure() && steps.deploy.outcome == 'success'
  run: |
    echo "::error::Deployment health check failed - rolling back"
    ./scripts/rollback.sh production
```

The `if: failure() && steps.deploy.outcome == 'success'` condition is important. You only want to roll back if the deployment itself succeeded but the health check failed. If the deployment step itself failed (maybe the deploy script errored), there's nothing to roll back because the new version never went live.

### Keep Track of What to Roll Back To

This seems obvious but gets missed surprisingly often: before you deploy the new version, record what's currently running. If you need to roll back, you need to know what "back" means.

For Kubernetes deployments, you can query the current image before overwriting it:
{% raw %}
```yaml
- name: Record previous version
  id: previous
  run: |
    CURRENT=$(kubectl get deployment app -o jsonpath='{.spec.template.spec.containers[0].image}')
    echo "image=$CURRENT" >> "$GITHUB_OUTPUT"

- name: Deploy new version
  run: kubectl set image deployment/app app=${{ env.IMAGE }}:${{ github.sha }}

- name: Rollback if needed
  if: failure()
  run: kubectl set image deployment/app app=${{ steps.previous.outputs.image }}
```
{% endraw %}

For non-containerized deployments, the equivalent might be recording the current release symlink target, the current S3 path, or the last-known-good artifact name. Whatever your deployment mechanism is, capture the current state before you change it.

## Managing Secrets and Credentials

Your CD pipeline needs credentials to deploy - cloud provider access, database URLs, API keys, deploy tokens. How you manage those credentials is one of the most security-critical parts of your pipeline.

### Use OIDC for Cloud Providers

Stop storing long-lived cloud credentials as GitHub secrets. Seriously. Long-lived access keys are a liability - they can be leaked, they don't expire, and revoking them is a fire drill.

Instead, use [OpenID Connect (OIDC)](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect) to get short-lived tokens. GitHub Actions acts as an identity provider, and your cloud provider trusts it to issue tokens scoped to specific repos, branches, and environments. The tokens last for the duration of the job and expire automatically.

```yaml
permissions:
  id-token: write
  contents: read

steps:
  - name: Authenticate to AWS
    uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789:role/github-deploy
      aws-region: us-east-1
```

{% raw %}
```yaml
  - name: Authenticate to Azure
    uses: azure/login@v2
    with:
      client-id: ${{ secrets.AZURE_CLIENT_ID }}
      tenant-id: ${{ secrets.AZURE_TENANT_ID }}
      subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```
{% endraw %}

No static keys to rotate. Tokens expire after the job completes. The OIDC trust policy on the cloud side restricts which repos, branches, and environments can assume the role - so even if someone forks your repo, they can't use your cloud credentials.

Setting up OIDC requires a one-time configuration on both sides (creating an identity provider in your cloud account and a trust policy), but after that, your workflows are simpler and more secure.

### Scope Secrets to Environments

For credentials that can't use OIDC (third-party APIs, deploy keys, database passwords), never put production credentials in repository-level secrets. Use environment-level secrets so they're only available to jobs explicitly targeting that environment.

Here's how secret scoping works in practice:

| Secret level | Available to | Use for |
|-------------|-------------|---------|
| Repository | All jobs | Non-sensitive shared config |
| Environment | Jobs targeting that environment only | Deploy keys, database URLs, API tokens |
| Organization | All repos in org (if granted) | Shared infrastructure credentials |

The principle is simple: production credentials should only be accessible to jobs that are actually deploying to production. Environment scoping enforces this structurally rather than relying on people to be careful.

With secrets and authentication sorted out, the next question is: what actually kicks off a deployment? That decision shapes your entire team's deployment culture.

## Triggering Deployments

How your CD pipeline gets kicked off sets the tone for your entire deployment culture. There's no single right answer - it depends on your risk tolerance, team size, and how mature your testing is.

### Automatic: Deploy on Merge to Main

The holy grail of CD: every merge to main automatically deploys (after CI passes). This is what "continuous" in continuous delivery actually means. No manual steps, no deploy meetings, no "who's going to push the button?"

This works because of a key assumption: your CI pipeline is thorough enough that a green build genuinely means the code is safe to deploy. If you don't trust your tests, you shouldn't be doing automatic deployments - invest in your test suite first.

```yaml
on:
  workflow_run:
    workflows: ["CI"]
    branches: [main]
    types: [completed]
```

The `workflow_run` trigger with `types: [completed]` is doing the heavy lifting here. It only fires after your CI workflow finishes (not when it starts), and you add the `if: conclusion == 'success'` check in the job to ensure you only deploy on green builds. This creates a clean handoff between CI and CD without coupling them into the same workflow file.

Best for: teams with strong CI coverage, low-risk services, high deployment frequency.

### Tag-Based Releases

Deploy when a version tag is pushed. This gives you explicit control over exactly when a release happens. Someone (or your release automation) pushes a tag like `v2.4.1`, and the deployment kicks off.

```yaml
on:
  push:
    tags:
      - 'v*'
```

The `v*` pattern matches any tag starting with "v" (like `v1.0.0`, `v2.3.1-beta`). When someone pushes a tag matching this pattern, the workflow fires. This gives you a clear, auditable release history in your git log - every deployment corresponds to a tag that you can see, compare, and reference later.

Best for: libraries, versioned APIs, regulated environments, teams that want explicit release control.

### Manual with workflow_dispatch

Add a manual trigger for on-demand deployments. This creates a "Run workflow" button in the Actions tab where you can select parameters like target environment and git ref.

This isn't a replacement for automated deployments - it's an escape hatch. Useful for hotfixes that need to go out immediately, rolling back to a specific version, or deploying to an environment outside the normal promotion path.

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production
      ref:
        description: 'Git ref to deploy (branch, tag, or SHA)'
        required: true
        default: 'main'
```

Best for: hotfixes, rollbacks, deploying specific versions outside the normal flow, one-off environments.

### Combining Triggers

Most mature teams land on a combination. The common pattern: staging deploys automatically on every merge to main, but production requires either a manual trigger or a separate promotion workflow with approval gates.

```yaml
on:
  # Auto-deploy to staging on merge
  workflow_run:
    workflows: ["CI"]
    branches: [main]
    types: [completed]
  # Manual deploy to any environment
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [staging, production]
```

This gives you the speed of automatic deployments for staging (where you want fast feedback) with the safety of human oversight for production (where you want someone to consciously decide "yes, this is ready"). As your confidence in the pipeline grows, you can remove the manual gate and go fully automatic.

## Deployment Visibility

A deployment that nobody knows about is a deployment that nobody can troubleshoot. Visibility is what turns "who deployed what, when?" from a forensic investigation into a glance at a dashboard.

### Deployment Status in PRs

When you use the `environment` key on a job, GitHub automatically creates deployment records that show up in multiple places: the PR timeline, commit statuses, and the Environments page in your repo settings.

To get the most out of this, include the `url` field so the deployment record links directly to the deployed environment:

```yaml
environment:
  name: staging
  url: https://staging.example.com
```

This creates a clickable deployment record in GitHub. Reviewers can see that a PR's code has been deployed to staging and click through to verify it themselves. It also provides a history of every deployment to every environment - invaluable when you're trying to figure out when a specific change hit production.

### Notifications

Don't make people watch the Actions tab. Push deployment status to wherever your team already lives - Slack, Teams, email, whatever. The goal is that every deployment (success or failure) is visible without anyone actively checking.

{% raw %}
```yaml
- name: Notify on deployment
  if: always()
  uses: slackapi/slack-github-action@v2
  with:
    webhook: ${{ secrets.SLACK_WEBHOOK }}
    webhook-type: incoming-webhook
    payload: |
      {
        "text": "Deploy to ${{ inputs.environment }}: ${{ job.status }}\nCommit: ${{ github.sha }}\nActor: ${{ github.actor }}"
      }
```
{% endraw %}

Use `if: always()` here so the notification fires on both success and failure. A silent failure is worse than a loud one.

### Deployment Log

Keep a record of what was deployed, when, and by whom. The good news is that GitHub's deployment history (visible in **Settings > Environments**) handles this automatically when you use the `environment` key in your jobs. You get a timeline of every deployment with the commit, actor, and status.

For teams that need more than what GitHub provides natively (like linking deployments to incident tickets or tracking deployment frequency metrics), consider forwarding deployment events to your observability platform.

## Common Pitfalls

After helping teams set up CD pipelines, these are the mistakes I see most often. Most of them are easy to fix once you know to look for them.

| Pitfall | Fix |
|---------|-----|
| Rebuilding artifacts per environment | Build once, deploy the same artifact everywhere |
| Production secrets in repo-level secrets | Use environment-scoped secrets |
| No automated rollback | Build health checks and rollback into the pipeline |
| No smoke tests after deployment | Run basic validation after every deploy |
| Manual deployments as the only option | Automate the default path, keep manual as escape hatch |
| Long-lived cloud credentials in secrets | Use OIDC for short-lived tokens |
| No deployment branch restrictions | Restrict production deployments to `main` only |
| Deploying without approval gates | Use required reviewers on production environments |
| No visibility into what's deployed | Use GitHub Environments for deployment history and status |

The most common pattern I see is teams that nail the automation but skip the safety nets. They can deploy in 30 seconds but take 30 minutes to figure out something went wrong and another 30 minutes to roll back. Don't be that team. The rollback path is as important as the deploy path.

## Quick Reference: CD Checklist

Here's a condensed version of everything above. Use this as a starting point - not everything applies to every team, but if you're skipping something, make sure it's a conscious choice rather than an oversight.

**Foundation:**

- [ ] Build artifacts once in CI, store with `upload-artifact`
- [ ] Create GitHub Environments for each deployment target
- [ ] Set up environment-scoped secrets (not repo-level for sensitive credentials)
- [ ] Configure deployment branch restrictions

**Safety:**

- [ ] Add required reviewers for production environment
- [ ] Implement health checks after deployment
- [ ] Build automated rollback into the pipeline
- [ ] Run smoke tests after every deployment
- [ ] Use OIDC instead of static cloud credentials

**Workflow:**

- [ ] Use reusable workflows for consistent deployment logic
- [ ] Automate staging deployments on merge to main
- [ ] Add `workflow_dispatch` for manual deployments when needed
- [ ] Set up deployment notifications (Slack, Teams, etc.)
- [ ] Choose a deployment strategy (rolling, blue-green, canary) appropriate to your risk tolerance

## Summary and Key Takeaways

Continuous delivery isn't about deploying recklessly fast. It's about making deployment boring, reliable, and reversible. The best CD pipelines are the ones nobody thinks about because they just work. When shipping to production is a non-event, you ship more often, with less stress, and with smaller changes that are easier to debug when something goes sideways.

The bottom line:

- **Build once, deploy everywhere.** The artifact you tested is the artifact you ship. No exceptions. Rebuilding per environment is the #1 source of "but it worked in staging" problems.
- **GitHub Environments are your control plane.** Approval gates, scoped secrets, branch restrictions, and deployment history - all built in. Use them before reaching for third-party tools.
- **Automate the happy path, plan for failure.** Health checks and automated rollbacks are not optional for production pipelines. The deploy that breaks things at 2 AM needs to fix itself without waking someone up.
- **Start simple.** A linear staging-then-production pipeline with approval gates covers most teams. Add canary deployments and traffic splitting when your scale demands it - not before.
- **Use OIDC for cloud auth.** Stop storing long-lived credentials. Short-lived tokens scoped to specific repos and environments are the standard now. They're more secure and simpler to manage once set up.
- **Make deployments visible.** If the team doesn't know a deployment happened, they can't connect it to the problem they're debugging. Notifications and deployment records are cheap insurance.

Your CI pipeline proved the code works. Your CD pipeline proves you can ship it safely. Together, they turn every merge to main into a production candidate - and that's what makes frequent, low-risk releases possible.
