// Posts loader with manifest file

async function loadPostsFromGitHub() {
    try {
        console.log('Loading posts with manifest...');
        console.log('Current domain:', window.location.hostname);
        
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
                console.log(`Manifest ${path} response:`, response.status);
                
                if (response.ok) {
                    const manifestText = await response.text();
                    console.log('Raw manifest content:', manifestText);
                    
                    manifest = JSON.parse(manifestText);
                    console.log('Parsed manifest:', manifest);
                    
                    // Extract the base path for posts
                    workingBasePath = path.replace('manifest.json' + cacheBuster, '');
                    console.log('Using base path:', workingBasePath);
                    break;
                }
            } catch (error) {
                console.log(`Failed to load manifest from ${path}:`, error.message);
            }
        }
        
        if (!manifest || !manifest.files || !Array.isArray(manifest.files)) {
            throw new Error('Could not load valid manifest');
        }
        
        console.log('Manifest files:', manifest.files);
        
        if (manifest.files.length === 0) {
            console.log('No files in manifest');
            return [];
        }
        
        // Load each post
        const posts = await Promise.all(
            manifest.files.map(async (filename) => {
                return await loadSinglePostFile(filename, workingBasePath);
            })
        );
        
        const validPosts = posts.filter(post => post !== null).sort((a, b) => new Date(b.date) - new Date(a.date));
        console.log(`Successfully loaded ${validPosts.length} posts`);
        
        return validPosts;
        
    } catch (error) {
        console.error('Error in loadPostsFromGitHub:', error);
        return [];
    }
}

async function loadSinglePostFile(filename, basePath) {
    try {
        console.log('Loading post:', filename);
        
        // Try multiple paths for each post file
        const postPaths = [
            `${basePath}${filename}?t=${Date.now()}`,
            `posts/${filename}?t=${Date.now()}`,
            `./posts/${filename}?t=${Date.now()}`,
            `/posts/${filename}?t=${Date.now()}`,
            `https://jtgis.ca/posts/${filename}?t=${Date.now()}`,
            `https://raw.githubusercontent.com/jtgis/blog/main/posts/${filename}?t=${Date.now()}`
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
        
        // Parse frontmatter
        const frontmatter = {};
        for (let i = 1; i < frontmatterEnd; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const colonIndex = line.indexOf(':');
            if (colonIndex > -1) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                
                // Remove quotes
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                
                // Parse arrays
                if (value.startsWith('[') && value.endsWith(']')) {
                    value = value.slice(1, -1).split(',').map(item => 
                        item.trim().replace(/"/g, '').replace(/'/g, '')
                    ).filter(item => item);
                }
                
                frontmatter[key] = value;
            }
        }
        
        const postContent = lines.slice(frontmatterEnd + 1).join('\n').trim();
        
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
        
        console.log(`✅ Parsed ${filename}:`, post.title);
        return post;
        
    } catch (error) {
        console.error(`Error parsing ${filename}:`, error);
        return null;
    }
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