import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, LogIn, LogOut, AlertTriangle, ScanLine, UserPlus, QrCode, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Tables } from "@/integrations/supabase/types";

export default function Dashboard() {
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
      // Refetch queries on changes
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const entries = todayMovements?.filter((m) => m.type === "entry").length || 0;
  const exits = todayMovements?.filter((m) => m.type === "exit").length || 0;

  const stats = [
    { label: "Total de Alunos", value: String(students || 0), icon: Users, color: "bg-primary" },
    { label: "Entradas Hoje", value: String(entries), icon: LogIn, color: "bg-success" },
    { label: "Saídas Hoje", value: String(exits), icon: LogOut, color: "bg-warning" },
    { label: "Alertas Pendentes", value: String(pendingAlerts?.length || 0), icon: AlertTriangle, color: "bg-destructive" },
  ];

  const quickActions = [
    { label: "Portaria", icon: ScanLine, path: "/portaria", color: "bg-primary text-primary-foreground" },
    { label: "Cadastrar Aluno", icon: UserPlus, path: "/alunos/novo", color: "bg-success text-success-foreground" },
    { label: "QR Codes", icon: QrCode, path: "/qrcodes", color: "bg-info text-info-foreground" },
    { label: "Relatórios", icon: BarChart3, path: "/relatorios", color: "bg-warning text-warning-foreground" },
  ];

  const recentMovements = (todayMovements || []).slice(0, 8);

  const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel Geral</h1>
        <p className="text-muted-foreground text-sm">Resumo do dia — {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {pendingAlerts && pendingAlerts.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{pendingAlerts.length} alerta(s) pendente(s)</p>
            <p className="text-xs text-muted-foreground">
              {pendingAlerts.slice(0, 5).map((a: any) => a.students?.name).filter(Boolean).join(", ")}
            </p>
          </div>
          <Link to="/alertas" className="text-sm font-medium text-primary hover:underline shrink-0">Ver Alertas →</Link>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Acesso Rápido</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.path} to={action.path} className={`quick-action ${action.color} rounded-xl`}>
              <action.icon className="h-8 w-8" />
              <span className="text-sm">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Movimentações Recentes</h2>
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          {recentMovements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Nenhuma movimentação registrada hoje</div>
          ) : (
            <div className="divide-y">
              {recentMovements.map((mov: any) => (
                <div key={mov.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground">
                    {initials(mov.students?.name || "?")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">{mov.students?.name}</p>
                    <p className="text-xs text-muted-foreground">{mov.students?.series} {mov.students?.class}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${mov.type === "entry" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                    {mov.type === "entry" ? "Entrada" : "Saída"}
                  </span>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {new Date(mov.registered_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
