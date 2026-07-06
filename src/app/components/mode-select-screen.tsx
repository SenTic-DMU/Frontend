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
    <div className="mx-auto h-dvh w-full max-w-[480px] bg-[#F5F5F7] flex flex-col overflow-hidden relative">
      {/* 상단 헤더 */}
      <div className="flex-shrink-0 bg-white px-5 py-4 flex justify-between items-center rounded-b-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] z-10">
        <span className="font-[Lily_Script_One] text-[26px] text-[#4F46E5] leading-none">
          SenTic
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate("/notice")}
            className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors"
          >
            <Megaphone size={20} className="text-gray-400" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
          <button
            onClick={() => navigate("/bookmarks")}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors"
          >
            <Bookmark size={20} className="text-gray-400" />
          </button>
          <button
            onClick={() => navigate("/mypage")}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors"
          >
            <User size={20} className="text-gray-400" />
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors"
          >
            <Settings size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* 콘텐츠 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-8">
        
        {/* 1. 인사 & 연속 학습 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-gray-500 mb-1">
              안녕하세요 👋
            </p>
            <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">
              오늘도 영어 공부!
            </h2>
          </div>
          <div className="flex items-center gap-1.5 bg-[#FFF4ED] px-3 py-1.5 rounded-full">
            <Flame size={16} className="text-orange-500 fill-orange-500" />
            <span className="text-[13px] font-semibold text-orange-500">
              5일 연속
            </span>
          </div>
        </div>

        {/* 2. 학습 모드 선택 — 가로형 카드 2장 */}
        <div>
          <p className="text-[13px] font-semibold text-gray-400 mb-3">
            학습 모드
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/voice-rooms")}
              className="w-full bg-white rounded-[20px] px-5 py-4 flex items-center gap-4 hover:border-indigo-200 hover:shadow-md shadow-sm active:scale-[0.98] transition-all group"
            >
              <div className="w-[46px] h-[46px] bg-[#EEF2FF] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                <Mic size={22} className="text-[#4F46E5]" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-[16px] font-bold text-gray-900">
                  음성 대화
                </h3>
                <p className="text-[13px] text-gray-400 mt-0.5">
                  AI와 실시간 영어 회화 연습
                </p>
              </div>
              <ChevronRight
                size={18}
                className="text-gray-300 group-hover:text-indigo-400 transition-colors"
              />
            </button>

            <button
              onClick={() => navigate("/chat-rooms")}
              className="w-full bg-white rounded-[20px] px-5 py-4 flex items-center gap-4 hover:border-green-200 hover:shadow-md shadow-sm active:scale-[0.98] transition-all group"
            >
              <div className="w-[46px] h-[46px] bg-[#ECFDF5] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                <MessageSquare
                  size={22}
                  className="text-green-500"
                />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-[16px] font-bold text-gray-900">
                  채팅 대화
                </h3>
                <p className="text-[13px] text-gray-400 mt-0.5">
                  텍스트로 편하게 영어 채팅
                </p>
              </div>
              <ChevronRight
                size={18}
                className="text-gray-300 group-hover:text-green-400 transition-colors"
              />
            </button>
          </div>
        </div>

        {/* 3. 주간 학습 차트 */}
        <div className="bg-white rounded-[20px] px-5 pt-5 pb-4 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[14px] font-semibold text-gray-600">
              이번 주 학습
            </h3>
            <button
              onClick={() => navigate("/mypage")}
              className="flex items-center gap-0.5 text-[13px] font-medium text-[#4F46E5] hover:opacity-80"
            >
              상세보기 <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="flex items-end gap-2 h-[150px]">
            {[
              { d: "금", h: 55, m: 33 },
              { d: "토", h: 70, m: 42 },
              { d: "일", h: 45, m: 27 },
              { d: "월", h: 60, m: 36 },
              { d: "화", h: 80, m: 48 },
              { d: "수", h: 40, m: 24 },
              { d: "목", h: 100, m: 60 },
            ].map((item, i) => {
              const isToday = i === 6; // 목요일 강조
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center h-full"
                >
                  <div className="flex-1 w-full flex flex-col items-center justify-end px-1">
                    {item.m > 0 && (
                      <span
                        className={`text-[11px] font-medium mb-1.5 ${
                          isToday ? "text-[#4F46E5]" : "text-gray-400"
                        }`}
                      >
                        {item.m}분
                      </span>
                    )}
                    <div
                      className={`w-full max-w-[32px] rounded-t-md transition-all duration-500 ${
                        isToday
                          ? "bg-[#4F46E5]"
                          : item.h === 0
                          ? "bg-gray-100"
                          : "bg-[#E0E7FF]"
                      }`}
                      style={{
                        height: item.h === 0 ? "4px" : `${item.h}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-[12px] font-medium mt-2 ${
                      isToday ? "text-[#4F46E5]" : "text-gray-400"
                    }`}
                  >
                    {item.d}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. 통계 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "총 대화", value: "24회" },
            { label: "총 학습시간", value: "8.5h" },
            { label: "저장 표현", value: "42개" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-[20px] py-4 text-center shadow-sm"
            >
              <p className="text-[13px] font-medium text-gray-500 mb-1">
                {stat.label}
              </p>
              <p className="text-[16px] font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* 5. 프리미엄 배너 */}
        {!IS_PREMIUM && (
          <button
            onClick={() => navigate("/payment")}
            className="w-full bg-[#4F46E5] rounded-[20px] px-5 py-4 flex items-center justify-between group hover:bg-[#4338CA] active:scale-[0.98] transition-all shadow-md mt-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-[42px] h-[42px] bg-white/20 rounded-xl flex items-center justify-center">
                <Crown size={20} className="text-yellow-300" />
              </div>
              <div className="text-left">
                <p className="text-[13px] text-white/70 font-medium mb-0.5">
                  무제한 학습을 원하신다면
                </p>
                <p className="text-[15px] font-bold text-white">
                  프리미엄 업그레이드
                </p>
              </div>
            </div>
            <ChevronRight
              size={20}
              className="text-white/50 group-hover:translate-x-0.5 transition-transform"
            />
          </button>
        )}
      </div>

      {/* 하단 홈 인디케이터 (디자인 포인트용) */}
      <div className="pb-2 pt-1 flex justify-center bg-[#F5F5F7]">
        <div className="w-[120px] h-[5px] bg-gray-300 rounded-full" />
      </div>
    </div>
  );
}