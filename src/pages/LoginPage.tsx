import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { LogIn, UserPlus, Cpu } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
    <div className="flex min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-[-150px] left-[-150px] w-[500px] h-[500px] rounded-full bg-white/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-white/5 blur-[120px] pointer-events-none" />

      {/* Left: Branding - Blue gradient */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12">
        {/* Grid overlay */}
        <div className="absolute inset-0 tech-grid opacity-20" />

        <div className="z-10 w-full max-w-lg space-y-8 animate-fade-in text-center">
          <div className="mx-auto flex h-32 w-32 items-center justify-center p-2 rounded-full bg-white/10 backdrop-blur-sm">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-xl" />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              CETI NOVA ITARANA
            </h1>
            <p className="text-white/80 leading-relaxed max-w-sm mx-auto">
              Sistema Inteligente de Controle de Acesso Escolar
            </p>
          </div>

          <div className="border-t border-white/20 pt-6 max-w-xs mx-auto" />

          <div className="flex justify-center gap-6 text-xs font-mono text-white/70">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span>Monitoramento em tempo real</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Form - Light background */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10 bg-gradient-to-b from-slate-50 to-slate-100">
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
              {isSignUp ? "Criar Conta" : "Bem-vindo de volta"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isSignUp ? "Preencha os dados para se registrar" : "Insira suas credenciais para continuar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Nome Completo</label>
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="premium-input" placeholder="Seu nome completo" />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">E-mail</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="premium-input" placeholder="nome@escola.com" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">Senha</label>
                {!isSignUp && (
                  <button type="button" className="text-xs font-medium text-primary hover:underline">Esqueceu a senha?</button>
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
                <><LogIn className="h-4 w-4" /> Entrar no sistema</>
              )}
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
