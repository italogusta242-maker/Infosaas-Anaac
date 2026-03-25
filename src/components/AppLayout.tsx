import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import NotificationCenter from "@/components/NotificationCenter";
import PushPermissionBanner from "@/components/PushPermissionBanner";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface AppLayoutProps {
  dishonorMode: boolean;
  setDishonorMode: (v: boolean) => void;
}

const AppLayout = ({ dishonorMode, setDishonorMode }: AppLayoutProps) => {
  const { pushState, requestPermission } = usePushNotifications();
  const location = useLocation();

  // Hide top bar on chat pages and the main dashboard (they have their own headers)
  const isChatConversation = /^\/aluno\/chat\/[^/]+/.test(location.pathname);
  const isDashboard = location.pathname === "/aluno" || location.pathname === "/aluno/";
  const hideHeader = isChatConversation || isDashboard;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar — only NotificationBell. ChatIcon and ProfileIcon removed per spec. */}
      {!hideHeader && (
        <header className="sticky top-0 z-40 flex items-center justify-end w-full rounded-none px-0 py-2 bg-background/80 backdrop-blur border-b border-border/50">
          <div className="pr-4">
            <NotificationCenter />
          </div>
        </header>
      )}
      <PushPermissionBanner pushState={pushState} onRequestPermission={requestPermission} />
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
