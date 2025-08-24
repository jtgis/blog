const app=document.querySelector("#app");const sidebar=document.querySelector("#sidebar");const y=document.querySelector("#year");if(y)y.textContent=new Date().getFullYear();
const PER_PAGE=6; const IMG_MD_RE=/!\[[^\]]*\]\(([^)]+)\)/;
const $=(s,el=document)=>el.querySelector(s);
function escapeHtml(str){return str.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

// GFM-like Markdown renderer (tables, task lists, strikethrough, autolinks, fenced code, quotes)
function mdToHtml(src){
  let md = src.replace(/\r\n?/g,"\n");

  // Pull out fenced code blocks first
  const codeBlocks=[];
  md = md.replace(/```(\w+)?\n([\s\S]*?)```/g,(m,lang,code)=>{
    const i=codeBlocks.length; codeBlocks.push({lang:lang||"", code}); return `\u0000CODE${i}\u0000`;
  });

  // Images
  md = md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,(m,alt,src)=>{
    const abs=/^(https?:)?\/\//i.test(src)||src.startsWith("/");
    const fixed=abs?src:`posts/${src}`;
    return `<img src="${fixed}" alt="${escapeHtml(alt||"")}" style="max-width:100%;">`;
  });

  // Links
  md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(m,txt,href)=>`<a href="${href}" target="_blank" rel="noopener noreferrer">${txt}</a>`);

  // Autolinks
  md = md.replace(/(?<!["'=\]])\b(https?:\/\/[^\s<]+[^\s<\.)])/g, `<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>`);

  // Strikethrough
  md = md.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  // Headings
  for(let i=6;i>=1;i--){ const re=new RegExp(`^${"#".repeat(i)}\\s+(.+)$`,"gm"); md=md.replace(re,(_,t)=>`<h${i}>${t.trim()}</h${i}>`); }

  // Blockquotes
  md = md.replace(/(^|\n)>\s?([^\n]+(?:\n(?!\n).+)*)/g,(m,lead,body)=>{
    const inner = body.split("\n").map(l=>l.replace(/^>\s?/, "")).join("\n");
    return `${lead}<blockquote>${inner}</blockquote>`;
  });

  // Tables (header | divider | rows)
  md = md.replace(/(?:^|\n)((?:\|?.+\|.+\n)(?:\|?\s*:?[-=]{3,}:?\s*(?:\|\s*:?[-=]{3,}:?\s*)+\n)(?:[\s\S]*?(?=\n{2,}|$)))/g,(m,block)=>{
    const lines = block.trim().split("\n"); if(lines.length<2) return m;
    const header=lines[0], divider=lines[1], rest=lines.slice(2);
    const split=s=>s.replace(/^\|/,"").replace(/\|$/,"").split("|").map(x=>x.trim());
    const heads=split(header); const aligns=split(divider).map(cell=>{const L=cell.trim().startsWith(":"); const R=cell.trim().endsWith(":"); return L&&R?"center":R?"right":L?"left":"";});
    if(!/-{3,}|=/.test(divider.replace(/\|/g,""))) return m;
    const thead=`<thead><tr>${heads.map((h,i)=>`<th${aligns[i]?` style="text-align:${aligns[i]}"`:""}>${h}</th>`).join("")}</tr></thead>`;
    const tbody=rest.filter(l=>l.includes("|")).map(row=>{const cells=split(row); return `<tr>${cells.map((c,i)=>`<td${aligns[i]?` style="text-align:${aligns[i]}"`:""}>${c}</td>`).join("")}</tr>`;}).join("");
    return `\n<table>\n${thead}\n<tbody>\n${tbody}\n</tbody>\n</table>\n`;
  });

  // Task lists
  md = md.replace(/^(?:\s*[-*+]\s+\[( |x|X)\]\s+.*(?:\n(?!\n).*)*)/gm, block=>{
    const items = block.split("\n").map(line=>{
      const m=line.match(/^\s*[-*+]\s+\[( |x|X)\]\s+(.*)$/);
      if(!m) return null;
      const checked=m[1].toLowerCase()==="x";
      return `<li class="task-list-item"><input type="checkbox" disabled ${checked?"checked":""}> ${m[2]}</li>`;
    }).filter(Boolean).join("");
    return `<ul class="task-list">${items}</ul>`;
  });

  // Unordered lists (non-task)
  md = md.replace(/(?:^|\n)(\s*[-*+]\s+.+(?:\n(?!\n).+)*)/g,(m,block)=>{
    if(/class="task-list"/.test(block)) return m;
    const items=block.split("\n").map(line=>line.replace(/^\s*[-*+]\s+/, "")).map(s=>`<li>${s}</li>`).join("");
    return `\n<ul>${items}</ul>`;
  });

  // Ordered lists
  md = md.replace(/(?:^|\n)((?:\s*\d+\.\s+.+)(?:\n(?!\n).+)*)/g,(m,block)=>{
    const items=block.split("\n").map(line=>line.replace(/^\s*\d+\.\s+/, "")).map(s=>`<li>${s}</li>`).join("");
    return `\n<ol>${items}</ol>`;
  });

  // Paragraphs (no <br> on single newlines, join with space)
  md = md.split(/\n{2,}/).map(chunk=>{
    if(/^\s*<(h\d|ul|ol|pre|blockquote|table|img)/.test(chunk)) return chunk;
    if(chunk.trim()==="") return "";
    return `<p>${chunk.replace(/\n+/g," ")}</p>`;
  }).join("\n");

  // Restore fenced code blocks
  md = md.replace(/\u0000CODE(\d+)\u0000/g,(m,i)=>{
    const b=codeBlocks[Number(i)]; return `<pre><code${b.lang?` class="language-${b.lang}"`:""}>${escapeHtml(b.code)}</code></pre>`;
  });

  return md;
}

function getParams(){const p=new URLSearchParams(location.search);return{post:p.get("post"),tag:p.get("tag"),year:p.get("year"),month:p.get("month"),page:parseInt(p.get("page")||"1",10)};}
async function loadPosts(){try{const r=await fetch("posts.json",{cache:"no-store"});if(r.ok)return await r.json();}catch{}try{const inline=document.querySelector("#posts-data");return inline?JSON.parse(inline.textContent):[];}catch{return [];}}

function buildSidebar(posts){
  const tags=[...new Set(posts.flatMap(p=>p.tags||[]))].sort((a,b)=>a.localeCompare(b));
  const archive={}; posts.forEach(p=>{const d=new Date(p.date),y=String(d.getFullYear()),m=String(d.getMonth()+1).padStart(2,"0");(archive[y]??=new Set()).add(m);});
  const years=Object.keys(archive).sort((a,b)=>b.localeCompare(a));
  const monthNames={"01":"Jan","02":"Feb","03":"Mar","04":"Apr","05":"May","06":"Jun","07":"Jul","08":"Aug","09":"Sep","10":"Oct","11":"Nov","12":"Dec"};
  const tagHTML=`<h3>Tags</h3>`+(tags.length?`<ul>${tags.map(t=>`<li><a href="?tag=${encodeURIComponent(t)}">${t}</a></li>`).join("")}</ul>`:`<div class="muted">No tags</div>`);
  const archHTML=`<h3>Archives</h3>`+(years.length?`<ul>${years.map(y=>{const months=[...archive[y]].sort((a,b)=>b.localeCompare(a));const mlinks=months.map(m=>`<a href="?year=${y}&month=${m}">${monthNames[m]} ${y}</a>`).join(" · ");return `<li><a href="?year=${y}">${y}</a>${months.length?`<div>${mlinks}</div>`:""}</li>`;}).join("")}</ul>`:`<div class="muted">No archives</div>`);
  sidebar.innerHTML=tagHTML+archHTML;
  sidebar.querySelectorAll('a[href^="?"]').forEach(a=>a.addEventListener("click",e=>{e.preventDefault();history.pushState({}, "", a.href);route();}));
}

function filterPosts(posts,{tag,year,month}){
  let list=posts.slice();
  if(tag) list=list.filter(p=>Array.isArray(p.tags)&&p.tags.includes(tag));
  if(year) list=list.filter(p=>new Date(p.date).getFullYear()===Number(year));
  if(month) list=list.filter(p=>(new Date(p.date).getMonth()+1)===Number(month));
  return list;
}

function paginate(list,page){const pages=Math.max(1,Math.ceil(list.length/PER_PAGE));const current=Math.min(Math.max(1,page),pages);const start=(current-1)*PER_PAGE;return{slice:list.slice(start,start+PER_PAGE),pages,current};}

async function renderList(posts,filters){
  const list=filterPosts(posts,filters).sort((a,b)=>a.date<b.date?1:-1);
  const {slice,pages,current}=paginate(list,filters.page||1);
  const enriched=await Promise.all(slice.map(async p=>{try{const r=await fetch(`posts/${p.slug}.md`);const md=await r.text();const m=md.match(IMG_MD_RE);let img=m?m[1]:null;if(img && !/^https?:\/\//i.test(img) && !img.startsWith("/") && !img.startsWith("posts/")) img=`posts/${img}`;return {...p,image:img};}catch{return {...p,image:null};}}));
  const items=enriched.map(p=>{
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

  const links=[];
  if(pages>1){
    const mk=(n,l=n)=>{const q=new URLSearchParams(location.search);q.delete("post");q.set("page",String(n));return `<a href="?${q.toString()}">${l}</a>`;};
    links.push(current>1?mk(current-1,"« Prev"):`<span>« Prev</span>`);
    for(let n=1;n<=pages;n++) links.push(n===current?`<span class="current">${n}</span>`:mk(n));
    links.push(current<pages?mk(current+1,"Next »"):`<span>Next »</span>`);
  }

  app.innerHTML=`<section>${list.length?`<ul class="post-list">${items}</ul>`:`<p>No posts found.</p>`}<div class="pagination">${links.join("")}</div></section>`;
  app.querySelectorAll('a[href^="?"]').forEach(a=>a.addEventListener("click",e=>{e.preventDefault();history.pushState({}, "", a.href);route();}));
}

async function renderPost(posts,slug){
  const p=posts.find(x=>x.slug===slug);
  if(!p){app.innerHTML="<p>Not found</p>";return;}
  app.innerHTML=`<p><a class="back-link" href="./">← Back</a></p><article><h1>${p.title}</h1><div class="post-meta">${new Date(p.date).toLocaleDateString()}</div><div id="post-body">Loading…</div></article>`;
  try{const r=await fetch(\`posts/${p.slug}.md\`);const md=await r.text();document.querySelector("#post-body").innerHTML=mdToHtml(md);document.querySelector(".back-link").addEventListener("click",e=>{e.preventDefault();history.pushState({}, "", "./");route();});}
  catch{document.querySelector("#post-body").textContent="Couldn't load this post.";}
}

async function route(){const posts=await loadPosts();buildSidebar(posts);const params=getParams();if(params.post){await renderPost(posts,params.post);} else {await renderList(posts,params);}}
window.addEventListener("popstate", route);
route();
