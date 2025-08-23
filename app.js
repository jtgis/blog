const $ = (sel, el = document) => el.querySelector(sel);
const app = $("#app");
const sidebar = $("#sidebar");
$("#year").textContent = new Date().getFullYear();

const PER_PAGE = 6;
const IMG_RE = /!\[[^\]]*\]\(([^)]+)\)/;

const state = { posts: [], loaded: false };

function escapeHtml(str){return str.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function mdToHtml(md){
  md=md.replace(/\r\n?/g,"\n");
  md=md.replace(/```([\s\S]*?)```/g,(m,c)=>`<pre><code>${escapeHtml(c.trim())}</code></pre>`);
  md=md.replace(/`([^`]+)`/g,(_,c)=>`<code>${escapeHtml(c)}</code>`);
  for(let i=6;i>=1;i--){const re=new RegExp(`^${"#".repeat(i)}\\s+(.+)$`,"gm");md=md.replace(re,(_,t)=>`<h${i}>${t.trim()}</h${i}>`);}
  md=md.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
  md=md.replace(/(^|[^\*])\*([^\*]+)\*(?!\*)/g,"$1<em>$2</em>");
  md=md.replace(/\[([^\]]+)\]\(([^)]+)\)/g,`<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>`);
  md=md.replace(/(?:^|\n)([-*] .+(?:\n[-*] .+)*)/g,m=>`\n<ul>${m.trim().split("\n").map(l=>`<li>${l.replace(/^[-*]\s+/,"")}</li>`).join("")}</ul>`);
  md=md.replace(/(?:^|\n)((?:\d+\. .+(?:\n\d+\. .+)*))/g,m=>`\n<ol>${m.trim().split("\n").map(l=>`<li>${l.replace(/^\d+\.\s+/,"")}</li>`).join("")}</ol>`);
  md=md.split(/\n{2,}/).map(b=>/^\s*<(h\d|ul|ol|pre|blockquote)/.test(b)||/^\s*[-*]\s+/.test(b)||/^\s*\d+\.\s+/.test(b)||b.trim()===""?b:`<p>${b.replace(/\n/g,"<br>")}</p>`).join("\n");
  md=md.replace(/(?:^|\n)&gt;\s?(.+)(?=\n|$)/g,"\n<blockquote>$1</blockquote>");
  return md;
}
function extractFirstImage(md){const m=md.match(IMG_RE);return m?m[1]:null;}
function setTitle(t){document.title=t?`${t} · My Minimal Blog`:"My Minimal Blog";}
const uniq=a=>[...new Set(a)];
function getFiltersFromURL(){const p=new URLSearchParams(location.search);return{post:p.get("post"),page:parseInt(p.get("page")||"1",10),tag:p.get("tag"),year:p.get("year"),month:p.get("month")};}

function buildSidebar(posts){
  const allTags=uniq(posts.flatMap(p=>Array.isArray(p.tags)?p.tags:[])).sort((a,b)=>a.localeCompare(b));
  const archiveMap={};
  posts.forEach(p=>{const d=new Date(p.date),y=String(d.getFullYear()),m=String(d.getMonth()+1).padStart(2,"0");(archiveMap[y]??=new Set()).add(m);});
  const years=Object.keys(archiveMap).sort((a,b)=>b.localeCompare(a));
  const tagHtml=`<h3>Tags</h3>`+(allTags.length?`<ul>${allTags.map(t=>`<li><a href="?tag=${encodeURIComponent(t)}">${t}</a></li>`).join("")}</ul>`:`<div class="muted">No tags yet.</div>`);
  const monthNames={"01":"Jan","02":"Feb","03":"Mar","04":"Apr","05":"May","06":"Jun","07":"Jul","08":"Aug","09":"Sep","10":"Oct","11":"Nov","12":"Dec"};
  const archiveHtml=`<h3>Archives</h3>`+(years.length?`<ul>${years.map(y=>{const months=[...archiveMap[y]].sort((a,b)=>b.localeCompare(a));const monthLinks=months.map(m=>`<a href="?year=${y}&month=${m}">${monthNames[m]} ${y}</a>`).join(" · ");return `<li><a href="?year=${y}">${y}</a>${months.length?`<div>${monthLinks}</div>`:""}</li>`;}).join("")}</ul>`:`<div class="muted">No archives yet.</div>`);
  sidebar.innerHTML=`${tagHtml}${archiveHtml}`;
  sidebar.querySelectorAll('a[href^="?"]').forEach(a=>a.addEventListener("click",e=>{e.preventDefault();const u=new URL(a.href);history.pushState({}, "", u);route();}));
}

function filterPosts({tag,year,month}){
  let items=state.posts.slice();
  if(tag) items=items.filter(p=>Array.isArray(p.tags)&&p.tags.includes(tag));
  if(year) items=items.filter(p=>new Date(p.date).getFullYear()===Number(year));
  if(month) items=items.filter(p=>(new Date(p.date).getMonth()+1)===Number(month));
  return items;
}
function paginate(items,page){const total=items.length,pages=Math.max(1,Math.ceil(total/PER_PAGE)),current=Math.min(Math.max(1,page),pages),start=(current-1)*PER_PAGE;return{slice:items.slice(start,start+PER_PAGE),total,pages,current};}

async function renderList(filters){
  setTitle("");
  const filtered=filterPosts(filters).sort((a,b)=>(a.date<b.date?1:-1));
  const {slice,pages,current}=paginate(filtered,filters.page||1);
  const withImgs=await Promise.all(slice.map(async p=>{try{const r=await fetch(`posts/${p.slug}.md`);const md=await r.text();return {...p,image:extractFirstImage(md)};}catch{return {...p,image:null};}}));
  const list=withImgs.map(p=>{
    const date=new Date(p.date).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
    const tags=(p.tags||[]).map(t=>`<span class="tag">#<a href="?tag=${encodeURIComponent(t)}">${t}</a></span>`).join(" ");
    const img=p.image?`<div><img src="${p.image}" alt="" style="max-width:100%;margin:0.5rem 0;"></div>`:"";
    return `<li>
      <h2 class="post-title"><a href="?post=${encodeURIComponent(p.slug)}">${p.title}</a></h2>
      <div class="post-meta">${date}${tags?` · <span class="tags">${tags}</span>`:""}</div>
      ${img}
      ${p.description?`<div class="post-desc">${p.description}</div>`:""}
    </li>`;
  }).join("");
  const pageLinks=[];
  if(pages>1){
    const make=(n,l=n)=>{const q=new URLSearchParams(location.search);q.delete("post");q.set("page",String(n));return `<a href="?${q.toString()}">${l}</a>`;};
    pageLinks.push(current>1?make(current-1,"« Prev"):`<span>« Prev</span>`);
    for(let n=1;n<=pages;n++) pageLinks.push(n===current?`<span class="current">${n}</span>`:make(n));
    pageLinks.push(current<pages?make(current+1,"Next »"):`<span>Next »</span>`);
  }
  app.innerHTML=`<section>${filtered.length?`<ul class="post-list">${list}</ul>`:`<p>No posts found.</p>`}<div class="pagination">${pageLinks.join("")}</div></section>`;
  app.querySelectorAll('a[href^="?"]').forEach(a=>a.addEventListener("click",e=>{e.preventDefault();const u=new URL(a.href);history.pushState({}, "", u);route();}));
}

async function renderPost(slug){
  const post=state.posts.find(p=>p.slug===slug);
  if(!post){app.innerHTML=`<p>Post not found.</p><p><a class="back-link" href="./">← Back to list</a></p>`;return;}
  setTitle(post.title);
  app.innerHTML=`<p><a class="back-link" href="./">← Back to list</a></p><article><h1>${post.title}</h1><div class="post-meta">${new Date(post.date).toLocaleDateString()}</div><div id="post-body">Loading…</div></article>`;
  try{const r=await fetch(`posts/${post.slug}.md`);const md=await r.text();$("#post-body").innerHTML=mdToHtml(md);$(".back-link").addEventListener("click",e=>{e.preventDefault();history.pushState({}, "", "./");route();});}
  catch{$("#post-body").textContent="Couldn't load this post.";}
}

function route(){const f=getFiltersFromURL();buildSidebar(state.posts);if(f.post)renderPost(f.post);else renderList(f);}

async function boot(){
  const inline=document.getElementById("posts-data");
  if(inline&&inline.textContent.trim()){try{state.posts=JSON.parse(inline.textContent);state.loaded=true;route();
    try{const r=await fetch("posts.json",{cache:"no-store"});if(r.ok){state.posts=await r.json();route();}}catch{};return;}catch{}}
  try{const r=await fetch("posts.json",{cache:"no-store"});if(!r.ok) throw 0; state.posts=await r.json();state.loaded=true;route();}
  catch{app.innerHTML=`<p>Couldn't load posts.json.</p>`;sidebar.innerHTML=`<h3>Tags</h3><div class="muted">Unavailable</div><h3>Archives</h3><div class="muted">Unavailable</div>`;}
}
window.addEventListener("popstate", route);
boot();
