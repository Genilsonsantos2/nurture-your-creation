export interface CalendarEvent {
    date: string;
    description: string;
    type: "holiday" | "recess" | "non_school_day" | "school_saturday";
}

export const SCHOOL_CALENDAR_2026: CalendarEvent[] = [
    // Janeiro
    { date: "2026-01-01", description: "Ano Novo", type: "holiday" },

    // Fevereiro
    { date: "2026-02-02", description: "Jornada Pedagógica", type: "non_school_day" },
    { date: "2026-02-03", description: "Jornada Pedagógica", type: "non_school_day" },
    { date: "2026-02-04", description: "Jornada Pedagógica", type: "non_school_day" },
    { date: "2026-02-05", description: "Jornada Pedagógica", type: "non_school_day" },
    { date: "2026-02-12", description: "Recesso Carnaval", type: "recess" },
    { date: "2026-02-13", description: "Recesso Carnaval", type: "recess" },
    { date: "2026-02-14", description: "Recesso Carnaval", type: "recess" },
    { date: "2026-02-15", description: "Recesso Carnaval", type: "recess" },
    { date: "2026-02-16", description: "Recesso Carnaval", type: "recess" },
    { date: "2026-02-17", description: "Carnaval", type: "holiday" },
    { date: "2026-02-18", description: "Cinzas (Recesso)", type: "recess" },

    // Abril
    { date: "2026-04-02", description: "Dia não letivo", type: "non_school_day" },
    { date: "2026-04-03", description: "Sexta-feira Santa", type: "holiday" },
    { date: "2026-04-05", description: "Páscoa", type: "holiday" },
    { date: "2026-04-11", description: "Sábado Letivo", type: "school_saturday" },
    { date: "2026-04-21", description: "Tiradentes", type: "holiday" },

    // Maio
    { date: "2026-05-01", description: "Dia do Trabalho", type: "holiday" },

    // Junho
    { date: "2026-06-04", description: "Corpus Christi", type: "holiday" },
    { date: "2026-06-13", description: "Sábado Letivo", type: "school_saturday" },
    { date: "2026-06-22", description: "Recesso Junino", type: "recess" },
    { date: "2026-06-23", description: "Recesso Junino", type: "recess" },
    { date: "2026-06-24", description: "São João", type: "holiday" },
    { date: "2026-06-25", description: "Recesso Junino", type: "recess" },
    { date: "2026-06-26", description: "Recesso Junino", type: "recess" },
    { date: "2026-06-27", description: "Recesso Junino", type: "recess" },
    { date: "2026-06-28", description: "Recesso Junino", type: "recess" },
    { date: "2026-06-29", description: "Recesso Junino", type: "recess" },
    { date: "2026-06-30", description: "Recesso Junino", type: "recess" },

    // Julho
    { date: "2026-07-01", description: "Recesso Junino", type: "recess" },
    { date: "2026-07-02", description: "Independência da Bahia", type: "holiday" },
    { date: "2026-07-03", description: "Recesso Junino", type: "recess" },
    { date: "2026-07-18", description: "Sábado Letivo", type: "school_saturday" },

    // Agosto
    { date: "2026-08-15", description: "Sábado Letivo", type: "school_saturday" },

    // Setembro
    { date: "2026-09-07", description: "Independência do Brasil", type: "holiday" },
    { date: "2026-09-19", description: "Sábado Letivo", type: "school_saturday" },

    // Outubro
    { date: "2026-10-12", description: "Nsa. Sra. de Aparecida", type: "holiday" },
    { date: "2026-10-15", description: "Dia do Professor", type: "holiday" },
    { date: "2026-10-17", description: "Sábado Letivo", type: "school_saturday" },
    { date: "2026-10-28", description: "Servidor Público", type: "holiday" },

    // Novembro
    { date: "2026-11-02", description: "Finados", type: "holiday" },
    { date: "2026-11-15", description: "Proclamação da República", type: "holiday" },
    { date: "2026-11-20", description: "Dia de Zumbi", type: "holiday" },

    // Dezembro
    { date: "2026-12-25", description: "Natal", type: "holiday" },
];

export function isSchoolDay(date: Date): boolean {
    const dateStr = date.toISOString().split("T")[0];
    const event = SCHOOL_CALENDAR_2026.find((e) => e.date === dateStr);

    if (event) {
        return event.type === "school_saturday";
    }

    const day = date.getDay();
    return day !== 0 && day !== 6; // Seg-Sex
}

export function getLastNSchoolDays(n: number, fromDate: Date = new Date()): Date[] {
    const schoolDays: Date[] = [];
    let current = new Date(fromDate);
    current.setHours(0, 0, 0, 0);

    // We start from yesterday normally, or "today" if we want to check inclusions.
    // For absence risk, we check days BEFORE today.
    current.setDate(current.getDate() - 1);

    while (schoolDays.length < n) {
        if (isSchoolDay(new Date(current))) {
            schoolDays.push(new Date(current));
        }
        current.setDate(current.getDate() - 1);

        // Safety break to prevent infinite loops (e.g., searching too far in the past)
        if (schoolDays.length === 0 && current.getFullYear() < 2025) break;
    }

    return schoolDays;
}
