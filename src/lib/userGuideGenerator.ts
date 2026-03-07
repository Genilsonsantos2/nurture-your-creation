import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MANUAL_ASSETS } from "./manualAssets";

// ==================== SISTEMA DE DESIGN PREMIUM ====================
const COLORS = {
  primary: [23, 84, 248] as [number, number, number],      // #1754F8 (Azul Sistema)
  secondary: [15, 23, 42] as [number, number, number],    // Slate 900
  accent: [22, 163, 74] as [number, number, number],       // Green (Sucesso)
  info: [14, 165, 233] as [number, number, number],       // Sky Blue
  warning: [245, 158, 11] as [number, number, number],    // Amber (Atenção)
  danger: [239, 68, 68] as [number, number, number],      // Rose (Crítico)
  bg: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - (MARGIN * 2);

// ==================== ENGINE de LAYOUT ====================
function drawFullBleedHeader(doc: jsPDF, accent: [number, number, number] = COLORS.primary) {
  doc.setFillColor(...accent);
  doc.rect(0, 0, PAGE_W, 40, "F");
  doc.setFillColor(255, 255, 255);
  try {
    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
    doc.circle(PAGE_W, 0, 60, "F");
    doc.circle(20, 10, 30, "F");
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
  } catch (e) {
    console.warn("GState not supported", e);
  }
}

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  drawFullBleedHeader(doc);

  // Logotipo Real da Escola no Cabeçalho
  try {
    doc.addImage(MANUAL_ASSETS.logo, "PNG", MARGIN, 8, 12, 12);
  } catch (e) { }

  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, MARGIN + 16, 16);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, MARGIN + 16, 24);

  // Badge da Escola
  doc.setFillColor(255, 255, 255);
  try {
    doc.setGState(new (doc as any).GState({ opacity: 0.15 }));
    doc.roundedRect(PAGE_W - 65, 10, 50, 20, 5, 5, "F");
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
  } catch (e) {
    doc.roundedRect(PAGE_W - 65, 10, 50, 20, 5, 5, "S");
  }
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CETI NOVA ITARANA", PAGE_W - 40, 21.5, { align: "center" });
}

function addFooter(doc: jsPDF, pageNum: number) {
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, PAGE_H - 15, PAGE_W - MARGIN, PAGE_H - 15);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text(`CETI Digital — Manual de Uso Prático • v${new Date().getFullYear()} • CONFIDENCIAL`, MARGIN, PAGE_H - 10);
  doc.text(`Página ${pageNum}`, PAGE_W - MARGIN, PAGE_H - 10, { align: "right" });
}

function newPage(doc: jsPDF, title: string, subtitle: string, page: { val: number }): number {
  doc.addPage();
  page.val++;
  addHeader(doc, title, subtitle);
  addFooter(doc, page.val);
  return 55;
}

// ==================== COMPONENTES VISUAIS ====================
function printDisplayTitle(doc: jsPDF, y: number, num: string, title: string): number {
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(MARGIN, y, 12, 12, 3, 3, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(num, MARGIN + 6, y + 7.5, { align: "center" });

  doc.setTextColor(...COLORS.secondary);
  doc.setFontSize(18);
  doc.text(title, MARGIN + 18, y + 9);

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(1);
  doc.line(MARGIN + 18, y + 14, MARGIN + 60, y + 14);

  return y + 25;
}

function printSectionHeading(doc: jsPDF, y: number, text: string): number {
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(text.toUpperCase(), MARGIN, y);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y + 3, PAGE_W - MARGIN, y + 3);
  return y + 12;
}

function printPracticalSteps(doc: jsPDF, y: number, steps: string[]): number {
  doc.setTextColor(...COLORS.secondary);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  let currentY = y;
  steps.forEach((step, i) => {
    // Number circle
    doc.setFillColor(...COLORS.bg);
    doc.circle(MARGIN + 4, currentY + 1, 4, "F");
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text((i + 1).toString(), MARGIN + 4, currentY + 2.5, { align: "center" });

    // Step text
    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(step, CONTENT_W - 15);
    doc.text(lines, MARGIN + 12, currentY + 2);
    currentY += (lines.length * 5) + 6;
  });

  return currentY;
}

function printBodyText(doc: jsPDF, y: number, text: string): number {
  doc.setTextColor(...COLORS.secondary);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, CONTENT_W);
  doc.text(lines, MARGIN, y);
  return y + (lines.length * 5) + 6;
}

function printIllustration(doc: jsPDF, y: number, imageKey: keyof typeof MANUAL_ASSETS, caption: string): number {
  const imgW = 120;
  const imgH = 68;
  const x = (PAGE_W - imgW) / 2;

  doc.setFillColor(...COLORS.bg);
  doc.roundedRect(x - 5, y - 5, imgW + 10, imgH + 20, 8, 8, "F");

  try {
    doc.addImage(MANUAL_ASSETS[imageKey], "PNG", x, y, imgW, imgH);
  } catch (e) {
    doc.text("[Imagem não disponível]", PAGE_W / 2, y + 30, { align: "center" });
  }

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "italic");
  doc.text(caption, PAGE_W / 2, y + imgH + 8, { align: "center" });

  return y + imgH + 25;
}

function printQuickTip(doc: jsPDF, y: number, text: string, type: "info" | "warning" | "danger" = "info"): number {
  const colors = {
    info: { main: COLORS.info, bg: [224, 242, 254] },
    warning: { main: COLORS.warning, bg: [254, 243, 199] },
    danger: { main: COLORS.danger, bg: [254, 226, 226] }
  };
  const c = colors[type];

  const lines = doc.splitTextToSize(text, CONTENT_W - 25);
  const h = (lines.length * 5) + 12;

  doc.setFillColor(...(c.bg as [number, number, number]));
  doc.roundedRect(MARGIN, y, CONTENT_W, h, 4, 4, "F");
  doc.setFillColor(...(c.main as [number, number, number]));
  doc.roundedRect(MARGIN, y, 5, h, 3, 0, "F");

  doc.setTextColor(...(c.main as [number, number, number]));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(type === "warning" ? "ATENÇÃO" : type === "danger" ? "IMPORTANTE" : "DICA ÚTIL", MARGIN + 10, y + 7);

  doc.setTextColor(...COLORS.secondary);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(lines, MARGIN + 10, y + 13);

  return y + h + 8;
}

// ==================== CAPA ====================
function generateCover(doc: jsPDF, title: string, description: string) {
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_W, PAGE_H / 2.2, "F");

  doc.setFillColor(255, 255, 255);
  try {
    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
    doc.circle(0, 0, 100, "F");
    doc.circle(PAGE_W, PAGE_H / 2, 80, "F");
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
  } catch (e) { }

  try {
    doc.addImage(MANUAL_ASSETS.logo, "PNG", PAGE_W / 2 - 20, 25, 40, 40);
  } catch (e) { }

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text("CETI DIGITAL", PAGE_W / 2, 85, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("MANUAL PRÁTICO DE TREINAMENTO", PAGE_W / 2, 95, { align: "center" });

  doc.setFillColor(...COLORS.white);
  doc.roundedRect(MARGIN + 10, PAGE_H / 2 - 20, CONTENT_W - 20, 80, 8, 8, "F");
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.roundedRect(MARGIN + 10, PAGE_H / 2 - 20, CONTENT_W - 20, 80, 8, 8, "S");

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(title, PAGE_W / 2, PAGE_H / 2 + 15, { align: "center" });

  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const subLines = doc.splitTextToSize(description, CONTENT_W - 40);
  doc.text(subLines, PAGE_W / 2, PAGE_H / 2 + 30, { align: "center" });

  doc.setTextColor(...COLORS.secondary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CETI DIGITAL v2.0 • 2026", PAGE_W / 2, PAGE_H - 40, { align: "center" });
}

// ==================== GUIA DO PORTEIRO ====================
export function generateGatekeeperGuidePDF() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const page = { val: 1 };
  const T = "GUIA DO PORTEIRO";
  const S = "TUTORIAL PASSO A PASSO PARA CONTROLE DE ACESSO";

  generateCover(doc, "GUIA PORTARIA", "Como registrar a entrada e saída de alunos com rapidez e segurança.");

  let y = newPage(doc, T, S, page);
  y = printDisplayTitle(doc, y, "01", "Como Registrar Alunos");
  y = printBodyText(doc, y, "O scanner da portaria é a ferramenta principal. Siga estes passos para um registro perfeito:");

  y = printPracticalSteps(doc, y, [
    "Aponte a câmera para o QR Code do cartão do aluno.",
    "Mantenha o celular estável e a cerca de 15cm do código.",
    "Aguarde o BIP de confirmação e a foto do aluno aparecer na tela.",
    "Clique no botão verde 'ENTRADA' ou azul 'SAÍDA' conforme a ação.",
    "O sistema confirmará o registro com um aviso no topo da tela."
  ]);

  y = printIllustration(doc, y, "gate", "Dica: Enquadre o QR Code dentro do quadrado azul na tela.");

  y = printSectionHeading(doc, y, "Entendendo os Sons e Avisos");
  autoTable(doc, {
    startY: y,
    head: [['Ação', 'Som', 'O que significa?']],
    body: [
      ['Scan Inicial', 'Bip Curto', 'Aluno identificado, escolha a ação.'],
      ['Botão Entrada', 'Bip Suave', 'Entrada confirmada com sucesso.'],
      ['Botão Saída', 'Bip Diferente', 'Saída confirmada com sucesso.'],
      ['Erro/Falha', 'Bip Agudo', 'Algo deu errado ou QR Code não reconhecido.'],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary }
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  y = printQuickTip(doc, y, "Se o QR Code estiver apagado ou o aluno esqueceu o cartão, você pode digitar o nome dele na barra de 'Busca Manual' na parte de baixo da tela.", "info");

  doc.save(`GUIA_PORTARIA_CETI_${new Date().getFullYear()}.pdf`);
}

// ==================== GUIA DA COORDENAÇÃO ====================
export function generateCoordinationGuidePDF() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const page = { val: 1 };
  const T = "GUIA DA COORDENAÇÃO";
  const S = "MANUAL DE OCORRÊNCIAS E GESTÃO PEDAGÓGICA";

  generateCover(doc, "GUIA COORDENAÇÃO", "Como gerenciar comportamentos, faltas e comunicação com os pais.");

  let y = newPage(doc, T, S, page);
  y = printDisplayTitle(doc, y, "01", "Registrando Ocorrências");
  y = printBodyText(doc, y, "As ocorrências são enviadas para os pais. Seja claro e objetivo:");

  y = printPracticalSteps(doc, y, [
    "No menu lateral, clique em 'Ocorrências'.",
    "Busque pelo nome do aluno no campo de pesquisa.",
    "Escolha o tipo (Atraso, Comportamento, Sem Farda, etc).",
    "Escreva um breve resumo do que aconteceu.",
    "Clique em 'Salvar' para enviar a notificação para a família."
  ]);

  y = printIllustration(doc, y, "report", "Relatórios disciplinares oficiais com validade pedagógica.");

  y = printSectionHeading(doc, y, "Justificativas de Faltas");
  y = printBodyText(doc, y, "Sempre que um pai enviar uma foto de atestado pelo portal, você receberá um alerta. Basta clicar no alerta, ver a foto e clicar em 'APROVAR' para que a falta não conte negativamente para o aluno.");

  y = printQuickTip(doc, y, "Mantenha o Dashboard aberto. Ele mostra em tempo real quais alunos estão com muitas faltas seguidas para que você possa ligar para a família.", "warning");

  doc.save(`GUIA_COORDENACAO_CETI_${new Date().getFullYear()}.pdf`);
}

// ==================== GUIA MASTER (ADMIN) ====================
export function generateUserGuidePDF() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const page = { val: 1 };
  const T = "GUIA MASTER (ADMIN)";
  const S = "GERENCIAMENTO COMPLETO DO SISTEMA";

  generateCover(doc, "MANUAL MESTRE", "Configurações de horários, turmas e análise de relatórios completos.");

  let y = newPage(doc, T, S, page);
  y = printDisplayTitle(doc, y, "01", "Configuração de Horários");
  y = printBodyText(doc, y, "O sistema só funciona corretamente se os horários estiverem certos:");

  y = printPracticalSteps(doc, y, [
    "Vá em 'Configurações' -> 'Horários'.",
    "Defina o horário de entrada e a tolerância permitida.",
    "Configure os dias da semana em que há aula.",
    "Salve as alterações para atualizar as portarias instantaneamente."
  ]);

  y = printIllustration(doc, y, "dashboard", "Dashboard Master: Resumo de toda a escola em uma única tela.");

  y = printSectionHeading(doc, y, "Análise de Relatórios");
  y = printBodyText(doc, y, "Você pode baixar listas de presença em PDF e Excel. Use os filtros de 'Série' e 'Período' para gerar exatamente o que a Secretaria precisa.");

  y = printQuickTip(doc, y, "NUNCA compartilhe sua senha de administrador. Use o sistema de auditoria para saber quem registrou cada entrada e saída.", "danger");

  doc.save(`MASTER_GUIDE_CETI_DIGITAL_${new Date().getFullYear()}.pdf`);
}
