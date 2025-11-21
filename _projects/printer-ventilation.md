---
layout: page
title: "Automated Printer Ventilation System"
date: 2025-11-17
category: 3d-printing
status: active
excerpt: "Custom ventilation system for 3D printers and laser cutters to safely manage fumes and particles."
related_tags: [3dprinting, ventilation, safety, maker]
---

## Overview

A custom-built automated ventilation system designed to safely extract fumes and particles from 3D printers and laser cutters.

## Features

- Automated fan control based on printer status
- HEPA and activated carbon filtration
- Temperature and airflow monitoring
- ESP-based controller for smart operation
- Home Assistant integration

## Design Goals

- Safe indoor operation of printers and lasers
- Efficient air filtration
- Quiet operation
- Energy-efficient smart control

## Tech Stack

- High-CFM exhaust fans
- Multi-stage filtration (HEPA + carbon)
- ESP32 controller with sensors
- ESPHome firmware
- 3D printed ducting adapters

## Related Posts

{% assign related_posts = site.tags.3dprinting %}
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
