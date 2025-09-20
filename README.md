# jtgis - Minimal Blog

A clean, minimal blog built with pure HTML, CSS, and JavaScript. No frameworks, no build process - just simple, fast, and GitHub Pages compatible.

## Quick Start

1. **Fork this repository**
2. **Enable GitHub Pages** in repository settings (Source: Deploy from a branch → main)
3. **Create your first post** in the `posts/` folder
4. **Update the manifest** in `posts/manifest.json`

## Creating Posts

### 1. Create a new `.md` file in the `posts/` folder

```markdown
---
title: "Your Post Title"
date: "2025-09-19"
tags: ["technology", "tutorial"]
image: "https://example.com/header-image.jpg"
---

# Your Content Here

Write your post content using **Markdown**!

- You can use lists
- **Bold text**
- *Italic text*
- [Links](https://example.com)
- Images: ![Alt text](https://example.com/image.jpg)

## Subheadings work too

More content here.
```

### 2. Update `posts/manifest.json`

Add your new post filename to the manifest:

```json
{
  "files": [
    "your-new-post.md",
    "post02.md",
    "post01.md"
  ]
}
```

### 3. Commit and push

Your post will automatically appear on your blog!

## License

MIT License - feel free to use this for any purpose.