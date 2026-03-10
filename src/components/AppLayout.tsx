import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, QrCode, ScanLine, ArrowLeftRight,
  Bell, Clock, FileWarning, BarChart3, UserCog, School, PowerOff,
  ShieldAlert, Settings, Menu, X, LogOut, CalendarDays, TrendingUp,
  FileCheck, Power, Brain, Bot, Shield, FileText, Flame,
  ChevronLeft, ChevronRight, Cpu, Zap, History, WifiOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSyncQueueCount } from "@/hooks/useSyncQueueCount";

type NavSection = {
  title: string;
  items: { label: string; icon: any; path: string; roles: string[] }[];
};

const navSections: NavSection[] = [
  {
    title: "Central",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/", roles: ["admin", "coordinator"] },
      { label: "Analytics", icon: TrendingUp, path: "/analise", roles: ["admin", "coordinator"] },
      { label: "Calendário", icon: CalendarDays, path: "/calendario", roles: ["admin", "coordinator"] },
    ],
  },
  {
    title: "Gestão",
    items: [
      { label: "Alunos", icon: Users, path: "/alunos", roles: ["admin", "coordinator"] },
      { label: "Turmas", icon: School, path: "/turmas", roles: ["admin", "coordinator"] },
      { label: "QR Codes", icon: QrCode, path: "/qrcodes", roles: ["admin", "coordinator"] },
      { label: "Horários", icon: Clock, path: "/horarios", roles: ["admin"] },
    ],
  },
  {
    title: "Acesso",
    items: [
      { label: "Portaria", icon: ScanLine, path: "/portaria", roles: ["admin", "gatekeeper"] },
      { label: "Movimentos", icon: ArrowLeftRight, path: "/movimentacoes", roles: ["admin", "gatekeeper", "coordinator"] },
      { label: "Autorizações", icon: ShieldAlert, path: "/autorizacoes-saida", roles: ["admin", "coordinator"] },
    ],
  },
  {
    title: "Monitoramento",
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
      { label: "Auditoria", icon: History, path: "/auditoria", roles: ["admin"] },
      { label: "Usuários", icon: UserCog, path: "/usuarios", roles: ["admin"] },
      { label: "Config", icon: Settings, path: "/configuracoes", roles: ["admin"] },
    ],
  },
];

const SystemStatusOverlay = () => (
  <div className="fixed inset-0 z-[100] bg-background/98 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center tech-grid">
    <div className="h-24 w-24 rounded-2xl bg-destructive/20 text-destructive flex items-center justify-center mb-6 animate-pulse glow-sm border border-destructive/30">
      <PowerOff className="h-12 w-12" />
    </div>
    <h1 className="text-3xl font-bold text-foreground mb-3">Sistema Suspenso</h1>
    <p className="text-muted-foreground max-w-sm leading-relaxed">
      Manutenção em andamento. Aguarde o reestabelecimento.
    </p>
    <div className="mt-8 flex items-center gap-2.5 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/30">
      <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
      <span className="text-xs font-mono font-semibold text-destructive uppercase tracking-wider">OFFLINE</span>
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
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem("high-contrast") === "true");

  const { count: syncQueueCount, isOnline } = useSyncQueueCount();

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add("high-contrast");
    } else {
      document.body.classList.remove("high-contrast");
    }
    localStorage.setItem("high-contrast", highContrast.toString());
  }, [highContrast]);

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

    const playNotificationSound = () => {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.error("Error playing sound:", e));
    };

    const alertsChannel = supabase.channel('realtime-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, (payload) => {
        fetchCounts();
        if (payload.eventType === 'INSERT') {
          playNotificationSound();
          toast.info("Novo Alerta recebido!");
        }
      })
      .subscribe();

    const justificationsChannel = supabase.channel('realtime-justifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absence_justifications' }, (payload) => {
        fetchCounts();
        if (payload.eventType === 'INSERT') {
          playNotificationSound();
          toast.info("Nova Justificativa de Falta!");
        }
      })
      .subscribe();

    const movementsChannel = supabase.channel('realtime-movements')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'movements' }, (payload) => {
        // A delay or debouncer might be needed in high-traffic, but for now we play on each insert
        playNotificationSound();
        const typeLabel = (payload.new as any).type === 'entry' ? 'Entrada' : 'Saída';
        toast.success(`Portão: ${typeLabel} registrada!`);
      })
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
      supabase.removeChannel(movementsChannel);
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
      toast.success(newStatus ? "Sistema Ativo!" : "Sistema Suspenso.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao alterar status.");
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
    <div className="flex min-h-screen bg-background relative overflow-hidden font-sans tech-grid">
      {!isSystemActive && !isAdmin && <SystemStatusOverlay />}

      {/* Ambient glow */}
      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-primary/[0.05] blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-accent/[0.03] blur-[120px] pointer-events-none" />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-out lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "w-[68px]" : "w-[250px]"}`}>
        {/* Logo */}
        <div className={`flex items-center h-14 border-b border-sidebar-border px-3 ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center p-1">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-xs font-bold text-foreground tracking-wider truncate">CETI NOVA ITARANA</h1>
              <p className="text-[9px] text-primary font-mono font-semibold tracking-widest">100% TECNOLOGIA</p>
            </div>
          )}
          <button className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:bg-secondary" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 custom-scrollbar space-y-4">
          {navSections.map((section) => {
            const items = filterItems(section.items);
            if (items.length === 0) return null;
            return (
              <div key={section.title}>
                {!collapsed && (
                  <p className="text-[9px] font-semibold text-primary/60 uppercase tracking-[0.2em] px-3 mb-1.5 font-mono">{section.title}</p>
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
                        <item.icon className={`h-[17px] w-[17px] shrink-0 ${active ? "text-primary" : ""}`} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed && badgeCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded bg-destructive text-[10px] font-mono font-bold text-destructive-foreground px-1">
                            {badgeCount}
                          </span>
                        )}
                        {collapsed && badgeCount > 0 && (
                          <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-destructive" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="hidden lg:flex items-center justify-center py-2 border-t border-sidebar-border">
          <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-primary transition-colors">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Signout */}
        <div className={`p-2 border-t border-sidebar-border ${collapsed ? "flex justify-center" : ""}`}>
          <button onClick={signOut}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors w-full ${collapsed ? "justify-center" : ""}`}>
            <LogOut className="h-[17px] w-[17px] shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 relative z-10">
        <header className="glass-header h-14 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-muted-foreground p-2 rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary hidden md:block" />
              <h2 className="text-sm font-bold text-foreground tracking-wide">
                {navSections.flatMap(s => s.items).find(i => i.path === location.pathname)?.label || "Sistema"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isOnline && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-warning/10 text-warning border border-warning/20">
                <WifiOff className="h-4 w-4 animate-pulse" />
                <span className="text-[11px] font-mono font-bold tracking-tight">OFFLINE</span>
                {syncQueueCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-warning text-warning-foreground text-[10px] font-bold">
                    {syncQueueCount} {syncQueueCount === 1 ? 'pendente' : 'pendentes'}
                  </span>
                )}
              </div>
            )}

            {isAdmin && (
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-colors ${highContrast
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-secondary border border-border"
                  }`}
                title="Alternar Contraste"
              >
                <ScanLine className="h-3 w-3" />
                {highContrast ? "NORMAL" : "CONTRASTE"}
              </button>
            )}

            {isAdmin && (
              <button onClick={toggleSystemStatus}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-colors ${isSystemActive
                  ? "bg-success/10 text-success hover:bg-success/20 border border-success/30"
                  : "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30 animate-pulse"
                  }`}
              >
                {isSystemActive ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                {isSystemActive ? "ONLINE" : "OFFLINE"}
              </button>
            )}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-foreground">{user?.user_metadata?.full_name || "Usuário"}</span>
              <span className="text-[10px] text-primary font-mono capitalize">{role || "user"}</span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xs font-bold glow-sm ring-2 ring-background">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
