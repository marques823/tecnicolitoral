import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Button,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ClientNotificationEmailProps {
  notificationType: string
  ticketTitle: string
  ticketId: string
  companyName: string
  oldStatus?: string
  newStatus?: string
  ticketUrl: string
}

export const ClientNotificationEmail = ({
  notificationType,
  ticketTitle,
  ticketId,
  companyName,
  oldStatus,
  newStatus,
  ticketUrl,
}: ClientNotificationEmailProps) => {
  const getSubject = () => {
    switch (notificationType) {
      case 'status_change':
        return `Atualização do seu chamado #${ticketId}`;
      default:
        return `Atualização do chamado #${ticketId}`;
    }
  };

  const getMainMessage = () => {
    switch (notificationType) {
      case 'status_change':
        return `O status do seu chamado foi atualizado de "${oldStatus}" para "${newStatus}".`;
      default:
        return 'Houve uma atualização no seu chamado.';
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{getSubject()}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{getSubject()}</Heading>
          
          <Section style={section}>
            <Text style={text}>
              Olá!
            </Text>
            
            <Text style={text}>
              {getMainMessage()}
            </Text>
            
            <Text style={text}>
              <strong>Chamado:</strong> {ticketTitle}
            </Text>
            
            {notificationType === 'status_change' && (
              <Text style={text}>
                <strong>Status anterior:</strong> {oldStatus}<br />
                <strong>Novo status:</strong> {newStatus}
              </Text>
            )}
            
            <Section style={buttonContainer}>
              <Button
                style={button}
                href={ticketUrl}
              >
                Visualizar Chamado
              </Button>
            </Section>
            
            <Text style={smallText}>
              Para acompanhar o andamento do seu chamado, clique no botão acima ou acesse o sistema da {companyName}.
            </Text>
            
            <Text style={smallText}>
              Se você não solicitou este chamado ou tem dúvidas, entre em contato conosco.
            </Text>
          </Section>
          
          <Text style={footer}>
            © {new Date().getFullYear()} {companyName}. Todos os direitos reservados.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ClientNotificationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const section = {
  padding: '0 48px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  lineHeight: '1.25',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.4',
  margin: '16px 0',
}

const smallText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '1.4',
  margin: '12px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  fontWeight: 'bold',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '1.4',
  marginTop: '32px',
  textAlign: 'center' as const,
  padding: '0 48px',
}