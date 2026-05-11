# 🚀 SaMD GMP PMS 운영 배포 가이드 (v2)

> **⚠️ 운영 중인 서비스입니다.** 데이터가 Supabase에 저장되어 있으므로  
> 아래 순서를 **반드시** 지켜주세요. DB 먼저, 코드 배포는 나중입니다.

---

## ✅ 배포 전 체크리스트

| 항목 | 확인 |
|------|------|
| Supabase Dashboard 접속 가능 | ☐ |
| Vercel Dashboard 접속 가능 | ☐ |
| GitHub 또는 로컬 소스코드 준비 | ☐ |
| 브라우저에서 현재 서비스 정상 동작 확인 | ☐ |

---

## 📋 이번 배포에서 변경된 사항 (v2)

| 요청 | 변경 내용 |
|------|-----------|
| 요청3 | 문서 구분에 **기타문서** 추가 |
| 요청4 | 문서 관리 목록 **ID 알파벳 순** 정렬 (DOC-AM-001 → DOC-DM-001 → ...) |
| 요청5 | **No 컬럼** 추가 (정렬 버튼 포함, 자동 순번) |
| 요청6 | **신규 문서 추가** 버튼 및 등록 폼 추가 |
| 요청7 | 문서 수정 후 ID 순서 **변경되지 않도록** 수정 |
| 요청9 | doc_type CHECK 제약 업데이트, 신규 문서 중복 ID 방지 |

---

## 🗄️ STEP 1. Supabase DB 마이그레이션 (먼저!)

> 코드보다 **DB를 먼저** 수정해야 합니다.  
> 코드를 먼저 배포하면 '기타문서'를 저장할 때 DB 제약 오류가 발생합니다.

### 1-1. Supabase Dashboard 접속
```
https://supabase.com/dashboard
→ 프로젝트 선택 → SQL Editor
```

### 1-2. 마이그레이션 파일 실행
`migration-v2-기타문서.sql` 파일의 내용을 **전체 복사**하여 SQL Editor에 붙여넣기 후 **[Run]** 클릭.

**성공 시 출력 예시:**
```
column_name | data_type | column_default | is_nullable
doc_type    | text      |                | YES
```

### 1-3. 기존 데이터 확인 (이상 없는지 체크)
```sql
-- 현재 문서 수 확인
SELECT COUNT(*) FROM public.documents;

-- doc_type 분포 확인
SELECT doc_type, COUNT(*) FROM public.documents GROUP BY doc_type;

-- 파일 첨부 현황 확인
SELECT COUNT(*) FROM public.file_attachments;
```

---

## 💻 STEP 2. 코드 배포

### 방법 A: Vercel GitHub 자동 배포 (권장)

```bash
# 1. 변경된 파일 Git에 추가
git add src/App.jsx migration-v2-기타문서.sql

# 2. 커밋
git commit -m "feat: 기타문서 추가, No컬럼, ID정렬, 신규문서 추가 기능"

# 3. 푸시 (Vercel 자동 배포 트리거)
git push origin main
```

Vercel Dashboard에서 배포 상태를 확인하세요:  
`https://vercel.com/dashboard → 프로젝트 → Deployments`

### 방법 B: Vercel CLI 직접 배포

```bash
# 빌드 테스트 (로컬)
npm install
npm run build

# 프로덕션 배포
npx vercel --prod
```

---

## 🔍 STEP 3. 배포 후 검증

배포 완료 후 **bluemitgmp.vercel.app** 에서 다음을 확인하세요:

### 3-1. 문서 관리 목록 확인
- [ ] ID가 알파벳 순으로 정렬되는가? (DOC-AM-001, DOC-DM-001, ...)
- [ ] 'No' 컬럼이 1번부터 순번이 표시되는가?
- [ ] 'No' 컬럼 헤더 클릭 시 정렬이 되는가?
- [ ] '+ 신규 문서 추가' 버튼이 우측 상단에 보이는가?
- [ ] 문서 구분 필터에 '기타문서'가 선택지에 보이는가?

### 3-2. 기존 데이터 보존 확인
- [ ] 기존에 등록한 44건의 문서가 모두 표시되는가?
- [ ] 파일 첨부된 문서에 파일이 여전히 표시되는가?
- [ ] '신청문서', '심사문서' 뱃지가 기존과 동일하게 표시되는가?

### 3-3. 신규 기능 테스트
- [ ] '+ 신규 문서 추가' 클릭 → 모달 열림
- [ ] ID, 문서명 입력 후 '신규 등록' 클릭 → 목록에 추가됨
- [ ] 문서 구분 선택 시 '기타문서' 선택 가능
- [ ] '기타문서' 선택 후 저장 시 청록색 뱃지로 표시
- [ ] 기존 문서 수정 후 ID 순서가 유지되는가?

---

## 🔄 롤백 방법

배포 후 문제가 발생할 경우:

### 코드 롤백
```bash
# Vercel Dashboard → Deployments → 이전 배포 → ... → Redeploy
```

또는:
```bash
git revert HEAD
git push origin main
```

### DB는 롤백 불필요
이번 마이그레이션은 `CHECK` 제약만 추가하는 **데이터 손실 없는** 변경입니다.  
기존 데이터에 영향 없음.

---

## ⚠️ 주의사항

1. **절대 `seed-data.sql`을 다시 실행하지 마세요** — 기존 데이터가 덮어쓰여질 수 있습니다.
2. **`supabase-schema.sql`도 재실행 금지** — 이미 운영 중인 테이블을 건드리면 데이터가 손실될 수 있습니다.
3. **환경변수 변경 금지** — `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`는 이미 설정되어 있습니다.
4. **Storage 버킷** `gmp-files`는 건드리지 마세요.

---

## 📞 문제 발생 시

| 증상 | 해결 방법 |
|------|-----------|
| '기타문서' 저장 시 오류 | Supabase SQL Editor에서 STEP 1 재실행 |
| 목록이 안 보임 | 브라우저 강력 새로고침 (Ctrl+Shift+R) |
| 파일 업로드 안 됨 | Supabase Storage → `gmp-files` 버킷 Policy 확인 |
| 배포 실패 | Vercel Dashboard → Functions 탭에서 빌드 로그 확인 |

---

*최종 업데이트: 2026-05-11*
