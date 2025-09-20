# jtgis - Minimal Blog

A clean, minimal blog built with pure HTML, CSS, and JavaScript. No frameworks, no build process - just simple, fast, and GitHub Pages compatible.

## Features

- 📝 **Markdown support** - Write posts in Markdown
- 🎥 **Video embeds** - YouTube, Vimeo support
- 🎵 **Audio embeds** - Spotify podcasts and music
- 🖼️ **Image headers** - Beautiful post images
- 📱 **Responsive design** - Works on all devices
- 🚀 **GitHub Pages ready** - No build process needed
- 🔍 **Search & filtering** - By tags and date archives

## Quick Start

1. **Fork this repository**
2. **Enable GitHub Pages** in repository settings (Source: Deploy from a branch → main)
3. **Create your first post** in the `posts/` folder
4. **Commit and push** - your blog is live!

*Note: No manifest file needed! The blog automatically discovers all `.md` files in the `posts/` folder.*

## Creating Posts

### Basic Post Structure

Create a new `.md` file in the `posts/` folder with frontmatter and content:

```markdown
---
title: "Your Post Title"
date: "2025-09-20"
tags: ["technology", "tutorial"]
---

# Your Content Here

Write your post content using **Markdown**!

- You can use lists
- **Bold text**
- *Italic text*
- [Links](https://example.com)

## Subheadings work too

More content here.
```

### Adding Images

Add a header image to your post:

```markdown
---
title: "Beautiful Landscapes"
date: "2025-09-20"
tags: ["photography", "nature"]
image: "https://upload.wikimedia.org/wikipedia/commons/b/bd/Olivetti-Valentine.jpg"
---

# Your post content here
```

### Adding YouTube Videos

Embed YouTube videos in your posts:

```markdown
---
title: "Check out this amazing video"
date: "2025-09-20"
tags: ["video", "tutorial"]
embed: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
embedType: "youtube"
---

# Your post content here
```

**Supported YouTube URL formats:**
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`

### Adding Vimeo Videos

Embed Vimeo videos:

```markdown
---
title: "Creative Vimeo Content"
date: "2025-09-20"
tags: ["video", "creative"]
embed: "https://vimeo.com/123456789"
embedType: "vimeo"
---

# Your post content here
```

### Adding Spotify Content

Embed Spotify podcasts, songs, albums, or playlists:

```markdown
---
title: "Great Podcast Episode"
date: "2025-09-20"
tags: ["podcast", "audio"]
embed: "https://open.spotify.com/episode/08eeT2K3grjK7nnAU5N1WV?si=j5uPI0rfSQmGo7Myc9-WaQ"
embedType: "spotify"
---

# Your post content here
```

**Supported Spotify content:**
- Episodes: `https://open.spotify.com/episode/EPISODE_ID`
- Songs: `https://open.spotify.com/track/TRACK_ID`
- Albums: `https://open.spotify.com/album/ALBUM_ID`
- Playlists: `https://open.spotify.com/playlist/PLAYLIST_ID`

### Auto-Detection

The `embedType` is optional - the system will auto-detect based on the URL:

```markdown
---
title: "Auto-detected embed"
date: "2025-09-20"
tags: ["video"]
embed: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
# embedType automatically detected as "youtube"
---
```

## Frontmatter Reference

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `title` | Yes | Post title | `"My Amazing Post"` |
| `date` | Yes | Publication date (YYYY-MM-DD) | `"2025-09-20"` |
| `tags` | No | Array of tags | `["tech", "tutorial"]` |
| `image` | No | Header image URL | `"https://example.com/image.jpg"` |
| `embed` | No | Video/audio embed URL | `"https://youtube.com/watch?v=..."` |
| `embedType` | No | Force embed type | `"youtube"`, `"vimeo"`, `"spotify"` |

## Complete Example

Here's a full post example with all features:

```markdown
---
title: "The Ultimate Guide to Minimal Blogging"
date: "2025-09-20"
tags: ["blogging", "tutorial", "web-development"]
image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
embed: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
embedType: "youtube"
---

# Welcome to Minimal Blogging!

This post shows off all the features of this minimal blog system.

## Why Choose Minimal?

- **Fast loading** - No heavy frameworks
- **Easy to maintain** - Just markdown files
- **GitHub Pages ready** - Free hosting

## Creating Content

You can write in **Markdown** and include:

- Lists like this one
- *Italic text*
- **Bold text**
- [External links](https://github.com)
- `Inline code`

### Code Blocks

```javascript
function hello() {
    console.log("Hello, world!");
}
```

### Images in Content

![Sample Image](https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d)

That's it! Happy blogging! 🎉
```

## Publishing Workflow

1. **Create** a new `.md` file in `posts/`
2. **Add** frontmatter and content
3. **Commit** and push to GitHub
4. **Done!** Your post appears automatically

No build process, no manifest to update, no complex configuration. Just write and publish!

## Customization

### Styling
Edit `styles.css` to customize colors, fonts, and layout.

### Repository Settings
Update the GitHub API URL in `posts-loader.js` to point to your repository:
```javascript
const apiUrl = 'https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/contents/posts';
```

## License

MIT License - feel free to use this for any purpose.