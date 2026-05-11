import { createBrowserRouter } from "react-router";
import { LoginScreen } from "./components/login-screen";
import { SignupScreen } from "./components/signup-screen";
import { LevelSelectScreen } from "./components/level-select-screen";
import { FindAccountScreen } from "./components/find-account-screen";
import { ModeSelectScreen } from "./components/mode-select-screen";
import { VoiceRoomListScreen } from "./components/voice-room-list-screen";
import { ChatRoomListScreen } from "./components/chat-room-list-screen";
import { SituationSetupScreen } from "./components/situation-setup-screen";
import { VoiceChatScreen } from "./components/voice-chat-screen";
import { TextChatScreen } from "./components/text-chat-screen";
import { MyPageScreen } from "./components/mypage-screen";
import { SettingsScreen } from "./components/settings-screen";
import { PaymentScreen } from "./components/payment-screen";
import { BookmarksScreen } from "./components/bookmarks-screen";
import { NoticeScreen } from "./components/notice-screen";
import { FaqScreen } from "./components/faq-screen";
import { RootLayout } from "./components/root-layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: LoginScreen },
      { path: "signup", Component: SignupScreen },
      { path: "level-select", Component: LevelSelectScreen },
      { path: "find-account", Component: FindAccountScreen },
      { path: "mode-select", Component: ModeSelectScreen },
      { path: "voice-rooms", Component: VoiceRoomListScreen },
      { path: "chat-rooms", Component: ChatRoomListScreen },
      { path: "situation-setup/:mode", Component: SituationSetupScreen },
      { path: "voice-chat/:roomId", Component: VoiceChatScreen },
      { path: "text-chat/:roomId", Component: TextChatScreen },
      { path: "mypage", Component: MyPageScreen },
      { path: "settings", Component: SettingsScreen },
      { path: "payment", Component: PaymentScreen },
      { path: "bookmarks", Component: BookmarksScreen },
      { path: "notice", Component: NoticeScreen },
      { path: "faq", Component: FaqScreen },
    ],
  },
]);