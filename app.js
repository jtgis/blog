(function(){
const app=document.querySelector("#app");const sidebar=document.querySelector("#sidebar");const y=document.querySelector("#year");if(y)y.textContent=new Date().getFullYear();
const PER_PAGE=6; const IMG_MD_RE=/!\[[^\]]*\]\(([^)]+)\)/;
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function autoLink(t){return t.replace(/(https?:\/\/[^\s<]+[^\s<\.)])/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');}
function mdToHtml(src){
  let md=src.replace(/\r\n?/g,"\n");
  const codes=[]; md=md.replace(/```(\w+)?\n([\s\S]*?)```/g,(_,lang,code)=>{const i=codes.length;codes.push({lang:lang||"",code});return "\u0000C"+i+"\u0000";});
  md=md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,(_,alt,src)=>{const abs=/^(https?:)?\/\//i.test(src)||src.startsWith("/");const fixed=abs?src:"posts/"+src;return '<img src="'+fixed+'" alt="'+escapeHtml(alt||"")+'" style="max-width:100%;">';});
  md=md.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,txt,href)=>'<a href="'+href+'" target="_blank" rel="noopener noreferrer">'+txt+'</a>');
  md=md.replace(/~~([^~]+)~~/g,"<del>$1</del>");
  for(let i=6;i>=1;i--){const re=new RegExp("^"+("#".repeat(i))+"\\s+(.+)$","gm");md=md.replace(re,(_,t)=>"<h"+i+">"+t.trim()+"</h"+i+">");}
  md=md.replace(/(^|\n)>\s?([^\n]+(?:\n(?!\n).+)*)/g,(m,lead,body)=>{const inner=body.split("\n").map(l=>l.replace(/^>\s?/,"")).join("\n");return lead+"<blockquote>"+inner+"</blockquote>";});
  // Relaxed table matcher: stops at next single blank line or EOF
  md=md.replace(/(?:^|\n)((?:\|?.+\|.+\n)(?:\|?\s*:?[-=]{3,}:?\s*(?:\|\s*:?[-=]{3,}:?\s*)+\n)(?:[\s\S]*?(?=\n|$))*)/g,(m,block)=>{
    const lines=block.trim().split("\n"); if(lines.length<2) return m;
    const header=lines[0], divider=lines[1], rest=lines.slice(2);
    const split=s=>s.replace(/^\|/,"").replace(/\|$/,"").split("|").map(x=>x.trim());
    const heads=split(header); const aligns=split(divider).map(c=>{c=c.trim();const L=c.startsWith(":"),R=c.endsWith(":");return L&&R?"center":R?"right":L?"left":"";});
    if(!/-{3,}|=/.test(divider.replace(/\|/g,""))) return m;
    const thead="<thead><tr>"+heads.map((h,i)=>"<th"+(aligns[i]?' style="text-align:'+aligns[i]+'"':"")+">"+h+"</th>").join("")+"</tr></thead>";
    const tbody=rest.filter(l=>l.includes("|")).map(row=>{const cells=split(row);return "<tr>"+cells.map((c,i)=>"<td"+(aligns[i]?' style="text-align:'+aligns[i]+'"':"")+">"+c+"</td>").join("")+"</tr>";}).join("");
    return "\n<table>\n"+thead+"\n<tbody>\n"+tbody+"\n</tbody>\n</table>\n";
  });
  md=md.replace(/^(?:\s*[-*+]\s+\[( |x|X)\]\s+.*(?:\n(?!\n).*)*)/gm,block=>{
    const items=block.split("\n").map(line=>{const m=line.match(/^\s*[-*+]\s+\[( |x|X)\]\s+(.*)$/);if(!m)return null;const checked=m[1].toLowerCase()==="x";return '<li class="task-list-item"><input type="checkbox" disabled '+(checked?"checked":"")+"> "+m[2]+"</li>";}).filter(Boolean).join("");
    return '<ul class="task-list">'+items+"</ul>";
  });
  md=md.replace(/(?:^|\n)(\s*[-*+]\s+.+(?:\n(?!\n).+)*)/g,(m,block)=>{if(/class="task-list"/.test(block))return m;const items=block.split("\n").map(l=>l.replace(/^\s*[-*+]\s+/,"")).map(s=>"<li>"+s+"</li>").join("");return "\n<ul>"+items+"</ul>";});
  md=md.replace(/(?:^|\n)((?:\s*\d+\.\s+.+)(?:\n(?!\n).+)*)/g,(m,block)=>{const items=block.split("\n").map(l=>l.replace(/^\s*\d+\.\s+/,"")).map(s=>"<li>"+s+"</li>").join("");return "\n<ol>"+items+"</ol>";});
  md=md.split(/\n{2,}/).map(chunk=>{if(/^\s*<(h\d|ul|ol|pre|blockquote|table|img)/.test(chunk))return chunk;if(chunk.trim()==="")return "";return "<p>"+autoLink(chunk.replace(/\n+/g," "))+"</p>";}).join("\n");
  md=md.replace(/\u0000C(\d+)\u0000/g,(_,i)=>{i=Number(i);const b=codes[i];const cls=b.lang?' class="language-'+b.lang+'"':"";return "<pre><code"+cls+">"+escapeHtml(b.code)+"</code></pre>";});
  return md;
}
function params(){const p=new URLSearchParams(location.search);return{post:p.get("post"),tag:p.get("tag"),year:p.get("year"),month:p.get("month"),page:parseInt(p.get("page")||"1",10)};}
async function loadPosts(){try{const r=await fetch("posts.json",{cache:"no-store"});if(r.ok)return await r.json();}catch(e){}try{const d=document.querySelector("#posts-data");return d?JSON.parse(d.textContent):[];}catch(e){return [];}}
function buildSidebar(posts){
  const tags=[...new Set(posts.flatMap(p=>p.tags||[]))].sort((a,b)=>a.localeCompare(b));
  const archive={}; posts.forEach(p=>{const d=new Date(p.date),y=String(d.getFullYear()),m=String(d.getMonth()+1).padStart(2,"0"); (archive[y]||(archive[y]=new Set())).add(m);});
  const years=Object.keys(archive).sort((a,b)=>b.localeCompare(a));
  const monthNames={"01":"Jan","02":"Feb","03":"Mar","04":"Apr","05":"May","06":"Jun","07":"Jul","08":"Aug","09":"Sep","10":"Oct","11":"Nov","12":"Dec"};
  const tagHTML="<h3>Tags</h3>"+(tags.length?"<ul>"+tags.map(t=>'<li><a href="?tag='+encodeURIComponent(t)+'">'+t+"</a></li>").join("")+"</ul>":"<div class='muted'>No tags</div>");
  const archHTML="<h3>Archives</h3>"+(years.length?"<ul>"+years.map(y=>{const months=[...archive[y]].sort((a,b)=>b.localeCompare(a));const mlinks=months.map(m=>'<a href="?year='+y+'&month='+m+'">'+monthNames[m]+" "+y+"</a>").join(" · ");return "<li><a href='?year="+y+"'>"+y+"</a>"+(months.length?"<div>"+mlinks+"</div>":"")+"</li>";}).join("")+"</ul>":"<div class='muted'>No archives</div>");
  sidebar.innerHTML=tagHTML+archHTML;
  sidebar.querySelectorAll('a[href^="?"]').forEach(a=>a.addEventListener("click",e=>{e.preventDefault();history.pushState({}, "", a.href);route();}));
  // Home link fix: reset to index without params
  const homeLink=document.querySelector(".home-link");
  if(homeLink){homeLink.addEventListener("click",function(e){e.preventDefault();history.pushState({}, "", "./");route();});}
}
function filterPosts(posts,f){let list=posts.slice();if(f.tag)list=list.filter(p=>Array.isArray(p.tags)&&p.tags.includes(f.tag));if(f.year)list=list.filter(p=>new Date(p.date).getFullYear()===Number(f.year));if(f.month)list=list.filter(p=>(new Date(p.date).getMonth()+1)===Number(f.month));return list;}
function paginate(list,page){const pages=Math.max(1,Math.ceil(list.length/6));const current=Math.min(Math.max(1,page),pages);const start=(current-1)*6;return{slice:list.slice(start,start+6),pages,current};}
async function renderList(posts,f){
  const list=filterPosts(posts,f).sort((a,b)=>a.date<b.date?1:-1);
  const {slice,pages,current}=paginate(list,f.page||1);
  const enriched=await Promise.all(slice.map(async p=>{try{const r=await fetch("posts/"+p.slug+".md");const md=await r.text();const m=md.match(IMG_MD_RE);let img=m?m[1]:null;if(img&&!/^https?:\/\//i.test(img)&&!img.startsWith("/")&&!img.startsWith("posts/"))img="posts/"+img;return Object.assign({},p,{image:img});}catch(e){return Object.assign({},p,{image:null});}}));
  const items=enriched.map(p=>{const date=new Date(p.date).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});const tags=(p.tags||[]).map(t=>'<span class="tag">#<a href="?tag='+encodeURIComponent(t)+'">'+t+"</a></span>").join(" ");const img=p.image?'<div><img src="'+p.image+'" alt="" style="max-width:100%;margin:0.5rem 0;"></div>':"";const desc=p.description?'<div class="post-desc">'+escapeHtml(p.description)+'</div>':"";return '<li><h2 class="post-title"><a href="?post='+encodeURIComponent(p.slug)+'">'+escapeHtml(p.title)+'</a></h2><div class="post-meta">'+date+(tags?(' · <span class="tags">'+tags+"</span>"):"")+'</div>'+img+desc+'</li>';}).join("");
  const links=[];function mk(n,l){const q=new URLSearchParams(location.search);q.delete("post");q.set("page",String(n));return '<a href="?'+q.toString()+'">'+l+"</a>";}
  if(pages>1){links.push(current>1?mk(current-1,"« Prev"):"<span>« Prev</span>");for(let n=1;n<=pages;n++)links.push(n===current?'<span class="current">'+n+"</span>":mk(n,String(n)));links.push(current<pages?mk(current+1,"Next »"):"<span>Next »</span>");}
  app.innerHTML='<section>'+(list.length?'<ul class="post-list">'+items+'</ul>':'<p>No posts found.</p>')+'<div class="pagination">'+links.join("")+'</div></section>';
  app.querySelectorAll('a[href^="?"]').forEach(a=>a.addEventListener("click",e=>{e.preventDefault();history.pushState({}, "", a.href);route();}));
}
async function renderPost(posts,slug){
  const p=posts.find(x=>x.slug===slug); if(!p){app.innerHTML="<p>Not found</p>";return;}
  app.innerHTML='<p><a class="back-link" href="./">← Back</a></p><article><h1>'+escapeHtml(p.title)+'</h1><div class="post-meta">'+new Date(p.date).toLocaleDateString()+'</div><div id="post-body">Loading…</div></article>';
  try{const r=await fetch("posts/"+p.slug+".md");const md=await r.text();document.querySelector("#post-body").innerHTML=mdToHtml(md);document.querySelector(".back-link").addEventListener("click",e=>{e.preventDefault();history.pushState({}, "", "./");route();});}catch(e){document.querySelector("#post-body").textContent="Couldn't load this post.";}
}
async function route(){const posts=await loadPosts();buildSidebar(posts);const p=params();if(p.post)await renderPost(posts,p.post);else await renderList(posts,p);}
window.addEventListener("popstate", route); route();
})();