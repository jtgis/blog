let allPosts = [];

async function loadSinglePost() {
    // Get slug from URL
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    
    if (!slug) {
        showError('No post specified');
        return;
    }
    
    // Load all posts
    const githubPosts = await loadPostsFromGitHub();
    allPosts = githubPosts.length > 0 ? githubPosts : [];
    
    // Find the specific post
    const post = allPosts.find(p => p.slug === slug);
    
    if (!post) {
        showError('Post not found');
        return;
    }
    
    displayPost(post);
    updateSidebar();
}

function displayPost(post) {
    document.getElementById('post-title').textContent = `${post.title} - jtgis`;
    
    const imageHtml = post.image ? 
        `<img src="${post.image}" alt="${post.title}" style="max-width: 100%; height: auto; margin-bottom: 20px; display: block;">` : '';
    
    const postContainer = document.getElementById('post-container');
    postContainer.innerHTML = `
        <div class="post">
            <h1>${post.title}</h1>
            <div class="post-meta">
                Published on ${formatDate(post.date)}
            </div>
            ${imageHtml}
            <div class="post-content">
                ${post.content}
            </div>
            <div class="post-tags" style="margin-top: 20px;">
                ${post.tags.map(tag => `<a href="index.html#tag-${tag}" class="tag">${tag}</a>`).join('')}
            </div>
        </div>
    `;
}

function showError(message) {
    const postContainer = document.getElementById('post-container');
    postContainer.innerHTML = `
        <div class="post">
            <h2>Error</h2>
            <p>${message}</p>
            <p><a href="index.html" style="color: #333; text-decoration: underline;">← Back to home</a></p>
        </div>
    `;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function updateSidebar() {
    updateTags();
    updateArchives();
}

function updateTags() {
    const tagsContainer = document.getElementById('tags-container');
    const allTags = [...new Set(allPosts.flatMap(post => post.tags))];
    
    tagsContainer.innerHTML = allTags.map(tag => 
        `<a href="index.html#tag-${tag}" class="tag">${tag}</a>`
    ).join('');
}

function updateArchives() {
    const archivesContainer = document.getElementById('archives-container');
    const months = [...new Set(allPosts.map(post => {
        const date = new Date(post.date);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }))];
    
    archivesContainer.innerHTML = months.map(month => {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return `<div><a href="index.html#month-${month}" style="color: #333; text-decoration: none;">${monthName}</a></div>`;
    }).join('');
}

// Initialize the post page
document.addEventListener('DOMContentLoaded', function() {
    loadSinglePost();
});