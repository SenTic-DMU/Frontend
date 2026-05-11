import {
  ArrowLeft,
  BookMarked,
  Folder,
  Tag,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

type ViewMode = "by-room" | "by-category";
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

const categoryConfig: Record<
  Category,
  { color: string; bg: string; dot: string }
> = {
  단어: {
    color: "text-blue-600",
    bg: "bg-blue-50",
    dot: "bg-blue-400",
  },
  문법: {
    color: "text-purple-600",
    bg: "bg-purple-50",
    dot: "bg-purple-400",
  },
  문장: {
    color: "text-green-600",
    bg: "bg-green-50",
    dot: "bg-green-400",
  },
};

export function BookmarksScreen() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("by-category");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
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

  const renderExpression = (
    expr: SavedExpression,
    showRoom = false,
  ) => {
    const config = categoryConfig[expr.category];
    return (
      <div
        key={expr.id}
        className="bg-white rounded-xl border border-gray-100 p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 mb-1">
              {expr.text}
            </p>
            <p className="text-xs text-gray-400">
              {expr.translation}
            </p>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}
              >
                {expr.category}
              </span>
              {showRoom && (
                <span className="text-[10px] text-gray-400">
                  {expr.roomName}
                </span>
              )}
              <span className="text-[10px] text-gray-300">
                {expr.savedDate}
              </span>
            </div>
          </div>
          <button
            onClick={() => deleteExpression(expr.id)}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
          >
            <Trash2
              size={13}
              className="text-gray-300 hover:text-red-400 transition-colors"
            />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-dvh w-full bg-[#FAFAFA] flex flex-col">
      {/* 헤더 */}
      {isInsideDetail ? (
        /* 상세 페이지 헤더 — 탭 없이 다른 페이지 느낌 */
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 pt-3 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedRoom(null);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-gray-900">
                {selectedCategory ?? selectedRoom}
              </h1>
              <p className="text-xs text-gray-400">
                {selectedCategory
                  ? `${expressions.filter(e => e.category === selectedCategory).length}개 저장됨`
                  : `${groupByRoom()[selectedRoom!]?.length ?? 0}개 저장됨`
                }
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* 목록 헤더 — 탭 포함 */
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 pt-3 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate("/mode-select")}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-gray-900">저장된 표현</h1>
              <p className="text-xs text-gray-400">
                {expressions.length}개 저장됨
              </p>
            </div>
          </div>

          {/* 탭 */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setViewMode("by-category");
                setSelectedRoom(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-all ${
                viewMode === "by-category"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              카테고리
              <Tag size={12} />
            </button>
            <button
              onClick={() => {
                setViewMode("by-room");
                setSelectedCategory(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-all ${
                viewMode === "by-room"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              대화방
              <Folder size={12} />
            </button>
          </div>
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* 카테고리 목록 */}
        {!isInsideDetail && viewMode === "by-category" && (
          <div className="space-y-2.5">
            {(["단어", "문법", "문장"] as Category[]).map((cat) => {
              const count = expressions.filter((e) => e.category === cat).length;
              const config = categoryConfig[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="w-full bg-white rounded-2xl border border-gray-100 p-4 text-left hover:border-indigo-100 hover:shadow-sm active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{cat}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{count}개 저장됨</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* 대화방 목록 */}
        {!isInsideDetail && viewMode === "by-room" && (
          <div className="space-y-2.5">
            {Object.entries(groupByRoom()).map(([roomName, roomExprs]) => (
              <button
                key={roomName}
                onClick={() => setSelectedRoom(roomName)}
                className="w-full bg-white rounded-2xl border border-gray-100 p-4 text-left hover:border-indigo-100 hover:shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                    <Folder size={18} className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{roomName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{roomExprs.length}개 저장됨</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 카테고리 상세 */}
        {selectedCategory && (
          <div className="space-y-2.5">
            {expressions
              .filter((e) => e.category === selectedCategory)
              .map((e) => renderExpression(e, true))}
          </div>
        )}

        {/* 대화방 상세 */}
        {selectedRoom && (
          <div className="space-y-2.5">
            {groupByRoom()[selectedRoom]?.map((e) => renderExpression(e))}
          </div>
        )}
      </div>
    </div>
  );
}
