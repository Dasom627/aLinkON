/* =========================
   LinkON – Signup Frontend JS (api.js)
   - Step 1: 닉네임 중복확인(백엔드 API)
   - Step 2: 비밀번호/확인
   - Step 3: 이메일·전화 인증 + 관심분야 + 약관
   - 최종 가입: /api/signup POST
   ========================= */

// ★ 백엔드 API 주소 (서버는 node server.js로 3000포트에서 실행 중이어야 함)
const API = "http://127.0.0.1:3000"; // 또는 "http://localhost:3000" 프론트 서버와 같은 포트를 바라보도록 주소를 맞추는 것이다

// ===== 공통 엘리먼트 =====
const form      = document.getElementById("form");
//현재 문서에서 id가 'form'인 요소를 찾아서, 재할당하지 않을 변수 form에 담아둔다
const stepsEls  = [...document.querySelectorAll(".step")];
//문서에서 .step클래스를 가진 모든 요소를 찾아서, 그걸 배열로 변환해 stepEls라는 변수에 담는다
const panels    = [...document.querySelectorAll(".panel")];
//문서에서 .panels클래스를 가진 모든 요소를 찾아서, 그걸 배열로 변환해 panels라는 변수에 담는다

// 단계 전환
function goto(stepNumber){ //goto라는 함수를 선언
  panels.forEach(p => p.classList.toggle("is-active", p.dataset.step == stepNumber)); 
  //panels 배열 안의 모든 패널을 돌면서, 그 패널의 data-step값이 내가 원하는 stepNumber와 같으면 is-active 클래스를 붙이고, 아니면 떼라
  stepsEls.forEach(s => s.classList.toggle("is-active", s.dataset.step == stepNumber));
  //stepEls 배열 안의 모든 패널을 돌면서, 그 패널의 data-step값이 내가 원하는 stepNumber와 같으면 is-active 클래스를 붙이고, 아니면 떼라
}
// 뒤로가기 버튼(data-back)
document.querySelectorAll("[data-back]").forEach(b => b.addEventListener("click", () => { 
  //문서 안에 data-back 속성이 붙은 모든 버튼이나 링크를 찾아서, 각각에 클릭 이벤트를 달아준다.
  const active = panels.find(p => p.classList.contains("is-active"));
  //파널들 중에서 is-active 클래스를 가진 첫 번째 패널을 찾아서 active라는 변수에 저장한다
  const curr = Number(active?.dataset.step || 1);
  //현재 활성 패널의 data-step 값을 숫자로 가져오되, 없으면 1을 기본값으로 쓴다
  goto(Math.max(1, curr - 1)); //현재 단계에서 하나 이전 단계로 이동하되, 최소 1단계보다 작아지지 않도록 그 결과를 goto 함수에 넘겨 실행한다
}));

/* =========================
   STEP 1: 닉네임 중복확인
   ========================= */
const nickname = document.getElementById("nickname"); //HTML에서 id가 "nickname"인 요소를 찾아서 그걸 JS 변수 nickname에 저장
const checkDupBtn = document.getElementById("checkDupBtn"); //HTML에서 id가 "checkDupBtn"인 요소를 찾아서 그걸 JS 변수 checkDupBtn에 저장
const nickError = document.getElementById("nickError"); //HTML에서 id가 "nickError"인 요소를 찾아서 그걸 JS 변수 nickError에 저장
const toStep2 = document.getElementById("toStep2"); //HTML에서 id가 "toStep2"인 요소를 찾아서 그걸 JS 변수 toStep2에 저장

const reNick = /^[A-Za-z0-9._-]{3,20}$/; // 영문 소문자/숫자/.-_ 3~20자
let nicknameOK = false; //초기 상태를 닉네임이 확인되지 않은 상태로 기억함

function resetNickState(){ //닉네임 상태를 초기화하는 resetNickState함수
  nicknameOK = false; //아직 확인되지 않으니 false상태로 둔다
  if (toStep2) toStep2.disabled = true; //다음단계로 넘어가는 버튼을 막아둔다
  if (nickError) nickError.textContent = ""; //닉네임 입력란 밑에 있는 "에러 메세지 표시공간"을 초기화
}
nickname?.addEventListener("input", () => { //닉네임 입력칸에 글자를 입력하면 안쪽 함수 실행
  resetNickState(); //입력이 바뀌면 이전에 검증된 건 무효로 하며 에러 메세지 지우고, 다음 단계 버튼 잠금
  // 입력 멈추면 자동 검사(디바운스)
  clearTimeout(nickname._timer); //이전에 예약해 둔 검사 타이머 ID를 취소
  nickname._timer = setTimeout(checkNickname, 350); 
  //0.35초 뒤에 checkNickname()을 실행하라는 타이머를 예약하고, 그 예약 번호를 nickname._timer에 기억해두라
});

async function checkNickname(){ //비동기 함수인 checkNickname을 선언한다
  if (!nickname) return; //닉네임 입력요소가 존재하지 않으면 끝낸다
  const val = nickname.value.trim(); //사용자가 닉네임으로 입력한 값을 공백 없이 가져와 val변수에 넣는다

  // 1) 형식 체크
  if (!reNick.test(val)){ //닉네임이 규칙에 맞는지 검사한다
    if (nickError) nickError.textContent = "형식이 올바르지 않습니다. (영문자/숫자/.-_ 3~20자)"; //nickError자리에 메세지를 띄운다
    if (toStep2) toStep2.disabled = true; //step2로 가는 버튼을 비활성화 시킨다
    nicknameOK = false; //닉네임 검증 상태는 당연히 형식이 틀리니 false로 한다
    return; //함수 실행을 여기서 중단한다 
  }

  // 2) 서버에 가용성 문의
  try { //시도하지만 이게 안되면 catch부분으로 넘어감
    const r = await fetch(`${API}/api/nickname/check?name=${encodeURIComponent(val)}`); //최종 URL을 만든다
    const data = await r.json(); //URL을 전송해서 닉네임을 쓸 수 있는지 알아오고 그 응답을 json의 data변수에 받아온다
    if (data.ok && data.available){ //요청 자체가 성공했는지 확인하거나 닉네임이 쓰여져 있는지 확인한다
      if (nickError) nickError.textContent = "사용 가능한 닉네임입니다."; //nickError자리에 메세지를 띄운다
      if (toStep2) toStep2.disabled = false;   // ✅ 다음 활성화
      nicknameOK = true; //닉네임 검증 상태를 true로 하여 다음 단계로 넘어간다
    }else{ //위에 조건이 맞지 않을 때
      if (nickError) nickError.textContent = "이미 사용 중인 닉네임입니다."; //nickError자리에 메세지를 띄운다
      if (toStep2) toStep2.disabled = true; //다음 단계를 넘어가는 버튼을 비활성화 한다
      nicknameOK = false; //닉네밍 검증 상태를 false로 한다
    }
  } catch (e){ //서버통신에 실패하면 실행한다
    if (nickError) nickError.textContent = "서버 통신 실패. 서버가 켜져있는지 확인하세요."; //nickError자리에 메세지를 띄운다
    if (toStep2) toStep2.disabled = true; //다음 단계를 넘어가는 버튼을 비활성화 한다
    nicknameOK = false; //닉네임 검증 상태를 false로 한다
  }
}
checkDupBtn?.addEventListener("click", checkNickname); 
//닉네임 중복확인 버튼을 만들고 없으면 넘어가고 있으면 클릭을 통해 함수를 실행한다
toStep2?.addEventListener("click", () => { if (nicknameOK) goto(2); });
//다음단계 버튼을 만들어 클릭하면 nicknameOK가 true인지 확인하고 다음단계(step2)로 넘어긴다

/* =========================
   STEP 2: 비밀번호
   ========================= */
const password = document.getElementById("password"); //HTML에서 id가 "password"인 요소를 찾아서 그걸 JS 변수 password에 저장
const password2 = document.getElementById("password2"); //HTML에서 id가 "password2"인 요소를 찾아서 그걸 JS 변수 password2에 저장
const pwError = document.getElementById("pwError"); //HTML에서 id가 "pwError"인 요소를 찾아서 그걸 JS 변수 pwError에 저장
const pw2Error = document.getElementById("pw2Error"); //HTML에서 id가 "pw2Error"인 요소를 찾아서 그걸 JS 변수 pw2Error에 저장
const toStep3 = document.getElementById("toStep3"); //HTML에서 id가 "toStep3"인 요소를 찾아서 그걸 JS 변수 toStep3에 저장

function validatePw(){ //validatePw()함수를 정의하고 비밀번호 유효성 검사를 한다
  let ok = true; //ok라는 변수를 선언하고 참으로 한다
  if (pwError)  pwError.textContent = ""; //pwError가 나면 텍스트 공간을 빈공간으로 초기화한다
  if (pw2Error) pw2Error.textContent = ""; //pw2Error가 나면 텍스트 공간을 빈공간으로 초기화한다

  if (!password?.value || password.value.length < 8){ //비밀번호(password)의 값이 없거나 글자의 길이가 8글자 미만이면
    if (pwError) pwError.textContent = "8자 이상 입력하세요."; //텍스트를 나타내는 공간에 텍스트를 표시한다
    ok = false; //ok값을 false로 한다
  }
  if (!password2?.value || password2.value !== password.value){ //비밀번호(password2)의 값이 없거나 비밀번호(password)와 비밀번호2(password2)의 글자가 같지 않으면
    if (pw2Error) pw2Error.textContent = "비밀번호가 일치하지 않습니다."; //텍스트를 나타내는 공간에 텍스트를 표시한다
    ok = false; //ok값을 false로 한다
  }
  if (toStep3) toStep3.disabled = !ok; //ok가 true면 toStep3 값을 가질 수 있다
}
password?.addEventListener("input", validatePw); //사용자가 비밀번호를 바꾸면 validatePw함수를 신청한다
password2?.addEventListener("input", validatePw); //사용자가 비밀번호2를 바꾸면 validatePw함수를 신청한다
toStep3?.addEventListener("click", () => goto(3)); //버튼을 누르면 다음 페이지로 넘어가게 한다

/* =========================
   STEP 3: 이메일/전화 인증 + 관심
   ========================= */
const email = document.getElementById("email"); //HTML에서 id가 "email"인 요소를 찾아서 그걸 JS 변수 email에 저장
const emailError = document.getElementById("emailError"); //HTML에서 id가 "emailError"인 요소를 찾아서 그걸 JS 변수 emailError에 저장
const emailCodeInput = document.getElementById("emailCode"); //HTML에서 id가 "emailCode"인 요소를 찾아서 그걸 JS 변수 emailCodeInput에 저장
const emailCodeError = document.getElementById("emailCodeError"); //HTML에서 id가 "emailCodeError"인 요소를 찾아서 그걸 JS 변수 emailCodeError에 저장
const sendEmailCode = document.getElementById("sendEmailCode"); //HTML에서 id가 "sendEmailCode"인 요소를 찾아서 그걸 JS 변수 sendEmailCode에 저장

const phone = document.getElementById("phone"); //HTML에서 id가 "phone"인 요소를 찾아서 그걸 JS 변수 phone에 저장
const phoneError = document.getElementById("phoneError"); //HTML에서 id가 "phoneError"인 요소를 찾아서 그걸 JS 변수 phoneError에 저장
const smsCodeInput = document.getElementById("smsCode"); //HTML에서 id가 "smsCode"인 요소를 찾아서 그걸 JS 변수 smsCodeInput에 저장
const smsCodeError = document.getElementById("smsCodeError"); //HTML에서 id가 "smsCodeError"인 요소를 찾아서 그걸 JS 변수 smsCodeError에 저장
const sendSmsCode = document.getElementById("sendSmsCode"); //HTML에서 id가 "sendSmsCode"인 요소를 찾아서 그걸 JS 변수 sendSmsCode에 저장

const interest = document.getElementById("interest"); //HTML에서 id가 "interest"인 요소를 찾아서 그걸 JS 변수 interest에 저장
const interestError = document.getElementById("interestError"); //HTML에서 id가 "interestError"인 요소를 찾아서 그걸 JS 변수 interestError에 저장
const tos = document.getElementById("tos"); //HTML에서 id가 "tos"인 요소를 찾아서 그걸 JS 변수 tos에 저장
const submitBtn = document.getElementById("submitBtn"); //HTML에서 id가 "submitBtn"인 요소를 찾아서 그걸 JS 변수 submitBtn에 저장

let emailCode = null; //emailCode를 만들고 값을 비워둔다
let smsCode = null; //smsCode를 만들고 값을 비워둔다

function makeCode(){ return String(Math.floor(100000 + Math.random()*900000)); }
//makeCode함수를 정의하고, 소수점값을 버리고, 100000부터 999999미만의 난수를 만들어 문자열 값으로 리턴한다

sendEmailCode?.addEventListener("click", () => { //sendEmailCode라는 버튼이 있다면 클릭 안에 버튼을 실행
  if (!email?.validity.valid){ //email 입력창이 없거나, 입력한 이메일이 유효하지 않으면 
    if (emailError) emailError.textContent = "올바른 이메일을 입력하세요."; //emailError라는 공간에서 에러 메세지를 표시한다
    return; //함수 실행되면 즉시 종료
  }
  if (emailError) emailError.textContent = ""; //이메일이 유효할 경우 에러 메시지를 빈칸으로 채운다
  emailCode = makeCode(); //함수를 실행해서 랜덤한 인증코드를 만든 뒤 그 값을 emailCode 변수에 저장한다
  alert(`이메일 인증코드(데모): ${emailCode}`); //이메일 인증 코드를 알림창에 띄운다
});

sendSmsCode?.addEventListener("click", () => { //sendSmsCode의 버튼을 클릭하면
  const re = /^01[016789]-?\d{3,4}-?\d{4}$/; //re변수에 전화번호 형식으로 숫자를 입력을 받음
  if (!phone?.value || !re.test(phone.value.trim())){ //만약 전화번호 입력 받는 공간이 비어있거나 형식을 잘못 입력받으면
    if (phoneError) phoneError.textContent = "올바른 전화번호 형식(010-1234-5678)"; //Error텍스트를 띄우는 공간에 텍스트를 띄운다
    return; //함수를 종료한다
  }
  if (phoneError) phoneError.textContent = ""; //만약 제대로 된 값이 들어온다면 에러 메세지를 띄우지 않고
  smsCode = makeCode(); //smsCode라는 변수에 makeCode함수를 실행해서 넣는다
  alert(`문자 인증코드(데모): ${smsCode}`); //알림창으로 문자인증코드를 뜨게 한다
});

function validateFinal(){ //최종 검증을 하기위해 함수 정의
  // 기본 입력 검증
  if (emailError) emailError.textContent = (email?.validity.valid ? "" : "이메일을 확인하세요."); //이메일 에러 중 입력 형식이 맞다면 빈칸을 아니면 텍스트를 띄운다
  const phoneOk = phone?.value && /^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.value.trim()); //전화번호가 형식에 맞는지 확인한 뒤 phoneOk라는 변수에 결과를 저장
  if (phoneError) phoneError.textContent = (phoneOk ? "" : "전화번호를 확인하세요."); //전화번호 에러 중 입력 형식이 맞다면 빈칸을 아니면 텍스트를 띄운다
  if (interestError) interestError.textContent = (interest?.value ? "" : "관심 분야를 선택하세요."); //관심분야 형식에 입력이 있다면 빈칸 아니면 텍스트를 띄운다

  // 코드 일치 확인
  const emailOk = email?.validity.valid && emailCode && emailCodeInput?.value === emailCode; //emailCodeInput에 입력한 값이 emailCode랑 같아야 한다
  const smsOk   = phoneOk && smsCode && smsCodeInput?.value === smsCode; //smsCodeInput에 입력한 값이 emailCode랑 같아야 한다

  if (emailCodeError) emailCodeError.textContent = emailOk ? "" : "이메일 인증코드를 확인하세요."; //조건이 email에러가 뜨지 않으면 텍스트를 전송한다
  if (smsCodeError)   smsCodeError.textContent   = smsOk   ? "" : "문자 인증코드를 확인하세요."; //조건이 sms에러가 뜨지 않으면 텍스트를 전송한다

  const ready = emailOk && smsOk && !!interest?.value && !!tos?.checked; //email과 sms와 관심사와 약관동의가 되어야 true라는 값을 반환한다
  if (submitBtn) submitBtn.disabled = !ready; //submit버튼이 있고, 준비가 안되면 비활성화, 준비가 되면 활성화한다

}
["input","change"].forEach(ev=>{  //input과 change 두 개의 이벤트에 실행된다 (3번째 페이지에 해당해서)
  email?.addEventListener(ev, validateFinal); //email에 이벤트가 발생할 때마다 다시 검사한다
  emailCodeInput?.addEventListener(ev, validateFinal); //emailCodeInput에 이벤트가 발생할 때마다 다시 검사한다
  phone?.addEventListener(ev, validateFinal); //phone에 이벤트가 발생할 때마다 다시 검사한다
  smsCodeInput?.addEventListener(ev, validateFinal); //email에 이벤트가 발생할 때마다 다시 검사한다
  interest?.addEventListener(ev, validateFinal); //interest에 이벤트가 발생할 때마다 다시 검사한다
  tos?.addEventListener(ev, validateFinal); //tos에 이벤트가 발생할 때마다 다시 검사한다
});

/* =========================
   최종 제출 → /api/signup
   ========================= */
form?.addEventListener("submit", async (e) => { //form요소를 제출할 때
  e.preventDefault(); //기본 동작(새로고침 + 전송) 막기
  validateFinal(); //최종 검증 실행 (모든 칸 채워졌는지, 체크박스 동의했는지 등)
  if (submitBtn?.disabled) return; //아직 조건 안 맞으면 함수 종료

  const payload = {
    nickname: nickname?.value.trim(),
    email:    email?.value.trim(),
    phone:    phone?.value.trim(),
    // 실제 서비스: 비밀번호는 서버에서 bcrypt/argon2로 해시 저장하세요.
    password_hash: password?.value
  };

  try {
    const r = await fetch(`${API}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (r.ok){
      alert("가입 완료! 🎉 이제 이력서는 나중에 천천히 채워요.");
      window.location.href = "/HTML/index/index.html?joined=1"; 
      //가입 완료 후 로그인 화면으로 이동
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

// 로그인 폼 전송
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  const emailEl = document.getElementById("#email");
  const pwEl = document.getElementById("#password");
  const errEl = document.getElementById("#loginError");
  const btnEl = document.getElementById("#loginBtn");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errEl.textContent = "";

    const email = emailEl.value.trim();
    const password = pwEl.value;

    if (!email || !password) {
      errEl.textContent = "이메일과 비밀번호를 입력해 주세요.";
      return;
    }

    btnEl.disabled = true;

    try {
      const res = await fetch("${API}/api/login", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ email, password }),
        credentials: "include", // 쿠키(JWT) 수신
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        errEl.textContent = data.error || "로그인에 실패했어요.";
        btnEl.disabled = false;
        return;
      }

      // 로그인 성공 → 메인으로 이동 (원하는 경로로 바꿔도 됨)
      window.location.href = "/HTML/Index/index.html";
    } catch (err) {
      console.error(err);
      errEl.textContent = "네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";
      btnEl.disabled = false;
    }
  });
}
