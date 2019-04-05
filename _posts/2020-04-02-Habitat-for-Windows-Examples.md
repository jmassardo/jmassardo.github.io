---
layout: post
title:  "Habitat for Windows Examples"
date:   2019-02-05 13:49:00 -0600
category: Blog
tags: [blog, habitat, applications, windows]
---
## Summary

Greetings! Today, I'll be outlining some examples and patterns for packaging Windows applications with [Habitat](https://www.habitat.sh).

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

### Windows Role/Feature based installs



## Closing