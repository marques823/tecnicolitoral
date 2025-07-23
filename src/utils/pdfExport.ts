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
}

interface Company {
  name: string;
}

interface Report {
  period: string;
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
}

export const exportTicketToPDF = (ticket: Ticket, company?: Company) => {
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
  doc.text("Ticket de Suporte", 20, company ? 50 : 30);
  
  // Informações básicas
  const startY = company ? 70 : 50;
  doc.setFontSize(12);
  doc.text(`ID: ${ticket.id}`, 20, startY);
  doc.text(`Título: ${ticket.title}`, 20, startY + 10);
  doc.text(`Status: ${ticket.status}`, 20, startY + 20);
  doc.text(`Prioridade: ${ticket.priority}`, 20, startY + 30);
  
  let currentY = startY + 40;
  if (ticket.categories?.name) {
    doc.text(`Categoria: ${ticket.categories.name}`, 20, currentY);
    currentY += 10;
  }
  
  doc.text(`Criado em: ${new Date(ticket.created_at).toLocaleDateString('pt-BR')}`, 20, currentY);
  doc.text(`Atualizado em: ${new Date(ticket.updated_at).toLocaleDateString('pt-BR')}`, 20, currentY + 10);
  
  // Descrição
  const descY = company ? 150 : 130;
  doc.setFontSize(14);
  doc.text("Descrição:", 20, descY);
  
  doc.setFontSize(10);
  const splitDescription = doc.splitTextToSize(ticket.description, 170);
  doc.text(splitDescription, 20, descY + 10);
  
  // Rodapé (se não houver empresa no cabeçalho)
  if (!company) {
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text(`Exportado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, pageHeight - 10);
  }
  
  doc.save(`ticket-${ticket.id}.pdf`);
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