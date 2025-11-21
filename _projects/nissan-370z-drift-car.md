---
layout: page
title: "Nissan 370z Drift Car"
date: 2025-11-20
category: automotive
status: active
excerpt: "Custom built and wrapped Nissan 370z drift car project."
related_tags: [automotive, drift, nissan, 370z]
---

## Overview

A custom-built Nissan 370z being transformed into a dedicated drift car with custom modifications and wrap.

## Current Focus

- Custom build modifications for drift performance
- Professional wrap design and application
- Suspension and drivetrain upgrades

## Project Goals

- Complete drift-spec suspension setup
- Apply custom wrap design
- Track-ready drift performance

## Related Posts

{% assign related_posts = site.tags.automotive %}
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
