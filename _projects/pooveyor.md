---
layout: page
title: "Pooveyor - Automatic 3D Printer Waste Conveyor"
date: 2025-11-19
category: home-automation
status: active
excerpt: "ESPHome-powered automatic poop conveyor for Bambu 3D printers, integrated with Home Assistant."
related_tags: [homeassistant, esphome, 3dprinting, automation]
---

## Overview

The Pooveyor is an automatic waste removal system for Bambu Lab 3D printers. It uses ESPHome and Home Assistant to detect when the printer needs waste removed and automatically conveys it away.

## How It Works

- ESPHome-based controller monitors printer status
- Automated conveyor system removes waste from build plate
- Home Assistant integration for monitoring and control
- Custom sensors and triggers for reliable operation

## Tech Stack

- ESPHome firmware
- ESP32 microcontroller
- Home Assistant integration
- Custom mechanical conveyor design

## Related Posts

{% assign related_posts = site.tags.homeassistant %}
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
