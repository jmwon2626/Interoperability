-- ══════════════════════════════════════════════════════════════════════
--  [안전 마이그레이션 v2] doc_type CHECK 제약 업데이트 — '기타문서' 추가
--  ✅ 데이터 손실 없음 / 기존 레코드 영향 없음
--  실행 순서: Supabase Dashboard → SQL Editor → 붙여넣기 → [Run]
-- ══════════════════════════════════════════════════════════════════════

-- ─── STEP 1: 기존 CHECK 제약 삭제 ───────────────────────────────────
-- 기존 제약명 확인 (선택)
-- SELECT conname FROM pg_constraint WHERE conrelid = 'public.documents'::regclass AND contype = 'c';

-- doc_type에 걸린 CHECK 제약을 제거합니다 (제약명이 다를 수 있으므로 안전하게 처리)
DO $$
DECLARE
  cname TEXT;
BEGIN
  SELECT conname INTO cname
    FROM pg_constraint
   WHERE conrelid = 'public.documents'::regclass
     AND contype  = 'c'
     AND pg_get_constraintdef(oid) LIKE '%doc_type%'
   LIMIT 1;
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.documents DROP CONSTRAINT %I', cname);
    RAISE NOTICE 'Dropped constraint: %', cname;
  ELSE
    RAISE NOTICE 'No doc_type constraint found, skipping drop.';
  END IF;
END $$;

-- ─── STEP 2: 새 CHECK 제약 추가 ('기타문서' 포함) ──────────────────
ALTER TABLE public.documents
  ADD CONSTRAINT documents_doc_type_check
  CHECK (doc_type IN ('', '신청문서', '심사문서', '기타문서'));

-- ─── STEP 3: doc_type 컬럼이 없으면 추가 (최초 실행 환경 대비) ─────
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS doc_type TEXT DEFAULT '';

-- ─── STEP 4: 결과 확인 ────────────────────────────────────────────
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'documents'
  AND column_name  = 'doc_type';

-- ══════════════════════════════════════════════════════════════════════
-- 완료! Vercel 재배포를 진행하세요.
-- ══════════════════════════════════════════════════════════════════════
