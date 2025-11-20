---
layout: page
title: "Arduino Projects"
date: 2018-06-20
category: electronics
order: 2
excerpt: "Various Arduino-based projects and experiments."
status: ongoing
related_tags: [arduino]
---

## Overview

Arduino projects focusing on embedded systems, sensors, and automation.

## Current Projects

*Coming soon - add your Arduino project details here*

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
