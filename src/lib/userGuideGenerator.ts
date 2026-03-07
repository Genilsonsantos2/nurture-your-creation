import jsPDF from "jspdf";

const COLORS = {
  primary: [15, 62, 122] as [number, number, number],
  dark: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  bgLight: [241, 245, 249] as [number, number, number],
  border: [203, 213, 225] as [number, number, number],
  accent: [59, 130, 246] as [number, number, number],
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

function addHeader(doc: jsPDF, title: string) {
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_W, 38, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("CETI DIGITAL — Guia do Usuário", PAGE_W / 2, 16, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(title, PAGE_W / 2, 28, { align: "center" });
}

function addFooter(doc: jsPDF, pageNum: number) {
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Página ${pageNum}`, PAGE_W / 2, PAGE_H - 10, { align: "center" });
  doc.text("Documento gerado automaticamente pelo Sistema CETI Digital", PAGE_W / 2, PAGE_H - 6, { align: "center" });
}

function newPage(doc: jsPDF, sectionTitle: string, pageNum: number): number {
  doc.addPage();
  addHeader(doc, sectionTitle);
  addFooter(doc, pageNum);
  return 50;
}

function checkPage(doc: jsPDF, y: number, needed: number, sectionTitle: string, pageNum: { val: number }): number {
  if (y + needed > PAGE_H - 25) {
    pageNum.val++;
    return newPage(doc, sectionTitle, pageNum.val);
  }
  return y;
}

function sectionTitle(doc: jsPDF, y: number, num: string, title: string): number {
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(MARGIN, y - 5, CONTENT_W, 12, 2, 2, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`${num}. ${title}`, MARGIN + 5, y + 3);
  return y + 18;
}

function subTitle(doc: jsPDF, y: number, title: string): number {
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`▸ ${title}`, MARGIN + 2, y);
  return y + 7;
}

function paragraph(doc: jsPDF, y: number, text: string): number {
  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, CONTENT_W - 4);
  doc.text(lines, MARGIN + 2, y);
  return y + lines.length * 5 + 4;
}

function bullet(doc: jsPDF, y: number, items: string[]): number {
  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const item of items) {
    const lines = doc.splitTextToSize(`• ${item}`, CONTENT_W - 8);
    doc.text(lines, MARGIN + 6, y);
    y += lines.length * 5 + 2;
  }
  return y + 2;
}

function tipBox(doc: jsPDF, y: number, text: string): number {
  doc.setFillColor(...COLORS.bgLight);
  doc.setDrawColor(...COLORS.border);
  const lines = doc.splitTextToSize(`💡 Dica: ${text}`, CONTENT_W - 16);
  const boxH = lines.length * 5 + 8;
  doc.roundedRect(MARGIN, y - 2, CONTENT_W, boxH, 2, 2, "FD");
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text(lines, MARGIN + 5, y + 5);
  return y + boxH + 6;
}

export function generateUserGuidePDF() {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const page = { val: 1 };

  // ==================== COVER PAGE ====================
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.text("CETI DIGITAL", PAGE_W / 2, 90, { align: "center" });

  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Gestão Escolar", PAGE_W / 2, 105, { align: "center" });

  doc.setFillColor(255, 255, 255, 0.15 as any);
  doc.roundedRect(50, 120, 110, 40, 4, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("GUIA DO USUÁRIO", PAGE_W / 2, 138, { align: "center" });
  doc.setFontSize(11);
  doc.text(`Versão ${new Date().getFullYear()}.1`, PAGE_W / 2, 148, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("CETI Nova Itarana", PAGE_W / 2, 200, { align: "center" });

  const dateStr = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  doc.text(`Gerado em: ${dateStr}`, PAGE_W / 2, 208, { align: "center" });

  addFooter(doc, 1);

  // ==================== TABLE OF CONTENTS ====================
  page.val++;
  let y = newPage(doc, "Índice", page.val);

  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Índice", MARGIN, y);
  y += 12;

  const toc = [
    "1. Visão Geral do Sistema",
    "2. Login e Autenticação",
    "3. Painel de Controle (Dashboard)",
    "4. Gestão de Alunos",
    "5. QR Codes",
    "6. Portaria — Scanner de Entrada/Saída",
    "7. Movimentações",
    "8. Alertas",
    "9. Horários",
    "10. Ocorrências Disciplinares",
    "11. Relatórios",
    "12. Análise Avançada (Analytics)",
    "13. Turmas",
    "14. Calendário Escolar",
    "15. Autorizações de Saída",
    "16. Justificativas de Falta",
    "17. Portal dos Pais",
    "18. Gestão de Usuários",
    "19. Configurações do Sistema",
    "20. Perfis e Permissões",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  for (const item of toc) {
    doc.text(item, MARGIN + 5, y);
    y += 7;
  }

  // ==================== SECTIONS ====================

  // --- 1. Visão Geral ---
  page.val++;
  y = newPage(doc, "Visão Geral", page.val);
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
  page.val++;
  y = newPage(doc, "Login e Autenticação", page.val);
  y = sectionTitle(doc, y, "2", "Login e Autenticação");
  y = paragraph(doc, y, "Ao acessar o sistema, você verá a tela de login. Existem duas formas de acesso:");
  y = subTitle(doc, y, "Login com Email e Senha");
  y = paragraph(doc, y, "Digite seu email institucional e a senha fornecida pelo administrador. Clique em \"Acessar Sistema\" para entrar.");
  y = subTitle(doc, y, "Login com Google");
  y = paragraph(doc, y, "Clique no botão \"Entrar com Google\" para usar sua conta Google vinculada à instituição. Essa é a forma mais rápida de acessar.");
  y = tipBox(doc, y, "Se você esqueceu sua senha, entre em contato com o administrador do sistema para redefinição.");

  // --- 3. Dashboard ---
  page.val++;
  y = newPage(doc, "Dashboard", page.val);
  y = sectionTitle(doc, y, "3", "Painel de Controle (Dashboard)");
  y = paragraph(doc, y, "O Dashboard é a página principal do sistema. Ele apresenta um resumo visual com:");
  y = bullet(doc, y, [
    "Total de alunos cadastrados e ativos",
    "Movimentações do dia (entradas e saídas)",
    "Alertas pendentes que precisam de atenção",
    "Gráficos de movimentação ao longo do dia",
    "Resumo de ocorrências recentes",
  ]);
  y = paragraph(doc, y, "O dashboard é atualizado em tempo real conforme novos eventos são registrados no sistema.");

  // --- 4. Gestão de Alunos ---
  page.val++;
  y = newPage(doc, "Gestão de Alunos", page.val);
  y = sectionTitle(doc, y, "4", "Gestão de Alunos");
  y = subTitle(doc, y, "Listagem de Alunos");
  y = paragraph(doc, y, "Acesse a página \"Alunos\" no menu lateral. Você verá a lista completa de alunos cadastrados com nome, série, turma, matrícula e status (ativo/inativo). Use a barra de busca para localizar alunos rapidamente.");
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
  y = paragraph(doc, y, "Para cadastrar muitos alunos de uma vez, acesse \"Importar Alunos\". Prepare um arquivo com os dados seguindo o modelo disponibilizado e faça o upload.");
  y = subTitle(doc, y, "Declaração de Matrícula");
  y = paragraph(doc, y, "Na listagem de alunos, é possível gerar uma declaração de matrícula em PDF para qualquer aluno ativo. O documento inclui dados acadêmicos e código de autenticidade.");
  y = tipBox(doc, y, "Mantenha os dados dos alunos sempre atualizados para garantir o funcionamento correto das notificações e relatórios.");

  // --- 5. QR Codes ---
  page.val++;
  y = newPage(doc, "QR Codes", page.val);
  y = sectionTitle(doc, y, "5", "QR Codes");
  y = paragraph(doc, y, "Cada aluno cadastrado recebe automaticamente um QR Code único. A página de QR Codes permite:");
  y = bullet(doc, y, [
    "Visualizar todos os QR Codes gerados",
    "Filtrar por turma ou série",
    "Imprimir carteirinhas individuais ou em lote",
    "Baixar QR Codes para impressão",
  ]);
  y = paragraph(doc, y, "Os QR Codes são utilizados na portaria para registrar entrada e saída dos alunos de forma rápida e automatizada.");
  y = tipBox(doc, y, "Recomendamos imprimir os QR Codes em carteirinhas plastificadas para maior durabilidade.");

  // --- 6. Portaria ---
  page.val++;
  y = newPage(doc, "Portaria", page.val);
  y = sectionTitle(doc, y, "6", "Portaria — Scanner de Entrada/Saída");
  y = paragraph(doc, y, "A portaria é o módulo principal para controle de acesso. Ela funciona como um scanner de QR Code em tempo real.");
  y = subTitle(doc, y, "Como Usar");
  y = bullet(doc, y, [
    "Acesse a página \"Portaria\" no menu",
    "Ative o scanner clicando no botão de câmera",
    "Aponte a câmera do dispositivo para o QR Code do aluno",
    "O sistema registra automaticamente a movimentação (entrada ou saída)",
    "Os dados do aluno e o tipo de movimento são exibidos na tela",
  ]);
  y = subTitle(doc, y, "Tipos de Movimento");
  y = paragraph(doc, y, "O sistema detecta automaticamente se é uma entrada ou saída com base no último registro do aluno. Se a última movimentação foi uma entrada, a próxima será uma saída, e vice-versa.");
  y = tipBox(doc, y, "Use um tablet ou celular com boa câmera na portaria para leituras rápidas. Certifique-se de boa iluminação.");

  // --- 7. Movimentações ---
  page.val++;
  y = newPage(doc, "Movimentações", page.val);
  y = sectionTitle(doc, y, "7", "Movimentações");
  y = paragraph(doc, y, "A página de Movimentações mostra o histórico completo de entradas e saídas registradas no sistema.");
  y = bullet(doc, y, [
    "Filtrar por data, aluno, turma ou tipo (entrada/saída)",
    "Ver detalhes de cada movimentação com horário exato",
    "Identificar padrões de atraso ou ausência",
    "Exportar dados para análise externa",
  ]);
  y = paragraph(doc, y, "Cada registro inclui: nome do aluno, série/turma, tipo de movimentação, data/hora e responsável pelo registro.");

  // --- 8. Alertas ---
  page.val++;
  y = newPage(doc, "Alertas", page.val);
  y = sectionTitle(doc, y, "8", "Alertas");
  y = paragraph(doc, y, "O sistema gera alertas automáticos para situações que exigem atenção da coordenação:");
  y = bullet(doc, y, [
    "Aluno ausente — não registrou entrada no dia",
    "Não retornou — saiu e não voltou no período esperado",
    "Horário irregular — movimentação fora do horário previsto",
    "Saídas excessivas — aluno excedeu o limite de saídas permitidas",
  ]);
  y = subTitle(doc, y, "Gerenciamento de Alertas");
  y = paragraph(doc, y, "Cada alerta pode ser resolvido manualmente pela coordenação. Ao resolver, o sistema registra quem resolveu e quando. Alertas pendentes são destacados em vermelho no dashboard.");
  y = tipBox(doc, y, "Verifique os alertas diariamente para manter o controle e segurança dos alunos.");

  // --- 9. Horários ---
  page.val++;
  y = newPage(doc, "Horários", page.val);
  y = sectionTitle(doc, y, "9", "Horários");
  y = paragraph(doc, y, "A gestão de horários permite configurar os períodos de entrada, saída e intervalo da escola. Esses horários são usados pelo sistema para:");
  y = bullet(doc, y, [
    "Detectar atrasos automaticamente",
    "Gerar alertas de horário irregular",
    "Definir tolerâncias para cada período",
    "Calcular estatísticas de pontualidade",
  ]);
  y = subTitle(doc, y, "Configuração");
  y = paragraph(doc, y, "Defina o nome do horário, tipo (entrada/saída/intervalo), horário de início e fim, e a tolerância em minutos. Apenas administradores podem alterar horários.");

  // --- 10. Ocorrências ---
  page.val++;
  y = newPage(doc, "Ocorrências", page.val);
  y = sectionTitle(doc, y, "10", "Ocorrências Disciplinares");
  y = paragraph(doc, y, "O Centro de Ocorrências permite registrar e gerenciar incidentes disciplinares dos alunos.");
  y = subTitle(doc, y, "Tipos de Ocorrência");
  y = bullet(doc, y, [
    "Saída sem autorização",
    "Responsável buscou o aluno",
    "Aluno passou mal",
    "Comportamento inadequado",
    "Atraso",
    "Outro",
  ]);
  y = subTitle(doc, y, "Funcionalidades");
  y = bullet(doc, y, [
    "Registrar nova ocorrência com descrição detalhada",
    "Gerar comunicado disciplinar em PDF para impressão",
    "Enviar notificação via WhatsApp para o responsável",
    "Visualizar histórico completo com timeline",
  ]);
  y = tipBox(doc, y, "Sempre preencha a descrição detalhada para que o comunicado em PDF fique completo.");

  // --- 11. Relatórios ---
  page.val++;
  y = newPage(doc, "Relatórios", page.val);
  y = sectionTitle(doc, y, "11", "Relatórios");
  y = paragraph(doc, y, "A página de Relatórios permite gerar documentos e visualizações detalhadas sobre diversos aspectos da escola:");
  y = bullet(doc, y, [
    "Relatório de frequência por turma/série",
    "Relatório de movimentações diárias",
    "Relatório de ocorrências por período",
    "Relatório de alunos com alertas recorrentes",
  ]);
  y = paragraph(doc, y, "Os relatórios podem ser filtrados por data, turma e tipo, permitindo uma análise personalizada das informações.");

  // --- 12. Analytics ---
  page.val++;
  y = newPage(doc, "Análise Avançada", page.val);
  y = sectionTitle(doc, y, "12", "Análise Avançada (Analytics)");
  y = paragraph(doc, y, "O módulo de análise avançada oferece gráficos e estatísticas aprofundadas para a gestão pedagógica:");
  y = bullet(doc, y, [
    "Gráficos de tendência de frequência ao longo do tempo",
    "Comparativo entre turmas e séries",
    "Indicadores de risco (alunos com padrões preocupantes)",
    "Métricas de pontualidade e assiduidade",
  ]);

  // --- 13. Turmas ---
  page.val++;
  y = newPage(doc, "Turmas", page.val);
  y = sectionTitle(doc, y, "13", "Turmas");
  y = paragraph(doc, y, "A página de Turmas permite visualizar a distribuição dos alunos por série e turma. Funcionalidades:");
  y = bullet(doc, y, [
    "Ver quantidade de alunos por turma",
    "Acessar a lista de alunos de cada turma",
    "Verificar estatísticas de presença por turma",
  ]);

  // --- 14. Calendário ---
  y += 5;
  y = sectionTitle(doc, y, "14", "Calendário Escolar");
  y = paragraph(doc, y, "O calendário permite gerenciar eventos escolares como feriados, reuniões de pais, conselhos de classe e datas importantes:");
  y = bullet(doc, y, [
    "Adicionar eventos com título, descrição e tipo",
    "Visualização mensal dos eventos",
    "Tipos: feriado, reunião, evento escolar, prova, recesso",
  ]);

  // --- 15. Autorizações ---
  page.val++;
  y = newPage(doc, "Autorizações de Saída", page.val);
  y = sectionTitle(doc, y, "15", "Autorizações de Saída");
  y = paragraph(doc, y, "Este módulo permite autorizar saídas antecipadas de alunos com registro formal:");
  y = bullet(doc, y, [
    "Registrar autorização com motivo e validade",
    "Definir quem autorizou a saída",
    "A autorização expira automaticamente no horário definido",
    "Histórico completo de autorizações emitidas",
  ]);
  y = tipBox(doc, y, "Sempre registre o motivo da saída antecipada para fins de documentação e segurança.");

  // --- 16. Justificativas ---
  y = checkPage(doc, y, 60, "Justificativas", page);
  y = sectionTitle(doc, y, "16", "Justificativas de Falta");
  y = paragraph(doc, y, "O sistema permite que responsáveis enviem justificativas para faltas dos alunos:");
  y = bullet(doc, y, [
    "Responsáveis acessam via link exclusivo (Portal dos Pais)",
    "Enviam justificativa com data e motivo da falta",
    "A coordenação analisa e aprova/rejeita a justificativa",
    "Histórico de todas as justificativas fica registrado",
  ]);

  // --- 17. Portal dos Pais ---
  page.val++;
  y = newPage(doc, "Portal dos Pais", page.val);
  y = sectionTitle(doc, y, "17", "Portal dos Pais");
  y = paragraph(doc, y, "O Portal dos Pais é uma interface exclusiva para responsáveis acompanharem a vida escolar dos seus filhos. O acesso é feito por um link personalizado (token único).");
  y = subTitle(doc, y, "O que o responsável pode ver:");
  y = bullet(doc, y, [
    "Dados do aluno (nome, matrícula, série, turma)",
    "Histórico de movimentações (entradas e saídas)",
    "Ocorrências disciplinares registradas",
    "Alertas relacionados ao aluno",
    "Enviar justificativas de falta",
  ]);
  y = tipBox(doc, y, "O link do portal é enviado automaticamente via WhatsApp para os responsáveis cadastrados.");

  // --- 18. Gestão de Usuários ---
  page.val++;
  y = newPage(doc, "Gestão de Usuários", page.val);
  y = sectionTitle(doc, y, "18", "Gestão de Usuários");
  y = paragraph(doc, y, "Apenas administradores podem gerenciar os usuários do sistema. Funcionalidades:");
  y = bullet(doc, y, [
    "Criar novos usuários com email e senha",
    "Atribuir perfis de acesso (admin, coordenador, porteiro, usuário)",
    "Desativar ou remover usuários",
    "Visualizar histórico de ações dos usuários",
  ]);

  // --- 19. Configurações ---
  y = checkPage(doc, y, 60, "Configurações", page);
  y = sectionTitle(doc, y, "19", "Configurações do Sistema");
  y = paragraph(doc, y, "As configurações permitem personalizar o funcionamento do sistema:");
  y = bullet(doc, y, [
    "Nome da escola e telefone de contato",
    "Limite padrão de saídas por aluno",
    "Ativar/desativar notificações via WhatsApp",
    "Configurar chave API do CallMeBot para envio automático",
    "Ativar/desativar o sistema inteiro",
  ]);

  // --- 20. Perfis ---
  page.val++;
  y = newPage(doc, "Perfis e Permissões", page.val);
  y = sectionTitle(doc, y, "20", "Perfis e Permissões");
  y = paragraph(doc, y, "O sistema possui 4 perfis de acesso com diferentes níveis de permissão:");

  y = subTitle(doc, y, "Administrador (Admin)");
  y = paragraph(doc, y, "Acesso total ao sistema. Pode gerenciar usuários, configurações, horários e todas as demais funcionalidades.");

  y = subTitle(doc, y, "Coordenador");
  y = paragraph(doc, y, "Acesso à gestão pedagógica: alunos, ocorrências, alertas, relatórios, análises, turmas, calendário, justificativas e autorizações.");

  y = subTitle(doc, y, "Porteiro (Gatekeeper)");
  y = paragraph(doc, y, "Acesso à portaria e movimentações. Responsável pela leitura dos QR Codes e registro de entradas/saídas.");

  y = subTitle(doc, y, "Usuário Básico");
  y = paragraph(doc, y, "Acesso limitado ao dashboard. Pode visualizar informações básicas do sistema.");

  y += 10;
  y = checkPage(doc, y, 40, "Perfis e Permissões", page);

  // Final box
  doc.setFillColor(...COLORS.bgLight);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(MARGIN, y, CONTENT_W, 30, 3, 3, "FD");
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Precisa de ajuda?", MARGIN + 5, y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Entre em contato com o administrador do sistema ou a equipe de suporte técnico.", MARGIN + 5, y + 20);

  // Save
  doc.save(`Guia_Usuario_CETI_Digital_${new Date().getFullYear()}.pdf`);
}
