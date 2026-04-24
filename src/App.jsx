import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient.js";

// ─── RAW WBS DATA (초기 시드 데이터) ────────────────────────────────────────────
const INITIAL_WBS = [
  { id:"2Y-00-01", phase:"2차년도", ws:"PMO/거버넌스", task:"통합 기준선 및 범위 매트릭스 확정", owner:"서울아산병원", collab:"더존,참여기관,관리기관", schedule:"4월", milestone:"4월", effort:"EST 8-12", status:"미시작", progress:0, notes:"" },
  { id:"2Y-00-02", phase:"2차년도", ws:"PMO/거버넌스", task:"용어사전 및 산출물 명명규칙 수립", owner:"서울아산병원", collab:"더존", schedule:"4월", milestone:"4월", effort:"EST 5-8", status:"미시작", progress:0, notes:"[7-1] 용어 의미 불명확 이슈 대응" },
  { id:"2Y-00-03", phase:"2차년도", ws:"PMO/거버넌스", task:"의사결정·이슈·변경관리 체계 운영", owner:"서울아산병원", collab:"더존,모든기관", schedule:"상시", milestone:"상시", effort:"EST 8-15/월", status:"미시작", progress:0, notes:"" },
  { id:"2Y-00-04", phase:"2차년도", ws:"PMO/거버넌스", task:"성과지표-테스트-산출물 추적표 작성", owner:"더존비즈온", collab:"서울아산병원", schedule:"5월", milestone:"5월", effort:"EST 6-10", status:"미시작", progress:0, notes:"공인시험 여부는 TBD" },
  { id:"2Y-01-01", phase:"2차년도", ws:"요구사항/업무분석", task:"2차년도 기능 요구사항 재정의", owner:"더존비즈온", collab:"서울아산병원", schedule:"4~5월", milestone:"4~5월", effort:"EST 15-25", status:"미시작", progress:0, notes:"기획·개발 동시 진행 필요" },
  { id:"2Y-01-02", phase:"2차년도", ws:"요구사항/업무분석", task:"환자 진료정보 교류 시나리오 흐름 Freeze", owner:"서울아산병원", collab:"더존,참여병원", schedule:"5월", milestone:"5월", effort:"EST 10-15", status:"미시작", progress:0, notes:"샘플 데이터 사용 시에도 동일 흐름 유지" },
  { id:"2Y-01-03", phase:"2차년도", ws:"요구사항/업무분석", task:"기관별 데이터 공유범위 및 동의정책 정리", owner:"서울아산병원", collab:"더존,참여병원", schedule:"5~6월", milestone:"5~6월", effort:"EST 10-20", status:"미시작", progress:0, notes:"전자서명 수단은 비용·법무 검토 필요" },
  { id:"2Y-01-04", phase:"2차년도", ws:"요구사항/업무분석", task:"실데이터/샘플데이터 정책 확정", owner:"서울아산병원", collab:"더존,IRB/보안부서", schedule:"5월", milestone:"5월", effort:"EST 6-12", status:"미시작", progress:0, notes:"확인 필요 사항 중 최우선" },
  { id:"2Y-01-05", phase:"2차년도", ws:"요구사항/업무분석", task:"TBD 의사결정 워크숍", owner:"서울아산병원", collab:"더존,관리기관", schedule:"5월", milestone:"5월", effort:"EST 4-8", status:"미시작", progress:0, notes:"" },
  { id:"2Y-02-01", phase:"2차년도", ws:"SDM/MDM", task:"확장 시나리오 데이터 요구사항 도출", owner:"서울아산병원", collab:"울산,경북,참여병원", schedule:"5~6월", milestone:"5~6월", effort:"EST 15-25", status:"미시작", progress:0, notes:"2차년도 핵심 표준모델 확장" },
  { id:"2Y-02-02", phase:"2차년도", ws:"SDM/MDM", task:"KR-CDI·건강정보고속도로·진료정보교류 항목 Crosswalk", owner:"서울아산병원", collab:"더존", schedule:"6월", milestone:"6월", effort:"EST 10-20", status:"미시작", progress:0, notes:"" },
  { id:"2Y-02-03", phase:"2차년도", ws:"SDM/MDM", task:"SDM ver2.2 논리·물리모델 Freeze", owner:"서울아산병원", collab:"더존", schedule:"6월", milestone:"6월", effort:"EST 10-15", status:"미시작", progress:0, notes:"Viewer v1.0과 차이 관리" },
  { id:"2Y-02-04", phase:"2차년도", ws:"SDM/MDM", task:"MDM 설계 및 테이블 구축", owner:"서울아산병원", collab:"더존", schedule:"6~7월", milestone:"6~7월", effort:"EST 20-30", status:"미시작", progress:0, notes:"" },
  { id:"2Y-02-05", phase:"2차년도", ws:"SDM/MDM", task:"의료기관 규모별 SDM 모듈화 전략", owner:"서울아산병원", collab:"더존,참여기관", schedule:"7월", milestone:"7월", effort:"EST 12-20", status:"미시작", progress:0, notes:"3차년도 패키징 선행" },
  { id:"2Y-02-06", phase:"2차년도", ws:"SDM/MDM", task:"FHIR 리소스 매핑 매트릭스 작성", owner:"서울아산병원", collab:"더존,솔트룩스", schedule:"6~8월", milestone:"6~8월", effort:"EST 20-35", status:"미시작", progress:0, notes:"C-CDA 매핑은 후속/TBD" },
  { id:"2Y-02-07", phase:"2차년도", ws:"SDM/MDM", task:"SDM 메타데이터 Viewer/카탈로그 반영", owner:"더존비즈온", collab:"서울아산병원", schedule:"7월", milestone:"7월", effort:"EST 10-20", status:"미시작", progress:0, notes:"" },
  { id:"2Y-03-01", phase:"2차년도", ws:"Staging/IDB/ETL", task:"Staging DB·IDB·SDB 구조 기준 설계", owner:"더존비즈온", collab:"서울아산병원,기관DBA", schedule:"5월", milestone:"5월", effort:"EST 10-15", status:"미시작", progress:0, notes:"PostgreSQL 기본, 기관 환경별 TBD" },
  { id:"2Y-03-02", phase:"2차년도", ws:"Staging/IDB/ETL", task:"기관별 EMR 소스 인벤토리 작성", owner:"각 참여병원", collab:"더존,서울아산병원", schedule:"5~6월", milestone:"5~6월", effort:"EST 10-25/기관", status:"미시작", progress:0, notes:"울산·경북은 계획서상 명확" },
  { id:"2Y-03-03", phase:"2차년도", ws:"Staging/IDB/ETL", task:"ETL/ELT 적재 규칙 및 증분전략 설계", owner:"더존비즈온", collab:"기관DBA", schedule:"6~7월", milestone:"6~7월", effort:"EST 20-40", status:"미시작", progress:0, notes:"대량기관 인덱스·파티션 필요" },
  { id:"2Y-03-04", phase:"2차년도", ws:"Staging/IDB/ETL", task:"IDB/Staging 테이블 구축 및 샘플 적재", owner:"더존비즈온", collab:"참여병원", schedule:"7월", milestone:"7월", effort:"EST 20-40", status:"미시작", progress:0, notes:"기관별 인프라 완료 필요" },
  { id:"2Y-03-05", phase:"2차년도", ws:"Staging/IDB/ETL", task:"IDB-to-SDM 매핑 및 적재 모듈 구현", owner:"더존비즈온", collab:"서울아산병원", schedule:"7~9월", milestone:"7~9월", effort:"EST 30-60", status:"미시작", progress:0, notes:"WBS에서 크리티컬" },
  { id:"2Y-03-06", phase:"2차년도", ws:"Staging/IDB/ETL", task:"적재 스케줄러·실행관리 구현", owner:"더존비즈온", collab:"기관DBA", schedule:"8~9월", milestone:"8~9월", effort:"EST 15-25", status:"미시작", progress:0, notes:"" },
  { id:"2Y-03-07", phase:"2차년도", ws:"Staging/IDB/ETL", task:"데이터 lineage·오류처리·대사 리포트", owner:"더존비즈온", collab:"서울아산병원,기관", schedule:"9월", milestone:"9월", effort:"EST 10-20", status:"미시작", progress:0, notes:"검수 증적으로 활용" },
  { id:"2Y-03-08", phase:"2차년도", ws:"Staging/IDB/ETL", task:"의료기관용 2차 패키징", owner:"더존비즈온", collab:"참여병원", schedule:"10월", milestone:"10월", effort:"EST 10-20", status:"미시작", progress:0, notes:"RFP 패키지 3종의 선행" },
  { id:"2Y-04-01", phase:"2차년도", ws:"용어표준화/매핑", task:"표준용어 코드체계·버전관리 설계", owner:"서울아산병원", collab:"더존", schedule:"6월", milestone:"6월", effort:"EST 15-25", status:"미시작", progress:0, notes:"RFP 표준용어관리 필수" },
  { id:"2Y-04-02", phase:"2차년도", ws:"용어표준화/매핑", task:"로컬코드-표준코드 매핑 워크플로우", owner:"서울아산병원", collab:"더존,기관", schedule:"7월", milestone:"7월", effort:"EST 20-30", status:"미시작", progress:0, notes:"" },
  { id:"2Y-04-03", phase:"2차년도", ws:"용어표준화/매핑", task:"표준용어 검색·등록·매핑 UI 구현", owner:"더존비즈온", collab:"서울아산병원", schedule:"7~9월", milestone:"7~9월", effort:"EST 25-40", status:"미시작", progress:0, notes:"" },
  { id:"2Y-04-04", phase:"2차년도", ws:"용어표준화/매핑", task:"임상적 의미 검증 회의체 운영", owner:"서울아산병원", collab:"울산,경북,솔트룩스", schedule:"상시", milestone:"상시", effort:"EST 8-15/월", status:"미시작", progress:0, notes:"정확도 지표의 근거" },
  { id:"2Y-04-05", phase:"2차년도", ws:"용어표준화/매핑", task:"매핑 오류·예외 처리 규칙 구현", owner:"더존비즈온", collab:"서울아산병원", schedule:"9월", milestone:"9월", effort:"EST 10-20", status:"미시작", progress:0, notes:"AI 오류와 연계" },
  { id:"2Y-05-01", phase:"2차년도", ws:"포털/백오피스", task:"서비스 포털 상세기획 및 IA 확정", owner:"더존비즈온", collab:"서울아산병원", schedule:"4~6월", milestone:"4~6월", effort:"EST 20-30", status:"미시작", progress:0, notes:"6월 초안 목표" },
  { id:"2Y-05-02", phase:"2차년도", ws:"포털/백오피스", task:"회원가입·로그인·보안 인증 구현", owner:"더존비즈온", collab:"서울아산병원", schedule:"6~7월", milestone:"6~7월", effort:"EST 25-40", status:"미시작", progress:0, notes:"실제 PASS/SMS는 정책 TBD" },
  { id:"2Y-05-03", phase:"2차년도", ws:"포털/백오피스", task:"사용자·기관·권한·멀티테넌트 관리", owner:"더존비즈온", collab:"서울아산병원", schedule:"7~8월", milestone:"7~8월", effort:"EST 20-35", status:"미시작", progress:0, notes:"" },
  { id:"2Y-05-04", phase:"2차년도", ws:"포털/백오피스", task:"백오피스 로그·감사·모니터링 구현", owner:"더존비즈온", collab:"서울아산병원", schedule:"8~9월", milestone:"8~9월", effort:"EST 25-45", status:"미시작", progress:0, notes:"" },
  { id:"2Y-05-05", phase:"2차년도", ws:"포털/백오피스", task:"통합 대시보드 구축", owner:"더존비즈온", collab:"서울아산병원", schedule:"9~10월", milestone:"9~10월", effort:"EST 20-35", status:"미시작", progress:0, notes:"성과교류회 시연 핵심" },
  { id:"2Y-05-06", phase:"2차년도", ws:"포털/백오피스", task:"포털 통합 테스트 및 사용성 피드백", owner:"더존비즈온", collab:"서울아산병원,참여기관", schedule:"10월", milestone:"10월", effort:"EST 10-20", status:"미시작", progress:0, notes:"" },
  { id:"2Y-06-01", phase:"2차년도", ws:"동의/정보교류", task:"동의모델·전자서명 정책 확정", owner:"서울아산병원", collab:"더존,관리기관", schedule:"5~6월", milestone:"5~6월", effort:"EST 8-12", status:"미시작", progress:0, notes:"응급/의식불명 상황은 TBD" },
  { id:"2Y-06-02", phase:"2차년도", ws:"동의/정보교류", task:"환자 동의·서명 페이지 구현", owner:"더존비즈온", collab:"서울아산병원", schedule:"6~7월", milestone:"6~7월", effort:"EST 20-35", status:"미시작", progress:0, notes:"실제 인증 연동 비용은 TBD" },
  { id:"2Y-06-03", phase:"2차년도", ws:"동의/정보교류", task:"동의관리 API 및 실시간 검증", owner:"더존비즈온", collab:"서울아산병원", schedule:"7~8월", milestone:"7~8월", effort:"EST 25-40", status:"미시작", progress:0, notes:"" },
  { id:"2Y-06-04", phase:"2차년도", ws:"동의/정보교류", task:"동의 철회·전송차단 이벤트 처리", owner:"더존비즈온", collab:"서울아산병원", schedule:"8월", milestone:"8월", effort:"EST 10-20", status:"미시작", progress:0, notes:"" },
  { id:"2Y-06-05", phase:"2차년도", ws:"동의/정보교류", task:"알림서비스 구현", owner:"더존비즈온", collab:"서울아산병원", schedule:"7~8월", milestone:"7~8월", effort:"EST 20-35", status:"미시작", progress:0, notes:"채널 비용과 실제 발송범위 TBD" },
  { id:"2Y-06-06", phase:"2차년도", ws:"동의/정보교류", task:"의뢰/회송서 작성 UI 설계·구현", owner:"더존비즈온", collab:"서울아산병원,참여병원", schedule:"7~9월", milestone:"7~9월", effort:"EST 30-50", status:"미시작", progress:0, notes:"" },
  { id:"2Y-06-07", phase:"2차년도", ws:"동의/정보교류", task:"정보교류 API(의뢰등록·조회요청·Pull) 구현", owner:"더존비즈온", collab:"서울아산병원,기관", schedule:"8~10월", milestone:"8~10월", effort:"EST 35-60", status:"미시작", progress:0, notes:"실시간/배치 범위 구분" },
  { id:"2Y-06-08", phase:"2차년도", ws:"동의/정보교류", task:"수신 데이터 Viewer 및 SDM Viewer 구현", owner:"더존비즈온", collab:"서울아산병원", schedule:"9~10월", milestone:"9~10월", effort:"EST 30-50", status:"미시작", progress:0, notes:"" },
  { id:"2Y-06-09", phase:"2차년도", ws:"동의/정보교류", task:"메타데이터·토큰·의뢰키 관리", owner:"더존비즈온", collab:"서울아산병원", schedule:"9월", milestone:"9월", effort:"EST 15-30", status:"미시작", progress:0, notes:"" },
  { id:"2Y-07-01", phase:"2차년도", ws:"이종시스템 연계 SW/SDK", task:"EMR 어댑터 패턴 설계", owner:"더존비즈온", collab:"기관DBA", schedule:"6월", milestone:"6월", effort:"EST 15-25", status:"미시작", progress:0, notes:"연계방식 기관별 상이" },
  { id:"2Y-07-02", phase:"2차년도", ws:"이종시스템 연계 SW/SDK", task:"3내역/7-2 연계 API 계약", owner:"더존비즈온", collab:"서울아산병원,3내역/7-2", schedule:"6월", milestone:"6월", effort:"EST 10-20", status:"미시작", progress:0, notes:"크리티컬 패스" },
  { id:"2Y-07-03", phase:"2차년도", ws:"이종시스템 연계 SW/SDK", task:"REST API 기반 SDK 고도화", owner:"더존비즈온", collab:"서울아산병원", schedule:"7~9월", milestone:"7~9월", effort:"EST 25-40", status:"미시작", progress:0, notes:"" },
  { id:"2Y-07-04", phase:"2차년도", ws:"이종시스템 연계 SW/SDK", task:"연결정보 암호화·접속 테스트 구현", owner:"더존비즈온", collab:"기관DBA", schedule:"8월", milestone:"8월", effort:"EST 15-25", status:"미시작", progress:0, notes:"" },
  { id:"2Y-07-05", phase:"2차년도", ws:"이종시스템 연계 SW/SDK", task:"실시간·배치 전송 인터페이스 구현", owner:"더존비즈온", collab:"참여병원", schedule:"8~10월", milestone:"8~10월", effort:"EST 25-45", status:"미시작", progress:0, notes:"" },
  { id:"2Y-07-06", phase:"2차년도", ws:"이종시스템 연계 SW/SDK", task:"연계 SW 로깅·모니터링 구현", owner:"더존비즈온", collab:"서울아산병원", schedule:"9~10월", milestone:"9~10월", effort:"EST 15-30", status:"미시작", progress:0, notes:"" },
  { id:"2Y-07-07", phase:"2차년도", ws:"이종시스템 연계 SW/SDK", task:"SW 배포·업데이트·Rollback 체계", owner:"더존비즈온", collab:"참여기관", schedule:"10월", milestone:"10월", effort:"EST 15-25", status:"미시작", progress:0, notes:"MIT 배포 계획과 연계" },
  { id:"2Y-08-01", phase:"2차년도", ws:"AI/FHIR", task:"SDM-to-FHIR 변환 규칙 구현", owner:"서울아산병원", collab:"더존", schedule:"7~9월", milestone:"7~9월", effort:"EST 30-50", status:"미시작", progress:0, notes:"AI 자동생성 모델의 규칙 기준" },
  { id:"2Y-08-02", phase:"2차년도", ws:"AI/FHIR", task:"AI 기반 FHIR 생성 모델 연계", owner:"서울아산병원", collab:"더존,솔트룩스", schedule:"8~10월", milestone:"8~10월", effort:"EST 30-60", status:"미시작", progress:0, notes:"책임경계 명확화 필수" },
  { id:"2Y-08-03", phase:"2차년도", ws:"AI/FHIR", task:"FHIR Validator 통합", owner:"더존비즈온", collab:"서울아산병원", schedule:"8~10월", milestone:"8~10월", effort:"EST 25-40", status:"미시작", progress:0, notes:"FHIR 프로파일 성공률 측정 근거" },
  { id:"2Y-08-04", phase:"2차년도", ws:"AI/FHIR", task:"FHIR Server 구축·기관 연동 관리", owner:"더존비즈온", collab:"서울아산병원,기관", schedule:"9~10월", milestone:"9~10월", effort:"EST 30-50", status:"미시작", progress:0, notes:"서버 위치는 물리/논리 TBD" },
  { id:"2Y-08-05", phase:"2차년도", ws:"AI/FHIR", task:"FHIR IG 구조 호출 서비스", owner:"더존비즈온", collab:"서울아산병원", schedule:"9월", milestone:"9월", effort:"EST 10-20", status:"미시작", progress:0, notes:"" },
  { id:"2Y-08-06", phase:"2차년도", ws:"AI/FHIR", task:"검증 실패 후속처리·롤백 규칙", owner:"더존비즈온", collab:"서울아산병원", schedule:"10월", milestone:"10월", effort:"EST 15-25", status:"미시작", progress:0, notes:"" },
  { id:"2Y-08-07", phase:"2차년도", ws:"AI/FHIR", task:"FHIR Bundle/Message 메타데이터 설계", owner:"서울아산병원", collab:"더존", schedule:"9~10월", milestone:"9~10월", effort:"EST 10-20", status:"미시작", progress:0, notes:"" },
  { id:"2Y-08-08", phase:"2차년도", ws:"AI/FHIR", task:"AI/FHIR 성능평가 설계", owner:"서울아산병원", collab:"더존,솔트룩스", schedule:"9월", milestone:"9월", effort:"EST 10-20", status:"미시작", progress:0, notes:"공인평가 여부 TBD" },
  { id:"2Y-09-01", phase:"2차년도", ws:"기관별 인프라/데이터", task:"서울아산병원 기준 SDM/MDM/IDB 적용", owner:"서울아산병원", collab:"더존", schedule:"6~9월", milestone:"6~9월", effort:"EST 30-60", status:"미시작", progress:0, notes:"실데이터 사용범위 확인" },
  { id:"2Y-09-02", phase:"2차년도", ws:"기관별 인프라/데이터", task:"울산대학교병원 소화기 데이터셋·IDB/SDM 구축", owner:"울산대학교병원", collab:"더존,서울아산병원", schedule:"6~10월", milestone:"6~10월", effort:"EST 40-80", status:"미시작", progress:0, notes:"" },
  { id:"2Y-09-03", phase:"2차년도", ws:"기관별 인프라/데이터", task:"경북대학교병원 신경계 IDB/DMZ/SDM 구축", owner:"경북대학교병원", collab:"더존,서울아산병원", schedule:"6~10월", milestone:"6~10월", effort:"EST 40-80", status:"미시작", progress:0, notes:"원내 표준용어위원회 운영" },
  { id:"2Y-09-04", phase:"2차년도", ws:"기관별 인프라/데이터", task:"국립중앙의료원 데이터 표준사전 구축", owner:"국립중앙의료원", collab:"서울아산병원,더존", schedule:"6~9월", milestone:"6~9월", effort:"EST 20-40", status:"미시작", progress:0, notes:"" },
  { id:"2Y-09-05", phase:"2차년도", ws:"기관별 인프라/데이터", task:"충남대학교병원 인터페이스 HW/DB/콘텐츠 설계", owner:"충남대학교병원", collab:"세종충남,더존", schedule:"5~9월", milestone:"5~9월", effort:"EST 25-50", status:"미시작", progress:0, notes:"" },
  { id:"2Y-09-06", phase:"2차년도", ws:"기관별 인프라/데이터", task:"세종충남대학교병원 인터페이스 HW/DB/콘텐츠 설계", owner:"세종충남대학교병원", collab:"충남대,더존", schedule:"5~9월", milestone:"5~9월", effort:"EST 25-50", status:"미시작", progress:0, notes:"" },
  { id:"2Y-09-07", phase:"2차년도", ws:"기관별 인프라/데이터", task:"강릉아산병원 표준통합관리 기반 구축", owner:"강릉아산병원", collab:"서울아산병원,더존", schedule:"6~10월", milestone:"6~10월", effort:"EST 25-50", status:"미시작", progress:0, notes:"" },
  { id:"2Y-09-08", phase:"2차년도", ws:"기관별 인프라/데이터", task:"기관별 보안·네트워크 사전점검", owner:"각 참여기관", collab:"더존", schedule:"6~9월", milestone:"6~9월", effort:"EST 5-10/기관", status:"미시작", progress:0, notes:"병원별 정책 상이" },
  { id:"2Y-10-01", phase:"2차년도", ws:"보안/가명/감사", task:"가명처리·비식별화 적용 기준", owner:"서울아산병원", collab:"솔트룩스,더존", schedule:"6~8월", milestone:"6~8월", effort:"EST 15-25", status:"미시작", progress:0, notes:"" },
  { id:"2Y-10-02", phase:"2차년도", ws:"보안/가명/감사", task:"RBAC·기관별 접근통제 검증", owner:"더존비즈온", collab:"서울아산병원", schedule:"9월", milestone:"9월", effort:"EST 10-20", status:"미시작", progress:0, notes:"다기관 운영 전 필수" },
  { id:"2Y-10-03", phase:"2차년도", ws:"보안/가명/감사", task:"감사로그·DMP·자료반출 관리", owner:"서울아산병원", collab:"더존,기관", schedule:"9월", milestone:"9월", effort:"EST 8-15", status:"미시작", progress:0, notes:"RFP DMP 요구 반영" },
  { id:"2Y-10-04", phase:"2차년도", ws:"보안/가명/감사", task:"취약점·보안성 점검", owner:"더존비즈온", collab:"참여기관", schedule:"10월", milestone:"10월", effort:"EST 15-25", status:"미시작", progress:0, notes:"외부 점검기관 여부 TBD" },
  { id:"2Y-11-01", phase:"2차년도", ws:"QA/검증", task:"통합 테스트 전략·RTM 확정", owner:"더존비즈온", collab:"서울아산병원", schedule:"6월", milestone:"6월", effort:"EST 10-20", status:"미시작", progress:0, notes:"실제 검수 기준" },
  { id:"2Y-11-02", phase:"2차년도", ws:"QA/검증", task:"ETL·SDM·FHIR 단위/통합 테스트", owner:"더존비즈온", collab:"서울아산병원,기관", schedule:"9~10월", milestone:"9~10월", effort:"EST 20-40", status:"미시작", progress:0, notes:"" },
  { id:"2Y-11-03", phase:"2차년도", ws:"QA/검증", task:"시나리오 기반 End-to-End 테스트", owner:"서울아산병원", collab:"더존,참여기관", schedule:"10월", milestone:"10월", effort:"EST 15-30", status:"미시작", progress:0, notes:"성과교류회 시연 선행" },
  { id:"2Y-11-04", phase:"2차년도", ws:"QA/검증", task:"데이터 품질 규칙 및 리포트", owner:"서울아산병원", collab:"더존,기관", schedule:"9~10월", milestone:"9~10월", effort:"EST 20-35", status:"미시작", progress:0, notes:"성과지표 근거" },
  { id:"2Y-11-05", phase:"2차년도", ws:"QA/검증", task:"성능·부하·복구 테스트", owner:"더존비즈온", collab:"서울아산병원", schedule:"10월", milestone:"10월", effort:"EST 15-25", status:"미시작", progress:0, notes:"" },
  { id:"2Y-11-06", phase:"2차년도", ws:"QA/검증", task:"임상 유효성·사용자 피드백 평가", owner:"서울아산병원", collab:"울산,경북,참여병원", schedule:"10~11월", milestone:"10~11월", effort:"EST 10-20", status:"미시작", progress:0, notes:"샘플 데이터 사용 시 한계 명시" },
  { id:"2Y-11-07", phase:"2차년도", ws:"QA/검증", task:"검수 증적 패키지 작성", owner:"더존비즈온", collab:"서울아산병원", schedule:"11월", milestone:"11월", effort:"EST 10-20", status:"미시작", progress:0, notes:"최종 산출물 구조화" },
  { id:"2Y-12-01", phase:"2차년도", ws:"운영전환/보고", task:"사용자·운영자 매뉴얼 작성", owner:"더존비즈온", collab:"서울아산병원", schedule:"10~11월", milestone:"10~11월", effort:"EST 15-25", status:"미시작", progress:0, notes:"" },
  { id:"2Y-12-02", phase:"2차년도", ws:"운영전환/보고", task:"장애대응·운영지원 프로세스", owner:"더존비즈온", collab:"서울아산병원,기관", schedule:"11월", milestone:"11월", effort:"EST 8-15", status:"미시작", progress:0, notes:"" },
  { id:"2Y-12-03", phase:"2차년도", ws:"운영전환/보고", task:"성과교류회 시제품 시연·연차보고서", owner:"서울아산병원", collab:"더존,모든기관", schedule:"11~12월", milestone:"11~12월", effort:"EST 20-30", status:"미시작", progress:0, notes:"" },
  { id:"3Y-PRE-01", phase:"3차년도 예비", ws:"Phase 3 준비", task:"행정/원무/청구 지원 확장 사전분석", owner:"서울아산병원", collab:"더존", schedule:"12월", milestone:"12월", effort:"EST 10-20", status:"미시작", progress:0, notes:"2차년도 본개발 범위는 아님" },
  { id:"3Y-PRE-02", phase:"3차년도 예비", ws:"Phase 3 준비", task:"다기관 실증 평가척도 초안", owner:"서울아산병원", collab:"참여기관", schedule:"12월", milestone:"12월", effort:"EST 10-20", status:"미시작", progress:0, notes:"" },
  { id:"3Y-PRE-03", phase:"3차년도 예비", ws:"Phase 3 준비", task:"오픈소스·패키징·확산 로드맵", owner:"더존비즈온", collab:"서울아산병원,관리기관", schedule:"12월", milestone:"12월", effort:"EST 10-20", status:"미시작", progress:0, notes:"RFP 특기사항 반영" },
];

const WS_COLORS = {
  "PMO/거버넌스":            { bg:"#1e3a5f", accent:"#3b82f6" },
  "요구사항/업무분석":        { bg:"#1a3d2b", accent:"#22c55e" },
  "SDM/MDM":                  { bg:"#2d1b69", accent:"#a78bfa" },
  "Staging/IDB/ETL":          { bg:"#312520", accent:"#fb923c" },
  "용어표준화/매핑":          { bg:"#1e3a3a", accent:"#2dd4bf" },
  "포털/백오피스":            { bg:"#1e2a4a", accent:"#60a5fa" },
  "동의/정보교류":            { bg:"#3a1a2a", accent:"#f472b6" },
  "이종시스템 연계 SW/SDK":   { bg:"#2a2a1e", accent:"#facc15" },
  "AI/FHIR":                  { bg:"#1a2a3a", accent:"#38bdf8" },
  "기관별 인프라/데이터":     { bg:"#1e3330", accent:"#4ade80" },
  "보안/가명/감사":           { bg:"#3a1e1e", accent:"#f87171" },
  "QA/검증":                  { bg:"#2a2020", accent:"#fbbf24" },
  "운영전환/보고":            { bg:"#1a2a20", accent:"#86efac" },
  "Phase 3 준비":             { bg:"#222222", accent:"#94a3b8" },
};

const STATUS_CONFIG = {
  "미시작": { color:"#475569", bg:"#1e293b", label:"미시작" },
  "진행중": { color:"#38bdf8", bg:"#0c2a3a", label:"진행중" },
  "완료":   { color:"#4ade80", bg:"#0a2a14", label:"완료"   },
  "지연":   { color:"#f87171", bg:"#2a0e0e", label:"지연"   },
  "보류":   { color:"#fbbf24", bg:"#2a1e0a", label:"보류"   },
};

// ─── SUPABASE HOOK ────────────────────────────────────────────────────────────
// window.storage → Supabase 실시간 DB로 교체
function useSupabaseTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState("connecting"); // connecting | live | error

  // 초기 데이터 로드
  useEffect(() => {
    async function loadTasks() {
      try {
        const { data, error } = await supabase
          .from("wbs_tasks")
          .select("*")
          .order("id");

        if (error) throw error;

        if (data.length === 0) {
          // DB가 비어있으면 초기 데이터 시드
          await seedInitialData();
        } else {
          setTasks(data);
        }
        setSyncStatus("live");
      } catch (err) {
        console.error("데이터 로드 실패:", err);
        setError(err.message);
        setSyncStatus("error");
        // 오프라인 폴백: 로컬 초기 데이터 사용
        setTasks(INITIAL_WBS);
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, []);

  // 실시간 구독 (다른 팀원이 수정하면 즉시 반영)
  useEffect(() => {
    const channel = supabase
      .channel("wbs_tasks_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wbs_tasks" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setTasks((prev) =>
              prev.map((t) => (t.id === payload.new.id ? payload.new : t))
            );
          } else if (payload.eventType === "INSERT") {
            setTasks((prev) => [...prev, payload.new]);
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        setSyncStatus(status === "SUBSCRIBED" ? "live" : "connecting");
      });

    return () => supabase.removeChannel(channel);
  }, []);

  // 시드 함수: DB가 빈 경우 초기 데이터 삽입
  async function seedInitialData() {
    const { error } = await supabase.from("wbs_tasks").insert(INITIAL_WBS);
    if (error) throw error;
    setTasks(INITIAL_WBS);
  }

  // 단일 태스크 업데이트
  const updateTask = useCallback(async (updated) => {
    // 낙관적 업데이트 (UI 즉시 반영)
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

    const { error } = await supabase
      .from("wbs_tasks")
      .update({
        status:   updated.status,
        progress: updated.progress,
        notes:    updated.notes,
        owner:    updated.owner,
        collab:   updated.collab,
        schedule: updated.schedule,
        effort:   updated.effort,
      })
      .eq("id", updated.id);

    if (error) {
      console.error("업데이트 실패:", error);
      setSyncStatus("error");
    }
  }, []);

  // 전체 초기화
  const resetAll = useCallback(async () => {
    if (!window.confirm("모든 진행상태·메모를 초기화하시겠습니까?")) return;
    const resets = INITIAL_WBS.map(({ id, status, progress, notes }) => ({
      id, status, progress, notes,
    }));
    setTasks(INITIAL_WBS); // 낙관적 업데이트
    for (const r of resets) {
      await supabase.from("wbs_tasks").update(r).eq("id", r.id);
    }
  }, []);

  return { tasks, loading, error, syncStatus, updateTask, resetAll };
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function SyncIndicator({ status }) {
  const map = {
    live:       { color:"#4ade80", dot:"#4ade80", label:"LIVE · 실시간 저장" },
    connecting: { color:"#fbbf24", dot:"#fbbf24", label:"연결 중…" },
    error:      { color:"#f87171", dot:"#f87171", label:"오프라인 (로컬 저장)" },
  };
  const s = map[status] || map.connecting;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
      <div style={{ width:8, height:8, borderRadius:"50%", background:s.dot, boxShadow:`0 0 8px ${s.dot}66` }} />
      <span style={{ fontSize:11, color:s.color, fontWeight:700, letterSpacing:"0.1em" }}>{s.label}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG["미시작"];
  return (
    <span style={{
      background:c.bg, color:c.color,
      border:`1px solid ${c.color}44`,
      padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:700,
      whiteSpace:"nowrap", letterSpacing:"0.03em"
    }}>{c.label}</span>
  );
}

function ProgressBar({ value }) {
  const clr = value >= 100 ? "#4ade80" : value >= 60 ? "#38bdf8" : value >= 30 ? "#fbbf24" : "#64748b";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, minWidth:90 }}>
      <div style={{ flex:1, height:5, background:"#1e293b", borderRadius:3, overflow:"hidden" }}>
        <div style={{ width:`${value}%`, height:"100%", background:clr, borderRadius:3, transition:"width .3s" }} />
      </div>
      <span style={{ fontSize:10, color:"#94a3b8", width:26, textAlign:"right" }}>{value}%</span>
    </div>
  );
}

function EditModal({ task, onSave, onClose }) {
  const [form, setForm] = useState({ ...task });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"#000a", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center"
    }} onClick={onClose}>
      <div style={{
        background:"#0f172a", border:"1px solid #1e293b",
        borderRadius:12, padding:28, width:600, maxWidth:"95vw", maxHeight:"85vh",
        overflow:"auto", boxShadow:"0 20px 60px #000"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ color:"#38bdf8", fontSize:13, fontWeight:700, fontFamily:"monospace" }}>{form.id}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#64748b", fontSize:20, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ fontWeight:700, color:"#f1f5f9", fontSize:16, marginBottom:16, lineHeight:1.4 }}>{form.task}</div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
          <div>
            <label style={labelStyle}>담당기관</label>
            <input value={form.owner} onChange={e => set("owner", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>협업기관</label>
            <input value={form.collab} onChange={e => set("collab", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>일정</label>
            <input value={form.schedule} onChange={e => set("schedule", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>공수</label>
            <input value={form.effort} onChange={e => set("effort", e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={labelStyle}>진행상태</label>
          <select value={form.status} onChange={e => set("status", e.target.value)} style={inputStyle}>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={labelStyle}>진행률 ({form.progress}%)</label>
          <input type="range" min={0} max={100} value={form.progress}
            onChange={e => set("progress", Number(e.target.value))}
            style={{ width:"100%", accentColor:"#38bdf8" }} />
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={labelStyle}>메모 / 이슈</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
            rows={3} style={{ ...inputStyle, resize:"vertical", fontFamily:"inherit" }} />
        </div>

        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={btnSecondary}>취소</button>
          <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle  = { display:"block", fontSize:11, color:"#64748b", marginBottom:4, fontWeight:600, letterSpacing:"0.05em" };
const inputStyle  = { width:"100%", background:"#1e293b", border:"1px solid #334155", borderRadius:6, padding:"7px 10px", color:"#f1f5f9", fontSize:13, outline:"none", boxSizing:"border-box" };
const btnPrimary  = { background:"#0ea5e9", color:"#fff", border:"none", borderRadius:6, padding:"8px 18px", fontSize:13, fontWeight:700, cursor:"pointer" };
const btnSecondary= { background:"#1e293b", color:"#94a3b8", border:"1px solid #334155", borderRadius:6, padding:"8px 18px", fontSize:13, cursor:"pointer" };

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const { tasks, loading, syncStatus, updateTask, resetAll } = useSupabaseTasks();
  const [search, setSearch]         = useState("");
  const [filterWs, setFilterWs]     = useState("전체");
  const [filterStatus, setFilterStatus] = useState("전체");
  const [filterOwner, setFilterOwner]   = useState("전체");
  const [editing, setEditing]       = useState(null);
  const [view, setView]             = useState("wbs"); // wbs | dashboard | timeline | qna

  // ── Q&A State ──────────────────────────────────────────────────────────────
  const [qnaPosts, setQnaPosts]         = useState([]);
  const [qnaReplies, setQnaReplies]     = useState([]);
  const [qnaLoading, setQnaLoading]     = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);   // post 상세보기
  const [showNewPost, setShowNewPost]   = useState(false);  // 새 질의 폼
  const [qnaOrgCat, setQnaOrgCat]       = useState("");
  const [qnaOrgName, setQnaOrgName]     = useState("");

  const [qnaTitle, setQnaTitle]         = useState("");
  const [qnaContent, setQnaContent]     = useState("");
  const [qnaSubmitting, setQnaSubmitting] = useState(false);
  const [replyOrgCat, setReplyOrgCat]   = useState("");
  const [replyOrgName, setReplyOrgName] = useState("");

  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Derived
  const allWs      = ["전체", ...Array.from(new Set(tasks.map(t => t.ws)))];
  const allOwners  = ["전체", ...Array.from(new Set(tasks.map(t => t.owner).filter(Boolean)))];
  const allStatuses= ["전체", ...Object.keys(STATUS_CONFIG)];

  const filtered = tasks.filter(t => {
    const q = search.toLowerCase();
    const matchQ  = !q || t.id.toLowerCase().includes(q) || t.task.toLowerCase().includes(q) || t.owner.toLowerCase().includes(q) || t.ws.toLowerCase().includes(q);
    const matchWs = filterWs === "전체" || t.ws === filterWs;
    const matchSt = filterStatus === "전체" || t.status === filterStatus;
    const matchOw = filterOwner === "전체" || t.owner === filterOwner;
    return matchQ && matchWs && matchSt && matchOw;
  });

  // Stats
  const total      = tasks.length;
  const done       = tasks.filter(t => t.status === "완료").length;
  const inProgress = tasks.filter(t => t.status === "진행중").length;
  const delayed    = tasks.filter(t => t.status === "지연").length;
  const avgProgress= Math.round(tasks.reduce((s, t) => s + t.progress, 0) / (total || 1));

  const wsSummary = Array.from(new Set(tasks.map(t => t.ws))).map(ws => {
    const wsTasks = tasks.filter(t => t.ws === ws);
    const p = Math.round(wsTasks.reduce((s, t) => s + t.progress, 0) / (wsTasks.length || 1));
    return { ws, count: wsTasks.length, progress: p, done: wsTasks.filter(t => t.status === "완료").length };
  });

  const MILESTONES = [
    { month:"2026.04", label:"기준선·용어사전 개설, 포털 상세기획 착수" },
    { month:"2026.05", label:"시나리오 흐름 Freeze, 데이터 정책 1차 확정" },
    { month:"2026.06", label:"포털 상세기획 초안, SDM ver2.2 Freeze, ETL 설계" },
    { month:"2026.07", label:"PI 미팅·중간점검, MDM/표준용어 구현, IDB 샘플 적재" },
    { month:"2026.08", label:"동의 API, 연계 SW, FHIR Validator 통합 착수" },
    { month:"2026.09", label:"PI 미팅, SDM 적재·FHIR 변환·Viewer 1차 통합" },
    { month:"2026.10", label:"결과점검, E2E 시나리오 테스트, 성능·보안 QA" },
    { month:"2026.11", label:"성과교류회 시제품 시연, 연차보고서 제출 준비" },
    { month:"2026.12", label:"최종보고회, 3차년도 사업수행계획서 확정" },
  ];

  // ── 소속기관 계층구조 ───────────────────────────────────────────────────────
  const ORG_HIERARCHY = {
    "공공기관":  ["보건복지부", "보건의료정보원"],
    "개발업체":  ["솔트룩스", "더존비즈온", "엠시스텍", "이온엠솔루션"],
    "상급병원":  ["서울아산병원", "강릉아산병원", "충남대학교병원", "경북대학교병원", "울산대학교병원"],
    "종합병원":  ["국립중앙의료원", "세종충남대학교병원", "서울녹색병원", "진주제일병원", "울산병원", "강남 베드로병원", "남양주한양병원"],
    "병원":      ["강북 힘찬병원", "일산 복음병원", "대구 보강병원", "대구 세강병원", "진주 반도병원"],
  };
  const ORG_CAT_COLOR = {
    "공공기관": { bg:"#1e2a4a", color:"#60a5fa" },
    "개발업체": { bg:"#1a3a2b", color:"#34d399" },
    "상급병원": { bg:"#2d1b69", color:"#a78bfa" },
    "종합병원": { bg:"#312520", color:"#fb923c" },
    "병원":     { bg:"#1e3a3a", color:"#2dd4bf" },
  };

  // ── Q&A Supabase 연동 ──────────────────────────────────────────────────────
  useEffect(() => {
    if (view !== "qna") return;
    loadQnaPosts();
  }, [view]);

  async function loadQnaPosts() {
    setQnaLoading(true);
    try {
      const { data, error } = await supabase
        .from("qna_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setQnaPosts(data || []);
    } catch(e) { console.error("Q&A 로드 실패:", e); }
    setQnaLoading(false);
  }

  async function loadReplies(postId) {
    const { data, error } = await supabase
      .from("qna_replies")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (!error) setQnaReplies(data || []);
  }

  async function submitPost() {
    if (!qnaOrgCat || !qnaOrgName || !qnaTitle.trim() || !qnaContent.trim()) {
      alert("모든 항목을 입력해주세요."); return;
    }
    setQnaSubmitting(true);
    try {
      const { error } = await supabase.from("qna_posts").insert({
        org_category: qnaOrgCat, org_name: qnaOrgName,
        author: qnaOrgName, title: qnaTitle.trim(), content: qnaContent.trim()
      });
      if (error) throw error;
      setQnaOrgCat(""); setQnaOrgName("");
      setQnaTitle(""); setQnaContent(""); setShowNewPost(false);
      await loadQnaPosts();
    } catch(e) { alert("저장 실패: " + e.message); }
    setQnaSubmitting(false);
  }

  async function submitReply() {
    if (!replyOrgCat || !replyOrgName || !replyContent.trim()) {
      alert("모든 항목을 입력해주세요."); return;
    }
    setReplySubmitting(true);
    try {
      const { error } = await supabase.from("qna_replies").insert({
        post_id: selectedPost.id, org_category: replyOrgCat,
        org_name: replyOrgName, author: replyOrgName, content: replyContent.trim()
      });
      if (error) throw error;
      setReplyOrgCat(""); setReplyOrgName(""); setReplyContent("");
      await loadReplies(selectedPost.id);
      // 답글 수 업데이트
      await loadQnaPosts();
    } catch(e) { alert("저장 실패: " + e.message); }
    setReplySubmitting(false);
  }

  function fmtDate(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  }

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:"#060d1a", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
        <div style={{ width:40, height:40, border:"3px solid #1e293b", borderTop:"3px solid #38bdf8", borderRadius:"50%", animation:"spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color:"#64748b", fontSize:13 }}>Supabase에서 데이터를 불러오는 중…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#060d1a", color:"#e2e8f0", fontFamily:"'Noto Sans KR','Malgun Gothic',sans-serif", fontSize:13 }}>
      {/* ── HEADER ── */}
      <div style={{ background:"linear-gradient(135deg,#0c1a2e,#0a2a3a)", borderBottom:"1px solid #1e3a5f", padding:"18px 24px" }}>
        <div style={{ maxWidth:1600, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div>
              <SyncIndicator status={syncStatus} />
              <h1 style={{ margin:0, fontSize:18, fontWeight:800, color:"#f1f5f9", letterSpacing:"-0.02em", lineHeight:1.3 }}>
                보건의료데이터 표준 통합 운영체계
              </h1>
              <p style={{ margin:"4px 0 0", fontSize:12, color:"#64748b" }}>
                2차년도 수행계획 · 통합 WBS 프로젝트 관리 시스템
              </p>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {["wbs","dashboard","timeline","qna"].map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding:"7px 14px", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer",
                  background: view === v ? "#0ea5e9" : "#1e293b",
                  color:      view === v ? "#fff"    : "#94a3b8",
                  border:     view === v ? "none"    : "1px solid #334155"
                }}>
                  {v === "wbs" ? "📋 WBS 목록" : v === "dashboard" ? "📊 대시보드" : v === "timeline" ? "📅 마일스톤" : "💬 Q&A"}
                </button>
              ))}
              <button onClick={resetAll} style={{ ...btnSecondary, fontSize:11, padding:"7px 12px" }}>초기화</button>
            </div>
          </div>

          {/* KPI strip */}
          <div style={{ display:"flex", gap:12, marginTop:16, flexWrap:"wrap" }}>
            {[
              { label:"전체 과업",  val:total,       color:"#94a3b8" },
              { label:"진행중",     val:inProgress,  color:"#38bdf8" },
              { label:"완료",       val:done,        color:"#4ade80" },
              { label:"지연",       val:delayed,     color:"#f87171" },
              { label:"전체 진행률",val:`${avgProgress}%`, color:"#a78bfa" },
            ].map(k => (
              <div key={k.label} style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:8, padding:"8px 14px", minWidth:90 }}>
                <div style={{ fontSize:18, fontWeight:800, color:k.color }}>{k.val}</div>
                <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DASHBOARD VIEW ── */}
      {view === "dashboard" && (
        <div style={{ maxWidth:1600, margin:"0 auto", padding:"20px 24px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
            {wsSummary.map(({ ws, count, progress, done }) => {
              const col = WS_COLORS[ws] || { bg:"#1e293b", accent:"#64748b" };
              return (
                <div key={ws} style={{ background:col.bg, border:`1px solid ${col.accent}33`, borderRadius:10, padding:16, cursor:"pointer" }}
                  onClick={() => { setFilterWs(ws); setView("wbs"); }}>
                  <div style={{ fontSize:11, color:col.accent, fontWeight:700, marginBottom:8, letterSpacing:"0.05em" }}>{ws}</div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
                    <div>
                      <div style={{ fontSize:22, fontWeight:800, color:"#f1f5f9" }}>{progress}%</div>
                      <div style={{ fontSize:11, color:"#64748b" }}>완료 {done}/{count}건</div>
                    </div>
                    <div style={{ width:60, height:60 }}>
                      <svg viewBox="0 0 36 36" style={{ transform:"rotate(-90deg)" }}>
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke={col.accent} strokeWidth="3"
                          strokeDasharray={`${progress} ${100 - progress}`} strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                  <div style={{ height:3, background:"#1e293b", borderRadius:2, marginTop:12 }}>
                    <div style={{ width:`${progress}%`, height:"100%", background:col.accent, borderRadius:2 }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop:24 }}>
            <h3 style={{ color:"#94a3b8", fontSize:13, fontWeight:700, marginBottom:12 }}>상태별 분포</h3>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {Object.entries(STATUS_CONFIG).map(([st, cfg]) => {
                const c = tasks.filter(t => t.status === st).length;
                return (
                  <div key={st} onClick={() => { setFilterStatus(st); setView("wbs"); }}
                    style={{ background:cfg.bg, border:`1px solid ${cfg.color}55`, borderRadius:8, padding:"10px 16px", cursor:"pointer", minWidth:100 }}>
                    <div style={{ fontSize:22, fontWeight:800, color:cfg.color }}>{c}</div>
                    <div style={{ fontSize:11, color:"#64748b" }}>{st}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TIMELINE VIEW ── */}
      {view === "timeline" && (
        <div style={{ maxWidth:1600, margin:"0 auto", padding:"20px 24px" }}>
          <h3 style={{ color:"#94a3b8", fontSize:13, fontWeight:700, marginBottom:16 }}>2026년 마일스톤 로드맵</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            {MILESTONES.map((m, i) => (
              <div key={m.month} style={{ display:"grid", gridTemplateColumns:"100px 1fr", gap:0 }}>
                <div style={{ background:"#0f172a", border:"1px solid #1e3a5f", padding:"10px 12px", fontWeight:700, color:"#38bdf8", fontSize:12, borderRadius: i === 0 ? "8px 0 0 0" : i === MILESTONES.length-1 ? "0 0 0 8px" : "0" }}>
                  {m.month}
                </div>
                <div style={{ background:"#0c1a2e", border:"1px solid #1e293b", borderLeft:"none", padding:"10px 14px", fontSize:12, color:"#cbd5e1", borderRadius: i === 0 ? "0 8px 0 0" : i === MILESTONES.length-1 ? "0 0 8px 0" : "0" }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:24 }}>
            <h3 style={{ color:"#f87171", fontSize:13, fontWeight:700, marginBottom:12 }}>⚠️ 핵심 리스크 (상위 5개)</h3>
            {[
              "R-01 · 요구사항·용어 불명확 → 용어사전·범위 매트릭스 선행",
              "R-02 · 서비스 포털 1차년도 미진행 → 포털 IA 6월까지 초안 확정",
              "R-03 · SDM 버전 차이로 재작업 → ver2.2 Freeze 후 변경관리",
              "R-05 · 임상 의미 손실 → High-risk 항목 수동승인",
              "R-09 · FHIR IG/Profile 기준 미확정 → IG 버전·프로파일·ValueSet 기준선 고정",
            ].map((r, i) => (
              <div key={i} style={{ background:"#2a0e0e", border:"1px solid #7f1d1d44", borderRadius:6, padding:"8px 12px", marginBottom:4, fontSize:12, color:"#fca5a5" }}>{r}</div>
            ))}
          </div>
        </div>
      )}

      {/* ── WBS TABLE VIEW ── */}
      {view === "wbs" && (
        <div style={{ maxWidth:1600, margin:"0 auto", padding:"16px 24px" }}>
          {/* Filters */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14, alignItems:"center" }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍  ID, 과업명, 담당기관 검색…"
              style={{ ...inputStyle, flex:"1 1 220px", background:"#0f172a", padding:"9px 12px" }} />
            <select value={filterWs}     onChange={e => setFilterWs(e.target.value)}     style={{ ...inputStyle, width:"auto" }}>
              {allWs.map(w => <option key={w}>{w}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width:100 }}>
              {allStatuses.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterOwner}  onChange={e => setFilterOwner(e.target.value)}  style={{ ...inputStyle, width:160 }}>
              {allOwners.map(o => <option key={o}>{o}</option>)}
            </select>
            <span style={{ fontSize:11, color:"#475569", whiteSpace:"nowrap" }}>{filtered.length}건</span>
            {(filterWs !== "전체" || filterStatus !== "전체" || filterOwner !== "전체" || search) && (
              <button onClick={() => { setFilterWs("전체"); setFilterStatus("전체"); setFilterOwner("전체"); setSearch(""); }}
                style={{ ...btnSecondary, fontSize:11, padding:"7px 10px" }}>필터 초기화</button>
            )}
          </div>

          {/* Table */}
          <div style={{ overflowX:"auto", border:"1px solid #1e293b", borderRadius:10, background:"#0a1628" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:1100 }}>
              <thead>
                <tr style={{ background:"#0f1f35" }}>
                  {["WBS ID","업무영역","과업명","담당기관","일정","공수","상태","진행률","메모","액션"].map(h => (
                    <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, color:"#64748b", fontWeight:700, letterSpacing:"0.06em", whiteSpace:"nowrap", borderBottom:"1px solid #1e293b", borderRight:"1px solid #1e293b11" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const col = WS_COLORS[t.ws] || { bg:"#1e293b", accent:"#64748b" };
                  return (
                    <tr key={t.id}
                      style={{ background: i % 2 === 0 ? "#080f1d" : "#0a1220", borderBottom:"1px solid #1e293b22" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#0f1f35"}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#080f1d" : "#0a1220"}>
                      <td style={{ padding:"9px 12px", fontFamily:"monospace", fontSize:11, color:"#38bdf8", whiteSpace:"nowrap", fontWeight:700 }}>{t.id}</td>
                      <td style={{ padding:"9px 12px" }}>
                        <span style={{ background:col.bg, color:col.accent, border:`1px solid ${col.accent}33`, padding:"2px 7px", borderRadius:4, fontSize:10, fontWeight:700, whiteSpace:"nowrap" }}>
                          {t.ws}
                        </span>
                      </td>
                      <td style={{ padding:"9px 12px", color:"#cbd5e1", maxWidth:280 }}>
                        <div style={{ lineHeight:1.4 }}>{t.task}</div>
                        {t.notes && <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>💬 {t.notes.slice(0,50)}{t.notes.length > 50 ? "…" : ""}</div>}
                      </td>
                      <td style={{ padding:"9px 12px", color:"#94a3b8", whiteSpace:"nowrap", fontSize:11 }}>{t.owner}</td>
                      <td style={{ padding:"9px 12px", color:"#64748b", whiteSpace:"nowrap", fontSize:11 }}>{t.schedule}</td>
                      <td style={{ padding:"9px 12px", color:"#475569", whiteSpace:"nowrap", fontSize:10 }}>{t.effort}</td>
                      <td style={{ padding:"9px 12px" }}><StatusBadge status={t.status} /></td>
                      <td style={{ padding:"9px 12px", minWidth:110 }}><ProgressBar value={t.progress} /></td>
                      <td style={{ padding:"9px 12px", maxWidth:160, fontSize:11, color:"#475569" }}>
                        {t.notes ? t.notes.slice(0, 60) + (t.notes.length > 60 ? "…" : "") : "—"}
                      </td>
                      <td style={{ padding:"9px 12px" }}>
                        <button onClick={() => setEditing(t)} style={{
                          background:"#1e293b", border:"1px solid #334155", color:"#94a3b8",
                          borderRadius:5, padding:"4px 10px", fontSize:11, cursor:"pointer"
                        }}>편집</button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} style={{ padding:40, textAlign:"center", color:"#334155" }}>검색 결과가 없습니다</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:10, fontSize:11, color:"#334155" }}>
            ✓ 편집 버튼을 클릭해 상태·진행률·메모를 수정하면 Supabase DB에 실시간 저장됩니다
          </div>
        </div>
      )}

      {/* ── Q&A VIEW ── */}
      {view === "qna" && (
        <div style={{ maxWidth:900, margin:"0 auto", padding:"24px 24px" }}>
          {/* 파일첨부 불가 배너 */}
          <div style={{ background:"#1e1a0e", border:"1px solid #854d0e", borderRadius:8, padding:"10px 16px", marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:16 }}>🚫</span>
            <span style={{ color:"#fbbf24", fontSize:13, fontWeight:600 }}>파일 첨부는 할 수 없습니다</span>
            <span style={{ color:"#92400e", fontSize:12, marginLeft:4 }}>— 텍스트로만 질의 및 답변을 작성해주세요.</span>
          </div>

          {/* 헤더 */}
          {!selectedPost ? (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div>
                  <h2 style={{ margin:0, fontSize:16, fontWeight:800, color:"#f1f5f9" }}>💬 Q&amp;A 질의응답 게시판</h2>
                  <p style={{ margin:"4px 0 0", fontSize:12, color:"#64748b" }}>참여기관 간 질의·답변을 통해 업무 이슈를 해결하세요</p>
                </div>
                <button onClick={() => { setShowNewPost(true); setQnaOrgCat(""); setQnaOrgName(""); setQnaAuthor(""); setQnaTitle(""); setQnaContent(""); }}
                  style={{ background:"#0ea5e9", color:"#fff", border:"none", borderRadius:7, padding:"9px 18px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  ✏️ 새 질의 작성
                </button>
              </div>

              {/* 새 질의 폼 */}
              {showNewPost && (
                <div style={{ background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:10, padding:20, marginBottom:20 }}>
                  <h3 style={{ margin:"0 0 16px", fontSize:14, color:"#38bdf8", fontWeight:700 }}>새 질의 작성</h3>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                    <div>
                      <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:4 }}>중분류 (기관 유형) *</label>
                      <select value={qnaOrgCat} onChange={e => { setQnaOrgCat(e.target.value); setQnaOrgName(""); }}
                        style={{ ...inputStyle, width:"100%", background:"#0f172a" }}>
                        <option value="">선택하세요</option>
                        {Object.keys(ORG_HIERARCHY).map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:4 }}>소분류 (소속기관) *</label>
                      <select value={qnaOrgName} onChange={e => setQnaOrgName(e.target.value)}
                        style={{ ...inputStyle, width:"100%", background:"#0f172a" }} disabled={!qnaOrgCat}>
                        <option value="">선택하세요</option>
                        {qnaOrgCat && ORG_HIERARCHY[qnaOrgCat].map(n => <option key={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom:10 }}>
                    <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:4 }}>제목 *</label>
                    <input value={qnaTitle} onChange={e => setQnaTitle(e.target.value)} placeholder="질의 제목을 입력하세요"
                      style={{ ...inputStyle, width:"100%", boxSizing:"border-box", background:"#0f172a" }} />
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:4 }}>내용 *</label>
                    <textarea value={qnaContent} onChange={e => setQnaContent(e.target.value)} rows={5}
                      placeholder="질의 내용을 상세히 작성해주세요."
                      style={{ ...inputStyle, width:"100%", boxSizing:"border-box", background:"#0f172a", resize:"vertical", lineHeight:1.6 }} />
                  </div>
                  <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                    <button onClick={() => setShowNewPost(false)}
                      style={{ ...btnSecondary, fontSize:12 }}>취소</button>
                    <button onClick={submitPost} disabled={qnaSubmitting}
                      style={{ background: qnaSubmitting ? "#334155" : "#0ea5e9", color:"#fff", border:"none", borderRadius:6, padding:"8px 20px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      {qnaSubmitting ? "저장 중…" : "질의 등록"}
                    </button>
                  </div>
                </div>
              )}

              {/* 게시글 목록 */}
              {qnaLoading ? (
                <div style={{ textAlign:"center", color:"#475569", padding:40 }}>불러오는 중…</div>
              ) : qnaPosts.length === 0 ? (
                <div style={{ textAlign:"center", color:"#334155", padding:60, border:"1px dashed #1e293b", borderRadius:10 }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>💬</div>
                  <div style={{ fontSize:14, color:"#475569" }}>아직 등록된 질의가 없습니다.</div>
                  <div style={{ fontSize:12, color:"#334155", marginTop:6 }}>첫 번째 질의를 작성해보세요!</div>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {qnaPosts.map((p, i) => {
                    const catCol = ORG_CAT_COLOR[p.org_category] || { bg:"#1e293b", color:"#94a3b8" };
                    return (
                      <div key={p.id} onClick={async () => { setSelectedPost(p); setShowNewPost(false); await loadReplies(p.id); }}
                        style={{ background:"#0a1628", border:"1px solid #1e293b", borderRadius:9, padding:"14px 18px", cursor:"pointer", transition:"border-color .15s" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "#0ea5e9"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "#1e293b"}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                          <span style={{ background:catCol.bg, color:catCol.color, border:`1px solid ${catCol.color}44`, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:4 }}>
                            {p.org_category}
                          </span>
                          <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>{p.org_name}</span>
                          <span style={{ fontSize:10, color:"#334155", marginLeft:"auto" }}>{fmtDate(p.created_at)}</span>
                        </div>
                        <div style={{ fontSize:14, color:"#e2e8f0", fontWeight:600, marginBottom:4 }}>{p.title}</div>
                        <div style={{ fontSize:12, color:"#64748b", whiteSpace:"pre-wrap", lineHeight:1.5 }}>
                          {p.content.length > 120 ? p.content.slice(0,120) + "…" : p.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* ── 게시글 상세 + 리플 ── */
            <>
              <button onClick={() => { setSelectedPost(null); setQnaReplies([]); loadQnaPosts(); }}
                style={{ ...btnSecondary, fontSize:12, marginBottom:16 }}>← 목록으로</button>

              {/* 원본 게시글 */}
              {(() => {
                const catCol = ORG_CAT_COLOR[selectedPost.org_category] || { bg:"#1e293b", color:"#94a3b8" };
                return (
                  <div style={{ background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:10, padding:20, marginBottom:16 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                      <span style={{ background:catCol.bg, color:catCol.color, border:`1px solid ${catCol.color}44`, fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:4 }}>
                        {selectedPost.org_category}
                      </span>
                      <span style={{ fontSize:12, color:"#94a3b8", fontWeight:600 }}>{selectedPost.org_name}</span>
                      <span style={{ fontSize:11, color:"#334155", marginLeft:"auto" }}>{fmtDate(selectedPost.created_at)}</span>
                    </div>
                    <h2 style={{ margin:"0 0 12px", fontSize:16, color:"#f1f5f9", fontWeight:800 }}>{selectedPost.title}</h2>
                    <div style={{ fontSize:13, color:"#cbd5e1", whiteSpace:"pre-wrap", lineHeight:1.8, borderTop:"1px solid #1e293b", paddingTop:12 }}>
                      {selectedPost.content}
                    </div>
                  </div>
                );
              })()}

              {/* 답변 목록 */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:"#64748b", fontWeight:700, marginBottom:10 }}>
                  💬 답변 {qnaReplies.length}개
                </div>
                {qnaReplies.map((r, i) => {
                  const catCol = ORG_CAT_COLOR[r.org_category] || { bg:"#1e293b", color:"#94a3b8" };
                  return (
                    <div key={r.id} style={{ background:"#060d1a", border:"1px solid #1e293b", borderLeft:`3px solid ${catCol.color}`, borderRadius:"0 8px 8px 0", padding:"12px 16px", marginBottom:8, marginLeft:16 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                        <span style={{ background:catCol.bg, color:catCol.color, border:`1px solid ${catCol.color}44`, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4 }}>
                          {r.org_category}
                        </span>
                        <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>{r.org_name}</span>
                        <span style={{ fontSize:10, color:"#334155", marginLeft:"auto" }}>{fmtDate(r.created_at)}</span>
                      </div>
                      <div style={{ fontSize:13, color:"#cbd5e1", whiteSpace:"pre-wrap", lineHeight:1.7 }}>{r.content}</div>
                    </div>
                  );
                })}
                {qnaReplies.length === 0 && (
                  <div style={{ color:"#334155", fontSize:12, padding:"12px 0 4px", marginLeft:16 }}>아직 답변이 없습니다. 첫 번째 답변을 작성해주세요.</div>
                )}
              </div>

              {/* 답변 작성 폼 */}
              <div style={{ background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:10, padding:18 }}>
                <h4 style={{ margin:"0 0 14px", fontSize:13, color:"#38bdf8", fontWeight:700 }}>✍️ 답변 작성</h4>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                  <div>
                    <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:4 }}>중분류 (기관 유형) *</label>
                    <select value={replyOrgCat} onChange={e => { setReplyOrgCat(e.target.value); setReplyOrgName(""); }}
                      style={{ ...inputStyle, width:"100%", background:"#0f172a" }}>
                      <option value="">선택하세요</option>
                      {Object.keys(ORG_HIERARCHY).map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:4 }}>소분류 (소속기관) *</label>
                    <select value={replyOrgName} onChange={e => setReplyOrgName(e.target.value)}
                      style={{ ...inputStyle, width:"100%", background:"#0f172a" }} disabled={!replyOrgCat}>
                      <option value="">선택하세요</option>
                      {replyOrgCat && ORG_HIERARCHY[replyOrgCat].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom:12 }}>
                  <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} rows={4}
                    placeholder="답변 내용을 작성해주세요."
                    style={{ ...inputStyle, width:"100%", boxSizing:"border-box", background:"#0f172a", resize:"vertical", lineHeight:1.6 }} />
                </div>
                <div style={{ display:"flex", justifyContent:"flex-end" }}>
                  <button onClick={submitReply} disabled={replySubmitting}
                    style={{ background: replySubmitting ? "#334155" : "#0ea5e9", color:"#fff", border:"none", borderRadius:6, padding:"8px 22px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    {replySubmitting ? "저장 중…" : "답변 등록"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {editing && (
        <EditModal task={editing} onSave={updateTask} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
