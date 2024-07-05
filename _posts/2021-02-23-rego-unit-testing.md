---
layout: post
title:  "Rego Unit Testing"
date:   2021-02-23 7:00:00 -0600
category: Blog
tags: [unit, testing, rego, das, opa]
excerpt: "This post is going to outline some basics, interesting tidbits, and caveats on unit testing rego policies."
---
## Summary

This post is going to outline some basics, interesting tidbits, and caveats on unit testing rego policies.

## Unit tests

Let's start with an obvious question. What is a unit test? Compared to some of the other types of testing in tech, this one is pretty self-explanatory. A [unit test](https://en.wikipedia.org/wiki/Unit_testing) is a way to test individual components (or units) of a system. For example, if we had a rego policy that is supposed to deny requests that allow port 80, we'd write a unit test that sent an input that included that port with the expectation that we'd get a deny message back. This gives us a way to validate our policies without having to deploy them to a real system. It also gives us a way to validate that policy changes don't introduce any insecurities into our environment.

Generally speaking, unit tests are only needed for custom logic and shouldn't be used for prebuilt rules/functions of a tool. Also, while we're making general assumptions, do not strive for 100% test coverage. If you are using a provided library (e.g. Styra DAS), the provider already does testing so there's no need to repeat it. Unit tests can also add considerable delays to CI/CD when testing new policy changes.

## Example

Let's take a look at an example policy. This policy allows requests to `POST` to the `users` path.

``` rego
# example.rego

package authz

allow {
    input.path == ["users"]
    input.method == "POST"
}
```

Now let's take a look at the accompanying unit test.

``` rego
# example_test.rego

test_post_allowed {
    allow with input as {"path": ["users"], "method": "POST"}
}
```

Let's break this down.

* We have a test definition named `test_post_allowed`
* The test calls the specific policy definition and passes input to it.
* `allow` is the name of the policy definition
* `with` is a rego keyword that allows queries to access values in an `input` object.
* `{"path": ["users"], "method": "POST"}` is the test data being used `as` the input.

You can also store more complex data in a variable in the test definition.

``` rego
test_post_allowed {
    in := {"path": ["users"], "method": "POST"}
    allow with input as in
}
```

Now that we have a test, let's actually run it. Let's look at two ways we can accomplish this.

* Here's our example in [Rego Playground](https://play.openpolicyagent.org/p/ze9Rcomq6H). It's easy enough, load the page and click `Evaluate`.
* Now let's try it with [OPA](https://www.openpolicyagent.org/docs/latest/#running-opa).
  * Let's put our policy definition in a file `example.rego` and our test definition in a file `example_test.rego`
  * Now let's execute the tests by running:
  
  ``` bash
  % opa test . -v
  data.authz.test_post_allowed: PASS (3.697875ms)
  ```

## Testing conventions

There are a few conventions for writing rego tests.

* Tests should be named `<policyname>_test.rego`. E.g. if your policy is `ingress.rego`, then your test should be named `ingress_test.rego`
* All definitions in the test file should start with `test_` have a descriptive name. E.g. if your policy definition is `allow {...}`, then your test might be named `test_post_allowed {...}`

## Unit testing in Styra DAS

If you are using Styra DAS there are a couple things to consider. The main thing is all of the policy definitions are summed up into a single policy. Let's take a look at an example.

Here we have 2 definitions, but notice that both at named `enforce`. Recall that with our unit tests, we call the definition by name to execute a test.

```rego
enforce[decision] {
  not excludedNamespaces[input.request.namespace]
  data.library.v1.kubernetes.admission.workload.v1.block_privileged_mode[message]

  decision := {
    "allowed": false,
    "message": message
  }
}

enforce[decision] {
  data.library.v1.kubernetes.admission.audit.v1.require_auditsink[message]

  decision := {
    "allowed": false,
    "message": message
  }
}
```

So how do we test this? Well, we have options:

1. Don't write any tests at all. Since we're only consuming pre-built content, there's really no value in writing tests.
1. Write your tests so they test the policy as a whole. Provide "known good" input data in the test so all the definitions pass. This way, if a definition is changed, the test will fail.
1. If we really need to test individual definitions, we can give them specific names so we can call them separately. We lose some of the GUI functionality in DAS by doing this as the definitions become completely custom and not DAS managed. We also need to add an additional definition to include the result of our now custom one into the main DAS policy.

Let's look at an example of the last option. We'll use the same `enforce` definitions above but rename them so we can test them individually.

```rego
block_priv_mode[decision] {
  data.library.v1.kubernetes.admission.workload.v1.block_privileged_mode[message]

  decision := {
    "allowed": false,
    "message": message
  }
}

require_audit[decision] {
  data.library.v1.kubernetes.admission.audit.v1.require_auditsink[message]

  decision := {
    "allowed": false,
    "message": message
  }
}

enforce[decision] {
  block_priv_mode[decision]
}

enforce[decision] {
  require_audit[decision]
}
```

If you're wondering why there are two `enforce` rules, remember that in Rego, multiple definitions with the same name act as an `OR`. In this case, we're saying that we want `enforce` to be true if either `block_priv_mode` OR `require_audit` are true.

Now that we've got our DAS policy structured in a way that allows individual unit testing, let's look at an example test.

Two things to note:

* On the second line, we import rules package.
* Since our rules package is imported as `rules`, we need to use that namespace to call the definitions we want to test. In this example, we use `rules.block_priv_mode`.

```rego
package policy["com.styra.kubernetes.validating"].test.test

import data.policy["com.styra.kubernetes.validating"].rules.rules

test_block_priv_mode {
    in := {
  "kind": "AdmissionReview",
  "request": {
    "kind": {
      "kind": "Pod",
      "version": "v1"
    },
    "object": {
      "metadata": {
        "name": "myapp"
      },
      "spec": {
        "containers": [
          {
            "image": "nginx:0.1.0",
            "name": "nginx-frontend", 
            "securityContext": {
              "privileged": false
            }
          },
        ]
      }
    }
  }
}

    actual := rules.block_priv_mode with input as in
    count(actual) == 0
}
```

## Closing

Hopefully this post has been helpful getting started. The Open Policy Agent documentation has a lot more info on [policy testing](https://www.openpolicyagent.org/docs/latest/policy-testing/)

If you have any questions or feedback, please feel free to contact me: [@jennamassardo](https://www.threads.net/@jennamassardo)
