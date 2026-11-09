---
layout: post
title: "Local AI on My ASUS GX10: vLLM, OpenCode, and a Front Door That Makes Sense"
date: 2026-11-10 10:00:00 -0600
category: Blog
tags: [ai, devops, developer-tools, vllm, opencode, open-webui, cloudflare, self-hosting]
excerpt: "How I assembled a GX10 inference stack, tuned its serving configuration, and connected Open WebUI and OpenCode, including what still needs validation."
---

Getting a model to answer a prompt is one milestone. Making it accessible from a browser and coding agent, without turning every model change into infrastructure archaeology, is another.

My setup puts **vLLM on an ASUS Ascent GX10**, with **Open WebUI on a separate NUC** as the browser interface and authenticated API gateway. Cloudflare Tunnel supplies the public HTTPS entry point.

The useful lesson isn't a magic launch flag. It's separating inference, access, and client configuration so I can troubleshoot each independently.

**Current fact audit, November 2, 2026:** the GX10 now serves a new Qwen 3.8 trial. My earlier Qwen 3.6 setup remains available for rollback. The current OpenCode integration still needs revalidation after that model change. This is an observed build report, not a fully validated deployment tutorial. A later publication date does not imply another live infrastructure check.

## The Hardware: Unified Memory, Not a Giant Discrete GPU

The [ASUS specifications](https://www.asus.com/us/networking-iot-servers/desktop-ai-supercomputer/ultra-small-ai-supercomputers/asus-ascent-gx10/techspec/) describe 128GB of LPDDR5x coherent unified system memory.

My host reports:

- **Architecture:** `aarch64`, with 20 ARM CPU cores.
- **GPU platform:** NVIDIA GB10, running driver `580.178.04`.
- **Linux memory:** approximately 121 GiB total.

That memory is **shared between CPU and GPU workloads**. Calling it “128GB of dedicated VRAM” would make a nice headline and a lousy capacity plan.

The deployment prerequisites are Docker, Compose, the NVIDIA driver, and NVIDIA Container Toolkit. I won't reconstruct an OS installation recipe from the current machine state.

For a comparable installation, these are starting checks, not commands I am claiming to have rerun for this post:

```bash
# On the GX10, from the deployment directory:
nvidia-smi
docker compose ps

# From a machine with LAN access; replace the placeholder:
curl -fsS http://GX10_LAN_IP:8000/v1/models
```

Check the driver, container state, and served model identity separately. A running container doesn't establish that the intended model loaded.

## One Inference Host, One Public Front Door

The public request path looks like this:

```text
Browser or OpenCode
        |
        v
https://ai.dxrf.com
        |
        v
Cloudflare Tunnel
        |
        v
cloudflared on nuc1
        |
        v
Open WebUI on nuc1
(host 8400 -> container 8080)
        |
        v
http://GX10_LAN_IP:8000/v1
        |
        v
vLLM on GX10
```

The main model's host port binds only to the GX10's LAN address. **The tunnel does not intentionally publish vLLM directly.** Open WebUI provides the UI and authenticated API in front of it.

There is also an internal HTTPS nginx/Open WebUI deployment on the GX10. That is a separate path, not the public NUC gateway shown above.

Cloudflare supplies the public HTTPS edge and outbound tunnel connection. It is also **in the request data path**. Self-hosted inference does not mean every prompt stays entirely inside my LAN.

Similarly, a tunnel is not authentication by itself. I am not claiming that Cloudflare Access policies protect this installation.

An illustrative reader route would be:

```text
https://ai.example.com -> http://NUC_LAN_IP:8400
```

Use an origin address reachable from the connector's network. If `cloudflared` runs in a separate container, `localhost` means that container, not the NUC host. Networking remains networking, even when the application is fashionable.

The [Cloudflare Tunnel documentation](https://developers.cloudflare.com/tunnel) covers connector and route setup. I am leaving tunnel tokens and unverified connector details out of this post.

## The Current Model Is a Trial, Not the Old Baseline

The main container is now `vllm-qwen38`, serving:

```text
nvidia/Qwen3.8-Flash-Next-FP4-Local
```

Direct model discovery returned that exact ID with a configured maximum length of **65,536 tokens**. That is my server cap, not a claim about the checkpoint's native maximum.

This deployment uses the [community Spark vLLM runtime](https://github.com/eugr/spark-vllm-docker). It is **not stock stable upstream vLLM or an official NVIDIA image**. The [NVIDIA checkpoint card](https://huggingface.co/nvidia/Qwen3.8-Flash-Next-FP4-Local) explains the specialized runtime requirement for its compressed scales. The [community solo recipe](https://github.com/eugr/spark-vllm-docker/blob/main/recipes/qwen3.8-flash-next-nvfp4-solo.yaml) is a reference, not proof that its current defaults match my pinned deployment.

The current image and checkpoint are pinned:

```text
Image:
eugr/spark-vllm-b12x@sha256:7d5ba755d5c69476e971feebaea73be74bc9b9e6f2f87573c61acd492c61e4f9

Model revision:
b9ce18a6887e18c089fdea8509a33e63429a3300
```

Those pins matter when kernels, model formats, and serving code are moving together.

The following is an **excerpt of relevant flags from the actual launch**, not a complete runnable service. Specialized backend flags and additional deployment setup are omitted:

```text
--mamba-cache-mode align
--enable-prefix-caching
--enable-chunked-prefill
--dtype bfloat16
--kv-cache-dtype fp8
--quantization modelopt_mixed
--load-format b12x
--max-model-len 65536
--max-num-seqs 4
--max-num-batched-tokens 4096
--speculative-config '{"method":"mtp","num_speculative_tokens":4}'
--reasoning-parser qwen3
--tool-call-parser qwen3_xml
--enable-auto-tool-choice
--gpu-memory-utilization 0.7
```

I would not transplant this into a generic vLLM image and expect success. Consult the runtime recipe and [vLLM optimization documentation](https://docs.vllm.ai/en/latest/configuration/optimization/), then check flags against the installed version.

## How We Tuned the Serving Envelope

The tuning work combines memory limits, scheduling, cache behavior, and model-specific execution. Here is what the current settings mean:

| Setting | Current value | Practical interpretation |
|---|---|---|
| Context cap | 65,536 tokens | Bounds the accepted sequence length |
| Concurrent sequences | 4 | Scheduler bound, not four physical users |
| Batched token budget | 4,096 | Scheduling budget, not total context capacity |
| GPU memory utilization | 0.7 | Runtime memory-planning setting, not a utilization target |
| Speculative decoding | MTP, 4 tokens | Candidate-token generation, not a promised 4x speedup |

**Weight format, compute dtype, and cache dtype are different knobs.** FP4 weights, BF16 computation, and the FP8 KV-cache setting describe different parts of execution. This hybrid model also has other cache state; I am not claiming every cache tensor is FP8.

Prefix caching can reuse repeated shared prefixes, subject to the runtime's hybrid-model support. It doesn't make unrelated prompts free.

Chunked prefill divides prompt processing so the scheduler can balance it with decoding. That introduces a workload-dependent trade-off rather than a universal speed switch.

MTP speculative decoding can help when proposed tokens are accepted often enough to justify the extra work. Four speculative tokens do not equal four times the performance.

The container also has:

- `PYTORCH_ALLOC_CONF=per_process_memory_fraction:0.7`.
- Docker `mem_limit=96g` and `memswap_limit=96g`.
- GPU device requests and host IPC.
- Persistent Hugging Face, vLLM, FlashInfer, Triton, and B12X caches.
- An `unless-stopped` restart policy.

Equal memory and memory-plus-swap limits mean **no additional container swap allowance**. These settings are separate controls, not interchangeable expressions of one memory budget.

The trial health check allows a 30-minute startup grace period. That is configured tolerance, not evidence that loading actually takes 30 minutes.

### Measuring Comes Before Declaring Victory

I don't have trustworthy before-and-after throughput figures for these changes. I won't turn a flag list into an imaginary benchmark.

For the next comparison, I would hold the model revision, context, and workload constant, then record:

1. **Time to first token**, separating cold and warm runs.
2. **Decode rate**, alongside prompt and output lengths.
3. **End-to-end task latency**, including agent tool round trips.
4. **Queueing under concurrency**, not just one isolated request.
5. **Tool correctness**, including valid arguments and successful follow-up turns.

Change one setting at a time and retain the results. A faster answer that calls the wrong tool is not an optimization.

## Keep Rollback Boring

The earlier main model was `nvidia/Qwen3.6-35B-A3B-NVFP4`. Its `vllm-qwen36` container is stopped, with its image, caches, and configuration retained under a Compose `qwen36-rollback` profile.

Both main models use host port 8000 and compete for shared memory. **They are alternatives, not companions.**

These are illustrative operational commands from the existing deployment instructions, not actions taken while drafting:

```bash
# Return to the retained Qwen 3.6 container:
docker compose stop vllm-qwen38
docker start vllm-qwen36

# Resume the Qwen 3.8 trial:
docker stop vllm-qwen36
docker compose up -d --no-deps vllm-qwen38
```

This assumes the retained container and deployment directory still exist. Keeping caches helps preserve reusable artifacts; pinning images and checkpoint revisions makes the rollback target identifiable.

There is also a separate `Qwen/Qwen2.5-Coder-1.5B` completion service, with a LAN adapter on port 8001. That adapter provides Ollama-style discovery and forwards completions, including suffix input. It is a small fill-in-the-middle/completion path, **not OpenCode's default agent model**.

## Open WebUI: Saved Configuration Is the Configuration

On `nuc1`, Open WebUI runs from the observed mutable tag `ghcr.io/open-webui/open-webui:main`, with persistent data mounted at `/app/backend/data`. This component is not version-pinned like the current inference runtime.

In **Admin Settings > Connections**, the enabled OpenAI-compatible backend points to:

```text
http://GX10_LAN_IP:8000/v1
```

The saved configuration disables the OpenAI cloud connection and enables the GX10 connection without a model prefix or explicit model allowlist.

The important operational wrinkle: **[persisted admin settings can override environment variables](https://docs.openwebui.com/reference/env-configuration/)**. My environment contains `ENABLE_SIGNUP=true`, while the saved setting disables signup. Reading only Compose would give the wrong answer.

Authentication and API keys are enabled. Public signup is currently disabled, and the default role is `pending`.

For a comparable deployment:

1. Bootstrap the first administrator.
2. Verify the saved backend connection.
3. Disable public signup after bootstrap.
4. Enable API keys, grant the intended account the necessary group permissions, and issue its key for the coding client.

Docker environment variables alone do not prove that account provisioning happened. An Open WebUI key is also **not a vLLM key**.

The public homepage returned HTTP 200 with Cloudflare response headers during inspection. That establishes public page reachability, not authenticated inference.

The [Open WebUI API documentation](https://docs.openwebui.com/reference/api-endpoints/) describes model discovery at `/api/models` and chat at `/api/chat/completions`. Its [API-key documentation](https://docs.openwebui.com/features/authentication-access/api-keys) covers account access.

These are **validation steps still to execute successfully**, using a key supplied through the environment:

```bash
curl -fsS --connect-timeout 5 --max-time 30 https://ai.dxrf.com/api/models \
  -H "Authorization: Bearer $OPEN_WEBUI_API_KEY" \
  | jq '.data[].id'

curl -fsS --connect-timeout 5 --max-time 30 https://ai.dxrf.com/api/chat/completions \
  -H "Authorization: Bearer $OPEN_WEBUI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nvidia/Qwen3.8-Flash-Next-FP4-Local",
    "messages": [{"role": "user", "content": "Reply with OK."}],
    "max_tokens": 32
  }'
```

Discovery, a short completion, and structured tool use are separate checks. Passing the first doesn't establish the other two.

## OpenCode: Match the Client to the Served Model

OpenCode previously returned `OK` through this Open WebUI gateway using its configured `/api/v1` compatibility route.

**Current integration caveat:** the local default still names Qwen 3.6, while the backend now serves Qwen 3.8. Authenticated discovery at `/api/v1/models` returned HTTP 403 during the draft audit. The cause is unresolved; that response does not establish an expired key or any other specific diagnosis.

Here is a **forward-looking OpenCode 1-style configuration**, not the configuration already deployed or proven end to end. OpenCode 2 has separate packaging and documentation; don't infer the installed client version from a newer public installation command:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "my-openwebui/nvidia/Qwen3.8-Flash-Next-FP4-Local",
  "provider": {
    "my-openwebui": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "My Open WebUI",
      "options": {
        "baseURL": "https://ai.dxrf.com/api/v1",
        "apiKey": "{env:OPEN_WEBUI_API_KEY}"
      },
      "models": {
        "nvidia/Qwen3.8-Flash-Next-FP4-Local": {
          "name": "GX10 Qwen 3.8 trial",
          "tool_call": true
        }
      }
    }
  }
}
```

The model selector is `provider-id/model-id`. The model ID itself contains a slash, so preserve the full string.

The public `config.json` schema URL is mutable. Validate this version-specific example against the installed client's schema; a newer public schema is not evidence of compatibility.

I retained `/api/v1` here because it is the historically working client route. Its compatibility is version-dependent and **must be revalidated**. Do not confuse it with the native vLLM `/v1` backend, Open WebUI's documented API endpoints, or Ollama's `/api/chat`.

Likewise, `tool_call: true` declares a capability. It cannot manufacture tool support in the model or repair an incompatible runtime parser.

After validating credentials and the API route, the next client checks are OpenCode's interactive `/models` selection and an explicit launch:

```bash
opencode -m 'my-openwebui/nvidia/Qwen3.8-Flash-Next-FP4-Local'
```

Then test one harmless tool call and its follow-up response in a disposable project. A plain `OK` is useful, but it doesn't prove an agent loop works.

The official [provider](https://opencode.ai/docs/providers/), [configuration](https://opencode.ai/docs/config/), and [model](https://opencode.ai/docs/models/) references are the right starting points for client-specific details.

## Two Operational Lessons That Outlast Model Releases

**Reboot recovery is part of the deployment.** A power blink previously booted a newer kernel without a matching NVIDIA module. An unused Ollama service also still had autostart enabled.

The repair involved restoring a working driver and disabling unused Ollama startup. My takeaway is to verify the driver after kernel changes and account for every service competing for the accelerator.

**Health is not generation.** During earlier Qwen 3.6 hangs, `/health` stayed green while trivial generation requests timed out after roughly 45 to 60 seconds. GPU utilization sat around 94 to 96 percent.

Restarting only the affected main engine recovered inference. That doesn't justify restarting whenever utilization is high. A busy GPU is evidence of activity, not useful progress.

A better smoke test combines a bounded generation request with a small tool-call test. Probe the workload you actually depend on.

## Summary and Key Takeaways

The stack is easier to reason about when each layer has a clear job: **GX10 for inference, Open WebUI for authenticated access, Cloudflare for public ingress, and OpenCode as a client**.

My next steps are concrete:

- Revalidate Open WebUI credentials and API-route compatibility.
- Align OpenCode's selected model with the Qwen 3.8 trial.
- Verify generation and structured tool calls through the complete path.
- Measure latency and concurrency before claiming performance gains.
- Keep Qwen 3.6 rollback available while evaluating the new runtime.

The serving configuration is inspectable and the fallback is retained. The remaining work is proving the updated client path and workload behavior, not adding another impressive-looking flag.
