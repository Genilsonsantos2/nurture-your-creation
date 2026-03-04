import { Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle } from "lucide-react";
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ParsedRow {
  name: string;
  series: string;
  class: string;
  enrollment: string;
  guardianName?: string;
  guardianPhone?: string;
}

export default function ImportStudentsPage() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [imported, setImported] = useState(false);

  const downloadTemplate = () => {
    const csv = "nome,serie,turma,matricula,responsavel_nome,responsavel_telefone\nJoão Silva,7º Ano,A,2024001,Maria Silva,75988880001";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "modelo_alunos.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) { setErrors(["Arquivo vazio ou sem dados"]); return; }

      const header = lines[0].toLowerCase().split(/[,;]/);
      const nameIdx = header.findIndex(h => h.includes("nome") && !h.includes("responsavel"));
      const seriesIdx = header.findIndex(h => h.includes("serie"));
      const classIdx = header.findIndex(h => h.includes("turma"));
      const enrollIdx = header.findIndex(h => h.includes("matricula"));
      const gNameIdx = header.findIndex(h => h.includes("responsavel") && h.includes("nome"));
      const gPhoneIdx = header.findIndex(h => h.includes("responsavel") && h.includes("telefone"));

      if (nameIdx < 0 || seriesIdx < 0 || classIdx < 0 || enrollIdx < 0) {
        setErrors(["Colunas obrigatórias não encontradas: nome, serie, turma, matricula"]);
        return;
      }

      const rows: ParsedRow[] = [];
      const errs: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[,;]/).map(c => c.replace(/^"|"$/g, "").trim());
        if (!cols[nameIdx] || !cols[seriesIdx] || !cols[classIdx] || !cols[enrollIdx]) {
          errs.push(`Linha ${i + 1}: campos obrigatórios vazios`);
          continue;
        }
        rows.push({
          name: cols[nameIdx],
          series: cols[seriesIdx],
          class: cols[classIdx],
          enrollment: cols[enrollIdx],
          guardianName: gNameIdx >= 0 ? cols[gNameIdx] : undefined,
          guardianPhone: gPhoneIdx >= 0 ? cols[gPhoneIdx] : undefined,
        });
      }
      setParsed(rows);
      setErrors(errs);
      setImported(false);
    };
    reader.readAsText(file);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      let successCount = 0;
      const importErrors: string[] = [];
      for (const row of parsed) {
        const { data: student, error: err } = await supabase.from("students").insert({
          name: row.name, series: row.series, class: row.class, enrollment: row.enrollment,
        }).select().single();

        if (err) {
          importErrors.push(`${row.name}: ${err.message.includes("duplicate") ? "matrícula duplicada" : err.message}`);
          continue;
        }

        if (row.guardianName && row.guardianPhone) {
          await supabase.from("guardians").insert({
            student_id: student.id, name: row.guardianName, phone: row.guardianPhone,
          });
        }
        successCount++;
      }
      return { successCount, importErrors };
    },
    onSuccess: ({ successCount, importErrors }) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setImported(true);
      if (importErrors.length > 0) setErrors(importErrors);
      toast.success(`${successCount} aluno(s) importado(s)!`);
    },
    onError: () => toast.error("Erro ao importar alunos."),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Importar Alunos via CSV</h1>
        <p className="text-sm text-muted-foreground">Cadastre vários alunos de uma só vez</p>
      </div>

      <div className="bg-card rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-foreground">1. Baixe o modelo</h2>
        <p className="text-sm text-muted-foreground">
          Use o modelo CSV com as colunas: nome, serie, turma, matricula, responsavel_nome, responsavel_telefone
        </p>
        <button onClick={downloadTemplate} className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
          <Download className="h-4 w-4" /> Baixar Modelo CSV
        </button>
      </div>

      <div className="bg-card rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-foreground">2. Envie o arquivo preenchido</h2>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        <div onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-3 cursor-pointer hover:border-primary/50 transition-colors">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Arraste o arquivo CSV aqui ou clique para selecionar</p>
          <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            <Upload className="h-4 w-4" /> Selecionar Arquivo
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-1">
          {errors.map((err, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {err}
            </div>
          ))}
        </div>
      )}

      {parsed.length > 0 && !imported && (
        <div className="bg-card rounded-lg border p-5 space-y-4">
          <h2 className="font-semibold text-foreground">3. Confirme a importação</h2>
          <p className="text-sm text-muted-foreground">{parsed.length} aluno(s) encontrado(s) no arquivo</p>
          <div className="max-h-60 overflow-y-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50 border-b">
                <th className="px-3 py-2 text-left text-muted-foreground">Nome</th>
                <th className="px-3 py-2 text-left text-muted-foreground">Série</th>
                <th className="px-3 py-2 text-left text-muted-foreground">Turma</th>
                <th className="px-3 py-2 text-left text-muted-foreground">Matrícula</th>
              </tr></thead>
              <tbody className="divide-y">
                {parsed.map((row, i) => (
                  <tr key={i}><td className="px-3 py-2">{row.name}</td><td className="px-3 py-2">{row.series}</td><td className="px-3 py-2">{row.class}</td><td className="px-3 py-2">{row.enrollment}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => importMutation.mutate()} disabled={importMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
            <Upload className="h-4 w-4" /> {importMutation.isPending ? "Importando..." : `Importar ${parsed.length} aluno(s)`}
          </button>
        </div>
      )}

      {imported && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-success" />
          <p className="text-sm font-medium text-foreground">Importação concluída com sucesso!</p>
        </div>
      )}
    </div>
  );
}
