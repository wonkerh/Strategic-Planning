function $(id){ return document.getElementById(id); }
function showErr(id, msg){
  var e = $(id);
  if (!e) { alert(msg); return; }
  e.textContent = msg;
  e.hidden = false;
}
function hideErr(id){ var e = $(id); if (e) e.hidden = true; }
function redirectIfSignedIn(){
  if (window.API && API.user) location.replace("../dashboard.html");
}
function goToDashboard(){ location.href = "../dashboard.html"; }
