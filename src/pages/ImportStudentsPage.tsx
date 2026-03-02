import { Upload, Download, FileSpreadsheet } from "lucide-react";

export default function ImportStudentsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Importar Alunos via CSV</h1>
        <p className="text-sm text-muted-foreground">Cadastre vários alunos de uma só vez</p>
      </div>

      <div className="bg-card rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-foreground">1. Baixe o modelo</h2>
        <p className="text-sm text-muted-foreground">
          Use o modelo CSV com as colunas corretas: nome, serie, turma, matricula, responsavel_nome, responsavel_telefone
        </p>
        <button className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
          <Download className="h-4 w-4" /> Baixar Modelo CSV
        </button>
      </div>

      <div className="bg-card rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-foreground">2. Envie o arquivo preenchido</h2>
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-3">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Arraste o arquivo CSV aqui ou clique para selecionar</p>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            <Upload className="h-4 w-4" /> Selecionar Arquivo
          </button>
        </div>
      </div>
    </div>
  );
}
