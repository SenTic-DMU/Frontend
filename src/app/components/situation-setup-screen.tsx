import { ArrowLeft, Shuffle, Plus, X, User, Baby, Bot, PersonStanding, Camera } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";

type AvatarIcon = "male" | "female" | "child" | "elder" | "robot";

interface Character {
  id: string;
  name: string;
  personality: string;
  avatarIcon: AvatarIcon;
  photoUrl?: string; // 업로드된 사진 URL
}

const avatarOptions: { id: AvatarIcon; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "male", label: "남자", icon: <User size={14} />, color: "bg-blue-100 text-blue-600" },
  { id: "female", label: "여자", icon: <User size={14} />, color: "bg-pink-100 text-pink-600" },
  { id: "child", label: "어린이", icon: <Baby size={14} />, color: "bg-yellow-100 text-yellow-600" },
  { id: "elder", label: "노인", icon: <PersonStanding size={14} />, color: "bg-orange-100 text-orange-600" },
  { id: "robot", label: "로봇", icon: <Bot size={14} />, color: "bg-purple-100 text-purple-600" },
];

const MAX_CHARACTERS = 2;

export function SituationSetupScreen() {
  const navigate = useNavigate();
  const { mode } = useParams<{ mode: string }>();
  const isVoice = mode === "voice";
  const accentColor = isVoice ? "bg-[#4F46E5]" : "bg-green-600";
  const ringColor = isVoice ? "focus:ring-indigo-500" : "focus:ring-green-500";

  const [title, setTitle] = useState("");
  const [situation, setSituation] = useState("");
  const [characters, setCharacters] = useState<Character[]>([
    { id: "1", name: "", personality: "", avatarIcon: "male" }
  ]);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const randomSituations = [
    { title: "카페에서 커피 주문하기", description: "스타벅스에서 바리스타에게 커피를 주문하는 상황", characters: [{ name: "바리스타", personality: "친절하고 빠른 서비스" }, { name: "손님", personality: "정중하고 신중함" }] },
    { title: "공항에서 체크인하기", description: "공항 카운터에서 항공권 체크인을 하는 상황", characters: [{ name: "항공사 직원", personality: "전문적이고 정확함" }, { name: "승객", personality: "여행에 설렘" }] },
    { title: "호텔 체크인하기", description: "해외 호텔 프론트에서 체크인하는 상황", characters: [{ name: "리셉셔니스트", personality: "매우 친절하고 세심함" }, { name: "투숙객", personality: "피곤하지만 기대에 참" }] },
    { title: "레스토랑에서 주문하기", description: "이탈리안 레스토랑에서 메뉴를 추천받고 주문하는 상황", characters: [{ name: "웨이터", personality: "음식에 대한 지식이 풍부함" }, { name: "손님", personality: "처음 방문해서 호기심 많음" }] },
    { title: "비즈니스 미팅 진행하기", description: "회의실에서 신규 프로젝트에 대해 논의하는 상황", characters: [{ name: "팀장", personality: "리더십 있고 결단력 있음" }, { name: "팀원", personality: "창의적이고 열정적임" }] },
  ];

  const generateRandomSituation = () => {
    const random = randomSituations[Math.floor(Math.random() * randomSituations.length)];
    setTitle(random.title);
    setSituation(random.description);
    // 최대 2명으로 제한하여 설정
    const limitedChars = random.characters.slice(0, MAX_CHARACTERS);
    setCharacters(limitedChars.map((char, index) => ({
      id: (Date.now() + index).toString(),
      name: char.name,
      personality: char.personality,
      avatarIcon: index === 0 ? "female" : "male" as AvatarIcon,
    })));
  };

  const addCharacter = () => {
    if (characters.length >= MAX_CHARACTERS) return;
    setCharacters([...characters, { id: Date.now().toString(), name: "", personality: "", avatarIcon: "male" }]);
  };

  const removeCharacter = (id: string) => {
    if (characters.length === 1) return;
    setCharacters(characters.filter(c => c.id !== id));
  };

  const updateCharacter = (id: string, field: keyof Character, value: string) => {
    setCharacters(characters.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handlePhotoUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCharacters(characters.map(c => c.id === id ? { ...c, photoUrl: url } : c));
  };

  const removePhoto = (id: string) => {
    setCharacters(characters.map(c => c.id === id ? { ...c, photoUrl: undefined } : c));
  };

  const handleStart = () => {
    if (!title || !situation) {
      alert("제목과 상황을 입력해주세요");
      return;
    }
    if (characters.some(c => !c.name.trim())) {
      alert("모든 등장인물의 이름을 입력해주세요");
      return;
    }
    const roomId = Date.now().toString();
    navigate(isVoice ? `/voice-chat/${roomId}` : `/text-chat/${roomId}`);
  };

  const inputClass = `w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${ringColor} focus:border-transparent focus:bg-white transition-all text-gray-900 placeholder-gray-400 text-sm`;

  return (
    <div className="h-dvh w-full bg-[#FAFAFA] flex flex-col">
      {/* 헤더 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 pt-3 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-gray-900">상황 설정</h1>
              <p className="text-xs text-gray-400">{isVoice ? "음성 대화" : "채팅 대화"}</p>
            </div>
          </div>
          <button
            onClick={generateRandomSituation}
            className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors"
          >
            <Shuffle size={13} />
            랜덤
          </button>
        </div>
      </div>

      {/* 폼 */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div className="max-w-sm mx-auto space-y-5">
          {/* 대화방 제목 */}
          <div className="space-y-2">
            <label className="block text-xs text-gray-500 uppercase tracking-wide">대화방 제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 카페에서 주문하기"
              className={inputClass}
            />
          </div>

          {/* 상황 설명 */}
          <div className="space-y-2">
            <label className="block text-xs text-gray-500 uppercase tracking-wide">상황 설명</label>
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="원하는 상황을 자세히 설명해주세요"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* 등장인물 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide">등장인물</label>
                <p className="text-[10px] text-gray-400 mt-0.5">최대 {MAX_CHARACTERS}명까지 추가 가능</p>
              </div>
              <button
                onClick={addCharacter}
                disabled={characters.length >= MAX_CHARACTERS}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  characters.length >= MAX_CHARACTERS
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-indigo-500 hover:text-indigo-700"
                }`}
              >
                <Plus size={13} />
                추가
              </button>
            </div>

            <div className="space-y-3">
              {characters.map((char, index) => (
                <div key={char.id} className="bg-white rounded-xl border border-gray-100 p-3.5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400">인물 {index + 1}</span>
                    {characters.length > 1 && (
                      <button
                        onClick={() => removeCharacter(char.id)}
                        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                      >
                        <X size={12} className="text-gray-400 hover:text-red-500" />
                      </button>
                    )}
                  </div>

                  {/* 프로필 사진 업로드 */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative flex-shrink-0">
                      {char.photoUrl ? (
                        <div className="relative">
                          <img
                            src={char.photoUrl}
                            alt="프로필"
                            className="w-14 h-14 rounded-xl object-cover border border-gray-200"
                          />
                          <button
                            onClick={() => removePhoto(char.id)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                          >
                            <X size={10} className="text-white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRefs.current[char.id]?.click()}
                          className="w-14 h-14 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center hover:bg-gray-100 hover:border-gray-300 transition-all gap-1"
                        >
                          <Camera size={16} className="text-gray-400" />
                          <span className="text-[9px] text-gray-400">사진</span>
                        </button>
                      )}
                      <input
                        ref={(el) => { fileInputRefs.current[char.id] = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(char.id, e)}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 mb-1">프로필 아이콘</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {avatarOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => updateCharacter(char.id, "avatarIcon", opt.id)}
                            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border transition-all ${
                              char.avatarIcon === opt.id
                                ? `${opt.color} border-current/40`
                                : "border-gray-100 text-gray-400 hover:border-gray-200"
                            }`}
                          >
                            {opt.icon}
                            <span className="text-[9px]">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={char.name}
                      onChange={(e) => updateCharacter(char.id, "name", e.target.value)}
                      placeholder="이름 (예: 바리스타)"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                    />
                    <input
                      type="text"
                      value={char.personality}
                      onChange={(e) => updateCharacter(char.id, "personality", e.target.value)}
                      placeholder="성격 / 특징 (선택)"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 주의 */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <span className="text-sm flex-shrink-0">⚠️</span>
            <p className="text-xs text-amber-700">부적절한 상황 설정은 자동으로 제한됩니다</p>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-5 py-4">
        <div className="max-w-sm mx-auto">
          <button
            onClick={handleStart}
            className={`w-full ${accentColor} text-white py-3.5 rounded-xl text-sm hover:opacity-90 active:scale-[0.98] transition-all`}
          >
            대화 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}