import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, LogIn, LogOut, AlertTriangle, ScanLine, UserPlus, QrCode, BarChart3, Activity, ArrowRight, UserX, ArrowUpRight, ShieldCheck, TrendingUp, CalendarDays, Shield, FileCheck, Smartphone, Share2, ClipboardCheck, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isSchoolDay } from "@/lib/calendar";
import { useAbsenceChecker } from "@/hooks/useAbsenceChecker";
import { AnnouncementsManager } from "@/components/AnnouncementsManager";
import RiskThermometer from "@/components/RiskThermometer";
import LaunchCeremony from "@/components/LaunchCeremony";

export default function Dashboard() {
  const { user, isAdmin, role } = useAuth();

  // Audita no background se existem alunos sem entradas recents
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

      // 1. Fetch Movements of Today
      const { data: movements } = await supabase
        .from("movements")
        .select("student_id, type, created_at")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);

      // 2. Fetch Active Students with medical info
      const { data: allStudents } = await supabase
        .from("students")
        .select("id, name, series, class, allergies, blood_type")
        .eq("active", true);

      if (!allStudents) throw new Error("Não foi possível carregar alunos.");

      const studentsData = allStudents as any[];
      const entries = (movements as any[])?.filter(m => m.type === 'entry') || [];
      const presentIds = new Set(entries.map(m => m.student_id));
      const absentStudents = studentsData.filter(s => !presentIds.has(s.id));

      const studentsWithMedicalAlerts = studentsData.filter(s =>
        presentIds.has(s.id) && (s.allergies || s.blood_type)
      );

      const totalPresent = presentIds.size;
      const totalStudents = studentsData.length;
      const presenceRate = ((totalPresent / totalStudents) * 100).toFixed(1);

      // Group absents by series
      const seriesAbsents: Record<string, number> = {};
      absentStudents.forEach(s => {
        seriesAbsents[s.series] = (seriesAbsents[s.series] || 0) + 1;
      });

      // Build WhatsApp Message
      const dateStr = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
      let message = `*📊 RESUMO DIÁRIO - CETI DIGITAL*\n`;
      message += `*📅 Data:* ${dateStr}\n\n`;

      message += `*📈 FREQUÊNCIA GERAL*\n`;
      message += `✅ Presentes: ${totalPresent}\n`;
      message += `❌ Ausentes: ${absentStudents.length}\n`;
      message += `🎯 Índice: ${presenceRate}%\n\n`;

      message += `*🚩 AUSÊNCIAS POR SÉRIE*\n`;
      Object.entries(seriesAbsents).sort().forEach(([series, count]) => {
        message += `• ${series}: ${count} faltas\n`;
      });
      message += `\n`;

      if (studentsWithMedicalAlerts.length > 0) {
        message += `*⚠️ ALERTAS MÉDICOS (PRESENTES HOJE)*\n`;
        studentsWithMedicalAlerts.slice(0, 10).forEach(s => {
          message += `• ${s.name}: ${s.allergies || 'Dados Sanguíneos'}\n`;
        });
        if (studentsWithMedicalAlerts.length > 10) message += `...e mais ${studentsWithMedicalAlerts.length - 10}\n`;
        message += `\n`;
      }

      message += `*Coordenação, favor validar casos críticos no painel.* 🛡️`;

      toast.dismiss(loadingToast);

      const { whatsappService } = await import("@/services/whatsappService");
      const settings = await whatsappService.getSettings();
      const schoolPhone = settings?.school_phone || "5571999999999";

      const res = await whatsappService.sendMessage(schoolPhone, message);

      if (res.success) {
        toast.success("Resumo enviado automaticamente para a coordenação!");
      } else if (res.manualLink) {
        window.open(res.manualLink, "_blank");
        toast.info("Bot offline. Abrindo link manual...");
      }
    } catch (error: any) {
      toast.error("Erro ao gerar resumo: " + error.message);
    }
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
    { label: "Autorizações", icon: Shield, path: "/autorizacoes-saida", desc: "Saídas antecipadas" },
    { label: "Relatórios", icon: BarChart3, path: "/relatorios", desc: "Análise de dados" },
  ];

  const hasPendingActions = (pendingAlerts?.length || 0) > 0 || (pendingJustifications?.length || 0) > 0;

  const recentMovements = (todayMovements || []).slice(0, 6);

  const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-700">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-primary via-primary/90 to-success p-6 md:p-14 text-white shadow-2xl shadow-primary/20 group animate-in slide-in-from-bottom-6">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[120%] bg-primary-foreground/10 blur-[100px] rounded-full rotate-12 transition-transform duration-1000 group-hover:rotate-45" />
        <div className="absolute bottom-5 right-5 md:bottom-10 md:right-10 opacity-10 pointer-events-none transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-12">
          <Activity className="w-32 h-32 md:w-64 md:h-64" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-2 md:space-y-4">
          <h1 className="text-2xl md:text-5xl font-black tracking-tight drop-shadow-sm">
            Olá, {userName}! <span className="animate-float inline-block">👋</span>
          </h1>
          <p className="text-sm md:text-xl font-medium text-white/80 leading-relaxed max-w-md md:max-w-none">
            Seja bem-vindo ao painel administrativo. O sistema está operacional e monitorando as atividades em tempo real.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <div className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 shadow-xl">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-widest">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</span>
            </div>
            <Link to="/relatorios" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 shadow-xl transition-all">
              <UserX className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-widest">Checar Faltas de Hoje</span>
            </Link>
          </div>
        </div>
      </div>

      {hasPendingActions && (
        <div className="group relative overflow-hidden rounded-[2.5rem] bg-card border-2 border-primary/20 p-8 shadow-2xl shadow-primary/5 animate-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center gap-8 relative z-10">
            <div className="h-16 w-16 rounded-3xl bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/40 animate-pulse">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-xl font-black text-foreground tracking-tight">Ações Pendentes de Gestão</p>
              <div className="flex flex-wrap gap-4 mt-2">
                {pendingAlerts && pendingAlerts.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-xs font-black text-destructive uppercase tracking-widest">{pendingAlerts.length} Ocorrência{pendingAlerts.length > 1 ? 's' : ''}</span>
                  </div>
                )}
                {pendingJustifications && pendingJustifications.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-info/10 border border-info/20">
                    <FileCheck className="h-4 w-4 text-info" />
                    <span className="text-xs font-black text-info uppercase tracking-widest">{pendingJustifications.length} Justificativa{pendingJustifications.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {pendingAlerts && pendingAlerts.length > 0 && (
                <Link to="/ocorrencias" className="premium-button bg-destructive shadow-destructive/20 hover:shadow-destructive/40 whitespace-nowrap">
                  Resolver Ocorrências
                </Link>
              )}
              {pendingJustifications && pendingJustifications.length > 0 && (
                <Link to="/justificativas" className="premium-button bg-info shadow-info/20 hover:shadow-info/40 whitespace-nowrap">
                  Analisar Justificativas
                </Link>
              )}
            </div>
          </div>
          <div className="absolute -right-20 -top-20 h-64 w-64 bg-primary/5 blur-[80px] rounded-full" />
        </div>
      )}

      {/* Strategic Management Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 border border-white/10 shadow-2xl transition-all hover:border-primary/40">
          <div className="flex items-center gap-6 relative z-10">
            <div className="h-16 w-16 rounded-[1.5rem] bg-success/20 text-success flex items-center justify-center border border-success/30 shadow-lg shadow-success/10 group-hover:scale-110 transition-transform duration-500">
              <Smartphone className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-white tracking-tight">Gestão Estratégica</h3>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">Envie o resumo de frequência e alertas médicos direto para a coordenação.</p>
            </div>
            <button
              onClick={handleGenerateDailySummary}
              className="flex items-center gap-3 bg-success hover:bg-success/90 text-white font-black px-6 py-4 rounded-2xl shadow-xl shadow-success/20 transition-all active:scale-95 group/btn"
            >
              <Share2 className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              <span className="uppercase tracking-widest text-xs">Resumo via WhatsApp</span>
            </button>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
            <ClipboardCheck className="w-32 h-32 text-success" />
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[2.5rem] bg-card border border-border/40 p-8 shadow-xl transition-all hover:shadow-2xl">
          <div className="flex items-center gap-6 relative z-10">
            <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all duration-500">
              <FileText className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black tracking-tight">Relatórios Rápidos</h3>
              <p className="text-sm text-muted-foreground font-medium">Acesse a análise detalhada de turmas e tendências semanais.</p>
            </div>
            <Link to="/analise" className="p-4 rounded-2xl bg-muted/50 hover:bg-muted text-foreground transition-all">
              <ArrowUpRight className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bento Grid Stats and Risk Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Traditional Stats */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={stat.label} className="stat-card p-4 md:p-8" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex justify-between items-start mb-4 md:mb-6">
                <div className={`h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 md:h-7 md:w-7 ${stat.color}`} />
                </div>
              </div>
              <div>
                <p className="text-xl md:text-4xl font-black tracking-tight text-foreground mb-1 drop-shadow-sm">{stat.value}</p>
                <p className="text-[8px] md:text-xs font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Risk Panel */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 h-full flex flex-col justify-between border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
            <RiskThermometer />
          </div>
        </div>
      </div>

      {/* Featured Insight & Upcoming Event */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-10 bg-gradient-to-br from-primary/[0.05] to-transparent shadow-2xl shadow-primary/5 group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-primary" /> Tendência Semanal
              </h2>
              <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-1">Visão rápida do fluxo escolar</p>
            </div>
            <Link to="/analise" className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all">
              <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="h-[200px] flex items-end gap-2 sm:gap-4 px-2">
            {[65, 40, 85, 50, 95, 70, 45].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar">
                <div
                  className="w-full bg-primary/10 rounded-t-xl relative overflow-hidden group-hover/bar:bg-primary/20 transition-all"
                  style={{ height: `${val}%` }}
                >
                  <div className="absolute bottom-0 left-0 right-0 bg-primary h-1/3 opacity-0 group-hover/bar:opacity-100 transition-all rounded-t-xl" />
                </div>
                <span className="text-[10px] font-black text-muted-foreground/40">{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-10 bg-gradient-to-br from-info/[0.05] to-transparent relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700">
            <CalendarDays className="h-32 w-32" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight mb-2">Próximo Evento</h2>
              <div className="mt-6 flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-info/10 text-info flex flex-col items-center justify-center border border-info/20">
                  <span className="text-sm font-black leading-none">15</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter">MAR</span>
                </div>
                <div>
                  <h3 className="font-black text-foreground leading-snug">Conselho de Classe (1º Bim)</h3>
                  <p className="text-xs text-muted-foreground mt-1">Sala de reuniões • 14:00h</p>
                </div>
              </div>
            </div>

            <Link to="/calendario" className="mt-10 premium-button py-4 w-full bg-info hover:bg-info/90 shadow-info/20">
              Ver Calendário Completo
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions - 1/3 width */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black tracking-tight text-foreground">Ações Rápidas</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {quickActions.map((action) => (
              <Link key={action.path} to={action.path}
                className="group flex items-center p-5 gap-5 rounded-[2rem] bg-card/40 backdrop-blur-xl border border-border/40 hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5 relative overflow-hidden">
                <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-all shrink-0">
                  <action.icon className="h-7 w-7 text-primary transition-transform duration-500 group-hover:scale-110" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors truncate">{action.label}</h3>
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{action.desc}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-muted/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                  <ArrowRight className="h-4 w-4 text-primary" />
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
              <div className="divide-y divide-border/20">
                {recentMovements.map((mov: any) => (
                  <div key={mov.id} className="flex items-center gap-5 p-6 hover:bg-primary/[0.02] transition-colors group">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border/50 shadow-inner flex items-center justify-center text-sm font-black text-muted-foreground shrink-0 group-hover:scale-105 transition-transform duration-500">
                      {initials(mov.students?.name || "?")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-foreground truncate group-hover:text-primary transition-colors">{mov.students?.name}</p>
                      <p className="text-xs text-muted-foreground font-bold tracking-tight">{mov.students?.series} • {mov.students?.class}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-sm ${mov.type === "entry" ? "bg-success text-white shadow-success/20" : "bg-warning text-white shadow-warning/20"}`}>
                        {mov.type === "entry" ? "Entrada" : "Saída"}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                        <Activity className="h-3 w-3 text-primary/40" />
                        {new Date(mov.registered_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <AnnouncementsManager />
      </div>

    </div>
  );
}
