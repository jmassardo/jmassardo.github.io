---
layout: page
title: "Silicone Mold Making"
date: 2025-11-14
category: crafting
status: inactive
excerpt: "Creating custom silicone molds for resin casting and reproduction work."
related_tags: [crafting, molds, silicone, casting]
---

## Overview

Making custom silicone molds for reproducing parts, creating resin casts, and general maker projects.

## Mold Types

- One-part molds for simple shapes
- Two-part molds for complex geometries
- Multi-part molds for undercuts
- Brush-on molds for large objects

## Process

- Master model preparation
- Mold box construction
- Silicone mixing and pouring
- Degassing and curing
- Mold release and finishing

## Materials

- Platinum-cure silicone rubber
- Tin-cure silicone for budget work
- Mold release agents
- Registration keys and keys

## Applications

- Resin casting production
- Prototype reproduction
- Replacement parts
- Art piece reproduction

## Related Posts

{% assign related_posts = site.tags.molds %}
{% if related_posts.size > 0 %}
<ul class="related-posts">
{% for post in related_posts limit:5 %}
  <li>
    <h3>
      <a href="{{ site.baseurl }}{{ post.url }}">
        {{ post.title }}
        <small>{{ post.date | date_to_string }}</small>
      </a>
    </h3>
  </li>
{% endfor %}
</ul>
{% else %}
<p><em>No related posts yet.</em></p>
{% endif %}
