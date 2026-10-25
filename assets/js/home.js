/* Video autoplay */
var v=document.getElementById("heroVid");
if(v){v.muted=true;v.setAttribute("playsinline","");v.setAttribute("webkit-playsinline","");var tryPlay=function(){v.play().catch(function(){})};tryPlay();document.addEventListener("touchstart",tryPlay,{once:true});document.addEventListener("click",tryPlay,{once:true});document.addEventListener("scroll",tryPlay,{once:true});setTimeout(tryPlay,500);setTimeout(tryPlay,1500);}

/* Side menu */
function toggleSideMenu(){document.getElementById("sideMenu").classList.toggle("open");document.getElementById("overlay").classList.toggle("open")}

/* Scroll fade */
var obs=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)e.target.classList.add("visible")});},{threshold:0.12});
document.querySelectorAll(".fade-in").forEach(function(el){obs.observe(el)});

/* Language */
var currentLang="he";
function toggleLangDropdown(){document.getElementById("langDrop").classList.toggle("open")}
function setLang(lang){
  currentLang=lang;
  document.documentElement.lang=lang;
  document.documentElement.dir=(lang==="he")?"rtl":"ltr";
  document.querySelectorAll("[data-"+lang+"]").forEach(function(el){
    var txt=el.getAttribute("data-"+lang);
    if(txt){
      if(el.tagName==="INPUT"||el.tagName==="TEXTAREA") el.placeholder=txt;
      else if(el.tagName==="OPTION") el.textContent=txt;
      else el.textContent=txt;
    }
  });
  var labels={"he":"\u05e2\u05d1\u05e8\u05d9\u05ea","en":"English","de":"Deutsch","ru":"\u0420\u0443\u0441\u0441\u043a\u0438\u0439"};
  document.querySelectorAll(".lang-option").forEach(function(btn){
    btn.classList.toggle("active",btn.textContent.indexOf(labels[lang])>=0);
  });
  document.querySelectorAll(".lang-dropdown").forEach(function(dd){dd.classList.remove("open");});
  document.querySelectorAll('a[href^="gallery.html"]').forEach(function(a){a.setAttribute("href","gallery.html"+(lang==="he"?"":"?lang="+lang));});
}
/* Open in the language passed from the gallery page (index.html?lang=en) */
(function(){var m=window.location.search.match(/[?&]lang=(en|de|ru)\b/);if(m)setLang(m[1]);})();
document.addEventListener("click",function(e){if(!e.target.closest(".lang-toggle"))document.querySelectorAll(".lang-dropdown").forEach(function(dd){dd.classList.remove("open")});});

/* Contact form */
function submitContact(){
  var name=document.getElementById("cName").value.trim();
  var phone=document.getElementById("cPhone").value.trim();
  var subj=document.getElementById("cSubject");
  var subjText=subj.options[subj.selectedIndex]?subj.options[subj.selectedIndex].text:"";
  var msg=document.getElementById("cMsg").value.trim();
  var formMsg=document.getElementById("cFormMsg");
  if(!name||!phone||!subj.value){formMsg.style.color="#fbbf24";formMsg.textContent="\u05e0\u05d0 \u05dc\u05de\u05dc\u05d0 \u05e9\u05dd, \u05d8\u05dc\u05e4\u05d5\u05df \u05d5\u05e0\u05d5\u05e9\u05d0";return;}
  var waMsg=encodeURIComponent("\u05d4\u05d9\u05d9 \u05de\u05d0\u05d5\u05e8, \u05e4\u05e0\u05d9\u05d9\u05d4 \u05de\u05d0\u05ea\u05e8 Flying Mink\n\n\u05e9\u05dd: "+name+"\n\u05d8\u05dc\u05e4\u05d5\u05df: "+phone+"\n\u05e0\u05d5\u05e9\u05d0: "+subjText+"\n"+(msg?"\u05d4\u05d5\u05d3\u05e2\u05d4: "+msg:""));
  window.open("https://wa.me/972549902676?text="+waMsg,"_blank");
  formMsg.style.color="#34d399";formMsg.textContent="\u05d4\u05d4\u05d5\u05d3\u05e2\u05d4 \u05e0\u05e9\u05dc\u05d7\u05d4! \u05e0\u05d7\u05d6\u05d5\u05e8 \u05d0\u05dc\u05d9\u05db\u05dd \u05d1\u05d4\u05e7\u05d3\u05dd.";
}

/* Bot */
function toggleBot(){document.getElementById("botChat").classList.toggle("open")}
function botAsk(q){addBotMsg(q,"user");document.getElementById("botQuick").style.display="none";setTimeout(function(){botReply(q)},600);}
function sendBot(){var inp=document.getElementById("botInput");var q=inp.value.trim();if(!q)return;inp.value="";addBotMsg(q,"user");setTimeout(function(){botReply(q)},600);}
function addBotMsg(text,type){var msgs=document.getElementById("botMsgs");var d=document.createElement("div");d.className="bot-msg "+type;d.textContent=text;msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;}
function botReply(q){
  var l=q.toLowerCase();var r="";
  if(l.indexOf("drone")>=0||l.indexOf("\u05e8\u05d7\u05e4\u05df")>=0) r="\u05de\u05d5\u05de\u05dc\u05e5 \u05dc\u05e2\u05e9\u05d5\u05ea \u05d0\u05ea \u05d4\u05e9\u05d0\u05dc\u05d5\u05df \u05e9\u05dc\u05e0\u05d5! \u05dc\u05d7\u05e5 \u05e2\u05dc \u05e9\u05d0\u05dc\u05d5\u05df \u05d1\u05ea\u05e4\u05e8\u05d9\u05d8.";
  else if(l.indexOf("\u05de\u05d7\u05d9\u05e8")>=0||l.indexOf("\u05e2\u05d5\u05dc\u05d4")>=0) r="\u05e9\u05d9\u05e2\u05d5\u05e8 \u05e4\u05e8\u05d8\u05d9: \u05d4\u05d7\u05dc \u05de-300. \u05e6\u05d9\u05dc\u05d5\u05dd \u05d0\u05d5\u05d5\u05d9\u05e8\u05d9: \u05dc\u05e4\u05d9 \u05e4\u05e8\u05d5\u05d9\u05e7\u05d8.";
  else if(l.indexOf("\u05e7\u05e9\u05e8")>=0||l.indexOf("\u05d8\u05dc\u05e4\u05d5\u05df")>=0) r="\u05d5\u05d5\u05d0\u05d8\u05e1\u05d0\u05e4 054-990-2676.";
  else if(l.indexOf("\u05e7\u05d5\u05e8\u05e1")>=0) r="\u05d4\u05e7\u05d5\u05e8\u05e1 \u05db\u05d5\u05dc\u05dc 45 \u05e4\u05e8\u05e7\u05d9\u05dd - 14 \u05d7\u05d9\u05e0\u05de\u05d9\u05d9\u05dd!";
  else r="\u05ea\u05d5\u05d3\u05d4 \u05e2\u05dc \u05d4\u05e4\u05e0\u05d9\u05d9\u05d4! \u05d5\u05d5\u05d0\u05d8\u05e1\u05d0\u05e4: 054-990-2676";
  addBotMsg(r,"bot");
}
