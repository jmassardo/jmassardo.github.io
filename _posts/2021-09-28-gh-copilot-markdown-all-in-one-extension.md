---
layout: post
title:  "GitHub Copilot tab-complete not working in markdown files"
date:   2021-09-28 14:15:00 -0500
category: Blog
tags: [github, copilot, markdown, all-in-one, extension, vscode]
excerpt: "I've been with the beta for GitHub Copilot for a while and I recently noticed that the tab-complete stopped working when editing markdown files. I started searching and found a couple GH issues, one of which has a usable workaround."
---
## Summary

I've been with the beta for GitHub Copilot for a while and I recently noticed that the tab-complete stopped working when editing markdown files. I started searching and found a couple GH issues, one of which has a usable workaround.

Issues:

- [vscode-markdown](https://github.com/yzhang-gh/vscode-markdown) - [#1011](https://github.com/yzhang-gh/vscode-markdown/issues/1011)
- [vscode](https://github.com/microsoft/vscode) - [#131953](https://github.com/microsoft/vscode/issues/131953)

## Workaround

- Open the command palette (`Ctrl+Shift+P`)
- Select `Preferences: Open Keyboard Shortcuts (JSON))`
- Paste in the following and save

``` json
[
  {
    "key": "tab",
    "command": "markdown.extension.onTabKey",
    "when": "editorTextFocus && !inlineSuggestionVisible && !editorReadonly && !editorTabMovesFocus && !hasOtherSuggestions && !hasSnippetCompletions && !inSnippetMode && !suggestWidgetVisible && editorLangId == 'markdown'"
  },
  {
    "key": "tab",
    "command": "-markdown.extension.onTabKey",
    "when": "editorTextFocus && !editorReadonly && !editorTabMovesFocus && !hasOtherSuggestions && !hasSnippetCompletions && !inSnippetMode && !suggestWidgetVisible && editorLangId == 'markdown'"
  }
]
```

## Closing

If you have any questions or feedback, please feel free to contact me: [@jennamassardo](https://www.threads.net/@jennamassardo)
