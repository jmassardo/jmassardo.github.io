---
layout: post
title:  "Habitat for Windows in Production"
date:   2019-04-11 12:00:00 -0600
category: Blog
tags: [blog, habitat, applications, windows]
---
## Summary

Greetings! Today, I'll be sharing some notes about running [Habitat](https://www.habitat.sh) for Windows in Production.

### Notes

Great! So we've done some awesome work to package all our apps in Habitat and we've done a ton of testing. Now what?

First we need to answer some questions:

* Where are we going to store our artifacts?
  * [BLDR](https://bldr.habitat.sh) or On-Prem Depot?
* How are we going to get Habitat on our nodes?
  * Newly provisioned systems? existing fleet?
* How are we going to run Habitat on those nodes?
* How do we want to share data amongst the supervisors?
  * Everything in one big ring? Multiple rings? Bastion rings?
* How do we secure the rings?
* How will we update artifacts?
  * How do we decide on a channel structure?
* How do we update configurations when there's a change?
* How do we monitor the supervisors?

### Artifact Storage

With Habitat, we have two options for storing artifacts: BLDR and the Depot.

BLDR is Chef's cloud service for storing artifacts. BLDR makes it super easy and fast to get started, however, it lacks some of the RBAC and security that some enterprises want for production usage.

The Habitat Depot is an on-prem version of BLDR. Since it's running in your environments, you have more control over the authentication and access. If you have proprietary code in your packages, this also allows you to keep your code inside your environments.

My personal guidance would be: if you are producing open source code, use BLDR; if you are running your

### Provisioning

First step is to get the Habitat binaries on our nodes. So how do we do that? Well... If you use [Terraform](https://www.terraform.io), you're in luck. We have a Habitat provisioner for Terraform to simplify this task.

### Running the Supervisor

As with most things Habitat, we have options. Let's compare our options:

| Option          | Pros | Cons |
| ------          | ---- | ---- |
| Windows Service | Built-in log management | Not viable for apps with UI (_see note in the Windows Service section._) |
| Scheduled Task  | Good for running the supervisor as a specific user | Requires additional setup. Same logging requirements as Startup script |
| Startup script  | Useful with apps that require User Interaction | No built-in logging. Script must redirect stdout to file and handle log rotation independently |

#### Window Service

``` PowerShell
hab pkg install core/windows-service
hab pkg exec core/windows-service install
Start-Service -ServiceName Habitat
```

> NOTE: Windows services are not able to interact with a user session so if you need to launch any type of UI, consider using a scheduled task or other method.

### Rings

Everything in one big ring? Multiple rings? Bastion rings?

### Security

How do we secure the ring?

### Channels/ Package Updates

How will we update artifacts?
How do we decide on a channel structure?

### Configuration Changes

How do we update configurations when there's a change?

### Monitoring

How do we monitor the supervisors?

## Closing

As you can see, there are a number of things to consider; however, most all of them are small, easy to complete chunks of work. It feels like a ton of work to start with, but it normally only takes a few days to work through all of it.

As always, if you have any questions or feedback, please feel free to contact me: [@jamesmassardo](https://twitter.com/jamesmassardo)
