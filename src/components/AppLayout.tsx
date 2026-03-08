import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, QrCode, ScanLine, ArrowLeftRight,
  Bell, Clock, FileWarning, BarChart3, UserCog, School, PowerOff,
  ShieldAlert, Settings, Menu, X, LogOut, CalendarDays, TrendingUp,
  FileCheck, Power, Brain, Bot, Shield, FileText, Flame,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type NavSection = {
  title: string;
  items: { label: string; icon: any; path: string; roles: string[] }[];
};

const navSections: NavSection[] = [
  {
    title: "Principal",
    items: [
      { label: "Painel Geral", icon: LayoutDashboard, path: "/", roles: ["admin", "coordinator"] },
      { label: "Análise", icon: TrendingUp, path: "/analise", roles: ["admin", "coordinator"] },
      { label: "Calendário", icon: CalendarDays, path: "/calendario", roles: ["admin", "coordinator"] },
    ],
  },
  {
    title: "Gestão Escolar",
    items: [
      { label: "Alunos", icon: Users, path: "/alunos", roles: ["admin", "coordinator"] },
      { label: "Turmas", icon: School, path: "/turmas", roles: ["admin", "coordinator"] },
      { label: "QR Codes", icon: QrCode, path: "/qrcodes", roles: ["admin", "coordinator"] },
      { label: "Horários", icon: Clock, path: "/horarios", roles: ["admin"] },
    ],
  },
  {
    title: "Controle de Acesso",
    items: [
      { label: "Portaria", icon: ScanLine, path: "/portaria", roles: ["admin", "gatekeeper"] },
      { label: "Movimentações", icon: ArrowLeftRight, path: "/movimentacoes", roles: ["admin", "gatekeeper", "coordinator"] },
      { label: "Autorizações", icon: ShieldAlert, path: "/autorizacoes-saida", roles: ["admin", "coordinator"] },
    ],
  },
  {
    title: "Ocorrências",
    items: [
      { label: "Alertas", icon: Bell, path: "/alertas", roles: ["admin", "coordinator"] },
      { label: "Ocorrências", icon: FileWarning, path: "/ocorrencias", roles: ["admin", "coordinator"] },
      { label: "Justificativas", icon: FileCheck, path: "/justificativas", roles: ["admin", "coordinator"] },
    ],
  },
  {
    title: "Inteligência Artificial",
    items: [
      { label: "Predição IA", icon: Brain, path: "/predicao-evasao", roles: ["admin", "coordinator"] },
      { label: "Anomalias IA", icon: Shield, path: "/anomalias", roles: ["admin", "coordinator"] },
      { label: "Comunicados IA", icon: FileText, path: "/comunicados", roles: ["admin", "coordinator"] },
      { label: "Mapa de Calor", icon: Flame, path: "/mapa-calor", roles: ["admin", "coordinator"] },
      { label: "Assistente IA", icon: Bot, path: "/assistente", roles: ["admin", "coordinator", "gatekeeper"] },
    ],
  },
  {
    title: "Sistema",
    items: [
      { label: "Relatórios", icon: BarChart3, path: "/relatorios", roles: ["admin", "coordinator"] },
      { label: "Usuários", icon: UserCog, path: "/usuarios", roles: ["admin"] },
      { label: "Configurações", icon: Settings, path: "/configuracoes", roles: ["admin"] },
    ],
  },
];

const SystemStatusOverlay = () => (
  <div className="fixed inset-0 z-[100] bg-background/98 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
    <div className="h-20 w-20 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-6 animate-pulse">
      <PowerOff className="h-10 w-10" />
    </div>
    <h1 className="text-3xl font-bold text-foreground mb-3 font-display">Sistema Suspenso</h1>
    <p className="text-muted-foreground max-w-sm leading-relaxed">
      O administrador suspendeu temporariamente as operações do sistema para manutenção.
    </p>
    <div className="mt-8 flex items-center gap-2.5 px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/20">
      <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
      <span className="text-xs font-semibold text-destructive uppercase tracking-wider">Offline</span>
    </div>
  </div>
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut, isAdmin, role } = useAuth();
  const [isSystemActive, setIsSystemActive] = useState(true);
  const [pendingAlertsCount, setPendingAlertsCount] = useState(0);
  const [pendingJustificationsCount, setPendingJustificationsCount] = useState(0);

  const filterItems = (items: NavSection["items"]) =>
    items.filter(item => isAdmin || item.roles.includes(role || ""));

  useEffect(() => {
    const fetchCounts = async () => {
      const [alertsRes, justificationsRes] = await Promise.all([
        supabase.from("alerts" as any).select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("absence_justifications" as any).select("id", { count: "exact", head: true }).eq("status", "pending")
      ]);
      setPendingAlertsCount(alertsRes.count || 0);
      setPendingJustificationsCount(justificationsRes.count || 0);
    };

    fetchCounts();

    const alertsChannel = supabase.channel('realtime-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => fetchCounts())
      .subscribe();

    const justificationsChannel = supabase.channel('realtime-justifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absence_justifications' }, () => fetchCounts())
      .subscribe();

    const checkStatus = async () => {
      try {
        const { data } = await supabase.from("settings").select("*").limit(1).maybeSingle();
        if (data && typeof (data as any).system_active === 'boolean') {
          setIsSystemActive((data as any).system_active);
        }
      } catch (err) {
        console.error("Error checking system status", err);
      }
    };

    checkStatus();

    const statusChannel = supabase.channel('system-status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings' }, (payload) => {
        if (typeof (payload.new as any).system_active === 'boolean') {
          setIsSystemActive((payload.new as any).system_active);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(justificationsChannel);
      supabase.removeChannel(statusChannel);
    };
  }, []);

  const toggleSystemStatus = async () => {
    if (!isAdmin) return;
    try {
      const { data: currentSettings, error: fetchErr } = await supabase.from("settings").select("*").limit(1).maybeSingle();
      if (fetchErr || !currentSettings) throw new Error("Could not fetch settings");
      const newStatus = !(currentSettings as any).system_active;
      const { error: updateErr } = await supabase.from("settings").update({ system_active: newStatus } as any).eq("id", currentSettings.id);
      if (updateErr) throw new Error("Could not update settings");
      setIsSystemActive(newStatus);
      toast.success(newStatus ? "Sistema Ativado!" : "Sistema Suspenso.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao alterar o status.");
    }
  };

  const getBadgeCount = (label: string) => {
    if (label === "Alertas") return pendingAlertsCount;
    if (label === "Justificativas") return pendingJustificationsCount;
    return 0;
  };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden font-sans">
      {!isSystemActive && !isAdmin && <SystemStatusOverlay />}

      {/* Subtle bg accents */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-info/[0.02] blur-[120px] pointer-events-none" />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-out lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "w-[72px]" : "w-[260px]"}`}>
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-sidebar-border px-4 ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-xs font-bold text-sidebar-foreground tracking-wide truncate font-display">CETI NOVA ITARANA</h1>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-success" />
                <p className="text-[10px] text-muted-foreground font-medium">Online</p>
              </div>
            </div>
          )}
          <button className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-secondary" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar space-y-5">
          {navSections.map((section) => {
            const items = filterItems(section.items);
            if (items.length === 0) return null;
            return (
              <div key={section.title}>
                {!collapsed && (
                  <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-3 mb-2">{section.title}</p>
                )}
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const active = location.pathname === item.path;
                    const badgeCount = getBadgeCount(item.label);
                    return (
                      <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                        className={`sidebar-link ${active ? "sidebar-link-active" : ""} ${collapsed ? "justify-center px-0" : ""}`}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-primary" : ""}`} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed && badgeCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1.5">
                            {badgeCount}
                          </span>
                        )}
                        {collapsed && badgeCount > 0 && (
                          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="hidden lg:flex items-center justify-center py-2 border-t border-sidebar-border">
          <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Signout */}
        <div className={`p-3 border-t border-sidebar-border ${collapsed ? "flex justify-center" : ""}`}>
          <button onClick={signOut}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors w-full ${collapsed ? "justify-center" : ""}`}>
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 relative z-10">
        <header className="glass-header h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-muted-foreground p-2 rounded-xl hover:bg-secondary transition-colors" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden md:block">
              <h2 className="text-base font-bold text-foreground font-display tracking-tight">
                {navSections.flatMap(s => s.items).find(i => i.path === location.pathname)?.label || "Painel"}
              </h2>
            </div>
            <div className="md:hidden">
              <h2 className="text-sm font-bold text-foreground font-display">CETI Digital</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button onClick={toggleSystemStatus}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isSystemActive
                  ? "bg-success/10 text-success hover:bg-success/20 border border-success/20"
                  : "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 animate-pulse"
                }`}
              >
                {isSystemActive ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                {isSystemActive ? "Ativo" : "Suspenso"}
              </button>
            )}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-foreground">{user?.user_metadata?.full_name || "Usuário"}</span>
              <span className="text-[11px] text-muted-foreground capitalize">{role || "Membro"}</span>
            </div>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg shadow-primary/20 ring-2 ring-background">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
