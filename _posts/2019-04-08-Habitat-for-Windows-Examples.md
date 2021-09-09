---
layout: post
title:  "Habitat for Windows Examples"
date:   2019-04-08 12:00:00 -0600
category: Blog
tags: [blog, habitat, applications, windows]
excerpt: "Today, I'll be outlining some examples and patterns for packaging Windows applications with [Habitat](https://www.habitat.sh)."
---
## Summary

Today, I'll be outlining some examples and patterns for packaging Windows applications with [Habitat](https://www.habitat.sh).

## Examples

These are the main types of patterns we see in the field so I'm going to outline the basic info needed to get started. All applications have their own essence/flavor so they may need additional tuning beyond what's outlined here.

- [Summary](#summary)
- [Examples](#examples)
  - [Zipped Artifact](#zipped-artifact)
    - [Background](#background)
    - [Code](#code)
  - [Executable Binary](#executable-binary)
    - [Background](#background-1)
    - [Code](#code-1)
  - [Git Repository](#git-repository)
    - [Background](#background-2)
    - [Code](#code-2)
  - [Legacy Folder](#legacy-folder)
    - [Background](#background-3)
    - [Code](#code-3)
  - [MSI Based Installers](#msi-based-installers)
    - [Background](#background-4)
    - [Code](#code-4)
  - [EXE Based Installers](#exe-based-installers)
    - [Background](#background-5)
    - [Code](#code-5)
  - [Windows Role/Feature based installs](#windows-rolefeature-based-installs)
    - [Background](#background-6)
    - [Code](#code-6)
- [Closing](#closing)

### Zipped Artifact

#### Background

In this example, we have an app that's published as a zipped archive of the application files to URL based storage (Artifactory, S3, etc).

Habitat's default behavior is to download the file, verify the checksum, then unpack the archive into $HAB_CACHE_SRC_PATH/$pkg_name-$pkg_version so we'll only override the `Invoke-Install` callback.

[Source Link](https://github.com/habitat-sh/core-plans/tree/master/packer)

#### Code

```PowerShell
$pkg_name="packer"
$pkg_origin="core"
$pkg_version="1.3.5"
$pkg_maintainer="The Habitat Maintainers <humans@habitat.sh>"
$pkg_license=@('MPL2')
$pkg_bin_dirs=@("bin")
$pkg_source="https://releases.hashicorp.com/packer/${pkg_version}/packer_${pkg_version}_windows_amd64.zip"
$pkg_shasum="57d30d5d305cf877532e93526c284438daef5db26d984d16ee85e38a7be7cfbb"

function Invoke-Install {
  Copy-Item "$HAB_CACHE_SRC_PATH/$pkg_name-$pkg_version/$pkg_name.exe" $pkg_prefix\bin
}
```

### Executable Binary

#### Background

Next, we'll look at one that's a single executable, in this case NuGet. It's a single executable so there's no need for any unpacking. Since Habitat's default action is to attempt an unpack, we'll need to override the `Invoke-Unpack` callback to keep it from erroring out.

[Source Link](https://github.com/habitat-sh/core-plans/tree/master/nuget)

#### Code

```PowerShell
$pkg_name="nuget"
$pkg_origin="core"
$pkg_version="4.6.2"
$pkg_license=('Apache-2.0')
$pkg_upstream_url="https://dist.nuget.org/index.html"
$pkg_description="NuGet is the package manager for the Microsoft development platform including .NET."
$pkg_maintainer="The Habitat Maintainers <humans@habitat.sh>"
$pkg_source="https://dist.nuget.org/win-x86-commandline/v${pkg_version}/nuget.exe"
$pkg_shasum="2c562c1a18d720d4885546083ec8eaad6773a6b80befb02564088cc1e55b304e"
$pkg_bin_dirs=@("bin")

function Invoke-Unpack { }

function Invoke-Install {
  Copy-Item "$HAB_CACHE_SRC_PATH/nuget.exe" "$pkg_prefix/bin" -Force
}
```

### Git Repository

#### Background

Our app team is diligent about storing their code in a git repo, so let's go straight to the source! Since there's no `$pkg_source`, Habitat won't try to download or verify, so how do we get our files? We can use the `Invoke-Unpack` callback to do that for us.

[Source Link](https://github.com/jmassardo/moonsweeper-py)

#### Code

```PowerShell
$pkg_name="moonsweeper-py"
$pkg_origin="jmassardo"
$pkg_version="0.1.0"
$pkg_maintainer="James Massardo <james@dxrf.com>"
$pkg_license=@("Apache-2.0")
$pkg_deps=@('jmassardo/python')
$pkg_build_deps=@('core/git')
$pkg_description="Moonsweeper — A minesweeper clone, on a moon with aliens, in PyQt."
$pkg_upstream_url="https://github.com/mfitzp/15-minute-apps/tree/master/minesweeper"

function Invoke-Unpack{
    write-output "Attempting to clone repo"
    cd $HAB_CACHE_SRC_PATH
    git clone https://github.com/mfitzp/15-minute-apps.git
}

function Invoke-Install{
    Copy-Item -Path "$HAB_CACHE_SRC_PATH\15-minute-apps\minesweeper" -Destination "$pkg_prefix" -recurse
}
```

> NOTE: Please take note of the two different dependency types: `$pkg_deps` and `$pkg_build_deps`.
>
> - `$pkg_deps` includes dependencies that are needed during runtime.
> - `$pkg_build_deps` includes dependencies that are only used during the package build. In our example, we only need `core/git` to clone the repo during build so there's no need to include those files when we're running in production.

### Legacy Folder

#### Background

There are times when we need to put the source files and the Habitat files together. In this circumstance, we'll reference the `$PLAN_CONTEXT` variable as that has the location on your local dev machine for the files in your plan directory.

[Source Link](https://github.com/habitat-sh/contosouniversity)

#### Code

```PowerShell
$pkg_name="contosouniversity"
$pkg_origin="mwrock"
$pkg_version="0.1.0"
$pkg_maintainer="The Habitat Maintainers <humans@habitat.sh>"
$pkg_license=@("Apache-2.0")
$pkg_deps=@("core/dsc-core")
$pkg_build_deps=@("core/nuget")
$pkg_binds=@{"database"="username password port"}

  function Invoke-Build {
    Copy-Item $PLAN_CONTEXT/../* $HAB_CACHE_SRC_PATH/$pkg_dirname -recurse -force
    nuget restore "$HAB_CACHE_SRC_PATH/$pkg_dirname/C#/$pkg_name/packages.config" -PackagesDirectory "$HAB_CACHE_SRC_PATH/$pkg_dirname/C#/packages" -Source "https://www.nuget.org/api/v2"
    nuget install MSBuild.Microsoft.VisualStudio.Web.targets -Version 14.0.0.3 -OutputDirectory $HAB_CACHE_SRC_PATH/$pkg_dirname/
    $env:VSToolsPath = "$HAB_CACHE_SRC_PATH/$pkg_dirname/MSBuild.Microsoft.VisualStudio.Web.targets.14.0.0.3/tools/VSToolsPath"
    ."$env:SystemRoot\Microsoft.NET\Framework64\v4.0.30319\MSBuild.exe" "$HAB_CACHE_SRC_PATH/$pkg_dirname/C#/$pkg_name/${pkg_name}.csproj" /t:Build /p:VisualStudioVersion=14.0
    if($LASTEXITCODE -ne 0) {
        Write-Error "dotnet build failed!"
    }
  }
  
  function Invoke-Install {
    ."$env:SystemRoot\Microsoft.NET\Framework64\v4.0.30319\MSBuild.exe" "$HAB_CACHE_SRC_PATH/$pkg_dirname/C#/$pkg_name/${pkg_name}.csproj" /t:WebPublish /p:WebPublishMethod=FileSystem /p:publishUrl=$pkg_prefix/www
  }
```

### MSI Based Installers

#### Background

Most Windows Admins are familiar with MSI based installers. We really need the files inside the MSI and not the installation instructions so let's use `lessmsi` to extract the MSI file. Depending on the application, you may need to add some additional actions:

- Set up additional app requirements such as registry keys via the `init` hook.
- Remove these items via the `post-stop` hook
- Consider using the `reload` and/or `reconfigure` hooks to update registry keys

These actions will allow you to use gossiped data and toml files to update the running config of the app, e.g redirecting an Win32 forms app to a different data base server.

[Source Link](https://github.com/habitat-sh/core-plans/tree/master/rust)

#### Code

```PowerShell
$pkg_name="rust"
$pkg_origin="core"
$pkg_version="1.33.0"
$pkg_description="Safe, concurrent, practical language"
$pkg_upstream_url="https://www.rust-lang.org/"
$pkg_license=@("Apache-2.0", "MIT")
$pkg_maintainer="The Habitat Maintainers <humans@habitat.sh>"
$pkg_source="https://static.rust-lang.org/dist/rust-$pkg_version-x86_64-pc-windows-msvc.msi"
$pkg_shasum="cc27799843a146745d4054afa5de1f1f5ab19d539d8c522a909b3c8119e46f99"
$pkg_deps=@("core/visual-cpp-redist-2015", "core/visual-cpp-build-tools-2015")
$pkg_build_deps=@("core/lessmsi")
$pkg_bin_dirs=@("bin")
$pkg_lib_dirs=@("lib")

function Invoke-Unpack {
  mkdir "$HAB_CACHE_SRC_PATH/$pkg_dirname"
  Push-Location "$HAB_CACHE_SRC_PATH/$pkg_dirname"
  try {
    lessmsi x (Resolve-Path "$HAB_CACHE_SRC_PATH/$pkg_filename").Path
  }
  finally { Pop-Location }
}

function Invoke-Install {
  Copy-Item "$HAB_CACHE_SRC_PATH/$pkg_dirname/rust-$pkg_version-x86_64-pc-windows-msvc/SourceDir/Rust/*" "$pkg_prefix" -Recurse -Force
}

# This isn't always needed
function Invoke-Check() {
  (& "$HAB_CACHE_SRC_PATH/$pkg_dirname/Rust/bin/rustc.exe" --version).StartsWith("rustc $pkg_version")
}
```

### EXE Based Installers

#### Background

A lot of windows utilities come packaged via exe based installers. Here, we'll look at installing 7zip using its exe installer. As you can see, we're starting to develop a pattern, download, unpack, install.

[Source Link](https://github.com/habitat-sh/core-plans/tree/master/7zip)

#### Code

```PowerShell

$pkg_name="7zip"
$pkg_origin="core"
$pkg_version="16.04"
$pkg_license=@("LGPL-2.1", "unRAR restriction")
$pkg_upstream_url="http://www.7-zip.org/"
$pkg_description="7-Zip is a file archiver with a high compression ratio"
$pkg_maintainer="The Habitat Maintainers <humans@habitat.sh>"
$pkg_source="http://www.7-zip.org/a/7z$($pkg_version.Replace('.',''))-x64.exe"
$pkg_shasum="9bb4dc4fab2a2a45c15723c259dc2f7313c89a5ac55ab7c3f76bba26edc8bcaa"
$pkg_filename="7z$($pkg_version.Replace('.',''))-x64.exe"
$pkg_bin_dirs=@("bin")

function Invoke-Unpack {
  Start-Process "$HAB_CACHE_SRC_PATH/$pkg_filename" -Wait -ArgumentList "/S /D=`"$(Resolve-Path $HAB_CACHE_SRC_PATH)/$pkg_dirname`""
}

function Invoke-Install {
  Copy-Item * "$pkg_prefix/bin" -Recurse -Force
}
```

### Windows Role/Feature based installs

#### Background

Ooo... Here's a tricky one... Let's say we need IIS to support our webapp.

[Source Link](https://github.com/habitat-sh/core-plans/tree/master/iis-webserverrole)

#### Code

```PowerShell
$pkg_name="iis-webserverrole"
$pkg_origin="core"
$pkg_version="0.1.0"
$pkg_maintainer="The Habitat Maintainers <humans@habitat.sh>"
$pkg_license=@("Apache-2.0")
$pkg_description="Installs Basic IIS Web Server features"
```

Hey, wait just a dang minute, where are the callbacks?!? Well... there aren't any. In this case, we can't actually fully package IIS because it's a Windows component. So now what? We still need IIS for our app. We use a different path, the `install` hook. This hook is triggered when you run `hab pkg install ....` We'll use it install the features/roles we need. It's not technically packaged in Hab but it is "habatized" in the sense that we can track it as a dependency and trigger the install if it's missing.

```PowerShell
# Install hook
function Test-Feature {
    Write-Host "Check if IIS-WebServerRole is enabled..."
    $(dism /online /get-featureinfo /featurename:IIS-WebServerRole) -contains "State : Enabled"
}

if (!(Test-Feature)) {
    Write-Host "Enabling IIS-WebServerRole..."
    dism /online /enable-feature /featurename:IIS-WebServerRole
    if (!(Test-Feature)) {
        Write-Host "IIS-WebServerRole was not enabled!"
        exit 1
    }
}
```

## Closing

I'd like to take credit for writing all these plans but, alas, I can't. Fortunately, the awesome folks on the Habitat team publish these, along with like 600 other core plans, in their github org, [Habitat-sh/Core-plans](https://github.com/habitat-sh/core-plans/blob/master/iis-webserverrole/plan.ps1).

If you run across another significant pattern that isn't here, please let me know so I can update this page!

If you have any questions or feedback, please feel free to contact me: [@jamesmassardo](https://twitter.com/jamesmassardo)
