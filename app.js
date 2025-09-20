let currentPage = 1;
const postsPerPage = 10;
let allPosts = [];
let filteredPosts = [];
let currentFilter = null;

// Sample posts data - in a real implementation, this would come from a server or file
const samplePosts = [
    {
        id: 1,
        title: "Welcome to My Blog",
        content: "This is the first post on my minimal blog. Built with plain HTML, CSS, and JavaScript.",
        excerpt: "This is the first post on my minimal blog. Built with plain HTML, CSS, and JavaScript.",
        date: "2025-09-19",
        tags: ["welcome", "blog", "javascript"],
        slug: "welcome-to-my-blog",
        image: null
    },
    {
        id: 2,
        title: "Building a Minimal Blog",
        content: "Today I'm sharing how I built this simple blog using Courier New font and an off-white background.",
        excerpt: "Today I'm sharing how I built this simple blog using Courier New font and an off-white background.",
        date: "2025-09-18",
        tags: ["tutorial", "web-development", "css"],
        slug: "building-minimal-blog",
        image: null
    }
    // Add more sample posts as needed
];

// Handle URL parameters for filtering
function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const tagParam = urlParams.get('tag');
    const monthParam = urlParams.get('month');
    
    if (tagParam) {
        filterByTag(tagParam);
    } else if (monthParam) {
        filterByMonth(monthParam);
    }
}

function loadPosts(page = 1) {
    currentPage = page;
    const postsToDisplay = currentFilter ? filteredPosts : allPosts;
    const startIndex = (page - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToShow = postsToDisplay.slice(startIndex, endIndex);
    
    const postsContainer = document.getElementById('posts-container');
    postsContainer.innerHTML = '';
    
    if (postsToShow.length === 0) {
        postsContainer.innerHTML = '<div class="post"><h2>No posts found</h2><p>No posts match the current filter.</p></div>';
    } else {
        postsToShow.forEach(post => {
            const postElement = createPostElement(post);
            postsContainer.appendChild(postElement);
        });
    }
    
    updatePagination();
    updateSidebar();
}

function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    
    const imageHtml = post.image ? 
        `<img src="${post.image}" alt="${post.title}" style="max-width: 100%; height: auto; margin-bottom: 15px; display: block;">` : '';
    
    postDiv.innerHTML = `
        <h2><a href="post.html?slug=${post.slug}" style="color: #333; text-decoration: none;">${post.title}</a></h2>
        <div class="post-meta">
            Published on ${formatDate(post.date)}
        </div>
        ${imageHtml}
        <div class="post-excerpt">
            ${post.excerpt}
        </div>
        <div style="margin-top: 10px;">
            <a href="post.html?slug=${post.slug}" style="color: #333; text-decoration: underline;">Read more →</a>
        </div>
        <div class="post-tags">
            ${post.tags.map(tag => `<a href="#" class="tag" onclick="filterByTag('${tag}')">${tag}</a>`).join('')}
        </div>
    `;
    
    return postDiv;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function updatePagination() {
    const postsToDisplay = currentFilter ? filteredPosts : allPosts;
    const totalPages = Math.ceil(postsToDisplay.length / postsPerPage);
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageInfo = document.getElementById('page-info');
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    pageInfo.textContent = totalPages > 0 ? `Page ${currentPage} of ${totalPages}` : 'No pages';
    
    // Show filter status
    if (currentFilter) {
        pageInfo.textContent += ` (filtered by: ${currentFilter.type} = ${currentFilter.value})`;
    }
}

function updateSidebar() {
    updateTags();
    updateArchives();
}

function updateTags() {
    const tagsContainer = document.getElementById('tags-container');
    const allTags = [...new Set(allPosts.flatMap(post => post.tags))];
    
    tagsContainer.innerHTML = allTags.map(tag => 
        `<a href="#" class="tag" onclick="filterByTag('${tag}')" style="${currentFilter && currentFilter.type === 'tag' && currentFilter.value === tag ? 'background-color: #666;' : ''}">${tag}</a>`
    ).join('');
    
    // Add clear filter button if there's an active filter
    if (currentFilter) {
        tagsContainer.innerHTML += '<br><br><a href="#" onclick="clearFilter()" style="color: #333; text-decoration: underline;">Clear Filter</a>';
    }
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
        const isActive = currentFilter && currentFilter.type === 'month' && currentFilter.value === month;
        return `<div><a href="#" style="color: #333; text-decoration: none; ${isActive ? 'font-weight: bold;' : ''}" onclick="filterByMonth('${month}')">${monthName}</a></div>`;
    }).join('');
}

function filterByTag(tag) {
    currentFilter = { type: 'tag', value: tag };
    filteredPosts = allPosts.filter(post => post.tags.includes(tag));
    currentPage = 1;
    loadPosts(1);
}

function filterByMonth(month) {
    currentFilter = { type: 'month', value: month };
    filteredPosts = allPosts.filter(post => {
        const postDate = new Date(post.date);
        const postMonth = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}`;
        return postMonth === month;
    });
    currentPage = 1;
    loadPosts(1);
}

function clearFilter() {
    currentFilter = null;
    filteredPosts = [];
    currentPage = 1;
    loadPosts(1);
}

// Initialize the blog
document.addEventListener('DOMContentLoaded', async function() {
    // Load posts from GitHub first, fall back to sample posts
    const githubPosts = await loadPostsFromGitHub();
    allPosts = githubPosts.length > 0 ? githubPosts : samplePosts;
    console.log('Loaded posts:', allPosts);
    
    // Handle URL parameters
    handleUrlParameters();
    
    loadPosts(1);
});