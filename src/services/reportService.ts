import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

export const reportService = {
    /**
     * Generates a monthly PDF report for a specific student.
     */
    generateMonthlyReport: async (studentId: string, month: number, year: number) => {
        // 1. Fetch Student Data
        const { data: student } = await supabase
            .from("students")
            .select("*")
            .eq("id", studentId)
            .single();

        if (!student) throw new Error("Estudante não encontrado.");

        // 2. Fetch Movements for the Month
        const startDate = new Date(year, month, 1).toISOString();
        const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

        const { data: movements } = await supabase
            .from("movements")
            .select("*")
            .eq("student_id", studentId)
            .gte("registered_at", startDate)
            .lte("registered_at", endDate)
            .order("registered_at", { ascending: true });

        // 3. Create PDF
        const doc = new jsPDF();
        const dateStr = format(new Date(year, month), "MMMM 'de' yyyy", { locale: ptBR });

        // Header
        doc.setFontSize(20);
        doc.setTextColor(0, 82, 204);
        doc.text("CETI DIGITAL", 105, 20, { align: "center" });

        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text(`Relatório Mensal de Frequência e Acessos`, 105, 30, { align: "center" });
        doc.text(dateStr.toUpperCase(), 105, 38, { align: "center" });

        // Student Info
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text(`Aluno: ${student.name}`, 20, 50);
        doc.text(`Série/Turma: ${student.series} ${student.class}`, 20, 56);
        doc.text(`Matrícula: ${student.enrollment}`, 20, 62);

        // Table
        const tableData = (movements || []).map(m => [
            format(new Date(m.registered_at), "dd/MM HH:mm"),
            m.type === "entry" ? "Entrada (Atraso/Retorno)" : "Saída (Intervalo/Antecipada)",
            (m as any).observation || "Registro Regular"
        ]);

        autoTable(doc, {
            startY: 70,
            head: [["Data/Hora", "Tipo de Movimentação", "Observação"]],
            body: tableData,
            theme: "striped",
            headStyles: { fillColor: [0, 82, 204] },
            margin: { top: 70 }
        });

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 20, 285);
            doc.text(`Página ${i} de ${pageCount}`, 190, 285, { align: "right" });
        }

        return doc;
    },

    /**
     * Helper to download the PDF in browser
     */
    downloadReport: async (studentId: string, month: number, year: number) => {
        const doc = await reportService.generateMonthlyReport(studentId, month, year);
        doc.save(`relatorio_${studentId}_${month + 1}_${year}.pdf`);
    }
};
