import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

export function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/mode-select");
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`${provider} 로그인 시도`);
    navigate("/mode-select");
  };

  return (
    <div className="h-dvh w-full bg-white flex flex-col overflow-y-auto">
      {/* 상단 브랜드 영역 */}
      <div className="flex-shrink-0 px-6 pt-16 pb-10 flex flex-col items-center text-center">
        <div className="mb-2">
          <span className="text-[48px] leading-none font-[Lily_Script_One] text-[#4F46E5]">SenTic</span>
        </div>
        <p className="text-gray-500 text-sm">AI 영어 소통 학습 파트너</p>
      </div>

      {/* 로그인 폼 */}
      <div className="flex-1 px-6 pb-8">
        <div className="max-w-sm mx-auto">
          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-xs text-gray-500 tracking-wide uppercase">
                아이디
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디 입력"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all text-gray-900 placeholder-gray-400"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs text-gray-500 tracking-wide uppercase">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/find-account")}
                className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                아이디 / 비밀번호 찾기
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-[#4F46E5] text-white py-3.5 rounded-xl text-sm hover:bg-[#4338CA] active:scale-[0.98] transition-all"
            >
              로그인
            </button>
          </form>

          {/* 구분선 */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">소셜 계정으로 시작</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* 소셜 로그인 */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={() => handleSocialLogin("카카오")}
              className="flex-1 flex items-center justify-center gap-2 bg-[#FEE500] py-3 rounded-xl hover:bg-[#F5DC00] active:scale-[0.98] transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M10 3C5.58172 3 2 5.89543 2 9.5C2 11.6484 3.31828 13.5234 5.29828 14.6406L4.49828 17.5781C4.43625 17.7859 4.65422 17.9609 4.84391 17.8547L8.33172 15.7828C8.87969 15.8609 9.43516 15.9 10 15.9C14.4183 15.9 18 13.0046 18 9.4C18 5.79543 14.4183 3 10 3Z" fill="#000000" />
              </svg>
              <span className="text-xs text-black/80">카카오</span>
            </button>
            <button
              onClick={() => handleSocialLogin("구글")}
              className="flex-1 flex items-center justify-center gap-2 bg-white py-3 rounded-xl border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M18.1713 8.36791H17.5001V8.33325H10.0001V11.6666H14.7096C14.0225 13.607 12.1763 14.9999 10.0001 14.9999C7.23882 14.9999 5.00007 12.7612 5.00007 9.99992C5.00007 7.23867 7.23882 4.99992 10.0001 4.99992C11.2746 4.99992 12.4342 5.48075 13.3171 6.26625L15.6742 3.909C14.1859 2.52217 12.1951 1.66659 10.0001 1.66659C5.39798 1.66659 1.66675 5.39783 1.66675 9.99992C1.66675 14.602 5.39798 18.3333 10.0001 18.3333C14.6021 18.3333 18.3334 14.602 18.3334 9.99992C18.3334 9.44117 18.2759 8.89533 18.1713 8.36791Z" fill="#FFC107" />
                <path d="M2.62744 6.12117L5.36536 8.12909C6.10619 6.29492 7.90036 4.99992 9.99994 4.99992C11.2744 4.99992 12.434 5.48075 13.3169 6.26625L15.674 3.909C14.1857 2.52217 12.1949 1.66659 9.99994 1.66659C7.15911 1.66659 4.71286 3.47367 3.62744 6.12117Z" fill="#FF3D00" />
                <path d="M10.0001 18.3333C12.1526 18.3333 14.1084 17.5096 15.5871 16.17L13.0076 13.9875C12.1439 14.6452 11.0864 15.0008 10.0001 15C7.83261 15 5.99094 13.6179 5.29844 11.6892L2.58094 13.7829C3.65177 16.4817 7.11344 18.3333 10.0001 18.3333Z" fill="#4CAF50" />
                <path d="M18.1713 8.36808H17.5V8.33341H10V11.6667H14.7096C14.3809 12.5902 13.7889 13.3972 13.0067 13.988L13.0079 13.9872L15.5875 16.1697C15.4046 16.3355 18.3333 14.1667 18.3333 10.0001C18.3333 9.44133 18.2758 8.8955 18.1713 8.36808Z" fill="#1976D2" />
              </svg>
              <span className="text-xs text-gray-700">구글</span>
            </button>
          </div>

          {/* 회원가입 */}
          <div className="text-center">
            <span className="text-sm text-gray-500">처음 오셨나요? </span>
            <button
              onClick={() => navigate("/signup")}
              className="text-sm text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              회원가입
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}