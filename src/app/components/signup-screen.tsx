import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

// 이미 사용 중인 아이디 목록 (mock)
const TAKEN_USERNAMES = ["admin", "user123", "sentic", "english"];

export function SignupScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [usernameChecked, setUsernameChecked] = useState<null | "available" | "taken">(null);
  const [formData, setFormData] = useState({
    username: "",
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();

  const handleUsernameChange = (value: string) => {
    setFormData({ ...formData, username: value });
    setUsernameChecked(null);
  };

  const handleCheckUsername = () => {
    if (!formData.username) {
      alert("아이디를 입력해주세요");
      return;
    }
    if (TAKEN_USERNAMES.includes(formData.username.toLowerCase())) {
      setUsernameChecked("taken");
    } else {
      setUsernameChecked("available");
    }
  };

  const handleSendVerification = () => {
    if (!formData.email) {
      alert("이메일을 입력해주세요");
      return;
    }
    setVerificationSent(true);
    alert("인증번호가 발송되었습니다!");
  };

  const handleVerifyCode = () => {
    if (verificationCode === "123456") {
      setEmailVerified(true);
    } else {
      alert("인증번호가 일치하지 않습니다");
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameChecked !== "available") {
      alert("아이디 중복 확인을 완료해주세요");
      return;
    }
    if (!emailVerified) {
      alert("이메일 인증을 완료해주세요");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다");
      return;
    }
    navigate("/level-select");
  };

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all text-gray-900 placeholder-gray-400 text-sm";
  const labelClass = "block text-xs text-gray-500 tracking-wide uppercase mb-1.5";

  return (
    <div className="h-dvh w-full bg-white flex flex-col overflow-y-auto">
      {/* 헤더 */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate("/")} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <h1 className="text-gray-900">회원가입</h1>
      </div>

      {/* 폼 */}
      <div className="flex-1 px-5 py-6 pb-10">
        <div className="max-w-sm mx-auto">
          <div className="mb-6">
            <p className="text-gray-500 text-sm">SenTic과 함께 영어 학습을 시작하세요.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {/* 아이디 */}
            <div>
              <label className={labelClass}>아이디</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="영문/숫자 조합"
                  className={`flex-1 ${inputClass} ${
                    usernameChecked === "taken" ? "border-red-300 focus:ring-red-400" :
                    usernameChecked === "available" ? "border-green-300 focus:ring-green-400" : ""
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={handleCheckUsername}
                  disabled={!formData.username}
                  className={`px-3 py-3 rounded-xl text-xs whitespace-nowrap transition-all ${
                    usernameChecked === "available"
                      ? "bg-green-100 text-green-700"
                      : "bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:opacity-40"
                  }`}
                >
                  {usernameChecked === "available" ? "사용가능" : "중복확인"}
                </button>
              </div>
              {usernameChecked === "taken" && (
                <p className="text-xs text-red-500 mt-1.5">이미 사용 중인 아이디입니다</p>
              )}
              {usernameChecked === "available" && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span className="text-xs text-green-600">사용 가능한 아이디입니다</span>
                </div>
              )}
            </div>

            {/* 닉네임 */}
            <div>
              <label className={labelClass}>닉네임</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="앱에서 사용할 이름"
                className={inputClass}
                required
              />
            </div>

            {/* 이메일 */}
            <div>
              <label className={labelClass}>이메일</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                  className={`flex-1 ${inputClass} ${emailVerified ? "opacity-60" : ""}`}
                  disabled={emailVerified}
                  required
                />
                <button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={emailVerified || !formData.email}
                  className={`px-4 py-3 rounded-xl text-sm whitespace-nowrap transition-all ${
                    emailVerified
                      ? "bg-green-100 text-green-700"
                      : "bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:opacity-40"
                  }`}
                >
                  {emailVerified ? "완료" : verificationSent ? "재발송" : "인증"}
                </button>
              </div>

              {emailVerified && (
                <div className="flex items-center gap-1.5 mt-2">
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span className="text-xs text-green-600">이메일 인증 완료</span>
                </div>
              )}
            </div>

            {/* 인증번호 */}
            {verificationSent && !emailVerified && (
              <div>
                <label className={labelClass}>인증번호</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="6자리 입력 (테스트: 123456)"
                    maxLength={6}
                    className={inputClass + " flex-1"}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    className="px-4 py-3 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-700 transition-all whitespace-nowrap"
                  >
                    확인
                  </button>
                </div>
              </div>
            )}

            {/* 비밀번호 */}
            <div>
              <label className={labelClass}>비밀번호</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="8자 이상"
                  className={inputClass}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className={labelClass}>비밀번호 확인</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="비밀번호 재입력"
                  className={`${inputClass} ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? "border-red-300 focus:ring-red-400"
                      : ""
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500 mt-1.5">비밀번호가 일치하지 않습니다</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-[#4F46E5] text-white py-3.5 rounded-xl text-sm hover:bg-[#4338CA] active:scale-[0.98] transition-all"
              >
                가입하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
