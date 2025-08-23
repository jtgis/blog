# My Minimal Blog

A tiny, no-build static blog with a white background and a monospaced (Courier New) font. Add new posts by dropping Markdown files into `posts/` and listing them in `posts.json`.

## Features
- Pagination: shows up to 6 posts per page
- Tags: filter by `?tag=tagname`
- Archives: filter by `?year=YYYY` and `?year=YYYY&month=MM`
- Simple Markdown renderer (headings, lists, links, code, quotes)
- Clean sidebar for tags and archives

## Quick Start
1. Unzip and open `index.html` in your browser (or host on GitHub Pages).
2. Edit the sample posts in `posts/`.
3. Update `posts.json` to control the list and order.

### Adding a New Post
1. Create `posts/my-new-post.md`
2. Add an entry to `posts.json`:

```json
{
  "title": "My New Post",
  "slug": "my-new-post",
  "date": "2025-08-22",
  "description": "Optional one-line summary.",
  "tags": ["general", "update"]
}
```

The `slug` must match the filename (without `.md`). The blog will fetch `posts/<slug>.md` and render it.

## Deploy (GitHub Pages)
1. Create a new GitHub repo and push these files.
2. In **Settings → Pages**, choose the default branch as the source.
3. Visit your Pages URL.
