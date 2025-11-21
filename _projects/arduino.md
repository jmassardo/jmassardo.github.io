---
layout: page
title: "Electronics Projects"
date: 2025-11-11
category: electronics
status: active
excerpt: "Various electronics projects including Arduino, ESP32, and custom PCB designs."
related_tags: [electronics, arduino, esp32]
---

## Overview

Electronics projects spanning embedded systems, microcontrollers, and custom circuit design.

## Focus Areas

- Arduino and ESP32 development
- Custom PCB design and fabrication
- Sensor integration and IoT devices
- Embedded firmware development

## Related Posts

{% assign related_posts = site.tags.arduino %}
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
