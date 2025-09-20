// GitHub repository settings - update these with your actual repo details
const GITHUB_REPO_URL = 'https://github.com/jtgis/blog';

function copyTemplate() {
    const template = document.getElementById('post-template');
    const feedback = document.getElementById('copy-feedback');
    
    // Select the text
    if (window.getSelection) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(template);
        selection.removeAllRanges();
        selection.addRange(range);
        
        try {
            // Copy to clipboard
            document.execCommand('copy');
            
            // Show feedback
            feedback.style.display = 'block';
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 2000);
            
            // Clear selection
            selection.removeAllRanges();
        } catch (err) {
            console.error('Could not copy text: ', err);
            alert('Could not copy automatically. Please select and copy manually.');
        }
    }
}

// Load and display current posts
async function loadCurrentPosts() {
    try {
        const posts = await loadPostsFromGitHub();
        const container = document.getElementById('current-posts');
        
        if (posts.length === 0) {
            container.innerHTML = '<p>No posts found.</p>';
            return;
        }
        
        const postsList = posts.map(post => 
            `<div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 3px;">
                <strong>${post.title}</strong><br>
                <small>File: ${post.slug}.md | Date: ${post.date} | Tags: ${post.tags.join(', ')}</small>
            </div>`
        ).join('');
        
        container.innerHTML = postsList;
    } catch (error) {
        document.getElementById('current-posts').innerHTML = '<p>Error loading posts.</p>';
    }
}

// Initialize admin page
document.addEventListener('DOMContentLoaded', function() {
    loadCurrentPosts();
});