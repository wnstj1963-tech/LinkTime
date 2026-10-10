// 잇는시간 데이터 읽기·쓰기 함수
// 화면 코드(main.js, mentor.js ...)는 이 파일의 함수만 사용합니다.
// 로그인·회원가입, 멘토 목록, 후기, 예약, 채팅까지 전부 Supabase를 씁니다.
// (로컬 가짜 데이터는 이제 없습니다 — js/data.js도 삭제했습니다.)

// ---- 멘토 (Supabase의 public.mentors 테이블) ----

// filter: { category, type, freeOnly, query }
async function getMentors(filter) {
  filter = filter || {};
  let request = supabaseClient.from("mentors").select("*").order("created_at", { ascending: true });
  if (filter.category) request = request.contains("tags", [filter.category]);
  if (filter.type) request = request.eq("type", filter.type);
  if (filter.freeOnly) request = request.eq("price", 0);

  const { data, error } = await request;
  if (error) {
    console.error("getMentors 실패:", error.message);
    return [];
  }

  let mentors = data;
  if (filter.query) {
    const q = filter.query.trim().toLowerCase();
    if (q) {
      mentors = mentors.filter((m) =>
        (m.name + m.major + m.bio + m.tags.join(" ")).toLowerCase().includes(q)
      );
    }
  }
  return mentors;
}

async function getMentor(id) {
  const { data: mentor, error } = await supabaseClient.from("mentors").select("*").eq("id", id).maybeSingle();
  if (error || !mentor) return null;

  const { data: reviews, error: reviewsError } = await supabaseClient
    .from("reviews")
    .select("*")
    .eq("mentor_id", id)
    .order("created_at", { ascending: true });
  if (reviewsError) console.error("리뷰 조회 실패:", reviewsError.message);

  return Object.assign({}, mentor, { reviews: reviews || [] });
}

// 멘토 등록(가짜): 자가 등록이라 경험 확인(verified)은 아직 안 된 상태로 들어간다.
// owner_id에 등록한 사람을 남겨 둬서, "본인 것만 수정 가능" 정책의 기준이 된다.
// 실패하면(예: 쓰기 권한이 없으면) null을 돌려준다.
async function createMentor(mentorData) {
  const user = await getCurrentUser();
  const { data, error } = await supabaseClient
    .from("mentors")
    .insert({
      name: mentorData.name,
      type: mentorData.type,
      major: mentorData.major,
      tags: mentorData.tags,
      bio: mentorData.bio,
      slots: mentorData.slots,
      price: mentorData.price,
      verified: false,
      owner_id: user ? user.id : null
    })
    .select()
    .single();
  if (error) {
    console.error("createMentor 실패:", error.message);
    return null;
  }
  return data;
}

// 내가 이미 등록한 멘토 글이 있으면 그걸 돌려주고, 없으면 null.
// 한 사람이 멘토 글을 여러 개 만들 필요는 없어서(이미 멘토면 "멘토 등록하기"를 다시 보여줄 필요가 없음), 1개만 본다.
async function getMyMentor() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await supabaseClient.from("mentors").select("*").eq("owner_id", user.id).limit(1);
  if (error) {
    console.error("getMyMentor 실패:", error.message);
    return null;
  }
  return data && data.length > 0 ? data[0] : null;
}

// 관리자 검증(가짜): 유료 멘토를 승인해서 경험 확인 배지를 붙임
async function verifyMentor(id) {
  const { data, error } = await supabaseClient
    .from("mentors")
    .update({ verified: true })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) {
    console.error("verifyMentor 실패:", error.message);
    return null;
  }
  return data;
}

// 관리자 검증(가짜): 거절된 멘토 등록을 목록에서 지움.
// 권한이 없어서 RLS가 조용히 막으면 0개가 지워지는데, 그걸 구분하려고 select()로 지워진 행을 받아서 확인한다.
// 성공(1개 이상 지워짐)이면 true, 실패(권한 없음 등)면 false를 돌려준다.
async function deleteMentor(id) {
  const { data, error } = await supabaseClient.from("mentors").delete().eq("id", id).select();
  if (error) {
    console.error("deleteMentor 실패:", error.message);
    return false;
  }
  return Boolean(data && data.length > 0);
}

// ---- 예약 (Supabase의 public.reservations 테이블) ----

// 성공하면 { reservation }을, 실패하면 { error: "login_required" | "slot_taken" | "unknown" }을 돌려준다.
// "slot_taken"은 그 사이에 다른 사람이 같은 시간을 먼저 가져간 경우(DB의 유니크 인덱스가 막아줌).
async function createReservation(mentorId, slot, question) {
  const user = await getCurrentUser();
  if (!user) return { error: "login_required" };
  const { data, error } = await supabaseClient
    .from("reservations")
    .insert({
      mentor_id: mentorId,
      user_id: user.id,
      slot: slot,
      question: question,
      status: "대기"
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") return { error: "slot_taken" };
    console.error("createReservation 실패:", error.message);
    return { error: "unknown" };
  }
  return { reservation: data };
}

// 그 멘토의 시간 중 이미 다른 사람이 "대기" 또는 "확정"으로 잡아 둔 시간 목록.
// mentor.html에서 이미 잡힌 시간을 고르지 못하게 미리 막는 데 쓴다.
// reservations 테이블은 RLS가 "내 예약만" 보여주게 막혀 있어서(다른 멘티의 예약은 안 보임),
// 일반 테이블 조회로는 다른 사람이 잡은 시간을 알 수 없다 — 그래서 slot 값만 안전하게 돌려주는
// DB 함수(get_taken_slots, SECURITY DEFINER)를 통해 가져온다.
async function getTakenSlots(mentorId) {
  const { data, error } = await supabaseClient.rpc("get_taken_slots", { p_mentor_id: mentorId });
  if (error) {
    console.error("getTakenSlots 실패:", error.message);
    return [];
  }
  return data.map((r) => r.slot);
}

// 예약 하나를 id로 가져온다(멘티 본인이든, 그 멘토 글의 주인이든 RLS가 알아서 걸러줌).
// chat.html처럼 "이 사람이 이 예약을 볼 자격이 있는지"를 따로 안 가리고 그냥 조회만 하면 되는 화면에서 쓴다.
async function getReservation(id) {
  const { data, error } = await supabaseClient.from("reservations").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("getReservation 실패:", error.message);
    return null;
  }
  return data;
}

// 내(멘티)가 신청한 예약 목록
async function getMyReservations() {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data, error } = await supabaseClient
    .from("reservations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getMyReservations 실패:", error.message);
    return [];
  }
  return data;
}

// 내가 등록한 멘토 앞으로 들어온 예약 목록(멘토용, mentor-inbox.html 전용)
async function getIncomingReservations() {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data: myMentors, error: mentorsError } = await supabaseClient
    .from("mentors")
    .select("id")
    .eq("owner_id", user.id);
  if (mentorsError) {
    console.error("getIncomingReservations 실패:", mentorsError.message);
    return [];
  }
  const mentorIds = myMentors.map((m) => m.id);
  if (mentorIds.length === 0) return [];

  const { data, error } = await supabaseClient
    .from("reservations")
    .select("*")
    .in("mentor_id", mentorIds)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getIncomingReservations 실패:", error.message);
    return [];
  }
  return data;
}

// user_id uuid 목록 -> { id: 이름 } 맵. 멘토가 "자기 멘토 글에 예약한 적 있는 멘티"의 이름을 보는 용도
// (RLS의 profiles_select_for_mentor 정책이 그 경우만 허용 — 아무 사람 이름이나 조회되진 않는다).
async function getProfileNames(userIds) {
  const ids = [...new Set(userIds)].filter(Boolean);
  if (ids.length === 0) return {};
  const { data, error } = await supabaseClient.from("profiles").select("id,name").in("id", ids);
  if (error) {
    console.error("getProfileNames 실패:", error.message);
    return {};
  }
  const map = {};
  data.forEach((p) => {
    map[p.id] = p.name;
  });
  return map;
}

async function updateReservationStatus(id, status) {
  const { data, error } = await supabaseClient
    .from("reservations")
    .update({ status: status })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) {
    console.error("updateReservationStatus 실패:", error.message);
    return null;
  }
  return data;
}

// ---- 채팅 (Supabase의 public.messages 테이블) ----
// 그 예약의 멘티 본인이거나 그 멘토 글의 주인만 읽고 보낼 수 있다(RLS).

async function getMessages(reservationId) {
  const { data, error } = await supabaseClient
    .from("messages")
    .select("*")
    .eq("reservation_id", reservationId)
    .order("time", { ascending: true });
  if (error) {
    console.error("getMessages 실패:", error.message);
    return [];
  }
  return data;
}

async function sendMessage(reservationId, text) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await supabaseClient
    .from("messages")
    .insert({
      reservation_id: reservationId,
      sender_id: user.id,
      text: text
    })
    .select()
    .single();
  if (error) {
    console.error("sendMessage 실패:", error.message);
    return null;
  }
  return data;
}

// 새 메시지가 오면 callback(message)을 바로 호출한다. 구독을 끊을 때 쓸 unsubscribe 함수를 돌려준다.
function subscribeToMessages(reservationId, callback) {
  const channel = supabaseClient
    .channel(`messages-${reservationId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `reservation_id=eq.${reservationId}` },
      (payload) => callback(payload.new)
    )
    .subscribe();

  return () => supabaseClient.removeChannel(channel);
}

// ---- 알림 (Supabase의 public.notifications 테이블) ----
// DB 트리거가 자동으로 만들어 준다: 예약 신청(멘토에게)/예약 확정(멘티에게)/새 메시지(상대방에게).

async function getNotifications() {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data, error } = await supabaseClient
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) {
    console.error("getNotifications 실패:", error.message);
    return [];
  }
  return data;
}

async function markNotificationRead(id) {
  const { error } = await supabaseClient.from("notifications").update({ read: true }).eq("id", id);
  if (error) console.error("markNotificationRead 실패:", error.message);
}

// 지금 이 대화창을 보고 있는 중이면, 그 대화에 쌓인 "새 메시지" 알림은 안 읽은 채로 둘 필요가 없다.
// chat.html이 메시지를 받을 때마다 불러서 자동으로 읽음 처리한다.
async function markReservationMessagesRead(reservationId) {
  const user = await getCurrentUser();
  if (!user) return;
  const { error } = await supabaseClient
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("reservation_id", reservationId)
    .eq("type", "new_message")
    .eq("read", false);
  if (error) console.error("markReservationMessagesRead 실패:", error.message);
}

// 알림이 새로 생기거나 읽음 처리될 때마다 callback()을 호출한다(인자 없이, 매번 다시 불러오라는 신호로만 씀).
// unsubscribe 함수를 돌려준다.
function subscribeToNotifications(userId, callback) {
  const channel = supabaseClient
    .channel(`notifications-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      () => callback()
    )
    .subscribe();

  return () => supabaseClient.removeChannel(channel);
}

// ---- 메모장 (Supabase의 public.notes 테이블) ----
// 그 예약의 대화를 보면서 쓰는 개인 메모. 멘티·멘토 각자 자기 것만 보고 쓸 수 있다(RLS) — 상대방은 못 본다.

async function getNote(reservationId) {
  const user = await getCurrentUser();
  if (!user) return "";
  const { data, error } = await supabaseClient
    .from("notes")
    .select("content")
    .eq("reservation_id", reservationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    console.error("getNote 실패:", error.message);
    return "";
  }
  return data ? data.content : "";
}

// 저장할 때마다 새 행을 만들지 않고 (reservation_id, user_id) 기준으로 덮어쓴다.
async function saveNote(reservationId, content) {
  const user = await getCurrentUser();
  if (!user) return false;
  const { error } = await supabaseClient
    .from("notes")
    .upsert(
      { reservation_id: reservationId, user_id: user.id, content: content, updated_at: new Date().toISOString() },
      { onConflict: "reservation_id,user_id" }
    );
  if (error) {
    console.error("saveNote 실패:", error.message);
    return false;
  }
  return true;
}

// ---- 후기 (Supabase의 public.reviews 테이블) ----

async function createReview(mentorId, rating, text) {
  const user = await getCurrentUser();
  const { data, error } = await supabaseClient
    .from("reviews")
    .insert({
      mentor_id: mentorId,
      user_id: user ? user.email : "guest",
      rating: rating,
      text: text
    })
    .select()
    .single();
  if (error) {
    console.error("createReview 실패:", error.message);
    return null;
  }
  return data;
}

// ---- 로그인 · 회원가입 (Supabase Auth) ----
// 이메일+비밀번호로 가입/로그인한다. 실패하면 { error: "읽을 수 있는 한국어 메시지" }를 돌려준다.

async function signUp(email, password, name) {
  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: { data: { name: name } }
  });
  if (error) return { error: _itneunAuthErrorMessage(error) };
  // Supabase 프로젝트 설정에 "이메일 확인"이 켜져 있으면 가입만 되고 세션은 안 생긴다.
  // 그럴 땐 로그인 화면에서 "이메일을 확인해 주세요" 안내로 바꿔야 한다.
  return { user: data.user, needsEmailConfirmation: !data.session };
}

async function login(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });
  if (error) return { error: _itneunAuthErrorMessage(error) };
  return { user: data.user };
}

async function logout() {
  await supabaseClient.auth.signOut();
}

// { email, id, name } 형태로 돌려주거나, 로그인 안 했으면 null
async function getCurrentUser() {
  const { data } = await supabaseClient.auth.getSession();
  const user = data.session ? data.session.user : null;
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: (user.user_metadata && user.user_metadata.name) || ""
  };
}

function _itneunAuthErrorMessage(error) {
  if (error.message.includes("already registered")) return "이미 가입된 이메일이에요.";
  if (error.message.includes("Invalid login credentials")) return "이메일 또는 비밀번호가 맞지 않아요.";
  if (error.message.includes("Password should be at least")) return "비밀번호는 6자 이상으로 적어 주세요.";
  return "문제가 생겼어요: " + error.message;
}

// ---- 시연용: 로그아웃 ----
// 콘솔에서 resetDemoData()를 호출하면 로그아웃됩니다.
// 멘토·예약·후기·채팅이 전부 실제 Supabase 데이터라서 그 외엔 초기화할 로컬 데이터가 없습니다.
async function resetDemoData() {
  await logout();
  console.log("로그아웃했습니다.");
}
