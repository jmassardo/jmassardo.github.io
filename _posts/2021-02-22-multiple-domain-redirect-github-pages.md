---
layout: post
title:  "HTTPS for Multiple domains using GitHub pages"
date:   2021-02-22 15:00:00 -0600
category: Blog
tags: [blog, web, github, nginx]
excerpt: "In today's modern Internet, nearly all browsers show a big warning when viewing an insecure/non-ssl site. If you own a single domain name and use [GitHub Pages](https://pages.github.com/) to host your site, this is a simple matter to resolve. So what happens if you own multiple domains that point to the same site?"
---
## Summary

***UPDATE:3/16/2021*** I found a very annoying bug with this deployment pattern. See the update here: [Rewriting URLs with Nginx]({% post_url 2021-03-16-nginx-url-rewrites %})

In today's modern Internet, nearly all browsers show a big warning when viewing an insecure/non-ssl site. If you own a single domain name and use [GitHub Pages](https://pages.github.com/) to host your site, this is a simple matter to resolve. One can easily navigate to the project settings (`https://github.com/<USERNAME>/<USERNAME>.github.io/`) and tick the `Enforce HTTPS` setting.

So what happens if you own multiple domains that point to the same site? Now we have a bit of a mess to untangle.

If this was a high volume or mission-critical site, I would use fit-for-purpose tooling with load balancers, CDNs, geo-redundant hosts, etc. But what about a simple page that doesn't get a lot of traffic? 

How can we do it on the cheap? 

## Problem

Let's take a look at my needs: 

* My primary site, [dxrf.com](https://dxrf.com), is [Jekyll](https://jekyllrb.com/) based and is hosted as a [GitHub Pages](https://pages.github.com/) site.
* I own 4 different domains that have served in various capacities over the years. As it stands right now, I want all 4 to redirect to my primary site.
* I want SSL certificates in place so HTTPS requests are redirected without warning/errors
* Low cost. I don't mind paying a few bucks for my needs but I don't want any expensive load balancers, app gateways, or CDN subscriptions.
* I want to learn something through the process.

## Solution

I settled on running a micro VM in a cloud subscription with [Nginx](https://www.nginx.com) serving redirects. The VM is super cheap, can handle multiple domains, and Nginx is compatible with [Certbot](https://certbot.eff.org/) so I automate the SSL enrollment/renewal process.

Let's look at the high level steps needed. This assumes you have GitHub pages working with your primary custom domain.

1. Provision VM with public IP address and ports 80-443 open
1. Install Nginx and provision virtual hosts for each domain name ([Virtual Server How-to](https://linuxize.com/post/how-to-set-up-nginx-server-blocks-on-ubuntu-18-04/))
1. ~~in the virtual host root directory `/var/www/domain.tld/html`, create an `index.html` page with a meta-refresh (see example below)~~ - Don't do this...
1. Update apex and `www` DNS records to point to VM's public IP.
1. Run [Certbot](https://certbot.eff.org/lets-encrypt/ubuntubionic-nginx) to generate SSL certificates

***Don't use this refresh, use the url rewrite from the link above***

Example `index.html`
```html
<!DOCTYPE html>
<html>
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Redirecting to https://dxrf.com</title>
    <meta http-equiv="refresh" content="0; URL=https://dxrf.com">
  </head>

  <link rel="canonical" href="https://dxrf.com">
</html>
```

## Notes/To-do's

There are a few caveats to this pattern a few things I still need to iron out.

* If the VM goes down, all but the primary domain will stop working as there's nothing to redirect the request. If downtime isn't something your site can tolerate, consider other hosting methods/patterns.
* [Let's Encrypt](https://letsencrypt.org/) certificates are only good for 90 days so we'll need something to auto-renew
* Since this is a single VM exposed to the Internet, make sure it stays up to date to reduce the risk of someone hijacking your server and sending your traffic elsewhere (or worse, making your site serve malware).

To-do List
* Automate VM and cloud infra provisioning (e.g. terraform)
* Automate Nginx config (e.g. chef/ansible)
* Automate certbot auto-renewal
* ~~Add Nginx config to redirect 404's to primary site (e.g. http://www.otherdomain.com/FileThatDoesntExist.html -> https://dxrf.com)~~ - DONE

## Closing

While these aren't step-by-step directions, hopefully it's enough for someone else to solve the same problem I had. If you have any questions or feedback, please feel free to contact me: [@jamesmassardo](https://twitter.com/jamesmassardo)