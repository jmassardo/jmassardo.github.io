---
layout: page
title: "15lb NRL Combat Robot"
date: 2025-11-15
category: robotics
status: retired
excerpt: "National Robotics League legal 15lb combat robot build."
related_tags: [battlebots, robotics, nrl, combat-robots]
---

## Overview

A 15lb combat robot built to National Robotics League (NRL) specifications. This heavier weight class allows for more sophisticated systems and greater durability.

## NRL Compliance

Designed and built to meet all NRL safety and technical requirements for the 15lb weight class.

## Design Goals

- Maximum durability for extended matches
- Powerful weapon system
- Reliable electronics and control
- Strategic armor and geometry

## Construction

- Professional-grade components
- Robust drivetrain
- Competition-tested electronics
- Modular weapon systems

## Competition Experience

Building towards NRL tournament participation.

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
