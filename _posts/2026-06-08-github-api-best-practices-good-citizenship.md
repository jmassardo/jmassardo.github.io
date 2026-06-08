---
layout: post
title: "GitHub API Best Practices: Are You Being a Good API Citizen?"
date: 2026-06-08 10:00:00 -0500
category: Blog
tags: [github, api, automation, devops, best-practices, platform-engineering]
excerpt: "Pull up a chair. This workshop-style guide walks through how real teams build GitHub API integrations that avoid over-polling, over-scoped auth, and rate-limit chaos in production."
---

Picture this: you are in a conference room with twelve engineers, one product manager, and one platform lead who has already said, "our integration works fine," three times in the first five minutes.

I walk to the whiteboard and ask one question:

"How many of your GitHub API calls are truly necessary?"

Silence. A few side glances. Then someone says, "Define necessary."

Exactly.

Most GitHub API integrations fail in slow motion, not in flames. They over-poll, over-scope permissions, under-handle limits, and quietly become expensive to operate. Nobody notices until delivery gets noisy, incident channels get busier, and trust in automation drops.

That is not a GitHub problem. It is an API citizenship problem.

If you are building against GitHub APIs, being a good citizen means doing three things well:

- Ask for only what you need
- Ask at the right time (not all the time)
- Prove your integration is safe when it scales

In this post, we are going to run this like a workshop. You and I are designing the integration together, making tradeoffs in real time.

## Workshop Ground Rules

Before we touch code, I put these three rules on the board:

1. **Every call needs a reason.** "We might need it later" is not a reason.
2. **Every credential needs an owner.** Shared mystery tokens are not ownership.
3. **Every retry needs a limit.** Infinite optimism is not resilience.

If we keep those three rules, most integration pain disappears before it starts.

## Start with API Contracts and Schemas

Before you write logic, lock in your request and response contract.

For REST, this means:

- Set a stable `Accept` header and API version
- Validate required fields before making requests
- Treat undocumented fields as non-contractual

For GraphQL, this means:

- Request only fields you use
- Keep queries small and purpose-built
- Use typed models in your code so schema drift is obvious

In workshop terms: if your payload contract is fuzzy, every downstream consumer pays for that fuzziness.

The anti-pattern is familiar:

- One "universal" response model with optional everything
- One giant GraphQL query "for flexibility"
- Runtime null checks everywhere

The better pattern:

- Separate models by use case
- Small focused queries and endpoints
- Contract tests that fail fast when expectations drift

Example REST baseline:

```bash
curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/issues
```

Official docs:

- [REST API overview](https://docs.github.com/en/rest)
- [GraphQL API overview](https://docs.github.com/en/graphql)

## Picking REST vs GraphQL Without Religious Wars

This part always gets spicy in workshops, so here is the practical answer.

Choose REST when:

- Your workflow maps cleanly to resource endpoints
- You want straightforward debugging with predictable URLs
- You are building operational automation quickly

Choose GraphQL when:

- You need to compose data from multiple objects efficiently
- You need stricter control over over-fetching
- You can invest in query governance and typed clients

Use both when it makes sense. Teams lose months arguing "one true API style" while production outages are caused by retries and token sprawl.

## Polling vs Event-Driven: Default to Events

If your integration still polls every 30 seconds "just in case," you are paying API tax for no reason.

Use webhooks for near-real-time events and poll only as a fallback or reconciliation mechanism.

Use webhooks when:

- You need low latency triggers
- You can process events idempotently
- Your source system can expose a receiver endpoint

Use polling when:

- You cannot expose inbound endpoints
- You are reconciling missed state on a schedule
- You need periodic health validation

A practical hybrid pattern:

1. Webhooks trigger primary processing
2. A low-frequency poller reconciles missed or delayed events
3. Deduplicate by event ID or deterministic resource key

In the room, this is where someone says, "we poll every minute because we do not trust webhooks."

That is not a webhook problem. That is a delivery design problem.

What you actually need is:

- Idempotent consumers
- Replay-safe processing
- A reconciliation job with clear SLA

That combination beats high-frequency polling every time.

Official docs:

- [About webhooks](https://docs.github.com/en/webhooks-and-events/webhooks/about-webhooks)
- [Best practices for using webhooks](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks)

## Authentication: Scope Is a Security Feature

Authentication is not just "make the request pass." It is the boundary of blast radius.

Key rule: use the least-privileged identity that can complete the job.

In practice, auth choices are architecture choices. They define blast radius, auditability, and operational burden.

### When to use fine-grained PATs

Use fine-grained personal access tokens for:

- Short-lived user-owned scripts
- Small operational tasks with clear repo scope
- Temporary migration tooling

Avoid PATs for long-running org-wide automation where ownership continuity matters.

PATs break in exactly the ways you expect:

- Human owner changes role
- Token rotation gets delayed
- Scope grows "temporarily" and never shrinks

### When to use GitHub Apps

Use GitHub Apps for:

- Multi-repo or org-wide automation
- Service-to-service integrations
- Workloads needing granular, install-based permissions
- Better auditability and lifecycle management

GitHub Apps should be your default for production automations.

If your integration matters to more than one repo, you probably want an App.

The workshop rule of thumb:

- **One human, one short task:** fine-grained PAT
- **One team, one durable system:** GitHub App

Official docs:

- [About authentication to GitHub](https://docs.github.com/en/rest/overview/authenticating-to-the-rest-api)
- [Fine-grained personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [About GitHub Apps](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps)
- [Make authenticated requests](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2026-03-10#make-authenticated-requests)

## Rate Limiting: Design for Limits, Not Around Them

If your strategy is "retry immediately until it works," your strategy is to get throttled harder.

Build a rate-aware client:

- Read and log `X-RateLimit-*` headers
- Respect `Retry-After` for secondary limits
- Use exponential backoff with jitter
- Add local request budgets per workflow/job

Simple control loop:

1. Check remaining budget
2. If low, defer non-critical calls
3. Retry only idempotent operations automatically
4. Escalate persistent throttling as a system health signal

Now for the part nobody loves: secondary limits are often behavior limits, not just volume limits.

If your app bursts aggressively, parallelizes blindly, and retries instantly, you can hit limits while your primary budget still looks fine.

Build a client that behaves like it has manners:

- Centralized retry policy
- Per-endpoint concurrency caps
- Backoff with jitter and max-attempt guardrails
- Circuit breaker behavior for repeated throttle responses

If your integration can only succeed by being loud, it is not production-ready yet.

Official docs:

- [Rate limits for the REST API](https://docs.github.com/en/rest/overview/rate-limits-for-the-rest-api)
- [Best practices for integrators](https://docs.github.com/en/rest/guides/best-practices-for-integrators)
- [Handle rate limit errors appropriately](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2026-03-10#handle-rate-limit-errors-appropriately)

### Good vs Bad: Handling Rate Limits

**Bad approach (hammer retry):**

```text
on 403/429:
  retry immediately
  retry immediately again
  keep retrying until success
```

**Good approach (header-aware retry):**

```text
on 403/429:
  if Retry-After exists: sleep that many seconds
  else if X-RateLimit-Remaining == 0: sleep until X-RateLimit-Reset
  else: exponential backoff with jitter
  stop after bounded retry attempts and raise error
```

Sample response headers you should parse:

```http
HTTP/1.1 403 Forbidden
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1780517400
Retry-After: 60
```

## Concurrency and Mutative Request Pacing

This is one of the most overlooked sections in GitHub's docs and one of the most common workshop findings.

GitHub explicitly recommends:

- Avoid concurrent request floods when possible
- Make requests serially through a queue when you can
- Pause at least one second between large runs of `POST`, `PATCH`, `PUT`, and `DELETE`

Good vs bad pattern:

**Bad:** 100 concurrent `PATCH` calls with immediate retries.

**Good:** queued mutative operations with a minimum one-second interval and bounded parallelism.

Sample worker log output:

```text
[worker] job=repo-sync-142 op=PATCH /repos/org/service/labels/id123
[worker] throttling mutative request: sleep=1.0s
[worker] status=200 remaining=4211
```

Official docs:

- [Avoid concurrent requests](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2026-03-10#avoid-concurrent-requests)
- [Pause between mutative requests](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2026-03-10#pause-between-mutative-requests)

## Conditional Requests: Stop Downloading the Same Data Repeatedly

Conditional requests are one of the easiest wins for API efficiency.

Use `ETag` and `If-None-Match` so unchanged resources return `304 Not Modified` instead of full payloads.

Real workshop example (open issues list in one repository):

```bash
# 1) First call: get current data and the ETag
curl -sD headers.txt -o body.json \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/issues?state=open&per_page=30

# 2) Grab ETag from response headers
etag=$(awk 'BEGIN{IGNORECASE=1}/^ETag:/{print $2}' headers.txt | tr -d '\r')
echo "ETag is: $etag"

# 3) Re-check later with If-None-Match
curl -i -s \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "If-None-Match: $etag" \
  "https://api.github.com/repos/OWNER/REPO/issues?state=open&per_page=30"
```

If nothing changed, you should see output like this:

```http
HTTP/1.1 304 Not Modified
ETag: "W/\"d7f9d13c9a0f...\""
X-RateLimit-Remaining: 4988
```

Critical detail: when the request is correctly authenticated (with an `Authorization` header) and you get `304 Not Modified`, that request does not count against your primary rate limit.

If something changed (new issue, closed issue, label update), you should see:

```http
HTTP/1.1 200 OK
ETag: "W/\"e8121b9b2c44...\""
Content-Type: application/json; charset=utf-8
```

And the response body will contain the updated issue list.

Why this matters:

- Lower bandwidth and lower compute in your integration
- Fewer unnecessary API calls under load
- Better resilience during burst periods
- Authenticated `304` responses preserve primary rate-limit budget, which is huge for high-frequency read paths

In almost every workshop, we find one expensive read path that is re-fetching unchanged data all day. Conditional requests are the fastest cost/performance win you can ship this sprint.

Official docs:

- [Conditional requests](https://docs.github.com/en/rest/using-the-rest-api/getting-started-with-the-rest-api#conditional-requests)
- [Use conditional requests if appropriate](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2026-03-10#use-conditional-requests-if-appropriate)

Tip for workshop pilots: start with one high-volume read path (issues, pull requests, checks, or runs), add ETag handling there, and measure request reduction for one week.

## Redirects, URL Parsing, and Pagination Discipline

These three show up together in production bugs more often than people expect.

### Follow redirects correctly

- `301`: follow and update future code paths
- `302`/`307`: follow for now, do not persist as canonical URL

Sample redirect response:

```http
HTTP/1.1 301 Moved Permanently
Location: https://api.github.com/repositories/123456/issues
```

### Do not manually parse URLs

If the API gives you `number`, use `number`. Do not split `html_url` and hope format never changes.

**Bad:** parse `https://github.com/org/repo/issues/1347` to derive issue number.

**Good:** use JSON field directly:

```json
{
  "number": 1347,
  "html_url": "https://github.com/org/repo/issues/1347"
}
```

### Do not manually construct pagination

Use `Link` headers instead of hand-building `?page=` assumptions.

This is one of those details that looks minor until it burns a week of incident time.

Common bad pattern:

- Start at `?page=1`
- Increment page numbers until one request returns an empty array
- Assume every endpoint behaves consistently with that approach

Why this fails in production:

- Not every endpoint behaves the same way under filtering and sorting
- Data can change while you are paging, so page boundaries shift
- You can skip or duplicate records when new items arrive mid-run

Better pattern:

1. Request the first page with a stable sort and explicit `per_page`
2. Parse the `Link` header for `rel="next"`
3. Continue following only `rel="next"` until absent
4. Track an idempotency key so reruns do not duplicate processing
5. Persist checkpoint state so failures resume cleanly

Workshop guidance: if the data set is volatile, add a time window filter (`updated since`) and overlap windows with dedupe so you do not lose records during high write activity.

Sample pagination header:

```http
Link: <https://api.github.com/repositories/123/issues?page=2>; rel="next", <https://api.github.com/repositories/123/issues?page=8>; rel="last"
```

Good pagination loop (pseudocode):

```text
url = "https://api.github.com/repos/OWNER/REPO/issues?state=open&per_page=100"
while url exists:
  response = GET(url)
  process_items_idempotently(response.body)
  url = parse_link_header(response.headers["Link"]).next
```

Sample worker output:

```text
[pager] page=1 items=100 next=yes remaining=4932
[pager] page=2 items=100 next=yes remaining=4931
[pager] page=3 items=27 next=no remaining=4930
[pager] complete total_items=227
```

Official docs:

- [Follow redirects](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2026-03-10#follow-redirects)
- [Do not manually parse URLs](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2026-03-10#do-not-manually-parse-urls)
- [Using pagination in the REST API](https://docs.github.com/en/rest/guides/using-pagination-in-the-rest-api)

## Reference Architecture for a Well-Behaved Integration

If you are building a serious integration, design for resilience from day one. A minimal production-ready flow looks like this:

1. **Ingress:** Webhook receiver validates signature and normalizes payloads
2. **Queue:** Events are buffered for retry-safe processing
3. **Worker:** Idempotent processor enriches data and calls GitHub APIs
4. **State store:** Tracks last-processed marker, ETags, and dedupe keys
5. **Control plane:** Rate-limit telemetry, retry policy, and alerting

This gives you replay support, better failure isolation, and cleaner audit trails.

If you skip queueing and state tracking, you are not building an integration. You are building a coincidence that currently works.

## Failure Modes to Plan for Up Front

Most API incidents are predictable. Treat these as design requirements, not surprises:

- **Webhook delays or drops:** Reconcile with scheduled polling and deterministic dedupe
- **Permission drift:** Detect permission errors and surface actionable remediation
- **Secondary limits:** Back off globally, not per request loop
- **Schema shifts:** Fail fast on parsing mismatches and alert on model drift
- **Token expiration/rotation gaps:** Automate renewals and include health checks

If you test these failure modes in staging, your production incidents become recoverable instead of chaotic.

## Do Not Ignore Errors

Repeated `4xx` and `5xx` responses are not noise. They are feedback that your integration contract is broken, your permissions are wrong, or your assumptions are stale.

Good vs bad response handling:

**Bad:** swallow `422` validation errors and continue processing as success.

**Good:** classify, log structured details, and fail the unit of work with remediation hints.

Sample validation error output:

```json
{
  "message": "Validation Failed",
  "errors": [
    {
      "resource": "Issue",
      "field": "title",
      "code": "missing_field"
    }
  ],
  "documentation_url": "https://docs.github.com/rest"
}
```

Official docs:

- [Do not ignore errors](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2026-03-10#do-not-ignore-errors)

## Observability: The Part Teams Add Too Late

I ask every workshop group the same question: "How will you know this integration is sick before customers do?"

The minimum signal set:

- Request success rate by endpoint
- P95 and P99 latency for API calls
- Throttle and secondary-limit event counts
- Queue depth and event age
- Reconciliation drift (expected vs observed state)

Add an integration SLO early. Something simple:

- **Availability:** 99.5% successful processing over rolling 30 days
- **Freshness:** 95% of events processed within 2 minutes

Without explicit SLOs, you cannot separate noise from real degradation.

## A Maturity Model You Can Actually Use

When teams ask "how good are we," I use this 4-level model.

| Level | Behavior | Risk |
|---|---|---|
| **L1 - Scripted** | PAT-heavy, polling-heavy, minimal retries | Fragile and person-dependent |
| **L2 - Structured** | Basic webhook handling, scoped auth, some backoff | Works but noisy under scale |
| **L3 - Operable** | App-based auth, idempotent workers, reconciliation loops | Stable and supportable |
| **L4 - Resilient** | SLO-driven ops, contract tests, automated policy checks | Predictable at enterprise scale |

You do not need L4 on day one. You do need to know which level you are at and what must be true before growth.

## Quick Decision Matrix

| Concern | Prefer | Why |
|---|---|---|
| Long-running org automation | GitHub App | Better permission model and lifecycle |
| User-scoped short script | Fine-grained PAT | Fast setup with bounded scope |
| Change detection | Webhooks | Lower latency, less API churn |
| Drift correction | Scheduled polling | Catches missed events safely |
| High read volume | Conditional requests | Reduces waste and throttling risk |

## Are We Good Citizens? Use This Checklist

- [ ] We use GitHub Apps for production integrations where possible
- [ ] Our tokens are least-privilege and time-bounded
- [ ] We default to webhooks and use polling for reconciliation only
- [ ] We handle rate and secondary limits with backoff and jitter
- [ ] We avoid uncontrolled concurrency and pace mutative requests
- [ ] We follow redirects and treat 301 vs 302/307 differently
- [ ] We do not parse resource URLs or hand-roll pagination paths
- [ ] We use conditional requests on high-volume reads
- [ ] We version API usage and monitor schema-breaking assumptions
- [ ] We classify and act on repeated 4xx/5xx errors
- [ ] We track integration SLOs (success rate, latency, throttle events)

## Official REST Best-Practice Map

If you want a direct cross-check against GitHub docs, use this table during reviews:

| GitHub guidance | Covered in this workshop | Official docs |
|---|---|---|
| Avoid polling | Webhook-first plus reconciliation | [Avoid polling](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2026-03-10#avoid-polling) |
| Make authenticated requests | Least-privilege auth model | [Make authenticated requests](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2026-03-10#make-authenticated-requests) |
| Avoid concurrent requests | Queue and bounded parallelism | [Avoid concurrent requests](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2026-03-10#avoid-concurrent-requests) |
| Pause mutative requests | One-second pacing for write bursts | [Pause between mutative requests](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2026-03-10#pause-between-mutative-requests) |
| Handle rate limits | Header-aware retry policy | [Handle rate limit errors appropriately](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2026-03-10#handle-rate-limit-errors-appropriately) |
| Follow redirects | Correct 301/302/307 behavior | [Follow redirects](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2026-03-10#follow-redirects) |
| Do not parse URLs | Use structured fields and Link headers | [Do not manually parse URLs](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2026-03-10#do-not-manually-parse-urls) |
| Use conditional requests | ETag and If-None-Match | [Use conditional requests if appropriate](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2026-03-10#use-conditional-requests-if-appropriate) |
| Do not ignore errors | Structured error handling and alerting | [Do not ignore errors](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2026-03-10#do-not-ignore-errors) |

If you can only fix three things this month, do these:

1. Replace long-lived PAT usage in core automations with a GitHub App
2. Move high-frequency polling paths to webhook-first + reconciliation
3. Add conditional requests and centralized backoff policy

That trio usually gives the biggest reliability gain per engineering hour.

## Summary and Key Takeaways

Good API citizenship is not about being polite. It is about building integrations that survive scale, audits, and bad days without becoming the bottleneck in your delivery system.

Start with secure auth and strict scopes. Shift from polling-first to event-first. Add rate-aware controls and conditional requests so your integration stays efficient when usage spikes.

If this were a live workshop, this is where I would hand you a marker and ask: "Which one integration are we fixing first?"

Your move: pick one integration this week, run the checklist, and fix the two biggest citizenship gaps first. Use the best-practice map above as your review rubric. Then rerun the same exercise in 30 days. Good API citizenship is a habit, not a one-time migration.