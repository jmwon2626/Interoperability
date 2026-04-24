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

-- 4) Realtime 활성화 (이미 등록된 경우 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'wbs_tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wbs_tasks;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════════
--  Q&A 질의응답 테이블
-- ══════════════════════════════════════════════════════════════════════

-- 5) Q&A 게시글 테이블
CREATE TABLE IF NOT EXISTS public.qna_posts (
  id           BIGSERIAL PRIMARY KEY,
  org_category TEXT NOT NULL,          -- 공공기관 | 개발업체 | 상급병원 | 종합병원 | 병원
  org_name     TEXT NOT NULL,          -- 세부 소속기관명
  author       TEXT NOT NULL,          -- 작성자 이름
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 6) Q&A 답변(리플) 테이블
CREATE TABLE IF NOT EXISTS public.qna_replies (
  id           BIGSERIAL PRIMARY KEY,
  post_id      BIGINT NOT NULL REFERENCES public.qna_posts(id) ON DELETE CASCADE,
  org_category TEXT NOT NULL,
  org_name     TEXT NOT NULL,
  author       TEXT NOT NULL,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 7) Q&A RLS 설정 (누구나 읽기·쓰기)
ALTER TABLE public.qna_posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qna_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qna_posts_read"  ON public.qna_posts;
DROP POLICY IF EXISTS "qna_posts_write" ON public.qna_posts;
CREATE POLICY "qna_posts_read"  ON public.qna_posts  FOR SELECT USING (true);
CREATE POLICY "qna_posts_write" ON public.qna_posts  FOR ALL    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "qna_replies_read"  ON public.qna_replies;
DROP POLICY IF EXISTS "qna_replies_write" ON public.qna_replies;
CREATE POLICY "qna_replies_read"  ON public.qna_replies FOR SELECT USING (true);
CREATE POLICY "qna_replies_write" ON public.qna_replies FOR ALL    USING (true) WITH CHECK (true);

-- 8) Q&A Realtime 활성화 (이미 등록된 경우 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'qna_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.qna_posts;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'qna_replies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.qna_replies;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════════
-- 완료! 이제 앱을 배포하면 첫 접속 시 초기 WBS 데이터가 자동 시드됩니다.
-- Q&A 탭을 통해 참여기관 간 질의응답을 관리하세요.
-- ══════════════════════════════════════════════════════════════════════
