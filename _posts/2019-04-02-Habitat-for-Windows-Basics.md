---
layout: post
title:  "Habitat for Windows Basics"
date:   2019-02-05 13:49:00 -0600
category: Blog
tags: [blog, habitat, applications, windows]
---
## Summary

Greetings! Today, I'll be introducing some of the basics for[Habitat](https://www.habitat.sh), specifically focusing on Habitat on Windows..

## Habitat basics

Habitat uses a couple objects to build an artifact, the plan file, default.toml, user config files, and lifecycle hooks.

The plan file is the primary object for creating the artifact. It tells Habitat were to get the source files, how to build the app, where to put the files, etc.

The lifecycle hooks control how the app behaves once it's deployed. They are responsible for running the app, doing heath-checks, shutting down the app, reconfiguring the app, etc.

Habitat also supports updating the running config in a couple ways: the `default.toml` which, as the name suggests, contains the default config items our plan needs; the user config stored in `\hab\user\<service-name>\config\user.toml`; and by using `hab config apply ....`. We'll dig deeper in configs later on.

To learn more, head over to the [Habitat](https://www.habitat.sh) website or check out the [Try Habitat](https://learn.chef.io/modules/try-habitat#/demos-and-quickstarts) module in [Learn Chef Rally](https://learn.chef.io).

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

I'm including a real plan file. We'll go through these items deeper in the next section.

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

## Deep dive

Lets look at the main bits of a Habitat plan.

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

Ok, cool, but what are those things?

* Config - This directory hold configuration file templates. Habitat uses handlebar helpers to interpolate data. More info [here](https://www.habitat.sh/docs/developing-packages/#add-configuration).

  ```toml
  # Original config file:
  recv_buffer 128

  # Templated config file:
  recv_buffer {{cfg.recv_buffer}}
  ```

* default.toml - As I indicated above, this holds the default values used by the app. Let's say we have a plan for a web server. Normally, we'd want it to run on port 80 but there may be times we need it running on another port. This templating allows us to change it at run time instead of building multiple packages for the same app.

  ```toml
  [web]
  
  port = 80
  ```

### Plan.ps1

#### Variables

#### Callbacks

### Lifecycle hooks

### Configs

## Closing