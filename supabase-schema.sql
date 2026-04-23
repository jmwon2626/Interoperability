-- ══════════════════════════════════════════════════════════════════════
--  Healthcare PMS · Supabase 스키마
--  Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
-- ══════════════════════════════════════════════════════════════════════

-- 1) 테이블 생성
CREATE TABLE IF NOT EXISTS public.wbs_tasks (
  id          TEXT PRIMARY KEY,           -- "2Y-00-01" 형태
  phase       TEXT NOT NULL DEFAULT '',
  ws          TEXT NOT NULL DEFAULT '',   -- 업무영역(워크스트림)
  task        TEXT NOT NULL DEFAULT '',
  owner       TEXT NOT NULL DEFAULT '',
  collab      TEXT NOT NULL DEFAULT '',
  schedule    TEXT NOT NULL DEFAULT '',
  milestone   TEXT NOT NULL DEFAULT '',
  effort      TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT '미시작'
              CHECK (status IN ('미시작','진행중','완료','지연','보류')),
  progress    INTEGER NOT NULL DEFAULT 0
              CHECK (progress BETWEEN 0 AND 100),
  notes       TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2) updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wbs_tasks_updated_at ON public.wbs_tasks;
CREATE TRIGGER trg_wbs_tasks_updated_at
  BEFORE UPDATE ON public.wbs_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Row Level Security (RLS) 설정
--    ✅ 계정 없이 URL만으로 읽기·쓰기 허용 (팀 내부 도구 용도)
ALTER TABLE public.wbs_tasks ENABLE ROW LEVEL SECURITY;

-- 읽기: 누구나 허용 (anon key 소지자)
DROP POLICY IF EXISTS "allow_read" ON public.wbs_tasks;
CREATE POLICY "allow_read" ON public.wbs_tasks
  FOR SELECT USING (true);

-- 쓰기: 누구나 허용 (anon key 소지자)
DROP POLICY IF EXISTS "allow_write" ON public.wbs_tasks;
CREATE POLICY "allow_write" ON public.wbs_tasks
  FOR ALL USING (true) WITH CHECK (true);

-- 4) Realtime 활성화 (실시간 동기화)
ALTER PUBLICATION supabase_realtime ADD TABLE public.wbs_tasks;

-- ══════════════════════════════════════════════════════════════════════
-- 완료! 이제 앱을 배포하면 첫 접속 시 초기 WBS 데이터가 자동 시드됩니다.
-- ══════════════════════════════════════════════════════════════════════
