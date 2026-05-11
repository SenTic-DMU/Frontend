import { ArrowLeft, Plus, MessageSquare, Trash2, ChevronRight, MoreVertical, Pencil, Check, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";

interface Room {
  id: string;
  title: string;
  lastMessage: string;
  date: string;
  unread?: number;
}

export function ChatRoomListScreen() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: "1",
      title: "영화 이야기",
      lastMessage: "What's your favorite movie?",
      date: "오늘",
      unread: 2,
    },
    {
      id: "2",
      title: "업무 이메일 작성",
      lastMessage: "I'm writing to inform you about...",
      date: "어제",
    },
  ]);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editError, setEditError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const deleteRoom = (id: string) => {
    setRooms(rooms.filter((room) => room.id !== id));
    setOpenMenuId(null);
  };

  const startEdit = (room: Room) => {
    setEditingId(room.id);
    setEditTitle(room.title);
    setEditError("");
    setOpenMenuId(null);
  };

  const confirmEdit = (id: string) => {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      setEditError("제목을 입력해주세요");
      return;
    }
    const isDuplicate = rooms.some((r) => r.id !== id && r.title === trimmed);
    if (isDuplicate) {
      setEditError("이미 같은 제목의 대화방이 있습니다");
      return;
    }
    setRooms(rooms.map((r) => r.id === id ? { ...r, title: trimmed } : r));
    setEditingId(null);
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError("");
  };

  return (
    <div className="h-dvh w-full bg-[#FAFAFA] flex flex-col">
      {/* 헤더 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 pt-3 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/mode-select")}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-gray-900">채팅 대화</h1>
              <p className="text-xs text-gray-400">{rooms.length}개의 대화방</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/situation-setup/chat")}
            className="flex items-center gap-1.5 bg-green-600 text-white px-3.5 py-2 rounded-xl text-sm hover:bg-green-700 active:scale-[0.97] transition-all"
          >
            <Plus size={15} />
            새 대화
          </button>
        </div>
      </div>

      {/* 방 목록 */}
      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pb-20">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare size={28} className="text-green-300" />
            </div>
            <p className="text-gray-500 text-sm mb-1">아직 대화방이 없어요</p>
            <p className="text-xs text-gray-400">새 대화 버튼으로 시작해 보세요</p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-2.5">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="w-full bg-white rounded-2xl border border-gray-100 p-4 hover:border-green-100 hover:shadow-sm transition-all"
              >
                {editingId === room.id ? (
                  /* 수정 모드 */
                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => { setEditTitle(e.target.value); setEditError(""); }}
                        autoFocus
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmEdit(room.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                      <button
                        onClick={() => confirmEdit(room.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-green-50 hover:bg-green-100 transition-colors"
                      >
                        <Check size={14} className="text-green-600" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <X size={14} className="text-gray-400" />
                      </button>
                    </div>
                    {editError && (
                      <p className="text-xs text-red-500 mt-1.5">{editError}</p>
                    )}
                  </div>
                ) : (
                  /* 일반 모드 */
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/text-chat/${room.id}`)}
                  >
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MessageSquare size={18} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="text-gray-900 text-sm truncate">{room.title}</h3>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{room.date}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400 truncate flex-1">{room.lastMessage}</p>
                        {room.unread && (
                          <span className="text-[10px] text-white bg-green-500 px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 min-w-[18px] text-center">
                            {room.unread}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative flex-shrink-0" ref={openMenuId === room.id ? menuRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === room.id ? null : room.id);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical size={15} className="text-gray-400" />
                      </button>
                      {openMenuId === room.id && (
                        <div
                          className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden min-w-[100px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => startEdit(room)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                          >
                            <Pencil size={13} className="text-gray-400" />
                            수정
                          </button>
                          <button
                            onClick={() => deleteRoom(room.id)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-red-50 transition-colors text-sm text-red-500"
                          >
                            <Trash2 size={13} className="text-red-400" />
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
