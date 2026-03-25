import { lazy, Suspense, useState, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useSilentUpdate } from "@/hooks/useSilentUpdate";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import SkeletonLayout from "./components/SkeletonLayout";

import InsanoLogo from "./components/InsanoLogo";
// Eagerly load structural components
import RoleGuard from "./components/RoleGuard";
import StudentGuard from "./components/StudentGuard";
import AppLayout from "./components/AppLayout";
import AuthPage from "./pages/AuthPage";

import AdminLayout from "./components/admin/AdminLayout";

// Lazy load page content
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Perfil = lazy(() => import("./pages/Perfil"));
const MinhaEvolucao = lazy(() => import("./pages/MinhaEvolucao"));
const ConviteAcesso = lazy(() => import("./pages/ConviteAcesso"));
const BattleMode = lazy(() => import("./pages/BattleMode"));
const InstalarApp = lazy(() => import("./pages/InstalarApp"));
const ChatNotificationToast = lazy(() => import("./components/ChatNotificationToast"));
const PWAInstallBanner = lazy(() => import("./components/PWAInstallBanner"));

const Treinos = lazy(() => import("./pages/Treinos"));
const Dieta = lazy(() => import("./pages/Dieta"));
const Desafio = lazy(() => import("./pages/Desafio"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsuarios = lazy(() => import("./pages/admin/AdminUsuarios"));
const AdminRelatorios = lazy(() => import("./pages/admin/AdminRelatorios"));

const FunnelWrapper = lazy(() => import("./components/funnel/FunnelWrapper"));

const MonthlyAssessment = lazy(() => import("./pages/monthly-assessment/MonthlyAssessment"));
const Comunidade = lazy(() => import("./pages/Comunidade"));

const queryClient = new QueryClient();

const PageLoader = () => <SkeletonLayout />;

const AppRoutes = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isMock = localStorage.getItem("USE_MOCK") === "true";

  const isInviteRoute = location.pathname.startsWith("/convite");
  const isInstallRoute = location.pathname === "/instalar";

  if (loading) return <SkeletonLayout />;

  if (isInviteRoute || isInstallRoute) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/convite/:token" element={<ConviteAcesso />} />
          <Route path="/instalar" element={<InstalarApp />} />
        </Routes>
      </Suspense>
    );
  }

  // Base landing: Login or direct dashboard redirect
  if (location.pathname === "/") {
    if (user || isMock) return <Navigate to="/aluno" replace />;
    return <AuthPage />;
  }

  return (
    <>
      <Suspense fallback={<SkeletonLayout />}>
        <ChatNotificationToast />
        <PWAInstallBanner />
      </Suspense>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Zero Friction Funnel SPA */}
          <Route path="/funil" element={<FunnelWrapper />} />

          {/* Student Area Consolidated under /aluno */}
          <Route element={<StudentGuard />}>
            <Route path="/aluno" element={<AppLayout dishonorMode={false} setDishonorMode={() => {}} />}>
              <Route index element={<Dashboard />} />
              <Route path="desafio" element={<Desafio />} />
              <Route path="treinos" element={<Treinos />} />
              <Route path="dieta" element={<Dieta />} />
              <Route path="comunidade" element={<Comunidade />} />
              <Route path="perfil" element={<Perfil />} />
              <Route path="perfil/evolucao" element={<MinhaEvolucao />} />
              <Route path="reavaliacao" element={<MonthlyAssessment />} />
              <Route path="batalha" element={<BattleMode />} />
            </Route>
          </Route>

          {/* Admin Area */}
          <Route element={<RoleGuard allowedRoles={["admin"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/usuarios" element={<AdminUsuarios />} />
              <Route path="/admin/desafios" element={<AdminDesafios />} />
              <Route path="/admin/relatorios" element={<AdminRelatorios />} />
            </Route>
          </Route>



          <Route path="*" element={<DefaultRedirect loggedIn={!!user || isMock} />} />
        </Routes>
      </Suspense>
    </>
  );
};

const DefaultRedirect = ({ loggedIn }: { loggedIn: boolean }) => {
  if (loggedIn) return <Navigate to="/aluno" replace />;
  return <Navigate to="/" replace />;
};

import AdminDesafios from "./pages/admin/AdminDesafios";

const App = () => {
  useSilentUpdate();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <AppRoutes />
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
