import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, LogIn, LogOut, AlertTriangle, ScanLine, UserPlus, BarChart3, Activity, ArrowRight, UserX, ArrowUpRight, ShieldCheck, TrendingUp, CalendarDays, Shield, FileCheck, Smartphone, Share2, Cpu, Zap, Bot, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAbsenceChecker } from "@/hooks/useAbsenceChecker";
import { AnnouncementsManager } from "@/components/AnnouncementsManager";
import RiskThermometer from "@/components/RiskThermometer";
import LaunchCeremony from "@/components/LaunchCeremony";
import DailySummary from "@/components/DailySummary";

export default function Dashboard() {
  const { user, isAdmin, role } = useAuth();
  useAbsenceChecker();

  const isManagement = isAdmin || role === "coordinator";
  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "Usuário";

  const { data: students } = useQuery({
    queryKey: ["students-count"],
    queryFn: async () => {
      const { count } = await supabase.from("students").select("*", { count: "exact", head: true }).eq("active", true);
      return count || 0;
    },
  });

  const today = new Date().toISOString().split("T")[0];

  const handleGenerateDailySummary = async () => {
    try {
      const loadingToast = toast.loading("Gerando resumo...");
      const { data: movements } = await supabase.from("movements").select("student_id, type, created_at").gte("created_at", `${today}T00:00:00`).lte("created_at", `${today}T23:59:59`);
      const { data: allStudents } = await supabase.from("students").select("id, name, series, class, allergies, blood_type").eq("active", true);
      if (!allStudents) throw new Error("Erro ao carregar alunos.");
      const studentsData = allStudents as any[];
      const entries = (movements as any[])?.filter(m => m.type === 'entry') || [];
      const presentIds = new Set(entries.map(m => m.student_id));
      const absentStudents = studentsData.filter(s => !presentIds.has(s.id));
      const studentsWithMedicalAlerts = studentsData.filter(s => presentIds.has(s.id) && (s.allergies || s.blood_type));
      const totalPresent = presentIds.size;
      const totalStudents = studentsData.length;
      const presenceRate = ((totalPresent / totalStudents) * 100).toFixed(1);
      const seriesAbsents: Record<string, number> = {};
      absentStudents.forEach(s => { seriesAbsents[s.series] = (seriesAbsents[s.series] || 0) + 1; });
      const dateStr = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
      let message = `*📊 RESUMO DIÁRIO - CETI DIGITAL*\n*📅 Data:* ${dateStr}\n\n*📈 FREQUÊNCIA*\n✅ Presentes: ${totalPresent}\n❌ Ausentes: ${absentStudents.length}\n🎯 Índice: ${presenceRate}%\n\n*🚩 AUSÊNCIAS POR SÉRIE*\n`;
      Object.entries(seriesAbsents).sort().forEach(([series, count]) => { message += `• ${series}: ${count}\n`; });
      if (studentsWithMedicalAlerts.length > 0) {
        message += `\n*⚠️ ALERTAS MÉDICOS*\n`;
        studentsWithMedicalAlerts.slice(0, 5).forEach(s => { message += `• ${s.name}\n`; });
      }
      message += `\n*Coordenação, validar no painel.* 🛡️`;
      toast.dismiss(loadingToast);
      const { whatsappService } = await import("@/services/whatsappService");
      const settings = await whatsappService.getSettings();
      const schoolPhone = settings?.school_phone || "5571999999999";
      const res = await whatsappService.sendMessage(schoolPhone, message);
      if (res.success) toast.success("Resumo enviado!"); else if (res.manualLink) { window.open(res.manualLink, "_blank"); toast.info("Abrindo link manual..."); }
    } catch (error: any) { toast.error("Erro: " + error.message); }
  };

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

  const { data: pendingJustifications } = useQuery({
    queryKey: ["justifications-pending"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("absence_justifications").select("*, students(name, series, class)").eq("status", "pending");
      return data || [];
    },
  });

  const entriesCount = todayMovements?.filter((m) => m.type === "entry").length || 0;
  const exitsCount = todayMovements?.filter((m) => m.type === "exit").length || 0;

  const stats = [
    { label: "Total Alunos", value: String(students || 0), icon: Users, color: "from-primary/20 to-primary/5 border-primary/30 text-primary" },
    { label: "Entradas", value: String(entriesCount), icon: LogIn, color: "from-success/20 to-success/5 border-success/30 text-success" },
    { label: "Saídas", value: String(exitsCount), icon: LogOut, color: "from-warning/20 to-warning/5 border-warning/30 text-warning" },
    { label: "Alertas", value: String(pendingAlerts?.length || 0), icon: AlertTriangle, color: "from-destructive/20 to-destructive/5 border-destructive/30 text-destructive" },
  ];

  const quickActions = [
    { label: "Portaria", icon: ScanLine, path: "/portaria", desc: "Controle de acesso" },
    { label: "Novo Aluno", icon: UserPlus, path: "/alunos/novo", desc: "Cadastrar" },
    { label: "Autorizações", icon: Shield, path: "/autorizacoes-saida", desc: "Saídas antecipadas" },
    { label: "Relatórios", icon: BarChart3, path: "/relatorios", desc: "Analytics" },
  ];

  const hasPendingActions = (pendingAlerts?.length || 0) > 0 || (pendingJustifications?.length || 0) > 0;
  const recentMovements = (todayMovements || []).slice(0, 5);
  const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 pb-8 animate-fade-up">
      {isAdmin && <LaunchCeremony />}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-card via-card to-primary/5 border border-border p-6 md:p-8">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] rounded-full bg-accent/5 blur-[80px] pointer-events-none" />
        
        {/* Decorative icons */}
        <div className="absolute top-4 right-4 opacity-20">
          <Cpu className="h-20 w-20 text-primary" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-xs font-mono font-semibold text-primary tracking-wider">100% TECNOLOGIA</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Olá, <span className="gradient-text">{userName}</span> 👋
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              Sistema operacional. Monitoramento em tempo real ativo.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2 bg-card/80 px-3 py-1.5 rounded-lg border border-border text-xs font-mono text-muted-foreground">
                <Radio className="h-3 w-3 text-success animate-pulse" />
                {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" }).toUpperCase()}
              </div>
              <Link to="/relatorios" className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg border border-primary/30 text-xs font-mono text-primary transition-colors">
                <UserX className="h-3 w-3" />
                CHECAR FALTAS
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      {hasPendingActions && (
        <div className="rounded-xl bg-card border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 glow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Ações Pendentes</p>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {pendingAlerts && pendingAlerts.length > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-destructive/10 text-destructive text-[11px] font-mono font-semibold border border-destructive/20">
                  <AlertTriangle className="h-3 w-3" />{pendingAlerts.length} OCORRÊNCIA{pendingAlerts.length > 1 ? 'S' : ''}
                </span>
              )}
              {pendingJustifications && pendingJustifications.length > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-info/10 text-info text-[11px] font-mono font-semibold border border-info/20">
                  <FileCheck className="h-3 w-3" />{pendingJustifications.length} JUSTIFICATIVA{pendingJustifications.length > 1 ? 'S' : ''}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {pendingAlerts && pendingAlerts.length > 0 && (
              <Link to="/ocorrencias" className="premium-button text-xs py-2 bg-destructive">Resolver</Link>
            )}
            {pendingJustifications && pendingJustifications.length > 0 && (
              <Link to="/justificativas" className="premium-button text-xs py-2 bg-info">Analisar</Link>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`stat-card bg-gradient-to-br ${stat.color}`} style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <stat.icon className="h-5 w-5" />
              <span className="text-[10px] font-mono opacity-60 uppercase">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions + Management Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.path} to={action.path}
              className="group flex flex-col items-center p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-all text-center">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 group-hover:glow-sm transition-all border border-primary/20">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground">{action.label}</span>
              <span className="text-[10px] text-muted-foreground">{action.desc}</span>
            </Link>
          ))}
        </div>

        {/* WhatsApp Summary */}
        <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-success/10 text-success flex items-center justify-center border border-success/20 shrink-0">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">Resumo WhatsApp</p>
            <p className="text-[10px] text-muted-foreground">Enviar para coordenação</p>
          </div>
          <button onClick={handleGenerateDailySummary} className="premium-button text-xs py-2 bg-success">
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Trend */}
        <div className="lg:col-span-2 glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">Tendência Semanal</h3>
            </div>
            <Link to="/analise" className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="h-[140px] flex items-end gap-2">
            {[65, 40, 85, 50, 95, 70, 45].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="w-full rounded bg-primary/10 relative overflow-hidden transition-all group-hover:bg-primary/20" style={{ height: `${val}%` }}>
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary/30 to-transparent rounded" />
                </div>
                <span className="text-[9px] font-mono text-muted-foreground/60">{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk */}
        <div className="glass-panel p-5">
          <RiskThermometer />
        </div>
      </div>

      {/* Recent Movements */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold">Movimentações Recentes</h3>
          </div>
          <Link to="/movimentacoes" className="text-[10px] font-mono text-primary hover:underline flex items-center gap-1">
            VER TUDO <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="glass-panel">
          {recentMovements.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center gap-2">
              <ScanLine className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">Nenhuma movimentação hoje</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {recentMovements.map((mov: any) => (
                <div key={mov.id} className="flex items-center gap-3 p-3 hover:bg-secondary/30 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-[10px] font-mono font-bold text-muted-foreground shrink-0">
                    {initials(mov.students?.name || "?")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{mov.students?.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{mov.students?.series} • {mov.students?.class}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${mov.type === "entry" ? "bg-success/10 text-success border border-success/20" : "bg-warning/10 text-warning border border-warning/20"}`}>
                      {mov.type === "entry" ? "IN" : "OUT"}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono">
                      {new Date(mov.registered_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Calendar + AI Assistant */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="absolute top-2 right-2 opacity-10">
            <CalendarDays className="h-16 w-16" />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-info" /> Próximo Evento
            </h3>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 text-info flex flex-col items-center justify-center border border-info/20 text-[10px] font-mono font-bold">
                <span>15</span>
                <span className="text-[8px]">MAR</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Conselho de Classe</p>
                <p className="text-[10px] text-muted-foreground">14:00h • Sala de reuniões</p>
              </div>
            </div>
            <Link to="/calendario" className="mt-4 premium-button w-full bg-info text-xs py-2">
              Ver Calendário
            </Link>
          </div>
        </div>

        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="absolute top-2 right-2 opacity-10">
            <Bot className="h-16 w-16" />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Bot className="h-4 w-4 text-accent" /> Assistente IA
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Pergunte qualquer coisa sobre alunos, frequência, relatórios ou análises.
            </p>
            <Link to="/assistente" className="premium-button w-full bg-accent text-xs py-2">
              <Zap className="h-3.5 w-3.5" /> Abrir Chat IA
            </Link>
          </div>
        </div>
      </div>

      {isManagement && <div className="mt-4"><DailySummary /></div>}
      <div className="mt-4"><AnnouncementsManager /></div>
    </div>
  );
}
