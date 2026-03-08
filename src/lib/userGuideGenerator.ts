import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MANUAL_ASSETS } from "./manualAssets";

// ==================== DESIGN SYSTEM (Reference Style) ====================
const C = {
  slate: [30, 41, 59] as [number, number, number],       // #1e293b
  slateLight: [51, 65, 85] as [number, number, number],  // #334155
  amber: [217, 119, 6] as [number, number, number],      // #d97706
  white: [255, 255, 255] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
  gray: [100, 116, 139] as [number, number, number],
  grayLight: [241, 245, 249] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  blue: [37, 99, 235] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
};

const PW = 210, PH = 297, M = 25, CW = PW - M * 2;

// ==================== LAYOUT PRIMITIVES ====================
function footer(doc: jsPDF, pageNum: number, guideTitle: string) {
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(M, PH - 18, PW - M, PH - 18);
  doc.setFontSize(7);
  doc.setTextColor(...C.gray);
  doc.setFont("helvetica", "normal");
  doc.text("CETINI Nova Itarana — Sistema de Controle de Acesso", M, PH - 12);
  doc.text(`${guideTitle} v2.0`, PW - M, PH - 12, { align: "right" });
  doc.setTextColor(...C.border);
  doc.text(`${pageNum}`, PW / 2, PH - 12, { align: "center" });
}

function np(doc: jsPDF, page: { val: number }, guideTitle: string): number {
  doc.addPage();
  page.val++;
  footer(doc, page.val, guideTitle);
  return 30;
}

function ensureSpace(doc: jsPDF, y: number, needed: number, page: { val: number }, guideTitle: string): number {
  if (y + needed > PH - 30) return np(doc, page, guideTitle);
  return y;
}

// ==================== COVER ====================
function cover(doc: jsPDF, guideTitle: string, subtitle: string) {
  // Dark blue top
  doc.setFillColor(...C.slate);
  doc.rect(0, 0, PW, 160, "F");

  // Blue accent stripe
  doc.setFillColor(...C.blue);
  doc.rect(0, 0, PW, 6, "F");

  // Logo
  try { doc.addImage(MANUAL_ASSETS.logo, "PNG", M, 25, 35, 35); } catch {}

  // School name
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("Colégio Estadual de Tempo", PW / 2, 90, { align: "center" });
  doc.text("Integral de Nova Itarana", PW / 2, 104, { align: "center" });

  // Amber subtitle
  doc.setTextColor(...C.amber);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("CETINI — Nova Itarana, Bahia", PW / 2, 118, { align: "center" });

  // Amber line
  doc.setDrawColor(...C.amber);
  doc.setLineWidth(0.8);
  doc.line(PW / 2 - 20, 125, PW / 2 + 20, 125);

  // White area below
  doc.setTextColor(...C.slate);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(guideTitle, PW / 2, 185, { align: "center" });

  doc.setTextColor(...C.gray);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(subtitle, CW - 20);
  doc.text(lines, PW / 2, 198, { align: "center" });

  // Version info
  doc.setFontSize(9);
  doc.setTextColor(...C.gray);
  doc.text("Versão 2.0  |  Março de 2026  |  Uso Interno", PW / 2, PH - 40, { align: "center" });

  // Footer line
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(M, PH - 30, PW - M, PH - 30);
  doc.setFontSize(7);
  doc.text("CETINI Nova Itarana — Sistema de Controle de Acesso v2.0", PW / 2, PH - 24, { align: "center" });
}

// ==================== TABLE OF CONTENTS ====================
function toc(doc: jsPDF, page: { val: number }, guideTitle: string, sections: { group: string; items: { num: number; title: string }[] }[]) {
  let y = np(doc, page, guideTitle);

  doc.setTextColor(...C.slate);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("Sumário", M, y);
  doc.setDrawColor(...C.amber);
  doc.setLineWidth(1.2);
  doc.line(M, y + 4, M + 50, y + 4);
  y += 20;

  for (const section of sections) {
    y = ensureSpace(doc, y, 15, page, guideTitle);
    doc.setTextColor(...C.gray);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(section.group.toUpperCase(), M, y);
    y += 8;

    for (const item of section.items) {
      y = ensureSpace(doc, y, 10, page, guideTitle);
      doc.setTextColor(...C.slate);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(item.num.toString(), M, y);
      doc.setFont("helvetica", "normal");
      doc.text(item.title, M + 12, y);
      y += 9;
    }
    y += 4;
  }
}

// ==================== SECTION HEADER (numbered dark badge + title) ====================
function sectionHeader(doc: jsPDF, y: number, num: string, title: string, subtitle: string): number {
  // Dark rounded badge
  doc.setFillColor(...C.slate);
  doc.roundedRect(M, y, 18, 18, 4, 4, "F");
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(num, M + 9, y + 12, { align: "center" });

  // Title
  doc.setTextColor(...C.slate);
  doc.setFontSize(20);
  doc.text(title, M + 24, y + 8);

  // Subtitle
  doc.setTextColor(...C.gray);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(subtitle, M + 24, y + 16);

  // Dashed separator
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(M, y + 24, PW - M, y + 24);
  doc.setLineDashPattern([], 0);

  return y + 34;
}

// ==================== SUB-HEADING (vertical bar accent) ====================
function subHeading(doc: jsPDF, y: number, text: string): number {
  doc.setFillColor(...C.slate);
  doc.rect(M, y - 5, 3, 8, "F");
  doc.setTextColor(...C.slate);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(text, M + 8, y);
  return y + 10;
}

// ==================== BODY TEXT ====================
function body(doc: jsPDF, y: number, text: string): number {
  doc.setTextColor(...C.slate);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, CW);
  doc.text(lines, M, y);
  return y + lines.length * 4.5 + 4;
}

function bodyBold(doc: jsPDF, y: number, text: string): number {
  doc.setTextColor(...C.slate);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, CW);
  doc.text(lines, M, y);
  return y + lines.length * 4.5 + 4;
}

// ==================== NUMBERED STEPS ====================
function steps(doc: jsPDF, y: number, items: string[], page: { val: number }, guideTitle: string): number {
  for (let i = 0; i < items.length; i++) {
    y = ensureSpace(doc, y, 14, page, guideTitle);
    // Circle
    doc.setFillColor(...C.slate);
    doc.circle(M + 5, y, 4.5, "F");
    doc.setTextColor(...C.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text((i + 1).toString(), M + 5, y + 1.5, { align: "center" });

    // Text
    doc.setTextColor(...C.slate);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(items[i], CW - 18);
    doc.text(lines, M + 14, y + 1);
    y += lines.length * 5 + 5;
  }
  return y + 2;
}

// ==================== INFO / TIP BOX ====================
function infoBox(doc: jsPDF, y: number, title: string, text: string, type: "info" | "warning" | "danger" = "info"): number {
  const accentColor = type === "warning" ? C.amber : type === "danger" ? C.red : C.blue;
  const bgColor: [number, number, number] = type === "warning" ? [255, 251, 235] : type === "danger" ? [254, 242, 242] : [239, 246, 255];

  const lines = doc.splitTextToSize(text, CW - 22);
  const h = lines.length * 4.5 + 16;

  doc.setFillColor(...bgColor);
  doc.roundedRect(M, y, CW, h, 3, 3, "F");
  doc.setFillColor(...accentColor);
  doc.rect(M, y + 3, 3, h - 6, "F");

  // Icon square
  doc.setFillColor(...accentColor);
  doc.roundedRect(M + 10, y + 5, 8, 8, 2, 2, "F");
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(type === "warning" ? "!" : type === "danger" ? "✕" : "i", M + 14, y + 10.5, { align: "center" });

  // Title
  doc.setTextColor(...C.slate);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(title, M + 22, y + 11);

  // Text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.slateLight);
  doc.text(lines, M + 12, y + 20);

  return y + h + 6;
}

// ==================== TABLE ====================
function table(doc: jsPDF, y: number, head: string[], rows: string[][]): number {
  autoTable(doc, {
    startY: y,
    head: [head],
    body: rows,
    theme: "grid",
    margin: { left: M, right: M },
    headStyles: {
      fillColor: C.slate,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      textColor: C.slate,
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      lineColor: C.border,
      lineWidth: 0.3,
      cellPadding: 4,
    },
  });
  return (doc as any).lastAutoTable.finalY + 8;
}

// ==================== FEATURE GRID (2x2 like reference) ====================
function featureGrid(doc: jsPDF, y: number, features: { icon: string; title: string; desc: string }[]): number {
  const colW = CW / 2 - 4;
  const rowH = 45;

  for (let i = 0; i < features.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const fx = M + col * (colW + 8);
    const fy = y + row * rowH;

    // Vertical dashed separator
    if (col === 1) {
      doc.setDrawColor(...C.border);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(M + colW + 4, fy, M + colW + 4, fy + rowH - 5);
      doc.setLineDashPattern([], 0);
    }
    // Horizontal dashed separator
    if (row > 0 && col === 0) {
      doc.setDrawColor(...C.border);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(M, fy - 3, PW - M, fy - 3);
      doc.setLineDashPattern([], 0);
    }

    // Icon badge
    doc.setFillColor(...C.slate);
    doc.roundedRect(fx, fy, 6, 6, 1, 1, "F");
    doc.setTextColor(...C.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.text(features[i].icon, fx + 3, fy + 4.2, { align: "center" });

    // Title
    doc.setTextColor(...C.slate);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(features[i].title, fx + 10, fy + 5);

    // Description
    doc.setTextColor(...C.gray);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(features[i].desc, colW - 12);
    doc.text(lines, fx, fy + 13);
  }

  const rows = Math.ceil(features.length / 2);
  return y + rows * rowH + 5;
}

// ==================== SCREENSHOT PLACEHOLDER ====================
function screenshot(doc: jsPDF, y: number, imageKey: keyof typeof MANUAL_ASSETS, caption: string): number {
  const imgW = 130, imgH = 70;
  const x = (PW - imgW) / 2;

  doc.setFillColor(...C.grayLight);
  doc.roundedRect(x - 3, y - 3, imgW + 6, imgH + 6, 4, 4, "F");
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.roundedRect(x - 3, y - 3, imgW + 6, imgH + 6, 4, 4, "S");

  try { doc.addImage(MANUAL_ASSETS[imageKey], "PNG", x, y, imgW, imgH); } catch {
    doc.setTextColor(...C.gray);
    doc.setFontSize(9);
    doc.text("[Imagem não disponível]", PW / 2, y + 35, { align: "center" });
  }

  doc.setFontSize(8);
  doc.setTextColor(...C.gray);
  doc.setFont("helvetica", "italic");
  doc.text(caption, PW / 2, y + imgH + 10, { align: "center" });
  return y + imgH + 18;
}

// ================================================================
// GUIA COMPLETO (MASTER / ADMIN)
// ================================================================
export function generateUserGuidePDF() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const p = { val: 1 };
  const GT = "Guia do Usuário";

  cover(doc, "Guia do Usuário", "Sistema de Controle de Entrada e Saída — v2.0");

  // TOC
  toc(doc, p, GT, [
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

  // === SECTION 1 ===
  let y = np(doc, p, GT);
  y = sectionHeader(doc, y, "1", "Visão Geral do Sistema", "O que é e para que serve o CETINI Controle de Acesso v2.0");
  y = body(doc, y, "O Sistema de Controle de Entrada e Saída do CETINI é uma plataforma web desenvolvida especificamente para o Colégio Estadual de Tempo Integral de Nova Itarana. Ele permite registrar, monitorar e notificar automaticamente todas as movimentações de alunos — entradas, saídas e ausências — com integração direta ao WhatsApp dos responsáveis.");

  y = featureGrid(doc, y, [
    { icon: "■", title: "Scanner de QR Code", desc: "Cada aluno possui um QR Code único. A portaria escaneia com a câmera do celular ou computador e o sistema registra entrada ou saída automaticamente." },
    { icon: "▲", title: "Notificações WhatsApp", desc: "Os responsáveis recebem mensagens automáticas no WhatsApp a cada movimentação do aluno, usando o serviço CallMeBot — gratuito e sem custo para a escola." },
    { icon: "▲", title: "Alertas Automáticos", desc: "O sistema detecta alunos ausentes, fora do horário e que saíram sem retornar, gerando alertas e notificando os responsáveis automaticamente." },
    { icon: "■", title: "Painel dos Pais", desc: "Cada responsável recebe um link exclusivo para acompanhar em tempo real as movimentações do filho, sem precisar de cadastro ou senha." },
  ]);

  y = infoBox(doc, y, "Requisitos de Acesso", "O sistema funciona em qualquer navegador moderno (Chrome, Firefox, Edge). Para a portaria, recomenda-se um dispositivo com câmera. Para o modo quiosque, um tablet ou computador fixo é ideal.", "info");

  // === SECTION 2 ===
  y = ensureSpace(doc, y, 80, p, GT);
  y = sectionHeader(doc, y, "2", "Acesso e Login", "Como entrar no sistema");
  y = body(doc, y, "O acesso ao sistema é feito por autenticação via e-mail e senha. Apenas usuários autorizados pela coordenação podem acessar o painel administrativo.");
  y = steps(doc, y, [
    "Acesse o endereço do sistema no navegador.",
    "Clique no botão \"Entrar no Sistema\" na tela de login.",
    "Faça login com sua conta (e-mail e senha).",
    "Você será redirecionado automaticamente para o Painel Geral.",
  ], p, GT);

  y = table(doc, y, ["Perfil", "Permissões"], [
    ["Administrador", "Acesso total: cadastros, configurações, alertas, relatórios e gerenciamento de usuários"],
    ["Coordenador", "Ocorrências, alertas, justificativas, relatórios e comunicação com pais"],
    ["Porteiro", "Portaria (scanner), movimentações e registro de ocorrências"],
    ["Usuário", "Acesso à portaria, movimentações e visualização de alertas"],
  ]);

  // === SECTION 3 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "3", "Painel Geral (Dashboard)", "Visão rápida do dia e acesso às principais funções");
  y = body(doc, y, "O Painel Geral é a tela inicial após o login. Ele apresenta um resumo em tempo real da situação do colégio no dia atual, com indicadores visuais e acesso rápido às funções mais utilizadas.");

  y = table(doc, y, ["Indicador", "O que mostra"], [
    ["Total de Alunos", "Número total de alunos cadastrados no sistema"],
    ["Entradas Hoje", "Quantidade de entradas registradas no dia atual"],
    ["Saídas Hoje", "Quantidade de saídas registradas no dia atual"],
    ["Alertas Pendentes", "Alertas não resolvidos (ausências, irregularidades)"],
  ]);

  y = body(doc, y, "Quando há alunos ausentes ou que não retornaram, o painel exibe um aviso colorido com os nomes, permitindo acesso direto à página de Alertas com um clique.");

  y = subHeading(doc, y, "Acesso Rápido");
  y = body(doc, y, "Quatro botões coloridos permitem navegar diretamente para as funções mais usadas: Portaria (Scanner), Cadastrar Aluno, QR Codes e Relatórios.");

  y = screenshot(doc, y, "dashboard", "Figura: Painel Geral com resumo do dia e acesso rápido.");

  // === SECTION 4 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "4", "Cadastro de Alunos", "Como cadastrar alunos e seus responsáveis");
  y = body(doc, y, "Cada aluno deve ser cadastrado individualmente com seus dados e os dados dos responsáveis. O sistema gera automaticamente um QR Code único para cada aluno no momento do cadastro.");

  y = subHeading(doc, y, "Dados do Aluno");
  y = table(doc, y, ["Campo", "Obrigatório", "Descrição"], [
    ["Nome Completo", "Sim", "Nome completo do aluno"],
    ["Série", "Sim", "Ex: 6° Ano, 7° Ano, 1ª Série EM"],
    ["Turma", "Sim", "Ex: A, B, C"],
    ["Matrícula", "Sim", "Número de matrícula único do aluno"],
    ["Foto", "Opcional", "Foto do aluno para identificação visual na portaria"],
    ["Limite de Saídas", "Opcional", "Número máximo de saídas por semana antes de gerar alerta"],
  ]);

  y = subHeading(doc, y, "Dados do Responsável");
  y = table(doc, y, ["Campo", "Obrigatório", "Descrição"], [
    ["Nome", "Sim", "Nome do responsável"],
    ["Telefone", "Sim", "Número com DDD, apenas dígitos. Ex: 75988880001"],
    ["Parentesco", "Opcional", "Ex: Mãe, Pai, Avó"],
    ["Receber WhatsApp", "Opcional", "Marcar para ativar notificações automáticas"],
    ["CallMeBot API Key", "Opcional", "Chave individual do responsável para envio via WhatsApp"],
  ]);

  y = infoBox(doc, y, "Atenção ao número de telefone", "Digite apenas os dígitos, sem espaços, traços ou o símbolo +. O sistema formata automaticamente para o padrão internacional. Exemplo: 75988880001 (não use +55 ou parênteses).", "warning");

  // === SECTION 5 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "5", "Importação em Lote via CSV", "Cadastrar muitos alunos de uma vez");
  y = body(doc, y, "Para cadastrar toda a turma ou todos os alunos da escola de uma vez, use a função de importação via arquivo CSV. Isso economiza horas de trabalho no início do ano letivo.");

  y = subHeading(doc, y, "Como preparar o arquivo CSV");
  y = body(doc, y, "O arquivo deve ter as seguintes colunas na primeira linha (cabeçalho):");
  y = table(doc, y, ["Coluna", "Obrigatório", "Exemplo"], [
    ["nome", "Sim", "João da Silva"],
    ["serie", "Sim", "7° Ano"],
    ["turma", "Sim", "A"],
    ["matricula", "Sim", "2024001"],
    ["responsavel_nome", "Opcional", "Maria da Silva"],
    ["responsavel_telefone", "Opcional", "75988880001"],
  ]);

  y = steps(doc, y, [
    "No menu lateral, clique em \"Importar Alunos (CSV)\".",
    "Baixe o modelo de planilha clicando em \"Baixar Modelo CSV\".",
    "Preencha a planilha com os dados dos alunos e salve como .csv.",
    "Clique em \"Selecionar Arquivo\", escolha o CSV e clique em \"Importar\".",
    "O sistema exibe um resumo: quantos alunos foram importados e se houve erros.",
  ], p, GT);

  y = infoBox(doc, y, "QR Codes gerados automaticamente", "Após a importação, o sistema gera automaticamente um QR Code único para cada aluno. Acesse a página QR Codes para imprimir todos de uma vez.", "info");

  // === SECTION 6 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "6", "QR Codes — Geração e Impressão", "Como gerar e distribuir os QR Codes para as carteirinhas");
  y = body(doc, y, "Cada aluno possui um QR Code único que identifica suas movimentações. Os QR Codes podem ser impressos individualmente ou em lote para colagem nas carteirinhas escolares.");
  y = steps(doc, y, [
    "No menu lateral, clique em \"QR Codes\".",
    "Use os filtros para selecionar por série ou turma.",
    "Clique em \"Imprimir Todos\" para gerar uma folha com todos os QR Codes, ou clique no QR Code individual.",
    "Recorte e cole os QR Codes nas carteirinhas dos alunos.",
  ], p, GT);
  y = infoBox(doc, y, "Dica de impressão", "Imprima em papel adesivo para facilitar a colagem nas carteirinhas. O QR Code tem tamanho ideal para carteirinhas no formato crédito (85×54mm).", "info");

  // === SECTION 7 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "7", "Portaria — Scanner de QR Code", "Registrar entradas e saídas dos alunos");
  y = body(doc, y, "A tela da portaria é a principal ferramenta do dia-a-dia. O aluno apresenta a carteirinha, a câmera lê o QR Code e o sistema registra automaticamente a movimentação, alternando entre entrada e saída.");

  y = screenshot(doc, y, "gate", "Figura: Tela da portaria com scanner ativo.");

  y = table(doc, y, ["Situação", "Comportamento do Sistema"], [
    ["Primeiro scan do dia", "Registra Entrada automaticamente"],
    ["Segundo scan", "Registra Saída automaticamente"],
    ["QR Code desconhecido", "Exibe aviso de erro"],
    ["Scan duplicado (menos de 5s)", "Ignorado para evitar duplicidade"],
    ["Aluno inativo", "Exibe aviso: aluno desativado"],
  ]);

  y = infoBox(doc, y, "Permissão de câmera", "Na primeira vez que a portaria for acessada, o navegador pedirá permissão para usar a câmera. Clique em \"Permitir\". Verifique nas configurações do navegador se a câmera está liberada.", "warning");

  // === SECTION 8 ===
  y = ensureSpace(doc, y, 70, p, GT);
  y = sectionHeader(doc, y, "8", "Modo Quiosque (Tela Cheia)", "Para tablets e computadores fixos na portaria");
  y = body(doc, y, "O modo quiosque transforma a tela em um terminal dedicado. Ideal para um tablet ou computador fixo na entrada da escola.");
  y = steps(doc, y, [
    "Na tela da Portaria, clique no ícone de tela cheia no canto superior direito.",
    "A câmera ficará centralizada com destaque para leitura do QR Code.",
    "O resultado aparece com a foto e horário do aluno.",
    "Para sair, pressione ESC ou clique no ícone superior direito.",
  ], p, GT);

  // === SECTION 9 ===
  y = ensureSpace(doc, y, 60, p, GT);
  y = sectionHeader(doc, y, "9", "Movimentações — Histórico Completo", "Consultar todas as entradas e saídas");
  y = body(doc, y, "A página de Movimentações exibe o histórico completo de todas as entradas e saídas registradas. Use os filtros de data, série e turma para localizar registros específicos.");

  // === SECTION 10 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "10", "Alertas e Presença", "Monitoramento automático de ausências e irregularidades");
  y = body(doc, y, "O sistema verifica automaticamente a presença dos alunos e gera alertas quando detecta situações irregulares.");
  y = table(doc, y, ["Tipo de Alerta", "Quando é gerado"], [
    ["Aluno Ausente", "Quando o aluno não registra entrada até o horário limite"],
    ["Não Retornou", "Quando o aluno saiu e não registrou retorno até o fim do dia"],
    ["Horário Irregular", "Quando o scan ocorre fora da janela de horário configurada"],
    ["Saídas Excessivas", "Quando o aluno ultrapassa o limite semanal de saídas"],
  ]);

  // === SECTION 11 ===
  y = ensureSpace(doc, y, 80, p, GT);
  y = sectionHeader(doc, y, "11", "Horários — Configuração de Janelas", "Definir os horários esperados de entrada e saída");
  y = body(doc, y, "A página de Horários permite configurar as janelas de tempo em que as movimentações são consideradas dentro do horário. Qualquer scan fora dessas janelas gera um alerta de Horário Irregular.");
  y = table(doc, y, ["Campo", "Descrição", "Exemplo"], [
    ["Nome da Regra", "Identificação da regra", "Entrada Manhã"],
    ["Tipo", "Entrada ou Saída", "Entrada"],
    ["Horário Início", "Início da janela permitida", "07:00"],
    ["Horário Fim", "Fim da janela permitida", "07:15"],
    ["Tolerância (min)", "Minutos extras antes de gerar alerta", "5 minutos"],
    ["Notificar WhatsApp", "Enviar mensagem ao responsável quando irregular", "Sim"],
  ]);
  y = infoBox(doc, y, "Configure os horários antes de usar", "Sem regras de horário cadastradas, o sistema não gera alertas de horário irregular. Cadastre ao menos uma regra de entrada e uma de saída para ativar esse monitoramento.", "warning");

  // === SECTION 12 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "12", "Ocorrências", "Registro de incidentes e situações especiais");
  y = body(doc, y, "O módulo de Ocorrências permite ao porteiro ou coordenação registrar incidentes que não são simples entradas ou saídas, como saídas sem autorização, alunos que passaram mal, ou comportamentos que precisam ser documentados.");
  y = table(doc, y, ["Tipo de Ocorrência", "Quando usar"], [
    ["Saída sem autorização", "Aluno tentou sair sem permissão"],
    ["Responsável buscou", "Responsável veio buscar o aluno antes do horário"],
    ["Aluno passou mal", "Aluno com problemas de saúde"],
    ["Ocorrência de comportamento", "Incidente disciplinar na entrada/saída"],
    ["Atraso", "Aluno chegou com atraso significativo"],
    ["Outro", "Qualquer situação não listada acima"],
  ]);

  // === SECTION 13 ===
  y = ensureSpace(doc, y, 60, p, GT);
  y = sectionHeader(doc, y, "13", "Relatórios", "Estatísticas e análises de presença");
  y = body(doc, y, "A página de Relatórios oferece uma visão analítica das movimentações, com gráficos e tabelas que facilitam o acompanhamento da presença escolar ao longo do tempo.");
  y = steps(doc, y, [
    "Movimentações por dia da semana — identifica padrões de ausência.",
    "Ranking de alunos com mais saídas — detecta comportamentos recorrentes.",
    "Histórico por turma — comparativo de presença entre turmas.",
    "Exportação dos dados para planilha.",
  ], p, GT);

  y = screenshot(doc, y, "report", "Figura: Página de relatórios com gráficos e filtros.");

  // === SECTION 14 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "14", "WhatsApp via CallMeBot", "Notificações automáticas para os responsáveis");
  y = body(doc, y, "O sistema envia mensagens automáticas no WhatsApp dos responsáveis usando o serviço gratuito CallMeBot. Cada responsável precisa ativar o serviço uma vez.");
  y = table(doc, y, ["Evento", "Quando é enviada"], [
    ["Entrada registrada", "Imediatamente após o scan de entrada"],
    ["Saída registrada", "Imediatamente após o scan de saída"],
    ["Aluno ausente", "Às 08:30, se o aluno não registrou entrada"],
    ["Não retornou", "Às 18:30, se aluno saiu e não voltou"],
    ["Horário irregular", "No momento do scan fora da janela configurada"],
    ["Link de acesso dos pais", "Quando a coordenação envia manualmente"],
  ]);

  // === SECTION 15 ===
  y = ensureSpace(doc, y, 70, p, GT);
  y = sectionHeader(doc, y, "15", "Acesso dos Pais", "Como os responsáveis acompanham as movimentações do filho");
  y = body(doc, y, "Cada responsável pode receber um link exclusivo e seguro para acompanhar em tempo real as movimentações do filho. Não é necessário criar conta ou senha — o link funciona como um token de acesso único.");
  y = steps(doc, y, [
    "No menu lateral, clique em \"Acesso dos Pais\".",
    "Localize o aluno desejado na lista.",
    "Clique em \"Gerar Link\" para criar o token de acesso do responsável.",
    "Clique em \"Enviar via WhatsApp\" para enviar o link diretamente ao responsável.",
  ], p, GT);
  y = body(doc, y, "O responsável vê: foto e dados do aluno, histórico das últimas movimentações com horário, e o status atual (dentro ou fora da escola). O link não expira e pode ser acessado a qualquer momento.");

  // === SECTION 16 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "16", "Configurações do Sistema", "Ajustar parâmetros gerais e integração WhatsApp");
  y = body(doc, y, "A página de Configurações permite ajustar parâmetros gerais do sistema. O acesso é restrito a administradores.");
  y = table(doc, y, ["Configuração", "Descrição"], [
    ["Nome da Escola", "Nome exibido nas mensagens WhatsApp e relatórios"],
    ["WhatsApp Ativado", "Liga/desliga o envio de todas as notificações WhatsApp"],
    ["Número da Escola", "Número usado como remetente padrão (fallback)"],
    ["API Key Global", "Chave CallMeBot da escola (usada quando o responsável não tem chave própria)"],
    ["Limite de Saídas", "Número padrão de saídas semanais antes de gerar alerta"],
    ["Teste de Envio", "Envia uma mensagem de teste para verificar se o WhatsApp está funcionando"],
  ]);
  y = infoBox(doc, y, "Teste antes de usar em produção", "Use o botão \"Enviar Mensagem de Teste\" nas Configurações para confirmar que o WhatsApp está funcionando corretamente antes de cadastrar os alunos e responsáveis.", "warning");

  // === SECTION 17 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "17", "Perguntas Frequentes (FAQ)", "Dúvidas comuns e soluções rápidas");

  const faqs = [
    { q: "O scanner não está lendo o QR Code. O que fazer?", a: "Verifique se o navegador tem permissão para usar a câmera. Limpe o cache e certifique-se que o QR Code está bem iluminado e não está rasgado. Tente aproximar ou afastar o QR Code da câmera. Se o problema persistir, tente em outro navegador (recomendamos Chrome)." },
    { q: "O aluno foi marcado como ausente, mas veio à escola. O que fazer?", a: "Isso pode acontecer se o aluno não escaneou o QR Code na entrada. Registre manualmente a entrada do aluno na página de Movimentações e resolva o alerta na página de Alertas clicando em \"Resolver\"." },
    { q: "Como desativar um aluno que se transferiu?", a: "Acesse a lista de Alunos, clique no aluno desejado e clique em \"Editar\". Desmarque a opção \"Aluno Ativo\" e salve. O aluno não poderá mais registrar movimentações, mas seu histórico é preservado." },
    { q: "Como adicionar um novo usuário (funcionário) ao sistema?", a: "O novo funcionário deve acessar o sistema e fazer login. Após o primeiro login, o administrador pode atribuir o perfil adequado (porteiro, coordenador, etc.) na seção de gerenciamento de usuários." },
    { q: "O sistema funciona sem internet?", a: "O sistema é uma aplicação web e requer conexão com a internet para funcionar. Recomenda-se uma conexão estável na portaria para garantir o registro em tempo real." },
  ];

  for (const faq of faqs) {
    y = ensureSpace(doc, y, 30, p, GT);
    y = bodyBold(doc, y, faq.q);
    y = body(doc, y, faq.a);
  }

  // BACK COVER
  doc.addPage();
  p.val++;
  doc.setFillColor(...C.slate);
  doc.rect(0, 0, PW, PH, "F");
  doc.setFillColor(...C.blue);
  doc.rect(0, 0, PW, 6, "F");

  try { doc.addImage(MANUAL_ASSETS.logo, "PNG", PW / 2 - 15, 80, 30, 30); } catch {}

  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Colégio Estadual de Tempo Integral", PW / 2, 130, { align: "center" });
  doc.text("de Nova Itarana", PW / 2, 140, { align: "center" });
  doc.setTextColor(...C.amber);
  doc.setFontSize(11);
  doc.text("CETINI Nova Itarana, Bahia", PW / 2, 152, { align: "center" });

  doc.setTextColor(...C.white);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Sistema de Controle de Acesso v2.0", PW / 2, 175, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Março de 2026", PW / 2, 185, { align: "center" });

  doc.setTextColor(...C.gray);
  doc.setFontSize(8);
  doc.text("Este documento é de uso interno e exclusivo do CETINI Nova Itarana.", PW / 2, PH - 30, { align: "center" });

  doc.save(`GUIA_USUARIO_CETINI_${new Date().getFullYear()}.pdf`);
}

// ================================================================
// GUIA DO PORTEIRO
// ================================================================
export function generateGatekeeperGuidePDF() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const p = { val: 1 };
  const GT = "Guia do Porteiro";

  cover(doc, "Guia do Porteiro", "Manual Operacional para Controle de Acesso na Portaria");

  toc(doc, p, GT, [
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

  // === SECTION 1 ===
  let y = np(doc, p, GT);
  y = sectionHeader(doc, y, "1", "Sua Função no Sistema", "O que o porteiro faz no CETINI Digital");
  y = body(doc, y, "Você é responsável por registrar todas as entradas e saídas dos alunos usando o scanner de QR Code. Quando um aluno passa pela portaria, você escaneia a carteirinha dele e o sistema faz o resto: registra a movimentação, avisa os pais por WhatsApp e monitora a presença.");
  y = infoBox(doc, y, "Importante", "Cada scan conta! Se o aluno não escanear ao entrar, ele será marcado como ausente e os pais serão notificados. Garanta que todos os alunos passem pelo scanner.", "warning");

  // === SECTION 2 ===
  y = ensureSpace(doc, y, 80, p, GT);
  y = sectionHeader(doc, y, "2", "Acessando a Portaria", "Como abrir a tela de scanner");
  y = steps(doc, y, [
    "Abra o navegador (Chrome recomendado) no tablet ou computador da portaria.",
    "Acesse o endereço do sistema.",
    "Faça login com seu usuário e senha.",
    "No menu lateral, clique em \"Portaria\" para abrir o scanner.",
    "Permita o acesso à câmera quando o navegador solicitar.",
  ], p, GT);
  y = screenshot(doc, y, "gate", "Figura: Tela da portaria com câmera ativa para leitura de QR Code.");

  // === SECTION 3 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "3", "Escaneando QR Codes", "O passo-a-passo do dia-a-dia");
  y = body(doc, y, "O processo é simples e rápido. O aluno apresenta a carteirinha, você aponta a câmera e o sistema registra automaticamente.");
  y = steps(doc, y, [
    "O aluno mostra a carteirinha com o QR Code.",
    "Aponte a câmera para o QR Code (mantenha a cerca de 15cm).",
    "Aguarde o bip de confirmação e a foto do aluno aparecer na tela.",
    "O sistema registra automaticamente: primeiro scan = ENTRADA, segundo scan = SAÍDA.",
    "Confira o nome e a foto do aluno na tela para garantir que é o aluno correto.",
  ], p, GT);

  y = table(doc, y, ["Situação", "O que acontece"], [
    ["Primeiro scan do dia", "Registra ENTRADA — bip suave"],
    ["Segundo scan", "Registra SAÍDA — bip diferente"],
    ["QR Code desconhecido", "Erro — bip agudo"],
    ["Scan muito rápido (menos de 5s)", "Ignorado — evita duplicidade"],
    ["Aluno inativo/transferido", "Aviso na tela — aluno desativado"],
  ]);

  // === SECTION 4 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "4", "Modo Quiosque", "Tela cheia para o tablet da portaria");
  y = body(doc, y, "O modo quiosque é ideal para tablets ou computadores fixos. A tela fica dedicada apenas ao scanner, sem distrações.");
  y = steps(doc, y, [
    "Na tela da Portaria, clique no ícone de tela cheia (canto superior direito).",
    "A câmera ficará centralizada com destaque para o QR Code.",
    "O resultado aparece com a foto, nome e horário do aluno.",
    "Para sair do modo quiosque, pressione ESC.",
  ], p, GT);

  // === SECTION 5 ===
  y = ensureSpace(doc, y, 60, p, GT);
  y = sectionHeader(doc, y, "5", "Busca Manual de Alunos", "Quando o aluno esquece a carteirinha");
  y = body(doc, y, "Se o aluno esqueceu a carteirinha ou o QR Code está danificado, você pode registrar a movimentação manualmente:");
  y = steps(doc, y, [
    "Na tela da portaria, use a barra de \"Busca Manual\" na parte inferior.",
    "Digite o nome ou matrícula do aluno.",
    "Selecione o aluno correto na lista de resultados.",
    "Clique em \"Registrar Entrada\" ou \"Registrar Saída\".",
  ], p, GT);
  y = infoBox(doc, y, "Dica", "Informe à coordenação quando um aluno esquece a carteirinha com frequência. A coordenação pode reimprimir o QR Code.", "info");

  // === SECTION 6 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "6", "Registrando Ocorrências", "Situações além de entrada e saída");
  y = body(doc, y, "Quando acontece algo fora do normal, você pode registrar uma ocorrência diretamente na portaria:");
  y = table(doc, y, ["Tipo", "Quando usar"], [
    ["Saída sem autorização", "Aluno tentou sair sem permissão da coordenação"],
    ["Responsável buscou", "Pai/mãe veio buscar o aluno antes do horário"],
    ["Aluno passou mal", "Aluno com problema de saúde na portaria"],
    ["Atraso", "Aluno chegou com atraso significativo"],
    ["Outro", "Qualquer outra situação relevante"],
  ]);
  y = steps(doc, y, [
    "Na portaria, clique em \"Registrar Ocorrência\".",
    "Busque o aluno pelo nome.",
    "Selecione o tipo de ocorrência.",
    "Escreva uma breve descrição do ocorrido.",
    "Clique em \"Salvar\".",
  ], p, GT);

  // === SECTION 7 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "7", "Sons e Avisos do Sistema", "Entendendo os feedbacks do scanner");
  y = table(doc, y, ["Ação", "Som/Visual", "Significado"], [
    ["Scan bem-sucedido (entrada)", "Bip suave + tela verde", "Entrada registrada com sucesso"],
    ["Scan bem-sucedido (saída)", "Bip diferente + tela azul", "Saída registrada com sucesso"],
    ["QR Code não reconhecido", "Bip agudo + tela vermelha", "Aluno não encontrado no sistema"],
    ["Scan duplicado", "Sem som", "Ignorado — muito rápido"],
    ["Aluno inativo", "Aviso amarelo", "Aluno desativado — chame a coordenação"],
  ]);

  // === SECTION 8 ===
  y = ensureSpace(doc, y, 80, p, GT);
  y = sectionHeader(doc, y, "8", "Problemas Comuns e Soluções", "Referência rápida para o dia-a-dia");

  const problems = [
    { q: "A câmera não abre", a: "Verifique se o navegador tem permissão de câmera. Nas configurações do navegador, procure \"Câmera\" e garanta que está como \"Permitir\". Tente fechar e abrir o navegador." },
    { q: "O QR Code não está sendo lido", a: "Certifique-se que o QR Code está limpo e bem iluminado. Tente ajustar a distância (15-20cm). Se o cartão estiver muito desgastado, peça à coordenação para reimprimir." },
    { q: "A internet caiu", a: "O sistema precisa de internet para funcionar. Avise a coordenação imediatamente. Enquanto isso, anote os nomes e horários manualmente para registrar depois." },
    { q: "Apareceu um aluno que não está no sistema", a: "Pode ser um aluno novo. Encaminhe à coordenação para que faça o cadastro antes de liberar a entrada." },
  ];

  for (const pb of problems) {
    y = ensureSpace(doc, y, 25, p, GT);
    y = bodyBold(doc, y, pb.q);
    y = body(doc, y, pb.a);
  }

  doc.save(`GUIA_PORTEIRO_CETINI_${new Date().getFullYear()}.pdf`);
}

// ================================================================
// GUIA DA COORDENAÇÃO
// ================================================================
export function generateCoordinationGuidePDF() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const p = { val: 1 };
  const GT = "Guia da Coordenação";

  cover(doc, "Guia da Coordenação", "Manual Pedagógico para Gestão de Presença, Ocorrências e Comunicação com Famílias");

  toc(doc, p, GT, [
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

  // === SECTION 1 ===
  let y = np(doc, p, GT);
  y = sectionHeader(doc, y, "1", "Seu Papel no Sistema", "O que a coordenação faz no CETINI Digital");
  y = body(doc, y, "A coordenação é responsável pelo acompanhamento pedagógico da presença escolar. Você monitora alertas, gerencia ocorrências, analisa relatórios e se comunica com as famílias. O sistema automatiza boa parte desse trabalho, mas cabe a você tomar as decisões pedagógicas.");

  y = featureGrid(doc, y, [
    { icon: "■", title: "Monitorar Alertas", desc: "Acompanhe em tempo real quais alunos estão ausentes, atrasados ou com comportamento irregular." },
    { icon: "▲", title: "Gerir Ocorrências", desc: "Registre e acompanhe incidentes disciplinares, saúde e outras situações especiais." },
    { icon: "■", title: "Analisar Relatórios", desc: "Use os dados de presença para identificar padrões e tomar decisões pedagógicas." },
    { icon: "▲", title: "Comunicar com Pais", desc: "Envie links de acompanhamento e gerencie justificativas de faltas." },
  ]);

  // === SECTION 2 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "2", "Monitorando o Dashboard", "A tela principal do seu dia");
  y = body(doc, y, "O Dashboard é sua tela principal. Mantenha-o aberto durante o dia para acompanhar em tempo real o fluxo de alunos. Os indicadores mostram rapidamente se há algo que precisa da sua atenção.");

  y = screenshot(doc, y, "dashboard", "Figura: Dashboard com indicadores de presença em tempo real.");

  y = table(doc, y, ["Indicador", "O que observar"], [
    ["Entradas Hoje", "Se está abaixo do esperado, pode indicar dia atípico"],
    ["Alertas Pendentes", "Priorize resolver os alertas vermelhos primeiro"],
    ["Alunos Ausentes", "Clique para ver a lista e decidir se precisa ligar para a família"],
    ["Não Retornaram", "Alunos que saíram e não voltaram — situação crítica"],
  ]);

  y = infoBox(doc, y, "Dica prática", "Mantenha o Dashboard aberto em uma aba do navegador durante todo o expediente. Ele atualiza automaticamente e mostra alertas em tempo real.", "info");

  // === SECTION 3 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "3", "Gestão de Alertas", "Acompanhar e resolver situações de presença");
  y = body(doc, y, "Os alertas são gerados automaticamente pelo sistema. Cabe à coordenação analisar cada caso e tomar a ação adequada.");

  y = table(doc, y, ["Tipo de Alerta", "Ação Recomendada"], [
    ["Aluno Ausente", "Verificar se há justificativa. Se não, ligar para a família."],
    ["Não Retornou", "Contatar a família imediatamente. Verificar se saiu com autorização."],
    ["Horário Irregular", "Verificar com o porteiro o motivo do atraso/antecipação."],
    ["Saídas Excessivas", "Conversar com o aluno e a família sobre o padrão."],
  ]);

  y = steps(doc, y, [
    "Acesse a página de \"Alertas\" no menu lateral.",
    "Analise cada alerta pendente (ícone vermelho).",
    "Tome a ação adequada (ligar para família, conversar com aluno, etc.).",
    "Clique em \"Resolver\" para marcar o alerta como tratado.",
  ], p, GT);

  // === SECTION 4 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "4", "Registrando Ocorrências", "Documentar incidentes pedagógicos");
  y = body(doc, y, "As ocorrências ficam no dossiê do aluno e servem como registro oficial. Seja claro e objetivo na descrição.");
  y = steps(doc, y, [
    "No menu lateral, clique em \"Ocorrências\".",
    "Busque pelo nome do aluno no campo de pesquisa.",
    "Escolha o tipo (Atraso, Comportamento, Sem Autorização, etc.).",
    "Escreva um breve resumo objetivo do que aconteceu.",
    "Clique em \"Salvar\" — a ocorrência fica registrada no dossiê do aluno.",
  ], p, GT);

  y = screenshot(doc, y, "report", "Figura: Tela de registro de ocorrências com campos de preenchimento.");

  y = infoBox(doc, y, "Dica importante", "Seja sempre objetivo e profissional nas descrições. Evite termos subjetivos. Ex: \"Aluno chegou às 08:15, 15 minutos após o horário\" é melhor que \"Aluno chegou muito atrasado\".", "warning");

  // === SECTION 5 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "5", "Justificativas de Faltas", "Avaliar justificativas enviadas pelos pais");
  y = body(doc, y, "Quando um responsável envia uma justificativa de falta (atestado médico, por exemplo), você recebe um alerta e pode aprovar ou rejeitar.");
  y = steps(doc, y, [
    "Acesse \"Justificativas\" no menu lateral.",
    "Veja as justificativas pendentes (aguardando análise).",
    "Clique na justificativa para ver os detalhes e o motivo.",
    "Clique em \"Aprovar\" se a justificativa for válida, ou \"Rejeitar\" com uma nota explicativa.",
  ], p, GT);

  y = table(doc, y, ["Status", "Significado"], [
    ["Pendente", "Aguardando análise da coordenação"],
    ["Aprovada", "Falta justificada — não conta negativamente"],
    ["Rejeitada", "Justificativa insuficiente — falta mantida"],
  ]);

  // === SECTION 6 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "6", "Comunicação com os Pais", "Links de acesso e notificações WhatsApp");
  y = body(doc, y, "Cada responsável pode receber um link exclusivo para acompanhar as movimentações do filho em tempo real pelo celular.");
  y = steps(doc, y, [
    "Acesse \"Acesso dos Pais\" no menu lateral.",
    "Localize o aluno desejado.",
    "Clique em \"Gerar Link\" para criar o link exclusivo.",
    "Clique em \"Enviar via WhatsApp\" para enviar diretamente ao responsável.",
  ], p, GT);
  y = body(doc, y, "O responsável verá: foto e dados do aluno, histórico completo de movimentações e o status atual (dentro ou fora da escola).");
  y = infoBox(doc, y, "WhatsApp automático", "As notificações de entrada, saída e alertas são enviadas automaticamente pelo sistema. Você não precisa enviar manualmente — apenas o link de acesso inicial.", "info");

  // === SECTION 7 ===
  y = np(doc, p, GT);
  y = sectionHeader(doc, y, "7", "Relatórios e Análises", "Dados para decisões pedagógicas");
  y = body(doc, y, "A página de Relatórios é sua principal ferramenta de análise. Use os filtros para gerar exatamente os dados que a Secretaria ou a direção precisam.");
  y = steps(doc, y, [
    "Acesse \"Relatórios\" no menu lateral.",
    "Use os filtros de série, turma e período para refinar os dados.",
    "Analise os gráficos de movimentações por dia da semana.",
    "Confira o ranking de alunos com mais saídas.",
    "Exporte os dados em PDF ou Excel quando necessário.",
  ], p, GT);

  y = infoBox(doc, y, "Relatório mensal", "Recomendamos gerar um relatório mensal por turma para apresentar na reunião de coordenação. Os dados de presença ajudam a identificar alunos em risco de evasão.", "info");

  // === SECTION 8 ===
  y = ensureSpace(doc, y, 70, p, GT);
  y = sectionHeader(doc, y, "8", "Gerenciamento de Alunos", "Cadastro, edição e desativação");
  y = body(doc, y, "A coordenação pode gerenciar o cadastro de alunos, incluindo edição de dados, desativação de alunos transferidos e impressão de QR Codes.");

  y = table(doc, y, ["Ação", "Como fazer"], [
    ["Editar dados do aluno", "Lista de Alunos → Clique no aluno → Editar"],
    ["Desativar aluno transferido", "Editar → Desmarcar \"Aluno Ativo\" → Salvar"],
    ["Reimprimir QR Code", "QR Codes → Buscar aluno → Imprimir individual"],
    ["Importar alunos em lote", "Importar Alunos (CSV) → Baixar modelo → Preencher → Importar"],
  ]);

  y = infoBox(doc, y, "Nunca delete um aluno", "Sempre desative em vez de deletar. O histórico de movimentações e ocorrências é preservado quando o aluno é desativado, mas perdido se for deletado.", "danger");

  doc.save(`GUIA_COORDENACAO_CETINI_${new Date().getFullYear()}.pdf`);
}
