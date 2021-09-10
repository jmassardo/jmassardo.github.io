---
layout: post
title:  "Habitat for Windows Troubleshooting"
date:   2019-04-09 12:00:00 -0600
category: Blog
tags: [habitat, applications, windows]
excerpt: "Today, I'll be reviewing some steps for troubleshooting [Habitat](https://www.habitat.sh) on Windows."
---
## Summary

Today, I'll be reviewing some steps for troubleshooting [Habitat](https://www.habitat.sh) on Windows.

## Habitat executable

If you're running hab commands and it's not doing what you expect or you aren't sure what it's actually doing, try enabling debug logging:

``` PowerShell
$env:RUST_LOG="debug"; $env:RUST_BACKTRACE=1; hab sup run
```

## PowerShell Troubleshooting

So you've written this awesome plan for your app but it throws errors during the build. Now what? How do you troubleshoot those failures since Hab studio cleans up after the build fails? The quickest way is to set breakpoints inside Studio. You can set breakpoints for any cmdlet or function by name to interrupt the build.

Let's take a look at an example where our plan is unpacking our source but it's failing in the install phase.

``` PowerShell
# Start up the hab studio
hab studio enter

# Let's set the breakpoint
Set-PSBreakpoint -Command Invoke-Install
  ID Script Line Command        Variable Action
  -- ------ ---- -------        -------- ------
   0             Invoke-Install

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
  ID Script Line Command        Variable Action
  -- ------ ---- -------        -------- ------
   0             Invoke-Install

# Now let's get rid of the breakpoint and run our build all the way through
Remove-PSBreakpoint 0
```

## Logs and folders

Ok, cool. We've got our package running, how how do we see what it's doing?

* In the studio, it's easy, we run `Get-SupervisorLog` and BOOM! there's our data. If you aren't in the studio, this cmdlet isn't available.
* If you launched hab in a cmd or PowerShell window using `hab sup run`, then your logs will stream in that window.
* If you are running hab via the [Windows Service](https://github.com/habitat-sh/habitat/tree/master/components/windows-service), then the supervisor logs default to `$env:systemdrive\hab\svc\windows-service\logs`.
* If you want to launch the supervisor via another method, you'll need to redirect the output to a file. You'll also need to implement your own log rotation process to keep from filling the drive with logs.

If you are handling your own logging, use the `--no-color` option when starting the supervisor. This will prevent the text color formatting noise from being saved to your log file.

If you are planning to ingest your logs into another tool, check out the `--json-logging` option as it may make the log easier to process.

When you're looking at the logs, I'm sure you've noticed the two letters in parentheses, and wondered what they meant. Wonder no more. These letters are called Log Keys and signify the type of log message. Read more about them [here](https://www.habitat.sh/docs/reference/#sup-log-keys).

``` bash
hab-sup(MR): core/hab-sup (core/hab-sup/0.78.0/20190313123218)
hab-sup(MR): Supervisor Member-ID 9eba6f8580084b0b88f6bddb008e1b13
hab-sup(MR): Starting gossip-listener on 0.0.0.0:9638
hab-sup(MR): Starting ctl-gateway on 127.0.0.1:9632
hab-sup(MR): Starting http-gateway on 0.0.0.0:9631
```

We reviewed the folder structure in a previous post, however, let's review:

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
        # Output of the templated config files from the \config\ directory in your hab package
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

## Variables

There are a ton of variables available in Hab, so I want to focus on the ones that are the most useful.

* `$HAB_CACHE_SRC_PATH` - This is the main cache folder that Hab uses for downloads, extraction, and compilation.
* `$pkg_prefix` - The absolute path for your package.
* `$pkg_dirname` - This directory is created when Hab extracts an archive. Set to `${pkg_name}-${pkg_version}` by default. This is a subfolder of `$HAB_CACHE_SRC_PATH`

In general, we download and extract to the `$HAB_CACHE_SRC_PATH`, do any customization needed, then copy to `$pkg_prefix`. And most of the time, we target `$pkg_prefix\bin` as this allows us to expose that directory to other Habitat packages via `$pkg_bin_dirs=@("bin")`. If we specify the `$pkg_bin_dirs` in our plan, Habitat will automatically add that directory to the `PATH` of any package that depends on our application.

You may see the variable `$pkg_svc_path` and consider copying files there but as a best practice, don't copy binaries or executables there. Instead, configure your service to write data/logs/temp/configs to `$pkg_svc_path`.

You may notice that there are several instances where there are multiple variables for the same thing, e.g. `$pkg_prefix` and `$PREFIX`. In these cases, I tend to use the variables that start with `$pkg_` as that's how the majority of the other variables are and I like to keep things as consistent as I can.

## Other Notes

Firewall Rules - Depending on how you launch your app, you may need to add an exception to your host based firewall for hab.exe. If you do need one, consider adding it to your `init` hook of your application.

Promoting/Demoting - So we've got our package built and running in production. Awesome, right? We find a change that we need to make so we go through our process; write code, commit to SCM, pipeline builds and uploads to BLDR, and our node pulls down the new artifact. Easy Peasy. We go check on our app, only to find something is broken... Now what? Let's roll back. We go into BLDR (or use `hab.exe`) and we demote our version and we're done, right? Actually no. Habitat will run the newest version available in the cache so it won't see the demotion. To effectively fix our issue, we need to run our process again. Code change, commit, pipeline, etc. Now the supervisor will see a new version available and load it.

## Closing

As always, I hope you've found some valuable tidbits here. Check back as this post will undoubtedly receive updates as I find new things in Habitat.

If you have any questions or feedback, please feel free to contact me: [@jamesmassardo](https://twitter.com/jamesmassardo)
