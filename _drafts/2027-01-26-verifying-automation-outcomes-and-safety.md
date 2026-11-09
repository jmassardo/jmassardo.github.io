---
layout: post
title: "Verifying Automation Outcomes and Safety: Green Isn't Proof"
date: 2027-01-26 10:00:00 -0600
category: Blog
tags: [automation, devops, reliability, security, observability, auditing]
excerpt: "A successful job isn't proof of a successful outcome. Verify what changed, who authorized it, and whether you can safely stop and recover the automation."
---

Your deployment job is green. The scheduler is green. The dashboard has enough green to qualify as landscaping.

But is the new version serving traffic? Did the backup become recoverable? Did the cleanup touch only the approved resources?

**A successful execution is evidence about the job, not proof of the business outcome.** In [Automation as an Engineering Discipline, Not a Shortcut]({% post_url 2026-06-10-automation-engineering-discipline %}), I covered building automation with guardrails. This follow-up is about proving those guardrails and outcomes still work.

## Define Success Outside the Job

Start with the result you need and the things that must not change.

| Automation | Control-plane signal | Outcome evidence | Safety invariant |
|---|---|---|---|
| Deployment | Pipeline completed | Expected revision serves a synthetic user journey | Unrelated services remain unchanged |
| Backup | Backup task succeeded | Fresh recovery point passes an isolated restore test | Required retention and access controls remain intact |
| Cleanup | Job exited with `0` | Approved targets are gone | Protected and out-of-scope resources remain unchanged |
| Access provisioning | API accepted request | Intended principal has exactly the approved access | No unrelated privilege grants |

Set a deadline for observing the outcome. Eventual consistency needs a bounded wait, not an excuse to ignore missing evidence forever.

I used to be in a systems management community where a member's motto was `Standardize, Simplify, Automate`. That still fits. Standardize the outcome contract, simplify the allowed changes, then automate both execution and verification.

**Start here:** pick one critical job and write its expected result, forbidden changes, evidence source, and verification deadline.

## Verify from a Different Viewpoint

The executor saying "I succeeded" is useful. A separate observation of the target is stronger.

For a deployment, check the serving revision and exercise a synthetic user path, not just the rollout API. For backups, validate restoration in an isolated environment. Use synthetic fixtures where possible; any real restore needs approved data handling and access controls.

[Google's monitoring guidance](https://sre.google/sre-book/monitoring-distributed-systems/) distinguishes internal signals from externally visible behavior. Automation needs both.

For high-impact jobs:

- Give the verifier a **separate, read-only identity**, scoped to the evidence it needs.
- Read actual state from the target, rather than trusting the executor's summary.
- Keep the approved plan and policy where the executor can't silently rewrite them.
- Monitor the verifier's own heartbeat and evidence freshness.

Separation isn't magic either. If the same compromised administrator can change the job, verifier, and evidence, they share a failure domain. Choose stronger isolation where the risk warrants it.

## A Small, Runnable Outcome Check

Here's a synthetic cleanup example. It makes no network calls, changes no resources, and stores no secrets or production data. Save it as `verify_cleanup.py` outside your production automation and run `python3 verify_cleanup.py`.

```python
def verify_cleanup(before, after, approved, protected):
    if approved & protected:
        raise ValueError("Plan includes protected resources")
    if not approved <= before.keys():
        raise ValueError("Plan references unknown resources")

    expected = {
        name: revision
        for name, revision in before.items()
        if name not in approved
    }
    if after != expected:
        raise ValueError("Observed state differs from approved outcome")


before = {
    "temporary-a": "v1",
    "protected-a": "v1",
    "unrelated-a": "v1",
}
approved = {"temporary-a"}
protected = {"protected-a"}

cases = [
    ("valid", {"protected-a": "v1", "unrelated-a": "v1"}, True),
    ("no-op", dict(before), False),
    ("unexpected-drift", {"protected-a": "v2", "unrelated-a": "v1"}, False),
    ("over-delete", {"protected-a": "v1"}, False),
]

for label, after, should_pass in cases:
    try:
        verify_cleanup(before, after, approved, protected)
        passed = True
    except ValueError:
        passed = False
    if passed != should_pass:
        raise RuntimeError(f"Verifier test failed: {label}")
    print(f"{label}: {'verified' if passed else 'blocked'}")
```

The no-op case shows why an exit code isn't enough. The drift case shows why checking deletion counts isn't enough either.

This example checks complete synthetic snapshots and revision markers. A production verifier needs authoritative observations, pagination, freshness checks, concurrent-change handling, and invariants appropriate to the resource. A matching revision marker alone doesn't prove all state is correct.

## Audit Authority, Not Just Activity

A job can achieve its expected result while a stolen identity performs unrelated actions. Outcome verification and security auditing answer different questions.

Correlate the run identifier with:

- The approved code revision and dependency versions
- The triggering event, actor, and any required approval
- The workload identity and role actually used
- Provider-side access events and affected resource scope
- The verifier's result and evidence timestamp

Keep a minimal, access-controlled audit record. **Do not dump credentials, tokens, environment variables, request bodies, or customer records into it.** [OWASP's logging guidance](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) covers sensitive-data exclusions, integrity, and logging validation.

For GitHub Actions, [OIDC federation](https://docs.github.com/en/actions/concepts/security/openid-connect) can replace long-lived cloud secrets with short-lived credentials. Review the provider's trust conditions, including the expected subject and audience, and scope the resulting role. Short-lived credentials reduce exposure; they don't make an overly broad trust policy safe.

**Audit credentials by metadata and authority**, not by copying their values. Review ownership, scope, expiration, last use, and the policy allowing issuance.

## Detect Hijacks, Drift, and Missing Work

Watch for more than explicit failures:

- **Missing outcomes:** the job ran, but the expected revision or recovery point never appeared.
- **Missing runs:** the scheduler or verifier stopped reporting altogether.
- **Unexpected authority:** a workload identity acquired new permissions or was used outside its approved context.
- **Scope drift:** targets, destinations, schedules, or dependency versions changed without an approved change.
- **Evidence gaps:** access logging stopped or the executor gained permission to alter audit records.

These are investigation triggers, not automatic proof of an attacker. Routine configuration mistakes and legitimate changes can look similar. Give each signal an owner and an appropriate response channel.

Periodic audits still matter. Review a sample of runs against independent evidence, inspect code and credential policies, and test the stop mechanism. I'd rather find a gap at 2 PM on a Wednesday than learn about it from a Saturday pager.

## Stop Safely, Then Recover Deliberately

If a high-risk outcome can't be verified, pause further destructive work or promotion and investigate. Don't blindly rerun a job that may already have partly succeeded.

A practical recovery sequence:

1. **Contain execution.** Pause new triggers and stop or isolate active workers. Confirm that queued retries and other controllers won't restart the action.
2. **Contain authority if compromise is suspected.** Engage security response, restrict credential issuance, and revoke or expire active access where the provider supports it. Rotating a secret may not invalidate already-issued sessions.
3. **Preserve evidence.** Retain protected audit metadata and relevant logs using approved incident procedures. Don't copy secrets or production payloads into tickets.
4. **Reconcile actual state.** Compare the approved plan with what happened. Check partial writes before retrying, rolling back, or compensating.
5. **Recover from trusted inputs.** Use reviewed code and tested recovery paths. A rollback must account for persistent data and irreversible actions, not just yesterday's executable.
6. **Resume narrowly.** Run a canary, verify outcomes independently, and expand only after the checks pass.

Put limits close to the action: target allowlists, maximum batch sizes, time budgets, and approval gates for irreversible changes. Exercise them with synthetic failures. A kill switch isn't proven until you've checked that work actually stops.

## Summary and Key Takeaways

- [ ] Define success as an observed outcome plus safety invariants.
- [ ] Verify independently and alert when runs or evidence go missing.
- [ ] Audit identity, authority, and scope without storing secrets or production data.
- [ ] Test no-ops, unexpected changes, and partial failures, not just the happy path.
- [ ] Practice containment, state reconciliation, and recovery before expanding automation.

Green is a useful signal. Knowing what happened, and being able to stop it safely, is the stronger engineering outcome.

---

*Have automation horror stories? Or examples of automation done right? I'm collecting both. Reach out on [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), [Bluesky](https://bsky.app/profile/jmassardo.bsky.social), or [GitHub](https://github.com/jmassardo).*
