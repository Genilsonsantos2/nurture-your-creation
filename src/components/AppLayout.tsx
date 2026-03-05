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
} from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Painel Geral", icon: LayoutDashboard, path: "/" },
  { label: "Alunos", icon: Users, path: "/alunos" },
  { label: "Turmas", icon: School, path: "/turmas", adminOnly: true },
  { label: "QR Codes", icon: QrCode, path: "/qrcodes" },
  { label: "Portaria", icon: ScanLine, path: "/portaria" },
  { label: "Movimentações", icon: ArrowLeftRight, path: "/movimentacoes" },
  { label: "Alertas", icon: Bell, path: "/alertas" },
  { label: "Horários", icon: Clock, path: "/horarios", adminOnly: true },
  { label: "Ocorrências", icon: FileWarning, path: "/ocorrencias" },
  { label: "Relatórios", icon: BarChart3, path: "/relatorios" },
  { label: "Usuários", icon: UserCog, path: "/usuarios", adminOnly: true },
  { label: "Calendário", icon: CalendarDays, path: "/calendario", adminOnly: true },
  { label: "Configurações", icon: Settings, path: "/configuracoes", adminOnly: true },
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
  const { user, signOut, isAdmin } = useAuth();
  const [isSystemActive, setIsSystemActive] = useState(true);

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

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
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      {!isSystemActive && !isAdmin && <SystemStatusOverlay />}
      {/* Decorative background gradients for modern feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-info/5 blur-[120px] pointer-events-none" />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden transition-all" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"} border-r border-sidebar-border/50`}>
        <div className="flex h-20 items-center justify-between px-6 border-b border-sidebar-border/50 bg-sidebar/50 backdrop-blur-xl">
          <div className="flex items-center gap-3 w-full">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="h-[80%] w-[80%] object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-sidebar-primary tracking-tight truncate">CETI NOVA ITARANA</h1>
              <p className="text-[10px] text-sidebar-foreground/60 font-medium tracking-wider uppercase">Controle de Acesso</p>
            </div>
            <button className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors p-1" onClick={() => setMobileOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
          {filteredNavItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 group relative overflow-hidden ${active ? "text-primary-foreground shadow-md shadow-primary/20" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}>

                {/* Active Background Pill */}
                {active && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 rounded-2xl -z-10" />
                )}

                <item.icon className={`h-5 w-5 shrink-0 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110 group-hover:text-sidebar-primary"}`} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border/50 bg-sidebar/50 backdrop-blur-xl">
          <button onClick={signOut}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium text-sidebar-foreground/70 tracking-wide hover:bg-destructive/10 hover:text-destructive transition-all duration-300 group">
            <LogOut className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:-translate-x-1" />
            Sair do sistema
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0 relative z-10">
        <header className="glass-header sticky top-0 z-30 flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-foreground hover:bg-accent/50 hover:text-accent-foreground p-2.5 rounded-xl transition-colors bg-background/50 border border-border/50 backdrop-blur-sm" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            {/* Optional Breadcrumbs or Page Title could go here based on route */}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end justify-center">
              <span className="text-sm font-bold text-foreground tracking-tight">{user?.user_metadata?.full_name || "Usuário"}</span>
              <span className="text-xs font-medium text-muted-foreground">{user?.email}</span>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-primary to-info/80 flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 ring-2 ring-background cursor-pointer hover:scale-105 transition-transform duration-300">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in relative z-10">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
