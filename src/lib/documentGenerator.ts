import jsPDF from "jspdf";
import "jspdf-autotable";

export const generateDeclarationPDF = (student: any, schoolName: string = "CETI NOVA ITARANA") => {
    // A4 Size (210 x 297 mm)
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 20;

    // Header Background
    doc.setFillColor(30, 41, 59); // Tailwind Slate 800
    doc.rect(0, 0, pageWidth, 40, "F");

    // Headings
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("DECLARAÇÃO DE MATRÍCULA", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(schoolName, pageWidth / 2, 28, { align: "center" });

    // Body Text
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);

    const today = new Date();
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        day: 'numeric', month: 'long', year: 'numeric'
    }).format(today);

    // Dynamic Content
    const contentText = `Declaramos para os devidos fins que o(a) aluno(a) ${student.name.toUpperCase()}, portador(a) da matrícula ${student.enrollment}, encontra-se regularmente matriculado(a) e frequentando as aulas neste estabelecimento de ensino, no ano letivo de ${today.getFullYear()}.`;

    const contextInfo = `Série/Ano: ${student.series} \nTurma: ${student.class} \nModalidade: ${student.modality === 'integral' ? 'Ensino Integral' : 'Ensino Técnico'}\nSituação: ${student.active ? 'Ativo' : 'Inativo'}`;

    // Justify text block
    const splitText = doc.splitTextToSize(contentText, pageWidth - (marginX * 2));
    doc.text(splitText, marginX, 70);

    // Info Box
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.roundedRect(marginX, 110, pageWidth - (marginX * 2), 40, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DADOS ACADÊMICOS", marginX + 5, 120);

    doc.setFont("helvetica", "normal");
    doc.text(contextInfo, marginX + 5, 130);

    // Signature Area
    const signatureY = 220;
    doc.line(pageWidth / 2 - 40, signatureY, pageWidth / 2 + 40, signatureY);
    doc.setFont("helvetica", "bold");
    doc.text("Direção Escolar", pageWidth / 2, signatureY + 8, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(schoolName, pageWidth / 2, signatureY + 14, { align: "center" });
    doc.text(`Emitido em: ${formattedDate}`, pageWidth / 2, signatureY + 20, { align: "center" });

    // Footer/Authenticity
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const authCode = Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + new Date().getTime().toString().slice(-4);
    doc.text(`Código de Autenticidade: ${authCode}`, marginX, pageHeight - 15);
    doc.text("Documento gerado eletronicamente pelo Sistema CETI Digital.", marginX, pageHeight - 10);

    // Trigger Download
    const fileName = `Declaracao_${student.name.replace(/\s+/g, '_')}_${today.getFullYear()}.pdf`;
    doc.save(fileName);
};

export const generateMassBadgesPDF = async (students: any[], className: string) => {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    const badgeWidth = 85;
    const badgeHeight = 55;
    const margin = 10;
    const gap = 5;

    let currentX = margin;
    let currentY = margin;
    let count = 0;

    for (const student of students) {
        if (count > 0 && count % 10 === 0) {
            doc.addPage();
            currentX = margin;
            currentY = margin;
        }

        // Draw Badge Border/Background
        doc.setDrawColor(30, 41, 59);
        doc.setLineWidth(0.5);
        doc.roundedRect(currentX, currentY, badgeWidth, badgeHeight, 3, 3, "S");

        // Header Section
        doc.setFillColor(30, 41, 59);
        doc.rect(currentX, currentY, badgeWidth, 15, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("CETI NOVA ITARANA", currentX + 5, currentY + 7);
        doc.setFontSize(6);
        doc.setTextColor(250, 204, 21); // Yellow 400
        doc.text("IDENTIDADE ESTUDANTIL 2026", currentX + 5, currentY + 11);

        // Student Content
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        const nameLines = doc.splitTextToSize(student.name.toUpperCase(), badgeWidth - 40);
        doc.text(nameLines, currentX + 5, currentY + 25);

        doc.setFontSize(7);
        doc.setTextColor(21, 128, 61); // Green 700
        doc.text(`${student.series} • Turma ${student.class}`, currentX + 5, currentY + 35);

        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text(`MATRÍCULA: ${student.enrollment || '---'}`, currentX + 5, currentY + 40);

        // QR Code (using API)
        try {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(student.qr_code)}`;
            // We use a trick here: jsPDF can handle images if they are preloaded or as base64.
            // For simplicity in a bulk export, we'll try to use the image add functionality.
            // Note: In some environments image loading might be async.
            doc.addImage(qrUrl, 'PNG', currentX + badgeWidth - 25, currentY + 20, 20, 20);
        } catch (e) {
            doc.text("[QR CODE]", currentX + badgeWidth - 20, currentY + 30);
        }

        // Footer of badge
        doc.setFontSize(5);
        doc.setTextColor(150, 150, 150);
        doc.text("VÁLIDO EM TODO TERRITÓRIO NACIONAL", currentX + badgeWidth / 2, currentY + badgeHeight - 3, { align: "center" });

        // Update positions for next badge
        count++;
        if (count % 2 === 0) {
            currentX = margin;
            currentY += badgeHeight + gap;
        } else {
            currentX += badgeWidth + gap;
        }
    }

    doc.save(`Carteirinhas_Turma_${className}.pdf`);
};
