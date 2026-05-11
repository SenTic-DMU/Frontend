import { ArrowLeft, ChevronRight, Pin } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  isImportant: boolean;
}

export function NoticeScreen() {
  const navigate = useNavigate();
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const [notices] = useState<Notice[]>([
    { id: "1", title: "SenTic 정식 오픈을 축하합니다! 🎉", content: `안녕하세요, SenTic 팀입니다.\n\n드디어 SenTic이 정식으로 오픈하게 되었습니다!\n\nAI와 함께하는 영어 회화 학습 서비스 SenTic은 여러분의 영어 실력 향상을 위해 최선을 다하겠습니다.\n\n주요 기능:\n• 음성 대화 모드 - 실시간 AI 음성 대화\n• 채팅 대화 모드 - 텍스트 기반 학습\n• 실시간 피드백 - 문법, 발음, 표현 교정\n• 표현 북마크 - 유용한 표현 저장 및 복습\n\n앞으로도 더 나은 서비스를 제공하기 위해 노력하겠습니다.\n감사합니다.`, date: "2026-04-06", isImportant: true },
    { id: "2", title: "프리미엄 플랜 출시 안내", content: `프리미엄 플랜이 새롭게 출시되었습니다.\n\n프리미엄 플랜 혜택:\n• 무제한 대화 이용\n• 고급 AI 튜터 이용\n• 상세한 학습 리포트\n• 우선 고객 지원\n\n지금 바로 프리미엄으로 업그레이드하고 더 많은 기능을 경험해보세요!`, date: "2026-04-05", isImportant: false },
    { id: "3", title: "서버 점검 안내 (완료)", content: `서비스 품질 향상을 위한 서버 점검이 완료되었습니다.\n\n점검 일시: 2026년 4월 4일 02:00 ~ 04:00 (2시간)\n점검 내용: 서버 성능 개선 및 안정화 작업\n\n점검 중 일시적으로 서비스 이용이 불가능했던 점 양해 부탁드립니다.`, date: "2026-04-04", isImportant: false },
    { id: "4", title: "AI 대화 품질 개선 업데이트", content: `AI 대화 엔진이 업데이트되었습니다.\n\n개선 사항:\n• 더욱 자연스러운 대화 흐름\n• 발음 피드백 정확도 향상\n• 문법 교정 기능 강화\n• 다양한 주제 대화 지원 확대`, date: "2026-04-03", isImportant: false },
    { id: "5", title: "이용약관 및 개인정보처리방침 개정 안내", content: `이용약관 및 개인정보처리방침이 개정되었습니다.\n\n주요 변경 사항:\n• 개인정보 보호 정책 강화\n• 서비스 이용 조건 명확화\n• 데이터 처리 방침 개선`, date: "2026-04-01", isImportant: true },
  ]);

  if (selectedNotice) {
    return (
      <div className="h-dvh w-full bg-[#FAFAFA] flex flex-col">
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 pt-3 pb-3 flex items-center gap-3">
          <button
            onClick={() => setSelectedNotice(null)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <h1 className="text-gray-900">공지사항</h1>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="max-w-sm mx-auto">
            {selectedNotice.isImportant && (
              <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-xs mb-4">
                <Pin size={11} />
                중요 공지
              </div>
            )}
            <h2 className="text-gray-900 mb-2">{selectedNotice.title}</h2>
            <p className="text-xs text-gray-400 mb-5">{selectedNotice.date}</p>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedNotice.content}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const importantNotices = notices.filter((n) => n.isImportant);
  const regularNotices = notices.filter((n) => !n.isImportant);

  return (
    <div className="h-dvh w-full bg-[#FAFAFA] flex flex-col">
      {/* 헤더 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 pt-3 pb-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/mode-select")}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <h1 className="text-gray-900">공지사항</h1>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* 중요 공지 */}
        {importantNotices.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Pin size={12} className="text-red-500" />
              <span className="text-xs text-red-500 uppercase tracking-wide">중요 공지</span>
            </div>
            <div className="space-y-2">
              {importantNotices.map((notice) => (
                <button
                  key={notice.id}
                  onClick={() => setSelectedNotice(notice)}
                  className="w-full bg-white rounded-2xl border border-red-100 p-4 text-left hover:border-red-200 hover:shadow-sm active:scale-[0.98] transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate mb-1">{notice.title}</p>
                      <p className="text-xs text-gray-400">{notice.date}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 일반 공지 */}
        {regularNotices.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2.5">전체 공지</p>
            <div className="space-y-2">
              {regularNotices.map((notice) => (
                <button
                  key={notice.id}
                  onClick={() => setSelectedNotice(notice)}
                  className="w-full bg-white rounded-2xl border border-gray-100 p-4 text-left hover:border-gray-200 hover:shadow-sm active:scale-[0.98] transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate mb-1">{notice.title}</p>
                      <p className="text-xs text-gray-400">{notice.date}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
