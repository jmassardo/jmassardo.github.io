---
layout: page
title: "Handmade Jewelry"
date: 2025-11-18
category: crafting
status: active
excerpt: "Handcrafted jewelry including earrings, necklaces, and wire-wrapped charms."
related_tags: [jewelry, crafting, handmade]
---

## Overview

Creating unique, handmade jewelry pieces using traditional techniques and modern design sensibilities.

## Current Creations

- **Earrings** - Custom designs in various styles
- **Necklaces** - Statement pieces and delicate chains
- **Wire-wrapped charms** - Intricate wire wrapping techniques

## Techniques

- Wire wrapping
- Beading and stringing
- Metal working
- Stone setting

## Related Posts

{% assign related_posts = site.tags.crafting %}
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
