---
layout: page
title: "Robotics Projects"
date: 2017-09-01
category: robotics
order: 5
excerpt: "Building robots that move by themselves!"
status: active
related_tags: [robotics, frc]
---

## Overview

It moves by itself!

Robotics projects focusing on autonomous systems, FRC competition robots, and related technologies.

## Current Focus

- FRC (FIRST Robotics Competition) robots
- Vision processing for autonomous navigation
- Embedded control systems
- Mechanical design and fabrication

## Related Posts

{% assign related_posts = site.tags.robotics %}
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
