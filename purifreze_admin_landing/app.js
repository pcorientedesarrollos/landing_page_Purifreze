/* Purifreze · Editor de blog — app shell, listado, vista en vivo, tweaks */
(function(){
'use strict';

/* ---------------- icons ---------------- */
const P = {
  menu:'M3 6h18M3 12h18M3 18h18',
  grid:'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  blog:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  user:'M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a6 6 0 0 1 12 0v1',
  chevR:'M9 18l6-6-6-6',
  chevD:'M6 9l6 6 6-6',
  search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4-4',
  plus:'M12 5v14M5 12h14',
  rows:'M3 6h18M3 12h18M3 18h18',
  cards:'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  image:'M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
  settings:'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 13a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 14H4.5a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 6.4 8.6l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 12 5.6V5.5a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.17l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 13z',
  eye:'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff:'M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68M6.6 6.6A13.3 13.3 0 0 0 2 11s3.5 7 10 7a9 9 0 0 0 4-.94M1 1l22 22M9.9 9.9a3 3 0 0 0 4.2 4.2',
  check:'M20 6L9 17l-5-5',
  dots:'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  back:'M19 12H5M12 19l-7-7 7-7',
  snow:'M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1M12 5l3 2M12 5l-3 2M12 19l3-2M12 19l-3-2M5 12l2 3M5 12l2-3M19 12l-2 3M19 12l-2-3',
  gauge:'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM13.4 10.6L19 5M3 12a9 9 0 0 1 18 0',
  flask:'M9 3h6M10 3v6L5 19a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-10V3M7 14h10',
  droplet:'M12 2.7l5.6 6.4a7.4 7.4 0 1 1-11.2 0z',
  trash:'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
  copy:'M9 9h11v11H9zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  ext:'M15 3h6v6M10 14L21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
  x:'M18 6L6 18M6 6l12 12',
  link:'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
  quote:'M7 7H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2v3H4M17 7h-3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2v3h-2',
  type:'M4 7V5h16v2M9 19h6M12 5v14',
  heading:'M6 4v16M18 4v16M6 12h12',
  list:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  callout:'M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-3.3A8.4 8.4 0 1 1 21 11.5z',
  camera:'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  pen:'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  cloud:'M12 16V4M8 8l4-4 4 4M20 16.6A5 5 0 0 0 18 7h-1.3A8 8 0 1 0 4 15',
  cal:'M3 5h18v16H3zM3 9h18M8 3v4M16 3v4',
  tag:'M20.6 13.4L13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1-.6-1.4V4a1 1 0 0 1 1-1h7.6a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.6zM7 7h.01',
  layers:'M12 2l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5',
  up:'M12 19V5M5 12l7-7 7 7',
  down:'M12 5v14M19 12l-7 7-7-7',
  clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  star:'M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z',
  wrench:'M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8 6.2 21l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.7 2.7-2.5-2.5z',
  whats:'M3 21l1.6-4.5A8 8 0 1 1 8 19.8zM9 9c0 4 3 6 6 6M9 9c0-1 1-1.5 1.5-1l.8 1.4M15 15c1 0 1.5-1 1-1.5l-1.4-.8',
  bolt:'M13 2L4 14h7l-1 8 9-12h-7z',
};
function icon(n, w){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(w||1.8)+'" stroke-linecap="round" stroke-linejoin="round"><path d="'+P[n]+'"/></svg>'; }
window.PF_ICON = icon;
const COVER_ICON = { snow:'snow', gauge:'gauge', flask:'flask', droplet:'droplet' };

/* ---------------- helpers ---------------- */
function esc(s){ return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
window.PF_ESC = esc;
// resolve an asset path through the standalone bundle's resource map when present
function res(id, path){ return (window.__resources && window.__resources[id]) || path; }
function coverInner(cover, big){
  if(!cover) return '';
  return '<div style="color:rgba(255,255,255,.92)">'+icon(COVER_ICON[cover.icon]||'droplet', big?1.4:1.6)+'</div>';
}
window.PF_COVER = coverInner;
const STATUS = { pub:['pub','Publicado'], draft:['draft','Borrador'], sched:['sched','Programado'] };

let toastT;
function toast(msg){
  let el=document.getElementById('toast');
  if(!el){ el=document.createElement('div'); el.id='toast'; el.className='toast'; document.body.appendChild(el); }
  el.innerHTML=icon('check',2.4)+'<span>'+esc(msg)+'</span>';
  requestAnimationFrame(()=>el.classList.add('show'));
  clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove('show'),2400);
}
window.PF_TOAST = toast;

/* ---------------- state ---------------- */
const state = {
  view:'list',
  filter:'all',
  search:'',
  layout:'table',
  currentId:null,
  editorMode: localStorage.getItem('pf_editor_mode') || 'documento',
};
window.PF_STATE = state;
function articleById(id){ return window.PF_ARTICLES.find(a=>a.id===id); }
window.PF_BYID = articleById;

const app = document.getElementById('app');

function go(view, id){
  state.view=view; if(id!==undefined) state.currentId=id;
  render();
  const sc=document.querySelector('.list-scroll,.scroller,.live'); if(sc) sc.scrollTop=0;
}
window.PF_GO = go;

/* ---------------- render dispatch ---------------- */
function render(){
  if(state.view==='editor'){ window.PF_renderEditor(app, articleById(state.currentId)); return; }
  if(state.view==='live'){ renderLive(); return; }
  renderList();
}

/* ---------------- listado ---------------- */
function counts(){
  const c={all:0,pub:0,draft:0,sched:0};
  window.PF_ARTICLES.forEach(a=>{c.all++;c[a.status]++;});
  return c;
}
function visibleArticles(){
  let arr=window.PF_ARTICLES.slice();
  if(state.filter!=='all') arr=arr.filter(a=>a.status===state.filter);
  if(state.search){ const q=state.search.toLowerCase();
    arr=arr.filter(a=>(a.title+' '+a.excerpt+' '+a.category).toLowerCase().includes(q)); }
  return arr;
}

function renderList(){
  const c=counts();
  app.innerHTML = `
  <div class="admin">
    <aside class="rail">
      <div class="logo"><img src="${res('logoMark','assets/logo-mark.png')}" alt="P" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'P',style:'color:#fff;font-weight:800'}))"></div>
      <div class="ico" title="Inicio">${icon('grid')}</div>
      <div class="ico sel" title="Blog">${icon('blog')}</div>
      <div class="ico" title="Usuarios">${icon('user')}</div>
      <div class="ico" title="Ajustes">${icon('settings')}</div>
      <div class="spacer"></div>
      <div class="ico av">JM</div>
    </aside>
    <div class="main">
      <div class="list-head">
        <div>
          <h1>Blog</h1>
          <div class="sub"><b>${c.all}</b> artículos · ${c.pub} publicados · ${c.draft} borradores · ${c.sched} programado</div>
        </div>
        <div class="head-actions">
          <div class="search">${icon('search')}<input id="q" placeholder="Buscar artículo…" value="${esc(state.search)}"></div>
          <button class="btn primary" id="new">${icon('plus',2)}Nuevo artículo</button>
        </div>
      </div>
      <div class="toolbar">
        ${chip('all','Todos',c.all)}${chip('pub','Publicados',c.pub)}${chip('draft','Borradores',c.draft)}${chip('sched','Programados',c.sched)}
        <div style="flex:1"></div>
        <div class="seg">
          <button data-lay="table" class="${state.layout==='table'?'on':''}" title="Tabla">${icon('rows')}</button>
          <button data-lay="cards" class="${state.layout==='cards'?'on':''}" title="Tarjetas">${icon('cards')}</button>
        </div>
      </div>
      <div class="list-scroll" id="listScroll"></div>
    </div>
  </div>`;

  const arr=visibleArticles();
  const scroll=app.querySelector('#listScroll');
  if(!arr.length){ scroll.innerHTML='<div class="empty">Sin artículos que coincidan</div>'; }
  else if(state.layout==='table') scroll.innerHTML=tableView(arr);
  else scroll.innerHTML=cardsView(arr);

  // wire
  app.querySelector('#new').onclick=()=>openNew();
  const q=app.querySelector('#q');
  q.oninput=e=>{ state.search=e.target.value; const a=visibleArticles();
    scroll.innerHTML = !a.length?'<div class="empty">Sin artículos que coincidan</div>':(state.layout==='table'?tableView(a):cardsView(a)); wireRows(scroll); };
  app.querySelectorAll('.chip[data-f]').forEach(ch=>ch.onclick=()=>{state.filter=ch.dataset.f;renderList();});
  app.querySelectorAll('.seg [data-lay]').forEach(b=>b.onclick=()=>{state.layout=b.dataset.lay;renderList();});
  wireRows(scroll);
  // focus search if had text
  if(state.search){ q.focus(); q.setSelectionRange(q.value.length,q.value.length); }
}
function chip(f,label,n){ return `<span class="chip ${state.filter===f?'on':''}" data-f="${f}">${label}<span class="ct">${n}</span></span>`; }

function thumbHTML(a){
  if(a.cover) return `<div class="thumb cv" style="background-color:${a.cover.color}">${coverInner(a.cover)}</div>`;
  return `<div class="thumb">${icon('image')}</div>`;
}
function tableView(arr){
  let rows=`<div class="tr head"><span></span><span>Título</span><span class="hide-sm">Estado</span><span class="hide-sm">Fecha</span><span class="hide-sm">Vistas</span><span></span></div>`;
  arr.forEach(a=>{
    const st=STATUS[a.status];
    rows+=`<div class="tr" data-id="${a.id}">
      ${thumbHTML(a)}
      <div><div class="ttl">${esc(a.title)}</div><div class="ex">${esc(a.excerpt)}</div><span class="cat">${esc(a.category)}</span></div>
      <span class="pill ${st[0]} hide-sm">${st[1]}</span>
      <span class="meta-sm hide-sm">${a.date}</span>
      <span class="meta-sm hide-sm">${a.views?a.views.toLocaleString('es-MX'):'—'}</span>
      <div class="rowmenu" data-menu="${a.id}">${icon('dots')}</div>
    </div>`;
  });
  return `<div class="tbl">${rows}</div>`;
}
function cardsView(arr){
  let cards='';
  arr.forEach(a=>{
    const st=STATUS[a.status];
    const cv = a.cover
      ? `<div class="cv" style="background-color:${a.cover.color}">${coverInner(a.cover,true)}<span class="pill ${st[0]}" style="background:rgba(255,255,255,.92)">${st[1]}</span></div>`
      : `<div class="cv nocover">${icon('image')}<span class="pill ${st[0]}">${st[1]}</span></div>`;
    cards+=`<div class="acard" data-id="${a.id}">
      ${cv}
      <div class="cb">
        <div class="cat">${esc(a.category)}</div>
        <h3>${esc(a.title)}</h3>
        <div class="ex">${esc(a.excerpt)}</div>
        <div class="crow"><span class="meta-sm">${a.dateNice}</span><div class="rowmenu" data-menu="${a.id}">${icon('dots')}</div></div>
      </div>
    </div>`;
  });
  return `<div class="cards">${cards}</div>`;
}
function wireRows(scroll){
  scroll.querySelectorAll('[data-id]').forEach(el=>{
    el.onclick=e=>{ if(e.target.closest('[data-menu]')) return; go('editor',el.dataset.id); };
  });
  scroll.querySelectorAll('[data-menu]').forEach(m=>{
    m.onclick=e=>{ e.stopPropagation(); rowMenu(m, m.dataset.menu); };
  });
}
function rowMenu(anchor, id){
  closeFloaters();
  const a=articleById(id);
  const m=document.createElement('div'); m.className='blkmenu'; m.dataset.floater='1';
  const liveItem = a.status==='pub' ? `<div class="bmi" data-a="live">${icon('ext')}Ver en vivo</div>` : '';
  m.innerHTML=`
    <div class="bmi" data-a="edit">${icon('pen')}Editar</div>
    ${liveItem}
    <div class="bmi" data-a="dup">${icon('copy')}Duplicar</div>
    <div class="bmi danger" data-a="del">${icon('trash')}Eliminar</div>`;
  document.body.appendChild(m);
  const r=anchor.getBoundingClientRect();
  m.style.left=Math.min(r.left, window.innerWidth-200)+'px';
  m.style.top=(r.bottom+6)+'px';
  m.querySelectorAll('.bmi').forEach(b=>b.onclick=()=>{
    const act=b.dataset.a; closeFloaters();
    if(act==='edit') go('editor',id);
    else if(act==='live') go('live',id);
    else if(act==='dup') toast('Artículo duplicado');
    else if(act==='del') toast('Artículo eliminado');
  });
}
function closeFloaters(){ document.querySelectorAll('[data-floater]').forEach(n=>n.remove()); }
document.addEventListener('mousedown',e=>{ if(!e.target.closest('[data-floater]') && !e.target.closest('[data-menu]')) closeFloaters(); });
window.PF_closeFloaters = closeFloaters;

function openNew(){
  const a={ id:'nuevo-'+Date.now(), title:'', excerpt:'', slug:'/blog/nuevo-articulo',
    category:'Agua', status:'draft', date:'—', dateNice:'hoy', views:0, readMin:0, author:'jor',
    cover:null, metaTitle:'', metaDesc:'', keyword:'', blocks:[{type:'p',html:''}], _new:true };
  window.PF_ARTICLES.unshift(a);
  go('editor', a.id);
}

/* ---------------- vista en vivo (public article) ---------------- */
function renderLive(){
  const a=articleById(state.currentId)||window.PF_ARTICLES[0];
  const au=window.PF_AUTHORS[a.author]||{name:'Equipo Purifreze',initials:'PF'};
  const blocks=(a.blocks&&a.blocks.length)?a.blocks:window.PF_DEFAULT_BLOCKS(a);
  const cover = a.cover
    ? `<div class="art-cover" style="background-color:${a.cover.color}">${coverInner(a.cover,true)}</div>`
    : '';
  app.innerHTML=`
  <div class="live" id="live">
    <nav class="live-nav">
      <img src="${res('logoWord','assets/logo-purifreze.png')}" alt="Purifreze">
      <div class="nl"><a>Inicio</a><a>Calculadora</a><a>Usos</a><a>Testimonios</a><a>Blog</a></div>
      <div class="spacer"></div>
      <button class="cta">${icon('whats')}Cotiza ahora</button>
    </nav>
    <div class="statbar">
      <span class="s">${icon('user')}<b>474+</b> Clientes</span>
      <span class="s">${icon('star')}<b>4.9</b> /5.0 Rating</span>
      <span class="s">${icon('wrench')}<b>1,899+</b> Mantenimientos</span>
    </div>
    <article class="article">
      <div class="crumbs">Blog<span class="dot">·</span>${esc(a.category)}</div>
      <h1 class="art-title">${esc(a.title||'Sin título')}</h1>
      ${a.excerpt?`<p class="art-ex">${esc(a.excerpt)}</p>`:''}
      <div class="art-meta">
        <div class="av">${au.initials}</div>
        <div><div class="who">${esc(au.name)}</div><div class="when">${a.dateNice} · ${a.readMin||3} min de lectura</div></div>
      </div>
      ${cover}
      <div class="art-body">${blocks.map(blockToHTML).join('')}</div>
    </article>
    <button class="editbtn" id="backEd">${icon('pen')}Volver al editor</button>
  </div>`;
  app.querySelector('#backEd').onclick=()=>go('editor',a.id);
}
function blockToHTML(b){
  switch(b.type){
    case 'h2': return `<h2>${b.html||''}</h2>`;
    case 'h3': return `<h3>${b.html||''}</h3>`;
    case 'quote': return `<blockquote>${b.html||''}</blockquote>`;
    case 'callout': return `<div style="background:var(--brand-primary-soft);border:1px solid var(--brand-primary-light);border-radius:12px;padding:18px 20px;font-size:17px">${b.html||''}</div>`;
    case 'list': return `<ul>${(b.items||[]).map(i=>`<li>${i}</li>`).join('')}</ul>`;
    case 'numlist': return `<ol>${(b.items||[]).map(i=>`<li>${i}</li>`).join('')}</ol>`;
    case 'image': return b.src?`<img src="${b.src}" alt="">`:`<div style="height:300px;border-radius:12px;background:var(--neutral-100);display:grid;place-items:center;color:var(--neutral-400)">${icon('image')}</div>`;
    default: return `<p>${b.html||''}</p>`;
  }
}
window.PF_blockToHTML = blockToHTML;

/* ---------------- tweaks (heading font) ---------------- */
const FONTS=[
  {id:'manrope', name:'Manrope', note:'Sistema · geométrica', sample:'Ag'},
  {id:'newsreader', name:'Newsreader', note:'Editorial · serif', sample:'Ag'},
  {id:'grotesk', name:'Space Grotesk', note:'Técnica · grotesca', sample:'Ag'},
  {id:'archivo', name:'Archivo', note:'Sólida · titular', sample:'Ag'},
];
const FONT_FAMILY={manrope:"'Manrope',sans-serif",newsreader:"'Newsreader',serif",grotesk:"'Space Grotesk',sans-serif",archivo:"'Archivo',sans-serif"};
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{ "headingFont":"manrope" }/*EDITMODE-END*/;
let headingFont = localStorage.getItem('pf_heading') || TWEAK_DEFAULTS.headingFont;

function applyHeading(){ document.documentElement.dataset.heading = headingFont==='manrope'?'':headingFont; }
function buildTweaks(){
  let panel=document.getElementById('tweaks');
  if(!panel){ panel=document.createElement('div'); panel.id='tweaks'; document.body.appendChild(panel); }
  panel.innerHTML=`
    <div class="twk-hd"><b>Tweaks</b><button class="twk-x" id="twkX">✕</button></div>
    <div class="twk-body">
      <div class="twk-lbl">Tipografía del titular</div>
      <div class="fontopt">
        ${FONTS.map(f=>`<button class="fopt ${f.id===headingFont?'on':''}" data-f="${f.id}">
          <span><span class="nm">${f.name}</span><br><span style="font-size:11px;color:#64748b">${f.note}</span></span>
          <span class="pv" style="font-family:${FONT_FAMILY[f.id]}">${f.sample}</span>
        </button>`).join('')}
      </div>
      <div class="twk-note">Cambia el titular del editor, el listado y la página del artículo.</div>
    </div>`;
  panel.querySelector('#twkX').onclick=()=>{ panel.classList.remove('show'); window.parent.postMessage({type:'__edit_mode_dismissed'},'*'); };
  panel.querySelectorAll('.fopt').forEach(btn=>btn.onclick=()=>{
    headingFont=btn.dataset.f; localStorage.setItem('pf_heading',headingFont); applyHeading();
    window.parent.postMessage({type:'__edit_mode_set_keys',edits:{headingFont}},'*');
    buildTweaks(); // re-render so the active indicator tracks the choice
  });
}
window.addEventListener('message',e=>{
  const t=e&&e.data&&e.data.type;
  if(t==='__activate_edit_mode'){ buildTweaks(); document.getElementById('tweaks').classList.add('show'); }
  else if(t==='__deactivate_edit_mode'){ const p=document.getElementById('tweaks'); if(p) p.classList.remove('show'); }
});
window.parent.postMessage({type:'__edit_mode_available'},'*');

/* ---------------- init ---------------- */
applyHeading();
render();

})();
