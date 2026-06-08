import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
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
      {screen === "mypage" && <InfoScreen title="마이페이지" go={go} />}
      {screen === "settings" && <InfoScreen title="설정" go={go} />}
      {screen === "payment" && <InfoScreen title="프리미엄" go={go} />}
      {screen === "bookmarks" && <InfoScreen title="저장한 표현" go={go} />}
      {screen === "notice" && <InfoScreen title="공지사항" go={go} />}
      {screen === "faq" && <InfoScreen title="FAQ" go={go} />}
    </SafeAreaView>
  );
}

function LoginScreen({ go, onKakaoLogin }: { go: (screen: Screen) => void; onKakaoLogin: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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
          <PrimaryButton label="로그인" onPress={() => go("mode")} />
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
