import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  QrCode,
  ScanLine,
  ArrowLeftRight,
  Bell,
  Clock,
  FileWarning,
  BarChart3,
  UserCog,
  School,
  PowerOff,
  ShieldAlert,
  Settings,
  Menu,
  X,
  LogOut,
  CalendarDays,
  TrendingUp,
  FileCheck,
} from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Painel Geral", icon: LayoutDashboard, path: "/", roles: ["admin", "coordinator"] },
  { label: "Alunos", icon: Users, path: "/alunos", roles: ["admin", "coordinator"] },
  { label: "Turmas", icon: School, path: "/turmas", roles: ["admin", "coordinator"] },
  { label: "QR Codes", icon: QrCode, path: "/qrcodes", roles: ["admin", "coordinator"] },
  { label: "Portaria", icon: ScanLine, path: "/portaria", roles: ["admin", "gatekeeper"] },
  { label: "Movimentações", icon: ArrowLeftRight, path: "/movimentacoes", roles: ["admin", "gatekeeper", "coordinator"] },
  { label: "Alertas", icon: Bell, path: "/alertas", roles: ["admin", "coordinator"] },
  { label: "Horários", icon: Clock, path: "/horarios", roles: ["admin"] },
  { label: "Análise", icon: TrendingUp, path: "/analise", roles: ["admin", "coordinator"] },
  { label: "Ocorrências", icon: FileWarning, path: "/ocorrencias", roles: ["admin", "coordinator"] },
  { label: "Justificativas", icon: FileCheck, path: "/justificativas", roles: ["admin", "coordinator"] },
  { label: "Relatórios", icon: BarChart3, path: "/relatorios", roles: ["admin", "coordinator"] },
  { label: "Usuários", icon: UserCog, path: "/usuarios", roles: ["admin"] },
  { label: "Calendário", icon: CalendarDays, path: "/calendario", roles: ["admin", "coordinator"] },
  { label: "Configurações", icon: Settings, path: "/configuracoes", roles: ["admin"] },
];

const SystemStatusOverlay = () => (
  <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
    <div className="h-24 w-24 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mb-8 animate-pulse">
      <PowerOff className="h-12 w-12" />
    </div>
    <h1 className="text-4xl font-black text-foreground mb-4 tracking-tight">Sistema Suspenso 🛑</h1>
    <p className="text-lg text-muted-foreground max-w-md font-medium leading-relaxed">
      O administrador suspendeu temporariamente as operações do sistema para manutenção ou atualização.
      Por favor, aguarde o reestabelecimento.
    </p>
    <div className="mt-12 flex items-center gap-3 px-6 py-3 rounded-2xl bg-muted/50 border border-border/50">
      <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Status: Offline</span>
    </div>
  </div>
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut, isAdmin, role } = useAuth();
  const [isSystemActive, setIsSystemActive] = useState(true);

  const filteredNavItems = navItems.filter(item => {
    if (isAdmin) return true;
    if (item.roles) return item.roles.includes(role || "");
    return true;
  });

  useEffect(() => {
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

    const channel = supabase.channel('system-status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings' }, (payload) => {
        if (typeof (payload.new as any).system_active === 'boolean') {
          setIsSystemActive((payload.new as any).system_active);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden font-sans">
      {!isSystemActive && !isAdmin && <SystemStatusOverlay />}

      {/* Premium Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] rounded-full bg-info/5 blur-[120px] pointer-events-none animate-pulse-slow" />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/40 backdrop-blur-md lg:hidden transition-all duration-500" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar Overhaul */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[300px] flex-col bg-sidebar backdrop-blur-xl transition-all duration-500 ease-in-out lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} border-r border-sidebar-border/30`}>
        <div className="flex h-24 items-center justify-between px-8 bg-sidebar/50 backdrop-blur-xl border-b border-sidebar-border/30">
          <div className="flex items-center gap-4 w-full">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/90 shadow-2xl ring-1 ring-black/5 overflow-hidden animate-float">
              <img src="/logo.png" alt="Logo" className="h-[80%] w-[80%] object-contain scale-110" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-black text-sidebar-primary tracking-tight truncate">CETI NOVA ITARANA</h1>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-success"></div>
                <p className="text-[10px] text-sidebar-foreground/50 font-black tracking-widest uppercase">Sistema Online</p>
              </div>
            </div>
            <button className="lg:hidden text-sidebar-foreground/40 hover:text-sidebar-foreground transition-all p-2 rounded-xl hover:bg-sidebar-accent" onClick={() => setMobileOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-8 space-y-1 custom-scrollbar">
          {filteredNavItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}>
                <item.icon className={`h-5 w-5 shrink-0 transition-transform duration-500 ${active ? "scale-110" : "group-hover:scale-110 group-hover:text-primary"}`} />
                <span className="relative z-10">{item.label}</span>
                {active && <div className="absolute right-4 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_white]"></div>}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 bg-sidebar/50 backdrop-blur-xl border-t border-sidebar-border/30">
          <button onClick={signOut}
            className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-sm font-bold text-destructive hover:bg-destructive/10 transition-all duration-300 group">
            <LogOut className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="tracking-tight">Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0 relative z-10 overflow-hidden">
        {/* Header Overhaul */}
        <header className="glass-header h-24 flex items-center justify-between px-6 sm:px-10 lg:px-12">
          <div className="flex items-center gap-6">
            <button className="lg:hidden text-foreground p-3 rounded-2xl transition-all bg-card/50 border border-border/50 backdrop-blur-xl hover:bg-accent" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden md:block">
              <h2 className="text-xl font-black text-foreground tracking-tight">Painel de Controle</h2>
              <p className="text-xs text-muted-foreground font-semibold">Olá, seja bem-vindo ao portal institucional.</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end justify-center mr-2">
              <span className="text-sm font-black text-foreground tracking-tight">{user?.user_metadata?.full_name || "Usuário"}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/40"></span>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{role || "Membro"}</span>
              </div>
            </div>
            <div className="h-14 w-14 rounded-[1.2rem] bg-gradient-to-tr from-primary to-info flex items-center justify-center text-primary-foreground text-base font-black shadow-2xl shadow-primary/20 ring-4 ring-background cursor-pointer hover:scale-110 transition-all duration-500">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-12 animate-fade-in custom-scrollbar">
          <div className="mx-auto max-w-7xl pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
