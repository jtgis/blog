# My Minimal Blog

A tiny, no-build static blog with a white background and a monospaced (Courier New) font. Add new posts by dropping Markdown files into `posts/` and listing them in `posts.json`.

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
  "description": "Optional one-line summary."
}
```

The `slug` must match the filename (without `.md`). The blog will fetch `posts/<slug>.md` and render it.

## How It Works

- `index.html`: shell page.
- `style.css`: simple, clean styles (white background, Courier New).
- `app.js`: loads `posts.json`, fetches Markdown, converts to HTML, and handles navigation.

No frameworks. No build step. Just static files.

## Deploy (GitHub Pages)

1. Create a new GitHub repo and push these files.
2. In **Settings → Pages**, choose the default branch as the source.
3. Visit your Pages URL.

