import { useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle2 } from "lucide-react";

type Level = "초급" | "중급" | "고급";

const levels: { id: Level; label: string; eng: string; desc: string; detail: string[]; color: string; bg: string; border: string }[] = [
  {
    id: "초급",
    label: "초급",
    eng: "Beginner",
    desc: "기초부터 차근차근",
    detail: ["천천히 말하기", "쉬운 단어 사용", "기본 문법 연습"],
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-400",
  },
  {
    id: "중급",
    label: "중급",
    eng: "Intermediate",
    desc: "자연스러운 대화",
    detail: ["일반 속도로 대화", "일상 표현 학습", "다양한 주제 토론"],
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-400",
  },
  {
    id: "고급",
    label: "고급",
    eng: "Advanced",
    desc: "전문적인 표현",
    detail: ["빠른 속도 대화", "고급 어휘 활용", "복잡한 문장 구사"],
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-400",
  },
];

export function LevelSelectScreen() {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);

  const handleContinue = () => {
    if (!selectedLevel) {
      alert("학습 레벨을 선택해주세요");
      return;
    }
    navigate("/mode-select");
  };

  return (
    <div className="h-dvh w-full bg-white flex flex-col overflow-y-auto">
      {/* 헤더 */}
      <div className="flex-shrink-0 px-6 pt-14 pb-6">
        <div className="inline-flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full mb-4">
          <span className="w-2 h-2 rounded-full bg-[#4F46E5]" />
          <span className="text-xs text-indigo-700">마지막 단계</span>
        </div>
        <h1 className="text-gray-900 mb-2">나의 영어 레벨은?</h1>
        <p className="text-sm text-gray-500">현재 영어 실력에 가장 가까운 레벨을 선택해 주세요.</p>
      </div>

      {/* 레벨 카드 */}
      <div className="flex-1 px-6 pb-4">
        <div className="max-w-sm mx-auto space-y-3">
          {levels.map((level) => {
            const isSelected = selectedLevel === level.id;
            return (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? `${level.border} ${level.bg}`
                    : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`text-sm ${isSelected ? level.color : "text-gray-800"}`}>
                        {level.label}
                      </span>
                      <span className={`text-xs ${isSelected ? level.color + "/70" : "text-gray-400"}`}>
                        {level.eng}
                      </span>
                    </div>
                    <p className={`text-xs mb-2.5 ${isSelected ? level.color : "text-gray-500"}`}>
                      {level.desc}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {level.detail.map((item) => (
                        <span
                          key={item}
                          className={`text-[11px] px-2 py-0.5 rounded-full ${
                            isSelected ? `${level.bg} ${level.color} border ${level.border}/40` : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-3 mt-0.5 flex-shrink-0 transition-all ${
                    isSelected ? `${level.border} bg-white` : "border-gray-200"
                  }`}>
                    {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${level.bg.replace("bg-", "bg-").replace("-50", "-500")}`} />}
                  </div>
                </div>
              </button>
            );
          })}

          {/* 안내 */}
          <div className="bg-gray-50 rounded-xl p-3.5 flex gap-2.5">
            <CheckCircle2 size={16} className="text-[#4F46E5] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-relaxed">
              크게 고민하지 않아도 괜찮아요. AI가 대화 중 실시간으로 레벨을 분석해 자동으로 난이도를 조절합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex-shrink-0 px-6 pb-8 pt-2">
        <div className="max-w-sm mx-auto">
          <button
            onClick={handleContinue}
            disabled={!selectedLevel}
            className="w-full bg-[#4F46E5] text-white py-3.5 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#4338CA] active:scale-[0.98] transition-all"
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
