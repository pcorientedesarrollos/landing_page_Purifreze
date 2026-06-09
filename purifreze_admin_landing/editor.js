/* Purifreze · Editor de blog — Notion-style block editor */
(function(){
'use strict';
const icon=window.PF_ICON, esc=window.PF_ESC, toast=window.PF_TOAST, coverInner=window.PF_COVER;

let A=null, mountEl=null, saveTimer=null;

/* ---- slash menu definitions ---- */
const SLASH=[
  {t:'p',     label:'Texto',          ic:'type',    hint:'Párrafo'},
  {t:'h2',    label:'Título',         ic:'heading', hint:'H2'},
  {t:'h3',    label:'Subtítulo',      ic:'heading', hint:'H3'},
  {t:'list',  label:'Lista',          ic:'list',    hint:'Viñetas'},
  {t:'numlist',label:'Lista numerada',ic:'list',    hint:'1. 2. 3.'},
  {t:'quote', label:'Cita',           ic:'quote',   hint:'Destacar'},
  {t:'callout',label:'Resaltado',     ic:'callout', hint:'Aviso'},
  {t:'image', label:'Imagen',         ic:'image',   hint:'Portada/foto'},
];

/* ============ render ============ */
window.PF_renderEditor=function(mount, art){
  A=art; mountEl=mount;
  const mode=window.PF_STATE.editorMode;
  const isNew=!!A._new;
  const st={pub:['pub','Publicado'],draft:['draft','Borrador'],sched:['sched','Programado']}[A.status];

  mount.innerHTML=`
  <div class="editor" data-mode="${mode}">
    <div class="ed-top">
      <button class="back" id="back" title="Volver">${icon('back')}</button>
      <span class="crumb">Blog <b>›</b> ${isNew?'Nuevo artículo':'Editar'}</span>
      ${!isNew?`<span class="pill ${st[0]}" style="margin-left:2px">${st[1]}</span>`:''}
      <span class="save" id="save"><span class="ic">${icon('check',2.4)}</span><span class="tx">Guardado</span></span>
      <span class="spacer"></span>
      <div class="modeseg" id="modeseg">
        <button data-m="documento" class="${mode==='documento'?'on':''}">Documento</button>
        <button data-m="campos" class="${mode==='campos'?'on':''}">Campos</button>
        <button data-m="enfoque" class="${mode==='enfoque'?'on':''}">Enfoque</button>
      </div>
      <button class="btn ghost sm" id="preview">${icon('eye')}Vista previa</button>
      <button class="btn sm" id="settings">${icon('settings')}Ajustes</button>
      <button class="btn primary sm" id="publish">${A.status==='pub'?'Actualizar':'Publicar'}</button>
      ${!isNew?`<button class="btn icon sm" id="more">${icon('dots')}</button>`:''}
    </div>
    <div class="formatbar" id="formatbar">
      <button class="fb" data-cmd="bold" style="font-weight:800">B</button>
      <button class="fb" data-cmd="italic"><i>i</i></button>
      <button class="fb" data-cmd="underline" style="text-decoration:underline">U</button>
      <span class="fb-sep"></span>
      <button class="fb" data-type="h2">H2</button>
      <button class="fb" data-type="h3">H3</button>
      <button class="fb" data-type="quote">${icon('quote')}</button>
      <button class="fb" data-type="list">${icon('list')}</button>
      <button class="fb" data-cmd="link">${icon('link')}</button>
      <button class="fb" data-type="image">${icon('image')}Imagen</button>
    </div>
    <div class="ed-body">
      <div class="scroller">
        <div class="doc" id="doc">
          <div id="coverSlot"></div>
          <h1 class="doc-title" id="title" contenteditable="true" data-empty="Escribe el título…">${esc(A.title)}</h1>
          <div class="doc-ex" id="excerpt" contenteditable="true" data-empty="Agrega un extracto o subtítulo…">${esc(A.excerpt)}</div>
          <div class="blocks" id="blocks"></div>
        </div>
      </div>
      <aside class="inspector" id="inspector"></aside>
    </div>
    <div class="statusbar" id="statusbar">
      <span class="m"><span class="i">${icon('type')}</span><span class="n" id="wc">0</span> palabras</span>
      <span class="m">${icon('clock')}<span class="n" id="rt">1</span> min de lectura</span>
      <span class="m ok" id="sbsave">${icon('check',2.4)} Guardado</span>
      <span class="spacer"></span>
      <button class="btn sm" id="seoBtn">${icon('search')}SEO</button>
      <button class="btn primary sm" id="publish2">Publicar →</button>
    </div>
  </div>`;

  renderCover();
  renderBlocks();
  renderInspector(mode);
  cleanupEmpty(mount.querySelector('#title'));
  cleanupEmpty(mount.querySelector('#excerpt'));
  wire();
  updateStats();
  // focus
  const title=mount.querySelector('#title');
  if(isNew){ title.focus(); }
};

/* ============ cover ============ */
function renderCover(){
  const slot=mountEl.querySelector('#coverSlot');
  if(A.cover){
    slot.innerHTML=`<div class="cover" style="background-color:${A.cover.color}">
      <div style="position:absolute;inset:0;display:grid;place-items:center;color:rgba(255,255,255,.9)">${coverInner(A.cover,true)}</div>
      <button class="cover-x" id="coverX" title="Quitar portada">${icon('x')}</button>
    </div>`;
    slot.querySelector('#coverX').onclick=()=>{ A.cover=null; renderCover(); scheduleSave(); };
  } else {
    slot.innerHTML=`<div class="cover empty" id="coverAdd">${icon('plus')}Agregar portada</div>`;
    slot.querySelector('#coverAdd').onclick=()=>{
      const palette=['#0b3a5e','#3a2e6e','#155e4b','#1e293b'];
      A.cover={color:palette[Math.floor(Math.random()*palette.length)],icon:'droplet'};
      renderCover(); scheduleSave(); toast('Portada agregada (marcador)');
    };
  }
}

/* ============ blocks ============ */
function renderBlocks(){
  const wrap=mountEl.querySelector('#blocks');
  const blocks=(A.blocks&&A.blocks.length)?A.blocks:[{type:'p',html:''}];
  wrap.innerHTML='';
  blocks.forEach(b=>wrap.appendChild(makeBlock(b)));
}
function makeBlock(b){
  const el=document.createElement('div');
  el.className='blk'; el.dataset.type=b.type||'p';
  el.innerHTML=`<div class="gutter">
      <button class="gh add" title="Agregar bloque">${icon('plus',2)}</button>
      <button class="gh drag" title="Opciones" draggable="true">${icon('dots')}</button>
    </div>`;
  let content;
  if(b.type==='image'){
    content=document.createElement('div');
    content.className='blk-content';
    renderImageBlock(content,b);
  } else if(b.type==='list'||b.type==='numlist'){
    content=document.createElement('div');
    content.className='blk-content'; content.contentEditable='true';
    const tag=b.type==='numlist'?'ol':'ul';
    const items=(b.items&&b.items.length)?b.items:[''];
    content.innerHTML=`<${tag}>`+items.map(i=>`<li>${i||''}</li>`).join('')+`</${tag}>`;
  } else {
    content=document.createElement('div');
    content.className='blk-content'; content.contentEditable='true';
    content.innerHTML=b.html||'';
  }
  el.appendChild(content);
  return el;
}
function renderImageBlock(content,b){
  if(b.src){
    content.innerHTML=`<div class="blk-img"><img src="${b.src}" alt=""></div>`;
  } else {
    content.innerHTML=`<div class="blk-img placeholder">${icon('camera')}<div>Imagen — marcador</div><div style="font-size:12px;color:var(--fg-3);font-weight:500">Aquí iría una foto del equipo o del proceso</div></div>`;
    content.querySelector('.blk-img').onclick=()=>toast('Subir imagen (demo)');
  }
}

/* ============ inspector ============ */
function renderInspector(mode){
  const insp=mountEl.querySelector('#inspector');
  if(mode==='enfoque'){ insp.innerHTML=''; return; }
  if(mode==='campos'){ insp.innerHTML=accordions(); wireInspector(insp); return; }
  // documento: tabs in a drawer
  insp.innerHTML=`
    <div class="insp-head"><b>Ajustes</b><button class="btn icon sm" id="drawerX">${icon('x')}</button></div>
    <div class="insp-tabs"><span class="insp-tab" data-it="general">General</span><span class="insp-tab on" data-it="seo">SEO</span></div>
    <div class="insp-body" id="inspBody">${seoFields()}</div>`;
  insp.querySelector('#drawerX').onclick=()=>mountEl.querySelector('.editor').classList.remove('drawer-open');
  insp.querySelectorAll('.insp-tab').forEach(t=>t.onclick=()=>{
    insp.querySelectorAll('.insp-tab').forEach(x=>x.classList.toggle('on',x===t));
    insp.querySelector('#inspBody').innerHTML = t.dataset.it==='general'?generalFields():seoFields();
    wireInspector(insp);
  });
  wireInspector(insp);
}
function generalFields(){
  const seg=(v)=>`<div class="segfield" data-seg="status">
      <span data-v="draft" class="${A.status==='draft'?'on':''}">Borrador</span>
      <span data-v="pub" class="${A.status==='pub'?'on':''}">Publicar</span>
      <span data-v="sched" class="${A.status==='sched'?'on':''}">Programar</span></div>`;
  return `
    <div class="field"><div class="flabel">Estado</div>${seg()}</div>
    <div class="field"><div class="flabel">Categoría</div>
      <input class="input" data-f="category" value="${esc(A.category)}"></div>
    <div class="field"><div class="flabel">Enlace (slug)</div>
      <input class="input" data-f="slug" value="${esc(A.slug)}"></div>
    <div class="field"><div class="flabel">Fecha de publicación</div>
      <input class="input" data-f="date" value="${esc(A.date)}"></div>`;
}
function seoFields(){
  const mt=A.metaTitle||A.title||'', md=A.metaDesc||'';
  return `
    <div class="field"><div class="flabel">Meta título ${count(mt.length,60)}</div>
      <input class="input" data-f="metaTitle" placeholder="Título para Google…" value="${esc(mt)}"></div>
    <div class="field"><div class="flabel">Meta descripción ${count(md.length,160)}</div>
      <textarea class="input" data-f="metaDesc" placeholder="Resumen para buscadores…">${esc(md)}</textarea></div>
    <div class="field"><div class="flabel">Palabra clave</div>
      <input class="input" data-f="keyword" placeholder="p. ej. agua viva" value="${esc(A.keyword||'')}"></div>
    <div class="field"><div class="flabel">Vista en Google</div>${snippet()}</div>`;
}
function snippet(){
  const url=('purifreze.app'+(A.slug||'/blog')).replace(/^\//,'').replace(/\//g,' › ');
  const mt=A.metaTitle||A.title||'Sin título';
  const md=A.metaDesc||A.excerpt||'Agrega una meta descripción para mejorar tu posición en buscadores.';
  return `<div class="snippet" id="snip">
    <div class="snip-url">${esc(url)}</div>
    <div class="snip-title">${esc(mt)}</div>
    <div class="snip-desc">${esc(md)}</div></div>`;
}
function count(n,max){ const cls=n===0?'':(n<=max?'ok':'over'); const tick=(n>0&&n<=max)?' ✓':''; return `<span class="cnt ${cls}">${n}/${max}${tick}</span>`; }
function accordions(){
  return `
    <div class="acc open"><div class="acc-head">${icon('image')}Portada<span class="chev">${icon('chevD')}</span></div>
      <div class="acc-body"><div id="accCover"></div></div></div>
    <div class="acc open"><div class="acc-head">${icon('type')}Extracto y categoría<span class="chev">${icon('chevD')}</span></div>
      <div class="acc-body">${generalFields()}</div></div>
    <div class="acc open"><div class="acc-head" style="color:var(--brand-primary)">${icon('search')}SEO<span class="chev">${icon('chevD')}</span></div>
      <div class="acc-body">${seoFields()}</div></div>`;
}
function wireInspector(insp){
  // accordion toggles
  insp.querySelectorAll('.acc-head').forEach(h=>h.onclick=()=>h.parentElement.classList.toggle('open'));
  // status segfield
  insp.querySelectorAll('[data-seg="status"] span').forEach(s=>s.onclick=()=>{
    A.status=s.dataset.v; insp.querySelectorAll('[data-seg="status"] span').forEach(x=>x.classList.toggle('on',x===s)); scheduleSave();
  });
  // fields
  insp.querySelectorAll('[data-f]').forEach(inp=>{
    inp.oninput=()=>{ A[inp.dataset.f]=inp.value;
      const flabel=inp.previousElementSibling;
      if(inp.dataset.f==='metaTitle'||inp.dataset.f==='metaDesc'){
        const max=inp.dataset.f==='metaTitle'?60:160; flabel.querySelector('.cnt').outerHTML=count(inp.value.length,max).replace(/^<span/,'<span');
      }
      const snip=insp.querySelector('#snip'); if(snip) snip.outerHTML=snippet();
      scheduleSave();
    };
  });
  // cover accordion (campos)
  const ac=insp.querySelector('#accCover');
  if(ac){
    if(A.cover) ac.innerHTML=`<div class="cover" style="height:96px;margin:0;background-color:${A.cover.color}"><div style="position:absolute;inset:0;display:grid;place-items:center;color:rgba(255,255,255,.9)">${coverInner(A.cover)}</div><button class="cover-x" id="acX">${icon('x')}</button></div>`;
    else ac.innerHTML=`<div class="cover empty" id="acAdd" style="height:88px;margin:0">${icon('plus')}Subir imagen</div>`;
    const add=ac.querySelector('#acAdd'); if(add) add.onclick=()=>{A.cover={color:'#0b3a5e',icon:'droplet'};renderCover();renderInspector('campos');scheduleSave();};
    const x=ac.querySelector('#acX'); if(x) x.onclick=()=>{A.cover=null;renderCover();renderInspector('campos');scheduleSave();};
  }
}

/* ============ wiring ============ */
function wire(){
  const ed=mountEl.querySelector('.editor');
  mountEl.querySelector('#back').onclick=()=>{ syncBlocks(); window.PF_GO('list'); };
  mountEl.querySelector('#preview').onclick=()=>{ syncBlocks(); window.PF_GO('live',A.id); };
  const settings=mountEl.querySelector('#settings');
  settings.onclick=()=>{
    if(window.PF_STATE.editorMode==='documento'){ ed.classList.toggle('drawer-open'); }
    else if(window.PF_STATE.editorMode==='enfoque'){ openSeoSheet(); }
    else { mountEl.querySelector('.scroller').scrollTop=0; }
  };
  const pub=()=>{ syncBlocks(); if(window.PF_STATE.editorMode==='enfoque'){ openChecklist(); } else { doPublish(); } };
  mountEl.querySelector('#publish').onclick=pub;
  const p2=mountEl.querySelector('#publish2'); if(p2) p2.onclick=()=>{ syncBlocks(); openChecklist(); };
  const seoBtn=mountEl.querySelector('#seoBtn'); if(seoBtn) seoBtn.onclick=()=>openSeoSheet();
  const more=mountEl.querySelector('#more'); if(more) more.onclick=()=>moreMenu(more);

  // mode switch
  mountEl.querySelectorAll('#modeseg button').forEach(b=>b.onclick=()=>{
    syncBlocks();
    window.PF_STATE.editorMode=b.dataset.m; localStorage.setItem('pf_editor_mode',b.dataset.m);
    window.PF_renderEditor(mountEl,A);
  });

  // format bar (campos)
  mountEl.querySelectorAll('#formatbar .fb').forEach(b=>b.onmousedown=e=>{
    e.preventDefault();
    if(b.dataset.cmd==='link') return doLink();
    if(b.dataset.cmd) document.execCommand(b.dataset.cmd,false,null);
    if(b.dataset.type) convertActive(b.dataset.type);
  });

  // title / excerpt
  const title=mountEl.querySelector('#title'), ex=mountEl.querySelector('#excerpt');
  title.oninput=()=>{A.title=title.textContent;cleanupEmpty(title);scheduleSave();syncSnippetTitle();};
  ex.oninput=()=>{A.excerpt=ex.textContent;cleanupEmpty(ex);scheduleSave();};
  [title,ex].forEach(el=>el.addEventListener('keydown',e=>{
    if(e.key==='Enter'){ e.preventDefault(); if(el===title) ex.focus(); else focusFirstBlock(); }
  }));

  // block editing — delegated
  const blocks=mountEl.querySelector('#blocks');
  blocks.addEventListener('keydown',onBlockKey);
  blocks.addEventListener('input',()=>{updateEmptyHint();scheduleSave();updateStats();});
  blocks.addEventListener('click',onBlockClick);
  blocks.addEventListener('focusin',updateEmptyHint);
  // drag reorder
  initDrag(blocks);

  // selection toolbar
  const doc=mountEl.querySelector('#doc');
  doc.addEventListener('mouseup',()=>setTimeout(updateSelTool,1));
  doc.addEventListener('keyup',updateSelTool);
  document.addEventListener('scroll',hideSelTool,true);
}

function focusFirstBlock(){
  const c=mountEl.querySelector('#blocks .blk .blk-content[contenteditable]'); if(c){c.focus();placeCaretStart(c);} 
}

/* ---- block keyboard ---- */
function onBlockKey(e){
  const content=e.target.closest('.blk-content'); if(!content) return;
  const blk=content.closest('.blk'); const type=blk.dataset.type;

  // slash menu
  if(e.key==='/' && isEmpty(content) && type!=='list' && type!=='numlist'){
    setTimeout(()=>openSlash(blk),0); return;
  }
  if(slashEl){
    if(['ArrowDown','ArrowUp','Enter','Escape'].includes(e.key)){ slashKey(e); return; }
  }

  if(e.key==='Enter' && !e.shiftKey && type!=='list' && type!=='numlist'){
    e.preventDefault();
    const nb=makeBlock({type:'p',html:''});
    blk.after(nb);
    const c=nb.querySelector('.blk-content'); c.focus(); placeCaretStart(c);
    scheduleSave();
  }
  if(e.key==='Backspace' && isEmpty(content) && atStart(content)){
    const prev=blk.previousElementSibling;
    if(prev){
      e.preventDefault();
      const pc=prev.querySelector('.blk-content');
      blk.remove();
      if(pc){ pc.focus(); placeCaretEnd(pc); }
      scheduleSave(); updateStats();
    }
  }
}
function onBlockClick(e){
  const add=e.target.closest('.gh.add');
  if(add){ const blk=add.closest('.blk'); const nb=makeBlock({type:'p',html:''}); blk.after(nb); const c=nb.querySelector('.blk-content'); c.focus(); placeCaretStart(c); openSlash(nb); scheduleSave(); return; }
  const drag=e.target.closest('.gh.drag');
  if(drag){ blockMenu(drag, drag.closest('.blk')); return; }
}

/* ---- slash menu ---- */
let slashEl=null, slashBlk=null, slashIdx=0;
function openSlash(blk){
  closeSlash();
  slashBlk=blk; slashIdx=0;
  slashEl=document.createElement('div'); slashEl.className='slash'; slashEl.dataset.floater='1';
  slashEl.innerHTML=`<div class="sh">Insertar bloque</div>`+SLASH.map((s,i)=>
    `<div class="si ${i===0?'sel':''}" data-i="${i}"><span class="ib">${icon(s.ic)}</span>${s.label}<small>${s.hint}</small></div>`).join('');
  document.body.appendChild(slashEl);
  positionSlash(blk);
  slashEl.querySelectorAll('.si').forEach(si=>{
    si.onmousedown=e=>{e.preventDefault();chooseSlash(parseInt(si.dataset.i));};
  });
}
function positionSlash(blk){
  const r=blk.getBoundingClientRect();
  let top=r.bottom+6, left=r.left;
  if(top+330>window.innerHeight) top=Math.max(8,r.top-336);
  slashEl.style.top=top+'px'; slashEl.style.left=left+'px';
}
function slashKey(e){
  e.preventDefault();
  const items=slashEl.querySelectorAll('.si');
  if(e.key==='Escape'){ closeSlash(); return; }
  if(e.key==='Enter'){ chooseSlash(slashIdx); return; }
  if(e.key==='ArrowDown') slashIdx=(slashIdx+1)%items.length;
  if(e.key==='ArrowUp') slashIdx=(slashIdx-1+items.length)%items.length;
  items.forEach((it,i)=>it.classList.toggle('sel',i===slashIdx));
  items[slashIdx].scrollIntoView({block:'nearest'});
}
function chooseSlash(i){
  const s=SLASH[i]; const blk=slashBlk; closeSlash();
  if(!blk) return;
  // clear the "/" if present
  const content=blk.querySelector('.blk-content');
  if(content && content.textContent==='/') content.innerHTML='';
  if(s.t==='image'){
    const nb=makeBlock({type:'image'});
    if(isEmptyBlock(blk)) blk.replaceWith(nb); else blk.after(nb);
    const after=makeBlock({type:'p',html:''}); nb.after(after);
    after.querySelector('.blk-content').focus();
  } else {
    convertBlock(blk,s.t);
    const c=blk.querySelector('.blk-content'); if(c){ c.focus(); placeCaretEnd(c); }
  }
  scheduleSave(); updateStats();
}
function closeSlash(){ if(slashEl){slashEl.remove();slashEl=null;slashBlk=null;} }

function convertActive(type){
  const sel=window.getSelection(); if(!sel.rangeCount) return;
  let node=sel.anchorNode; const blk=node&&(node.nodeType===1?node:node.parentElement).closest('.blk');
  if(blk){ convertBlock(blk,type); const c=blk.querySelector('.blk-content'); c.focus(); placeCaretEnd(c); scheduleSave(); }
}
function convertBlock(blk,type){
  const old=blk.dataset.type;
  const content=blk.querySelector('.blk-content');
  const text=content?content.innerHTML:'';
  if(type==='list'||type==='numlist'){
    const tag=type==='numlist'?'ol':'ul';
    blk.dataset.type=type;
    content.innerHTML=`<${tag}><li>${stripTags(text)||''}</li></${tag}>`;
  } else if(old==='list'||old==='numlist'){
    blk.dataset.type=type;
    content.innerHTML=content.textContent;
  } else {
    blk.dataset.type=type;
  }
}
function stripTags(h){ const d=document.createElement('div'); d.innerHTML=h; return d.textContent; }

/* ---- block handle menu ---- */
function blockMenu(anchor,blk){
  window.PF_closeFloaters();
  blk.classList.add('menuopen');
  const m=document.createElement('div'); m.className='blkmenu'; m.dataset.floater='1';
  m.innerHTML=`
    <div class="bmi" data-a="up">${icon('up')}Subir</div>
    <div class="bmi" data-a="down">${icon('down')}Bajar</div>
    <div class="bmi" data-a="dup">${icon('copy')}Duplicar</div>
    <div class="bmi danger" data-a="del">${icon('trash')}Eliminar</div>`;
  document.body.appendChild(m);
  const r=anchor.getBoundingClientRect();
  m.style.left=r.left+'px'; m.style.top=(r.bottom+6)+'px';
  if(r.bottom+180>window.innerHeight) m.style.top=(r.top-186)+'px';
  m.querySelectorAll('.bmi').forEach(b=>b.onclick=()=>{
    const a=b.dataset.a; window.PF_closeFloaters(); blk.classList.remove('menuopen');
    if(a==='up'){ const p=blk.previousElementSibling; if(p) blk.parentElement.insertBefore(blk,p); }
    else if(a==='down'){ const n=blk.nextElementSibling; if(n) blk.parentElement.insertBefore(n,blk); }
    else if(a==='dup'){ const cl=blk.cloneNode(true); rebind(cl); blk.after(cl); }
    else if(a==='del'){ if(blk.parentElement.children.length>1) blk.remove(); else blk.querySelector('.blk-content').innerHTML=''; }
    scheduleSave(); updateStats();
  });
}
function rebind(cl){
  // image click handlers on cloned placeholder
  const ph=cl.querySelector('.blk-img.placeholder'); if(ph) ph.onclick=()=>toast('Subir imagen (demo)');
}

/* ---- drag reorder ---- */
function initDrag(blocks){
  let dragBlk=null;
  blocks.addEventListener('dragstart',e=>{
    const h=e.target.closest('.gh.drag'); if(!h){e.preventDefault();return;}
    dragBlk=h.closest('.blk'); dragBlk.classList.add('dragging');
    e.dataTransfer.effectAllowed='move'; try{e.dataTransfer.setData('text/plain','x');}catch(_){}
  });
  blocks.addEventListener('dragover',e=>{
    e.preventDefault(); if(!dragBlk) return;
    const over=e.target.closest('.blk'); if(!over||over===dragBlk) return;
    blocks.querySelectorAll('.dropbefore,.dropafter').forEach(x=>x.classList.remove('dropbefore','dropafter'));
    const r=over.getBoundingClientRect(); const after=e.clientY>r.top+r.height/2;
    over.classList.add(after?'dropafter':'dropbefore');
  });
  blocks.addEventListener('drop',e=>{
    e.preventDefault(); if(!dragBlk) return;
    const over=e.target.closest('.blk');
    if(over&&over!==dragBlk){ const r=over.getBoundingClientRect(); const after=e.clientY>r.top+r.height/2;
      if(after) over.after(dragBlk); else over.before(dragBlk); }
    blocks.querySelectorAll('.dropbefore,.dropafter').forEach(x=>x.classList.remove('dropbefore','dropafter'));
    if(dragBlk) dragBlk.classList.remove('dragging'); dragBlk=null; scheduleSave();
  });
  blocks.addEventListener('dragend',()=>{
    blocks.querySelectorAll('.dropbefore,.dropafter,.dragging').forEach(x=>x.classList.remove('dropbefore','dropafter','dragging')); dragBlk=null;
  });
}

/* ---- selection toolbar ---- */
let selEl=null;
function updateSelTool(){
  const sel=window.getSelection();
  if(!sel.rangeCount||sel.isCollapsed){ hideSelTool(); return; }
  const range=sel.getRangeAt(0);
  if(!mountEl.querySelector('#doc').contains(range.commonAncestorContainer)){ hideSelTool(); return; }
  if(!range.toString().trim()){ hideSelTool(); return; }
  const rect=range.getBoundingClientRect();
  if(!selEl){
    selEl=document.createElement('div'); selEl.className='seltool'; selEl.dataset.floater='1';
    selEl.innerHTML=`
      <button data-cmd="bold" style="font-weight:800">B</button>
      <button data-cmd="italic"><i>i</i></button>
      <button data-cmd="underline" style="text-decoration:underline">U</button>
      <span class="sep"></span>
      <button data-type="h2">H2</button>
      <button data-type="quote">${icon('quote')}</button>
      <button data-cmd="link">${icon('link')}</button>`;
    document.body.appendChild(selEl);
    selEl.querySelectorAll('button').forEach(b=>b.onmousedown=e=>{
      e.preventDefault();
      if(b.dataset.cmd==='link'){ doLink(); }
      else if(b.dataset.cmd){ document.execCommand(b.dataset.cmd,false,null); }
      else if(b.dataset.type){ convertActive(b.dataset.type); hideSelTool(); }
      refreshSelActive(); scheduleSave();
    });
  }
  selEl.style.left=(rect.left+rect.width/2)+'px';
  selEl.style.top=(rect.top-46)+'px';
  selEl.style.display='inline-flex';
  refreshSelActive();
}
function refreshSelActive(){
  if(!selEl) return;
  ['bold','italic','underline'].forEach(c=>{ const b=selEl.querySelector(`[data-cmd="${c}"]`); if(b){ let on=false; try{on=document.queryCommandState(c);}catch(_){} b.classList.toggle('act',on);} });
}
function hideSelTool(){ if(selEl) selEl.style.display='none'; }
function doLink(){
  const url=prompt('Pega el enlace (URL):','https://'); if(!url) return;
  document.execCommand('createLink',false,url); scheduleSave();
}

/* ---- empty hint + helpers ---- */
function updateEmptyHint(){
  mountEl.querySelectorAll('#blocks .blk').forEach(b=>{
    const c=b.querySelector('.blk-content');
    if(!c) return;
    if(b.dataset.type==='p' && isEmpty(c)){ c.setAttribute('data-empty','Escribe, o pulsa “/” para insertar'); }
    else c.removeAttribute('data-empty');
  });
}
function isEmpty(el){ return el && el.textContent.trim()==='' && !el.querySelector('img,li'); }
function isEmptyBlock(blk){ const c=blk.querySelector('.blk-content'); return c?isEmpty(c):false; }
function cleanupEmpty(el){ if(el && (el.innerHTML==='<br>'||el.textContent==='')) el.innerHTML=''; }
function atStart(el){
  const sel=window.getSelection(); if(!sel.rangeCount) return false;
  const r=sel.getRangeAt(0); return r.startOffset===0;
}
function placeCaretEnd(el){ const r=document.createRange(); r.selectNodeContents(el); r.collapse(false); const s=window.getSelection(); s.removeAllRanges(); s.addRange(r); }
function placeCaretStart(el){ const r=document.createRange(); r.selectNodeContents(el); r.collapse(true); const s=window.getSelection(); s.removeAllRanges(); s.addRange(r); }

/* ---- sync DOM → data ---- */
function syncBlocks(){
  const out=[];
  mountEl.querySelectorAll('#blocks .blk').forEach(blk=>{
    const t=blk.dataset.type; const c=blk.querySelector('.blk-content');
    if(t==='image'){ const img=blk.querySelector('img'); out.push({type:'image',src:img?img.src:null}); }
    else if(t==='list'||t==='numlist'){ const items=[...blk.querySelectorAll('li')].map(li=>li.innerHTML).filter(x=>x.trim()!==''); out.push({type:t,items:items.length?items:['']}); }
    else { out.push({type:t,html:c?c.innerHTML:''}); }
  });
  A.blocks=out;
  A.title=mountEl.querySelector('#title').textContent;
  A.excerpt=mountEl.querySelector('#excerpt').textContent;
}

/* ---- autosave + stats ---- */
function scheduleSave(){
  const save=mountEl.querySelector('#save'); const sb=mountEl.querySelector('#sbsave');
  if(save){ save.classList.add('saving'); save.querySelector('.tx').textContent='Guardando…'; }
  if(sb) sb.innerHTML=icon('cloud')+' Guardando…';
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{
    syncBlocks();
    if(save){ save.classList.remove('saving'); save.querySelector('.ic').innerHTML=icon('check',2.4); save.querySelector('.tx').textContent='Guardado · hace un momento'; }
    if(sb) sb.innerHTML=icon('check',2.4)+' Guardado';
  },700);
}
function updateStats(){
  const wcEl=mountEl.querySelector('#wc'), rtEl=mountEl.querySelector('#rt');
  if(!wcEl) return;
  let txt=mountEl.querySelector('#blocks').textContent+' '+mountEl.querySelector('#title').textContent;
  const words=(txt.trim().match(/\S+/g)||[]).length;
  wcEl.textContent=words.toLocaleString('es-MX');
  rtEl.textContent=Math.max(1,Math.round(words/200));
}
function syncSnippetTitle(){
  const snip=mountEl.querySelector('#snip'); if(!snip) return;
  if(!A.metaTitle){ snip.querySelector('.snip-title').textContent=A.title||'Sin título'; }
}

/* ---- publish / checklist / seo sheet ---- */
function doPublish(){
  const wasPub=A.status==='pub'; A.status='pub'; A._new=false;
  toast(wasPub?'Cambios actualizados':'Artículo publicado');
  const pill=mountEl.querySelector('.ed-top .pill');
  if(pill){ pill.className='pill pub'; pill.textContent='Publicado'; }
  mountEl.querySelector('#publish').textContent='Actualizar';
}
function openChecklist(){
  const md=A.metaDesc||''; const hasCover=!!A.cover; const hasEx=(A.excerpt||'').length>0; const hasTitle=(A.title||'').length>0;
  const row=(ok,label,action)=>`<div class="check ${ok?'done':''}">
      <span class="mk ${ok?'ok':'no'}">${ok?icon('check',2.6):'!'}</span><span>${label}</span>${!ok&&action?`<span class="act" data-act="${action}">${action==='cover'?'Agregar':'Completar'}</span>`:''}</div>`;
  const o=overlay(`
    <div class="sheet-head"><b>Antes de publicar</b><button class="x" data-close>${icon('x')}</button></div>
    <div class="sheet-body">
      ${row(hasTitle,'Título listo')}
      ${row(hasEx,'Extracto'+(hasEx?' ('+A.excerpt.length+' caracteres)':''))}
      ${row(hasCover,'Imagen de portada','cover')}
      ${row(md.length>0,'Meta descripción SEO'+(md.length?' ('+md.length+'/160)':''),'seo')}
      <div style="border-top:1.5px solid var(--border-1);margin:16px 0"></div>
      <div class="field"><div class="flabel">Meta descripción ${count(md.length,160)}</div>
        <textarea class="input" id="clMeta" placeholder="Resumen para Google…">${esc(md)}</textarea></div>
      ${snippet()}
      <button class="btn primary" style="width:100%;margin-top:16px" id="clPub">${A.status==='pub'?'Actualizar artículo':'Publicar artículo'}</button>
    </div>`);
  o.querySelector('#clMeta').oninput=e=>{ A.metaDesc=e.target.value; const s=o.querySelector('#snip'); if(s) s.outerHTML=snippet(); const c=o.querySelector('.cnt'); if(c) c.outerHTML=count(e.target.value.length,160); };
  o.querySelectorAll('[data-act]').forEach(a=>a.onclick=()=>{ if(a.dataset.act==='cover'){ A.cover={color:'#0b3a5e',icon:'droplet'}; renderCover(); toast('Portada agregada'); closeOverlay(o);} else { o.querySelector('#clMeta').focus(); }});
  o.querySelector('#clPub').onclick=()=>{ closeOverlay(o); doPublish(); };
}
function openSeoSheet(){
  const o=overlay(`
    <div class="sheet-head"><b>SEO y metadatos</b><button class="x" data-close>${icon('x')}</button></div>
    <div class="sheet-body" id="seoSheetBody">${seoFields()}</div>`);
  wireInspector(o.querySelector('#seoSheetBody').parentElement);
}
function overlay(inner){
  const o=document.createElement('div'); o.className='overlay'; o.dataset.floater='1';
  o.innerHTML=`<div class="sheet">${inner}</div>`;
  document.body.appendChild(o);
  requestAnimationFrame(()=>o.classList.add('show'));
  o.addEventListener('mousedown',e=>{ if(e.target===o) closeOverlay(o); });
  const x=o.querySelector('[data-close]'); if(x) x.onclick=()=>closeOverlay(o);
  return o;
}
function closeOverlay(o){ o.classList.remove('show'); setTimeout(()=>o.remove(),220); }

function moreMenu(anchor){
  window.PF_closeFloaters();
  const m=document.createElement('div'); m.className='blkmenu'; m.dataset.floater='1'; m.style.width='200px';
  m.innerHTML=`
    <div class="bmi" data-a="live">${icon('ext')}Ver en vivo</div>
    <div class="bmi" data-a="dup">${icon('copy')}Duplicar artículo</div>
    <div class="bmi" data-a="unpub">${icon('eyeOff')}Despublicar</div>
    <div class="bmi danger" data-a="del">${icon('trash')}Eliminar</div>`;
  document.body.appendChild(m);
  const r=anchor.getBoundingClientRect();
  m.style.left=Math.min(r.left,window.innerWidth-210)+'px'; m.style.top=(r.bottom+6)+'px';
  m.querySelectorAll('.bmi').forEach(b=>b.onclick=()=>{
    const a=b.dataset.a; window.PF_closeFloaters();
    if(a==='live'){ syncBlocks(); window.PF_GO('live',A.id); }
    else if(a==='dup') toast('Artículo duplicado');
    else if(a==='unpub'){ A.status='draft'; const pill=mountEl.querySelector('.ed-top .pill'); if(pill){pill.className='pill draft';pill.textContent='Borrador';} toast('Artículo despublicado'); }
    else if(a==='del') toast('Artículo eliminado');
  });
}

})();
