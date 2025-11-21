---
layout: page
title: "Resin Casting"
date: 2025-11-14
category: crafting
status: inactive
excerpt: "Creating custom resin pieces including decorative items, keycaps, and functional parts."
related_tags: [crafting, resin, casting]
---

## Overview

Resin casting projects exploring various techniques for creating custom pieces, from decorative art to functional components.

## Current Projects

- Custom keycaps for mechanical keyboards
- Decorative art pieces and coasters
- Functional parts and prototypes
- Embedded object casting

## Techniques

- Two-part epoxy resin casting
- Color mixing and pigmentation
- Embedded objects and inclusions
- Pressure casting for bubble removal
- Vacuum degassing

## Materials & Equipment

- Epoxy resins (various viscosities)
- Silicone molds
- Pressure pot
- Vacuum chamber
- Pigments and dyes

## Related Posts

{% assign related_posts = site.tags.resin %}
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
