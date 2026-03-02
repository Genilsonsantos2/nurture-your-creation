import { Plus, Clock, Trash2 } from "lucide-react";
import { useState } from "react";

const mockSchedules = [
  { id: 1, name: "Entrada Manhã", type: "Entrada", start: "07:00", end: "07:15", tolerance: 5, notify: true },
  { id: 2, name: "Saída Almoço", type: "Saída", start: "11:30", end: "11:45", tolerance: 5, notify: true },
  { id: 3, name: "Entrada Tarde", type: "Entrada", start: "13:00", end: "13:15", tolerance: 10, notify: false },
  { id: 4, name: "Saída Final", type: "Saída", start: "17:00", end: "17:15", tolerance: 5, notify: true },
];

export default function SchedulesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Horários</h1>
          <p className="text-sm text-muted-foreground">Configure as janelas de entrada e saída</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Nova Regra
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {mockSchedules.map((schedule) => (
          <div key={schedule.id} className="bg-card rounded-lg border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{schedule.name}</h3>
              <button className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                schedule.type === "Entrada" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
              }`}>
                {schedule.type}
              </span>
              {schedule.notify && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-info/15 text-info">
                  Notifica WhatsApp
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> {schedule.start} — {schedule.end}
              </span>
              <span>Tolerância: {schedule.tolerance}min</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
