# 학습데이터 "이번 주 리그" 카드 실데이터 연동 설계

날짜: 2026-09-16
작성자: Claude (chanyoung 브랜치 작업)

## 배경 / 문제

`LearningDataScreen`(App.tsx, "학습 데이터" 화면)의 "이번 주 리그" 요약 카드는 현재 완전히 하드코딩된 더미값(`골드 리그`, `5위 / 20명`, `68 PT`)을 보여준다([App.tsx:8144-8201](../../../App.tsx#L8144)).

리그 자체는 이미 로컬(AsyncStorage) 기준으로 실제 동작 중이다:
- `LeagueState`(`tier`, `weekStartISO`, `myPoints`, `pendingResult`)는 `getLeagueState`/`saveLeagueState`/`ensureLeagueWeekFresh`로 관리된다([App.tsx:190-427](../../../App.tsx#L190)).
- 대화(음성/채팅) 중 AI 응답을 받을 때마다 `awardLeaguePoints(2)`가 4곳에서 호출되어 `myPoints`가 실제로 쌓인다.
- `LeagueScreen`(리그 탭)은 나(`state.myPoints`)와 더미 봇 19명(`LEAGUE_BOTS`, `computeLeagueBotScore`로 점수 계산)을 합쳐 점수순 정렬 후 내 순위를 구해서 보여준다([App.tsx:8515-8533](../../../App.tsx#L8515)).

퀴즈 정답 시 포인트를 적립하는 부분(`QUIZ_CORRECT_POINT` 상수)은 이번 작업 범위가 아니다 — 사용자 확인 결과 별도로 처리 중이므로 건드리지 않는다.

## 사용자 요청

학습데이터 화면의 "이번 주 리그" 카드를 더미값이 아니라, `LeagueScreen`과 동일한 로직으로 계산한 실제 티어/순위/포인트로 표시한다.

## 설계

### 데이터 소스

`LearningDataScreen`에 리그 상태를 위한 `useState<LeagueState | null>`을 추가하고, 컴포넌트 마운트 시 및 앱이 포그라운드로 돌아올 때(`AppState` "active") `ensureLeagueWeekFresh()`를 호출해 갱신한다. 이는 `LeagueScreen`의 `load`/`useEffect` 패턴([App.tsx:8479-8490](../../../App.tsx#L8479))과 동일하게 맞춘다.

### 순위 계산

`LeagueScreen`과 동일하게, 봇 19명의 점수를 `computeLeagueBotScore(bot.id, state.weekStartISO, state.tier, daysElapsed)`로 계산하고 내 점수(`state.myPoints`)와 합쳐 내림차순 정렬해 내 순위(index+1)를 구한다. 중복 로직이지만 두 화면이 서로 다른 컴포넌트이고 로직이 짧아(정렬 몇 줄) 별도 훅으로 추출하지 않고 그대로 복사해도 무방하다.

### 카드 표시 내용 변경

- "골드 리그" (하드코딩) → `${LEAGUE_TIER_META[state.tier].label} 리그`
- "5위 / 20명" (하드코딩) → `${myRank}위 / 20명`
- "68 PT" (하드코딩) → `${state.myPoints} PT`
- 힌트 문구("승급 컷라인 턱걸이 중이에요...")는 실제 순위 기준으로 분기:
  - `myRank <= 5`: "승급권에 있어요! 이 순위를 지켜내면 승급이에요."
  - `myRank >= 11`: "강등권이에요. 조금만 더 힘내볼까요?"
  - 그 외: 힌트 박스를 아예 숨긴다 (안전권에는 굳이 보여줄 문구가 없음).

### 로딩 상태

`state`가 아직 `null`(로딩 중)일 때는 카드 자체를 렌더링하지 않는다 (다른 카드들은 이미 자체 로딩 상태를 갖고 있으므로 리그 카드만 조건부로 늦게 나타나도 무방).

## 범위 밖

- 퀴즈 정답 → 리그 포인트 적립 연동 (사용자가 별도 처리 확인)
- "퀴즈 정답률" 카드의 실데이터 연동 (요청 범위 아님)
- `LeagueScreen`과의 로직 공통화/리팩터링 (이번 변경으로 유발된 범위가 아니면 손대지 않음)
