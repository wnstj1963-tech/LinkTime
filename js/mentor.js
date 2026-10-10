// mentor.html 전용: 멘토 상세·예약 신청

const EXAMPLE_BY_TAG = {
  편입: "편입을 준비할 때 학점이나 영어 성적을 어떻게 보완했는지 궁금해요.",
  자격증: "이 자격증을 딸 때 어떤 순서로 공부하면 좋을지 궁금해요.",
  취업: "처음 취업을 준비할 때 가장 중요하게 챙긴 게 무엇인지 궁금해요.",
  진로: "지금 이 길을 선택하게 된 계기와 고민했던 부분이 궁금해요.",
  "프로그래밍": "실력을 어떻게 증명하고 포트폴리오를 준비했는지 궁금해요.",
  디자인: "포트폴리오를 어떻게 채웠고, 무엇을 가장 중요하게 봤는지 궁금해요.",
  어학: "점수를 어떻게 끌어올렸는지, 공부 순서가 궁금해요.",
  "자소서·면접": "자기소개서나 면접에서 가장 신경 쓴 부분이 궁금해요.",
  대학원: "대학원 진학을 결심한 계기와 준비 과정이 궁금해요.",
  "마케팅·기획": "실무에서 기획할 때 어떤 과정을 거치는지 궁금해요."
};

const PENDING_KEY = "itneun_pending_booking";

const params = new URLSearchParams(location.search);
const mentorId = params.get("id");
const mentorMain = document.getElementById("mentorMain");

(async () => {
  const mentor = mentorId ? await getMentor(mentorId) : null;
  if (!mentor) {
    mentorMain.innerHTML =
      '<div class="placeholder">멘토를 찾을 수 없어요. <a href="mentors.html">멘토 찾기로 돌아가기</a></div>';
    return;
  }
  const user = await getCurrentUser();
  const isOwner = Boolean(user && mentor.owner_id === user.id);
  renderMentor(mentor, isOwner);
})();

function checkIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
}

function formatSlot(slot) {
  const d = new Date(slot.replace(" ", "T"));
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd}(${weekday}) ${hh}:${mi}`;
}

function stars(rating) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function renderMentor(m, isOwner) {
  const priceText = m.price === 0 ? "무료" : m.price.toLocaleString() + "원";
  const avg =
    m.reviews.length > 0
      ? (m.reviews.reduce((sum, r) => sum + r.rating, 0) / m.reviews.length).toFixed(1)
      : null;

  mentorMain.innerHTML = `
    <a class="back-link" href="mentors.html">← 멘토 찾기로</a>

    <section class="profile">
      <div class="profile-top">
        <div class="avatar large">${m.name[0]}</div>
        <div>
          <h1>${m.name}${m.verified ? `<span class="verified-badge" title="경험·경력 확인됨">${checkIcon()}확인됨</span>` : ""}</h1>
          <div class="role">${m.type} · ${m.major}</div>
        </div>
      </div>
      <div class="tags">${m.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
      <p class="bio">${m.bio}</p>
      <span class="price ${m.price === 0 ? "free" : "paid"}">${priceText}</span>
    </section>

    <section class="booking" id="bookingSection">
      <h2>대화 예약하기</h2>
      ${
        isOwner
          ? '<p class="muted">본인이 등록한 멘토 글이에요. 받은 예약은 "받은 예약" 메뉴에서 확인할 수 있어요.</p>'
          : `
      <div class="field">
        <label>가능한 시간 중 골라주세요</label>
        <div class="pickrow" id="slotPicks">
          ${m.slots.map((s) => `<button type="button" class="pick" data-slot="${s}">${formatSlot(s)}</button>`).join("")}
        </div>
        <p class="pick-note" id="slotNote" hidden></p>
      </div>
      <div class="field">
        <div class="field-head">
          <label for="question">무엇이 궁금한가요?</label>
          <button type="button" class="example-btn" id="exampleBtn">질문 예시 넣기</button>
        </div>
        <textarea id="question" placeholder="궁금한 점을 구체적으로 적어주세요"></textarea>
      </div>
      <button class="submit" id="submitBtn" type="button" disabled>예약 신청하기</button>
      `
      }
    </section>

    <section class="reviews">
      <h2>후기 ${avg ? `<span class="avg">⭐ ${avg} · ${m.reviews.length}개</span>` : ""}</h2>
      ${
        m.reviews.length === 0
          ? '<p class="no-review">아직 후기가 없어요.</p>'
          : m.reviews
              .map(
                (r) => `
          <div class="review-item">
            <div class="review-stars">${stars(r.rating)}</div>
            <p>${r.text}</p>
          </div>`
              )
              .join("")
      }
    </section>
  `;

  if (!isOwner) setupBooking(m);
}

async function setupBooking(m) {
  const picks = document.getElementById("slotPicks");
  const slotNote = document.getElementById("slotNote");
  const question = document.getElementById("question");
  const exampleBtn = document.getElementById("exampleBtn");
  const submitBtn = document.getElementById("submitBtn");
  let selectedSlot = null;

  function checkReady() {
    submitBtn.disabled = !(selectedSlot && question.value.trim());
  }

  // 이미 다른 사람이 "대기" 또는 "확정"으로 잡아 둔 시간은 아예 고를 수 없게 막아 둔다.
  async function markTakenSlots() {
    const taken = new Set(await getTakenSlots(m.id));
    picks.querySelectorAll(".pick").forEach((btn) => {
      const isTaken = taken.has(btn.dataset.slot);
      btn.classList.toggle("pick-taken", isTaken);
      btn.disabled = isTaken;
      if (isTaken) btn.title = "이미 예약된 시간이에요";
      if (isTaken && selectedSlot === btn.dataset.slot) {
        selectedSlot = null;
        btn.setAttribute("aria-pressed", "false");
      }
    });
    checkReady();
  }
  await markTakenSlots();

  picks.querySelectorAll(".pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      picks.querySelectorAll(".pick").forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      selectedSlot = btn.dataset.slot;
      checkReady();
    });
  });

  exampleBtn.addEventListener("click", () => {
    question.value = EXAMPLE_BY_TAG[m.tags[0]] || "가장 궁금한 점을 편하게 적어주세요.";
    checkReady();
  });

  question.addEventListener("input", checkReady);

  submitBtn.addEventListener("click", async () => {
    const user = await getCurrentUser();
    if (!user) {
      sessionStorage.setItem(
        PENDING_KEY,
        JSON.stringify({ mentorId: m.id, slot: selectedSlot, question: question.value })
      );
      location.href = `login.html?redirect=${encodeURIComponent("mentor.html?id=" + m.id)}`;
      return;
    }
    submitBtn.disabled = true;
    const result = await createReservation(m.id, selectedSlot, question.value.trim());
    if (result.reservation) {
      showDone(m);
      return;
    }
    if (result.error === "slot_taken") {
      slotNote.hidden = false;
      slotNote.textContent = "방금 다른 분이 먼저 예약한 시간이에요. 다른 시간을 골라 주세요.";
    } else {
      alert("예약 신청에 실패했어요. 다시 시도해 주세요.");
    }
    await markTakenSlots();
  });

  // 로그인 화면에 다녀온 뒤 돌아왔으면 고르던 시간·질문을 복원
  restorePending(m, picks, question, checkReady);
}

function restorePending(m, picks, question, checkReady) {
  const raw = sessionStorage.getItem(PENDING_KEY);
  if (!raw) return;
  sessionStorage.removeItem(PENDING_KEY);
  const pending = JSON.parse(raw);
  if (pending.mentorId !== m.id) return;

  question.value = pending.question || "";
  if (pending.slot) {
    const btn = picks.querySelector(`.pick[data-slot="${pending.slot}"]`);
    if (btn) btn.click();
  }
  checkReady();
}

function showDone(m) {
  const bookingSection = document.getElementById("bookingSection");
  bookingSection.innerHTML = `
    <div class="done">
      <div class="mark">${checkIcon()}</div>
      <h2>신청이 완료됐어요</h2>
      <p><b>${m.name}</b> 멘토에게 예약 신청을 보냈어요. 확정되면 내 예약에서 확인할 수 있어요.</p>
      <a class="again" href="my.html">내 예약 보기</a>
    </div>
  `;
}
