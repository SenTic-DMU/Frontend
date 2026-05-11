import {
  MessageSquare,
  Mic,
  User,
  Settings,
  Bookmark,
  Megaphone,
  Flame,
  ChevronRight,
  Crown,
} from "lucide-react";
import { useNavigate } from "react-router";

// 프리미엄 사용 중 여부 (mock: true면 배너 숨김)
const IS_PREMIUM = true;

export function ModeSelectScreen() {
  const navigate = useNavigate();

  return (
    <div className="h-dvh w-full bg-[#F5F5F7] flex flex-col overflow-hidden">
      {/* 상단 헤더 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 pt-3 pb-3 flex justify-between items-center">
        <span className="font-[Lily_Script_One] text-[26px] text-[#4F46E5] leading-none">
          SenTic
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/notice")}
            className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <Megaphone size={18} className="text-gray-500" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
          <button
            onClick={() => navigate("/bookmarks")}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <Bookmark size={18} className="text-gray-500" />
          </button>
          <button
            onClick={() => navigate("/mypage")}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <User size={18} className="text-gray-500" />
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <Settings size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 flex flex-col justify-between min-h-0 px-[20px] py-[10px]">
        {/* 1. 인사 & 연속 학습 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">
              안녕하세요 👋
            </p>
            <h2 className="text-gray-900">오늘도 영어 공부!</h2>
          </div>
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full">
            <Flame size={14} className="text-orange-500" />
            <span className="text-xs text-orange-600">
              5일 연속
            </span>
          </div>
        </div>

        {/* 3. 모드 선택 — 가로형 카드 2장 */}
        <div className="space-y-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            학습 모드
          </p>
          <button
            onClick={() => navigate("/voice-rooms")}
            className="w-full bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-4 hover:border-indigo-200 hover:shadow-sm active:scale-[0.98] transition-all group"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
              <Mic size={22} className="text-[#4F46E5]" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-gray-900 text-sm">
                음성 대화
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                AI와 실시간 영어 회화 연습
              </p>
            </div>
            <ChevronRight
              size={16}
              className="text-gray-300 group-hover:text-indigo-400 transition-colors"
            />
          </button>

          <button
            onClick={() => navigate("/chat-rooms")}
            className="w-full bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-4 hover:border-green-200 hover:shadow-sm active:scale-[0.98] transition-all group"
          >
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
              <MessageSquare
                size={22}
                className="text-green-600"
              />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-gray-900 text-sm">
                채팅 대화
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                텍스트로 편하게 영어 채팅
              </p>
            </div>
            <ChevronRight
              size={16}
              className="text-gray-300 group-hover:text-green-400 transition-colors"
            />
          </button>
        </div>

        {/* 2. 주간 학습 차트 */}
        <div className="bg-white rounded-2xl border border-gray-100 px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">
              이번 주 학습
            </p>
            <button
              onClick={() => navigate("/mypage")}
              className="flex items-center gap-0.5 text-xs text-indigo-500"
            >
              상세보기 <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex items-end gap-2 h-45">
            {[
              { d: "금", h: 55, m: 33 },
              { d: "토", h: 70, m: 42 },
              { d: "일", h: 45, m: 27 },
              { d: "월", h: 60, m: 36 },
              { d: "화", h: 80, m: 48 },
              { d: "수", h: 40, m: 24 },
              { d: "목", h: 100, m: 60 },
            ].map((item, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1 h-full"
              >
                <div className="flex-1 w-full flex flex-col items-center justify-end">
                  {item.m > 0 && (
                    <span
                      className={`text-[10px] mb-1 ${i === 6 ? "text-[#4F46E5]" : "text-gray-400"}`}
                    >
                      {item.m}분
                    </span>
                  )}
                  <div
                    className={`w-full rounded-t-sm ${i === 6 ? "bg-[#4F46E5]" : item.h === 0 ? "bg-gray-100" : "bg-indigo-100"}`}
                    style={{
                      height:
                        item.h === 0 ? "4px" : `${item.h}%`,
                    }}
                  />
                </div>
                <span
                  className={`text-[10px] ${i === 6 ? "text-[#4F46E5]" : "text-gray-400"}`}
                >
                  {item.d}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. 통계 */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "총 대화", value: "24회" },
            { label: "총 학습시간", value: "8.5h" },
            { label: "저장 표현", value: "42개" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-100 p-3 text-center"
            >
              <p className="text-xs text-gray-400 mb-1">
                {stat.label}
              </p>
              <p className="text-gray-900 text-sm">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* 5. 프리미엄 배너 — 프리미엄 미사용자에게만 표시 */}
        {!IS_PREMIUM && (
          <button
            onClick={() => navigate("/payment")}
            className="w-full bg-[#4F46E5] rounded-2xl px-4 py-4 flex items-center justify-between group hover:bg-[#4338CA] active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Crown size={17} className="text-yellow-300" />
              </div>
              <div className="text-left">
                <p className="text-xs text-white/60">
                  무제한 학습을 원하신다면
                </p>
                <p className="text-sm text-white">
                  프리미엄 업그레이드
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-white/50 group-hover:translate-x-0.5 transition-transform"
            />
          </button>
        )}
      </div>
    </div>
  );
}
