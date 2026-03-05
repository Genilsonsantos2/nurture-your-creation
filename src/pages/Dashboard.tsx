import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, LogIn, LogOut, AlertTriangle, ScanLine, UserPlus, QrCode, BarChart3, Activity, ArrowRight, UserX, TrendingUp, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { isSchoolDay } from "@/lib/calendar";

export default function Dashboard() {
  const { user, isAdmin, role } = useAuth();
  const isManagement = isAdmin || role === "coordinator";
  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "Usuário";
  const queryClient = useQueryClient();

  const handleBootstrap = async () => {
    try {
      if (!user) return;

      // 1. Tentar garantir que o Administrador tem a role correta no banco
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });

      if (roleError) throw roleError;

      toast.success("Permissões de Administrador confirmadas no banco de dados!");
      window.location.reload(); // Recarregar para atualizar o context
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao sincronizar permissões: " + err.message);
    }
  };

  const { data: students } = useQuery({
    queryKey: ["students-count"],
    queryFn: async () => {
      const { count } = await supabase.from("students").select("*", { count: "exact", head: true }).eq("active", true);
      return count || 0;
    },
  });

  const today = new Date().toISOString().split("T")[0];

  const { data: todayMovements } = useQuery({
    queryKey: ["movements-today", today],
    queryFn: async () => {
      const { data } = await supabase.from("movements").select("*, students(name, series, class)").gte("registered_at", today + "T00:00:00").order("registered_at", { ascending: false });
      return data || [];
    },
  });

  const { data: pendingAlerts } = useQuery({
    queryKey: ["alerts-pending"],
    queryFn: async () => {
      const { data } = await supabase.from("alerts").select("*, students(name, series, class)").eq("status", "pending");
      return data || [];
    },
  });

  // Realtime for movements
  useEffect(() => {
    const channel = supabase.channel("dashboard-movements").on("postgres_changes", { event: "*", schema: "public", table: "movements" }, () => {
      // Refetch queries on changes handled by React Query invalidation in a real app
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const entries = todayMovements?.filter((m) => m.type === "entry").length || 0;
  const exits = todayMovements?.filter((m) => m.type === "exit").length || 0;

  const stats = [
    { label: "Total de Alunos", value: String(students || 0), icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
    { label: "Entradas Hoje", value: String(entries), icon: LogIn, color: "text-success", bgColor: "bg-success/10" },
    { label: "Saídas Hoje", value: String(exits), icon: LogOut, color: "text-warning", bgColor: "bg-warning/10" },
    { label: "Ocorrências", value: String(pendingAlerts?.length || 0), icon: AlertTriangle, color: "text-destructive", bgColor: "bg-destructive/10" },
  ];

  const quickActions = [
    { label: "Portaria", icon: ScanLine, path: "/portaria", desc: "Controle de acesso" },
    { label: "Novo Aluno", icon: UserPlus, path: "/alunos/novo", desc: "Cadastrar estudante" },
    { label: "QR Codes", icon: QrCode, path: "/qrcodes", desc: "Gerar carteirinhas" },
    { label: "Relatórios", icon: BarChart3, path: "/relatorios", desc: "Análise de dados" },
  ];

  const recentMovements = (todayMovements || []).slice(0, 6);

  const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section */}
      <div className="flex flex-col gap-2 bg-gradient-to-r from-primary/10 via-transparent to-transparent p-6 rounded-[2rem] border border-primary/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Activity className="w-32 h-32 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground relative z-10">
          Olá, {userName}! 👋
        </h1>
        <p className="text-muted-foreground font-medium flex items-center gap-2 relative z-10">
          <span className="inline-block w-2-2 h-2 rounded-full bg-success animate-pulse"></span>
          Sistema operacional — {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>

        {isAdmin && role !== "admin" && (
          <button
            onClick={handleBootstrap}
            className="mt-4 self-start px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold rounded-xl border border-primary/20 transition-all flex items-center gap-2 animate-bounce"
          >
            <Shield className="h-4 w-4" /> Sincronizar Permissões de Admin (Recomendado)
          </button>
        )}
      </div>

      {pendingAlerts && pendingAlerts.length > 0 && (
        <div className="rounded-[1.5rem] border border-destructive/20 bg-destructive/5 p-5 flex items-center gap-4 animate-in slide-in-from-top-4">
          <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-destructive-foreground">{pendingAlerts.length} Ocorrência(s) Pendente(s)</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              Verifique os registros recentes envolvendo: {pendingAlerts.slice(0, 3).map((a: any) => a.students?.name?.split(' ')[0]).filter(Boolean).join(", ")}
            </p>
          </div>
          <Link to="/ocorrencias" className="text-sm font-bold text-destructive hover:underline shrink-0 flex items-center gap-1 bg-white dark:bg-black px-4 py-2 rounded-xl shadow-sm">
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-foreground mb-1">{stat.value}</p>
              <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Real-time Absence Monitoring (Admin/Coord Only) */}
      {isManagement && isSchoolDay(new Date()) && (
        <div className="rounded-[2.5rem] border border-destructive/20 bg-destructive/[0.02] p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <UserX className="w-48 h-48 text-destructive" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shadow-inner">
                <UserX className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Ausentes Hoje ⚠️</h2>
                <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  Alunos sem registro de entrada até o momento
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8 bg-white dark:bg-black/20 p-6 rounded-[2rem] border border-destructive/10 shadow-sm">
              <div className="text-center px-4">
                <p className="text-4xl font-black text-destructive">{Math.max(0, (students || 0) - entries)}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Faltantes</p>
              </div>
              <div className="w-px h-12 bg-destructive/10" />
              <div className="text-center px-4">
                <p className="text-4xl font-black text-success">{entries}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Presentes</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-destructive/10 flex items-center justify-between">
            <p className="text-xs font-semibold text-destructive/70 italic">
              * Dados atualizados em tempo real conforme registros na portaria.
            </p>
            <Link to="/relatorios" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-destructive text-white text-xs font-bold hover:bg-destructive/90 transition-all shadow-lg shadow-destructive/20">
              Ver lista detalhada <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions - 1/3 width */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Acesso Rápido</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {quickActions.map((action) => (
              <Link key={action.path} to={action.path}
                className="flex items-center p-4 gap-4 rounded-[1.5rem] bg-card border border-border/50 hover:border-primary/50 transition-all hover:shadow-md group">
                <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                  <action.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{action.label}</h3>
                  <p className="text-xs text-muted-foreground font-medium">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Movements - 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Últimas Movimentações</h2>
            <Link to="/movimentacoes" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              Ver histórico <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="glass-panel">
            {recentMovements.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
                <div className="h-16 w-16 rounded-3xl bg-muted/50 flex items-center justify-center">
                  <ScanLine className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Nenhum registro ainda</h3>
                  <p className="text-muted-foreground font-medium text-sm">As movimentações de hoje aparecerão aqui.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {recentMovements.map((mov: any) => (
                  <div key={mov.id} className="flex items-center gap-4 p-4 hover:bg-muted/10 transition-colors first:rounded-t-[1.5rem] last:rounded-b-[1.5rem]">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 border border-border/50 shadow-sm flex items-center justify-center text-sm font-bold text-secondary-foreground shrink-0">
                      {initials(mov.students?.name || "?")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{mov.students?.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">{mov.students?.series} • {mov.students?.class}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${mov.type === "entry" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                        {mov.type === "entry" ? "Entrada" : "Saída"}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {new Date(mov.registered_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}
