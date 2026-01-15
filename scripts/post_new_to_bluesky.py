#!/usr/bin/env python3
"""
Post new blog posts to Bluesky.
Used by GitHub Actions workflow - reads new posts from new_posts.txt.

Requires environment variables:
    BLUESKY_HANDLE
    BLUESKY_APP_PASSWORD
"""

import os
import sys
import re
from pathlib import Path

# Blog configuration
BLOG_BASE_URL = "https://www.dxrf.com"


def parse_front_matter(content):
    """Extract YAML front matter from markdown file."""
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not match:
        return {}
    
    front_matter = {}
    for line in match.group(1).split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            front_matter[key] = value
    
    return front_matter


def get_post_url(filename):
    """Generate the URL for a blog post based on Jekyll's pretty permalink."""
    # Extract date from filename: YYYY-MM-DD-title.md
    match = re.match(r'(\d{4})-(\d{2})-(\d{2})-(.+)\.md$', filename)
    if not match:
        return None
    
    year, month, day, slug = match.groups()
    return f"{BLOG_BASE_URL}/blog/{year}/{month}/{day}/{slug}/"


def create_post_text(title, excerpt, url):
    """Create the Bluesky post text with proper formatting."""
    # Bluesky has a 300 character limit
    prefix = "New Blog Post: "
    
    # Calculate available space for excerpt
    max_excerpt_len = 300 - len(prefix) - len(url) - 1
    
    if len(excerpt) > max_excerpt_len:
        excerpt = excerpt[:max_excerpt_len - 3] + "..."
    
    return f"{prefix}{excerpt} {url}"


def post_to_bluesky(client, text, url):
    """Post to Bluesky with the URL as a clickable link."""
    from atproto import client_utils
    
    text_builder = client_utils.TextBuilder()
    
    url_start = text.find(url)
    if url_start > 0:
        text_builder.text(text[:url_start])
        text_builder.link(url, url)
    else:
        text_builder.text(text)
    
    return client.send_post(text_builder)


def main():
    # Check for credentials
    handle = os.environ.get("BLUESKY_HANDLE")
    app_password = os.environ.get("BLUESKY_APP_PASSWORD")
    
    if not handle or not app_password:
        print("ERROR: Missing BLUESKY_HANDLE or BLUESKY_APP_PASSWORD")
        sys.exit(1)
    
    # Read list of new posts
    new_posts_file = Path("new_posts.txt")
    if not new_posts_file.exists():
        print("No new_posts.txt found - nothing to post")
        sys.exit(0)
    
    new_posts = [p.strip() for p in new_posts_file.read_text().strip().split('\n') if p.strip()]
    
    if not new_posts:
        print("No new posts to publish")
        sys.exit(0)
    
    print(f"Found {len(new_posts)} new post(s) to publish")
    
    # Initialize Bluesky client
    from atproto import Client
    client = Client()
    
    try:
        print(f"Logging in as {handle}...")
        client.login(handle, app_password)
    except Exception as e:
        print(f"ERROR: Authentication failed: {e}")
        sys.exit(1)
    
    # Process each new post
    successful = 0
    failed = 0
    
    for post_path in new_posts:
        filepath = Path(post_path)
        
        if not filepath.exists():
            print(f"WARNING: File not found: {post_path}")
            failed += 1
            continue
        
        content = filepath.read_text(encoding='utf-8')
        front_matter = parse_front_matter(content)
        
        if not front_matter:
            print(f"WARNING: No front matter in {post_path}")
            failed += 1
            continue
        
        title = front_matter.get('title', filepath.stem)
        excerpt = front_matter.get('excerpt', '')
        url = get_post_url(filepath.name)
        
        if not url:
            print(f"WARNING: Could not generate URL for {post_path}")
            failed += 1
            continue
        
        if not excerpt:
            print(f"WARNING: No excerpt for {post_path}, using title")
            excerpt = title
        
        text = create_post_text(title, excerpt, url)
        
        print(f"Posting: {title[:50]}...")
        
        try:
            result = post_to_bluesky(client, text, url)
            print(f"  SUCCESS: {result.uri}")
            successful += 1
        except Exception as e:
            print(f"  FAILED: {e}")
            failed += 1
    
    print(f"\nDone! Posted {successful}/{len(new_posts)} entries.")
    
    if failed > 0:
        print(f"Failed: {failed}")
        sys.exit(1)


if __name__ == "__main__":
    main()
