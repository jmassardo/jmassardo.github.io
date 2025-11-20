---
layout: page
title: "Raspberry Pi Projects"
date: 2018-09-10
category: electronics
order: 4
excerpt: "Raspberry Pi-based projects and experiments."
status: ongoing
related_tags: [raspberry-pi, python]
---

## Overview

Projects using Raspberry Pi for robotics, automation, and embedded computing.

## Current Projects

*Coming soon - add your Raspberry Pi project details here*

## Related Posts

{% assign related_posts = site.tags.raspberry-pi %}
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
