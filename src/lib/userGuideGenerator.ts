import jsPDF from "jspdf";

// ==================== DESIGN SYSTEM ====================
const COLORS = {
  primary: [13, 71, 161] as [number, number, number],      // Deep blue
  primaryLight: [33, 150, 243] as [number, number, number], // Bright blue
  dark: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  bgLight: [240, 245, 255] as [number, number, number],
  bgWarm: [248, 250, 252] as [number, number, number],
  border: [203, 213, 225] as [number, number, number],
  accent: [16, 185, 129] as [number, number, number],      // Green
  accentLight: [209, 250, 229] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  purple: [124, 58, 237] as [number, number, number],
  purpleLight: [237, 233, 254] as [number, number, number],
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 22;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ==================== HELPERS ====================
function drawGradientBar(doc: jsPDF, x: number, y: number, w: number, h: number) {
  // Simulated gradient using stacked rects
  const steps = 20;
  const stepW = w / steps;
  for (let i = 0; i < steps; i++) {
    const r = COLORS.primary[0] + (COLORS.primaryLight[0] - COLORS.primary[0]) * (i / steps);
    const g = COLORS.primary[1] + (COLORS.primaryLight[1] - COLORS.primary[1]) * (i / steps);
    const b = COLORS.primary[2] + (COLORS.primaryLight[2] - COLORS.primary[2]) * (i / steps);
    doc.setFillColor(r, g, b);
    doc.rect(x + i * stepW, y, stepW + 0.5, h, "F");
  }
}

function drawDecoCircles(doc: jsPDF, x: number, y: number, color: [number, number, number], opacity = 0.08) {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.setGState(new (doc as any).GState({ opacity }));
  doc.circle(x, y, 40, "F");
  doc.circle(x + 30, y - 20, 25, "F");
  doc.circle(x - 20, y + 30, 18, "F");
  doc.setGState(new (doc as any).GState({ opacity: 1 }));
}

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  drawGradientBar(doc, 0, 0, PAGE_W, 36);
  // Decorative line
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 36, PAGE_W, 2, "F");

  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, MARGIN, 15);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, MARGIN, 26);

  // Badge on the right
  doc.setFillColor(255, 255, 255);
  doc.setGState(new (doc as any).GState({ opacity: 0.2 }));
  doc.roundedRect(PAGE_W - 55, 8, 40, 20, 3, 3, "F");
  doc.setGState(new (doc as any).GState({ opacity: 1 }));
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("CETI DIGITAL", PAGE_W - 35, 20, { align: "center" });
}

function addFooter(doc: jsPDF, pageNum: number, totalLabel?: string) {
  // Footer line
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, PAGE_H - 18, PAGE_W - MARGIN, PAGE_H - 18);

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.text(`Página ${pageNum}`, MARGIN, PAGE_H - 12);
  doc.text(totalLabel || "CETI Digital — Sistema de Gestão Escolar", PAGE_W - MARGIN, PAGE_H - 12, { align: "right" });
  doc.setFontSize(6);
  doc.text("Documento gerado automaticamente • Uso interno", PAGE_W / 2, PAGE_H - 7, { align: "center" });
}

function newPage(doc: jsPDF, title: string, subtitle: string, pageNum: number): number {
  doc.addPage();
  addHeader(doc, title, subtitle);
  addFooter(doc, pageNum);
  return 48;
}

function checkPage(doc: jsPDF, y: number, needed: number, title: string, subtitle: string, page: { val: number }): number {
  if (y + needed > PAGE_H - 28) {
    page.val++;
    return newPage(doc, title, subtitle, page.val);
  }
  return y;
}

function sectionTitle(doc: jsPDF, y: number, num: string, title: string, color: [number, number, number] = COLORS.primary): number {
  // Colored left bar + number badge
  doc.setFillColor(...color);
  doc.roundedRect(MARGIN, y - 4, 4, 14, 1, 1, "F");

  // Number circle
  doc.setFillColor(...color);
  doc.circle(MARGIN + 14, y + 3, 5, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(num, MARGIN + 14, y + 5, { align: "center" });

  // Title text
  doc.setTextColor(...color);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, MARGIN + 23, y + 6);

  // Underline
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.line(MARGIN + 23, y + 9, MARGIN + 23 + doc.getTextWidth(title), y + 9);

  return y + 20;
}

function subTitle(doc: jsPDF, y: number, title: string): number {
  doc.setFillColor(...COLORS.primaryLight);
  doc.roundedRect(MARGIN + 4, y - 3, 3, 10, 1, 1, "F");
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title, MARGIN + 11, y + 4);
  return y + 12;
}

function paragraph(doc: jsPDF, y: number, text: string): number {
  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, CONTENT_W - 6);
  doc.text(lines, MARGIN + 3, y);
  return y + lines.length * 5 + 4;
}

function bullet(doc: jsPDF, y: number, items: string[]): number {
  doc.setFontSize(10);
  for (const item of items) {
    // Bullet dot
    doc.setFillColor(...COLORS.primaryLight);
    doc.circle(MARGIN + 9, y - 1.2, 1.5, "F");
    doc.setTextColor(...COLORS.dark);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(item, CONTENT_W - 16);
    doc.text(lines, MARGIN + 14, y);
    y += lines.length * 5 + 2.5;
  }
  return y + 2;
}

function tipBox(doc: jsPDF, y: number, text: string, type: "tip" | "warning" | "info" = "tip"): number {
  const config = {
    tip: { bg: COLORS.accentLight, border: COLORS.accent, icon: "💡", label: "DICA" },
    warning: { bg: [255, 243, 205] as [number, number, number], border: COLORS.warning, icon: "⚠️", label: "ATENÇÃO" },
    info: { bg: COLORS.bgLight, border: COLORS.primaryLight, icon: "ℹ️", label: "INFO" },
  };
  const c = config[type];

  const lines = doc.splitTextToSize(text, CONTENT_W - 22);
  const boxH = lines.length * 5 + 14;

  doc.setFillColor(...c.bg);
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 3, 3, "F");
  doc.setFillColor(...c.border);
  doc.roundedRect(MARGIN, y, 4, boxH, 2, 0, "F");

  doc.setTextColor(...c.border);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`${c.icon}  ${c.label}`, MARGIN + 8, y + 7);

  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(lines, MARGIN + 8, y + 13);

  return y + boxH + 6;
}

function numberedList(doc: jsPDF, y: number, items: string[]): number {
  doc.setFontSize(10);
  items.forEach((item, i) => {
    // Number badge
    doc.setFillColor(...COLORS.primary);
    doc.circle(MARGIN + 9, y - 1.2, 3.5, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(String(i + 1), MARGIN + 9, y, { align: "center" });

    doc.setTextColor(...COLORS.dark);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(item, CONTENT_W - 20);
    doc.text(lines, MARGIN + 16, y);
    y += lines.length * 5 + 4;
  });
  return y + 2;
}

// ==================== COVER PAGE ====================
function buildCover(doc: jsPDF, guideTitle: string, guideSubtitle: string, accentColor: [number, number, number]) {
  // Background
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  // Decorative circles
  try { drawDecoCircles(doc, PAGE_W - 30, 40, COLORS.white, 0.06); } catch {}
  try { drawDecoCircles(doc, 30, PAGE_H - 60, COLORS.white, 0.04); } catch {}

  // Top accent bar
  doc.setFillColor(...accentColor);
  doc.rect(0, 0, PAGE_W, 5, "F");

  // Logo area
  doc.setFillColor(255, 255, 255);
  try {
    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
    doc.roundedRect(55, 50, 100, 100, 50, 50, "F");
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
  } catch {}

  // Main title
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(42);
  doc.text("CETI", PAGE_W / 2, 90, { align: "center" });
  doc.setFontSize(42);
  doc.text("DIGITAL", PAGE_W / 2, 108, { align: "center" });

  // Subtitle
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Gestão Escolar", PAGE_W / 2, 122, { align: "center" });

  // Divider
  doc.setFillColor(...accentColor);
  doc.roundedRect(PAGE_W / 2 - 30, 135, 60, 2, 1, 1, "F");

  // Guide title box
  doc.setFillColor(255, 255, 255);
  try {
    doc.setGState(new (doc as any).GState({ opacity: 0.15 }));
    doc.roundedRect(35, 148, 140, 50, 6, 6, "F");
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
  } catch {}

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(guideTitle, PAGE_W / 2, 170, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(guideSubtitle, PAGE_W / 2, 182, { align: "center" });

  // Bottom info
  doc.setFontSize(10);
  doc.text("CETI Nova Itarana", PAGE_W / 2, 230, { align: "center" });

  const dateStr = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  doc.text(`Gerado em: ${dateStr}`, PAGE_W / 2, 240, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Versão ${new Date().getFullYear()}.1`, PAGE_W / 2, 252, { align: "center" });

  // Bottom accent bar
  doc.setFillColor(...accentColor);
  doc.rect(0, PAGE_H - 5, PAGE_W, 5, "F");
}

function buildTOC(doc: jsPDF, items: string[], page: { val: number }, headerTitle: string): number {
  page.val++;
  let y = newPage(doc, headerTitle, "Índice de Conteúdos", page.val);

  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(MARGIN, y - 4, CONTENT_W, items.length * 9 + 16, 4, 4, "F");

  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Índice", MARGIN + 8, y + 6);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const item of items) {
    doc.setFillColor(...COLORS.primaryLight);
    doc.circle(MARGIN + 10, y - 1, 1.5, "F");
    doc.setTextColor(...COLORS.dark);
    doc.text(item, MARGIN + 16, y);
    // Dotted line to right
    doc.setDrawColor(...COLORS.border);
    doc.setLineDashPattern([1, 1], 0);
    const tw = doc.getTextWidth(item);
    doc.line(MARGIN + 18 + tw, y - 0.5, PAGE_W - MARGIN - 5, y - 0.5);
    doc.setLineDashPattern([], 0);
    y += 9;
  }
  return y;
}

// ==================== MAIN GUIDE (COMPLETE) ====================
export function generateUserGuidePDF() {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const page = { val: 1 };
  const H = "CETI DIGITAL — Guia Completo";
  const S = "Manual do Usuário";

  buildCover(doc, "GUIA DO USUÁRIO", "Manual Completo do Sistema", COLORS.accent);
  addFooter(doc, 1);

  const toc = [
    "1. Visão Geral do Sistema",
    "2. Login e Autenticação",
    "3. Painel de Controle (Dashboard)",
    "4. Gestão de Alunos",
    "5. QR Codes",
    "6. Portaria — Scanner",
    "7. Movimentações",
    "8. Alertas",
    "9. Horários",
    "10. Ocorrências Disciplinares",
    "11. Relatórios",
    "12. Análise Avançada",
    "13. Turmas",
    "14. Calendário Escolar",
    "15. Autorizações de Saída",
    "16. Justificativas de Falta",
    "17. Portal dos Pais",
    "18. Gestão de Usuários",
    "19. Configurações",
    "20. Perfis e Permissões",
  ];
  buildTOC(doc, toc, page, H);

  // --- 1. Visão Geral ---
  page.val++; let y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "1", "Visão Geral do Sistema");
  y = paragraph(doc, y, "O CETI Digital é um sistema completo de gestão escolar desenvolvido para o Centro de Educação em Tempo Integral. Ele permite o controle de entrada e saída de alunos via QR Code, gestão disciplinar, comunicação com responsáveis e análise de dados em tempo real.");
  y = subTitle(doc, y, "Principais Funcionalidades");
  y = bullet(doc, y, [
    "Controle de portaria com leitura de QR Code",
    "Registro e acompanhamento de movimentações (entradas/saídas)",
    "Sistema de alertas automáticos (faltas, saídas excessivas)",
    "Gestão de ocorrências disciplinares com geração de PDF",
    "Comunicação com responsáveis via WhatsApp",
    "Portal exclusivo para pais acompanharem seus filhos",
    "Relatórios detalhados e análises estatísticas",
    "Calendário escolar com eventos",
    "Autorizações de saída e justificativas de falta",
    "Gestão de turmas, horários e usuários do sistema",
  ]);
  y = tipBox(doc, y, "O sistema funciona 100% no navegador. Recomendamos usar Google Chrome para melhor compatibilidade.");

  // --- 2. Login ---
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "2", "Login e Autenticação");
  y = paragraph(doc, y, "Ao acessar o sistema, você verá a tela de login. Existem duas formas de acesso:");
  y = subTitle(doc, y, "Login com Email e Senha");
  y = paragraph(doc, y, "Digite seu email institucional e a senha fornecida pelo administrador. Clique em \"Acessar Sistema\" para entrar.");
  y = subTitle(doc, y, "Login com Google");
  y = paragraph(doc, y, "Clique no botão \"Entrar com Google\" para usar sua conta Google vinculada à instituição.");
  y = tipBox(doc, y, "Se você esqueceu sua senha, entre em contato com o administrador do sistema para redefinição.");

  // --- 3. Dashboard ---
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "3", "Painel de Controle (Dashboard)");
  y = paragraph(doc, y, "O Dashboard é a página principal do sistema. Ele apresenta um resumo visual com:");
  y = bullet(doc, y, [
    "Total de alunos cadastrados e ativos",
    "Movimentações do dia (entradas e saídas)",
    "Alertas pendentes que precisam de atenção",
    "Gráficos de movimentação ao longo do dia",
    "Resumo de ocorrências recentes",
  ]);
  y = paragraph(doc, y, "O dashboard é atualizado em tempo real conforme novos eventos são registrados.");

  // --- 4. Gestão de Alunos ---
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "4", "Gestão de Alunos");
  y = subTitle(doc, y, "Listagem de Alunos");
  y = paragraph(doc, y, "Acesse a página \"Alunos\" no menu lateral. Use a barra de busca para localizar alunos rapidamente por nome, matrícula ou turma.");
  y = subTitle(doc, y, "Cadastrar Novo Aluno");
  y = paragraph(doc, y, "Clique em \"Novo Aluno\" para abrir o formulário de cadastro. Preencha:");
  y = bullet(doc, y, [
    "Nome completo do aluno",
    "Número de matrícula (único)",
    "Série e turma",
    "Modalidade (integral ou técnico)",
    "Dados do responsável (nome, telefone, relação)",
  ]);
  y = subTitle(doc, y, "Importação em Massa");
  y = paragraph(doc, y, "Para cadastrar muitos alunos de uma vez, acesse \"Importar Alunos\". Prepare um arquivo seguindo o modelo e faça o upload.");
  y = tipBox(doc, y, "Mantenha os dados dos alunos sempre atualizados para garantir o funcionamento correto das notificações e relatórios.");

  // --- 5. QR Codes ---
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "5", "QR Codes");
  y = paragraph(doc, y, "Cada aluno cadastrado recebe automaticamente um QR Code único. A página de QR Codes permite:");
  y = bullet(doc, y, [
    "Visualizar todos os QR Codes gerados",
    "Filtrar por turma ou série",
    "Imprimir carteirinhas individuais ou em lote",
    "Baixar QR Codes para impressão",
  ]);
  y = tipBox(doc, y, "Recomendamos imprimir os QR Codes em carteirinhas plastificadas para maior durabilidade.");

  // --- 6. Portaria ---
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "6", "Portaria — Scanner de Entrada/Saída");
  y = paragraph(doc, y, "A portaria é o módulo principal para controle de acesso com scanner de QR Code em tempo real.");
  y = subTitle(doc, y, "Como Usar");
  y = numberedList(doc, y, [
    "Acesse a página \"Portaria\" no menu",
    "Ative o scanner clicando no botão de câmera",
    "Aponte a câmera para o QR Code do aluno",
    "O sistema registra automaticamente a movimentação",
    "Os dados do aluno são exibidos com confirmação visual e sonora",
  ]);
  y = tipBox(doc, y, "Use um tablet ou celular com boa câmera na portaria. Certifique-se de boa iluminação.");

  // --- 7. Movimentações ---
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "7", "Movimentações");
  y = paragraph(doc, y, "A página de Movimentações mostra o histórico completo de entradas e saídas:");
  y = bullet(doc, y, [
    "Filtrar por data, aluno, turma ou tipo (entrada/saída)",
    "Ver detalhes com horário exato",
    "Identificar padrões de atraso ou ausência",
    "Exportar dados para análise externa",
  ]);

  // --- 8. Alertas ---
  y = checkPage(doc, y, 70, H, S, page);
  y = sectionTitle(doc, y, "8", "Alertas");
  y = paragraph(doc, y, "O sistema gera alertas automáticos para situações que exigem atenção:");
  y = bullet(doc, y, [
    "Aluno ausente — não registrou entrada no dia",
    "Não retornou — saiu e não voltou no período",
    "Horário irregular — movimentação fora do previsto",
    "Saídas excessivas — excedeu o limite permitido",
  ]);
  y = tipBox(doc, y, "Verifique os alertas diariamente para manter o controle e segurança dos alunos.", "warning");

  // --- 9. Horários ---
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "9", "Horários");
  y = paragraph(doc, y, "Configure os períodos de entrada, saída e intervalo. Esses horários são usados para:");
  y = bullet(doc, y, [
    "Detectar atrasos automaticamente",
    "Gerar alertas de horário irregular",
    "Definir tolerâncias para cada período",
    "Calcular estatísticas de pontualidade",
  ]);

  // --- 10. Ocorrências ---
  y = checkPage(doc, y, 80, H, S, page);
  y = sectionTitle(doc, y, "10", "Ocorrências Disciplinares");
  y = paragraph(doc, y, "Registre e gerencie incidentes disciplinares:");
  y = bullet(doc, y, [
    "Saída sem autorização • Responsável buscou o aluno",
    "Aluno passou mal • Comportamento inadequado",
    "Atraso • Outros",
  ]);
  y = bullet(doc, y, [
    "Gerar comunicado disciplinar em PDF para impressão",
    "Enviar notificação via WhatsApp para o responsável",
    "Visualizar histórico completo com timeline",
  ]);
  y = tipBox(doc, y, "Sempre preencha a descrição detalhada para que o comunicado em PDF fique completo.", "info");

  // --- 11-16. Relatórios, Analytics, Turmas, Calendário, Autorizações, Justificativas ---
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "11", "Relatórios");
  y = bullet(doc, y, [
    "Relatório de frequência por turma/série",
    "Relatório de movimentações diárias",
    "Relatório de ocorrências por período",
    "Relatório de alunos com alertas recorrentes",
  ]);

  y = checkPage(doc, y, 50, H, S, page);
  y = sectionTitle(doc, y, "12", "Análise Avançada (Analytics)");
  y = bullet(doc, y, [
    "Gráficos de tendência de frequência",
    "Comparativo entre turmas e séries",
    "Indicadores de risco",
    "Métricas de pontualidade e assiduidade",
  ]);

  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "13", "Turmas");
  y = paragraph(doc, y, "Visualize a distribuição dos alunos por série e turma, acesse listas e estatísticas de presença.");

  y = checkPage(doc, y, 50, H, S, page);
  y = sectionTitle(doc, y, "14", "Calendário Escolar");
  y = bullet(doc, y, [
    "Adicionar eventos com título, descrição e tipo",
    "Visualização mensal dos eventos",
    "Tipos: feriado, reunião, evento escolar, prova, recesso",
  ]);

  y = checkPage(doc, y, 50, H, S, page);
  y = sectionTitle(doc, y, "15", "Autorizações de Saída");
  y = bullet(doc, y, [
    "Registrar autorização com motivo e validade",
    "Definir quem autorizou a saída",
    "Expiração automática no horário definido",
    "Histórico completo de autorizações",
  ]);

  y = checkPage(doc, y, 50, H, S, page);
  y = sectionTitle(doc, y, "16", "Justificativas de Falta");
  y = bullet(doc, y, [
    "Responsáveis enviam via Portal dos Pais",
    "Coordenação analisa e aprova/rejeita",
    "Histórico registrado no sistema",
  ]);

  // --- 17. Portal dos Pais ---
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "17", "Portal dos Pais");
  y = paragraph(doc, y, "Interface exclusiva para responsáveis acompanharem a vida escolar dos filhos via link personalizado (token único).");
  y = subTitle(doc, y, "O que o responsável pode ver:");
  y = bullet(doc, y, [
    "Dados do aluno (nome, matrícula, série, turma)",
    "Histórico de movimentações",
    "Ocorrências disciplinares",
    "Alertas relacionados ao aluno",
    "Enviar justificativas de falta",
  ]);
  y = tipBox(doc, y, "O link do portal é enviado via WhatsApp para os responsáveis cadastrados.");

  // --- 18-19. Usuários e Configurações ---
  y = checkPage(doc, y, 70, H, S, page);
  y = sectionTitle(doc, y, "18", "Gestão de Usuários");
  y = bullet(doc, y, [
    "Criar novos usuários com email e senha",
    "Atribuir perfis de acesso (admin, coordenador, porteiro, usuário)",
    "Desativar ou remover usuários",
  ]);

  y = checkPage(doc, y, 60, H, S, page);
  y = sectionTitle(doc, y, "19", "Configurações do Sistema");
  y = bullet(doc, y, [
    "Nome da escola e telefone de contato",
    "Limite padrão de saídas por aluno",
    "Ativar/desativar notificações via WhatsApp",
    "Configurar chave API do CallMeBot",
    "Ativar/desativar o sistema inteiro",
  ]);

  // --- 20. Perfis ---
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "20", "Perfis e Permissões");
  y = paragraph(doc, y, "O sistema possui 4 perfis com diferentes permissões:");
  y = subTitle(doc, y, "Administrador (Admin)");
  y = paragraph(doc, y, "Acesso total. Gerencia usuários, configurações, horários e todas as funcionalidades.");
  y = subTitle(doc, y, "Coordenador");
  y = paragraph(doc, y, "Gestão pedagógica: alunos, ocorrências, alertas, relatórios, análises, turmas, calendário.");
  y = subTitle(doc, y, "Porteiro (Gatekeeper)");
  y = paragraph(doc, y, "Acesso à portaria e movimentações. Leitura de QR Codes e registro de entradas/saídas.");
  y = subTitle(doc, y, "Usuário Básico");
  y = paragraph(doc, y, "Acesso limitado ao dashboard e informações básicas.");

  // Final
  y += 10;
  y = checkPage(doc, y, 35, H, S, page);
  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(MARGIN, y, CONTENT_W, 28, 4, 4, "F");
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(MARGIN, y, 4, 28, 2, 0, "F");
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Precisa de ajuda?", MARGIN + 10, y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.text("Entre em contato com o administrador do sistema ou a equipe de suporte técnico.", MARGIN + 10, y + 20);

  doc.save(`Guia_Usuario_CETI_Digital_${new Date().getFullYear()}.pdf`);
}

// ==================== GATEKEEPER GUIDE ====================
export function generateGatekeeperGuidePDF() {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const page = { val: 1 };
  const H = "CETI DIGITAL — Guia do Porteiro";
  const S = "Operações de Portaria";

  buildCover(doc, "GUIA DO PORTEIRO", "Manual de Operações de Portaria", COLORS.accent);
  addFooter(doc, 1);

  const toc = [
    "1. Sua Função no Sistema",
    "2. Como Fazer Login",
    "3. Tela da Portaria",
    "4. Escaneando QR Codes",
    "5. Entradas e Saídas",
    "6. Mural de Avisos",
    "7. Situações Especiais",
    "8. Resolução de Problemas",
  ];
  buildTOC(doc, toc, page, H);

  // 1
  page.val++; let y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "1", "Sua Função no Sistema", COLORS.accent);
  y = paragraph(doc, y, "Como porteiro, você é a primeira linha de controle de acesso da escola. Sua função principal é registrar entradas e saídas de alunos usando o scanner de QR Code.");
  y = tipBox(doc, y, "Você só precisa usar duas telas: a Portaria (scanner) e as Movimentações (histórico). O sistema cuida do resto!", "info");

  // 2
  y = checkPage(doc, y, 60, H, S, page);
  y = sectionTitle(doc, y, "2", "Como Fazer Login", COLORS.accent);
  y = numberedList(doc, y, [
    "Abra o navegador e acesse o endereço do sistema",
    "Digite seu email e senha fornecidos pela coordenação",
    "Clique em \"Acessar Sistema\"",
    "Você será direcionado automaticamente para a tela da Portaria",
  ]);
  y = tipBox(doc, y, "Se sua senha não funcionar, peça à coordenação para redefinir. Não compartilhe sua senha com ninguém.", "warning");

  // 3
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "3", "Tela da Portaria", COLORS.accent);
  y = paragraph(doc, y, "A tela da portaria possui os seguintes elementos:");
  y = bullet(doc, y, [
    "Botão de Scanner — Ativa a câmera para leitura do QR Code",
    "Botões de Entrada/Saída — Selecionam o tipo de movimentação",
    "Painel de Informações — Mostra os dados do último aluno escaneado",
    "Mural de Avisos — Mensagens importantes da coordenação",
    "Histórico Recente — Últimas movimentações registradas",
  ]);

  // 4
  y = checkPage(doc, y, 80, H, S, page);
  y = sectionTitle(doc, y, "4", "Escaneando QR Codes", COLORS.accent);
  y = subTitle(doc, y, "Passo a Passo");
  y = numberedList(doc, y, [
    "Clique no botão do scanner para ativar a câmera",
    "Peça ao aluno que mostre sua carteirinha com o QR Code",
    "Aponte a câmera do dispositivo para o QR Code",
    "Aguarde o bipe de confirmação e verifique os dados na tela",
    "Confirme que o nome e a foto correspondem ao aluno",
  ]);
  y = tipBox(doc, y, "Mantenha o dispositivo estável e garanta boa iluminação. QR Codes amassados ou sujos podem demorar mais para ler.");

  // 5
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "5", "Entradas e Saídas", COLORS.accent);
  y = paragraph(doc, y, "O sistema detecta automaticamente se é entrada ou saída com base no último registro do aluno. Porém, você também pode selecionar manualmente:");
  y = bullet(doc, y, [
    "Botão ENTRADA (verde) — Registra a chegada do aluno",
    "Botão SAÍDA (vermelho) — Registra a saída do aluno",
  ]);
  y = tipBox(doc, y, "Se um aluno tentar sair sem autorização, o sistema exibirá um alerta. Nesse caso, encaminhe o aluno à coordenação.", "warning");

  y = subTitle(doc, y, "Confirmação Visual");
  y = bullet(doc, y, [
    "Tela VERDE = Entrada registrada com sucesso",
    "Tela VERMELHA = Saída registrada",
    "Alerta AMARELO = Situação irregular (ex: saída sem autorização)",
  ]);

  // 6
  y = checkPage(doc, y, 50, H, S, page);
  y = sectionTitle(doc, y, "6", "Mural de Avisos", COLORS.accent);
  y = paragraph(doc, y, "A coordenação pode enviar avisos que aparecem na sua tela da portaria. Fique atento a:");
  y = bullet(doc, y, [
    "Avisos de prioridade URGENTE (em vermelho)",
    "Avisos sobre alunos com restrição de saída",
    "Comunicados sobre eventos ou horários especiais",
  ]);

  // 7
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "7", "Situações Especiais", COLORS.accent);
  y = subTitle(doc, y, "Aluno sem carteirinha");
  y = paragraph(doc, y, "Se o aluno esqueceu a carteirinha, busque-o pelo nome na lista de alunos e registre a movimentação manualmente.");
  y = subTitle(doc, y, "Responsável buscando aluno");
  y = paragraph(doc, y, "Registre a saída normalmente e informe a coordenação. O sistema permite registrar esse tipo de ocorrência.");
  y = subTitle(doc, y, "Aluno com saída não autorizada");
  y = paragraph(doc, y, "NÃO permita a saída. Encaminhe imediatamente à coordenação. O sistema alertará automaticamente.");
  y = tipBox(doc, y, "Na dúvida, sempre encaminhe o aluno à coordenação antes de liberar a saída.", "warning");

  // 8
  y = checkPage(doc, y, 70, H, S, page);
  y = sectionTitle(doc, y, "8", "Resolução de Problemas", COLORS.accent);
  y = subTitle(doc, y, "Câmera não funciona");
  y = paragraph(doc, y, "Verifique se o navegador tem permissão de câmera. Tente recarregar a página. Se persistir, use outro dispositivo.");
  y = subTitle(doc, y, "QR Code não é reconhecido");
  y = paragraph(doc, y, "Limpe a lente da câmera. Peça ao aluno que alise a carteirinha. Tente em ambiente com mais luz.");
  y = subTitle(doc, y, "Sistema lento ou travado");
  y = paragraph(doc, y, "Recarregue a página (F5). Se persistir, feche e abra o navegador. Em último caso, reinicie o dispositivo.");

  // Final
  y += 10;
  y = checkPage(doc, y, 30, H, S, page);
  doc.setFillColor(...COLORS.accentLight);
  doc.roundedRect(MARGIN, y, CONTENT_W, 28, 4, 4, "F");
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(MARGIN, y, 4, 28, 2, 0, "F");
  doc.setTextColor(...COLORS.accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Dúvidas? Fale com a coordenação!", MARGIN + 10, y + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  doc.text("Este guia cobre as operações essenciais. Para situações não previstas, consulte a coordenação.", MARGIN + 10, y + 21);

  doc.save(`Guia_Porteiro_CETI_Digital_${new Date().getFullYear()}.pdf`);
}

// ==================== COORDINATION GUIDE ====================
export function generateCoordinationGuidePDF() {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const page = { val: 1 };
  const H = "CETI DIGITAL — Guia da Coordenação";
  const S = "Gestão & Coordenação";

  buildCover(doc, "GUIA DA COORDENAÇÃO", "Manual de Gestão Pedagógica e Administrativa", COLORS.purple);
  addFooter(doc, 1);

  const toc = [
    "1. Visão Geral da Coordenação",
    "2. Dashboard e Indicadores",
    "3. Gestão de Alunos",
    "4. Ocorrências e Disciplina",
    "5. Alertas e Monitoramento",
    "6. Relatórios e Análises",
    "7. Comunicação com Pais",
    "8. Turmas e Horários",
    "9. Calendário e Eventos",
    "10. Autorizações e Justificativas",
    "11. Gestão de Usuários",
    "12. Configurações do Sistema",
  ];
  buildTOC(doc, toc, page, H);

  // 1
  page.val++; let y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "1", "Visão Geral da Coordenação", COLORS.purple);
  y = paragraph(doc, y, "Como coordenador(a), você tem acesso a praticamente todas as funcionalidades do sistema. Sua função é garantir o acompanhamento pedagógico dos alunos, monitorar frequência, gerenciar ocorrências e se comunicar com os responsáveis.");
  y = subTitle(doc, y, "Suas Responsabilidades no Sistema");
  y = bullet(doc, y, [
    "Monitorar o dashboard diariamente para identificar situações críticas",
    "Resolver alertas pendentes de alunos ausentes ou com saídas excessivas",
    "Registrar e acompanhar ocorrências disciplinares",
    "Analisar relatórios de frequência e comportamento",
    "Gerenciar autorizações de saída e justificativas de falta",
    "Manter comunicação com responsáveis via WhatsApp",
  ]);

  // 2
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "2", "Dashboard e Indicadores", COLORS.purple);
  y = paragraph(doc, y, "O Dashboard é sua principal ferramenta de monitoramento diário. Ao acessar, verifique:");
  y = numberedList(doc, y, [
    "Quantidade de alertas pendentes (resolver com urgência)",
    "Total de movimentações do dia (entradas vs. saídas)",
    "Gráfico de presença para identificar turmas com baixa frequência",
    "Ocorrências registradas no dia",
  ]);
  y = tipBox(doc, y, "Acesse o dashboard logo pela manhã para identificar alunos ausentes e tomar providências rapidamente.", "warning");

  // 3
  y = checkPage(doc, y, 70, H, S, page);
  y = sectionTitle(doc, y, "3", "Gestão de Alunos", COLORS.purple);
  y = paragraph(doc, y, "Você pode cadastrar, editar e gerenciar todos os alunos. Funcionalidades-chave:");
  y = bullet(doc, y, [
    "Cadastro individual ou importação em massa via arquivo",
    "Edição de dados: nome, matrícula, série, turma, modalidade",
    "Cadastro de responsáveis com telefone para notificações",
    "Geração de QR Codes e declarações de matrícula em PDF",
    "Ativação/desativação de alunos transferidos",
  ]);

  // 4
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "4", "Ocorrências e Disciplina", COLORS.purple);
  y = paragraph(doc, y, "O módulo de ocorrências é essencial para o registro formal de incidentes disciplinares:");
  y = subTitle(doc, y, "Fluxo de Trabalho");
  y = numberedList(doc, y, [
    "Receba o relato do professor ou porteiro sobre o incidente",
    "Acesse a página de Ocorrências e clique em \"Nova Ocorrência\"",
    "Selecione o aluno e o tipo de ocorrência",
    "Preencha a descrição detalhada do incidente",
    "Gere o comunicado disciplinar em PDF para impressão",
    "Envie notificação via WhatsApp para o responsável (se configurado)",
  ]);
  y = tipBox(doc, y, "Comunicados disciplinares em PDF possuem código de autenticidade e podem ser usados como documento oficial.");

  // 5
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "5", "Alertas e Monitoramento", COLORS.purple);
  y = paragraph(doc, y, "O sistema gera alertas automáticos que exigem sua atenção:");
  y = bullet(doc, y, [
    "AUSENTE — Aluno não registrou entrada. Verifique se há justificativa",
    "NÃO RETORNOU — Aluno saiu e não voltou. Contacte o responsável",
    "HORÁRIO IRREGULAR — Movimentação fora do esperado. Investigue",
    "SAÍDAS EXCESSIVAS — Aluno excedeu limite. Converse com o aluno",
  ]);
  y = subTitle(doc, y, "Resolvendo Alertas");
  y = paragraph(doc, y, "Para resolver um alerta, clique nele e registre a ação tomada. O sistema registra quem resolveu e quando, criando um histórico de ações.");
  y = tipBox(doc, y, "Alertas não resolvidos são destacados no dashboard. Resolva-os diariamente para manter o controle.", "warning");

  // 6
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "6", "Relatórios e Análises", COLORS.purple);
  y = subTitle(doc, y, "Relatórios Disponíveis");
  y = bullet(doc, y, [
    "Frequência por turma — Identifique turmas com baixa presença",
    "Movimentações diárias — Controle de entradas e saídas",
    "Ocorrências por período — Análise de incidentes ao longo do tempo",
    "Alunos em risco — Padrões preocupantes de frequência",
  ]);
  y = subTitle(doc, y, "Analytics Avançado");
  y = paragraph(doc, y, "O módulo Analytics oferece gráficos interativos e comparativos entre turmas, indicadores de risco e tendências ao longo do ano letivo. Use esses dados para tomar decisões pedagógicas informadas.");

  // 7
  y = checkPage(doc, y, 70, H, S, page);
  y = sectionTitle(doc, y, "7", "Comunicação com Pais", COLORS.purple);
  y = paragraph(doc, y, "A comunicação com responsáveis é feita por dois canais:");
  y = subTitle(doc, y, "WhatsApp Automático");
  y = paragraph(doc, y, "Quando configurado, o sistema envia notificações automáticas sobre ocorrências e alertas diretamente para o WhatsApp do responsável.");
  y = subTitle(doc, y, "Portal dos Pais");
  y = paragraph(doc, y, "Cada responsável recebe um link exclusivo para acompanhar a vida escolar do filho: movimentações, ocorrências, alertas e envio de justificativas.");

  // 8
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "8", "Turmas e Horários", COLORS.purple);
  y = subTitle(doc, y, "Gestão de Turmas");
  y = paragraph(doc, y, "Visualize a distribuição de alunos por série e turma, acesse listas e verifique estatísticas de presença por turma.");
  y = subTitle(doc, y, "Configuração de Horários");
  y = paragraph(doc, y, "Configure os horários de entrada, saída e intervalo. O sistema usa essas informações para detectar atrasos e gerar alertas de horário irregular automaticamente.");

  // 9
  y = checkPage(doc, y, 50, H, S, page);
  y = sectionTitle(doc, y, "9", "Calendário e Eventos", COLORS.purple);
  y = paragraph(doc, y, "Gerencie o calendário escolar com eventos como feriados, reuniões de pais, conselhos de classe e provas. Os eventos são visíveis para toda a equipe.");

  // 10
  y = checkPage(doc, y, 60, H, S, page);
  y = sectionTitle(doc, y, "10", "Autorizações e Justificativas", COLORS.purple);
  y = subTitle(doc, y, "Autorizações de Saída");
  y = paragraph(doc, y, "Emita autorizações formais para saídas antecipadas com motivo, responsável e validade. O porteiro pode verificar no sistema antes de liberar o aluno.");
  y = subTitle(doc, y, "Justificativas de Falta");
  y = paragraph(doc, y, "Analise justificativas enviadas pelos pais via Portal. Aprove ou rejeite com observações.");

  // 11-12
  page.val++; y = newPage(doc, H, S, page.val);
  y = sectionTitle(doc, y, "11", "Gestão de Usuários", COLORS.purple);
  y = paragraph(doc, y, "Se você tiver permissão de admin, pode criar e gerenciar contas de porteiros e outros coordenadores. Atribua perfis adequados para cada função.");
  y = tipBox(doc, y, "Revise periodicamente os acessos dos usuários. Desative contas de colaboradores que saíram da escola.", "warning");

  y = checkPage(doc, y, 60, H, S, page);
  y = sectionTitle(doc, y, "12", "Configurações do Sistema", COLORS.purple);
  y = bullet(doc, y, [
    "Nome da escola e telefone",
    "Limite padrão de saídas semanais",
    "Ativar/desativar WhatsApp e feedback sonoro",
    "Suspender/ativar o sistema para manutenções",
  ]);
  y = tipBox(doc, y, "Altere configurações com cuidado — elas afetam todo o funcionamento do sistema para todos os usuários.");

  // Final
  y += 10;
  y = checkPage(doc, y, 30, H, S, page);
  doc.setFillColor(...COLORS.purpleLight);
  doc.roundedRect(MARGIN, y, CONTENT_W, 28, 4, 4, "F");
  doc.setFillColor(...COLORS.purple);
  doc.roundedRect(MARGIN, y, 4, 28, 2, 0, "F");
  doc.setTextColor(...COLORS.purple);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Apoio Técnico", MARGIN + 10, y + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  doc.text("Para suporte técnico, entre em contato com o administrador do sistema.", MARGIN + 10, y + 21);

  doc.save(`Guia_Coordenacao_CETI_Digital_${new Date().getFullYear()}.pdf`);
}
