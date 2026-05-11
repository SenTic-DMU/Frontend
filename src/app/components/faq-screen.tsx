import { ArrowLeft, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

export function FaqScreen() {
  const navigate = useNavigate();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqData = [
    {
      category: "학습 방법",
      items: [
        {
          question: "음성 대화와 채팅 대화의 차이는 무엇인가요?",
          answer: "음성 대화는 실제 전화 통화처럼 AI와 실시간으로 대화하며 발음과 유창성을 연습할 수 있습니다. 채팅 대화는 메시지 형식으로 문법과 표현을 천천히 연습할 수 있어, 각자의 학습 목적에 맞게 선택하실 수 있습니다."
        },
        {
          question: "하루에 얼마나 학습해야 하나요?",
          answer: "매일 15-20분 정도 꾸준히 학습하는 것을 권장합니다. 짧은 시간이라도 매일 반복하는 것이 실력 향상에 가장 효과적입니다."
        },
        {
          question: "피드백은 어떻게 확인하나요?",
          answer: "각 대화 종료 후 자동으로 피드백 화면이 표시되며, 마이페이지에서 이전 피드백을 다시 확인할 수 있습니다."
        }
      ]
    },
    {
      category: "기능 사용",
      items: [
        {
          question: "요정 캐릭터는 언제 나타나나요?",
          answer: "음성 대화 중 문법이나 표현이 틀렸을 때 화면이 흑백으로 변하며 요정 캐릭터가 나타나 올바른 표현을 알려줍니다."
        },
        {
          question: "대화 상황은 어떻게 설정하나요?",
          answer: "대화 모드를 선택한 후 상황 설정 화면에서 원하는 시나리오를 선택할 수 있습니다. 카페 주문, 여행, 비즈니스 등 다양한 상황이 준비되어 있습니다."
        },
        {
          question: "학습 기록은 어디서 볼 수 있나요?",
          answer: "홈 화면에서 이번 주 학습 차트를 확인할 수 있으며, 마이페이지에서 더 자세한 학습 통계를 볼 수 있습니다."
        }
      ]
    },
    {
      category: "계정 및 결제",
      items: [
        {
          question: "프리미엄 플랜의 혜택은 무엇인가요?",
          answer: "프리미엄 플랜은 무제한 대화, 모든 상황 시나리오 이용, 상세한 피드백 분석, 광고 제거 등의 혜택을 제공합니다."
        },
        {
          question: "비밀번호를 잊어버렸어요.",
          answer: "로그인 화면에서 '비밀번호 찾기'를 클릭하여 등록된 이메일로 인증 후 비밀번호를 재설정하실 수 있습니다."
        },
        {
          question: "구독을 취소하려면 어떻게 하나요?",
          answer: "마이페이지 > 결제 및 구독에서 언제든지 구독을 취소하실 수 있습니다. 남은 기간까지는 프리미엄 혜택이 유지됩니다."
        }
      ]
    },
    {
      category: "문제 해결",
      items: [
        {
          question: "음성 인식이 잘 안 돼요.",
          answer: "조용한 환경에서 마이크에 가까이 또렷하게 말씀해주세요. 설정에서 마이크 권한을 확인하시고, 앱을 재시작해보시는 것도 도움이 됩니다."
        },
        {
          question: "앱이 느리거나 멈춰요.",
          answer: "기기를 재부팅하거나 앱을 재설치해보세요. 문제가 계속되면 고객센터로 문의해주시면 신속히 도와드리겠습니다."
        }
      ]
    }
  ];

  const toggleFaq = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  let globalIndex = 0;

  return (
    <div className="h-dvh w-full bg-[#FAFAFA] flex flex-col">
      {/* 헤더 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 pt-3 pb-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/settings")}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <h1 className="text-gray-900">자주 묻는 질문</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {faqData.map((category, catIdx) => (
          <div key={catIdx}>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2.5">{category.category}</p>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {category.items.map((item) => {
                const currentIndex = globalIndex++;
                const isExpanded = expandedIndex === currentIndex;
                return (
                  <div key={currentIndex}>
                    <button
                      onClick={() => toggleFaq(currentIndex)}
                      className="w-full flex items-start justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-start gap-2 flex-1 pr-3">
                        <span className="text-xs text-[#4F46E5] flex-shrink-0 mt-0.5">Q.</span>
                        <p className="text-sm text-gray-700">{item.question}</p>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-3 bg-gray-50/50">
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-green-600 flex-shrink-0 mt-0.5">A.</span>
                          <p className="text-sm text-gray-500 leading-relaxed">{item.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* 추가 문의 */}
        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 px-5 py-4 text-center">
          <p className="text-sm text-gray-700 mb-1">더 궁금한 점이 있으신가요?</p>
          <p className="text-xs text-gray-500 mb-3">support@sentic.app으로 문의해주세요</p>
          <button className="bg-[#4F46E5] text-white text-sm px-5 py-2 rounded-xl hover:bg-indigo-600 transition-colors">
            고객센터 문의하기
          </button>
        </div>
      </div>
    </div>
  );
}
