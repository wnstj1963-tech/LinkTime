// mentor-apply.html 전용: 멘토 등록 폼

const TYPE_OPTIONS = ["선배", "졸업생", "현직자"];
const TAG_OPTIONS = ["편입", "자격증", "취업", "진로", "프로그래밍", "디자인", "어학", "자소서·면접", "대학원", "마케팅·기획"];
const SLOT_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

const applyMain = document.getElementById("applyMain");

function checkIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
}

async function init() {
  const user = await getCurrentUser();
  if (!user) {
    applyMain.innerHTML = `
      <div class="empty" style="margin-top:40px">
        <b>로그인이 필요해요</b>
        멘토 등록은 로그인한 사람만 할 수 있어요.
        <div style="margin-top:16px"><a class="again" href="login.html?redirect=mentor-apply.html">로그인하러 가기</a></div>
      </div>
    `;
    return;
  }
  const myMentor = await getMyMentor();
  if (myMentor) {
    applyMain.innerHTML = `
      <div class="empty" style="margin-top:40px">
        <b>이미 멘토로 등록되어 있어요</b>
        한 계정당 멘토 글은 하나만 만들 수 있어요. 받은 예약은 "받은 예약" 메뉴에서 확인할 수 있어요.
        <div style="margin-top:16px"><a class="again" href="mentor.html?id=${myMentor.id}">내 멘토 페이지 보기</a></div>
      </div>
    `;
    return;
  }
  renderForm();
}

function renderForm() {
  applyMain.innerHTML = `
    <h1 class="page-title">멘토로 등록하기</h1>
    <p class="muted" style="max-width:520px">먼저 겪어본 경험을 나눠 주세요. 등록하면 바로 멘토 목록에 올라가고, 경험 확인 배지는 운영팀이 나중에 붙여줘요.</p>

    <form id="applyForm" class="apply-form">
      <div class="field">
        <label for="name">이름</label>
        <input type="text" id="name" placeholder="예: 김도현" required>
      </div>

      <div class="field">
        <label>어떤 멘토인가요?</label>
        <div class="pickrow" id="typePicks">
          ${TYPE_OPTIONS.map((t) => `<button type="button" class="pick" data-type="${t}">${t}</button>`).join("")}
        </div>
      </div>

      <div class="field">
        <label for="major">전공 / 직무</label>
        <input type="text" id="major" placeholder="예: 컴퓨터소프트웨어과" required>
      </div>

      <div class="field">
        <label>어떤 분야를 도와줄 수 있나요? <span class="hint">여러 개 선택 가능</span></label>
        <div class="pickrow" id="tagPicks">
          ${TAG_OPTIONS.map((t) => `<button type="button" class="pick" data-tag="${t}">${t}</button>`).join("")}
        </div>
      </div>

      <div class="field">
        <label for="bio">자기소개</label>
        <textarea id="bio" placeholder="어떤 경험을 나눠줄 수 있는지 적어 주세요" required></textarea>
      </div>

      <div class="field">
        <label for="slots">가능한 시간 <span class="hint">쉼표(,)로 여러 개 적어 주세요</span></label>
        <input type="text" id="slots" placeholder="예: 2026-10-10 20:00, 2026-10-12 14:00">
        <p class="field-error" id="slotsError" hidden>시간은 "YYYY-MM-DD HH:MM" 형식으로, 쉼표로 구분해서 적어 주세요.</p>
      </div>

      <div class="field">
        <label>멘토링 가격</label>
        <div class="pickrow" id="pricePicks">
          <button type="button" class="pick" data-price-mode="free">무료로 시작</button>
          <button type="button" class="pick" data-price-mode="paid">유료 (전문가)</button>
        </div>
        <input type="number" id="priceAmount" class="price-amount" placeholder="1회 가격 (원)" min="1000" step="1000" hidden>
      </div>

      <p class="field-error" id="applyError" hidden></p>
      <button type="submit" class="submit" id="applySubmit" disabled>등록하기</button>
    </form>
  `;

  setupForm();
}

function setupForm() {
  const nameEl = document.getElementById("name");
  const majorEl = document.getElementById("major");
  const bioEl = document.getElementById("bio");
  const slotsEl = document.getElementById("slots");
  const slotsError = document.getElementById("slotsError");
  const priceAmountEl = document.getElementById("priceAmount");
  const submitBtn = document.getElementById("applySubmit");

  let selectedType = null;
  const selectedTags = new Set();
  let priceMode = null;

  document.querySelectorAll("#typePicks .pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#typePicks .pick").forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      selectedType = btn.dataset.type;
      checkReady();
    });
  });

  document.querySelectorAll("#tagPicks .pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tag = btn.dataset.tag;
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
        btn.setAttribute("aria-pressed", "false");
      } else {
        selectedTags.add(tag);
        btn.setAttribute("aria-pressed", "true");
      }
      checkReady();
    });
  });

  document.querySelectorAll("#pricePicks .pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#pricePicks .pick").forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      priceMode = btn.dataset.priceMode;
      priceAmountEl.hidden = priceMode !== "paid";
      if (priceMode === "free") priceAmountEl.value = "";
      checkReady();
    });
  });

  function parsedSlots() {
    const raw = slotsEl.value.trim();
    if (!raw) return [];
    return raw.split(",").map((s) => s.trim());
  }

  function slotsValid() {
    const slots = parsedSlots();
    return slots.length > 0 && slots.every((s) => SLOT_PATTERN.test(s));
  }

  function checkReady() {
    const slots = parsedSlots();
    const slotsOk = slots.length === 0 || slotsValid();
    slotsError.hidden = slotsOk;

    const priceOk = priceMode === "free" || (priceMode === "paid" && Number(priceAmountEl.value) > 0);

    submitBtn.disabled = !(
      nameEl.value.trim() &&
      selectedType &&
      majorEl.value.trim() &&
      selectedTags.size > 0 &&
      bioEl.value.trim() &&
      slots.length > 0 &&
      slotsValid() &&
      priceOk
    );
  }

  [nameEl, majorEl, bioEl, slotsEl, priceAmountEl].forEach((el) => el.addEventListener("input", checkReady));

  document.getElementById("applyForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("applyError");
    errorEl.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "등록 중...";

    const mentor = await createMentor({
      name: nameEl.value.trim(),
      type: selectedType,
      major: majorEl.value.trim(),
      tags: [...selectedTags],
      bio: bioEl.value.trim(),
      slots: parsedSlots(),
      price: priceMode === "paid" ? Number(priceAmountEl.value) : 0
    });

    if (!mentor) {
      errorEl.textContent = "등록에 실패했어요. 잠시 후 다시 시도해 주세요.";
      errorEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "등록하기";
      return;
    }
    showDone(mentor);
  });
}

function showDone(mentor) {
  applyMain.innerHTML = `
    <div class="done">
      <div class="mark">${checkIcon()}</div>
      <h2>등록이 완료됐어요</h2>
      <p><b>${mentor.name}</b> 멘토로 등록됐어요. 경험 확인 배지는 운영팀 확인 후 붙어요.</p>
      <a class="again" href="mentor.html?id=${mentor.id}">내 멘토 페이지 보기</a>
    </div>
  `;
}

init();
