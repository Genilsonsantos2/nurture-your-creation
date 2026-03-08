import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, LogIn, LogOut, AlertTriangle, ScanLine, UserPlus, BarChart3, Activity, ArrowRight, UserX, ArrowUpRight, ShieldCheck, TrendingUp, CalendarDays, Shield, FileCheck, Smartphone, Share2, ClipboardCheck, FileText } from "lucide-react";
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
      const loadingToast = toast.loading("Gerando resumo informativo...");
      const { data: movements } = await supabase.from("movements").select("student_id, type, created_at").gte("created_at", `${today}T00:00:00`).lte("created_at", `${today}T23:59:59`);
      const { data: allStudents } = await supabase.from("students").select("id, name, series, class, allergies, blood_type").eq("active", true);
      if (!allStudents) throw new Error("Não foi possível carregar alunos.");
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
      let message = `*📊 RESUMO DIÁRIO - CETI DIGITAL*\n*📅 Data:* ${dateStr}\n\n*📈 FREQUÊNCIA GERAL*\n✅ Presentes: ${totalPresent}\n❌ Ausentes: ${absentStudents.length}\n🎯 Índice: ${presenceRate}%\n\n*🚩 AUSÊNCIAS POR SÉRIE*\n`;
      Object.entries(seriesAbsents).sort().forEach(([series, count]) => { message += `• ${series}: ${count} faltas\n`; });
      message += `\n`;
      if (studentsWithMedicalAlerts.length > 0) {
        message += `*⚠️ ALERTAS MÉDICOS (PRESENTES HOJE)*\n`;
        studentsWithMedicalAlerts.slice(0, 10).forEach(s => { message += `• ${s.name}: ${s.allergies || 'Dados Sanguíneos'}\n`; });
        if (studentsWithMedicalAlerts.length > 10) message += `...e mais ${studentsWithMedicalAlerts.length - 10}\n`;
        message += `\n`;
      }
      message += `*Coordenação, favor validar casos críticos no painel.* 🛡️`;
      toast.dismiss(loadingToast);
      const { whatsappService } = await import("@/services/whatsappService");
      const settings = await whatsappService.getSettings();
      const schoolPhone = settings?.school_phone || "5571999999999";
      const res = await whatsappService.sendMessage(schoolPhone, message);
      if (res.success) { toast.success("Resumo enviado!"); } else if (res.manualLink) { window.open(res.manualLink, "_blank"); toast.info("Bot offline. Abrindo link manual..."); }
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
    { label: "Total Alunos", value: String(students || 0), icon: Users, accent: "text-primary bg-primary/10 border-primary/20" },
    { label: "Entradas", value: String(entriesCount), icon: LogIn, accent: "text-success bg-success/10 border-success/20" },
    { label: "Saídas", value: String(exitsCount), icon: LogOut, accent: "text-warning bg-warning/10 border-warning/20" },
    { label: "Alertas", value: String(pendingAlerts?.length || 0), icon: AlertTriangle, accent: "text-destructive bg-destructive/10 border-destructive/20" },
  ];

  const quickActions = [
    { label: "Portaria", icon: ScanLine, path: "/portaria", desc: "Controle de acesso" },
    { label: "Novo Aluno", icon: UserPlus, path: "/alunos/novo", desc: "Cadastrar estudante" },
    { label: "Autorizações", icon: Shield, path: "/autorizacoes-saida", desc: "Saídas antecipadas" },
    { label: "Relatórios", icon: BarChart3, path: "/relatorios", desc: "Análise de dados" },
  ];

  const hasPendingActions = (pendingAlerts?.length || 0) > 0 || (pendingJustifications?.length || 0) > 0;
  const recentMovements = (todayMovements || []).slice(0, 6);
  const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 pb-8 animate-fade-up">
      {isAdmin && <LaunchCeremony />}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-card to-info/10 border border-primary/20 p-6 md:p-10">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-xl space-y-3">
          <h1 className="text-2xl md:text-4xl font-bold font-display tracking-tight text-foreground">
            Olá, {userName} 👋
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Sistema operacional e monitorando atividades em tempo real.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2 bg-secondary/80 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <Link to="/relatorios" className="flex items-center gap-1.5 bg-secondary/80 hover:bg-secondary px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              <UserX className="h-3.5 w-3.5" />
              Checar Faltas
            </Link>
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      {hasPendingActions && (
        <div className="rounded-2xl bg-card border border-border p-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Ações Pendentes</p>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {pendingAlerts && pendingAlerts.length > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
                  <AlertTriangle className="h-3 w-3" />{pendingAlerts.length} Ocorrência{pendingAlerts.length > 1 ? 's' : ''}
                </span>
              )}
              {pendingJustifications && pendingJustifications.length > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-info/10 text-info text-xs font-medium border border-info/20">
                  <FileCheck className="h-3 w-3" />{pendingJustifications.length} Justificativa{pendingJustifications.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {pendingAlerts && pendingAlerts.length > 0 && (
              <Link to="/ocorrencias" className="premium-button text-xs bg-destructive shadow-destructive/20">Resolver</Link>
            )}
            {pendingJustifications && pendingJustifications.length > 0 && (
              <Link to="/justificativas" className="premium-button text-xs bg-info shadow-info/20">Analisar</Link>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat, i) => (
          <div key={stat.label} className="stat-card group" style={{ animationDelay: `${i * 80}ms` }}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border mb-4 ${stat.accent}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl md:text-3xl font-bold font-display text-foreground">{stat.value}</p>
            <p className="text-[11px] font-medium text-muted-foreground mt-1 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Management + Reports Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card border border-border p-6 flex items-center gap-5">
          <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center border border-success/20 shrink-0">
            <Smartphone className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Gestão Estratégica</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Envie resumo de frequência via WhatsApp</p>
          </div>
          <button onClick={handleGenerateDailySummary} className="premium-button text-xs bg-success shadow-success/20">
            <Share2 className="h-4 w-4" /> Enviar
          </button>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6 flex items-center gap-5">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Relatórios Rápidos</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Análise de turmas e tendências</p>
          </div>
          <Link to="/analise" className="p-3 rounded-xl bg-secondary hover:bg-accent text-foreground transition-colors">
            <ArrowUpRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Risk Panel + Weekly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold font-display flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Tendência Semanal
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Fluxo escolar nos últimos 7 dias</p>
            </div>
            <Link to="/analise" className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="h-[180px] flex items-end gap-2 sm:gap-3">
            {[65, 40, 85, 50, 95, 70, 45].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                <div className="w-full rounded-lg bg-primary/5 relative overflow-hidden transition-colors group-hover/bar:bg-primary/10" style={{ height: `${val}%` }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/40 to-primary/10 h-full opacity-60 group-hover/bar:opacity-100 transition-opacity rounded-lg" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground/50">{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col">
          <RiskThermometer />
        </div>
      </div>

      {/* Upcoming Event */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-panel p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <CalendarDays className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <h2 className="text-base font-bold font-display mb-4">Próximo Evento</h2>
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-info/10 text-info flex flex-col items-center justify-center border border-info/20">
                <span className="text-sm font-bold leading-none">15</span>
                <span className="text-[9px] font-semibold uppercase">MAR</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Conselho de Classe (1º Bim)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Sala de reuniões • 14:00h</p>
              </div>
            </div>
            <Link to="/calendario" className="mt-5 premium-button w-full bg-info shadow-info/20 text-xs">
              Ver Calendário
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-base font-bold font-display px-1">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link key={action.path} to={action.path}
                className="group flex items-center p-4 gap-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all">
                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0 border border-primary/10">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{action.label}</h3>
                  <p className="text-[11px] text-muted-foreground">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Movements */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold font-display">Últimas Movimentações</h2>
          <Link to="/movimentacoes" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
            Ver histórico <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="glass-panel">
          {recentMovements.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                <ScanLine className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Nenhum registro</h3>
                <p className="text-xs text-muted-foreground">Movimentações de hoje aparecerão aqui.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {recentMovements.map((mov: any) => (
                <div key={mov.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                    {initials(mov.students?.name || "?")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{mov.students?.name}</p>
                    <p className="text-[11px] text-muted-foreground">{mov.students?.series} • {mov.students?.class}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-lg ${mov.type === "entry" ? "bg-success/10 text-success border border-success/20" : "bg-warning/10 text-warning border border-warning/20"}`}>
                      {mov.type === "entry" ? "Entrada" : "Saída"}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {new Date(mov.registered_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isManagement && <div className="mt-4"><DailySummary /></div>}
      <div className="mt-4"><AnnouncementsManager /></div>
    </div>
  );
}
