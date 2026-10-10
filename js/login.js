// login.html 전용: Supabase Auth로 로그인 / 회원가입

const rawRedirect = new URLSearchParams(location.search).get("redirect");
// "/"나 "http://"처럼 외부 주소로 가는 값은 무시한다(로그인 후 외부 사이트로 보내는 오픈 리다이렉트 방지).
// 이 앱 안의 파일 이름(mentor.html?id=... 등)만 허용.
const redirectTarget = rawRedirect && /^[a-zA-Z0-9_-]+\.html($|\?)/.test(rawRedirect) ? rawRedirect : null;
const authBox = document.getElementById("authBox");
let activeTab = "login";

function goNext() {
  location.href = redirectTarget || "index.html";
}

async function render() {
  const user = await getCurrentUser();

  if (user) {
    authBox.innerHTML = `
      <h1>이미 로그인되어 있어요</h1>
      <p class="muted">${user.name ? user.name + " · " : ""}${user.email}로 로그인된 상태예요.</p>
      <button class="submit" id="continueBtn" type="button">계속하기</button>
      <button class="logout-link" id="switchBtn" type="button">다른 계정으로 로그인</button>
    `;
    document.getElementById("continueBtn").addEventListener("click", goNext);
    document.getElementById("switchBtn").addEventListener("click", async () => {
      await logout();
      render();
    });
    return;
  }

  authBox.innerHTML = `
    <h1>로그인 / 회원가입</h1>
    <div class="tabs" id="authTabs" role="tablist">
      <button type="button" class="tab" role="tab" data-tab="login">로그인</button>
      <button type="button" class="tab" role="tab" data-tab="signup">회원가입</button>
    </div>
    <div id="authPanel"></div>
  `;

  const tabs = authBox.querySelectorAll(".tab");
  tabs.forEach((btn) => {
    btn.setAttribute("aria-selected", btn.dataset.tab === activeTab ? "true" : "false");
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      tabs.forEach((b) => b.setAttribute("aria-selected", b === btn ? "true" : "false"));
      renderPanel();
    });
  });

  renderPanel();
}

function renderPanel() {
  const panel = document.getElementById("authPanel");
  if (activeTab === "login") renderLoginForm(panel);
  else renderSignupForm(panel);
}

function renderLoginForm(panel) {
  panel.innerHTML = `
    <p class="muted">이메일과 비밀번호로 로그인해요.</p>
    <form id="loginForm">
      <div class="field">
        <label for="loginEmail">이메일</label>
        <input type="email" id="loginEmail" required placeholder="you@email.com">
      </div>
      <div class="field">
        <label for="loginPassword">비밀번호</label>
        <input type="password" id="loginPassword" required placeholder="비밀번호">
      </div>
      <p class="field-error" id="loginError" hidden></p>
      <button class="submit" type="submit" id="loginSubmit">로그인</button>
    </form>
  `;

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errorEl = document.getElementById("loginError");
    const submitBtn = document.getElementById("loginSubmit");

    errorEl.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "로그인 중...";

    const result = await login(email, password);
    if (result.error) {
      errorEl.textContent = result.error;
      errorEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "로그인";
      return;
    }
    goNext();
  });
}

function renderSignupForm(panel) {
  panel.innerHTML = `
    <p class="muted">이메일·비밀번호·이름을 입력하면 바로 가입돼요.</p>
    <form id="signupForm">
      <div class="field">
        <label for="signupName">이름</label>
        <input type="text" id="signupName" required placeholder="홍길동">
      </div>
      <div class="field">
        <label for="signupEmail">이메일</label>
        <input type="email" id="signupEmail" required placeholder="you@email.com">
      </div>
      <div class="field">
        <label for="signupPassword">비밀번호</label>
        <input type="password" id="signupPassword" required minlength="6" placeholder="6자 이상">
      </div>
      <p class="field-error" id="signupError" hidden></p>
      <button class="submit" type="submit" id="signupSubmit">회원가입</button>
    </form>
  `;

  document.getElementById("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const errorEl = document.getElementById("signupError");
    const submitBtn = document.getElementById("signupSubmit");

    errorEl.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "가입 중...";

    const result = await signUp(email, password, name);
    if (result.error) {
      errorEl.textContent = result.error;
      errorEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "회원가입";
      return;
    }

    if (result.needsEmailConfirmation) {
      panel.innerHTML = `
        <div class="done">
          <h2>이메일을 확인해 주세요</h2>
          <p><b>${email}</b>로 확인 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝나요.</p>
        </div>
      `;
      return;
    }
    goNext();
  });
}

render();
