# Social Media Sharing Workflow

## Overview

The `social-share.yml` workflow automatically shares new blog posts to LinkedIn and Bluesky social media platforms.

## Features

- **Automatic Sharing**: Automatically posts to social media when new posts are added to `_posts/` directory
- **Manual Trigger**: Run manually for any existing post
- **Platform Selection**: Choose to post to both platforms or just one
- **Smart Content Formatting**: 
  - Extracts title, excerpt, and tags from post front matter
  - Generates hashtags from tags (max 5)
  - Creates properly formatted URLs
  - Handles character limits (300 chars for Bluesky)
- **Image Support**: Optionally includes featured images in posts (via `image` field in front matter)

## Triggers

### Automatic Trigger
The workflow runs automatically when:
- Changes are pushed to the `master` branch
- Files in the `_posts/` directory are **added** (not modified)
- Only the first new post is shared (if multiple posts are added at once)

### Manual Trigger
You can manually trigger the workflow from the GitHub Actions tab:
1. Go to Actions → Social Media Sharing
2. Click "Run workflow"
3. Enter the post path (e.g., `_posts/2026-01-12-my-post.md`)
4. Select platforms: `both`, `linkedin`, or `bluesky`

## Required Secrets

You must configure the following repository secrets in GitHub Settings → Secrets and variables → Actions:

### Bluesky
- `BLUESKY_HANDLE` - Your Bluesky username (e.g., `username.bsky.social`)
- `BLUESKY_APP_PASSWORD` - App password from Bluesky settings
  - Generate at: Settings → App Passwords → Add App Password

### LinkedIn
- `LINKEDIN_ACCESS_TOKEN` - OAuth 2.0 access token
  - Requires permissions: `w_member_social`, `r_basicprofile`
  - Generate through LinkedIn OAuth flow or developer app
- `LINKEDIN_PERSON_URN` - Your LinkedIn person URN (e.g., `urn:li:person:XXXXX`)
  - Find by calling LinkedIn API: `GET https://api.linkedin.com/v2/me`

## Post Format Requirements

Your blog posts must include front matter with the following fields:

```yaml
---
layout: post
title: "Your Post Title"
date: 2026-01-12 10:00:00 -0500
category: Blog
tags: [tag1, tag2, tag3]
excerpt: "Brief description of your post"
image: "/public/images/featured.png"  # optional
---
```

### Required Fields
- `title` - Post title (used in social media posts)
- `excerpt` - Summary/description (used as post content)
- `tags` - Array of tags (converted to hashtags)

### Optional Fields
- `image` - Featured image path (relative or absolute URL)
  - Relative paths are converted to full URLs (e.g., `/public/img/photo.png` → `https://dxrf.com/public/img/photo.png`)

## Post Format Examples

### Bluesky Post (≤300 characters)
```
📝 New blog post: AI is a Failure

AI is a failure. There, I said it. But probably not for the reasons you think...

🔗 https://dxrf.com/ai-is-a-failure/

#ai #devops #leadership
```

### LinkedIn Post
```
📝 New blog post: AI is a Failure

AI is a failure. There, I said it. But probably not for the reasons you think.

Read more: https://dxrf.com/ai-is-a-failure/

#ai #devops #transformation #leadership
```

## URL Generation

Post URLs are generated automatically based on filename:
- Filename: `_posts/2026-01-12-ai-is-a-failure.md`
- Generated URL: `https://dxrf.com/ai-is-a-failure/`

This follows the Jekyll `permalink: pretty` configuration.

## Troubleshooting

### No post detected
- Ensure the file was **added** (not just modified) in the commit
- Check that the file is in the `_posts/` directory
- Verify the file has a `.md` extension

### Authentication errors
- Verify all required secrets are configured correctly
- For Bluesky: Ensure you're using an app password, not your account password
- For LinkedIn: Check that your access token hasn't expired

### Post formatting issues
- Ensure front matter is properly formatted YAML
- Check that required fields (title, excerpt, tags) are present
- Verify tags are in array format: `[tag1, tag2, tag3]`

### Character limit exceeded (Bluesky)
The workflow automatically trims content to fit Bluesky's 300 character limit:
1. First, it trims the excerpt
2. If still too long, it removes hashtags
3. As a last resort, it posts only the title and link

## Dependencies

The workflow uses the following Python packages:
- `atproto` - Bluesky AT Protocol client
- `pyyaml` - YAML parsing for front matter
- `requests` - HTTP requests for LinkedIn API

These are automatically installed by the workflow.
