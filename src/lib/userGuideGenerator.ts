import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
  doc.circle(PAGE_W, 0, 60, "F");
  doc.circle(20, 10, 30, "F");
  doc.setGState(new (doc as any).GState({ opacity: 1 }));
}

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  drawFullBleedHeader(doc);
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, MARGIN, 18);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, MARGIN, 28);

  // School Name Badge
  doc.setFillColor(255, 255, 255);
  doc.setGState(new (doc as any).GState({ opacity: 0.15 }));
  doc.roundedRect(PAGE_W - 65, 10, 50, 20, 5, 5, "F");
  doc.setGState(new (doc as any).GState({ opacity: 1 }));
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
  doc.text(`CETI Digital — Manual de Operações • v${new Date().getFullYear()}.1`, MARGIN, PAGE_H - 10);
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
  doc.rect(0, 0, PAGE_W, PAGE_H / 1.8, "F");

  // Decorative Geometry
  doc.setFillColor(255, 255, 255);
  doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
  doc.circle(0, 0, 100, "F");
  doc.circle(PAGE_W, PAGE_H / 2, 80, "F");
  doc.setGState(new (doc as any).GState({ opacity: 1 }));

  // White area title
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(48);
  doc.setFont("helvetica", "bold");
  doc.text("CETI", PAGE_W / 2, 70, { align: "center" });
  doc.setFontSize(52);
  doc.text("NOVA ITARANA", PAGE_W / 2, 92, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("TECNOLOGIA A SERVIÇO DA EDUCAÇÃO", PAGE_W / 2, 108, { align: "center" });

  // Horizontal Line
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2);
  doc.line(PAGE_W / 2 - 40, 118, PAGE_W / 2 + 40, 118);

  // Main Manual Box
  doc.setFillColor(...COLORS.white);
  doc.setShadow(0, 5, [0, 0, 0], 10);
  doc.roundedRect(MARGIN + 10, PAGE_H / 2 - 10, CONTENT_W - 20, 70, 8, 8, "F");
  doc.setShadow(0, 0, [0, 0, 0], 0);

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(title, PAGE_W / 2, PAGE_H / 2 + 20, { align: "center" });

  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, PAGE_W / 2, PAGE_H / 2 + 35, { align: "center" });

  // Bottom Branding
  doc.setTextColor(...COLORS.secondary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CETI DIGITAL", PAGE_W / 2, PAGE_H - 40, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(`Edição ${new Date().getFullYear()}`, PAGE_W / 2, PAGE_H - 34, { align: "center" });
}

// ==================== DATA CONFIGS ====================
const ADMIN_CHAPTERS = [
  { id: "01", title: "Fundamentos do Ecossistema", subtitle: "Arquitetura e Filosofia" },
  { id: "02", title: "Business Intelligence", subtitle: "Gestão Baseada em Dados" },
  { id: "03", title: "Controle de Acesso 360", subtitle: "Portaria e Segurança" },
  { id: "04", title: "Gestão Disciplinar", subtitle: "Protocolos e Ocorrências" },
  { id: "05", title: "Comunicação Integrada", subtitle: "WhatsApp e Portal" }
];

// ==================== EXPORTS ====================
export function generateUserGuidePDF() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const page = { val: 1 };
  const T = "GUIA DO USUÁRIO";
  const S = "MANUAL MESTRE DO ADMINISTRADOR";

  generateCover(doc, "MANUAL MASTER", "GESTÃO ESCOLAR 4.0");

  // --- INTRODUÇÃO ---
  let y = newPage(doc, T, S, page);
  y = printDisplayTitle(doc, y, "01", "Fundamentos do Sistema");
  y = printBody(doc, y, "O CETI Digital não é apenas um software de registro; é um ecossistema de gestão inteligente desenhado para elevar a eficiência operacional da escola. Através de monitoramento em tempo real, ele cria uma ponte entre a portaria, coordenação e família.");

  y = printSectionHeading(doc, y, "A Tríade do Cetidital");
  y = printModuleBox(doc, y, "Pilares Estratégicos", [
    "Monitoramento de Fluxo: Controle total de quem entra e sai.",
    "Transparência Radical: Informação instantânea para os pais.",
    "Decisões Baseadas em Dados: Relatórios que mostram a realidade da escola."
  ]);

  y = printProTip(doc, y, "O sistema é otimizado para navegadores baseados em Chromium. Mantenha seu navegador atualizado para garantir a performance dos gráficos.");

  // --- BI & RELATÓRIOS ---
  y = newPage(doc, T, S, page);
  y = printDisplayTitle(doc, y, "02", "Business Intelligence");
  y = printBody(doc, y, "Nossa engine de Analytics transforma registros de portaria em inteligência pedagógica. O administrador deve focar nos indicadores de risco para antecipar problemas de evasão.");

  y = printSectionHeading(doc, y, "Métricas de Performance");
  autoTable(doc, {
    startY: y,
    head: [['Indicador', 'Objetivo', 'Ação Crítica']],
    body: [
      ['Taxa de Assiduidade', 'Medir presença geral', 'Identificar turmas ociosas'],
      ['Alertas Ativos', 'Resolver pendências', 'Contactar responsáveis'],
      ['Índice Disciplinar', 'Monitorar conduta', 'Geração de relatórios'],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary },
    margin: { left: MARGIN, right: MARGIN }
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  y = printProTip(doc, y, "Use o filtro de data no Dashboard para comparar a frequência entre meses diferentes e notar sazonalidades.", "info");

  // --- PORTARIA ---
  y = newPage(doc, T, S, page);
  y = printDisplayTitle(doc, y, "03", "Controle de Acesso 360");
  y = printBody(doc, y, "O módulo de portaria é o coração do sistema. Cada 'scan' de QR Code valida o perfil do aluno, seus horários permitidos e gera notificações automáticas.");

  y = printModuleBox(doc, y, "Operação Padrão", [
    "Verificação de Identidade: Foto do aluno aparece instantaneamente.",
    "Gestão de Exceção: Registro de saídas autorizadas fora de horário.",
    "Modo Offline: Sincronização automática para instabilidades de rede."
  ]);

  y = printProTip(doc, y, "Sempre oriente os porteiros a verificarem a foto na tela. O QR Code é único, mas a conferência visual é a camada final de segurança.", "warning");

  // --- GESTÃO DISCIPLINAR ---
  y = newPage(doc, T, S, page);
  y = printDisplayTitle(doc, y, "04", "Gestão Disciplinar");
  y = printBody(doc, y, "O CETI Digital formaliza o acompanhamento comportamental. O registro de ocorrências permite que nada 'se perca no papel', criando uma timeline histórica do aluno.");

  y = printSectionHeading(doc, y, "Fluxo de Ocorrência");
  y = printBody(doc, y, "1. Registro do Incidente com evidências descritivas.\n2. Geração de PDF oficial timbrado.\n3. Envio de Notificação Push/WhatsApp.\n4. Assinatura e arquivamento digital.");

  y = printProTip(doc, y, "Ocorrências graves geram alertas imediatos para a coordenação. Fique atento ao Sino de Notificações.", "danger");

  // --- COMUNICAÇÃO ---
  y = newPage(doc, T, S, page);
  y = printDisplayTitle(doc, y, "05", "Comunicação com a Família");
  y = printBody(doc, y, "Reduzir o distanciamento entre escola e família é chave para o sucesso do aluno. O sistema oferece dois portais de transparência.");

  y = printModuleBox(doc, y, "Canais de Integração", [
    "Portal do Aluno: Acesso via Token único para cada responsável.",
    "Bot de WhatsApp: Notificações em tempo real de chegada e saída.",
    "Mural Digital: Avisos e comunicados da escola na palma da mão."
  ]);

  doc.save(`MASTER_GUIDE_CETI_${new Date().getFullYear()}.pdf`);
}

export function generateGatekeeperGuidePDF() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const page = { val: 1 };
  const T = "GUIA DO PORTEIRO";
  const S = "PROTOCOLOS DE ACESSO E SEGURANÇA";

  generateCover(doc, "GUIA PORTARIA", "PROTOCOLO DE SEGURANÇA");

  let y = newPage(doc, T, S, page);
  y = printDisplayTitle(doc, y, "01", "Atenção Total");
  y = printBody(doc, y, "Você é o guardião dos acessos da escola. O uso correto do scanner garante que a coordenação saiba exatamente onde cada aluno está em tempo real.");

  y = printSectionHeading(doc, y, "Como Operar o Scanner");
  y = printBody(doc, y, "1. Abra a página 'Portaria'.\n2. Ative a câmera frontal ou traseira.\n3. Enquadre o QR Code da carteirinha.\n4. Aguarde o retorno VISUAL (Verde: OK, Vermelho: Bloqueado).");

  y = printProTip(doc, y, "Se a internet cair, o sistema continuará funcionando no 'Modo Offline'. Não pare de escanear!", "warning");

  y = newPage(doc, T, S, page);
  y = printDisplayTitle(doc, y, "02", "Protocolos de Saída");
  y = printBody(doc, y, "Nunca libere um aluno fora do horário sem que o sistema mostre a mensagem 'Saída Autorizada' em verde.");

  y = printSectionHeading(doc, y, "Cores do Sistema");
  autoTable(doc, {
    startY: y,
    head: [['Cor', 'Status', 'O que fazer']],
    body: [
      ['Verde', 'Liberado', 'Permitir passagem'],
      ['Amarelo', 'Alerta', 'Chamar coordenação'],
      ['Vermelho', 'Bloqueado', 'NÃO LIBERAR'],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary }
  });

  doc.save(`GUIA_PORTARIA_CETI_${new Date().getFullYear()}.pdf`);
}

export function generateCoordinationGuidePDF() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const page = { val: 1 };
  const T = "GUIA DA COORDENAÇÃO";
  const S = "GESTÃO PEDAGÓGICA E DISCIPLINAR";

  generateCover(doc, "GUIA COORDENAÇÃO", "FOCO NO SUCESSO DO ALUNO");

  let y = newPage(doc, T, S, page);
  y = printDisplayTitle(doc, y, "01", "Gestão do Aluno");
  y = printBody(doc, y, "Sua missão é acompanhar o desenvolvimento e a frequência dos discentes. O sistema sinaliza alunos que estão fugindo do padrão habitual.");

  y = printSectionHeading(doc, y, "Principais Ferramentas");
  y = printModuleBox(doc, y, "Rotina do Coordenador", [
    "Análise de Alertas: Tratar faltas recorrentes.",
    "Justificativas: Validar atestados e motivos de ausência.",
    "Ocorrências: Registrar fatos disciplinares com precisão."
  ]);

  y = printProTip(doc, y, "Um aluno com 3 dias de ausência sem justificativa gera um 'Alerta Crítico'. É o momento de ligar para a família.", "danger");

  doc.save(`GUIA_COORDENACAO_CETI_${new Date().getFullYear()}.pdf`);
}
