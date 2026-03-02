import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { GraduationCap, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";

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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">CETINI</h1>
          <p className="text-sm text-muted-foreground">Sistema de Controle de Acesso v2.0</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-lg border p-6 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground text-center">
            {isSignUp ? "Criar Conta" : "Entrar no Sistema"}
          </h2>

          {isSignUp && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Nome Completo</label>
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Senha</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
            {submitting ? (
              <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
            ) : isSignUp ? (
              <><UserPlus className="h-4 w-4" /> Criar Conta</>
            ) : (
              <><LogIn className="h-4 w-4" /> Entrar</>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            {isSignUp ? "Já tem conta?" : "Não tem conta?"}{" "}
            <button type="button" onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-medium hover:underline">
              {isSignUp ? "Entrar" : "Criar conta"}
            </button>
          </p>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          CETINI — Nova Itarana, Bahia
        </p>
      </div>
    </div>
  );
}
