import { SCHOOL_CALENDAR_2026 } from "@/lib/calendar";
import { Calendar as CalendarIcon, Flag, Coffee, BookOpen, AlertTriangle } from "lucide-react";

export default function CalendarPage() {
    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const getDayEvents = (monthIndex: number, day: number) => {
        const year = 2026;
        const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return SCHOOL_CALENDAR_2026.filter((e) => e.date === dateStr);
    };

    const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

    return (
        <div className="space-y-8 pb-8">
            <div className="flex flex-col gap-2 bg-gradient-to-r from-primary/10 via-transparent to-transparent p-6 rounded-[2rem] border border-primary/10 relative overflow-hidden">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground relative z-10">
                    Calendário Letivo 2026 📅
                </h1>
                <p className="text-muted-foreground font-medium relative z-10">
                    Programação oficial de feriados, recessos e sábados letivos da unidade.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {months.map((monthName, mIdx) => {
                    const daysInMonth = getDaysInMonth(mIdx, 2026);
                    const firstDay = getFirstDayOfMonth(mIdx, 2026);

                    return (
                        <div key={monthName} className="glass-panel p-6">
                            <h2 className="text-xl font-bold mb-4 text-primary">{monthName}</h2>
                            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground mb-2">
                                <span>DOM</span><span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEXTA</span><span>SÁB</span>
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: firstDay }).map((_, i) => (
                                    <div key={`empty-${i}`} />
                                ))}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const events = getDayEvents(mIdx, day);
                                    const isSaturday = (firstDay + i) % 7 === 6;
                                    const isSunday = (firstDay + i) % 7 === 0;

                                    let bgColor = "hover:bg-accent/50";
                                    let textColor = "text-foreground";
                                    let indicator = null;

                                    if (events.length > 0) {
                                        const type = events[0].type;
                                        if (type === "holiday") {
                                            bgColor = "bg-red-500/10 hover:bg-red-500/20";
                                            textColor = "text-red-600 font-bold";
                                            indicator = <div className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-red-500" />;
                                        } else if (type === "recess") {
                                            bgColor = "bg-blue-500/10 hover:bg-blue-500/20";
                                            textColor = "text-blue-600 font-bold";
                                            indicator = <div className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-blue-500" />;
                                        } else if (type === "school_saturday") {
                                            bgColor = "bg-green-500/10 hover:bg-green-500/20";
                                            textColor = "text-green-600 font-bold";
                                            indicator = <div className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-green-500" />;
                                        } else if (type === "non_school_day") {
                                            bgColor = "bg-orange-500/10 hover:bg-orange-500/20";
                                            textColor = "text-orange-600 font-bold";
                                        }
                                    } else if (isSunday) {
                                        textColor = "text-muted-foreground/50";
                                    } else if (isSaturday) {
                                        textColor = "text-muted-foreground/50";
                                    }

                                    return (
                                        <div key={day}
                                            className={`relative aspect-square flex items-center justify-center rounded-lg text-xs transition-colors cursor-default ${bgColor} ${textColor}`}
                                            title={events.map(e => e.description).join(", ")}
                                        >
                                            {day}
                                            {indicator}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="glass-panel p-6">
                <h2 className="text-xl font-bold mb-4">Legenda</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded bg-red-500/20 border border-red-500/20" />
                        <span className="text-sm font-medium">Feriado</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded bg-blue-500/20 border border-blue-500/20" />
                        <span className="text-sm font-medium">Recesso</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded bg-green-500/20 border border-green-500/20" />
                        <span className="text-sm font-medium">Sábado Letivo (Com Aula)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded bg-orange-500/20 border border-orange-500/20" />
                        <span className="text-sm font-medium">Dia não letivo (Outros)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
