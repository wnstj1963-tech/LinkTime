# 잇는시간 시제품 (프론트엔드) — Claude Code 작업 지침

이 파일 하나에 작업 규칙과 시제품 명세가 모두 들어 있다. 다른 문서를 찾지 말고 이 파일을 기준으로 진행한다.

---

## 0. 대화를 시작할 때 (매번)

1. `progress.md`가 있으면 읽고 지금 몇 단계인지, 6단계 이후 어떤 추가 기능이 붙었는지 확인한다. **없으면 아래 9장의 양식으로 새로 만든다.**
2. `reference/mvp_reference.html`이 있는지 확인한다. 없으면 준서에게 "참고 시안 파일이 없다"고 알리고, 이 문서 7장의 디자인 기준만으로 진행한다.
3. `DESIGN.md`를 읽고 지금 화면이 쓰는 색·글꼴·컴포넌트(칩, 버튼, 카드, 탭 등) 규칙을 확인한다. 새 화면·컴포넌트를 만들 때는 거기 있는 클래스를 먼저 재사용하고, 거기 없는 새 패턴을 만들면 `DESIGN.md`에도 추가해 둔다.
4. 이번 단계(또는 요청받은 작업)의 목표와 완료 기준을 3줄 이내로 보여 주고 인터뷰를 시작한다.

---

## 1. 역할: 질문으로 요구사항을 확정하고, 코드는 Claude Code가 작성한다

이 프로젝트는 경진대회 시연용 시제품이다. 준서(팀 대표)가 원하는 것을 정확히 만들기 위해
**각 단계를 시작하기 전에 소크라틱 인터뷰로 요구사항을 확정**하고, 확정된 내용대로 **코드는 Claude Code가 직접 작성**한다.
모든 대화는 한국어로, 쉬운 말로 한다.

### 인터뷰 규칙 (각 단계 시작 전)
1. 이 문서에 정해지지 않았거나 여러 방식이 가능한 부분만 질문한다. 이미 정해진 것은 묻지 않는다.
2. **한 번에 질문은 1~3개**, 선택지를 2~4개 붙여서 묻는다. 추천안에는 "(추천)"과 이유 한 줄을 붙인다.
3. 답이 모호하면 "왜 그렇게 하고 싶은지", "시연 때 어떤 장면을 보여 주고 싶은지"를 한 번 더 물어 의도를 확인한다.
4. 질문이 끝나면 **"이번 단계에서 만들 것" 요약**(화면 동작, 만들 파일, 결정 사항)을 3~6줄로 보여 주고, 확인을 받은 뒤 코드를 작성한다.
5. 준서가 "알아서 해", "추천대로"라고 하면 추천안으로 바로 진행하고 무엇을 결정했는지만 알려 준다.

### 코드 작성 규칙
- 확인받은 요약대로 **파일을 직접 만들고 수정**한다.
- 작성 후 **브라우저에서 어디를 눌러 확인하면 되는지** 짧게 알려 준다.
- 코드는 준서가 나중에 읽고 고칠 수 있게 쉽게 쓰고, 주석은 한국어로 필요한 곳에만 단다.
- 단계가 끝나면 완료 기준을 직접 점검하고, `progress.md`에 체크와 결정 사항을 기록한다.
- 수정 요청이 오면 큰 변경일 때만 1~2개 다시 묻고, 나머지는 바로 고친다.
- 준서가 "설명해 줘"라고 할 때만 코드 동작을 자세히 설명한다.

---

## 2. 기술 제약

- **순수 HTML, CSS, JavaScript만** 사용한다. React 같은 프레임워크, npm, 빌드 도구는 쓰지 않는다. (Supabase JS 클라이언트만 예외로 CDN `<script>`로 불러온다.)
- 직접 만드는 서버는 없다. 대신 **백엔드로 Supabase를 쓴다**(DB·인증·실시간). 화면 코드는 데이터를 직접 읽지 않고 `js/api.js`의 함수를 통해서만 가져온다 — `api.js` 안쪽이 전부 Supabase 호출이고, 전부 비동기(async)라 화면 코드에서 꼭 `await`로 불러야 한다.
- **로그인·회원가입, 멘토 목록, 후기, 예약, 채팅까지 전부 Supabase에 저장된다.** 로컬 가짜 데이터(`js/data.js`)는 쓰지 않고 삭제했다. `js/supabaseClient.js`가 연결 정보(URL·anon key)를 들고 있다. 채팅은 Supabase Realtime 구독(`subscribeToMessages`)으로 상대 메시지가 새로고침 없이 뜬다.
- 접근 제어는 Supabase의 **RLS(행 수준 보안) 정책**이 담당한다 — 테이블·정책 구조는 5장 끝의 설명과 progress.md를 본다.
- 브라우저 확인은 VS Code의 **Live Server** 확장으로 한다.
- `reference/` 폴더의 파일은 수정하지 않는다.

---

## 3. 서비스 개요 (화면 문구의 기준)

- 잇는시간: 먼저 경험한 선배·졸업생·현직자와 **시간을 예약해 1시간 1:1로 대화**하는 멘토링 서비스.
- 초기 대상은 대학생(신구대학교 재학생). 학생 전용은 아니며, 나중에 취업준비생·직장인으로 넓힌다.
- 다루는 고민: 편입·자격증·진로·첫 취업 등 취업 이전 단계 중심.
- **선배 멘토링은 무료**, 경력이 확인된 **전문가 멘토링은 유료**(시제품은 가격 표시만, 결제 기능 없음).
- 신뢰 장치: 멘토 경험 확인 배지, 후기, 신고.
- 참고 시안의 문구는 예전 버전이라 "학생 전용"처럼 읽히는 부분이 있다. 화면 문구는 이 3장을 기준으로 다시 쓴다.

---

## 4. 파일 구조

```
itneun-prototype/
├─ CLAUDE.md          이 문서
├─ DESIGN.md          색·글꼴·컴포넌트 등 UI 일관성 기준 (디자인 관련 작업은 꼭 먼저 읽는다)
├─ progress.md        진행 기록 (없으면 Claude Code가 만든다)
├─ reference/
│  └─ mvp_reference.html   예전 MVP 화면 (디자인 참고용, 수정 금지)
├─ index.html         검색 화면: 소개 + 검색창 + 분야 바로가기 + 신뢰 포인트 배너
├─ mentors.html       멘토 화면: 필터·검색·멘토 목록 (index.html에서 조건을 들고 넘어옴)
├─ mentor.html        멘토 상세 + 예약 신청 (예: mentor.html?id=...)
├─ mentor-apply.html  멘토로 등록하기 (이름·전공·분야·소개·시간·가격 입력)
├─ mentor-inbox.html  받은 예약 (멘토용): 내가 등록한 멘토 앞 예약을 보고 수락
├─ admin.html         (숨은 주소) 유료 멘토 검증 — 학생용 헤더에는 링크 없음
├─ login.html         로그인·회원가입 (가짜)
├─ my.html            내 예약: 대기·확정·완료 탭, 후기 작성
├─ chat.html          1:1 채팅 (예: chat.html?reservation=...)
├─ css/
│  └─ style.css       공통 스타일 (DESIGN.md가 이 파일의 사용 설명서 역할)
└─ js/
   ├─ supabaseClient.js  Supabase 프로젝트 URL·anon key, supabaseClient 생성
   ├─ api.js           데이터 읽기·쓰기 함수 (화면은 여기만 사용) — 전부 Supabase, 로컬 가짜 데이터 없음
   ├─ common.js        공통 헤더, 로그인 상태 확인
   ├─ main.js          index.html 전용 (검색 화면)
   ├─ mentors.js       mentors.html 전용 (멘토 목록·필터)
   ├─ mentor.js        mentor.html 전용
   ├─ mentor-apply.js  mentor-apply.html 전용
   ├─ mentor-inbox.js  mentor-inbox.html 전용
   ├─ admin.js         admin.html 전용
   ├─ login.js         login.html 전용
   ├─ my.js            my.html 전용
   └─ chat.js          chat.html 전용
```

`mentors.html`, `mentor-apply.html`, `admin.html`은 6단계까지의 원래 계획에는 없었고 준서 요청으로 이후에 추가된 화면이다. 자세한 결정 배경은 `progress.md`의 "추가 기능"/"추가 변경" 항목에 있다.

---

## 5. 데이터 모양 (js/data.js)

필드 이름은 나중에 Supabase 테이블과 맞추기 위해 영어로 쓴다.

**mentors**
| 필드 | 예시 | 설명 |
| --- | --- | --- |
| id | "m1" | 고유 번호 |
| name | "김도현" | 이름 (가상 인물) |
| type | "선배" | 선배 / 졸업생 / 현직자 |
| major | "컴퓨터소프트웨어과" | 전공 |
| tags | ["편입", "프로그래밍"] | 경험 분야 (필터에 사용) |
| bio | "전문대에서 4년제로 편입했어요…" | 소개 |
| slots | ["2027-03-12 20:00"] | 예약 가능 시간 |
| price | 0 | 0이면 무료, 12000이면 유료(전문가) |
| verified | true | 경험·경력 확인 여부 |

**reservations**: id, mentorId, userId, slot, question, status("대기" / "확정" / "완료" / "취소")
**messages**: id, reservationId, senderId(uuid, 보낸 사람 계정), text, time
**reviews**: id, mentorId, userId, rating(1~5), text

분량: 멘토 6~8명(무료 선배 위주, 유료 전문가 2명). 시연을 위해 예약은 상태별로 1개 이상 미리 넣어 둔다.

> mentors는 더 이상 `data.js`/localStorage에 없다. **Supabase의 `public.mentors` 테이블**(uuid 기반 id)에 있고, `api.js`의 `getMentors`/`getMentor`/`createMentor`/`verifyMentor`/`deleteMentor`가 전부 거기서 직접 읽고 쓴다(비동기). `resetDemoData()`는 이제 멘토를 건드리지 않는다 — 데모 데이터가 아니라 실제 DB 데이터이기 때문이다.
>
> 읽기(select)는 누구나 가능하고, 쓰기(insert/update/delete)는 **로그인한 사용자만** 가능하다(RLS 정책이 `to authenticated`로 범위를 좁혀 둠). 그래서 `mentor-apply.html`은 로그인하지 않으면 폼 대신 "로그인하러 가기" 안내만 보여준다(`my.html`/`chat.html`과 같은 패턴). `admin.html`은 화면에 로그인 UI가 없지만, 같은 브라우저에서 미리 로그인해 두면 세션을 공유해서 승인/거절이 동작한다.
>
> `mentors.owner_id`(등록한 사람)와 `profiles.is_admin`(관리자 표시) 컬럼이 있다. **본인이 등록한 멘토만 수정/삭제 가능, `is_admin` 계정은 전체 가능** 정책이 적용돼 있다(정책 교체 자체는 `DROP POLICY`라서 Claude Code 보안 보호장치가 막아 준서가 대시보드에서 직접 실행함 — progress.md 참고). 아직 `is_admin`이 true인 계정이 없어서, `admin.html`에서 본인이 등록하지 않은 멘토의 승인/거절을 누르면 실패한다 — 누군가를 관리자로 지정해야 한다.
>
> reviews도 마찬가지로 **Supabase의 `public.reviews` 테이블**로 옮겼다(읽기는 공개, 작성은 로그인한 사용자만). `api.js`의 `getMentor()`가 멘토 정보와 후기를 각각 Supabase에서 가져와 합쳐서 돌려준다.
>
> reservations도 **Supabase의 `public.reservations` 테이블**로 옮겼다. `userId`는 이메일 문자열이 아니라 `user_id`(uuid, auth.users 참조)다 — 화면 코드에서 `r.mentorId`가 아니라 `r.mentor_id`로 접근한다. 멘티는 자기 예약을 만들고 보고(`createReservation`/`getMyReservations`), 멘토는 자기 멘토 글에 걸린 예약을 보고 상태를 바꿀 수 있다(`getIncomingReservations`/`updateReservationStatus`, RLS가 `mentor_id in (select id from mentors where owner_id = auth.uid())`로 허용). **예약 수락(대기→확정)은 이제 멘토가 `mentor-inbox.html`에서 직접 한다** — 예전에 `my.html`에 있던 "멘토가 수락했다고 가정하기" 셀프 확정 버튼은 없앴다.
>
> **상태 전이는 DB 트리거(`check_reservation_status_transition`, `reservations`의 `BEFORE UPDATE`)가 강제한다** — UI에 버튼이 없는 것만으로는 안 믿고, 누가 콘솔에서 `updateReservationStatus()`를 직접 불러도 "대기→확정"은 그 멘토 글의 주인만 할 수 있다(아니면 에러). 나머지 전이(대기/확정→취소, 확정→완료)는 멘티·멘토 둘 다 가능하고, 그 외 전이(예: 완료된 예약을 되돌리는 것)는 전부 막힌다. 처음 만들 때도 `status`는 항상 "대기"로 강제된다(바로 확정 상태로 끼워 넣기 방지).
>
> **후기는 완료된 예약이 실제로 있어야 쓸 수 있다** — `reviews_authenticated_insert` 정책이 "이 사람이 이 멘토와 완료(`완료`)된 예약을 가지고 있는가"를 `auth.uid()` 기준으로 확인한다(작성자 이메일도 `auth.email()`과 일치해야 함). `my.html` UI는 여전히 완료 탭에서만 후기 버튼을 보여주지만, 이제 그 뒤에 DB 쪽 강제도 있다.
>
> **같은 시간 중복 예약 방지**: `(mentor_id, slot)`에 **부분 유니크 인덱스**(`where status in ('대기','확정')`)가 걸려 있어서, 한 멘토의 같은 시간을 "대기" 또는 "확정" 상태로 동시에 두 건 이상 가질 수 없다("취소"·"완료"는 그 시간을 다시 비워준다). 실제 방어는 이 DB 인덱스가 하고(동시 신청에도 안전), `mentor.js`는 `getTakenSlots()`로 미리 막힌 시간을 비활성화해 두는 보조 UX만 담당한다. `createReservation()`이 유니크 제약 위반(`23505`)을 만나면 `{ error: "slot_taken" }`을 돌려준다.
>
> messages(채팅)도 **Supabase의 `public.messages` 테이블**로 옮겼다. `sender`(text, "user"/"mentor") 대신 **`sender_id`(uuid, auth.users 참조)**를 쓴다 — 화면에서 "내 말풍선/상대 말풍선"은 `sender_id`가 지금 로그인한 사람과 같은지로 가린다(멘티·멘토 둘 다 `chat.html`을 쓰기 때문에 고정된 'user'/'mentor' 역할로는 구분할 수 없다). 읽기/쓰기 모두 그 예약의 멘티 본인이거나 그 멘토 글의 주인만 가능하고(`messages_select_participant`/`messages_insert_participant` 정책), **지우는 정책은 아예 안 만들었다**(대화 기록은 못 지움, 의도적). `alter publication supabase_realtime add table messages`로 Realtime을 켜서, `subscribeToMessages()`가 새 메시지를 구독해 새로고침 없이 반영한다 — 가짜 자동 답장 코드는 삭제했다.
>
> **notifications**: id, userId(받는 사람), type("reservation_requested" / "reservation_confirmed" / "new_message"), reservationId, text, read. **화면 코드가 직접 만들지 않는다** — `on_reservation_created`/`on_reservation_confirmed`/`on_message_created` 세 DB 트리거가 각각 예약 생성·확정·메시지 전송 시점에 자동으로 넣어준다(어느 화면에서 그 행동을 했든 항상 동작). 문구엔 이름이 들어간다: "OO 멘티님이 예약을 신청했습니다" / "OO 멘토님이 예약을 수락했습니다" / "OO 멘티님이(또는 멘토님이) 메시지를 보냈습니다"(멘티 이름은 `profiles.name`, 멘토 이름은 `mentors.name`에서 가져옴). 본인 알림만 읽기/읽음 처리 가능. 헤더의 종 아이콘(`common.js`의 `initNotifications()`)이 Realtime으로 구독해 배지·목록을 실시간 갱신한다. admin.html에는 없다(공통 헤더 자체가 없어서).

---

## 6. api.js 함수

| 함수 | 하는 일 |
| --- | --- |
| getMentors(filter) | 분야·유형·무료 여부·검색어로 걸러 멘토 목록 반환 |
| getMentor(id) | 멘토 한 명과 그 멘토의 후기 반환 |
| createReservation(mentorId, slot, question) | 예약 추가 (상태 "대기", Supabase, 로그인한 사용자만 가능). 반환값은 `{ reservation }`(성공) 또는 `{ error: "login_required" \| "slot_taken" \| "unknown" }`(실패) — `slot_taken`은 그 시간을 다른 사람이 이미 "대기/확정"으로 잡아 둔 경우 |
| getTakenSlots(mentorId) | 그 멘토의 시간 중 이미 "대기/확정"으로 잡힌 시간 목록(mentor.html에서 예약 불가 시간을 미리 막아 두는 데 씀). **내부적으로 테이블을 직접 안 보고 DB 함수 `get_taken_slots`를 호출한다** — reservations의 RLS가 "내 예약만" 보여줘서 직접 조회하면 다른 사람이 잡은 시간이 안 보이는 버그가 있었음(수정됨) |
| getMyReservations() | 로그인한 멘티 본인의 예약 목록 |
| getIncomingReservations() | 로그인한 사람이 등록한 멘토 앞으로 들어온 예약 목록(멘토용, mentor-inbox.html 전용) |
| getProfileNames(userIds) | user_id uuid 배열 → `{id: 이름}` 맵. RLS가 "나와 예약으로 엮인 사람"만 보여줌(아무 프로필이나 조회되지 않음) |
| updateReservationStatus(id, status) | 예약 상태 변경(수락은 멘토가 mentor-inbox.html에서, 완료 처리는 chat.html에서 자동/수동으로, 취소는 멘티·멘토 양쪽이 my.html/mentor-inbox.html에서 "취소"로) |
| getMessages(reservationId) / sendMessage(reservationId, text) | 채팅 읽기·보내기(Supabase, 그 예약의 참가자만) |
| subscribeToMessages(reservationId, callback) / getReservation(id) | 새 메시지 실시간 구독(unsubscribe 함수 반환) / 예약 하나 조회(멘티·멘토 둘 다 접근 가능, RLS가 거름) |
| getNotifications() / markNotificationRead(id) / subscribeToNotifications(userId, callback) | 내 알림 목록 / 읽음 처리 / 새 알림 실시간 구독. 알림 자체는 DB 트리거가 자동으로 만든다(5장 끝 참고) |
| getNote(reservationId) / saveNote(reservationId, content) | 그 예약에 대한 내 개인 메모 조회/저장(upsert). 상대방은 못 봄(RLS) |
| createReview(mentorId, rating, text) | 후기 추가(Supabase, 로그인한 사용자만 가능) |
| createMentor(mentorData) | 멘토 등록(자가 등록, verified는 항상 false로 시작). 로그인한 사용자만 가능(비로그인/오류 시 null 반환) |
| getMyMentor() | 내 계정으로 등록된 멘토 글(있으면 1개, 없으면 null). "멘토 등록하기" 메뉴를 숨기거나 재등록을 막는 데 씀 — DB에도 `mentors.owner_id unique` 제약이 있어서 한 계정당 멘토 글은 하나만 가능 |
| verifyMentor(id) / deleteMentor(id) | (관리자용) 유료 멘토 승인 / 거절(삭제). 역시 로그인한 사용자만 가능 |
| signUp(email, password, name) | Supabase Auth 회원가입. `{error}` 또는 `{user, needsEmailConfirmation}` 반환(비동기) |
| login(email, password) / logout() / getCurrentUser() | Supabase Auth 로그인/로그아웃/현재 사용자(`{email,id,name}` 또는 null) — 전부 비동기 |
| resetDemoData() | 시연용 데이터 초기화(예약·메시지·후기를 처음 상태로, 로그아웃까지). 멘토 목록은 이제 실제 DB 데이터라 건드리지 않음. 가입된 Supabase 계정도 지우지 않음 |

---

## 7. 화면별 요구사항과 디자인

**index.html (검색 화면)**
- 서비스 소개 한 줄, 가운데 정렬된 검색창, 분야 바로가기 칩(편입, 자격증, 취업, 진로, 프로그래밍, 디자인, 어학, 자소서·면접, 대학원, 마케팅·기획), "전체 멘토 보기" 링크
- 검색하거나 칩을 고르면 그 조건을 들고 `mentors.html`로 이동(`?q=`, `?category=`)
- 검색창 아래 "신뢰 포인트" 3카드 배너(1시간 실시간 대화 / 경험 확인된 멘토 / 선배 멘토링은 무료) — 실제 채팅 제한 시간(1시간)과 맞춰 둠

**mentors.html (멘토 화면)**
- 필터: 분야(편입, 자격증, 취업, 진로, 프로그래밍, 디자인, 어학, 자소서·면접, 대학원, 마케팅·기획), 유형(선배/졸업생/현직자), 무료만 보기, 검색창
- 멘토 카드: 이름, 유형, 전공, 분야 태그, 무료/유료, 확인 배지, 가장 가까운 예약 가능 시간
- 결과가 없으면 "조건에 맞는 멘토가 없어요" 안내
- 검색어(자유 텍스트)와 구조화된 필터(분야/유형/무료만 보기)는 서로 다른 모드로 동작한다: 분야·유형 칩을 고르거나 무료만 보기를 체크하면 검색어를 지우고, 검색창에 입력하면 분야·유형·무료만 보기가 "전체"로 되돌아간다. (분야·유형·무료만 보기끼리는 서로 같이 쓸 수 있다 — 시연 시나리오의 "편입"+"무료만" 조합 때문)

**mentor-apply.html (멘토 등록)**
- 이름/유형/전공/분야 태그(여러 개)/소개/가능 시간(쉼표로 구분, "YYYY-MM-DD HH:MM")/가격(무료 또는 유료 금액) 입력
- 제출하면 `createMentor()`로 실제 멘토 목록에 추가되고(verified는 false로 시작) 상세 페이지로 이동
- 로그인해야만 등록 가능(Supabase RLS가 `mentors` 테이블 쓰기를 로그인한 사용자로 제한함). 로그인 전이면 폼 대신 "로그인하러 가기" 안내가 뜬다

**admin.html (숨은 주소, 유료 멘토 검증)**
- 가격이 있고 아직 verified가 아닌 멘토만 카드로 보여줌
- "승인"(verifyMentor) / "거절"(confirm 확인 후 deleteMentor) 버튼
- 학생용 헤더 nav에는 링크를 두지 않는다 — 발표 때 주소를 직접 입력해서 들어간다

**mentor.html (상세 + 예약)**
- 프로필, 소개, 후기 목록(평점 평균)
- 가능 시간 선택 → 사전 질문 작성(질문 예시 버튼) → 예약 신청
- 로그인하지 않았으면 로그인 화면으로 보냈다가, 로그인 후 이 화면으로 돌아오기
- 신청 완료 메시지와 "내 예약 보기" 링크

**login.html**: 로그인/회원가입 탭(`.tabs`). 로그인은 이메일+비밀번호, 회원가입은 이메일+비밀번호+이름. 실제 Supabase Auth를 쓴다 — 가입 시 이메일 확인이 켜져 있으면 "이메일을 확인해 주세요" 안내로 바뀐다(2장 참고)

**my.html (내 예약, 멘티용)**
- 대기 / 확정 / 완료 탭
- 대기 예약엔 "멘토가 수락하면 확정으로 바뀌어요" 안내만(셀프 확정 버튼 없음 — 실제로 멘토가 수락해야 바뀐다)
- 확정 예약에는 "대화하기"(chat.html로 이동), 완료 예약에는 "후기 쓰기"(별점 + 글)

**mentor-inbox.html (받은 예약 + 대화함, 멘토 전용)**
- 위쪽 "새로 들어온 신청": 대기 상태 예약에 "수락하기"/"거절하기" 버튼 → 수락하면 확정으로 바뀌고 멘티 쪽 my.html에도 바로 반영됨
- 아래쪽 "대화함": 멘토가 여러 멘티와 동시에 멘토링을 하는 걸 감안해서, 모든 대화(확정/완료/취소)를 카드 목록으로 모아서 보여준다. 각 카드에 멘티 이름 + 상태 배지 + 시간이 보이고, "확정"이면서 시간이 됐으면 "대화하기", "완료"면 "대화 보기" 링크가 뜬다 — **눌러도 이 페이지 안에서 바로 안 열리고 `chat.html?reservation=...`로 이동한다**(처음엔 한 페이지에 목록+대화창을 같이 두는 2단 구조로 만들었다가, 준서가 "채팅창은 따로 만들어야 해, 한 화면에 보여주는 게 아니야"라고 바로잡아서 되돌림 — 대화 자체는 항상 chat.html에서만 보여준다). "확정"인데 시간 전이면 안내 문구 + "취소하기" 버튼, "취소"된 건 안내 문구만.
- 멘토가 멘티 이름을 볼 수 있는 건 `profiles_select_for_mentor` RLS 정책 덕분(그 멘토 글에 예약한 적 있는 멘티에 한해서만 이름 조회 허용) — `getProfileNames(userIds)`로 가져온다.
- 등록한 멘토가 없거나 로그인하지 않았으면 안내 문구만 표시

**chat.html (1:1 채팅, 멘티·멘토 공용 — 대화는 항상 이 화면에서만 열린다. 멘티는 my.html에서, 멘토는 mentor-inbox.html의 대화함에서 각각 링크를 타고 들어온다)**
- 상단에 상대 이름(멘티가 보면 멘토 이름, 멘토가 보면 실제 멘티 이름 — `getProfileNames`로 조회)과 예약 시간, 메시지 목록, 입력창, 보내기(엔터로도 전송)
- Supabase Realtime으로 상대가 보낸 메시지가 새로고침 없이 뜬다. 가짜 자동 답장은 없다 — 실제로 상대방이 로그인해서 답장해야 한다
- **예약 시간(slot)부터 1시간** 동안만 대화 가능. 남은 시간이 헤더에 실시간으로 표시되고(5분 이하면 빨간 글씨), 0이 되면 확인창 없이 자동으로 예약이 완료 처리된다. **예약 시간 전에는 대화창 자체를 열 수 없다** — "확정" 상태인데 지금이 slot 시작 전이면 "아직 예약 시간이 안 됐어요" 안내만 보여준다("완료"된 예약은 예외로, 지난 대화를 계속 볼 수 있다). `my.html`/`mentor-inbox.html`의 "대화하기" 버튼도 그 전에는 안내 문구로 대체된다.
- "대화 끝내기"(멘티만 보임, 확인창 있음) → 예약을 완료로 바꾸고 이 화면에 "후기를 남겨주시겠어요?" 안내가 뜬다(바로 my.html로 튕기지 않음)
- **메모장**: 대화창 아래 "내 메모장" 토글. 상대방에게 안 보이는 개인 메모이고, 입력하면 0.8초 뒤 자동 저장된다(`notes` 테이블, RLS로 본인 것만). 대화가 끝난 뒤에도 계속 열어볼 수 있다. 텍스트(.txt)/Word(.docx)/PDF로 내보낼 수 있다 — PDF는 한글 폰트를 jsPDF에 못 넣어서 `html2canvas`로 이미지를 찍어 붙이는 방식이고, 한글(.hwp)은 비공개 포맷이라 아예 못 만들어서 Word(.docx, 한컴오피스에서도 열림)로 대체했다. 메모장·내보내기는 `chat.html`에만 있다(`mentor-inbox.html`은 목록 화면이라 대화창 자체가 없음) — 이 기능 때문에 `chat.html`에만 `jspdf`/`html2canvas`/`docx` CDN 스크립트가 추가로 붙는다.

**공통**: 모든 화면에 같은 헤더(로고, 멘토 찾기, 멘토 등록하기, 받은 예약, 내 예약, 로그인/로그아웃 — admin.html은 예외), 680px 이하는 헤더가 햄버거 메뉴로 접힘, 휴대폰 폭 360px에서도 깨지지 않기, 키보드로 이동 가능

**디자인**: 색·글꼴·컴포넌트(칩, 버튼, 카드, 탭 등)의 상세 기준은 `DESIGN.md`를 본다. 요약하면 딥 그린(`--pine`)·앰버(`--amber`) 2색 기조, 글꼴은 Jua 하나로 통일, 색은 전부 `style.css` 맨 위 CSS 변수로 쓴다.

---

## 8. 개발 단계와 완료 기준

| 단계 | 만들 것 | 완료 기준 |
| --- | --- | --- |
| 1 | 폴더 구조, style.css 변수, 공통 헤더, data.js, api.js | 모든 화면에 같은 헤더가 보이고, 콘솔에서 `getMentors()`를 부르면 멘토 배열이 나온다 |
| 2 | index.html 목록·필터·검색 | 필터와 검색을 바꾸면 카드가 즉시 바뀌고, 결과 없음 안내가 뜬다 |
| 3 | mentor.html 상세·예약 신청 | 시간 선택과 질문 없이는 신청이 안 되고, 신청한 예약이 새로고침 후에도 남는다 |
| 4 | login.html, my.html | 로그인 전에는 내 예약에 못 들어가고, 신청한 예약이 "대기"에 보인다 |
| 5 | chat.html | 보낸 메시지가 목록에 붙고, 새로고침해도 남고, 가짜 답장이 온다 |
| 6 | 후기 작성, 휴대폰 화면 점검 | 후기를 남기면 멘토 상세에 보이고, 360px 폭에서 깨지지 않는다 |

**경진대회 시연 시나리오**
1. 검색 화면에서 "편입" 칩 선택 → 멘토 화면에서 무료만 보기 체크 → 무료 선배 멘토 선택
2. 가능 시간 선택, 질문 예시로 사전 질문 작성 → 예약 신청(로그인 포함)
3. (멘토 계정으로 로그인 전환) `mentor-inbox.html`에서 방금 들어온 예약을 "수락하기" → (멘티 계정으로 복귀) 내 예약에서 확정된 걸 확인 → 대화하기 → 메시지 주고받기
4. 대화 끝내기 → 후기 작성 → 멘토 상세에 후기 반영 확인

이 네 단계 뒤에 "멘토 등록하기"(mentor-apply.html)로 유료 멘토를 하나 등록하고, `admin.html`에서 승인/거절하는 장면을 추가로 보여줄 수 있다.

---

## 9. progress.md 양식 (없으면 이대로 만든다)

```
# 진행 기록

| 단계 | 내용 | 상태 | 결정 사항 |
| --- | --- | --- | --- |
| 1 | 폴더 구조, 공통 스타일·헤더, data.js, api.js | ☐ | |
| 2 | 메인 목록·필터·검색 | ☐ | |
| 3 | 멘토 상세·예약 신청 | ☐ | |
| 4 | 로그인·내 예약 | ☐ | |
| 5 | 1:1 채팅 | ☐ | |
| 6 | 후기 작성, 휴대폰 화면 점검 | ☐ | |

## 다음에 할 것
-
```
