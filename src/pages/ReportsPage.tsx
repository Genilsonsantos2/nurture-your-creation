import { BarChart3 } from "lucide-react";

const weeklyData = [
  { day: "Seg", entries: 310, exits: 45 },
  { day: "Ter", entries: 325, exits: 38 },
  { day: "Qua", entries: 298, exits: 52 },
  { day: "Qui", entries: 332, exits: 41 },
  { day: "Sex", entries: 287, exits: 60 },
];

const topExits = [
  { name: "Pedro Oliveira", series: "6º Ano A", exits: 8 },
  { name: "Lucas Pereira", series: "7º Ano B", exits: 6 },
  { name: "Carlos Mendes", series: "6º Ano B", exits: 5 },
  { name: "Fernanda Lima", series: "8º Ano A", exits: 4 },
  { name: "João Silva", series: "7º Ano A", exits: 3 },
];

export default function ReportsPage() {
  const maxEntries = Math.max(...weeklyData.map((d) => d.entries));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Estatísticas e análises de presença</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
          Exportar Dados
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly chart */}
        <div className="bg-card rounded-lg border p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Movimentações por Dia da Semana</h2>
          <div className="space-y-3">
            {weeklyData.map((d) => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="w-8 text-xs font-medium text-muted-foreground">{d.day}</span>
                <div className="flex-1 flex gap-1">
                  <div
                    className="h-6 rounded-l bg-primary/80 flex items-center justify-end pr-2"
                    style={{ width: `${(d.entries / maxEntries) * 100}%` }}
                  >
                    <span className="text-[10px] text-primary-foreground font-medium">{d.entries}</span>
                  </div>
                  <div
                    className="h-6 rounded-r bg-warning/60 flex items-center pl-1"
                    style={{ width: `${(d.exits / maxEntries) * 100}%`, minWidth: '2rem' }}
                  >
                    <span className="text-[10px] text-foreground font-medium">{d.exits}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Entradas</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> Saídas</span>
          </div>
        </div>

        {/* Top exits */}
        <div className="bg-card rounded-lg border p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Alunos com Mais Saídas (Semana)</h2>
          <div className="space-y-3">
            {topExits.map((student, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{student.series}</p>
                </div>
                <span className="text-sm font-bold text-foreground">{student.exits}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
