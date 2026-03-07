import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquare, Plus, Trash2, AlertCircle, Clock, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AnnouncementsManager() {
    const [newMessage, setNewMessage] = useState("");
    const [priority, setPriority] = useState<"low" | "normal" | "high" | "critical">("normal");
    const [expiresIn, setExpiresIn] = useState("1"); // days
    const [isFormOpen, setIsFormOpen] = useState(false);

    const queryClient = useQueryClient();

    const { data: announcements = [], isLoading } = useQuery({
        queryKey: ["gate_announcements_manager"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("gate_announcements")
                .select("*, created_by_auth:created_by") // simplified user fetch
                .order("created_at", { ascending: false })
                .limit(10);

            if (error) throw error;
            return data || [];
        }
    });

    const createAnnouncement = useMutation({
        mutationFn: async () => {
            const expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + parseInt(expiresIn));

            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from("gate_announcements")
                .insert([{
                    message: newMessage,
                    priority,
                    expires_at: expireDate.toISOString(),
                    active: true,
                    created_by: user?.id
                }]);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["gate_announcements_manager"] });
            toast.success("Aviso enviado para a portaria!");
            setNewMessage("");
            setIsFormOpen(false);
        },
        onError: (err: any) => {
            toast.error("Erro ao publicar aviso: " + err.message);
        }
    });

    const toggleStatus = useMutation({
        mutationFn: async ({ id, active }: { id: string, active: boolean }) => {
            const { error } = await supabase
                .from("gate_announcements")
                .update({ active: !active })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["gate_announcements_manager"] });
            toast.success("Status atualizado.");
        }
    });

    const deleteAnnouncement = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("gate_announcements").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["gate_announcements_manager"] });
            toast.success("Aviso removido.");
        }
    });

    const priorityColors = {
        low: "bg-muted text-muted-foreground border-muted-foreground/20",
        normal: "bg-primary/10 text-primary border-primary/20",
        high: "bg-warning/10 text-warning border-warning/20",
        critical: "bg-destructive/10 text-destructive border-destructive/20 animate-pulse"
    };

    const priorityLabels = {
        low: "Baixa",
        normal: "Normal",
        high: "Alta",
        critical: "Crítica"
    };

    return (
        <div className="glass-panel p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black">Mural da Portaria</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Avisos em tempo real</p>
                    </div>
                </div>

                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="h-10 w-10 md:w-auto md:px-4 rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg"
                >
                    <Plus className="h-5 w-5" />
                    <span className="hidden md:block font-bold text-sm">Novo Aviso</span>
                </button>
            </div>

            {isFormOpen && (
                <div className="p-6 bg-muted/30 rounded-2xl border border-border animate-in slide-in-from-top-4 space-y-4">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escreva a mensagem que aparecerá na tela do porteiro..."
                        className="w-full bg-background border border-input focus:border-primary rounded-xl p-4 min-h-[100px] outline-none transition-all resize-none shadow-inner"
                    />

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-black uppercase text-muted-foreground">Prioridade</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as any)}
                                className="w-full bg-background border border-input h-10 px-3 rounded-lg outline-none focus:border-primary font-medium text-sm"
                            >
                                <option value="low">Baixa</option>
                                <option value="normal">Normal (Azul)</option>
                                <option value="high">Alta (Amarela)</option>
                                <option value="critical">Crítica (Vermelha piscante)</option>
                            </select>
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-black uppercase text-muted-foreground">Expiração</label>
                            <select
                                value={expiresIn}
                                onChange={(e) => setExpiresIn(e.target.value)}
                                className="w-full bg-background border border-input h-10 px-3 rounded-lg outline-none focus:border-primary font-medium text-sm"
                            >
                                <option value="1">Amanhã</option>
                                <option value="3">Em 3 dias</option>
                                <option value="7">Uma semana</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => createAnnouncement.mutate()}
                                disabled={!newMessage.trim() || createAnnouncement.isPending}
                                className="w-full sm:w-auto px-6 h-10 bg-primary text-primary-foreground rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Send className="h-4 w-4" /> Enviar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando mural...</div>
                ) : announcements.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl text-muted-foreground bg-muted/10">
                        Nenhum aviso no mural.
                    </div>
                ) : (
                    announcements.map((announcement) => (
                        <div key={announcement.id} className={`p-4 rounded-xl border flex flex-col md:flex-row gap-4 justify-between items-start md:items-center transition-all ${announcement.active ? 'bg-card' : 'bg-muted/50 opacity-60'}`}>
                            <div className="space-y-2 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${priorityColors[announcement.priority as keyof typeof priorityColors]}`}>
                                        {priorityLabels[announcement.priority as keyof typeof priorityLabels]}
                                    </span>
                                    {!announcement.active && (
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Arquivado</span>
                                    )}
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(announcement.created_at), "dd MMM • HH:mm", { locale: ptBR })}
                                    </span>
                                </div>
                                <p className="text-sm font-medium leading-relaxed">{announcement.message}</p>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0">
                                <button
                                    onClick={() => toggleStatus.mutate(announcement)}
                                    className="px-3 py-1.5 rounded-lg border text-xs font-bold hover:bg-muted transition-colors"
                                >
                                    {announcement.active ? "Desativar" : "Reativar"}
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm("Deletar este aviso definitivamente?")) {
                                            deleteAnnouncement.mutate(announcement.id);
                                        }
                                    }}
                                    className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
