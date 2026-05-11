import { ArrowLeft, Check, Crown, CalendarDays, Clock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

type Plan = "free" | "monthly" | "yearly";

// mock: 구독 중인 플랜 설정 (null이면 미구독)
const CURRENT_SUBSCRIPTION: { plan: Plan; nextBillingDate: string; daysLeft: number } | null = {
  plan: "monthly",
  nextBillingDate: "2026년 6월 11일",
  daysLeft: 31,
};

export function PaymentScreen() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<Plan>(
    CURRENT_SUBSCRIPTION?.plan ?? "monthly"
  );

  const plans = {
    free: {
      name: "Free",
      price: "0",
      period: "",
      features: ["하루 5회 대화", "기본 피드백"],
    },
    monthly: {
      name: "Monthly",
      price: "14,900",
      period: "/월",
      badge: "인기",
      features: [
        "무제한 대화",
        "고급 피드백",
        "실시간 음성 피드백",
        "표현 무제한 저장",
        "우선 고객 지원",
        "광고 없음",
      ],
    },
    yearly: {
      name: "Yearly",
      price: "149,000",
      period: "/년",
      badge: "20% 할인",
      features: [
        "무제한 대화",
        "고급 피드백",
        "실시간 음성 피드백",
        "표현 무제한 저장",
        "우선 고객 지원",
        "광고 없음",
        "2개월 무료",
      ],
    },
  };

  const handleSubscribe = () => {
    alert(`${plans[selectedPlan].name} 플랜 구독이 진행됩니다.`);
  };

  return (
    <div className="h-dvh w-full bg-[#FAFAFA] flex flex-col">
      {/* 헤더 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 pt-3 pb-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <h1 className="text-gray-900">결제 및 구독</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="max-w-sm mx-auto space-y-5">
          {/* 현재 구독 정보 배너 */}
          {CURRENT_SUBSCRIPTION ? (
            <div className="bg-[#4F46E5] rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Crown size={20} className="text-yellow-300" />
                </div>
                <div>
                  <p className="text-xs text-indigo-200">현재 구독 중</p>
                  <p className="text-sm text-white">
                    {plans[CURRENT_SUBSCRIPTION.plan].name} 플랜
                  </p>
                </div>
                <span className="ml-auto bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">
                  프리미엄
                </span>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 bg-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock size={12} className="text-indigo-200" />
                    <p className="text-[10px] text-indigo-200">남은 기간</p>
                  </div>
                  <p className="text-sm text-white">D-{CURRENT_SUBSCRIPTION.daysLeft}</p>
                </div>
                <div className="flex-1 bg-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CalendarDays size={12} className="text-indigo-200" />
                    <p className="text-[10px] text-indigo-200">다음 결제일</p>
                  </div>
                  <p className="text-xs text-white leading-tight">{CURRENT_SUBSCRIPTION.nextBillingDate}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#4F46E5] rounded-2xl p-5 text-center">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Crown size={20} className="text-yellow-300" />
              </div>
              <h2 className="text-white text-sm mb-1">무제한 학습으로 영어 실력 향상</h2>
              <p className="text-indigo-200 text-xs">지금 구독하고 더 많은 기능을 경험하세요</p>
            </div>
          )}

          {/* 플랜 선택 — 항상 상세 내용 표시 */}
          <div className="space-y-2.5">
            {(["free", "monthly", "yearly"] as Plan[]).map((planId) => {
              const plan = plans[planId];
              const isSelected = selectedPlan === planId;
              const isCurrent = CURRENT_SUBSCRIPTION?.plan === planId;
              return (
                <button
                  key={planId}
                  onClick={() => setSelectedPlan(planId)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? "border-[#4F46E5] bg-indigo-50"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? "border-[#4F46E5]" : "border-gray-300"
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-[#4F46E5]" />}
                      </div>
                      <span className={`text-sm ${isSelected ? "text-[#4F46E5]" : "text-gray-700"}`}>
                        {plan.name}
                      </span>
                      {"badge" in plan && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          planId === "monthly" ? "bg-indigo-100 text-indigo-600" : "bg-green-100 text-green-600"
                        }`}>{plan.badge}</span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">현재</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-sm ${isSelected ? "text-gray-900" : "text-gray-600"}`}>
                        ₩{plan.price}
                      </span>
                      <span className="text-xs text-gray-400">{plan.period}</span>
                    </div>
                  </div>

                  {/* 항상 표시되는 기능 목록 */}
                  <div className="space-y-1.5 pl-6">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <Check size={12} className={`flex-shrink-0 ${isSelected ? "text-[#4F46E5]" : "text-gray-300"}`} />
                        <span className={`text-xs ${isSelected ? "text-gray-600" : "text-gray-400"}`}>{f}</span>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 연간 비교 */}
          {selectedPlan === "yearly" && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3.5">
              <p className="text-xs text-green-700">
                💰 월간 대비 <strong>약 31,700원 절약</strong>됩니다 (연 기준)
              </p>
            </div>
          )}

          {/* 결제 버튼 */}
          {selectedPlan !== "free" && (
            <div className="space-y-3">
              {CURRENT_SUBSCRIPTION?.plan === selectedPlan ? (
                <div className="space-y-2">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-600">현재 구독 중인 플랜입니다</p>
                    <p className="text-xs text-gray-400 mt-1">다음 결제일: {CURRENT_SUBSCRIPTION.nextBillingDate}</p>
                  </div>
                  <button
                    onClick={() => alert("구독 취소 페이지로 이동합니다")}
                    className="w-full border border-red-200 text-red-500 py-3 rounded-xl text-sm hover:bg-red-50 transition-all"
                  >
                    구독 취소
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleSubscribe}
                    className="w-full bg-[#4F46E5] text-white py-3.5 rounded-xl text-sm hover:bg-[#4338CA] active:scale-[0.98] transition-all"
                  >
                    {plans[selectedPlan].name} 구독하기 — ₩{plans[selectedPlan].price}{plans[selectedPlan].period}
                  </button>
                  <p className="text-center text-xs text-gray-400">언제든지 구독을 취소할 수 있습니다</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
