// 모든 화면에서 쓰는 공통 헤더 동작
// - 좁은 화면(680px 이하)에서 햄버거 메뉴 열고 닫기
// - 현재 페이지 메뉴 강조
// - 로그인 상태에 따라 로그인/로그아웃 버튼 바꾸기
// - 알림 종 아이콘(안 읽은 개수, 목록, 실시간 갱신)

let _notifUnsubscribe = null;

document.addEventListener("DOMContentLoaded", async () => {
  const nav = document.getElementById("siteNav");
  const menuToggle = document.getElementById("menuToggle");
  const authLink = document.getElementById("authLink");

  // 햄버거 메뉴 열고 닫기
  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        nav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // 현재 페이지 메뉴 강조
  const currentPage = document.body.dataset.page;
  if (currentPage && nav) {
    nav.querySelectorAll("a[data-page]").forEach((a) => {
      if (a.dataset.page === currentPage) a.setAttribute("aria-current", "page");
    });
  }

  const user = await getCurrentUser();

  // 로그인 상태 표시
  if (authLink) {
    if (user) {
      authLink.textContent = "로그아웃";
      authLink.href = "#";
      authLink.onclick = async (e) => {
        e.preventDefault();
        await logout();
        location.href = "index.html";
      };
    } else {
      authLink.textContent = "로그인";
      authLink.href = "login.html";
      authLink.onclick = null;
    }
  }

  // 이미 멘토로 등록된 계정이면 "멘토 등록하기" 메뉴는 필요 없다(멘토 글은 한 사람당 하나).
  if (nav && user) {
    const applyLink = nav.querySelector('a[data-page="mentor-apply"]');
    if (applyLink && (await getMyMentor())) applyLink.hidden = true;
  }

  await initNotifications(user);
});

function formatNotifTime(time) {
  const diffMs = Date.now() - new Date(time).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

function notifLinkFor(n) {
  if (n.type === "reservation_requested") return "mentor-inbox.html";
  if (n.type === "reservation_confirmed") return "my.html";
  if (n.type === "new_message") return `chat.html?reservation=${n.reservation_id}`;
  return "#";
}

async function initNotifications(user) {
  const wrap = document.getElementById("notifWrap");
  if (!wrap) return;

  if (_notifUnsubscribe) {
    _notifUnsubscribe();
    _notifUnsubscribe = null;
  }

  if (!user) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;

  const bell = document.getElementById("notifBell");
  const badge = document.getElementById("notifBadge");
  const panel = document.getElementById("notifPanel");

  function renderPanel(notifications) {
    if (notifications.length === 0) {
      panel.innerHTML = '<div class="notif-empty">알림이 없어요</div>';
      return;
    }
    panel.innerHTML = notifications
      .map(
        (n) => `
        <a class="notif-item${n.read ? "" : " unread"}" href="${notifLinkFor(n)}" data-id="${n.id}">
          ${n.text}
          <span class="notif-time">${formatNotifTime(n.created_at)}</span>
        </a>`
      )
      .join("");
    panel.querySelectorAll(".notif-item").forEach((el) => {
      el.addEventListener("click", async (e) => {
        // 읽음 처리가 끝나기 전에 페이지가 이동해버리면 처리가 중간에 끊길 수 있어서,
        // 먼저 막고 읽음 처리를 기다린 다음 직접 이동한다.
        e.preventDefault();
        await markNotificationRead(el.dataset.id);
        location.href = el.getAttribute("href");
      });
    });
  }

  function updateBadge(notifications) {
    const unread = notifications.filter((n) => !n.read).length;
    badge.textContent = unread > 9 ? "9+" : String(unread);
    badge.hidden = unread === 0;
  }

  async function refresh() {
    const notifications = await getNotifications();
    renderPanel(notifications);
    updateBadge(notifications);
  }

  bell.addEventListener("click", () => {
    const willOpen = panel.hidden;
    panel.hidden = !willOpen;
    bell.setAttribute("aria-expanded", String(willOpen));
  });

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) {
      panel.hidden = true;
      bell.setAttribute("aria-expanded", "false");
    }
  });

  await refresh();
  _notifUnsubscribe = subscribeToNotifications(user.id, refresh);
}
