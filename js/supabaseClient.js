// Supabase 연결 설정
// URL/anon key는 공개되어도 되는 값(브라우저에 그대로 노출되는 값)이다.
// 실제 접근 제어는 Supabase의 RLS(행 수준 보안) 정책이 담당한다.

const SUPABASE_URL = "https://ggtvtxrohdcvwzohdqjn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_7HxtV_WbWYcOXLvLLSL3GA_yR3xBg9t";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
