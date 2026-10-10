// index.html 전용: 검색 화면
// 여기서는 목록을 보여주지 않고, 검색어·분야를 골라 mentors.html(멘토 화면)로 넘긴다.

const QUICK_CATEGORIES = ["편입", "자격증", "취업", "진로", "프로그래밍", "디자인", "어학", "자소서·면접", "대학원", "마케팅·기획"];

const searchForm = document.getElementById("searchForm");
const qInput = document.getElementById("q");
const quickChips = document.getElementById("quickChips");

QUICK_CATEGORIES.forEach((category) => {
  const a = document.createElement("a");
  a.className = "chip";
  a.href = `mentors.html?category=${encodeURIComponent(category)}`;
  a.textContent = category;
  quickChips.appendChild(a);
});

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = qInput.value.trim();
  location.href = q ? `mentors.html?q=${encodeURIComponent(q)}` : "mentors.html";
});
