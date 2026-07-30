---
id: "004"
title: "Link global.css in HTML head"
type: "feature"
status: "open"
---

# Subtask: Link global.css in HTML head

## Summary

Add a link tag to `web/src/index.html` to import the global.css stylesheet in the document head.

## Requirements

- [ ] Add `<link rel="stylesheet" href="../styles/global.css" />` in the `<head>` section of `web/src/index.html`
- [ ] Verify the path is correct relative to the HTML file location
- [ ] HTML file is properly formatted

## Implementation

Insert the link tag into the `<head>` section after the viewport meta tag, ensuring proper relative path from `web/src/index.html` to `web/styles/global.css`.

## Dependencies

- Subtask 003 (global.css) should be created first

## Files to Update

- `web/src/index.html` - Add stylesheet link in the head
