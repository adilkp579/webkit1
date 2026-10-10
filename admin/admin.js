/*! WebKit admin panel (admin/admin.js) - products, categories, orders, customers via Supabase. */

(function(){
const CFG=window.WK_CONFIG||{};
const $=(s,r)=>(r||document).querySelector(s),$$=(s,r)=>[...(r||document).querySelectorAll(s)];
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>'₹'+Number(n||0).toLocaleString('en-IN');
const img=(i,w)=>/^(https?:|data:|\/|\.)/.test(i||'')?i:'https://images.unsplash.com/photo-'+i+'?auto=format&fit=crop&w='+(w||300)+'&q=80';
const toast=(t,bad)=>{const x=$('#ts');x.textContent=t;x.className='toast show'+(bad?' bad':'');clearTimeout(toast.t);toast.t=setTimeout(()=>x.classList.remove('show'),2800)};
let sb=null;try{if(CFG.SUPABASE_URL&&CFG.SUPABASE_ANON_KEY)sb=window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY)}catch(_){}
let PS='feat',TB=[],P=[],C=[],ORD=[],CUS=[],MSG=[],SUBS=[],MU=null,ucount=0,V='dash',Q='',CF='All',first=true,pcount=0;
const SL=['Order Placed','Packed','Shipped','Out for Delivery','Delivered'],TH=[0,2,24,72,96];
const fromP=r=>({id:r.id,n:r.name,c:r.category,g:r.audience,p:+r.price,o:+r.old_price||0,r:+r.rating,rc:r.reviews,i:r.image,d:r.description||'',feat:r.featured,best:r.best_seller,s:r.in_stock,h:!r.visible,exp:r.in_explore!==false,pe:r.pos_explore||0,ps:r.pos_shop||0,pf:r.pos_featured||0,pb:r.pos_best||0,ims:r.images&&r.images.length?r.images:[r.image]});
const toRow=o=>({name:o.n,category:o.c,audience:o.g,price:o.p,old_price:o.o,rating:o.r,reviews:o.rc,image:o.i,description:o.d,in_stock:o.s,visible:!o.h,featured:o.feat,best_seller:o.best,images:o.ims||[o.i],in_explore:o.exp!==false});
const fromC=r=>({id:r.id,n:r.name,img:r.image,h:r.home_order,sort:r.sort});
const fromO=r=>({id:r.id,uid:r.user_id,t:Date.parse(r.created_at),at:r.accepted_at?Date.parse(r.accepted_at):null,ac:r.status==='pending'?0:r.status==='rejected'?-1:1,st:r.stage,trk:r.tracking_id,tot:+r.total,a:r.address,items:r.items});
const fromU=r=>({uid:r.user_id,name:r.name,m:r.mobile,m2:r.mobile2,email:r.email,a:r.address});
const fromM=r=>({id:r.id,user_id:r.user_id,sender:r.sender,body:r.body,t:Date.parse(r.created_at),ar:r.admin_read});
const fromT=r=>({id:r.id,n:r.name,sort:r.sort});
const fromS=r=>({id:r.id,mobile:r.mobile,t:Date.parse(r.created_at)});
const unr=x=>x.sender==='customer'&&!x.ar;
const dtm=t=>new Date(t).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
const acc=o=>o.ac!==0&&o.ac!==-1,pend=o=>o.ac===0;
const stat=o=>{if(o.st!=null)return+o.st;let ix=0;const h=(Date.now()-(o.at||o.t))/36e5;TH.forEach((x,i)=>{if(h>=x)ix=i});return ix};
const dt=t=>new Date(t).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
async function loadAll(){const R=await Promise.all([sb.from('products').select('*').order('id'),sb.from('categories').select('*').order('sort').order('id'),sb.from('orders').select('*').order('created_at',{ascending:false}),sb.from('profiles').select('*').order('created_at',{ascending:false}),sb.from('messages').select('*').order('created_at',{ascending:false}).limit(1000),sb.from('subscribers').select('*').order('created_at',{ascending:false}),sb.from('explore_tabs').select('*').order('sort').order('id')]);
const er=R.slice(0,6).find(x=>x.error);if(er)return toast(er.error.message,1);
P=R[0].data.map(fromP);C=R[1].data.map(fromC);ORD=R[2].data.map(fromO);CUS=R[3].data.map(fromU);MSG=R[4].data.map(fromM);SUBS=R[5].data.map(fromS);if(R[6].error){TB=[];if(first)toast('Run the updated supabase/schema.sql to enable Explore tabs',1)}else TB=R[6].data.map(fromT);
const pc=ORD.filter(pend).length;if(!first&&pc>pcount)toast('New order received');pcount=pc;
const uc=MSG.filter(unr).length;if(!first&&uc>ucount)toast('New message from a customer');ucount=uc;first=false;
const nb=$('#mnb');nb.textContent=uc;nb.hidden=!uc;
if($('#md').classList.contains('open'))return;
if(V==='msg'&&$('.chat'))refreshMsg();else go(V)}
const run=async(q,ok)=>{const r=await q;if(r.error){toast(r.error.message,1);return false}if(ok)toast(ok);await loadAll();return true};
/* auth */
const isAdmin=async()=>!!(await sb.from('admins').select('user_id').maybeSingle()).data;
async function doAuth(){const er=$('#ae'),u=$('#un').value.trim();er.textContent='';
const email=u.includes('@')?u:(u.toLowerCase()==='admin'?CFG.ADMIN_EMAIL:'');
if(!email)return er.textContent='Incorrect username or password.';
$('#ab').disabled=true;const r=await sb.auth.signInWithPassword({email,password:$('#pw').value});
if(r.error){$('#ab').disabled=false;return er.textContent='Incorrect username or password.'}
if(!(await isAdmin())){await sb.auth.signOut();$('#ab').disabled=false;return er.textContent='This account does not have admin access.'}
enter()}
$('#ab').onclick=doAuth;$('#pw').onkeydown=$('#un').onkeydown=ev=>{if(ev.key==='Enter')doAuth()};
async function enter(){$('#auth').hidden=true;$('#app').hidden=false;await loadAll();
let tm;const rl=()=>{clearTimeout(tm);tm=setTimeout(loadAll,500)};
sb.channel('wk-admin').on('postgres_changes',{event:'*',schema:'public',table:'orders'},rl).on('postgres_changes',{event:'*',schema:'public',table:'products'},rl).on('postgres_changes',{event:'*',schema:'public',table:'categories'},rl).on('postgres_changes',{event:'*',schema:'public',table:'explore_tabs'},rl).on('postgres_changes',{event:'*',schema:'public',table:'profiles'},rl).on('postgres_changes',{event:'*',schema:'public',table:'messages'},rl).on('postgres_changes',{event:'*',schema:'public',table:'subscribers'},rl).subscribe()}
$('#lo').onclick=async()=>{await sb.auth.signOut();location.reload()};
/* views */
const T={dash:'Dashboard',prod:'Products',cat:'Categories',ord:'Orders',cus:'Customers',msg:'Messages',sub:'Subscribers',pos:'Positions',tabs:'Explore Tabs',set:'Settings'};
const cats=()=>[...new Set([...C.map(c=>c.n),...P.map(p=>p.c)])];
function go(v){V=v;$('#ttl').textContent=T[v];$$('.sb [data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===v));$('#sb').classList.remove('open');
$('#act').innerHTML=v==='prod'?'<button class="btn" data-a="add">+ Add product</button>':v==='cat'?'<button class="btn" data-a="cadd">+ Add category</button>':v==='tabs'?'<button class="btn" data-a="tadd">+ Add tab</button>':'';
$('#vw').innerHTML=({dash,prod,cat,tabs,pos,ord,cus,msg,sub,set})[v]();if(v==='prod')rows()}
const pcard=o=>`<div class="card" style="margin-bottom:12px;border-color:#b08d57"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><b>#${e(o.id)}</b> <span class="chip rd">New order</span><br><small class="mut">${dt(o.t)} · ${e(o.a.name)} · +91 ${e(o.a.m1)} / +91 ${e(o.a.m2)}</small></div><b style="font-size:18px">${fmt(o.tot)} <small class="mut">Cash on Delivery</small></b></div><div style="margin:10px 0">${o.items.map(i=>e(i.n)+' × '+i.q).join(', ')}</div><div class="mut" style="margin-bottom:14px">Deliver to: ${e(o.a.a1)}, ${e(o.a.a2)}, ${e(o.a.c)}, ${e(o.a.s)} – ${e(o.a.p)}</div><div style="display:flex;gap:8px"><button class="btn" data-a="oacc" data-oid="${e(o.id)}">Accept order</button><button class="btn l" data-a="orej" data-oid="${e(o.id)}">Reject</button></div></div>`;
function dash(){const O=ORD.filter(acc),PD=ORD.filter(pend),rev=O.reduce((a,o)=>a+o.tot,0),cs=cats(),mx=Math.max(1,...cs.map(c=>P.filter(p=>p.c===c).length));
return`${PD.length?`<h3 style="margin-bottom:12px">New orders awaiting your approval (${PD.length})</h3>${PD.map(pcard).join('')}<div style="height:8px"></div>`:''}<div class="g4"><div class="card st"${PD.length?' style="border-color:#b08d57"':''}><b>${PD.length}</b><span>Pending approval</span></div><div class="card st"><b>${P.length}</b><span>Products</span></div><div class="card st"><b>${cs.length}</b><span>Categories</span></div><div class="card st"><b>${P.filter(p=>p.s===false).length}</b><span>Out of stock</span></div><div class="card st"><b>${P.filter(p=>p.h).length}</b><span>Hidden</span></div><div class="card st"><b>${O.length}</b><span>Accepted orders</span></div><div class="card st"><b>${fmt(rev)}</b><span>Order value (COD)</span></div></div>
<div class="row"><div class="card"><h3 style="margin-bottom:14px">Products by category</h3>${cs.map(c=>{const n=P.filter(p=>p.c===c).length;return`<div style="display:flex;justify-content:space-between"><span>${e(c)}</span><b>${n}</b></div><div class="bar"><i style="width:${n/mx*100}%"></i></div>`}).join('')}</div>
<div class="card"><h3 style="margin-bottom:14px">Recent orders</h3>${O.slice(0,5).map(o=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee"><span>#${e(o.id)}<br><small class="mut">${e(o.a.name)}</small></span><b>${fmt(o.tot)}</b></div>`).join('')||'<p class="mut">No accepted orders yet.</p>'}</div></div>`}
function prod(){return`<div class="card"><div class="fl"><input id="q" placeholder="Search products…" value="${e(Q)}"><select id="cf"><option>All</option>${cats().map(c=>`<option${c===CF?' selected':''}>${e(c)}</option>`).join('')}</select></div><div class="tw"><table class="pt"><thead><tr><th></th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Display</th><th></th></tr></thead><tbody id="tb"></tbody></table></div></div>`}
function rows(){const l=P.filter(p=>(CF==='All'||p.c===CF)&&(p.n+' '+p.c+' '+p.g).toLowerCase().includes(Q.toLowerCase()));
$('#tb').innerHTML=l.map(p=>`<tr><td><img class="th" style="cursor:pointer" data-a="edit" data-id="${p.id}" src="${e(img(p.i,120))}" alt="" onerror="this.style.visibility='hidden'"></td><td><b data-a="edit" data-id="${p.id}" style="cursor:pointer">${e(p.n)}</b><br><small class="mut">${e(p.g)} · ID ${p.id}</small></td><td>${e(p.c)}</td><td>${fmt(p.p)}${p.o?` <s class="mut">${fmt(p.o)}</s>`:''}</td><td><span class="chip ${p.s===false?'rd':'g'}" data-a="tg" data-k="s" data-id="${p.id}">${p.s===false?'Out of stock':'In stock'}</span></td><td><span class="chip ${p.feat?'on':''}" data-a="tg" data-k="feat" data-id="${p.id}">Featured</span><span class="chip ${p.best?'on':''}" data-a="tg" data-k="best" data-id="${p.id}">Best seller</span><span class="chip ${p.exp?'on':''}" data-a="tg" data-k="exp" data-id="${p.id}">Explore</span><span class="chip ${p.h?'rd':''}" data-a="tg" data-k="h" data-id="${p.id}">${p.h?'Hidden':'Visible'}</span></td><td class="ac"><button data-a="edit" data-id="${p.id}">Edit</button><button class="dl" data-a="del" data-id="${p.id}">Delete</button></td></tr>`).join('')||'<tr><td colspan="7" class="mut">No products found.</td></tr>'}
function cat(){return`<div class="note">Categories appear as tabs on the shop page. Turn on "Shown on home" to also show a card in Shop by Category. Categories with no products stay hidden in the store.</div><div class="card"><div class="tw"><table class="pt"><thead><tr><th></th><th>Category</th><th>Products</th><th>Home page card</th><th></th></tr></thead><tbody>${C.map((c,i)=>`<tr><td><img class="th" src="${e(img(c.img,120))}" alt="" onerror="this.style.visibility='hidden'"></td><td><b>${e(c.n)}</b></td><td>${P.filter(p=>p.c===c.n).length}</td><td><span class="chip ${c.h>0?'on':''}" data-a="ctg" data-i="${i}">${c.h>0?'Shown on home':'Hidden on home'}</span></td><td class="ac"><button data-a="cedit" data-i="${i}">Edit</button><button class="dl" data-a="cdel" data-i="${i}">Delete</button></td></tr>`).join('')}</tbody></table></div></div>`}
function ord(){const O=ORD.filter(acc);return`<div class="note">Only accepted orders are listed here. New orders wait on the Dashboard until you accept them.</div><div class="card"><div class="tw"><table><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>${O.map(o=>`<tr><td><b>#${e(o.id)}</b><br><small class="mut">${o.items.length} item(s)</small></td><td>${dt(o.t)}</td><td>${e(o.a.name)}<br><small class="mut">+91 ${e(o.a.m1)} · ${e(o.a.c)}</small></td><td>${fmt(o.tot)}</td><td><select data-os="${e(o.id)}">${SL.map((s,k)=>`<option value="${k}"${stat(o)===k?' selected':''}>${s}</option>`).join('')}</select></td></tr>`).join('')||'<tr><td colspan="5" class="mut">No accepted orders yet.</td></tr>'}</tbody></table></div></div>`}
function cus(){const O=ORD.filter(acc);return`<div class="card"><div class="tw"><table><thead><tr><th>Name</th><th>Mobile</th><th>Email</th><th>City</th><th>Orders</th></tr></thead><tbody>${CUS.map(c=>`<tr><td><b>${e(c.name)}</b></td><td>+91 ${e(c.m)}</td><td>${e(c.email)}</td><td>${e(c.a&&c.a.c)}</td><td>${O.filter(o=>o.uid===c.uid).length}</td></tr>`).join('')||'<tr><td colspan="5" class="mut">No customers yet.</td></tr>'}</tbody></table></div></div>`}
const nameOf=uid=>(CUS.find(c=>c.uid===uid)||{}).name||'Customer';
function convs(){const m=new Map();CUS.forEach(c=>m.set(c.uid,{uid:c.uid,name:c.name,mobile:c.m,last:null,un:0}));
MSG.forEach(x=>{let c=m.get(x.user_id);if(!c){c={uid:x.user_id,name:'Customer',mobile:'',last:null,un:0};m.set(x.user_id,c)}if(!c.last||x.t>c.last.t)c.last=x;if(unr(x))c.un++});
return[...m.values()].sort((a,b)=>(b.last?b.last.t:0)-(a.last?a.last.t:0))}
const listHTML=()=>convs().map(c=>`<div class="cli${c.uid===MU?' on':''}" data-a="mopen" data-uid="${c.uid}"><b>${e(c.name)}</b>${c.un?`<span class="nb">${c.un}</span>`:''}<br><small class="mut">${c.last?e(c.last.body.slice(0,40)):'No messages yet'}</small></div>`).join('')||'<p class="mut" style="padding:8px">Customers appear here after they place an order.</p>';
const bubbles=()=>{const ms=MSG.filter(x=>x.user_id===MU).sort((a,b)=>a.t-b.t);return ms.map(x=>`<div class="bb ${x.sender==='admin'?'me':'ad'}"><span>${e(x.body)}</span><small>${dtm(x.t)}</small></div>`).join('')||'<p class="mut">No messages yet. Say hello.</p>'};
function msg(){const c=convs().find(x=>x.uid===MU);return`<div class="chat"><div class="card cl">${listHTML()}</div><div class="card ct">${MU?`<div style="margin-bottom:6px"><b>${e(c?c.name:'Customer')}</b> <small class="mut">${c&&c.mobile?'+91 '+e(c.mobile):''}</small></div><div class="msgs" id="msgs">${bubbles()}</div><div class="cinput"><textarea id="mi" rows="2" maxlength="1000" placeholder="Write a message…"></textarea><button class="btn" data-a="msend">Send</button></div>`:'<p class="mut">Select a customer to read or send messages.</p>'}</div></div>`}
function refreshMsg(){$('.cl').innerHTML=listHTML();const t=$('#msgs');if(t){t.innerHTML=bubbles();t.scrollTop=t.scrollHeight;if(MSG.some(x=>x.user_id===MU&&unr(x)))sb.rpc('mark_messages_read_admin',{p_user:MU}).then(()=>loadAll())}}
function sub(){return`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px;flex-wrap:wrap"><h3>${SUBS.length} subscriber${SUBS.length===1?'':'s'}</h3><button class="btn l" data-a="scsv">Download CSV</button></div><div class="tw"><table><thead><tr><th>#</th><th>Mobile number</th><th>Subscribed on</th><th></th></tr></thead><tbody>${SUBS.map((s,i)=>`<tr><td>${SUBS.length-i}</td><td>+91 ${e(s.mobile)}</td><td>${dt(s.t)}</td><td class="ac"><button class="dl" data-a="sdel" data-id="${s.id}">Remove</button></td></tr>`).join('')||'<tr><td colspan="4" class="mut">No subscribers yet.</td></tr>'}</tbody></table></div></div>`}
/* positions: one editable order per place on the store */
const PT={
feat:{n:'Featured Picks',tbl:'products',col:'pos_featured',key:'pf',min:0,list:()=>P.filter(p=>p.feat),note:'Products marked "Featured pick".'},
cat:{n:'Shop by Category',tbl:'categories',col:'home_order',key:'h',min:1,list:()=>C.filter(c=>c.h>0),note:'The category cards on the home page. Turn a category on or off in Categories.'},
exp:{n:'Explore Our Products',tbl:'products',col:'pos_explore',key:'pe',min:0,list:()=>P.filter(p=>p.exp),note:'Products you selected for Explore Our Products (and its Boys / Girls / Adults tabs).'},
best:{n:'Best Sellers',tbl:'products',col:'pos_best',key:'pb',min:0,list:()=>P.filter(p=>p.best),note:'Products marked "Best seller".'},
etabs:{n:'Explore tabs',tbl:'explore_tabs',col:'sort',key:'sort',min:0,list:()=>TB,note:'Order of the tabs above Explore Our Products.'},
tabs:{n:'Shop page: category tabs',tbl:'categories',col:'sort',key:'sort',min:0,list:()=>C,note:'Order of the tabs on the Shop Now page.'},
shop:{n:'Shop page: products',tbl:'products',col:'pos_shop',key:'ps',min:0,list:()=>P,note:'Order of the products on the Shop Now page.'}};
const plist=t=>[...t.list()].sort((a,b)=>(a[t.key]||0)-(b[t.key]||0)||a.id-b.id);
function pos(){const t=PT[PS],l=plist(t),pr=t.tbl==='products';
return`<div class="fl" style="margin-bottom:12px">${Object.keys(PT).map(k=>`<span class="chip ${k===PS?'on':''}" data-a="pst" data-k="${k}">${PT[k].n}</span>`).join('')}</div>
<div class="note">Lower numbers show first. ${t.note} New products and categories are added at the end automatically; change any number here and the store updates instantly.</div>
<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:10px;flex-wrap:wrap"><h3>${t.n} (${l.length})</h3><button class="btn l" data-a="prn">Renumber 1 to ${l.length}</button></div><div class="tw"><table><thead><tr><th style="width:96px">Position</th><th></th><th>${pr?'Product':'Category'}</th><th>${pr?'Category':'Products'}</th></tr></thead><tbody>${l.map(x=>`<tr><td><input class="posi" type="number" min="${t.min}" value="${x[t.key]||0}" data-pk="${PS}" data-id="${x.id}"></td><td><img class="th" src="${e(img(pr?x.i:x.img,120))}" alt="" onerror="this.style.visibility='hidden'"></td><td><b>${e(x.n)}</b></td><td>${pr?e(x.c):(t.tbl==='explore_tabs'?P.filter(p=>p.g===x.n):P.filter(p=>p.c===x.n)).length}</td></tr>`).join('')||'<tr><td colspan="4" class="mut">Nothing to order here yet.</td></tr>'}</tbody></table></div></div>`}
const tabOpts=g=>{const l=TB.map(t=>t.n);if(g&&!l.includes(g))l.push(g);return l.map(x=>`<option${x===g?' selected':''}>${e(x)}</option>`).join('')||'<option value="">(add tabs first)</option>'};
function tabs(){return`<div class="note">These are the tabs above the Explore Our Products grid (after "All"). Renaming a tab updates all its products. A tab can be deleted only when no product uses it. Change their order in Positions.</div><div class="card"><div class="tw"><table class="pt"><thead><tr><th>Tab</th><th>Products</th><th></th></tr></thead><tbody>${TB.map((t,i)=>`<tr><td><b>${e(t.n)}</b></td><td>${P.filter(p=>p.g===t.n).length}</td><td class="ac"><button data-a="tedit" data-i="${i}">Rename</button><button class="dl" data-a="tdel" data-i="${i}">Delete</button></td></tr>`).join('')||'<tr><td colspan="3" class="mut">No tabs yet. Add one.</td></tr>'}</tbody></table></div></div>`}
function tabForm(i){const n=i==null;$('#mc').innerHTML=`<h2>${n?'Add tab':'Rename tab'}</h2><input type="hidden" id="tid" value="${n?'':i}"><label>Tab name<input id="tn" value="${n?'':e(TB[i].n)}" placeholder="e.g. Kids"></label><div class="err" id="fe"></div><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn l" data-a="cl">Cancel</button><button class="btn" data-a="tsv">Save</button></div>`;$('#md').classList.add('open');$('#tn').focus()}
async function saveTab(){const er=$('#fe'),id=$('#tid').value,nm=$('#tn').value.trim();
if(nm.length<2)return er.textContent='Enter a tab name.';if(nm.toLowerCase()==='all')return er.textContent='"All" is added automatically.';
if(TB.some((t,k)=>t.n.toLowerCase()===nm.toLowerCase()&&String(k)!==id))return er.textContent='This tab already exists.';
const bt=$('[data-a="tsv"]');bt.disabled=true;let r;
if(id!==''){const old=TB[+id];if(old.n!==nm){const r1=await sb.from('products').update({audience:nm}).eq('audience',old.n);if(r1.error){bt.disabled=false;return er.textContent=r1.error.message}}r=await sb.from('explore_tabs').update({name:nm}).eq('id',old.id)}
else r=await sb.from('explore_tabs').insert({name:nm,sort:Math.max(0,...TB.map(t=>t.sort||0))+1});
if(r.error){bt.disabled=false;return er.textContent=r.error.message}
$('#md').classList.remove('open');toast('Saved · store updated');await loadAll()}
function set(){return`<div class="row"><div class="card"><h3 style="margin-bottom:14px">Change password</h3><label>Current password<input id="cp" type="password"></label><label>New password (min 6)<input id="np" type="password"></label><button class="btn" data-a="pw">Update password</button><div class="err" id="pe"></div></div>
<div class="card"><h3 style="margin-bottom:8px">Connection</h3><p class="mut">Connected to<br><b style="color:#111;word-break:break-all">${e(CFG.SUPABASE_URL)}</b></p><p class="mut" style="margin-top:10px">Products, categories, orders and customers live in your Supabase database. Every change here updates the store instantly for all visitors.</p></div></div>`}
/* forms */
const imgField=i=>`<label>Image URL<input id="fi" value="${e(i)}" placeholder="https://… (or upload below)"></label><div style="display:flex;gap:14px;align-items:center;margin-bottom:14px"><img class="pv" id="pvi" src="${e(i?img(i,200):'')}" alt="" onerror="this.style.visibility='hidden'" onload="this.style.visibility='visible'"><label style="margin:0;flex:1">Or upload image<input id="fu" type="file" accept="image/*"></label></div>`;
async function upImg(f){const im=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=r.result};r.readAsDataURL(f)});
const k=Math.min(1,1000/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);
const b=await new Promise(res=>c.toBlob(res,'image/jpeg',.85)),path=Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.jpg';
const u=await sb.storage.from('product-images').upload(path,b,{contentType:'image/jpeg'});if(u.error)throw u.error;
return sb.storage.from('product-images').getPublicUrl(path).data.publicUrl}
function bindImg(){$('#fi').oninput=ev=>{window._img=ev.target.value.trim();$('#pvi').src=window._img?img(window._img,200):''};
$('#fu').onchange=async ev=>{const f=ev.target.files[0];if(!f)return;const er=$('#fe');er.style.color='#6b6b6b';er.textContent='Uploading image…';
try{window._img=await upImg(f);$('#fi').value=window._img;$('#pvi').src=window._img;er.textContent=''}catch(x){er.style.color='';er.textContent='Upload failed: '+(x.message||x)}}}
const slots=a=>[0,1,2].map(k=>`<div class="slot"><label>Photo ${k+1}${k?' (optional)':' (main)'}<input id="fi${k}" value="${e(a[k]||'')}" placeholder="https://… or upload"></label><div class="slotr"><img class="pv" id="pvi${k}" src="${e(a[k]?img(a[k],200):'')}" alt="" onerror="this.style.visibility='hidden'" onload="this.style.visibility='visible'"><input id="fu${k}" type="file" accept="image/*"></div></div>`).join('');
function bindImgs(){[0,1,2].forEach(k=>{$('#fi'+k).oninput=ev=>{window._imgs[k]=ev.target.value.trim();$('#pvi'+k).src=window._imgs[k]?img(window._imgs[k],200):''};
$('#fu'+k).onchange=async ev=>{const f=ev.target.files[0];if(!f)return;const er=$('#fe');er.style.color='#6b6b6b';er.textContent='Uploading photo '+(k+1)+'…';
try{window._imgs[k]=await upImg(f);$('#fi'+k).value=window._imgs[k];$('#pvi'+k).src=window._imgs[k];er.textContent=''}catch(x){er.style.color='';er.textContent='Upload failed: '+(x.message||x)}}})}
function form(p){const n=!p;p=p||{exp:true,n:'',c:'',g:(TB[0]||{}).n||'',p:'',o:0,r:4.5,rc:0,i:'',d:'',s:true,h:false,feat:false,best:false};
$('#mc').innerHTML=`<h2>${n?'Add product':'Edit product'}</h2><input type="hidden" id="fid" value="${n?'':p.id}">
<label>Product name<input id="fn" value="${e(p.n)}"></label>
<div class="row"><label>Category<select id="fc">${cats().map(c=>`<option${p.c===c?' selected':''}>${e(c)}</option>`).join('')}<option value="__new">+ New category…</option></select></label><label>Audience<select id="fg">${tabOpts(p.g)}</select></label></div>
<label id="fnw" hidden>New category name<input id="fcn" placeholder="e.g. Home Decor"></label>
<div class="row row3"><label>Price (₹)<input id="fp" type="number" min="1" value="${p.p}"></label><label>Old price (₹, optional)<input id="fo" type="number" min="0" value="${p.o||''}"></label><label>Rating (0–5)<input id="fr" type="number" min="0" max="5" step="0.1" value="${p.r}"></label></div>
<label>Number of reviews<input id="frc" type="number" min="0" value="${p.rc}"></label>
<div class="slots">${slots(p.ims||(p.i?[p.i]:[]))}</div>
<label>Description<textarea id="fd" rows="3">${e(p.d)}</textarea></label>
<div class="cb"><label><input type="checkbox" id="fs"${p.s!==false?' checked':''}>In stock</label><label><input type="checkbox" id="fh"${p.h?'':' checked'}>Visible in store</label><label><input type="checkbox" id="ff"${p.feat?' checked':''}>Featured pick</label><label><input type="checkbox" id="fb"${p.best?' checked':''}>Best seller</label><label><input type="checkbox" id="fx"${p.exp!==false?' checked':''}>Show in Explore Our Products</label></div>
<div class="err" id="fe"></div><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn l" data-a="cl">Cancel</button><button class="btn" data-a="sv">Save product</button></div>`;
$('#md').classList.add('open');window._imgs=(p.ims||(p.i?[p.i]:[])).concat(['','']).slice(0,3);bindImgs()}
async function save(){const g=i=>$('#'+i).value.trim(),er=$('#fe');er.style.color='';const id=g('fid'),pr=+g('fp'),old=+g('fo')||0,rt=+g('fr');
if(g('fn').length<2)return er.textContent='Enter a product name.';
let cv=$('#fc').value;if(cv==='__new'){cv=g('fcn');if(cv.length<2)return er.textContent='Enter the new category name.';cv=cats().find(c=>c.toLowerCase()===cv.toLowerCase())||cv}if(!cv)return er.textContent='Select a category.';
if(!(pr>0))return er.textContent='Enter a valid price.';if(old&&old<=pr)return er.textContent='Old price must be higher than the price (or leave empty).';
if(rt<0||rt>5)return er.textContent='Rating must be between 0 and 5.';const ims=(window._imgs||[]).filter(Boolean);if(!ims.length)return er.textContent='Add at least one photo (URL or upload).';
const o={n:g('fn'),c:cv,g:$('#fg').value,p:pr,o:old,r:rt,rc:+g('frc')||0,i:ims[0],ims:ims,d:g('fd'),s:$('#fs').checked,h:!$('#fh').checked,feat:$('#ff').checked,best:$('#fb').checked,exp:$('#fx').checked};
const bt=$('[data-a="sv"]');bt.disabled=true;
if(!C.some(c=>c.n.toLowerCase()===cv.toLowerCase())){const r0=await sb.from('categories').insert({name:cv,image:o.i,home_order:0,sort:Math.max(0,...C.map(c=>c.sort||0))+1});if(r0.error){bt.disabled=false;return er.textContent=r0.error.message}}
const r=id?await sb.from('products').update(toRow(o)).eq('id',id):await sb.from('products').insert(toRow(o));
if(r.error){bt.disabled=false;return er.textContent=r.error.message}
$('#md').classList.remove('open');toast('Saved · store updated');await loadAll()}
function catForm(i){const n=i==null,c=n?{n:'',img:'',h:0}:C[i];
$('#mc').innerHTML=`<h2>${n?'Add category':'Edit category'}</h2><input type="hidden" id="cid" value="${n?'':i}"><label>Category name<input id="cn" value="${e(c.n)}" placeholder="e.g. Home Decor"></label>${imgField(c.img)}<div class="cb"><label><input type="checkbox" id="chm"${c.h>0?' checked':''}>Show as a card in Shop by Category (home page)</label></div><div class="err" id="fe"></div><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn l" data-a="cl">Cancel</button><button class="btn" data-a="csv">Save category</button></div>`;
$('#md').classList.add('open');window._img=c.img;bindImg()}
async function saveCat(){const er=$('#fe'),id=$('#cid').value,nm=$('#cn').value.trim();er.style.color='';
if(nm.length<2)return er.textContent='Enter a category name.';
if(C.some((c,k)=>c.n.toLowerCase()===nm.toLowerCase()&&String(k)!==id))return er.textContent='This category already exists.';
if(!window._img)return er.textContent='Add an image URL or upload an image.';
const on=$('#chm').checked,nx=Math.max(0,...C.map(c=>c.h||0))+1,bt=$('[data-a="csv"]');bt.disabled=true;let r;
if(id!==''){const old=C[+id];if(old.n!==nm){const r1=await sb.from('products').update({category:nm}).eq('category',old.n);if(r1.error){bt.disabled=false;return er.textContent=r1.error.message}}
r=await sb.from('categories').update({name:nm,image:window._img,home_order:on?(old.h>0?old.h:nx):0}).eq('id',old.id)}
else r=await sb.from('categories').insert({name:nm,image:window._img,home_order:on?nx:0,sort:Math.max(0,...C.map(c=>c.sort||0))+1});
if(r.error){bt.disabled=false;return er.textContent=r.error.message}
$('#md').classList.remove('open');toast('Category saved · store updated');await loadAll()}
/* events */
document.addEventListener('click',async ev=>{const t=ev.target;
const v=t.closest('[data-v]');if(v)return go(v.dataset.v);
if(t.closest('#mn'))return $('#sb').classList.toggle('open');
if(t.id==='md')return $('#md').classList.remove('open');
const b=t.closest('[data-a]');if(!b)return;const a=b.dataset.a,id=b.dataset.id,p=id&&P.find(x=>String(x.id)===id);
if(a==='add')form();else if(a==='edit')form(p);else if(a==='cl')$('#md').classList.remove('open');else if(a==='sv')save();
else if(a==='cadd')catForm();else if(a==='cedit')catForm(+b.dataset.i);else if(a==='csv')saveCat();
else if(a==='ctg'){const c=C[+b.dataset.i];run(sb.from('categories').update({home_order:c.h>0?0:Math.max(0,...C.map(x=>x.h||0))+1}).eq('id',c.id),'Saved · store updated')}
else if(a==='cdel'){const c=C[+b.dataset.i],n=P.filter(p=>p.c===c.n).length;if(n)toast('Move or delete the '+n+' product(s) in "'+c.n+'" first',1);else if(confirm('Delete category "'+c.n+'"?'))run(sb.from('categories').delete().eq('id',c.id),'Category deleted')}
else if(a==='tg'){const k=b.dataset.k,col={s:'in_stock',feat:'featured',best:'best_seller',h:'visible',exp:'in_explore'}[k],val=k==='s'?p.s===false:k==='h'?p.h:!p[k];run(sb.from('products').update({[col]:val}).eq('id',p.id),'Saved · store updated')}
else if(a==='del'){if(confirm('Delete "'+p.n+'" permanently?'))run(sb.from('products').delete().eq('id',p.id),'Product deleted')}
else if(a==='mopen'){MU=b.dataset.uid;go('msg');const t=$('#msgs');if(t)t.scrollTop=t.scrollHeight;sb.rpc('mark_messages_read_admin',{p_user:MU}).then(()=>loadAll())}
else if(a==='msend'){const ta=$('#mi'),bd=ta.value.trim();if(!bd||!MU)return;b.disabled=true;const r=await sb.from('messages').insert({user_id:MU,sender:'admin',body:bd});b.disabled=false;if(r.error)return toast(r.error.message,1);ta.value='';await loadAll();const t2=$('#mi');if(t2)t2.focus()}
else if(a==='sdel')run(sb.from('subscribers').delete().eq('id',b.dataset.id),'Subscriber removed');
else if(a==='scsv'){const u=URL.createObjectURL(new Blob(['mobile,subscribed_at\n'+SUBS.map(s=>s.mobile+','+new Date(s.t).toISOString()).join('\n')],{type:'text/csv'})),l=document.createElement('a');l.href=u;l.download='subscribers.csv';l.click();URL.revokeObjectURL(u)}
else if(a==='pst'){PS=b.dataset.k;go('pos')}
else if(a==='prn'){const t=PT[PS],l=plist(t),rs=await Promise.all(l.map((x,i)=>sb.from(t.tbl).update({[t.col]:i+1}).eq('id',x.id)));const er=rs.find(x=>x.error);if(er)return toast(er.error.message,1);toast('Renumbered · store updated');await loadAll()}
else if(a==='tadd')tabForm();else if(a==='tedit')tabForm(+b.dataset.i);else if(a==='tsv')saveTab();
else if(a==='tdel'){const t=TB[+b.dataset.i],n=P.filter(p=>p.g===t.n).length;if(n)toast('Move or delete the '+n+' product(s) in "'+t.n+'" first',1);else if(confirm('Delete the tab "'+t.n+'"?'))run(sb.from('explore_tabs').delete().eq('id',t.id),'Tab deleted')}
else if(a==='oacc')run(sb.from('orders').update({status:'accepted',accepted_at:new Date().toISOString()}).eq('id',b.dataset.oid),'Order accepted · added to Orders');
else if(a==='orej'){if(confirm('Reject order #'+b.dataset.oid+'?'))run(sb.from('orders').update({status:'rejected'}).eq('id',b.dataset.oid),'Order rejected')}
else if(a==='pw'){const er=$('#pe'),n=$('#np').value;er.textContent='';const u=(await sb.auth.getUser()).data.user;
const ck=await sb.auth.signInWithPassword({email:u.email,password:$('#cp').value});if(ck.error)return er.textContent='Current password is incorrect.';
if(n.length<6)return er.textContent='New password must be at least 6 characters.';const r=await sb.auth.updateUser({password:n});if(r.error)return er.textContent=r.error.message;$('#cp').value=$('#np').value='';toast('Password updated')}});
document.addEventListener('keydown',ev=>{if(ev.target.id==='mi'&&ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();const bt=$('[data-a="msend"]');if(bt)bt.click()}});
document.addEventListener('input',ev=>{if(ev.target.id==='q'){Q=ev.target.value;rows()}});
document.addEventListener('change',ev=>{const t=ev.target;
if(t.id==='cf'){CF=t.value;rows()}
if(t.dataset.pk){const g=PT[t.dataset.pk];run(sb.from(g.tbl).update({[g.col]:Math.max(g.min,parseInt(t.value,10)||0)}).eq('id',t.dataset.id),'Position saved · store updated')}
if(t.id==='fc'){$('#fnw').hidden=t.value!=='__new';if(!$('#fnw').hidden)$('#fcn').focus()}
if(t.dataset.os!==undefined)run(sb.from('orders').update({stage:+t.value}).eq('id',t.dataset.os),'Order status updated')});
/* boot */
(async()=>{$('#at').textContent='Admin login';
if(!sb){$('#as').textContent='Enter your username and password to continue.';$('#ae').textContent='Supabase is not connected yet. Add your project URL and anon key in assets/js/config.js, then reload.';$('#ab').disabled=true;return}
$('#as').textContent='Enter your username and password to continue.';$('#ab').textContent='Log in';
const s=await sb.auth.getSession();if(s.data.session&&await isAdmin())enter()})();
})();
