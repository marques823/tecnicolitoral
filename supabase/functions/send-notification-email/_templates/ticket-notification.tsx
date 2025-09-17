import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Hr,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface TicketNotificationProps {
  type: 'new_ticket' | 'status_change' | 'assignment'
  companyName: string
  ticketId: string
  ticketTitle: string
  ticketDescription?: string
  category: string
  priority: string
  status: string
  createdBy: string
  assignedTo?: string
  oldStatus?: string
  newStatus?: string
  oldAssignedTo?: string
  newAssignedTo?: string
  ticketUrl: string
  dashboardUrl: string
  createdAt: string
}

export const TicketNotificationEmail = ({
  type,
  companyName,
  ticketId,
  ticketTitle,
  ticketDescription,
  category,
  priority,
  status,
  createdBy,
  assignedTo,
  oldStatus,
  newStatus,
  oldAssignedTo,
  newAssignedTo,
  ticketUrl,
  dashboardUrl,
  createdAt,
}: TicketNotificationProps) => {
  const getNotificationContent = () => {
    switch (type) {
      case 'new_ticket':
        return {
          icon: '🎫',
          title: 'Novo Ticket Criado',
          preview: `Novo ticket: ${ticketTitle}`,
          description: 'Um novo ticket foi criado no sistema e requer atenção.',
          details: ticketDescription ? [
            { label: 'Descrição', value: ticketDescription }
          ] : []
        }
      case 'status_change':
        return {
          icon: '🔄',
          title: 'Status do Ticket Alterado',
          preview: `Status alterado: ${ticketTitle}`,
          description: 'O status do ticket foi atualizado.',
          details: [
            { label: 'Status Anterior', value: oldStatus || 'N/A' },
            { label: 'Novo Status', value: newStatus || status }
          ]
        }
      case 'assignment':
        return {
          icon: '👤',
          title: 'Ticket Atribuído',
          preview: `Ticket atribuído: ${ticketTitle}`,
          description: 'O responsável pelo ticket foi alterado.',
          details: [
            { label: 'Responsável Anterior', value: oldAssignedTo || 'Não atribuído' },
            { label: 'Novo Responsável', value: newAssignedTo || assignedTo || 'Não atribuído' }
          ]
        }
      default:
        return {
          icon: '📋',
          title: 'Atualização do Ticket',
          preview: `Atualização: ${ticketTitle}`,
          description: 'O ticket foi atualizado.',
          details: []
        }
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return '#dc2626'
      case 'medium': return '#ea580c'
      case 'low': return '#16a34a'
      default: return '#6b7280'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return '#3b82f6'
      case 'in_progress': return '#f59e0b'
      case 'resolved': return '#10b981'
      case 'closed': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const translatePriority = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'ALTA'
      case 'medium': return 'MÉDIA'
      case 'low': return 'BAIXA'
      default: return priority.toUpperCase()
    }
  }

  const translateStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'ABERTO'
      case 'in_progress': return 'EM ANDAMENTO'
      case 'resolved': return 'RESOLVIDO'
      case 'closed': return 'FECHADO'
      default: return status.replace('_', ' ').toUpperCase()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const notificationContent = getNotificationContent()

  return (
    <Html>
      <Head />
      <Preview>{notificationContent.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerTitle}>{companyName}</Heading>
            <Text style={headerSubtitle}>Sistema de Gestão de Tickets</Text>
          </Section>

          {/* Notification Alert */}
          <Section style={alertSection}>
            <Row>
              <Column style={iconColumn}>
                <Text style={iconText}>{notificationContent.icon}</Text>
              </Column>
              <Column style={alertContent}>
                <Heading style={alertTitle}>{notificationContent.title}</Heading>
                <Text style={alertDescription}>{notificationContent.description}</Text>
              </Column>
            </Row>
          </Section>

          {/* Ticket Details */}
          <Section style={ticketSection}>
            <Heading style={sectionTitle}>Detalhes do Ticket</Heading>
            
            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>ID do Ticket:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={valueText}>#{ticketId.substring(0, 8).toUpperCase()}</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Título:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={valueText}>{ticketTitle}</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Categoria:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={valueText}>{category}</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Prioridade:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={{...valueText, color: getPriorityColor(priority), fontWeight: 'bold'}}>
                  {translatePriority(priority)}
                </Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Status:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={{...valueText, color: getStatusColor(status), fontWeight: 'bold'}}>
                  {translateStatus(status)}
                </Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Criado por:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={valueText}>{createdBy}</Text>
              </Column>
            </Row>

            {assignedTo && (
              <Row style={detailRow}>
                <Column style={labelColumn}>
                  <Text style={labelText}>Responsável:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={valueText}>{assignedTo}</Text>
                </Column>
              </Row>
            )}

            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={labelText}>Data de Criação:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={valueText}>{formatDate(createdAt)}</Text>
              </Column>
            </Row>
          </Section>

          {/* Notification Specific Details */}
          {notificationContent.details.length > 0 && (
            <Section style={changesSection}>
              <Heading style={sectionTitle}>Alterações</Heading>
              {notificationContent.details.map((detail, index) => (
                <Row key={index} style={detailRow}>
                  <Column style={labelColumn}>
                    <Text style={labelText}>{detail.label}:</Text>
                  </Column>
                  <Column style={valueColumn}>
                    <Text style={valueText}>{detail.value}</Text>
                  </Column>
                </Row>
              ))}
            </Section>
          )}

          <Hr style={separator} />

          {/* Action Buttons */}
          <Section style={buttonSection}>
            <Row>
              <Column style={buttonColumn}>
                <Button href={ticketUrl} style={primaryButton}>
                  Ver Ticket Completo
                </Button>
              </Column>
              <Column style={buttonColumn}>
                <Button href={dashboardUrl} style={secondaryButton}>
                  Ir para Dashboard
                </Button>
              </Column>
            </Row>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Este é um email automático do sistema de gestão de tickets do {companyName}.
            </Text>
            <Text style={footerText}>
              Para alterar suas preferências de notificação, acesse seu painel de controle.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default TicketNotificationEmail

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  marginTop: '20px',
  marginBottom: '20px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  maxWidth: '600px',
}

const header = {
  backgroundColor: '#1e40af',
  padding: '24px',
  textAlign: 'center' as const,
}

const headerTitle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: '0 0 8px 0',
}

const headerSubtitle = {
  fontSize: '14px',
  color: '#e0e7ff',
  margin: '0',
}

const alertSection = {
  padding: '24px',
  backgroundColor: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
}

const iconColumn = {
  width: '48px',
  verticalAlign: 'top' as const,
}

const iconText = {
  fontSize: '32px',
  margin: '0',
  textAlign: 'center' as const,
}

const alertContent = {
  verticalAlign: 'top' as const,
  paddingLeft: '16px',
}

const alertTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1e293b',
  margin: '0 0 8px 0',
}

const alertDescription = {
  fontSize: '16px',
  color: '#64748b',
  margin: '0',
  lineHeight: '1.5',
}

const ticketSection = {
  padding: '24px',
}

const changesSection = {
  padding: '0 24px 24px 24px',
  backgroundColor: '#fffbeb',
  borderTop: '1px solid #fbbf24',
  borderBottom: '1px solid #fbbf24',
}

const sectionTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1e293b',
  margin: '0 0 16px 0',
}

const detailRow = {
  marginBottom: '12px',
}

const labelColumn = {
  width: '140px',
  verticalAlign: 'top' as const,
}

const valueColumn = {
  verticalAlign: 'top' as const,
  paddingLeft: '16px',
}

const labelText = {
  fontSize: '14px',
  color: '#64748b',
  fontWeight: '600',
  margin: '0',
}

const valueText = {
  fontSize: '14px',
  color: '#1e293b',
  margin: '0',
  lineHeight: '1.4',
}

const separator = {
  borderColor: '#e2e8f0',
  margin: '0',
}

const buttonSection = {
  padding: '24px',
  textAlign: 'center' as const,
}

const buttonColumn = {
  textAlign: 'center' as const,
  paddingLeft: '8px',
  paddingRight: '8px',
}

const primaryButton = {
  backgroundColor: '#1e40af',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '0 4px',
}

const secondaryButton = {
  backgroundColor: '#ffffff',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  color: '#374151',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '0 4px',
}

const footer = {
  padding: '24px',
  backgroundColor: '#f8fafc',
  textAlign: 'center' as const,
}

const footerText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0 0 8px 0',
  lineHeight: '1.4',
}