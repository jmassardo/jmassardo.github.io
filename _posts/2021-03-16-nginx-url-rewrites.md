---
layout: post
title:  "Rewriting URLs with Nginx"
date:   2021-03-16 15:00:00 -0600
category: Blog
tags: [web, github, nginx]
excerpt: "In my post 'HTTPS for Multiple domains using GitHub pages', I was originally using a HTML file with a meta redirect. While this technique does work, I discovered a very annoying flaw. Anyone that had an old, or non-ssl link was redirected to the home page instead of the page or post they wanted. This isn't a delightful experience so I started doing some research to find a better path."
---
## Summary

In my post [HTTPS for Multiple domains using GitHub pages]({% post_url 2021-02-22-multiple-domain-redirect-github-pages %}), I was originally using a HTML file with a meta redirect. While this technique does work, I discovered a very annoying flaw. Anyone that had an old, or non-ssl link was redirected to the home page instead of the page or post they wanted. This isn't a delightful experience so I started doing some research to find a better path.

Fortunately, there's an easy way to redirect without breaking the links. Nginx refers to this as url rewriting. They have a handy post on [creating rewrite rules](https://www.nginx.com/blog/creating-nginx-rewrite-rules/) that I followed to fix my issue.

I removed the root, index, and location sections of my nginx config and replaced it with a config similar to this:

```bash
server {
    listen 80;
    listen 443 ssl;
    server_name old-name www.old-name.com;
    return 301 $scheme://new-name.com$request_uri;
}
```

> Note: I did change `$scheme` from the last line to `https` as I want to force SSL for all the sites.

## Closing

While these aren't step-by-step directions, hopefully it's enough for someone else to solve the same problem I had. If you have any questions or feedback, please feel free to contact me: [@jamesmassardo](https://twitter.com/jamesmassardo)
