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

interface Report {
  period: string;
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
}

export const exportTicketToPDF = (ticket: Ticket) => {
  const doc = new jsPDF();
  
  // Cabeçalho
  doc.setFontSize(20);
  doc.text("Ticket de Suporte", 20, 30);
  
  // Informações básicas
  doc.setFontSize(12);
  doc.text(`ID: ${ticket.id}`, 20, 50);
  doc.text(`Título: ${ticket.title}`, 20, 60);
  doc.text(`Status: ${ticket.status}`, 20, 70);
  doc.text(`Prioridade: ${ticket.priority}`, 20, 80);
  
  if (ticket.categories?.name) {
    doc.text(`Categoria: ${ticket.categories.name}`, 20, 90);
  }
  
  doc.text(`Criado em: ${new Date(ticket.created_at).toLocaleDateString('pt-BR')}`, 20, 100);
  doc.text(`Atualizado em: ${new Date(ticket.updated_at).toLocaleDateString('pt-BR')}`, 20, 110);
  
  // Descrição
  doc.setFontSize(14);
  doc.text("Descrição:", 20, 130);
  
  doc.setFontSize(10);
  const splitDescription = doc.splitTextToSize(ticket.description, 170);
  doc.text(splitDescription, 20, 140);
  
  // Rodapé
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text(`Exportado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, pageHeight - 10);
  
  doc.save(`ticket-${ticket.id}.pdf`);
};

export const exportReportToPDF = (report: Report, additionalData?: any) => {
  const doc = new jsPDF();
  
  // Cabeçalho
  doc.setFontSize(20);
  doc.text("Relatório de Tickets", 20, 30);
  
  // Período
  doc.setFontSize(12);
  doc.text(`Período: ${report.period}`, 20, 50);
  
  // Estatísticas
  doc.setFontSize(14);
  doc.text("Resumo Geral:", 20, 70);
  
  doc.setFontSize(10);
  doc.text(`Total de Tickets: ${report.totalTickets}`, 30, 85);
  doc.text(`Tickets Abertos: ${report.openTickets}`, 30, 95);
  doc.text(`Tickets em Andamento: ${report.inProgressTickets}`, 30, 105);
  doc.text(`Tickets Resolvidos: ${report.resolvedTickets}`, 30, 115);
  doc.text(`Tickets Fechados: ${report.closedTickets}`, 30, 125);
  
  // Dados adicionais se fornecidos
  if (additionalData) {
    let yPosition = 150;
    
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
  
  // Rodapé
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text(`Exportado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, pageHeight - 10);
  
  doc.save(`relatorio-tickets-${report.period.replace(/\s+/g, '-')}.pdf`);
};