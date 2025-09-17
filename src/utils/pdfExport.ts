import jsPDF from "jspdf";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  categories?: { name: string };
  assigned_to?: string;
  created_by?: string;
  client_id?: string;
  clients?: { name: string; company_name?: string };
  profiles?: { name: string };
}

interface Company {
  name: string;
  logo_url?: string;
}

interface Report {
  period: string;
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
}

// Tradução de status
const translateStatus = (status: string): string => {
  const translations: { [key: string]: string } = {
    'open': 'Aberto',
    'in_progress': 'Em Andamento',
    'resolved': 'Resolvido',
    'closed': 'Fechado',
    'pending': 'Pendente'
  };
  return translations[status] || status;
};

// Tradução de prioridade
const translatePriority = (priority: string): string => {
  const translations: { [key: string]: string } = {
    'low': 'Baixa',
    'medium': 'Média',
    'high': 'Alta',
    'urgent': 'Urgente'
  };
  return translations[priority] || priority;
};

export const exportTicketToPDF = (ticket: Ticket, company?: Company) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Definir cores
  const primaryColor = [37, 99, 235]; // Azul primário
  const grayColor = [100, 116, 139]; // Cinza
  const lightGrayColor = [241, 245, 249]; // Cinza claro
  
  let currentY = 20;
  
  // Cabeçalho com fundo colorido
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Logo/Nome da empresa no cabeçalho
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const companyName = company?.name || 'Sistema de Tickets';
  doc.text(companyName, 20, 25);
  
  // Data de exportação no cabeçalho
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const exportDate = `Exportado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;
  const exportDateWidth = doc.getTextWidth(exportDate);
  doc.text(exportDate, pageWidth - exportDateWidth - 20, 25);
  
  currentY = 60;
  
  // Título do documento
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text("CHAMADO DE SUPORTE", 20, currentY);
  
  currentY += 25;
  
  // Card de informações principais
  doc.setFillColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);
  doc.roundedRect(20, currentY - 5, pageWidth - 40, 80, 3, 3, 'F');
  
  // Informações principais em duas colunas
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  
  // Coluna 1
  doc.text("ID do Chamado:", 30, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(ticket.id, 30, currentY + 20);
  
  doc.setFont('helvetica', 'bold');
  doc.text("Status:", 30, currentY + 35);
  doc.setFont('helvetica', 'normal');
  doc.text(translateStatus(ticket.status), 30, currentY + 45);
  
  doc.setFont('helvetica', 'bold');
  doc.text("Prioridade:", 30, currentY + 60);
  doc.setFont('helvetica', 'normal');
  doc.text(translatePriority(ticket.priority), 30, currentY + 70);
  
  // Coluna 2
  const col2X = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.text("Criado em:", col2X, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(ticket.created_at).toLocaleDateString('pt-BR'), col2X, currentY + 20);
  
  doc.setFont('helvetica', 'bold');
  doc.text("Última atualização:", col2X, currentY + 35);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(ticket.updated_at).toLocaleDateString('pt-BR'), col2X, currentY + 45);
  
  if (ticket.categories?.name) {
    doc.setFont('helvetica', 'bold');
    doc.text("Categoria:", col2X, currentY + 60);
    doc.setFont('helvetica', 'normal');
    doc.text(ticket.categories.name, col2X, currentY + 70);
  }
  
  currentY += 100;
  
  // Título do chamado
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("TÍTULO:", 20, currentY);
  
  currentY += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  const splitTitle = doc.splitTextToSize(ticket.title, pageWidth - 40);
  doc.text(splitTitle, 20, currentY);
  currentY += splitTitle.length * 7 + 10;
  
  // Descrição
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("DESCRIÇÃO:", 20, currentY);
  
  currentY += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const splitDescription = doc.splitTextToSize(ticket.description, pageWidth - 40);
  doc.text(splitDescription, 20, currentY);
  
  // Informações adicionais se disponíveis
  currentY += splitDescription.length * 5 + 20;
  
  if (ticket.clients?.name || ticket.profiles?.name) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("INFORMAÇÕES ADICIONAIS:", 20, currentY);
    
    currentY += 15;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    if (ticket.clients?.name) {
      doc.setFont('helvetica', 'bold');
      doc.text("Cliente:", 20, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(ticket.clients.name, 60, currentY);
      currentY += 10;
      
      if (ticket.clients.company_name) {
        doc.setFont('helvetica', 'bold');
        doc.text("Empresa:", 20, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(ticket.clients.company_name, 60, currentY);
        currentY += 10;
      }
    }
    
    if (ticket.profiles?.name) {
      doc.setFont('helvetica', 'bold');
      doc.text("Responsável:", 20, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(ticket.profiles.name, 75, currentY);
    }
  }
  
  // Rodapé
  doc.setFillColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text("Este documento foi gerado automaticamente pelo sistema", 20, pageHeight - 10);
  
  const pageInfo = `Página 1 de 1 - ${companyName}`;
  const pageInfoWidth = doc.getTextWidth(pageInfo);
  doc.text(pageInfo, pageWidth - pageInfoWidth - 20, pageHeight - 10);
  
  doc.save(`chamado-${ticket.id}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
};

export const exportReportToPDF = (report: Report, company?: Company, additionalData?: any) => {
  const doc = new jsPDF();
  
  // Cabeçalho da empresa
  if (company) {
    doc.setFontSize(16);
    doc.text(company.name, 20, 20);
    doc.setFontSize(10);
    doc.text(`Exportado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 30);
  }
  
  // Cabeçalho do documento
  doc.setFontSize(20);
  doc.text("Relatório de Tickets", 20, company ? 50 : 30);
  
  // Período
  const startY = company ? 70 : 50;
  doc.setFontSize(12);
  doc.text(`Período: ${report.period}`, 20, startY);
  
  // Estatísticas
  doc.setFontSize(14);
  doc.text("Resumo Geral:", 20, startY + 20);
  
  doc.setFontSize(10);
  doc.text(`Total de Tickets: ${report.totalTickets}`, 30, startY + 35);
  doc.text(`Tickets Abertos: ${report.openTickets}`, 30, startY + 45);
  doc.text(`Tickets em Andamento: ${report.inProgressTickets}`, 30, startY + 55);
  doc.text(`Tickets Resolvidos: ${report.resolvedTickets}`, 30, startY + 65);
  doc.text(`Tickets Fechados: ${report.closedTickets}`, 30, startY + 75);
  
  // Dados adicionais se fornecidos
  if (additionalData) {
    let yPosition = company ? 170 : 150;
    
    if (additionalData.categoryStats) {
      doc.setFontSize(14);
      doc.text("Tickets por Categoria:", 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      additionalData.categoryStats.forEach((cat: any) => {
        doc.text(`${cat.category}: ${cat.count} tickets`, 30, yPosition);
        yPosition += 10;
      });
      yPosition += 10;
    }
    
    if (additionalData.priorityStats) {
      doc.setFontSize(14);
      doc.text("Tickets por Prioridade:", 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      additionalData.priorityStats.forEach((priority: any) => {
        doc.text(`${priority.priority}: ${priority.count} tickets`, 30, yPosition);
        yPosition += 10;
      });
    }
  }
  
  // Rodapé (se não houver empresa no cabeçalho)
  if (!company) {
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text(`Exportado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, pageHeight - 10);
  }
  
  doc.save(`relatorio-tickets-${report.period.replace(/\s+/g, '-')}.pdf`);
};