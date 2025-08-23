/* =========================
   LinkON – Signup Frontend JS (api.js)
   - Step 1: 닉네임 중복확인(백엔드 API)
   - Step 2: 비밀번호/확인
   - Step 3: 이메일·전화 인증 + 관심분야 + 약관
   - 최종 가입: /api/signup POST
   ========================= */

// ★ 백엔드 API 주소 (서버는 node server.js로 3000포트에서 실행 중이어야 함)
const API = "http://127.0.0.1:3000"; // 또는 "http://localhost:3000"

// ===== 공통 엘리먼트 =====
const form      = document.getElementById("form");
const stepsEls  = [...document.querySelectorAll(".step")];
const panels    = [...document.querySelectorAll(".panel")];

// 단계 전환
function goto(stepNumber){
  panels.forEach(p => p.classList.toggle("is-active", p.dataset.step == stepNumber));
  stepsEls.forEach(s => s.classList.toggle("is-active", s.dataset.step == stepNumber));
}
// 뒤로가기 버튼(data-back)
document.querySelectorAll("[data-back]").forEach(b => b.addEventListener("click", () => {
  const active = panels.find(p => p.classList.contains("is-active"));
  const curr = Number(active?.dataset.step || 1);
  goto(Math.max(1, curr - 1));
}));

/* =========================
   STEP 1: 닉네임 중복확인
   ========================= */
const nickname     = document.getElementById("nickname");
const checkDupBtn  = document.getElementById("checkDupBtn");
const nickError    = document.getElementById("nickError");
const toStep2      = document.getElementById("toStep2");

const reNick = /^[a-z0-9._-]{3,20}$/; // 영문 소문자/숫자/.-_ 3~20자
let nicknameOK = false;

function resetNickState(){
  nicknameOK = false;
  if (toStep2) toStep2.disabled = true;
  if (nickError) nickError.textContent = "";
}
nickname?.addEventListener("input", () => {
  resetNickState();
  // 입력 멈추면 자동 검사(디바운스)
  clearTimeout(nickname._timer);
  nickname._timer = setTimeout(checkNickname, 350);
});

async function checkNickname(){
  if (!nickname) return;
  const val = nickname.value.trim();

  // 1) 형식 체크
  if (!reNick.test(val)){
    if (nickError) nickError.textContent = "형식이 올바르지 않습니다. (영소문자/숫자/.-_ 3~20자)";
    if (toStep2) toStep2.disabled = true;
    nicknameOK = false;
    return;
  }

  // 2) 서버에 가용성 문의
  try {
    const r = await fetch(`${API}/api/nickname/check?name=${encodeURIComponent(val)}`);
    const data = await r.json();
    if (data.ok && data.available){
      if (nickError) nickError.textContent = "사용 가능한 닉네임입니다.";
      if (toStep2) toStep2.disabled = false;   // ✅ 다음 활성화
      nicknameOK = true;
    }else{
      if (nickError) nickError.textContent = "이미 사용 중인 닉네임입니다.";
      if (toStep2) toStep2.disabled = true;
      nicknameOK = false;
    }
  } catch (e){
    if (nickError) nickError.textContent = "서버 통신 실패. 서버가 켜져있는지 확인하세요.";
    if (toStep2) toStep2.disabled = true;
    nicknameOK = false;
  }
}
checkDupBtn?.addEventListener("click", checkNickname);
toStep2?.addEventListener("click", () => { if (nicknameOK) goto(2); });

/* =========================
   STEP 2: 비밀번호
   ========================= */
const password   = document.getElementById("password");
const password2  = document.getElementById("password2");
const pwError    = document.getElementById("pwError");
const pw2Error   = document.getElementById("pw2Error");
const toStep3    = document.getElementById("toStep3");

function validatePw(){
  let ok = true;
  if (pwError)  pwError.textContent = "";
  if (pw2Error) pw2Error.textContent = "";

  if (!password?.value || password.value.length < 8){
    if (pwError) pwError.textContent = "8자 이상 입력하세요.";
    ok = false;
  }
  if (!password2?.value || password2.value !== password.value){
    if (pw2Error) pw2Error.textContent = "비밀번호가 일치하지 않습니다.";
    ok = false;
  }
  if (toStep3) toStep3.disabled = !ok;
}
password?.addEventListener("input", validatePw);
password2?.addEventListener("input", validatePw);
toStep3?.addEventListener("click", () => goto(3));

/* =========================
   STEP 3: 이메일/전화 인증 + 관심
   ========================= */
const email          = document.getElementById("email");
const emailError     = document.getElementById("emailError");
const emailCodeInput = document.getElementById("emailCode");
const emailCodeError = document.getElementById("emailCodeError");
const sendEmailCode  = document.getElementById("sendEmailCode");

const phone          = document.getElementById("phone");
const phoneError     = document.getElementById("phoneError");
const smsCodeInput   = document.getElementById("smsCode");
const smsCodeError   = document.getElementById("smsCodeError");
const sendSmsCode    = document.getElementById("sendSmsCode");

const interest       = document.getElementById("interest");
const interestError  = document.getElementById("interestError");
const tos            = document.getElementById("tos");
const submitBtn      = document.getElementById("submitBtn");

let emailCode = null;
let smsCode   = null;

function makeCode(){ return String(Math.floor(100000 + Math.random()*900000)); }

sendEmailCode?.addEventListener("click", () => {
  if (!email?.validity.valid){
    if (emailError) emailError.textContent = "올바른 이메일을 입력하세요.";
    return;
  }
  if (emailError) emailError.textContent = "";
  emailCode = makeCode();
  alert(`이메일 인증코드(데모): ${emailCode}`);
});

sendSmsCode?.addEventListener("click", () => {
  const re = /^01[016789]-?\d{3,4}-?\d{4}$/;
  if (!phone?.value || !re.test(phone.value.trim())){
    if (phoneError) phoneError.textContent = "올바른 전화번호 형식(010-1234-5678)";
    return;
  }
  if (phoneError) phoneError.textContent = "";
  smsCode = makeCode();
  alert(`문자 인증코드(데모): ${smsCode}`);
});

function validateFinal(){
  // 기본 입력 검증
  if (emailError) emailError.textContent = (email?.validity.valid ? "" : "이메일을 확인하세요.");
  const phoneOk = phone?.value && /^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.value.trim());
  if (phoneError) phoneError.textContent = (phoneOk ? "" : "전화번호를 확인하세요.");
  if (interestError) interestError.textContent = (interest?.value ? "" : "관심 분야를 선택하세요.");

  // 코드 일치 확인
  const emailOk = email?.validity.valid && emailCode && emailCodeInput?.value === emailCode;
  const smsOk   = phoneOk && smsCode && smsCodeInput?.value === smsCode;

  if (emailCodeError) emailCodeError.textContent = emailOk ? "" : "이메일 인증코드를 확인하세요.";
  if (smsCodeError)   smsCodeError.textContent   = smsOk   ? "" : "문자 인증코드를 확인하세요.";

  const ready = emailOk && smsOk && !!interest?.value && !!tos?.checked;
  if (submitBtn) submitBtn.disabled = !ready;
}
["input","change"].forEach(ev=>{
  email?.addEventListener(ev, validateFinal);
  emailCodeInput?.addEventListener(ev, validateFinal);
  phone?.addEventListener(ev, validateFinal);
  smsCodeInput?.addEventListener(ev, validateFinal);
  interest?.addEventListener(ev, validateFinal);
  tos?.addEventListener(ev, validateFinal);
});

/* =========================
   최종 제출 → /api/signup
   ========================= */
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  validateFinal();
  if (submitBtn?.disabled) return;

  const payload = {
    nickname: nickname?.value.trim(),
    email:    email?.value.trim(),
    phone:    phone?.value.trim(),
    // 실제 서비스: 비밀번호는 서버에서 bcrypt/argon2로 해시 저장하세요.
    password_hash: null
  };

  try {
    const r = await fetch(`${API}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (r.ok){
      alert("가입 완료! 🎉 이제 이력서는 나중에 천천히 채워요.");
      // TODO: 완료 페이지로 이동 등
    }else if (r.status === 409){
      alert("닉네임이 방금 선점됐어요. 다시 선택해주세요.");
      goto(1);
    }else{
      alert("서버 오류가 발생했습니다.");
    }
  } catch {
    alert("네트워크 오류가 발생했습니다.");
  }
});
