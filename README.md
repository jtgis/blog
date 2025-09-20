# jtgis - Minimal Blog

A clean, minimal blog built with pure HTML, CSS, and JavaScript. No frameworks, no build process - just simple, fast, and GitHub Pages compatible.

## ✨ Features

- **Minimal Design**: Clean typography with Courier New font and modern spacing
- **Markdown Support**: Write posts in Markdown with frontmatter
- **Responsive**: Mobile-friendly design that works on all devices
- **GitHub Pages Ready**: Deploy directly to GitHub Pages with zero configuration
- **Tag Filtering**: Organize posts with tags and filter by them
- **Date Archives**: Browse posts by month and year
- **Search Friendly**: SEO-optimized with proper meta tags

## 🚀 Quick Start

1. **Fork this repository**
2. **Enable GitHub Pages** in repository settings (Source: Deploy from a branch → main)
3. **Create your first post** in the `posts/` folder
4. **Update the manifest** in `posts/manifest.json`

## 📝 Creating Posts

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

## 🎨 Customization

### Colors

Edit `styles.css` to change the color scheme:

```css
body {
    background-color: #fafafa; /* Change background color */
    color: #333; /* Change text color */
}
```

### Site Title

Update the site title in all HTML files:

```html
<h1>Your Site Name</h1>
```

### Admin Settings

Update your GitHub repository URL in `admin.js`:

```javascript
const GITHUB_REPO_URL = 'https://github.com/your-username/your-repo';
```

## 📁 File Structure

```
minimal-blog/
├── index.html          # Homepage
├── about.html          # About page
├── admin.html          # Admin/posting instructions
├── post.html           # Individual post template
├── styles.css          # All styles
├── app.js              # Main blog functionality
├── post.js             # Individual post page logic
├── posts-loader.js     # Markdown processing
├── admin.js            # Admin page functionality
├── posts/
│   ├── manifest.json   # List of post files
│   ├── post01.md       # Example post
│   └── post02.md       # Example post
└── README.md           # This file
```

## 🔧 Development

### Local Development

Use VS Code with the Live Server extension, or run a simple HTTP server:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx serve .
```

Then visit `http://localhost:8000`

### Adding Features

The codebase is intentionally simple and well-commented. Key files:

- `posts-loader.js` - Handles markdown parsing
- `app.js` - Main blog logic (pagination, filtering)
- `styles.css` - All styling
- `post.js` - Individual post display

## 🌐 GitHub Pages Setup

1. Go to your repository settings
2. Scroll to "Pages" section
3. Source: "Deploy from a branch"
4. Branch: "main" 
5. Folder: "/ (root)"
6. Save

Your blog will be available at: `https://your-username.github.io/your-repo-name`

## 📱 Mobile Support

The blog is fully responsive with:
- Stacked layout on mobile
- Touch-friendly navigation
- Optimized spacing for small screens
- Readable font sizes

## 🤝 Contributing

Feel free to fork this project and make it your own! Some ideas:

- Add search functionality
- Implement dark mode
- Add social sharing buttons
- Create post categories
- Add comment system integration

## 📄 License

MIT License - feel free to use this for any purpose.

## 🙋‍♂️ Support

If you have questions or run into issues:

1. Check the browser console for error messages
2. Verify your `manifest.json` is valid JSON
3. Ensure post files have proper frontmatter
4. Make sure GitHub Pages is enabled in repository settings

---

Made with ❤️ and vanilla JavaScript. No frameworks harmed in the making of this blog.