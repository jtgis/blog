// GitHub repository settings - update these with your actual repo details
const GITHUB_REPO_URL = 'https://github.com/jtgis/blog';
const POSTS_FOLDER_URL = `${GITHUB_REPO_URL}/new/main/posts`;

function handleLogin(event) {
    event.preventDefault();
    
    // Instead of checking credentials, redirect to GitHub for post creation
    window.open(POSTS_FOLDER_URL, '_blank');
    
    // Show instructions
    showInstructions();
}

function showInstructions() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('post-form').style.display = 'block';
}

function logout() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('post-form').style.display = 'none';
}

// Check if already "logged in" (just showing instructions)
document.addEventListener('DOMContentLoaded', function() {
    // Replace the post creation form with GitHub instructions
    document.getElementById('post-form').innerHTML = `
        <h2>Create Posts via GitHub</h2>
        <div class="post-content">
            <p><strong>To add new posts to your blog:</strong></p>
            
            <ol style="margin: 15px 0; padding-left: 30px;">
                <li>Go to your GitHub repository</li>
                <li>Navigate to the <code>posts</code> folder (create it if it doesn't exist)</li>
                <li>Click "Add file" → "Create new file"</li>
                <li>Name your file with <code>.md</code> extension (e.g., <code>my-new-post.md</code>)</li>
                <li>Add frontmatter and content using the template below</li>
                <li>Commit the file - your site will update automatically!</li>
            </ol>

            <h3>Post Template:</h3>
            <pre style="background: #f0f0f0; padding: 15px; margin: 15px 0; border: 1px solid #ccc; overflow-x: auto; font-family: 'Courier New', monospace;">---
title: "Your Amazing Post Title"
date: "2025-09-19"
tags: ["technology", "tutorial", "blog"]
image: "https://example.com/optional-image.jpg"
---

# Your Post Title

Write your post content here using **Markdown**!

You can use:
- **Bold text**
- *Italic text*
- [Links](https://example.com)
- Images: ![Alt text](https://example.com/image.jpg)
- Code blocks
- Lists
- And much more!

## Subheadings work too

Your content will be automatically converted and displayed on the blog.</pre>

            <div style="margin-top: 20px; padding: 15px; background-color: #e8f4fd; border-left: 4px solid #1976d2;">
                <p><strong>💡 Pro Tips:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>The filename will become the URL slug (e.g., <code>my-post.md</code> → <code>/post/my-post</code>)</li>
                    <li>Date format should be YYYY-MM-DD</li>
                    <li>Tags help organize your posts and appear in the sidebar</li>
                    <li>Images can be stored in a <code>images</code> folder in your repo</li>
                    <li>GitHub Pages updates automatically when you commit</li>
                </ul>
            </div>

            <div style="margin-top: 20px;">
                <a href="${POSTS_FOLDER_URL}" target="_blank" 
                   style="display: inline-block; background-color: #333; color: white; padding: 12px 24px; text-decoration: none; font-family: 'Courier New', monospace; border: none; cursor: pointer;">
                   📝 Create New Post on GitHub
                </a>
                
                <a href="${GITHUB_REPO_URL}" target="_blank" 
                   style="display: inline-block; background-color: #666; color: white; padding: 12px 24px; text-decoration: none; font-family: 'Courier New', monospace; border: none; cursor: pointer; margin-left: 10px;">
                   📁 View Repository
                </a>
            </div>

            <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
                <p><strong>⚠️ Remember:</strong> Update the repository URL in <code>admin.js</code> with your actual GitHub username and repository name!</p>
                <p>Change <code>yourusername/minimal-blog</code> to <code>your-github-username/your-repo-name</code></p>
            </div>
        </div>
    `;

    // Show instructions by default instead of login
    showInstructions();
});