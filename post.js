let allPosts = [];

async function loadSinglePost() {
    // Get slug from URL
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    
    if (!slug) {
        showError('No post specified');
        return;
    }
    
    try {
        // Load posts from GitHub first
        const githubPosts = await loadPostsFromGitHub();
        
        if (githubPosts.length > 0) {
            allPosts = githubPosts;
        } else {
            // Fallback to sample posts if needed
            allPosts = samplePosts || [];
        }
        
        const post = allPosts.find(p => p.slug === slug);
        
        if (!post) {
            showError(`Post "${slug}" not found`);
            return;
        }
        
        displayPost(post);
        updateSidebar();
        
    } catch (error) {
        console.error('Error loading post:', error);
        showError('Failed to load post. Please try again later.');
    }
}

function displayPost(post) {
    console.log('Displaying post:', post.title);
    console.log('Post has embed:', post.embed);
    console.log('Post has image:', post.image);
    
    document.getElementById('post-title').textContent = post.title;
    document.title = `${post.title} - jtgis`;
    
    const postContainer = document.getElementById('post-container');
    
    // Handle different media types for the post header
    let mediaHtml = '';
    
    if (post.embed) {
        console.log('Creating embed HTML for post:', post.embed);
        mediaHtml = createEmbedHtml(post.embed, post.embedType);
        console.log('Generated embed HTML:', mediaHtml);
    } else if (post.image) {
        console.log('Creating image HTML for post:', post.image);
        mediaHtml = `<img src="${post.image}" alt="${post.title}" class="header-image" onload="console.log('Image loaded: ${post.image}')" onerror="console.error('Image failed to load: ${post.image}')">`;
    }
    
    postContainer.innerHTML = `
        <div class="post">
            <h1>${post.title}</h1>
            <div class="post-meta">
                Published on ${formatDate(post.date)}
            </div>
            ${mediaHtml}
            <div class="post-content">
                ${post.content}
            </div>
            <div class="post-tags">
                ${post.tags.map(tag => `<a href="index.html?tag=${tag}" class="tag">${tag}</a>`).join('')}
            </div>
        </div>
    `;
}

// Add the embed creation functions to post.js
function createEmbedHtml(embedUrl, embedType) {
    console.log('Creating embed for:', embedUrl, 'type:', embedType);
    
    // Auto-detect embed type if not specified
    if (!embedType) {
        if (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')) {
            embedType = 'youtube';
        } else if (embedUrl.includes('spotify.com')) {
            embedType = 'spotify';
        } else if (embedUrl.includes('vimeo.com')) {
            embedType = 'vimeo';
        }
    }
    
    console.log('Final embed type:', embedType);
    
    switch (embedType) {
        case 'youtube':
            return createYouTubeEmbed(embedUrl);
        case 'spotify':
            return createSpotifyEmbed(embedUrl);
        case 'vimeo':
            return createVimeoEmbed(embedUrl);
        default:
            console.log('Using generic iframe for:', embedUrl);
            return `<iframe src="${embedUrl}" class="embed-iframe" allowfullscreen></iframe>`;
    }
}

function createYouTubeEmbed(url) {
    console.log('Creating YouTube embed for:', url);
    
    // Convert YouTube URL to embed format
    let videoId = '';
    
    if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
    }
    
    console.log('Extracted video ID:', videoId);
    
    if (videoId) {
        const embedHtml = `
            <div class="embed-container">
                <iframe 
                    src="https://www.youtube.com/embed/${videoId}" 
                    class="embed-iframe"
                    allowfullscreen
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
                </iframe>
            </div>`;
        
        console.log('Generated YouTube embed HTML:', embedHtml);
        return embedHtml;
    }
    
    console.error('Could not extract video ID from:', url);
    return `<p>Invalid YouTube URL: ${url}</p>`;
}

function createSpotifyEmbed(url) {
    console.log('Creating Spotify embed for:', url);
    
    // Convert Spotify URL to embed format
    const embedUrl = url.replace('open.spotify.com/', 'open.spotify.com/embed/').split('?')[0];
    console.log('Spotify embed URL:', embedUrl);
    
    return `
        <div class="embed-container spotify-embed">
            <iframe 
                src="${embedUrl}?utm_source=generator" 
                class="embed-iframe"
                allowfullscreen="" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy"
                frameborder="0">
            </iframe>
        </div>`;
}

function createVimeoEmbed(url) {
    console.log('Creating Vimeo embed for:', url);
    
    // Extract Vimeo video ID
    const videoId = url.split('vimeo.com/')[1].split('?')[0];
    console.log('Vimeo video ID:', videoId);
    
    return `
        <div class="embed-container">
            <iframe 
                src="https://player.vimeo.com/video/${videoId}" 
                class="embed-iframe"
                allowfullscreen
                frameborder="0">
            </iframe>
        </div>`;
}

// Add the date formatting function to post.js
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

function updateSidebar() {
    updateTags();
    updateArchives();
}

function updateTags() {
    const tagsContainer = document.getElementById('tags-container');
    if (!tagsContainer) return;
    
    const allTags = [...new Set(allPosts.flatMap(post => post.tags))];
    
    tagsContainer.innerHTML = allTags.map(tag => 
        `<a href="index.html?tag=${tag}" class="tag">${tag}</a>`
    ).join('');
}

function updateArchives() {
    const archivesContainer = document.getElementById('archives-container');
    if (!archivesContainer) return;
    
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
        return `<div><a href="index.html?month=${month}" class="archive-link">${monthName}</a></div>`;
    }).join('');
}

function showError(message) {
    const postContainer = document.getElementById('post-container');
    postContainer.innerHTML = `
        <div class="post">
            <h1>Error</h1>
            <p>${message}</p>
            <p><a href="index.html" class="content-link">← Back to Home</a></p>
        </div>
    `;
}

// Sample posts fallback (same as in app.js)
const samplePosts = [
    {
        id: 1,
        title: "Welcome to My Blog",
        content: "This is the first post on my minimal blog. Built with plain HTML, CSS, and JavaScript.",
        excerpt: "This is the first post on my minimal blog. Built with plain HTML, CSS, and JavaScript.",
        date: "2025-09-19",
        tags: ["welcome", "blog", "javascript"],
        slug: "welcome-to-my-blog",
        image: null,
        embed: null,
        embedType: null
    },
    {
        id: 2,
        title: "Building a Minimal Blog",
        content: "Today I'm sharing how I built this simple blog using Courier New font and an off-white background.",
        excerpt: "Today I'm sharing how I built this simple blog using Courier New font and an off-white background.",
        date: "2025-09-18",
        tags: ["tutorial", "web-development", "css"],
        slug: "building-minimal-blog",
        image: null,
        embed: null,
        embedType: null
    }
];

// Initialize the post page
document.addEventListener('DOMContentLoaded', function() {
    loadSinglePost();
});