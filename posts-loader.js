// Posts loader with manifest file

async function loadPostsFromGitHub() {
    try {
        console.log('Loading posts with manifest...');
        console.log('Current domain:', window.location.hostname);
        console.log('Current timestamp:', new Date().toISOString());
        
        // First, load the manifest with cache busting
        const cacheBuster = '?t=' + Date.now();
        const manifestPaths = [
            `posts/manifest.json${cacheBuster}`,
            `./posts/manifest.json${cacheBuster}`,
            `/posts/manifest.json${cacheBuster}`,
            `https://jtgis.ca/posts/manifest.json${cacheBuster}`,
            `https://raw.githubusercontent.com/jtgis/blog/main/posts/manifest.json${cacheBuster}`
        ];
        
        let manifest = null;
        let workingBasePath = null;
        
        for (const path of manifestPaths) {
            try {
                console.log(`Trying manifest path: ${path}`);
                const response = await fetch(path, { 
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache'
                    }
                });
                console.log(`Manifest ${path} response:`, response.status, response.statusText);
                
                if (response.ok) {
                    const manifestText = await response.text();
                    console.log('Raw manifest content:', manifestText);
                    
                    try {
                        manifest = JSON.parse(manifestText);
                        console.log('Parsed manifest:', manifest);
                    } catch (parseError) {
                        console.error('Failed to parse manifest JSON:', parseError);
                        continue;
                    }
                    
                    // Extract the base path for posts
                    workingBasePath = path.replace('manifest.json' + cacheBuster, '');
                    console.log('Manifest loaded from:', path);
                    console.log('Using base path:', workingBasePath);
                    break;
                }
            } catch (error) {
                console.log(`Failed to load manifest from ${path}:`, error.message);
            }
        }
        
        if (!manifest) {
            throw new Error('Could not load manifest from any path');
        }
        
        if (!manifest.files || !Array.isArray(manifest.files)) {
            console.error('Invalid manifest format:', manifest);
            throw new Error('Invalid manifest format - missing or invalid files array');
        }
        
        console.log('Manifest files array:', manifest.files);
        
        if (manifest.files.length === 0) {
            console.log('No files in manifest');
            return [];
        }
        
        // Now load each post using the working base path
        const posts = await Promise.all(
            manifest.files.map(async (filename) => {
                try {
                    console.log('Loading post:', filename);
                    
                    const postPath = workingBasePath + filename + '?t=' + Date.now();
                    console.log(`Loading from: ${postPath}`);
                    
                    const response = await fetch(postPath, { 
                        cache: 'no-cache',
                        headers: {
                            'Cache-Control': 'no-cache'
                        }
                    });
                    console.log(`Post ${filename} response:`, response.status, response.statusText);
                    
                    if (!response.ok) {
                        console.error(`Post not found: ${filename} - ${response.status} ${response.statusText}`);
                        return null;
                    }
                    
                    const content = await response.text();
                    console.log(`Post ${filename} loaded, length:`, content.length);
                    console.log(`Post ${filename} content preview:`, content.substring(0, 200));
                    
                    const parsedPost = parseMarkdownPost(content, filename);
                    console.log(`Parsed ${filename}:`, parsedPost.title);
                    return parsedPost;
                    
                } catch (error) {
                    console.error(`Error processing ${filename}:`, error);
                    return null;
                }
            })
        );
        
        const validPosts = posts.filter(post => post !== null).sort((a, b) => new Date(b.date) - new Date(a.date));
        console.log(`Successfully loaded ${validPosts.length} posts out of ${manifest.files.length} attempted`);
        
        if (validPosts.length > 0) {
            console.log('Valid posts:', validPosts.map(p => ({ title: p.title, slug: p.slug, date: p.date })));
        } else {
            console.log('No valid posts loaded');
        }
        
        return validPosts;
        
    } catch (error) {
        console.error('Error in loadPostsFromGitHub:', error);
        console.log('Falling back to empty array');
        return [];
    }
}

function parseMarkdownPost(content, filename) {
    console.log('Parsing post:', filename);
    console.log('Content length:', content.length);
    
    if (!content || content.trim().length === 0) {
        console.error('Empty content for:', filename);
        return null;
    }
    
    const lines = content.split('\n');
    console.log('Content lines:', lines.length);
    console.log('First few lines:', lines.slice(0, 5));
    
    if (lines[0].trim() !== '---') {
        console.log('No frontmatter found, using defaults for:', filename);
        return {
            id: filename.replace('.md', ''),
            title: filename.replace('.md', '').replace(/-/g, ' '),
            content: simpleMarkdownToHtml(content),
            excerpt: createExcerpt(content),
            date: new Date().toISOString().split('T')[0],
            tags: [],
            slug: filename.replace('.md', ''),
            image: null
        };
    }
    
    let frontmatterEnd = -1;
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
            frontmatterEnd = i;
            break;
        }
    }
    
    if (frontmatterEnd === -1) {
        console.error('Invalid frontmatter - no closing --- in:', filename);
        console.log('Lines searched:', lines.slice(0, 10));
        throw new Error('Invalid frontmatter');
    }
    
    console.log('Frontmatter ends at line:', frontmatterEnd);
    
    const frontmatter = {};
    for (let i = 1; i < frontmatterEnd; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        console.log('Processing frontmatter line:', line);
        
        const colonIndex = line.indexOf(':');
        if (colonIndex > -1) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();
            
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(item => 
                    item.trim().replace(/"/g, '').replace(/'/g, '')
                ).filter(item => item);
            }
            
            frontmatter[key] = value;
            console.log(`Frontmatter ${key}:`, value);
        }
    }
    
    console.log('Final frontmatter:', frontmatter);
    
    const postContent = lines.slice(frontmatterEnd + 1).join('\n').trim();
    console.log('Post content length after frontmatter:', postContent.length);
    
    const post = {
        id: filename.replace('.md', ''),
        title: frontmatter.title || filename.replace('.md', '').replace(/-/g, ' '),
        content: simpleMarkdownToHtml(postContent),
        excerpt: createExcerpt(postContent),
        date: frontmatter.date || new Date().toISOString().split('T')[0],
        tags: frontmatter.tags || [],
        slug: filename.replace('.md', ''),
        image: frontmatter.image
    };
    
    console.log('Created post object:', { title: post.title, slug: post.slug, date: post.date });
    
    return post;
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
    
    // Images - using CSS classes instead of inline styles
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="content-image">');
    
    // Links - using CSS classes
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="content-link">$1</a>');
    
    // Code blocks - using CSS classes
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="content-code-block"><code>$1</code></pre>');
    
    // Inline code - using CSS classes
    html = html.replace(/`([^`]+)`/g, '<code class="content-code-inline">$1</code>');
    
    // Process lists
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
    
    // Line breaks and paragraphs
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