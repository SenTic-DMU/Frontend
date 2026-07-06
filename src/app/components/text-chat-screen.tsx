import { ArrowLeft, BookmarkPlus, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AvatarDisplay, AvatarType } from "./avatar-display";

type FeedbackType = "sentence" | "grammar" | "word";

interface FeedbackBlock {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  target?: string;
}

interface FeedbackData {
  wrongSentence: string;
  correctedSentence: string;
  blocks: FeedbackBlock[];
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

const feedbackStyles: Record<FeedbackType, { label: string; bg: string; text: string; chip: string }> = {
  sentence: {
    label: "문장",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    chip: "bg-indigo-100 text-indigo-600",
  },
  grammar: {
    label: "문법",
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    chip: "bg-yellow-200 text-yellow-800",
  },
  word: {
    label: "단어",
    bg: "bg-rose-50",
    text: "text-rose-700",
    chip: "bg-rose-100 text-rose-600",
  },
};

const makeFeedback = (text: string): FeedbackData => {
  const normalized = text.trim();
  const lower = normalized.toLowerCase();
  const blocks: FeedbackBlock[] = [];
  let correctedSentence = lower.includes("i want to")
    ? normalized.replace(/i want to/i, "I'd like to").replace(/coffee please/i, "coffee, please")
    : normalized;

  if (lower.includes("i want to")) {
    blocks.push({
      id: "sentence-politeness",
      type: "sentence",
      title: "추천 표현",
      description: "더 자연스러운 표현: 'I'd like to order a coffee, please.'",
    });
  } else {
    blocks.push({
      id: "sentence-natural",
      type: "sentence",
      title: "추천 표현",
      description: "문장을 조금 더 구체적으로 말하면 자연스러워요.",
    });
  }

  if (lower.includes("coffee please") && !lower.includes("coffee, please")) {
    correctedSentence = correctedSentence.replace(/coffee please/i, "coffee, please");
    blocks.push({
      id: "grammar-comma",
      type: "grammar",
      title: "문법 설명",
      description: "부탁 표현인 'please' 앞에는 쉼표를 넣으면 더 정확하고 읽기 좋아요.",
      target: "please",
    });
  }

  if (lower.includes("large size")) {
    correctedSentence = lower.includes("large size coffee")
      ? correctedSentence.replace(/large size coffee/i, "a large coffee")
      : correctedSentence.replace(/large size/i, "A large one");
    blocks.push({
      id: "word-large",
      type: "word",
      title: "단어 설명",
      description: "'Large size coffee'보다는 'a large coffee'가 주문 상황에서 더 자연스러워요.",
      target: "Large size",
    });
  }

  return {
    wrongSentence: normalized,
    correctedSentence,
    blocks,
  };
};

const renderHighlightedSentence = (sentence: string, blocks: FeedbackBlock[]) => {
  const ranges = blocks
    .filter((block) => block.target && block.type !== "sentence")
    .map((block) => {
      const start = sentence.toLowerCase().indexOf(block.target!.toLowerCase());
      return start >= 0 ? { ...block, start, end: start + block.target!.length } : null;
    })
    .filter((block): block is FeedbackBlock & { start: number; end: number } => Boolean(block))
    .sort((a, b) => a.start - b.start);

  if (ranges.length === 0) return sentence;

  const parts: { text: string; type?: FeedbackType }[] = [];
  let cursor = 0;

  ranges.forEach((range) => {
    if (range.start < cursor) return;
    if (range.start > cursor) parts.push({ text: sentence.slice(cursor, range.start) });
    parts.push({ text: sentence.slice(range.start, range.end), type: range.type });
    cursor = range.end;
  });

  if (cursor < sentence.length) parts.push({ text: sentence.slice(cursor) });

  return parts.map((part, index) => (
    <span
      key={`${part.text}-${index}`}
      className={part.type === "grammar" ? "bg-yellow-200 text-gray-900 font-normal" : part.type === "word" ? "text-rose-600 font-semibold" : undefined}
    >
      {part.text}
    </span>
  ));
};

export function TextChatScreen() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [inputText, setInputText] = useState("");
  const [savedToast, setSavedToast] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "feedback">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [aiCharacter] = useState<Character>({
    name: "카페 바리스타",
    avatarType: "female",
  });

  const [messages, setMessages] = useState<Message[]>([
    { id: "1", speaker: "ai", text: "Hello! How can I help you today?", timestamp: "10:30" },
    {
      id: "2",
      speaker: "user",
      text: "I want to order large size coffee please.",
      timestamp: "10:31",
      feedback: {
        wrongSentence: "I want to order large size coffee please.",
        correctedSentence: "I'd like to order a large coffee, please.",
        blocks: [
          {
            id: "sentence-1",
            type: "sentence",
            title: "추천 표현",
            description: "더 자연스러운 표현: 'I'd like to order a large coffee, please.'",
          },
          {
            id: "grammar-1",
            type: "grammar",
            title: "문법 설명",
            description: "'please' 앞에 쉼표를 넣으면 부탁하는 느낌이 더 자연스럽고 정확해요.",
            target: "please",
          },
          {
            id: "word-1",
            type: "word",
            title: "단어 설명",
            description: "'Large size coffee'보다는 'a large coffee'가 주문 상황에서 더 자연스러워요.",
            target: "large size",
          },
        ],
      },
    },
    { id: "3", speaker: "ai", text: "Sure! What size would you like?", timestamp: "10:31" },
    {
      id: "4",
      speaker: "user",
      text: "Large size, please.",
      timestamp: "10:32",
      feedback: {
        wrongSentence: "Large size, please.",
        correctedSentence: "A large one, please.",
        blocks: [
          {
            id: "sentence-2",
            type: "sentence",
            title: "추천 표현",
            description: "완벽합니다! 'A large one, please.' 라고도 할 수 있어요.",
          },
          {
            id: "word-1",
            type: "word",
            title: "단어 설명",
            description: "'one'은 앞에서 말한 coffee를 대신하는 단어라 반복을 줄여줘요.",
            target: "Large size",
          },
        ],
      },
    },
  ]);

  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab, messages]);

  const userFeedbackMessages = messages.filter((msg) => msg.speaker === "user" && msg.feedback);
  const roomTitle = roomId === "1" ? "카페에서 주문하기" : "채팅 대화";

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const msgId = Date.now().toString();
    const newMessage: Message = {
      id: msgId,
      speaker: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      feedback: makeFeedback(trimmed),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        speaker: "ai",
        text: "That sounds good! Let me know when you're ready.",
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1200);
  };

  const saveExpression = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-[#FAFAFA]">
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate("/chat-rooms")}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <AvatarDisplay avatarType={aiCharacter.avatarType} size="sm" />
          <div className="flex-1 min-w-0">
            <h1 className="text-gray-900 text-sm truncate">{roomTitle}</h1>
            <p className="text-xs text-gray-400">채팅 대화</p>
          </div>
        </div>

        <div className="flex gap-1">
          {[
            { id: "chat" as const, label: "채팅" },
            { id: "feedback" as const, label: "피드백" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl text-xs transition-all ${
                activeTab === tab.id ? "bg-[#4F46E5] text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "chat" && (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-4 space-y-2 max-w-lg mx-auto">
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">오늘</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.speaker === "user" ? "justify-end" : "justify-start"}`}>
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
                    <p className={`text-[10px] text-gray-400 mt-1 ${msg.speaker === "user" ? "text-right" : ""}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-3">
            <div className="max-w-lg mx-auto flex gap-2.5 items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="메시지를 입력하세요..."
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="w-10 h-10 bg-[#4F46E5] text-white rounded-2xl flex items-center justify-center hover:bg-[#4338CA] disabled:opacity-40 transition-all active:scale-95"
                aria-label="메시지 보내기"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === "feedback" && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-lg mx-auto">
            <div className="mb-4">
              <h2 className="text-gray-900 text-sm">피드백 모아보기</h2>
              <p className="text-xs text-gray-400 mt-0.5">채팅 중 AI가 분석한 내 표현 교정입니다</p>
            </div>

            {userFeedbackMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-sm text-gray-500">아직 피드백이 없어요</p>
                <p className="text-xs text-gray-400 mt-1">채팅 후 피드백이 여기 표시됩니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userFeedbackMessages.map((msg) => (
                  <div key={msg.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="mb-3 space-y-3">
                      <div>
                        <p className="text-[10px] text-gray-400 mb-1">틀린 문장</p>
                        <p className="text-sm text-gray-800">
                          {msg.feedback && renderHighlightedSentence(msg.feedback.wrongSentence, msg.feedback.blocks)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 mb-1">완성 문장</p>
                        <p className="text-sm text-indigo-700 font-semibold">{msg.feedback?.correctedSentence}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {msg.feedback?.blocks.map((block) => {
                        const style = feedbackStyles[block.type];

                        return (
                          <div key={block.id} className={`${style.bg} rounded-xl p-3`}>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${style.chip}`}>
                                  {style.label}
                                </span>
                                <p className={`text-[10px] ${style.text}`}>{block.title}</p>
                              </div>
                              <button
                                onClick={saveExpression}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/70 hover:bg-white transition-colors flex-shrink-0"
                                aria-label="피드백 저장"
                              >
                                <BookmarkPlus size={14} className="text-indigo-500" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed">{block.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {savedToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-xs shadow-lg z-40">
          표현이 저장되었습니다
        </div>
      )}
    </div>
  );
}
