// ===== login.js =====
const API = window.API_BASE || "";

// 요소 찾기 (없으면 안전하게 처리)
const loginForm = document.getElementById("loginForm");
const emailEl   = document.getElementById("email");
const pwEl      = document.getElementById("password");
let   errEl     = document.getElementById("loginError");
let   btnEl     = document.getElementById("loginBtn") || document.querySelector('button[type="submit"]');

// 에러 표시 요소가 없으면 만들어서 폼 안에 붙여준다
(function ensureErrorBox(){
  if (!errEl && loginForm) {
    errEl = document.createElement("div");
    errEl.id = "loginError";
    errEl.style.color = "#ef4444";
    errEl.style.marginTop = "8px";
    errEl.style.minHeight = "1.2em";
    loginForm.appendChild(errEl);
  }
})();

function setBusy(busy){
  if (btnEl) btnEl.disabled = !!busy;
}

// JSON 안전 파싱
async function safeJson(res){
  try { return await res.json(); }
  catch { return {}; }
}

// 폼 이벤트 바인딩
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();                // ★ 기본 제출(새로고침/405) 방지
    if (errEl) errEl.textContent = "";
    setBusy(true);

    const email = (emailEl?.value || "").trim();
    const password = pwEl?.value || "";

    // 간단한 클라이언트 검증
    if (!email || !password) {
      if (errEl) errEl.textContent = "이메일과 비밀번호를 입력해 주세요.";
      setBusy(false);
      return;
    }

    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",         // ★ 쿠키(JWT) 주고받기
      });

      const data = await safeJson(res);

      if (res.ok && data.ok) {
        // ✅ 성공 → 홈으로 이동
        window.location.href = "/HTML/Home/home.html";
      } else {
        if (errEl) errEl.textContent = data.error || "로그인 실패";
      }
    } catch (err) {
      console.error(err);
      if (errEl) errEl.textContent = "네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";
    } finally {
      setBusy(false);
    }
  });
} else {
  console.warn("[login.js] #loginForm 을 찾지 못했습니다. index.html의 <form id=\"loginForm\">를 확인하세요.");
}
