import { Trophy, Medal, TrendingUp, Users } from "lucide-react";

interface RankingItem {
  class: string;
  points: number;
  trend: 'up' | 'down' | 'stable';
  position: number;
}

const mockRanking: RankingItem[] = [
  { class: "9º Ano A", points: 950, trend: 'up', position: 1 },
  { class: "2º Ano B", points: 890, trend: 'up', position: 2 },
  { class: "1º Ano C", points: 820, trend: 'stable', position: 3 },
  { class: "8º Ano B", points: 750, trend: 'down', position: 4 },
];

export default function EngagementRanking() {
  return (
    <div className="glass-panel p-6 border-primary/20 bg-primary/5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <Trophy className="h-4 w-4" /> Ranking de Engajamento
          </h3>
          <p className="text-[10px] font-bold text-muted-foreground">Turmas mais pontuais da semana</p>
        </div>
        <TrendingUp className="h-5 w-5 text-primary opacity-50" />
      </div>

      <div className="space-y-4">
        {mockRanking.map((item) => (
          <div key={item.class} className="flex items-center gap-4 group">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black border ${
              item.position === 1 ? "bg-amber-500/20 border-amber-500/50 text-amber-500" :
              item.position === 2 ? "bg-slate-400/20 border-slate-400/50 text-slate-400" :
              item.position === 3 ? "bg-orange-600/20 border-orange-600/50 text-orange-600" :
              "bg-muted border-border text-muted-foreground"
            }`}>
              {item.position}º
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-foreground">{item.class}</span>
                <span className="text-xs font-mono font-bold text-primary">{item.points} pts</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    item.position === 1 ? "bg-amber-500" : "bg-primary/60"
                  }`} 
                  style={{ width: `${(item.points / 1000) * 100}%` }} 
                />
              </div>
            </div>

            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
              <Users className="h-3 w-3" /> 32
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 py-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 rounded-xl transition-all border border-primary/20">
        Ver Ranking Completo
      </button>
    </div>
  );
}
