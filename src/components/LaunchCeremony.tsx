import { useState } from "react";
import { Rocket, Sparkles, CheckCircle2, Loader2, PartyPopper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function LaunchCeremony() {
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      // 1. Clear all transactional/test data
      await Promise.all([
        supabase.from("movements").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("occurrences").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("absence_justifications").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("exit_authorizations").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("gate_announcements").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      ]);

      // 2. Activate the system
      const { data: settings } = await supabase.from("settings").select("*").limit(1).maybeSingle();
      if (settings) {
        await supabase.from("settings").update({ system_active: true } as any).eq("id", settings.id);
      }

      setLaunched(true);
      toast.success("🚀 Sistema lançado oficialmente!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao realizar o lançamento.");
    } finally {
      setLaunching(false);
    }
  };

  if (launched) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-success/10 via-primary/5 to-success/10 border border-success/30 p-8 text-center animate-in fade-in zoom-in duration-700">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
                opacity: 0.3 + Math.random() * 0.4,
              }}
            >
              <Sparkles className="h-4 w-4 text-success" />
            </div>
          ))}
        </div>
        <div className="relative z-10">
          <PartyPopper className="h-16 w-16 text-success mx-auto mb-4" />
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-2">
            Sistema Lançado! 🎉
          </h2>
          <p className="text-muted-foreground font-medium">
            Todos os dados de teste foram limpos e o sistema está oficialmente ativo.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-success/15 text-success font-black text-sm uppercase tracking-widest">
            <CheckCircle2 className="h-4 w-4" />
            Operacional
          </div>
        </div>
      </div>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="group relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-success p-8 text-left text-primary-foreground shadow-2xl shadow-primary/25 transition-all duration-500 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
          <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Rocket className="h-32 w-32 -rotate-45" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Rocket className="h-6 w-6" />
              </div>
              <div className="px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase tracking-widest">
                Pronto para lançar
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
              Lançamento Oficial 🚀
            </h2>
            <p className="text-primary-foreground/80 font-medium max-w-md">
              Clique para limpar todos os dados de teste, ativar o sistema e iniciar as operações oficiais da escola.
            </p>
          </div>
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Rocket className="h-10 w-10 text-primary -rotate-45" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-2xl font-black">
            Confirmar Lançamento Oficial?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base">
            Esta ação irá:
            <ul className="mt-4 text-left space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span>Limpar todas as movimentações de teste</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span>Limpar alertas, ocorrências e justificativas</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span>Ativar o sistema para uso oficial</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span>Manter todos os alunos e responsáveis cadastrados</span>
              </li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={launching}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLaunch}
            disabled={launching}
            className="bg-primary hover:bg-primary/90 gap-2"
          >
            {launching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Lançando...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Lançar Oficialmente
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
