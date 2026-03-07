import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MANUAL_ASSETS } from "./manualAssets";

// ==================== PREMIUM DESIGN SYSTEM ====================
const COLORS = {
  primary: [23, 84, 248] as [number, number, number],      // #1754F8
  secondary: [15, 23, 42] as [number, number, number],    // Slate 900
  accent: [22, 163, 74] as [number, number, number],       // Green
  info: [14, 165, 233] as [number, number, number],       // Sky Blue
  warning: [245, 158, 11] as [number, number, number],    // Amber
  danger: [239, 68, 68] as [number, number, number],      // Rose
  bg: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - (MARGIN * 2);

// ==================== LAYOUT ENGINE ====================
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

  // School Logo in Header
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

  // School Name Badge
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
  doc.text(`CETI Digital — Manual de Operações • v${new Date().getFullYear()}.2 • CONFIDENCIAL`, MARGIN, PAGE_H - 10);
  doc.text(`Página ${pageNum}`, PAGE_W - MARGIN, PAGE_H - 10, { align: "right" });
}

function newPage(doc: jsPDF, title: string, subtitle: string, page: { val: number }): number {
  doc.addPage();
  page.val++;
  addHeader(doc, title, subtitle);
  addFooter(doc, page.val);
  return 55;
}

function checkPage(doc: jsPDF, y: number, needed: number, title: string, subtitle: string, page: { val: number }): number {
  if (y + needed > PAGE_H - 25) {
    return newPage(doc, title, subtitle, page);
  }
  return y;
}

// ==================== COMPONENTS ====================
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

function printBody(doc: jsPDF, y: number, text: string): number {
  doc.setTextColor(...COLORS.secondary);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, CONTENT_W);
  doc.text(lines, MARGIN, y);
  return y + (lines.length * 5) + 6;
}

function printDetailedBody(doc: jsPDF, y: number, text: string): number {
  doc.setTextColor(...COLORS.secondary);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setLineHeightFactor(1.5);
  const lines = doc.splitTextToSize(text, CONTENT_W);
  doc.text(lines, MARGIN, y);
  doc.setLineHeightFactor(1.15);
  return y + (lines.length * 5.5) + 6;
}

function printModuleBox(doc: jsPDF, y: number, title: string, items: string[]): number {
  const boxHeight = (items.length * 6) + 15;
  doc.setFillColor(...COLORS.bg);
  doc.roundedRect(MARGIN, y, CONTENT_W, boxHeight, 5, 5, "F");

  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(title, MARGIN + 5, y + 8);

  doc.setTextColor(...COLORS.secondary);
  doc.setFont("helvetica", "normal");
  items.forEach((item, i) => {
    doc.setFillColor(...COLORS.primary);
    doc.circle(MARGIN + 8, y + 16 + (i * 6) - 1, 1, "F");
    doc.text(item, MARGIN + 12, y + 16 + (i * 6));
  });

  return y + boxHeight + 8;
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
    doc.text("[Imagem não carregada]", PAGE_W / 2, y + 30, { align: "center" });
  }

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "italic");
  doc.text(caption, PAGE_W / 2, y + imgH + 8, { align: "center" });

  return y + imgH + 25;
}

function printProTip(doc: jsPDF, y: number, text: string, type: "info" | "warning" | "danger" = "info"): number {
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
  doc.text(type === "warning" ? "ATENÇÃO" : type === "danger" ? "CRÍTICO" : "DICA PRO", MARGIN + 10, y + 7);

  doc.setTextColor(...COLORS.secondary);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(lines, MARGIN + 10, y + 13);

  return y + h + 8;
}

// ==================== CONTENT GENERATORS ====================
function generateCover(doc: jsPDF, title: string, subtitle: string) {
  // Full screen background accent
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_W, PAGE_H / 2.2, "F");

  // Decorative Geometry
  doc.setFillColor(255, 255, 255);
  try {
    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
    doc.circle(0, 0, 100, "F");
    doc.circle(PAGE_W, PAGE_H / 2, 80, "F");
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
  } catch (e) { }

  // Real School Logo
  try {
    doc.addImage(MANUAL_ASSETS.logo, "PNG", PAGE_W / 2 - 20, 25, 40, 40);
  } catch (e) { }

  // Titles
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text("CETI NOVA ITARANA", PAGE_W / 2, 85, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("TECNOLOGIA A SERVIÇO DA EDUCAÇÃO BRASILEIRA", PAGE_W / 2, 95, { align: "center" });

  // Main Manual Box
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
  const subLines = doc.splitTextToSize(subtitle, CONTENT_W - 40);
  doc.text(subLines, PAGE_W / 2, PAGE_H / 2 + 30, { align: "center" });

  // Bottom Branding
  doc.setTextColor(...COLORS.secondary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CETI DIGITAL v2.0", PAGE_W / 2, PAGE_H - 40, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(`Expedido em Março de ${new Date().getFullYear()}`, PAGE_W / 2, PAGE_H - 34, { align: "center" });
}

// ==================== EXPORTS ====================
export function generateUserGuidePDF() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const page = { val: 1 };
  const T = "GUIA MASTER";
  const S = "MANUAL TÉCNICO E ESTRATÉGICO PARA ADMINISTRADORES";

  generateCover(doc, "MANUAL MESTRE", "Este guia contém os protocolos críticos e a lógica operacional do ecossistema CETI Digital. Uso exclusivo da Diretoria e Coordenação Geral.");

  // --- INTRODUÇÃO ---
  let y = newPage(doc, T, S, page);
  y = printDisplayTitle(doc, y, "01", "Visão Geral do Ecossistema");
  y = printDetailedBody(doc, y, "O CETI Digital foi arquitetado para ser o sistema nervoso central da unidade escolar. Sua lógica não se baseia apenas em registros, mas em validação em tempo real de fluxos e análise preditiva de comportamento discente. Cada interação no portão ou na coordenação alimenta uma base de dados unificada.");

  y = printIllustration(doc, y, "dashboard", "Figura 1.1: Interface de monitoramento estratégico unificado.");

  y = printSectionHeading(doc, y, "Gestão Baseada em Evidências");
  y = printDetailedBody(doc, y, "Diferente de sistemas legados, aqui as decisões são disparadas por triggers automáticos. Uma falta registrada no portão aciona imediatamente a engine de notificação para os pais e atualiza o termômetro de risco do aluno.");

  y = printProTip(doc, y, "Para um desempenho máximo no Dashboard, recomendamos processar os alertas logo na primeira hora da manhã. O sistema prioriza eventos recentes para facilitar a triagem.");

  // --- ANALYTICS ---
  y = newPage(doc, T, S, page);
  y = printDisplayTitle(doc, y, "02", "Analytics e Business Intelligence");
  y = printDetailedBody(doc, y, "O motor de Analytics do sistema (representado no gráfico acima) processa três KPIs fundamentais que o administrador deve monitorar semanalmente:");

  autoTable(doc, {
    startY: y,
    head: [['KPI', 'Lógica de Cálculo', 'Ação Estratégica']],
    body: [
      ['Flow Efficiency', 'Proporção entre scans válidos vs exceções manuais.', 'Treinamento de portaria se < 90%'],
      ['Student Risk Score', 'Ponderação de faltas recorrentes e ocorrências.', 'Intervenção pedagógica imediata'],
      ['Peak Load Hour', 'Identificação de gargalos de tempo no portão.', 'Otimização de escalas de apoio'],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary }
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  y = printSectionHeading(doc, y, "Termômetro de Risco");
  y = printDetailedBody(doc, y, "O algoritmo calcula o 'nível de calor' de cada aluno. Alunos em 'Estado Crítico' são aqueles com mais de 3 ocorrências ativas ou 5 faltas injustificadas. O sistema os coloca no topo da sua lista de alertas automaticamente.");

  // --- PORTARIA ---
  y = newPage(doc, T, S, page);
  y = printDisplayTitle(doc, y, "03", "Portaria Inteligente (Gatekeeper)");
  y = printDetailedBody(doc, y, "O módulo de portaria integra hardware (câmera/scanner) e software de segurança. Ao escanear um QR Code, o sistema realiza as seguintes validações em < 500ms:");

  y = printModuleBox(doc, y, "Pipeline de Validação", [
    "Status de Matrícula: Identifica se o aluno está ativo.",
    "Grade de Horários: Valida se é o momento permitido de entrada/saída.",
    "Alertas Médicos: Exibe restrições de saúde instantaneamente.",
    "Exceções de Saída: Verifica se há autorização prévia da coordenação."
  ]);

  y = printIllustration(doc, y, "gate", "Figura 2.1: Terminal de controle de acesso otimizado para scanners móveis.");

  y = printProTip(doc, y, "Em caso de falha de conexão, o sistema entra em Modo Offline. Os dados ficam em cache local e são sincronizados com o Supabase assim que o sinal retorna.", "warning");

  // --- GESTÃO DISCIPLINAR ---
  y = newPage(doc, T, S, page);
  y = printDisplayTitle(doc, y, "04", "Protocolos Disciplinares");
  y = printDetailedBody(doc, y, "As ocorrências são a materialização jurídica do acompanhamento escolar. O sistema gera documentos com validade administrativa.");

  y = printIllustration(doc, y, "report", "Figura 3.1: Modelo de relatório disciplinar assinado digitalmente.");

  y = printSectionHeading(doc, y, "Fluxo de Formalização");
  y = printDetailedBody(doc, y, "1. Registro: O fato é narrado com tags de categoria.\n2. Notificação: O responsável recebe um resumo via WhatsApp/Portal.\n3. PDF Oficial: Um termo é gerado com QR Code de autenticidade para assinatura física quando necessário.");

  y = printProTip(doc, y, "Nunca delete uma ocorrência por erro. O sistema mantém logs de auditoria. Use a função 'Arquivar' para manter o histórico íntegro.", "danger");

  doc.save(`MASTER_GUIDE_CETI_DIGITAL_${new Date().getFullYear()}.pdf`);
}

export function generateGatekeeperGuidePDF() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const page = { val: 1 };
  const T = "GUIA DO PORTEIRO";
  const S = "MANUAL DE PROCEDIMENTOS E SEGURANÇA DE ACESSO";

  generateCover(doc, "GUIA PORTARIA", "Instruções críticas para o controle de fluxo e segurança das entradas e saídas.");

  let y = newPage(doc, T, S, page);
  y = printDisplayTitle(doc, y, "01", "Operação do Scanner");
  y = printDetailedBody(doc, y, "O scanner é o ponto de entrada de todos os dados do sistema. O porteiro deve assegurar que cada aluno passe individualmente pelo controle.");

  y = printIllustration(doc, y, "gate", "Visão correta do terminal de leitura.");

  y = printSectionHeading(doc, y, "Entendendo os Retornos");
  autoTable(doc, {
    startY: y,
    head: [['Visual', 'Status', 'Procedimento']],
    body: [
      ['Bip Verde', 'LIBERADO', 'Permitir entrada/saída'],
      ['Bip Amarelo', 'ATRASO', 'Avisar que está fora do horário'],
      ['Bip Vermelho', 'BLOQUEADO', 'Encaminhar à coordenação'],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.accent }
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  y = printProTip(doc, y, "Se o QR Code estiver danificado, use a 'Busca Manual' inserindo o nome ou matrícula do aluno.", "info");

  doc.save(`GUIA_PORTARIA_CETI_${new Date().getFullYear()}.pdf`);
}

export function generateCoordinationGuidePDF() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const page = { val: 1 };
  const T = "GUIA DA COORDENAÇÃO";
  const S = "MANUAL DE GESTÃO PEDAGÓGICA E DISCIPLINAR";

  generateCover(doc, "GUIA COORDENAÇÃO", "Ferramentas para o acompanhamento da vida escolar e intervenção pedagógica.");

  let y = newPage(doc, T, S, page);
  y = printDisplayTitle(doc, y, "01", "Tratamento de Alertas");
  y = printDetailedBody(doc, y, "Sua tela principal é o Dashboard de Alertas. O sistema sinaliza automaticamente quando um aluno se torna uma 'anomalia' no fluxo escolar.");

  y = printIllustration(doc, y, "dashboard", "Dashboard de análise de risco e frequência.");

  y = printSectionHeading(doc, y, "Ocorrências e Família");
  y = printDetailedBody(doc, y, "Ao registrar uma ocorrência, certifique-se de ser o mais descritivo possível. O texto inserido aqui é o que será enviado para o WhatsApp dos pais.");

  y = printIllustration(doc, y, "report", "Gestão de formulários e relatórios.");

  y = printProTip(doc, y, "Aprovar justificativas rápidas aumenta a confiança dos pais no sistema. Tente revisar o portal de justificativas pelo menos duas vezes ao dia.", "info");

  doc.save(`GUIA_COORDENACAO_CETI_${new Date().getFullYear()}.pdf`);
}
