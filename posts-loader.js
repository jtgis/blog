// GitHub API posts loader with embed support

async function loadPostsFromGitHub() {
    try {
        console.log('Loading posts via GitHub API...');
        
        // GitHub API for repository contents
        const apiUrl = 'https://api.github.com/repos/jtgis/blog/contents/posts';
        console.log('API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        const files = await response.json();
        console.log('Files from API:', files.map(f => f.name));
        
        // Filter for .md files only
        const mdFiles = files.filter(file => 
            file.name.endsWith('.md') && file.type === 'file'
        );
        console.log('Markdown files:', mdFiles.map(f => f.name));
        
        if (mdFiles.length === 0) {
            console.log('No markdown files found');
            return [];
        }
        
        // Load content for each markdown file
        const posts = await Promise.all(
            mdFiles.map(async (file) => {
                try {
                    console.log(`Loading content for: ${file.name}`);
                    console.log(`Download URL: ${file.download_url}`);
                    
                    const contentResponse = await fetch(file.download_url);
                    if (!contentResponse.ok) {
                        console.error(`Failed to load ${file.name}: ${contentResponse.status}`);
                        return null;
                    }
                    
                    const content = await contentResponse.text();
                    console.log(`✅ Loaded ${file.name} (${content.length} chars)`);
                    console.log('Content preview:', content.substring(0, 300));
                    
                    return parseMarkdownPost(content, file.name);
                } catch (error) {
                    console.error(`Error loading ${file.name}:`, error);
                    return null;
                }
            })
        );
        
        const validPosts = posts.filter(post => post !== null);
        
        console.log('Posts before sorting:', validPosts.map(p => ({ 
            title: p.title, 
            date: p.date,
            dateObj: new Date(p.date),
            timestamp: new Date(p.date).getTime()
        })));
        
        // Sort by date (newest first) with better error handling
        const sortedPosts = validPosts.sort((a, b) => {
            // Parse dates in local timezone to avoid UTC conversion
            const parseDate = (dateStr) => {
                if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
                    return new Date(year, month - 1, day); // month is 0-indexed
                }
                return new Date(dateStr);
            };
            
            const dateA = parseDate(a.date);
            const dateB = parseDate(b.date);
            
            console.log(`Comparing dates: ${a.title} (${a.date}, ${dateA.toDateString()}) vs ${b.title} (${b.date}, ${dateB.toDateString()})`);
            
            // Handle invalid dates
            if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
            if (isNaN(dateA.getTime())) return 1;  // Put invalid dates at end
            if (isNaN(dateB.getTime())) return -1; // Put invalid dates at end
            
            return dateB.getTime() - dateA.getTime(); // Newest first
        });
        
        console.log('Posts after sorting:', sortedPosts.map(p => ({ 
            title: p.title, 
            date: p.date 
        })));
        
        console.log(`✅ Successfully loaded ${sortedPosts.length} posts`);
        
        return sortedPosts;
        
    } catch (error) {
        console.error('GitHub API loading failed:', error);
        return [];
    }
}

async function loadSinglePostFile(filename, preferGitHubRaw = false) {
    try {
        console.log('Loading post:', filename);
        
        // Create paths with GitHub raw prioritized for custom domains
        const postPaths = preferGitHubRaw ? [
            `https://raw.githubusercontent.com/jtgis/blog/main/posts/${filename}?t=${Date.now()}`,
            `posts/${filename}?t=${Date.now()}`,
            `./posts/${filename}?t=${Date.now()}`,
            `/posts/${filename}?t=${Date.now()}`,
            `https://jtgis.ca/posts/${filename}?t=${Date.now()}`
        ] : [
            `posts/${filename}?t=${Date.now()}`,
            `./posts/${filename}?t=${Date.now()}`,
            `/posts/${filename}?t=${Date.now()}`,
            `https://raw.githubusercontent.com/jtgis/blog/main/posts/${filename}?t=${Date.now()}`,
            `https://jtgis.ca/posts/${filename}?t=${Date.now()}`
        ];
        
        for (const postPath of postPaths) {
            try {
                console.log(`Trying: ${postPath}`);
                const response = await fetch(postPath, { 
                    cache: 'no-cache',
                    headers: { 'Cache-Control': 'no-cache' }
                });
                console.log(`${filename} at ${postPath}: ${response.status}`);
                
                if (response.ok) {
                    const content = await response.text();
                    console.log(`✅ Loaded ${filename} from: ${postPath}`);
                    console.log(`Content length: ${content.length}`);
                    
                    return parseMarkdownPost(content, filename);
                }
            } catch (error) {
                console.log(`❌ Failed ${postPath}:`, error.message);
            }
        }
        
        console.error(`Could not load ${filename} from any path`);
        return null;
        
    } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        return null;
    }
}

function parseMarkdownPost(content, filename) {
    try {
        console.log('Parsing post:', filename);
        
        if (!content || content.trim().length === 0) {
            console.error('Empty content for:', filename);
            return null;
        }
        
        const lines = content.split('\n');
        
        // Check for frontmatter
        if (lines[0].trim() !== '---') {
            console.log('No frontmatter found, using defaults');
            const defaultDate = new Date().toISOString().split('T')[0];
            return {
                id: filename.replace('.md', ''),
                title: filename.replace('.md', '').replace(/-/g, ' '),
                content: simpleMarkdownToHtml(content),
                excerpt: createExcerpt(content),
                date: defaultDate,
                tags: [],
                slug: filename.replace('.md', ''),
                image: null,
                embed: null,
                embedType: null
            };
        }
        
        // Find end of frontmatter
        let frontmatterEnd = -1;
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '---') {
                frontmatterEnd = i;
                break;
            }
        }
        
        if (frontmatterEnd === -1) {
            console.error('Invalid frontmatter in:', filename);
            return null;
        }
        
        // Parse frontmatter with detailed logging
        const frontmatter = {};
        console.log('Parsing frontmatter for:', filename);
        
        for (let i = 1; i < frontmatterEnd; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            console.log(`Processing line ${i}:`, line);
            
            const colonIndex = line.indexOf(':');
            if (colonIndex > -1) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                
                console.log(`Raw key: "${key}", raw value: "${value}"`);
                
                // Remove quotes
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                    console.log(`After removing quotes: "${value}"`);
                }
                
                // Parse arrays
                if (value.startsWith('[') && value.endsWith(']')) {
                    value = value.slice(1, -1).split(',').map(item => 
                        item.trim().replace(/"/g, '').replace(/'/g, '')
                    ).filter(item => item);
                    console.log(`Parsed array: `, value);
                }
                
                frontmatter[key] = value;
                console.log(`Set frontmatter.${key} =`, value);
            }
        }
        
        console.log('Final frontmatter:', frontmatter);
        
        // Handle date parsing more carefully
        let postDate = frontmatter.date;
        if (!postDate) {
            console.log('No date in frontmatter, using current date');
            postDate = new Date().toISOString().split('T')[0];
        } else {
            console.log('Raw date from frontmatter:', postDate, typeof postDate);
            
            // Normalize the date format to YYYY-MM-DD
            const parsedDate = new Date(postDate);
            if (isNaN(parsedDate.getTime())) {
                console.error('Invalid date format:', postDate, 'using current date');
                postDate = new Date().toISOString().split('T')[0];
            } else {
                postDate = parsedDate.toISOString().split('T')[0];
                console.log('Normalized date:', postDate);
            }
        }
        
        const postContent = lines.slice(frontmatterEnd + 1).join('\n').trim();
        
        const post = {
            id: filename.replace('.md', ''),
            title: frontmatter.title || filename.replace('.md', '').replace(/-/g, ' '),
            content: simpleMarkdownToHtml(postContent),
            excerpt: createExcerpt(postContent),
            date: postDate,
            tags: frontmatter.tags || [],
            slug: filename.replace('.md', ''),
            image: frontmatter.image || null,
            embed: frontmatter.embed || null,
            embedType: frontmatter.embedType || null
        };
        
        console.log(`✅ Created post object for ${filename}:`);
        console.log('Title:', post.title);
        console.log('Date:', post.date);
        console.log('Date type:', typeof post.date);
        console.log('Image:', post.image);
        console.log('Embed:', post.embed);
        console.log('Tags:', post.tags);
        
        return post;
        
    } catch (error) {
        console.error(`Error parsing ${filename}:`, error);
        return null;
    }
}

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

function createExcerpt(content) {
    let text = content.replace(/[#*`\[\]()]/g, '');
    text = text.replace(/!\[.*?\]\(.*?\)/g, '');
    text = text.replace(/\[.*?\]\(.*?\)/g, '');
    
    const lines = text.split('\n').filter(line => line.trim());
    const excerpt = lines.slice(0, 3).join(' ').substring(0, 200);
    
    return excerpt + (excerpt.length === 200 ? '...' : '');
}

function simpleMarkdownToHtml(markdown) {
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*([^*\[\]]+)\*/g, '<em>$1</em>');
    
    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="content-image">');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="content-link">$1</a>');
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="content-code-block"><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="content-code-inline">$1</code>');
    
    // Lists
    const lines = html.split('\n');
    let inList = false;
    let processedLines = [];
    
    for (let line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('- ')) {
            if (!inList) {
                processedLines.push('<ul class="content-list">');
                inList = true;
            }
            const listContent = trimmedLine.substring(2);
            processedLines.push('<li>' + listContent + '</li>');
        } else {
            if (inList) {
                processedLines.push('</ul>');
                inList = false;
            }
            processedLines.push(line);
        }
    }
    
    if (inList) {
        processedLines.push('</ul>');
    }
    
    html = processedLines.join('\n');
    
    // Paragraphs
    html = html.replace(/\n\s*\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    if (!html.match(/^<[h1-6ul]/)) {
        html = '<p>' + html + '</p>';
    }
    
    // Clean up
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<\/p>/g, '');
    
    return html;
}

function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    
    console.log('Creating post element for:', post.title);
    
    // Handle different media types
    let mediaHtml = '';
    
    if (post.embed) {
        console.log('Post has embed:', post.embed);
        mediaHtml = createEmbedHtml(post.embed, post.embedType);
    } else if (post.image) {
        console.log('Post has image:', post.image);
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