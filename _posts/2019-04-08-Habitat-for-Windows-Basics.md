---
layout: post
title:  "Habitat for Windows Basics"
date:   2019-04-08 12:00:00 -0600
category: Blog
tags: [blog, habitat, applications, windows]
---
## Summary

Greetings! Today, I'll be introducing some of the basics for[Habitat](https://www.habitat.sh), specifically focusing on Habitat on Windows. I won't be covering all the things as the Habitat website has a tremendous amount of reference material. I will be calling out some things that are either pitfalls or differing between Linux and Windows.

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

The plan file in the main set of instructions on how to properly package up the application. We're going to use this demo plan as our example: [jmassardo/chromium](https://github.com/jmassardo/chromium/blob/master/plan.ps1). Feel free to clone it and give it a shot. The core of a Habitat plan contains [Variables](https://www.habitat.sh/docs/reference/#plan-variables), [Callbacks](https://www.habitat.sh/docs/reference/#reference-callbacks), and [Binds/Exports](https://www.habitat.sh/docs/developing-packages/#pkg-binds). I'll outline some basics here, check out the links for more detailed info.

#### Variables

Here are the main variables you'll need:

```PowerShell
# Give the package a useful name, preferably the name of the app.
$pkg_name="chromium"

# This is your origin name.
$pkg_origin="jmassardo"

# This one is up for some debate. Some use the version of the app they're packaging,others version the Hab plan itself. I lean toward the former as Hab automatically appends a datestamp to the hart when you do a build.
$pkg_version="647819"

# The person or group maintaining the package
$pkg_maintainer="James Massardo <james@dxrf.com>"

# This needs to be a valid license type. I'm sure there are other references but this is the one I use: https://help.github.com/en/articles/licensing-a-repository
$pkg_license=@("Apache-2.0")

# The source URL of the app, in this case a zip archive on CDN
$pkg_source="https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Win%2F${pkg_version}%2Fchrome-win.zip?alt=media"

# By default, Habitat will auto-download a zip so let's give it a friendly name
$pkg_filename="chrome-win.zip"

# Habitat does checksums on all source it downloads.
$pkg_shasum="c54cb6d1192fc3c016dc365c9b3fda21cfffc41d44b63c653ac351246478f6aa"
```

> NOTE: You can run commands (they vary by OS) to get the checksum or you can do a build in Habitat. Obviously, it will fail the first time but Studio will give you the computed checksum of the downloaded payload.

There are a ton of variables available in Hab, so I want to focus on the ones that are the most useful.

* `$HAB_CACHE_SRC_PATH` - This is the main cache folder that Hab uses for downloads, extraction, and compilation.
* `$pkg_prefix` - The absolute path for your package.
* `$pkg_dirname` - This directory is created when Hab extracts an archive. Set to ${pkg_name}-${pkg_version} by default. This is a subfolder of `$HAB_CACHE_SRC_PATH`

In general, we download and extract to the `$HAB_CACHE_SRC_PATH`, do any customization needed, then copy to `$pkg_prefix`. And most of the time, we target `$pkg_prefix\bin` as this allows us to expose that directory to other Habitat packages via `$pkg_bin_dirs=@("bin")`. If we specify the `$pkg_bin_dirs` in our plan, Habitat will automatically add that directory to the `PATH` of any package that depends on our application.

#### Callbacks

Habitat has a number of callbacks that control the various phases of the package build. For the most part, we let Habitat run it's default callbacks and only override the ones where we need to take additional action.

In our Chromium example, we're going to rely on the default callbacks to handle the download, verification, and unpacking of our app. We'll override the `Invoke-Install` callback so we can copy the files we need out of the cache to the package directory.

```PowerShell
function Invoke-Install{
    copy-Item -Path "$HAB_CACHE_SRC_PATH\chromium-647819\chrome-win" -Destination "$pkg_prefix\bin" -recurse
}
```

My next post will contain a set of example patterns for the majority of installer types on Windows.

#### Binds/Exports

When we talk about Habitat, the concept of contracts between applications is a prominent topic. This is the idea that each app knows what it provides and knows what it needs. Instead of prescribing a series of actions and checks to bring up a particular service (Orchestration), we start everything up and each app will wait until its dependent apps are running before moving on. This type of Choreography drastically reduces the amount of code (and effort) needed to get a service running.

Let's look at a real example. In this case, we have a web server and a database server. In the orchestration model, we'd write code to bring the database up, validate that it's listening, then we'd make sure the web server had the appropriate creds for the DB then bring it up. In the habitat model, we would set the web server to require bindings for the database and export the DB config on the database server.

```PowerShell
# Partial plan of web server
$pkg_name="my-web-app"
$pkg_origin="jmassardo"
$pkg_version="0.1.0"
$pkg_deps=@("core/iis-webserverrole")
$pkg_binds=@{"database"="username password port instance"}
```

```PowerShell
# Partial plan of database server
$pkg_name="my-db-server"
$pkg_origin="jmassardo"
$pkg_version="0.1.0"
$pkg_deps=@("core/sqlserver")
$pkg_exports=@{
  port="port"
  password="app_password"
  username="app_user"
  instance="instance"
}
```

Now when we deploy these apps, the web server will wait until its bindings are satisfied before it starts up.

Lets load up the apps:

```PowerShell
hab svc load jmassardo/my-db-server
hab svc load jmassardo/my-web-app --bind database:my-db-server.default
```

If we watch the supervisor output, we'll see that `jmassardo\my-web-app` will wait for the bindings before it fully starts up.

### Lifecycle hooks

As I'm sure you've gathered, Habitat has a ton of flexibility and the hooks are no exception. There are a number of them but we're only going to look at a couple. Fortunately, their names are all very logical.

* `init` - Any actions that need to take place when the service is initially loaded. Possibly set env vars, create/validate needed users, etc.
* `run` - This on is obvious but it does have some caveats. As you guessed, it's responsible for running the actual executables. The caveat is it needs to stay running for the entire time otherwise, Habitat will assume something happened to the app and it will try to restart it. The easiest way is to do a `Start-Process myapp.exe -wait`.
* `health-check` - The heath-check hook allows you to monitor your app and take action if something's wrong.
* `post-stop` - I call this the anti-init hook. This is where you'd undo anything that the `init` hook configured.

### Hab folders

Let's look at the structure of the `\hab\` directory and make note of what each folder does.

``` bash
# Fairly obvious, a local cache for storing objects
├── cache
    # Opt in or out of reporting analytics to Chef
│   ├── analytics
    # The hart files are cached here when they are downloaded
│   ├── artifacts
    # All harts are checksummed and signed. This directory contains the public keys used to validate those signatures
│   ├── keys
    # cURL's cacert.pem. Used for fetching the initial hab packages
│   └── ssl
# Contains the cli.toml. This file is created when running hab cli setup
├── etc
# Info for hab-launch. Things like it's process ID.
├── launcher
# This is where all packages are extracted.
├── pkgs
    # All of the core Habitat packages required
│   ├── core
    # There may be multiple directories here, one for each Hab Origin you use/depend on.
│   └── ...
# Local studios are stored here. This folder shouldn't exist on production machines.
├── studios
# Contains all of the information about the supervisor rings
├── sup
# Each supervised service will have a folder under svc\.
└── svc
    └── <service-name>
        # Output of the templatized config files from the \config\ directory in your hab package
        ├── config
        # Stored data consumed by app, i.e. databases
        ├── data
        # Gossiped configuration file that the Supervisor gets from peers in the ring
        ├── files
        # The lifecycle hooks from the package
        ├── hooks
        # Logs generated by the service
        ├── logs
        # Static content
        ├── static
        # Temp files
        └── var
```

## Closing

Congrats on making it through all of that info! Hopefully this post has clarified a few points and was helpful. If you're like me, documentation is invaluable, but it's nice to detail out some of the basics so the documentation actually makes sense!

As always, please fee free to contact me if you have any questions!