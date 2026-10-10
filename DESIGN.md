# 잇는시간 디자인 가이드

이 문서는 `css/style.css`에 이미 있는 화면 모습을 글로 정리한 것이다.
**새 화면이나 컴포넌트를 만들 때는 여기 있는 색·글꼴·클래스를 먼저 재사용하고,
새로 만든 패턴이 있으면 이 문서에도 같이 추가한다.** CLAUDE.md 7장은 이 문서를 가리키기만 하고,
실제 기준값은 전부 여기에 있다.

---

## 1. 색

전부 `style.css` 맨 위 `:root`에 CSS 변수로 있다. **색은 항상 변수로 쓰고, 코드에 직접 hex 값을 새로 적지 않는다.**

| 변수 | 값 | 쓰는 곳 |
| --- | --- | --- |
| `--pine` | `#2f6b4f` | 기본 강조색. 버튼, 로고 점, 눌린 칩, 확인 배지, 탭 밑줄 |
| `--pine-deep` | `#244f3c` | pine 버튼의 hover 색 |
| `--amber` | `#c07f1e` | "무료" 표시, 별점, 대기 상태 배지 — pine과는 다른 의미(강조 아님, "주목"의 의미) |
| `--amber-soft` / `--amber-line` | `#f6ecd8` / `#e6cfa2` | 무료 배지·대기 배지의 배경/테두리 |
| `--ink` | `#17241f` | 기본 글자색 |
| `--muted` | `#5c6b63` | 보조 설명 글자(날짜, 안내문 등) |
| `--paper` | `#f6f7f3` | 페이지 배경 |
| `--surface` | `#ffffff` | 카드·입력창 등 "떠 있는" 요소의 배경 |
| `--line` | `#e2e6df` | 테두리, 구분선 |

거절/에러 색은 변수가 아니라 `#b3432f`를 직접 쓴다(`.field-error`, `.reject-btn`). 에러·거절이 2곳뿐이라 아직 변수로 안 뺐다 — 세 번째로 쓰는 곳이 생기면 `--danger` 변수로 빼서 등록한다.

**색 쓰는 규칙**
- pine = 긍정적 행동(예약하기, 승인, 확정, 로그인 상태)
- amber = 돈/시간과 관련된 주목(무료, 예약 가능 시간, 대기 중, 별점)
- 거절/삭제처럼 되돌리기 어려운 행동만 `#b3432f` 계열

---

## 2. 글꼴

**Jua** 하나만 쓴다(Google Fonts). 제목용 변수(`--serif`)와 본문용 변수(`--sans`)가 따로 있지만 둘 다 `"Jua", ...`를 가리킨다 — 나중에 제목/본문을 다시 분리하고 싶으면 이 두 변수 값만 바꾸면 된다.

- Jua는 굵기가 400 하나뿐이다. `font-weight: 700`을 쓴 곳(로고, `.profile h1`, `.booking h2` 등)은 브라우저가 합성 볼드로 처리한다 — 의도한 동작이니 지우지 않는다.
- 반대로 **굵게 보이면 안 되는 곳**(`.trust-card h3` 등)은 `font-weight: 400`을 명시해 둔다.
- 모든 화면의 `<head>`에 같은 한 줄이 있어야 한다:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet">
  ```

---

## 3. 레이아웃 기본값

- 페이지 폭 컨테이너는 `.wrap`(`max-width:1080px`, 가운데 정렬, 좌우 패딩 24px → 480px 이하에서는 16px). 새 화면도 `<main class="wrap">` 하나로 감싼다.
- 로그인/가입처럼 좁은 폼 화면은 `.wrap.narrow`(`max-width:420px`)를 추가로 붙인다.
- 카드형 콘텐츠는 `max-width: 560px` 전후로 좁게 두는 패턴이 많다(`.booking`, `.reviews`, `.reservation-card`, `.apply-form`) — 긴 줄글을 피하기 위함이다.

**반응형 기준점**
- `680px` 이하: 헤더 메뉴가 햄버거로 접힌다(`.menu-toggle`, `.nav.open`).
- `560px` 이하: 멘토 카드 그리드가 1열이 된다(`.grid` 자체는 `auto-fill, minmax(300px,1fr)`로 알아서 줄어든다).
- `480px` 이하: `.wrap` 좌우 패딩이 24px → 16px로 줄어든다.

---

## 4. 공통 헤더

모든 화면(admin.html 제외)에 같은 마크업을 그대로 복붙해서 쓴다. 공통 부분을 템플릿화하지 않은 건 "순수 HTML, 빌드 도구 없음" 제약 때문이고, 그래서 **헤더를 고칠 땐 6개 html 파일 전부를 같이 고쳐야 한다.**

```html
<header class="site-header">
  <div class="wrap bar">
    <a class="logo" href="index.html" aria-label="잇는시간 홈"><b>잇는시간</b><span class="dot"></span></a>
    <button class="menu-toggle" id="menuToggle" type="button" aria-expanded="false" aria-controls="siteNav" aria-label="메뉴 열기">
      <span></span><span></span><span></span>
    </button>
    <nav class="nav" id="siteNav">
      <a href="index.html" data-page="index">멘토 찾기</a>
      <a href="mentor-apply.html" class="ghost" data-page="mentor-apply">멘토 등록하기</a>
      <a href="my.html" data-page="my">내 예약</a>
      <a href="login.html" id="authLink" class="solid" data-page="login">로그인</a>
    </nav>
  </div>
</header>
```

- `<body data-page="...">`로 현재 페이지를 표시하면 `common.js`가 그에 맞는 `nav a[data-page]`에 `aria-current="page"`를 붙여 강조한다. `mentors.html`은 `index.html`과 같은 `data-page="index"`를 써서 "멘토 찾기"가 두 화면 모두에서 강조되게 한다.
- 로그인 상태(`authLink`의 텍스트/링크/클릭 동작)도 `common.js`가 처리한다 — 화면 쪽 코드는 손대지 않는다.
- 햄버거 토글, 현재 페이지 강조, 로그인/로그아웃 전환은 전부 `js/common.js`에 있다. 새 화면을 만들 때 다음 순서로 꼭 불러온다: Supabase CDN(`@supabase/supabase-js@2`) → `js/supabaseClient.js` → `api.js` → `common.js`(공통 헤더 없는 admin.html은 생략) → (화면 전용 js). `js/data.js`는 삭제했다 — 멘토·예약·후기·채팅이 전부 Supabase에 있어서 로컬 초기 데이터가 필요 없다. `api.js`의 함수는 전부 비동기(async)라 화면 코드에서 꼭 `await`로 불러야 한다.

**nav 버튼 종류**
| 클래스 | 느낌 | 예 |
| --- | --- | --- |
| (없음) | 기본 메뉴 글자 | 멘토 찾기, 내 예약 |
| `.ghost` | 테두리만 있는 보조 버튼 | 멘토 등록하기 |
| `.solid` | pine 배경의 강조 버튼 | 로그인/로그아웃 |

**알림 종(`.notif-wrap`)**: 로그인 전엔 `hidden`, 로그인 후 `common.js`가 보여준다. nav 안에서 `내 예약` 뒤·`authLink` 앞에 둔다(admin.html 제외 전 화면 공통). 안 읽은 개수는 `.notif-badge`(amber 원), 목록은 `.notif-panel` 드롭다운(`.notif-item`, 안 읽은 건 `.unread`로 pine 톤 배경). 새 알림은 Realtime 구독으로 뜬다 — 직접 만들지 말고 DB 트리거가 넣어준 걸 읽기만 한다.

---

## 5. 자주 쓰는 컴포넌트

### 버튼
| 클래스 | 용도 | 색 |
| --- | --- | --- |
| `.submit` | 폼의 주요 제출 버튼(가로 100%) | pine 배경, 흰 글자. `:disabled`면 50% 투명 |
| `.book` | 멘토 카드의 "멘토 보기" | pine 배경, `.submit`과 같은 패턴이지만 카드 안에서만 씀 |
| `.search-submit` | 검색창 옆 "검색" 버튼 | pine |
| `.again` | 완료/안내 화면의 다음 행동 버튼(링크 `<a>`로도 씀) | pine |
| `.confirm-btn` / `.review-btn` | 내 예약 카드의 보조 행동(연한 pine 배경) | pine 10% 틴트 |
| `.chat-btn` | "대화하기" | pine 배경, `<a>` 태그 |
| `.reject-btn` | 거절처럼 되돌릴 수 없는 행동 | `#b3432f` 10% 틴트 — pine/amber 쓰지 않는 유일한 버튼 계열 |
| `.end-btn` / `.logout-link` | 눈에 덜 띄어야 하는 보조 행동(대화 끝내기, 로그아웃) | 테두리만 또는 글자만, muted 색 |

### 선택형 버튼(토글)
- `.chip` — 분야/유형 필터, 검색 화면의 분야 바로가기(`<a>`로도 씀). `aria-pressed="true"`면 pine 배경.
- `.pick` — 예약 시간 선택, 멘토 등록 폼의 유형/분야/가격 선택. `.chip`과 생김새는 비슷하지만 사각(둥근 모서리 9px)이고 보통 폼 안에서 쓴다. `aria-pressed="true"`면 pine 배경.
- `.rate-pick` — 후기 별점 선택. `.pick`과 같은 모양이지만 눌렸을 때 **amber** 배경(별점이라서 pine이 아니라 amber를 씀).

새 "여러 개 중 하나/여러 개 고르기" UI를 만들 때는 이 세 가지 중 맥락에 맞는 걸 그대로 쓰고, 색만 바꿔서 네 번째 버전을 만들지 않는다.

### 뱃지 · 상태 표시
- `.verified-badge` — 멘토 경험 확인(✓ 아이콘 + "확인됨"), pine 10% 틴트.
- `.tag` — 분야 태그, pine 10% 틴트(`.verified-badge`와 색은 같지만 아이콘 없음).
- `.price.free` / `.price.paid` — 무료는 amber 톤, 유료는 중립(`--paper` 배경 + `--line` 테두리).
- `.r-status.status-대기` / `status-확정` / `status-완료` — 대기=amber, 확정=pine, 완료=muted. 이 세 가지 외의 상태 배지를 새로 만들 때도 "대기성/주목=amber, 긍정 진행=pine, 끝난 일=muted" 규칙을 따른다.

### 카드
- `.card` — 멘토 목록 카드(`mentors.html`).
- `.reservation-card` — 내 예약 카드, 관리자 검증 카드(`admin-card`는 `.reservation-card` 위에 살짝 덧붙인 것).
- 공통 패턴: `background: var(--surface)`, `border: 1px solid var(--line)`, `border-radius: 14~16px`, 안쪽 패딩 18~22px.

### 폼
- 텍스트 입력/텍스트영역은 전부 같은 스타일: `border:1px solid var(--line); border-radius:10px; background:var(--surface); padding:12px 13px;`.
- 라벨 한 줄에 보조 버튼(예시 넣기 등)을 같이 두고 싶으면 `.field` 안에 `.field-head`(라벨 + 버튼을 양끝 정렬)를 쓴다.
- 제출 버튼은 조건이 다 채워지기 전에는 비활성(`disabled`) 상태로 두고, 각 화면의 JS에서 `checkReady()` 패턴으로 매 입력마다 검사한다.

### 빈 상태 / 안내
- `.empty` — "조건에 맞는 멘토가 없어요", "로그인이 필요해요" 같은 빈/안내 상태. 점선 테두리 + 가운데 정렬.
- `.placeholder` — 아직 안 만든 화면 자리(개발 중에만 씀, 완성되면 지운다).

---

## 6. 아이콘

별도 아이콘 세트 없이 **인라인 SVG**(outline, `stroke="currentColor"`, `stroke-width:2~2.6`)를 그때그때 복붙해서 쓴다. 지금까지 쓴 것: 검색(돋보기), 시계, 체크(✓). 새 아이콘이 필요하면 같은 stroke 스타일(선 굵기 2~2.6, round cap/join)로 24x24 viewBox에 맞춰 만든다 — 채워진(fill) 아이콘을 섞지 않는다.

---

## 7. 새 화면/컴포넌트를 만들기 전 체크리스트

1. 비슷한 화면이 이미 있는가? (목록형 → `mentors.html`, 폼형 → `mentor-apply.html`/`mentor.html`의 예약 폼, 탭형 → `my.html`) 있으면 그 구조를 복사해서 시작한다.
2. 버튼·배지·카드가 필요하면 5장 표에서 맞는 클래스를 먼저 찾는다. 새로 만들기 전에 "이미 있는 걸 재사용할 수 없나"를 먼저 확인한다.
3. 색은 변수(`--pine`, `--amber`, `--muted` 등)로만 쓴다. 새 hex 값이 필요하면 `:root`에 변수로 추가하고 이 문서 1장에도 표를 추가한다.
4. 360px 폭에서 깨지는지 확인한다(3장의 반응형 기준점 참고).
5. 정말 새로운 패턴을 만들었다면, 이 문서의 알맞은 장에 한 줄이라도 추가해 둔다. (이 문서가 낡으면 다음에 또 새 변형이 생긴다.)
