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
    
    console.log('Creating post element for:', post.title);
    console.log('Post has embed:', post.embed);
    console.log('Post has image:', post.image);
    
    // Handle different media types
    let mediaHtml = '';
    
    if (post.embed) {
        console.log('Creating embed HTML for:', post.embed);
        mediaHtml = createEmbedHtml(post.embed, post.embedType);
        console.log('Generated media HTML:', mediaHtml);
    } else if (post.image) {
        console.log('Creating image HTML for:', post.image);
        mediaHtml = `<img src="${post.image}" alt="${post.title}" class="header-image" onload="console.log('Image loaded: ${post.image}')" onerror="console.error('Image failed to load: ${post.image}')">`;
    }
    
    postDiv.innerHTML = `
        <h2><a href="post.html?slug=${post.slug}" class="content-link">${post.title}</a></h2>
        <div class="post-meta">
            Published on ${formatDate(post.date)}
        </div>
        ${mediaHtml}
        <div class="post-excerpt">
            ${post.excerpt}
        </div>
        <div class="read-more-link">
            <a href="post.html?slug=${post.slug}" class="content-link">Read more →</a>
        </div>
        <div class="post-tags">
            ${post.tags.map(tag => `<a href="#" class="tag" onclick="filterByTag('${tag}')">${tag}</a>`).join('')}
        </div>
    `;
    
    return postDiv;
}

function formatDate(dateString) {
    console.log('Formatting date:', dateString, typeof dateString);
    
    if (!dateString) {
        console.error('No date provided to formatDate');
        return 'Unknown date';
    }
    
    // Handle YYYY-MM-DD format specifically to avoid timezone issues
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        
        // Create date in local timezone to avoid UTC conversion issues
        const date = new Date(year, month - 1, day); // month is 0-indexed
        
        console.log('Parsed date components:', { year, month, day });
        console.log('Created date object:', date);
        
        if (isNaN(date.getTime())) {
            console.error('Invalid date components:', { year, month, day });
            return 'Invalid date';
        }
        
        const formatted = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        console.log('Formatted date result:', formatted);
        return formatted;
    }
    
    // Fallback for other date formats
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Invalid date';
    }
    
    const formatted = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    console.log('Formatted date result:', formatted);
    return formatted;
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
        `<a href="#" class="tag ${currentFilter && currentFilter.type === 'tag' && currentFilter.value === tag ? 'active' : ''}" onclick="filterByTag('${tag}')">${tag}</a>`
    ).join('');
    
    if (currentFilter) {
        tagsContainer.innerHTML += '<br><br><a href="#" onclick="clearFilter()" class="clear-filter-link">Clear Filter</a>';
    }
}

function updateArchives() {
    const archivesContainer = document.getElementById('archives-container');
    
    const months = [...new Set(allPosts.map(post => {
        // Parse date in local timezone
        let date;
        if (typeof post.date === 'string' && post.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = post.date.split('-').map(num => parseInt(num, 10));
            date = new Date(year, month - 1, day);
        } else {
            date = new Date(post.date);
        }
        
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }))];
    
    archivesContainer.innerHTML = months.map(month => {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const isActive = currentFilter && currentFilter.type === 'month' && currentFilter.value === month;
        return `<div><a href="#" class="archive-link ${isActive ? 'active' : ''}" onclick="filterByMonth('${month}')">${monthName}</a></div>`;
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
        // Parse date in local timezone
        let postDate;
        if (typeof post.date === 'string' && post.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, monthNum, day] = post.date.split('-').map(num => parseInt(num, 10));
            postDate = new Date(year, monthNum - 1, day);
        } else {
            postDate = new Date(post.date);
        }
        
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
    console.log('DOM loaded, initializing blog...');
    
    try {
        // Load posts from GitHub first, fall back to sample posts
        const githubPosts = await loadPostsFromGitHub();
        
        if (githubPosts.length > 0) {
            console.log('Using GitHub posts:', githubPosts.length);
            allPosts = githubPosts;
        } else {
            console.log('Using sample posts');
            allPosts = samplePosts;
        }
        
        console.log('Final posts array:', allPosts);
        
        // Handle URL parameters
        handleUrlParameters();
        
        loadPosts(1);
    } catch (error) {
        console.error('Error during initialization:', error);
        allPosts = samplePosts;
        loadPosts(1);
    }
});