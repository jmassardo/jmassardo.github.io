---
layout: page
title: "3lb Peter-Bar BattleBot"
date: 2025-11-15
category: robotics
status: inactive
excerpt: "Peter-bar design combat robot for 3lb weight class competition."
related_tags: [battlebots, robotics, combat-robots]
---

## Overview

A 3lb combat robot featuring a peter-bar weapon design. This weight class allows for more robust construction and more powerful weapon systems.

## Design Features

- Peter-bar weapon configuration
- Reinforced chassis for 3lb class
- Enhanced drivetrain for better control
- Strategic armor placement

## Weapon System

The peter-bar design provides excellent reach and impact force while maintaining maneuverability.

## Competition Goals

Compete in 3lb combat robot tournaments with a focus on offensive capability.

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
