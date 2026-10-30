(function(){
var me=API.user;if(!me){location.replace("/auth/denied.html");return}
function $(i){return document.getElementById(i)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function R(n){return "R "+Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,",")}
var SEC=[["Logistics","#2F7FB0"],["Commercial agriculture","#2E7D5B"],["Mining","#6B4226"],["Distribution centres","#B8892A"]];
var tab="All", DATA=null;

$("hi").textContent="Welcome, "+me.name;
$("sector").innerHTML=SEC.map(function(s){return "<option>"+s[0]+"</option>"}).join("");
$("date").valueAsDate=new Date();
$("seg").innerHTML=["All"].concat(SEC.map(function(s){return s[0]})).map(function(t){return '<button type="button" data-t="'+t+'">'+(t==="All"?"All sectors":t)+'</button>'}).join("");

async function load(){
  try{DATA=await API.call("/investments/summary");render()}
  catch(e){alert(e.message);if(/401|session/i.test(e.message)){API.clear();location.href="/auth/denied.html"}}
}

function render(){
  var t=DATA.totals;
  $("kpis").innerHTML=[
    ["MY TOTAL INVESTED",R(t.my),t.payments+" payments"],
    ["MY SHARE OF THE POOL",(t.mySharePct||0).toFixed(1)+"%","of "+R(t.pool)],
    ["TOTAL POOL",R(t.pool),"all sectors"],
    ["MEMBERS INVESTING",t.membersInvesting,"including you"]
  ].map(function(k){return '<div class="card kpi"><small>'+k[0]+'</small><b>'+k[1]+'</b><span>'+k[2]+'</span></div>'}).join("");

  $("alloc").innerHTML=!t.my
    ?'<p class="empty">You have not invested yet. Add your first investment.</p>'
    :SEC.map(function(s){
      var v=DATA.sectors.find(function(x){return x.name===s[0]}).mine;
      return '<div><div class="row"><span><i class="sw" style="background:'+s[1]+'"></i>'+s[0]+'</span><span>'+R(v)+' <em>'+Math.round(v/t.my*100)+'%</em></span></div><div class="bar"><i style="width:'+(v/t.my*100)+'%;background:'+s[1]+'"></i></div></div>'
    }).join("");

  document.querySelectorAll("#seg button").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.t===tab))});

  if(tab==="All"){
    $("sh").innerHTML='<tr><th>SECTOR</th><th class="n">TOTAL INVESTED</th><th class="n">MEMBERS</th><th class="n">MY AMOUNT</th></tr>';
    $("sb").innerHTML=DATA.sectors.map(function(s,i){
      return '<tr><td><i class="sw" style="background:'+SEC[i][1]+'"></i>'+esc(s.name)+'</td><td class="n">'+R(s.total)+'</td><td class="n">'+s.members+'</td><td class="n">'+R(s.mine)+'</td></tr>'
    }).join("");
  }else{
    var list=DATA.drilldown[tab]||[], tot=list.reduce(function(a,x){return a+x.amount},0);
    $("sh").innerHTML='<tr><th>MEMBER</th><th class="n">INVESTED IN '+esc(tab.toUpperCase())+'</th><th class="n">SHARE OF SECTOR</th></tr>';
    $("sb").innerHTML=list.length?list.map(function(x){
      return '<tr><td>'+esc(x.who)+(x.who===DATA.me?' (you)':'')+'</td><td class="n">'+R(x.amount)+'</td><td class="n">'+(x.amount/tot*100).toFixed(1)+'%</td></tr>'
    }).join("")+'<tr><td><b>Sector total</b></td><td class="n"><b>'+R(tot)+'</b></td><td></td></tr>'
    :'<tr><td colspan="3" class="empty">No one has invested in this sector yet.</td></tr>';
  }

  $("mine").innerHTML=DATA.myInvestments.length
    ?DATA.myInvestments.map(function(i){
      return '<tr><td>'+i.date+'</td><td>'+esc(i.sector)+'</td><td class="n">'+R(i.amount)+'</td><td><button class="mini" data-x="'+i.id+'" type="button">Remove</button></td></tr>'
    }).join("")
    :'<tr><td colspan="4" class="empty">No investments yet.</td></tr>';

  $("mem").innerHTML=DATA.members.length
    ?DATA.members.map(function(m){
      return '<tr><td>'+esc(m.name)+(m.isMe?' (you)':'')+'</td><td class="n">'+R(m.total)+'</td><td>'+esc(m.top||"—")+'</td></tr>'
    }).join("")
    :'<tr><td colspan="3" class="empty">No members have invested yet.</td></tr>';
}

$("iform").onsubmit=async function(e){
  e.preventDefault();
  var a=parseFloat($("amt").value);if(!(a>0))return;
  try{
    await API.call("/investments",{method:"POST",body:JSON.stringify({
      sector:$("sector").value, amount:a, date:$("date").value
    })});
    $("amt").value="";await load();
  }catch(ex){alert(ex.message)}
};

$("mine").onclick=async function(e){
  var x=e.target.getAttribute("data-x");if(!x)return;
  if(!confirm("Remove this investment?"))return;
  try{await API.call("/investments/"+x,{method:"DELETE"});await load()}
  catch(ex){alert(ex.message)}
};

$("seg").onclick=function(e){var t=e.target.getAttribute("data-t");if(t){tab=t;render()}};
var so=$("so");if(so)so.onclick=function(){API.clear();location.href="index.html"};

load();
})();

