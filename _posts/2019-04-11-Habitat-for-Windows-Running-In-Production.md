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

### Running the Supervisor

As with most things Habitat, we have options. Let's compare our options:

| Option          | Pros | Cons |
| ------          | ---- | ---- |
| Windows Service | Built-in log management | Not viable for apps with UI |
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

### Channels/Updates

### Security

## Closing