// admin.html 전용: 유료 멘토 검증 (숨은 주소, 운영자용)

const adminMain = document.getElementById("adminMain");

function formatSlot(slot) {
  const d = new Date(slot.replace(" ", "T"));
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd}(${weekday}) ${hh}:${mi}`;
}

async function render() {
  const mentors = await getMentors();
  const pending = mentors.filter((m) => m.price > 0 && !m.verified);

  if (pending.length === 0) {
    adminMain.innerHTML = `
      <h1 class="page-title">유료 멘토 검증</h1>
      <div class="empty"><b>검증 대기 중인 유료 멘토가 없어요</b>새로 등록되면 여기에 나타나요.</div>
    `;
    return;
  }

  adminMain.innerHTML = `
    <h1 class="page-title">유료 멘토 검증</h1>
    <p class="muted">새로 등록된 유료(전문가) 멘토를 확인하고 승인하거나 거절하세요.</p>
    <div class="tab-panel">${pending.map((m) => renderCard(m)).join("")}</div>
  `;
  attachEvents();
}

function renderCard(m) {
  return `
    <article class="reservation-card admin-card">
      <div class="r-head">
        <h3>${m.name}</h3>
        <span class="r-status status-대기">검증 대기</span>
      </div>
      <div class="r-meta">${m.type} · ${m.major} · ${m.price.toLocaleString()}원</div>
      <div class="tags">${m.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
      <p class="r-question">${m.bio}</p>
      <div class="r-meta">가능한 시간: ${m.slots.map(formatSlot).join(", ")}</div>
      <div class="admin-actions">
        <button type="button" class="confirm-btn" data-action="approve" data-id="${m.id}">승인</button>
        <button type="button" class="reject-btn" data-action="reject" data-id="${m.id}">거절</button>
      </div>
    </article>
  `;
}

function attachEvents() {
  adminMain.querySelectorAll('[data-action="approve"]').forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      const result = await verifyMentor(btn.dataset.id);
      if (!result) {
        alert("승인에 실패했어요. 이 계정에 관리자 권한이 없을 수 있어요.");
      }
      render();
    });
  });
  adminMain.querySelectorAll('[data-action="reject"]').forEach((btn) => {
    btn.addEventListener("click", async () => {
      const sure = confirm("정말 거절하시겠어요? 이 멘토 등록이 삭제돼요.");
      if (!sure) return;
      btn.disabled = true;
      const ok = await deleteMentor(btn.dataset.id);
      if (!ok) {
        alert("거절에 실패했어요. 이 계정에 관리자 권한이 없을 수 있어요.");
      }
      render();
    });
  });
}

render();
