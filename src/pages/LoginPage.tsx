import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { LogIn, UserPlus, Cpu, Zap, Shield, Activity } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-background tech-grid">
      <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center animate-pulse glow-md">
        <Cpu className="h-5 w-5 text-primary" />
      </div>
    </div>
  );

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, fullName);
      if (error) toast.error(error.message);
      else { toast.success("Cadastro realizado! Verifique seu e-mail."); setIsSignUp(false); }
    } else {
      const { error } = await signIn(email, password);
      if (error) toast.error("Credenciais inválidas.");
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden tech-grid">
      {/* Ambient glows */}
      <div className="absolute top-[-150px] left-[-150px] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

      {/* Left: Branding */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-card via-background to-card border-r border-border p-12">
        {/* Grid overlay */}
        <div className="absolute inset-0 tech-grid opacity-50" />

        {/* Floating elements */}
        <div className="absolute top-20 left-20 h-16 w-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
          <Shield className="h-8 w-8 text-primary/50" />
        </div>
        <div className="absolute bottom-32 right-20 h-12 w-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center animate-pulse" style={{ animationDelay: "0.5s" }}>
          <Activity className="h-6 w-6 text-accent/50" />
        </div>
        <div className="absolute top-1/3 right-32 h-10 w-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center animate-pulse" style={{ animationDelay: "1s" }}>
          <Zap className="h-5 w-5 text-success/50" />
        </div>

        <div className="z-10 w-full max-w-lg space-y-8 animate-fade-in text-center">
          <div className="mx-auto flex h-32 w-32 items-center justify-center p-2">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-xl" />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              CETI <span className="gradient-text">NOVA ITARANA</span>
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono font-semibold text-primary tracking-wider">100% TECNOLOGIA</span>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Sistema Inteligente de Controle de Acesso Escolar com Inteligência Artificial
            </p>
          </div>

          <div className="pt-6 flex justify-center gap-6 text-xs font-mono text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>Sistema Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>IA Ativa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-[400px] space-y-8 animate-fade-in">

          {/* Mobile Branding (hidden on desktop) */}
          <div className="lg:hidden text-center space-y-4 mb-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center p-1">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">CETI NOVA ITARANA</h1>
              <p className="text-xs font-mono text-primary">100% TECNOLOGIA</p>
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {isSignUp ? "Criar Conta" : "Bem-vindo"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isSignUp ? "Preencha os dados para se registrar" : "Entre com suas credenciais"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome Completo</label>
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="premium-input" placeholder="Seu nome completo" />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">E-mail</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="premium-input" placeholder="nome@escola.com" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Senha</label>
                {!isSignUp && (
                  <button type="button" className="text-[10px] font-medium text-primary hover:underline">Esqueceu?</button>
                )}
              </div>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="premium-input" placeholder="••••••••" />
            </div>

            <button type="submit" disabled={submitting}
              className="w-full premium-button py-3 text-sm">
              {submitting ? (
                <div className="animate-spin h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
              ) : isSignUp ? (
                <><UserPlus className="h-4 w-4" /> Criar Conta</>
              ) : (
                <><LogIn className="h-4 w-4" /> Entrar</>
              )}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-[10px] text-muted-foreground font-mono uppercase tracking-wider">ou</span>
              </div>
            </div>

            <button type="button"
              onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
                if (error) toast.error("Erro ao entrar com Google.");
              }}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-card/50 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-secondary hover:border-primary/30"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Entrar com Google
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground pt-2">
            {isSignUp ? "Já tem conta?" : "Não tem acesso?"}{" "}
            <button type="button" onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-semibold hover:underline">
              {isSignUp ? "Faça login" : "Solicite acesso"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
