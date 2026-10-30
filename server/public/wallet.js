(function(){
  if(!API.user){ location.replace("auth/denied.html"); return; }
  function $(id){ return document.getElementById(id); }
  function R(n){ return "R " + (Math.round(n*100)/100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,","); }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}) }

  let DATA = null, ROI = [];

  async function load(){
    try{
      DATA = await API.call("/wallet/summary");
      ROI = DATA.roi || [];
      render();
    }catch(ex){
      alert(ex.message);
      if(/401|session/i.test(ex.message)){ API.clear(); location.href="auth/denied.html"; }
    }
  }

  function render(){
    const t = DATA.totals;
    $("kpis").innerHTML = [
      ["CASH BALANCE", R(t.cash), "deposited − withdrawn"],
      ["INVESTED", R(t.invested), "in pooled sectors"],
      ["GROWTH EARNED", R(t.growth), t.roiMonthsSet+" ROI months applied"],
      ["BALANCE WITH GROWTH", R(t.balanceWithGrowth), "cash + compounding"]
    ].map(k=>'<div class="card kpi"><small>'+k[0]+'</small><b>'+k[1]+'</b><span>'+k[2]+'</span></div>').join("");
    $("wmsg").hidden = true;

    $("txb").innerHTML = DATA.transactions.length
      ? DATA.transactions.slice().reverse().map(t=>{
          const sign = t.kind === "deposit" ? "+" : "−";
          const cls = t.kind === "deposit" ? "pos" : "neg";
          return '<tr><td>'+esc(t.date)+'</td><td>'+t.kind.toUpperCase()+'</td><td>'+esc(t.note||"")+'</td><td class="n '+cls+'">'+sign+R(t.amount)+'</td><td><button class="mini" data-x="'+t.id+'" type="button">Remove</button></td></tr>';
        }).join("")
      : '<tr><td colspan="5" class="empty">No transactions yet.</td></tr>';

    $("roib").innerHTML = ROI.length
      ? ROI.slice().reverse().map(r=>'<tr><td>'+esc(r.month)+'</td><td class="n">'+(r.rate_pct>=0?"+":"")+r.rate_pct.toFixed(2)+'%</td><td>'+esc(r.note||"")+'</td></tr>').join("")
      : '<tr><td colspan="3" class="empty">No ROI declared yet.</td></tr>';

    drawChart(DATA.series || []);
  }

  function drawChart(series){
    const svg = $("chart");
    const W = 800, H = 240, P = 30;
    svg.innerHTML = "";
    if(series.length < 2){
      svg.innerHTML = '<text x="400" y="120" text-anchor="middle" fill="#6C5F52" font-family="IBM Plex Mono, monospace" font-size="14">Not enough data yet</text>';
      return;
    }
    const maxY = Math.max(...series.map(p=>p.balance), 1);
    const xs = i => P + (i/(series.length-1))*(W-P*2);
    const ys = v => H - P - (v/maxY)*(H-P*2);
    const path = series.map((p,i)=>(i?"L":"M")+xs(i).toFixed(2)+" "+ys(p.balance).toFixed(2)).join(" ");
    const area = path + ` L ${xs(series.length-1)} ${H-P} L ${xs(0)} ${H-P} Z`;
    svg.innerHTML = `
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2E7D5B" stop-opacity="0.35"/><stop offset="100%" stop-color="#2E7D5B" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="url(#g)"/>
      <path d="${path}" fill="none" stroke="#2E7D5B" stroke-width="2.5"/>
      <circle cx="${xs(series.length-1)}" cy="${ys(series[series.length-1].balance)}" r="4" fill="#2E7D5B"/>
    `;
  }

  function today(){ return new Date().toISOString().slice(0,10); }
  $("dd").value = today();
  $("wd").value = today();

  $("df").onsubmit = async (e)=>{
    e.preventDefault();
    const a = parseFloat($("da").value); if(!(a>0)) return alert("Enter an amount");
    try{
      await API.call("/wallet/deposit",{method:"POST",body:JSON.stringify({amount:a,date:$("dd").value,note:$("dn").value})});
      $("da").value=""; $("dn").value=""; load();
    }catch(ex){ alert(ex.message); }
  };

  $("wf").onsubmit = async (e)=>{
    e.preventDefault();
    const a = parseFloat($("wa").value); if(!(a>0)) return alert("Enter an amount");
    try{
      await API.call("/wallet/withdraw",{method:"POST",body:JSON.stringify({amount:a,date:$("wd").value,note:$("wn").value})});
      $("wa").value=""; $("wn").value=""; load();
    }catch(ex){ const m=$("wmsg"); m.textContent=ex.message; m.hidden=false; }
  };

  $("txb").onclick = async (e)=>{
    const x = e.target.getAttribute("data-x"); if(!x) return;
    if(!confirm("Remove this transaction?")) return;
    try{ await API.call("/wallet/transaction/"+x,{method:"DELETE"}); load(); }
    catch(ex){ alert(ex.message); }
  };

  load();
})();
