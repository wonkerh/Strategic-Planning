var WA_LINK="https://chat.whatsapp.com/BBwVr0n97QGIZnJYpU7XCZ?s=cl&p=i&mlu=4&ilr=4";
document.querySelectorAll("[data-wa]").forEach(function(a){a.href=WA_LINK;a.target="_blank";a.rel="noopener"});
var b=document.getElementById("burger"),m=document.getElementById("mobileMenu");
if(b)b.addEventListener("click",function(){var o=m.classList.toggle("open");b.setAttribute("aria-expanded",String(o))});

// ---> POINT TO RENDER BACKEND <---
var API_BASE = "https://strategic-planning.onrender.com/api";

var API = {
  TOKEN_KEY: "spToken",
  USER_KEY: "spUser",
  get token(){return localStorage.getItem(this.TOKEN_KEY)},
  get user(){try{return JSON.parse(localStorage.getItem(this.USER_KEY)||"null")}catch(e){return null}},
  set:function(t,u){localStorage.setItem(this.TOKEN_KEY,t);localStorage.setItem(this.USER_KEY,JSON.stringify(u))},
  clear:function(){localStorage.removeItem(this.TOKEN_KEY);localStorage.removeItem(this.USER_KEY)},
  call:async function(path,opts){
    opts=opts||{};
    var headers=Object.assign({"Content-Type":"application/json"},opts.headers||{});
    if(this.token)headers.Authorization="Bearer "+this.token;
    // Use API_BASE here instead of just "/api"
    var res=await fetch(API_BASE+path,Object.assign({},opts,{headers}));
    var body=null;
    try{body=await res.json()}catch(e){}
    if(!res.ok)throw new Error((body&&body.error)||("HTTP "+res.status));
    return body;
  }
};
window.API=API;

function renderNav(){
  var user = API.user;
  var menu = document.querySelector(".menu");
  var actions = document.querySelector(".nav-actions");
  var mobile = document.getElementById("mobileMenu");

  if (user) {
    var memberLinks = [
      { href: "/dashboard.html", label: "Dashboard" },
      { href: "/wallet.html",    label: "Wallet" }
    ];
    if (user.role === "admin") { memberLinks.push({ href: "/admin.html", label: "ROI" }); memberLinks.push({ href: "/admin-members.html", label: "Members" }); memberLinks.push({ href: "/admin-reports.html", label: "Reports" }); });
    }

    var current = location.pathname.split("/").pop();

    if (menu) {
      menu.innerHTML = memberLinks.map(function(l){
        var cur = l.href.includes(current) ? ' aria-current="page"' : "";
        return '<li><a href="' + l.href + '"' + cur + '>' + l.label + '</a></li>';
      }).join("");
    }
    if (actions) {
      actions.innerHTML =
        '<div class="user-chip"><span class="who">' + escapeHtml(user.name) + '</span><a class="btn btn-ghost btn-sm" href="/auth/logout.html">Sign out</a></div>';
    }
    if (mobile) {
      mobile.innerHTML = memberLinks.map(function(l){
        return '<a href="' + l.href + '">' + l.label + '</a>';
      }).join("") + '<a href="/auth/logout.html">Sign out</a>';
    }
  } else {
    var guestLinks = [
      { href: "/index.html",        label: "Home" },
      { href: "/about.html",        label: "About" },
      { href: "/sectors.html",      label: "Sectors" },
      { href: "/how-to-join.html",  label: "How to join" },
      { href: "/dashboard.html",    label: "Dashboard" },
      { href: "/contact.html",      label: "Contact" }
    ];

    var currentG = location.pathname.split("/").pop();

    if (menu) {
      menu.innerHTML = guestLinks.map(function(l){
        var cur = l.href.includes(currentG) ? ' aria-current="page"' : "";
        return '<li><a href="' + l.href + '"' + cur + '>' + l.label + '</a></li>';
      }).join("");
    }
    if (actions) {
      actions.innerHTML =
        '<a class="btn btn-ghost btn-sm" href="/auth/login.html">Sign in</a>' +
        '<a class="btn btn-primary btn-sm" href="#" data-wa>Join on WhatsApp</a>';
      document.querySelectorAll("[data-wa]").forEach(function(a){a.href=WA_LINK;a.target="_blank";a.rel="noopener"});
    }
    if (mobile) {
      mobile.innerHTML = guestLinks.map(function(l){
        return '<a href="' + l.href + '">' + l.label + '</a>';
      }).join("") +
        '<a href="/auth/login.html">Sign in</a>' +
        '<a href="#" data-wa>Join on WhatsApp</a>';
      document.querySelectorAll("[data-wa]").forEach(function(a){a.href=WA_LINK;a.target="_blank";a.rel="noopener"});
    }
  }
}

function escapeHtml(s){
  return String(s).replace(/[&<>"]/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];
  });
}

renderNav();

window.addEventListener("storage", function(e){
  if (e.key === "spToken") renderNav();
});

