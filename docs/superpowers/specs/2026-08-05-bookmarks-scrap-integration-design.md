# 저장된 표현(BookmarksScreen) 실데이터 연동 설계

날짜: 2026-08-05
작성자: Claude (chanyoung 브랜치 작업)

## 배경 / 문제

`BookmarksScreen`("저장된 표현" 화면, `App.tsx`)은 현재 하드코딩된 목업 배열(`expressions` 초기값)만 보여주고 있고, 실제로 채팅/음성 화면에서 저장한 스크랩(`POST /api/scraps`)과 연결되어 있지 않다. 최근 `VoiceChatScreen`/`TextChatScreen`에는 스크랩 저장·취소(POST/DELETE) 로직이 붙었지만, 이걸 한곳에 모아 보여주는 `BookmarksScreen`은 그대로 방치돼 있다.

사용자 요청:
1. 저장된 표현의 각 블록에 "채팅대화에서 저장" / "음성대화에서 저장"을 작은 회색 글씨로 표시.
2. 단어/문법/표현 카테고리별, 혹은 대화방별로 스크랩된 블록을 누르면 해당 스크랩을 저장했던 대화 내역(그 말풍선)으로 바로 이동.

두 요구사항 모두 실데이터 연동 없이는 의미가 없으므로, 이번 작업 범위에 실데이터 연동을 포함한다(사용자 승인 완료).

## 알려진 백엔드 계약 (백엔드 팀원 제공 스펙, 2026-08-05)

- `POST /api/scraps` — body: `{ feedbackId, roomId, expression, context, category }`.
  - 피드백에서 스크랩: `feedbackId` 채움, `roomId: null`.
  - AI 메시지에서 스크랩: `roomId` 채움, `feedbackId: null`.
  - `category`는 `WORD` / `GRAMMAR` / `EXPRESSION` 중 하나.
  - 응답: `data = { scrapId, feedbackId, roomId, expression, context, category, createdAt }`.
- `DELETE /api/scraps/{scrapId}` — 본인 스크랩만 삭제 가능. `VoiceChatScreen`에 이미 연결됨(취소 토글).
- `GET /api/scraps` — 전체 조회.
- `GET /api/scraps?category=WORD|GRAMMAR|EXPRESSION` — 카테고리별 조회.
- `GET /api/scraps?roomId={id}` — 대화방별 조회. **피드백 스크랩 + AI 메시지 스크랩 둘 다 포함**(백엔드가 feedbackId→room을 내부적으로 조인해줌).
- 모든 요청에 `Authorization: Bearer {accessToken}` 필수.

**중요한 함정:** `POST` 시 저장되는 원본 `roomId`는 피드백 스크랩의 경우 `null`이다. 즉 `GET /api/scraps`(전체) 또는 `GET /api/scraps?category=`로 받은 항목의 `roomId` 필드는 피드백 스크랩에 한해 `null`로 남아있을 가능성이 높다(문서에 GET 응답 스키마가 별도로 명시되지 않았고, POST 응답이 저장된 원본 값을 그대로 echo하는 것으로 보아 동일하게 취급). 반면 `GET /api/scraps?roomId=X`는 결과 자체가 이미 해당 방으로 필터링되어 나오므로, 응답의 `roomId` 값과 무관하게 **어느 방인지는 요청에 사용한 `X`로 알 수 있다.**

→ 그래서 "어느 방(채팅/음성)에서 저장했는지" 라벨과 "탭하면 그 방으로 이동"을 구현하려면, 전체 조회(`GET /api/scraps`)가 아니라 **방마다 `GET /api/scraps?roomId=X`를 호출해서 합치는 방식**을 써야 한다 (아래 1번). 전체 조회·카테고리별 조회 엔드포인트는 이번 기능에는 쓰지 않지만 향후 다른 용도(예: 전체 개수 뱃지)에 쓸 수 있어 존재는 기록해둔다.

## 설계

### 1. 스크랩 목록 조회 (BookmarksScreen)

`App.tsx`는 `screen === "mode" | "chatRooms" | "voiceRooms"`일 때 이미 `chatRooms`, `voiceRooms`를 불러온다. 이 조건에 `"bookmarks"`를 추가해 북마크 화면 진입 시에도 방 목록이 준비되도록 한다.

`BookmarksScreen`은 `chatRooms`, `voiceRooms`를 새 prop으로 받는다. 마운트 시(및 두 목록이 갱신될 때) 다음을 수행:

```
const rooms = [
  ...chatRooms.map(r => ({ ...r, roomType: 'chat' as const })),
  ...voiceRooms.map(r => ({ ...r, roomType: 'voice' as const })),
];

const results = await Promise.all(
  rooms.map(r => axios.get(`${API_URL}/api/scraps?roomId=${r.id}`, { headers })
    .then(res => (res.data?.data || res.data || []).map((s: any) => ({ ...s, room: r })))
    .catch(() => [])) // 방 하나 실패해도 나머지는 보여준다
);
const merged = results.flat();
```

- 로딩 중에는 `ActivityIndicator` 표시.
- `isTestMode`일 때는 API 호출 없이 빈 목록으로 표시(테스트 모드용 방은 서버 스크랩이 없으므로).
- 방이 하나도 없으면(신규 유저) 호출 자체를 생략.

### 2. 데이터 매핑

백엔드 스크랩 레코드 → 화면 표시용 `SavedExpression`:

| 필드 | 값 |
|---|---|
| `id` (scrapId) | `scrap.scrapId ?? scrap.id` — 삭제 API 호출용 |
| `text` | `scrap.expression` |
| `context` | `scrap.context` (있을 때만 보조 텍스트로 표시; 기존의 가짜 "translation" 자리를 대체) |
| `category` | `WORD→단어`, `GRAMMAR→문법`, `EXPRESSION→문장` |
| `roomId`, `roomName` | 매칭된 room 객체에서 |
| `roomType` | `'chat' \| 'voice'` (어느 목록에서 방을 찾았는지) — **신규, 라벨 표시용** |
| `savedDate` | `scrap.createdAt`을 `MM/DD`로 포맷, 없으면 `-` |
| `source` | `scrap.feedbackId ? 'user' : 'ai'` |
| `feedbackId` | `scrap.feedbackId ?? null` — 네비게이션 매칭용 |

카테고리 필터(단어/문법/문장) 및 방별 그룹 보기는 기존 UI 로직(`groupByRoom`, `selectedCategory` 등) 그대로 재사용.

### 3. "채팅대화에서 저장" / "음성대화에서 저장" 라벨

`renderExpression` 내부, 기존 "AI 답변에서 저장됨" 태그 옆(또는 아래)에 작은 회색 텍스트 추가:

```
<Text style={bkStyles.exprSourceLabel}>
  {expr.roomType === 'voice' ? '음성대화에서 저장' : '채팅대화에서 저장'}
</Text>
```

스타일: `fontSize: 11, color: '#9CA3AF'` (기존 `aiScrapText`와 동일 톤).

### 4. 탭하면 해당 말풍선으로 이동

**네비게이션 연결 (`App.tsx`)**

- 신규 state: `scrapNavTarget: { feedbackId?: number | null; expression?: string } | null`.
- `BookmarksScreen`에 `onOpenScrap` prop 전달:

```
const onOpenScrap = (expr: SavedExpression) => {
  const rooms = expr.roomType === 'voice' ? voiceRooms : chatRooms;
  const room = rooms.find(r => String(r.id) === String(expr.roomId))
    ?? { id: expr.roomId, title: expr.roomName, desc: '', level: '맞춤' };
  setSelectedRoom(room);
  setSelectedMode(expr.roomType);
  setScrapNavTarget({ feedbackId: expr.feedbackId, expression: expr.text });
  go(expr.roomType === 'voice' ? 'voiceChat' : 'textChat');
};
```

- `scrapNavTarget`을 `VoiceChatScreen`/`TextChatScreen`에 prop으로 전달하고, 소비 후 지우는 콜백(`onConsumeScrapNavTarget`)도 함께 전달.

**채팅/음성 화면 쪽 (`TextChatScreen`, `VoiceChatScreen`)**

메시지 히스토리(`formattedHistory`)를 세팅한 직후, `scrapNavTarget`이 있으면 매칭:

```
let targetId: string | null = null;
if (scrapNavTarget?.feedbackId) {
  targetId = formattedHistory.find(m =>
    m.speaker === 'user' && m.feedback?.some((f: any) => f.id === scrapNavTarget.feedbackId)
  )?.id ?? null;
} else if (scrapNavTarget?.expression) {
  targetId = formattedHistory.find(m =>
    m.speaker === 'ai' && m.text === scrapNavTarget.expression
  )?.id ?? null;
}
if (targetId) setHighlightedMessageId(targetId);
onConsumeScrapNavTarget?.();
```

- 각 말풍선 wrapper `View`에 `onLayout`으로 y좌표를 `useRef<Record<string, number>>({})`에 저장.
- `highlightedMessageId`가 바뀌면 `requestAnimationFrame`으로 해당 y좌표까지 `ScrollView.scrollTo({ y, animated: true })`.
- 하이라이트된 말풍선은 노란 테두리(`borderWidth: 2, borderColor: '#FBBF24'`)로 표시, 화면에 머무는 동안 유지(자동 해제 없음).
- AI 문장 매칭은 텍스트 완전 일치 기준이라 같은 문장이 여러 번 나오면 첫 매치로 이동한다(허용 가능한 한계로 명시).

**VoiceChatScreen 전용**

- `tab` 초기값을 `scrapNavTarget ? "history" : "call"`로 설정해 "기록" 탭으로 바로 진입.

### 5. 삭제 버튼 실제 연동

`BookmarksScreen`의 `deleteExpression`이 확인 알럿 후 로컬 배열만 지우던 것을, `DELETE /api/scraps/{scrapId}` 호출 성공 시에만 로컬에서 제거하도록 변경. 실패 시 에러 알럿.

## 범위 밖 (Out of scope)

- `GET /api/scraps`(전체 조회) / `?category=`(카테고리별 조회) 활용 — 피드백 스크랩의 `roomId`가 null로 나올 가능성이 높아 방 정보 해석에 못 쓴다고 판단, 방별 조회(`?roomId=`) 방식으로 통일.
- AI 스크랩의 정밀한 `messageId` 매칭(텍스트 동일 문장이 여러 개인 경우 구분) — 백엔드가 스크랩 저장 시 `messageId`를 받지 않으므로 불가능. 텍스트 일치로 근사.
- `TextChatScreen`의 스크랩 취소(DELETE) 완성 — 별도 진행 중인 작업(`스크랩 취소 미완성` 커밋)이라 이번 스펙에서 손대지 않음. 단, `BookmarksScreen`의 삭제 버튼은 이번에 DELETE API로 연결한다(4번 항목, `BookmarksScreen`에 한정).

## 테스트 / 검증 계획

- 실제 백엔드(ngrok) + 로그인 세션이 필요해 자동화 테스트는 어려움. 코드 작성 후:
  - TypeScript 컴파일 확인 (`tsc --noEmit` 또는 기존 빌드 스크립트).
  - 가능하면 Expo 프리뷰로 육안 확인(로그인 필요 — 사용자 계정으로 수동 확인 요청 가능성 있음).
