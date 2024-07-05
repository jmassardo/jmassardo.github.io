---
layout: post
title:  "Consuming Jekyll-feed xml with Node.JS and Mustache templates"
date:   2021-09-09 21:45:00 -0500
category: Blog
tags: [web, github, node, jekyll, atom, feed, xml, mustache]
excerpt: "I've been spending some free time sprucing up my GitHub personal readme. One of those tasks was to pull the last 5 blog posts from here and list them on my readme. This post will outline some of the basic components and provide a link to my repo where the functional source code lives."
---
## Summary

I've been spending some free time sprucing up my GitHub personal readme. One of those tasks was to pull the last 5 blog posts from here and list them on my readme. This post will outline some of the basic components and provide a link to my repo where the functional source code lives. I'm not going to go through a step-by-step process as [Thomas Guibert](https://github.com/thmsgbrt) has a great [blog post](https://medium.com/swlh/how-to-create-a-self-updating-readme-md-for-your-github-profile-f8b05744ca91) on Medium. I used his post to get the initial setup working then added my own bits.

I'm using [Jekyll](https://jekyllrb.com/) for the main blog engine, [Jekyll-Feed](https://github.com/jekyll/jekyll-feed) to generate an Atom feed, and hosting the site on [GitHub Pages](https://pages.github.com/). I'm using Node.js with [Mustache](https://mustache.github.io/) templates to render the actual [readme](https://github.com/jmassardo) on GitHub. Last but not least, I'm using [GitHub Actions](https://github.com/features/actions) to periodically poll the atom feed and generate a updated readme.

## Components

From this point on, I'm assuming you've already followed Thomas's post.

First thing's first, we need to make sure Jekyll is producing a ATOM feed with all the data we need.

[atom.xml example](https://github.com/jmassardo/jmassardo.github.io/blob/master/atom.xml)

``` xml
{% raw %}
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">

 <title>{{ site.title }}</title>
 <link href="{{ site.url }}{{ site.baseurl }}/atom.xml" rel="self"/>
 <link href="{{ site.url }}{{ site.baseurl }}/"/>
 <updated>{{ site.time | date_to_xmlschema }}</updated>
 <id>{{ site.url }}</id>
 <author>
   <name>{{ site.author.name }}</name>
   <email>{{ site.author.email }}</email>
 </author>

  <!-- 
    Since I only want 5 posts to show and this is the only use I have for the atom feed
    I elected to set the limit here.
   -->
  {% for post in site.posts limit: 5%}
 <entry>
   <title>{{ post.title }}</title>
   <link href="{{ site.url }}{{ post.url }}"/>
   <updated>{{ post.date | date_to_xmlschema }}</updated>
   <id>{{ site.url }}{{ site.baseurl }}{{ post.id }}</id>
   <!--
     The excerpt is set in the front matter of the post. 
     I had to add it here and to the front matter of all my posts.
     This could just be a side effect of the theme I'm using.
    -->
   <excerpt type="html">{{ post.excerpt | xml_escape }}</excerpt>
   <content type="html">{{ post.content | xml_escape }}</content>
   {% for tag in post.tags %}
    <category term="{{ tag | xml_escape }}" />
   {% endfor %}
 </entry>
 {% endfor %}

</feed>
{% endraw %}
```

Now, let's tell our `index.js` script how to fetch the feed.

[index.js example](https://github.com/jmassardo/jmassardo/blob/main/index.js)

``` javascript
async function setBlogPosts() {
    await fetch(
        // This is the URL of the feed
        `https://dxrf.com/atom.xml`
    )
    .then(r => r.text())
    .then(r => {
        // Use `xml2js` to parse the XML into a JS object
        parser.parseString(r, function(error, result) {
            if(error === null) {
                // Feel free to change this bit if you want the date/time in a 
                // different format or if you need a different locale.
                DATA.blog_updated_date = new Date(result.feed.updated[0]).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    timeZoneName: 'short',
                    timeZone: 'America/Chicago',
                  });
                DATA.blog_posts = result.feed.entry
            }
            else {
                console.log(error);
            }
        });
    });
}
```

Now, we can tell our mustache template how to parse the object and render it.

[main.mustache example](https://github.com/jmassardo/jmassardo/blob/main/main.mustache)

``` mustache
{% raw %}
{{#blog_posts}}
<p>
{{! Depending on your url configs in Jekyll, you may need to change this href}}
<a href="https://dxrf.com{{url}}">{{title}}</a> 
</p>
{{#excerpt}}
<p>{{_}}</p>
{{/excerpt}}

{{/blog_posts}}
{% endraw %}
```

> One thing to note here, I had remove all the leading whitespace from this bit as any whitespace was misinterpreted as markdown indentation.

While we're on the subject of mustache, there are a few things to note here. The `#` makes a difference.

* The `{% raw %}{{#blog_posts}}{% endraw %}` and `{% raw %}{{/blog_posts}}{% endraw %}` tags are used to iterate over the objects in the array (`DATA.blog_posts = result.feed.entry`).
* The `{% raw %}{blog_updated_date}} {% endraw %}` tag is used to render a single object (`DATA.blog_updated_date = new Date(result.feed.updated[0]).....`).

Now that we have everything and we've verified it works, we can create an action to automate the updates. Most of the steps are pretty self explanatory but I made a few comments to clarify.

[main.yaml example](https://github.com/jmassardo/jmassardo/blob/main/.github/workflows/main.yaml)

```yaml
name: README build

on:
  push:
    branches:
      - main
  schedule:
    # This runs every 6hrs. Change it to suit your needs
    - cron: '0 */6 * * *'

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout current repository
        uses: actions/checkout@v1
      - name: Setup NodeJs
        uses: actions/setup-node@v2
        with:
          node-version: 16
      - name: Cache dependencies and build outputs to improve workflow execution time.
        uses: actions/cache@v1
        with:
          path: node_modules
          key: {% raw %} ${{ runner.os }}-js-${{ hashFiles('package-lock.json') }}  {% endraw %}
      - name: Install dependencies
        run: npm install
      - name: Generate README file
        run: node index.js
        # This is an important step. Once you'd rendered the new readme, you'll need to commit it back to the repo. Change the user.email and user.name accordingly.
      - name: Commit files
        run: |
          git config --local user.email "jmassardo@github.com"
          git config --local user.name "GitHub Action"
          git commit -m "Update readme" -a
      - name: Push changes
        uses: ad-m/github-push-action@master
        with:
          # Since all the work we're doing lives in the same repo, we can use the internal token. There's no need to provide a PAT.
          github_token: ${{ secrets.GITHUB_TOKEN }}
          branch: ${{ github.ref }}
```

## Closing

Again, feel free to browse my [repo](https://github.com/jmassardo/jmassardo) with the functional source code. If you have any questions or feedback, please feel free to contact me: [@jennamassardo](https://www.threads.net/@jennamassardo)
