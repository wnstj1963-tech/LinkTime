// mentor-inbox.html 전용: 내가 등록한 멘토에게 들어온 예약 + 대화함(여러 멘티와의 대화를 한곳에 모아 보는 목록)
// 대화 자체는 여기서 보여주지 않고, 눌렀을 때 chat.html로 이동해서 본다.

const inboxMain = document.getElementById("inboxMain");

let reservations = [];
let profileNames = {}; // { user_id: 이름 } — 내 멘토 글에 예약한 적 있는 멘티만 보임(RLS)

function formatSlot(slot) {
  const d = new Date(slot.replace(" ", "T"));
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd}(${weekday}) ${hh}:${mi}`;
}

function menteeName(r) {
  return profileNames[r.user_id] || "멘티";
}

async function init() {
  const user = await getCurrentUser();
  if (!user) {
    inboxMain.innerHTML = `
      <div class="empty" style="margin-top:40px">
        <b>로그인이 필요해요</b>
        받은 예약을 보려면 먼저 로그인해 주세요.
        <div style="margin-top:16px"><a class="again" href="login.html?redirect=mentor-inbox.html">로그인하러 가기</a></div>
      </div>
    `;
    return;
  }
  await loadAndRender();
}

async function loadAndRender() {
  reservations = await getIncomingReservations();
  profileNames = await getProfileNames(reservations.map((r) => r.user_id));
  renderPage();
}

function renderPage() {
  const pending = reservations.filter((r) => r.status === "대기");
  const conversations = reservations.filter((r) => r.status !== "대기");

  inboxMain.innerHTML = `
    <h1 class="page-title">받은 예약</h1>
    ${pending.length > 0 ? renderPendingSection(pending) : ""}
    <h2 class="section-title">대화함</h2>
    ${
      conversations.length === 0
        ? '<div class="empty"><b>아직 대화가 없어요</b>예약을 수락하면 여기서 멘티와의 대화를 모아 볼 수 있어요.</div>'
        : `<div class="tab-panel">${conversations.map((r) => renderConversationCard(r)).join("")}</div>`
    }
  `;

  attachPendingEvents();
  attachConversationEvents();
}

function renderPendingSection(pending) {
  return `
    <h2 class="section-title">새로 들어온 신청</h2>
    <div class="tab-panel" id="pendingList">
      ${pending.map((r) => renderPendingCard(r)).join("")}
    </div>
  `;
}

function renderPendingCard(r) {
  return `
    <article class="reservation-card">
      <div class="r-head">
        <h3>${menteeName(r)}님의 신청</h3>
        <span class="r-status status-${r.status}">${r.status}</span>
      </div>
      <div class="r-meta">${formatSlot(r.slot)}</div>
      <p class="r-question">${r.question}</p>
      <button type="button" class="confirm-btn" data-action="accept" data-id="${r.id}">수락하기</button>
      <button type="button" class="cancel-btn" data-action="reject" data-id="${r.id}">거절하기</button>
    </article>
  `;
}

function renderConversationCard(r) {
  const mentee = menteeName(r);
  const slotStart = new Date(r.slot.replace(" ", "T")).getTime();

  let actionHtml = "";
  if (r.status === "확정") {
    actionHtml =
      Date.now() >= slotStart
        ? `<a class="chat-btn" href="chat.html?reservation=${r.id}">대화하기</a>`
        : `<p class="reviewed-note">${formatSlot(r.slot)}에 대화할 수 있어요.</p><button type="button" class="cancel-btn" data-action="cancel" data-id="${r.id}">취소하기</button>`;
  } else if (r.status === "완료") {
    actionHtml = `<a class="chat-btn" href="chat.html?reservation=${r.id}">대화 보기</a>`;
  } else if (r.status === "취소") {
    actionHtml = `<p class="reviewed-note">취소된 예약이에요.</p>`;
  }

  return `
    <article class="reservation-card">
      <div class="r-head">
        <h3>${mentee}</h3>
        <span class="r-status status-${r.status}">${r.status}</span>
      </div>
      <div class="r-meta">${formatSlot(r.slot)}</div>
      <p class="r-question">${r.question}</p>
      ${actionHtml}
    </article>
  `;
}

function attachPendingEvents() {
  inboxMain.querySelectorAll('[data-action="accept"]').forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      const ok = await updateReservationStatus(btn.dataset.id, "확정");
      if (!ok) alert("수락 처리에 실패했어요. 다시 시도해 주세요.");
      await loadAndRender();
    });
  });
  inboxMain.querySelectorAll('[data-action="reject"]').forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("이 예약 신청을 거절하시겠어요?")) return;
      btn.disabled = true;
      const ok = await updateReservationStatus(btn.dataset.id, "취소");
      if (!ok) alert("거절 처리에 실패했어요. 다시 시도해 주세요.");
      await loadAndRender();
    });
  });
}

function attachConversationEvents() {
  inboxMain.querySelectorAll('[data-action="cancel"]').forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("확정된 예약을 취소하시겠어요?")) return;
      btn.disabled = true;
      const ok = await updateReservationStatus(btn.dataset.id, "취소");
      if (!ok) alert("취소 처리에 실패했어요. 다시 시도해 주세요.");
      await loadAndRender();
    });
  });
}

init();
