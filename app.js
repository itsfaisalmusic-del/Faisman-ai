const API_URL = ""; // Set your deployed Cloudflare Worker URL here, e.g. https://fai-ai-api.yourname.workers.dev
const $ = (id) => document.getElementById(id);
const state = { chats: [], currentId: null, image: null, busy: false, recognition: null };

function makeId(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function loadChats(){ try{state.chats=JSON.parse(localStorage.getItem("fai_ai_chats")||"[]");}catch{state.chats=[];} }
function saveChats(){ localStorage.setItem("fai_ai_chats",JSON.stringify(state.chats)); }
function currentChat(){ return state.chats.find(c=>c.id===state.currentId); }
function newChat(){
  const chat={id:makeId(),title:"New chat",messages:[],updated:Date.now()};
  state.chats.unshift(chat);state.currentId=chat.id;saveChats();render();
}
function renderHistory(){
  $("historyList").innerHTML="";
  state.chats.slice(0,30).forEach(chat=>{
    const b=document.createElement("button");b.className="history-item"+(chat.id===state.currentId?" active":"");
    b.textContent=chat.title||"New chat";b.onclick=()=>{state.currentId=chat.id;render();$("sidebar").classList.remove("open");};
    $("historyList").appendChild(b);
  });
}
function render(){
  renderHistory();const chat=currentChat();$("messages").innerHTML="";
  $("welcome").classList.toggle("hidden",!!(chat&&chat.messages.length));
  if(!chat)return;
  chat.messages.forEach(m=>{
    const row=document.createElement("div");row.className="message "+m.role;
    const avatar=document.createElement("div");avatar.className="avatar";avatar.textContent=m.role==="user"?"You":"F";
    const bubble=document.createElement("div");bubble.className="bubble";
    if(m.image){const img=document.createElement("img");img.src=m.image;img.alt="Uploaded image";bubble.appendChild(img);}
    const text=document.createElement("div");text.textContent=m.text||"";bubble.appendChild(text);
    if(m.role==="assistant" && m.text && ("speechSynthesis" in window)){
      const speak=document.createElement("button");speak.className="speak-btn";speak.type="button";speak.textContent="🔊 Suno";
      speak.onclick=()=>{window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(m.text);utterance.lang=/[\\u0600-\\u06FF]/.test(m.text)?"ur-PK":"en-US";window.speechSynthesis.speak(utterance);};
      bubble.appendChild(speak);
    }
    row.append(avatar,bubble);$("messages").appendChild(row);
  });
  $("chatArea").scrollTop=$("chatArea").scrollHeight;
}
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2600);}
function setBusy(v){state.busy=v;$("sendBtn").disabled=v;$("sendBtn").textContent=v?"…":"➤";}
function setImage(file){
  if(!file)return;if(!file.type.startsWith("image/")){toast("Please select an image file.");return;}
  if(file.size>5*1024*1024){toast("Image 5 MB se chhoti honi chahiye.");return;}
  const reader=new FileReader();reader.onload=()=>{state.image={dataUrl:reader.result,mimeType:file.type,base64:String(reader.result).split(",")[1]};$("imagePreview").innerHTML=`<img src="${reader.result}" alt="Preview"><button type="button" id="removeImage">Remove ×</button>`;$("imagePreview").classList.remove("hidden");$("removeImage").onclick=clearImage;};reader.readAsDataURL(file);
}
function clearImage(){state.image=null;$("imagePreview").classList.add("hidden");$("imageInput").value="";}
function addMessage(role,text,image){const chat=currentChat();chat.messages.push({role,text,image:image||null});chat.updated=Date.now();if(role==="user"&&chat.title==="New chat")chat.title=(text||"Image question").slice(0,34);saveChats();render();}
async function sendMessage(text){
  if(state.busy)return;const prompt=text.trim();if(!prompt&&!state.image)return;
  if(!API_URL){toast("Pehle app.js mein Cloudflare Worker URL set karein.");return;}
  if(!currentChat())newChat();
  const image=state.image?.dataUrl||null;const imagePayload=state.image?{mimeType:state.image.mimeType,base64:state.image.base64}:null;
  addMessage("user",prompt,image);clearImage();$("messageInput").value="";$("messageInput").style.height="auto";
  const chat=currentChat();const history=chat.messages.slice(0,-1).filter(m=>m.role==="user"||m.role==="assistant").map(m=>({role:m.role==="assistant"?"model":"user",text:m.text||""}));
  setBusy(true);const waiting=document.createElement("div");waiting.className="message";waiting.id="waiting";waiting.innerHTML='<div class="avatar">F</div><div class="bubble typing">FAI AI soch raha hai…</div>';$("messages").appendChild(waiting);$("chatArea").scrollTop=$("chatArea").scrollHeight;
  try{
    const res=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:prompt,history,image:imagePayload})});
    const data=await res.json();if(!res.ok)throw new Error(data.error||"AI request failed");
    chat.messages.push({role:"assistant",text:data.reply||"Mujhe jawab nahi mila.",image:null});chat.updated=Date.now();saveChats();render();
  }catch(err){toast(err.message||"Connection error");chat.messages.push({role:"assistant",text:"Maazrat, AI se connection nahi ho saka. Backend URL aur API key check karein.",image:null});saveChats();render();}
  finally{setBusy(false);}
}
$("chatForm").addEventListener("submit",e=>{e.preventDefault();sendMessage($("messageInput").value);});
$("messageInput").addEventListener("input",e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,150)+"px";});
$("messageInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("chatForm").requestSubmit();}});
$("newChatBtn").onclick=newChat;$("clearBtn").onclick=()=>{if(currentChat()){currentChat().messages=[];currentChat().title="New chat";saveChats();render();}};
$("uploadBtn").onclick=()=>$("imageInput").click();$("imageInput").onchange=e=>setImage(e.target.files[0]);
$("menuBtn").onclick=()=>$("sidebar").classList.toggle("open");
document.querySelectorAll(".suggestion").forEach(b=>b.onclick=()=>sendMessage(b.dataset.prompt));
$("micBtn").onclick=()=>{
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SpeechRecognition){toast("Is browser mein voice input support nahi. Chrome try karein.");return;}
  if(state.recognition){state.recognition.stop();state.recognition=null;$("micBtn").classList.remove("listening");return;}
  const rec=new SpeechRecognition();state.recognition=rec;rec.lang="ur-PK";rec.interimResults=true;rec.continuous=false;
  rec.onstart=()=>$("micBtn").classList.add("listening");
  rec.onresult=e=>{$("messageInput").value=Array.from(e.results).map(r=>r[0].transcript).join("");};
  rec.onerror=()=>toast("Mic permission aur internet check karein.");
  rec.onend=()=>{$("micBtn").classList.remove("listening");state.recognition=null;};rec.start();
};
loadChats();if(state.chats.length){state.currentId=state.chats[0].id;}else{newChat();}
render();
if(!API_URL){$("connectionLabel").textContent="Backend setup pending";}
