import { QrCode, Printer, Search } from "lucide-react";
import { useState } from "react";

const mockStudents = [
  { id: "1", name: "João Silva", series: "7º Ano", class: "A", enrollment: "2024001" },
  { id: "2", name: "Maria Santos", series: "8º Ano", class: "B", enrollment: "2024002" },
  { id: "3", name: "Pedro Oliveira", series: "6º Ano", class: "A", enrollment: "2024003" },
  { id: "4", name: "Ana Costa", series: "9º Ano", class: "C", enrollment: "2024004" },
  { id: "5", name: "Lucas Pereira", series: "7º Ano", class: "B", enrollment: "2024005" },
  { id: "6", name: "Carlos Mendes", series: "6º Ano", class: "B", enrollment: "2024007" },
];

export default function QRCodesPage() {
  const [filterSeries, setFilterSeries] = useState("");

  const filtered = filterSeries
    ? mockStudents.filter((s) => s.series === filterSeries)
    : mockStudents;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">QR Codes</h1>
          <p className="text-sm text-muted-foreground">Gere e imprima QR Codes para as carteirinhas</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Printer className="h-4 w-4" /> Imprimir Todos
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <select
          value={filterSeries}
          onChange={(e) => setFilterSeries(e.target.value)}
          className="rounded-lg border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todas as Séries</option>
          {["6º Ano", "7º Ano", "8º Ano", "9º Ano"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* QR Code grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map((student) => (
          <div key={student.id} className="bg-card rounded-lg border p-4 text-center space-y-3 hover:shadow-md transition-shadow cursor-pointer">
            <div className="mx-auto h-24 w-24 rounded-lg bg-muted flex items-center justify-center">
              <QrCode className="h-16 w-16 text-foreground/30" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
              <p className="text-xs text-muted-foreground">{student.series} - {student.class}</p>
              <p className="text-xs text-muted-foreground">{student.enrollment}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
