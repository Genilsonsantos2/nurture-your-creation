import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Upload, Edit, Trash2, Link as LinkIcon, Copy, UserCheck, Users, SearchSlash, Clock, ArrowRightLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateDeclarationPDF } from "@/lib/documentGenerator";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Aluno removido.");
    },
    onError: () => toast.error("Erro ao remover aluno. Verifique se você tem permissão."),
  });

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.enrollment.includes(search)
  );

  const activeCount = students.filter(s => s.active).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-primary/10 via-success/5 to-transparent p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-primary/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
          <Users className="w-64 h-64 text-primary" />
        </div>
        <div className="relative z-10 flex items-center gap-4 md:gap-6">
          <div className="h-14 w-14 md:h-20 md:w-20 rounded-[1.5rem] md:rounded-[2rem] bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center text-primary-foreground">
            <Users className="h-8 w-8 md:h-10 md:w-10" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black text-foreground tracking-tight drop-shadow-sm">Gestão de Alunos</h1>
            <div className="flex items-center gap-2 md:gap-4 mt-1">
              <p className="text-[10px] md:text-sm text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary"></span>
                {students.length} Total
              </p>
              <p className="text-[10px] md:text-sm text-success font-black uppercase tracking-widest flex items-center gap-2 border-l border-border/50 pl-2 md:pl-4">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span>
                {activeCount} Ativos
              </p>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex gap-2 md:gap-3">
          <Link to="/alunos/importar" className="inline-flex items-center gap-2 text-[10px] md:text-xs font-black text-foreground uppercase tracking-widest bg-white dark:bg-black p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl hover:bg-muted transition-all border border-border/50">
            <Upload className="h-4 w-4" /> <span className="hidden sm:inline">Importar</span> CSV
          </Link>
          <Link to="/alunos/novo" className="premium-button py-3 md:py-4 px-4 md:px-6 shadow-primary/20 text-[10px] md:text-sm">
            <Plus className="h-4 w-4" /> Novo Aluno
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative group max-w-2xl">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Buscar aluno por nome ou número de matrícula..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-card/50 backdrop-blur-xl border-2 border-border/50 rounded-[2rem] pl-14 pr-6 py-6 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-xl"
        />
      </div>

      {/* Content Area */}
      <div className="glass-panel overflow-hidden border-border/40 shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="px-8 py-6 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Identificação</th>
                <th className="px-8 py-6 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Acadêmico</th>
                <th className="px-8 py-6 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Matrícula</th>
                <th className="px-8 py-6 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Modalidade</th>
                <th className="px-8 py-6 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 py-10 opacity-50">
                      <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                      <p className="font-black text-xs uppercase tracking-widest">Carregando base de dados...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-40">
                      <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center">
                        <SearchSlash className="h-10 w-10" />
                      </div>
                      <div>
                        <p className="font-black text-lg text-foreground tracking-tight">Nenhum aluno encontrado</p>
                        <p className="text-sm font-medium text-muted-foreground mt-1">Tente ajustar seus termos de busca.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((student, i) => (
                  <tr key={student.id} className="group hover:bg-primary/[0.02] transition-colors relative">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary/20 to-info/20 flex items-center justify-center text-primary font-black text-lg border border-primary/10 group-hover:scale-110 transition-transform overflow-hidden shrink-0">
                          {(student as any).photo_url ? (
                            <img src={(student as any).photo_url} alt={student.name} className="h-full w-full object-cover" />
                          ) : (
                            student.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{student.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{student.series} • {student.class}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-foreground">{student.series}</p>
                        <p className="text-xs font-bold text-muted-foreground">Turma {student.class}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${student.active ? "bg-success/5 text-success border-success/20" : "bg-muted text-muted-foreground border-border/50"}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${student.active ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                        {student.active ? "Ativo" : "Inativo"}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border ${student.modality === 'integral'
                        ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                        : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        }`}>
                        {student.modality === 'integral' ? 'Integral' : 'Técnico'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/alocacao?series=${student.series}&class=${student.class}`)}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-card border border-border shadow-sm hover:bg-primary hover:text-white transition-all active:scale-95"
                          title="Alocação em Massa / Mudar Turma"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/alunos/${student.id}/timeline`)}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-card border border-border shadow-sm hover:bg-info hover:text-white transition-all active:scale-95"
                          title="Ver Dossiê / Linha do Tempo"
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            const link = `${window.location.origin}/filho/${student.id}`;
                            navigator.clipboard.writeText(link);
                            toast.success("Link para pais copiado!");
                          }}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-card border border-border shadow-sm hover:bg-success hover:text-white transition-all active:scale-95"
                          title="Copiar link para pais"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => generateDeclarationPDF(student)}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-card border border-border shadow-sm hover:bg-info hover:text-white transition-all active:scale-95"
                          title="Gerar Declaração Eletrônica (PDF)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>
                        </button>
                        <button
                          onClick={() => navigate(`/alunos/editar/${student.id}`)}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-card border border-border shadow-sm hover:bg-primary hover:text-white transition-all active:scale-95"
                          title="Editar aluno"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm("Deseja realmente remover este registro?")) deleteMutation.mutate(student.id); }}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-card border border-border shadow-sm hover:bg-destructive hover:text-white transition-all active:scale-95"
                          title="Remover aluno"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Background pattern */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none -mr-48 -mt-48" />
      </div >

      <div className="p-10 rounded-[3rem] bg-muted/20 border border-border/40 flex items-start gap-6">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h4 className="font-black text-foreground tracking-tight">Dica de Gestão</h4>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1 max-w-2xl">
            A base de dados de alunos é sincronizada em tempo real com o sistema de portaria e registros de ocorrências.
            Mantenha o status dos alunos atualizado para garantir o controle de acesso por QR Code.
          </p>
        </div>
      </div>
    </div >
  );
}
