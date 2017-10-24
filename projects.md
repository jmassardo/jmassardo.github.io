---
layout: page
title: Current Projects
permalink: /projects/
order: 5
---


[Programming]({{ site.baseurl }}/blog/categories/#programming)
-----------
### Chef
We're deploying [Chef](https://www.chef.io) at work so I've been tinkering with it.

### CI/CD Tools
Part of the new tech behind this site are some CI/CD tools. I started with Jenkins, then found [TravisCI](https://travis-ci.org). TravisCI is a hosted service so I'm giving it a go to cut down on the infrastructure I need to manage.

The idea is that new posts go to [Github](https://www.github.com), then TravisCI sees the commit and pulls the new code. It then runs it through a proofer/verification process. If it doesn't detect any errors, it will eventually push the new code over to the site.

### Python
We've been experimenting with vision processing with our FRC robots. Now that we're on our 3rd year with FRC, we've got a couple robots but not enough controllers. The actual RoboRIO controllers are quite expensive so we've been looking for an alternative. We settled on [RobotOpen](http://www.team221.com/robotopen/gs.html) since it's built in a similar fashion and terminology to the FRC software. Plus it's open source so we can tailor it to our needs. The first thing is we want to run [Raspberry Pi's](https://www.raspberrypi.org/). This presents a problem since the RobotOpen libraries are for Arduino so we started porting them to [Python](https://github.com/jmassardo/RobotOpen-RP3-Python-Library).

### OpenCV
OpenCV is the main library used for FRC vision processing. We're still in the early stages of learning so I don't have much right now. We're primarily using [GRIP](http://wpiroboticsprojects.github.io/GRIP/#/) with a little manual tweaking.


Electronics
-----------
### Arduino

### Raspberry Pi

### Custom Circuits

Robotics
--------

It moves by itself?

Woodworking
-----------

a little old school work