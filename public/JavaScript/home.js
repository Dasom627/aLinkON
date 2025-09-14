// 전역 API 베이스 (개발 시: http://localhost:3000)
const API = window.API_BASE || "http://localhost:3000";

// DOM 헬퍼 & 유틸
const $ = (id) => document.getElementById(id);
const fmtPct = (n)=> `${Math.round(n)}%`;
function escapeHtml(s){
  return String(s).replace(/[&<>\"']/g, (c)=>({"&":"&amp;","<":"&lt;","\u003e":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

document.addEventListener("DOMContentLoaded", async () => {
  $("year").textContent = new Date().getFullYear();

  await ensureAuth();      // 1) 인증 확인 & 프로필 로드
  await loadResumeStats(); // 2) 이력서 진행률
  await loadSuggestions(); // 3) 맞춤 추천
  loadNotes();             // 4) 성장노트 (로컬)

  // 이벤트 바인딩
  $("qResume")?.addEventListener("click", ()=> location.href="/HTML/Profile/resume.html");
  $("qGrowth")?.addEventListener("click", ()=> $("noteInput")?.focus());
  $("qExplore")?.addEventListener("click", ()=> location.href="/HTML/Explore/explore.html");
  $("noteAdd")?.addEventListener("click", addNote);
  $("noteInput")?.addEventListener("keydown", (e)=>{ if(e.key==="Enter") addNote(); });
  $("logoutBtn")?.addEventListener("click", logout);
});

// 1) 인증 확인 & 프로필 로드
async function ensureAuth(){
  try{
    const r = await fetch(`${API}/api/me`, { credentials:"include" });
    if(!r.ok) return redirectToLogin();
    const me = await r.json();
    $("helloName").textContent = `${me.nickname ?? "사용자"}님, 반가워요!`;
    $("helloSub").textContent = me.greeting ?? "오늘도 한 걸음, 따뜻하게 ✨";
  }catch{
    redirectToLogin();
  }
}
function redirectToLogin(){
  window.location.href = "/HTML/Login/login.html?needAuth=1";
}

// 2) 이력서 진행률
async function loadResumeStats(){
  try{
    const r = await fetch(`${API}/api/resume/stats`, { credentials:"include" });
    if(!r.ok) throw 0;
    const s = await r.json(); // { requiredDone, requiredTotal, percent }
    renderResume(s);
  }catch{
    renderResume({ requiredDone:2, requiredTotal:5, percent:40 }); // fallback
  }
}
function renderResume(s){
  $("resumeBar").style.width = fmtPct(s.percent);
  $("resumePct").textContent = fmtPct(s.percent);
  $("resumeHint").textContent = `필수 항목 ${s.requiredDone}/${s.requiredTotal}`;
}

// 3) 오늘의 제안
async function loadSuggestions(){
  const box = $("suggestList");
  if(!box) return;
  box.innerHTML = "<div class='empty'>불러오는 중…</div>";
  try{
    const r = await fetch(`${API}/api/suggest/today`, { credentials:"include" });
    if(!r.ok) throw 0;
    const rows = await r.json(); // [{title, tag, ok}]
    renderList(box, rows);
  }catch{
    renderList(box, [
      { title:"디자인 과제 포트폴리오 1개 업로드", tag:"이력서", ok:false },
      { title:"지역 청년 인턴십 공고 확인", tag:"스펙업", ok:false },
      { title:"JLPT 단어 30개 복습", tag:"학습", ok:true },
    ]);
  }
}

// 4) 성장노트 (로컬)
function loadNotes(){
  const data = JSON.parse(localStorage.getItem("notes")||"[]");
  renderList($("notesList"), data);
}
function addNote(){
  const input = $("noteInput");
  if(!input) return;
  const v = input.value.trim();
  if(!v) return;
  const data = JSON.parse(localStorage.getItem("notes")||"[]");
  data.unshift({ title:v, tag:"노트", ok:true, at:new Date().toISOString() });
  localStorage.setItem("notes", JSON.stringify(data));
  input.value = "";
  renderList($("notesList"), data);
}

// 공통 렌더러
function renderList(container, rows){
  if(!container) return;
  if(!rows || rows.length===0){
    container.innerHTML = "<div class='empty'>표시할 항목이 없어요.</div>";
    return;
  }
  container.innerHTML = rows.map(r=>`
    <div class="item">
      <div class="dot ${r.ok?"ok":"warn"}"></div>
      <div>
        <div style="font-weight:600">${escapeHtml(r.title||"")}</div>
        <div class="muted" style="font-size:12px">${escapeHtml(r.tag||"")}</div>
      </div>
    </div>
  `).join("");
}

// 로그아웃
async function logout(){
  try{
    await fetch(`${API}/api/logout`, { method:"POST", credentials:"include" });
  }catch{}
  location.href = "/HTML/Login/login.html";
}
