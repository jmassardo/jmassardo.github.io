---
layout: post
title:  "Effectively Managing Audits and Compliance"
date:   2019-06-13 12:00:00 -0600
category: Blog
tags: [compliance, audit, inspec]
excerpt: "Today, I'll be sharing some of my experiences working with audit and compliance. In a previous life, I was responsible for providing compliance data and responses for a portion of multiple internal audits and external examinations."
---
## Summary

Today, I'll be sharing some of my experiences working with audit and compliance. In a previous life, I was responsible for providing compliance data and responses for a portion of multiple internal audits and external examinations.

## Discussion

In my experience, audits are really about proving that you did what you said you were going to do. There are sets of standards but they are really only guidance, it's up to each individual company to define their specific policies. For example, the standard may say that all critical patches must be applied within 30 days of release. However, a company can reclassify a critical browser patch to a lower criticality if they have a mitigating control, like no internet access in the datacenter.

So how do we define what we're going to do? What I've found to be most successful is having the following:

* Policies - These define what you will and won't do. I.e. All critical patches are installed within 30 days of release, or Administrative user passwords are rotated every 90 days.
* Processes - These are normally a visual representation of your procedures. This is also a good place to show any dependencies on other teams and/or processes.
* Procedures - These define how you do things. These should be step by step and provide detail on everything to complete the task.
* Mitigating controls - This is where you provide additional detail about anything you may have that would lessen the risk and/or attack surface.
* Reporting/Validation - Have reports or accessible data that demonstrates your compliance. Also, have documentation for how the report is produced and validated. I.e. Here's the source code repository for the report code and the profiles that collect the data.

Story time. A few years ago, we had a new external examiner come in to review some of our processes. We gave him the reports that we had automated and they weren't in the format he wanted. He told us that we'd had to run his data collection script or we wouldn't pass because our reports weren't acceptable. He handed me a USB stick with a set of batch files and VB scripts. I told him we'd need to peer review the script and do some testing with it before we could run it.

He got mad and demanded that we run it THAT day or we would fail. Needless to say, this didn't sit well with us. I asked him "So you want us to take an untrusted USB drive and plug it into a server in our PCI datacenter; then you want us to run an untested, unverified script without following our peer review/ code testing process; and you want us to violate our change management processes by deploying something straight to production without following our deployment process?"

It was quite funny to watch him look for a hole to crawl in as he realized that there were multiple directors and sr. directors in the room and he had lost all of his credibility.

I've had other auditors and examiners push folks to see if they will hold to their processes but some will try to push you around just because they think they can.

## Implementation

For the policies and procedures, I normally keep these in documents that support change tracking (Word Docs stored in SharePoint or Google Docs). This allows you to show changes over time in your docs. It also allows you to show the auditor/examiner that you regularly update documentation.

The same things apply to the process docs/diagrams as well. I've used Visio, Draw.io, and LucidChart but any tool should work. Standard flow charts work for some processes but in general, I've found that cross-functional flow charts (sometimes called swimlanes) work the best as they allow you to accurately represent how requests flow between the various teams. These have a tremendous value outside of the audit process as well. It helps all the teams involved understand their parts. It also helps when you onboard new employees. It's easy for them to understand how work gets done.

In larger enterprises, mitigating controls are normally tracked along with the risk acceptance documentation in a [GRC tool](https://en.wikipedia.org/wiki/Governance,_risk_management,_and_compliance). For smaller organizations, you can track these in documents and store it with your other documentation. Really, the main thing is to explicitly call out the specific requirement (i.e. PCI 6.1) and identify what you're changing and why you're changing.

For the reporting piece, a code driven process is definitely a plus. Store the profiles you use to test the audit items version control. Follow a standardized [SDLC](https://en.wikipedia.org/wiki/Software_development_process) process. Use this information to demonstrate your processes.

Example:

* Profile changes are stored in version control
* Changes are peer reviewed before merging
* Changes follow an approval process to merge
* Merged changes flow through a standardized pipeline that requires testing/validation
* After testing, changes have an approval process for release to production.

With this, you can show that every change was tracked, reviewed, and had the appropriate approvals.

One other recommendation is to track the requirement information in the metadata of the control/test. This allows you to quickly find information about a specific control when you are working with the auditor/examiner.

Metadata example:

``` ruby
control 'sshd-8' do
  impact 0.6
  title 'Server: Configure the service port'
  desc 'Always specify which port the SSH server should listen.'
  desc 'rationale', 'This ensures that there are no unexpected settings' # Requires Chef InSpec >=2.3.4
  tag 'ssh','sshd','openssh-server'
  tag cce: 'CCE-27072-8'
  ref 'NSA-RH6-STIG - Section 3.5.2.1', url: 'https://www.nsa.gov/ia/_files/os/redhat/rhel5-guide-i731.pdf'

  describe sshd_config do
    its('Port') { should cmp 22 }
  end
end
```

## Closing

In closing, be prepared, be confident, and be thorough and you'll do fine. If you have any questions or feedback, please feel free to contact me: [@jamesmassardo](https://twitter.com/jamesmassardo)
