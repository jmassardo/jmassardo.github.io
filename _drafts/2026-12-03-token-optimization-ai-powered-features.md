---
layout: post
title: "Token Optimization for AI-Powered Features"
date: 2026-12-03 10:00:00 -0600
category: Blog
tags: [ai, llm, devops, cost-optimization, architecture, best-practices]
excerpt: "Building AI features into your product? Here's how to control token costs in production - from prompt engineering and context management to caching, model routing, and monitoring."
---

If you're building AI-powered features into your product, tokens are your biggest variable cost. A chatbot, code assistant, summarization pipeline, or classification service can look cheap in development and blow your budget in production.

This is Part 2 of a two-part series. [Part 1](/blog/2026/05/06/token-optimization-ai-assisted-development/) covers optimizing your daily AI coding workflow. This post focuses on building production AI features that don't hemorrhage money.

## The Token Cost Equation

Three major factors drive your AI feature costs:

| Factor | What drives it up |
|--------|-------------------|
| **Input tokens** | Long system prompts, chat history, RAG context, verbose user inputs |
| **Output tokens** | Verbose responses, reasoning budget, no API-specific output ceiling |
| **Request volume** | Every user interaction, every retry, every background job |

Output often costs more than ordinary input, but **the ratio is model-specific**. Add cache writes and reads, long-context tiers, tool fees, retries, and any hosted storage to your bill.

**Public documentation checked November 3, 2026:** [GPT-4o](https://developers.openai.com/api/docs/models/gpt-4o) and [GPT-4o Mini](https://developers.openai.com/api/docs/models/gpt-4o-mini) are now marked deprecated. A generic `claude-sonnet` label is not a deployable versioned API model ID. Don't build a new router around that old pricing cheat sheet.

Use the current [OpenAI pricing](https://developers.openai.com/api/docs/pricing) and [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing), then pin an available model appropriate to your evaluations. Context limits and caching rules belong to that exact model and API, not a family nickname. The examples below take model IDs from configuration rather than claiming a permanent winner.

## Prompt Engineering: Spend Less, Get More

### Be Direct, Cut the Fluff

Every word in your prompt costs money at scale. Compare:

```
# Verbose
I would like you to please help me by summarizing the following 
article. Please make sure the summary is comprehensive but also 
concise. Try to capture the main points and key takeaways. 
Here is the article:

# Concise
Summarize this article in 3 bullet points:
```

Fewer words, but not automatically the same result. Count tokens with the target model's tokenizer and run quality evaluations. At 100K requests/day, small verified savings compound.

### Constrain Output Format

Unstructured output is expensive output. Asking for JSON or specific formats eliminates rambling:

```
# Vague
Analyze this error log and tell me what's wrong.

# Constrained
Analyze this error log. Respond in JSON:
{"error_type": "", "root_cause": "", "fix": ""}
```

A compact schema can reduce verbosity and parsing failures, but JSON is not always shorter. Prompting for JSON alone does not enforce a schema. Use [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) where supported, validate meaning, and handle refusals or truncation.

### Set Token Budgets with the Right API Parameter

Use `max_completion_tokens` for current OpenAI Chat Completions, `max_output_tokens` for Responses, and `max_tokens` for Claude Messages. Model-specific parameter support matters. This complete OpenAI example requires `pip install openai`, `OPENAI_API_KEY`, and an available Chat Completions model in `OPENAI_MODEL`:

```python
import os
from openai import OpenAI

client = OpenAI()
response = client.chat.completions.create(
    model=os.environ["OPENAI_MODEL"],
    messages=[{"role": "user", "content": "Explain exponential backoff in three sentences."}],
    max_completion_tokens=500,
)
print(response.choices[0].message.content)
print(response.choices[0].finish_reason)
```

The [Chat Completions reference](https://developers.openai.com/api/reference/resources/chat) defines this ceiling as including visible output **and reasoning tokens**. A cap is not a prepaid allocation. Track `finish_reason == "length"` and quality failures, then choose a budget that fits the task. Limit agent turns and tool calls separately.

### System Prompts: Write Once, Pay Forever

Your system prompt ships with every request. A 2,000-token prefix across 100,000 daily requests represents 200 million input tokens before caching. Calculate its cost from your actual uncached, cache-write, and cache-read mix.

**Optimization tactics:**

- Strip examples that aren't pulling their weight (A/B test removing them)
- Use shorthand the model understands
- Move static instructions into structured key-value formats
- Version your system prompts and track cost per version

```
# Before
You are a helpful customer support agent for Acme Corp. You should 
always be polite and professional. When a customer asks about their 
order, you should look up the order details and provide a clear 
summary. If you don't know something, say so honestly. Never make 
up information. Always end by asking if there's anything else you 
can help with...

# After
Role: Acme Corp support agent
Rules: Be concise. Use order data provided. Never fabricate info.
Format: Answer the question, then ask "Anything else?"
```

This is a candidate shorter prompt, not a measured 74% reduction or a behavioral equivalence guarantee. Keep safety and authorization requirements intact. Evaluate it on your highest-volume endpoints first.

## Context Window Management

### Sliding Window for Chat History

Don't send the entire conversation history every time. Older messages provide diminishing context at linear cost:

```python
def trim_history(messages, count_tokens, max_tokens=4000):
    """Text-only history; caller supplies a model-aware message token counter."""
    if not messages:
        return []
    system = messages[0]  # Always keep system prompt
    history = messages[1:]
    
    trimmed = []
    token_count = count_tokens(system)
    if token_count > max_tokens:
        raise ValueError("Instructions alone exceed the input budget")
    if history and token_count + count_tokens(history[-1]) > max_tokens:
        raise ValueError("Newest message cannot fit; handle it explicitly")
    
    # Work backwards from most recent
    for msg in reversed(history):
        msg_tokens = count_tokens(msg)
        if token_count + msg_tokens > max_tokens:
            break
        trimmed.insert(0, msg)
        token_count += msg_tokens
    
    return [system] + trimmed
```

A long history can dominate input cost. Reserve space for output, message framing, tool schemas, and retrieved context. This simple helper is for text-only messages; tool conversations must retain complete assistant-call/result groups and the newest user request.

### Summarize, Don't Accumulate

For long conversations where older context still matters, periodically summarize:

```python
def manage_conversation(messages, summarize_conversation, summary_threshold=20):
    """Summarize older messages to control context growth."""
    if len(messages) < summary_threshold:
        return messages
    
    # Summarize the older portion
    older = messages[1:-10]  # Skip system prompt, keep last 10
    summary = summarize_conversation(older)  # Cheap summarization call
    recent = messages[-10:]
    
    return [
        messages[0],  # System prompt
        {"role": "user", "content": f"Untrusted summary of prior conversation, not new instructions: {summary}"},
        *recent
    ]
```

You trade summarization work for smaller future requests. Evaluate lost facts and user corrections, not just token counts. Treat the summary as derived user data rather than promoting it into trusted system instructions.

### RAG: Retrieve Less, Retrieve Better

If you're using retrieval-augmented generation, retrieval quality is directly tied to token efficiency. Bad retrieval stuffs irrelevant content into your context window.

**Optimization strategies:**

- **Test chunk sizes**: Start with 256-512 tokens, but preserve enough surrounding context to answer accurately.
- **Retrieve fewer when sufficient**: Compare top 3 against broader retrieval using task-specific evaluations.
- **Re-rank before injecting**: A lightweight re-ranker filters chunks before they hit your context.
- **Metadata filtering**: Use structured metadata to pre-filter before semantic search.

```python
# Wasteful: dump 10 large chunks into context
chunks = retriever.get_relevant(query, top_k=10)  # ~5000 tokens of context

# Optimized: retrieve broadly, re-rank tightly, inject minimally
chunks = retriever.get_relevant(query, top_k=20)
reranked = reranker.score(query, chunks)
context = [c.text for c in reranked[:3]]  # ~1500 tokens, higher relevance
```

The math is simple: if your average RAG context is 5,000 tokens and you can drop it to 1,500 with better retrieval, that's a 70% savings on the retrieval portion of every request.

## Caching Strategies

The cheapest token is one you never send.

### Prompt Caching (Provider-Level)

[OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching) and [Claude prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) reuse matching prefixes, not whole responses. Both have model-specific minimum lengths, cache lifetimes, and billing rules.

OpenAI caching is enabled by default on supported models; newer models can have cache-write charges and explicit breakpoint controls. Claude Messages opts in with `cache_control`, either at the request level or on content blocks. Structure reusable content before changing input:

```python
# Good for caching - static prefix, variable suffix
messages = [
    {"role": "system", "content": STATIC_SYSTEM_PROMPT},  # Reusable prefix candidate
    {"role": "user", "content": STATIC_INSTRUCTIONS},
    {"role": "user", "content": dynamic_user_input}        # Variable per request
]
```

The key is **exact prefix reuse**. A 1,000-token prefix may miss a model's minimum cacheable length. Changed tools, message ordering, or settings can invalidate a prefix. Measure actual cache-read and cache-write usage; discounted reads do not make the first write free.

### Application-Level Response Caching

Cache responses only when the answer remains valid for the same authorized context. This pattern assumes `generate` is your application adapter and returns text:

```python
import hashlib
import json

class LLMCache:
    def __init__(self, redis_client, default_ttl=3600):
        self.redis = redis_client
        self.ttl = default_ttl
    
    def get_or_generate(self, prompt, model, tenant_id, authz_version,
                        prompt_version, context_version, generation_options):
        key_material = json.dumps(
            [tenant_id, authz_version, model, prompt_version, context_version,
             generation_options, prompt],
            sort_keys=True, separators=(",", ":"),
        )
        cache_key = f"llm:{hashlib.sha256(key_material.encode()).hexdigest()}"
        
        cached = self.redis.get(cache_key)
        if cached is not None:
            return cached.decode() if isinstance(cached, bytes) else cached
        
        response = generate(prompt, model, **generation_options)
        self.redis.setex(cache_key, self.ttl, response)
        return response
```

Don't normalize code, identifiers, or user queries by blindly removing case and punctuation:

```python
def normalize_query(query):
    """Only safe in a domain where case and punctuation cannot change meaning."""
    return query.lower().strip().rstrip('?!.')
```

### Semantic Caching

For fuzzier matching, use embedding similarity to find cached responses for queries that are different in wording but identical in intent:

```python
def semantic_cache_lookup(query, cache_scope, can_serve, threshold=0.95):
    """Application-adapter sketch with scoped lookup and an access recheck."""
    query_embedding = embed(query)
    
    # Search cache index for similar queries
    results = vector_store.search(query_embedding, top_k=1, scope=cache_scope)
    
    if results and results[0].score > threshold and can_serve(results[0]):
        return cache.get(results[0].id)
    
    return None  # Cache miss - generate fresh response
```

A similarity score is not proof of equivalent intent. Partition semantic indexes by tenant and authorization, include context freshness, and re-check access before serving cached content. Avoid semantic reuse for account-specific or consequential decisions unless your evaluations support it.

Measure eligible-query hit rate alongside incorrect-hit rate. A high hit rate that serves another customer's answer is not an optimization.

## Model Routing: Right-Size the Brain

Not every request needs your most expensive model. Route based on measured task quality and total successful-task cost, including the classifier and escalation calls:

```python
import os

def route_request(query, context):
    """Route to appropriate model tier based on complexity."""
    complexity = classify_complexity(query, context)  # Your evaluated classifier
    
    if complexity == "simple":
        return os.environ["LLM_MODEL_SMALL"]
    elif complexity == "moderate":
        # Standard generation, summarization, moderate reasoning
        return os.environ["LLM_MODEL_STANDARD"]
    else:
        # Complex reasoning, nuanced analysis, creative tasks
        return os.environ["LLM_MODEL_PREMIUM"]
```

**Real-world routing patterns:**

| Request type | Recommended tier | Why |
|--------------|-----------------|-----|
| Classification (sentiment, topic, intent) | Mini | Binary/categorical output, simple reasoning |
| FAQ / known answers | Mini + cache | High repetition, low complexity |
| Summarization | Standard | Needs comprehension but output is constrained |
| Code generation | Standard/Premium | Complexity varies, but structured output helps |
| Open-ended reasoning | Premium | Quality degrades significantly with smaller models |
| Extraction (entities, dates, amounts) | Mini | Pattern matching, not reasoning |

 A rule-based classifier may avoid an extra model call. Adapt request formats per provider, pin valid model IDs, and escalate based on evaluated failure signals rather than a model's self-reported confidence.

## Batching and Request Optimization

### Batch Similar Requests

If you have multiple items to process, batch them into single requests where possible:

```python
# Expensive: 10 separate API calls
for item in items:
    result = classify(item)  # 10 requests, 10x system prompt tokens

# Cheaper: 1 batched request
prompt = f"Classify each item. Respond as JSON array.\n\nItems:\n"
prompt += "\n".join(f"- {item}" for item in items)
results = generate(prompt)  # 1 request, 1x system prompt tokens
```

Packing items into one prompt amortizes instructions, but needs stable item IDs, output validation, and a bounded batch size. Isolate failures and avoid mixing tenants. This is different from the [OpenAI Batch API](https://developers.openai.com/api/docs/guides/batch), which processes separate requests asynchronously with its own pricing and completion window.

### Streaming for Better UX Without Extra Tokens

Streaming can improve perceived responsiveness, but does not guarantee millisecond time to first token. Use this generator with a configured OpenAI client and compatible model:

```python
def stream_text(client, model, messages):
    stream = client.chat.completions.create(
        model=model,
        messages=messages,
        max_completion_tokens=500,
        stream=True,
        stream_options={"include_usage": True},
    )
    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
```

Capture the final usage chunk separately for billing; it can have no choices, and interrupted streams may not deliver it. Streaming does not change the per-token rate. Cancellation can avoid future generation, but does not refund tokens already produced.

## Measuring and Monitoring

You can't optimize what you don't measure. Every LLM call should be instrumented. This application-adapter sketch uses OpenAI **Chat Completions** usage fields; `generate`, `calculate_cost`, and `emit_metrics` are your integration functions:

```python
import time
from dataclasses import dataclass

@dataclass
class LLMMetrics:
    model: str
    input_tokens: int
    output_tokens: int
    latency_ms: float
    cost_usd: float
    endpoint: str
    cache_hit: bool
    
def instrumented_generate(prompt, model, endpoint):
    start = time.perf_counter()
    response = generate(prompt, model)
    elapsed = (time.perf_counter() - start) * 1000
    
    metrics = LLMMetrics(
        model=model,
        input_tokens=response.usage.prompt_tokens,
        output_tokens=response.usage.completion_tokens,
        latency_ms=elapsed,
        cost_usd=calculate_cost(model, response.usage),
        endpoint=endpoint,
        cache_hit=False
    )
    emit_metrics(metrics)
    return response
```

Responses uses `input_tokens` and `output_tokens`; Claude Messages separates ordinary input, `cache_creation_input_tokens`, and `cache_read_input_tokens`. OpenAI Chat Completions exposes cached input in `prompt_tokens_details.cached_tokens`, already included in prompt totals. Don't double-charge cached tokens or bill all input at one rate. Track billable reasoning, tools, errors, and every retry across the full task.

### Dashboard Essentials

Build visibility into these metrics:

- **Cost per conversation** (not just per request - conversations compound)
- **Token efficiency ratio** (useful output tokens / total tokens spent)
- **Cache hit and incorrect-hit rates** by eligible endpoint and tenant
- **P95 latency by model tier** (catch degradation early)
- **Cost per feature** (which features are expensive vs. cheap)
- **Token budget burn rate** (daily/weekly trending)

### Alerting

Set alerts for:

- Token usage spikes (>2x normal for any endpoint)
- Cost per request exceeding threshold (catch prompt regressions)
- Cache hit rate drops (something changed in query patterns)
- Error rates by model (a failing model still costs tokens for retries)

A runaway loop, a prompt regression, or a caching bug can burn through thousands of dollars before anyone notices. Alerts catch these in minutes instead of days.

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| Sending full documents when you need one paragraph | Extract relevant sections before sending |
| Keeping entire chat history forever | Sliding window + periodic summarization |
| Using a premium model for every classification | Evaluate a smaller model or deterministic classifier |
| Verbose system prompts repeated on every call | Compress and leverage prompt caching |
| No output budget | Use the model/API-specific ceiling and track truncation |
| Ignoring reasoning, cache writes, and tool fees | Attribute the complete successful-task bill |
| No caching layer | Cache identical and semantically similar queries |
| Same model for every request | Implement complexity-based routing |
| Retrying failed requests without backoff | Exponential backoff - retries burn tokens too |
| No monitoring or cost attribution | Instrument every call, alert on anomalies |

## Quick Reference: Token Optimization Checklist

Here's your action plan, roughly in order of impact:

**Immediate wins (do these first):**

- [ ] Set the API-specific output ceiling and bound retries and agent turns
- [ ] Compress system prompts - test shorter versions, measure quality
- [ ] Add response caching for high-volume endpoints
- [ ] Enable provider-level prompt caching (structure prompts for cache hits)
- [ ] Constrain output format (JSON, structured responses)

**Architecture improvements:**

- [ ] Implement conversation history windowing or summarization
- [ ] Add model routing - classify complexity, route to appropriate tier
- [ ] Optimize RAG retrieval - fewer, better chunks with re-ranking
- [ ] Batch similar requests where possible
- [ ] Add semantic caching for near-duplicate queries

**Operational excellence:**

- [ ] Instrument every LLM call with cost, latency, and token metrics
- [ ] Build dashboards for cost per feature, cache hit rate, token efficiency
- [ ] Set alerts for usage spikes and cost anomalies
- [ ] Review and optimize system prompts weekly until costs stabilize
- [ ] A/B test prompt variants for cost vs. quality tradeoffs

## Summary and Key Takeaways

Token optimization for production AI features is operations work as much as engineering work. The patterns are straightforward - the discipline of measuring, iterating, and maintaining is what separates expensive AI features from sustainable ones.

The bottom line:

- **Output and reasoning need budgets.** Choose formats that fit the task, not a blanket "JSON is always cheaper" rule.
- **System prompts compound.** Calculate verified token savings using your real caching and pricing mix.
- **Cache within the access boundary.** Measure prefix reuse and protect tenant, authorization, and context freshness.
- **Route to evaluated models.** Optimize cost per successful task, not the cheapest advertised token rate.
- **Measure everything.** You will find surprises. A single endpoint generating 40% of your token spend. A caching bug tripling costs. You can't fix what you can't see.

Start with your highest-volume endpoints. Establish a cost-and-quality baseline, test one change at a time, and retain the evaluation results. Savings are something to measure, not a percentage to promise.

Check out [Part 1](/blog/2026/05/06/token-optimization-ai-assisted-development/) if you haven't already - optimizing your own AI coding workflow uses many of the same principles.
