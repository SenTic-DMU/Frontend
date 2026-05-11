import { ArrowLeft, Phone, PhoneOff, BookmarkPlus, MicOff, Mic, Volume2, VolumeX, Bell, BellOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";

interface Message {
  id: string;
  speaker: "user" | "ai";
  text: string;
  timestamp: string;
  feedback?: {
    grammar: string[];
    suggestions: string[];
  };
}

// 요정 교정 팝업 컴포넌트
function FairyCorrection({ correction, onClose }: { correction: { original: string; corrected: string }; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* 흑백 오버레이 */}
      <div className="absolute inset-0 bg-black/60 backdrop-grayscale pointer-events-auto" onClick={onClose} />

      {/* 파티클 효과 */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full opacity-0"
          style={{
            left: "50%",
            top: "40%",
            background: ["#FFD700", "#FF6B6B", "#4F46E5", "#10B981", "#F97316"][i % 5],
            animation: `particle-float 1.5s ease-out ${i * 0.1}s both`,
            transform: `rotate(${i * 45}deg) translateX(${40 + Math.random() * 60}px)`,
          }}
        />
      ))}

      {/* 요정 카드 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto w-72">
        <div className="bg-white rounded-3xl shadow-2xl p-6 text-center">
          <div className="text-5xl mb-3" style={{ animation: "wiggle 0.5s ease-in-out infinite" }}>
            🧚
          </div>
          <p className="text-xs text-gray-400 mb-1">이렇게 말해보세요!</p>
          <div className="bg-red-50 rounded-xl p-3 mb-2">
            <p className="text-xs text-red-400 line-through">{correction.original}</p>
          </div>
          <div className="text-gray-400 text-xs mb-2">↓</div>
          <div className="bg-indigo-50 rounded-xl p-3 mb-4">
            <p className="text-sm text-indigo-700">{correction.corrected}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-[#4F46E5] text-white py-2.5 rounded-xl text-sm hover:bg-[#4338CA] transition-colors"
          >
            알겠어요!
          </button>
        </div>
      </div>
    </div>
  );
}

export function VoiceChatScreen() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"call" | "history" | "feedback">("call");
  const [callDuration, setCallDuration] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [showFairy, setShowFairy] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([
    { id: "1", speaker: "ai", text: "Hello! How can I help you today?", timestamp: "10:30" },
    { id: "2", speaker: "user", text: "I want to order a coffee please.", timestamp: "10:31", feedback: { grammar: [], suggestions: ["더 자연스러운 표현: 'I'd like to order a coffee, please.'"] } },
    { id: "3", speaker: "ai", text: "Sure! What size would you like?", timestamp: "10:31" },
    { id: "4", speaker: "user", text: "Large size, please.", timestamp: "10:32", feedback: { grammar: [], suggestions: ["완벽합니다! 'A large one, please.' 라고도 할 수 있어요."] } },
  ]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isInCall) {
      interval = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isInCall]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleCall = () => {
    if (isInCall) {
      setIsInCall(false);
      setCallDuration(0);
      setCurrentSubtitle("");
    } else {
      setIsInCall(true);
      setTimeout(() => {
        setAiSpeaking(true);
        setCurrentSubtitle("Hello! How can I help you today?");
        setTimeout(() => {
          setAiSpeaking(false);
          setCurrentSubtitle("");
          // 데모: 피드백이 켜져 있을 때만 요정 등장
          if (feedbackEnabled) {
            setTimeout(() => setShowFairy(true), 2000);
          }
        }, 3000);
      }, 1000);
    }
  };

  const saveExpression = (text: string) => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const tabs = [
    { id: "call" as const, label: "통화" },
    { id: "history" as const, label: "대화 내역" },
    { id: "feedback" as const, label: "피드백" },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#FAFAFA]">
      {/* 요정 교정 팝업 */}
      {showFairy && feedbackEnabled && (
        <FairyCorrection
          correction={{ original: "I want to order a coffee", corrected: "I'd like to order a coffee, please." }}
          onClose={() => setShowFairy(false)}
        />
      )}

      {/* 헤더 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate("/voice-rooms")}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-gray-900 text-sm">카페에서 주문하기</h1>
            <p className="text-xs text-gray-400">음성 대화</p>
          </div>
          {/* 피드백 ON/OFF 토글 */}
          <button
            onClick={() => setFeedbackEnabled(!feedbackEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all ${
              feedbackEnabled
                ? "bg-indigo-50 text-[#4F46E5] border border-indigo-200"
                : "bg-gray-100 text-gray-400 border border-gray-200"
            }`}
          >
            {feedbackEnabled ? <Bell size={12} /> : <BellOff size={12} />}
            피드백 {feedbackEnabled ? "ON" : "OFF"}
          </button>
        </div>

        {/* 탭 */}
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl text-xs transition-all ${
                activeTab === tab.id
                  ? "bg-[#4F46E5] text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 통화 화면 */}
      {activeTab === "call" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 bg-white overflow-hidden">
          {/* AI 아바타 */}
          <div className="mb-8 text-center">
            <div className={`relative mx-auto w-28 h-28 rounded-full bg-indigo-50 flex items-center justify-center mb-4 transition-all duration-500 ${
              aiSpeaking ? "ring-4 ring-indigo-200 ring-offset-2" : ""
            }`}>
              {/* 파동 애니메이션 */}
              {aiSpeaking && (
                <>
                  <div className="absolute inset-0 rounded-full bg-indigo-200 animate-ping opacity-20" />
                  <div className="absolute -inset-3 rounded-full bg-indigo-100 animate-pulse opacity-30" />
                </>
              )}
              <span className="text-5xl">🐹</span>
            </div>
            <p className="text-sm text-gray-900">AI 튜터</p>
            <p className="text-xs text-gray-400 mt-0.5">카페 바리스타 역할</p>
          </div>

          {/* 피드백 상태 표시 */}
          {isInCall && (
            <div className={`mb-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${
              feedbackEnabled
                ? "bg-indigo-50 text-[#4F46E5]"
                : "bg-gray-100 text-gray-400"
            }`}>
              {feedbackEnabled ? <Bell size={11} /> : <BellOff size={11} />}
              피드백 {feedbackEnabled ? "활성화" : "비활성화"}
            </div>
          )}

          {/* 타이머 */}
          <div className="text-center mb-6">
            {isInCall ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-gray-400">통화 중</span>
                </div>
                <p className="text-3xl text-gray-900 font-mono tracking-wider">{formatTime(callDuration)}</p>
              </>
            ) : (
              <p className="text-sm text-gray-400">통화를 시작해 보세요</p>
            )}
          </div>

          {/* 자막 */}
          {isInCall && (
            <div className="w-full max-w-xs mb-8">
              <div className="bg-gray-50 rounded-2xl p-4 min-h-[80px] border border-gray-100 text-center">
                {currentSubtitle ? (
                  <>
                    <p className="text-[10px] text-gray-400 mb-1.5">{aiSpeaking ? "AI 튜터" : "나"}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{currentSubtitle}</p>
                  </>
                ) : (
                  <p className="text-xs text-gray-300 italic mt-4">자막이 여기에 표시됩니다...</p>
                )}
              </div>
            </div>
          )}

          {/* 컨트롤 버튼 */}
          <div className="flex items-center gap-5">
            {isInCall && (
              <>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    isMuted ? "bg-gray-200 text-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button
                  onClick={() => setIsSpeakerOff(!isSpeakerOff)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    isSpeakerOff ? "bg-gray-200 text-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {isSpeakerOff ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </>
            )}

            <button
              onClick={toggleCall}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 ${
                isInCall ? "bg-red-500 hover:bg-red-600" : "bg-[#4F46E5] hover:bg-[#4338CA]"
              }`}
            >
              {isInCall ? <PhoneOff size={24} className="text-white" /> : <Phone size={24} className="text-white" />}
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4">{isInCall ? "탭하여 통화 종료" : "탭하여 통화 시작"}</p>
        </div>
      )}

      {/* 대화 내역 화면 */}
      {activeTab === "history" && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-lg mx-auto space-y-3">
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">오늘</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            {conversationHistory.map((msg) => (
              <div key={msg.id} className={`flex ${msg.speaker === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl ${
                  msg.speaker === "user"
                    ? "bg-[#4F46E5] text-white rounded-br-sm"
                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.speaker === "user" ? "text-indigo-200 text-right" : "text-gray-400"}`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 피드백 화면 */}
      {activeTab === "feedback" && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-lg mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-gray-900 text-sm">피드백 모아보기</h2>
                <p className="text-xs text-gray-400 mt-0.5">통화 중 AI가 분석한 내 표현 교정입니다</p>
              </div>
              {!feedbackEnabled && (
                <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-1 rounded-full">피드백 OFF</span>
              )}
            </div>

            {!feedbackEnabled ? (
              <div className="flex flex-col items-center justify-center py-16">
                <BellOff size={32} className="text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">피드백이 꺼져 있습니다</p>
                <p className="text-xs text-gray-300 mt-1">상단에서 피드백을 켜면 분석 결과가 표시됩니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversationHistory
                  .filter((msg) => msg.speaker === "user" && msg.feedback)
                  .map((msg) => (
                    <div key={msg.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <p className="text-sm text-gray-800">{msg.text}</p>
                        <button
                          onClick={() => saveExpression(msg.text)}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-indigo-50 transition-colors flex-shrink-0"
                        >
                          <BookmarkPlus size={15} className="text-indigo-500" />
                        </button>
                      </div>
                      {msg.feedback?.suggestions && msg.feedback.suggestions.length > 0 && (
                        <div className="bg-indigo-50 rounded-xl p-3">
                          <p className="text-[10px] text-indigo-500 uppercase tracking-wide mb-1.5">추천 표현</p>
                          {msg.feedback.suggestions.map((s, idx) => (
                            <p key={idx} className="text-xs text-gray-700">{s}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                {conversationHistory.filter((m) => m.speaker === "user" && m.feedback).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="text-4xl mb-3">🧚</div>
                    <p className="text-sm text-gray-500">아직 피드백이 없어요</p>
                    <p className="text-xs text-gray-400 mt-1">통화 후 피드백이 여기 표시됩니다</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 저장 토스트 */}
      {savedToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-xs shadow-lg z-40">
          표현이 저장되었습니다 ✓
        </div>
      )}
    </div>
  );
}
