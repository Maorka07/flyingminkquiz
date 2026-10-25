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
