/* Minimal blog engine with:
   - Pagination (6 posts per page)
   - Sidebar with Tags and Archives (years/months)
   - Simple Markdown rendering
*/

const $ = (sel, el = document) => el.querySelector(sel);
const app = $("#app");
const sidebar = $("#sidebar");
$("#year").textContent = new Date().getFullYear();

const PER_PAGE = 6;

const state = {
  posts: [],
  loaded: false
};

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* Very small Markdown -> HTML converter covering common basics */
function mdToHtml(md) {
  md = md.replace(/\r\n?/g, "\n");
  md = md.replace(/```([\s\S]*?)```/g, (m, code) => `<pre><code>${escapeHtml(code.trim())}</code></pre>`);
  md = md.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`);
  for (let i = 6; i >= 1; i--) {
    const re = new RegExp(`^${"#".repeat(i)}\\s+(.+)$`, "gm");
    md = md.replace(re, (_, txt) => `<h${i}>${txt.trim()}</h${i}>`);
  }
  md = md.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  md = md.replace(/(^|[^\*])\*([^\*]+)\*(?!\*)/g, "$1<em>$2</em>");
  md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>`);
  md = md.replace(/(?:^|\n)([-*] .+(?:\n[-*] .+)*)/g, (m) => {
    const items = m.trim().split("\n").map(line => line.replace(/^[-*]\s+/, "")).map(s => `<li>${s}</li>`).join("");
    return `\n<ul>${items}</ul>`;
  });
  md = md.replace(/(?:^|\n)((?:\d+\. .+(?:\n\d+\. .+)*))/g, (m) => {
    const items = m.trim().split("\n").map(line => line.replace(/^\d+\.\s+/, "")).map(s => `<li>${s}</li>`).join("");
    return `\n<ol>${items}</ol>`;
  });
  md = md.split(/\n{2,}/).map(block => {
    if (/^\s*<(h\d|ul|ol|pre|blockquote)/.test(block)) return block;
    if (/^\s*[-*]\s+/.test(block) || /^\s*\d+\.\s+/.test(block)) return block;
    if (block.trim() === "") return "";
    return `<p>${block.replace(/\n/g, "<br>")}</p>`;
  }).join("\n");
  md = md.replace(/(?:^|\n)&gt;\s?(.+)(?=\n|$)/g, "\n<blockquote>$1</blockquote>");
  return md;
}

function setTitle(t) {
  document.title = t ? `${t} · My Minimal Blog` : "My Minimal Blog";
}

function uniq(arr) {
  return [...new Set(arr)];
}

function getFiltersFromURL() {
  const params = new URLSearchParams(location.search);
  return {
    post: params.get("post"),
    page: parseInt(params.get("page") || "1", 10),
    tag: params.get("tag"),
    year: params.get("year"),
    month: params.get("month")
  };
}

function buildSidebar(posts) {
  // Tags
  const allTags = uniq(posts.flatMap(p => Array.isArray(p.tags) ? p.tags : []))
    .sort((a,b) => a.localeCompare(b));

  // Archives: year -> months
  const archiveMap = {};
  posts.forEach(p => {
    const d = new Date(p.date);
    const y = String(d.getFullYear());
    const m = String(d.getMonth() + 1).padStart(2, "0"); // 01..12
    if (!archiveMap[y]) archiveMap[y] = new Set();
    archiveMap[y].add(m);
  });
  const years = Object.keys(archiveMap).sort((a,b) => b.localeCompare(a));

  const tagHtml = allTags.length
    ? `<h3>Tags</h3><ul>${allTags.map(t => `<li><a href="?tag=${encodeURIComponent(t)}">${t}</a></li>`).join("")}</ul>`
    : "";

  const archiveHtml = years.length
    ? `<h3>Archives</h3><ul>${
        years.map(y => {
          const months = [...archiveMap[y]].sort((a,b) => b.localeCompare(a));
          const monthNames = { "01":"Jan","02":"Feb","03":"Mar","04":"Apr","05":"May","06":"Jun","07":"Jul","08":"Aug","09":"Sep","10":"Oct","11":"Nov","12":"Dec" };
          const monthLinks = months.map(m => `<a href="?year=${y}&month=${m}">${monthNames[m]} ${y}</a>`).join(" · ");
          return `<li><a href="?year=${y}">${y}</a>${months.length ? `<div>${monthLinks}</div>` : ""}</li>`;
        }).join("")
      }</ul>`
    : "";

  sidebar.innerHTML = `${tagHtml}${archiveHtml}`;

  // Client-side link handling for sidebar
  sidebar.querySelectorAll('a[href^="?"]').forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const url = new URL(a.href);
      history.pushState({}, "", url);
      route();
    });
  });
}

function filterPosts({ tag, year, month }) {
  let items = state.posts.slice();
  if (tag) {
    items = items.filter(p => Array.isArray(p.tags) && p.tags.includes(tag));
  }
  if (year) {
    items = items.filter(p => new Date(p.date).getFullYear() === Number(year));
  }
  if (month) {
    items = items.filter(p => (new Date(p.date).getMonth()+1) === Number(month));
  }
  return items;
}

function paginate(items, page) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * PER_PAGE;
  const slice = items.slice(start, start + PER_PAGE);
  return { slice, total, pages, current };
}

function renderList(filters) {
  setTitle("");
  const filtered = filterPosts(filters).sort((a,b) => (a.date < b.date ? 1 : -1));
  const { slice, total, pages, current } = paginate(filtered, filters.page || 1);

  const list = slice.map(p => {
    const date = new Date(p.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const tags = (p.tags || []).map(t => `<span class="tag">#<a href="?tag=${encodeURIComponent(t)}">${t}</a></span>`).join(" ");
    return `<li>
      <h2 class="post-title"><a href="?post=${encodeURIComponent(p.slug)}">${p.title}</a></h2>
      <div class="post-meta">${date}${tags ? ` · <span class="tags">${tags}</span>` : ""}</div>
      ${p.description ? `<div class="post-desc">${p.description}</div>` : ""}
    </li>`;
  }).join("");

  const pageLinks = [];
  if (pages > 1) {
    const makeLink = (n, label = n) => {
      const params = new URLSearchParams(location.search);
      params.delete("post");
      params.set("page", String(n));
      return `<a href="?${params.toString()}">${label}</a>`;
    };
    pageLinks.push(current > 1 ? makeLink(current - 1, "« Prev") : `<span>« Prev</span>`);
    for (let n = 1; n <= pages; n++) {
      if (n === current) pageLinks.push(`<span class="current">${n}</span>`);
      else pageLinks.push(makeLink(n));
    }
    pageLinks.push(current < pages ? makeLink(current + 1, "Next »") : `<span>Next »</span>`);
  }

  app.innerHTML = `<section>
    ${filtered.length ? `<ul class="post-list">${list}</ul>` : `<p>No posts found.</p>`}
    <div class="pagination">${pageLinks.join("")}</div>
  </section>`;

  // Bind list links
  app.querySelectorAll('a[href^="?"]').forEach(a => {
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
  app.innerHTML = `<p><a class="back-link" href="./">← Back to list</a></p>
  <article>
    <h1>${post.title}</h1>
    <div class="post-meta">${new Date(post.date).toLocaleDateString()}</div>
    <div id="post-body">Loading…</div>
  </article>`;
  try {
    const res = await fetch(`posts/${post.slug}.md`);
    const md = await res.text();
    $("#post-body").innerHTML = mdToHtml(md);
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
  const filters = getFiltersFromURL();
  buildSidebar(state.posts);
  if (filters.post) {
    renderPost(filters.post);
  } else {
    renderList(filters);
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
