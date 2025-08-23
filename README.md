# My Minimal Blog

A tiny, no-build static blog with a white background and Courier New monospace font.

## Features
- Pagination: 6 posts per page
- Tags and Archives sidebar (years + months)
- First image preview on the homepage
- Local file support via inline `posts.json` fallback
- Simple Markdown renderer (headings, lists, links, code, quotes, images)

## Add a Post
1. Create `posts/my-new-post.md`
2. Add an entry to `posts.json` with `title`, `slug`, `date`, `description` (optional), and `tags` (optional).
3. If you use images in the Markdown (`![Alt](photo.jpg)`), put the image file in the same `posts/` folder.

## Run
Open `index.html` directly or host the folder (e.g., GitHub Pages).
