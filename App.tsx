import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Screen =
  | "login"
  | "signup"
  | "findAccount"
  | "mode"
  | "voiceRooms"
  | "chatRooms"
  | "situation"
  | "voiceChat"
  | "textChat"
  | "mypage"
  | "settings"
  | "payment"
  | "bookmarks"
  | "notice"
  | "faq";

type Message = {
  id: string;
  speaker: "user" | "ai";
  text: string;
  time: string;
  feedback?: string[];
};

type PracticeRoom = {
  id: string;
  title: string;
  desc: string;
  level?: string;
};

type UserInfo = {
  loginId: string;
  nickname: string;
  email: string;
};

type LevelId = "초급" | "중급" | "고급";

type LevelOption = {
  id: LevelId;
  eng: string;
  desc: string;
  detail: string[];
  color: string;
  bg: string;
  border: string;
  dot: string;
};

const primary = "#4F46E5";
const darkPrimary = "#4338CA";
const softBg = "#F5F5F7";
const border = "#E5E7EB";
const apiBaseUrl = process.env.EXPO_PUBLIC_BASE_URL ?? "";
const signupPath = process.env.EXPO_PUBLIC_SIGNUP_PATH ?? "/api/auth/signup";
const loginPath = process.env.EXPO_PUBLIC_LOGIN_PATH ?? "/api/auth/login";

function apiUrl(path: string) {
  if (!apiBaseUrl) {
    return "";
  }
  return `${apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function getNestedString(value: unknown, keys: string[]) {
  let current = value;
  for (const key of keys) {
    if (!current || typeof current !== "object" || !(key in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

const voiceRooms = [
  {
    id: "cafe",
    title: "카페에서 주문하기",
    desc: "바리스타와 자연스럽게 말하기",
    level: "초급",
  },
  {
    id: "airport",
    title: "공항 체크인",
    desc: "탑승 수속과 수하물 대화",
    level: "중급",
  },
  {
    id: "meeting",
    title: "팀 미팅 참여",
    desc: "의견 말하기와 질문하기",
    level: "고급",
  },
];

const chatRooms = [
  { id: "friend", title: "친구와 스몰톡", desc: "일상적인 표현을 편하게 연습" },
  {
    id: "travel",
    title: "여행 계획 세우기",
    desc: "일정, 예약, 추천 표현 익히기",
  },
  { id: "work", title: "업무 메시지", desc: "짧고 공손한 비즈니스 채팅" },
];

const levelOptions: LevelOption[] = [
  {
    id: "초급",
    eng: "Beginner",
    desc: "기초 단어/문장 구사 가능",
    detail: ["짧고 쉬운 문장", "천천히 대화", "모르는 단어 설명"],
    color: "#047857",
    bg: "#ECFDF5",
    border: "#34D399",
    dot: "#34D399",
  },
  {
    id: "중급",
    eng: "Intermediate",
    desc: "일상 대화 가능",
    detail: ["일반 속도로 대화", "일상 표현 학습", "다양한 주제 토론"],
    color: "#B45309",
    bg: "#FFFBEB",
    border: "#F59E0B",
    dot: "#F59E0B",
  },
  {
    id: "고급",
    eng: "Advanced",
    desc: "자유롭게 대화 가능",
    detail: ["빠른 속도 대화", "관용어/슬랭 사용", "복잡한 문장 구사"],
    color: "#4338CA",
    bg: "#EEF2FF",
    border: "#6366F1",
    dot: "#6366F1",
  },
];

const studyData = [
  { id: "mon", day: "Mon", minutes: 45, date: "04/07" },
  { id: "tue", day: "Tue", minutes: 60, date: "04/08" },
  { id: "wed", day: "Wed", minutes: 30, date: "04/09" },
  { id: "thu", day: "Thu", minutes: 75, date: "04/10" },
  { id: "fri", day: "Fri", minutes: 50, date: "04/11" },
  { id: "sat", day: "Sat", minutes: 90, date: "04/12" },
  { id: "sun", day: "Sun", minutes: 65, date: "04/13" },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [selectedRoom, setSelectedRoom] = useState<PracticeRoom>(voiceRooms[0]);
  const [selectedMode, setSelectedMode] = useState<"voice" | "text">("voice");
  const [userInfo, setUserInfo] = useState<UserInfo>({
    loginId: "",
    nickname: "영어마스터",
    email: "user@example.com",
  });

  const go = (next: Screen) => setScreen(next);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {screen === "login" && (
        <LoginScreen go={go} onAuthenticated={setUserInfo} />
      )}
      {screen === "signup" && (
        <SimpleFormScreen
          title="회원가입"
          subtitle="SenTic 계정을 만들고 학습을 시작하세요."
          go={go}
          onAuthenticated={setUserInfo}
        />
      )}
      {screen === "findAccount" && (
        <SimpleFormScreen
          title="계정 찾기"
          subtitle="가입한 이메일로 아이디와 비밀번호 안내를 받을 수 있어요."
          go={go}
        />
      )}
      {screen === "mode" && <ModeScreen go={go} />}
      {screen === "voiceRooms" && (
        <RoomListScreen
          title="음성 대화"
          rooms={voiceRooms}
          go={go}
          onPick={(room) => {
            setSelectedRoom(room);
            setSelectedMode("voice");
            go("situation");
          }}
        />
      )}
      {screen === "chatRooms" && (
        <RoomListScreen
          title="채팅 대화"
          rooms={chatRooms}
          go={go}
          onPick={(room) => {
            setSelectedRoom({ ...room, level: "맞춤" });
            setSelectedMode("text");
            go("situation");
          }}
        />
      )}
      {screen === "situation" && (
        <SituationScreen mode={selectedMode} room={selectedRoom} go={go} />
      )}
      {screen === "voiceChat" && (
        <VoiceChatScreen room={selectedRoom} go={go} />
      )}
      {screen === "textChat" && <TextChatScreen room={selectedRoom} go={go} />}
      {screen === "mypage" && <MyPageScreen go={go} userInfo={userInfo} />}
      {screen === "settings" && <InfoScreen title="설정" go={go} />}
      {screen === "payment" && <InfoScreen title="프리미엄" go={go} />}
      {screen === "bookmarks" && <InfoScreen title="저장한 표현" go={go} />}
      {screen === "notice" && <InfoScreen title="공지사항" go={go} />}
      {screen === "faq" && <InfoScreen title="FAQ" go={go} />}
    </SafeAreaView>
  );
}

function LoginScreen({
  go,
  onAuthenticated,
}: {
  go: (screen: Screen) => void;
  onAuthenticated: (userInfo: UserInfo) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("입력 확인", "아이디와 비밀번호를 입력해주세요.");
      return;
    }

    const url = apiUrl(loginPath);
    if (!url) {
      Alert.alert(
        "설정 확인",
        ".env에 EXPO_PUBLIC_BASE_URL을 먼저 설정해주세요.",
      );
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          loginId: username.trim(),
          password,
        }),
      });

      const responseText = await response.text();
      let responseBody: unknown = responseText;
      try {
        responseBody = responseText ? JSON.parse(responseText) : null;
      } catch {
        responseBody = responseText;
      }

      if (!response.ok) {
        const message =
          typeof responseBody === "object" &&
          responseBody &&
          "message" in responseBody
            ? String((responseBody as { message?: unknown }).message)
            : responseText || "로그인에 실패했어요.";
        Alert.alert("로그인 실패", message);
        return;
      }

      const loginId = username.trim();
      onAuthenticated({
        loginId,
        nickname:
          getNestedString(responseBody, ["data", "nickname"]) ??
          getNestedString(responseBody, ["data", "user", "nickname"]) ??
          loginId,
        email:
          getNestedString(responseBody, ["data", "email"]) ??
          getNestedString(responseBody, ["data", "user", "email"]) ??
          "",
      });
      go("mode");
    } catch {
      Alert.alert(
        "연결 실패",
        "백엔드 서버 주소, ngrok 상태, CORS 설정을 확인해주세요.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.loginContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandBlock}>
          <Text style={styles.logo}>SenTic</Text>
          <Text style={styles.muted}>AI 영어 소통 학습 파트너</Text>
        </View>

        <View style={styles.form}>
          <Label text="아이디" />
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="아이디 입력"
            style={styles.input}
            autoCapitalize="none"
          />

          <Label text="비밀번호" />
          <View style={styles.passwordRow}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호 입력"
              secureTextEntry={!showPassword}
              style={[styles.input, styles.passwordInput]}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword((value) => !value)}
            >
              <Text style={styles.iconText}>
                {showPassword ? "숨김" : "보기"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => go("findAccount")}
            style={styles.alignRight}
          >
            <Text style={styles.linkText}>아이디 / 비밀번호 찾기</Text>
          </Pressable>

          <PrimaryButton
            label={loading ? "처리 중..." : "로그인"}
            onPress={submitLogin}
            disabled={loading}
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>소셜 계정으로 시작</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <Pressable
              style={[styles.socialButton, styles.kakao]}
              onPress={() => go("mode")}
            >
              <Text style={styles.socialText}>카카오</Text>
            </Pressable>
            <Pressable style={styles.socialButton} onPress={() => go("mode")}>
              <Text style={styles.socialText}>Google</Text>
            </Pressable>
          </View>

          <View style={styles.centerRow}>
            <Text style={styles.muted}>처음 오셨나요? </Text>
            <Pressable onPress={() => go("signup")}>
              <Text style={styles.linkText}>회원가입</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
function ModeScreen({ go }: { go: (screen: Screen) => void }) {
  const weekly = [33, 42, 27, 36, 48, 24, 60];

  return (
    <View style={styles.screenSoft}>
      <Header title="SenTic" go={go} actions />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.caption}>안녕하세요, 민지님</Text>
            <Text style={styles.h2}>오늘도 영어 공부해요!</Text>
          </View>
          <View style={styles.streak}>
            <Text style={styles.streakText}>불꽃 5일 연속</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>학습 모드</Text>
        <ModeCard
          icon="🎙"
          title="음성 대화"
          desc="AI와 실시간 영어 회화 연습"
          color={primary}
          onPress={() => go("voiceRooms")}
        />
        <ModeCard
          icon="💬"
          title="채팅 대화"
          desc="텍스트로 편하게 영어 채팅"
          color="#16A34A"
          onPress={() => go("chatRooms")}
        />

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>이번 주 학습</Text>
            <Pressable onPress={() => go("mypage")}>
              <Text style={styles.linkText}>상세보기</Text>
            </Pressable>
          </View>
          <View style={styles.chart}>
            {weekly.map((minute, index) => (
              <View key={index} style={styles.barWrap}>
                <Text
                  style={[
                    styles.barMinute,
                    index === weekly.length - 1 && styles.primaryText,
                  ]}
                >
                  {minute}분
                </Text>
                <View
                  style={[
                    styles.bar,
                    { height: minute * 1.4 },
                    index === weekly.length - 1 && styles.activeBar,
                  ]}
                />
                <Text
                  style={[
                    styles.barDay,
                    index === weekly.length - 1 && styles.primaryText,
                  ]}
                >
                  {["월", "화", "수", "목", "금", "토", "일"][index]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <Stat label="총 대화" value="24회" />
          <Stat label="총 학습시간" value="8.5h" />
          <Stat label="저장 표현" value="42개" />
        </View>
      </ScrollView>
    </View>
  );
}

function RoomListScreen({
  title,
  rooms,
  go,
  onPick,
}: {
  title: string;
  rooms: PracticeRoom[];
  go: (screen: Screen) => void;
  onPick: (room: PracticeRoom) => void;
}) {
  return (
    <View style={styles.screenSoft}>
      <Header title={title} go={go} backTo="mode" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h2}>상황을 선택하세요</Text>
        <Text style={styles.mutedBlock}>
          원하는 대화 주제를 고르면 난이도와 역할을 확인한 뒤 연습을 시작할 수
          있어요.
        </Text>
        {rooms.map((room) => (
          <Pressable
            key={room.id}
            style={styles.roomCard}
            onPress={() => onPick(room)}
          >
            <View style={styles.roomIcon}>
              <Text style={styles.roomIconText}>
                {title.includes("음성") ? "🎙" : "💬"}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>{room.title}</Text>
              <Text style={styles.mutedSmall}>{room.desc}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function SituationScreen({
  mode,
  room,
  go,
}: {
  mode: "voice" | "text";
  room: { title: string; desc: string; level?: string };
  go: (screen: Screen) => void;
}) {
  return (
    <View style={styles.screenSoft}>
      <Header
        title="상황 설정"
        go={go}
        backTo={mode === "voice" ? "voiceRooms" : "chatRooms"}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroIcon}>{mode === "voice" ? "🎙" : "💬"}</Text>
          <Text style={styles.heroTitle}>{room.title}</Text>
          <Text style={styles.heroDesc}>{room.desc}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>오늘의 목표</Text>
          <Checklist text="첫 인사와 요청을 자연스럽게 말하기" />
          <Checklist text="상대의 질문에 짧게 답하기" />
          <Checklist text="AI 피드백으로 더 나은 표현 저장하기" />
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>설정</Text>
          <PillRow
            items={[
              room.level ?? "맞춤",
              "피드백 ON",
              mode === "voice" ? "자막 ON" : "자동 피드백",
            ]}
          />
        </View>
        <PrimaryButton
          label="연습 시작"
          onPress={() => go(mode === "voice" ? "voiceChat" : "textChat")}
        />
      </ScrollView>
    </View>
  );
}

function VoiceChatScreen({
  room,
  go,
}: {
  room: { title: string };
  go: (screen: Screen) => void;
}) {
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [feedbackOn, setFeedbackOn] = useState(true);
  const [tab, setTab] = useState<"call" | "history" | "feedback">("call");

  const history = useMemo<Message[]>(
    () => [
      {
        id: "1",
        speaker: "ai",
        text: "Hello! How can I help you today?",
        time: "10:30",
      },
      {
        id: "2",
        speaker: "user",
        text: "I want to order a coffee, please.",
        time: "10:31",
        feedback: ["더 자연스럽게: I'd like to order a coffee, please."],
      },
      {
        id: "3",
        speaker: "ai",
        text: "Sure! What size would you like?",
        time: "10:31",
      },
    ],
    [],
  );

  return (
    <View style={styles.screen}>
      <Header title={room.title} go={go} backTo="voiceRooms" />
      <TabBar
        active={tab}
        setActive={setTab}
        labels={{ call: "통화", history: "대화내역", feedback: "피드백" }}
      />
      {tab === "call" && (
        <View style={styles.callBody}>
          <View style={[styles.avatarLarge, inCall && styles.avatarActive]}>
            <Text style={styles.avatarEmoji}>🤖</Text>
          </View>
          <Text style={styles.h2}>AI 파트너</Text>
          <Text style={styles.muted}>
            {inCall ? "통화 중입니다" : "통화를 시작해 보세요"}
          </Text>
          {inCall && (
            <View style={styles.subtitleBox}>
              <Text style={styles.caption}>AI 파트너</Text>
              <Text style={styles.subtitleText}>
                Hello! How can I help you today?
              </Text>
            </View>
          )}
          <View style={styles.controlRow}>
            {inCall && (
              <RoundButton
                label={muted ? "마이크끔" : "마이크"}
                onPress={() => setMuted((v) => !v)}
              />
            )}
            {inCall && (
              <RoundButton
                label={speakerOff ? "스피커끔" : "스피커"}
                onPress={() => setSpeakerOff((v) => !v)}
              />
            )}
            <Pressable
              style={[styles.callButton, inCall && styles.endCallButton]}
              onPress={() => setInCall((v) => !v)}
            >
              <Text style={styles.callButtonText}>
                {inCall ? "종료" : "시작"}
              </Text>
            </Pressable>
          </View>
          <Pressable
            style={[
              styles.feedbackToggle,
              !feedbackOn && styles.feedbackToggleOff,
            ]}
            onPress={() => setFeedbackOn((v) => !v)}
          >
            <Text
              style={[
                styles.feedbackToggleText,
                !feedbackOn && styles.grayText,
              ]}
            >
              피드백 {feedbackOn ? "ON" : "OFF"}
            </Text>
          </Pressable>
        </View>
      )}
      {tab === "history" && <MessageList messages={history} />}
      {tab === "feedback" && (
        <FeedbackList messages={history} enabled={feedbackOn} />
      )}
    </View>
  );
}

function TextChatScreen({
  room,
  go,
}: {
  room: { title: string };
  go: (screen: Screen) => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", speaker: "ai", text: "Hey! What's up?", time: "10:30" },
    {
      id: "2",
      speaker: "user",
      text: "I'm good. What about you?",
      time: "10:31",
      feedback: ["더 자연스럽게: I'm doing well, thanks! How about you?"],
    },
    {
      id: "3",
      speaker: "ai",
      text: "I'm doing great! Wanna grab some coffee later?",
      time: "10:31",
    },
  ]);

  const send = () => {
    const text = input.trim();
    if (!text) return;

    // 1. 내가 보낸 메시지 데이터 세팅
    const userMessage: Message = {
      id: Date.now().toString(),
      speaker: "user",
      text,
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      // 영어 교육 앱의 디테일! 추천 표현 로직 아주 좋습니다 👍
      feedback: [`추천 표현: ${text.replace("I want to", "I'd like to")}`],
    };

    // 2. 일단 내 메시지만 화면에 먼저 즉시 띄우고 입력창 비우기
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // 3. 1.5초(1500ms) 뒤에 AI가 대답하는 척하기 (setTimeout)
    setTimeout(() => {
      const aiMessage: Message = {
        id: `${Date.now()}-ai`,
        speaker: "ai",
        text: "That sounds good! Tell me more.", // 나중에 Express 서버랑 연결할 때 실제 AI 대답으로 바뀔 부분!
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      // 이전 메시지들(내 채팅 포함)에 AI 메시지를 스윽 추가합니다.
      setMessages((prev) => [...prev, aiMessage]);
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <Header title={room.title} go={go} backTo="chatRooms" />
      <MessageList messages={messages} />
      <View style={styles.composer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="메시지를 입력하세요"
          style={styles.composerInput}
        />
        <Pressable
          style={[styles.sendButton, !input.trim() && styles.disabled]}
          onPress={send}
        >
          <Text style={styles.sendText}>전송</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function SimpleFormScreen({
  title,
  subtitle,
  go,
  onAuthenticated,
}: {
  title: string;
  subtitle: string;
  go: (screen: Screen) => void;
  onAuthenticated?: (userInfo: UserInfo) => void;
}) {
  const isSignup = title === "회원가입";
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submitSignup = async () => {
    if (
      !email.trim() ||
      !password.trim() ||
      (isSignup && (!username.trim() || !nickname.trim()))
    ) {
      Alert.alert("입력 확인", "필수 정보를 모두 입력해주세요.");
      return;
    }

    if (!isSignup) {
      Alert.alert("안내", "계정 찾기 API는 아직 연결되지 않았어요.");
      return;
    }

    const url = apiUrl(signupPath);
    if (!url) {
      Alert.alert(
        "설정 확인",
        ".env에 EXPO_PUBLIC_BASE_URL을 먼저 설정해주세요.",
      );
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          loginId: username.trim(),
          nickname: nickname.trim(),
          email: email.trim(),
          password,
        }),
      });

      const responseText = await response.text();
      let responseBody: unknown = responseText;
      try {
        responseBody = responseText ? JSON.parse(responseText) : null;
      } catch {
        responseBody = responseText;
      }

      if (!response.ok) {
        const message =
          typeof responseBody === "object" &&
          responseBody &&
          "message" in responseBody
            ? String((responseBody as { message?: unknown }).message)
            : responseText || "회원가입에 실패했어요.";
        Alert.alert("회원가입 실패", message);
        return;
      }

      Alert.alert("회원가입 완료", "계정이 생성되었습니다.");
      onAuthenticated?.({
        loginId: username.trim(),
        nickname: nickname.trim(),
        email: email.trim(),
      });
      go("mode");
    } catch {
      Alert.alert(
        "연결 실패",
        "백엔드 서버 주소, 같은 와이파이, CORS 설정을 확인해주세요.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screenSoft}>
      <Header title={title} go={go} backTo="login" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.h1}>{title}</Text>
        <Text style={styles.mutedBlock}>{subtitle}</Text>
        {isSignup && (
          <>
            <Label text="아이디" />
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="아이디 입력"
              style={styles.input}
              autoCapitalize="none"
            />
            <Label text="닉네임" />
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임 입력"
              style={styles.input}
            />
          </>
        )}
        <Label text="이메일" />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Label text="비밀번호" />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="비밀번호"
          secureTextEntry
          style={styles.input}
        />
        <PrimaryButton
          label={loading ? "처리 중..." : isSignup ? "가입하기" : "안내 받기"}
          onPress={submitSignup}
          disabled={loading}
        />
      </ScrollView>
    </View>
  );
}

function MyPageScreen({
  go,
  userInfo,
}: {
  go: (screen: Screen) => void;
  userInfo: UserInfo;
}) {
  const [userLevel, setUserLevel] = useState<LevelId>("중급");
  const [pendingLevel, setPendingLevel] = useState<LevelId>("중급");
  const [levelConfirmed, setLevelConfirmed] = useState(true);

  const maxMinutes = Math.max(...studyData.map((item) => item.minutes));
  const totalMinutes = studyData.reduce((sum, item) => sum + item.minutes, 0);
  const avgMinutes = Math.round(totalMinutes / studyData.length);
  const currentLevel =
    levelOptions.find((level) => level.id === userLevel) ?? levelOptions[1];
  const displayNickname = userInfo.nickname || userInfo.loginId || "영어마스터";
  const displayEmail = userInfo.email || "로그인 이메일 없음";

  const handleLevelButtonPress = () => {
    if (levelConfirmed) {
      setPendingLevel(userLevel);
      setLevelConfirmed(false);
      return;
    }
    setUserLevel(pendingLevel);
    setLevelConfirmed(true);
  };

  const renderLevelCard = (level: LevelOption, selectable: boolean) => {
    const selected = selectable
      ? pendingLevel === level.id
      : userLevel === level.id;
    return (
      <Pressable
        key={level.id}
        onPress={() => selectable && setPendingLevel(level.id)}
        disabled={!selectable}
        style={[
          styles.levelCard,
          {
            borderColor: selected ? level.border : "#F3F4F6",
            backgroundColor: selected ? level.bg : "#FFFFFF",
          },
        ]}
      >
        <View style={styles.flex}>
          <View style={styles.levelTitleRow}>
            <Text
              style={[
                styles.levelName,
                { color: selected ? level.color : "#111827" },
              ]}
            >
              {level.id}
            </Text>
            <Text
              style={[
                styles.levelEng,
                { color: selected ? level.color : "#9CA3AF" },
              ]}
            >
              {level.eng}
            </Text>
          </View>
          <Text
            style={[
              styles.levelDesc,
              { color: selected ? level.color : "#6B7280" },
            ]}
          >
            {level.desc}
          </Text>
          <View style={styles.levelPillRow}>
            {level.detail.map((item) => (
              <View
                key={item}
                style={[
                  styles.levelPill,
                  {
                    borderColor: selected ? level.border : "#E5E7EB",
                    backgroundColor: selected ? "#FFFDF7" : "#F9FAFB",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.levelPillText,
                    { color: selected ? level.color : "#6B7280" },
                  ]}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View
          style={[
            styles.levelRadio,
            { borderColor: selected ? level.border : "#E5E7EB" },
          ]}
        >
          {selected && (
            <View
              style={[styles.levelRadioDot, { backgroundColor: level.dot }]}
            />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.screenSoft}>
      <Header title="마이 페이지" go={go} backTo="mode" />
      <ScrollView contentContainerStyle={styles.myPageContent}>
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {displayNickname.slice(0, 1)}
            </Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.profileName} numberOfLines={1}>
              {displayNickname}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {displayEmail}
            </Text>
            <View style={styles.profileLevelRow}>
              <View
                style={[
                  styles.profileLevelDot,
                  { backgroundColor: currentLevel.dot },
                ]}
              />
              <Text style={styles.profileLevelText}>
                {currentLevel.id} · {currentLevel.eng}
              </Text>
            </View>
          </View>
          <Pressable
            style={styles.logoutButton}
            onPress={() =>
              Alert.alert("로그아웃", "정말 로그아웃 하시겠어요?", [
                { text: "취소", style: "cancel" },
                {
                  text: "로그아웃",
                  style: "destructive",
                  onPress: () => go("login"),
                },
              ])
            }
          >
            <Text style={styles.logoutText}>↪</Text>
          </Pressable>
        </View>

        <View style={styles.myStatsGrid}>
          <MyStat
            label="이번 주"
            value={`${Math.round((totalMinutes / 60) * 10) / 10}h`}
          />
          <MyStat label="일 평균" value={`${avgMinutes}분`} />
          <MyStat label="연속 학습" value="5일" />
        </View>

        <View style={styles.myCard}>
          <View style={styles.myCardHeader}>
            <View>
              <Text style={styles.myCardTitle}>주간 학습 시간</Text>
              <Text style={styles.myCardSub}>최근 7일 기록</Text>
            </View>
            <Text style={styles.myCardTotal}>{totalMinutes}분</Text>
          </View>
          <View style={styles.myChart}>
            {studyData.map((item, index) => {
              const isToday = index === studyData.length - 1;
              return (
                <View key={item.id} style={styles.myBarWrap}>
                  <View style={styles.myBarTrack}>
                    <View
                      style={[
                        styles.myBar,
                        {
                          height: `${(item.minutes / maxMinutes) * 100}%`,
                          backgroundColor: isToday ? primary : "#DCE5FF",
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[styles.myBarDay, isToday && styles.primaryText]}
                  >
                    {item.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.myCard}>
          <View style={styles.myCardHeader}>
            <Text style={styles.myCardTitle}>학습 레벨 설정</Text>
            <Pressable
              style={[
                styles.changeButton,
                !levelConfirmed && styles.confirmButton,
              ]}
              onPress={handleLevelButtonPress}
            >
              <Text
                style={[
                  styles.changeButtonText,
                  !levelConfirmed && styles.confirmButtonText,
                ]}
              >
                {levelConfirmed ? "변경" : "결정"}
              </Text>
            </Pressable>
          </View>
          {levelConfirmed
            ? renderLevelCard(currentLevel, false)
            : levelOptions.map((level) => renderLevelCard(level, true))}
        </View>

        <Pressable style={styles.menuRow} onPress={() => go("payment")}>
          <Text style={styles.menuRowText}>결제 및 구독</Text>
          <Text style={styles.menuChevron}>›</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function MyStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.myStat}>
      <Text style={styles.myStatLabel}>{label}</Text>
      <Text style={styles.myStatValue}>{value}</Text>
    </View>
  );
}

function InfoScreen({
  title,
  go,
}: {
  title: string;
  go: (screen: Screen) => void;
}) {
  const items =
    {
      마이페이지: ["오늘 학습 60분", "연속 학습 5일", "저장한 표현 42개"],
      설정: ["알림 받기", "피드백 자동 표시", "학습 데이터 동기화"],
      프리미엄: ["무제한 대화", "상세 AI 피드백", "상황별 커리큘럼"],
      "저장한 표현": [
        "I'd like to order a coffee.",
        "Sounds good!",
        "Could you recommend one?",
      ],
      공지사항: [
        "SenTic 베타 앱이 React Native로 전환되었습니다.",
        "새로운 대화 주제가 추가될 예정입니다.",
      ],
      FAQ: [
        "음성 대화는 어떻게 시작하나요?",
        "AI 피드백은 언제 표시되나요?",
        "저장한 표현은 어디서 보나요?",
      ],
    }[title] ?? [];

  return (
    <View style={styles.screenSoft}>
      <Header title={title} go={go} backTo="mode" />
      <ScrollView contentContainerStyle={styles.content}>
        {items.map((item) => (
          <View key={item} style={styles.listItem}>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function Header({
  title,
  go,
  backTo,
  actions,
}: {
  title: string;
  go: (screen: Screen) => void;
  backTo?: Screen;
  actions?: boolean;
}) {
  return (
    <View style={styles.header}>
      {backTo && (
        <Pressable style={styles.headerButton} onPress={() => go(backTo)}>
          <Text style={styles.headerIcon}>‹</Text>
        </Pressable>
      )}
      <Text style={[styles.headerTitle, !backTo && styles.logoSmall]}>
        {title}
      </Text>
      {actions ? (
        <View style={styles.headerActions}>
          <Pressable onPress={() => go("notice")} style={styles.headerAction}>
            <Text>📣</Text>
          </Pressable>
          <Pressable
            onPress={() => go("bookmarks")}
            style={styles.headerAction}
          >
            <Text>🔖</Text>
          </Pressable>
          <Pressable onPress={() => go("mypage")} style={styles.headerAction}>
            <Text>👤</Text>
          </Pressable>
          <Pressable onPress={() => go("settings")} style={styles.headerAction}>
            <Text>⚙️</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.primaryButton, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function ModeCard({
  icon,
  title,
  desc,
  color,
  onPress,
}: {
  icon: string;
  title: string;
  desc: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.modeCard} onPress={onPress}>
      <View style={[styles.modeIcon, { backgroundColor: `${color}18` }]}>
        <Text style={styles.modeIconText}>{icon}</Text>
      </View>
      <View style={styles.flex}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.mutedSmall}>{desc}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function MessageList({ messages }: { messages: Message[] }) {
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.messageContent}
    >
      <Text style={styles.dateDivider}>오늘</Text>
      {messages.map((message) => (
        <View
          key={message.id}
          style={[
            styles.messageRow,
            message.speaker === "user" && styles.messageRowUser,
          ]}
        >
          {message.speaker === "ai" && (
            <Text style={styles.smallAvatar}>🤖</Text>
          )}
          <View
            style={[
              styles.bubble,
              message.speaker === "user" ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.speaker === "user" && styles.userMessageText,
              ]}
            >
              {message.text}
            </Text>
            <Text
              style={[
                styles.timeText,
                message.speaker === "user" && styles.userTimeText,
              ]}
            >
              {message.time}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function FeedbackList({
  messages,
  enabled,
}: {
  messages: Message[];
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🔕</Text>
        <Text style={styles.muted}>피드백이 꺼져 있습니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {messages
        .filter((message) => message.feedback)
        .map((message) => (
          <View key={message.id} style={styles.card}>
            <Text style={styles.cardTitle}>{message.text}</Text>
            {message.feedback?.map((item) => (
              <Text key={item} style={styles.feedbackText}>
                {item}
              </Text>
            ))}
          </View>
        ))}
    </ScrollView>
  );
}

function TabBar<T extends string>({
  active,
  setActive,
  labels,
}: {
  active: T;
  setActive: (tab: T) => void;
  labels: Record<T, string>;
}) {
  return (
    <View style={styles.tabBar}>
      {(Object.keys(labels) as T[]).map((key) => (
        <Pressable
          key={key}
          style={[styles.tab, active === key && styles.activeTab]}
          onPress={() => setActive(key)}
        >
          <Text
            style={[styles.tabText, active === key && styles.activeTabText]}
          >
            {labels[key]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.mutedSmall}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Checklist({ text }: { text: string }) {
  return (
    <View style={styles.checkRow}>
      <Text style={styles.check}>✓</Text>
      <Text style={styles.listText}>{text}</Text>
    </View>
  );
}

function PillRow({ items }: { items: string[] }) {
  return (
    <View style={styles.pillRow}>
      {items.map((item) => (
        <View key={item} style={styles.pill}>
          <Text style={styles.pillText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function RoundButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.roundButton} onPress={onPress}>
      <Text style={styles.roundButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  screenSoft: { flex: 1, backgroundColor: softBg },
  flex: { flex: 1 },
  loginContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 28 },
  brandBlock: { alignItems: "center", paddingTop: 70, paddingBottom: 48 },
  logo: { color: primary, fontSize: 50, fontWeight: "800", letterSpacing: 0 },
  logoSmall: { color: primary, fontSize: 26, fontWeight: "800" },
  muted: { color: "#6B7280", fontSize: 14 },
  mutedSmall: { color: "#9CA3AF", fontSize: 12, marginTop: 4 },
  mutedBlock: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  form: { width: "100%" },
  label: {
    color: "#6B7280",
    fontSize: 12,
    marginBottom: 6,
    marginTop: 14,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderColor: border,
    borderWidth: 1,
    borderRadius: 14,
    color: "#111827",
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  passwordRow: { position: "relative" },
  passwordInput: { paddingRight: 72 },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 11,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  iconText: { color: "#6B7280", fontSize: 12 },
  alignRight: { alignItems: "flex-end", marginVertical: 12 },
  linkText: { color: primary, fontSize: 13, fontWeight: "700" },
  primaryButton: {
    backgroundColor: primary,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 10,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 24,
  },
  divider: { height: 1, backgroundColor: "#E5E7EB", flex: 1 },
  dividerText: { color: "#9CA3AF", fontSize: 12 },
  socialRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  socialButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  kakao: { backgroundColor: "#FEE500", borderColor: "#FEE500" },
  socialText: { color: "#111827", fontWeight: "700", fontSize: 13 },
  centerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    minHeight: 58,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    marginRight: 8,
  },
  headerIcon: { fontSize: 32, color: "#4B5563", lineHeight: 34 },
  headerTitle: { flex: 1, color: "#111827", fontSize: 16, fontWeight: "800" },
  headerActions: { flexDirection: "row", gap: 4 },
  headerAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  headerSpacer: { width: 36 },
  content: { padding: 20, gap: 14 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
  },
  caption: { color: "#9CA3AF", fontSize: 12, marginBottom: 4 },
  h1: {
    color: "#111827",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 8,
  },
  h2: { color: "#111827", fontSize: 20, fontWeight: "800" },
  sectionTitle: {
    color: "#9CA3AF",
    fontSize: 12,
    textTransform: "uppercase",
    marginTop: 4,
  },
  streak: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  streakText: { color: "#EA580C", fontSize: 12, fontWeight: "800" },
  modeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  modeIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modeIconText: { fontSize: 25 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 16,
  },
  cardTitle: { color: "#111827", fontSize: 15, fontWeight: "800" },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 120,
    marginTop: 16,
  },
  barWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  bar: {
    width: "62%",
    backgroundColor: "#C7D2FE",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  activeBar: { backgroundColor: primary },
  barMinute: { color: "#9CA3AF", fontSize: 10 },
  barDay: { color: "#9CA3AF", fontSize: 11 },
  primaryText: { color: primary },
  statsGrid: { flexDirection: "row", gap: 10 },
  stat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  statValue: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
  },
  roomCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  roomIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  roomIconText: { fontSize: 22 },
  chevron: { color: "#C7CBD1", fontSize: 30 },
  heroCard: {
    alignItems: "center",
    backgroundColor: darkPrimary,
    borderRadius: 18,
    padding: 28,
  },
  heroIcon: { fontSize: 44, marginBottom: 10 },
  heroTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" },
  heroDesc: {
    color: "#C7D2FE",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
  },
  check: { color: primary, fontWeight: "900" },
  listText: { color: "#374151", fontSize: 14, lineHeight: 20 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  pill: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: { color: primary, fontSize: 12, fontWeight: "800" },
  tabBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  tab: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  activeTab: { backgroundColor: primary },
  tabText: { color: "#6B7280", fontSize: 12, fontWeight: "700" },
  activeTabText: { color: "#FFFFFF" },
  callBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  avatarLarge: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarActive: { borderWidth: 6, borderColor: "#C7D2FE" },
  avatarEmoji: { fontSize: 48 },
  subtitleBox: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 16,
    alignItems: "center",
    marginVertical: 24,
  },
  subtitleText: { color: "#374151", fontSize: 15, textAlign: "center" },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
  },
  roundButton: {
    width: 74,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  roundButtonText: { color: "#4B5563", fontSize: 12, fontWeight: "800" },
  callButton: {
    width: 76,
    height: 60,
    borderRadius: 18,
    backgroundColor: primary,
    alignItems: "center",
    justifyContent: "center",
  },
  endCallButton: { backgroundColor: "#EF4444" },
  callButtonText: { color: "#FFFFFF", fontWeight: "900" },
  feedbackToggle: {
    marginTop: 22,
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  feedbackToggleOff: { backgroundColor: "#F3F4F6" },
  feedbackToggleText: { color: primary, fontSize: 12, fontWeight: "800" },
  grayText: { color: "#6B7280" },
  messageContent: { padding: 16, gap: 10 },
  dateDivider: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
    marginVertical: 8,
  },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  messageRowUser: { justifyContent: "flex-end" },
  smallAvatar: {
    width: 32,
    height: 32,
    textAlign: "center",
    textAlignVertical: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    overflow: "hidden",
  },
  bubble: {
    maxWidth: "76%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: { backgroundColor: primary, borderBottomRightRadius: 4 },
  aiBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderBottomLeftRadius: 4,
  },
  messageText: { color: "#1F2937", fontSize: 14, lineHeight: 20 },
  userMessageText: { color: "#FFFFFF" },
  timeText: { color: "#9CA3AF", fontSize: 10, marginTop: 4 },
  userTimeText: { color: "#C7D2FE", textAlign: "right" },
  feedbackText: {
    color: "#374151",
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyIcon: { fontSize: 34 },
  composer: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  composerInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: border,
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 11,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  disabled: { opacity: 0.45 },
  sendText: { color: "#FFFFFF", fontWeight: "900" },
  listItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 16,
  },
  myPageContent: {
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 34,
    gap: 14,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEF0F4",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#E8ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: { color: primary, fontSize: 16, fontWeight: "800" },
  profileName: { color: "#111827", fontSize: 14, fontWeight: "800" },
  profileEmail: { color: "#9CA3AF", fontSize: 11, marginTop: 3 },
  profileLevelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  profileLevelDot: { width: 6, height: 6, borderRadius: 3 },
  profileLevelText: { color: "#6B7280", fontSize: 11 },
  logoutButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: { color: "#F87171", fontSize: 17, fontWeight: "900" },
  myStatsGrid: { flexDirection: "row", gap: 8 },
  myStat: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF0F4",
    paddingVertical: 12,
    alignItems: "center",
  },
  myStatLabel: { color: "#9CA3AF", fontSize: 11, marginBottom: 4 },
  myStatValue: { color: "#111827", fontSize: 13, fontWeight: "900" },
  myCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEF0F4",
    padding: 15,
  },
  myCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  myCardTitle: { color: "#111827", fontSize: 14, fontWeight: "900" },
  myCardSub: { color: "#9CA3AF", fontSize: 11, marginTop: 3 },
  myCardTotal: { color: "#8B91A1", fontSize: 11, marginTop: 3 },
  myChart: {
    height: 116,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
  },
  myBarWrap: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 7,
  },
  myBarTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
  myBar: {
    width: "100%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    minHeight: 8,
  },
  myBarDay: { color: "#A8AFBD", fontSize: 9 },
  changeButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  confirmButton: { backgroundColor: primary },
  changeButtonText: { color: "#4B5563", fontSize: 11, fontWeight: "800" },
  confirmButtonText: { color: "#FFFFFF" },
  levelCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 8,
  },
  levelTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 4,
  },
  levelName: { fontSize: 13, fontWeight: "900" },
  levelEng: { fontSize: 10, fontWeight: "800" },
  levelDesc: { fontSize: 11, fontWeight: "700", marginBottom: 9 },
  levelPillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  levelPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  levelPillText: { fontSize: 10, fontWeight: "700" },
  levelRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  levelRadioDot: { width: 8, height: 8, borderRadius: 4 },
  menuRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF0F4",
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuRowText: { color: "#374151", fontSize: 14, fontWeight: "800" },
  menuChevron: { color: "#CBD5E1", fontSize: 24, lineHeight: 24 },
});
