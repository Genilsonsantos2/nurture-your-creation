import { Plus, FileWarning } from "lucide-react";

const mockOccurrences = [
  { id: 1, student: "Pedro Oliveira", series: "6º Ano A", type: "Saída sem autorização", description: "Tentou sair sem permissão durante o intervalo", date: "02/03/2026", time: "10:15" },
  { id: 2, student: "Lucas Pereira", series: "7º Ano B", type: "Atraso", description: "Chegou 30 minutos após o horário permitido", date: "01/03/2026", time: "07:45" },
  { id: 3, student: "Maria Santos", series: "8º Ano B", type: "Aluno passou mal", description: "Passou mal durante a aula, responsável buscou", date: "28/02/2026", time: "14:20" },
  { id: 4, student: "Ana Costa", series: "9º Ano C", type: "Responsável buscou", description: "Responsável veio buscar para consulta médica", date: "27/02/2026", time: "09:00" },
];

const typeColors: Record<string, string> = {
  "Saída sem autorização": "bg-destructive/15 text-destructive",
  "Atraso": "bg-warning/15 text-warning",
  "Aluno passou mal": "bg-info/15 text-info",
  "Responsável buscou": "bg-muted text-muted-foreground",
};

export default function OccurrencesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ocorrências</h1>
          <p className="text-sm text-muted-foreground">Registro de incidentes e situações especiais</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Registrar Ocorrência
        </button>
      </div>

      <div className="space-y-3">
        {mockOccurrences.map((occ) => (
          <div key={occ.id} className="bg-card rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileWarning className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">{occ.student}</span>
                <span className="text-xs text-muted-foreground">— {occ.series}</span>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeColors[occ.type] || "bg-muted text-muted-foreground"}`}>
                {occ.type}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{occ.description}</p>
            <p className="text-xs text-muted-foreground">{occ.date} às {occ.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
