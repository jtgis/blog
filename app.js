/* Minimal blog engine: reads posts.json and Markdown files, no build step. */

const $ = (sel, el = document) => el.querySelector(sel);
const app = $("#app");
$("#year").textContent = new Date().getFullYear();

const state = {
  posts: [],
  loaded: false
};

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* Very small Markdown -> HTML converter covering common basics */
function mdToHtml(md) {
  // Normalize newlines
  md = md.replace(/\r\n?/g, "\n");

  // Fenced code blocks ```lang\n...\n```
  md = md.replace(/```([\s\S]*?)```/g, (m, code) => {
    return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code `...`
  md = md.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`);

  // Headings ###### to #
  for (let i = 6; i >= 1; i--) {
    const re = new RegExp(`^${"#".repeat(i)}\\s+(.+)$`, "gm");
    md = md.replace(re, (_, txt) => `<h${i}>${txt.trim()}</h${i}>`);
  }

  // Bold **text**
  md = md.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italic *text*
  md = md.replace(/(^|[^\*])\*([^\*]+)\*(?!\*)/g, "$1<em>$2</em>");

  // Links [text](url)
  md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>`);

  // Lists (unordered)
  md = md.replace(/(?:^|\n)([-*] .+(?:\n[-*] .+)*)/g, (m) => {
    const items = m.trim().split("\n").map(line => line.replace(/^[-*]\s+/, "")).map(s => `<li>${s}</li>`).join("");
    return `\n<ul>${items}</ul>`;
  });

  // Lists (ordered)
  md = md.replace(/(?:^|\n)((?:\d+\. .+(?:\n\d+\. .+)*))/g, (m) => {
    const items = m.trim().split("\n").map(line => line.replace(/^\d+\.\s+/, "")).map(s => `<li>${s}</li>`).join("");
    return `\n<ol>${items}</ol>`;
  });

  // Paragraphs: wrap remaining text blocks separated by blank lines
  md = md.split(/\n{2,}/).map(block => {
    if (/^\s*<(h\d|ul|ol|pre|blockquote)/.test(block)) return block;
    if (/^\s*[-*]\s+/.test(block) || /^\s*\d+\.\s+/.test(block)) return block;
    if (block.trim() === "") return "";
    return `<p>${block.replace(/\n/g, "<br>")}</p>`;
  }).join("\n");

  // Blockquotes > ...
  md = md.replace(/(?:^|\n)&gt;\s?(.+)(?=\n|$)/g, "\n<blockquote>$1</blockquote>");

  return md;
}

function setTitle(t) {
  document.title = t ? `${t} · My Minimal Blog` : "My Minimal Blog";
}

function renderList() {
  setTitle("");
  const list = state.posts
    .slice()
    .sort((a,b) => (a.date < b.date ? 1 : -1))
    .map(p => {
      const date = new Date(p.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      return `<li>
        <h2 class="post-title"><a href="?post=${encodeURIComponent(p.slug)}">${p.title}</a></h2>
        <div class="post-meta">${date}</div>
        ${p.description ? `<div class="post-desc">${p.description}</div>` : ""}
      </li>`;
    }).join("");
  app.innerHTML = `<section>
    <ul class="post-list">${list}</ul>
  </section>`;
  // Attach click handlers for client-side navigation
  app.querySelectorAll('a[href^="?post="]').forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const url = new URL(a.href);
      history.pushState({}, "", url);
      route();
    });
  });
}

async function renderPost(slug) {
  const post = state.posts.find(p => p.slug === slug);
  if (!post) {
    app.innerHTML = `<p>Post not found.</p><p><a class="back-link" href="./">← Back to list</a></p>`;
    return;
  }
  setTitle(post.title);
  app.innerHTML = `<p><a class="back-link" href="./">← Back to list</a></p><article><h1>${post.title}</h1><div class="post-meta">${new Date(post.date).toLocaleDateString()}</div><div id="post-body">Loading…</div></article>`;
  try {
    const res = await fetch(`posts/${post.slug}.md`);
    const md = await res.text();
    $("#post-body").innerHTML = mdToHtml(md);
    // Rebind back link
    $(".back-link").addEventListener("click", (e) => {
      e.preventDefault();
      history.pushState({}, "", "./");
      route();
    });
  } catch (err) {
    $("#post-body").textContent = "Couldn't load this post.";
  }
}

function route() {
  const params = new URLSearchParams(location.search);
  const slug = params.get("post");
  if (slug) {
    renderPost(slug);
  } else {
    renderList();
  }
}

async function boot() {
  try {
    const res = await fetch("posts.json", { cache: "no-store" });
    if (!res.ok) throw new Error("posts.json not found");
    state.posts = await res.json();
    state.loaded = true;
    route();
  } catch (e) {
    app.innerHTML = `<p>Couldn't load posts.json. Make sure it exists in the site root.</p>`;
  }
}

window.addEventListener("popstate", route);
boot();
