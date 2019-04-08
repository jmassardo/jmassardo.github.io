---
layout: post
title:  "Habitat for Windows Troubleshooting"
date:   2019-04-10 12:00:00 -0600
category: Blog
tags: [blog, habitat, applications, windows]
---
## Summary

Greetings! Today, I'll be reviewing some steps for troubleshooting [Habitat](https://www.habitat.sh) on Windows.

## PowerShell Troubleshooting

So you've written this awesome plan for your app but it throws errors during the build. Now what? How do you troubleshoot those failures since Hab studio cleans up after the build fails? The quickest way is to set breakpoints inside Studio. You can set breakpoints for any cmdlet or function by name to interrupt the build.

Let's take a look at an example where our plan is unpacking our source but it's failing in the install phase.

``` PowerShell
# Start up the hab studio
hab studio enter

# Let's set the breakpoint
Set-PSBreakpoint -Command Invoke-Install
  ID Script                      Line Command                     Variable                   Action
  -- ------                      ---- -------                     --------                   ------
   0                                  Invoke-Install

# Now let's build
build

Entering debug mode. Use h or ? for help.

Hit Command breakpoint on 'Invoke-Install'

At C:\src\plan.ps1:18 char:24
+ function Invoke-Install{
+
>

# Now we can troubleshoot.
# I'm going to provide some high level things as there are too many variations to get specific here.
# - Look at your directory structure?
# - Are the right folders there?
# - Are the folders named correctly?
# - Are they named as you expect them?
# - Are the necessary files in the cache folder?
# - Are the named correctly?
# - If you are running commands, try stepping through them manually and review the output.
# - With the breakpoint, you can single step through the commands  by using the `StepInto` option.
# - Type `h` and press enter to get more help for using the debugger.
```


```PowerShell
# If you forget the breakpoint id, we can find it
Get-PSBreakpoint
  ID Script                      Line Command                     Variable                   Action
  -- ------                      ---- -------                     --------                   ------
   0                                  Invoke-Install

# Now let's get rid of the breakpoint and run our build all the way through
Remove-PSBreakpoint 0
```

## Logs and folders

Tell me more about the cache

Where are the logs (Get-SupervisorLog)

Where are the folders? What stuff goes where? Why do we have multiple folders? Possibly a tree output with descriptions

https://www.habitat.sh/docs/reference/#sup-log-keys

### Variables

What do I use when?
Why are there multiple variables that do the same thing?

### Docker/Vagrant Networking

What tweaks do we need for docker/vagrant to make sure the node can reach bldr successfully

### Windows Service

``` PowerShell
hab pkg install core/windows-service
hab pkg exec core/windows-service install
Start-Service -ServiceName Habitat
```

> NOTE: Windows services are not able to interact with a user session so if you need to launch any type of UI, consider using a scheduled task or other method.

## Closing