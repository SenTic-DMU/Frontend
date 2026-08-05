# 저장된 표현(BookmarksScreen) 실데이터 연동 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `BookmarksScreen`("저장된 표현" 화면)이 목업 데이터 대신 실제 `/api/scraps` 데이터를 보여주고, 각 항목에 "채팅대화에서 저장"/"음성대화에서 저장" 라벨을 표시하며, 탭하면 저장했던 대화의 그 말풍선으로 이동하게 만든다.

**Architecture:** 모든 변경은 `App.tsx` 한 파일 안에서 이루어진다(기존 코드베이스가 화면을 단일 파일에 함수 컴포넌트로 모아두는 구조를 그대로 따름). `App()`이 이미 들고 있는 `chatRooms`/`voiceRooms`를 `BookmarksScreen`에 내려주고, `BookmarksScreen`은 방마다 `GET /api/scraps?roomId=`를 병렬 호출해 합친다. 탭 시 이동은 `App()`에 새 state(`scrapNavTarget`)를 두고 `TextChatScreen`/`VoiceChatScreen`이 메시지 로딩 후 이 타겟과 매칭해 스크롤·하이라이트한다.

**Tech Stack:** React Native(Expo) + TypeScript + axios + AsyncStorage. 이 저장소에는 테스트 프레임워크가 없다(package.json에 jest 없음, `npm run typecheck`만 존재). 따라서 이 계획의 각 태스크는 "코드 작성 → `npm run typecheck` 통과 확인 → (해당 시) 수동 확인 체크리스트 → 커밋" 사이클을 따른다. 새 테스트 프레임워크 도입은 이번 작업 범위 밖이다.

## Global Constraints

- 백엔드 베이스 URL은 항상 리터럴 `"https://rundown-irrigate-majesty.ngrok-free.dev"`로 각 함수 내부에 직접 쓴다 (기존 코드 전체가 공유 상수 없이 이렇게 반복하고 있으므로 그 패턴을 따른다 — 이번 작업에서 임의로 리팩터링하지 않는다).
- 스크랩 `category` 값은 정확히 `"WORD"` / `"GRAMMAR"` / `"EXPRESSION"` 중 하나 (백엔드 확정 스펙).
- 모든 스크랩 API 호출에 `Authorization: Bearer {accessToken}` 헤더 필수, 대부분 기존 코드처럼 `"ngrok-skip-browser-warning": "true"`도 함께 보낸다.
- 새 UI 문구는 정확히 "채팅대화에서 저장" / "음성대화에서 저장" (사용자 지정 문구, 임의 변경 금지).
- 새 npm 패키지를 추가하지 않는다. 이미 import된 것만 사용한다 (`useRef`, `ActivityIndicator`, `axios`, `AsyncStorage` 모두 이미 최상단에 import되어 있음).
- 스타일은 주변 코드 관례를 따른다: 화면 내부 요소는 인라인 `style={{ ... }}` 객체, `BookmarksScreen` 전용 재사용 스타일만 기존 `bkStyles`(`App.tsx:4884`)에 추가한다.
- 각 태스크 끝에서 `npm run typecheck`가 0 에러로 통과해야 한다.

---

### Task 1: BookmarksScreen — 실제 스크랩 데이터 불러오기 (목업 제거)

**Files:**
- Modify: `App.tsx:253-260` (방 목록 fetch 트리거 조건에 `"bookmarks"` 추가)
- Modify: `App.tsx:383` (`BookmarksScreen`에 `chatRooms`/`voiceRooms` prop 전달)
- Modify: `App.tsx:3464-3802` (`BookmarksScreen` 함수: interface, state, fetch effect, `renderExpression`의 `translation`→`context`)
- Test: 없음 (테스트 프레임워크 없음). `npm run typecheck`로 대체.

**Interfaces:**
- Consumes: 없음 (최초 태스크).
- Produces: `BookmarksScreen`이 `chatRooms: any[]`, `voiceRooms: any[]` prop을 받는다. 내부 `SavedExpression` 타입에 `scrapId: number`, `context: string`, `roomType: "chat" | "voice"`, `feedbackId: number | null` 필드가 새로 생긴다 (Task 2~4가 이 필드들을 사용함).

- [ ] **Step 1: `App.tsx`의 방 목록 fetch 트리거에 `"bookmarks"` 추가**

`App.tsx:253-260`을 다음과 같이 바꾼다:

```tsx
    // ⭐️ 3. 조건에 "voiceRooms"·"bookmarks" 화면일 때도 실행되도록 추가합니다!
    if (
      screen === "chatRooms" ||
      screen === "voiceRooms" ||
      screen === "mode" ||
      screen === "bookmarks"
    ) {
      fetchMyRooms();
    }
  }, [screen]);
```

- [ ] **Step 2: `App.tsx`에서 `BookmarksScreen` 호출부에 `chatRooms`/`voiceRooms` 전달**

`App.tsx:383`의 다음 줄:

```tsx
      {screen === "bookmarks" && <BookmarksScreen go={go} />}
```

을 다음으로 바꾼다:

```tsx
      {screen === "bookmarks" && (
        <BookmarksScreen go={go} chatRooms={chatRooms} voiceRooms={voiceRooms} />
      )}
```

- [ ] **Step 3: `BookmarksScreen` 시그니처 + `SavedExpression` 타입 교체**

`App.tsx:3464-3477`의 다음 블록:

```tsx
function BookmarksScreen({ go }: { go: (screen: Screen) => void }) {
  type ViewMode = "by-category" | "by-room";
  type Category = "단어" | "문법" | "문장";

  interface SavedExpression {
    id: string;
    text: string;
    translation: string;
    category: Category;
    roomName: string;
    roomId: string;
    savedDate: string;
    source?: "ai" | "user";
  }
```

을 다음으로 바꾼다:

```tsx
function BookmarksScreen({
  go,
  chatRooms,
  voiceRooms,
}: {
  go: (screen: Screen) => void;
  chatRooms: any[];
  voiceRooms: any[];
}) {
  type ViewMode = "by-category" | "by-room";
  type Category = "단어" | "문법" | "문장";

  interface SavedExpression {
    id: string; // scrapId를 문자열로 (React key + 삭제 API 호출용)
    scrapId: number;
    text: string;
    context: string;
    category: Category;
    roomName: string;
    roomId: string;
    roomType: "chat" | "voice";
    savedDate: string;
    source: "ai" | "user";
    feedbackId: number | null;
  }
```

- [ ] **Step 4: 목업 배열을 실제 fetch 로직으로 교체**

`App.tsx`에서 (Step 3 반영 후 기준) 다음 블록 — `categoryConfig` 선언부터 목업 `expressions` 배열의 닫는 `]);`까지:

```tsx
  const categoryConfig: Record<
    Category,
    { color: string; bg: string; dot: string }
  > = {
    단어: { color: "#2563EB", bg: "#EFF6FF", dot: "#60A5FA" },
    문법: { color: "#7C3AED", bg: "#F5F3FF", dot: "#A78BFA" },
    문장: { color: "#16A34A", bg: "#F0FDF4", dot: "#4ADE80" },
  };

  const [viewMode, setViewMode] = useState<ViewMode>("by-category");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [expressions, setExpressions] = useState<SavedExpression[]>([
    {
      id: "1",
      text: "I'd like to order a coffee, please.",
      translation: "커피를 주문하고 싶습니다.",
      category: "문장",
      roomName: "카페에서 주문하기",
      roomId: "1",
      savedDate: "04/28",
    },
    {
      id: "2",
      text: "What's up?",
      translation: "안녕? / 어떻게 지내?",
      category: "단어",
      roomName: "영화 이야기",
      roomId: "2",
      savedDate: "04/28",
    },
    {
      id: "3",
      text: "Subject-verb agreement",
      translation: "주어-동사 일치",
      category: "문법",
      roomName: "비즈니스 미팅",
      roomId: "3",
      savedDate: "04/27",
    },
    {
      id: "4",
      text: "Could you please help me?",
      translation: "도와주실 수 있으신가요?",
      category: "문장",
      roomName: "카페에서 주문하기",
      roomId: "1",
      savedDate: "04/26",
    },
    {
      id: "5",
      text: "That sounds like a great plan!",
      translation: "정말 좋은 계획인 것 같아요!",
      category: "문장",
      roomName: "일상 대화",
      roomId: "4",
      savedDate: "04/29",
      source: "ai",
    },
    {
      id: "6",
      text: "I really appreciate your help.",
      translation: "도와주셔서 정말 감사해요.",
      category: "문장",
      roomName: "카페에서 주문하기",
      roomId: "1",
      savedDate: "04/25",
      source: "ai",
    },
  ]);
```

를 다음으로 바꾼다:

```tsx
  const categoryConfig: Record<
    Category,
    { color: string; bg: string; dot: string }
  > = {
    단어: { color: "#2563EB", bg: "#EFF6FF", dot: "#60A5FA" },
    문법: { color: "#7C3AED", bg: "#F5F3FF", dot: "#A78BFA" },
    문장: { color: "#16A34A", bg: "#F0FDF4", dot: "#4ADE80" },
  };

  const backendCategoryToKorean = (category: string): Category => {
    if (category === "WORD") return "단어";
    if (category === "GRAMMAR") return "문법";
    return "문장";
  };

  const [viewMode, setViewMode] = useState<ViewMode>("by-category");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [expressions, setExpressions] = useState<SavedExpression[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllScraps = async () => {
      setLoading(true);

      if (isTestMode) {
        setExpressions([]);
        setLoading(false);
        return;
      }

      const rooms = [
        ...chatRooms.map((r) => ({ ...r, roomType: "chat" as const })),
        ...voiceRooms.map((r) => ({ ...r, roomType: "voice" as const })),
      ];

      if (rooms.length === 0) {
        setExpressions([]);
        setLoading(false);
        return;
      }

      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        const API_URL = "https://rundown-irrigate-majesty.ngrok-free.dev";
        const headers = {
          Authorization: `Bearer ${accessToken}`,
          "ngrok-skip-browser-warning": "true",
        };

        const results = await Promise.all(
          rooms.map((room) =>
            axios
              .get(`${API_URL}/api/scraps?roomId=${room.id}`, { headers })
              .then((res) => {
                const scraps = res.data?.data || res.data || [];
                return scraps.map((scrap: any) => ({ scrap, room }));
              })
              .catch((error: any) => {
                console.error(
                  `🚨 방(${room.id}) 스크랩 조회 실패:`,
                  error.response?.data || error.message,
                );
                return [];
              }),
          ),
        );

        const mapped: SavedExpression[] = results
          .flat()
          .map(({ scrap, room }: any) => ({
            id: String(scrap.scrapId ?? scrap.id),
            scrapId: scrap.scrapId ?? scrap.id,
            text: scrap.expression,
            context: scrap.context || "",
            category: backendCategoryToKorean(scrap.category),
            roomName: room.title,
            roomId: String(room.id),
            roomType: room.roomType,
            savedDate: scrap.createdAt
              ? scrap.createdAt.slice(5, 10).replace("-", "/")
              : "-",
            source: scrap.feedbackId ? "user" : "ai",
            feedbackId: scrap.feedbackId ?? null,
          }));

        setExpressions(mapped);
      } catch (error: any) {
        console.error(
          "🚨 저장된 표현 불러오기 실패:",
          error.response?.data || error.message,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAllScraps();
  }, [chatRooms, voiceRooms]);
```

- [ ] **Step 5: `renderExpression`에서 `expr.translation` 참조를 `expr.context`로 교체**

`App.tsx`에서 (Step 3~4 반영 후) 다음 줄:

```tsx
            <Text style={bkStyles.exprText}>{expr.text}</Text>
            <Text style={bkStyles.exprTranslation}>{expr.translation}</Text>
```

을 다음으로 바꾼다 (context가 빈 문자열일 수 있으므로 있을 때만 렌더):

```tsx
            <Text style={bkStyles.exprText}>{expr.text}</Text>
            {expr.context ? (
              <Text style={bkStyles.exprTranslation}>{expr.context}</Text>
            ) : null}
```

- [ ] **Step 6: 로딩 중 / 빈 목록 상태 추가**

`App.tsx`에서 다음 줄(본문 `ScrollView` 시작):

```tsx
      <ScrollView
        style={{ backgroundColor: "#F9FAFB" }}
        contentContainerStyle={bkStyles.content}
      >
```

을 다음으로 바꾼다:

```tsx
      {loading ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 60,
          }}
        >
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : expressions.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 60,
          }}
        >
          <Text style={{ color: "#9CA3AF", fontSize: 13 }}>
            아직 저장된 표현이 없어요
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ backgroundColor: "#F9FAFB" }}
          contentContainerStyle={bkStyles.content}
        >
```

그리고 해당 `ScrollView`의 닫는 부분:

```tsx
        {/* 대화방 상세 */}
        {selectedRoom && (
          <View style={{ gap: 10 }}>
            {groupByRoom()[selectedRoom]?.map((e) => renderExpression(e))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
```

을 다음으로 바꾼다 (`</ScrollView>` 다음에 조건부 렌더링을 닫는 `)}` 추가):

```tsx
        {/* 대화방 상세 */}
        {selectedRoom && (
          <View style={{ gap: 10 }}>
            {groupByRoom()[selectedRoom]?.map((e) => renderExpression(e))}
          </View>
        )}
        </ScrollView>
      )}
    </View>
  );
}
```

- [ ] **Step 7: 타입체크**

Run: `npm run typecheck`
Expected: 에러 0개.

- [ ] **Step 8: 커밋**

```bash
git add App.tsx
git commit -m "저장된 표현 화면이 실제 스크랩 데이터를 방마다 조회해서 보여주도록 변경"
```

---

### Task 2: BookmarksScreen — "채팅대화에서 저장" / "음성대화에서 저장" 라벨

**Files:**
- Modify: `App.tsx` (`BookmarksScreen`의 `renderExpression` 끝부분)
- Modify: `App.tsx:4884` 근처 (`bkStyles`에 `exprSourceLabel` 추가)

**Interfaces:**
- Consumes: Task 1이 만든 `SavedExpression.roomType: "chat" | "voice"`.
- Produces: 없음 (화면 표시 전용, 이후 태스크가 의존하지 않음).

- [ ] **Step 1: `bkStyles`에 새 스타일 추가**

`App.tsx`의 `bkStyles` 정의에서 다음 블록:

```tsx
  exprSourceTag: {
    color: "#9CA3AF",
    fontSize: 10,
    marginTop: 6,
    alignSelf: "flex-end",
  },
```

바로 뒤에 추가:

```tsx
  exprSourceTag: {
    color: "#9CA3AF",
    fontSize: 10,
    marginTop: 6,
    alignSelf: "flex-end",
  },
  exprSourceLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    marginTop: 4,
  },
```

- [ ] **Step 2: `renderExpression`에 라벨 렌더링 추가**

`renderExpression` 안의 다음 블록:

```tsx
        {expr.source === "ai" && (
          <Text style={bkStyles.exprSourceTag}>AI 답변에서 저장됨</Text>
        )}
      </View>
    );
  };
```

을 다음으로 바꾼다:

```tsx
        {expr.source === "ai" && (
          <Text style={bkStyles.exprSourceTag}>AI 답변에서 저장됨</Text>
        )}
        <Text style={bkStyles.exprSourceLabel}>
          {expr.roomType === "voice" ? "음성대화에서 저장" : "채팅대화에서 저장"}
        </Text>
      </View>
    );
  };
```

- [ ] **Step 3: 타입체크**

Run: `npm run typecheck`
Expected: 에러 0개.

- [ ] **Step 4: 커밋**

```bash
git add App.tsx
git commit -m "저장된 표현 카드에 채팅/음성 저장 출처 라벨 표시"
```

---

### Task 3: BookmarksScreen — 삭제 버튼을 실제 DELETE API에 연결

**Files:**
- Modify: `App.tsx` (`BookmarksScreen`의 `deleteExpression`과 그 호출부)

**Interfaces:**
- Consumes: Task 1의 `SavedExpression.scrapId`.
- Produces: 없음.

- [ ] **Step 1: `deleteExpression`을 실제 API 호출로 교체**

다음 블록:

```tsx
  const deleteExpression = (id: string) => {
    Alert.alert(
      "표현 삭제",
      "이 표현을 정말 삭제하시겠습니까?\n(삭제 후 복구할 수 없습니다.)",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: () => {
            setExpressions((prev) => prev.filter((e) => e.id !== id));
          },
        },
      ],
    );
  };
```

을 다음으로 바꾼다:

```tsx
  const deleteExpression = (expr: SavedExpression) => {
    Alert.alert(
      "표현 삭제",
      "이 표현을 정말 삭제하시겠습니까?\n(삭제 후 복구할 수 없습니다.)",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              const accessToken = await AsyncStorage.getItem("accessToken");
              const API_URL =
                "https://rundown-irrigate-majesty.ngrok-free.dev";
              await axios.delete(`${API_URL}/api/scraps/${expr.scrapId}`, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "ngrok-skip-browser-warning": "true",
                },
              });
              setExpressions((prev) => prev.filter((e) => e.id !== expr.id));
            } catch (error: any) {
              console.error(
                "🚨 스크랩 삭제 실패:",
                error.response?.data || error.message,
              );
              Alert.alert("삭제 실패", "잠시 후 다시 시도해주세요.");
            }
          },
        },
      ],
    );
  };
```

- [ ] **Step 2: 호출부 수정**

다음 줄:

```tsx
          <Pressable
            onPress={() => deleteExpression(expr.id)}
            style={bkStyles.deleteBtn}
          >
```

을 다음으로 바꾼다:

```tsx
          <Pressable
            onPress={() => deleteExpression(expr)}
            style={bkStyles.deleteBtn}
          >
```

- [ ] **Step 3: 타입체크**

Run: `npm run typecheck`
Expected: 에러 0개.

- [ ] **Step 4: 커밋**

```bash
git add App.tsx
git commit -m "저장된 표현 삭제 버튼이 실제 DELETE /api/scraps를 호출하도록 연결"
```

---

### Task 4: 탭하면 해당 방으로 이동 — App.tsx 라우팅 + BookmarksScreen 카드 Pressable화

**Files:**
- Modify: `App.tsx` (`App()`의 state/handler/JSX, `BookmarksScreen` 시그니처 + `renderExpression`, `VoiceChatScreen`/`TextChatScreen` 시그니처)

**Interfaces:**
- Consumes: Task 1의 `SavedExpression` 필드들(`roomId`, `roomType`, `roomName`, `feedbackId`, `text`).
- Produces:
  - `App()`에 `scrapNavTarget: { feedbackId: number | null; expression: string } | null` state.
  - `onOpenScrap(expr: { roomId: string; roomType: "chat" | "voice"; roomName: string; feedbackId: number | null; text: string }): void` — `BookmarksScreen`에 전달.
  - `VoiceChatScreen`/`TextChatScreen`이 `scrapNavTarget?: { feedbackId: number | null; expression: string } | null`과 `onConsumeScrapNavTarget?: () => void` prop을 받는다 (Task 5·6이 내부 로직을 채움 — 이 태스크에서는 시그니처만 추가하고 아직 사용하지 않는다).

이 태스크가 끝나면 "저장된 표현 카드를 탭하면 해당 방의 채팅/음성 화면으로 이동한다"까지는 동작한다(말풍선 스크롤·하이라이트는 Task 5·6에서 추가).

- [ ] **Step 1: `App()`에 `scrapNavTarget` state와 `onOpenScrap` 핸들러 추가**

다음 블록:

```tsx
  const [selectedRoom, setSelectedRoom] = useState<PracticeRoom>(voiceRooms[0]);
  const [selectedMode, setSelectedMode] = useState<"voice" | "text">("voice");
  const [kakaoWebViewVisible, setKakaoWebViewVisible] = useState(false);
  const [kakaoLoggingIn, setKakaoLoggingIn] = useState(false);

  const go = (next: Screen) => setScreen(next);
```

을 다음으로 바꾼다:

```tsx
  const [selectedRoom, setSelectedRoom] = useState<PracticeRoom>(voiceRooms[0]);
  const [selectedMode, setSelectedMode] = useState<"voice" | "text">("voice");
  const [kakaoWebViewVisible, setKakaoWebViewVisible] = useState(false);
  const [kakaoLoggingIn, setKakaoLoggingIn] = useState(false);
  const [scrapNavTarget, setScrapNavTarget] = useState<{
    feedbackId: number | null;
    expression: string;
  } | null>(null);

  const go = (next: Screen) => setScreen(next);

  const onOpenScrap = (expr: {
    roomId: string;
    roomType: "chat" | "voice";
    roomName: string;
    feedbackId: number | null;
    text: string;
  }) => {
    const rooms = expr.roomType === "voice" ? voiceRooms : chatRooms;
    const room = rooms.find((r) => String(r.id) === expr.roomId) ?? {
      id: expr.roomId,
      title: expr.roomName,
      desc: "",
      level: "맞춤",
    };
    setSelectedRoom(room);
    setSelectedMode(expr.roomType === "voice" ? "voice" : "text");
    setScrapNavTarget({ feedbackId: expr.feedbackId, expression: expr.text });
    go(expr.roomType === "voice" ? "voiceChat" : "textChat");
  };
```

- [ ] **Step 2: `App()`의 JSX 렌더 호출부 업데이트**

다음 블록:

```tsx
      {screen === "voiceChat" && (
        <VoiceChatScreen room={selectedRoom} go={go} />
      )}
      {screen === "textChat" && <TextChatScreen room={selectedRoom} go={go} />}
      {screen === "mypage" && <MyPageScreen go={go} />}
      {screen === "settings" && <SettingsScreen go={go} />}
      {screen === "payment" && <PaymentScreen go={go} />}
      {screen === "bookmarks" && (
        <BookmarksScreen go={go} chatRooms={chatRooms} voiceRooms={voiceRooms} />
      )}
```

을 다음으로 바꾼다:

```tsx
      {screen === "voiceChat" && (
        <VoiceChatScreen
          room={selectedRoom}
          go={go}
          scrapNavTarget={scrapNavTarget}
          onConsumeScrapNavTarget={() => setScrapNavTarget(null)}
        />
      )}
      {screen === "textChat" && (
        <TextChatScreen
          room={selectedRoom}
          go={go}
          scrapNavTarget={scrapNavTarget}
          onConsumeScrapNavTarget={() => setScrapNavTarget(null)}
        />
      )}
      {screen === "mypage" && <MyPageScreen go={go} />}
      {screen === "settings" && <SettingsScreen go={go} />}
      {screen === "payment" && <PaymentScreen go={go} />}
      {screen === "bookmarks" && (
        <BookmarksScreen
          go={go}
          chatRooms={chatRooms}
          voiceRooms={voiceRooms}
          onOpenScrap={onOpenScrap}
        />
      )}
```

- [ ] **Step 3: `VoiceChatScreen` 시그니처에 새 prop 추가**

```tsx
export function VoiceChatScreen({ room, go }: { room: any; go: any }) {
```

을 다음으로 바꾼다:

```tsx
export function VoiceChatScreen({
  room,
  go,
  scrapNavTarget,
  onConsumeScrapNavTarget,
}: {
  room: any;
  go: any;
  scrapNavTarget?: { feedbackId: number | null; expression: string } | null;
  onConsumeScrapNavTarget?: () => void;
}) {
```

- [ ] **Step 4: `TextChatScreen` 시그니처에 새 prop 추가**

```tsx
export function TextChatScreen({
  room,
  go,
}: {
  room: { id: number; title: string };
  go: (screen: any) => void;
}) {
```

을 다음으로 바꾼다:

```tsx
export function TextChatScreen({
  room,
  go,
  scrapNavTarget,
  onConsumeScrapNavTarget,
}: {
  room: { id: number; title: string };
  go: (screen: any) => void;
  scrapNavTarget?: { feedbackId: number | null; expression: string } | null;
  onConsumeScrapNavTarget?: () => void;
}) {
```

- [ ] **Step 5: `BookmarksScreen` 시그니처에 `onOpenScrap` 추가**

```tsx
function BookmarksScreen({
  go,
  chatRooms,
  voiceRooms,
}: {
  go: (screen: Screen) => void;
  chatRooms: any[];
  voiceRooms: any[];
}) {
```

을 다음으로 바꾼다:

```tsx
function BookmarksScreen({
  go,
  chatRooms,
  voiceRooms,
  onOpenScrap,
}: {
  go: (screen: Screen) => void;
  chatRooms: any[];
  voiceRooms: any[];
  onOpenScrap: (expr: {
    roomId: string;
    roomType: "chat" | "voice";
    roomName: string;
    feedbackId: number | null;
    text: string;
  }) => void;
}) {
```

- [ ] **Step 6: `renderExpression`의 카드를 `View`에서 `Pressable`로 변경**

다음 블록:

```tsx
  const renderExpression = (expr: SavedExpression, showRoom = false) => {
    const config = categoryConfig[expr.category];
    return (
      <View key={expr.id} style={bkStyles.exprCard}>
```

을 다음으로 바꾼다:

```tsx
  const renderExpression = (expr: SavedExpression, showRoom = false) => {
    const config = categoryConfig[expr.category];
    return (
      <Pressable
        key={expr.id}
        style={bkStyles.exprCard}
        onPress={() =>
          onOpenScrap({
            roomId: expr.roomId,
            roomType: expr.roomType,
            roomName: expr.roomName,
            feedbackId: expr.feedbackId,
            text: expr.text,
          })
        }
      >
```

그리고 (Task 2에서 추가한) 닫는 태그:

```tsx
        <Text style={bkStyles.exprSourceLabel}>
          {expr.roomType === "voice" ? "음성대화에서 저장" : "채팅대화에서 저장"}
        </Text>
      </View>
    );
  };
```

을 다음으로 바꾼다:

```tsx
        <Text style={bkStyles.exprSourceLabel}>
          {expr.roomType === "voice" ? "음성대화에서 저장" : "채팅대화에서 저장"}
        </Text>
      </Pressable>
    );
  };
```

- [ ] **Step 7: 타입체크**

Run: `npm run typecheck`
Expected: 에러 0개. (삭제 버튼 `Pressable`이 카드 `Pressable` 안에 중첩되지만, React Native는 안쪽 `Pressable`이 터치를 먼저 가져가므로 삭제를 눌러도 `onOpenScrap`이 같이 호출되지 않는다 — Step 8에서 실제로 확인한다.)

- [ ] **Step 8: 수동 확인 (Expo 앱, 로그인 필요)**

- 저장된 표현 화면에서 카드를 탭하면 해당 방(채팅이면 채팅 화면, 음성이면 음성 화면)이 열리는지 확인.
- 카드의 🗑 삭제 버튼을 눌렀을 때 카드 이동 없이 삭제 확인 알럿만 뜨는지 확인 (중첩 Pressable 이벤트 버블링 확인).

- [ ] **Step 9: 커밋**

```bash
git add App.tsx
git commit -m "저장된 표현 카드를 탭하면 해당 대화방으로 이동하도록 연결"
```

---

### Task 5: TextChatScreen — 스크랩한 말풍선으로 스크롤·하이라이트

**Files:**
- Modify: `App.tsx` (`TextChatScreen` 내부: state/ref 추가, 매칭 로직, 스크롤 effect, JSX)

**Interfaces:**
- Consumes: Task 4의 `TextChatScreen` prop `scrapNavTarget`, `onConsumeScrapNavTarget`.
- Produces: 없음 (최종 사용자 동작).

- [ ] **Step 1: state/ref 추가**

```tsx
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]); // Message 타입 대체
  const [scrapedKeys, setScrapedKeys] = useState<Set<string>>(new Set());
```

을 다음으로 바꾼다:

```tsx
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]); // Message 타입 대체
  const [scrapedKeys, setScrapedKeys] = useState<Set<string>>(new Set());
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const bubbleYRef = useRef<Record<string, number>>({});
```

- [ ] **Step 2: 메시지 로딩 후 타겟 매칭 로직 추가**

```tsx
          setMessages(formattedHistory);
          setScrapedKeys(loadedScrapedKeys); // 화면에 스크랩 상태 일괄 적용!
        } else {
          requestInitialGreeting();
        }
```

을 다음으로 바꾼다:

```tsx
          setMessages(formattedHistory);
          setScrapedKeys(loadedScrapedKeys); // 화면에 스크랩 상태 일괄 적용!

          if (scrapNavTarget) {
            let targetId: string | null = null;
            if (scrapNavTarget.feedbackId) {
              targetId =
                formattedHistory.find(
                  (m: any) =>
                    m.speaker === "user" &&
                    m.feedback?.some(
                      (f: any) => f.id === scrapNavTarget.feedbackId,
                    ),
                )?.id ?? null;
            } else if (scrapNavTarget.expression) {
              targetId =
                formattedHistory.find(
                  (m: any) =>
                    m.speaker === "ai" &&
                    m.text === scrapNavTarget.expression,
                )?.id ?? null;
            }
            setHighlightedMessageId(targetId);
            onConsumeScrapNavTarget?.();
          }
        } else {
          requestInitialGreeting();
        }
```

- [ ] **Step 3: 스크롤 effect 추가**

```tsx
    if (room?.id) fetchChatHistory();
  }, [room?.id]);

  const send = async () => {
```

을 다음으로 바꾼다:

```tsx
    if (room?.id) fetchChatHistory();
  }, [room?.id]);

  useEffect(() => {
    if (!highlightedMessageId) return;
    const y = bubbleYRef.current[highlightedMessageId];
    if (y == null) return;
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(y - 40, 0),
        animated: true,
      });
    });
  }, [highlightedMessageId, messages]);

  const send = async () => {
```

- [ ] **Step 4: `ScrollView`에 ref, 말풍선에 `onLayout`과 하이라이트 스타일 추가**

```tsx
      <ScrollView
        style={{ flex: 1, backgroundColor: "#f5f5f5", paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingVertical: 20 }}
      >
        {messages.map((msg) => {
          const isUser = msg.speaker === "user";
          const aiScrapKey = `${msg.id}-ai`;
          const isAiScraped = scrapedKeys.has(aiScrapKey);

          return (
            <View
              key={msg.id}
              style={{
                marginBottom: 20,
                alignItems: isUser ? "flex-end" : "flex-start",
                width: "100%",
              }}
            >
              {/* 대화 말풍선 */}
              <View
                style={{
                  backgroundColor: isUser ? "#5C6BC0" : "#ffffff", // 내 메시지는 파란색, AI는 흰색
                  padding: 12,
                  borderRadius: 16,
                  borderBottomRightRadius: isUser ? 4 : 16,
                  borderBottomLeftRadius: isUser ? 16 : 4,
                  maxWidth: "80%",
                  elevation: 1, // 안드로이드 그림자
                }}
              >
                <Text style={{ color: isUser ? "#fff" : "#333", fontSize: 16 }}>
                  {msg.text}
                </Text>
              </View>
```

을 다음으로 바꾼다:

```tsx
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, backgroundColor: "#f5f5f5", paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingVertical: 20 }}
      >
        {messages.map((msg) => {
          const isUser = msg.speaker === "user";
          const aiScrapKey = `${msg.id}-ai`;
          const isAiScraped = scrapedKeys.has(aiScrapKey);
          const isHighlighted = msg.id === highlightedMessageId;

          return (
            <View
              key={msg.id}
              onLayout={(e) => {
                bubbleYRef.current[msg.id] = e.nativeEvent.layout.y;
              }}
              style={{
                marginBottom: 20,
                alignItems: isUser ? "flex-end" : "flex-start",
                width: "100%",
              }}
            >
              {/* 대화 말풍선 */}
              <View
                style={{
                  backgroundColor: isUser ? "#5C6BC0" : "#ffffff", // 내 메시지는 파란색, AI는 흰색
                  padding: 12,
                  borderRadius: 16,
                  borderBottomRightRadius: isUser ? 4 : 16,
                  borderBottomLeftRadius: isUser ? 16 : 4,
                  maxWidth: "80%",
                  elevation: 1, // 안드로이드 그림자
                  borderWidth: isHighlighted ? 2 : 0,
                  borderColor: "#FBBF24",
                }}
              >
                <Text style={{ color: isUser ? "#fff" : "#333", fontSize: 16 }}>
                  {msg.text}
                </Text>
              </View>
```

- [ ] **Step 5: 타입체크**

Run: `npm run typecheck`
Expected: 에러 0개.

- [ ] **Step 6: 수동 확인 (Expo 앱, 로그인 필요)**

- 채팅방에서 단어/문법/추천 문장 스크랩 → 저장된 표현 화면 → 그 카드를 탭 → 채팅 화면이 열리고 해당 사용자 말풍선까지 자동 스크롤 + 노란 테두리가 보이는지 확인.
- AI 메시지 스크랩도 동일하게 확인.

- [ ] **Step 7: 커밋**

```bash
git add App.tsx
git commit -m "채팅 화면이 저장된 표현에서 넘어온 말풍선으로 스크롤·하이라이트하도록 구현"
```

---

### Task 6: VoiceChatScreen — 스크랩한 말풍선으로 스크롤·하이라이트 + "기록" 탭 자동 진입

**Files:**
- Modify: `App.tsx` (`VoiceChatScreen` 내부: state/ref 추가, `tab` 초기값, 매칭 로직, 스크롤 effect, JSX)

**Interfaces:**
- Consumes: Task 4의 `VoiceChatScreen` prop `scrapNavTarget`, `onConsumeScrapNavTarget`.
- Produces: 없음 (최종 사용자 동작).

- [ ] **Step 1: state/ref 추가 + `tab` 초기값 변경**

```tsx
export function VoiceChatScreen({
  room,
  go,
  scrapNavTarget,
  onConsumeScrapNavTarget,
}: {
  room: any;
  go: any;
  scrapNavTarget?: { feedbackId: number | null; expression: string } | null;
  onConsumeScrapNavTarget?: () => void;
}) {
  const [inCall, setInCall] = useState(false);
  const [tab, setTab] = useState<"call" | "history">("call");
```

을 다음으로 바꾼다:

```tsx
export function VoiceChatScreen({
  room,
  go,
  scrapNavTarget,
  onConsumeScrapNavTarget,
}: {
  room: any;
  go: any;
  scrapNavTarget?: { feedbackId: number | null; expression: string } | null;
  onConsumeScrapNavTarget?: () => void;
}) {
  const [inCall, setInCall] = useState(false);
  const [tab, setTab] = useState<"call" | "history">(
    scrapNavTarget ? "history" : "call",
  );
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const historyScrollRef = useRef<ScrollView>(null);
  const bubbleYRef = useRef<Record<string, number>>({});
```

- [ ] **Step 2: 메시지 로딩 후 타겟 매칭 로직 추가**

```tsx
          setMessages(formattedHistory);
          setScrapedKeys(loadedScrapedKeys); // ⭐️ 스크랩 세팅

          const lastAiMsg = [...formattedHistory]
            .reverse()
            .find((m: any) => m.speaker === "ai");
          if (lastAiMsg) setLatestAiText(lastAiMsg.text);
```

을 다음으로 바꾼다:

```tsx
          setMessages(formattedHistory);
          setScrapedKeys(loadedScrapedKeys); // ⭐️ 스크랩 세팅

          if (scrapNavTarget) {
            let targetId: string | null = null;
            if (scrapNavTarget.feedbackId) {
              targetId =
                formattedHistory.find(
                  (m: any) =>
                    m.speaker === "user" &&
                    m.feedback?.some(
                      (f: any) => f.id === scrapNavTarget.feedbackId,
                    ),
                )?.id ?? null;
            } else if (scrapNavTarget.expression) {
              targetId =
                formattedHistory.find(
                  (m: any) =>
                    m.speaker === "ai" &&
                    m.text === scrapNavTarget.expression,
                )?.id ?? null;
            }
            setHighlightedMessageId(targetId);
            onConsumeScrapNavTarget?.();
          }

          const lastAiMsg = [...formattedHistory]
            .reverse()
            .find((m: any) => m.speaker === "ai");
          if (lastAiMsg) setLatestAiText(lastAiMsg.text);
```

- [ ] **Step 3: 스크롤 effect 추가**

```tsx
    if (room?.id) fetchHistoryOnly();
  }, [room?.id]);

  // ⭐️ 2. 사용자가 '시작' 버튼을 눌렀을 때만 실행되는 AI 인사말 호출 함수
  const handleStartCall = async () => {
```

을 다음으로 바꾼다:

```tsx
    if (room?.id) fetchHistoryOnly();
  }, [room?.id]);

  useEffect(() => {
    if (!highlightedMessageId) return;
    const y = bubbleYRef.current[highlightedMessageId];
    if (y == null) return;
    requestAnimationFrame(() => {
      historyScrollRef.current?.scrollTo({
        y: Math.max(y - 40, 0),
        animated: true,
      });
    });
  }, [highlightedMessageId, messages]);

  // ⭐️ 2. 사용자가 '시작' 버튼을 눌렀을 때만 실행되는 AI 인사말 호출 함수
  const handleStartCall = async () => {
```

- [ ] **Step 4: "기록" 탭 `ScrollView`에 ref, 말풍선에 `onLayout`과 하이라이트 스타일 추가**

```tsx
      {tab === "history" && (
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingVertical: 20 }}
        >
          {messages.map((msg, idx) => {
            const isUser = msg.speaker === "user";

            // ⭐️ 고유 키 생성 (백엔드 매칭과 동일하게)
            const msgId = msg.id || idx.toString();
            const aiScrapKey = `${msgId}-ai`;
            const isAiScraped = scrapedKeys.has(aiScrapKey);

            return (
              <View
                key={msgId}
                style={{
                  marginBottom: 20,
                  alignItems: isUser ? "flex-end" : "flex-start",
                  width: "100%",
                }}
              >
                {/* 대화 말풍선 */}
                <View
                  style={{
                    backgroundColor: isUser ? "#5C6BC0" : "#ffffff",
                    padding: 12,
                    borderRadius: 16,
                    borderBottomRightRadius: isUser ? 4 : 16,
                    borderBottomLeftRadius: isUser ? 16 : 4,
                    maxWidth: "80%",
                    elevation: 1,
                  }}
                >
                  <Text
                    style={{ color: isUser ? "#fff" : "#333", fontSize: 16 }}
                  >
                    {msg.text}
                  </Text>
                </View>
```

을 다음으로 바꾼다:

```tsx
      {tab === "history" && (
        <ScrollView
          ref={historyScrollRef}
          style={{ flex: 1, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingVertical: 20 }}
        >
          {messages.map((msg, idx) => {
            const isUser = msg.speaker === "user";

            // ⭐️ 고유 키 생성 (백엔드 매칭과 동일하게)
            const msgId = msg.id || idx.toString();
            const aiScrapKey = `${msgId}-ai`;
            const isAiScraped = scrapedKeys.has(aiScrapKey);
            const isHighlighted = msgId === highlightedMessageId;

            return (
              <View
                key={msgId}
                onLayout={(e) => {
                  bubbleYRef.current[msgId] = e.nativeEvent.layout.y;
                }}
                style={{
                  marginBottom: 20,
                  alignItems: isUser ? "flex-end" : "flex-start",
                  width: "100%",
                }}
              >
                {/* 대화 말풍선 */}
                <View
                  style={{
                    backgroundColor: isUser ? "#5C6BC0" : "#ffffff",
                    padding: 12,
                    borderRadius: 16,
                    borderBottomRightRadius: isUser ? 4 : 16,
                    borderBottomLeftRadius: isUser ? 16 : 4,
                    maxWidth: "80%",
                    elevation: 1,
                    borderWidth: isHighlighted ? 2 : 0,
                    borderColor: "#FBBF24",
                  }}
                >
                  <Text
                    style={{ color: isUser ? "#fff" : "#333", fontSize: 16 }}
                  >
                    {msg.text}
                  </Text>
                </View>
```

- [ ] **Step 5: 타입체크**

Run: `npm run typecheck`
Expected: 에러 0개.

- [ ] **Step 6: 수동 확인 (Expo 앱, 로그인 필요)**

- 음성방에서 단어/문법/추천 문장 또는 AI 메시지를 스크랩 → 저장된 표현 화면 → 그 카드를 탭 → 음성 화면이 "기록" 탭으로 바로 열리고 해당 말풍선까지 스크롤 + 노란 테두리가 보이는지 확인.
- 일반적으로 음성방에 들어갈 때(스크랩 카드를 거치지 않고)는 여전히 "통화" 탭이 기본으로 열리는지 확인(회귀 없는지).

- [ ] **Step 7: 커밋**

```bash
git add App.tsx
git commit -m "음성 화면이 저장된 표현에서 넘어온 말풍선으로 기록 탭 진입 + 스크롤·하이라이트하도록 구현"
```

---

### Task 7: 전체 회귀 확인

**Files:** 없음 (검증 전용).

**Interfaces:**
- Consumes: Task 1~6의 모든 변경.
- Produces: 없음.

- [ ] **Step 1: 전체 타입체크**

Run: `npm run typecheck`
Expected: 에러 0개.

- [ ] **Step 2: 수동 회귀 체크리스트 (Expo 앱, 실제 로그인 계정 필요)**

- [ ] 저장된 표현 화면 진입 시 로딩 스피너 → 실제 카드 목록(또는 빈 상태 문구) 순서로 보인다.
- [ ] 카테고리별 보기(단어/문법/문장)와 대화방별 보기 각각에서 카운트와 목록이 실제 데이터와 일치한다.
- [ ] 각 카드에 "채팅대화에서 저장" 또는 "음성대화에서 저장"이 작은 회색 글씨로 보인다.
- [ ] AI 스크랩 카드는 "AI 답변에서 저장됨" + 출처 라벨이 함께 보인다.
- [ ] 카드를 탭하면 올바른 방(채팅/음성)으로 이동하고, 저장했던 말풍선이 자동 스크롤·하이라이트된다.
- [ ] 삭제 버튼이 실제로 스크랩을 지우고, 다시 저장된 표현 화면에 들어가도 삭제된 항목이 안 보인다(서버 반영 확인).
- [ ] 채팅/음성 화면에서 새로 스크랩하는 기존 기능(저장 토글, 노란불 표시)이 이번 변경으로 깨지지 않았다.

이 태스크는 커밋할 코드 변경이 없으므로 커밋 단계는 없다. 체크리스트에서 문제가 발견되면 해당 태스크로 돌아가 수정 후 새 커밋을 만든다.
