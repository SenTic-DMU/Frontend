# 학습데이터 화면 확장 설계 (캘린더 내비게이션 + 통계/분석 카드 8종)

날짜: 2026-09-16
작성자: Claude (chanyoung 브랜치 작업)

## 배경 / 문제

`LearningDataScreen`(App.tsx, "학습 데이터" 화면, [App.tsx:7719](../../../App.tsx#L7719))에는 현재 다음만 있다:

- 이번 주 누적 학습시간 / 일 평균 / 연속 학습일 ([App.tsx:7963-8001](../../../App.tsx#L7963)) — `GET /api/users/study-stats` 실데이터
- 주간 학습 시간 바 차트 ([App.tsx:8003-8085](../../../App.tsx#L8003))
- 학습 레벨 설정 카드
- 퀴즈 정답률 카드 ([App.tsx:8298-8339](../../../App.tsx#L8298)) — **더미 데이터**("🚧 더미 데이터 — 백엔드 연동 전까지 임시 표시")
- 이번 주 리그 카드 ([App.tsx:8341](../../../App.tsx#L8341)) — 실데이터

날짜를 선택해서 과거 데이터를 보는 기능(캘린더)이 전혀 없고, 약점 분석·자주 쓰는 표현·성장 추이·월말 총평·음성/채팅 비율 같은 항목은 코드에 전혀 존재하지 않는다(관련 타입/API 0건).

기존에 메시지 단위로 이미 쌓이고 있는 데이터:
- `FeedbackData`(단어/문법/표현 오류 3분류, [App.tsx:69-78](../../../App.tsx#L69)) — `wordErrors` / `grammarErrors` / `expressionErrors`, 메시지마다 존재
- `roomType: "voice" | "chat"` ([App.tsx:2160](../../../App.tsx#L2160)) — 음성방/채팅방 구분
- 퀴즈 결과는 `POST /api/quiz/{quizId}/submit`으로 이미 서버에 제출·저장됨 ([App.tsx:789](../../../App.tsx#L789))

이 데이터들을 기반으로 백엔드에 새 집계/분석 API를 요청하면 대부분의 항목을 만들 수 있다. 단, "자주 쓰는 표현"(사용자가 실제로 사용한 표현 분석)은 기존 오류 교정 데이터와 무관해서 완전히 새로운 분석이 필요하다.

## 사용자 요청

학습데이터 화면에 다음 8개 항목을 추가한다:

1. 이번 주 누적/일 평균/연속 학습일 (기존, 캘린더 연동만 추가)
2. 퀴즈 정답률 (전체 누적)
3. 피드백 비율 (전체 누적) — 오류 없이 넘어간 발화 비율
4. 나의 약점 TOP3 — 자주 틀리는 단어/문법/표현 패턴
5. 실력 성장 그래프 — 퀴즈 정답률 + 피드백 비율의 변화 추이
6. AI 월말 종합평가 — 캘린더를 펼쳤을 때 해당 달 아래에 삽입
7. 자주 쓰는 표현 분석
8. 음성/채팅 학습 비율

화면 최상단에 오늘 날짜를 표시하고, 누르면 달력이 펼쳐지며, 날짜를 선택하면 그 날짜 기준으로 대시보드가 이동한다.

## 날짜 스코프 규칙

캘린더에서 다른 날짜를 선택했을 때 각 항목이 어떻게 반응하는지:

| 스코프 | 항목 | 동작 |
|---|---|---|
| 주 단위 재계산 | 1, 4, 7, 8 | 선택한 날짜가 속한 주(週) 기준으로 값이 바뀜 |
| 전체 누적, 고정 | 2, 3 | 가입 이후 전체 기준, 캘린더 선택과 무관하게 항상 동일 |
| 최근 8주 고정 | 5 | 오늘 기준 최근 8주 추이, 캘린더 선택과 무관 |
| 월 단위, 캘린더 펼침에만 노출 | 6 | 캘린더에 펼쳐진 달 아래에 그 달의 총평 표시. 이번 달(진행 중)은 총평 없음 |

## 백엔드에 요청할 API 목록 (신규/변경)

> 이 섹션을 그대로 백엔드팀에 전달하면 됨. 괄호 안은 프론트 화면에서의 용도.

### 1. `GET /api/users/study-stats` — 파라미터 추가 (기존 API 변경)

현재는 파라미터 없이 항상 "이번 주"만 반환. `date` 쿼리 파라미터를 추가해서 그 날짜가 속한 주의 통계를 반환해야 함.

```
GET /api/users/study-stats?date=YYYY-MM-DD   (생략 시 오늘 기준 이번 주)

response.data: {
  weekly: [{ day: "MON"|"TUE"|..., minute: number, date?: string }],  // 7개
  totalMinutes: number,
  avgMinutes: number,
  continuousDays: number
}
```

### 2. `GET /api/users/quiz-stats` — 신규 (퀴즈 정답률 카드)

```
response.data: {
  totalAttempted: number,   // 전체 누적 응시 문제 수
  totalCorrect: number,     // 전체 누적 정답 수
  accuracy: number          // 0~100, totalCorrect/totalAttempted * 100
}
```

### 3. `GET /api/users/feedback-stats` — 신규 (피드백 비율 카드)

"피드백 비율" = 오류(단어/문법/표현 오류 중 하나라도) 없이 넘어간 발화의 비율, 전체 누적.

```
response.data: {
  totalUtterances: number,   // 전체 누적 사용자 발화 수
  cleanUtterances: number,   // wordErrors/grammarErrors/expressionErrors 모두 빈 발화 수
  cleanRatio: number         // 0~100
}
```

### 4. `GET /api/users/weak-points` — 신규 (약점 TOP3 카드)

```
GET /api/users/weak-points?date=YYYY-MM-DD   (해당 날짜가 속한 주 기준 집계)

response.data: {
  words:       [{ text: string, count: number }],   // wordErrors 집계, 최대 3개
  grammar:     [{ text: string, count: number }],    // grammarErrors 집계, 최대 3개
  expressions: [{ text: string, count: number }]      // expressionErrors 집계, 최대 3개
}
```
집계 소스는 기존 `FeedbackData.wordErrors` / `grammarErrors` / `expressionErrors`(현재 JSON 문자열 배열)를 해당 주간 범위로 필터링해 항목별 빈도로 카운트.

### 5. `GET /api/users/growth-trend` — 신규 (성장 그래프)

```
response.data: [
  { weekStart: "YYYY-MM-DD", quizAccuracy: number, feedbackCleanRatio: number }
]  // 최근 8주, 오래된 주 → 최신 주 순
```

### 6. `GET /api/users/monthly-review` — 신규 (AI 월말 종합평가)

```
GET /api/users/monthly-review?month=YYYY-MM

response.data: {
  month: "YYYY-MM",
  summary: string | null,   // LLM이 그 달 학습 데이터를 바탕으로 생성한 총평. 아직 생성 전이면 null
  generatedAt: string | null
}
```
백엔드가 매월 1일 배치로 지난 달 데이터를 바탕으로 LLM 호출해 생성·저장. 이번 달(진행 중)은 프론트에서 이 API를 호출하지 않음(카드 자체를 숨김).

### 7. `GET /api/users/frequent-expressions` — 신규, 별도 분석 파이프라인 필요 (자주 쓰는 표현)

```
GET /api/users/frequent-expressions?date=YYYY-MM-DD   (해당 날짜가 속한 주 기준)

response.data: [
  { expression: string, count: number }
]  // 최대 5개
```
**주의**: 기존 오류 교정 필드(`wordErrors` 등)와 무관하게, 사용자가 실제로 말하거나 입력한 문장(`Message.text`, speaker="user") 자체에서 자주 등장하는 표현/패턴을 추출해야 함. 오류 교정용 필드가 없으므로 새로운 텍스트 분석(NLP) 로직이 필요 — 8개 항목 중 백엔드 작업량이 가장 큼.

### 8. `GET /api/users/mode-ratio` — 신규 (음성/채팅 학습 비율)

```
GET /api/users/mode-ratio?date=YYYY-MM-DD   (해당 날짜가 속한 주 기준)

response.data: {
  voiceMinutes: number,
  chatMinutes: number
}
```
집계 소스는 기존 `roomType: "voice" | "chat"` 필드 기준으로 해당 주간 대화 시간 합산.

## 프론트 설계

### 캘린더 UI

- 신규 의존성: `react-native-calendars`
- 화면 최상단에 오늘 날짜 텍스트(예: "2026년 9월 16일") 표시, 누르면 월간 캘린더가 펼쳐짐(아코디언 또는 모달)
- 캘린더가 펼쳐진 상태에서, 표시 중인 달 바로 아래에 6번(AI 월말평가) 카드를 삽입. 달을 넘기면(이전/다음 달) 그 달에 해당하는 총평으로 다시 요청
- 날짜를 탭하면: 캘린더 접힘 + 선택한 날짜를 `selectedDate` 상태로 저장 + 주 단위 스코프 항목(1, 4, 7, 8)이 그 날짜 기준으로 재요청

### 컴포넌트 구조

`LearningDataScreen` 내부에 카드별로 작은 로컬 컴포넌트를 추가해서(기존 파일 분리 없이, `App.tsx` 안에 이미 있는 `LeagueScreen` 등과 같은 패턴으로 톱레벨 함수로 분리) 렌더 함수가 과도하게 길어지는 것을 막는다: `WeakPointsCard`, `GrowthTrendChart`, `MonthlyReviewCard`, `FrequentExpressionsCard`, `ModeRatioCard`. 각 컴포넌트는 자기 데이터 로딩(useEffect + axios)을 갖고, `selectedDate` prop만 받는다.

### 차트 종류

- 5번(성장 그래프): 듀얼 라인 차트 (X축: 주차, Y축: 0~100%, 정답률/피드백 비율 두 선)
- 8번(음성/채팅 비율): 도넛 차트 2분할
- 2, 3번: 기존 진행바(progress bar) 스타일 재사용
- 4, 7번: 랭킹 리스트/칩 형태 (차트 아님)

## 범위 밖

- 퀴즈 정답 → 리그 포인트 적립 연동 (별도 진행 중, 이번 변경과 무관)
- 기존 "이번 주 리그" 카드 로직 변경 (이미 실데이터 연동 완료된 별개 항목)
- `frequent-expressions`의 NLP 분석 알고리즘 자체 설계 (백엔드 내부 구현이며, 이 문서는 API 계약까지만 정의)
- 과거 주/달 데이터가 없는 경우(가입 전 등)의 빈 상태 UI 세부 디자인 — 카드별로 "데이터 없음" 기본 문구만 적용, 상세 디자인은 구현 단계에서 결정
