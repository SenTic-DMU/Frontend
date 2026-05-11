import { ArrowLeft, LogOut, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

type Level = "초급" | "중급" | "고급";

const levels: {
  id: Level; label: string; eng: string; desc: string; detail: string[];
  color: string; bg: string; border: string; dot: string;
}[] = [
  {
    id: "초급", label: "초급", eng: "Beginner", desc: "기초 단어/문장 구사 가능",
    detail: ["짧고 쉬운 문장", "천천히", "모르는 단어 설명"],
    color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-400", dot: "bg-emerald-400",
  },
  {
    id: "중급", label: "중급", eng: "Intermediate", desc: "일상 대화 가능",
    detail: ["일반 속도로 대화", "일상 표현 학습", "다양한 주제 토론"],
    color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-400", dot: "bg-amber-400",
  },
  {
    id: "고급", label: "고급", eng: "Advanced", desc: "자유롭게 대화 가능",
    detail: ["빠른 속도 대화", "관용어/슬랭 사용", "복잡한 문장 구사"],
    color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-400", dot: "bg-indigo-400",
  },
];

export function MyPageScreen() {
  const navigate = useNavigate();
  const [userLevel, setUserLevel] = useState<Level>("중급");
  const [pendingLevel, setPendingLevel] = useState<Level>("중급");
  const [levelConfirmed, setLevelConfirmed] = useState(true); // 이미 레벨이 설정된 상태
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);

  const [userInfo] = useState({ nickname: "영어마스터", email: "user@example.com" });

  const studyData = [
    { id: "mon", day: "Mon", minutes: 45, date: "04/07" },
    { id: "tue", day: "Tue", minutes: 60, date: "04/08" },
    { id: "wed", day: "Wed", minutes: 30, date: "04/09" },
    { id: "thu", day: "Thu", minutes: 75, date: "04/10" },
    { id: "fri", day: "Fri", minutes: 50, date: "04/11" },
    { id: "sat", day: "Sat", minutes: 90, date: "04/12" },
    { id: "sun", day: "Sun", minutes: 65, date: "04/13" },
  ];

  useEffect(() => {
    const t = setTimeout(() => setIsAnimated(true), 150);
    return () => clearTimeout(t);
  }, []);

  const maxMinutes = Math.max(...studyData.map((d) => d.minutes));
  const totalMinutes = studyData.reduce((acc, curr) => acc + curr.minutes, 0);
  const avgMinutes = Math.round(totalMinutes / studyData.length);

  const currentLevel = levels.find((l) => l.id === userLevel)!;

  const handleLevelButtonClick = () => {
    if (levelConfirmed) {
      // "변경" 버튼 클릭 → 선택 화면으로
      setPendingLevel(userLevel);
      setLevelConfirmed(false);
    } else {
      // "결정" 버튼 클릭 → 레벨 확정
      setUserLevel(pendingLevel);
      setLevelConfirmed(true);
    }
  };

  return (
    <div className="h-dvh w-full bg-[#FAFAFA] flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 pt-3 pb-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/mode-select")}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <h1 className="text-gray-900">마이 페이지</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {/* 프로필 카드 — 사진 추가 버튼 없음 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-[#4F46E5] text-xl flex-shrink-0">
              {userInfo.nickname.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{userInfo.nickname}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{userInfo.email}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${currentLevel.dot}`} />
                <span className="text-xs text-gray-500">{currentLevel.id} · {currentLevel.eng}</span>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex-shrink-0 flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* 학습 통계 */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "이번 주", value: `${Math.round(totalMinutes / 60 * 10) / 10}h` },
            { label: "일 평균", value: `${avgMinutes}분` },
            { label: "연속 학습", value: "5일" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
              <p className="text-sm text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* 주간 그래프 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-900">주간 학습 시간</p>
              <p className="text-xs text-gray-400 mt-0.5">최근 7일 기록</p>
            </div>
            <span className="text-xs text-gray-400">{totalMinutes}분</span>
          </div>

          <div className="flex items-end gap-2 h-32">
            {studyData.map((item, index) => {
              const heightPercent = (item.minutes / maxMinutes) * 100;
              const isHovered = hoveredBar === item.id;
              const isToday = index === 6;
              return (
                <div key={item.id} className="flex-1 flex flex-col items-center gap-2 h-full">
                  <div className="relative flex-1 w-full">
                    {isHovered && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2.5 py-1.5 rounded-lg whitespace-nowrap z-10 shadow-lg">
                        <p className="text-[10px] text-gray-400">{item.date}</p>
                        <p className="text-xs text-white">{item.minutes}분</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                      </div>
                    )}
                    <div
                      className={`absolute bottom-0 left-0 right-0 rounded-t-lg cursor-pointer transition-colors duration-200 ${
                        isToday ? "bg-[#4F46E5]" : isHovered ? "bg-indigo-200" : "bg-indigo-100"
                      }`}
                      style={{
                        height: isAnimated ? `${heightPercent}%` : "0%",
                        transition: `height 0.7s cubic-bezier(0.34, 1.4, 0.64, 1) ${index * 0.07}s, background-color 0.2s`,
                      }}
                      onMouseEnter={() => setHoveredBar(item.id)}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                  </div>
                  <span className={`text-[10px] flex-shrink-0 ${isToday ? "text-[#4F46E5]" : "text-gray-400"}`}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 학습 레벨 설정 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-900">학습 레벨 설정</p>
            <button
              onClick={handleLevelButtonClick}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                levelConfirmed
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-[#4F46E5] text-white hover:bg-[#4338CA]"
              }`}
            >
              {levelConfirmed ? "변경" : "결정"}
            </button>
          </div>

          {levelConfirmed ? (
            /* 확정된 레벨만 표시 */
            <div>
              {levels.filter((l) => l.id === userLevel).map((level) => (
                <div
                  key={level.id}
                  className={`w-full text-left p-4 rounded-2xl border-2 ${level.border} ${level.bg}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className={`text-sm ${level.color}`}>{level.label}</span>
                        <span className={`text-xs ${level.color}`}>{level.eng}</span>
                      </div>
                      <p className={`text-xs mb-2 ${level.color}`}>{level.desc}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {level.detail.map((item) => (
                          <span
                            key={item}
                            className={`text-[11px] px-2 py-0.5 rounded-full ${level.bg} ${level.color} border ${level.border}/40`}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-3 mt-0.5 flex-shrink-0 ${level.border} bg-white`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${level.dot}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 전체 레벨 선택 화면 */
            <div className="space-y-2">
              {levels.map((level) => {
                const isPending = pendingLevel === level.id;
                return (
                  <button
                    key={level.id}
                    onClick={() => setPendingLevel(level.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                      isPending
                        ? `${level.border} ${level.bg}`
                        : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className={`text-sm ${isPending ? level.color : "text-gray-800"}`}>{level.label}</span>
                          <span className={`text-xs ${isPending ? level.color : "text-gray-400"}`}>{level.eng}</span>
                        </div>
                        <p className={`text-xs mb-2 ${isPending ? level.color : "text-gray-500"}`}>{level.desc}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {level.detail.map((item) => (
                            <span
                              key={item}
                              className={`text-[11px] px-2 py-0.5 rounded-full ${
                                isPending
                                  ? `${level.bg} ${level.color} border ${level.border}/40`
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-3 mt-0.5 flex-shrink-0 transition-all ${
                        isPending ? `${level.border} bg-white` : "border-gray-200"
                      }`}>
                        {isPending && <div className={`w-2.5 h-2.5 rounded-full ${level.dot}`} />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 메뉴 — 결제 및 구독 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {[
            { label: "결제 및 구독", onClick: () => navigate("/payment") }
          ].map((item, i, arr) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${
                i < arr.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <span className="text-sm text-gray-700">{item.label}</span>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          ))}
        </div>

        <div className="h-2" />
      </div>

      {/* 로그아웃 모달 */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 px-4 pb-6">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6">
            <h3 className="text-sm text-gray-900 mb-1">로그아웃</h3>
            <p className="text-xs text-gray-500 mb-5">정말 로그아웃 하시겠습니까?</p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
