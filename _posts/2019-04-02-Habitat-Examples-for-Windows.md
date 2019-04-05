---
layout: post
title:  "Habitat Examples for Windows"
date:   2019-02-05 13:49:00 -0600
category: Blog
tags: [blog, habitat, applications, windows]
---
## Summary

Greetings! Today, I'll be outlining some examples and patterns for packaging Windows applications with [Habitat](https://www.habitat.sh).

## Habitat basics

Habitat uses a couple objects to build an artifact, the plan file, default.toml, user config files, and lifecycle hooks.

The plan file is the primary object for creating the artifact. It tells Habitat were to get the source files, how to build the app, where to put the files, etc.

The lifecycle hooks control how the app behaves once it's deployed. They are responsible for running the app, doing heath-checks, shutting down the app, reconfiguring the app, etc.

For the config files, we'll only focus on the `default.toml` in these examples.

To learn more, head over to the [Habitat](https://www.habitat.sh) website or check out the [Try Habitat](https://learn.chef.io/modules/try-habitat#/demos-and-quickstarts) module in [Learn Chef Rally](https://learn.chef.io).

``` bash
# Example directory structure of a Habitat plan
├── config
├── default.toml
├── hooks
│   ├── health-check
│   ├── init
│   ├── install
│   ├── post-stop
│   └── run
└── plan.sh (or plan.ps1)
```

## Pseudo coding

A good way to start building a plan is to write pseudo code in the files before writing actual code. This will allow you to capture your logic and identify the proper paths and variables.

``` bash
#Pseudo Code

# Download
# Fetch source from repo

# Unpack
# Unpack zip file to a subfolder in the hab cache

# Install
# Copy the files from from the cache to the bin location

```

``` bash
# Real code
$pkg_version="3.7.3"
$pkg_source="https://www.python.org/ftp/python/${pkg_version}/python-${pkg_version}-embed-amd64.zip"
$pkg_filename="python-${pkg_version}-embed-amd64.zip"
$pkg_deps=@("core/7zip")
$pkg_bin_dirs=@("bin")

function Invoke-Unpack{
    cd $HAB_CACHE_SRC_PATH
    7z x -y $pkg_filename  -o*
}

function Invoke-Install{
    Copy-Item -Path "$HAB_CACHE_SRC_PATH\python-3.7.3-embed-amd64\*" -Destination "$pkg_prefix\bin" -recurse
}
```

## Examples

These are the main types of patterns we see in the field so I'm going to outline the basic info needed to get started. All applications have their own essence/flavor so they may need additional tuning beyond what's outlined here.

* Zipped Artifact (my_app.zip)
* Executable binary (my_service.exe)
* Git Repository
* Legacy folder (\My_App\)
* MSI based Installers
* EXE based Installers

### Zipped Artifact

#### Background

In this example, we have an app team with an existing build pipeline. Their pipeline also publishes a zipped archive of the application files to URL based storage (Artifactory, S3, etc).

Habitat's default behavior is to download the file, verify the checksum, then unpack the archive into $HAB_CACHE_SRC_PATH/$pkg_name-$pkg_version

#### Code

### Executable Binary

### Git Repository

### Legacy Folder

### MSI Based Installers

### EXE Based Installers

## Troubleshooting

### Environment Variables

A common question we get is how do we set the environment variables needed and make them permanent? This is how I set them:

```PowerShell
# Add hab directory to path
[System.Environment]::SetEnvironmentVariable("Path", $($env:PATH + ";C:\habitat;"), "Machine")

# Reload Path environment variable for immediate use
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Set the URL for BLDR if running Habitat Depot on-prem
[System.Environment]::SetEnvironmentVariable("HAB_BLDR_URL", "FQDN_OF_PRIVATE_BLDR", "Machine")

# Reload BLDR environment variable for immediate use
$env:HAB_BLDR_URL = [System.Environment]::GetEnvironmentVariable("HAB_BLDR_URL","Machine")
```

### PowerShell Troubleshooting

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

### Logs and folders

Tell me more about the cache

Where are the logs (Get-SupervisorLog)

Where are the folders? What stuff goes where? Why do we have multiple folders? Possibly a tree output with descriptions

### Variables

What do I use when?
Why are there multiple variables that do the same thing?
Environment Variables: Get-ChildItem $Env:

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