import {
  ArrowLeft,
  Send,
  BookmarkPlus,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { AvatarDisplay, AvatarType } from "./avatar-display";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

interface FeedbackData {
  grammar: string[];
  suggestions: string[];
  slang?: string[];
}

interface Message {
  id: string;
  speaker: "user" | "ai";
  text: string;
  timestamp: string;
  feedback?: FeedbackData;
}

interface Character {
  name: string;
  avatarType: AvatarType;
  customAvatar?: string;
}

// 랜덤 피드백 생성 (실제로는 AI가 분석)
const generateMockFeedback = (text: string): FeedbackData | undefined => {
  const lower = text.toLowerCase();
  const feedbacks: FeedbackData[] = [
    {
      grammar: [],
      suggestions: [
        `더 자연스러운 표현: "${text.replace("I am", "I'm").replace("I want to", "I'd like to")}"`,
        "상황에 맞는 좋은 표현입니다!",
      ],
    },
    {
      grammar: [],
      suggestions: [
        "원어민은 보통 이렇게 표현해요: 'That's great!' 또는 'Sounds good!'",
      ],
      slang: ["정중한 영어 표현을 잘 사용했습니다 👍"],
    },
    {
      grammar: [],
      suggestions: [
        "좋은 문장입니다! 조금 더 구체적으로 말하면 더욱 자연스러워요.",
      ],
    },
  ];
  return feedbacks[Math.floor(Math.random() * feedbacks.length)];
};

export function TextChatScreen() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [inputText, setInputText] = useState("");
  const [savedToast, setSavedToast] = useState(false);
  const [expandedFeedbacks, setExpandedFeedbacks] = useState<Set<string>>(
    new Set(),
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [aiCharacter] = useState<Character>({
    name: "바리스타",
    avatarType: "female",
  });

  const [messages, setMessages] = useState<Message[]>([
    { id: "1", speaker: "ai", text: "Hey! What's up? 😊", timestamp: "10:30" },
    {
      id: "2",
      speaker: "user",
      text: "I'm good. What about you?",
      timestamp: "10:31",
      feedback: {
        grammar: [],
        suggestions: [
          "더 자연스러운 표현: 'I'm doing well, thanks! How about you?'",
        ],
        slang: ["What's up? = 안녕? / 어떻게 지내?"],
      },
    },
    {
      id: "3",
      speaker: "ai",
      text: "I'm doing great! Wanna grab some coffee later?",
      timestamp: "10:31",
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleFeedback = (msgId: string) => {
    setExpandedFeedbacks((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
      } else {
        next.add(msgId);
      }
      return next;
    });
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    const msgId = Date.now().toString();
    const newMessage: Message = {
      id: msgId,
      speaker: "user",
      text: inputText,
      timestamp: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      feedback: generateMockFeedback(inputText),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    // ⭐️ 바로 여기입니다! 여기서 백엔드 서버로 메시지를 보냅니다.
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const API_URL = "http://10.190.152.3:8080";
      const roomId = 1; // 👈 테스트용 방 번호 (추후 동적으로 변경)

      const response = await axios.post(
        `${API_URL}/api/rooms/${roomId}/messages/chat`,
        { content: newMessage.text },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      // 서버에서 받은 AI 대답을 화면에 띄워줍니다.
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        speaker: "ai",
        text: response.data.data.content, // 백엔드 응답 구조에 맞게 수정하세요!
        timestamp: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("통신 실패:", error);
    }

    // 새 메시지의 피드백 자동 펼치기
    setExpandedFeedbacks((prev) => new Set([...prev, msgId]));

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        speaker: "ai",
        text: "That sounds good! Let me know when you're free.",
        timestamp: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1200);
  };

  const saveExpression = (text: string) => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-[#FAFAFA]">
      {/* 헤더 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/chat-rooms")}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <AvatarDisplay avatarType={aiCharacter.avatarType} size="sm" />
          <div className="flex-1">
            <h1 className="text-gray-900 text-sm">{aiCharacter.name}</h1>
            {/* 온라인 표시 제거 */}
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-2 max-w-lg mx-auto">
          {/* 날짜 구분 */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">오늘</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {messages.map((msg) => (
            <div key={msg.id}>
              <div
                className={`flex gap-2 ${msg.speaker === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.speaker === "ai" && (
                  <AvatarDisplay
                    avatarType={aiCharacter.avatarType}
                    size="sm"
                    className="self-end mb-1 flex-shrink-0"
                  />
                )}
                <div className="max-w-[72%]">
                  <div
                    className={`px-4 py-2.5 ${
                      msg.speaker === "user"
                        ? "bg-[#4F46E5] text-white rounded-2xl rounded-br-sm"
                        : "bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 mt-1 ${msg.speaker === "user" ? "justify-end" : ""}`}
                  >
                    <p className="text-[10px] text-gray-400">{msg.timestamp}</p>
                    {/* 피드백 있음 표시 + 토글 버튼 */}
                    {msg.feedback && msg.speaker === "user" && (
                      <button
                        onClick={() => toggleFeedback(msg.id)}
                        className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full transition-all ${
                          expandedFeedbacks.has(msg.id)
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-500"
                        }`}
                      >
                        피드백
                        {expandedFeedbacks.has(msg.id) ? (
                          <ChevronUp size={9} />
                        ) : (
                          <ChevronDown size={9} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 인라인 피드백 패널 */}
              {msg.speaker === "user" &&
                msg.feedback &&
                expandedFeedbacks.has(msg.id) && (
                  <div className="flex justify-end mt-1">
                    <div className="w-[85%] bg-white rounded-2xl border border-indigo-100 p-3.5 shadow-sm">
                      <div className="flex justify-between items-center mb-2.5">
                        <p className="text-[10px] text-indigo-500 uppercase tracking-wide">
                          AI 피드백
                        </p>
                        <button
                          onClick={() => saveExpression(msg.text)}
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-indigo-50 transition-colors"
                        >
                          <BookmarkPlus size={13} className="text-indigo-400" />
                        </button>
                      </div>

                      {msg.feedback.grammar &&
                        msg.feedback.grammar.length > 0 && (
                          <div className="mb-2 bg-red-50 rounded-xl p-2.5">
                            <div className="flex items-center gap-1 mb-1">
                              <AlertCircle size={11} className="text-red-500" />
                              <span className="text-[10px] text-red-600">
                                문법 오류
                              </span>
                            </div>
                            {msg.feedback.grammar.map((error, idx) => (
                              <p
                                key={idx}
                                className="text-[11px] text-gray-600 pl-1"
                              >
                                • {error}
                              </p>
                            ))}
                          </div>
                        )}

                      {msg.feedback.suggestions &&
                        msg.feedback.suggestions.length > 0 && (
                          <div
                            className={`${msg.feedback.slang && msg.feedback.slang.length > 0 ? "mb-2" : ""} bg-indigo-50 rounded-xl p-2.5`}
                          >
                            <p className="text-[10px] text-indigo-600 mb-1">
                              💡 추천 표현
                            </p>
                            {msg.feedback.suggestions.map((s, idx) => (
                              <p
                                key={idx}
                                className="text-[11px] text-gray-600"
                              >
                                {s}
                              </p>
                            ))}
                          </div>
                        )}

                      {msg.feedback.slang && msg.feedback.slang.length > 0 && (
                        <div className="bg-purple-50 rounded-xl p-2.5">
                          <p className="text-[10px] text-purple-600 mb-1">
                            📝 표현 설명
                          </p>
                          {msg.feedback.slang.map((s, idx) => (
                            <p key={idx} className="text-[11px] text-gray-600">
                              {s}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-2.5 items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-10 h-10 bg-[#4F46E5] text-white rounded-2xl flex items-center justify-center hover:bg-[#4338CA] disabled:opacity-40 transition-all active:scale-95"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* 저장 토스트 */}
      {savedToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-xs shadow-lg">
          표현이 저장되었습니다 ✓
        </div>
      )}
    </div>
  );
}
