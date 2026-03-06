import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Shield, UserCog, Trash2, Mail, User, X, CheckCircle2, MoreVertical } from "lucide-react";
import { toast } from "sonner";

export default function UserManagement() {
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);

    const [editingProfile, setEditingProfile] = useState<any>(null);
    const [editRoleStr, setEditRoleStr] = useState<string>("user");

    const { data: profiles, isLoading } = useQuery({
        queryKey: ["user-profiles"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*, user_roles(role)");
            if (error) throw error;
            return data;
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ id, user_id, role }: { id: string, user_id: string, role: string }) => {
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ role_label: role })
                .eq("id", id);
            if (profileError) throw profileError;

            // Garante sync do poder backend para "admin" ou "user"
            const dbRole = role === "admin" ? "admin" : "user";
            const { data: existingRoles } = await supabase.from("user_roles").select("id").eq("user_id", user_id);

            if (existingRoles && existingRoles.length > 0) {
                const { error: rolesError } = await supabase.from("user_roles").update({ role: dbRole as any }).eq("user_id", user_id);
                if (rolesError) console.error("Could not update user_roles:", rolesError);
            } else {
                const { error: rolesError } = await supabase.from("user_roles").insert({ user_id: user_id, role: dbRole as any });
                if (rolesError) console.error("Could not insert user_roles:", rolesError);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
            toast.success("Função atualizada com sucesso!");
            setEditingProfile(null);
        },
        onError: (err: any) => {
            toast.error("Você não tem privilégios de Administrador no Banco de Dados para alterar perfis alheios.");
        }
    });

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-info/10 via-info/5 to-transparent p-10 rounded-[3rem] border border-info/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <Shield className="w-64 h-64 text-info" />
                </div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="h-20 w-20 rounded-[2rem] bg-info shadow-2xl shadow-info/40 flex items-center justify-center text-white">
                        <UserCog className="h-10 w-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight drop-shadow-sm">Gestão de Equipe</h1>
                        <p className="text-sm text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                            <span className="h-2 w-2 rounded-full bg-info animate-pulse"></span>
                            Segurança & Permissões Administrativas
                        </p>
                    </div>
                </div>
                <div className="relative z-10">
                    <button
                        onClick={() => setIsAdding(true)}
                        className="premium-button bg-info text-white shadow-info/40"
                    >
                        <UserPlus className="h-5 w-5 mr-2" /> Adicionar Membro
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="glass-panel p-8 animate-pulse space-y-4">
                            <div className="h-14 w-14 rounded-2xl bg-muted" />
                            <div className="h-6 w-3/4 bg-muted rounded" />
                            <div className="h-4 w-1/2 bg-muted rounded" />
                        </div>
                    ))
                ) : profiles?.length === 0 ? (
                    <div className="col-span-full py-20 text-center space-y-4 opacity-50">
                        <User className="h-16 w-16 mx-auto" />
                        <p className="font-black uppercase tracking-widest">Nenhum membro registrado.</p>
                    </div>
                ) : (
                    profiles?.map((profile: any) => (
                        <div key={profile.id} className="group glass-panel p-8 hover:translate-y-[-4px] transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[40px] rounded-full pointer-events-none -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />

                            <div className="flex items-start justify-between mb-8 relative z-10">
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-info/20 to-primary/20 flex items-center justify-center text-info border border-info/10 group-hover:scale-110 transition-transform">
                                    <User className="h-8 w-8" />
                                </div>
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${profile.role_label === "admin" ? "bg-primary text-white border-primary/20" :
                                    profile.role_label === "coordinator" ? "bg-info text-white border-info/20" :
                                        profile.role_label === "gatekeeper" ? "bg-success text-white border-success/20" :
                                            "bg-muted text-muted-foreground border-border/50"
                                    }`}>
                                    <Shield className="h-3 w-3" />
                                    {profile.role_label || "Usuário"}
                                </div>
                            </div>

                            <div className="space-y-1 mb-8 relative z-10">
                                <h3 className="text-xl font-black text-foreground tracking-tight truncate group-hover:text-info transition-colors">{profile.full_name}</h3>
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 px-3 py-1.5 rounded-xl w-fit">
                                    <Mail className="h-3 w-3" />
                                    {profile.user_id.slice(0, 8)}...
                                </div>
                            </div>

                            <div className="pt-6 border-t border-border/50 flex items-center justify-between relative z-10">
                                <button
                                    onClick={() => {
                                        setEditingProfile(profile);
                                        setEditRoleStr(profile.role_label || "user");
                                    }}
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-info transition-all flex items-center gap-2 group/btn">
                                    <UserCog className="h-4 w-4 group-hover/btn:rotate-90 transition-transform" />
                                    Configurar
                                </button>
                                <button className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all active:scale-95">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Empty State / Tip */}
            <div className="p-10 rounded-[3rem] bg-info/5 border border-info/10 flex items-start gap-6">
                <div className="h-12 w-12 rounded-2xl bg-info/10 flex items-center justify-center text-info shrink-0">
                    <Shield className="h-6 w-6" />
                </div>
                <div>
                    <h4 className="font-black text-foreground tracking-tight">Privilégios de Acesso</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1 max-w-2xl">
                        A gestão de equipe permite atribuir papéis específicos para garantir a integridade dos dados.
                        Administradores têm acesso total, coordenadores gerenciam alunos e o porteiro foca no controle de entrada e saída.
                    </p>
                </div>
            </div>

            {/* Add User Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="w-full max-w-lg bg-card border-2 border-info/20 rounded-[3rem] p-12 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] relative animate-in zoom-in-95 duration-500">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="absolute top-8 right-8 h-12 w-12 rounded-2xl hover:bg-muted flex items-center justify-center transition-all active:scale-90"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="flex items-center gap-5 mb-10">
                            <div className="h-16 w-16 rounded-[1.5rem] bg-info/10 flex items-center justify-center text-info">
                                <UserPlus className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-foreground tracking-tight">Novo Colaborador</h2>
                                <p className="text-sm text-muted-foreground font-medium">Como adicionar membros à equipe.</p>
                            </div>
                        </div>

                        <div className="space-y-6 text-sm text-muted-foreground">
                            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                                <p className="font-bold text-foreground mb-2">1. O próprio membro cria a conta</p>
                                <p>Peça para o novo funcionário acessar a tela inicial do sistema e clicar em <strong>"Solicite acesso"</strong> ou <strong>"Criar Conta"</strong> para ele mesmo cadastrar seu E-mail e Senha.</p>
                            </div>

                            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                                <p className="font-bold text-foreground mb-2">2. Você define a permissão</p>
                                <p>Assim que ele finalizar o cadastro, o perfil dele aparecerá automaticamente na lista desta página. Basta você clicar em <strong>"Configurar"</strong> e alterar o papel dele para Porteiro, Coordenador, etc.</p>
                            </div>

                            <button
                                onClick={() => setIsAdding(false)}
                                className="w-full premium-button bg-info text-white py-4 shadow-info/40 text-sm mt-4"
                            >
                                <CheckCircle2 className="h-5 w-5 mr-3" /> Entendi
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Edit User Role Modal */}
            {editingProfile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="w-full max-w-lg bg-card border-2 border-info/20 rounded-[3rem] p-12 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] relative animate-in zoom-in-95 duration-500">
                        <button
                            onClick={() => setEditingProfile(null)}
                            className="absolute top-8 right-8 h-12 w-12 rounded-2xl hover:bg-muted flex items-center justify-center transition-all active:scale-90"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="flex items-center gap-5 mb-10">
                            <div className="h-16 w-16 rounded-[1.5rem] bg-info/10 flex items-center justify-center text-info">
                                <UserCog className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-foreground tracking-tight">Editar Permissões</h2>
                                <p className="text-sm text-muted-foreground font-medium">Altere o papel de {editingProfile.full_name}.</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] ml-1">Papel no Sistema</label>
                                <div className="relative">
                                    <select
                                        value={editRoleStr}
                                        onChange={(e) => setEditRoleStr(e.target.value)}
                                        className="premium-input w-full appearance-none cursor-pointer pr-12"
                                    >
                                        <option value="user">Usuário Comum</option>
                                        <option value="gatekeeper">Porteiro (Controle de Acesso)</option>
                                        <option value="coordinator">Coordenação (Gestão de Alunos)</option>
                                        <option value="admin">Administrador (Total)</option>
                                    </select>
                                    <Shield className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            <button
                                onClick={() => updateRoleMutation.mutate({ id: editingProfile.id, user_id: editingProfile.user_id, role: editRoleStr })}
                                className="w-full premium-button bg-info text-white py-6 shadow-info/40 text-sm"
                            >
                                <CheckCircle2 className="h-5 w-5 mr-3" /> Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
