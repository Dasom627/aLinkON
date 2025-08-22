// 가짜 닉네임 DB (데모용)
const takenNicknames = new Set(["admin", "linkon", "hong", "dev_god"]);

const form = document.getElementById("form");
const stepsEls = [...document.querySelectorAll(".step")];
const panels = [...document.querySelectorAll(".panel")];

const nickname = document.getElementById("nickname");
const checkDupBtn = document.getElementById("checkDupBtn");
const nickError = document.getElementById("nickError");
const toStep2 = document.getElementById("toStep2");

const password = document.getElementById("password");
const password2 = document.getElementById("password2");
const pwError = document.getElementById("pwError");
const pw2Error = document.getElementById("pw2Error");
const toStep3 = document.getElementById("toStep3");

const email = document.getElementById("email");
const emailError = document.getElementById("emailError");
const emailCodeInput = document.getElementById("emailCode");
const emailCodeError = document.getElementById("emailCodeError");
const sendEmailCodeBtn = document.getElementById("sendEmailCode");

const phone = document.getElementById("phone");
const phoneError = document.getElementById("phoneError");
const smsCodeInput = document.getElementById("smsCode");
const smsCodeError = document.getElementById("smsCodeError");
const sendSmsCodeBtn = document.getElementById("sendSmsCode");

const interest = document.getElementById("interest");
const interestError = document.getElementById("interestError");
const tos = document.getElementById("tos");
const submitBtn = document.getElementById("submitBtn");

let nicknameOK = false;
let emailCode = null;
let smsCode = null;

// 공통: 단계 전환
function goto(stepNumber){
  panels.forEach(p => p.classList.toggle("is-active", p.dataset.step == stepNumber));
  stepsEls.forEach(s => s.classList.toggle("is-active", s.dataset.step == stepNumber));
}
document.querySelectorAll("[data-back]").forEach(b => b.addEventListener("click", () => {
  const active = panels.find(p => p.classList.contains("is-active"));
  const curr = Number(active.dataset.step);
  goto(curr - 1);
}));

// STEP1: 닉네임 중복 체크
checkDupBtn.addEventListener("click", () => {
  const val = nickname.value.trim();
  const re = /^[a-z0-9._-]{3,20}$/;

  if(!re.test(val)){
    nickError.textContent = "형식이 올바르지 않습니다.";
    nicknameOK = false;
    toStep2.disabled = true;
    return;
  }
  // 서버가 있다면 fetch로 중복 체크. 지금은 로컬 데모.
  if(takenNicknames.has(val)){
    nickError.textContent = "이미 사용 중인 닉네임입니다.";
    nicknameOK = false;
  }else{
    nickError.textContent = "사용 가능한 닉네임입니다.";
    nicknameOK = true;
  }
  toStep2.disabled = !nicknameOK;
});

nickname.addEventListener("input", () => {
  nicknameOK = false;
  toStep2.disabled = true;
  nickError.textContent = "";
});

toStep2.addEventListener("click", () => goto(2));

// STEP2: 비밀번호 검증
function validatePw(){
  let ok = true;
  pwError.textContent = "";
  pw2Error.textContent = "";

  if(password.value.length < 8){
    pwError.textContent = "8자 이상 입력하세요.";
    ok = false;
  }
  if(password2.value !== password.value || !password2.value){
    pw2Error.textContent = "비밀번호가 일치하지 않습니다.";
    ok = false;
  }
  toStep3.disabled = !ok;
}
password.addEventListener("input", validatePw);
password2.addEventListener("input", validatePw);
toStep3.addEventListener("click", () => goto(3));

// STEP3: 이메일/전화 인증 (데모: 6자리 코드 생성)
function makeCode(){
  return String(Math.floor(100000 + Math.random()*900000));
}

sendEmailCodeBtn.addEventListener("click", () => {
  if(!email.validity.valid){
    emailError.textContent = "올바른 이메일을 입력하세요.";
    return;
  }
  emailError.textContent = "";
  emailCode = makeCode();
  alert(`이메일 코드(데모): ${emailCode}`);
});

sendSmsCodeBtn.addEventListener("click", () => {
  const re = /^01[016789]-?\d{3,4}-?\d{4}$/;
  if(!re.test(phone.value.trim())){
    phoneError.textContent = "올바른 전화번호를 입력하세요.";
    return;
  }
  phoneError.textContent = "";
  smsCode = makeCode();
  alert(`문자 코드(데모): ${smsCode}`);
});

// 폼 제출 가능 조건 체크
function validateFinal(){
  emailError.textContent = email.validity.valid ? "" : "이메일을 확인하세요.";
  phoneError.textContent = phone.value.trim().match(/^01[016789]-?\d{3,4}-?\d{4}$/) ? "" : "전화번호를 확인하세요.";
  interestError.textContent = interest.value ? "" : "관심 분야를 선택하세요.";

  const emailOK = emailError.textContent === "" && emailCode && emailCodeInput.value === emailCode;
  const smsOK = phoneError.textContent === "" && smsCode && smsCodeInput.value === smsCode;

  if(!emailOK){
    emailCodeError.textContent = "이메일 인증코드를 확인하세요.";
  }else{
    emailCodeError.textContent = "";
  }
  if(!smsOK){
    smsCodeError.textContent = "문자 인증코드를 확인하세요.";
  }else{
    smsCodeError.textContent = "";
  }

  submitBtn.disabled = !(emailOK && smsOK && !!interest.value && tos.checked);
}

["input","change"].forEach(ev=>{
  email.addEventListener(ev, validateFinal);
  emailCodeInput.addEventListener(ev, validateFinal);
  phone.addEventListener(ev, validateFinal);
  smsCodeInput.addEventListener(ev, validateFinal);
  interest.addEventListener(ev, validateFinal);
  tos.addEventListener(ev, validateFinal);
});

form.addEventListener("submit", (e)=>{
  e.preventDefault();
  validateFinal();
  if(submitBtn.disabled) return;

  // 실제 환경: 서버로 전송(fetch) + 토큰/세션 처리
  const payload = {
    nickname: nickname.value.trim(),
    email: email.value.trim(),
    phone: phone.value.trim(),
    interest: interest.value
  };
  console.log("signup payload", payload);
  alert("가입 완료! 🎉 이제 이력서는 나중에 천천히 채워요.");
});
