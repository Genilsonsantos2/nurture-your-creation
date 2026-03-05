import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Shield, UserCog, Trash2, Mail, User } from "lucide-react";
import { toast } from "sonner";

export default function UserManagement() {
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [newName, setNewName] = useState("");
    const [newRole, setNewRole] = useState<"admin" | "coordinator" | "gatekeeper">("gatekeeper");

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

    const addUserMutation = useMutation({
        mutationFn: async () => {
            // Note: In a real Supabase setup, you'd use a service role or invite flow.
            // For this implementation, we simulate the profile/role creation.
            toast.info("Funcionalidade de convite enviada por e-mail (Simulação)");
            setIsAdding(false);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
        }
    });

    return (
        <div className="space-y-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-transparent to-transparent p-8 rounded-[2.5rem] border border-primary/10 relative overflow-hidden">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Gestão de Equipe 👥</h1>
                    <p className="text-muted-foreground font-medium">Controle quem acessa o sistema e quais são suas permissões.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                    <UserPlus className="h-5 w-5" /> Adicionar Membro
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles?.map((profile: any) => (
                    <div key={profile.id} className="glass-panel p-6 group">
                        <div className="flex items-start justify-between mb-6">
                            <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                <User className="h-7 w-7" />
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${profile.user_roles?.[0]?.role === "admin" ? "bg-primary/10 text-primary" :
                                    profile.user_roles?.[0]?.role === "coordinator" ? "bg-info/10 text-info" :
                                        "bg-success/10 text-success"
                                }`}>
                                {profile.user_roles?.[0]?.role || "Usuário"}
                            </div>
                        </div>

                        <div className="space-y-1 mb-6">
                            <h3 className="text-lg font-bold text-foreground truncate">{profile.full_name}</h3>
                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {profile.user_id.slice(0, 8)}... (UUID)
                            </p>
                        </div>

                        <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                            <button className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                                <UserCog className="h-4 w-4" /> Editar Perfil
                            </button>
                            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-card border rounded-[2rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="absolute top-6 right-6 p-2 rounded-xl hover:bg-muted transition-colors"
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>

                        <h2 className="text-2xl font-black text-foreground mb-2">Novo Membro</h2>
                        <p className="text-sm text-muted-foreground font-medium mb-8">Defina o nível de acesso para o novo colaborador.</p>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Ex: João Silva"
                                    className="w-full px-5 py-3.5 rounded-2xl bg-muted/50 border border-transparent focus:border-primary/30 focus:bg-background transition-all outline-none text-sm font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">E-mail Institucional</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="joao@escola.com"
                                    className="w-full px-5 py-3.5 rounded-2xl bg-muted/50 border border-transparent focus:border-primary/30 focus:bg-background transition-all outline-none text-sm font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Função no Sistema</label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value as any)}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-muted/50 border border-transparent focus:border-primary/30 focus:bg-background transition-all outline-none text-sm font-medium appearance-none cursor-pointer"
                                >
                                    <option value="gatekeeper">Porteiro</option>
                                    <option value="coordinator">Coordenação</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>

                            <button
                                onClick={() => addUserMutation.mutate()}
                                className="w-full py-4 mt-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                            >
                                Cadastrar Usuário
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
