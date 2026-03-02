import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Upload, Edit, Trash2 } from "lucide-react";

const mockStudents = [
  { id: "1", name: "João Silva", series: "7º Ano", class: "A", enrollment: "2024001", active: true },
  { id: "2", name: "Maria Santos", series: "8º Ano", class: "B", enrollment: "2024002", active: true },
  { id: "3", name: "Pedro Oliveira", series: "6º Ano", class: "A", enrollment: "2024003", active: true },
  { id: "4", name: "Ana Costa", series: "9º Ano", class: "C", enrollment: "2024004", active: true },
  { id: "5", name: "Lucas Pereira", series: "7º Ano", class: "B", enrollment: "2024005", active: true },
  { id: "6", name: "Fernanda Lima", series: "8º Ano", class: "A", enrollment: "2024006", active: false },
  { id: "7", name: "Carlos Mendes", series: "6º Ano", class: "B", enrollment: "2024007", active: true },
  { id: "8", name: "Julia Pinto", series: "9º Ano", class: "A", enrollment: "2024008", active: true },
];

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const filtered = mockStudents.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.enrollment.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alunos</h1>
          <p className="text-sm text-muted-foreground">{mockStudents.length} alunos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/alunos/importar"
            className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <Upload className="h-4 w-4" /> Importar CSV
          </Link>
          <Link
            to="/alunos/novo"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Novo Aluno
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nome ou matrícula..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Série</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Turma</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Matrícula</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((student) => (
              <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{student.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{student.series}</td>
                <td className="px-4 py-3 text-muted-foreground">{student.class}</td>
                <td className="px-4 py-3 text-muted-foreground">{student.enrollment}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    student.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  }`}>
                    {student.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
