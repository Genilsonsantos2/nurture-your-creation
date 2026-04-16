import { ShieldAlert, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PendingApproval() {
  const { signOut, user } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full space-y-8 animate-in zoom-in-95 duration-700 relative z-10 text-center">
        <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 shadow-2xl shadow-amber-500/20">
          <ShieldAlert className="h-16 w-16 text-amber-500" />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Aguardando Aprovação
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Sua conta (<span className="font-semibold text-foreground">{user?.email}</span>) foi criada com sucesso, mas você ainda não possui as permissões necessárias para acessar o sistema.
          </p>
        </div>

        <div className="p-6 bg-card border border-border/50 rounded-2xl shadow-sm text-sm text-left">
          <p className="font-medium text-foreground mb-2">O que fazer agora?</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Avise o diretor ou administrador que seu cadastro foi feito.</li>
            <li>Aguarde eles liberarem o seu acesso na Gestão de Equipe.</li>
            <li>Recarregue a página quando receber a confirmação.</li>
          </ul>
        </div>

        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-border bg-card/50 text-muted-foreground font-medium hover:bg-secondary hover:text-foreground transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
