/* ---- WhatsApp + mobile menu (unchanged) ---- */
var WA_LINK="https://chat.whatsapp.com/REPLACE_WITH_YOUR_INVITE_CODE";
document.querySelectorAll("[data-wa]").forEach(function(a){a.href=WA_LINK;a.target="_blank";a.rel="noopener"});

var b=document.getElementById("burger"),m=document.getElementById("mobileMenu");
if(b)b.addEventListener("click",function(){var o=m.classList.toggle("open");b.setAttribute("aria-expanded",String(o))});

/* ---- API client (unchanged) ---- */
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
    var res=await fetch("/api"+path,Object.assign({},opts,{headers}));
    var body=null;
    try{body=await res.json()}catch(e){}
    if(!res.ok)throw new Error((body&&body.error)||("HTTP "+res.status));
    return body;
  }
};
window.API=API;

/* ---- Nav swap: guests vs signed-in members ---- */
function renderNav(){
  var user = API.user;
  var menu = document.querySelector(".menu");
  var actions = document.querySelector(".nav-actions");
  var mobile = document.getElementById("mobileMenu");

  if (user) {
    /* Signed in — member nav only */
    var memberLinks = [
      { href: "dashboard.html", label: "Dashboard", key: "dashboard.html" },
      { href: "wallet.html",    label: "Wallet",    key: "wallet.html"    }
    ];
    if (user.role === "admin") {
      memberLinks.push({ href: "admin.html", label: "Committee", key: "admin.html" });
    }

    var current = location.pathname.split("/").pop();

    if (menu) {
      menu.innerHTML = memberLinks.map(function(l){
        var cur = l.key === current ? ' aria-current="page"' : "";
        return '<li><a href="' + l.href + '"' + cur + '>' + l.label + '</a></li>';
      }).join("");
    }

    if (actions) {
      actions.innerHTML =
        '<span class="who">' + escapeHtml(user.name) + '</span>' +
        '<a class="btn btn-ghost btn-sm" href="auth/logout.html">Sign out</a>';
    }

    if (mobile) {
      mobile.innerHTML = memberLinks.map(function(l){
        return '<a href="' + l.href + '">' + l.label + '</a>';
      }).join("") + '<a href="auth/logout.html">Sign out</a>';
    }
  } else {
    /* Guest — marketing nav (this is the original markup, restored) */
    var guestLinks = [
      { href: "index.html",        label: "Home" },
      { href: "about.html",        label: "About" },
      { href: "sectors.html",      label: "Sectors" },
      { href: "how-to-join.html",  label: "How to join" },
      { href: "dashboard.html",    label: "Dashboard" },
      { href: "contact.html",      label: "Contact" }
    ];

    var currentG = location.pathname.split("/").pop();

    if (menu) {
      menu.innerHTML = guestLinks.map(function(l){
        var cur = l.href === currentG ? ' aria-current="page"' : "";
        return '<li><a href="' + l.href + '"' + cur + '>' + l.label + '</a></li>';
      }).join("");
    }

    if (actions) {
      actions.innerHTML =
        '<a class="btn btn-ghost btn-sm" href="auth/login.html">Sign in</a>' +
        '<a class="btn btn-primary btn-sm" href="#" data-wa>Join on WhatsApp</a>';
      /* rewire data-wa for newly injected link */
      document.querySelectorAll("[data-wa]").forEach(function(a){a.href=WA_LINK;a.target="_blank";a.rel="noopener"});
    }

    if (mobile) {
      mobile.innerHTML = guestLinks.map(function(l){
        return '<a href="' + l.href + '">' + l.label + '</a>';
      }).join("") +
        '<a href="auth/login.html">Sign in</a>' +
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

/* Run immediately (DOM already parsed by the time app.js runs at bottom of <body>) */
renderNav();

/* Also react to sign-out from any page */
window.addEventListener("storage", function(e){
  if (e.key === "spToken") renderNav();
});
