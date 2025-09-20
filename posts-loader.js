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
        
        // Now load each post using multiple path attempts
        const posts = await Promise.all(
            manifest.files.map(async (filename) => {
                try {
                    console.log('Loading post:', filename);
                    
                    // Try multiple paths for each post file
                    const postPaths = [
                        `${workingBasePath}${filename}?t=${Date.now()}`,
                        `posts/${filename}?t=${Date.now()}`,
                        `./posts/${filename}?t=${Date.now()}`,
                        `/posts/${filename}?t=${Date.now()}`,
                        `https://jtgis.ca/posts/${filename}?t=${Date.now()}`,
                        `https://raw.githubusercontent.com/jtgis/blog/main/posts/${filename}?t=${Date.now()}`
                    ];
                    
                    let content = null;
                    let successPath = null;
                    
                    for (const postPath of postPaths) {
                        try {
                            console.log(`Trying post path: ${postPath}`);
                            const response = await fetch(postPath, { 
                                cache: 'no-cache',
                                headers: {
                                    'Cache-Control': 'no-cache'
                                }
                            });
                            console.log(`Post ${filename} at ${postPath} response:`, response.status, response.statusText);
                            
                            if (response.ok) {
                                content = await response.text();
                                successPath = postPath;
                                console.log(`Successfully loaded ${filename} from: ${postPath}`);
                                console.log(`Content length: ${content.length}`);
                                break;
                            }
                        } catch (error) {
                            console.log(`Failed to load ${filename} from ${postPath}:`, error.message);
                        }
                    }
                    
                    if (!content) {
                        console.error(`Could not load ${filename} from any path`);
                        return null;
                    }
                    
                    console.log(`Post ${filename} content preview:`, content.substring(0, 200));
                    
                    const parsedPost = parseMarkdownPost(content, filename);
                    if (parsedPost) {
                        console.log(`Parsed ${filename}:`, parsedPost.title);
                    }
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

// ...rest of your existing functions remain the same...