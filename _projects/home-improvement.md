---
layout: page
title: "Home Improvement"
date: 2025-11-12
category: home
status: ongoing
excerpt: "Ongoing home improvement and renovation projects."
related_tags: [home-improvement, renovation, diy]
---

## Overview

Various home improvement and renovation projects to enhance functionality and aesthetics.

## Active Projects

Details of current home improvement projects coming soon.

## Completed Work

Documenting completed renovations and improvements.

## Related Posts

{% assign related_posts = site.tags.home-improvement %}
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
