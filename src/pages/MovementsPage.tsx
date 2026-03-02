import { Search, ArrowLeftRight } from "lucide-react";
import { useState } from "react";

const mockMovements = [
  { id: 1, student: "João Silva", series: "7º Ano A", type: "Entrada", time: "07:12", date: "02/03/2026" },
  { id: 2, student: "Maria Santos", series: "8º Ano B", type: "Entrada", time: "07:15", date: "02/03/2026" },
  { id: 3, student: "Pedro Oliveira", series: "6º Ano A", type: "Saída", time: "07:18", date: "02/03/2026" },
  { id: 4, student: "Ana Costa", series: "9º Ano C", type: "Entrada", time: "07:20", date: "02/03/2026" },
  { id: 5, student: "Lucas Pereira", series: "7º Ano B", type: "Entrada", time: "07:22", date: "02/03/2026" },
  { id: 6, student: "Pedro Oliveira", series: "6º Ano A", type: "Entrada", time: "07:45", date: "02/03/2026" },
  { id: 7, student: "João Silva", series: "7º Ano A", type: "Saída", time: "11:30", date: "02/03/2026" },
  { id: 8, student: "Fernanda Lima", series: "8º Ano A", type: "Entrada", time: "07:25", date: "01/03/2026" },
];

export default function MovementsPage() {
  const [search, setSearch] = useState("");
  const filtered = mockMovements.filter((m) =>
    m.student.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Movimentações</h1>
        <p className="text-sm text-muted-foreground">Histórico completo de entradas e saídas</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por aluno..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Aluno</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Série/Turma</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Horário</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((mov) => (
              <tr key={mov.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{mov.student}</td>
                <td className="px-4 py-3 text-muted-foreground">{mov.series}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    mov.type === "Entrada" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                  }`}>
                    {mov.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{mov.time}</td>
                <td className="px-4 py-3 text-muted-foreground">{mov.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
