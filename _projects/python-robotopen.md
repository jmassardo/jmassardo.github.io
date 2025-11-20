---
layout: page
title: "Python RobotOpen Library"
date: 2019-04-01
category: programming
order: 1
excerpt: "Porting RobotOpen libraries from Arduino to Python for Raspberry Pi-based robot controllers."
status: active
github: https://github.com/jmassardo/RobotOpen-RP3-Python-Library
related_tags: [python, robotics]
---

## Overview

We've been experimenting with vision processing with our FRC robots. Now that we're on our 3rd year with FRC, we've got a couple robots but not enough controllers. The actual RoboRIO controllers are quite expensive so we've been looking for an alternative.

## The Solution

We settled on [RobotOpen](http://www.team221.com/robotopen/gs.html) since it's built in a similar fashion and terminology to the FRC software. Plus it's open source so we can tailor it to our needs.

## Current Progress

The first thing is we want to run [Raspberry Pi's](https://www.raspberrypi.org/). This presents a problem since the RobotOpen libraries are for Arduino so we started porting them to Python.

### Key Features
- Python-based implementation
- Compatible with Raspberry Pi 3
- Maintains RobotOpen API compatibility
- Open source and customizable

## Related Posts

{% assign related_posts = site.tags.python | where_exp: "post", "post.tags contains 'robotics'" %}
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
