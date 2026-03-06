import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";

export default function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Cadastro realizado! Verifique seu e-mail para confirmar.");
        setIsSignUp(false);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error("E-mail ou senha incorretos.");
      }
    }

    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-info/10 blur-3xl pointer-events-none" />

      {/* Left side: Branding / Hero */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-primary/95 to-primary p-12 text-primary-foreground">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="z-10 w-full max-w-lg space-y-8 animate-fade-in text-center">
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-white/10 backdrop-blur-md p-4 shadow-2xl ring-1 ring-white/20">
            <div className="h-full w-full rounded-full bg-primary-foreground/20 flex items-center justify-center overflow-hidden border border-white/30 shadow-inner">
              <img src="/logo.png" alt="Logo" className="h-[90%] w-[90%] object-contain scale-110" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl drop-shadow-md">
              CETI NOVA ITARANA
            </h1>
            <p className="text-lg text-primary-foreground/80 leading-relaxed font-medium">
              Sistema Inteligente de Controle de Acesso Escolar
            </p>
          </div>

          <div className="pt-8 border-t border-white/20 flex justify-center gap-8 text-sm font-medium text-white/70">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Monitoramento em tempo real
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-[400px] space-y-8 animate-fade-in">

          {/* Mobile Branding (hidden on desktop) */}
          <div className="lg:hidden text-center space-y-4 mb-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-card shadow-md border border-border/50 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="h-[80%] w-[80%] object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">CETI NOVA ITARANA</h1>
              <p className="text-sm text-muted-foreground">Controle de Acesso Escolar</p>
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {isSignUp ? "Criar Conta" : "Bem-vindo de volta"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isSignUp ? "Preencha os dados abaixo para se registrar" : "Insira suas credenciais para continuar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-1.5 focus-within:text-primary transition-colors">
                <label className="text-sm font-semibold">Nome Completo</label>
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-sm"
                  placeholder="Seu nome completo" />
              </div>
            )}

            <div className="space-y-1.5 focus-within:text-primary transition-colors">
              <label className="text-sm font-semibold">E-mail</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-sm"
                placeholder="nome@escola.com" />
            </div>

            <div className="space-y-1.5 focus-within:text-primary transition-colors">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Senha</label>
                {!isSignUp && (
                  <button type="button" className="text-xs font-medium text-primary hover:underline">
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-sm"
                placeholder="••••••••" />
            </div>

            <button type="submit" disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:translate-y-[-2px] hover:shadow-xl hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none">
              {submitting ? (
                <div className="animate-spin h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
              ) : isSignUp ? (
                <><UserPlus className="h-5 w-5" /> Criar Conta</>
              ) : (
                <><LogIn className="h-5 w-5" /> Entrar no sistema</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground pt-4">
            {isSignUp ? "Já tem uma conta?" : "Não tem acesso?"}{" "}
            <button type="button" onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-semibold hover:underline">
              {isSignUp ? "Faça login" : "Solicite acesso"}
            </button>
          </p>

          <p className="text-center text-xs text-muted-foreground/60 lg:hidden pt-8">
            CETI NOVA ITARANA — Bahia
          </p>
        </div>
      </div>
    </div>
  );
}
