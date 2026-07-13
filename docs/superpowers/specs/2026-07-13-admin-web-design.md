# AI 영어 회화 학습 앱 - 관리자 웹 설계

- 날짜: 2026-07-13
- 배경: 졸업 작품으로 개발 중인 대화형 AI 영어 학습 애플리케이션(SenTic)의 관리자 페이지
- 관련 프로젝트: 현재 `Frontend` 레포는 Expo/React Native 사용자 앱이며, 백엔드는 별도 서버(ngrok으로 로컬 노출)로 분리되어 있음. 관리자 웹은 **완전히 별도의 신규 웹 프로젝트**로 만든다.

## 1. 목표 및 범위

관리자가 아래 4가지 업무를 처리할 수 있는 웹 관리자 페이지를 만든다.

1. 회원관리: 목록 검색, 상세 조회, 상태(Active/Inactive) 토글
2. 공지사항: 목록(고정 뱃지 포함), 작성/수정/삭제
3. FAQ: 목록, 작성/수정/삭제, 순서 변경(위/아래 이동)
4. 결제 내역(구독관리): 전체 데이터 테이블, 상태별 필터링, 회원별 상세 조회

### 범위 밖 (이번 설계 제외)
- 관리자 권한 세분화(역할/퍼미션 체계) — 단일 관리자 계정만 가정
- 실시간 알림, 통계/대시보드 화면
- 백엔드 실제 구현 — 프론트에서 가정한 API 계약만 정의하고, 실제 백엔드가 정해지면 `features/*/api.ts`만 교체

## 2. 기술 스택

- Vite + React 19 + TypeScript
- Tailwind CSS + shadcn/ui (기존 Frontend 앱과 톤 통일; `default_shadcn_theme.css` 참고 가능)
- TanStack Query: 서버 상태 캐싱, 낙관적 업데이트, 캐시 무효화
- React Router v6: 페이지 라우팅
- axios 기반 API 클라이언트 (interceptor로 Authorization 헤더 자동 첨부 + 401 처리)

선정 이유: 기존 Frontend 프로젝트가 Vite+Tailwind+shadcn 기반이었기 때문에 스타일 자산을 재사용하기 쉽고, "캐시 무효화"가 핵심 요구사항이므로 TanStack Query가 표준적으로 잘 맞는다.

## 3. 라우팅 구조

```
/login                          (공개)
/                                (ProtectedRoute + AdminLayout)
  └ index                       → /members 로 리다이렉트
  └ members                     회원 목록
  └ members/:memberId           회원 상세 (상태 토글 + 해당 회원 결제내역 섹션)
  └ notices                     공지사항 목록
  └ notices/new                 공지 작성
  └ notices/:noticeId/edit      공지 수정
  └ faq                         FAQ 목록 (+ 순서 이동)
  └ faq/new                     FAQ 작성
  └ faq/:faqId/edit             FAQ 수정
  └ payments                    결제 내역 (상태 필터, ?memberId= 로 특정 회원 필터 지원)
```

- 로그인 안 된 상태에서 `/` 이하 경로 접근 시 `ProtectedRoute`가 `/login`으로 리다이렉트한다.
- 공지/FAQ는 작성과 수정이 동일한 폼 페이지 컴포넌트를 재사용하고, URL 파라미터(`noticeId`/`faqId`) 존재 여부로 생성/수정 모드를 구분한다.

## 4. 디렉토리 구조

기능(도메인) 단위로 api/hooks/types를 묶는 feature-folder 방식을 사용하고, 여러 도메인에서 재사용되는 UI는 `components/common`으로 분리한다.

```
src/
  main.tsx
  App.tsx                 (라우터 마운트, QueryClientProvider)
  routes/router.tsx        (라우트 정의)
  lib/
    apiClient.ts           (axios 인스턴스 + 토큰 interceptor)
    queryClient.ts          (TanStack QueryClient 인스턴스)
  features/
    auth/        api.ts, AuthContext.tsx
    members/     api.ts, hooks.ts, types.ts
    notices/     api.ts, hooks.ts, types.ts
    faq/         api.ts, hooks.ts, types.ts
    payments/    api.ts, hooks.ts, types.ts
  components/
    layout/      AdminLayout.tsx, Sidebar.tsx, ProtectedRoute.tsx
    common/      DataTable.tsx, Pagination.tsx, ConfirmDialog.tsx,
                 StatusBadge.tsx, SearchInput.tsx, PageHeader.tsx
    ui/          (shadcn 기본 컴포넌트: button, input, table, dialog, switch, select, badge ...)
  pages/
    login/LoginPage.tsx
    members/MembersListPage.tsx, MemberDetailPage.tsx
    notices/NoticesListPage.tsx, NoticeFormPage.tsx
    faq/FaqListPage.tsx, FaqFormPage.tsx
    payments/PaymentsListPage.tsx
```

`DataTable` / `Pagination` / `ConfirmDialog` / `StatusBadge`는 회원·공지·FAQ·결제 4개 도메인에서 모두 재사용된다.

## 5. 가정한 API 계약

백엔드 스펙이 아직 없으므로, 사용자가 제시한 필드(email, nickname, is_pinned, order_num, 결제 상태 등)를 기반으로 REST 계약을 가정한다. 실제 백엔드 확정 시 각 도메인의 `api.ts`만 수정하면 되도록 API 호출은 전부 이 계층에 격리한다.

```
POST   /admin/auth/login                 { email, password } → { accessToken, admin }

GET    /admin/members?keyword=&page=     → { content: Member[], totalElements, totalPages }
GET    /admin/members/:id                → MemberDetail
PATCH  /admin/members/:id/status         { status: 'ACTIVE'|'INACTIVE' } → Member
GET    /admin/members/:id/payments       → Payment[]

GET    /admin/notices?page=              → { content: Notice[], totalElements, totalPages }
GET    /admin/notices/:id                → Notice
POST   /admin/notices                    { title, content, isPinned } → Notice
PUT    /admin/notices/:id                { title, content, isPinned } → Notice
DELETE /admin/notices/:id

GET    /admin/faqs                       → Faq[]  (orderNum 오름차순 정렬되어 내려옴)
POST   /admin/faqs                       { question, answer } → Faq
PUT    /admin/faqs/:id                   { question, answer } → Faq
DELETE /admin/faqs/:id
PATCH  /admin/faqs/:id/order             { direction: 'UP'|'DOWN' } → Faq[] (swap된 항목들만 반환)

GET    /admin/payments?status=&memberId=&page= → { content: Payment[], totalElements, totalPages }
```

타입:
- `Member`: `{ id, email, nickname, createdAt, status: 'ACTIVE' | 'INACTIVE' }`
- `Notice`: `{ id, title, content, isPinned, createdAt, updatedAt }`
- `Faq`: `{ id, question, answer, orderNum }`
- `Payment`: `{ id, memberId, memberEmail, memberNickname, amount, planName, status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED', paidAt }`

## 6. 기능별 상세 설계

### 6.1 회원관리 (상태 관리 핵심 페이지)
- 검색 키워드와 페이지 번호를 URL 쿼리스트링(`?keyword=&page=`)과 동기화 (새로고침/뒤로가기에도 유지)
- `useMembers(keyword, page)` → `useQuery(['members', keyword, page], fetchMembers)`
- 상태 토글은 `useUpdateMemberStatus` mutation 하나로 목록/상세 양쪽에서 공용 사용:
  - `onMutate`: 관련 쿼리 취소 후 캐시를 낙관적으로 갱신, 이전 값 스냅샷 저장
  - `onError`: 스냅샷으로 롤백
  - `onSettled`: 관련 쿼리 invalidate로 서버 값과 재동기화
- 회원 상세 페이지는 `useMember(id)`와 해당 회원의 결제 내역 섹션(`useMemberPayments(id)`)을 함께 렌더링

### 6.2 공지사항
- 목록에서 `isPinned === true` 항목은 상단 고정 정렬 + "고정" 뱃지 표시, 이후 최신순 정렬
- 작성/수정은 `NoticeFormPage` 하나를 재사용하며 `noticeId` 파라미터 유무로 생성/수정 모드 분기
- 삭제는 `ConfirmDialog`로 확인 후 실행, 성공 시 목록 쿼리 invalidate

### 6.3 FAQ
- 각 행에 위/아래 이동 버튼 → `PATCH /admin/faqs/:id/order`
- 낙관적으로 로컬 배열에서 인접 두 항목을 swap해서 즉시 반영, 서버 응답으로 확정하고 실패 시 롤백
- 작성/수정은 공지사항과 동일한 패턴(`FaqFormPage` 재사용)

### 6.4 결제 내역
- 상태 필터(PENDING/SUCCESS/FAILED/CANCELLED)는 서버 쿼리 파라미터로 전달하고 `useSearchParams`로 URL과 동기화
- 회원 상세 페이지의 결제 내역 섹션은 `/admin/members/:id/payments`를 직접 호출하거나, 전체 내역 페이지로 이동할 때는 `/payments?memberId=` 형태로 링크

## 7. 인증
- `LoginPage`: 이메일/비밀번호 입력 → `POST /admin/auth/login` → 응답받은 `accessToken`을 localStorage에 저장, `AuthContext`에 반영
- `ProtectedRoute`: 토큰이 없으면 `<Navigate to="/login" />`
- axios interceptor에서 401 응답 수신 시 토큰 제거 후 로그인 페이지로 강제 이동

## 8. 향후 고려사항 (이번 구현 이후)
- 관리자 다중 계정 및 역할별 권한
- 실시간 알림, 통계/대시보드
- 실제 백엔드 API 확정에 따른 `features/*/api.ts` 갱신
