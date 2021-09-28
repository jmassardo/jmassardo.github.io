---
layout: post
title:  "Setting up Shared Enterprise Actions"
date:   2021-09-09 21:45:00 -0500
category: Blog
tags: [github, actions, enterprise, runner]
excerpt: "I recently had a customer that wanted to set up shared runners in their enterprise but the docs weren't super clear so I wrote up these steps to make it easier."
---
## Summary

I recently had a customer that wanted to set up shared runners in their enterprise but the docs weren't super clear so I wrote up these steps to make it easier.

The TLDR; is that the permissions are restrictive by default so you have to go to each layer and enable actions and the runner.

Documentation links:

- [Creating a self-hosted runner](https://docs.github.com/en/actions/hosting-your-own-runners/managing-access-to-self-hosted-runners-using-groups#creating-a-self-hosted-runner-group-for-an-enterprise)

- [Fine-grained access for Runner groups](https://github.blog/2020-08-05-github-actions-enterprise-runners-and-fine-grained-access-settings-with-runner-groups/)

- [Make enterprise runners available to repos](https://docs.github.com/en/actions/hosting-your-own-runners/adding-self-hosted-runners#making-enterprise-runners-available-to-repositories)

- [Runner group access policies](https://docs.github.com/en/actions/hosting-your-own-runners/managing-access-to-self-hosted-runners-using-groups#changing-the-access-policy-of-a-self-hosted-runner-group)

## Process

- Go to the Enterprise > Policies > Actions.
  - Ensure that Actions is enabled for all organizations (or at minimum, the specific organizations that hold the repos that need the runner)

    ![actions policy](/public/img/ent_actions_1.png)
- Create (or update) a runner group and select all organizations (or the specific organizations)
  ![runner group](/public/img/ent_actions_2.png)
- Create a new runner and add it to the runner group
- Now go to each org that needs to use the runner and do the following:
  - Verify Actions is enabled at the org level (org > settings > actions > general
    ![actions permissions](/public/img/ent_actions_3.png)
- In the Runner Groups, select the runner group under the "Shared by the Enterprise" header
  ![enterprise runners](/public/img/ent_actions_4.png)
- Specify either all repos, or select the desired repos for access:
  ![repository access](/public/img/ent_actions_5.png)

## Automation

Obviously, this is a manual process and won't work if you have a large number of organizations. Since enterprises have so many different variations, I'm only including the base API calls.

``` bash
# create runner group
curl \
  -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/enterprises/ENTERPRISE/actions/runner-groups \
  -d '{"name":"name"}'

# Get a registration token
curl \
  -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/enterprises/ENTERPRISE/actions/runners/registration-token

# Add a runner to the group 
curl \
  -X PUT \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/enterprises/ENTERPRISE/actions/runner-groups/42/runners/42

# Ensure that all the repos in an org have the runner
curl \
  -X PUT \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/orgs/ORG/actions/runner-groups/42/repositories \
  -d '{"selected_repository_ids":[42]}'
```

## Closing

If you have any questions or feedback, please feel free to contact me: [@jamesmassardo](https://twitter.com/jamesmassardo)
