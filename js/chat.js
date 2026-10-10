// chat.html 전용: 1:1 채팅 (예: chat.html?reservation=...)
// 멘티·멘토 둘 다 이 화면을 쓴다. Supabase Realtime으로 상대 메시지가 새로고침 없이 뜬다.

const reservationId = new URLSearchParams(location.search).get("reservation");
const chatMain = document.getElementById("chatMain");
const CHAT_DURATION_MS = 60 * 60 * 1000; // 예약 시간(slot)부터 1시간 동안만 대화 가능

let currentUserId = null;
let unsubscribe = null;
let countdownInterval = null;
let notepadSaveTimer = null;
let flushPendingNote = null; // 대화가 자동/수동으로 끝나기 전에 메모 저장을 먼저 끝내기 위한 함수

function formatSlot(slot) {
  const d = new Date(slot.replace(" ", "T"));
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd}(${weekday}) ${hh}:${mi}`;
}

function formatTime(time) {
  const d = new Date(time);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mi}`;
}

// 남은 시간을 "12:34" 또는(한 시간 넘게 남았으면) "1:12:34"로
function formatDuration(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

async function init() {
  const user = await getCurrentUser();
  if (!user) {
    chatMain.innerHTML = `
      <div class="empty" style="margin-top:40px">
        <b>로그인이 필요해요</b>
        대화를 보려면 먼저 로그인해 주세요.
        <div style="margin-top:16px"><a class="again" href="login.html?redirect=${encodeURIComponent("chat.html" + location.search)}">로그인하러 가기</a></div>
      </div>
    `;
    return;
  }
  currentUserId = user.id;

  const reservation = reservationId ? await getReservation(reservationId) : null;
  if (!reservation) {
    chatMain.innerHTML =
      '<div class="empty" style="margin-top:40px"><b>예약을 찾을 수 없어요</b>잘못된 링크이거나, 이 대화를 볼 권한이 없어요.</div>';
    return;
  }
  if (reservation.status === "대기") {
    chatMain.innerHTML =
      '<div class="empty" style="margin-top:40px"><b>아직 확정된 예약이 아니에요</b>멘토가 수락하면 대화할 수 있어요.</div>';
    return;
  }
  if (reservation.status === "취소") {
    chatMain.innerHTML =
      '<div class="empty" style="margin-top:40px"><b>취소된 예약이에요</b>이 예약은 취소되어 대화할 수 없어요.</div>';
    return;
  }
  // "확정" 상태라도 예약 시간이 되기 전에는 대화를 열 수 없다(완료된 예약은 지난 대화를 계속 볼 수 있어야 하니 그대로 둠).
  if (reservation.status === "확정") {
    const slotStart = new Date(reservation.slot.replace(" ", "T")).getTime();
    if (Date.now() < slotStart) {
      chatMain.innerHTML = `<div class="empty" style="margin-top:40px"><b>아직 예약 시간이 안 됐어요</b>${formatSlot(reservation.slot)}에 대화를 시작할 수 있어요.</div>`;
      return;
    }
  }

  await renderChat(reservation);
}

async function renderChat(reservation) {
  const mentor = await getMentor(reservation.mentor_id);
  const isMentor = Boolean(mentor && mentor.owner_id === currentUserId);
  const menteeName = isMentor ? (await getProfileNames([reservation.user_id]))[reservation.user_id] || "멘티" : null;
  const deadline = new Date(reservation.slot.replace(" ", "T")).getTime() + CHAT_DURATION_MS;
  let ended = reservation.status === "완료";

  // 예약 시간부터 1시간이 이미 지났는데 아직 완료 처리가 안 돼 있으면, 지금 열어본 사람이 정리해 준다.
  if (!ended && Date.now() >= deadline) {
    const updated = await updateReservationStatus(reservation.id, "완료");
    if (updated) {
      reservation = updated;
      ended = true;
    }
  }

  stopCountdown();

  chatMain.innerHTML = `
    <a class="back-link" href="${isMentor ? "mentor-inbox.html" : "my.html"}">← ${isMentor ? "받은 예약으로" : "내 예약으로"}</a>
    <div class="chat-header">
      <h1>${isMentor ? menteeName : mentor ? mentor.name : "알 수 없는 멘토"}</h1>
      <div class="chat-meta">${formatSlot(reservation.slot)} 예약${ended ? "" : ' · <span id="chatTimer" class="chat-timer"></span>'}</div>
    </div>
    <div class="chat-box" id="chatBox"></div>
    ${
      ended
        ? `<div class="chat-ended-note">대화가 종료됐어요.${isMentor ? "" : ' 후기를 남겨주시겠어요? <a href="my.html?tab=완료">후기 쓰러 가기</a>'}</div>`
        : `
      <form class="chat-input-row" id="chatForm">
        <input type="text" id="chatInput" placeholder="메시지를 입력하세요" autocomplete="off">
        <button type="submit" class="send-btn">보내기</button>
      </form>
      ${isMentor ? "" : '<button type="button" class="end-btn" id="endBtn">대화 끝내기</button>'}
    `
    }

    <section class="notepad">
      <button type="button" class="notepad-toggle" id="notepadToggle" aria-expanded="false">
        📝 내 메모장
      </button>
      <div class="notepad-body" id="notepadBody" hidden>
        <p class="notepad-hint">여기 적는 내용은 나만 볼 수 있어요. 상대방에게는 안 보여요.</p>
        <textarea id="notepadText" class="notepad-text" placeholder="대화하면서 기억하고 싶은 내용을 적어 두세요"></textarea>
        <div class="notepad-footer">
          <span class="notepad-status" id="notepadStatus"></span>
          <div class="notepad-export-row">
            <button type="button" class="notepad-export" data-format="txt">텍스트(.txt)</button>
            <button type="button" class="notepad-export" data-format="docx">Word(.docx)</button>
            <button type="button" class="notepad-export" data-format="pdf">PDF</button>
          </div>
        </div>
      </div>
    </section>
  `;

  await renderMessages();
  // 이 대화창을 열어본 시점에, 이 대화에 대해 쌓여 있던 "새 메시지" 알림을 전부 읽음 처리한다.
  await markReservationMessagesRead(reservation.id);
  setupNotepad(reservation, mentor, isMentor, menteeName);

  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  if (!ended) {
    setupInput(reservation.id);
    if (!isMentor) {
      document.getElementById("endBtn").addEventListener("click", () => endChat(reservation.id));
    }
    unsubscribe = subscribeToMessages(reservation.id, async (message) => {
      appendMessage(message);
      // 대화창을 보고 있는 동안 온 메시지도, 생기자마자 바로 읽음 처리해서 알림 배지에 안 쌓이게 한다.
      await markReservationMessagesRead(reservation.id);
    });
    startCountdown(reservation.id, deadline);
  }
}

function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

// 예약 시간부터 1시간 뒤(deadline)까지 남은 시간을 1초마다 보여주고, 0이 되면 자동으로 대화를 끝낸다.
function startCountdown(resId, deadline) {
  const timerEl = document.getElementById("chatTimer");
  if (!timerEl) return;

  function tick() {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      stopCountdown();
      autoEndChat(resId);
      return;
    }
    timerEl.textContent = `남은 시간 ${formatDuration(remaining)}`;
    timerEl.classList.toggle("urgent", remaining <= 5 * 60 * 1000);
  }

  tick();
  countdownInterval = setInterval(tick, 1000);
}

// 타이머가 0이 되면 확인창 없이 자동으로 완료 처리한다(사람이 누르는 "대화 끝내기"와는 다름).
async function autoEndChat(resId) {
  if (flushPendingNote) await flushPendingNote();
  const updated = await updateReservationStatus(resId, "완료");
  if (updated) await renderChat(updated);
}

function renderBubble(m) {
  const mine = m.sender_id === currentUserId;
  return `
    <div class="msg ${mine ? "msg-user" : "msg-mentor"}">
      <div class="msg-bubble">${m.text}</div>
      <div class="msg-time">${formatTime(m.time)}</div>
    </div>`;
}

async function renderMessages() {
  const chatBox = document.getElementById("chatBox");
  const messages = await getMessages(reservationId);
  chatBox.innerHTML = messages.map(renderBubble).join("");
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendMessage(m) {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;
  chatBox.insertAdjacentHTML("beforeend", renderBubble(m));
  chatBox.scrollTop = chatBox.scrollHeight;
}

function setupInput(resId) {
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    // 화면에 메시지를 붙이는 건 realtime 구독(subscribeToMessages)이 처리한다 —
    // 그래야 내가 보낸 메시지도, 상대가 보낸 메시지도 같은 경로로 한 번만 그려진다.
    await sendMessage(resId, text);
  });
}

async function endChat(resId) {
  const sure = confirm("정말 대화를 끝내시겠어요? 끝내면 후기를 남길 수 있어요.");
  if (!sure) return;
  if (flushPendingNote) await flushPendingNote();
  const updated = await updateReservationStatus(resId, "완료");
  if (!updated) {
    alert("처리에 실패했어요. 다시 시도해 주세요.");
    return;
  }
  // my.html로 바로 튕기지 않고, 이 화면에서 "대화가 종료됐어요 + 후기 쓰러 가기" 안내를 그대로 보여준다.
  await renderChat(updated);
}

// ---- 메모장: 대화를 보면서 쓰는 개인 메모(나만 보임) + 파일로 저장 ----

async function setupNotepad(reservation, mentor, isMentor, menteeName) {
  const toggle = document.getElementById("notepadToggle");
  const body = document.getElementById("notepadBody");
  const textarea = document.getElementById("notepadText");
  const status = document.getElementById("notepadStatus");

  toggle.addEventListener("click", () => {
    const willOpen = body.hidden;
    body.hidden = !willOpen;
    toggle.setAttribute("aria-expanded", String(willOpen));
  });

  textarea.value = await getNote(reservation.id);
  let dirty = false;

  async function flushSave() {
    clearTimeout(notepadSaveTimer);
    notepadSaveTimer = null;
    if (!dirty) return;
    dirty = false;
    const ok = await saveNote(reservation.id, textarea.value);
    if (status.isConnected) status.textContent = ok ? "저장됨" : "저장 실패 — 다시 시도해 주세요";
  }
  flushPendingNote = flushSave;

  textarea.addEventListener("input", () => {
    dirty = true;
    status.textContent = "저장 중...";
    clearTimeout(notepadSaveTimer);
    notepadSaveTimer = setTimeout(flushSave, 800);
  });

  const counterpart = isMentor ? menteeName : mentor ? mentor.name : "알 수 없는 멘토";
  const title = `멘토링 메모 - ${counterpart} (${formatSlot(reservation.slot)})`;
  const baseName = `멘토링메모_${counterpart.replace(/[\\/:*?"<>|]/g, "")}_${reservation.slot.replace(/[: ]/g, "-")}`;

  document.querySelectorAll(".notepad-export").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const content = textarea.value.trim();
      if (!content) {
        alert("저장할 메모 내용이 없어요.");
        return;
      }
      btn.disabled = true;
      try {
        if (btn.dataset.format === "txt") exportNoteAsTxt(title, content, baseName);
        else if (btn.dataset.format === "docx") await exportNoteAsDocx(title, content, baseName);
        else if (btn.dataset.format === "pdf") await exportNoteAsPdf(title, content, baseName);
      } catch (err) {
        console.error("메모 내보내기 실패:", err);
        alert("파일 저장에 실패했어요. 다시 시도해 주세요.");
      }
      btn.disabled = false;
    });
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function exportNoteAsTxt(title, content, baseName) {
  const blob = new Blob([`${title}\n\n${content}`], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, `${baseName}.txt`);
}

// 한글(HWP)은 비공개 바이너리 포맷이라 브라우저에서 직접 만들 수 없다 — 대신 .docx로 내보내면
// 한글(한컴오피스)에서도 그대로 열 수 있어서 이걸로 대체한다.
async function exportNoteAsDocx(title, content, baseName) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;
  const lines = content.split("\n");
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: "" }),
          ...lines.map((line) => new Paragraph({ children: [new TextRun(line)] }))
        ]
      }
    ]
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${baseName}.docx`);
}

// 한글(Hangul) 폰트를 jsPDF에 직접 내장하는 대신, 화면에 그려서 이미지로 찍어 PDF에 붙인다
// (글자가 선택은 안 되지만, 한글이 깨지지 않고 그대로 보이는 쪽을 택함).
async function exportNoteAsPdf(title, content, baseName) {
  const wrapper = document.createElement("div");
  wrapper.style.cssText =
    "position:fixed; left:-9999px; top:0; width:600px; padding:32px; background:#fff; " +
    "font-family:'Jua','Noto Sans KR',sans-serif; white-space:pre-wrap; font-size:14px; line-height:1.7; color:#111;";
  wrapper.innerHTML = `<h2 style="margin:0 0 16px;font-size:18px;">${escapeHtml(title)}</h2><div>${escapeHtml(content)}</div>`;
  document.body.appendChild(wrapper);

  const canvas = await html2canvas(wrapper, { scale: 2 });
  document.body.removeChild(wrapper);

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "px", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/png");

  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${baseName}.pdf`);
}

init();
