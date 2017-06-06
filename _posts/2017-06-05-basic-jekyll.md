---
layout: post
title:  "Basic Jeykll!"
date:   2017-06-05 21:16:00 -0500
category: Blog
tags: [blog]
---

I guess I should blog some of the stuff I'm tinkering with so I don't forget what I'm learning. I'm going to start at the base and log a few bits and commands about getting started with [Jekyll](https://jekyllrb.com/).

First off, you need to install Jekyll. I'm currently using a Mac and I have the full build of Ruby installed for some Chef tinkering so I was able to follow the [Jekyll Quickstart](https://jekyllrb.com/docs/quickstart/). I did have to change the install path as described on the [Jekyll Troubleshooting](https://jekyllrb.com/docs/troubleshooting/) page.

Ok, hopefully you got it installed so let's actually do something with it.

{% highlight shell %}
# Install Jekyll and Bundler gems through RubyGems
~ $ gem install jekyll bundler

# Create a new Jekyll site at ./myblog
~ $ jekyll new myblog

# Change into your new directory
~ $ cd myblog

# Build the site on the preview server
~/myblog $ bundle exec jekyll serve

# Now browse to http://localhost:4000
{% endhighlight %}

(Yeah, I know, looks familar, eh? That's cause I copied it straight from the [Quickstart guide](https://jekyllrb.com/docs/quickstart/)... It works, why reinvent the wheel...)

Next is to create a post.
{% highlight shell %}
# Create post file using the following format
# YEAR-MONTH-DAY-title.MARKUP 
~/myblog $ touch _posts/2017-06-05-basic-jekyll.md
{% endhighlight %}

From there, add your header and start writing. [Post Docs](https://jekyllrb.com/docs/posts/)