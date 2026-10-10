/* Chitta Studios: pricing selector and checkout. */
(function(){
var CONTACT={email:'chinmaysganiga2005@gmail.com,umeshgalatage@gmail.com',wa:'918618426643'};
var P={1:19999,2:29999},AD={wa:{n:'WhatsApp Booking',p:9999},gbp:{n:'Google Business Profile',p:9999},seo:{n:'SEO & GEO (first setup)',p:9999,m:4999}};
var st={tier:0,add:{}},$=function(i){return document.getElementById(i)};
var f=function(n){return '₹'+n.toLocaleString('en-IN')};
function calc(){
  var sub=0,keys=Object.keys(st.add).filter(function(k){return st.add[k]});
  keys.forEach(function(k){sub+=AD[k].p});
  var disc=Math.round(sub*0.10); // 10% coupon discount on add-ons
  return {keys:keys,sub:sub,disc:disc,base:P[st.tier]||0,seo:!!st.add.seo};
}
function render(){
  document.querySelectorAll('#tiers .pc').forEach(function(c){
    var on=+c.dataset.tier===st.tier;
    c.classList.toggle('on',on);
    var b=c.querySelector('.pick');
    b.setAttribute('aria-pressed',on);
    b.textContent=on?'Selected':'Choose Tier '+c.dataset.tier;
  });
  $('ads').classList.toggle('open',st.tier>0);
  var seoCard=document.querySelector('#ads .pc[data-ad="seo"]');
  if(seoCard) seoCard.classList.toggle('disabled',st.tier===1);

  if(st.tier===1){
    $('adhint').textContent='Tap + to add extras (SEO & GEO requires Tier 2). 10% coupon applied on add-ons!';
  } else if(st.tier===2){
    $('adhint').textContent='Tap + to add extras. 10% coupon applied on add-ons!';
  } else {
    $('adhint').textContent='Choose a package above to add extras. 10% coupon applied on add-ons!';
  }

  document.querySelectorAll('#ads .pc').forEach(function(c){
    var k=c.dataset.ad;
    var on=!!st.add[k],b=c.querySelector('.addb');
    c.classList.toggle('on',on);
    b.setAttribute('aria-pressed',on);
  });
  var t=$('toast');
  if(!st.tier){t.hidden=true;document.body.classList.remove('has-toast');return}
  var c=calc(),tot=c.base+c.sub-c.disc;
  $('tl2').innerHTML='Tier '+st.tier+' '+f(c.base)+(c.sub?' + add-ons '+f(c.sub)+' <span style="color:var(--ok);font-weight:600">(-10% coupon: '+f(c.disc)+' off)</span>':'')+' = <b>'+f(tot)+'</b>'+
   '<small>'+(c.sub?'🎉 10% coupon applied to add-ons ('+f(c.disc)+' saved).':(st.tier===1?'Add-ons available (excl. SEO).':'Add extras with the + buttons.'))+(c.seo?' SEO & GEO then '+f(AD.seo.m)+'/month from month 2.':'')+'</small>';
  t.hidden=false;document.body.classList.add('has-toast');
}
function setTier(n){
  if(st.tier===n)return;
  st.tier=n;
  if(n===1 && st.add.seo) delete st.add.seo;
  if(!n) st.add={};
  render();
}
document.querySelectorAll('#tiers .pc').forEach(function(c){
  c.addEventListener('click',function(){setTier(+c.dataset.tier)});
});
document.querySelectorAll('#ads .pc').forEach(function(c){
  c.addEventListener('click',function(e){
    if(!st.tier){
      var h=$('adhint');h.textContent='Please choose a package above first.';h.classList.add('nudge');
      setTimeout(function(){h.classList.remove('nudge')},1400);return;
    }
    var k=c.dataset.ad;
    if(st.tier===1 && k==='seo'){
      var h2=$('adhint');h2.textContent='SEO & GEO requires Tier 2 (Appointments).';h2.classList.add('nudge');
      setTimeout(function(){
        h2.classList.remove('nudge');
        h2.textContent='Tap + to add extras (SEO & GEO requires Tier 2). 10% coupon applied on add-ons!';
      },1600);
      return;
    }
    st.add[k]=!st.add[k];
    render();
  });
});
function summary(){
  var c=calc(),h='<div><span>Tier '+st.tier+'</span><span>'+f(c.base)+'</span></div>';
  c.keys.forEach(function(k){h+='<div><span>'+AD[k].n+'</span><span>'+f(AD[k].p)+'</span></div>'});
  if(c.sub){
    h+='<div style="font-size:13.5px;color:var(--ink2)"><span>Add-ons subtotal</span><span>'+f(c.sub)+'</span></div>';
    h+='<div class="dc"><span>🎟️ Coupon (10% off add-ons)</span><span>−'+f(c.disc)+'</span></div>';
  }
  h+='<div class="tt"><span>Total</span><span>'+f(c.base+c.sub-c.disc)+'</span></div>';
  if(c.seo)h+='<small>Plus '+f(AD.seo.m)+' a month for SEO & GEO, from the second month.</small>';
  return h;
}
function orderText(){
  var c=calc(),L=['Package: Tier '+st.tier+' ('+f(c.base)+')'];
  L.push('Add-ons: '+(c.keys.length?c.keys.map(function(k){return AD[k].n+' '+f(AD[k].p)}).join(', '):'none'));
  if(c.sub){
    L.push('Add-ons subtotal: '+f(c.sub));
    L.push('Coupon discount (10% on add-ons): -'+f(c.disc));
  }
  L.push('Total (one-time): '+f(c.base+c.sub-c.disc));
  if(c.seo)L.push('Recurring: '+f(AD.seo.m)+'/month for SEO & GEO from the second month');
  return L.join('\n');
}
var dlg=$('co');
$('fin').addEventListener('click',function(){
  $('cot').textContent='Check out';
  $('cof').hidden=false;
  $('sum').innerHTML=summary();$('msg').textContent='';$('msg').className='msg';
  if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');
});
$('cxl').addEventListener('click',function(){dlg.close?dlg.close():dlg.removeAttribute('open')});
dlg.addEventListener('click',function(e){if(e.target===dlg)$('cxl').click()});
function esc(t){return String(t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function mailto(d,o){return 'mailto:'+CONTACT.email+'?subject='+encodeURIComponent('New website order: '+d.hospital)+'&body='+encodeURIComponent('Name: '+d.name+'\nHospital: '+d.hospital+'\nPhone: '+d.phone+(d.email?'\nEmail: '+d.email:'')+'\n\n'+o)}
$('cof').addEventListener('submit',function(e){
  e.preventDefault();var form=e.target,msg=$('msg'),btn=$('send');
  if(!form.checkValidity()){form.reportValidity();return}
  var fd=new FormData(form),c=calc();
  var d={name:fd.get('name').trim(),hospital:fd.get('hospital').trim(),phone:fd.get('phone').trim(),email:(fd.get('email')||'').trim(),_honey:fd.get('_honey')||'',tier:st.tier,addons:c.keys},o=orderText();
  btn.disabled=true;msg.className='msg';msg.textContent='Sending…';
  fetch('/api/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})
  .then(function(r){return r.json().catch(function(){return{}}).then(function(j){return{ok:r.ok&&j.ok,j:j}})})
  .then(function(x){
    if(!x.ok){var er=new Error(x.j&&x.j.error||'');er.shown=!!(x.j&&x.j.error);throw er}
    form.hidden=true;
    $('cot').textContent='Order Sent!';
    $('sum').innerHTML='<div style="background:rgba(47,143,78,.14);border:1.5px solid rgba(47,143,78,.35);padding:14px 16px;border-radius:14px;color:var(--ok);margin-bottom:14px">'+
      '<b>✓ Thank you, '+esc(d.name)+'!</b>'+
      '<div style="font-size:13.5px;color:var(--ink);margin-top:4px">Your order for <b>'+esc(d.hospital)+'</b> has been automatically sent to our team. We will contact you on <b>'+esc(d.phone)+'</b> shortly to confirm.</div></div>'+
      summary()+
      '<div style="margin-top:16px"><button class="btn go" style="width:100%" type="button" id="cl2">Close</button></div>';
    $('cl2').addEventListener('click',function(){$('cxl').click()});
  }).catch(function(err){
    btn.disabled=false;msg.className='msg err';
    msg.innerHTML=(err.shown?esc(err.message):'We could not send this just now.')+' <a href="'+mailto(d,o)+'">Send it from your email app instead</a>, or call +91 861 842 6643.';
  });
});

render();
})();

(function(){
  document.querySelectorAll('.chips').forEach(function(g){
    g.addEventListener('click',function(e){
      var b=e.target.closest('.chip');if(!b)return;
      g.querySelectorAll('.chip').forEach(function(c){c.setAttribute('aria-pressed',c===b?'true':'false')});
      document.getElementById('res').innerHTML='';
    });
  });
  document.getElementById('cf').addEventListener('click',function(){
    var d=document.querySelector('[data-g=day] [aria-pressed=true]').textContent,t=document.querySelector('[data-g=time] [aria-pressed=true]').textContent;
    document.getElementById('res').innerHTML='<strong>Booked: '+d+', '+t+'</strong><small>With the WhatsApp add-on, patients also get a confirmation here.</small>';
  });
})();
