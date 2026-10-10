// mentors.html 전용: 멘토 목록·필터·검색
// index.html(검색 화면)에서 분야 칩이나 검색어를 고르고 넘어오면
// 그 조건이 ?category=...&q=... 형태로 전달되어 처음부터 적용된다.

const CATEGORIES = ["전체", "편입", "자격증", "취업", "진로", "프로그래밍", "디자인", "어학", "자소서·면접", "대학원", "마케팅·기획"];
const TYPES = ["전체", "선배", "졸업생", "현직자"];

const urlParams = new URLSearchParams(location.search);

const state = {
  category: CATEGORIES.includes(urlParams.get("category")) ? urlParams.get("category") : "전체",
  type: TYPES.includes(urlParams.get("type")) ? urlParams.get("type") : "전체",
  freeOnly: urlParams.get("free") === "1",
  query: urlParams.get("q") || ""
};

const categoryChips = document.getElementById("categoryChips");
const typeChips = document.getElementById("typeChips");
const freeOnlyBox = document.getElementById("freeOnly");
const qInput = document.getElementById("q");
const grid = document.getElementById("grid");
const cntEl = document.getElementById("cnt");

qInput.value = state.query;
freeOnlyBox.checked = state.freeOnly;

function buildChips(container, items, stateKey) {
  items.forEach((label) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = label;
    btn.setAttribute("aria-pressed", state[stateKey] === label ? "true" : "false");
    btn.addEventListener("click", () => {
      state[stateKey] = label;
      // 분야·유형 칩을 고르면 이전 검색어는 지운다. 검색어가 남아 있으면
      // 칩을 눌러도 "자격증을 검색한 채로 편입을 눌렀더니 결과가 안 바뀐다"처럼
      // 검색어와 칩 조건이 같이(AND로) 걸려서 결과가 헷갈리게 나오기 때문.
      state.query = "";
      qInput.value = "";
      [...container.children].forEach((c) => c.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      render();
    });
    container.appendChild(btn);
  });
}

buildChips(categoryChips, CATEGORIES, "category");
buildChips(typeChips, TYPES, "type");

// 분야·유형 칩, 검색어 중 하나를 쓰면 나머지를 "전체"로 되돌린다.
// 안 그러면 예를 들어 "편입"을 고른 채로 검색어를 입력했을 때
// 두 조건이 같이(AND로) 걸려서 결과가 왜 이런지 알기 힘들어진다.
function resetChips(container) {
  [...container.children].forEach((c, i) => c.setAttribute("aria-pressed", i === 0 ? "true" : "false"));
}

freeOnlyBox.addEventListener("change", () => {
  state.freeOnly = freeOnlyBox.checked;
  state.query = "";
  qInput.value = "";
  render();
});

qInput.addEventListener("input", () => {
  state.query = qInput.value.trim();
  state.category = "전체";
  state.type = "전체";
  state.freeOnly = false;
  freeOnlyBox.checked = false;
  resetChips(categoryChips);
  resetChips(typeChips);
  render();
});

function clockIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
}

function checkIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
}

// slots 중 가장 이른 시간을 "MM/DD(요일) HH:MM" 형식으로 반환
function formatEarliestSlot(slots) {
  const sorted = slots
    .slice()
    .sort((a, b) => new Date(a.replace(" ", "T")) - new Date(b.replace(" ", "T")));
  const earliest = new Date(sorted[0].replace(" ", "T"));
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][earliest.getDay()];
  const mm = String(earliest.getMonth() + 1).padStart(2, "0");
  const dd = String(earliest.getDate()).padStart(2, "0");
  const hh = String(earliest.getHours()).padStart(2, "0");
  const mi = String(earliest.getMinutes()).padStart(2, "0");
  return `${mm}/${dd}(${weekday}) ${hh}:${mi}`;
}

async function render() {
  const filter = {
    category: state.category === "전체" ? null : state.category,
    type: state.type === "전체" ? null : state.type,
    freeOnly: state.freeOnly,
    query: state.query
  };
  const mentors = await getMentors(filter);
  cntEl.textContent = mentors.length;
  grid.innerHTML = "";

  if (mentors.length === 0) {
    grid.innerHTML =
      '<div class="empty" style="grid-column:1/-1"><b>조건에 맞는 멘토가 없어요</b>다른 분야나 검색어로 다시 찾아보세요.</div>';
    return;
  }

  mentors.forEach((m) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="top">
        <div class="avatar">${m.name[0]}</div>
        <div>
          <h3>${m.name}${m.verified ? `<span class="verified-badge" title="경험·경력 확인됨">${checkIcon()}확인됨</span>` : ""}</h3>
          <div class="role">${m.type} · ${m.major}</div>
        </div>
      </div>
      <div class="tags">${m.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
      <p class="blurb">${m.bio}</p>
      <span class="price ${m.price === 0 ? "free" : "paid"}">${m.price === 0 ? "무료" : m.price.toLocaleString() + "원"}</span>
      <div class="slot-next">${clockIcon()} 가장 빠른 시간 ${formatEarliestSlot(m.slots)}</div>
      <button class="book" type="button">멘토 보기</button>
    `;
    card.querySelector(".book").addEventListener("click", () => {
      location.href = `mentor.html?id=${m.id}`;
    });
    grid.appendChild(card);
  });
}

render();
