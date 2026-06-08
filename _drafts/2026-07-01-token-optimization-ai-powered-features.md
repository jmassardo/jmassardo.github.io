---
layout: post
title: "Token Optimization for AI-Powered Features"
date: 2026-07-01 10:00:00 -0500
category: Blog
tags: [ai, llm, devops, cost-optimization, architecture, best-practices]
excerpt: "Building AI features into your product? Here's how to control token costs in production - from prompt engineering and context management to caching, model routing, and monitoring."
---

If you're building AI-powered features into your product, tokens are your biggest variable cost. A chatbot, code assistant, summarization pipeline, or classification service can look cheap in development and blow your budget in production.

This is Part 2 of a two-part series. [Part 1](/blog/2026/05/06/token-optimization-ai-assisted-development/) covers optimizing your daily AI coding workflow. This post focuses on building production AI features that don't hemorrhage money.

## The Token Cost Equation

Three factors drive your AI feature costs:

| Factor | What drives it up |
|--------|-------------------|
| **Input tokens** | Long system prompts, chat history, RAG context, verbose user inputs |
| **Output tokens** | Unstructured responses, no `max_tokens` ceiling, verbose formatting |
| **Request volume** | Every user interaction, every retry, every background job |

Output tokens typically cost 3-5x more than input tokens. That's not obvious but it's critical. A response that rambles for 2,000 tokens when 200 would do is costing you 10x what it should.

Quick reference for common model pricing:

```
GPT-4o:        128K context, ~$2.50/1M input, ~$10/1M output
Claude Sonnet: 200K context, ~$3/1M input, ~$15/1M output
GPT-4o-mini:   128K context, ~$0.15/1M input, ~$0.60/1M output
```

Prices shift constantly, but the ratios are what matter for architecture decisions.

## Prompt Engineering: Spend Less, Get More

### Be Direct, Cut the Fluff

Every word in your prompt costs money at scale. Compare:

```
# Wasteful (67 tokens)
I would like you to please help me by summarizing the following 
article. Please make sure the summary is comprehensive but also 
concise. Try to capture the main points and key takeaways. 
Here is the article:

# Optimized (12 tokens)
Summarize this article in 3 bullet points:
```

Same result. 80% fewer input tokens. At 100K requests/day, that's millions of tokens saved.

### Constrain Output Format

Unstructured output is expensive output. Asking for JSON or specific formats eliminates rambling:

```
# Vague (generates 200-500 token prose response)
Analyze this error log and tell me what's wrong.

# Structured (generates 50-80 token JSON response)
Analyze this error log. Respond in JSON:
{"error_type": "", "root_cause": "", "fix": ""}
```

Structured outputs are shorter, parseable, and more consistent. Triple win.

### Set Token Budgets with max_tokens

Always set `max_tokens` in your API calls. It's a hard ceiling that prevents runaway responses:

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    max_tokens=500  # Hard ceiling - prevents rambling
)
```

Find the right ceiling for each use case by analyzing actual response lengths. Set it at the 95th percentile of what you actually need. Too low truncates useful output. Too high means you're paying for filler on the long tail.

### System Prompts: Write Once, Pay Forever

Your system prompt ships with every single request. A 2,000-token system prompt across 100,000 daily requests is 200 million input tokens per day. At GPT-4o pricing, that's $500/day just on system prompts.

**Optimization tactics:**

- Strip examples that aren't pulling their weight (A/B test removing them)
- Use shorthand the model understands
- Move static instructions into structured key-value formats
- Version your system prompts and track cost per version

```
# Before (320 tokens)
You are a helpful customer support agent for Acme Corp. You should 
always be polite and professional. When a customer asks about their 
order, you should look up the order details and provide a clear 
summary. If you don't know something, say so honestly. Never make 
up information. Always end by asking if there's anything else you 
can help with...

# After (85 tokens)
Role: Acme Corp support agent
Rules: Be concise. Use order data provided. Never fabricate info.
Format: Answer the question, then ask "Anything else?"
```

74% reduction. Same behavior. Run this optimization on your highest-volume endpoints first.

## Context Window Management

### Sliding Window for Chat History

Don't send the entire conversation history every time. Older messages provide diminishing context at linear cost:

```python
def trim_history(messages, max_tokens=4000):
    """Keep recent messages within token budget."""
    system = messages[0]  # Always keep system prompt
    history = messages[1:]
    
    trimmed = []
    token_count = count_tokens(system)
    
    # Work backwards from most recent
    for msg in reversed(history):
        msg_tokens = count_tokens(msg)
        if token_count + msg_tokens > max_tokens:
            break
        trimmed.insert(0, msg)
        token_count += msg_tokens
    
    return [system] + trimmed
```

A 50-message conversation history can easily hit 20K+ tokens. A sliding window of the last 10 messages covers 90% of cases at a fraction of the cost.

### Summarize, Don't Accumulate

For long conversations where older context still matters, periodically summarize:

```python
def manage_conversation(messages, summary_threshold=20):
    """Summarize older messages to control context growth."""
    if len(messages) < summary_threshold:
        return messages
    
    # Summarize the older portion
    older = messages[1:-10]  # Skip system prompt, keep last 10
    summary = summarize_conversation(older)  # Cheap summarization call
    recent = messages[-10:]
    
    return [
        messages[0],  # System prompt
        {"role": "system", "content": f"Prior context: {summary}"},
        *recent
    ]
```

You trade a small summarization cost for dramatically reduced per-request token counts. For support conversations that run 30+ messages, this can cut costs 60-70%.

### RAG: Retrieve Less, Retrieve Better

If you're using retrieval-augmented generation, retrieval quality is directly tied to token efficiency. Bad retrieval stuffs irrelevant content into your context window.

**Optimization strategies:**

- **Chunk smaller**: 256-512 token chunks instead of 1024+. More precise retrieval, less noise per chunk.
- **Retrieve fewer**: Top 3 highly relevant chunks beat top 10 vaguely relevant ones.
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

OpenAI and Anthropic both offer prompt caching where repeated prompt prefixes are charged at a reduced rate (often 50-90% off). Structure your prompts to maximize cache hits:

```python
# Good for caching - static prefix, variable suffix
messages = [
    {"role": "system", "content": STATIC_SYSTEM_PROMPT},  # Cached after first call
    {"role": "user", "content": STATIC_INSTRUCTIONS},      # Cached
    {"role": "user", "content": dynamic_user_input}        # Variable per request
]
```

The key: put all static content at the beginning. Caching works on prefixes. If your system prompt is 1,000 tokens and it caches at 90% discount, you're saving $2.25/1M cached tokens on GPT-4o.

### Application-Level Response Caching

Cache LLM responses for identical or similar inputs:

```python
import hashlib
from functools import lru_cache

class LLMCache:
    def __init__(self, redis_client, default_ttl=3600):
        self.redis = redis_client
        self.ttl = default_ttl
    
    def get_or_generate(self, prompt, model="gpt-4o"):
        cache_key = f"llm:{model}:{hashlib.sha256(prompt.encode()).hexdigest()}"
        
        cached = self.redis.get(cache_key)
        if cached:
            return cached  # Zero tokens, instant response
        
        response = generate(prompt, model)
        self.redis.setex(cache_key, self.ttl, response)
        return response
```

For higher cache hit rates, normalize inputs before hashing:

```python
def normalize_query(query):
    """Normalize to increase cache hits on semantically identical queries."""
    return query.lower().strip().rstrip('?!.')
```

### Semantic Caching

For fuzzier matching, use embedding similarity to find cached responses for queries that are different in wording but identical in intent:

```python
def semantic_cache_lookup(query, threshold=0.95):
    """Find cached response for semantically similar query."""
    query_embedding = embed(query)
    
    # Search cache index for similar queries
    results = vector_store.search(query_embedding, top_k=1)
    
    if results and results[0].score > threshold:
        return cache.get(results[0].id)
    
    return None  # Cache miss - generate fresh response
```

Target 30%+ cache hit rate for common query patterns. Track it - you'll be surprised how many queries are near-duplicates.

## Model Routing: Right-Size the Brain

Not every request needs your most powerful (expensive) model. A smart router can cut costs 50-70% with minimal quality impact:

```python
def route_request(query, context):
    """Route to appropriate model tier based on complexity."""
    complexity = classify_complexity(query)  # Cheap mini-model call
    
    if complexity == "simple":
        # FAQ, yes/no, simple lookups - 95% of these are fine on mini
        return "gpt-4o-mini"       # $0.15/1M input
    elif complexity == "moderate":
        # Standard generation, summarization, moderate reasoning
        return "gpt-4o"            # $2.50/1M input
    else:
        # Complex reasoning, nuanced analysis, creative tasks
        return "claude-sonnet"     # $3/1M input - full power
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

For many production workloads, 60-70% of requests can be handled by the cheapest tier. The classifier itself can run on a mini model (or even a simple rule-based system) since the routing decision is a simple classification task.

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

You pay for your system prompt once instead of N times. For batch-friendly tasks (classification, extraction, formatting), this can reduce costs by 80%+.

### Streaming for Better UX Without Extra Tokens

Streaming doesn't save tokens, but it dramatically improves perceived performance. Users see the first token in milliseconds instead of waiting for the full response:

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    stream=True  # Same cost, much better UX
)

for chunk in response:
    yield chunk.choices[0].delta.content
```

Same token count, but time-to-first-token drops from seconds to milliseconds.

## Measuring and Monitoring

You can't optimize what you don't measure. Every LLM call should be instrumented:

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
    start = time.time()
    response = generate(prompt, model)
    elapsed = (time.time() - start) * 1000
    
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

### Dashboard Essentials

Build visibility into these metrics:

- **Cost per conversation** (not just per request - conversations compound)
- **Token efficiency ratio** (useful output tokens / total tokens spent)
- **Cache hit rate** by endpoint (target 30%+ for common patterns)
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
| Using GPT-4 for yes/no classification | Use a mini model or fine-tuned classifier |
| Verbose system prompts repeated on every call | Compress and leverage prompt caching |
| No `max_tokens` limit | Always set a ceiling appropriate to the task |
| Ignoring output token costs (3-5x more expensive) | Constrain output format aggressively |
| No caching layer | Cache identical and semantically similar queries |
| Same model for every request | Implement complexity-based routing |
| Retrying failed requests without backoff | Exponential backoff - retries burn tokens too |
| No monitoring or cost attribution | Instrument every call, alert on anomalies |

## Quick Reference: Token Optimization Checklist

Here's your action plan, roughly in order of impact:

**Immediate wins (do these first):**

- [ ] Set `max_tokens` on every API call
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

- **Output tokens are 3-5x more expensive than input.** Constrain your output format. A JSON response beats a prose paragraph every time.
- **System prompts compound.** A 200-token savings on your system prompt, multiplied by 100K daily requests, is $50-100/day on most models.
- **Caching is your biggest lever.** The cheapest token is one you never send. Cache aggressively at both the provider and application level.
- **Route to the right model.** 60-70% of requests probably don't need your most expensive model. A $0.15/1M model handles classification just as well as a $3/1M model.
- **Measure everything.** You will find surprises. A single endpoint generating 40% of your token spend. A caching bug tripling costs. You can't fix what you can't see.

Start with your highest-volume endpoints. Optimize the system prompt (it ships with every request), add caching, implement routing. You'll likely see 40-60% cost reduction from the first pass.

Check out [Part 1](/blog/2026/05/06/token-optimization-ai-assisted-development/) if you haven't already - optimizing your own AI coding workflow uses many of the same principles.
