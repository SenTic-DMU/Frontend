import { ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

type TabType = "username" | "password";
type PasswordStep = "email" | "verify" | "reset" | "done";

export function FindAccountScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("username");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  // 비밀번호 찾기 전용 상태
  const [pwStep, setPwStep] = useState<PasswordStep>("email");
  const [pwEmail, setPwEmail] = useState("");
  const [pwCode, setPwCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleSendPwCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwEmail) return;
    alert("인증번호가 발송되었습니다!");
    setPwStep("verify");
  };

  const handleVerifyPwCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwCode === "123456") {
      setPwStep("reset");
    } else {
      alert("인증번호가 일치하지 않습니다 (테스트: 123456)");
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      alert("비밀번호는 8자 이상이어야 합니다");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다");
      return;
    }
    setPwStep("done");
  };

  const resetPwFlow = () => {
    setPwStep("email");
    setPwEmail("");
    setPwCode("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all text-sm placeholder-gray-400";

  return (
    <div className="h-dvh w-full bg-white flex flex-col overflow-y-auto">
      {/* 헤더 */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4 flex items-center gap-3 border-b border-gray-100">
        <button
          onClick={() => navigate("/")}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <h1 className="text-gray-900">계정 찾기</h1>
      </div>

      <div className="flex-1 px-5 py-6">
        <div className="max-w-sm mx-auto">
          <p className="text-sm text-gray-500 mb-6">이메일 주소로 계정 정보를 찾아드립니다.</p>

          {/* 탭 */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
            {[
              { id: "username" as const, label: "아이디 찾기" },
              { id: "password" as const, label: "비밀번호 찾기" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSubmitted(false);
                  resetPwFlow();
                }}
                className={`flex-1 py-2 rounded-lg text-xs transition-all ${
                  activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 아이디 찾기 */}
          {activeTab === "username" && (
            <>
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">✉️</span>
                  </div>
                  <p className="text-sm text-gray-900 mb-1">이메일을 발송했습니다</p>
                  <p className="text-xs text-gray-400 mb-6">{email}으로 안내 메일을 보냈습니다</p>
                  <button
                    onClick={() => navigate("/")}
                    className="text-sm text-indigo-500 hover:text-indigo-700 transition-colors"
                  >
                    로그인으로 돌아가기
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUsernameSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs text-gray-500 uppercase tracking-wide">이메일</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="등록된 이메일 주소"
                      className={inputClass}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#4F46E5] text-white py-3.5 rounded-xl text-sm hover:bg-[#4338CA] active:scale-[0.98] transition-all"
                  >
                    아이디 찾기
                  </button>
                </form>
              )}
            </>
          )}

          {/* 비밀번호 찾기 */}
          {activeTab === "password" && (
            <div>
              {/* Step 1: 이메일 입력 */}
              {pwStep === "email" && (
                <form onSubmit={handleSendPwCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs text-gray-500 uppercase tracking-wide">이메일</label>
                    <input
                      type="email"
                      value={pwEmail}
                      onChange={(e) => setPwEmail(e.target.value)}
                      placeholder="등록된 이메일 주소"
                      className={inputClass}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#4F46E5] text-white py-3.5 rounded-xl text-sm hover:bg-[#4338CA] active:scale-[0.98] transition-all"
                  >
                    인증번호 받기
                  </button>
                </form>
              )}

              {/* Step 2: 인증번호 확인 */}
              {pwStep === "verify" && (
                <form onSubmit={handleVerifyPwCode} className="space-y-4">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 mb-1">
                    <p className="text-xs text-indigo-700">
                      <span className="font-medium">{pwEmail}</span>으로 인증번호를 발송했습니다
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs text-gray-500 uppercase tracking-wide">인증번호</label>
                    <input
                      type="text"
                      value={pwCode}
                      onChange={(e) => setPwCode(e.target.value)}
                      placeholder="6자리 인증번호 (테스트: 123456)"
                      maxLength={6}
                      className={inputClass}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#4F46E5] text-white py-3.5 rounded-xl text-sm hover:bg-[#4338CA] active:scale-[0.98] transition-all"
                  >
                    인증 확인
                  </button>
                  <button
                    type="button"
                    onClick={() => setPwStep("email")}
                    className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    이메일 다시 입력
                  </button>
                </form>
              )}

              {/* Step 3: 비밀번호 재설정 */}
              {pwStep === "reset" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={16} className="text-green-500" />
                    <p className="text-xs text-green-600">이메일 인증이 완료되었습니다</p>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">새로운 비밀번호를 설정해주세요</p>
                  <div className="space-y-1.5">
                    <label className="block text-xs text-gray-500 uppercase tracking-wide">새 비밀번호</label>
                    <div className="relative">
                      <input
                        type={showNewPw ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="8자 이상"
                        className={inputClass}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs text-gray-500 uppercase tracking-wide">비밀번호 확인</label>
                    <div className="relative">
                      <input
                        type={showConfirmPw ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="비밀번호 재입력"
                        className={`${inputClass} ${
                          confirmPassword && newPassword !== confirmPassword
                            ? "border-red-300 focus:ring-red-400"
                            : ""
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#4F46E5] text-white py-3.5 rounded-xl text-sm hover:bg-[#4338CA] active:scale-[0.98] transition-all"
                  >
                    비밀번호 재설정
                  </button>
                </form>
              )}

              {/* Step 4: 완료 */}
              {pwStep === "done" && (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={28} className="text-[#4F46E5]" />
                  </div>
                  <p className="text-sm text-gray-900 mb-1">비밀번호가 재설정되었습니다</p>
                  <p className="text-xs text-gray-400 mb-6">새 비밀번호로 로그인해주세요</p>
                  <button
                    onClick={() => navigate("/")}
                    className="w-full bg-[#4F46E5] text-white py-3.5 rounded-xl text-sm hover:bg-[#4338CA] active:scale-[0.98] transition-all"
                  >
                    로그인으로 이동
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
