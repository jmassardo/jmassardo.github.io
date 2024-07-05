---
layout: post
title:  "Create a GHEC org via script"
date:   2023-01-12 14:15:00 -0500
category: Blog
tags: [github, automation, graphql]
excerpt: "A super common task is automating the creation of GitHub objects. One, organziations, isn't super well documented and kind of hard to find so I'm making a note on how to do it."
---
## Summary

A super common task is automating the creation of GitHub objects. One, organziations, isn't super well documented and kind of hard to find so I'm making a note on how to do it.

## Steps

Here's the GraphQL query in easy to read format

``` json
{
  mutation {
    create_org: createEnterpriseOrganization
    (
      input: {
        adminLogins: ["<ADMIN_HANDLE>", "<ADMIN_HANDLE>", "<ADMIN_HANDLE>"] 
        billingEmail: "<ADMIN_EMAIL>" 
        enterpriseId: "<ENTPRISE_ID>" 
        login: "<ORG_SLUG>" 
        profileName: "<ORG_FULL_NAME>" 
      }
    )
    {
      organization 
      {
        id
      }
    }
  }
}
```

Here's a working example.

``` bash
curl -H "Authorization: token ${GH_PAT}" -X POST \
-d '{"query": "mutation {create_org: createEnterpriseOrganization(input: {adminLogins: [\"<ADMIN_HANDLE>\", \"<ADMIN_HANDLE>\", \"<ADMIN_HANDLE>\"] billingEmail: \"<ADMIN_EMAIL>\" enterpriseId: \"<ENTPRISE_ID>\" login: \"<ORG_SLUG>\" profileName: \"<ORG_FULL_NAME>\" }){organization {id}}}"}' https://api.github.com/graphql
```

> NOTE: The data following the -d must be a single line string (a curl limitation)
The double quote marks in the graphql query must be escaped billingEmail: \"<ADMIN_EMAIL>\"

> NOTE: This uses curl because there's a bug in the gh command where it won't accept arrays. Once that bug is resolved, you'll be able to specify the admins in a simple array e.g. -f admins=‘[“usera”, “userb”]’

You can read more about GitHub's GraphQL endpoint in the [documentation](https://docs.github.com/en/graphql/overview/about-the-graphql-api).

## Closing

If you have any questions or feedback, please feel free to contact me: [@jennamassardo](https://www.threads.net/@jennamassardo)
