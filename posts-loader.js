// Create this new file to handle loading posts from GitHub

async function loadPostsFromGitHub() {
    try {
        // Try to load a posts manifest file
        const response = await fetch('posts/manifest.json');
        
        if (!response.ok) {
            throw new Error('No manifest found');
        }
        
        const manifest = await response.json();
        
        // Load each post file
        const posts = await Promise.all(
            manifest.files.map(async (filename) => {
                try {
                    const postResponse = await fetch(`posts/${filename}`);
                    const postContent = await postResponse.text();
                    return parseMarkdownPost(postContent, filename);
                } catch (error) {
                    console.error(`Failed to load post: ${filename}`, error);
                    return null;
                }
            })
        );
        
        return posts.filter(post => post !== null).sort((a, b) => new Date(b.date) - new Date(a.date));
        
    } catch (error) {
        console.log('Loading sample posts (no GitHub posts found)', error);
        return [];
    }
}

function parseMarkdownPost(content, filename) {
    console.log('Parsing post:', filename);
    console.log('Content preview:', content.substring(0, 200));
    
    // Parse frontmatter and content
    const lines = content.split('\n');
    
    if (lines[0].trim() !== '---') {
        console.log('No frontmatter found, using defaults');
        // No frontmatter, treat as simple markdown
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
        console.error('Invalid frontmatter - no closing ---');
        throw new Error('Invalid frontmatter');
    }
    
    console.log('Frontmatter lines:', lines.slice(1, frontmatterEnd));
    
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
            
            // Parse arrays (tags)
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(item => 
                    item.trim().replace(/"/g, '').replace(/'/g, '')
                ).filter(item => item);
            }
            
            frontmatter[key] = value;
        }
    }
    
    console.log('Parsed frontmatter:', frontmatter);
    
    // Get content after frontmatter
    const postContent = lines.slice(frontmatterEnd + 1).join('\n').trim();
    
    return {
        id: filename.replace('.md', ''),
        title: frontmatter.title || filename.replace('.md', '').replace(/-/g, ' '),
        content: simpleMarkdownToHtml(postContent),
        excerpt: createExcerpt(postContent),
        date: frontmatter.date || new Date().toISOString().split('T')[0],
        tags: frontmatter.tags || [],
        slug: filename.replace('.md', ''),
        image: frontmatter.image
    };
}

function createExcerpt(content) {
    // Remove markdown and get first few lines
    let text = content.replace(/[#*`\[\]()]/g, '');
    text = text.replace(/!\[.*?\]\(.*?\)/g, ''); // Remove images
    text = text.replace(/\[.*?\]\(.*?\)/g, ''); // Remove links
    
    const lines = text.split('\n').filter(line => line.trim());
    const excerpt = lines.slice(0, 3).join(' ').substring(0, 200);
    
    return excerpt + (excerpt.length === 200 ? '...' : '');
}

function simpleMarkdownToHtml(markdown) {
    console.log('Processing markdown:', markdown); // Debug log
    
    let html = markdown;
    
    // DON'T remove any headers - show them all!
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic (but not inside image alt text)
    html = html.replace(/\*([^*\[\]]+)\*/g, '<em>$1</em>');
    
    // Images FIRST - before links and lists
    console.log('Before image processing:', html);
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function(match, alt, src) {
        console.log('Found image:', { match, alt, src });
        return `<img src="${src}" alt="${alt}" style="max-width: 100%; height: auto; margin: 20px 0; display: block; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">`;
    });
    console.log('After image processing:', html);
    
    // Links (after images)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #333; text-decoration: underline;">$1</a>');
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre style="background: #f0f0f0; padding: 15px; margin: 15px 0; overflow-x: auto; font-family: \'Courier New\', monospace; border: 1px solid #ddd; border-radius: 4px;"><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code style="background: #f0f0f0; padding: 2px 6px; font-family: \'Courier New\', monospace; border-radius: 2px;">$1</code>');
    
    // Process lists more carefully
    const lines = html.split('\n');
    let inList = false;
    let processedLines = [];
    
    for (let line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('- ')) {
            if (!inList) {
                processedLines.push('<ul style="margin: 15px 0; padding-left: 30px;">');
                inList = true;
            }
            // Get content after the "- " and process it
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
    
    // Wrap in paragraphs if doesn't start with HTML tag
    if (!html.match(/^<[h1-6ul]/)) {
        html = '<p>' + html + '</p>';
    }
    
    // Clean up empty paragraphs and extra breaks
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<br>\s*<img/g, '<img'); // Remove breaks before images
    html = html.replace(/<\/li><br>/g, '</li>'); // Remove breaks after list items
    html = html.replace(/<\/h[1-6]><br>/g, function(match) { return match.replace('<br>', ''); }); // Remove breaks after headers
    
    console.log('Final HTML:', html); // Debug log
    
    return html;
}