---
layout: page
title: "Woodworking Projects"
date: 2016-05-12
category: woodworking
order: 6
excerpt: "A little old school work with wood and hand tools."
status: hobby
related_tags: [woodworking, maker]
---

## Overview

A little old school work - combining traditional woodworking with modern maker tools.

## Current Projects

*Coming soon - add your woodworking project details here*

## Related Posts

{% assign related_posts = site.tags.woodworking %}
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
