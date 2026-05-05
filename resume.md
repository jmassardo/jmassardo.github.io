---
layout: page
title: Resume
---

# Jenna Massardo

<p>
    {% for contact in site.author.contact %}
    {% assign iconname = "fa-brands fa-" | append: contact[0] %}
    {% if contact[0] == 'email' %}
    {% assign iconname = 'fa fa-envelope' %}
    {% endif %}
    <a href="{{ contact[1] }}">
      <i class="{{ iconname }}" aria-hidden="true"></i>
    </a>
    {% assign current_index = current_index | plus: 1 %}
    {% if current_index != len %}|{% endif %}
    {% endfor %}
</p>

## Summary

Technical executive and strategic advisor specializing in developer experience, platform engineering, and enterprise DevOps transformation. I partner with Fortune 500 engineering leaders to modernize software delivery, implement secure development practices, and drive measurable business outcomes. With deep expertise spanning infrastructure automation, policy-as-code, and AI-assisted development, I help organizations scale their engineering capabilities while maintaining security and compliance. Speaker, technical writer, and thought leader with a track record of enabling engineering teams to ship faster, safer, and smarter.

---

## Areas of Expertise

### PLATFORM ENGINEERING & DEVELOPER EXPERIENCE

Enterprise DevOps strategy, CI/CD architecture, GitHub Actions & workflows at scale, innersource program design, developer productivity optimization, engineering metrics & DORA adoption

### SECURITY & COMPLIANCE

DevSecOps implementation, policy-as-code (Open Policy Agent/Rego), software supply chain security, SBOM strategies, compliance automation, secrets management, security-first architecture

### AI-ASSISTED DEVELOPMENT

GitHub Copilot enterprise deployment, AI-augmented workflows, responsible AI adoption strategies, developer enablement for AI tooling

### CLOUD & INFRASTRUCTURE

Multi-cloud architecture (Azure, AWS, GCP), Kubernetes & container orchestration, infrastructure as code (Terraform), configuration management at scale

### TECHNICAL LEADERSHIP

Strategic technology advisory, enterprise architecture review, technical enablement & training, cross-functional stakeholder alignment, engineering team scaling

---

## Experience

#### STAFF CUSTOMER SUCCESS ARCHITECT | GITHUB | 2021 - PRESENT

Strategic technical advisor to GitHub's largest enterprise customers, driving adoption of modern software development practices across organizations with tens of thousands of developers.

* Serve as trusted technical advisor to Fortune 500 engineering leadership, providing strategic guidance on DevOps transformation, platform engineering, and secure software delivery
* Design and architect enterprise-scale GitHub deployments including Actions CI/CD pipelines, advanced security configurations, and Copilot rollout strategies
* Lead technical enablement programs that accelerate customer adoption of GitHub's platform capabilities, resulting in measurable improvements to developer velocity and security posture
* Develop and deliver executive-level presentations on emerging practices including AI-assisted development, software supply chain security, and engineering effectiveness metrics
* Author technical content and best practices documentation; contribute to GitHub's body of knowledge on enterprise DevOps patterns
* Collaborate cross-functionally with product, engineering, and sales teams to translate customer needs into platform improvements

#### SR. CUSTOMER SUCCESS ARCHITECT | STYRA | 2021

Technical lead for enterprise customers implementing policy-as-code and authorization frameworks using Open Policy Agent (OPA).

* Designed and implemented authorization architectures for customers adopting cloud-native security patterns
* Developed Rego policies and testing frameworks for complex authorization requirements
* Delivered technical enablement on policy-as-code principles and OPA ecosystem best practices

#### LEAD CUSTOMER ARCHITECT | CHEF SOFTWARE (PROGRESS) | 2018 - 2021

Senior technical advisor responsible for driving customer success and product adoption across Chef's infrastructure automation portfolio.

* Partnered with enterprise customers to design compliance-as-code strategies using InSpec, enabling automated audit and security validation across hybrid infrastructure
* Led architecture reviews and provided strategic guidance on infrastructure automation at scale
* Developed reference architectures, sample code, and technical documentation; authored blog content on DevOps best practices
* Conducted technical enablement sessions and peer programming engagements to upskill customer engineering teams

#### ENGINEERING MANAGER & AUTOMATION ARCHITECT | JACK HENRY & ASSOCIATES | 2003 - 2018

Progressive leadership roles driving infrastructure automation strategy and engineering team development for a Fortune 1000 financial technology company.

* Led successful enterprise-wide deployment of configuration management to 11,000+ production servers, establishing compliance automation capabilities
* Built and mentored multiple high-performing teams including Systems Management, Operations Monitoring, and Security Infrastructure
* Managed distributed engineering teams and contributed to $10M+ technology budget planning
* Championed DevOps practices and automation adoption across business units through training, consultation, and internal evangelism
* Developed custom automation solutions and internal tooling to improve operational efficiency

---

## Thought Leadership

* **Technical Blog:** [dxrf.com/blog](https://www.dxrf.com/blog) — Writing on DevOps, platform engineering, and engineering leadership
* **Speaking:** Internal and customer-facing presentations on enterprise DevOps, GitHub best practices, and AI-assisted development
* **Open Source:** Contributor to documentation and community resources

---

## Education

#### NORTH ARKANSAS COLLEGE

* Associate of Applied Science, Computer Information Technology
* Associate of Applied Science, Electronics Technology

---

## Certifications

* GitHub Actions - Working with GitHub Actions in the Enterprise
* ITIL Foundations & Service Strategy
