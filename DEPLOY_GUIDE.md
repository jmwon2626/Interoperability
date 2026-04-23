# 🚀 배포 가이드 — Vercel + Supabase

팀원은 **계정 없이 URL만으로** 접속·편집 가능합니다.

---

## STEP 1 · Supabase 프로젝트 생성

1. **[supabase.com](https://supabase.com)** 접속 → 무료 계정 가입
2. **New project** 클릭
   - Project name: `healthcare-pms` (원하는 이름)
   - Database password: 안전한 비밀번호 설정 후 저장
   - Region: **Northeast Asia (Seoul)** 선택
3. 프로젝트 생성 완료까지 약 1~2분 대기

---

## STEP 2 · DB 스키마 실행

1. Supabase 대시보드 → 왼쪽 메뉴 **SQL Editor** 클릭
2. `supabase-schema.sql` 파일 내용을 전체 복사
3. SQL Editor에 붙여넣기 → **Run** 버튼 클릭
4. 초록색 "Success" 메시지 확인

---

## STEP 3 · 환경변수(API 키) 확인

1. Supabase 대시보드 → **Settings** → **API**
2. 아래 두 값을 복사해 둡니다:

   | 항목 | 복사할 값 |
   |------|-----------|
   | `VITE_SUPABASE_URL` | Project URL (예: `https://abcxyz.supabase.co`) |
   | `VITE_SUPABASE_ANON_KEY` | anon public 키 (긴 JWT 문자열) |

---

## STEP 4 · 코드를 GitHub에 올리기

```bash
# 이 폴더에서 실행
cd healthcare-pms

git init
git add .
git commit -m "feat: healthcare PMS with Supabase"

# GitHub 새 저장소(repo) 생성 후 → Push
git remote add origin https://github.com/YOUR_ID/healthcare-pms.git
git push -u origin main
```

> **팁**: GitHub 저장소를 **Private**으로 만들어도 Vercel 배포에는 문제 없습니다.

---

## STEP 5 · Vercel에 배포

1. **[vercel.com](https://vercel.com)** → GitHub 계정으로 로그인
2. **Add New → Project** 클릭
3. healthcare-pms 저장소 선택 → **Import**
4. Framework Preset: **Vite** 자동 감지됨
5. **Environment Variables** 섹션 펼치기 → 아래 두 변수 입력:

   ```
   VITE_SUPABASE_URL       = https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY  = your-anon-public-key
   ```

6. **Deploy** 클릭 → 약 1분 후 배포 완료
7. 자동 생성된 URL 확인: `https://healthcare-pms-xxxx.vercel.app`

---

## STEP 6 · 팀원과 공유

```
📎 접속 URL:  https://healthcare-pms-xxxx.vercel.app

✅ 별도 계정·로그인 불필요
✅ URL로 접속하면 즉시 편집 가능
✅ 한 명이 수정하면 다른 팀원 화면에 실시간 반영
```

---

## 로컬 개발 (선택 사항)

```bash
cd healthcare-pms

# 환경변수 설정
cp .env.example .env
# .env 파일을 열어 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 값 입력

# 패키지 설치 및 실행
npm install
npm run dev
# → http://localhost:5173 에서 확인
```

---

## 자주 묻는 질문

**Q. 무료 한도는?**
- Supabase 무료 플랜: DB 500MB, 월 200만 Row 읽기, 실시간 연결 200개
- Vercel 무료 플랜: 월 100GB 대역폭, 배포 무제한
- 이 프로젝트 규모에서는 무료로 충분합니다.

**Q. 데이터가 날아갈 수 있나요?**
- Supabase 무료 프로젝트는 **7일 미접속 시 일시정지**(데이터는 보존)
- 월 1회 이상 접속하면 계속 유지됩니다.

**Q. 향후 코드 수정 시 재배포 방법은?**
- `git push` 하면 Vercel이 자동으로 재배포합니다.

**Q. 보안이 걱정됩니다.**
- 현재는 "URL을 아는 누구나" 편집 가능한 설정입니다.
- 접근 제한이 필요하면 Supabase RLS 정책에 IP 필터 또는
  Vercel Password Protection(Pro 기능)을 추가하세요.

---

## 파일 구조

```
healthcare-pms/
├── index.html                  # HTML 진입점
├── vite.config.js              # Vite 설정
├── package.json
├── .env.example                # 환경변수 샘플 (→ .env 로 복사)
├── .gitignore
├── supabase-schema.sql         # Supabase SQL Editor에서 실행
└── src/
    ├── main.jsx                # React 진입점
    ├── supabaseClient.js       # Supabase 클라이언트 초기화
    └── App.jsx                 # 메인 앱 (WBS + 대시보드 + 마일스톤)
```
