---
layout: page
title: "Laser Embossed Coins"
date: 2025-11-14
category: crafting
status: active
excerpt: "Designing and producing custom coins using laser engraving and embossing techniques."
related_tags: [crafting, laser, coins, engraving]
---

## Overview

Creating custom commemorative coins and tokens using laser engraving and embossing techniques.

## Process

- Digital design in CAD software
- Laser engraving for fine detail
- Metal embossing for raised elements
- Finishing and patina treatments

## Materials

- Various metals (brass, copper, aluminum)
- Acrylic for prototyping
- Wood for special editions

## Equipment

- CO2 laser engraver
- Metal stamping/embossing tools
- Finishing supplies

## Applications

- Custom challenge coins
- Commemorative tokens
- Game pieces and collectibles
- Gift items

## Related Posts

{% assign related_posts = site.tags.laser %}
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
