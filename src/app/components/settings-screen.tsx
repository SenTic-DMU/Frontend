import { ArrowLeft, Bell, LogOut, UserX } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

export function SettingsScreen() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);

  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      navigate("/");
    }
  };

  const handleWithdraw = () => {
    if (confirm("정말 회원탈퇴 하시겠습니까?\n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.")) {
      navigate("/");
    }
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-[#4F46E5]" : "bg-gray-200"}`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
          value ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );

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
        <h1 className="text-gray-900">설정</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {/* 계정 */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2.5">계정</p>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div>
                <p className="text-sm text-gray-700">이메일</p>
                <p className="text-xs text-gray-400 mt-0.5">user@example.com</p>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <p className="text-sm text-gray-700">회원 등급</p>
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">프리미엄</span>
            </div>
          </div>
        </div>

        {/* 알림 */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2.5">알림</p>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Bell size={15} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-700">푸시 알림</p>
                  <p className="text-xs text-gray-400 mt-0.5">새로운 피드백 알림 받기</p>
                </div>
              </div>
              <Toggle value={notifications} onChange={() => setNotifications(!notifications)} />
            </div>
          </div>
        </div>

        {/* 계정 관리 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-4 border-b border-gray-50 hover:bg-red-50 transition-colors"
          >
            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
              <LogOut size={15} className="text-red-500" />
            </div>
            <span className="text-sm text-red-500">로그아웃</span>
          </button>
          <button
            onClick={handleWithdraw}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
              <UserX size={15} className="text-gray-500" />
            </div>
            <span className="text-sm text-gray-500">회원탈퇴</span>
          </button>
        </div>

        {/* 버전 */}
        <p className="text-center text-xs text-gray-300 pb-2">SenTic v1.0.0</p>
      </div>
    </div>
  );
}
