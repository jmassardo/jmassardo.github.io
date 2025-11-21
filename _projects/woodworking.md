---
layout: page
title: "Woodworking Projects"
date: 2025-11-13
category: woodworking
status: active
excerpt: "Custom woodworking projects - part custom, part IKEA. All booklover heaven."
related_tags: [woodworking, maker, furniture]
---

## Overview

Combining traditional woodworking with modern solutions. Creating custom furniture and storage solutions for book lovers.

## Current Projects

### Custom Bookshelf System
Part custom woodwork, part IKEA integration. Building the ultimate book storage solution - a booklover's heaven.

## Approach

- Custom joinery and design
- Integration with IKEA components
- Space-optimized solutions
- Focus on aesthetics and function

## Related Posts

{% assign related_posts = site.tags.woodworking %}
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
