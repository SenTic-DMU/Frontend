import { StatusBar } from "expo-status-bar";
import { useMemo, useState,useEffect } from "react";
import {
  Alert,
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
import * as ImagePicker from "expo-image-picker";
import { WebView } from "react-native-webview";

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
  lastMessage?: string;
  date?: string;
  duration?: string;
};

declare const global: { accessToken?: string };

const primary = "#4F46E5";
const darkPrimary = "#4338CA";
const softBg = "#F5F5F7";
const border = "#E5E7EB";

const voiceRooms = [
  { id: "cafe", title: "카페에서 주문하기", desc: "바리스타와 자연스럽게 말하기", level: "초급" },
  { id: "airport", title: "공항 체크인", desc: "탑승 수속과 수하물 대화", level: "중급" },
  { id: "meeting", title: "팀 미팅 참여", desc: "의견 말하기와 질문하기", level: "고급" },
];

const chatRooms = [
  {
    id: "friend",
    title: "친구와 스몰톡",
    desc: "일상적인 표현을 편하게 연습",
    lastMessage: "What did you do last weekend?",
    date: "오늘",
    duration: "8분",
  },
  {
    id: "travel",
    title: "여행 계획 세우기",
    desc: "일정, 예약, 추천 표현 익히기",
    lastMessage: "Could you recommend a place nearby?",
    date: "어제",
    duration: "16분",
  },
  {
    id: "work",
    title: "업무 메시지",
    desc: "짧고 공손한 비즈니스 채팅",
    lastMessage: "I'll send the file by this afternoon.",
    date: "5일 전",
    duration: "10분",
  },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [selectedRoom, setSelectedRoom] = useState<PracticeRoom>(voiceRooms[0]);
  const [selectedMode, setSelectedMode] = useState<"voice" | "text">("voice");
  const [kakaoWebViewVisible, setKakaoWebViewVisible] = useState(false);

  const go = (next: Screen) => setScreen(next);
  const startNewConversation = (mode: "voice" | "text") => {
    setSelectedMode(mode);
    setSelectedRoom({ id: `${mode}-new`, title: "", desc: "", level: "맞춤" });
    go("situation");
  };

  const handleKakaoLogin = () => setKakaoWebViewVisible(true);

  const handleWebViewNavChange = (navState: { url: string }) => {
    if (navState.url.startsWith(KAKAO_REDIRECT_URI)) {
      setKakaoWebViewVisible(false);
      const code = new URL(navState.url).searchParams.get("code");
      if (code) {
        console.log("카카오 인증 코드:", code);
        go("mode");
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <Modal visible={kakaoWebViewVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <Pressable style={styles.webViewClose} onPress={() => setKakaoWebViewVisible(false)}>
            <Text style={styles.webViewCloseText}>✕ 닫기</Text>
          </Pressable>
          <WebView source={{ uri: KAKAO_AUTH_URL }} onNavigationStateChange={handleWebViewNavChange} />
        </SafeAreaView>
      </Modal>
      {screen === "login" && <LoginScreen go={go} onKakaoLogin={handleKakaoLogin} />}
      {screen === "signup" && <SimpleFormScreen title="회원가입" subtitle="SenTic 계정을 만들고 학습을 시작하세요." go={go} />}
      {screen === "findAccount" && <SimpleFormScreen title="계정 찾기" subtitle="가입한 이메일로 아이디와 비밀번호 안내를 받을 수 있어요." go={go} />}
      {screen === "mode" && <ModeScreen go={go} />}
      {screen === "voiceRooms" && (
        <RoomListScreen
          title="음성 대화"
          rooms={voiceRooms}
          go={go}
          mode="voice"
          onCreate={() => startNewConversation("voice")}
          onPick={(room) => { setSelectedRoom(room); setSelectedMode("voice"); go("voiceChat"); }}
        />
      )}
      {screen === "chatRooms" && (
        <RoomListScreen
          title="채팅 대화"
          rooms={chatRooms}
          go={go}
          mode="text"
          onCreate={() => startNewConversation("text")}
          onPick={(room) => { setSelectedRoom({ ...room, level: "맞춤" }); setSelectedMode("text"); go("textChat"); }}
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
      {screen === "voiceChat" && <VoiceChatScreen room={selectedRoom} go={go} />}
      {screen === "textChat" && <TextChatScreen room={selectedRoom} go={go} />}
      {screen === "mypage" && <MyPageScreen go={go} />}
      {screen === "settings" && <SettingsScreen go={go} />}
      {screen === "payment" && <PaymentScreen go={go} />}
      {screen === "bookmarks" && <BookmarksScreen go={go} />}
      {screen === "notice" && <NoticeScreen go={go} />}
      {screen === "faq" && <FaqScreen go={go} />}
    </SafeAreaView>
  );
}

function LoginScreen({ go, onKakaoLogin }: { go: (screen: Screen) => void; onKakaoLogin: () => void }) {
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
      const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ loginId: username, password }),
      });
      const data = await res.json();
      if (data.success) {
        // 토큰 저장 (나중에 쓸 거라 일단 전역변수로)
        global.accessToken = data.data.accessToken;
        go("mode");
      } else {
        Alert.alert("로그인 실패", data.message ?? "아이디 또는 비밀번호를 확인해주세요.");
      }
    } catch (e) {
      Alert.alert("오류", "서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.loginContent} keyboardShouldPersistTaps="handled">
        <View style={styles.brandBlock}>
          <Text style={styles.logo}>SenTic</Text>
          <Text style={styles.muted}>AI 영어 소통 학습 파트너</Text>
        </View>
        <View style={styles.form}>
          <Label text="아이디" />
          <TextInput value={username} onChangeText={setUsername} placeholder="아이디 입력" style={styles.input} autoCapitalize="none" />
          <Label text="비밀번호" />
          <View style={styles.passwordRow}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호 입력"
              secureTextEntry={!showPassword}
              style={[styles.input, styles.passwordInput]}
            />
            <Pressable style={styles.eyeButton} onPress={() => setShowPassword((v) => !v)}>
              <Text style={styles.iconText}>{showPassword ? "숨김" : "보기"}</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => go("findAccount")} style={styles.alignRight}>
            <Text style={styles.linkText}>아이디 / 비밀번호 찾기</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryButton, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>{loading ? "로그인 중..." : "로그인"}</Text>
          </Pressable>
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>소셜 계정으로 시작</Text>
            <View style={styles.divider} />
          </View>
          <View style={styles.socialRow}>
            <Pressable style={[styles.socialButton, styles.kakao]} onPress={onKakaoLogin}>
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
        <ModeCard icon="🎙" title="음성 대화" desc="AI와 실시간 영어 회화 연습" color={primary} onPress={() => go("voiceRooms")} />
        <ModeCard icon="💬" title="채팅 대화" desc="텍스트로 편하게 영어 채팅" color="#16A34A" onPress={() => go("chatRooms")} />
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>이번 주 학습</Text>
            <Pressable onPress={() => go("mypage")}><Text style={styles.linkText}>상세보기</Text></Pressable>
          </View>
          <View style={styles.chart}>
            {weekly.map((minute, index) => (
              <View key={index} style={styles.barWrap}>
                <Text style={[styles.barMinute, index === weekly.length - 1 && styles.primaryText]}>{minute}분</Text>
                <View style={[styles.bar, { height: minute * 1.4 }, index === weekly.length - 1 && styles.activeBar]} />
                <Text style={[styles.barDay, index === weekly.length - 1 && styles.primaryText]}>{["월","화","수","목","금","토","일"][index]}</Text>
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
  title, rooms, go, mode, onCreate, onPick,
}: {
  title: string; rooms: PracticeRoom[]; go: (screen: Screen) => void;
  mode: "voice" | "text"; onCreate: () => void; onPick: (room: PracticeRoom) => void;
}) {
  return (
    <View style={styles.screenSoft}>
      <View style={styles.roomListHeader}>
        <Pressable style={styles.headerButton} onPress={() => go("mode")}>
          <Text style={styles.headerIcon}>‹</Text>
        </Pressable>
        <View style={styles.flex}>
          <Text style={styles.roomListTitle}>{title}</Text>
          <Text style={styles.roomListCount}>{rooms.length}개의 대화방</Text>
        </View>
        <Pressable style={styles.newRoomButton} onPress={onCreate}>
          <Text style={styles.newRoomButtonText}>+ 새 대화</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.roomListContent}>
        {rooms.map((room) => (
          <Pressable key={room.id} style={styles.chatRoomCard} onPress={() => onPick(room)}>
            <View style={styles.voiceRoomIcon}>
              <Text style={styles.voiceRoomIconText}>{mode === "voice" ? "🎙" : "💬"}</Text>
            </View>
            <View style={styles.roomPreview}>
              <View style={styles.roomPreviewTop}>
                <Text style={styles.roomPreviewTitle} numberOfLines={1}>{room.title}</Text>
                <Text style={styles.roomPreviewDate}>{room.date}</Text>
              </View>
              <View style={styles.roomPreviewBottom}>
                <Text style={styles.roomPreviewMessage} numberOfLines={1}>{room.lastMessage ?? room.desc}</Text>
                {room.duration && <Text style={styles.durationBadge}>{room.duration}</Text>}
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
  mode, room, go, onStart,
}: {
  mode: "voice" | "text"; room: PracticeRoom;
  go: (screen: Screen) => void; onStart: (room: PracticeRoom) => void;
}) {
  const presets = [
    { title: "카페에서 주문하기", desc: "처음 방문한 카페에서 원하는 메뉴를 묻고 추천을 받는 상황", name: "바리스타", trait: "친절하고 빠르게 주문을 도와주는 직원", avatar: "👩" },
    { title: "비즈니스 미팅", desc: "프로젝트 진행 상황을 공유하고 다음 일정을 조율하는 상황", name: "Alex", trait: "차분하고 논리적인 해외 파트너", avatar: "👨" },
    { title: "여행 계획 세우기", desc: "여름 여행지를 고르고 일정과 예산을 영어로 상의하는 상황", name: "여행 친구", trait: "호기심이 많고 새로운 장소를 좋아함", avatar: "🧑" },
  ];

  const [title, setTitle] = useState(room.title || "");
  const [desc, setDesc] = useState(room.desc || "");
  const [characters, setCharacters] = useState([
    { name: presets[0].name, trait: presets[0].trait, avatar: presets[0].avatar, photoUri: null as string | null },
  ]);

  const addCharacter = () => {
    if (characters.length >= 2) return;
    setCharacters((prev) => [...prev, { name: "", trait: "", avatar: "👨", photoUri: null }]);
  };

  const updateCharacter = (index: number, field: string, value: string) => {
    setCharacters((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const pickPhoto = async (index: number) => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
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
      setCharacters((prev) => prev.map((c, i) => (i === index ? { ...c, photoUri: result.assets[0].uri } : c)));
    }
  };

  const randomize = () => {
    const next = presets[Math.floor(Math.random() * presets.length)];
    setTitle(next.title);
    setDesc(next.desc);
    setCharacters([{ name: next.name, trait: next.trait, avatar: next.avatar, photoUri: null }]);
  };

  const start = () => {
    onStart({
      ...room,
      title: title.trim() || "새 영어 대화",
      desc: desc.trim() || "직접 설정한 영어 대화 상황",
      lastMessage: desc.trim() || room.lastMessage,
      date: "오늘",
    });
    go(mode === "voice" ? "voiceChat" : "textChat");
  };

  return (
    <View style={styles.screenSoft}>
      <View style={styles.roomListHeader}>
        <Pressable style={styles.headerButton} onPress={() => go(mode === "voice" ? "voiceRooms" : "chatRooms")}>
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

      <ScrollView contentContainerStyle={styles.setupContent}>
        <Label text="대화방 제목" />
        <TextInput value={title} onChangeText={setTitle} placeholder="예: 카페에서 주문하기" style={styles.input} />

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
            <Text style={[styles.addCharacterText, characters.length >= 2 && { color: "#D1D5DB" }]}>+ 추가</Text>
          </Pressable>
        </View>

        {characters.map((char, index) => (
          <View key={index} style={[styles.characterCard, index > 0 && { marginTop: 10 }]}>
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
                    style={[styles.avatarOption, char.avatar === item && styles.avatarOptionActive]}
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
          <Text style={styles.warningText}>부적절한 상황 설정은 자동으로 제한됩니다</Text>
        </View>

        <PrimaryButton label="대화 시작하기" onPress={start} />
      </ScrollView>
    </View>
  );
}

function VoiceChatScreen({ room, go }: { room: { title: string }; go: (screen: Screen) => void }) {
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [feedbackOn, setFeedbackOn] = useState(true);
  const [tab, setTab] = useState<"call" | "history" | "feedback">("call");

  const history = useMemo<Message[]>(() => [
    { id: "1", speaker: "ai", text: "Hello! How can I help you today?", time: "10:30" },
    { id: "2", speaker: "user", text: "I want to order a coffee, please.", time: "10:31", feedback: ["더 자연스럽게: I'd like to order a coffee, please."] },
    { id: "3", speaker: "ai", text: "Sure! What size would you like?", time: "10:31" },
  ], []);

  return (
    <View style={styles.screen}>
      <Header title={room.title} go={go} backTo="voiceRooms" />
      <TabBar active={tab} setActive={setTab} labels={{ call: "통화", history: "대화내역", feedback: "피드백" }} />
      {tab === "call" && (
        <View style={styles.callBody}>
          <View style={[styles.avatarLarge, inCall && styles.avatarActive]}>
            <Text style={styles.avatarEmoji}>🤖</Text>
          </View>
          <Text style={styles.h2}>AI 파트너</Text>
          <Text style={styles.muted}>{inCall ? "통화 중입니다" : "통화를 시작해 보세요"}</Text>
          {inCall && (
            <View style={styles.subtitleBox}>
              <Text style={styles.caption}>AI 파트너</Text>
              <Text style={styles.subtitleText}>Hello! How can I help you today?</Text>
            </View>
          )}
          <View style={styles.controlRow}>
            {inCall && <RoundButton label={muted ? "마이크끔" : "마이크"} onPress={() => setMuted((v) => !v)} />}
            {inCall && <RoundButton label={speakerOff ? "스피커끔" : "스피커"} onPress={() => setSpeakerOff((v) => !v)} />}
            <Pressable style={[styles.callButton, inCall && styles.endCallButton]} onPress={() => setInCall((v) => !v)}>
              <Text style={styles.callButtonText}>{inCall ? "종료" : "시작"}</Text>
            </Pressable>
          </View>
          <Pressable style={[styles.feedbackToggle, !feedbackOn && styles.feedbackToggleOff]} onPress={() => setFeedbackOn((v) => !v)}>
            <Text style={[styles.feedbackToggleText, !feedbackOn && styles.grayText]}>피드백 {feedbackOn ? "ON" : "OFF"}</Text>
          </Pressable>
        </View>
      )}
      {tab === "history" && <MessageList messages={history} />}
      {tab === "feedback" && <FeedbackList messages={history} enabled={feedbackOn} />}
    </View>
  );
}

function TextChatScreen({ room, go }: { room: { title: string }; go: (screen: Screen) => void }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", speaker: "ai", text: "Hey! What's up?", time: "10:30" },
    { id: "2", speaker: "user", text: "I'm good. What about you?", time: "10:31", feedback: ["더 자연스럽게: I'm doing well, thanks! How about you?"] },
    { id: "3", speaker: "ai", text: "I'm doing great! Wanna grab some coffee later?", time: "10:31" },
  ]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      speaker: "user",
      text,
      time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      feedback: [`추천 표현: ${text.replace("I want to", "I'd like to")}`],
    };
    setMessages((prev) => [...prev, userMessage, { id: `${Date.now()}-ai`, speaker: "ai", text: "That sounds good! Tell me more.", time: "now" }]);
    setInput("");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <Header title={room.title} go={go} backTo="chatRooms" />
      <MessageList messages={messages} />
      <View style={styles.composer}>
        <TextInput value={input} onChangeText={setInput} placeholder="메시지를 입력하세요" style={styles.composerInput} />
        <Pressable style={[styles.sendButton, !input.trim() && styles.disabled]} onPress={send}>
          <Text style={styles.sendText}>전송</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function SimpleFormScreen({ title, subtitle, go }: { title: string; subtitle: string; go: (screen: Screen) => void }) {
  return (
    <View style={styles.screenSoft}>
      <Header title={title} go={go} backTo="login" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>{title}</Text>
        <Text style={styles.mutedBlock}>{subtitle}</Text>
        <Label text="이메일" />
        <TextInput placeholder="email@example.com" style={styles.input} keyboardType="email-address" />
        <Label text="비밀번호" />
        <TextInput placeholder="비밀번호" secureTextEntry style={styles.input} />
        <PrimaryButton label={title === "회원가입" ? "가입하기" : "안내 받기"} onPress={() => go("mode")} />
      </ScrollView>
    </View>
  );
}


function NoticeScreen({ go }: { go: (screen: Screen) => void }) {
  interface Notice {
    id: string;
    title: string;
    content: string;
    date: string;
    isImportant: boolean;
  }

  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const notices: Notice[] = [
    { id: "1", title: "SenTic 정식 오픈을 축하합니다! 🎉", content: `안녕하세요, SenTic 팀입니다.\n\n드디어 SenTic이 정식으로 오픈하게 되었습니다!\n\nAI와 함께하는 영어 회화 학습 서비스 SenTic은 여러분의 영어 실력 향상을 위해 최선을 다하겠습니다.\n\n주요 기능:\n• 음성 대화 모드 - 실시간 AI 음성 대화\n• 채팅 대화 모드 - 텍스트 기반 학습\n• 실시간 피드백 - 문법, 발음, 표현 교정\n• 표현 북마크 - 유용한 표현 저장 및 복습\n\n앞으로도 더 나은 서비스를 제공하기 위해 노력하겠습니다.\n감사합니다.`, date: "2026-04-06", isImportant: true },
    { id: "2", title: "프리미엄 플랜 출시 안내", content: `프리미엄 플랜이 새롭게 출시되었습니다.\n\n프리미엄 플랜 혜택:\n• 무제한 대화 이용\n• 고급 AI 튜터 이용\n• 상세한 학습 리포트\n• 우선 고객 지원\n\n지금 바로 프리미엄으로 업그레이드하고 더 많은 기능을 경험해보세요!`, date: "2026-04-05", isImportant: false },
    { id: "3", title: "서버 점검 안내 (완료)", content: `서비스 품질 향상을 위한 서버 점검이 완료되었습니다.\n\n점검 일시: 2026년 4월 4일 02:00 ~ 04:00 (2시간)\n점검 내용: 서버 성능 개선 및 안정화 작업\n\n점검 중 일시적으로 서비스 이용이 불가능했던 점 양해 부탁드립니다.`, date: "2026-04-04", isImportant: false },
    { id: "4", title: "AI 대화 품질 개선 업데이트", content: `AI 대화 엔진이 업데이트되었습니다.\n\n개선 사항:\n• 더욱 자연스러운 대화 흐름\n• 발음 피드백 정확도 향상\n• 문법 교정 기능 강화\n• 다양한 주제 대화 지원 확대`, date: "2026-04-03", isImportant: false },
    { id: "5", title: "이용약관 및 개인정보처리방침 개정 안내", content: `이용약관 및 개인정보처리방침이 개정되었습니다.\n\n주요 변경 사항:\n• 개인정보 보호 정책 강화\n• 서비스 이용 조건 명확화\n• 데이터 처리 방침 개선`, date: "2026-04-01", isImportant: true },
  ];

  const importantNotices = notices.filter((n) => n.isImportant);
  const regularNotices = notices.filter((n) => !n.isImportant);

  if (selectedNotice) {
    return (
      <View style={styles.screenSoft}>
        <View style={ntStyles.header}>
          <Pressable style={ntStyles.backBtn} onPress={() => setSelectedNotice(null)}>
            <Text style={ntStyles.backIcon}>‹</Text>
          </Pressable>
          <Text style={ntStyles.headerTitle}>공지사항</Text>
        </View>
        <ScrollView contentContainerStyle={ntStyles.detailContent}>
          {selectedNotice.isImportant && (
            <View style={ntStyles.importantBadge}>
              <Text style={ntStyles.importantBadgeText}>📌 중요 공지</Text>
            </View>
          )}
          <Text style={ntStyles.detailTitle}>{selectedNotice.title}</Text>
          <Text style={ntStyles.detailDate}>{selectedNotice.date}</Text>
          <View style={ntStyles.detailCard}>
            <Text style={ntStyles.detailBody}>{selectedNotice.content}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screenSoft}>
      <View style={ntStyles.header}>
        <Pressable style={ntStyles.backBtn} onPress={() => go("mode")}>
          <Text style={ntStyles.backIcon}>‹</Text>
        </Pressable>
        <Text style={ntStyles.headerTitle}>공지사항</Text>
      </View>
      <ScrollView contentContainerStyle={ntStyles.listContent}>
        {/* 중요 공지 */}
        {importantNotices.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 }}>
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
                    <Text style={ntStyles.noticeTitle} numberOfLines={1}>{notice.title}</Text>
                    <Text style={ntStyles.noticeDate}>{notice.date}</Text>
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
                    <Text style={ntStyles.noticeTitle} numberOfLines={1}>{notice.title}</Text>
                    <Text style={ntStyles.noticeDate}>{notice.date}</Text>
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
  }

  const categoryConfig: Record<Category, { color: string; bg: string; dot: string }> = {
    단어: { color: "#2563EB", bg: "#EFF6FF", dot: "#60A5FA" },
    문법: { color: "#7C3AED", bg: "#F5F3FF", dot: "#A78BFA" },
    문장: { color: "#16A34A", bg: "#F0FDF4", dot: "#4ADE80" },
  };

  const [viewMode, setViewMode] = useState<ViewMode>("by-category");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [expressions, setExpressions] = useState<SavedExpression[]>([
    { id: "1", text: "I'd like to order a coffee, please.", translation: "커피를 주문하고 싶습니다.", category: "문장", roomName: "카페에서 주문하기", roomId: "1", savedDate: "04/28" },
    { id: "2", text: "What's up?", translation: "안녕? / 어떻게 지내?", category: "단어", roomName: "영화 이야기", roomId: "2", savedDate: "04/28" },
    { id: "3", text: "Subject-verb agreement", translation: "주어-동사 일치", category: "문법", roomName: "비즈니스 미팅", roomId: "3", savedDate: "04/27" },
    { id: "4", text: "Could you please help me?", translation: "도와주실 수 있으신가요?", category: "문장", roomName: "카페에서 주문하기", roomId: "1", savedDate: "04/26" },
  ]);

  const isInsideDetail = selectedCategory !== null || selectedRoom !== null;

  const groupByRoom = () => {
    const grouped: { [key: string]: SavedExpression[] } = {};
    expressions.forEach((expr) => {
      if (!grouped[expr.roomName]) grouped[expr.roomName] = [];
      grouped[expr.roomName].push(expr);
    });
    return grouped;
  };

  const deleteExpression = (id: string) => {
    setExpressions(expressions.filter((e) => e.id !== id));
  };

  const renderExpression = (expr: SavedExpression, showRoom = false) => {
    const config = categoryConfig[expr.category];
    return (
      <View key={expr.id} style={bkStyles.exprCard}>
        <View style={{ flex: 1 }}>
          <Text style={bkStyles.exprText}>{expr.text}</Text>
          <Text style={bkStyles.exprTranslation}>{expr.translation}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <View style={[bkStyles.catBadge, { backgroundColor: config.bg }]}>
              <Text style={[bkStyles.catBadgeText, { color: config.color }]}>{expr.category}</Text>
            </View>
            {showRoom && <Text style={bkStyles.exprMeta}>{expr.roomName}</Text>}
            <Text style={bkStyles.exprDate}>{expr.savedDate}</Text>
          </View>
        </View>
        <Pressable
          onPress={() => deleteExpression(expr.id)}
          style={bkStyles.deleteBtn}
        >
          <Text style={bkStyles.deleteBtnText}>🗑</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.screenSoft}>
      {/* 헤더 */}
      {isInsideDetail ? (
        <View style={bkStyles.header}>
          <Pressable style={bkStyles.backBtn} onPress={() => { setSelectedCategory(null); setSelectedRoom(null); }}>
            <Text style={bkStyles.backIcon}>‹</Text>
          </Pressable>
          <View>
            <Text style={bkStyles.headerTitle}>{selectedCategory ?? selectedRoom}</Text>
            <Text style={bkStyles.headerSub}>
              {selectedCategory
                ? `${expressions.filter(e => e.category === selectedCategory).length}개 저장됨`
                : `${groupByRoom()[selectedRoom!]?.length ?? 0}개 저장됨`}
            </Text>
          </View>
        </View>
      ) : (
        <View style={bkStyles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Pressable style={bkStyles.backBtn} onPress={() => go("mode")}>
              <Text style={bkStyles.backIcon}>‹</Text>
            </Pressable>
            <View>
              <Text style={bkStyles.headerTitle}>저장된 표현</Text>
              <Text style={bkStyles.headerSub}>{expressions.length}개 저장됨</Text>
            </View>
          </View>
          {/* 탭 */}
          <View style={bkStyles.tabContainer}>
            <Pressable
              style={[bkStyles.tab, viewMode === "by-category" && bkStyles.tabActive]}
              onPress={() => { setViewMode("by-category"); setSelectedRoom(null); }}
            >
              <Text style={[bkStyles.tabText, viewMode === "by-category" && bkStyles.tabTextActive]}>카테고리 🏷</Text>
            </Pressable>
            <Pressable
              style={[bkStyles.tab, viewMode === "by-room" && bkStyles.tabActive]}
              onPress={() => { setViewMode("by-room"); setSelectedCategory(null); }}
            >
              <Text style={[bkStyles.tabText, viewMode === "by-room" && bkStyles.tabTextActive]}>대화방 📁</Text>
            </Pressable>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={bkStyles.content}>
        {/* 카테고리 목록 */}
        {!isInsideDetail && viewMode === "by-category" && (
          <View style={{ gap: 10 }}>
            {(["단어", "문법", "문장"] as Category[]).map((cat) => {
              const count = expressions.filter((e) => e.category === cat).length;
              const config = categoryConfig[cat];
              return (
                <Pressable
                  key={cat}
                  style={bkStyles.listCard}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <View style={[bkStyles.catIcon, { backgroundColor: config.bg }]}>
                    <View style={[bkStyles.catDot, { backgroundColor: config.dot }]} />
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
                  <Text style={bkStyles.listCardSub}>{roomExprs.length}개 저장됨</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* 카테고리 상세 */}
        {selectedCategory && (
          <View style={{ gap: 10 }}>
            {expressions.filter((e) => e.category === selectedCategory).map((e) => renderExpression(e, true))}
          </View>
        )}

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


function SettingsScreen({ go }: { go: (screen: Screen) => void }) {
  const [notifications, setNotifications] = useState(true);

  const logout = () => {
    Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "로그아웃", style: "destructive", onPress: () => go("login") },
    ]);
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <Pressable
      onPress={onChange}
      style={[stStyles.toggle, value ? stStyles.toggleOn : stStyles.toggleOff]}
    >
      <View style={[stStyles.toggleThumb, value ? stStyles.toggleThumbOn : stStyles.toggleThumbOff]} />
    </Pressable>
  );

  return (
    <View style={styles.screenSoft}>
      {/* 헤더 */}
      <View style={stStyles.header}>
        <Pressable style={stStyles.backBtn} onPress={() => go("mode")}>
          <Text style={stStyles.backIcon}>‹</Text>
        </Pressable>
        <Text style={stStyles.headerTitle}>설정</Text>
      </View>

      <ScrollView contentContainerStyle={stStyles.content}>
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
            <Toggle value={notifications} onChange={() => setNotifications((v) => !v)} />
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

        {/* 버전 */}
        <Text style={stStyles.version}>SenTic v1.0.0</Text>
      </ScrollView>
    </View>
  );
}



function PaymentScreen({ go }: { go: (screen: Screen) => void }) {
  type Plan = "free" | "monthly" | "yearly";

  const CURRENT_SUBSCRIPTION: { plan: Plan; nextBillingDate: string; daysLeft: number } | null = {
    plan: "monthly",
    nextBillingDate: "2026년 6월 11일",
    daysLeft: 31,
  };

  const plans = {
    free: {
      name: "Free", price: "0", period: "",
      features: ["하루 5회 대화", "기본 피드백"],
    },
    monthly: {
      name: "Monthly", price: "14,900", period: "/월", badge: "인기",
      features: ["무제한 대화", "고급 피드백", "실시간 음성 피드백", "표현 무제한 저장", "우선 고객 지원", "광고 없음"],
    },
    yearly: {
      name: "Yearly", price: "149,000", period: "/년", badge: "20% 할인",
      features: ["무제한 대화", "고급 피드백", "실시간 음성 피드백", "표현 무제한 저장", "우선 고객 지원", "광고 없음", "2개월 무료"],
    },
  };

  const [selectedPlan, setSelectedPlan] = useState<Plan>(CURRENT_SUBSCRIPTION?.plan ?? "monthly");

  const handleSubscribe = () => {
    Alert.alert("구독", `${plans[selectedPlan].name} 플랜 구독이 진행됩니다.`);
  };

  const handleCancel = () => {
    Alert.alert("구독 취소", "구독을 취소하시겠습니까?", [
      { text: "아니요", style: "cancel" },
      { text: "취소하기", style: "destructive", onPress: () => Alert.alert("취소 완료", "구독이 취소되었습니다.") },
    ]);
  };

  return (
    <View style={styles.screenSoft}>
      {/* 헤더 */}
      <View style={pyStyles.header}>
        <Pressable style={pyStyles.backBtn} onPress={() => go("mypage")}>
          <Text style={pyStyles.backIcon}>‹</Text>
        </Pressable>
        <Text style={pyStyles.headerTitle}>결제 및 구독</Text>
      </View>

      <ScrollView contentContainerStyle={pyStyles.content}>
        {/* 현재 구독 배너 */}
        {CURRENT_SUBSCRIPTION ? (
          <View style={pyStyles.banner}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <View style={pyStyles.crownWrap}>
                <Text style={{ fontSize: 20 }}>👑</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={pyStyles.bannerSub}>현재 구독 중</Text>
                <Text style={pyStyles.bannerTitle}>{plans[CURRENT_SUBSCRIPTION.plan].name} 플랜</Text>
              </View>
              <View style={pyStyles.premiumTag}>
                <Text style={pyStyles.premiumTagText}>프리미엄</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={pyStyles.bannerInfoBox}>
                <Text style={pyStyles.bannerInfoLabel}>⏱ 남은 기간</Text>
                <Text style={pyStyles.bannerInfoValue}>D-{CURRENT_SUBSCRIPTION.daysLeft}</Text>
              </View>
              <View style={pyStyles.bannerInfoBox}>
                <Text style={pyStyles.bannerInfoLabel}>📅 다음 결제일</Text>
                <Text style={pyStyles.bannerInfoValue}>{CURRENT_SUBSCRIPTION.nextBillingDate}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[pyStyles.banner, { alignItems: "center" }]}>
            <View style={[pyStyles.crownWrap, { marginBottom: 12 }]}>
              <Text style={{ fontSize: 20 }}>👑</Text>
            </View>
            <Text style={pyStyles.bannerTitle}>무제한 학습으로 영어 실력 향상</Text>
            <Text style={pyStyles.bannerSub}>지금 구독하고 더 많은 기능을 경험하세요</Text>
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
                  isSelected ? pyStyles.planCardSelected : pyStyles.planCardDefault,
                ]}
              >
                {/* 플랜 헤더 */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={[pyStyles.radio, isSelected ? pyStyles.radioSelected : pyStyles.radioDefault]}>
                      {isSelected && <View style={pyStyles.radioDot} />}
                    </View>
                    <Text style={[pyStyles.planName, isSelected && { color: primary }]}>{plan.name}</Text>
                    {badge && (
                      <View style={[pyStyles.badge, planId === "monthly" ? pyStyles.badgeBlue : pyStyles.badgeGreen]}>
                        <Text style={[pyStyles.badgeText, planId === "monthly" ? { color: "#4F46E5" } : { color: "#16A34A" }]}>{badge}</Text>
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
                    <View key={f} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ color: isSelected ? primary : "#D1D5DB", fontSize: 12 }}>✓</Text>
                      <Text style={[pyStyles.featureText, isSelected ? { color: "#4B5563" } : { color: "#9CA3AF" }]}>{f}</Text>
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
            <Text style={pyStyles.savingText}>💰 월간 대비 <Text style={{ fontWeight: "800" }}>약 31,700원 절약</Text>됩니다 (연 기준)</Text>
          </View>
        )}

        {/* 결제 버튼 */}
        {selectedPlan !== "free" && (
          <View style={{ gap: 10 }}>
            {CURRENT_SUBSCRIPTION?.plan === selectedPlan ? (
              <View style={{ gap: 8 }}>
                <View style={pyStyles.currentPlanBox}>
                  <Text style={pyStyles.currentPlanText}>현재 구독 중인 플랜입니다</Text>
                  <Text style={pyStyles.currentPlanSub}>다음 결제일: {CURRENT_SUBSCRIPTION.nextBillingDate}</Text>
                </View>
                <Pressable style={pyStyles.cancelBtn} onPress={handleCancel}>
                  <Text style={pyStyles.cancelBtnText}>구독 취소</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <Pressable style={pyStyles.subscribeBtn} onPress={handleSubscribe}>
                  <Text style={pyStyles.subscribeBtnText}>
                    {plans[selectedPlan].name} 구독하기 — ₩{plans[selectedPlan].price}{plans[selectedPlan].period}
                  </Text>
                </Pressable>
                <Text style={pyStyles.cancelNote}>언제든지 구독을 취소할 수 있습니다</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}


function FaqScreen({ go }: { go: (screen: Screen) => void }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqData = [
    {
      category: "학습 방법",
      items: [
        { question: "음성 대화와 채팅 대화의 차이는 무엇인가요?", answer: "음성 대화는 실제 전화 통화처럼 AI와 실시간으로 대화하며 발음과 유창성을 연습할 수 있습니다. 채팅 대화는 메시지 형식으로 문법과 표현을 천천히 연습할 수 있어, 각자의 학습 목적에 맞게 선택하실 수 있습니다." },
        { question: "하루에 얼마나 학습해야 하나요?", answer: "매일 15-20분 정도 꾸준히 학습하는 것을 권장합니다. 짧은 시간이라도 매일 반복하는 것이 실력 향상에 가장 효과적입니다." },
        { question: "피드백은 어떻게 확인하나요?", answer: "각 대화 종료 후 자동으로 피드백 화면이 표시되며, 마이페이지에서 이전 피드백을 다시 확인할 수 있습니다." },
      ],
    },
    {
      category: "기능 사용",
      items: [
        { question: "요정 캐릭터는 언제 나타나나요?", answer: "음성 대화 중 문법이나 표현이 틀렸을 때 화면이 흑백으로 변하며 요정 캐릭터가 나타나 올바른 표현을 알려줍니다." },
        { question: "대화 상황은 어떻게 설정하나요?", answer: "대화 모드를 선택한 후 상황 설정 화면에서 원하는 시나리오를 선택할 수 있습니다. 카페 주문, 여행, 비즈니스 등 다양한 상황이 준비되어 있습니다." },
        { question: "학습 기록은 어디서 볼 수 있나요?", answer: "홈 화면에서 이번 주 학습 차트를 확인할 수 있으며, 마이페이지에서 더 자세한 학습 통계를 볼 수 있습니다." },
      ],
    },
    {
      category: "계정 및 결제",
      items: [
        { question: "프리미엄 플랜의 혜택은 무엇인가요?", answer: "프리미엄 플랜은 무제한 대화, 모든 상황 시나리오 이용, 상세한 피드백 분석, 광고 제거 등의 혜택을 제공합니다." },
        { question: "비밀번호를 잊어버렸어요.", answer: "로그인 화면에서 '비밀번호 찾기'를 클릭하여 등록된 이메일로 인증 후 비밀번호를 재설정하실 수 있습니다." },
        { question: "구독을 취소하려면 어떻게 하나요?", answer: "마이페이지 > 결제 및 구독에서 언제든지 구독을 취소하실 수 있습니다. 남은 기간까지는 프리미엄 혜택이 유지됩니다." },
      ],
    },
    {
      category: "문제 해결",
      items: [
        { question: "음성 인식이 잘 안 돼요.", answer: "조용한 환경에서 마이크에 가까이 또렷하게 말씀해주세요. 설정에서 마이크 권한을 확인하시고, 앱을 재시작해보시는 것도 도움이 됩니다." },
        { question: "앱이 느리거나 멈춰요.", answer: "기기를 재부팅하거나 앱을 재설치해보세요. 문제가 계속되면 고객센터로 문의해주시면 신속히 도와드리겠습니다." },
      ],
    },
  ];

  let globalIndex = 0;

  return (
    <View style={styles.screenSoft}>
      {/* 헤더 */}
      <View style={fqStyles.header}>
        <Pressable style={fqStyles.backBtn} onPress={() => go("settings")}>
          <Text style={fqStyles.backIcon}>‹</Text>
        </Pressable>
        <Text style={fqStyles.headerTitle}>자주 묻는 질문</Text>
      </View>

      <ScrollView contentContainerStyle={fqStyles.content}>
        {faqData.map((category, catIdx) => {
          return (
            <View key={catIdx} style={{ marginBottom: 6 }}>
              <Text style={fqStyles.categoryLabel}>{category.category}</Text>
              <View style={fqStyles.card}>
                {category.items.map((item) => {
                  const currentIndex = globalIndex++;
                  const isExpanded = expandedIndex === currentIndex;
                  return (
                    <View key={currentIndex}>
                      <Pressable
                        style={[fqStyles.qRow, currentIndex > 0 && fqStyles.qRowBorder]}
                        onPress={() => setExpandedIndex(isExpanded ? null : currentIndex)}
                      >
                        <Text style={fqStyles.qLabel}>Q.</Text>
                        <Text style={fqStyles.qText}>{item.question}</Text>
                        <Text style={[fqStyles.chevronIcon, isExpanded && { transform: [{ rotate: "180deg" }] }]}>
                          ⌄
                        </Text>
                      </Pressable>
                      {isExpanded && (
                        <View style={fqStyles.aBox}>
                          <Text style={fqStyles.aLabel}>A.</Text>
                          <Text style={fqStyles.aText}>{item.answer}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* 추가 문의 */}
        <View style={fqStyles.contactBox}>
          <Text style={fqStyles.contactTitle}>더 궁금한 점이 있으신가요?</Text>
          <Text style={fqStyles.contactSub}>support@sentic.app으로 문의해주세요</Text>
          <Pressable
            style={fqStyles.contactBtn}
            onPress={() => Alert.alert("고객센터", "support@sentic.app으로 문의해주세요.")}
          >
            <Text style={fqStyles.contactBtnText}>고객센터 문의하기</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const fqStyles = StyleSheet.create({
  header: {
    backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 10,
  },
  backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB" },
  backIcon: { fontSize: 30, color: "#4B5563", lineHeight: 32 },
  headerTitle: { color: "#111827", fontSize: 16, fontWeight: "800" },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  categoryLabel: {
    color: "#9CA3AF", fontSize: 11, fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8,
  },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 16,
    borderWidth: 1, borderColor: "#F3F4F6", overflow: "hidden",
  },
  qRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 16, paddingVertical: 14, gap: 8,
  },
  qRowBorder: { borderTopWidth: 1, borderTopColor: "#F9FAFB" },
  qLabel: { color: primary, fontSize: 12, fontWeight: "700", marginTop: 1, flexShrink: 0 },
  qText: { flex: 1, color: "#374151", fontSize: 14, lineHeight: 20 },
  chevronIcon: { color: "#9CA3AF", fontSize: 18, marginTop: -2, flexShrink: 0 },
  aBox: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: "#F9FAFB", paddingHorizontal: 16, paddingVertical: 14, gap: 8,
  },
  aLabel: { color: "#16A34A", fontSize: 12, fontWeight: "700", marginTop: 1, flexShrink: 0 },
  aText: { flex: 1, color: "#6B7280", fontSize: 13, lineHeight: 20 },
  contactBox: {
    backgroundColor: "#EEF2FF", borderWidth: 1, borderColor: "#C7D2FE",
    borderRadius: 16, padding: 20, alignItems: "center",
  },
  contactTitle: { color: "#374151", fontSize: 14, fontWeight: "700", marginBottom: 6 },
  contactSub: { color: "#6B7280", fontSize: 12, marginBottom: 14 },
  contactBtn: { backgroundColor: primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  contactBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
});


const pyStyles = StyleSheet.create({
  header: {
    backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 10,
  },
  backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB" },
  backIcon: { fontSize: 30, color: "#4B5563", lineHeight: 32 },
  headerTitle: { color: "#111827", fontSize: 16, fontWeight: "800" },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  banner: { backgroundColor: primary, borderRadius: 20, padding: 20 },
  crownWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  bannerTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  bannerSub: { color: "#C7D2FE", fontSize: 11, marginTop: 2 },
  premiumTag: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  premiumTagText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  bannerInfoBox: { flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 12 },
  bannerInfoLabel: { color: "#C7D2FE", fontSize: 10, marginBottom: 4 },
  bannerInfoValue: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  planCard: { borderWidth: 2, borderRadius: 20, padding: 16 },
  planCardSelected: { borderColor: primary, backgroundColor: "#EEF2FF" },
  planCardDefault: { borderColor: "#F3F4F6", backgroundColor: "#FFFFFF" },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: "center", justifyContent: "center" },
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
  badgeYellow: { backgroundColor: "#FEF9C3", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeYellowText: { color: "#A16207", fontSize: 10, fontWeight: "700" },
  featureText: { fontSize: 12 },
  savingBox: { backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0", borderRadius: 12, padding: 14 },
  savingText: { color: "#15803D", fontSize: 12 },
  currentPlanBox: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#F3F4F6", borderRadius: 12, padding: 16, alignItems: "center" },
  currentPlanText: { color: "#4B5563", fontSize: 14 },
  currentPlanSub: { color: "#9CA3AF", fontSize: 12, marginTop: 4 },
  cancelBtn: { borderWidth: 1, borderColor: "#FECACA", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  cancelBtnText: { color: "#EF4444", fontSize: 14 },
  subscribeBtn: { backgroundColor: primary, borderRadius: 12, paddingVertical: 16, alignItems: "center" },
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
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  backIcon: { fontSize: 30, color: "#4B5563", lineHeight: 32 },
  headerTitle: { color: "#111827", fontSize: 16, fontWeight: "800" },
  content: { padding: 20, gap: 10, paddingBottom: 32 },
  sectionLabel: {
    color: "#9CA3AF", fontSize: 11, fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 0.5,
    marginTop: 6, marginBottom: 4,
  },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 16,
    borderWidth: 1, borderColor: "#F3F4F6", overflow: "hidden",
  },
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#F9FAFB" },
  rowTitle: { color: "#374151", fontSize: 14 },
  rowSub: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  premiumBadge: {
    backgroundColor: "#EEF2FF", borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  premiumBadgeText: { color: "#4F46E5", fontSize: 11, fontWeight: "700" },
  iconWrapBlue: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center", justifyContent: "center",
  },
  iconWrapPurple: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "#F5F3FF",
    alignItems: "center", justifyContent: "center",
  },
  iconWrapRed: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "#FEF2F2",
    alignItems: "center", justifyContent: "center",
  },
  toggle: {
    width: 44, height: 24, borderRadius: 12,
    justifyContent: "center", paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: primary },
  toggleOff: { backgroundColor: "#E5E7EB" },
  toggleThumb: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000", shadowOpacity: 0.1,
    shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  toggleThumbOn: { alignSelf: "flex-end" },
  toggleThumbOff: { alignSelf: "flex-start" },
  logoutBtn: {
    backgroundColor: "#FFFFFF", borderRadius: 16,
    borderWidth: 1, borderColor: "#F3F4F6",
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  logoutText: { color: "#EF4444", fontSize: 14 },
  version: {
    color: "#D1D5DB", fontSize: 12,
    textAlign: "center", marginTop: 8,
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
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
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
    flex: 1, paddingVertical: 8, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  tabActive: { backgroundColor: "#FFFFFF" },
  tabText: { color: "#6B7280", fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: "#111827" },
  content: { padding: 16, paddingBottom: 32 },
  listCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16,
    borderWidth: 1, borderColor: "#F3F4F6",
    padding: 16, flexDirection: "row", alignItems: "center", gap: 12,
  },
  listCardTitle: { color: "#111827", fontSize: 14, fontWeight: "600" },
  listCardSub: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  catIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  roomIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#F9FAFB",
    alignItems: "center", justifyContent: "center",
  },
  exprCard: {
    backgroundColor: "#FFFFFF", borderRadius: 14,
    borderWidth: 1, borderColor: "#F3F4F6",
    padding: 16, flexDirection: "row", alignItems: "flex-start", gap: 10,
  },
  exprText: { color: "#111827", fontSize: 14, fontWeight: "600", marginBottom: 4 },
  exprTranslation: { color: "#9CA3AF", fontSize: 12 },
  exprMeta: { color: "#9CA3AF", fontSize: 10 },
  exprDate: { color: "#D1D5DB", fontSize: 10 },
  catBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  catBadgeText: { fontSize: 10, fontWeight: "700" },
  deleteBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
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
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  backIcon: { fontSize: 30, color: "#4B5563", lineHeight: 32 },
  headerTitle: { color: "#111827", fontSize: 16, fontWeight: "800" },
  listContent: { padding: 20, paddingBottom: 32 },
  detailContent: { padding: 20, paddingBottom: 32 },
  sectionIcon: { fontSize: 12 },
  sectionLabelImportant: { color: "#EF4444", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  sectionLabel: { color: "#9CA3AF", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  importantCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16,
    borderWidth: 1, borderColor: "#FEE2E2",
    padding: 16, flexDirection: "row", alignItems: "center", gap: 10,
  },
  regularCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16,
    borderWidth: 1, borderColor: "#F3F4F6",
    padding: 16, flexDirection: "row", alignItems: "center", gap: 10,
  },
  noticeTitle: { color: "#111827", fontSize: 14, fontWeight: "600", marginBottom: 4 },
  noticeDate: { color: "#9CA3AF", fontSize: 12 },
  importantBadge: {
    alignSelf: "flex-start", backgroundColor: "#FEF2F2",
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
    marginBottom: 14,
  },
  importantBadgeText: { color: "#EF4444", fontSize: 12, fontWeight: "700" },
  detailTitle: { color: "#111827", fontSize: 17, fontWeight: "800", marginBottom: 6 },
  detailDate: { color: "#9CA3AF", fontSize: 12, marginBottom: 16 },
  detailCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16,
    borderWidth: 1, borderColor: "#F3F4F6", padding: 20,
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
      id: "초급", label: "초급", eng: "Beginner", desc: "기초 단어/문장 구사 가능",
      detail: ["짧고 쉬운 문장", "천천히", "모르는 단어 설명"],
      color: "#059669", bg: "#ECFDF5", borderColor: "#34D399", dot: "#34D399",
    },
    {
      id: "중급", label: "중급", eng: "Intermediate", desc: "일상 대화 가능",
      detail: ["일반 속도로 대화", "일상 표현 학습", "다양한 주제 토론"],
      color: "#D97706", bg: "#FFFBEB", borderColor: "#FBBF24", dot: "#FBBF24",
    },
    {
      id: "고급", label: "고급", eng: "Advanced", desc: "자유롭게 대화 가능",
      detail: ["빠른 속도 대화", "관용어/슬랭 사용", "복잡한 문장 구사"],
      color: "#4338CA", bg: "#EEF2FF", borderColor: "#818CF8", dot: "#818CF8",
    },
  ];

  const [userLevel, setUserLevel] = useState<Level>("중급");
  const [pendingLevel, setPendingLevel] = useState<Level>("중급");
  const [levelConfirmed, setLevelConfirmed] = useState(true);
  const [isAnimated, setIsAnimated] = useState(false);

  const userInfo = { nickname: "영어마스터", email: "user@example.com" };
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
    const t = setTimeout(() => setIsAnimated(true), 150);
    return () => clearTimeout(t);
  }, []);

  const handleLevelButtonClick = () => {
    if (levelConfirmed) {
      setPendingLevel(userLevel);
      setLevelConfirmed(false);
    } else {
      setUserLevel(pendingLevel);
      setLevelConfirmed(true);
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
    <View style={styles.screenSoft}>
      {/* 헤더 */}
      <View style={mpStyles.header}>
        <Pressable style={mpStyles.backBtn} onPress={() => go("mode")}>
          <Text style={mpStyles.backIcon}>‹</Text>
        </Pressable>
        <Text style={mpStyles.headerTitle}>마이 페이지</Text>
      </View>

      <ScrollView contentContainerStyle={mpStyles.content}>
        {/* 프로필 카드 */}
        <View style={mpStyles.card}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={mpStyles.avatar}>
              <Text style={mpStyles.avatarText}>{userInfo.nickname.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={mpStyles.nickname}>{userInfo.nickname}</Text>
              <Text style={mpStyles.email}>{userInfo.email}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
                <View style={[mpStyles.dot, { backgroundColor: currentLevel.dot }]} />
                <Text style={mpStyles.levelSmall}>{currentLevel.id} · {currentLevel.eng}</Text>
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
            { label: "이번 주", value: `${Math.round((totalMinutes / 60) * 10) / 10}h` },
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
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <View>
              <Text style={mpStyles.cardTitle}>주간 학습 시간</Text>
              <Text style={mpStyles.cardSub}>최근 7일 기록</Text>
            </View>
            <Text style={mpStyles.cardSub}>{totalMinutes}분</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-end", height: CHART_HEIGHT, gap: 6 }}>
            {weekly.map((item, index) => {
              const isToday = index === weekly.length - 1;
              const barH = isAnimated
                ? Math.max(8, (item.minute / maxMinutes) * (CHART_HEIGHT - 28))
                : 0;
              return (
                <View key={item.day} style={{ flex: 1, alignItems: "center", height: CHART_HEIGHT, justifyContent: "flex-end", gap: 4 }}>
                  <Text style={[mpStyles.barMinute, isToday && { color: primary }]}>{item.minute}분</Text>
                  <View
                    style={[
                      mpStyles.bar,
                      { height: barH },
                      isToday ? { backgroundColor: primary } : { backgroundColor: "#C7D2FE" },
                    ]}
                  />
                  <Text style={[mpStyles.barDay, isToday && { color: primary }]}>{item.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 학습 레벨 설정 */}
        <View style={mpStyles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
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
              <Text style={[
                mpStyles.levelBtnText,
                levelConfirmed ? { color: "#4B5563" } : { color: "#FFFFFF" },
              ]}>
                {levelConfirmed ? "변경" : "결정"}
              </Text>
            </Pressable>
          </View>

          {levelConfirmed ? (
            // 확정된 레벨만 표시
            (() => {
              const level = levels.find((l) => l.id === userLevel)!;
              return (
                <View style={[mpStyles.levelCard, { borderColor: level.borderColor, backgroundColor: level.bg }]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                      <Text style={[mpStyles.levelLabel, { color: level.color }]}>{level.label}</Text>
                      <Text style={[mpStyles.levelEng, { color: level.color }]}>{level.eng}</Text>
                    </View>
                    <Text style={[mpStyles.levelDesc, { color: level.color }]}>{level.desc}</Text>
                    <View style={mpStyles.tagRow}>
                      {level.detail.map((tag) => (
                        <View key={tag} style={[mpStyles.tag, { backgroundColor: level.bg, borderColor: level.borderColor + "66" }]}>
                          <Text style={[mpStyles.tagText, { color: level.color }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={[mpStyles.radio, { borderColor: level.borderColor }]}>
                    <View style={[mpStyles.radioInner, { backgroundColor: level.dot }]} />
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
                        ? { borderColor: level.borderColor, backgroundColor: level.bg }
                        : { borderColor: "#F3F4F6", backgroundColor: "#FFFFFF" },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                        <Text style={[mpStyles.levelLabel, { color: isPending ? level.color : "#1F2937" }]}>{level.label}</Text>
                        <Text style={[mpStyles.levelEng, { color: isPending ? level.color : "#9CA3AF" }]}>{level.eng}</Text>
                      </View>
                      <Text style={[mpStyles.levelDesc, { color: isPending ? level.color : "#6B7280" }]}>{level.desc}</Text>
                      <View style={mpStyles.tagRow}>
                        {level.detail.map((tag) => (
                          <View
                            key={tag}
                            style={[
                              mpStyles.tag,
                              isPending
                                ? { backgroundColor: level.bg, borderColor: level.borderColor + "66" }
                                : { backgroundColor: "#F3F4F6", borderColor: "transparent" },
                            ]}
                          >
                            <Text style={[mpStyles.tagText, { color: isPending ? level.color : "#6B7280" }]}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={[mpStyles.radio, { borderColor: isPending ? level.borderColor : "#D1D5DB" }]}>
                      {isPending && <View style={[mpStyles.radioInner, { backgroundColor: level.dot }]} />}
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
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
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
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  backIcon: { fontSize: 30, color: "#4B5563", lineHeight: 32 },
  headerTitle: { color: "#111827", fontSize: 16, fontWeight: "800" },
  content: { padding: 20, gap: 14, paddingBottom: 32 },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 20,
    borderWidth: 1, borderColor: "#F3F4F6", padding: 20,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: primary, fontSize: 22, fontWeight: "900" },
  nickname: { color: "#111827", fontSize: 14, fontWeight: "700" },
  email: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  levelSmall: { color: "#6B7280", fontSize: 12 },
  logoutBtn: { padding: 4 },
  logoutText: { color: "#F87171", fontSize: 12 },
  statBox: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 14,
    borderWidth: 1, borderColor: "#F3F4F6",
    padding: 12, alignItems: "center",
  },
  statLabel: { color: "#9CA3AF", fontSize: 11, marginBottom: 4 },
  statValue: { color: "#111827", fontSize: 14, fontWeight: "800" },
  cardTitle: { color: "#111827", fontSize: 14, fontWeight: "800" },
  cardSub: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  bar: { width: "70%", borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barMinute: { color: "#9CA3AF", fontSize: 9 },
  barDay: { color: "#9CA3AF", fontSize: 10 },
  levelBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  levelBtnText: { fontSize: 12, fontWeight: "700" },
  levelCard: {
    borderWidth: 2, borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "flex-start", gap: 10,
  },
  levelLabel: { fontSize: 14, fontWeight: "800" },
  levelEng: { fontSize: 12 },
  levelDesc: { fontSize: 12, marginBottom: 8 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    borderWidth: 1, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  tagText: { fontSize: 11 },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
    marginTop: 2, flexShrink: 0,
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  menuText: { color: "#374151", fontSize: 14 },
});

function InfoScreen({ title, go }: { title: string; go: (screen: Screen) => void }) {
  const items = {
    마이페이지: ["오늘 학습 60분", "연속 학습 5일", "저장한 표현 42개"],
    설정: ["알림 받기", "피드백 자동 표시", "학습 데이터 동기화"],
    프리미엄: ["무제한 대화", "상세 AI 피드백", "상황별 커리큘럼"],
    "저장한 표현": ["I'd like to order a coffee.", "Sounds good!", "Could you recommend one?"],
    공지사항: ["SenTic 베타 앱이 React Native로 전환되었습니다.", "새로운 대화 주제가 추가될 예정입니다."],
    FAQ: ["음성 대화는 어떻게 시작하나요?", "AI 피드백은 언제 표시되나요?", "저장한 표현은 어디서 보나요?"],
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

function Header({ title, go, backTo, actions }: { title: string; go: (screen: Screen) => void; backTo?: Screen; actions?: boolean }) {
  return (
    <View style={styles.header}>
      {backTo && (
        <Pressable style={styles.headerButton} onPress={() => go(backTo)}>
          <Text style={styles.headerIcon}>‹</Text>
        </Pressable>
      )}
      <Text style={[styles.headerTitle, !backTo && styles.logoSmall]}>{title}</Text>
      {actions ? (
        <View style={styles.headerActions}>
          <Pressable onPress={() => go("notice")} style={styles.headerAction}><Text>📣</Text></Pressable>
          <Pressable onPress={() => go("bookmarks")} style={styles.headerAction}><Text>🔖</Text></Pressable>
          <Pressable onPress={() => go("mypage")} style={styles.headerAction}><Text>👤</Text></Pressable>
          <Pressable onPress={() => go("settings")} style={styles.headerAction}><Text>⚙️</Text></Pressable>
        </View>
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.primaryButton} onPress={onPress}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function ModeCard({ icon, title, desc, color, onPress }: { icon: string; title: string; desc: string; color: string; onPress: () => void }) {
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
    <ScrollView style={styles.flex} contentContainerStyle={styles.messageContent}>
      <Text style={styles.dateDivider}>오늘</Text>
      {messages.map((message) => (
        <View key={message.id} style={[styles.messageRow, message.speaker === "user" && styles.messageRowUser]}>
          {message.speaker === "ai" && <Text style={styles.smallAvatar}>🤖</Text>}
          <View style={[styles.bubble, message.speaker === "user" ? styles.userBubble : styles.aiBubble]}>
            <Text style={[styles.messageText, message.speaker === "user" && styles.userMessageText]}>{message.text}</Text>
            <Text style={[styles.timeText, message.speaker === "user" && styles.userTimeText]}>{message.time}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function FeedbackList({ messages, enabled }: { messages: Message[]; enabled: boolean }) {
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
      {messages.filter((m) => m.feedback).map((message) => (
        <View key={message.id} style={styles.card}>
          <Text style={styles.cardTitle}>{message.text}</Text>
          {message.feedback?.map((item) => (
            <Text key={item} style={styles.feedbackText}>{item}</Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function TabBar<T extends string>({ active, setActive, labels }: { active: T; setActive: (tab: T) => void; labels: Record<T, string> }) {
  return (
    <View style={styles.tabBar}>
      {(Object.keys(labels) as T[]).map((key) => (
        <Pressable key={key} style={[styles.tab, active === key && styles.activeTab]} onPress={() => setActive(key)}>
          <Text style={[styles.tabText, active === key && styles.activeTabText]}>{labels[key]}</Text>
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

function RoundButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.roundButton} onPress={onPress}>
      <Text style={styles.roundButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  webViewClose: { padding: 14, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  webViewCloseText: { color: "#6B7280", fontSize: 14 },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  screenSoft: { flex: 1, backgroundColor: softBg },
  flex: { flex: 1 },
  loginContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 28 },
  brandBlock: { alignItems: "center", paddingTop: 70, paddingBottom: 48 },
  logo: { color: primary, fontSize: 50, fontWeight: "800", letterSpacing: 0 },
  logoSmall: { color: primary, fontSize: 26, fontWeight: "800" },
  muted: { color: "#6B7280", fontSize: 14 },
  mutedSmall: { color: "#9CA3AF", fontSize: 12, marginTop: 4 },
  mutedBlock: { color: "#6B7280", fontSize: 14, lineHeight: 22, marginBottom: 24 },
  form: { width: "100%" },
  label: { color: "#6B7280", fontSize: 12, marginBottom: 6, marginTop: 14, textTransform: "uppercase" },
  input: { backgroundColor: "#F9FAFB", borderColor: border, borderWidth: 1, borderRadius: 14, color: "#111827", fontSize: 15, paddingHorizontal: 16, paddingVertical: 13 },
  passwordRow: { position: "relative" },
  passwordInput: { paddingRight: 72 },
  eyeButton: { position: "absolute", right: 12, top: 11, paddingHorizontal: 6, paddingVertical: 4 },
  iconText: { color: "#6B7280", fontSize: 12 },
  alignRight: { alignItems: "flex-end", marginVertical: 12 },
  linkText: { color: primary, fontSize: 13, fontWeight: "700" },
  primaryButton: { backgroundColor: primary, borderRadius: 14, alignItems: "center", paddingVertical: 15, marginTop: 10 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 24 },
  divider: { height: 1, backgroundColor: "#E5E7EB", flex: 1 },
  dividerText: { color: "#9CA3AF", fontSize: 12 },
  socialRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  socialButton: { flex: 1, borderWidth: 1, borderColor: border, borderRadius: 14, paddingVertical: 14, alignItems: "center", backgroundColor: "#FFFFFF" },
  kakao: { backgroundColor: "#FEE500", borderColor: "#FEE500" },
  socialText: { color: "#111827", fontWeight: "700", fontSize: 13 },
  centerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  header: { minHeight: 58, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F3F4F6", flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
  headerButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB", marginRight: 8 },
  headerIcon: { fontSize: 32, color: "#4B5563", lineHeight: 34 },
  headerTitle: { flex: 1, color: "#111827", fontSize: 16, fontWeight: "800" },
  headerActions: { flexDirection: "row", gap: 4 },
  headerAction: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB" },
  headerSpacer: { width: 36 },
  content: { padding: 20, gap: 14 },
  roomListHeader: { minHeight: 70, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F3F4F6", flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 10 },
  roomListTitle: { color: "#111827", fontSize: 20, fontWeight: "800" },
  roomListCount: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  newRoomButton: { backgroundColor: primary, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10 },
  newRoomButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  randomButton: { backgroundColor: "#F9FAFB", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  randomButtonText: { color: "#6B7280", fontSize: 12, fontWeight: "800" },
  roomListContent: { paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  setupContent: { padding: 22, paddingBottom: 30 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 14 },
  caption: { color: "#9CA3AF", fontSize: 12, marginBottom: 4 },
  h1: { color: "#111827", fontSize: 30, fontWeight: "800", marginTop: 8, marginBottom: 8 },
  h2: { color: "#111827", fontSize: 20, fontWeight: "800" },
  sectionTitle: { color: "#9CA3AF", fontSize: 12, textTransform: "uppercase", marginTop: 4 },
  streak: { backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FED7AA", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  streakText: { color: "#EA580C", fontSize: 12, fontWeight: "800" },
  modeCard: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6", padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  modeIcon: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  modeIconText: { fontSize: 25 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6", padding: 16 },
  profileCard: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6", padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  profileAvatar: { width: 58, height: 58, borderRadius: 18, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  profileAvatarText: { color: primary, fontSize: 22, fontWeight: "900" },
  profileName: { color: "#111827", fontSize: 16, fontWeight: "900" },
  profileEmail: { color: "#9CA3AF", fontSize: 12, marginTop: 3 },
  levelBadge: { alignSelf: "flex-start", borderRadius: 999, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 4, fontSize: 11, fontWeight: "800", marginTop: 8 },
  logoutButton: { borderRadius: 999, borderWidth: 1, borderColor: "#FECACA", paddingHorizontal: 11, paddingVertical: 7, backgroundColor: "#FEF2F2" },
  logoutButtonText: { color: "#EF4444", fontSize: 12, fontWeight: "800" },
  levelList: { gap: 10, marginTop: 14 },
  levelOption: { borderWidth: 1, borderColor: "#F3F4F6", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFFFFF" },
  levelTitle: { color: "#111827", fontSize: 14, fontWeight: "900" },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#D1D5DB", alignItems: "center", justifyContent: "center" },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  menuRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { color: "#111827", fontSize: 15, fontWeight: "800" },
  chart: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 120, marginTop: 16 },
  barWrap: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 4 },
  bar: { width: "62%", backgroundColor: "#C7D2FE", borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  activeBar: { backgroundColor: primary },
  barMinute: { color: "#9CA3AF", fontSize: 10 },
  barDay: { color: "#9CA3AF", fontSize: 11 },
  primaryText: { color: primary },
  statsGrid: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#F3F4F6" },
  statValue: { color: "#111827", fontSize: 16, fontWeight: "900", marginTop: 4 },
  roomCard: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6", padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  roomIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  roomIconText: { fontSize: 22 },
  chatRoomCard: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6", paddingHorizontal: 12, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  voiceRoomIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  voiceRoomIconText: { fontSize: 18 },
  roomPreview: { flex: 1, minWidth: 0 },
  roomPreviewTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  roomPreviewBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 5 },
  roomPreviewTitle: { flex: 1, color: "#111827", fontSize: 14, fontWeight: "800" },
  roomPreviewDate: { color: "#9CA3AF", fontSize: 12 },
  roomPreviewMessage: { flex: 1, color: "#9CA3AF", fontSize: 12 },
  durationBadge: { color: primary, backgroundColor: "#EEF2FF", borderRadius: 999, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: "800" },
  chevron: { color: "#C7CBD1", fontSize: 30 },
  descriptionInput: { minHeight: 88, paddingTop: 14 },
  setupSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22, marginBottom: 8 },
  setupSectionTitle: { color: "#374151", fontSize: 13, fontWeight: "800" },
  addCharacterText: { color: primary, fontSize: 13, fontWeight: "800" },
  characterCard: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6", padding: 14, gap: 10 },
  avatarPicker: { flexDirection: "row", gap: 10, alignItems: "center" },
  photo: { width: 56, height: 56, borderRadius: 16, borderWidth: 1, borderColor: "#E5E7EB" },
  photoSlot: { width: 56, height: 56, borderRadius: 16, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center" },
  cameraText: { fontSize: 22 },
  avatarOptions: { flex: 1, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  avatarOption: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  avatarOptionActive: { borderColor: primary, backgroundColor: "#EEF2FF" },
  avatarOptionText: { fontSize: 17 },
  warningBox: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A", borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, marginTop: 16, marginBottom: 14 },
  warningText: { color: "#B45309", fontSize: 12, fontWeight: "800" },
  heroCard: { alignItems: "center", backgroundColor: darkPrimary, borderRadius: 18, padding: 28 },
  heroIcon: { fontSize: 44, marginBottom: 10 },
  heroTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" },
  heroDesc: { color: "#C7D2FE", fontSize: 14, marginTop: 8, textAlign: "center" },
  listText: { color: "#374151", fontSize: 14, lineHeight: 20 },
  tabBar: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#FFFFFF" },
  tab: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  activeTab: { backgroundColor: primary },
  tabText: { color: "#6B7280", fontSize: 12, fontWeight: "700" },
  activeTabText: { color: "#FFFFFF" },
  callBody: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  avatarLarge: { width: 118, height: 118, borderRadius: 59, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  avatarActive: { borderWidth: 6, borderColor: "#C7D2FE" },
  avatarEmoji: { fontSize: 48 },
  subtitleBox: { width: "100%", backgroundColor: "#F9FAFB", borderRadius: 18, borderWidth: 1, borderColor: "#F3F4F6", padding: 16, alignItems: "center", marginVertical: 24 },
  subtitleText: { color: "#374151", fontSize: 15, textAlign: "center" },
  controlRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18 },
  roundButton: { width: 74, height: 50, borderRadius: 16, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  roundButtonText: { color: "#4B5563", fontSize: 12, fontWeight: "800" },
  callButton: { width: 76, height: 60, borderRadius: 18, backgroundColor: primary, alignItems: "center", justifyContent: "center" },
  endCallButton: { backgroundColor: "#EF4444" },
  callButtonText: { color: "#FFFFFF", fontWeight: "900" },
  feedbackToggle: { marginTop: 22, backgroundColor: "#EEF2FF", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  feedbackToggleOff: { backgroundColor: "#F3F4F6" },
  feedbackToggleText: { color: primary, fontSize: 12, fontWeight: "800" },
  grayText: { color: "#6B7280" },
  messageContent: { padding: 16, gap: 10 },
  dateDivider: { color: "#9CA3AF", fontSize: 12, textAlign: "center", marginVertical: 8 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  messageRowUser: { justifyContent: "flex-end" },
  smallAvatar: { width: 32, height: 32, textAlign: "center", textAlignVertical: "center", backgroundColor: "#EEF2FF", borderRadius: 16, overflow: "hidden" },
  bubble: { maxWidth: "76%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { backgroundColor: primary, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#F3F4F6", borderBottomLeftRadius: 4 },
  messageText: { color: "#1F2937", fontSize: 14, lineHeight: 20 },
  userMessageText: { color: "#FFFFFF" },
  timeText: { color: "#9CA3AF", fontSize: 10, marginTop: 4 },
  userTimeText: { color: "#C7D2FE", textAlign: "right" },
  feedbackText: { color: "#374151", backgroundColor: "#EEF2FF", borderRadius: 12, padding: 10, marginTop: 10, fontSize: 13 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyIcon: { fontSize: 34 },
  composer: { flexDirection: "row", gap: 10, padding: 14, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  composerInput: { flex: 1, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: border, borderRadius: 18, paddingHorizontal: 15, paddingVertical: 11, fontSize: 14 },
  sendButton: { backgroundColor: primary, borderRadius: 16, paddingHorizontal: 16, justifyContent: "center" },
  disabled: { opacity: 0.45 },
  sendText: { color: "#FFFFFF", fontWeight: "900" },
  listItem: { backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1, borderColor: "#F3F4F6", padding: 16 },
});

 console.log(process.env.EXPO_PUBLIC_BASE_URL)