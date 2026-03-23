import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Step {
  target: string;
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
}

const steps: Step[] = [
  {
    target: "hero-section",
    title: "Bem-vindo ao Painel!",
    content: "Aqui você tem uma visão geral em tempo real da escola.",
    position: "bottom"
  },
  {
    target: "radar-section",
    title: "Radar de Voz",
    content: "Ative o radar para ouvir alertas automáticos de alunos atrasados.",
    position: "bottom"
  },
  {
    target: "stats-section",
    title: "Estatísticas Rápidas",
    content: "Acompanhe entradas, saídas e alunos aguardando retorno.",
    position: "top"
  },
  {
    target: "actions-section",
    title: "Ações Rápidas",
    content: "Acesse as principais ferramentas do sistema com um clique.",
    position: "top"
  }
];

export default function CustomTour() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(`tour_seen_${user?.id}`);
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setCurrentStep(0);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(`tour_seen_${user?.id}`, "true");
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible || currentStep === -1) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
      <div className="relative w-full max-w-sm pointer-events-auto animate-in zoom-in-95 duration-300">
        <div className="bg-card border-2 border-primary/50 rounded-2xl p-6 shadow-2xl shadow-primary/20">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-primary">
              <Info className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-widest">Tutorial Ágil</span>
            </div>
            <button onClick={handleClose} className="p-1 hover:bg-muted rounded-full transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {step.content}
          </p>
          
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-muted-foreground">
              Passo {currentStep + 1} de {steps.length}
            </span>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button 
                  onClick={handlePrev} 
                  className="p-2 border border-border rounded-xl hover:bg-muted transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              <button 
                onClick={handleNext} 
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                {currentStep === steps.length - 1 ? "Entendido!" : "Próximo"} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Simple decorative pointer */}
        <div className="absolute -z-10 bg-primary/20 rounded-full animate-ping h-8 w-8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
}
