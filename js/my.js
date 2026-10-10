// my.html 전용: 내 예약(대기/확정/완료 탭)

const myMain = document.getElementById("myMain");
const TABS = ["대기", "확정", "완료"];
const requestedTab = new URLSearchParams(location.search).get("tab");
let activeTab = TABS.includes(requestedTab) ? requestedTab : "대기";
let currentUserEmail = null;

function formatSlot(slot) {
  const d = new Date(slot.replace(" ", "T"));
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd}(${weekday}) ${hh}:${mi}`;
}

async function init() {
  const user = await getCurrentUser();
  if (!user) {
    myMain.innerHTML = `
      <div class="empty" style="margin-top:40px">
        <b>로그인이 필요해요</b>
        내 예약을 보려면 먼저 로그인해 주세요.
        <div style="margin-top:16px"><a class="again" href="login.html?redirect=my.html">로그인하러 가기</a></div>
      </div>
    `;
    return;
  }
  currentUserEmail = user.email;
  renderShell();
}

function renderShell() {
  myMain.innerHTML = `
    <h1 class="page-title">내 예약</h1>
    <div class="tabs" id="tabs" role="tablist" aria-label="예약 상태">
      ${TABS.map((t) => `<button type="button" class="tab" role="tab" data-status="${t}">${t}</button>`).join("")}
    </div>
    <div class="tab-panel" id="tabPanel"></div>
  `;
  const tabs = myMain.querySelectorAll(".tab");
  tabs.forEach((btn) => {
    btn.setAttribute("aria-selected", btn.dataset.status === activeTab ? "true" : "false");
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.status;
      tabs.forEach((b) => b.setAttribute("aria-selected", b === btn ? "true" : "false"));
      renderPanel();
    });
  });
  renderPanel();
}

async function renderPanel() {
  const panel = document.getElementById("tabPanel");
  const all = await getMyReservations();
  const reservations = all.filter((r) => r.status === activeTab);

  if (reservations.length === 0) {
    panel.innerHTML = `<div class="empty"><b>${activeTab} 예약이 없어요</b>${
      activeTab === "대기" ? '<a href="mentors.html">멘토를 찾아 예약을 신청해보세요.</a>' : ""
    }</div>`;
    return;
  }

  const cards = await Promise.all(reservations.map((r) => renderCard(r)));
  panel.innerHTML = cards.join("");
  attachCardEvents(panel);
}

async function renderCard(r) {
  const mentor = await getMentor(r.mentor_id);
  const mentorName = mentor ? mentor.name : "알 수 없는 멘토";
  const mentorRole = mentor ? `${mentor.type} · ${mentor.major}` : "";

  const cancelBtn = `<button type="button" class="cancel-btn" data-action="cancel" data-id="${r.id}">예약 취소하기</button>`;

  let actionHtml = "";
  if (r.status === "대기") {
    actionHtml = `<p class="reviewed-note">멘토가 수락하면 여기서 확정으로 바뀌어요.</p>${cancelBtn}`;
  } else if (r.status === "확정") {
    const slotStart = new Date(r.slot.replace(" ", "T")).getTime();
    actionHtml =
      Date.now() >= slotStart
        ? `<a class="chat-btn" href="chat.html?reservation=${r.id}">대화하기</a>`
        : `<p class="reviewed-note">${formatSlot(r.slot)}에 대화할 수 있어요.</p>${cancelBtn}`;
  } else if (r.status === "완료") {
    // "이미 후기 남김" 판단은 멘토 전체가 아니라 지금 로그인한 나 자신이 쓴 후기가 있는지로 본다.
    // (reviews에 reservationId가 없어서 완벽히 예약 단위로는 못 가리고, 멘토+나 기준으로 본다.)
    const myReview = mentor && mentor.reviews.find((rv) => rv.user_id === currentUserEmail);
    actionHtml = myReview
      ? `<p class="reviewed-note">${"★".repeat(myReview.rating)}${"☆".repeat(5 - myReview.rating)} 후기를 남겼어요</p>`
      : `<button type="button" class="review-btn" data-id="${r.id}" data-mentor="${r.mentor_id}">후기 쓰기</button>
         <div class="review-form" id="reviewForm-${r.id}" hidden></div>`;
  }

  return `
    <article class="reservation-card">
      <div class="r-head">
        <h3>${mentorName}</h3>
        <span class="r-status status-${r.status}">${r.status}</span>
      </div>
      <div class="r-meta">${mentorRole} · ${formatSlot(r.slot)}</div>
      <p class="r-question">${r.question}</p>
      ${actionHtml}
    </article>
  `;
}

function attachCardEvents(panel) {
  panel.querySelectorAll(".review-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openReviewForm(btn.dataset.id, btn.dataset.mentor);
    });
  });
  panel.querySelectorAll(".cancel-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("정말 예약을 취소하시겠어요?")) return;
      btn.disabled = true;
      const updated = await updateReservationStatus(btn.dataset.id, "취소");
      if (!updated) {
        alert("취소 처리에 실패했어요. 다시 시도해 주세요.");
        btn.disabled = false;
        return;
      }
      renderPanel();
    });
  });
}

function openReviewForm(reservationId, mentorId) {
  const form = document.getElementById(`reviewForm-${reservationId}`);
  const btn = document.querySelector(`.review-btn[data-id="${reservationId}"]`);
  btn.hidden = true;
  form.hidden = false;
  form.innerHTML = `
    <div class="rate-picks" id="rate-${reservationId}">
      ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="rate-pick" data-rating="${n}">${n}점</button>`).join("")}
    </div>
    <textarea id="reviewText-${reservationId}" placeholder="어떤 점이 도움이 됐는지 남겨 주세요"></textarea>
    <button type="button" class="review-submit" id="reviewSubmit-${reservationId}" disabled>후기 남기기</button>
  `;

  let rating = 0;
  const rateGroup = document.getElementById(`rate-${reservationId}`);
  const textEl = document.getElementById(`reviewText-${reservationId}`);
  const submitBtn = document.getElementById(`reviewSubmit-${reservationId}`);

  function checkReady() {
    submitBtn.disabled = !(rating > 0 && textEl.value.trim());
  }

  rateGroup.querySelectorAll(".rate-pick").forEach((p) => {
    p.addEventListener("click", () => {
      rating = Number(p.dataset.rating);
      rateGroup.querySelectorAll(".rate-pick").forEach((x) => x.setAttribute("aria-pressed", "false"));
      p.setAttribute("aria-pressed", "true");
      checkReady();
    });
  });
  textEl.addEventListener("input", checkReady);

  submitBtn.addEventListener("click", async () => {
    submitBtn.disabled = true;
    const review = await createReview(mentorId, rating, textEl.value.trim());
    if (!review) {
      alert("후기 작성에 실패했어요. 다시 시도해 주세요.");
      submitBtn.disabled = false;
      return;
    }
    await renderPanel();
  });
}

init();
