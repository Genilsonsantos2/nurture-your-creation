import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helper to load logo as base64 for jsPDF
async function loadLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch("/logo-cetini.jpeg");
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

// ==================== DESIGN TOKENS ====================
const C = {
  navy:      [15, 23, 42]   as [number, number, number],   // #0f172a
  slate:     [30, 41, 59]   as [number, number, number],   // #1e293b
  slateM:    [51, 65, 85]   as [number, number, number],   // #334155
  slateL:    [100, 116, 139] as [number, number, number],  // #64748b
  amber:     [217, 119, 6]  as [number, number, number],   // #d97706
  amberL:    [251, 191, 36] as [number, number, number],   // #fbbf24
  white:     [255, 255, 255] as [number, number, number],
  offWhite:  [248, 250, 252] as [number, number, number],  // #f8fafc
  grayBg:    [241, 245, 249] as [number, number, number],  // #f1f5f9
  border:    [226, 232, 240] as [number, number, number],  // #e2e8f0
  blue:      [37, 99, 235]  as [number, number, number],   // #2563eb
  blueL:     [219, 234, 254] as [number, number, number],  // #dbeafe
  green:     [22, 163, 74]  as [number, number, number],   // #16a34a
  greenL:    [220, 252, 231] as [number, number, number],  // #dcfce7
  red:       [220, 38, 38]  as [number, number, number],   // #dc2626
  redL:      [254, 226, 226] as [number, number, number],  // #fee2e2
  amberBg:   [255, 251, 235] as [number, number, number],  // #fffbeb
};

const PW = 210, PH = 297, ML = 22, MR = 22, CW = PW - ML - MR;
const FONT = "helvetica";

// ==================== HELPERS ====================
function setC(doc: jsPDF, c: [number, number, number]) { doc.setTextColor(...c); }
function setF(doc: jsPDF, c: [number, number, number]) { doc.setFillColor(...c); }

function pageChrome(doc: jsPDF, pageNum: number, title: string) {
  // Subtle off-white page background
  setF(doc, C.offWhite);
  doc.rect(0, 0, PW, PH, "F");

  // Navy header bar
  setF(doc, C.navy);
  doc.rect(0, 0, PW, 18, "F");

  // Amber accent line under header
  setF(doc, C.amber);
  doc.rect(0, 18, PW, 1.2, "F");

  // Header text — school name left, guide title right
  setC(doc, C.white);
  doc.setFont(FONT, "bold");
  doc.setFontSize(7);
  doc.text("CETINI Nova Itarana — Sistema de Controle de Acesso", ML, 11);
  setC(doc, C.amberL);
  doc.setFont(FONT, "normal");
  doc.setFontSize(7);
  doc.text(`${title} v2.0`, PW - MR, 11, { align: "right" });

  // Footer
  setF(doc, C.navy);
  doc.rect(0, PH - 12, PW, 12, "F");
  setF(doc, C.amber);
  doc.rect(0, PH - 12, PW, 1, "F");

  setC(doc, C.slateL);
  doc.setFont(FONT, "normal");
  doc.setFontSize(7);
  doc.text("CETINI — Colégio Estadual de Tempo Integral de Nova Itarana", ML, PH - 4);
  setC(doc, C.amberL);
  doc.text(String(pageNum), PW / 2, PH - 4, { align: "center" });
  setC(doc, C.slateL);
  doc.text("Nova Itarana, Bahia", PW - MR, PH - 4, { align: "right" });
}

function newPage(doc: jsPDF, p: { n: number }, title: string): number {
  doc.addPage();
  p.n++;
  pageChrome(doc, p.n, title);
  return 28;
}

function checkSpace(doc: jsPDF, y: number, need: number, p: { n: number }, t: string): number {
  return (y + need > PH - 20) ? newPage(doc, p, t) : y;
}

// ==================== COVER PAGE ====================
function drawCover(doc: jsPDF, title: string, subtitle: string, logo: string | null, accentLabel?: string) {
  // Full dark background
  setF(doc, C.navy);
  doc.rect(0, 0, PW, PH, "F");

  // Amber accent bar top
  setF(doc, C.amber);
  doc.rect(0, 0, PW, 5, "F");

  // Decorative circles (subtle)
  doc.setGState(doc.GState({ opacity: 0.03 }));
  setF(doc, C.white);
  doc.circle(PW - 30, 60, 80, "F");
  doc.circle(30, PH - 60, 60, "F");
  doc.setGState(doc.GState({ opacity: 1 }));

  // Logo
  if (logo) {
    try { doc.addImage(logo, "JPEG", PW / 2 - 18, 22, 36, 36); } catch {}
  }

  // School name block
  const nameY = logo ? 72 : 80;
  setC(doc, C.white);
  doc.setFont(FONT, "bold");
  doc.setFontSize(22);
  doc.text("Colégio Estadual de Tempo", PW / 2, nameY, { align: "center" });
  doc.text("Integral de Nova Itarana", PW / 2, nameY + 12, { align: "center" });

  // Amber subtitle
  setC(doc, C.amberL);
  doc.setFont(FONT, "normal");
  doc.setFontSize(11);
  doc.text("CETINI — Nova Itarana, Bahia", PW / 2, nameY + 26, { align: "center" });

  // Amber divider line
  doc.setDrawColor(...C.amber);
  doc.setLineWidth(0.8);
  doc.line(PW / 2 - 30, nameY + 34, PW / 2 + 30, nameY + 34);

  // Main title
  setC(doc, C.white);
  doc.setFont(FONT, "bold");
  doc.setFontSize(28);
  doc.text(title, PW / 2, nameY + 58, { align: "center" });

  // Subtitle
  setC(doc, C.amberL);
  doc.setFont(FONT, "normal");
  doc.setFontSize(12);
  const sl = doc.splitTextToSize(subtitle, CW - 20);
  doc.text(sl, PW / 2, nameY + 74, { align: "center" });

  // Accent label badge
  if (accentLabel) {
    const bw = 60, bh = 10;
    setF(doc, C.amber);
    doc.roundedRect(PW / 2 - bw / 2, nameY + 88, bw, bh, 3, 3, "F");
    setC(doc, C.navy);
    doc.setFont(FONT, "bold");
    doc.setFontSize(7);
    doc.text(accentLabel, PW / 2, nameY + 94.5, { align: "center" });
  }

  // Version footer
  setC(doc, C.slateL);
  doc.setFont(FONT, "normal");
  doc.setFontSize(9);
  doc.text("Versão 2.0  •  Março de 2026  •  Uso Interno", PW / 2, PH - 40, { align: "center" });

  // Bottom amber bar
  setF(doc, C.amber);
  doc.rect(0, PH - 5, PW, 5, "F");
}

// ==================== TABLE OF CONTENTS ====================
function drawTOC(doc: jsPDF, p: { n: number }, title: string, sections: { group: string; items: { num: number; title: string }[] }[]) {
  let y = newPage(doc, p, title);

  // Title
  setC(doc, C.navy);
  doc.setFont(FONT, "bold");
  doc.setFontSize(26);
  doc.text("Sumário", ML, y);

  // Amber underline
  doc.setDrawColor(...C.amber);
  doc.setLineWidth(1.5);
  doc.line(ML, y + 5, ML + 55, y + 5);
  y += 22;

  for (const sec of sections) {
    y = checkSpace(doc, y, 14, p, title);

    // Group label
    setC(doc, C.amber);
    doc.setFont(FONT, "bold");
    doc.setFontSize(8);
    doc.text(sec.group.toUpperCase(), ML, y);

    // Amber dot
    setF(doc, C.amber);
    doc.circle(ML - 4, y - 1.5, 1.5, "F");
    y += 8;

    for (const item of sec.items) {
      y = checkSpace(doc, y, 9, p, title);

      // Number badge
      setF(doc, C.navy);
      doc.roundedRect(ML, y - 5, 8, 7, 1.5, 1.5, "F");
      setC(doc, C.white);
      doc.setFont(FONT, "bold");
      doc.setFontSize(8);
      doc.text(String(item.num), ML + 4, y - 0.5, { align: "center" });

      // Title text
      setC(doc, C.slate);
      doc.setFont(FONT, "normal");
      doc.setFontSize(11);
      doc.text(item.title, ML + 13, y);

      // Dotted line
      const tw = doc.getTextWidth(item.title);
      doc.setDrawColor(...C.border);
      doc.setLineDashPattern([1, 2], 0);
      doc.setLineWidth(0.2);
      doc.line(ML + 14 + tw + 2, y - 1, PW - MR, y - 1);
      doc.setLineDashPattern([], 0);

      y += 9;
    }
    y += 5;
  }
}

// ==================== SECTION HEADER ====================
function sectionHeader(doc: jsPDF, y: number, num: string, title: string, subtitle: string): number {
  // Navy rounded badge
  setF(doc, C.navy);
  doc.roundedRect(ML, y, 16, 16, 3, 3, "F");
  setC(doc, C.white);
  doc.setFont(FONT, "bold");
  doc.setFontSize(13);
  doc.text(num, ML + 8, y + 11, { align: "center" });

  // Title
  setC(doc, C.navy);
  doc.setFontSize(18);
  doc.text(title, ML + 22, y + 7);

  // Subtitle
  setC(doc, C.slateL);
  doc.setFont(FONT, "normal");
  doc.setFontSize(9);
  doc.text(subtitle, ML + 22, y + 14);

  // Dashed divider
  doc.setDrawColor(...C.border);
  doc.setLineDashPattern([2, 2], 0);
  doc.setLineWidth(0.3);
  doc.line(ML, y + 22, PW - MR, y + 22);
  doc.setLineDashPattern([], 0);

  return y + 30;
}

// ==================== SUB HEADING ====================
function subHeading(doc: jsPDF, y: number, text: string): number {
  // Amber left bar
  setF(doc, C.amber);
  doc.rect(ML, y - 5, 3, 8, "F");

  setC(doc, C.navy);
  doc.setFont(FONT, "bold");
  doc.setFontSize(12);
  doc.text(text, ML + 8, y);
  return y + 10;
}

// ==================== TEXT ====================
function bodyText(doc: jsPDF, y: number, text: string): number {
  setC(doc, C.slateM);
  doc.setFont(FONT, "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, CW);
  doc.text(lines, ML, y);
  return y + lines.length * 4.5 + 4;
}

function boldText(doc: jsPDF, y: number, text: string): number {
  setC(doc, C.slate);
  doc.setFont(FONT, "bold");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, CW);
  doc.text(lines, ML, y);
  return y + lines.length * 4.5 + 4;
}

// ==================== NUMBERED STEPS ====================
function numberedSteps(doc: jsPDF, y: number, items: string[], p: { n: number }, t: string): number {
  for (let i = 0; i < items.length; i++) {
    y = checkSpace(doc, y, 14, p, t);

    // Circle badge
    setF(doc, C.navy);
    doc.circle(ML + 5, y, 4, "F");
    setC(doc, C.white);
    doc.setFont(FONT, "bold");
    doc.setFontSize(8);
    doc.text(String(i + 1), ML + 5, y + 1.5, { align: "center" });

    // Step text
    setC(doc, C.slateM);
    doc.setFont(FONT, "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(items[i], CW - 16);
    doc.text(lines, ML + 13, y + 1);
    y += lines.length * 4.5 + 5;
  }
  return y + 2;
}

// ==================== BULLET LIST ====================
function bulletList(doc: jsPDF, y: number, items: string[], p: { n: number }, t: string): number {
  for (const item of items) {
    y = checkSpace(doc, y, 10, p, t);
    setF(doc, C.amber);
    doc.circle(ML + 3, y - 1.5, 1.5, "F");
    setC(doc, C.slateM);
    doc.setFont(FONT, "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(item, CW - 12);
    doc.text(lines, ML + 9, y);
    y += lines.length * 4.5 + 3;
  }
  return y + 2;
}

// ==================== INFO BOX ====================
function infoBox(doc: jsPDF, y: number, title: string, text: string, type: "info" | "warning" | "danger" = "info"): number {
  const accent = type === "warning" ? C.amber : type === "danger" ? C.red : C.blue;
  const bg = type === "warning" ? C.amberBg : type === "danger" ? C.redL : C.blueL;
  const icon = type === "warning" ? "!" : type === "danger" ? "✕" : "i";

  const lines = doc.splitTextToSize(text, CW - 20);
  const h = Math.max(lines.length * 4 + 18, 28);

  // Background
  setF(doc, bg);
  doc.roundedRect(ML, y, CW, h, 3, 3, "F");

  // Left accent bar
  setF(doc, accent);
  doc.roundedRect(ML, y, 4, h, 2, 0, "F");
  doc.rect(ML + 2, y, 2, h, "F");

  // Icon circle
  setF(doc, accent);
  doc.circle(ML + 14, y + 9, 5, "F");
  setC(doc, C.white);
  doc.setFont(FONT, "bold");
  doc.setFontSize(8);
  doc.text(icon, ML + 14, y + 11, { align: "center" });

  // Title
  setC(doc, C.navy);
  doc.setFont(FONT, "bold");
  doc.setFontSize(10);
  doc.text(title, ML + 22, y + 11);

  // Body
  setC(doc, C.slateM);
  doc.setFont(FONT, "normal");
  doc.setFontSize(9);
  doc.text(lines, ML + 10, y + 19);

  return y + h + 6;
}

// ==================== TABLE ====================
function dataTable(doc: jsPDF, y: number, head: string[], rows: string[][]): number {
  autoTable(doc, {
    startY: y,
    head: [head],
    body: rows,
    theme: "grid",
    margin: { left: ML, right: MR },
    headStyles: {
      fillColor: C.navy,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: 4,
    },
    bodyStyles: {
      textColor: C.slateM,
      fontSize: 8.5,
      cellPadding: 3.5,
    },
    alternateRowStyles: {
      fillColor: C.offWhite,
    },
    styles: {
      lineColor: C.border,
      lineWidth: 0.25,
      font: FONT,
    },
  });
  return (doc as any).lastAutoTable.finalY + 8;
}

// ==================== FEATURE GRID (2×2) ====================
function featureGrid(doc: jsPDF, y: number, features: { title: string; desc: string }[]): number {
  const colW = (CW - 8) / 2;
  const rowH = 40;

  for (let i = 0; i < features.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const fx = ML + col * (colW + 8);
    const fy = y + row * rowH;

    // Dashed separators
    if (col === 1) {
      doc.setDrawColor(...C.border);
      doc.setLineDashPattern([2, 2], 0);
      doc.setLineWidth(0.2);
      doc.line(ML + colW + 4, fy - 2, ML + colW + 4, fy + rowH - 8);
      doc.setLineDashPattern([], 0);
    }
    if (row > 0 && col === 0) {
      doc.setDrawColor(...C.border);
      doc.setLineDashPattern([2, 2], 0);
      doc.setLineWidth(0.2);
      doc.line(ML, fy - 4, PW - MR, fy - 4);
      doc.setLineDashPattern([], 0);
    }

    // Mini navy badge
    setF(doc, C.navy);
    doc.roundedRect(fx, fy, 5, 5, 1, 1, "F");

    // Title
    setC(doc, C.navy);
    doc.setFont(FONT, "bold");
    doc.setFontSize(10);
    doc.text(features[i].title, fx + 8, fy + 4);

    // Description
    setC(doc, C.slateL);
    doc.setFont(FONT, "normal");
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(features[i].desc, colW - 10);
    doc.text(lines, fx, fy + 11);
  }

  const rows = Math.ceil(features.length / 2);
  return y + rows * rowH + 4;
}

// ==================== SCREENSHOT PLACEHOLDER ====================
function screenshot(doc: jsPDF, y: number, caption: string): number {
  const imgW = 120, imgH = 55;
  const x = (PW - imgW) / 2;

  // Light frame
  setF(doc, C.grayBg);
  doc.roundedRect(x - 4, y - 4, imgW + 8, imgH + 8, 4, 4, "F");
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.4);
  doc.roundedRect(x - 4, y - 4, imgW + 8, imgH + 8, 4, 4, "S");

  // Placeholder text
  setC(doc, C.slateL);
  doc.setFont(FONT, "italic");
  doc.setFontSize(9);
  doc.text("[Captura de tela do sistema]", PW / 2, y + imgH / 2, { align: "center" });

  // Caption
  doc.setFontSize(8);
  setC(doc, C.slateL);
  doc.setFont(FONT, "italic");
  doc.text(caption, PW / 2, y + imgH + 10, { align: "center" });

  return y + imgH + 18;
}

// ==================== BACK COVER ====================
function drawBackCover(doc: jsPDF, p: { n: number }, guideLabel: string, logo: string | null) {
  doc.addPage();
  p.n++;

  setF(doc, C.navy);
  doc.rect(0, 0, PW, PH, "F");
  setF(doc, C.amber);
  doc.rect(0, 0, PW, 5, "F");

  // Decorative
  doc.setGState(doc.GState({ opacity: 0.04 }));
  setF(doc, C.white);
  doc.circle(PW - 40, 70, 90, "F");
  doc.setGState(doc.GState({ opacity: 1 }));

  // Logo
  if (logo) {
    try { doc.addImage(logo, "JPEG", PW / 2 - 15, 80, 30, 30); } catch {}
  }

  setC(doc, C.white);
  doc.setFont(FONT, "bold");
  doc.setFontSize(20);
  doc.text("Colégio Estadual de Tempo Integral", PW / 2, logo ? 125 : 110, { align: "center" });
  doc.text("de Nova Itarana", PW / 2, logo ? 137 : 122, { align: "center" });

  setC(doc, C.amberL);
  doc.setFont(FONT, "normal");
  doc.setFontSize(11);
  doc.text("CETINI — Nova Itarana, Bahia", PW / 2, logo ? 151 : 136, { align: "center" });

  // Divider
  doc.setDrawColor(...C.amber);
  doc.setLineWidth(0.6);
  const divY = logo ? 158 : 143;
  doc.line(PW / 2 - 20, divY, PW / 2 + 20, divY);

  setC(doc, C.white);
  doc.setFont(FONT, "bold");
  doc.setFontSize(14);
  doc.text("Sistema de Controle de Acesso v2.0", PW / 2, divY + 15, { align: "center" });
  doc.setFontSize(10);
  doc.setFont(FONT, "normal");
  doc.text(guideLabel, PW / 2, divY + 25, { align: "center" });

  setC(doc, C.slateL);
  doc.setFontSize(9);
  doc.text("Março de 2026", PW / 2, divY + 37, { align: "center" });

  setC(doc, C.slateL);
  doc.setFontSize(7);
  doc.text("Este documento é de uso interno e exclusivo do CETINI Nova Itarana.", PW / 2, PH - 25, { align: "center" });

  setF(doc, C.amber);
  doc.rect(0, PH - 5, PW, 5, "F");
}

// ================================================================
//  GUIA COMPLETO (ADMINISTRADOR)
// ================================================================
export async function generateUserGuidePDF() {
  const logo = await loadLogoBase64();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const p = { n: 1 };
  const T = "Guia do Usuário";

  drawCover(doc, "Guia do Usuário", "Sistema de Controle de Entrada e Saída — v2.0", logo, "MANUAL COMPLETO");

  drawTOC(doc, p, T, [
    { group: "Introdução", items: [
      { num: 1, title: "Visão Geral do Sistema" },
      { num: 2, title: "Acesso e Login" },
      { num: 3, title: "Painel Geral (Dashboard)" },
    ]},
    { group: "Gestão de Alunos", items: [
      { num: 4, title: "Cadastro de Alunos" },
      { num: 5, title: "Importação em Lote via CSV" },
      { num: 6, title: "QR Codes — Geração e Impressão" },
    ]},
    { group: "Controle de Acesso", items: [
      { num: 7, title: "Portaria — Scanner de QR Code" },
      { num: 8, title: "Modo Quiosque (Tela Cheia)" },
      { num: 9, title: "Movimentações — Histórico Completo" },
    ]},
    { group: "Monitoramento e Alertas", items: [
      { num: 10, title: "Alertas e Presença" },
      { num: 11, title: "Horários — Configuração de Janelas" },
      { num: 12, title: "Ocorrências" },
      { num: 13, title: "Relatórios" },
    ]},
    { group: "Comunicação e Configurações", items: [
      { num: 14, title: "WhatsApp via CallMeBot" },
      { num: 15, title: "Acesso dos Pais" },
      { num: 16, title: "Configurações do Sistema" },
      { num: 17, title: "Perguntas Frequentes (FAQ)" },
    ]},
  ]);

  // --- Section 1 ---
  let y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "1", "Visão Geral do Sistema", "O que é e para que serve o CETINI Controle de Acesso v2.0");
  y = bodyText(doc, y, "O Sistema de Controle de Entrada e Saída do CETINI é uma plataforma web desenvolvida especificamente para o Colégio Estadual de Tempo Integral de Nova Itarana. Ele permite registrar, monitorar e notificar automaticamente todas as movimentações de alunos — entradas, saídas e ausências — com integração direta ao WhatsApp dos responsáveis.");

  y = featureGrid(doc, y, [
    { title: "Scanner de QR Code", desc: "Cada aluno possui um QR Code único. A portaria escaneia com a câmera do celular ou computador e o sistema registra entrada ou saída automaticamente." },
    { title: "Notificações WhatsApp", desc: "Os responsáveis recebem mensagens automáticas no WhatsApp a cada movimentação do aluno, usando o serviço CallMeBot — gratuito e sem custo." },
    { title: "Alertas Automáticos", desc: "O sistema detecta alunos ausentes, fora do horário e que saíram sem retornar, gerando alertas e notificando os responsáveis automaticamente." },
    { title: "Painel dos Pais", desc: "Cada responsável recebe um link exclusivo para acompanhar em tempo real as movimentações do filho, sem precisar de cadastro ou senha." },
  ]);

  y = infoBox(doc, y, "Requisitos de Acesso", "O sistema funciona em qualquer navegador moderno (Chrome, Firefox, Edge). Para a portaria, recomenda-se um dispositivo com câmera. Para o modo quiosque, um tablet ou computador fixo é ideal.", "info");

  // --- Section 2 ---
  y = checkSpace(doc, y, 90, p, T);
  y = sectionHeader(doc, y, "2", "Acesso e Login", "Como entrar no sistema");
  y = bodyText(doc, y, "O acesso ao sistema é feito por autenticação via e-mail e senha. Apenas usuários autorizados pela coordenação podem acessar o painel administrativo.");
  y = numberedSteps(doc, y, [
    "Acesse o endereço do sistema no navegador.",
    "Clique no botão \"Entrar no Sistema\" na tela de login.",
    "Faça login com sua conta (e-mail e senha).",
    "Você será redirecionado automaticamente para o Painel Geral.",
  ], p, T);

  y = dataTable(doc, y, ["Perfil", "Permissões"], [
    ["Administrador", "Acesso total: cadastros, configurações, alertas, relatórios e gerenciamento de usuários"],
    ["Coordenador", "Ocorrências, alertas, justificativas, relatórios e comunicação com pais"],
    ["Porteiro", "Portaria (scanner), movimentações e registro de ocorrências"],
    ["Usuário", "Acesso à portaria, movimentações e visualização de alertas"],
  ]);

  // --- Section 3 ---
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "3", "Painel Geral (Dashboard)", "Visão rápida do dia e acesso às principais funções");
  y = bodyText(doc, y, "O Painel Geral é a tela inicial após o login. Ele apresenta um resumo em tempo real da situação do colégio no dia atual, com indicadores visuais e acesso rápido às funções mais utilizadas.");

  y = dataTable(doc, y, ["Indicador", "O que mostra"], [
    ["Total de Alunos", "Número total de alunos cadastrados no sistema"],
    ["Entradas Hoje", "Quantidade de entradas registradas no dia atual"],
    ["Saídas Hoje", "Quantidade de saídas registradas no dia atual"],
    ["Alertas Pendentes", "Alertas não resolvidos (ausências, irregularidades)"],
  ]);

  y = bodyText(doc, y, "Quando há alunos ausentes ou que não retornaram, o painel exibe um aviso colorido com os nomes, permitindo acesso direto à página de Alertas com um clique.");
  y = subHeading(doc, y, "Acesso Rápido");
  y = bodyText(doc, y, "Quatro botões coloridos permitem navegar diretamente para as funções mais usadas: Portaria (Scanner), Cadastrar Aluno, QR Codes e Relatórios.");
  y = screenshot(doc, y, "Figura: Painel Geral com resumo do dia e acesso rápido.");

  // --- Section 4 ---
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "4", "Cadastro de Alunos", "Como cadastrar alunos e seus responsáveis");
  y = bodyText(doc, y, "Cada aluno deve ser cadastrado individualmente com seus dados e os dados dos responsáveis. O sistema gera automaticamente um QR Code único para cada aluno no momento do cadastro.");

  y = subHeading(doc, y, "Dados do Aluno");
  y = dataTable(doc, y, ["Campo", "Obrigatório", "Descrição"], [
    ["Nome Completo", "Sim", "Nome completo do aluno"],
    ["Série", "Sim", "Ex: 6° Ano, 7° Ano, 1ª Série EM"],
    ["Turma", "Sim", "Ex: A, B, C"],
    ["Matrícula", "Sim", "Número de matrícula único do aluno"],
    ["Foto", "Opcional", "Foto do aluno para identificação visual na portaria"],
    ["Limite de Saídas", "Opcional", "Número máximo de saídas por semana antes de gerar alerta"],
  ]);

  y = subHeading(doc, y, "Dados do Responsável");
  y = dataTable(doc, y, ["Campo", "Obrigatório", "Descrição"], [
    ["Nome", "Sim", "Nome do responsável"],
    ["Telefone", "Sim", "Número com DDD, apenas dígitos. Ex: 75988880001"],
    ["Parentesco", "Opcional", "Ex: Mãe, Pai, Avó"],
    ["Receber WhatsApp", "Opcional", "Marcar para ativar notificações automáticas"],
    ["CallMeBot API Key", "Opcional", "Chave individual do responsável para envio via WhatsApp"],
  ]);

  y = infoBox(doc, y, "Atenção ao número de telefone", "Digite apenas os dígitos, sem espaços, traços ou o símbolo +. O sistema formata automaticamente para o padrão internacional. Exemplo: 75988880001.", "warning");

  // --- Section 5 ---
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "5", "Importação em Lote via CSV", "Cadastrar muitos alunos de uma vez");
  y = bodyText(doc, y, "Para cadastrar toda a turma ou todos os alunos da escola de uma vez, use a função de importação via arquivo CSV. Isso economiza horas de trabalho no início do ano letivo.");

  y = subHeading(doc, y, "Como preparar o arquivo CSV");
  y = dataTable(doc, y, ["Coluna", "Obrigatório", "Exemplo"], [
    ["nome", "Sim", "João da Silva"],
    ["serie", "Sim", "7° Ano"],
    ["turma", "Sim", "A"],
    ["matricula", "Sim", "2024001"],
    ["responsavel_nome", "Opcional", "Maria da Silva"],
    ["responsavel_telefone", "Opcional", "75988880001"],
  ]);

  y = numberedSteps(doc, y, [
    "No menu lateral, clique em \"Importar Alunos (CSV)\".",
    "Baixe o modelo de planilha clicando em \"Baixar Modelo CSV\".",
    "Preencha a planilha com os dados dos alunos e salve como .csv.",
    "Clique em \"Selecionar Arquivo\", escolha o CSV e clique em \"Importar\".",
    "O sistema exibe um resumo: quantos alunos foram importados e se houve erros.",
  ], p, T);

  y = infoBox(doc, y, "QR Codes gerados automaticamente", "Após a importação, o sistema gera automaticamente um QR Code único para cada aluno. Acesse a página QR Codes para imprimir todos de uma vez.", "info");

  // --- Section 6 ---
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "6", "QR Codes — Geração e Impressão", "Como gerar e distribuir os QR Codes para as carteirinhas");
  y = bodyText(doc, y, "Cada aluno possui um QR Code único que identifica suas movimentações. Os QR Codes podem ser impressos individualmente ou em lote para colagem nas carteirinhas escolares.");
  y = numberedSteps(doc, y, [
    "No menu lateral, clique em \"QR Codes\".",
    "Use os filtros para selecionar por série ou turma.",
    "Clique em \"Imprimir Todos\" para gerar uma folha com todos os QR Codes, ou clique no QR Code individual.",
    "Recorte e cole os QR Codes nas carteirinhas dos alunos.",
  ], p, T);
  y = infoBox(doc, y, "Dica de impressão", "Imprima em papel adesivo para facilitar a colagem nas carteirinhas. O QR Code tem tamanho ideal para carteirinhas no formato crédito (85×54mm).", "info");

  // --- Section 7 ---
  y = checkSpace(doc, y, 90, p, T);
  y = sectionHeader(doc, y, "7", "Portaria — Scanner de QR Code", "Registrar entradas e saídas dos alunos");
  y = bodyText(doc, y, "A tela da portaria é a principal ferramenta do dia-a-dia. O aluno apresenta a carteirinha, a câmera lê o QR Code e o sistema registra automaticamente a movimentação, alternando entre entrada e saída.");

  y = screenshot(doc, y, "Figura: Tela da portaria com scanner ativo.");

  y = dataTable(doc, y, ["Situação", "Comportamento do Sistema"], [
    ["Primeiro scan do dia", "Registra Entrada automaticamente"],
    ["Segundo scan", "Registra Saída automaticamente"],
    ["QR Code desconhecido", "Exibe aviso de erro"],
    ["Scan duplicado (menos de 5s)", "Ignorado para evitar duplicidade"],
    ["Aluno inativo", "Exibe aviso: aluno desativado"],
  ]);

  y = infoBox(doc, y, "Permissão de câmera", "Na primeira vez que a portaria for acessada, o navegador pedirá permissão para usar a câmera. Clique em \"Permitir\".", "warning");

  // --- Section 8 ---
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "8", "Modo Quiosque (Tela Cheia)", "Para tablets e computadores fixos na portaria");
  y = bodyText(doc, y, "O modo quiosque transforma a tela em um terminal dedicado. Ideal para um tablet ou computador fixo na entrada da escola.");
  y = numberedSteps(doc, y, [
    "Na tela da Portaria, clique no ícone de tela cheia no canto superior direito.",
    "A câmera ficará centralizada com destaque para leitura do QR Code.",
    "O resultado aparece com a foto e horário do aluno.",
    "Para sair, pressione ESC ou clique no ícone superior direito.",
  ], p, T);

  // --- Section 9 ---
  y = checkSpace(doc, y, 50, p, T);
  y = sectionHeader(doc, y, "9", "Movimentações — Histórico Completo", "Consultar todas as entradas e saídas");
  y = bodyText(doc, y, "A página de Movimentações exibe o histórico completo de todas as entradas e saídas registradas. Use os filtros de data, série e turma para localizar registros específicos.");

  // --- Section 10 ---
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "10", "Alertas e Presença", "Monitoramento automático de ausências e irregularidades");
  y = bodyText(doc, y, "O sistema verifica automaticamente a presença dos alunos e gera alertas quando detecta situações irregulares.");
  y = dataTable(doc, y, ["Tipo de Alerta", "Quando é gerado"], [
    ["Aluno Ausente", "Quando o aluno não registra entrada até o horário limite"],
    ["Não Retornou", "Quando o aluno saiu e não registrou retorno até o fim do dia"],
    ["Horário Irregular", "Quando o scan ocorre fora da janela de horário configurada"],
    ["Saídas Excessivas", "Quando o aluno ultrapassa o limite semanal de saídas"],
  ]);

  // --- Section 11 ---
  y = checkSpace(doc, y, 80, p, T);
  y = sectionHeader(doc, y, "11", "Horários — Configuração de Janelas", "Definir os horários esperados de entrada e saída");
  y = bodyText(doc, y, "A página de Horários permite configurar as janelas de tempo em que as movimentações são consideradas dentro do horário.");
  y = dataTable(doc, y, ["Campo", "Descrição", "Exemplo"], [
    ["Nome da Regra", "Identificação da regra", "Entrada Manhã"],
    ["Tipo", "Entrada ou Saída", "Entrada"],
    ["Horário Início", "Início da janela permitida", "07:00"],
    ["Horário Fim", "Fim da janela permitida", "07:15"],
    ["Tolerância (min)", "Minutos extras antes de gerar alerta", "5 minutos"],
    ["Notificar WhatsApp", "Enviar mensagem ao responsável", "Sim"],
  ]);
  y = infoBox(doc, y, "Configure os horários antes de usar", "Sem regras de horário cadastradas, o sistema não gera alertas de horário irregular. Cadastre ao menos uma regra de entrada e uma de saída.", "warning");

  // --- Section 12 ---
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "12", "Ocorrências", "Registro de incidentes e situações especiais");
  y = bodyText(doc, y, "O módulo de Ocorrências permite registrar incidentes que não são simples entradas ou saídas.");
  y = dataTable(doc, y, ["Tipo de Ocorrência", "Quando usar"], [
    ["Saída sem autorização", "Aluno tentou sair sem permissão"],
    ["Responsável buscou", "Responsável veio buscar o aluno antes do horário"],
    ["Aluno passou mal", "Aluno com problemas de saúde"],
    ["Ocorrência de comportamento", "Incidente disciplinar na entrada/saída"],
    ["Atraso", "Aluno chegou com atraso significativo"],
    ["Outro", "Qualquer situação não listada acima"],
  ]);

  // --- Section 13 ---
  y = checkSpace(doc, y, 70, p, T);
  y = sectionHeader(doc, y, "13", "Relatórios", "Estatísticas e análises de presença");
  y = bodyText(doc, y, "A página de Relatórios oferece uma visão analítica das movimentações, com gráficos e tabelas.");
  y = bulletList(doc, y, [
    "Movimentações por dia da semana — identifica padrões de ausência.",
    "Ranking de alunos com mais saídas — detecta comportamentos recorrentes.",
    "Histórico por turma — comparativo de presença entre turmas.",
    "Exportação dos dados para planilha.",
  ], p, T);
  y = screenshot(doc, y, "Figura: Página de relatórios com gráficos e filtros.");

  // --- Section 14 ---
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "14", "WhatsApp via CallMeBot", "Notificações automáticas para os responsáveis");
  y = bodyText(doc, y, "O sistema envia mensagens automáticas no WhatsApp dos responsáveis usando o serviço gratuito CallMeBot.");
  y = dataTable(doc, y, ["Evento", "Quando é enviada"], [
    ["Entrada registrada", "Imediatamente após o scan de entrada"],
    ["Saída registrada", "Imediatamente após o scan de saída"],
    ["Aluno ausente", "Às 08:30, se o aluno não registrou entrada"],
    ["Não retornou", "Às 18:30, se aluno saiu e não voltou"],
    ["Horário irregular", "No momento do scan fora da janela configurada"],
    ["Link de acesso dos pais", "Quando a coordenação envia manualmente"],
  ]);

  // --- Section 15 ---
  y = checkSpace(doc, y, 80, p, T);
  y = sectionHeader(doc, y, "15", "Acesso dos Pais", "Como os responsáveis acompanham as movimentações do filho");
  y = bodyText(doc, y, "Cada responsável pode receber um link exclusivo e seguro para acompanhar em tempo real as movimentações do filho.");
  y = numberedSteps(doc, y, [
    "No menu lateral, clique em \"Acesso dos Pais\".",
    "Localize o aluno desejado na lista.",
    "Clique em \"Gerar Link\" para criar o token de acesso do responsável.",
    "Clique em \"Enviar via WhatsApp\" para enviar o link diretamente ao responsável.",
  ], p, T);

  // --- Section 16 ---
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "16", "Configurações do Sistema", "Ajustar parâmetros gerais e integração WhatsApp");
  y = bodyText(doc, y, "A página de Configurações permite ajustar parâmetros gerais do sistema. O acesso é restrito a administradores.");
  y = dataTable(doc, y, ["Configuração", "Descrição"], [
    ["Nome da Escola", "Nome exibido nas mensagens WhatsApp e relatórios"],
    ["WhatsApp Ativado", "Liga/desliga o envio de todas as notificações WhatsApp"],
    ["Número da Escola", "Número usado como remetente padrão (fallback)"],
    ["API Key Global", "Chave CallMeBot da escola"],
    ["Limite de Saídas", "Número padrão de saídas semanais antes de gerar alerta"],
    ["Teste de Envio", "Envia uma mensagem de teste para verificar o WhatsApp"],
  ]);
  y = infoBox(doc, y, "Teste antes de usar em produção", "Use o botão \"Enviar Mensagem de Teste\" nas Configurações para confirmar que o WhatsApp está funcionando corretamente.", "warning");

  // --- Section 17 ---
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "17", "Perguntas Frequentes (FAQ)", "Dúvidas comuns e soluções rápidas");

  const faqs = [
    { q: "O scanner não está lendo o QR Code. O que fazer?", a: "Verifique se o navegador tem permissão para usar a câmera. Limpe o cache e certifique-se que o QR Code está bem iluminado e não está rasgado. Tente aproximar ou afastar o QR Code da câmera." },
    { q: "O aluno foi marcado como ausente, mas veio à escola.", a: "Isso pode acontecer se o aluno não escaneou o QR Code na entrada. Registre manualmente a entrada na página de Movimentações e resolva o alerta na página de Alertas." },
    { q: "Como desativar um aluno que se transferiu?", a: "Acesse a lista de Alunos, clique no aluno desejado e clique em \"Editar\". Desmarque a opção \"Aluno Ativo\" e salve." },
    { q: "Como adicionar um novo usuário ao sistema?", a: "O novo funcionário deve acessar o sistema e fazer login. Após o primeiro login, o administrador pode atribuir o perfil adequado na seção de gerenciamento de usuários." },
    { q: "O sistema funciona sem internet?", a: "O sistema é uma aplicação web e requer conexão com a internet. Recomenda-se uma conexão estável na portaria para garantir o registro em tempo real." },
  ];

  for (const faq of faqs) {
    y = checkSpace(doc, y, 28, p, T);
    y = boldText(doc, y, faq.q);
    y = bodyText(doc, y, faq.a);
  }

  drawBackCover(doc, p, "Guia do Usuário — Manual Completo", logo);
  doc.save(`GUIA_USUARIO_CETINI_${new Date().getFullYear()}.pdf`);
}

// ================================================================
//  GUIA DO PORTEIRO
// ================================================================
export async function generateGatekeeperGuidePDF() {
  const logo = await loadLogoBase64();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const p = { n: 1 };
  const T = "Guia do Porteiro";

  drawCover(doc, "Guia do Porteiro", "Manual Operacional para Controle de Acesso na Portaria", logo, "OPERAÇÕES");

  drawTOC(doc, p, T, [
    { group: "Operação Diária", items: [
      { num: 1, title: "Sua Função no Sistema" },
      { num: 2, title: "Acessando a Portaria" },
      { num: 3, title: "Escaneando QR Codes" },
    ]},
    { group: "Situações Especiais", items: [
      { num: 4, title: "Modo Quiosque" },
      { num: 5, title: "Busca Manual de Alunos" },
      { num: 6, title: "Registrando Ocorrências" },
    ]},
    { group: "Referência Rápida", items: [
      { num: 7, title: "Sons e Avisos do Sistema" },
      { num: 8, title: "Problemas Comuns e Soluções" },
    ]},
  ]);

  // Section 1
  let y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "1", "Sua Função no Sistema", "O que o porteiro faz no CETINI Digital");
  y = bodyText(doc, y, "Você é responsável por registrar todas as entradas e saídas dos alunos usando o scanner de QR Code. Quando um aluno passa pela portaria, você escaneia a carteirinha dele e o sistema faz o resto: registra a movimentação, avisa os pais por WhatsApp e monitora a presença.");
  y = infoBox(doc, y, "Importante", "Cada scan conta! Se o aluno não escanear ao entrar, ele será marcado como ausente e os pais serão notificados. Garanta que todos os alunos passem pelo scanner.", "warning");

  // Section 2
  y = checkSpace(doc, y, 80, p, T);
  y = sectionHeader(doc, y, "2", "Acessando a Portaria", "Como abrir a tela de scanner");
  y = numberedSteps(doc, y, [
    "Abra o navegador (Chrome recomendado) no tablet ou computador da portaria.",
    "Acesse o endereço do sistema.",
    "Faça login com seu usuário e senha.",
    "No menu lateral, clique em \"Portaria\" para abrir o scanner.",
    "Permita o acesso à câmera quando o navegador solicitar.",
  ], p, T);
  y = screenshot(doc, y, "Figura: Tela da portaria com câmera ativa.");

  // Section 3
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "3", "Escaneando QR Codes", "O passo-a-passo do dia-a-dia");
  y = bodyText(doc, y, "O processo é simples e rápido. O aluno apresenta a carteirinha, você aponta a câmera e o sistema registra automaticamente.");
  y = numberedSteps(doc, y, [
    "O aluno mostra a carteirinha com o QR Code.",
    "Aponte a câmera para o QR Code (mantenha a cerca de 15cm).",
    "Aguarde o bip de confirmação e a foto do aluno aparecer na tela.",
    "O sistema registra automaticamente: primeiro scan = ENTRADA, segundo scan = SAÍDA.",
    "Confira o nome e a foto do aluno na tela.",
  ], p, T);

  y = dataTable(doc, y, ["Situação", "O que acontece"], [
    ["Primeiro scan do dia", "Registra ENTRADA — bip suave"],
    ["Segundo scan", "Registra SAÍDA — bip diferente"],
    ["QR Code desconhecido", "Erro — bip agudo"],
    ["Scan muito rápido (<5s)", "Ignorado — evita duplicidade"],
    ["Aluno inativo/transferido", "Aviso na tela — aluno desativado"],
  ]);

  // Section 4
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "4", "Modo Quiosque", "Tela cheia para o tablet da portaria");
  y = bodyText(doc, y, "O modo quiosque é ideal para tablets ou computadores fixos. A tela fica dedicada apenas ao scanner.");
  y = numberedSteps(doc, y, [
    "Na tela da Portaria, clique no ícone de tela cheia (canto superior direito).",
    "A câmera ficará centralizada com destaque para o QR Code.",
    "O resultado aparece com a foto, nome e horário do aluno.",
    "Para sair do modo quiosque, pressione ESC.",
  ], p, T);

  // Section 5
  y = checkSpace(doc, y, 70, p, T);
  y = sectionHeader(doc, y, "5", "Busca Manual de Alunos", "Quando o aluno esquece a carteirinha");
  y = bodyText(doc, y, "Se o aluno esqueceu a carteirinha ou o QR Code está danificado, você pode registrar a movimentação manualmente:");
  y = numberedSteps(doc, y, [
    "Na tela da portaria, use a barra de \"Busca Manual\" na parte inferior.",
    "Digite o nome ou matrícula do aluno.",
    "Selecione o aluno correto na lista de resultados.",
    "Clique em \"Registrar Entrada\" ou \"Registrar Saída\".",
  ], p, T);
  y = infoBox(doc, y, "Dica", "Informe à coordenação quando um aluno esquece a carteirinha com frequência. A coordenação pode reimprimir o QR Code.", "info");

  // Section 6
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "6", "Registrando Ocorrências", "Situações além de entrada e saída");
  y = bodyText(doc, y, "Quando acontece algo fora do normal, você pode registrar uma ocorrência diretamente:");
  y = dataTable(doc, y, ["Tipo", "Quando usar"], [
    ["Saída sem autorização", "Aluno tentou sair sem permissão da coordenação"],
    ["Responsável buscou", "Pai/mãe veio buscar o aluno antes do horário"],
    ["Aluno passou mal", "Aluno com problema de saúde na portaria"],
    ["Atraso", "Aluno chegou com atraso significativo"],
    ["Outro", "Qualquer outra situação relevante"],
  ]);
  y = numberedSteps(doc, y, [
    "Na portaria, clique em \"Registrar Ocorrência\".",
    "Busque o aluno pelo nome.",
    "Selecione o tipo de ocorrência.",
    "Escreva uma breve descrição do ocorrido.",
    "Clique em \"Salvar\".",
  ], p, T);

  // Section 7
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "7", "Sons e Avisos do Sistema", "Entendendo os feedbacks do scanner");
  y = dataTable(doc, y, ["Ação", "Som/Visual", "Significado"], [
    ["Scan entrada", "Bip suave + tela verde", "Entrada registrada com sucesso"],
    ["Scan saída", "Bip diferente + tela azul", "Saída registrada com sucesso"],
    ["QR não reconhecido", "Bip agudo + tela vermelha", "Aluno não encontrado"],
    ["Scan duplicado", "Sem som", "Ignorado — muito rápido"],
    ["Aluno inativo", "Aviso amarelo", "Aluno desativado — chame a coordenação"],
  ]);

  // Section 8
  y = checkSpace(doc, y, 80, p, T);
  y = sectionHeader(doc, y, "8", "Problemas Comuns e Soluções", "Referência rápida para o dia-a-dia");

  const problems = [
    { q: "A câmera não abre", a: "Verifique se o navegador tem permissão de câmera. Nas configurações do navegador, procure \"Câmera\" e garanta que está como \"Permitir\"." },
    { q: "O QR Code não está sendo lido", a: "Certifique-se que o QR Code está limpo e bem iluminado. Tente ajustar a distância (15-20cm). Se estiver desgastado, peça à coordenação para reimprimir." },
    { q: "A internet caiu", a: "O sistema precisa de internet. Avise a coordenação imediatamente. Anote os nomes e horários manualmente para registrar depois." },
    { q: "Aluno não está no sistema", a: "Pode ser um aluno novo. Encaminhe à coordenação para que faça o cadastro antes de liberar a entrada." },
  ];

  for (const pb of problems) {
    y = checkSpace(doc, y, 24, p, T);
    y = boldText(doc, y, pb.q);
    y = bodyText(doc, y, pb.a);
  }

  drawBackCover(doc, p, "Guia do Porteiro — Manual Operacional", logo);
  doc.save(`GUIA_PORTEIRO_CETINI_${new Date().getFullYear()}.pdf`);
}

// ================================================================
//  GUIA DA COORDENAÇÃO
// ================================================================
export async function generateCoordinationGuidePDF() {
  const logo = await loadLogoBase64();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const p = { n: 1 };
  const T = "Guia da Coordenação";

  drawCover(doc, "Guia da Coordenação", "Manual Pedagógico para Gestão de Presença, Ocorrências e Comunicação com Famílias", logo, "GESTÃO PEDAGÓGICA");

  drawTOC(doc, p, T, [
    { group: "Gestão Pedagógica", items: [
      { num: 1, title: "Seu Papel no Sistema" },
      { num: 2, title: "Monitorando o Dashboard" },
      { num: 3, title: "Gestão de Alertas" },
    ]},
    { group: "Ocorrências e Justificativas", items: [
      { num: 4, title: "Registrando Ocorrências" },
      { num: 5, title: "Justificativas de Faltas" },
    ]},
    { group: "Comunicação e Relatórios", items: [
      { num: 6, title: "Comunicação com os Pais" },
      { num: 7, title: "Relatórios e Análises" },
      { num: 8, title: "Gerenciamento de Alunos" },
    ]},
  ]);

  // Section 1
  let y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "1", "Seu Papel no Sistema", "O que a coordenação faz no CETINI Digital");
  y = bodyText(doc, y, "A coordenação é responsável pelo acompanhamento pedagógico da presença escolar. Você monitora alertas, gerencia ocorrências, analisa relatórios e se comunica com as famílias.");

  y = featureGrid(doc, y, [
    { title: "Monitorar Alertas", desc: "Acompanhe em tempo real quais alunos estão ausentes, atrasados ou com comportamento irregular." },
    { title: "Gerir Ocorrências", desc: "Registre e acompanhe incidentes disciplinares, saúde e outras situações especiais." },
    { title: "Analisar Relatórios", desc: "Use os dados de presença para identificar padrões e tomar decisões pedagógicas." },
    { title: "Comunicar com Pais", desc: "Envie links de acompanhamento e gerencie justificativas de faltas." },
  ]);

  // Section 2
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "2", "Monitorando o Dashboard", "A tela principal do seu dia");
  y = bodyText(doc, y, "O Dashboard é sua tela principal. Mantenha-o aberto durante o dia para acompanhar em tempo real o fluxo de alunos.");

  y = screenshot(doc, y, "Figura: Dashboard com indicadores de presença em tempo real.");

  y = dataTable(doc, y, ["Indicador", "O que observar"], [
    ["Entradas Hoje", "Se está abaixo do esperado, pode indicar dia atípico"],
    ["Alertas Pendentes", "Priorize resolver os alertas vermelhos primeiro"],
    ["Alunos Ausentes", "Clique para ver a lista e decidir se precisa ligar para a família"],
    ["Não Retornaram", "Alunos que saíram e não voltaram — situação crítica"],
  ]);

  y = infoBox(doc, y, "Dica prática", "Mantenha o Dashboard aberto em uma aba do navegador durante todo o expediente. Ele atualiza automaticamente.", "info");

  // Section 3
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "3", "Gestão de Alertas", "Acompanhar e resolver situações de presença");
  y = bodyText(doc, y, "Os alertas são gerados automaticamente pelo sistema. Cabe à coordenação analisar cada caso e tomar a ação adequada.");

  y = dataTable(doc, y, ["Tipo de Alerta", "Ação Recomendada"], [
    ["Aluno Ausente", "Verificar se há justificativa. Se não, ligar para a família."],
    ["Não Retornou", "Contatar a família imediatamente."],
    ["Horário Irregular", "Verificar com o porteiro o motivo."],
    ["Saídas Excessivas", "Conversar com o aluno e a família sobre o padrão."],
  ]);

  y = numberedSteps(doc, y, [
    "Acesse a página de \"Alertas\" no menu lateral.",
    "Analise cada alerta pendente (ícone vermelho).",
    "Tome a ação adequada (ligar para família, conversar com aluno, etc.).",
    "Clique em \"Resolver\" para marcar o alerta como tratado.",
  ], p, T);

  // Section 4
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "4", "Registrando Ocorrências", "Documentar incidentes pedagógicos");
  y = bodyText(doc, y, "As ocorrências ficam no dossiê do aluno e servem como registro oficial. Seja claro e objetivo na descrição.");
  y = numberedSteps(doc, y, [
    "No menu lateral, clique em \"Ocorrências\".",
    "Busque pelo nome do aluno no campo de pesquisa.",
    "Escolha o tipo (Atraso, Comportamento, Sem Autorização, etc.).",
    "Escreva um breve resumo objetivo do que aconteceu.",
    "Clique em \"Salvar\" — a ocorrência fica registrada no dossiê do aluno.",
  ], p, T);

  y = infoBox(doc, y, "Dica importante", "Seja sempre objetivo e profissional nas descrições. Ex: \"Aluno chegou às 08:15, 15 minutos após o horário\" é melhor que \"Aluno chegou muito atrasado\".", "warning");

  // Section 5
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "5", "Justificativas de Faltas", "Avaliar justificativas enviadas pelos pais");
  y = bodyText(doc, y, "Quando um responsável envia uma justificativa de falta, você pode aprovar ou rejeitar.");
  y = numberedSteps(doc, y, [
    "Acesse \"Justificativas\" no menu lateral.",
    "Veja as justificativas pendentes (aguardando análise).",
    "Clique na justificativa para ver os detalhes e o motivo.",
    "Clique em \"Aprovar\" ou \"Rejeitar\" com uma nota explicativa.",
  ], p, T);

  y = dataTable(doc, y, ["Status", "Significado"], [
    ["Pendente", "Aguardando análise da coordenação"],
    ["Aprovada", "Falta justificada — não conta negativamente"],
    ["Rejeitada", "Justificativa insuficiente — falta mantida"],
  ]);

  // Section 6
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "6", "Comunicação com os Pais", "Links de acesso e notificações WhatsApp");
  y = bodyText(doc, y, "Cada responsável pode receber um link exclusivo para acompanhar as movimentações do filho em tempo real pelo celular.");
  y = numberedSteps(doc, y, [
    "Acesse \"Acesso dos Pais\" no menu lateral.",
    "Localize o aluno desejado.",
    "Clique em \"Gerar Link\" para criar o link exclusivo.",
    "Clique em \"Enviar via WhatsApp\" para enviar diretamente ao responsável.",
  ], p, T);
  y = bodyText(doc, y, "O responsável verá: foto e dados do aluno, histórico completo de movimentações e o status atual (dentro ou fora da escola).");
  y = infoBox(doc, y, "WhatsApp automático", "As notificações de entrada, saída e alertas são enviadas automaticamente. Você só precisa enviar o link de acesso inicial.", "info");

  // Section 7
  y = newPage(doc, p, T);
  y = sectionHeader(doc, y, "7", "Relatórios e Análises", "Dados para decisões pedagógicas");
  y = bodyText(doc, y, "A página de Relatórios é sua principal ferramenta de análise. Use os filtros para gerar os dados que a Secretaria ou a direção precisam.");
  y = numberedSteps(doc, y, [
    "Acesse \"Relatórios\" no menu lateral.",
    "Use os filtros de série, turma e período para refinar os dados.",
    "Analise os gráficos de movimentações por dia da semana.",
    "Confira o ranking de alunos com mais saídas.",
    "Exporte os dados em PDF ou Excel quando necessário.",
  ], p, T);

  y = infoBox(doc, y, "Relatório mensal", "Recomendamos gerar um relatório mensal por turma para apresentar na reunião de coordenação. Os dados ajudam a identificar alunos em risco de evasão.", "info");

  // Section 8
  y = checkSpace(doc, y, 70, p, T);
  y = sectionHeader(doc, y, "8", "Gerenciamento de Alunos", "Cadastro, edição e desativação");
  y = bodyText(doc, y, "A coordenação pode gerenciar o cadastro de alunos, incluindo edição de dados, desativação de alunos transferidos e impressão de QR Codes.");

  y = dataTable(doc, y, ["Ação", "Como fazer"], [
    ["Editar dados do aluno", "Lista de Alunos → Clique no aluno → Editar"],
    ["Desativar aluno transferido", "Editar → Desmarcar \"Aluno Ativo\" → Salvar"],
    ["Reimprimir QR Code", "QR Codes → Buscar aluno → Imprimir individual"],
    ["Importar alunos em lote", "Importar Alunos (CSV) → Baixar modelo → Preencher → Importar"],
  ]);

  y = infoBox(doc, y, "Nunca delete um aluno", "Sempre desative em vez de deletar. O histórico de movimentações e ocorrências é preservado quando o aluno é desativado, mas perdido se for deletado.", "danger");

  drawBackCover(doc, p, "Guia da Coordenação — Manual Pedagógico");
  doc.save(`GUIA_COORDENACAO_CETINI_${new Date().getFullYear()}.pdf`);
}
