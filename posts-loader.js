// Simplified posts loader - no manifest file needed

// List your posts here - add new posts to this array
const POST_FILES = [
    'post01.md',
    'post02.md'
    // Add new posts here when you create them
];

async function loadPostsFromGitHub() {
    try {
        console.log('Loading posts (simplified method)...');
        
        const posts = await Promise.all(
            POST_FILES.map(async (filename) => {
                try {
                    console.log('Loading post:', filename);
                    
                    // Try different path variations
                    const possiblePaths = [
                        `posts/${filename}`,
                        `./posts/${filename}`,
                        `/posts/${filename}`
                    ];
                    
                    let content = null;
                    let successPath = null;
                    
                    for (const path of possiblePaths) {
                        try {
                            const response = await fetch(path);
                            if (response.ok) {
                                content = await response.text();
                                successPath = path;
                                console.log(`Successfully loaded ${filename} from:`, path);
                                break;
                            }
                        } catch (error) {
                            console.log(`Failed to load ${filename} from ${path}`);
                        }
                    }
                    
                    if (!content) {
                        console.error(`Could not load ${filename} from any path`);
                        return null;
                    }
                    
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
        console.log(`Successfully loaded ${validPosts.length} posts`);
        return validPosts;
        
    } catch (error) {
        console.error('Error in loadPostsFromGitHub:', error);
        return [];
    }
}

function parseMarkdownPost(content, filename) {
    console.log('Parsing post:', filename);
    
    const lines = content.split('\n');
    
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
    
    const frontmatter = {};
    for (let i = 1; i < frontmatterEnd; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
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
        }
    }
    
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