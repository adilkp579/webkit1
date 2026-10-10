/*!
 * WebKit storefront  (assets/js/app.js)
 * Plain JavaScript, no build step. Data comes from Supabase (see assets/js/config.js).
 *
 * Contents
 *   1. Helpers, data model and Supabase client
 *   2. Account session + live data (auth, orders, products, categories)
 *   3. Navigation and page sections (hero, featured, categories, products, reviews, FAQ)
 *   4. Cart (localStorage) and product view
 *   5. Search, shop page, checkout (OTP) and profile
 *   6. Scroll animations and start-up
 */

(function(){
    var $=function(s,e){return(e||document).querySelector(s)},$$=function(s,e){return[].slice.call((e||document).querySelectorAll(s))};
    var U=function(id,w){return/^(https?:|data:|\/|\.)/.test(id)?id:'https://images.unsplash.com/photo-'+id+'?auto=format&fit=crop&w='+(w||900)+'&q=80'};
    var P=[];
    var CATS=[];
    var CFG=window.WK_CONFIG||{},CT=window.WK_CONTENT||{},sb=null;try{if(CFG.SUPABASE_URL&&CFG.SUPABASE_ANON_KEY&&window.supabase)sb=window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY)}catch(e){}
    var LD=!!sb;
    try{var _d=JSON.parse(localStorage.getItem('wk_sb_cache')||'null');if(_d&&_d.p&&_d.p.length){P=_d.p;if(_d.c&&_d.c.length)CATS=_d.c}}catch(e){}
    P=P.filter(function(p){return !p.h});
    var NAV=[['Home','home'],['Categories','categories'],['Products','products'],['Best Sellers','best'],['Reviews','reviews'],['About','about'],['FAQ','faq']];
    var fmt=function(n){return'₹'+n.toLocaleString('en-IN')};
    var ic={cart:'<svg viewBox="0 0 24 24"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 016 0"/></svg>',heart:'<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.6-9 9-9 9z"/></svg>',arrow:'<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>'};
    var stars=function(r,c){return'<div class="st">'+'★'.repeat(Math.round(r))+'<span style="color:#ddd">'+'★'.repeat(5-Math.round(r))+'</span><small>'+r+(c?' ('+c+')':'')+'</small></div>'};
    var toast=function(t){var e=$('#ts');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(function(){e.classList.remove('show')},2200)};
    var store=function(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k));localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}};
    var cart=store('wk_cart')||[],favs=store('wk_fav')||[];
    var byId=function(id){return P.filter(function(p){return p.id==id})[0]};
    var img=function(p,w){return'<img loading="lazy" src="'+U(p.i,w)+'" alt="'+p.n+'" onerror="this.style.visibility=\'hidden\'">'};
    function card(p,o){var so=p.s===false;return'<article class="card" data-open="'+p.id+'">'+img(p,1000)+(so?'<span class="tag">SOLD OUT</span>':'')+'<div class="ov2"><div class="ac"><div class="info'+(so?' off':'')+'"><b class="in1">'+esc0(p.n)+'</b><span class="in2"><strong>'+fmt(p.p)+'</strong>'+(p.o?'<s>'+fmt(p.o)+'</s>':'')+'<i>\u2605 '+p.r+'</i></span></div><button class="fav cartb'+(cart.some(function(c){return c.id==p.id})?' in':'')+'" data-add="'+p.id+'"'+(so?' disabled':'')+' aria-label="Add to cart">'+ic.cart+'</button></div></div></article>'}
    /* nav */
    $('#menu').innerHTML=NAV.map(function(n){return'<a href="#'+n[1]+'" data-s="'+n[1]+'">'+n[0]+'</a>'}).join('');
    $('#mm').innerHTML=NAV.map(function(n){return'<a href="#'+n[1]+'">'+n[0]+'</a>'}).join('');
    var hd=$('#hd');
    function onScroll(){hd.classList.toggle('sc',scrollY>30);hd.classList.toggle('top',scrollY<=30)}
    addEventListener('scroll',onScroll,{passive:true});onScroll();
    function mm(o){$('#mnt').textContent=o?'CLOSE':'MENU';$('#mm').classList.toggle('open',o);document.body.classList.toggle('lock',o);document.body.classList.toggle('mmo',o);$('#bgi').innerHTML=o?'<path d="M6 6l12 12M18 6L6 18"/>':'<path d="M4 8h16M4 16h16"/>'}
    $('#bg').onclick=function(){mm(!$('#mm').classList.contains('open'))};
    $('#mnu').onclick=$('#bg').onclick;
    /* hero: rotating card, live time, optional photo */
    var HS=['Shop smart,<br>live better.','Free delivery<br>over \u20b9999.','Cash on delivery<br>available.'],hsI=0,hsT;
    function hgo(d){hsI=(hsI+d+HS.length)%HS.length;$('#hst').innerHTML=HS[hsI];$('#hsn').textContent='0'+(hsI+1);var p=$('#hsp');p.style.transition='none';p.style.width='0';void p.offsetWidth;p.style.transition='width 4s linear';p.style.width='100%'}
    function hauto(){clearInterval(hsT);hsT=setInterval(function(){hgo(1)},4000)}
    $('#hsl').onclick=function(){hgo(-1);hauto()};$('#hsr').onclick=function(){hgo(1);hauto()};hgo(0);hauto();
    function tick(){var d=new Date();$('#tzv').textContent=d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}).replace(/\s/g,'').toLowerCase()+' \u2022 '+d.getDate()+' '+d.toLocaleString('en-US',{month:'long'})+', '+d.getFullYear()}
    tick();setInterval(tick,30000);
    /* hero background word: always fits the screen width */
    function fitBig(){var b=$('.h-big'),s=b&&b.firstElementChild,h=$('#home');if(!s||!h)return;s.style.display='inline-block';b.style.fontSize='100px';var w=s.getBoundingClientRect().width;if(w)b.style.fontSize=Math.min(430,100*h.clientWidth*0.96/w)+'px'}
    fitBig();addEventListener('resize',fitBig);addEventListener('load',fitBig);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitBig);
    if(window.WK_CONFIG&&WK_CONFIG.HERO_IMAGE){$('#hfig').outerHTML='<img class="h-fig" id="hfig" src="'+WK_CONFIG.HERO_IMAGE+'" alt="">'}
    $('#mm').onclick=function(e){if(e.target.tagName=='A')mm(false)};
    addEventListener('resize',function(){if(innerWidth>899)mm(false)});
    var secs=NAV.map(function(n){return $('#'+n[1])});
    var spy=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)$$('.menu a').forEach(function(a){a.classList.toggle('on',a.dataset.s==e.target.id)})})},{rootMargin:'-45% 0px -50% 0px'});
    secs.forEach(function(s){spy.observe(s)});
    /* featured / best / categories */
    
    
    var esc0=function(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};var cnt=function(c){return P.filter(function(p){return p.c==c}).length};
    
    /* filter */
    var cur='All',fl=$('#flt'),pill=null,TABS=[];
    try{var _t=JSON.parse(localStorage.getItem('wk_sb_cache')||'null');if(_t&&_t.t)TABS=_t.t}catch(e){}
    function buildTabs(){if(cur!='All'&&TABS.indexOf(cur)<0)cur='All';fl.innerHTML='<span class="pill"></span>'+['All'].concat(TABS).map(function(c){return'<button data-f="'+esc0(c)+'"'+(c==cur?' class="on"':'')+'>'+esc0(c)+'</button>'}).join('');pill=$('.pill',fl);var fs=$('#fshop');if(fs)fs.innerHTML=TABS.map(function(c){return'<li><a href="#" data-f="'+esc0(c)+'">'+esc0(c)+'</a></li>'}).join('')+'<li><a href="#best">Best Sellers</a></li><li><a href="#" data-f="All">New Arrivals</a></li>';mp()}
    function mp(){var b=$('button.on',fl);if(b&&pill){pill.style.left=b.offsetLeft+'px';pill.style.width=b.offsetWidth+'px'}}
    var SK='<div class="sk"></div><div class="sk"></div><div class="sk"></div>';
    function emptyNote(){return LD&&!P.length?SK:'<p class="note0">'+(sb?'No products here yet. Please check back soon.':'The store is not connected yet. Add your Supabase keys in assets/js/config.js.')+'</p>'}
    function render(){var l=P.filter(function(p){return p.ex!==false&&(cur=='All'||p.g==cur)}).sort(byPos('pe'));$('#pgrid').innerHTML=l.length?l.map(function(p){return card(p)}).join(''):emptyNote();obs()}
    function setF(c,go){if(c==cur&&!go)return;cur=c;$$('button',fl).forEach(function(b){b.classList.toggle('on',b.dataset.f==c)});mp();var g=$('#pgrid');g.classList.add('out');setTimeout(function(){render();g.classList.remove('out')},250);if(go)goTo('products')}
    function goTo(id){var e=$('#'+id);scrollTo({top:e.getBoundingClientRect().top+scrollY-(id=='products'?60:0),behavior:'smooth'})}
    document.addEventListener('click',function(e){
    var th=e.target.closest('[data-th]');if(th){$('#pimg').src=U(th.dataset.th,1200);$$('.thumbs img').forEach(function(x){x.classList.toggle('on',x==th)});return}
    var ct=e.target.closest('[data-cat]');if(ct){openShop(ct.dataset.cat);return}
    var f=e.target.closest('[data-f]');if(f){e.preventDefault();setF(f.dataset.f,!f.closest('#flt'));return}
    var s=e.target.closest('[data-shop]');if(s){e.preventDefault();openShop('All');return}
    var sc=e.target.closest('[data-sc]');if(sc){SC=sc.dataset.sc;$$('#spb button').forEach(function(b){b.classList.toggle('on',b.dataset.sc==SC)});mpS();var ff=$('#spb .filters');ff.scrollTo({left:sc.offsetLeft-(ff.clientWidth-sc.offsetWidth)/2,behavior:'smooth'});rspg();$('#sp').scrollTop=0;return}
    if(e.target.closest('header a[href^="#"]')&&$('#sp').classList.contains('open'))closeAll();
    var fv=e.target.closest('[data-fav]');if(fv){e.stopPropagation();var id=+fv.dataset.fav,k=favs.indexOf(id);k>-1?favs.splice(k,1):favs.push(id);store('wk_fav',favs);$$('[data-fav="'+id+'"]').forEach(function(b){b.classList.toggle('on',k<0)});toast(k<0?'Added to favorites':'Removed from favorites');return}
    var a=e.target.closest('[data-add]');if(a){e.stopPropagation();add(+a.dataset.add,1);a.classList.add('done');setTimeout(function(){a.classList.remove('done')},1300);return}
    var by=e.target.closest('[data-buy]');if(by){e.stopPropagation();add(+by.dataset.buy,1);open($('#dr'));return}
    var o=e.target.closest('[data-open]');if(o){location.hash='p-'+o.dataset.open;return}
    if(e.target.closest('[data-close]')||e.target.id=='ov')closeTop();
    });
    /* cart */
    function save(){store('wk_cart',cart);drawCart()}
    function add(id,q){var it=cart.filter(function(c){return c.id==id})[0];it?it.q+=q:cart.push({id:id,q:q});save();var b=$('#cn');b.classList.add('pop');setTimeout(function(){b.classList.remove('pop')},300);toast(byId(id).n+' added to cart')}
    function drawCart(){var n=0,t=0;cart=cart.filter(function(c){return byId(c.id)});
    $('#ci').innerHTML=cart.length?cart.map(function(c){var p=byId(c.id);n+=c.q;t+=c.q*p.p;return'<div class="ci"><img src="'+U(p.i,200)+'" alt="'+p.n+'" onerror="this.style.visibility=\'hidden\'"><div><b>'+p.n+'</b><small>'+fmt(p.p)+'</small><div class="q"><button data-q="'+p.id+'" data-d="-1" aria-label="Decrease">−</button><span>'+c.q+'</span><button data-q="'+p.id+'" data-d="1" aria-label="Increase">+</button></div></div><div><b>'+fmt(p.p*c.q)+'</b><button class="rm" data-rm="'+p.id+'">Remove</button></div></div>'}).join(''):'<div class="empty">Your cart is empty.</div>';
    $('#cn').textContent=n;$('#sub').textContent=fmt(t);$$('.cartb').forEach(function(x){x.classList.toggle('in',cart.some(function(c){return c.id==x.dataset.add}))})}
    $('#ci').onclick=function(e){var q=e.target.closest('[data-q]'),r=e.target.closest('[data-rm]');
    if(q){var it=cart.filter(function(c){return c.id==q.dataset.q})[0];it.q+=+q.dataset.d;if(it.q<1)cart=cart.filter(function(c){return c!=it});save()}
    if(r){cart=cart.filter(function(c){return c.id!=r.dataset.rm});save()}};
    $('#chk').onclick=function(){if(!cart.length)return toast('Add something to your cart first.');checkout()};
    function open(el){var wasSp=$('#sp').classList.contains('open');closeAll(1);if(wasSp&&(el.id=='dr'||el.id=='so'||el.id=='chat'))$('#sp').classList.add('open');el.classList.add('open');if(!el.classList.contains('pv')&&el.id!='so')$('#ov').classList.add('open');document.body.classList.add('lock')}
    function closeAll(keep){['dr','so','pv','co','pp','sp','chat','ov'].forEach(function(i){$('#'+i).classList.remove('open')});if(!keep){document.body.classList.remove('lock');if(/^#p-/.test(location.hash))history.replaceState(null,'',location.pathname+location.search)}}
    $('#cb').onclick=function(){open($('#dr'))};
    $('#pf').onclick=function(){PL={sent:false,m:'',otp:''};rpp();open($('#pp'))};
    document.addEventListener('keydown',function(e){if(e.key=='Escape')closeTop()});
    /* product view */
    var HL=['Quality-checked before dispatch','Secure packaging with tracked delivery','7-day easy returns'];
    var PR=CT.productReviews||[];
    var T={s:'<svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',r:'<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0114-5M20 12a8 8 0 01-14 5"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>',t:'<svg viewBox="0 0 24 24"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="1.8"/><circle cx="17" cy="17" r="1.8"/></svg>',b:'<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/></svg>'};
    function dd(n){var d=new Date();d.setDate(d.getDate()+n);return d.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}
    function relHtml(p){return P.filter(function(x){return x.c==p.c&&x.id!=p.id}).concat(P.filter(function(x){return x.c!=p.c}).sort(function(a,b){return b.r-a.r})).slice(0,3).map(function(x){return card(x)}).join('')}
    function view(id){var p=byId(id);if(!p)return;var ims=p.ims&&p.ims.length?p.ims:[p.i];SPB=$('#sp').classList.contains('open')?1:($('#pv').classList.contains('open')?SPB:0);
    $('#pvg').innerHTML='<div class="pi"><img id="pimg" src="'+U(ims[0],1200)+'" alt="'+p.n+'" onerror="this.style.visibility=\'hidden\'">'+(ims.length>1?'<div class="thumbs">'+ims.map(function(u,k){return'<img class="'+(k?'':'on')+'" data-th="'+esc0(u)+'" src="'+U(u,200)+'" alt="">'}).join('')+'</div>':'')+'</div><div><div class="crumb">Home / '+p.c+' / '+p.n+'</div><span class="cat">'+p.c+'</span><h2>'+p.n+'</h2><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">'+stars(p.r,p.rc)+'<span class="vp">✓ Verified Purchase reviews</span></div><div class="pr" style="margin-top:16px"><b>'+fmt(p.p)+'</b>'+(p.o?'<s>'+fmt(p.o)+'</s><span class="dsc">Save '+Math.round((1-p.p/p.o)*100)+'%</span>':'')+'</div><small style="color:var(--mut)">Inclusive of all taxes</small><div class="pva" style="margin-top:18px"><div class="q" style="margin:0"><button id="qm" aria-label="Decrease">−</button><span id="qv">1</span><button id="qp" aria-label="Increase">+</button></div><button class="btn btn-d" id="pb" style="flex:1"'+(p.s===false?' disabled':'')+'>Buy Now</button><button class="btn btn-l" id="pa" aria-label="Add to cart" style="width:52px;padding:0"'+(p.s===false?' disabled':'')+'>'+ic.cart+'</button></div><div class="stk'+(p.s===false?' out':'')+'">'+(p.s===false?'Currently out of stock':'In stock · ready to ship')+'</div><p class="desc">'+p.d+'</p><ul class="hls">'+HL.map(function(h){return'<li>'+h+'</li>'}).join('')+'</ul><div class="dl"><b>Estimated delivery:</b> '+dd(7)+' – '+dd(9)+'<br><span style="color:var(--mut)">'+(p.p>=999?'Free delivery on this order':'Free delivery on orders above ₹999')+'</span></div><div class="tg"><div>'+T.s+'<span><b>Secure payments</b>Cash on delivery</span></div><div>'+T.r+'<span><b>7-day easy returns</b>No questions asked</span></div><div>'+T.t+'<span><b>Fast shipping</b>Tracked to your door</span></div><div>'+T.b+'<span><b>100% genuine</b>Quality checked</span></div></div></div>';
    var rh=relHtml(p);$('#rel').innerHTML='<div class="tr"><div><b>10K+</b><span>Happy customers</span></div><div><b>4.9/5</b><span>Average rating</span></div><div><b>100%</b><span>Genuine products</span></div><div><b>7 days</b><span>Easy returns</span></div></div>'+(PR.length?'<h3>Customer reviews</h3><div class="rvw">'+PR.map(function(v){return'<div class="rc">'+stars(v[2],0)+'<p>“'+v[1]+'”</p><div class="who"><div class="av">'+v[0][0]+'</div><div><b>'+v[0]+'</b><span class="vp">✓ Verified Purchase</span></div></div></div>'}).join('')+'</div>':'')+(rh?'<h3>You may also like</h3><div class="grid hs">'+rh+'</div>':'');
    var q=1,qv=$('#qv');$('#qm').onclick=function(){q=Math.max(1,q-1);qv.textContent=q};$('#qp').onclick=function(){q=Math.min(20,q+1);qv.textContent=q};
    $('#pa').onclick=function(){add(p.id,q)};$('#pb').onclick=function(){add(p.id,q);location.hash='';open($('#dr'))};
    open($('#pv'));$('#pv').scrollTop=0}
    $('#pvx').onclick=function(){var b=SPB;SPB=0;closeAll();if(/^#p-/.test(location.hash))history.back();if(b)open($('#sp'))};
    function route(){var m=/^#p-(\d+)$/.exec(location.hash);m?view(+m[1]):($('#pv').classList.contains('open')&&closeAll(1),$('#pv').classList.remove('open'),!$('#dr').classList.contains('open')&&!$('#so').classList.contains('open')&&!$('#sp').classList.contains('open')&&document.body.classList.remove('lock'))}
    addEventListener('hashchange',route);
    /* search */
    $('#sb').onclick=function(){open($('#so'));$('#si').value='';sr('');setTimeout(function(){$('#si').focus()},300)};
    function sr(v){v=v.trim().toLowerCase();var l=v?P.filter(function(p){return(p.n+' '+p.c+' '+p.g).toLowerCase().indexOf(v)>-1}):P.slice(0,3);
    $('#sr').innerHTML=l.length?l.map(function(p){return card(p)}).join(''):'<p style="color:var(--mut);font-size:18px">No products found.</p>'}
    $('#si').oninput=function(){sr(this.value)};
    /* reviews */
    var R=CT.reviews||[];$('#reviews').hidden=!R.length;
    var ri=0,paused=false,RN=R.length,ICO='<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.6-9 9-9 9z"/></svg><svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/></svg><svg viewBox="0 0 24 24"><path d="M21 3L3 10l7 3 3 7z"/><path d="M21 3L10 13"/></svg>';
    $('#rcards').innerHTML=R.map(function(r){return'<div class="rk"><div class="rh"><span class="qm2">\u201C</span><div class="av">'+r[0][0]+'</div><div><b>'+r[0]+'</b><small>Verified Purchase</small></div></div><div class="stz">'+'\u2605'.repeat(r[2])+'</div><p>'+r[1]+'</p><div class="rf">'+ICO+'</div></div>'}).join('');
    function setR(){$$('.rk').forEach(function(el,i){var d=(i-ri+RN)%RN;el.className='rk'+(d==0?' c':d==1?' r':d==RN-1?' l':'')})}
    function slide(d){ri=(ri+d+RN)%RN;setR()}
    setR();
    $('#rn').onclick=function(){slide(1)};$('#rp').onclick=function(){slide(-1)};
    var rs=$('#rst'),tx=0;rs.onmouseenter=function(){paused=true};rs.onmouseleave=function(){paused=false};
    rs.addEventListener('touchstart',function(e){paused=true;tx=e.touches[0].clientX},{passive:true});
    rs.addEventListener('touchend',function(e){var d=e.changedTouches[0].clientX-tx;if(Math.abs(d)>40)slide(d<0?1:-1);setTimeout(function(){paused=false},4000)},{passive:true});
    setInterval(function(){if(!paused&&!document.hidden)slide(1)},4500);
    /* faq */
    var Q=CT.faq||[];
    $('#fqs').innerHTML=Q.map(function(q,i){return'<div class="fq rv" data-a="up" style="--d:'+i*.06+'s"><button aria-expanded="false">'+q[0]+ic.plus+'</button><div class="fa"><p>'+q[1]+'</p></div></div>'}).join('');
    $('#fqs').onclick=function(e){var b=e.target.closest('button');if(!b)return;var it=b.parentNode,o=it.classList.contains('open');$$('.fq',this).forEach(function(x){x.classList.remove('open');$('.fa',x).style.maxHeight=0;$('button',x).setAttribute('aria-expanded','false')});if(!o){it.classList.add('open');var a=$('.fa',it);a.style.maxHeight=a.scrollHeight+'px';b.setAttribute('aria-expanded','true')}};
    /* subscribe */
    function subm(){var v=$('#mob').value.replace(/[\s-]/g,''),m=$('#msg');m.className='msg';void m.offsetWidth;
    var d=v.length>10?v.replace(/^(?:\+91|91|0)/,''):v;
    if(!/^[6-9]\d{9}$/.test(d)){m.className='msg err';m.textContent='Please enter a valid 10-digit Indian mobile number.';return}
    if(!sb){m.className='msg err';m.textContent='Subscriptions are not available right now. Please try again later.';return}
    var b=$('#sbt');b.disabled=true;
    sb.from('subscribers').upsert({mobile:d},{onConflict:'mobile',ignoreDuplicates:true}).then(function(r){b.disabled=false;if(r.error){m.className='msg err';m.textContent='Could not subscribe. Please try again.';return}m.className='msg ok';m.textContent='\ud83c\udf89 You\'re subscribed! Watch out for exciting updates.';$('#mob').value=''})}
    $('#sbt').onclick=subm;$('#mob').onkeydown=function(e){if(e.key=='Enter')subm()};
    /* featured auto-rotate */
    var ft=$('#fg'),fpz=false,fid;
    function fhold(){fpz=true;clearTimeout(fid);fid=setTimeout(function(){fpz=false},4500)}
    ['touchstart','wheel','pointerdown','keydown'].forEach(function(ev){ft.addEventListener(ev,fhold,{passive:true})});
    ft.addEventListener('mouseenter',function(){fpz=true;clearTimeout(fid)});ft.addEventListener('mouseleave',fhold);
    setInterval(function(){if(fpz||document.hidden)return;var rc=ft.getBoundingClientRect();if(rc.bottom<0||rc.top>innerHeight)return;var c=$('.card',ft);if(!c)return;var w=c.offsetWidth+(parseFloat(getComputedStyle(ft).columnGap)||0);if(ft.scrollLeft+ft.clientWidth>=ft.scrollWidth-8)ft.scrollTo({left:0,behavior:'smooth'});else ft.scrollBy({left:w,behavior:'smooth'})},3200);
    /* shop page */
    var SC='All',SPB=0,SCATS=['All','Electronics','Kitchen','Fashion','Accessories','Footwear','Books','Beauty'];
    function rspg(){var l=P.filter(function(p){return SC=='All'||p.c==SC}).sort(byPos('ps'));$('#spn').textContent=l.length+' product'+(l.length==1?'':'s');$('#spg').innerHTML=l.length?l.map(function(p){return card(p)}).join(''):emptyNote()}
    function rsp(){SCATS=['All'].concat(CATS.map(function(c){return c.n}).concat(P.map(function(p){return p.c})).filter(function(c,i,a){return a.indexOf(c)==i&&P.some(function(p){return p.c==c})}));$('#spb').innerHTML='<div class="filters"><span class="pill"></span>'+SCATS.map(function(c){var n=c=='All'?P.length:P.filter(function(p){return p.c==c}).length;return'<button data-sc="'+c+'" class="'+(c==SC?'on':'')+'">'+c+' <small>'+n+'</small></button>'}).join('')+'</div>';rspg();mpS()}
    function mpS(){var f=$('#spb .filters');if(!f)return;var b=$('button.on',f),p=$('.pill',f);if(b&&p){p.style.left=b.offsetLeft+'px';p.style.width=b.offsetWidth+'px'}}
    addEventListener('resize',mpS);
    function openShop(c){SC=c||'All';rsp();open($('#sp'));$('#sp').scrollTop=0;mpS()}
    function closeTop(){if($('#sp').classList.contains('open')&&($('#dr').classList.contains('open')||$('#so').classList.contains('open')||$('#chat').classList.contains('open'))){['dr','so','chat','ov'].forEach(function(i){$('#'+i).classList.remove('open')})}else closeAll()}
    /* account session + live data (Supabase) */
    var RM='',RUID='',RPROF=null,RORD=[],MSGS=[],RLOAD=false,_dt;
    var sess=function(){return RM||null},profOf=function(m){return m&&m==RM?RPROF:null};
    function deb(f){clearTimeout(f._t);f._t=setTimeout(f,400)}
    function mapO(r){return{id:r.id,t:Date.parse(r.created_at),at:r.accepted_at?Date.parse(r.accepted_at):null,ac:r.status=='pending'?0:r.status=='rejected'?-1:1,st:r.stage,trk:r.tracking_id,pay:r.payment,sub:+r.subtotal,sh:+r.shipping,tot:+r.total,a:r.address,items:r.items}}
    function byPos(k){return function(a,b){return(a[k]||0)-(b[k]||0)||a.id-b.id}}
    function mapP(r){return{id:r.id,n:r.name,c:r.category,g:r.audience,p:+r.price,o:+r.old_price||0,r:+r.rating,rc:r.reviews,i:r.image,ims:r.images&&r.images.length?r.images:[r.image],d:r.description||'',feat:r.featured,best:r.best_seller,s:r.in_stock,ex:r.in_explore!==false,pe:r.pos_explore||0,ps:r.pos_shop||0,pf:r.pos_featured||0,pb:r.pos_best||0}}
    function authSet(s){var u=s&&s.user,m=u&&u.phone?String(u.phone).replace(/^\+?91/,''):'';RUID=u?u.id:'';if(m!==RM){RM=m;RPROF=null;RORD=[];MSGS=[];RLOAD=false}if(RM)loadAcct();chatUI();if($('#pp').classList.contains('open'))rpp()}
    function loadAcct(){if(!sb||!RM)return;Promise.all([sb.from('profiles').select('*').eq('user_id',RUID).maybeSingle(),sb.from('orders').select('*').eq('user_id',RUID).order('created_at',{ascending:false}),sb.from('messages').select('*').eq('user_id',RUID).order('created_at')]).then(function(x){var p=x[0].data;RPROF=p?{name:p.name,m:p.mobile,m2:p.mobile2,email:p.email,a:p.address,since:Date.parse(p.created_at)}:null;RORD=(x[1].data||[]).map(mapO);MSGS=x[2].data||[];RLOAD=true;chatUI();if($('#pp').classList.contains('open'))rpp()}).catch(function(){})}
    /* messages (customer <-> store) */
    function tmf(t){return new Date(t).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}
    function unreadN(){return MSGS.filter(function(m){return m.sender=='admin'&&!m.customer_read}).length}
    function chatUI(){var show=!!RM&&(RORD.length>0||MSGS.length>0),u=unreadN();$('#mb').hidden=!show;$('#mbn').textContent=u;$('#mbn').hidden=!u;if($('#chat').classList.contains('open'))rchat()}
    function rchat(){var b=$('#cm');b.innerHTML=MSGS.length?MSGS.map(function(m){return'<div class="bb '+(m.sender=='customer'?'me':'ad')+'"><span>'+esc(m.body)+'</span><small>'+tmf(m.created_at)+'</small></div>'}).join(''):'<div class="empty">No messages yet. We will message you here about your order.</div>';b.scrollTop=b.scrollHeight}
    function markRead(){if(!unreadN())return;sb.rpc('mark_messages_read').then(function(){MSGS.forEach(function(m){if(m.sender=='admin')m.customer_read=true});chatUI()})}
    function loadMsgs(){if(!sb||!RM)return;var n0=MSGS.filter(function(m){return m.sender=='admin'}).length;sb.from('messages').select('*').eq('user_id',RUID).order('created_at').then(function(r){if(r.error)return;MSGS=r.data||[];var n1=MSGS.filter(function(m){return m.sender=='admin'}).length;var op=$('#chat').classList.contains('open');if(n1>n0&&!op)toast('New message from WebKit');chatUI();if(op)markRead()})}
    function sendMsg(){var t=$('#cmi'),b=t.value.trim();if(!b||!sb||!RUID)return;$('#cms').disabled=true;sb.from('messages').insert({user_id:RUID,sender:'customer',body:b}).select('*').single().then(function(r){$('#cms').disabled=false;if(r.error){toast('Could not send. Please try again.');return}MSGS.push(r.data);t.value='';rchat()})}
    $('#mb').onclick=function(){open($('#chat'));rchat();markRead()};
    $('#cms').onclick=sendMsg;$('#cmi').onkeydown=function(e){if(e.key=='Enter'&&!e.shiftKey){e.preventDefault();sendMsg()}};
    function sbLoad(){if(!sb)return;Promise.all([sb.from('products').select('*').order('id'),sb.from('categories').select('*').order('sort').order('id'),sb.from('explore_tabs').select('*').order('sort').order('id')]).then(function(x){if(x[0].error||x[1].error){LD=false;paint();return}if(!x[2].error)TABS=x[2].data.map(function(t){return t.name});LD=false;P=x[0].data.map(mapP);var nc=x[1].data.map(function(c){return{n:c.name,img:c.image,h:c.home_order}});CATS=nc;try{localStorage.setItem('wk_sb_cache',JSON.stringify({p:P,c:CATS,t:TABS}))}catch(e){}paint();if($('#sp').classList.contains('open'))rsp();if(/^#p-/.test(location.hash))route()}).catch(function(){LD=false;paint()})}
    /* checkout + profile */
    var CO={},ST=['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal','Other state / UT'];
    var esc=function(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
    var fd=function(ts){return new Date(ts).toLocaleDateString('en-IN',{day:'numeric',month:'short'})};
    var MOB=/^[6-9]\d{9}$/,TOT=function(){var sub=0;cart.forEach(function(c){sub+=c.q*byId(c.id).p});var sh=sub>=999?0:49;return{sub:sub,sh:sh,tot:sub+sh}};
    function stp(n){return'<div class="stp">'+['Verify','Details','Confirm'].map(function(l,i){return'<div class="'+(i+1<=n?'on':'')+'"><i>'+(i+1<n?'✓':i+1)+'</i>'+l+'</div>'}).join('<hr>')+'</div>'}
    function F(id,l,v,a){return'<label class="f">'+l+'<input id="'+id+'" value="'+esc(v)+'" '+(a||'')+'><em class="fe"></em></label>'}
    function chk(id,ok,msg){var l=$('#'+id).closest('.f');l.classList.toggle('bad',!ok);$('.fe',l).textContent=ok?'':msg;return ok}
    function checkout(){var m=sess();CO={s:m?2:1,sent:false,m:m||''};rco();open($('#co'));$('#co').scrollTop=0}
    function rco(){var h,pf=profOf(CO.m)||{},a=pf.a||{},t=TOT();
    if(CO.s==1){h='<div class="cw one">'+stp(1)+'<div class="cbx"><h2>Verify your mobile number</h2><p class="sm">'+(CO.sent?'Enter the 6-digit OTP sent to +91 '+esc(CO.m):'We will send a 6-digit OTP to confirm your number.')+'</p>'+
    (CO.sent?'<label class="f">One-time password<input id="cko" class="otp" inputmode="numeric" data-num="6" autocomplete="one-time-code" placeholder="••••••"></label><button class="btn btn-d" data-act="verify">Verify &amp; Continue</button><button class="lnk" data-act="resend">Resend OTP</button><button class="lnk" data-act="chg">Change number</button>':
    '<label class="f">Mobile number<div class="fld"><span>+91</span><input id="ckm" type="tel" inputmode="numeric" data-num="10" value="'+esc(CO.m)+'" placeholder="Enter 10-digit number"></div></label><button class="btn btn-d" data-act="send">Send OTP</button>')+
    '<div class="fe" id="coe" style="margin-top:12px;text-align:center"></div></div></div>'}
    else if(CO.s==2){h='<div class="cw two"><div class="cbx"><h2>Delivery details</h2><p class="sm">Verified number: +91 '+esc(CO.m)+' ✓</p><h3 style="margin-top:0">Contact</h3>'+F('ckn','Full name',pf.name,'autocomplete="name"')+F('cke','Email address',pf.email,'type="email" autocomplete="email"')+'<div class="fr">'+F('ck1','Mobile number (verified)',CO.m,'readonly')+F('ck2','Alternate mobile number',pf.m2,'type="tel" inputmode="numeric" data-num="10" placeholder="10-digit number"')+'</div><h3>Delivery address</h3>'+F('cka','House / Flat no., Building',a.a1)+F('ckb','Street, Area, Locality',a.a2)+F('ckl','Landmark (optional)',a.l)+'<div class="fr">'+F('ckc','City / Town',a.c)+F('ckp','PIN code',a.p,'inputmode="numeric" data-num="6"')+'</div><label class="f">State<select id="cks"><option value="">Select state</option>'+ST.map(function(x){return'<option'+(a.s==x?' selected':'')+'>'+x+'</option>'}).join('')+'</select><em class="fe"></em></label><h3>Payment method</h3><div class="cod"><i></i><div><b>Cash on Delivery</b><span>Pay in cash when your order arrives</span></div></div><button class="btn btn-d" data-act="place">Place Order · '+fmt(t.tot)+'</button></div>'+
    '<div class="cbx sumb"><h2 style="font-size:20px;margin-bottom:18px">Order summary</h2>'+cart.map(function(c){var p=byId(c.id);return'<div class="sl"><img src="'+U(p.i,200)+'" alt="" onerror="this.style.visibility=\'hidden\'"><b>'+p.n+'<br><small style="color:var(--mut);font-weight:400">Qty '+c.q+'</small></b><span>'+fmt(p.p*c.q)+'</span></div>'}).join('')+'<div class="tt"><span>Subtotal</span><span>'+fmt(t.sub)+'</span></div><div class="tt"><span>Delivery</span><span>'+(t.sh?fmt(t.sh):'Free')+'</span></div><div class="tt g"><span>Pay on delivery</span><span>'+fmt(t.tot)+'</span></div></div></div>'}
    else{var o=CO.o;h='<div class="cw one">'+stp(3)+'<div class="cbx" style="text-align:center"><div class="ok"><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg></div><h2>Order placed!</h2><p class="sm">Thank you, '+esc(o.a.name)+'. Your order <b>#'+o.id+'</b> has been placed and is awaiting confirmation from the store.<br>Pay '+fmt(o.tot)+' in cash on delivery. Expected by '+fd(o.t+3*864e5)+' – '+fd(o.t+5*864e5)+'.</p><div class="demo" style="background:#e6f4ea;border-color:#bfe3cb;color:#1e7a43">Your profile has been created with your name and mobile number.</div><button class="btn btn-d" data-act="track">Track Order in Profile</button><button class="lnk" data-act="shop">Continue shopping</button></div></div>'}
    $('#cof').innerHTML=h}
    function numIn(e){var n=+e.target.dataset.num;if(!n)return;var v=e.target.value.replace(/\D/g,'');if(n==10&&v.length>10&&v.slice(0,2)=='91')v=v.slice(2);e.target.value=v.slice(0,n)}
    $('#co').addEventListener('input',numIn);$('#pp').addEventListener('input',numIn);
    $('#co').addEventListener('click',function(e){var b=e.target.closest('[data-act]');if(!b)return;var a=b.dataset.act,er=$('#coe');
    if(a=='send'||a=='resend'){var m=a=='send'?$('#ckm').value:CO.m;if(!MOB.test(m)){er.textContent='Please enter a valid 10-digit Indian mobile number.';return}if(!sb){er.textContent='Ordering is not available right now. Please try again later.';return}b.disabled=true;sb.auth.signInWithOtp({phone:'+91'+m}).then(function(r){b.disabled=false;if(r.error){er.textContent=r.error.message||'Could not send the OTP.';return}CO.m=m;CO.sent=true;rco();if(a=='resend')toast('New OTP sent')})}
    else if(a=='chg'){CO.sent=false;rco()}
    else if(a=='verify'){var tk=$('#cko').value;if(tk.length!=6){er.textContent='Enter the 6-digit OTP.';return}b.disabled=true;sb.auth.verifyOtp({phone:'+91'+CO.m,token:tk,type:'sms'}).then(function(r){b.disabled=false;if(r.error){er.textContent='Incorrect or expired OTP. Please try again.';return}CO.s=2;rco();$('#co').scrollTop=0})}
    else if(a=='place')place();
    else if(a=='track'){rpp();open($('#pp'))}
    else if(a=='shop')closeAll()});
    function place(){var g=function(i){return $('#'+i).value.trim()},m1=CO.m,m2=g('ck2'),em=g('cke');
    var ok=[chk('ckn',g('ckn').length>=2,'Enter your full name'),chk('cke',/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em),'Enter a valid email address'),chk('ck2',MOB.test(m2)&&m2!=m1,MOB.test(m2)?'Alternate number must be different':'Enter a valid 10-digit number'),chk('cka',g('cka').length>=3,'Enter house / flat details'),chk('ckb',g('ckb').length>=3,'Enter street / area'),chk('ckc',g('ckc').length>=2,'Enter your city'),chk('cks',!!$('#cks').value,'Select your state'),chk('ckp',/^[1-9]\d{5}$/.test(g('ckp')),'Enter a valid 6-digit PIN code')];
    if(ok.indexOf(false)>-1){var f=$('.f.bad input,.f.bad select');f&&f.focus();return}
    if(!cart.length)return toast('Your cart is empty.');
    var a={name:g('ckn'),email:em,m1:m1,m2:m2,a1:g('cka'),a2:g('ckb'),l:g('ckl'),c:g('ckc'),s:$('#cks').value,p:g('ckp')};
    if(!sb||!RUID)return toast('Please verify your mobile number again.');
    var btn=$('[data-act="place"]'),lbl=btn.textContent;btn.disabled=true;btn.textContent='Placing order…';
    sb.from('profiles').upsert({user_id:RUID,name:a.name,mobile:m1,mobile2:m2,email:em,address:{a1:a.a1,a2:a.a2,l:a.l,c:a.c,s:a.s,p:a.p}}).then(function(r){if(r.error)throw r.error;return sb.from('orders').insert({address:a,items:cart.map(function(c){return{id:c.id,q:c.q}})}).select('*').single()}).then(function(r){if(r.error)throw r.error;CO.o=mapO(r.data);cart=[];save();CO.s=3;rco();$('#co').scrollTop=0;loadAcct()}).catch(function(err){btn.disabled=false;btn.textContent=lbl;toast(/Invalid item/.test((err&&err.message)||'')?'Some items are unavailable. Please review your cart.':'Could not place the order. Please try again.')})}
    var SL=['Order Placed','Packed','Shipped','Out for Delivery','Delivered'],TH=[0,2,24,72,96];
    var PL={sent:false,m:'',otp:''};
    function rpp(){var m=sess(),h;
    if(!m){h='<div class="cw one"><div class="cbx"><h2>Log in</h2><p class="sm">'+(PL.sent?'Enter the 6-digit OTP sent to +91 '+esc(PL.m):'Enter your mobile number to access your profile, orders and tracking.')+'</p>'+(PL.sent?'<label class="f">One-time password<input id="plo" class="otp" inputmode="numeric" data-num="6" autocomplete="one-time-code" placeholder="••••••"></label><button class="btn btn-d" data-pl="verify">Verify &amp; Log in</button><button class="lnk" data-pl="resend">Resend OTP</button><button class="lnk" data-pl="chg">Change number</button>':'<label class="f">Mobile number<div class="fld"><span>+91</span><input id="plm" type="tel" inputmode="numeric" data-num="10" value="'+esc(PL.m)+'" placeholder="Enter 10-digit number"></div></label><button class="btn btn-d" data-pl="send">Send OTP</button>')+'<div class="fe" id="ple" style="margin-top:12px;text-align:center"></div><p class="sm" style="margin:18px 0 0;text-align:center">New here? Your profile is created automatically when you place your first order.</p></div></div>'}
    else if(!RLOAD){h='<div class="cw one"><div class="cbx" style="text-align:center">Loading your account…</div></div>'}
    else{var P2=profOf(m)||{name:'WebKit Customer',m:m,m2:'',email:'',a:null,since:Date.now()},O=RORD,a=P2.a;
    h='<div class="cw one" style="max-width:860px"><div class="cbx" style="margin-bottom:24px"><div class="ph"><div class="pav">'+esc(P2.name[0]).toUpperCase()+'</div><div style="flex:1"><b>'+esc(P2.name)+'</b><span>+91 '+esc(P2.m)+(P2.email?' · '+esc(P2.email):'')+'</span><span>Member since '+new Date(P2.since).toLocaleDateString('en-IN',{month:'short',year:'numeric'})+' · '+O.length+' order'+(O.length==1?'':'s')+'</span></div><button class="btn btn-l" data-pl="out" style="min-height:40px;padding:8px 18px">Log out</button></div>'+(a?'<div class="ob" style="margin-top:20px"><div><b>Saved address</b>'+esc(a.a1)+', '+esc(a.a2)+(a.l?', '+esc(a.l):'')+'<br>'+esc(a.c)+', '+esc(a.s)+' – '+esc(a.p)+'</div><div><b>Alternate mobile</b>+91 '+esc(P2.m2)+'</div></div>':'')+'</div><h2 style="font-size:24px;margin-bottom:16px">My Orders</h2>'+
    (O.length?O.map(function(o){var bt=o.at||o.t,pd=o.ac===0,rj=o.ac===-1,hrs=(Date.now()-bt)/36e5,ix=0;TH.forEach(function(x,i){if(hrs>=x)ix=i});if(o.st!=null)ix=+o.st;var q=o.a;
    return'<div class="oc"><div class="oh"><div><b>Order #'+o.id+'</b><small>Placed on '+fd(o.t)+' · Tracking ID '+o.trk+'</small></div><span class="bd'+(ix==4&&!pd&&!rj?' d':'')+'">'+(pd?'Awaiting confirmation':rj?'Cancelled':SL[ix])+'</span></div><div class="oi">'+o.items.map(function(it){return'<div><img src="'+U(it.i,120)+'" alt="" onerror="this.style.visibility=\'hidden\'"><span>'+esc(it.n)+' × '+it.q+'</span></div>'}).join('')+'</div>'+(pd||rj?'<div class="demo" style="margin:18px 0">'+(pd?'We have received your order. Tracking starts once the store confirms it.':'This order was cancelled by the store.')+'</div>':'<div class="tl">'+SL.map(function(l,i){return'<div class="'+(i<=ix?'dn':'')+'"><b>'+l+'</b>'+(i<=ix?fd(bt+TH[i]*36e5):'Expected '+fd(bt+TH[i]*36e5))+'</div>'}).join('')+'</div>')+'<div class="ob"><div><b>Shipping to</b>'+esc(q.name)+'<br>'+esc(q.a1)+', '+esc(q.a2)+(q.l?', '+esc(q.l):'')+'<br>'+esc(q.c)+', '+esc(q.s)+' – '+esc(q.p)+'<br>+91 '+esc(q.m1)+' / +91 '+esc(q.m2)+'</div><div><b>Payment &amp; delivery</b>'+o.pay+' · pay '+fmt(o.tot)+' on delivery<br>Items '+fmt(o.sub)+' · Delivery '+(o.sh?fmt(o.sh):'Free')+'<br>Carrier: WebKit Express<br>Estimated delivery: '+fd(bt+3*864e5)+' – '+fd(bt+5*864e5)+'</div></div></div>'}).join(''):'<div class="cbx" style="text-align:center">No orders found for this number yet.</div>')+'</div>'}
    $('#ppf').innerHTML=h}
    $('#pp').addEventListener('click',function(e){var b=e.target.closest('[data-pl]');if(!b)return;var a=b.dataset.pl,er=$('#ple');
    if(a=='send'||a=='resend'){var m=a=='send'?$('#plm').value:PL.m;if(!MOB.test(m)){er.textContent='Please enter a valid 10-digit Indian mobile number.';return}if(!sb){er.textContent='Login is not available right now. Please try again later.';return}b.disabled=true;sb.auth.signInWithOtp({phone:'+91'+m}).then(function(r){b.disabled=false;if(r.error){er.textContent=r.error.message||'Could not send the OTP.';return}PL.m=m;PL.sent=true;rpp();if(a=='resend')toast('New OTP sent')})}
    else if(a=='chg'){PL.sent=false;rpp()}
    else if(a=='verify'){var tk=$('#plo').value;if(tk.length!=6){er.textContent='Enter the 6-digit OTP.';return}b.disabled=true;sb.auth.verifyOtp({phone:'+91'+PL.m,token:tk,type:'sms'}).then(function(r){b.disabled=false;if(r.error){er.textContent='Incorrect or expired OTP. Please try again.';return}PL={sent:false,m:'',otp:''};toast('Logged in')})}
    else if(a=='out'){sb&&sb.auth.signOut().then(function(){PL={sent:false,m:'',otp:''};rpp();toast('Logged out')})}});
    /* scroll animations (repeatable, direction aware) */
    var io=new IntersectionObserver(function(es){es.forEach(function(e){var t=e.target;
    if(e.isIntersecting){t.classList.remove('above');t.classList.add('in')}
    else{t.classList.remove('in');t.classList.toggle('above',e.boundingClientRect.top<0)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    function obs(){$$('.rv:not([data-o])').forEach(function(e){e.dataset.o=1;io.observe(e)});}
    function paint(){buildTabs();var fl=P.filter(function(p){return p.feat}).sort(byPos('pf')),bl=P.filter(function(p){return p.best}).sort(byPos('pb')),hc=CATS.filter(function(c){return c.h>0&&P.some(function(p){return p.c==c.n})}).sort(function(a,b){return a.h-b.h});
    $('#fg').innerHTML=fl.map(function(p){return card(p,{desc:1})}).join('');$('#featured').hidden=!fl.length;
    $('#bgd').innerHTML=bl.map(function(p){return card(p,{tag:1,desc:1,rc:1})}).join('');$('#best').hidden=!bl.length;
    $('#cats').innerHTML=hc.map(function(c,i){return'<div class="cc rv" data-a="up" style="--d:'+i*.12+'s" data-cat="'+esc0(c.n)+'"><img loading="lazy" src="'+U(c.img,900)+'" alt="'+esc0(c.n)+'" onerror="this.style.visibility=\'hidden\'"><div><h3>'+esc0(c.n)+'<br><span>'+cnt(c.n)+' products</span></h3><span class="ar">'+ic.arrow+'</span></div></div>'}).join('');$('#cats').hidden=!hc.length;
    render();drawCart();obs()}
    paint();
    
    if(sb){sb.auth.onAuthStateChange(function(ev,ss){if(ev=='TOKEN_REFRESHED')return;setTimeout(function(){authSet(ss)},0)});
    sb.channel('wk-live').on('postgres_changes',{event:'*',schema:'public',table:'products'},function(){deb(sbLoad)}).on('postgres_changes',{event:'*',schema:'public',table:'categories'},function(){deb(sbLoad)}).on('postgres_changes',{event:'*',schema:'public',table:'explore_tabs'},function(){deb(sbLoad)}).on('postgres_changes',{event:'*',schema:'public',table:'orders'},function(){deb(loadAcct)}).on('postgres_changes',{event:'*',schema:'public',table:'messages'},function(){deb(loadMsgs)}).subscribe();sbLoad()}
    addEventListener('load',mp);addEventListener('resize',mp);mp();route();
    })();