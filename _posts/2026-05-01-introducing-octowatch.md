---
layout: post
title:  "Introducing OctoWatch"
date:   2026-05-01 10:00:00 -0500
category: Blog
tags: [github, security, devops, open-source, home-assistant, developer-tools, automation]
excerpt: "OctoWatch is an open-source security analytics platform for GitHub Enterprise Cloud audit logs. Threat detection, operational dashboards, and self-hosted data sovereignty."
---

If you run GitHub Enterprise Cloud at any meaningful scale, you have a visibility problem. GitHub gives you audit logs. What it doesn't give you is a way to make sense of them - no behavioral baselines, no impossible travel detection, no dashboard for "are our Copilot licenses actually being used," no alert when someone quietly escalates their own permissions at 2am.

That's the problem [OctoWatch](https://dxrf.com/octowatch) exists to solve.

## What It Does

OctoWatch ingests your GitHub Enterprise Cloud audit log stream and turns it into actionable security intelligence. It runs entirely on your infrastructure - your audit data never touches a third-party service.

The core capabilities:

**Threat Detection Engine** - Behavioral baselines, impossible travel detection, and sequence-based rules catch insider threats, account compromise, and privilege escalation. Findings have a full lifecycle: created, triaged, acknowledged, resolved.

**Role-Based Access Control** - GitHub team-based role assignments with three tiers: Admin, Operator, and Viewer. Repository owners see only their own data. Security teams get full visibility. Data isolation is enforced at the query level.

**Operational Dashboards** - Pre-built views covering monthly active users, license seat utilization, Copilot adoption metrics, GitHub Actions run volume, and PAT lifecycle. Everything drills down to raw events.

**Self-Service Query Engine** - SQL interface against audit events with allowlist validation, row caps, and query cost controls. Useful for ad-hoc investigation without waiting for someone to build a new dashboard.

**Integrations** - Slack and email notifications. Jira and GitHub Issues for ticketing. Okta, Entra ID, and Google Workspace for IdP enrichment. MaxMind for GeoIP resolution.

## Architecture

The stack is Python/FastAPI on the backend, React/TypeScript on the frontend, TimescaleDB (PostgreSQL) for storage, and Valkey for the task queue broker. Celery workers handle ingestion, detection, enrichment, and notifications asynchronously.

Audit events come in via Splunk HEC push (the default), or are polled from S3 or Azure Blob Storage with automatic cursor tracking.

```
nginx (TLS)
  ├── React frontend
  └── FastAPI backend
        ├── TimescaleDB
        ├── Valkey (Redis-compat)
        └── Celery Workers
              ingestion / detection / enrichment / notifications
```

It ships as Docker containers with a Helm chart for Kubernetes. Getting started locally takes about five minutes:

```bash
git clone https://github.com/jmassardo/octowatch.git
cd octowatch
python scripts/gen_env.py   # generates .env with sensible defaults
docker compose up -d
# open https://localhost
```

## What Makes This Different

Let's be real - there are commercial products in this space. The reasons to run OctoWatch instead:

- **Self-hosted means your data stays yours.** Audit logs contain sensitive operational data. Shipping them to a SaaS vendor is a decision worth thinking twice about.
- **No per-seat pricing.** Cost scales with your infrastructure, not your headcount.
- **You can extend it.** If you need a detection rule that doesn't exist, you can write it. If you need a dashboard that isn't there, you can build it.

## Current Status

The project is actively developed and production-ready for the core use case. There are 63 open issues tracking improvements and new features.

The license is Apache 2.0.

**[Check it out on GitHub](https://github.com/jmassardo/octowatch)**
