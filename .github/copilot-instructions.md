# Jekyll Blog - AI Coding Instructions

## Project Overview
This is a Jekyll-based personal blog hosted on GitHub Pages at https://www.dxrf.com/blog. The site uses a custom theme with SCSS styling and focuses on DevOps, automation, and technical content.

## Blog Post Conventions
- **File naming**: `_posts/YYYY-MM-DD-title.md` (e.g., `2025-09-10-github-copilot-setup.md`)
- **Front matter**: Always include layout, title, date, category, tags, and excerpt
- **Content structure**: Start with intro, use section headers, end with summary/takeaways
- **Tone**: DevOps expert voice - friendly, helpful, slightly snarky but professional

Example front matter:
```yaml
---
layout: post
title: "Your Post Title"
date: 2025-09-10 10:00:00 -0500
category: Blog
tags: [devops, automation, github]
excerpt: "Brief summary of the post content"
---
```

## Styling Architecture
- **SCSS structure**: `/public/css/main.scss` imports from `_scss/` directory
- **Framework**: Uses Bourbon SCSS library in `_scss/bourbon/`
- **Components**: Modular SCSS in `_scss/component/` (hero, masthead, post, sidebar, etc.)
- **Base styles**: Global styles in `_scss/base/` following Poole theme patterns

## Jekyll Structure
- **Layouts**: `_layouts/` contains default.html, post.html, page.html
- **Includes**: `_includes/` has reusable components (head.html, sidebar.html)
- **Blog pages**: `/blog/` contains category and tag listing pages
- **Images**: Store in `/public/img/` and reference as `/public/img/filename.png`

## Key Patterns
- Use descriptive filenames with hyphens (not underscores) for posts
- Include code examples with proper syntax highlighting
- Link to official documentation when citing external sources
- Optimize images and use descriptive alt text
- Follow semantic HTML structure in layouts

## Development Workflow
- Preview locally with `bundle exec jekyll serve`
- Deploy automatically via GitHub Pages on push to master
- SCSS compiles automatically during Jekyll build
- No build artifacts to commit - Jekyll handles compilation

## Content Guidelines
- Write comprehensive, actionable content with examples
- Include proper citations and links to official docs
- Structure posts with clear headings and logical flow
- Provide practical takeaways and next steps
- Keep code examples concise but complete
