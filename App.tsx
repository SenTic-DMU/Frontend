import { useMemo, useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {
  Alert,
  Animated,
  StatusBar,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";
import { WebView } from "react-native-webview";
// ⭐️ 음성 재생을 위해 expo-av에서 Audio를 꼭 불러와야 합니다!
import { Audio } from "expo-av";

const KAKAO_REST_API_KEY = "5775a3641d33077c7adf61cbcc01d0a9";
const KAKAO_REDIRECT_URI = "https://localhost/kakao";
const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}`;

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

// ⭐️ 피드백 객체의 생김새 정의
interface FeedbackData {
  id: number;
  roomId?: number;
  messageId?: number;
  wordErrors?: string | null;
  grammarErrors?: string | null;
  expressionErrors?: string | null;
  perfectSentence?: string | null;
  createdAt?: string;
}

type Message = {
  id: string;
  speaker: "user" | "ai";
  text: string;
  time: string;
  feedback?: FeedbackData[];
  isBookmarked?: boolean; // 👈 추가!
};

type PracticeRoom = {
  id: string;
  title: string;
  desc: string;
  level?: string;
  lastMessage?: string;
  date?: string;
  duration?: string;
};

declare const global: { accessToken?: string };

const primary = "#4F46E5";
const darkPrimary = "#4338CA";
const softBg = "#F5F5F7";
const border = "#E5E7EB";

// 🧪 "테스트로 바로 들어가기" 버튼을 눌렀을 때만 true — 서버 연결 없이 예시 방/대화로 화면을 둘러볼 수 있게 해줍니다.
let isTestMode = false;

const TEST_VOICE_ROOMS: PracticeRoom[] = [
  {
    id: "test-voice-1",
    title: "카페에서 주문하기",
    desc: "카페에서 음료를 주문하는 상황극",
    date: "오늘",
    level: "맞춤",
  },
];

const TEST_CHAT_ROOMS: PracticeRoom[] = [
  {
    id: "test-chat-1",
    title: "면접 연습하기",
    desc: "영어로 면접 보는 상황극",
    date: "오늘",
    level: "맞춤",
  },
];

const TEST_VOICE_MESSAGES: Message[] = [
  {
    id: "tv-1",
    speaker: "ai",
    text: "Hello! Welcome to our cafe. What can I get for you today?",
    time: "10:30",
  },
  {
    id: "tv-2",
    speaker: "user",
    text: "I want to order a coffee",
    time: "10:31",
    feedback: [
      {
        id: 1,
        wordErrors: JSON.stringify([
          {
            original: "want",
            suggested: "would like",
            explanation: "더 정중한 표현이에요.",
          },
        ]),
        grammarErrors: "[]",
        expressionErrors: JSON.stringify([
          {
            original: "I want to order a coffee",
            suggested: "Could I get a coffee, please?",
            explanation: "카페에서는 이렇게 말하는 게 더 자연스러워요.",
          },
        ]),
        perfectSentence: "I'd like to order a coffee, please.",
      },
    ],
  },
  {
    id: "tv-3",
    speaker: "ai",
    text: "Sure! What size would you like?",
    time: "10:31",
  },
  { id: "tv-4", speaker: "user", text: "Large size, please.", time: "10:32" },
];

const TEST_CHAT_MESSAGES = [
  {
    id: "tt-1",
    speaker: "ai",
    text: "Hi there! Thanks for coming in today. Can you tell me a bit about yourself?",
    time: "10:30",
  },
  {
    id: "tt-2",
    speaker: "user",
    text: "I am study computer science in university.",
    time: "10:31",
    feedback: [
      {
        wordErrors: JSON.stringify([
          {
            original: "I am study",
            suggested: "I am studying",
            explanation: "현재진행형은 am/is/are + 동사ing 형태를 써야 해요.",
          },
        ]),
        grammarErrors: "[]",
        expressionErrors: "[]",
        perfectSentence: "I'm studying computer science at university.",
      },
    ],
  },
  {
    id: "tt-3",
    speaker: "ai",
    text: "That's great! What made you interested in this field?",
    time: "10:31",
  },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");

  // ⭐️ 1. 더미 데이터를 지우고, 상태(State)로 음성방을 관리하도록 추가합니다!
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [voiceRooms, setVoiceRooms] = useState<any[]>([]); // 👈 새로 추가!

  // ⭐️ 2. 채팅방 + 음성방 목록을 한 번에 불러오도록 업그레이드합니다.
  useEffect(() => {
    const fetchMyRooms = async () => {
      // 🧪 테스트 모드에서는 서버 호출 없이 예시 방 목록을 채워줍니다.
      if (isTestMode) {
        setChatRooms(TEST_CHAT_ROOMS);
        setVoiceRooms(TEST_VOICE_ROOMS);
        return;
      }

      try {
        const accessToken = await AsyncStorage.getItem("accessToken");

        if (!accessToken) {
          return;
        }

        const API_URL = "https://rundown-irrigate-majesty.ngrok-free.dev";
        const headers = {
          Authorization: `Bearer ${accessToken}`,
          "ngrok-skip-browser-warning": "true", // 👈 혹시 빠져있었다면 이거 꼭 넣어주세요!
        };

        // 1. 채팅방(Text) 목록 가져오기
        const chatResponse = await axios.get(
          `${API_URL}/api/rooms?roomType=CHAT`,
          { headers },
        );

        // 2. 음성방(Voice) 목록 가져오기 (백엔드 파라미터가 'VOICE'라고 가정)
        const voiceResponse = await axios.get(
          `${API_URL}/api/rooms?roomType=VOICE`,
          { headers },
        );

        // ⭐️ 번역(Mapping) 로직을 함수로 만들어서 둘 다 똑같이 예쁘게 포장해줍니다.
        const formatRooms = (rawRooms: any[]) => {
          return rawRooms.map((room: any) => ({
            id: room.id,
            title: room.roomName || "새로운 대화",
            desc: room.situation || "대화 상황이 설정되지 않았습니다.",
            date:
              (room.lastActiveAt || room.createdAt)?.split("T")[0] || "오늘",
            level: room.level || "맞춤", // 음성방에 필요했던 level 값 (없으면 '맞춤'으로 처리)
          }));
        };

        // 포장된 데이터를 각각의 그릇에 담습니다!
        setChatRooms(formatRooms(chatResponse.data?.data || []));
        setVoiceRooms(formatRooms(voiceResponse.data?.data || []));
      } catch (error: any) {
        console.error(
          "🚨 방 목록 불러오기 실패 상세원인:",
          error.response?.data || error.message,
        );
      }
    };

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
  const startNewConversation = (mode: "voice" | "text") => {
    setSelectedMode(mode);
    setSelectedRoom({ id: `${mode}-new`, title: "", desc: "", level: "맞춤" });
    go("situation");
  };

  const handleKakaoLogin = () => setKakaoWebViewVisible(true);

  const handleWebViewNavChange = async (navState: { url: string }) => {
    if (!navState.url.startsWith(KAKAO_REDIRECT_URI)) return;
    setKakaoWebViewVisible(false);

    const code = new URL(navState.url).searchParams.get("code");
    if (!code) {
      Alert.alert("카카오 로그인 실패", "인증 코드를 받지 못했습니다.");
      return;
    }

    setKakaoLoggingIn(true);
    try {
      const { ok, data } = await authPost("/api/auth/kakao", { code });
      if (ok && data?.success) {
        await AsyncStorage.setItem("accessToken", data.data.accessToken);
        if (data.data.refreshToken) {
          await AsyncStorage.setItem("refreshToken", data.data.refreshToken);
        }
        go("mode");
      } else {
        Alert.alert(
          "카카오 로그인 실패",
          data?.message ?? "잠시 후 다시 시도해주세요.",
        );
      }
    } catch (e) {
      Alert.alert("연결 실패", "서버와 연결할 수 없습니다.");
      console.error("카카오 로그인 에러:", e);
    } finally {
      setKakaoLoggingIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Modal visible={kakaoWebViewVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <Pressable
            style={styles.webViewClose}
            onPress={() => setKakaoWebViewVisible(false)}
          >
            <Text style={styles.webViewCloseText}>✕ 닫기</Text>
          </Pressable>
          <WebView
            source={{ uri: KAKAO_AUTH_URL }}
            onNavigationStateChange={handleWebViewNavChange}
          />
        </SafeAreaView>
      </Modal>
      <Modal visible={kakaoLoggingIn} animationType="fade" transparent>
        <View style={styles.kakaoLoadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.kakaoLoadingText}>카카오 로그인 처리 중...</Text>
        </View>
      </Modal>
      {screen === "login" && (
        <LoginScreen go={go} onKakaoLogin={handleKakaoLogin} />
      )}

      {screen === "signup" && <SignupScreen go={go} />}
      {screen === "findAccount" && <FindAccountScreen go={go} />}

      {screen === "mode" && <ModeScreen go={go} />}
      {screen === "voiceRooms" && (
        <RoomListScreen
          title="음성 대화"
          rooms={voiceRooms}
          go={go}
          mode="voice"
          onCreate={() => startNewConversation("voice")}
          onPick={(room) => {
            setSelectedRoom(room);
            setSelectedMode("voice");
            go("voiceChat");
          }}
        />
      )}
      {screen === "chatRooms" && (
        <RoomListScreen
          title="채팅 대화"
          rooms={chatRooms}
          go={go}
          mode="text"
          onCreate={() => startNewConversation("text")}
          onPick={(room) => {
            setSelectedRoom({ ...room, level: "맞춤" });
            setSelectedMode("text");
            go("textChat");
          }}
        />
      )}
      {screen === "situation" && (
        <SituationScreen
          mode={selectedMode}
          room={selectedRoom}
          go={go}
          onStart={(nextRoom) => setSelectedRoom(nextRoom)}
        />
      )}
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
      {screen === "notice" && <NoticeScreen go={go} />}
      {screen === "faq" && <FaqScreen go={go} />}
    </SafeAreaView>
  );
}

function LoginScreen({
  go,
  onKakaoLogin,
}: {
  go: (screen: Screen) => void;
  onKakaoLogin: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("입력 확인", "아이디와 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ loginId: username, password }),
        },
      );

      const data = await res.json();

      if (data.success) {
        // ⭐️ 과거 코드의 핵심: 글로벌 변수 대신 폰 내부 금고에 확실하게 저장!
        await AsyncStorage.setItem("accessToken", data.data.accessToken);

        // (선택) 리프레시 토큰도 넘어온다면 같이 저장해줍니다.
        if (data.data.refreshToken) {
          await AsyncStorage.setItem("refreshToken", data.data.refreshToken);
        }

        // 저장이 완료된 후에야 다음 화면으로 넘어갑니다.
        go("mode");
      } else {
        // 서버에서 비밀번호 틀렸다고 응답한 경우
        Alert.alert(
          "로그인 실패",
          data.message ?? "아이디 또는 비밀번호를 확인해주세요.",
        );
      }
    } catch (e) {
      // ⭐️ 에러 났을 때 강제로 넘어가는 로직 삭제 (가짜 로그인 방지)
      Alert.alert(
        "연결 실패",
        "서버와 연결할 수 없습니다. 서버 주소나 ngrok 상태를 확인해주세요.",
      );
      console.error("로그인 통신 에러:", e);
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
              onPress={() => setShowPassword((v) => !v)}
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
          <Pressable
            style={[styles.primaryButton, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? "로그인 중..." : "로그인"}
            </Text>
          </Pressable>
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>소셜 계정으로 시작</Text>
            <View style={styles.divider} />
          </View>
          <View style={styles.socialRow}>
            <Pressable
              style={[styles.socialButton, styles.kakao]}
              onPress={onKakaoLogin}
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

          {/* 🧪 개발 빌드에서만 노출되는 테스트용 로그인 우회 버튼 (프로덕션 빌드에서는 자동으로 사라짐) */}
          {__DEV__ && (
            <Pressable
              style={styles.devSkipButton}
              onPress={() => {
                isTestMode = true;
                go("mode");
              }}
            >
              <Text style={styles.devSkipButtonText}>
                🧪 테스트로 바로 들어가기 (로그인 생략)
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

async function authPost(path: string, body: object) {
  const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, data };
}

function SignupScreen({ go }: { go: (screen: Screen) => void }) {
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  const [usernameChecked, setUsernameChecked] = useState<
    null | "available" | "taken"
  >(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameChecked(null);
  };

  const handleCheckUsername = async () => {
    if (!username.trim()) {
      Alert.alert("입력 확인", "아이디를 입력해주세요.");
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      Alert.alert("입력 확인", "아이디는 영문/숫자 조합만 가능합니다.");
      return;
    }
    setCheckingUsername(true);
    try {
      const { ok, data } = await authPost("/api/auth/check-loginid", {
        loginId: username,
      });
      if (ok && data?.success) {
        setUsernameChecked(data.data ? "available" : "taken");
      } else {
        Alert.alert(
          "확인 실패",
          data?.message ?? "아이디 중복 확인에 실패했습니다.",
        );
      }
    } catch (e) {
      Alert.alert("연결 실패", "서버와 연결할 수 없습니다.");
      console.error("아이디 중복 확인 에러:", e);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSignup = async () => {
    if (
      !username.trim() ||
      !nickname.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert("입력 확인", "모든 항목을 입력해주세요.");
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      Alert.alert("입력 확인", "아이디는 영문/숫자 조합만 가능합니다.");
      return;
    }
    if (usernameChecked !== "available") {
      Alert.alert("아이디 중복 확인", "아이디 중복 확인을 완료해주세요.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("비밀번호 확인", "비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("비밀번호 확인", "비밀번호가 일치하지 않습니다.");
      return;
    }
    setSigningUp(true);
    try {
      const { ok, data } = await authPost("/api/auth/signup", {
        loginId: username,
        password,
        nickname,
        email,
      });
      if (ok && data?.success) {
        Alert.alert("가입 완료", "회원가입이 완료되었습니다. 로그인해주세요.");
        go("login");
      } else {
        Alert.alert("가입 실패", data?.message ?? "회원가입에 실패했습니다.");
      }
    } catch (e) {
      Alert.alert("연결 실패", "서버와 연결할 수 없습니다.");
      console.error("회원가입 에러:", e);
    } finally {
      setSigningUp(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <Header title="회원가입" go={go} backTo="login" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.mutedBlock}>
          SenTic 계정을 만들고 학습을 시작하세요.
        </Text>

        <Label text="아이디" />
        <View style={styles.signupInlineRow}>
          <TextInput
            value={username}
            onChangeText={handleUsernameChange}
            placeholder="영문/숫자 조합"
            style={[styles.input, styles.signupInlineInput]}
            autoCapitalize="none"
          />
          <Pressable
            style={[
              styles.signupEmailButton,
              (!username.trim() || checkingUsername) && { opacity: 0.5 },
            ]}
            onPress={handleCheckUsername}
            disabled={!username.trim() || checkingUsername}
          >
            <Text style={styles.signupEmailButtonText}>
              {checkingUsername
                ? "확인 중..."
                : usernameChecked === "available"
                  ? "사용가능"
                  : "중복확인"}
            </Text>
          </Pressable>
        </View>
        {usernameChecked === "taken" && (
          <Text style={styles.errorText}>이미 사용 중인 아이디입니다</Text>
        )}
        {usernameChecked === "available" && (
          <Text style={styles.signupSuccessText}>
            ✓ 사용 가능한 아이디입니다
          </Text>
        )}

        <Label text="닉네임" />
        <TextInput
          value={nickname}
          onChangeText={setNickname}
          placeholder="앱에서 사용할 이름"
          style={styles.input}
        />

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
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="8자 이상"
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput]}
          />
          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowPassword((v) => !v)}
          >
            <Text style={styles.iconText}>
              {showPassword ? "숨김" : "보기"}
            </Text>
          </Pressable>
        </View>
        <Label text="비밀번호 확인" />
        <View style={styles.passwordRow}>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="비밀번호 재입력"
            secureTextEntry={!showConfirmPassword}
            style={[styles.input, styles.passwordInput]}
          />
          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword((v) => !v)}
          >
            <Text style={styles.iconText}>
              {showConfirmPassword ? "숨김" : "보기"}
            </Text>
          </Pressable>
        </View>
        {confirmPassword.length > 0 && password !== confirmPassword && (
          <Text style={styles.errorText}>비밀번호가 일치하지 않습니다</Text>
        )}

        <Pressable
          style={[
            styles.primaryButton,
            { marginTop: 20 },
            signingUp && { opacity: 0.6 },
          ]}
          onPress={handleSignup}
          disabled={signingUp}
        >
          <Text style={styles.primaryButtonText}>
            {signingUp ? "가입 중..." : "가입하기"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ModeScreen({ go }: { go: (screen: Screen) => void }) {
  // ⭐️ 1. 닉네임을 저장할 State 만들기 (데이터가 오기 전 기본값은 '회원')
  const [nickname, setNickname] = useState("회원");

  // ⭐️ 1. 보여주고 싶은 문구들을 배열로 쭈욱 작성합니다.
  const greetings = [
    "오늘도 영어 공부해요! 📖",
    "매일 조금씩 성장하는 중! 🌱",
    "영어 마스터가 되는 그날까지! 🚀",
    "꾸준함이 실력을 만듭니다 💪",
    "오늘의 10분이 내일을 바꿉니다 ✨",
    "새로운 표현을 배워볼까요? 💡",
    "Hello! 오늘도 힘차게 시작해 봐요! 😊",
  ];

  // ⭐️ 2. 화면이 처음 켜질 때 랜덤으로 하나를 뽑아서 State에 저장합니다.
  // (useState 안에 콜백 함수를 넣으면 딱 처음 한 번만 랜덤값을 뽑아냅니다!)
  const [randomGreeting] = useState(() => {
    const randomIndex = Math.floor(Math.random() * greetings.length);
    return greetings[randomIndex];
  });

  const weekly = [33, 42, 27, 36, 48, 24, 60];
  useEffect(() => {
    const fetchMyProfile = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        if (!accessToken) return;

        const API_URL = "https://rundown-irrigate-majesty.ngrok-free.dev";

        // ⭐️ 백엔드에서 알려준 정확한 주소(/api/users/me)로 수정!
        const res = await axios.get(`${API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        });

        // 백엔드 응답에서 닉네임 데이터 뽑아오기
        // (응답 형태에 따라 nickname일 수도, name일 수도 있어서 둘 다 커버하도록 작성했습니다)
        const myName =
          res.data?.data?.nickname ||
          res.data?.nickname ||
          res.data?.data?.name ||
          res.data?.name;

        if (myName) {
          setNickname(myName);
        }
      } catch (error: any) {
        console.error(
          "🚨 유저 정보 불러오기 실패:",
          error.response?.data || error.message,
        );
      }
    };

    fetchMyProfile();
  }, []);

  return (
    <View
      style={[
        styles.screenSoft,
        {
          flex: 1,
          backgroundColor: "#fff",
          paddingTop: StatusBar.currentHeight
            ? StatusBar.currentHeight + 10
            : 24,
        },
      ]}
    >
      <Header title="SenTic" go={go} actions />
      <ScrollView
        style={{ backgroundColor: "#F9FAFB" }}
        contentContainerStyle={styles.content}
      >
        <View style={styles.rowBetween}>
          {/* ⭐️ 바로 여기! flex: 1을 주면 남은 공간 안에서만 크기를 차지하고, 글자가 길면 알아서 줄바꿈됩니다. */}
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.caption}>안녕하세요, {nickname}님</Text>
            <Text style={styles.h2}>{randomGreeting}</Text>
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

export function RoomListScreen({
  title,
  rooms,
  go,
  mode,
  onCreate,
  onPick,
}: {
  title: string;
  rooms: PracticeRoom[];
  go: (screen: Screen) => void;
  mode: "voice" | "text";
  onCreate: () => void;
  onPick: (room: PracticeRoom) => void;
}) {
  const [hiddenRooms, setHiddenRooms] = useState<(number | string)[]>([]);

  const handleDeleteRoom = (roomId: number | string, roomTitle: string) => {
    Alert.alert(
      "대화방 삭제",
      `'${roomTitle}' 대화방을 정말 삭제하시겠습니까?\n(삭제 후 복구할 수 없습니다.)`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              const accessToken = await AsyncStorage.getItem("accessToken");
              const API_URL = "https://rundown-irrigate-majesty.ngrok-free.dev";

              await axios.delete(`${API_URL}/api/rooms/${roomId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });

              setHiddenRooms((prev) => [...prev, roomId]);
            } catch (error: any) {
              console.error(
                "🚨 방 삭제 실패:",
                error.response?.data || error.message,
              );
              Alert.alert("오류", "대화방 삭제에 실패했습니다.");
            }
          },
        },
      ],
    );
  };

  const visibleRooms = rooms.filter((room) => !hiddenRooms.includes(room.id));

  return (
    <View
      style={[
        styles.screenSoft,
        {
          flex: 1,
          backgroundColor: "#fff",
          // ⭐️ 안드로이드 상태바 높이만큼 상단 패딩을 줍니다 (없으면 기본 24px)
          paddingTop: StatusBar.currentHeight
            ? StatusBar.currentHeight + 10
            : 24,
        },
      ]}
    >
      <View style={styles.roomListHeader}>
        <Pressable style={styles.headerButton} onPress={() => go("mode")}>
          <Text style={styles.headerIcon}>‹</Text>
        </Pressable>
        <View style={styles.flex}>
          <Text style={styles.roomListTitle}>{title}</Text>
          <Text style={styles.roomListCount}>
            {visibleRooms.length}개의 대화방
          </Text>
        </View>
        <Pressable style={styles.newRoomButton} onPress={onCreate}>
          <Text style={styles.newRoomButtonText}>+ 새 대화</Text>
        </Pressable>
      </View>
      <ScrollView
        style={{ backgroundColor: "#F9FAFB" }}
        contentContainerStyle={styles.roomListContent}
      >
        {visibleRooms.map((room) => (
          <Pressable
            key={room.id}
            style={styles.chatRoomCard}
            onPress={() => onPick(room)}
            onLongPress={() => handleDeleteRoom(room.id, room.title)}
          >
            <View style={styles.voiceRoomIcon}>
              <Text style={styles.voiceRoomIconText}>
                {mode === "voice" ? "🎙" : "💬"}
              </Text>
            </View>
            <View style={styles.roomPreview}>
              <View style={styles.roomPreviewTop}>
                <Text style={styles.roomPreviewTitle} numberOfLines={1}>
                  {room.title}
                </Text>
                <Text style={styles.roomPreviewDate}>{room.date}</Text>
              </View>
              <View style={styles.roomPreviewBottom}>
                <Text style={styles.roomPreviewMessage} numberOfLines={1}>
                  {room.lastMessage ?? room.desc}
                </Text>
                {room.duration && (
                  <Text style={styles.durationBadge}>{room.duration}</Text>
                )}
              </View>
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
  onStart,
}: {
  mode: "voice" | "text";
  room: PracticeRoom;
  go: (screen: Screen) => void;
  onStart: (room: PracticeRoom) => void;
}) {
  const presets = [
    {
      title: "카페에서 주문하기",
      desc: "처음 방문한 카페에서 원하는 메뉴를 묻고 추천을 받는 상황",
      name: "바리스타",
      trait: "친절하고 빠르게 주문을 도와주는 직원",
      avatar: "👩",
    },
    {
      title: "비즈니스 미팅",
      desc: "프로젝트 진행 상황을 공유하고 다음 일정을 조율하는 상황",
      name: "Alex",
      trait: "차분하고 논리적인 해외 파트너",
      avatar: "👨",
    },
    {
      title: "여행 계획 세우기",
      desc: "여름 여행지를 고르고 일정과 예산을 영어로 상의하는 상황",
      name: "여행 친구",
      trait: "호기심이 많고 새로운 장소를 좋아함",
      avatar: "🧑",
    },
  ];

  const [title, setTitle] = useState(room.title || "");
  const [desc, setDesc] = useState(room.desc || "");
  const [characters, setCharacters] = useState([
    {
      name: presets[0].name,
      trait: presets[0].trait,
      avatar: presets[0].avatar,
      photoUri: null as string | null,
    },
  ]);

  // 💡 통신 중 버튼을 비활성화하기 위한 로딩 상태 추가
  const [loading, setLoading] = useState(false);

  const addCharacter = () => {
    if (characters.length >= 2) return;
    setCharacters((prev) => [
      ...prev,
      { name: "", trait: "", avatar: "👨", photoUri: null },
    ]);
  };

  const updateCharacter = (index: number, field: string, value: string) => {
    setCharacters((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  };

  const pickPhoto = async (index: number) => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 필요", "갤러리 접근 권한이 필요합니다.");
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setCharacters((prev) =>
        prev.map((c, i) =>
          i === index ? { ...c, photoUri: result.assets[0].uri } : c,
        ),
      );
    }
  };

  const randomize = () => {
    const next = presets[Math.floor(Math.random() * presets.length)];
    setTitle(next.title);
    setDesc(next.desc);
    setCharacters([
      {
        name: next.name,
        trait: next.trait,
        avatar: next.avatar,
        photoUri: null,
      },
    ]);
  };

  const start = async () => {
    // 💡 이 줄을 추가하면 사용자가 버튼을 다다닥 눌러도 한 번만 통신합니다.
    if (loading) return;

    if (!title.trim() || !desc.trim()) {
      Alert.alert("입력 확인", "대화방 제목과 상황 설명을 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      if (!accessToken) {
        Alert.alert("로그인 만료", "다시 로그인해주세요.");
        go("login");
        return;
      }

      const requestBody = {
        // ⭐️ 백엔드 변수명에 맞춰서 왼쪽 이름표들을 모두 수정했습니다!
        roomName: title.trim(),
        situation: desc.trim(),
        difficulty: "BEGINNER",
        roomType: mode === "voice" ? "VOICE" : "CHAT",

        characters: characters.map((c) => ({
          name: c.name, // 이건 똑같아서 잘 들어갔던 겁니다!
          personality: c.trait, // trait -> personality 로 변경
          iconType: c.avatar, // avatar -> iconType 으로 변경
        })),
      };

      console.log("👉 방 생성 데이터 전송:", requestBody);

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/rooms`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      const newRoomId = response.data?.data?.id || response.data?.id;

      if (!newRoomId) {
        throw new Error("서버에서 방 번호를 내려주지 않았습니다.");
      }

      onStart({
        ...room,
        id: newRoomId,
        title: title.trim(),
        desc: desc.trim(),
        lastMessage: desc.trim() || room.lastMessage,
        date: "오늘",
        characters: characters,
      } as any);

      go(mode === "voice" ? "voiceChat" : "textChat");
    } catch (error: any) {
      console.error(
        "🚨 방 생성 통신 에러:",
        error.response?.data || error.message,
      );
      Alert.alert(
        "방 생성 실패",
        "상황을 설정하는 중 서버 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.screenSoft,
        {
          flex: 1,
          backgroundColor: "#fff",
          paddingTop: StatusBar.currentHeight
            ? StatusBar.currentHeight + 10
            : 24,
        },
      ]}
    >
      <View style={styles.roomListHeader}>
        <Pressable
          style={styles.headerButton}
          onPress={() => go(mode === "voice" ? "voiceRooms" : "chatRooms")}
        >
          <Text style={styles.headerIcon}>‹</Text>
        </Pressable>
        <View style={styles.flex}>
          <Text style={styles.roomListTitle}>상황 설정</Text>
          <Text style={styles.roomListCount}>영어 대화</Text>
        </View>
        <Pressable style={styles.randomButton} onPress={randomize}>
          <Text style={styles.randomButtonText}>↝ 랜덤</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ backgroundColor: "#F9FAFB" }}
        contentContainerStyle={styles.setupContent}
      >
        <Label text="대화방 제목" />
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="예: 카페에서 주문하기"
          style={styles.input}
        />

        <Label text="상황 설명" />
        <TextInput
          value={desc}
          onChangeText={setDesc}
          placeholder="원하는 상황을 자세히 설명해주세요"
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.descriptionInput]}
        />

        <View style={styles.setupSectionHeader}>
          <View>
            <Text style={styles.setupSectionTitle}>등장인물</Text>
            <Text style={styles.roomListCount}>최대 2명까지 추가 가능</Text>
          </View>
          <Pressable onPress={addCharacter} disabled={characters.length >= 2}>
            <Text
              style={[
                styles.addCharacterText,
                characters.length >= 2 && { color: "#D1D5DB" },
              ]}
            >
              + 추가
            </Text>
          </Pressable>
        </View>

        {characters.map((char, index) => (
          <View
            key={index}
            style={[styles.characterCard, index > 0 && { marginTop: 10 }]}
          >
            <View style={styles.avatarPicker}>
              <Pressable onPress={() => pickPhoto(index)}>
                {char.photoUri ? (
                  <Image source={{ uri: char.photoUri }} style={styles.photo} />
                ) : (
                  <View style={styles.photoSlot}>
                    <Text style={styles.cameraText}>📷</Text>
                  </View>
                )}
              </Pressable>
              <View style={styles.avatarOptions}>
                {["👩", "👨", "🧑", "👧", "👴"].map((item) => (
                  <Pressable
                    key={item}
                    style={[
                      styles.avatarOption,
                      char.avatar === item && styles.avatarOptionActive,
                    ]}
                    onPress={() => updateCharacter(index, "avatar", item)}
                  >
                    <Text style={styles.avatarOptionText}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <TextInput
              value={char.name}
              onChangeText={(v) => updateCharacter(index, "name", v)}
              placeholder="이름 (예: 바리스타)"
              style={styles.input}
            />
            <TextInput
              value={char.trait}
              onChangeText={(v) => updateCharacter(index, "trait", v)}
              placeholder="성격 / 특징 (선택)"
              style={styles.input}
            />
          </View>
        ))}

        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            부적절한 상황 설정은 자동으로 제한됩니다
          </Text>
        </View>

        <PrimaryButton
          label={loading ? "방을 생성하는 중..." : "대화 시작하기"}
          onPress={start}
        />
      </ScrollView>
    </View>
  );
}

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

  const [messages, setMessages] = useState<Message[]>([]);
  const [latestAiText, setLatestAiText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  const [recording, setRecording] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);

  // ⭐️ 1-1. 스크랩 상태 관리용 Set 추가
  const [scrapedKeys, setScrapedKeys] = useState<Set<string>>(new Set());

  const [scrapIdMap, setScrapIdMap] = useState<Record<string, number>>({});

  // ⭐️ 1-2. 스크랩 API 통신 함수 수정 (토글 기능 적용)
  const handleScrap = async (key: string, entry: Record<string, any>) => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const API_URL = "https://rundown-irrigate-majesty.ngrok-free.dev";

      // ⭐️ 1. 이미 스크랩된 상태라면? -> 스크랩 취소 (DELETE)
      if (scrapedKeys.has(key)) {
        const targetScrapId = scrapIdMap[key]; // 저장해둔 scrapId 꺼내기

        if (!targetScrapId) {
          console.warn(
            "🚨 삭제할 scrapId를 찾을 수 없습니다! (화면 새로고침 후 다시 시도)",
          );
          return;
        }

        // 백엔드로 DELETE API 요청 (scrapId 포함)
        await axios.delete(`${API_URL}/api/scraps/${targetScrapId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        });

        // 삭제 성공 시, 화면(UI) 업데이트 및 ID 목록에서 제거
        setScrapedKeys((prev) => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        setScrapIdMap((prev) => {
          const newMap = { ...prev };
          delete newMap[key];
          return newMap;
        });

        console.log("❎ 스크랩 취소 완료! 삭제된 scrapId:", targetScrapId);
        return; // 취소 로직 끝!
      }

      // ⭐️ 2. 아직 스크랩 안 된 상태라면? -> 스크랩 추가 (POST)
      const payload = {
        feedbackId: entry.feedbackId || null,
        roomId: entry.roomId || null,
        expression: entry.expression,
        context: entry.context || "",
        category: entry.category,
      };

      const res = await axios.post(`${API_URL}/api/scraps`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      // 백엔드 응답에서 scrapId 쏙 뽑아오기
      const newScrapId = res.data?.data?.scrapId;

      if (newScrapId) {
        // 성공 시 화면에 노란불 켜고, 새로 발급받은 scrapId 짝지어 저장하기!
        setScrapedKeys((prev) => new Set(prev).add(key));
        setScrapIdMap((prev) => ({ ...prev, [key]: newScrapId }));

        console.log("✅ 스크랩 저장 성공! 발급된 scrapId:", newScrapId);
      }
    } catch (error: any) {
      console.error(
        "🚨 스크랩 처리 실패:",
        error.response?.data || error.message,
      );
    }
  };

  // 🎙️ 마이크 펄스 링 애니메이션 (녹음 중 반복 확대/축소)
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isRecording) {
      micPulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulseAnim, {
          toValue: 1.3,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(micPulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isRecording, micPulseAnim]);

  // 🟢 통화 중 라이브 점 깜빡임 애니메이션
  const liveDotAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!inCall) {
      liveDotAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(liveDotAnim, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(liveDotAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [inCall, liveDotAnim]);

  // ⭐️ 1. 방에 처음 들어왔을 때는 '과거 대화 기록'만 불러오고 가만히 대기합니다.
  useEffect(() => {
    const fetchHistoryOnly = async () => {
      if (isTestMode) {
        // ... (테스트 모드 유지) ...
        return;
      }

      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        const API_URL = "https://rundown-irrigate-majesty.ngrok-free.dev";
        const currentRoomId = room.id;

        // ⭐️ 스크랩 내역과 메시지 내역 동시 호출!
        const [historyRes, scrapsRes] = await Promise.all([
          axios.get(`${API_URL}/api/rooms/${currentRoomId}/messages`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "ngrok-skip-browser-warning": "true",
            },
          }),
          axios.get(`${API_URL}/api/scraps?roomId=${currentRoomId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "ngrok-skip-browser-warning": "true",
            },
          }),
        ]);

        const pastMessages = historyRes.data?.data || historyRes.data || [];
        const scraps = scrapsRes.data?.data || scrapsRes.data || [];

        if (pastMessages.length > 0) {
          const loadedScrapedKeys = new Set<string>();

          const formattedHistory = pastMessages.map((msg: any, idx: number) => {
            // --- 피드백 파싱 ---
            let parsedFeedback = undefined;
            if (msg.feedback) {
              const rawFeedback =
                typeof msg.feedback === "string"
                  ? JSON.parse(msg.feedback)
                  : msg.feedback;
              parsedFeedback = Array.isArray(rawFeedback)
                ? rawFeedback
                : [rawFeedback];
            }

            // --- AI 메시지 매칭 ---
            if (msg.senderType === "AI") {
              // ⭐️ some 대신 find를 써서 스크랩 데이터를 통째로 가져옵니다!
              const matchedAiScrap = scraps.find(
                (s: any) => !s.feedbackId && s.expression === msg.contentText,
              );

              // 매칭된 스크랩 내역이 있다면?
              if (matchedAiScrap) {
                const aiScrapKey = `${msg.id?.toString() || idx}-ai`;

                // 1. 화면에 노란불 켜기
                loadedScrapedKeys.add(aiScrapKey);

                // 2. 나중에 취소(DELETE)할 때를 대비해 scrapId 저장하기!
                setScrapIdMap((prev) => ({
                  ...prev,
                  [aiScrapKey]: matchedAiScrap.scrapId,
                }));
              }
            }

            // --- 사용자 피드백 매칭 ---
            if (msg.senderType === "USER" && parsedFeedback) {
              parsedFeedback.forEach((item: any, index: number) => {
                const currentFeedbackId = item.id;
                if (!currentFeedbackId) return;

                const myScraps = scraps.filter(
                  (s: any) => s.feedbackId === currentFeedbackId,
                );

                if (myScraps.length > 0) {
                  // ⭐️ 2. [추천 문장] 매칭 (여기가 수정된 부분입니다!)
                  const matchedScrap = myScraps.find(
                    (s: any) => s.expression === item.perfectSentence,
                  );

                  if (matchedScrap) {
                    const perfectKey = `${msg.id?.toString() || idx}-${index}-perfect`;
                    loadedScrapedKeys.add(perfectKey);

                    // 추가: 나중에 취소(DELETE)할 때를 대비해 scrapId 저장
                    setScrapIdMap((prev) => ({
                      ...prev,
                      [perfectKey]: matchedScrap.scrapId,
                    }));
                  }

                  const matchErrorList = (errorData: any, suffix: string) => {
                    if (!errorData || errorData === "[]") return;
                    try {
                      const errors =
                        typeof errorData === "string"
                          ? JSON.parse(errorData)
                          : errorData;

                      errors.forEach((err: any, errIndex: number) => {
                        const targetExpression =
                          err.corrected || err.original || err.text || "";

                        // ⭐️ 여기도 some 대신 find로 매칭된 데이터를 가져옵니다.
                        const matchedErrScrap = myScraps.find(
                          (s: any) => s.expression === targetExpression,
                        );

                        if (matchedErrScrap) {
                          const errKey = `${msg.id?.toString() || idx}-${index}-${suffix}-${errIndex}`;
                          loadedScrapedKeys.add(errKey); // 노란불 켜기

                          // ⭐️ scrapId 저장하기
                          setScrapIdMap((prev) => ({
                            ...prev,
                            [errKey]: matchedErrScrap.scrapId,
                          }));
                        }
                      });
                    } catch (e) {
                      console.error("오류 목록 파싱 에러:", e);
                    }
                  };

                  matchErrorList(item.wordErrors, "word");
                  matchErrorList(item.grammarErrors, "grammar");
                  matchErrorList(item.expressionErrors, "expr");
                }
              });
            }

            return {
              id: msg.id?.toString() || `history-${idx}`,
              speaker: msg.senderType === "USER" ? "user" : "ai",
              text: msg.contentText || "",
              time: msg.createdAt ? msg.createdAt.substring(11, 16) : "이전",
              feedback: parsedFeedback,
            };
          });

          setMessages(formattedHistory);
          setScrapedKeys(loadedScrapedKeys); // ⭐️ 스크랩 세팅

          const lastAiMsg = [...formattedHistory]
            .reverse()
            .find((m: any) => m.speaker === "ai");
          if (lastAiMsg) setLatestAiText(lastAiMsg.text);
        }
      } catch (error: any) {
        console.error(
          "🚨 음성방 기록 불러오기 실패:",
          error.response?.data || error.message,
        );
      }
    };

    if (room?.id) fetchHistoryOnly();
  }, [room?.id]);

  // ⭐️ 2. 사용자가 '시작' 버튼을 눌렀을 때만 실행되는 AI 인사말 호출 함수
  const handleStartCall = async () => {
    // 만약 이미 통화 중(inCall)이었다가 종료하는 거라면 통화만 끔
    if (inCall) {
      setInCall(false);
      return;
    }

    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const API_URL = "https://rundown-irrigate-majesty.ngrok-free.dev";
      const currentRoomId = room.id;

      // 통화 시작 상태로 변경
      setInCall(true);

      const enterRes = await axios.post(
        `${API_URL}/api/rooms/${currentRoomId}/enter`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      const aiText = enterRes.data?.data?.aiText || enterRes.data?.aiText;
      const audioUrl = enterRes.data?.data?.audioUrl || enterRes.data?.audioUrl;

      if (aiText) {
        const aiMessage: Message = {
          id: Date.now().toString(),
          speaker: "ai",
          text: aiText,
          time: new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setMessages((prev) => [...prev, aiMessage]);
        setLatestAiText(aiText);
      }

      if (audioUrl) {
        await playAudio(audioUrl);
      }
    } catch (error: any) {
      console.error(
        "🚨 통화 시작(입장) 실패:",
        error.response?.data || error.message,
      );
      setInCall(false); // 실패 시 다시 버튼 원복
    }
  };

  const playAudio = async (url: string) => {
    try {
      setIsPlaying(true);
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error("🚨 오디오 재생 실패:", error);
      setIsPlaying(false);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("권한 필요", "마이크 접근 권한을 허용해 주세요.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error("🚨 녹음 시작 실패:", err);
    }
  };

  const stopRecordingAndSend = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        await sendVoiceToServer(uri);
      }
    } catch (err) {
      console.error("🚨 녹음 종료 실패:", err);
    }
  };

  const sendVoiceToServer = async (fileUri: string) => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const API_URL = "https://rundown-irrigate-majesty.ngrok-free.dev";

      const formData = new FormData();
      formData.append("file", {
        uri: fileUri,
        type: "audio/m4a",
        name: "my_voice.m4a",
      } as any);

      const response = await axios.post(
        `${API_URL}/api/rooms/${room.id}/messages/voice`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      const responseData = response.data?.data || response.data;

      const userText = responseData?.userText || responseData?.content;
      const aiText = responseData?.aiText;
      const audioUrl = responseData?.audioUrl;
      const rawFeedback = responseData?.feedback;

      const newMessages: Message[] = [];

      if (userText) {
        let parsedFeedback = undefined;
        if (rawFeedback) {
          parsedFeedback = Array.isArray(rawFeedback)
            ? rawFeedback
            : [rawFeedback];
        }

        newMessages.push({
          id: Date.now().toString() + "-user",
          speaker: "user",
          text: userText,
          time: new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          feedback: parsedFeedback,
        });
      }

      if (aiText) {
        setLatestAiText(aiText);
        newMessages.push({
          id: Date.now().toString() + "-ai",
          speaker: "ai",
          text: aiText,
          time: new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      }

      if (newMessages.length > 0) {
        setMessages((prev) => [...prev, ...newMessages]);
      }

      if (audioUrl) {
        await playAudio(audioUrl);
      }
    } catch (error: any) {
      console.error(
        "🚨 음성 전송 실패:",
        error.response?.data || error.message,
      );
      Alert.alert("오류", "메시지를 전송하지 못했습니다.");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff", // 👈 헤더 색상과 맞춤
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 24,
      }}
    >
      <Header title={room.title} go={go} backTo="voiceRooms" />
      <TabBar
        active={tab}
        setActive={setTab}
        labels={{ call: "통화", history: "대화내역" }}
      />
      {tab === "call" && (
        <View style={styles.callBody}>
          <View style={styles.callFeedbackSlot}>
            {inCall &&
              [...messages]
                .reverse()
                .find((m) => m.speaker === "user" && m.feedback)
                ?.feedback?.map((item: any, index: number) => (
                  <View key={index} style={styles.feedbackCard}>
                    {renderFeedbackSection("단어 오류", item.wordErrors, "💡")}
                    {renderFeedbackSection(
                      "문법 오류",
                      item.grammarErrors,
                      "💡",
                    )}
                    {renderFeedbackSection(
                      "어색한 표현",
                      item.expressionErrors,
                      "💡",
                    )}

                    {item.perfectSentence &&
                      item.perfectSentence.trim() !== "[]" && (
                        <View style={styles.feedbackPerfectBlock}>
                          <Text style={styles.feedbackPerfectLabel}>
                            ✨ 추천 문장
                          </Text>
                          <Text style={styles.feedbackPerfectText}>
                            {item.perfectSentence}
                          </Text>
                        </View>
                      )}
                  </View>
                ))}
          </View>
          <View style={styles.avatarRingOuter}>
            <View style={[styles.avatarLarge, inCall && styles.avatarActive]}>
              <Text style={styles.avatarEmoji}>{isPlaying ? "🎵" : "🤖"}</Text>
            </View>
          </View>
          <Text style={styles.h2}>AI 파트너</Text>
          <View style={styles.callStatusRow}>
            {inCall && (
              <Animated.View
                style={[styles.liveDot, { opacity: liveDotAnim }]}
              />
            )}
            <Text style={styles.muted}>
              {inCall ? "통화 중입니다" : "통화를 시작해 보세요"}
            </Text>
          </View>

          {inCall && latestAiText ? (
            <View style={styles.subtitleBox}>
              <View style={styles.subtitleChip}>
                <Text style={styles.subtitleChipText}>AI</Text>
              </View>
              <Text style={styles.subtitleText}>{latestAiText}</Text>
            </View>
          ) : null}

          <View style={styles.controlRow}>
            {inCall && (
              <View style={styles.micWrap}>
                {isRecording && (
                  <Animated.View
                    style={[
                      styles.micPulseRing,
                      { transform: [{ scale: micPulseAnim }] },
                    ]}
                  />
                )}
                <Pressable
                  style={[
                    styles.roundButton,
                    isRecording && styles.roundButtonActive,
                  ]}
                  onPress={isRecording ? stopRecordingAndSend : startRecording}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24">
                    <Path
                      d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"
                      stroke={isRecording ? primary : "#6B7280"}
                      strokeWidth={2}
                      fill="none"
                    />
                    <Path
                      d="M19 11a7 7 0 0 1-14 0M12 18v3"
                      stroke={isRecording ? primary : "#6B7280"}
                      strokeWidth={2}
                      fill="none"
                    />
                  </Svg>
                </Pressable>
              </View>
            )}
            {/* ⭐️ 시작 버튼을 누를 때만 handleStartCall이 실행되도록 연결! */}
            <Pressable
              style={[styles.callButton, inCall && styles.endCallButton]}
              onPress={handleStartCall}
            >
              <Svg
                width={22}
                height={22}
                viewBox="0 0 24 24"
                style={inCall ? styles.endCallIcon : undefined}
              >
                <Path
                  d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"
                  fill="#fff"
                />
              </Svg>
            </Pressable>
          </View>
          {isRecording && (
            <View style={styles.listeningRow}>
              <View style={styles.listeningDot} />
              <Text style={styles.listeningText}>듣고 있어요...</Text>
            </View>
          )}
        </View>
      )}
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

                {/* 🔖 AI 말풍선용 스크랩 버튼 */}
                {!isUser && (
                  <Pressable
                    // ⭐️ 스크랩 여부에 따라 스타일만 바꿔줍니다.
                    style={
                      isAiScraped ? styles.aiScrapBadge : styles.aiScrapButton
                    }
                    onPress={() =>
                      handleScrap(aiScrapKey, {
                        roomId: room.id,
                        expression: msg.text,
                        context: "",
                        category: "EXPRESSION",
                      })
                    }
                  >
                    <BookmarkIcon
                      color={isAiScraped ? "#fff" : "#9CA3AF"}
                      size={11}
                      // ⭐️ 아이콘이 칠해지는 속성(filled)이 있다면 여기에 연결해줍니다.
                      filled={isAiScraped ? true : undefined}
                    />
                    <Text
                      style={
                        isAiScraped
                          ? styles.aiScrapBadgeText
                          : styles.aiScrapText
                      }
                    >
                      {isAiScraped ? "스크랩됨" : "스크랩"}
                    </Text>
                  </Pressable>
                )}

                {/* ⭐️ 피드백 박스 (내가 보낸 메시지 밑에만) */}
                {isUser &&
                  msg.feedback &&
                  msg.feedback.map((item: any, index: number) => {
                    const perfectKey = `${msgId}-${index}-perfect`;
                    const isPerfectScraped = scrapedKeys.has(perfectKey);

                    const makeScrapCtx = (suffix: string) => ({
                      keyPrefix: `${msgId}-${index}-${suffix}`,
                      isScraped: (key: string) => scrapedKeys.has(key),
                      onScrap: (key: string, entry: Record<string, any>) => {
                        let mappedCategory = "EXPRESSION";
                        if (entry.category === "단어 오류" || suffix === "word")
                          mappedCategory = "WORD";
                        if (
                          entry.category === "문법 오류" ||
                          suffix === "grammar"
                        )
                          mappedCategory = "GRAMMAR";
                        if (
                          entry.category === "어색한 표현" ||
                          suffix === "expr"
                        )
                          mappedCategory = "EXPRESSION";

                        handleScrap(key, {
                          feedbackId: item.id,
                          expression:
                            entry.expression ||
                            entry.corrected ||
                            entry.text ||
                            entry.original ||
                            "",
                          context: msg.text,
                          category: mappedCategory,
                        });
                      },
                    });

                    return (
                      <View
                        key={index}
                        style={{
                          marginTop: 8,
                          backgroundColor: "#FFF9C4",
                          padding: 16,
                          borderRadius: 16,
                          width: "85%",
                          gap: 12,
                        }}
                      >
                        {renderFeedbackSection(
                          "단어 오류",
                          item.wordErrors,
                          "💡",
                          makeScrapCtx("word"),
                        )}
                        {renderFeedbackSection(
                          "문법 오류",
                          item.grammarErrors,
                          "💡",
                          makeScrapCtx("grammar"),
                        )}
                        {renderFeedbackSection(
                          "어색한 표현",
                          item.expressionErrors,
                          "💡",
                          makeScrapCtx("expr"),
                        )}

                        {item.perfectSentence &&
                          item.perfectSentence.trim() !== "[]" && (
                            <View
                              style={{
                                paddingTop: 12,
                                borderTopWidth: 1,
                                borderColor: "#E0E0E0",
                              }}
                            >
                              <Text
                                style={{
                                  fontWeight: "bold",
                                  color: "#333",
                                  marginBottom: 4,
                                }}
                              >
                                ✨ 추천 문장
                              </Text>
                              <Text
                                style={{
                                  fontSize: 15,
                                  color: "#1976D2",
                                  fontWeight: "600",
                                  marginBottom: 8,
                                }}
                              >
                                {item.perfectSentence}
                              </Text>
                              <Pressable
                                style={[
                                  styles.scrapButton,
                                  { alignSelf: "flex-end" },
                                  isPerfectScraped && styles.scrapButtonActive,
                                ]}
                                disabled={isPerfectScraped}
                                onPress={() =>
                                  handleScrap(perfectKey, {
                                    feedbackId: item.id,
                                    expression: item.perfectSentence,
                                    context: msg.text,
                                    category: "EXPRESSION",
                                  })
                                }
                              >
                                <BookmarkIcon
                                  color="#8A6D00"
                                  size={12}
                                  filled={isPerfectScraped}
                                />
                                <Text style={styles.scrapButtonText}>
                                  {isPerfectScraped ? "스크랩됨" : "스크랩"}
                                </Text>
                              </Pressable>
                            </View>
                          )}
                      </View>
                    );
                  })}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

// ⭐️ 1. 괄호([]) 찌꺼기를 없애고 예쁜 디자인을 입혀주는 도우미 함수 (컴포넌트 밖에 선언)
type ScrapContext = {
  keyPrefix: string;
  isScraped: (key: string) => boolean;
  onScrap: (key: string, entry: Record<string, any>) => void;
};

const renderFeedbackSection = (
  title: string,
  jsonString: string | any[] | null | undefined,
  icon: string,
  scrapCtx?: ScrapContext,
) => {
  if (
    !jsonString ||
    jsonString === "[]" ||
    jsonString.toString().trim() === "[]"
  )
    return null;

  try {
    // ⭐️ [추가] 만약 데이터가 이미 배열(Array) 형태로 예쁘게 파싱되어 들어왔다면 JSON.parse를 건너뜁니다!
    const parsedData = Array.isArray(jsonString)
      ? jsonString
      : typeof jsonString === "string"
        ? JSON.parse(jsonString)
        : [jsonString]; // 문자열도 객체도 아니라면 배열로 감싸서 방어

    if (!Array.isArray(parsedData) || parsedData.length === 0) return null;

    return (
      <View>
        <Text style={{ fontWeight: "bold", marginBottom: 4, color: "#333" }}>
          {icon} {title}
        </Text>
        {parsedData.map((errorItem: any, index: number) => {
          const itemKey = `${scrapCtx?.keyPrefix}-${index}`;
          const isScraped = scrapCtx?.isScraped(itemKey) ?? false;
          return (
            <View
              key={index}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.6)", // 살짝 투명한 흰색 박스
                padding: 10,
                borderRadius: 8,
                marginBottom: 6,
              }}
            >
              <Text style={{ fontSize: 15, marginBottom: 4 }}>
                <Text
                  style={{
                    textDecorationLine: "line-through",
                    color: "#ff5252",
                  }}
                >
                  {errorItem.original}
                </Text>{" "}
                ➡️{" "}
                <Text style={{ color: "#4caf50", fontWeight: "bold" }}>
                  {errorItem.suggested || errorItem.corrected}
                </Text>
              </Text>
              <Text style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                {errorItem.explanation}
              </Text>
              {scrapCtx && (
                <Pressable
                  style={[
                    styles.scrapButton,
                    { alignSelf: "flex-end", marginTop: 8 },
                    isScraped && styles.scrapButtonActive,
                  ]}
                  onPress={() =>
                    scrapCtx.onScrap(itemKey, {
                      source: "user",
                      category: title,
                      original: errorItem.original,
                      corrected: errorItem.suggested || errorItem.corrected,
                      explanation: errorItem.explanation,
                    })
                  }
                >
                  <BookmarkIcon color="#8A6D00" size={11} filled={isScraped} />
                  <Text style={styles.scrapButtonText}>
                    {isScraped ? "스크랩됨" : "스크랩"}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    );
  } catch (error) {
    return (
      <View>
        <Text style={{ fontWeight: "bold", marginBottom: 4, color: "#333" }}>
          {icon} {title}
        </Text>
        <Text style={{ fontSize: 14, color: "#333" }}>{jsonString}</Text>
      </View>
    );
  }
};

export function TextChatScreen({
  room,
  go,
  scrapNavTarget,
  onConsumeScrapNavTarget,
}: {
  room: { id: string | number; title: string };
  go: (screen: any) => void;
  scrapNavTarget?: { feedbackId: number | null; expression: string } | null;
  onConsumeScrapNavTarget?: () => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]); // Message 타입 대체
  const [scrapedKeys, setScrapedKeys] = useState<Set<string>>(new Set());
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const bubbleYRef = useRef<Record<string, number>>({});
  const [layoutTick, setLayoutTick] = useState(0);
  const hasScrolledToHighlightRef = useRef(false);

  const handleScrap = async (key: string, entry: Record<string, any>) => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const API_URL = "https://rundown-irrigate-majesty.ngrok-free.dev";

      // ⭐️ 1. 이미 스크랩된 상태라면? -> 스크랩 취소 (DELETE)
      if (scrapedKeys.has(key)) {
        // [백엔드 연동 주의사항]
        // 나중에 백엔드 팀원분이 '스크랩 취소 API(보통 DELETE 메서드)'를 만들어주시면 여기에 연결해야 합니다!
        // 예: await axios.delete(`${API_URL}/api/scraps/${삭제할아이디}`, { headers: ... });

        // 일단 화면(UI)에서 스크랩 상태를 해제합니다.
        setScrapedKeys((prev) => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });

        console.log("❎ 스크랩 취소 성공:", key);
        return; // 취소 로직이 끝났으니 함수 종료
      }

      // ⭐️ 2. 아직 스크랩되지 않은 상태라면? -> 기존처럼 스크랩 추가 (POST)
      const payload = {
        feedbackId: entry.feedbackId || null,
        roomId: entry.roomId || null,
        expression: entry.expression,
        context: entry.context || "",
        category: entry.category,
      };

      console.log("👉 [요청 데이터]:", JSON.stringify(payload, null, 2));

      await axios.post(`${API_URL}/api/scraps`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      // 서버 저장이 성공하면 화면 상태 업데이트 (노란 불 켜기)
      setScrapedKeys((prev) => new Set(prev).add(key));
      console.log("✅ 스크랩 저장 성공:", payload);
    } catch (error: any) {
      console.error(
        "🚨 스크랩 처리 실패:",
        error.response?.data || error.message,
      );
    }
  };

  const requestInitialGreeting = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const API_URL = "https://rundown-irrigate-majesty.ngrok-free.dev";
      const payload = {
        content:
          "(시스템: 사용자가 방에 입장했습니다. 설정된 상황에 맞게 캐릭터에 완벽히 몰입해서 먼저 자연스럽게 영어로 대화를 시작해 주세요.)",
      };

      const response = await axios.post(
        `${API_URL}/api/rooms/${room.id}/messages/chat`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data) {
        const aiMessage = {
          id: `${Date.now()}-ai-init`,
          speaker: "ai",
          text: response.data.data?.content || "Hello!",
          time: new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages([aiMessage]);
      }
    } catch (error) {
      console.error("🚨 AI 첫인사 로딩 실패:", error);
    }
  };

  useEffect(() => {
    const fetchChatHistory = async () => {
      // 🧪 테스트 모드 (기존 동일)
      if (isTestMode) {
        setMessages(TEST_CHAT_MESSAGES);
        return;
      }

      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        const API_URL = "https://rundown-irrigate-majesty.ngrok-free.dev";

        // ⭐️ 1. Promise.all을 사용하여 두 API를 동시에(병렬로) 호출합니다! (속도 2배 향상)
        const [messagesRes, scrapsRes] = await Promise.all([
          axios.get(`${API_URL}/api/rooms/${room.id}/messages`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get(`${API_URL}/api/scraps?roomId=${room.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        const history = messagesRes.data?.data || messagesRes.data || [];
        const scraps = scrapsRes.data?.data || scrapsRes.data || [];

        // ⭐️ 바로 여기! 매칭 작업을 시작하기 전에 두 데이터가 어떻게 생겼는지 까봅시다!
        console.log("=========================================");
        console.log(
          "👀 1. 서버가 준 메시지(history) 데이터:",
          JSON.stringify(history, null, 2),
        );
        console.log(
          "👀 2. 서버가 준 스크랩(scraps) 데이터:",
          JSON.stringify(scraps, null, 2),
        );
        console.log("=========================================");

        if (history.length > 0) {
          // ⭐️ 2. 검색을 빠르게 하기 위해 스크랩된 feedbackId들을 Set으로 만들어 둡니다.
          // (예: 백엔드가 [{ feedbackId: 1 }, { feedbackId: 5 }] 형태로 준다고 가정)
          const scrapedFeedbackIds = new Set(
            scraps.map((scrap: any) => scrap.feedbackId).filter(Boolean),
          );

          // (선택) AI 메시지는 feedbackId가 아니라 messageId로 관리될 수 있으니 미리 빼둡니다.
          const scrapedMessageIds = new Set(
            scraps.map((scrap: any) => scrap.messageId).filter(Boolean),
          );

          const loadedScrapedKeys = new Set<string>();

          const formattedHistory = history
            .filter((msg: any) => !msg.contentText.includes("(시스템:"))
            .map((msg: any) => {
              // --- 피드백 파싱 (기존과 동일) ---
              let parsedFeedback = undefined;
              if (msg.feedback) {
                const rawFeedback =
                  typeof msg.feedback === "string"
                    ? JSON.parse(msg.feedback)
                    : msg.feedback;

                parsedFeedback = Array.isArray(rawFeedback)
                  ? rawFeedback
                  : [rawFeedback];
              }

              // ⭐️ 3. 백엔드에서 받은 스크랩 목록과 현재 메시지를 "매칭" 합니다!

              // [AI 메시지 매칭]
              // 스크랩 목록 중에서, 피드백 ID가 없고(null) 문장이 똑같은 게 있다면 그게 바로 AI 스크랩!
              if (msg.senderType === "AI") {
                const isAiScraped = scraps.some(
                  (s: any) => !s.feedbackId && s.expression === msg.contentText,
                );

                if (isAiScraped) {
                  loadedScrapedKeys.add(`${msg.id.toString()}-ai`);
                }
              }

              // [사용자 피드백 매칭]
              if (msg.senderType === "USER" && parsedFeedback) {
                parsedFeedback.forEach((item: any, index: number) => {
                  const currentFeedbackId = item.id;

                  if (!currentFeedbackId) return;

                  // ⭐️ 1. 이 피드백(ID)에 대해 백엔드에 저장된 스크랩 내역을 싹 다 가져옵니다.
                  const myScraps = scraps.filter(
                    (s: any) => s.feedbackId === currentFeedbackId,
                  );

                  if (myScraps.length > 0) {
                    // 2. [추천 문장] 매칭: 백엔드 스크랩 목록 중 추천 문장과 일치하는 게 있다면?
                    if (
                      myScraps.some(
                        (s: any) => s.expression === item.perfectSentence,
                      )
                    ) {
                      loadedScrapedKeys.add(
                        `${msg.id.toString()}-${index}-perfect`,
                      );
                    }

                    // 3. [단어/문법/표현 오류] 매칭 헬퍼 함수
                    const matchErrorList = (errorData: any, suffix: string) => {
                      if (!errorData || errorData === "[]") return;
                      try {
                        // 문자열로 온 JSON 파싱
                        const errors =
                          typeof errorData === "string"
                            ? JSON.parse(errorData)
                            : errorData;

                        errors.forEach((err: any, errIndex: number) => {
                          const targetExpression =
                            err.corrected || err.original || err.text || "";

                          // 스크랩된 표현이랑 이 오류의 표현이 똑같다면 불을 켭니다!
                          if (
                            myScraps.some(
                              (s: any) => s.expression === targetExpression,
                            )
                          ) {
                            // 컴포넌트에서 생성되는 Key 조합: 메시지ID-피드백인덱스-종류-에러인덱스
                            loadedScrapedKeys.add(
                              `${msg.id.toString()}-${index}-${suffix}-${errIndex}`,
                            );
                          }
                        });
                      } catch (e) {
                        console.error("오류 목록 파싱 에러:", e);
                      }
                    };

                    // 4. 각각의 오류 리스트를 돌면서 스크랩된 게 있는지 검사합니다.
                    matchErrorList(item.wordErrors, "word");
                    matchErrorList(item.grammarErrors, "grammar");
                    matchErrorList(item.expressionErrors, "expr");
                  }
                });
              }

              return {
                id: msg.id.toString(),
                speaker: msg.senderType === "AI" ? "ai" : "user",
                text: msg.contentText,
                time: new Date(msg.createdAt).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                feedback: parsedFeedback,
              };
            });

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
      } catch (error) {
        console.error("🚨 대화 내역 및 스크랩 불러오기 실패:", error);
      }
    };

    if (room?.id) fetchChatHistory();
  }, [room?.id]);

  useEffect(() => {
    hasScrolledToHighlightRef.current = false;
  }, [highlightedMessageId]);

  useEffect(() => {
    if (!highlightedMessageId || hasScrolledToHighlightRef.current) return;
    const y = bubbleYRef.current[highlightedMessageId];
    if (y == null) return;
    hasScrolledToHighlightRef.current = true;
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(y - 40, 0),
        animated: true,
      });
    });
  }, [highlightedMessageId, messages, layoutTick]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsgId = Date.now().toString();
    const userMessage = {
      id: userMsgId,
      speaker: "user",
      text,
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const API_URL = "https://rundown-irrigate-majesty.ngrok-free.dev";
      const response = await axios.post(
        `${API_URL}/api/rooms/${room.id}/messages/chat`,
        { content: text },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data) {
        const aiFeedback = response.data.data?.feedback;
        if (aiFeedback) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === userMsgId
                ? {
                    ...msg,
                    feedback: Array.isArray(aiFeedback)
                      ? aiFeedback
                      : [aiFeedback],
                  }
                : msg,
            ),
          );
        }

        const aiMessage = {
          id: `${Date.now()}-ai`,
          speaker: "ai",
          text: response.data.data?.content || "응답이 없습니다.",
          time: new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error: any) {
      console.error(
        "🚨 통신 에러 상세:",
        error.response?.data || error.message,
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      style={{
        flex: 1,
        backgroundColor: "#fff", // 👈 상단바/하단바 영역을 흰색(헤더 색)으로 통일
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 24,
      }} // styles.screen 대체
    >
      {<Header title={room.title} go={go} backTo="chatRooms" />}

      {/* ⭐️ 3. MessageList를 빼버리고 여기서 직접 채팅과 피드백을 그립니다! */}
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
                setLayoutTick((t) => t + 1);
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

              {/* 🔖 AI 말풍선용 스크랩 버튼 */}
              {!isUser && (
                <Pressable
                  // ⭐️ 스크랩 여부에 따라 배경 스타일만 바꿔줍니다!
                  style={
                    isAiScraped ? styles.aiScrapBadge : styles.aiScrapButton
                  }
                  onPress={() =>
                    handleScrap(aiScrapKey, {
                      roomId: room.id,
                      expression: msg.text,
                      context: "",
                      category: "EXPRESSION",
                    })
                  }
                >
                  <BookmarkIcon
                    color={isAiScraped ? "#fff" : "#9CA3AF"}
                    size={11}
                    // ⭐️ 스크랩 상태일 때만 아이콘 안을 채워줍니다!
                    filled={isAiScraped ? true : undefined}
                  />
                  <Text
                    style={
                      isAiScraped ? styles.aiScrapBadgeText : styles.aiScrapText
                    }
                  >
                    {isAiScraped ? "스크랩됨" : "스크랩"}
                  </Text>
                </Pressable>
              )}

              {/* ⭐️ 피드백 박스 (내가 보낸 메시지 밑에, feedback 데이터가 있을 때만 등장!) */}
              {isUser &&
                msg.feedback &&
                msg.feedback.map((item: any, index: number) => {
                  const hasPerfectSentence =
                    item.perfectSentence &&
                    item.perfectSentence.trim() !== "[]";

                  // ⭐️ 도우미 함수: 단어/문법/표현 오류 스크랩 버튼을 누를 때 데이터를 백엔드 양식으로 싹 바꿔줍니다!
                  const makeScrapCtx = (suffix: string): ScrapContext => ({
                    keyPrefix: `${msg.id}-${index}-${suffix}`,
                    isScraped: (key) => scrapedKeys.has(key),
                    onScrap: (key, entry) => {
                      // 1. 한국어 카테고리를 백엔드가 원하는 영어로 변환
                      let mappedCategory = "EXPRESSION";
                      if (entry.category === "단어 오류" || suffix === "word")
                        mappedCategory = "WORD";
                      if (
                        entry.category === "문법 오류" ||
                        suffix === "grammar"
                      )
                        mappedCategory = "GRAMMAR";
                      if (entry.category === "어색한 표현" || suffix === "expr")
                        mappedCategory = "EXPRESSION";

                      // 2. 스크랩할 표현(문장) 찾기
                      // (기존 컴포넌트가 text, original, corrected 등 어떤 이름으로 주든 다 잡아냅니다)
                      const targetExpression =
                        entry.expression ||
                        entry.corrected ||
                        entry.text ||
                        entry.original ||
                        "";

                      // 3. 완벽하게 조립해서 handleScrap으로 전달!
                      handleScrap(key, {
                        feedbackId: item.id, // 👈 우리가 찾아낸 피드백 ID!
                        expression: targetExpression, // 👈 스크랩할 교정된 문장
                        context: msg.text, // 👈 원래 내가 했던 말
                        category: mappedCategory, // 👈 WORD, GRAMMAR, EXPRESSION 중 하나
                      });
                    },
                  });
                  const msgId = msg.id || Math.random().toString(); // 혹시 id가 없을 때를 대비한 안전 장치
                  const perfectKey = `${msgId}-${index}-perfect`;
                  const isPerfectScraped = scrapedKeys.has(perfectKey);

                  return (
                    <View
                      key={index}
                      style={{
                        marginTop: 8,
                        backgroundColor: "#FFF9C4", // 연한 노란색
                        padding: 16,
                        borderRadius: 16,
                        width: "85%", // 피드백 박스 크기
                        gap: 12,
                      }}
                    >
                      {renderFeedbackSection(
                        "단어 오류",
                        item.wordErrors,
                        "💡",
                        makeScrapCtx("word"),
                      )}
                      {renderFeedbackSection(
                        "문법 오류",
                        item.grammarErrors,
                        "💡",
                        makeScrapCtx("grammar"),
                      )}
                      {renderFeedbackSection(
                        "어색한 표현",
                        item.expressionErrors,
                        "💡",
                        makeScrapCtx("expr"),
                      )}

                      {hasPerfectSentence && (
                        <View
                          style={{
                            paddingTop: 12,
                            borderTopWidth: 1,
                            borderColor: "#E0E0E0",
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: "bold",
                              color: "#333",
                              marginBottom: 4,
                            }}
                          >
                            ✨ 추천 문장
                          </Text>
                          <Text
                            style={{
                              fontSize: 15,
                              color: "#1976D2",
                              fontWeight: "600",
                              marginBottom: 8,
                            }}
                          >
                            {item.perfectSentence}
                          </Text>
                          <Pressable
                            style={[
                              styles.scrapButton,
                              { alignSelf: "flex-end" },
                              isPerfectScraped && styles.scrapButtonActive,
                            ]}
                            disabled={isPerfectScraped}
                            onPress={() =>
                              handleScrap(perfectKey, {
                                feedbackId: item.id, // 👈 1. 해당 피드백의 고유 ID
                                expression: item.perfectSentence, // 👈 2. 스크랩할 문장
                                context: msg.text, // 👈 3. 원래 내가 했던 말 (선택)
                                category: "EXPRESSION", // 👈 4. 카테고리 (필수)
                              })
                            }
                          >
                            <BookmarkIcon
                              color="#8A6D00"
                              size={12}
                              filled={isPerfectScraped}
                            />
                            <Text style={styles.scrapButtonText}>
                              {isPerfectScraped ? "스크랩됨" : "스크랩"}
                            </Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })}
            </View>
          );
        })}
      </ScrollView>

      {/* 입력창 (기존 styles.composer 적용 부분을 인라인으로 합쳤습니다) */}
      <View
        style={{
          flexDirection: "row",
          padding: 12,
          backgroundColor: "#fff",
          alignItems: "center",
          borderTopWidth: 1,
          borderColor: "#eee",
        }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="메시지를 입력하세요"
          style={{
            flex: 1,
            backgroundColor: "#f5f5f5",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 20,
            fontSize: 16,
          }}
        />
        <Pressable
          style={{
            marginLeft: 10,
            backgroundColor: input.trim() ? "#5C6BC0" : "#ccc",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 20,
          }}
          onPress={send}
          disabled={!input.trim()}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>전송</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function FindAccountScreen({ go }: { go: (screen: Screen) => void }) {
  const [tab, setTab] = useState<"findId" | "resetPassword">("findId");

  const [findIdEmail, setFindIdEmail] = useState("");
  const [findIdLoading, setFindIdLoading] = useState(false);
  const [foundLoginId, setFoundLoginId] = useState<string | null>(null);

  const handleFindId = async () => {
    if (!findIdEmail.trim()) {
      Alert.alert("입력 확인", "이메일을 입력해주세요.");
      return;
    }
    setFindIdLoading(true);
    setFoundLoginId(null);
    try {
      const { ok, data } = await authPost("/api/auth/find-id", {
        email: findIdEmail,
      });
      if (ok && data?.success) {
        setFoundLoginId(data.data?.loginId ?? data.data ?? null);
      } else {
        Alert.alert(
          "조회 실패",
          data?.message ?? "가입된 이메일을 찾을 수 없습니다.",
        );
      }
    } catch (e) {
      Alert.alert("연결 실패", "서버와 연결할 수 없습니다.");
      console.error("아이디 찾기 에러:", e);
    } finally {
      setFindIdLoading(false);
    }
  };

  const [rpEmail, setRpEmail] = useState("");
  const [rpCodeSent, setRpCodeSent] = useState(false);
  const [rpCode, setRpCode] = useState("");
  const [rpVerified, setRpVerified] = useState(false);
  const [rpNewPassword, setRpNewPassword] = useState("");
  const [rpConfirmPassword, setRpConfirmPassword] = useState("");
  const [rpSendingCode, setRpSendingCode] = useState(false);
  const [rpVerifyingCode, setRpVerifyingCode] = useState(false);
  const [rpResetting, setRpResetting] = useState(false);

  const handleRpEmailChange = (value: string) => {
    setRpEmail(value);
    setRpCodeSent(false);
    setRpVerified(false);
    setRpCode("");
  };

  const handleSendResetCode = async () => {
    if (!rpEmail.trim()) {
      Alert.alert("입력 확인", "이메일을 입력해주세요.");
      return;
    }
    setRpSendingCode(true);
    try {
      const { ok, data } = await authPost("/api/auth/password/reset-request", {
        email: rpEmail,
      });
      if (ok && data?.success) {
        setRpCodeSent(true);
        Alert.alert("인증번호 발송", "인증번호가 이메일로 발송되었습니다.");
      } else {
        Alert.alert(
          "발송 실패",
          data?.message ?? "인증번호 발송에 실패했습니다.",
        );
      }
    } catch (e) {
      Alert.alert("연결 실패", "서버와 연결할 수 없습니다.");
      console.error("비밀번호 재설정 코드 발송 에러:", e);
    } finally {
      setRpSendingCode(false);
    }
  };

  const handleVerifyResetCode = async () => {
    if (!rpCode.trim()) {
      Alert.alert("입력 확인", "인증번호를 입력해주세요.");
      return;
    }
    setRpVerifyingCode(true);
    try {
      const { ok, data } = await authPost("/api/auth/password/verify-code", {
        email: rpEmail,
        code: rpCode,
      });
      if (ok && data?.success) {
        setRpVerified(true);
      } else {
        Alert.alert(
          "인증 실패",
          data?.message ?? "인증번호가 일치하지 않습니다.",
        );
      }
    } catch (e) {
      Alert.alert("연결 실패", "서버와 연결할 수 없습니다.");
      console.error("비밀번호 재설정 코드 확인 에러:", e);
    } finally {
      setRpVerifyingCode(false);
    }
  };

  const handleResetPassword = async () => {
    if (!rpNewPassword || !rpConfirmPassword) {
      Alert.alert("입력 확인", "새 비밀번호를 입력해주세요.");
      return;
    }
    if (rpNewPassword.length < 8) {
      Alert.alert("비밀번호 확인", "비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (rpNewPassword !== rpConfirmPassword) {
      Alert.alert("비밀번호 확인", "비밀번호가 일치하지 않습니다.");
      return;
    }
    setRpResetting(true);
    try {
      const { ok, data } = await authPost("/api/auth/password/reset", {
        email: rpEmail,
        code: rpCode,
        newPassword: rpNewPassword,
      });
      if (ok && data?.success) {
        Alert.alert(
          "재설정 완료",
          "비밀번호가 변경되었습니다. 로그인해주세요.",
        );
        go("login");
      } else {
        Alert.alert(
          "재설정 실패",
          data?.message ?? "비밀번호 재설정에 실패했습니다.",
        );
      }
    } catch (e) {
      Alert.alert("연결 실패", "서버와 연결할 수 없습니다.");
      console.error("비밀번호 재설정 에러:", e);
    } finally {
      setRpResetting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <Header title="계정 찾기" go={go} backTo="login" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.findAccountTabRow}>
          <Pressable
            style={[
              styles.findAccountTabButton,
              tab === "findId" && styles.findAccountTabButtonActive,
            ]}
            onPress={() => setTab("findId")}
          >
            <Text
              style={[
                styles.findAccountTabText,
                tab === "findId" && styles.findAccountTabTextActive,
              ]}
            >
              아이디 찾기
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.findAccountTabButton,
              tab === "resetPassword" && styles.findAccountTabButtonActive,
            ]}
            onPress={() => setTab("resetPassword")}
          >
            <Text
              style={[
                styles.findAccountTabText,
                tab === "resetPassword" && styles.findAccountTabTextActive,
              ]}
            >
              비밀번호 재설정
            </Text>
          </Pressable>
        </View>

        {tab === "findId" ? (
          <>
            <Text style={styles.mutedBlock}>
              가입할 때 사용한 이메일을 입력하면 아이디를 알려드려요.
            </Text>
            <Label text="이메일" />
            <TextInput
              value={findIdEmail}
              onChangeText={(v) => {
                setFindIdEmail(v);
                setFoundLoginId(null);
              }}
              placeholder="email@example.com"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {foundLoginId && (
              <Text style={styles.signupSuccessText}>
                ✓ 가입된 아이디: {foundLoginId}
              </Text>
            )}
            <Pressable
              style={[
                styles.primaryButton,
                { marginTop: 20 },
                !foundLoginId &&
                  (!findIdEmail.trim() || findIdLoading) && { opacity: 0.6 },
              ]}
              onPress={foundLoginId ? () => go("login") : handleFindId}
              disabled={!foundLoginId && (!findIdEmail.trim() || findIdLoading)}
            >
              <Text style={styles.primaryButtonText}>
                {foundLoginId
                  ? "로그인 화면으로 이동"
                  : findIdLoading
                    ? "조회 중..."
                    : "아이디 찾기"}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.mutedBlock}>
              가입한 이메일로 인증번호를 받아 비밀번호를 재설정하세요.
            </Text>
            <Label text="이메일" />
            <View style={styles.signupInlineRow}>
              <TextInput
                value={rpEmail}
                onChangeText={handleRpEmailChange}
                placeholder="email@example.com"
                style={[
                  styles.input,
                  styles.signupInlineInput,
                  rpVerified && { opacity: 0.6 },
                ]}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!rpVerified}
              />
              <Pressable
                style={[
                  styles.signupEmailButton,
                  (rpVerified || !rpEmail.trim() || rpSendingCode) && {
                    opacity: 0.5,
                  },
                ]}
                onPress={handleSendResetCode}
                disabled={rpVerified || !rpEmail.trim() || rpSendingCode}
              >
                <Text style={styles.signupEmailButtonText}>
                  {rpVerified
                    ? "완료"
                    : rpSendingCode
                      ? "발송 중..."
                      : rpCodeSent
                        ? "재발송"
                        : "인증"}
                </Text>
              </Pressable>
            </View>
            {rpVerified && (
              <Text style={styles.signupSuccessText}>✓ 인증 완료</Text>
            )}
            {rpCodeSent && !rpVerified && (
              <View style={[styles.signupInlineRow, { marginTop: 10 }]}>
                <TextInput
                  value={rpCode}
                  onChangeText={setRpCode}
                  placeholder="6자리 인증번호"
                  style={[styles.input, styles.signupInlineInput]}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Pressable
                  style={[
                    styles.signupEmailButton,
                    rpVerifyingCode && { opacity: 0.5 },
                  ]}
                  onPress={handleVerifyResetCode}
                  disabled={rpVerifyingCode}
                >
                  <Text style={styles.signupEmailButtonText}>
                    {rpVerifyingCode ? "확인 중..." : "확인"}
                  </Text>
                </Pressable>
              </View>
            )}

            {rpVerified && (
              <>
                <Label text="새 비밀번호" />
                <TextInput
                  value={rpNewPassword}
                  onChangeText={setRpNewPassword}
                  placeholder="8자 이상"
                  secureTextEntry
                  style={styles.input}
                />
                <Label text="새 비밀번호 확인" />
                <TextInput
                  value={rpConfirmPassword}
                  onChangeText={setRpConfirmPassword}
                  placeholder="비밀번호 재입력"
                  secureTextEntry
                  style={styles.input}
                />
                {rpConfirmPassword.length > 0 &&
                  rpNewPassword !== rpConfirmPassword && (
                    <Text style={styles.errorText}>
                      비밀번호가 일치하지 않습니다
                    </Text>
                  )}
                <Pressable
                  style={[
                    styles.primaryButton,
                    { marginTop: 20 },
                    rpResetting && { opacity: 0.6 },
                  ]}
                  onPress={handleResetPassword}
                  disabled={rpResetting}
                >
                  <Text style={styles.primaryButtonText}>
                    {rpResetting ? "변경 중..." : "비밀번호 재설정"}
                  </Text>
                </Pressable>
              </>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function NoticeScreen({ go }: { go: (screen: Screen) => void }) {
  // ⭐️ 1. 기존의 interface Notice는 그대로 두셔도 되고, 서버 데이터 형식에 맞게 쓰셔도 됩니다.
  interface Notice {
    id: number; // announcementId -> id 로 변경
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string; // (선택) 서버에서 주니까 추가해 두면 좋습니다.
    pinned: boolean; // isPinned -> pinned 로 변경
  }

  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  // ⭐️ 2. 더미 배열 대신 서버에서 가져온 데이터를 담을 상태를 만듭니다!
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  // ⭐️ 3. 화면이 켜지자마자 서버에서 공지사항 목록을 가져오는 통신 코드
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");

        // ⭐️ 1. baseURL 끝에 절대 슬래시를 붙이지 않은 완전한 주소
        const FULL_URL =
          "https://rundown-irrigate-majesty.ngrok-free.dev/api/announcements";

        console.log("🚀 최종 요청 주소:", FULL_URL);

        // ⭐️ 2. ngrok 우회 헤더와 함께 요청 전송
        const response = await axios.get(FULL_URL, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "ngrok-skip-browser-warning": "true", // ngrok 경고 페이지 우회 치트키
          },
        });

        console.log("📢 공지사항 목록 조회 성공:", response.data);

        const list = response.data?.data || response.data || [];
        setNotices(list);
      } catch (error: any) {
        console.error(
          "🚨 공지사항 조회 실패:",
          error.response?.data || error.message,
        );
        Alert.alert("오류", "공지사항을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  // ⭐️ 4. 백엔드가 알려준 'isPinned' 필드로 중요/일반 공지를 분류합니다!
  const importantNotices = notices.filter((n) => n.pinned === true);
  const regularNotices = notices.filter((n) => n.pinned !== true);

  if (selectedNotice) {
    return (
      <View
        style={[
          styles.screenSoft,
          {
            flex: 1,
            backgroundColor: "#fff",
            paddingTop: StatusBar.currentHeight
              ? StatusBar.currentHeight + 10
              : 24,
          },
        ]}
      >
        <View style={ntStyles.header}>
          <Pressable
            style={ntStyles.backBtn}
            onPress={() => setSelectedNotice(null)}
          >
            <Text style={ntStyles.backIcon}>‹</Text>
          </Pressable>
          <Text style={ntStyles.headerTitle}>공지사항</Text>
        </View>
        <ScrollView
          style={{ backgroundColor: "#F9FAFB" }}
          contentContainerStyle={ntStyles.detailContent}
        >
          {selectedNotice.pinned && (
            <View style={ntStyles.importantBadge}>
              <Text style={ntStyles.importantBadgeText}>📌 중요 공지</Text>
            </View>
          )}
          <Text style={ntStyles.detailTitle}>{selectedNotice.title}</Text>
          <Text style={ntStyles.detailDate}>
            {selectedNotice.createdAt?.substring(0, 10)}
          </Text>
          <View style={ntStyles.detailCard}>
            <Text style={ntStyles.detailBody}>{selectedNotice.content}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.screenSoft,
        {
          flex: 1,
          backgroundColor: "#fff",
          paddingTop: StatusBar.currentHeight
            ? StatusBar.currentHeight + 10
            : 24,
        },
      ]}
    >
      <View style={ntStyles.header}>
        <Pressable style={ntStyles.backBtn} onPress={() => go("mode")}>
          <Text style={ntStyles.backIcon}>‹</Text>
        </Pressable>
        <Text style={ntStyles.headerTitle}>공지사항</Text>
      </View>
      <ScrollView
        style={{ backgroundColor: "#F9FAFB" }}
        contentContainerStyle={ntStyles.listContent}
      >
        {/* 중요 공지 */}
        {importantNotices.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginBottom: 10,
              }}
            >
              <Text style={ntStyles.sectionIcon}>📌</Text>
              <Text style={ntStyles.sectionLabelImportant}>중요 공지</Text>
            </View>
            <View style={{ gap: 8 }}>
              {importantNotices.map((notice) => (
                <Pressable
                  key={notice.id}
                  style={ntStyles.importantCard}
                  onPress={() => setSelectedNotice(notice)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={ntStyles.noticeTitle} numberOfLines={1}>
                      {notice.title}
                    </Text>
                    <Text style={ntStyles.noticeDate}>
                      {notice.createdAt?.substring(0, 10)}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* 일반 공지 */}
        {regularNotices.length > 0 && (
          <View>
            <Text style={ntStyles.sectionLabel}>전체 공지</Text>
            <View style={{ gap: 8, marginTop: 10 }}>
              {regularNotices.map((notice) => (
                <Pressable
                  key={notice.id}
                  style={ntStyles.regularCard}
                  onPress={() => setSelectedNotice(notice)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={ntStyles.noticeTitle} numberOfLines={1}>
                      {notice.title}
                    </Text>
                    <Text style={ntStyles.noticeDate}>
                      {notice.createdAt?.substring(0, 10)}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

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

  const isInsideDetail = selectedCategory !== null || selectedRoom !== null;

  const groupByRoom = () => {
    const grouped: { [key: string]: SavedExpression[] } = {};
    expressions.forEach((expr) => {
      if (!grouped[expr.roomName]) grouped[expr.roomName] = [];
      grouped[expr.roomName].push(expr);
    });
    return grouped;
  };

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
        <View
          style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}
        >
          <View style={{ flex: 1 }}>
            <Text style={bkStyles.exprText}>{expr.text}</Text>
            {expr.context ? (
              <Text style={bkStyles.exprTranslation}>{expr.context}</Text>
            ) : null}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              <View style={[bkStyles.catBadge, { backgroundColor: config.bg }]}>
                <Text style={[bkStyles.catBadgeText, { color: config.color }]}>
                  {expr.category}
                </Text>
              </View>
              {showRoom && (
                <Text style={bkStyles.exprMeta}>{expr.roomName}</Text>
              )}
              <Text style={bkStyles.exprDate}>{expr.savedDate}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => deleteExpression(expr)}
            style={bkStyles.deleteBtn}
          >
            <Text style={bkStyles.deleteBtnText}>🗑</Text>
          </Pressable>
        </View>
        {expr.source === "ai" && (
          <Text style={bkStyles.exprSourceTag}>AI 답변에서 저장됨</Text>
        )}
        <Text style={bkStyles.exprSourceLabel}>
          {expr.roomType === "voice" ? "음성대화에서 저장" : "채팅대화에서 저장"}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.screenSoft,
        {
          flex: 1,
          backgroundColor: "#fff",
          paddingTop: StatusBar.currentHeight
            ? StatusBar.currentHeight + 10
            : 24,
        },
      ]}
    >
      {/* 헤더 */}
      {isInsideDetail ? (
        <View style={bkStyles.header}>
          <Pressable
            style={bkStyles.backBtn}
            onPress={() => {
              setSelectedCategory(null);
              setSelectedRoom(null);
            }}
          >
            <Text style={bkStyles.backIcon}>‹</Text>
          </Pressable>
          <View>
            <Text style={bkStyles.headerTitle}>
              {selectedCategory ?? selectedRoom}
            </Text>
            <Text style={bkStyles.headerSub}>
              {selectedCategory
                ? `${expressions.filter((e) => e.category === selectedCategory).length}개 저장됨`
                : `${groupByRoom()[selectedRoom!]?.length ?? 0}개 저장됨`}
            </Text>
          </View>
        </View>
      ) : (
        <View style={bkStyles.header}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <Pressable style={bkStyles.backBtn} onPress={() => go("mode")}>
              <Text style={bkStyles.backIcon}>‹</Text>
            </Pressable>
            <View>
              <Text style={bkStyles.headerTitle}>저장된 표현</Text>
              <Text style={bkStyles.headerSub}>
                {expressions.length}개 저장됨
              </Text>
            </View>
          </View>
          {/* 탭 */}
          <View style={bkStyles.tabContainer}>
            <Pressable
              style={[
                bkStyles.tab,
                viewMode === "by-category" && bkStyles.tabActive,
              ]}
              onPress={() => {
                setViewMode("by-category");
                setSelectedRoom(null);
              }}
            >
              <Text
                style={[
                  bkStyles.tabText,
                  viewMode === "by-category" && bkStyles.tabTextActive,
                ]}
              >
                카테고리 🏷
              </Text>
            </Pressable>
            <Pressable
              style={[
                bkStyles.tab,
                viewMode === "by-room" && bkStyles.tabActive,
              ]}
              onPress={() => {
                setViewMode("by-room");
                setSelectedCategory(null);
              }}
            >
              <Text
                style={[
                  bkStyles.tabText,
                  viewMode === "by-room" && bkStyles.tabTextActive,
                ]}
              >
                대화방 📁
              </Text>
            </Pressable>
          </View>
        </View>
      )}

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
        {/* 카테고리 목록 */}
        {!isInsideDetail && viewMode === "by-category" && (
          <View style={{ gap: 10 }}>
            {(["단어", "문법", "문장"] as Category[]).map((cat) => {
              const count = expressions.filter(
                (e) => e.category === cat,
              ).length;
              const config = categoryConfig[cat];
              return (
                <Pressable
                  key={cat}
                  style={bkStyles.listCard}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <View
                    style={[bkStyles.catIcon, { backgroundColor: config.bg }]}
                  >
                    <View
                      style={[bkStyles.catDot, { backgroundColor: config.dot }]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={bkStyles.listCardTitle}>{cat}</Text>
                    <Text style={bkStyles.listCardSub}>{count}개 저장됨</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* 대화방 목록 */}
        {!isInsideDetail && viewMode === "by-room" && (
          <View style={{ gap: 10 }}>
            {Object.entries(groupByRoom()).map(([roomName, roomExprs]) => (
              <Pressable
                key={roomName}
                style={bkStyles.listCard}
                onPress={() => setSelectedRoom(roomName)}
              >
                <View style={bkStyles.roomIcon}>
                  <Text style={{ fontSize: 18 }}>📁</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={bkStyles.listCardTitle}>{roomName}</Text>
                  <Text style={bkStyles.listCardSub}>
                    {roomExprs.length}개 저장됨
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* 카테고리 상세 */}
        {selectedCategory && (
          <View style={{ gap: 10 }}>
            {expressions
              .filter((e) => e.category === selectedCategory)
              .map((e) => renderExpression(e, true))}
          </View>
        )}

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

function SettingsScreen({ go }: { go: (screen: Screen) => void }) {
  const [notifications, setNotifications] = useState(true);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  const logout = () => {
    Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("accessToken");
          await AsyncStorage.removeItem("refreshToken");
          go("login");
        },
      },
    ]);
  };

  const openWithdrawModal = () => {
    setWithdrawPassword("");
    setWithdrawModalVisible(true);
  };

  const handleWithdraw = async () => {
    if (!withdrawPassword.trim()) {
      Alert.alert("입력 확인", "비밀번호를 입력해주세요.");
      return;
    }
    setWithdrawing(true);
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      await axios.delete(`${process.env.EXPO_PUBLIC_BASE_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "ngrok-skip-browser-warning": "true",
        },
        data: { password: withdrawPassword },
      });
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      setWithdrawModalVisible(false);
      Alert.alert("탈퇴 완료", "회원탈퇴가 완료되었습니다.");
      go("login");
    } catch (error: any) {
      Alert.alert(
        "탈퇴 실패",
        error.response?.data?.message ?? "비밀번호를 확인해주세요.",
      );
      console.error("회원탈퇴 에러:", error.response?.data || error.message);
    } finally {
      setWithdrawing(false);
    }
  };

  const Toggle = ({
    value,
    onChange,
  }: {
    value: boolean;
    onChange: () => void;
  }) => (
    <Pressable
      onPress={onChange}
      style={[stStyles.toggle, value ? stStyles.toggleOn : stStyles.toggleOff]}
    >
      <View
        style={[
          stStyles.toggleThumb,
          value ? stStyles.toggleThumbOn : stStyles.toggleThumbOff,
        ]}
      />
    </Pressable>
  );

  return (
    <View
      style={[
        styles.screenSoft,
        {
          flex: 1,
          backgroundColor: "#fff",
          paddingTop: StatusBar.currentHeight
            ? StatusBar.currentHeight + 10
            : 24,
        },
      ]}
    >
      {/* 헤더 */}
      <View style={stStyles.header}>
        <Pressable style={stStyles.backBtn} onPress={() => go("mode")}>
          <Text style={stStyles.backIcon}>‹</Text>
        </Pressable>
        <Text style={stStyles.headerTitle}>설정</Text>
      </View>

      <ScrollView
        style={{ backgroundColor: "#F9FAFB" }}
        contentContainerStyle={stStyles.content}
      >
        {/* 계정 */}
        <Text style={stStyles.sectionLabel}>계정</Text>
        <View style={stStyles.card}>
          <View style={[stStyles.row, stStyles.rowBorder]}>
            <View>
              <Text style={stStyles.rowTitle}>이메일</Text>
              <Text style={stStyles.rowSub}>user@example.com</Text>
            </View>
          </View>
          <View style={stStyles.row}>
            <Text style={stStyles.rowTitle}>회원 등급</Text>
            <View style={stStyles.premiumBadge}>
              <Text style={stStyles.premiumBadgeText}>프리미엄</Text>
            </View>
          </View>
        </View>

        {/* 알림 */}
        <Text style={stStyles.sectionLabel}>알림</Text>
        <View style={stStyles.card}>
          <View style={stStyles.row}>
            <View style={stStyles.iconWrapBlue}>
              <Text style={{ fontSize: 15 }}>🔔</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={stStyles.rowTitle}>푸시 알림</Text>
              <Text style={stStyles.rowSub}>새로운 피드백 알림 받기</Text>
            </View>
            <Toggle
              value={notifications}
              onChange={() => setNotifications((v) => !v)}
            />
          </View>
        </View>

        {/* 기타 */}
        <Text style={stStyles.sectionLabel}>기타</Text>
        <View style={stStyles.card}>
          <Pressable style={stStyles.row} onPress={() => go("faq")}>
            <View style={stStyles.iconWrapPurple}>
              <Text style={{ fontSize: 15 }}>❓</Text>
            </View>
            <Text style={[stStyles.rowTitle, { flex: 1 }]}>자주 묻는 질문</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        {/* 로그아웃 */}
        <Pressable style={stStyles.logoutBtn} onPress={logout}>
          <View style={stStyles.iconWrapRed}>
            <Text style={{ fontSize: 15 }}>🚪</Text>
          </View>
          <Text style={stStyles.logoutText}>로그아웃</Text>
        </Pressable>

        {/* 회원탈퇴 */}
        <Pressable
          style={[stStyles.logoutBtn, { marginTop: 10 }]}
          onPress={openWithdrawModal}
        >
          <View style={stStyles.iconWrapGray}>
            <Text style={{ fontSize: 15 }}>🚫</Text>
          </View>
          <Text style={stStyles.withdrawText}>회원탈퇴</Text>
        </Pressable>

        {/* 버전 */}
        <Text style={stStyles.version}>SenTic v1.0.0</Text>
      </ScrollView>

      <Modal
        visible={withdrawModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={stStyles.withdrawModalOverlay}
        >
          <View style={stStyles.withdrawModalCard}>
            <Text style={stStyles.withdrawModalTitle}>회원탈퇴</Text>
            <Text style={stStyles.withdrawModalDesc}>
              탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.{"\n"}
              계속하려면 비밀번호를 입력해주세요.
            </Text>
            <TextInput
              value={withdrawPassword}
              onChangeText={setWithdrawPassword}
              placeholder="비밀번호"
              secureTextEntry
              style={styles.input}
              autoFocus
            />
            <View style={stStyles.withdrawModalActions}>
              <Pressable
                style={stStyles.withdrawModalCancelBtn}
                onPress={() => setWithdrawModalVisible(false)}
                disabled={withdrawing}
              >
                <Text style={stStyles.withdrawModalCancelText}>취소</Text>
              </Pressable>
              <Pressable
                style={[
                  stStyles.withdrawModalConfirmBtn,
                  withdrawing && { opacity: 0.6 },
                ]}
                onPress={handleWithdraw}
                disabled={withdrawing}
              >
                <Text style={stStyles.withdrawModalConfirmText}>
                  {withdrawing ? "탈퇴 중..." : "탈퇴하기"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function PaymentScreen({ go }: { go: (screen: Screen) => void }) {
  type Plan = "free" | "monthly" | "yearly";

  const CURRENT_SUBSCRIPTION: {
    plan: Plan;
    nextBillingDate: string;
    daysLeft: number;
  } | null = {
    plan: "monthly",
    nextBillingDate: "2026년 6월 11일",
    daysLeft: 31,
  };

  const plans = {
    free: {
      name: "Free",
      price: "0",
      period: "",
      features: ["하루 5회 대화", "기본 피드백"],
    },
    monthly: {
      name: "Monthly",
      price: "14,900",
      period: "/월",
      badge: "인기",
      features: [
        "무제한 대화",
        "고급 피드백",
        "실시간 음성 피드백",
        "표현 무제한 저장",
        "우선 고객 지원",
        "광고 없음",
      ],
    },
    yearly: {
      name: "Yearly",
      price: "149,000",
      period: "/년",
      badge: "20% 할인",
      features: [
        "무제한 대화",
        "고급 피드백",
        "실시간 음성 피드백",
        "표현 무제한 저장",
        "우선 고객 지원",
        "광고 없음",
        "2개월 무료",
      ],
    },
  };

  const [selectedPlan, setSelectedPlan] = useState<Plan>(
    CURRENT_SUBSCRIPTION?.plan ?? "monthly",
  );

  const handleSubscribe = () => {
    Alert.alert("구독", `${plans[selectedPlan].name} 플랜 구독이 진행됩니다.`);
  };

  const handleCancel = () => {
    Alert.alert("구독 취소", "구독을 취소하시겠습니까?", [
      { text: "아니요", style: "cancel" },
      {
        text: "취소하기",
        style: "destructive",
        onPress: () => Alert.alert("취소 완료", "구독이 취소되었습니다."),
      },
    ]);
  };

  return (
    <View
      style={[
        styles.screenSoft,
        {
          flex: 1,
          backgroundColor: "#fff",
          paddingTop: StatusBar.currentHeight
            ? StatusBar.currentHeight + 10
            : 24,
        },
      ]}
    >
      {/* 헤더 */}
      <View style={pyStyles.header}>
        <Pressable style={pyStyles.backBtn} onPress={() => go("mypage")}>
          <Text style={pyStyles.backIcon}>‹</Text>
        </Pressable>
        <Text style={pyStyles.headerTitle}>결제 및 구독</Text>
      </View>

      <ScrollView
        style={{ backgroundColor: "#F9FAFB" }}
        contentContainerStyle={pyStyles.content}
      >
        {/* 현재 구독 배너 */}
        {CURRENT_SUBSCRIPTION ? (
          <View style={pyStyles.banner}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <View style={pyStyles.crownWrap}>
                <Text style={{ fontSize: 20 }}>👑</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={pyStyles.bannerSub}>현재 구독 중</Text>
                <Text style={pyStyles.bannerTitle}>
                  {plans[CURRENT_SUBSCRIPTION.plan].name} 플랜
                </Text>
              </View>
              <View style={pyStyles.premiumTag}>
                <Text style={pyStyles.premiumTagText}>프리미엄</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={pyStyles.bannerInfoBox}>
                <Text style={pyStyles.bannerInfoLabel}>⏱ 남은 기간</Text>
                <Text style={pyStyles.bannerInfoValue}>
                  D-{CURRENT_SUBSCRIPTION.daysLeft}
                </Text>
              </View>
              <View style={pyStyles.bannerInfoBox}>
                <Text style={pyStyles.bannerInfoLabel}>📅 다음 결제일</Text>
                <Text style={pyStyles.bannerInfoValue}>
                  {CURRENT_SUBSCRIPTION.nextBillingDate}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[pyStyles.banner, { alignItems: "center" }]}>
            <View style={[pyStyles.crownWrap, { marginBottom: 12 }]}>
              <Text style={{ fontSize: 20 }}>👑</Text>
            </View>
            <Text style={pyStyles.bannerTitle}>
              무제한 학습으로 영어 실력 향상
            </Text>
            <Text style={pyStyles.bannerSub}>
              지금 구독하고 더 많은 기능을 경험하세요
            </Text>
          </View>
        )}

        {/* 플랜 선택 */}
        <View style={{ gap: 10 }}>
          {(["free", "monthly", "yearly"] as Plan[]).map((planId) => {
            const plan = plans[planId];
            const isSelected = selectedPlan === planId;
            const isCurrent = CURRENT_SUBSCRIPTION?.plan === planId;
            const badge = "badge" in plan ? (plan as any).badge : null;
            return (
              <Pressable
                key={planId}
                onPress={() => setSelectedPlan(planId)}
                style={[
                  pyStyles.planCard,
                  isSelected
                    ? pyStyles.planCardSelected
                    : pyStyles.planCardDefault,
                ]}
              >
                {/* 플랜 헤더 */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <View
                      style={[
                        pyStyles.radio,
                        isSelected
                          ? pyStyles.radioSelected
                          : pyStyles.radioDefault,
                      ]}
                    >
                      {isSelected && <View style={pyStyles.radioDot} />}
                    </View>
                    <Text
                      style={[
                        pyStyles.planName,
                        isSelected && { color: primary },
                      ]}
                    >
                      {plan.name}
                    </Text>
                    {badge && (
                      <View
                        style={[
                          pyStyles.badge,
                          planId === "monthly"
                            ? pyStyles.badgeBlue
                            : pyStyles.badgeGreen,
                        ]}
                      >
                        <Text
                          style={[
                            pyStyles.badgeText,
                            planId === "monthly"
                              ? { color: "#4F46E5" }
                              : { color: "#16A34A" },
                          ]}
                        >
                          {badge}
                        </Text>
                      </View>
                    )}
                    {isCurrent && (
                      <View style={pyStyles.badgeYellow}>
                        <Text style={pyStyles.badgeYellowText}>현재</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={pyStyles.planPrice}>₩{plan.price}</Text>
                    <Text style={pyStyles.planPeriod}>{plan.period}</Text>
                  </View>
                </View>

                {/* 기능 목록 */}
                <View style={{ gap: 6, paddingLeft: 24 }}>
                  {plan.features.map((f) => (
                    <View
                      key={f}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? primary : "#D1D5DB",
                          fontSize: 12,
                        }}
                      >
                        ✓
                      </Text>
                      <Text
                        style={[
                          pyStyles.featureText,
                          isSelected
                            ? { color: "#4B5563" }
                            : { color: "#9CA3AF" },
                        ]}
                      >
                        {f}
                      </Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* 연간 절약 안내 */}
        {selectedPlan === "yearly" && (
          <View style={pyStyles.savingBox}>
            <Text style={pyStyles.savingText}>
              💰 월간 대비{" "}
              <Text style={{ fontWeight: "800" }}>약 31,700원 절약</Text>됩니다
              (연 기준)
            </Text>
          </View>
        )}

        {/* 결제 버튼 */}
        {selectedPlan !== "free" && (
          <View style={{ gap: 10 }}>
            {CURRENT_SUBSCRIPTION?.plan === selectedPlan ? (
              <View style={{ gap: 8 }}>
                <View style={pyStyles.currentPlanBox}>
                  <Text style={pyStyles.currentPlanText}>
                    현재 구독 중인 플랜입니다
                  </Text>
                  <Text style={pyStyles.currentPlanSub}>
                    다음 결제일: {CURRENT_SUBSCRIPTION.nextBillingDate}
                  </Text>
                </View>
                <Pressable style={pyStyles.cancelBtn} onPress={handleCancel}>
                  <Text style={pyStyles.cancelBtnText}>구독 취소</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <Pressable
                  style={pyStyles.subscribeBtn}
                  onPress={handleSubscribe}
                >
                  <Text style={pyStyles.subscribeBtnText}>
                    {plans[selectedPlan].name} 구독하기 — ₩
                    {plans[selectedPlan].price}
                    {plans[selectedPlan].period}
                  </Text>
                </Pressable>
                <Text style={pyStyles.cancelNote}>
                  언제든지 구독을 취소할 수 있습니다
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function FaqScreen({ go }: { go: (screen: any) => void }) {
  // 1. 서버에서 받아온 데이터를 담을 상태 (초기값은 빈 배열)
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. 열려있는 항목을 추적할 상태 (globalIndex 대신 카테고리-아이템 인덱스 조합 사용)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 3. 백엔드에서 FAQ 목록 불러오기 (공지사항과 99.9% 동일!)
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        const FULL_URL =
          "https://rundown-irrigate-majesty.ngrok-free.dev/api/faq";

        console.log("🚀 FAQ 요청 주소:", FULL_URL);

        const response = await axios.get(FULL_URL, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "ngrok-skip-browser-warning": "true", // ngrok 경고 페이지 우회
          },
        });

        console.log("📢 FAQ 목록 조회 성공:", response.data);

        // 서버 응답 구조에 맞게 데이터 세팅 (data.data 또는 data 자체)
        const list = response.data?.data || response.data || [];
        setFaqs(list);
      } catch (error: any) {
        console.error(
          "🚨 FAQ 조회 실패:",
          error.response?.data || error.message,
        );
        Alert.alert("오류", "FAQ를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  return (
    <View
      style={[
        styles.screenSoft,
        {
          flex: 1,
          backgroundColor: "#fff",
          paddingTop: StatusBar.currentHeight
            ? StatusBar.currentHeight + 10
            : 24,
        },
      ]}
    >
      {/* 헤더 */}
      <View style={fqStyles.header}>
        <Pressable style={fqStyles.backBtn} onPress={() => go("settings")}>
          <Text style={fqStyles.backIcon}>‹</Text>
        </Pressable>
        <Text style={fqStyles.headerTitle}>자주 묻는 질문</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0000ff"
          style={{ marginTop: 50 }}
        />
      ) : (
        <ScrollView
          style={{ backgroundColor: "#F9FAFB" }}
          contentContainerStyle={fqStyles.content}
        >
          <View style={fqStyles.card}>
            {/* ⭐️ 백엔드에서 받은 1단 배열(faqs)을 바로 map으로 돌립니다! */}
            {faqs.map((faq, index) => {
              // 고유 ID로 faq.id 를 사용합니다. (문자열로 변환하여 비교)
              const isExpanded = expandedId === String(faq.id);

              return (
                <View key={faq.id}>
                  <Pressable
                    style={[
                      fqStyles.qRow,
                      index > 0 && fqStyles.qRowBorder, // 두 번째 항목부터 윗줄 테두리 적용
                    ]}
                    onPress={() =>
                      setExpandedId(isExpanded ? null : String(faq.id))
                    }
                  >
                    <Text style={fqStyles.qLabel}>Q.</Text>
                    {/* 데이터 필드명 question 사용 */}
                    <Text style={fqStyles.qText}>{faq.question}</Text>
                    <Text
                      style={[
                        fqStyles.chevronIcon,
                        isExpanded && {
                          transform: [{ rotate: "180deg" }],
                        },
                      ]}
                    >
                      ⌄
                    </Text>
                  </Pressable>
                  {isExpanded && (
                    <View style={fqStyles.aBox}>
                      <Text style={fqStyles.aLabel}>A.</Text>
                      {/* 데이터 필드명 answer 사용 */}
                      <Text style={fqStyles.aText}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* 추가 문의 */}
          <View style={fqStyles.contactBox}>
            <Text style={fqStyles.contactTitle}>
              더 궁금한 점이 있으신가요?
            </Text>
            <Text style={fqStyles.contactSub}>
              support@sentic.app으로 문의해주세요
            </Text>
            <Pressable
              style={fqStyles.contactBtn}
              onPress={() =>
                Alert.alert("고객센터", "support@sentic.app으로 문의해주세요.")
              }
            >
              <Text style={fqStyles.contactBtnText}>고객센터 문의하기</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const fqStyles = StyleSheet.create({
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  backIcon: { fontSize: 30, color: "#4B5563", lineHeight: 32 },
  headerTitle: { color: "#111827", fontSize: 16, fontWeight: "800" },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  categoryLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
  },
  qRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  qRowBorder: { borderTopWidth: 1, borderTopColor: "#F9FAFB" },
  qLabel: {
    color: primary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 1,
    flexShrink: 0,
  },
  qText: { flex: 1, color: "#374151", fontSize: 14, lineHeight: 20 },
  chevronIcon: { color: "#9CA3AF", fontSize: 18, marginTop: -2, flexShrink: 0 },
  aBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  aLabel: {
    color: "#16A34A",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 1,
    flexShrink: 0,
  },
  aText: { flex: 1, color: "#6B7280", fontSize: 13, lineHeight: 20 },
  contactBox: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  contactTitle: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  contactSub: { color: "#6B7280", fontSize: 12, marginBottom: 14 },
  contactBtn: {
    backgroundColor: primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  contactBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
});

const pyStyles = StyleSheet.create({
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  backIcon: { fontSize: 30, color: "#4B5563", lineHeight: 32 },
  headerTitle: { color: "#111827", fontSize: 16, fontWeight: "800" },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  banner: { backgroundColor: primary, borderRadius: 20, padding: 20 },
  crownWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  bannerSub: { color: "#C7D2FE", fontSize: 11, marginTop: 2 },
  premiumTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  premiumTagText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  bannerInfoBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
  },
  bannerInfoLabel: { color: "#C7D2FE", fontSize: 10, marginBottom: 4 },
  bannerInfoValue: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  planCard: { borderWidth: 2, borderRadius: 20, padding: 16 },
  planCardSelected: { borderColor: primary, backgroundColor: "#EEF2FF" },
  planCardDefault: { borderColor: "#F3F4F6", backgroundColor: "#FFFFFF" },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: primary },
  radioDefault: { borderColor: "#D1D5DB" },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: primary },
  planName: { fontSize: 14, fontWeight: "700", color: "#374151" },
  planPrice: { fontSize: 14, fontWeight: "800", color: "#111827" },
  planPeriod: { fontSize: 11, color: "#9CA3AF" },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeBlue: { backgroundColor: "#EEF2FF" },
  badgeGreen: { backgroundColor: "#F0FDF4" },
  badgeText: { fontSize: 10, fontWeight: "700" },
  badgeYellow: {
    backgroundColor: "#FEF9C3",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeYellowText: { color: "#A16207", fontSize: 10, fontWeight: "700" },
  featureText: { fontSize: 12 },
  savingBox: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 14,
  },
  savingText: { color: "#15803D", fontSize: 12 },
  currentPlanBox: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  currentPlanText: { color: "#4B5563", fontSize: 14 },
  currentPlanSub: { color: "#9CA3AF", fontSize: 12, marginTop: 4 },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtnText: { color: "#EF4444", fontSize: 14 },
  subscribeBtn: {
    backgroundColor: primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  subscribeBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  cancelNote: { color: "#9CA3AF", fontSize: 12, textAlign: "center" },
});

const stStyles = StyleSheet.create({
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  backIcon: { fontSize: 30, color: "#4B5563", lineHeight: 32 },
  headerTitle: { color: "#111827", fontSize: 16, fontWeight: "800" },
  content: { padding: 20, gap: 10, paddingBottom: 32 },
  sectionLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#F9FAFB" },
  rowTitle: { color: "#374151", fontSize: 14 },
  rowSub: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  premiumBadge: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  premiumBadgeText: { color: "#4F46E5", fontSize: 11, fontWeight: "700" },
  iconWrapBlue: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapPurple: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapRed: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapGray: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: primary },
  toggleOff: { backgroundColor: "#E5E7EB" },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  toggleThumbOn: { alignSelf: "flex-end" },
  toggleThumbOff: { alignSelf: "flex-start" },
  logoutBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  logoutText: { color: "#EF4444", fontSize: 14 },
  withdrawText: { color: "#6B7280", fontSize: 14 },
  withdrawModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  withdrawModalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },
  withdrawModalTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  withdrawModalDesc: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  withdrawModalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  withdrawModalCancelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
  },
  withdrawModalCancelText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  withdrawModalConfirmBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#EF4444",
  },
  withdrawModalConfirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  version: {
    color: "#D1D5DB",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
});

const bkStyles = StyleSheet.create({
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  backIcon: { fontSize: 30, color: "#4B5563", lineHeight: 32 },
  headerTitle: { color: "#111827", fontSize: 16, fontWeight: "800" },
  headerSub: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: { backgroundColor: "#FFFFFF" },
  tabText: { color: "#6B7280", fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: "#111827" },
  content: { padding: 16, paddingBottom: 32 },
  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  listCardTitle: { color: "#111827", fontSize: 14, fontWeight: "600" },
  listCardSub: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  roomIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  exprCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 16,
  },
  exprText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  exprTranslation: { color: "#9CA3AF", fontSize: 12 },
  exprMeta: { color: "#9CA3AF", fontSize: 10 },
  exprDate: { color: "#D1D5DB", fontSize: 10 },
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
  catBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  catBadgeText: { fontSize: 10, fontWeight: "700" },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: { fontSize: 13 },
});

const ntStyles = StyleSheet.create({
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  backIcon: { fontSize: 30, color: "#4B5563", lineHeight: 32 },
  headerTitle: { color: "#111827", fontSize: 16, fontWeight: "800" },
  listContent: { padding: 20, paddingBottom: 32 },
  detailContent: { padding: 20, paddingBottom: 32 },
  sectionIcon: { fontSize: 12 },
  sectionLabelImportant: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  importantCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  regularCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  noticeTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  noticeDate: { color: "#9CA3AF", fontSize: 12 },
  importantBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF2F2",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  importantBadgeText: { color: "#EF4444", fontSize: 12, fontWeight: "700" },
  detailTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
  },
  detailDate: { color: "#9CA3AF", fontSize: 12, marginBottom: 16 },
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 20,
  },
  detailBody: { color: "#374151", fontSize: 14, lineHeight: 22 },
});

function MyPageScreen({ go }: { go: (screen: Screen) => void }) {
  type Level = "초급" | "중급" | "고급";

  const levels: {
    id: Level;
    label: string;
    eng: string;
    desc: string;
    detail: string[];
    color: string;
    bg: string;
    borderColor: string;
    dot: string;
  }[] = [
    {
      id: "초급",
      label: "초급",
      eng: "Beginner",
      desc: "기초 단어/문장 구사 가능",
      detail: ["짧고 쉬운 문장", "천천히", "모르는 단어 설명"],
      color: "#059669",
      bg: "#ECFDF5",
      borderColor: "#34D399",
      dot: "#34D399",
    },
    {
      id: "중급",
      label: "중급",
      eng: "Intermediate",
      desc: "일상 대화 가능",
      detail: ["일반 속도로 대화", "일상 표현 학습", "다양한 주제 토론"],
      color: "#D97706",
      bg: "#FFFBEB",
      borderColor: "#FBBF24",
      dot: "#FBBF24",
    },
    {
      id: "고급",
      label: "고급",
      eng: "Advanced",
      desc: "자유롭게 대화 가능",
      detail: ["빠른 속도 대화", "관용어/슬랭 사용", "복잡한 문장 구사"],
      color: "#4338CA",
      bg: "#EEF2FF",
      borderColor: "#818CF8",
      dot: "#818CF8",
    },
  ];

  const [userLevel, setUserLevel] = useState<Level>("중급");
  const [pendingLevel, setPendingLevel] = useState<Level>("중급");
  const [levelConfirmed, setLevelConfirmed] = useState(true);
  const [isAnimated, setIsAnimated] = useState(false);

  // ⭐️ 1. 서버에서 받아올 사용자 정보를 담을 상태(State) 생성
  const [userInfo, setUserInfo] = useState({ nickname: "회원", email: "" });
  const weekly = [
    { day: "Mon", minute: 45, date: "04/07" },
    { day: "Tue", minute: 60, date: "04/08" },
    { day: "Wed", minute: 30, date: "04/09" },
    { day: "Thu", minute: 75, date: "04/10" },
    { day: "Fri", minute: 50, date: "04/11" },
    { day: "Sat", minute: 90, date: "04/12" },
    { day: "Sun", minute: 65, date: "04/13" },
  ];

  const totalMinutes = weekly.reduce((sum, item) => sum + item.minute, 0);
  const maxMinutes = Math.max(...weekly.map((item) => item.minute));
  const avgMinutes = Math.round(totalMinutes / weekly.length);

  const currentLevel = levels.find((l) => l.id === userLevel)!;

  useEffect(() => {
    const fetchMyProfile = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        if (!accessToken) return;

        const API_URL = "https://rundown-irrigate-majesty.ngrok-free.dev";

        // 홈 화면에서 성공하셨던 그 주소 그대로 호출합니다!
        const res = await axios.get(`${API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        });

        // 이름과 이메일 추출 (백엔드 응답 형태에 맞춰 유연하게)
        const fetchedName =
          res.data?.data?.nickname ||
          res.data?.nickname ||
          res.data?.data?.name ||
          res.data?.name ||
          "회원";
        const fetchedEmail = res.data?.data?.email || res.data?.email || "";

        // 가져온 정보를 상태에 업데이트
        setUserInfo({ nickname: fetchedName, email: fetchedEmail });
      } catch (error: any) {
        console.error(
          "🚨 마이페이지 유저 정보 불러오기 실패:",
          error.response?.data || error.message,
        );
      }
    };

    fetchMyProfile();
  }, []); // 빈 배열을 넣어 화면이 처음 렌더링될 때 딱 한 번만 실행되게 합니다.

  // ⭐️ 2. 그래프를 0.15초 뒤에 슉! 올라오게 만드는 useEffect (이게 있어야 그래프가 보입니다!)
  useEffect(() => {
    const t = setTimeout(() => setIsAnimated(true), 150);
    return () => clearTimeout(t);
  }, []);

  // 🚀 한글 레벨을 백엔드가 원하는 영어 대문자로 바꿔주는 매핑 딕셔너리
  const levelMapping: Record<Level, string> = {
    초급: "BEGINNER",
    중급: "INTERMEDIATE",
    고급: "ADVANCED",
  };

  // 🚀 학습 레벨 변경 및 백엔드 연동 함수
  const handleLevelButtonClick = async () => {
    if (levelConfirmed) {
      // '변경' 버튼을 눌렀을 때 -> 수정 모드로 진입
      setPendingLevel(userLevel);
      setLevelConfirmed(false);
    } else {
      // '결정' 버튼을 눌렀을 때 -> 서버로 변경된 레벨 전송
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        const API_URL = "https://rundown-irrigate-majesty.ngrok-free.dev";

        // ⭐️ 1. 저장된 토큰이 아예 없거나 null인지 확인!
        console.log("📌 현재 저장된 토큰:", accessToken);

        // 한글을 영어 대문자로 변환 (예: "중급" -> "INTERMEDIATE")
        const mappedDifficulty = levelMapping[pendingLevel];

        // ⭐️ 2. 어떤 주소와 파라미터로 요청을 날리는지 확인!
        console.log(
          "📌 요청 URL:",
          `${API_URL}/api/users/me/level?difficulty=${mappedDifficulty}`,
        );

        // ⭐️ 명세에 맞춘 PUT 요청 (Query Parameter로 전달)
        await axios.put(
          `${API_URL}/api/users/me/level?difficulty=${mappedDifficulty}`,
          {}, // Body가 아니므로 빈 객체 전달
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        // 서버 통신 성공 시 화면 상태 업데이트
        setUserLevel(pendingLevel);
        setLevelConfirmed(true);
      } catch (error: any) {
        console.error(
          "🚨 레벨 변경 실패:",
          error.response?.data || error.message,
        );
        Alert.alert(
          "오류",
          "학습 레벨 변경에 실패했습니다. 다시 시도해 주세요.",
        );
      }
    }
  };

  const logout = () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "로그아웃", style: "destructive", onPress: () => go("login") },
    ]);
  };

  const CHART_HEIGHT = 128;

  return (
    <View
      style={[
        styles.screenSoft,
        {
          flex: 1,
          backgroundColor: "#fff",
          paddingTop: StatusBar.currentHeight
            ? StatusBar.currentHeight + 10
            : 24,
        },
      ]}
    >
      {/* 헤더 */}
      <View style={mpStyles.header}>
        <Pressable style={mpStyles.backBtn} onPress={() => go("mode")}>
          <Text style={mpStyles.backIcon}>‹</Text>
        </Pressable>
        <Text style={mpStyles.headerTitle}>마이 페이지</Text>
      </View>

      <ScrollView
        style={{ backgroundColor: "#F9FAFB" }}
        contentContainerStyle={mpStyles.content}
      >
        {/* 프로필 카드 */}
        <View style={mpStyles.card}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={mpStyles.avatar}>
              <Text style={mpStyles.avatarText}>
                {userInfo.nickname.charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={mpStyles.nickname}>{userInfo.nickname}</Text>
              <Text style={mpStyles.email}>{userInfo.email}</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 6,
                }}
              >
                <View
                  style={[mpStyles.dot, { backgroundColor: currentLevel.dot }]}
                />
                <Text style={mpStyles.levelSmall}>
                  {currentLevel.id} · {currentLevel.eng}
                </Text>
              </View>
            </View>
            <Pressable onPress={logout} style={mpStyles.logoutBtn}>
              <Text style={mpStyles.logoutText}>로그아웃</Text>
            </Pressable>
          </View>
        </View>

        {/* 학습 통계 */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            {
              label: "이번 주",
              value: `${Math.round((totalMinutes / 60) * 10) / 10}h`,
            },
            { label: "일 평균", value: `${avgMinutes}분` },
            { label: "연속 학습", value: "5일" },
          ].map((stat) => (
            <View key={stat.label} style={mpStyles.statBox}>
              <Text style={mpStyles.statLabel}>{stat.label}</Text>
              <Text style={mpStyles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* 주간 그래프 */}
        <View style={mpStyles.card}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <View>
              <Text style={mpStyles.cardTitle}>주간 학습 시간</Text>
              <Text style={mpStyles.cardSub}>최근 7일 기록</Text>
            </View>
            <Text style={mpStyles.cardSub}>{totalMinutes}분</Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              height: CHART_HEIGHT,
              gap: 6,
            }}
          >
            {weekly.map((item, index) => {
              const isToday = index === weekly.length - 1;
              const barH = isAnimated
                ? Math.max(8, (item.minute / maxMinutes) * (CHART_HEIGHT - 28))
                : 0;
              return (
                <View
                  key={item.day}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    height: CHART_HEIGHT,
                    justifyContent: "flex-end",
                    gap: 4,
                  }}
                >
                  <Text
                    style={[mpStyles.barMinute, isToday && { color: primary }]}
                  >
                    {item.minute}분
                  </Text>
                  <View
                    style={[
                      mpStyles.bar,
                      { height: barH },
                      isToday
                        ? { backgroundColor: primary }
                        : { backgroundColor: "#C7D2FE" },
                    ]}
                  />
                  <Text
                    style={[mpStyles.barDay, isToday && { color: primary }]}
                  >
                    {item.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 학습 레벨 설정 */}
        <View style={mpStyles.card}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={mpStyles.cardTitle}>학습 레벨 설정</Text>
            <Pressable
              onPress={handleLevelButtonClick}
              style={[
                mpStyles.levelBtn,
                levelConfirmed
                  ? { backgroundColor: "#F3F4F6" }
                  : { backgroundColor: primary },
              ]}
            >
              <Text
                style={[
                  mpStyles.levelBtnText,
                  levelConfirmed ? { color: "#4B5563" } : { color: "#FFFFFF" },
                ]}
              >
                {levelConfirmed ? "변경" : "결정"}
              </Text>
            </Pressable>
          </View>

          {levelConfirmed ? (
            // 확정된 레벨만 표시
            (() => {
              const level = levels.find((l) => l.id === userLevel)!;
              return (
                <View
                  style={[
                    mpStyles.levelCard,
                    {
                      borderColor: level.borderColor,
                      backgroundColor: level.bg,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "baseline",
                        gap: 6,
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={[mpStyles.levelLabel, { color: level.color }]}
                      >
                        {level.label}
                      </Text>
                      <Text style={[mpStyles.levelEng, { color: level.color }]}>
                        {level.eng}
                      </Text>
                    </View>
                    <Text style={[mpStyles.levelDesc, { color: level.color }]}>
                      {level.desc}
                    </Text>
                    <View style={mpStyles.tagRow}>
                      {level.detail.map((tag) => (
                        <View
                          key={tag}
                          style={[
                            mpStyles.tag,
                            {
                              backgroundColor: level.bg,
                              borderColor: level.borderColor + "66",
                            },
                          ]}
                        >
                          <Text
                            style={[mpStyles.tagText, { color: level.color }]}
                          >
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View
                    style={[mpStyles.radio, { borderColor: level.borderColor }]}
                  >
                    <View
                      style={[
                        mpStyles.radioInner,
                        { backgroundColor: level.dot },
                      ]}
                    />
                  </View>
                </View>
              );
            })()
          ) : (
            // 전체 레벨 선택
            <View style={{ gap: 8 }}>
              {levels.map((level) => {
                const isPending = pendingLevel === level.id;
                return (
                  <Pressable
                    key={level.id}
                    onPress={() => setPendingLevel(level.id)}
                    style={[
                      mpStyles.levelCard,
                      isPending
                        ? {
                            borderColor: level.borderColor,
                            backgroundColor: level.bg,
                          }
                        : {
                            borderColor: "#F3F4F6",
                            backgroundColor: "#FFFFFF",
                          },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "baseline",
                          gap: 6,
                          marginBottom: 4,
                        }}
                      >
                        <Text
                          style={[
                            mpStyles.levelLabel,
                            { color: isPending ? level.color : "#1F2937" },
                          ]}
                        >
                          {level.label}
                        </Text>
                        <Text
                          style={[
                            mpStyles.levelEng,
                            { color: isPending ? level.color : "#9CA3AF" },
                          ]}
                        >
                          {level.eng}
                        </Text>
                      </View>
                      <Text
                        style={[
                          mpStyles.levelDesc,
                          { color: isPending ? level.color : "#6B7280" },
                        ]}
                      >
                        {level.desc}
                      </Text>
                      <View style={mpStyles.tagRow}>
                        {level.detail.map((tag) => (
                          <View
                            key={tag}
                            style={[
                              mpStyles.tag,
                              isPending
                                ? {
                                    backgroundColor: level.bg,
                                    borderColor: level.borderColor + "66",
                                  }
                                : {
                                    backgroundColor: "#F3F4F6",
                                    borderColor: "transparent",
                                  },
                            ]}
                          >
                            <Text
                              style={[
                                mpStyles.tagText,
                                { color: isPending ? level.color : "#6B7280" },
                              ]}
                            >
                              {tag}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <View
                      style={[
                        mpStyles.radio,
                        {
                          borderColor: isPending
                            ? level.borderColor
                            : "#D1D5DB",
                        },
                      ]}
                    >
                      {isPending && (
                        <View
                          style={[
                            mpStyles.radioInner,
                            { backgroundColor: level.dot },
                          ]}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* 결제 및 구독 */}
        <View style={mpStyles.card}>
          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            onPress={() => go("payment")}
          >
            <Text style={mpStyles.menuText}>결제 및 구독</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>
    </View>
  );
}

// MyPageScreen 전용 스타일 (기존 styles에 추가하거나 별도 선언)
const mpStyles = StyleSheet.create({
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  backIcon: { fontSize: 30, color: "#4B5563", lineHeight: 32 },
  headerTitle: { color: "#111827", fontSize: 16, fontWeight: "800" },
  content: { padding: 20, gap: 14, paddingBottom: 32 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: primary, fontSize: 22, fontWeight: "900" },
  nickname: { color: "#111827", fontSize: 14, fontWeight: "700" },
  email: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  levelSmall: { color: "#6B7280", fontSize: 12 },
  logoutBtn: { padding: 4 },
  logoutText: { color: "#F87171", fontSize: 12 },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 12,
    alignItems: "center",
  },
  statLabel: { color: "#9CA3AF", fontSize: 11, marginBottom: 4 },
  statValue: { color: "#111827", fontSize: 14, fontWeight: "800" },
  cardTitle: { color: "#111827", fontSize: 14, fontWeight: "800" },
  cardSub: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  bar: { width: "70%", borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barMinute: { color: "#9CA3AF", fontSize: 9 },
  barDay: { color: "#9CA3AF", fontSize: 10 },
  levelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  levelBtnText: { fontSize: 12, fontWeight: "700" },
  levelCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  levelLabel: { fontSize: 14, fontWeight: "800" },
  levelEng: { fontSize: 12 },
  levelDesc: { fontSize: 12, marginBottom: 8 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { fontSize: 11 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  menuText: { color: "#374151", fontSize: 14 },
});

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
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.primaryButton} onPress={onPress}>
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

// 🔖 스크랩한 표현들을 한 곳(AsyncStorage)에 배열로 쌓아두는 헬퍼
const SCRAPED_EXPRESSIONS_KEY = "scrapedExpressions";

const addScrapedExpression = async (entry: Record<string, any>) => {
  try {
    const raw = await AsyncStorage.getItem(SCRAPED_EXPRESSIONS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push({ ...entry, savedAt: Date.now() });
    await AsyncStorage.setItem(SCRAPED_EXPRESSIONS_KEY, JSON.stringify(list));
  } catch (error) {
    console.error("🚨 표현 스크랩 저장 실패:", error);
  }
};

function BookmarkIcon({
  color,
  size = 13,
  filled = false,
}: {
  color: string;
  size?: number;
  filled?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? color : "none"}
      />
    </Svg>
  );
}

// 대화내역 피드백 카드 전용 렌더러 — 오류 항목의 원본→수정 문장을 줄바꿈으로 분리해서 보여줍니다.
const renderMessageFeedbackSection = (
  title: string,
  jsonString: string | any[] | null | undefined,
  icon: string,
  scrapCtx?: ScrapContext,
) => {
  if (
    !jsonString ||
    jsonString === "[]" ||
    jsonString.toString().trim() === "[]"
  )
    return null;

  try {
    const parsedData = Array.isArray(jsonString)
      ? jsonString
      : typeof jsonString === "string"
        ? JSON.parse(jsonString)
        : [jsonString];

    if (!Array.isArray(parsedData) || parsedData.length === 0) return null;

    return (
      <View style={styles.msgFeedbackSection}>
        <Text style={styles.msgFeedbackSectionTitle}>
          {icon} {title}
        </Text>
        {parsedData.map((errorItem: any, index: number) => {
          const itemKey = `${scrapCtx?.keyPrefix}-${index}`;
          const isScraped = scrapCtx?.isScraped(itemKey) ?? false;
          return (
            <View key={index} style={styles.msgFeedbackItem}>
              <Text style={styles.msgFeedbackOriginal}>
                {errorItem.original}
              </Text>
              <Text style={styles.msgFeedbackCorrected}>
                ➡️ {errorItem.suggested || errorItem.corrected}
              </Text>
              {errorItem.explanation ? (
                <Text style={styles.msgFeedbackExplanation}>
                  {errorItem.explanation}
                </Text>
              ) : null}
              {scrapCtx && (
                <Pressable
                  style={[
                    styles.scrapButton,
                    { alignSelf: "flex-end", marginTop: 8 },
                    isScraped && styles.scrapButtonActive,
                  ]}
                  disabled={isScraped}
                  onPress={() =>
                    scrapCtx.onScrap(itemKey, {
                      source: "user",
                      category: title,
                      original: errorItem.original,
                      corrected: errorItem.suggested || errorItem.corrected,
                      explanation: errorItem.explanation,
                    })
                  }
                >
                  <BookmarkIcon color="#8A6D00" size={11} filled={isScraped} />
                  <Text style={styles.scrapButtonText}>
                    {isScraped ? "스크랩됨" : "스크랩"}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    );
  } catch (error) {
    return (
      <View style={styles.msgFeedbackSection}>
        <Text style={styles.msgFeedbackSectionTitle}>
          {icon} {title}
        </Text>
        <Text style={styles.msgFeedbackExplanation}>{jsonString}</Text>
      </View>
    );
  }
};

// ⭐️ 2. 기존 MessageList 컴포넌트 내부의 map 돌리는 곳을 수정합니다.
export function MessageList({ messages }: { messages: any[] }) {
  const [scrapedKeys, setScrapedKeys] = useState<Set<string>>(new Set());

  const handleScrap = async (key: string, entry: Record<string, any>) => {
    if (scrapedKeys.has(key)) return;
    await addScrapedExpression(entry);
    setScrapedKeys((prev) => new Set(prev).add(key));
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f5f5f5" }}
      contentContainerStyle={{ padding: 16 }}
    >
      {messages.map((msg) => {
        const isUser = msg.speaker === "user" || msg.speaker === "USER";
        const aiScrapKey = `${msg.id}-ai`;
        const isAiScraped = scrapedKeys.has(aiScrapKey);

        return (
          <View
            key={msg.id}
            style={{
              marginBottom: 16,
              alignItems: isUser ? "flex-end" : "flex-start",
            }}
          >
            {/* 기본 말풍선 */}
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
              <Text style={{ color: isUser ? "#fff" : "#333", fontSize: 16 }}>
                {msg.text}
              </Text>
            </View>

            {/* 🔖 AI 말풍선용 스크랩 버튼 — 평소엔 눈에 안 띄는 회색 텍스트, 스크랩되면 인디고 배지로 전환 */}
            {!isUser &&
              (isAiScraped ? (
                <View style={styles.aiScrapBadge}>
                  <BookmarkIcon color="#fff" size={11} filled />
                  <Text style={styles.aiScrapBadgeText}>스크랩됨</Text>
                </View>
              ) : (
                <Pressable
                  style={styles.aiScrapButton}
                  onPress={() =>
                    handleScrap(aiScrapKey, {
                      source: "ai",
                      text: msg.text,
                    })
                  }
                >
                  <BookmarkIcon color="#9CA3AF" size={11} />
                  <Text style={styles.aiScrapText}>스크랩</Text>
                </Pressable>
              ))}

            {/* ⭐️ 3. 내가 보낸 메시지(user)이고 피드백이 존재할 때만 노란색 박스를 띄웁니다! */}
            {isUser &&
              msg.feedback &&
              msg.feedback.map((item: any, index: number) => {
                const hasPerfectSentence =
                  item.perfectSentence && item.perfectSentence.trim() !== "[]";

                const makeScrapCtx = (suffix: string): ScrapContext => ({
                  keyPrefix: `${msg.id}-${index}-${suffix}`,
                  isScraped: (key) => scrapedKeys.has(key),
                  onScrap: handleScrap,
                });
                const perfectKey = `${msg.id}-${index}-perfect`;
                const isPerfectScraped = scrapedKeys.has(perfectKey);

                return (
                  <View key={index} style={styles.msgFeedbackCard}>
                    {renderMessageFeedbackSection(
                      "단어 오류",
                      item.wordErrors,
                      "💡",
                      makeScrapCtx("word"),
                    )}
                    {renderMessageFeedbackSection(
                      "문법 오류",
                      item.grammarErrors,
                      "💡",
                      makeScrapCtx("grammar"),
                    )}
                    {renderMessageFeedbackSection(
                      "어색한 표현",
                      item.expressionErrors,
                      "💡",
                      makeScrapCtx("expr"),
                    )}

                    {hasPerfectSentence && (
                      <View style={styles.msgFeedbackPerfectBlock}>
                        <Text style={styles.msgFeedbackPerfectLabel}>
                          ✨ 추천 문장
                        </Text>
                        <Text style={styles.msgFeedbackPerfectText}>
                          {item.perfectSentence}
                        </Text>
                        <Pressable
                          style={[
                            styles.scrapButton,
                            { alignSelf: "flex-end", marginTop: 8 },
                            isPerfectScraped && styles.scrapButtonActive,
                          ]}
                          disabled={isPerfectScraped}
                          onPress={() =>
                            handleScrap(perfectKey, {
                              source: "user",
                              original: msg.text,
                              perfectSentence: item.perfectSentence,
                            })
                          }
                        >
                          <BookmarkIcon
                            color="#8A6D00"
                            size={12}
                            filled={isPerfectScraped}
                          />
                          <Text style={styles.scrapButtonText}>
                            {isPerfectScraped ? "스크랩됨" : "스크랩"}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ⭐️ 2. 피드백 리스트 컴포넌트 본체
export function FeedbackList({
  messages,
  enabled,
}: {
  messages: any[]; // Message 타입을 import 해서 쓰셔도 됩니다.
  enabled: boolean;
}) {
  if (!enabled) {
    // (기존 emptyState 스타일은 프로젝트 설정에 맞게 유지)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 30, marginBottom: 10 }}>🔕</Text>
        <Text style={{ color: "#999" }}>피드백이 꺼져 있습니다.</Text>
      </View>
    );
  }

  return (
    // styles.content나 styles.card 부분은 기존 프로젝트의 style을 그대로 쓰시면 됩니다.
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {messages
        .filter((m) => m.feedback)
        .map((message) => (
          <View
            key={message.id}
            style={{
              backgroundColor: "#fff",
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              elevation: 2, // 그림자 효과 (안드로이드)
            }}
          >
            {/* 내가 보낸 메시지 */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: "#5C6BC0",
                marginBottom: 8,
              }}
            >
              {message.text}
            </Text>

            {message.feedback?.map((item: any) => (
              <View key={item.id}>
                {/* ⭐️ 3. 여기서 위에서 만든 함수를 불러옵니다! 빈 배열은 알아서 숨겨집니다. */}
                {renderFeedbackSection("단어 오류", item.wordErrors, "💡")}
                {renderFeedbackSection("문법 오류", item.grammarErrors, "💡")}
                {renderFeedbackSection(
                  "어색한 표현",
                  item.expressionErrors,
                  "💡",
                )}

                {/* 모범 문장 처리 */}
                {item.perfectSentence &&
                  item.perfectSentence.trim() !== "[]" && (
                    <View
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderColor: "#eee",
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "bold",
                          color: "#333",
                          marginBottom: 4,
                        }}
                      >
                        ✨ 추천 문장
                      </Text>
                      <Text
                        style={{
                          fontSize: 15,
                          color: "#2196f3", // 파란색 텍스트
                          fontWeight: "500",
                        }}
                      >
                        {item.perfectSentence}
                      </Text>
                    </View>
                  )}
              </View>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  webViewClose: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  webViewCloseText: { color: "#6B7280", fontSize: 14 },
  kakaoLoadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  kakaoLoadingText: { color: "#FFFFFF", fontSize: 14 },
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
  errorText: { color: "#DC2626", fontSize: 12, marginTop: 6 },
  signupSuccessText: { color: "#16A34A", fontSize: 12, marginTop: 6 },
  signupInlineRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  signupInlineInput: { flex: 1 },
  signupEmailButton: {
    backgroundColor: primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  signupEmailButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  signupProfileImageRow: { alignItems: "center", gap: 8, marginBottom: 8 },
  signupProfileAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: border,
  },
  signupProfileAvatarSlot: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: border,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  findAccountTabRow: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  findAccountTabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  findAccountTabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  findAccountTabText: { color: "#6B7280", fontSize: 13, fontWeight: "600" },
  findAccountTabTextActive: { color: primary },
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
  roomListHeader: {
    minHeight: 70,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  roomListTitle: { color: "#111827", fontSize: 20, fontWeight: "800" },
  roomListCount: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  newRoomButton: {
    backgroundColor: primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  newRoomButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  randomButton: {
    backgroundColor: "#F9FAFB",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  randomButtonText: { color: "#6B7280", fontSize: 12, fontWeight: "800" },
  roomListContent: { paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  setupContent: { padding: 22, paddingBottom: 30 },
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
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  profileAvatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: { color: primary, fontSize: 22, fontWeight: "900" },
  profileName: { color: "#111827", fontSize: 16, fontWeight: "900" },
  profileEmail: { color: "#9CA3AF", fontSize: 12, marginTop: 3 },
  levelBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 8,
  },
  logoutButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: "#FEF2F2",
  },
  logoutButtonText: { color: "#EF4444", fontSize: 12, fontWeight: "800" },
  levelList: { gap: 10, marginTop: 14 },
  levelOption: {
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  levelTitle: { color: "#111827", fontSize: 14, fontWeight: "900" },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  chatRoomCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  voiceRoomIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceRoomIconText: { fontSize: 18 },
  roomPreview: { flex: 1, minWidth: 0 },
  roomPreviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  roomPreviewBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 5,
  },
  roomPreviewTitle: {
    flex: 1,
    color: "#111827",
    fontSize: 14,
    fontWeight: "800",
  },
  roomPreviewDate: { color: "#9CA3AF", fontSize: 12 },
  roomPreviewMessage: { flex: 1, color: "#9CA3AF", fontSize: 12 },
  durationBadge: {
    color: primary,
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: "800",
  },
  chevron: { color: "#C7CBD1", fontSize: 30 },
  descriptionInput: { minHeight: 88, paddingTop: 14 },
  setupSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 8,
  },
  setupSectionTitle: { color: "#374151", fontSize: 13, fontWeight: "800" },
  addCharacterText: { color: primary, fontSize: 13, fontWeight: "800" },
  characterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 14,
    gap: 10,
  },
  avatarPicker: { flexDirection: "row", gap: 10, alignItems: "center" },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  photoSlot: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraText: { fontSize: 22 },
  avatarOptions: { flex: 1, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  avatarOption: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  avatarOptionActive: { borderColor: primary, backgroundColor: "#EEF2FF" },
  avatarOptionText: { fontSize: 17 },
  warningBox: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginTop: 16,
    marginBottom: 14,
  },
  warningText: { color: "#B45309", fontSize: 12, fontWeight: "800" },
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
  listText: { color: "#374151", fontSize: 14, lineHeight: 20 },
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
  callFeedbackSlot: { width: "100%", alignItems: "center", marginBottom: 12 },
  feedbackCard: {
    marginTop: 6,
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#FBBF24",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  feedbackPerfectBlock: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: "#F3F4F6",
  },
  feedbackPerfectLabel: {
    fontWeight: "700",
    color: "#B45309",
    fontSize: 11,
    marginBottom: 2,
  },
  feedbackPerfectText: { fontSize: 14, color: "#1F2937", fontWeight: "600" },
  avatarRingOuter: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarLarge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 4,
  },
  avatarActive: {
    backgroundColor: "#EEF2FF",
    borderWidth: 4,
    borderColor: "#C7D2FE",
  },
  avatarEmoji: { fontSize: 48 },
  callStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    marginBottom: 20,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4ADE80" },
  subtitleBox: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    width: "100%",
    maxWidth: 290,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 26,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  subtitleChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  subtitleChipText: { color: primary, fontSize: 12, fontWeight: "700" },
  subtitleText: { color: "#1F2937", fontSize: 14, lineHeight: 20, flex: 1 },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 28,
    marginTop: 18,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
  },
  micWrap: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  micPulseRing: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: primary,
    opacity: 0.4,
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center",
  },
  roundButtonActive: { backgroundColor: "#EEF2FF" },
  callButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 4,
  },
  endCallButton: {
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 4,
  },
  endCallIcon: { transform: [{ rotate: "135deg" }] },
  listeningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  listeningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: primary,
  },
  listeningText: { color: primary, fontSize: 12 },
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
  feedbackContainer: {
    marginTop: 4,
    backgroundColor: "rgba(255, 235, 59, 0.2)", // 약간 노란빛 배경 (원하시는 색으로 변경 가능)
    padding: 8,
    borderRadius: 8,
    alignSelf: "flex-end", // 내 채팅 기준 오른쪽 정렬
  },
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
  msgFeedbackCard: {
    marginTop: 6,
    backgroundColor: "#FFF9C4",
    padding: 14,
    borderRadius: 12,
    width: "85%",
    gap: 16,
  },
  scrapButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFDF6",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  scrapButtonActive: { backgroundColor: "#FDE68A", borderColor: "#FBBF24" },
  scrapButtonText: { fontSize: 11, fontWeight: "700", color: "#8A6D00" },
  msgFeedbackSection: {},
  msgFeedbackSectionTitle: {
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
    fontSize: 13,
  },
  msgFeedbackItem: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  msgFeedbackOriginal: {
    fontSize: 14,
    color: "#ff5252",
    textDecorationLine: "line-through",
    marginBottom: 4,
  },
  msgFeedbackCorrected: { fontSize: 15, color: "#4caf50", fontWeight: "bold" },
  msgFeedbackExplanation: { fontSize: 13, color: "#666", marginTop: 4 },
  msgFeedbackPerfectBlock: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#E0E0E0",
  },
  msgFeedbackPerfectLabel: {
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
    fontSize: 13,
  },
  msgFeedbackPerfectText: { fontSize: 14, color: "#1976D2", fontWeight: "600" },
  aiScrapButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingVertical: 2,
  },
  aiScrapText: { fontSize: 11, color: "#9CA3AF" },
  aiScrapBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    backgroundColor: primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  aiScrapBadgeText: { fontSize: 11, color: "#fff", fontWeight: "700" },
  devSkipButton: {
    marginTop: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#9CA3AF",
    alignItems: "center",
  },
  devSkipButtonText: { color: "#6B7280", fontSize: 12, fontWeight: "600" },
});

console.log(process.env.EXPO_PUBLIC_BASE_URL);
