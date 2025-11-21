---
layout: page
title: "1lb BattleBot"
date: 2025-11-15
category: robotics
status: inactive
excerpt: "3D printed combat robot for 1lb weight class competition."
related_tags: [battlebots, robotics, 3dprinting, combat-robots]
---

## Overview

A lightweight combat robot designed for the 1lb weight class. Fully 3D printed chassis with competitive weapon systems.

## Design Philosophy

- Maximize use of 3D printing for rapid iteration
- Weight optimization for 1lb class
- Durable design for combat scenarios
- Easy to repair and modify

## Key Features

- 3D printed frame and armor
- Brushless motor drivetrain
- Weapon system optimized for weight class
- Modular design for quick repairs

## Competition Goals

Compete in local and regional 1lb combat robot events.

## Related Posts

{% assign related_posts = site.tags.battlebots %}
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
