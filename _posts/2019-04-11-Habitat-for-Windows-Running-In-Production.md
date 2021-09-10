---
layout: post
title:  "Habitat for Windows in Production"
date:   2019-04-11 12:00:00 -0600
category: Blog
tags: [habitat, applications, windows]
excerpt: "Today, I'll be sharing some notes about running [Habitat](https://www.habitat.sh) for Windows in Production."
---
## Summary

Today, I'll be sharing some notes about running [Habitat](https://www.habitat.sh) for Windows in Production.

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

My personal guidance would be: if you are producing open source code, use BLDR; if you are running proprietary or protected code, use the Depot.

### Provisioning

First step is to get the Habitat binaries on our nodes. So how do we do that? Well... If you use [Terraform](https://www.terraform.io), you're in luck. We have a Habitat provisioner for Terraform to simplify this task.

#### Terraform

[Windows](https://github.com/chef-partners/terraform-provisioner-habitat) takes an extra step because the provisioner isn't directly in Terraform yet.

Install plugin:

``` bash
wget https://github.com/chef-partners/terraform-provisioner-habitat/releases/download/0.1/terraform-provisioner-habitat_dev_v0.1_darwin_amd64.tar.gz

tar -xvf terraform-provisioner-habitat_dev*.tar.gz

mkdir -p ~/.terraform.d/plugins/

mv terraform-provisioner-habitat_dev*/terraform-provisioner-habitat_dev* ~/.terraform.d/plugins/
```

> NOTE: This example fetches the macOS binary. If you are on another platform, you'll need to fetch the appropriate [release](https://github.com/chef-partners/terraform-provisioner-habitat/releases/tag/0.1).

Now that we have the plugin installed, we can use something like:

``` json
provisioner "habitat_dev" {
    peer = ""
    service {
      name = "core/sqlserver"
      topology = "standalone"
    }
    connection {
      type = "winrm"
      timeout = "10m"
      user = "${var.win_username}"
      password = "${var.win_password}"
    }
}
```

#### Other provisioning

Ok, so what about all the folks that can't use Terraform. In that case, we need to install Habitat directly on the nodes. There are two ways: if you use Chef, you can use the [Habitat cookbook](https://github.com/chef-cookbooks/habitat) on your existing nodes; if not, you can use your existing provisioning system to add in steps to [install](https://www.habitat.sh/docs/install-habitat/) the binaries. If you don't have a provisioning or configuration management tool, check out [Chef Workstation](https://www.chef.sh). It has the ability to run cookbooks in an ad-hoc fashion, either manually or scripted.

> Note: You'll notice the stark absence of sample code for this section. Unfortunately, there are so many permutations of infrastructure management tools that it's impossible to cover them. Fortunately, Habitat is quite easy to install. If you build a way to solve this problem, contact me and I'll add a link to your solution.

YAY!!! We're done, right? Well... yes and no. We now have Habitat installed but we still need to do a few things...

### Running the Supervisor

If you are using a Terraform provisioner, most of these items are taken care of for you. If you are managing your own installation process, you'll need to decide how you want to run the Habitat services.

As with most things Habitat, we have options. Let's compare our options:

| Option          | Pros | Cons |
| ------          | ---- | ---- |
| Windows Service | Built-in log management | Not viable for apps with UI (_see note in the Windows Service section._) |
| Scheduled Task  | Good for running the supervisor as a specific user | Requires additional setup. Same logging requirements as Startup script |
| Startup script  | Useful with apps that require User Interaction | No built-in logging. Script must redirect stdout to file and handle log rotation independently |

#### Tasks and Scripts

For the scheduled task and start-up script, you'll need to use either your provisioning system or config. mgmt. tool to create it.

If you use Chef, here's a simple resource to get you started:

``` ruby
windows_task 'Start Habitat Supervisor' do
  command 'hab sup run'
  cwd 'c:/habitat/'
  run_level :highest
  frequency :onstart
end
```

> NOTE: As I mentioned earlier, you'll need to add additional bits to this resource to log the supervisor output. You'll also need to rotate those logs.

#### Window Service

The Windows Service option is the simplest option. It's also the recommended option for most applications. If you have Chef, you can use the [Habitat cookbook](https://github.com/chef-cookbooks/habitat) to manage the service. Otherwise, use your provisioning/config tools to run the following commands:

``` PowerShell
hab pkg install core/windows-service
hab pkg exec core/windows-service install
Start-Service -ServiceName Habitat
```

> NOTE: Although Windows services are the preferred method, Windows services are not able to interact with a user session so if you need to launch any type of UI, consider using a scheduled task or other method.

### Rings

If you aren't familiar with the concept of supervisor rings, essentially, a ring is a way for supervisors to share data amongst each other. This information is normally configuration data that's exported by supervised services or data that's injected into the ring via something like `hab config apply ...`.

So why would we want a ring? Well... thanks to Josh Hudson and Andrew Defour, I can give you several reasons you want a ring:

1) Supervisors in the same service group that need to peer for leader election.
2) Supervisors across dependent services that rely on service bindings for config/service coordination.
3) Service discovery (I spun up in this environment -- give me a database)
4) Perceived ease of delivering global config changes.

  > This las one sounds a little condescending however, as we talk about building a singular shape for shipping change, configuration changes should follow that same shape just like any other change.

Now that we know some of the reasons why we might want a ring, how do we get one? Technically, we could use one big ring assuming we aren't gossiping a ton of data. In reality, we'll most likely use multiple rings.

Most Habitat deployments naturally partition by:

* A combo of Application or service boundaries
* Logical environments (dev, stage, prod)
* Network failure domains (regional data centers)
* Per-tenant environments (managed services teams, SaaS platforms)
* Micro-segmentation / East-West partitioning (netsec)

So what about Bastion rings? This is definitely something you should do in large deployments. These should actually be called Permanent Peers because they are still part of a given ring, however, they are there to manage the gossiping of data and don't serve actual content. Let's say we have a web farm, we may designate a trio of servers to host the ring. These systems would be joined with the `--permanent-peer` option so they always attempt to stay connected. Every other supervisor would be peered to these 3 servers using the `--peer` option.

Let's look at an example. We have 3 supervisor systems (192.168.0.1-3). We would run the following commands to start the supervisor and peer them to each other.

``` bash
# Command for 192.168.0.1
hab sup run --peer=192.168.0.2 --peer=192.168.0.3

# Command for 192.168.0.2
hab sup run --peer=192.168.0.1 --peer=192.168.0.3

# Command for 192.168.0.3
hab sup run --peer=192.168.0.1 --peer=192.168.0.2
```

Additional reading on peering [here](https://www.habitat.sh/docs/best-practices/#robust-supervisor-networks).

### Security

Now that we have a basic ring, how do we secure it? There are several pieces, so let's dive right in.

## What about rotating keys? how we do deliver new keys and restart supervisors without downtime

* We need encryption keys to protect our data on the wire so let's generate one:

  ``` bash
  hab ring key generate yourringname
  ```

  > NOTE: You’ll need to distribute this key to each of your supervisors in the ring. If you have multiple rings, you'll need to do this step for each ring. Having separate keys for each ring limits your exposure if one of your keys is exposed or compromised.

* We also need a service group key for protecting service group configuration:

  ```bash
  hab svc key generate servicegroupname.example yourorg
  ```

  > NOTE: We haven't discussed Service Groups yet although we'll briefly touch on them in the next section. You can read more about them [here](https://www.habitat.sh/docs/using-habitat/#service-groups).
  
  Start the Supervisor, specifying both the service group and organization that it belongs to:

  ```bash
  hab start --org yourorg --group servicegroupname.example yourorigin/yourapp
  ```

  > NOTE: Only users whose public keys that the Supervisor already has in its cache will be allowed to reconfigure this service group.

* To protect your hab http gateway (holds sensitive config and ring data), set the HAB_SUP_GATEWAY_AUTH_TOKEN environment variable to a value on all of your supervisors.
Once this is set, the supervisor will use http auth to access the endpoint.

  ```bash
  export HAB_SUP_GATEWAY_AUTH_TOKEN=<mygatewaypassword>
  ```

Additional reading on encryption [here](https://www.habitat.sh/docs/using-habitat/#using-encryption).

### Channels/ Package Updates

How will we update artifacts?
How do we decide on a channel structure?

### Configuration Changes

How do we update configurations when there's a change?

### Monitoring

How do we monitor the supervisors?

## Closing

As you can see, there are a number of things to consider; however, most all of them are small, easy to complete chunks of work. It feels like a ton of work to start with, but it normally only takes a few days to work through all of it.

Special thanks to Josh Hudson and Andrew Defour for letting me use info from their ChefConf 2019 session. I highly recommend checkout out their [presentation](https://chefconf.chef.io/conf-resources/lessons-field-chef-habitat-enterprise-scale/).

As always, if you have any questions or feedback, please feel free to contact me: [@jamesmassardo](https://twitter.com/jamesmassardo)
