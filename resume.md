---
layout: page
title: Resume
---

# James Massardo

<p>
    {% for contact in site.author.contact %}
    {% assign iconname = contact[0] %}
    {% if contact[0] == 'email' %}
    {% assign iconname = 'envelope' %}
    {% endif %}
    <a href="{{ contact[1] }}">
        <i class="fa fa-{{ iconname }}" aria-hidden="true"></i>
    </a>
    {% assign current_index = current_index | plus: 1 %}
    {% if current_index != len %}|{% endif %}
    {% endfor %}
</p>

## Summary

Highly motivated Technologist specializing in configuration management, systems management, DevOps practices, infrastructure automation technologies, and service design/delivery. Aiming to use my proven skills in implementing technology, service design, and process management in a career where I can help organizations use technology to transform operations.

---

## Skills & Abilities

### LANGUAGES

.Net/C#, BASH, CSS, HTML, Java, PowerShell, Python, Ruby (Chef DSC and RAILS), Swift

### TECHNOLOGIES

#### Automation

Ansible, Chef Suite (Infra, InSpec, Habitat), Cloud (Azure, AWS, GCP, Kubernetes), CI/CD (Azure DevOps, GitLabCI, Jenkins, TravisCI), Terraform, Test Kitchen, Vagrant

#### Development

Eclipse, Git, GitHub, Visual Studio, VS Code

#### Microsoft

Active Directory, Azure, Certificate Services, Group Policy, IIS, Microsoft Deployment Toolkit, Office 365, SQL Server, System Center (Configuration Manager/InTune, Operations Manager, Orchestrator), Windows Client, Windows Server

#### Other

Apple/Mac, AWS, Docker, Gainsight, Google Suite, Kanban Tool, Hubspot, Linux (CentOS/Ubuntu), Salesforce, Spacewalk, Trello, VMWare Fusion, Zapier

### MANAGEMENT

* ~4 yrs. Experience in IT Leadership as a working Supervisor/Manager.
* Successfully developed 3 independent teams and transitioned to other managers or newly promoted supervisors.
* Assist in managing ~$10M in budget.
* Lead a distributed team including remote employees.

---

## Experience

#### Sr. Customer Success Architect | Styra | 1/2021 - Present

* My role as a Customer Success Architect is described as "All things proactive technical". I work with customers to design, develop, and implement best in class Authorization processes.

#### Lead Customer Architect | Chef Software | 5/2018 - 1/2021

* As a Customer Architect, my primary role is to help customers get the most value from Chef's products as I can. This includes performing architecture reviews, conducting technical enablement sessions where I teach a new technique or skill, peer programming/reviews, and process coaching. I also develop sample code, demos, and examples along with writing process guides and blog posts about best practices.

#### SYSTEMS ENGINEER, ADVANCED | JACK HENRY & ASSOCIATES | 12/2017 - 5/2018

* As a Systems Engineer, I act as an Automation Evangelist. My goal is to assist other groups in improving their operations through automation. This assistance takes many forms including training, consultation, peer programming, code reviews, and providing architecture/ engineering support. I develop samples and starters for groups that want to eventually own their own automation. I also develop complete automation solutions and custom applications to meet customer requirements.
* Duties included developing custom applications for internal customers, working with business units to identify operational deficiencies and develop custom automated workflows, presenting on automation and DevOps topics.
* Custom development
  * Notification system for Datacenter Operations Center (Ruby/RAILS)
  * Server Tagging Web service: automates identification of registry tattoo

#### SYSTEMS ADMINISTRATION MANAGER | JACK HENRY & ASSOCIATES | 1/2016 - 12/2017

* Duties included managing a dynamic, mostly remote team, assisting with department budget planning, leading peer meetings, mentoring peers, strategic planning for service design, transition, and operations, assisting customers with process automation, developing custom scripts/automated workflows/custom applications in PowerShell, .Net, Chef (Ruby). Lead successful effort to deploy Chef to 11K+ production datacenter servers for compliance management.
* Responsible for writing business proposals for new technology. Also, responsible for delivering regularly scheduled presentations to technical and business personnel on upcoming activities and new technologies being implemented.
* Participated in SCRUM team with internal development group. Worked with Product Owner to document requirements and user stories. Participated in daily standups. Worked with developers to facilitate software deployments into test, dev, and prod.
* Our team delivered systems management and infrastructure automation technologies to internal customers (over 22K systems) using technologies such as Chef, System Center Configuration Manager, Spacewalk, System Center Orchestrator.

#### SYSTEMS ADMINISTRATION SUPERVISOR | JACK HENRY & ASSOCIATES | 1/2014 – 1/2016

* Duties included supervising a team of 7 people including remote employees; assisting with budget planning; performing performance appraisals; coordinating training; managing project resources.
* Successfully built 3 teams as a Supervisor: a Systems Management Team, an Operations Monitoring Team, and a Certificate Services Team.
* Implemented ConfigMgr upgrades with the Systems Management Team. Deployed an enterprise wide monitoring solution using System Center Operations Manager. Designed and deployed an enterprise-class PKI Infrastructure.

#### SR. SYSTEMS ADMINISTRATOR | JACK HENRY & ASSOCIATES | 1/2003 – 1/2014

* Duties included deploying and maintaining a multi-site SCCM hierarchy; deploying software; deploying software updates; monitoring update and configuration compliance; providing reports for asset tracking, software license tracking, and assisting network security engineers with compliance reporting for unauthorized software; supporting Pc Technicians and Hardware Server Administrators with Operating System Deployment, including building boot images, building OS images, and task sequences. Other duties include administering Active Directory and Group Policy. Act as Subject Matter Expert for Systems Management technologies and processes.

---

## Education

#### ASSOCIATE OF APPLIED SCIENCE | 2003 | NORTH ARKANSAS COLLEGE

* Major: Electronics Technology

#### ASSOCIATE OF APPLIED SCIENCE | 2002 | NORTH ARKANSAS COLLEGE

* Major: Computer Information Technology

#### Certifications

* MTA: Cloud Fundamentals
* MCTS: System Center Configuration Manager
* ITIL Foundations v3.0
* ITIL Intermediate – Service Strategy
