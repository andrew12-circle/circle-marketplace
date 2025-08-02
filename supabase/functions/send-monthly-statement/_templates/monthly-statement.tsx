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
  Hr,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface MonthlyStatementEmailProps {
  agentName: string;
  monthName: string;
  totalPoints: number;
  transactions: any[];
  allocations: any[];
  statementUrl: string;
}

export const MonthlyStatementEmail = ({
  agentName,
  monthName,
  totalPoints,
  transactions,
  allocations,
  statementUrl,
}: MonthlyStatementEmailProps) => {
  const totalSpent = transactions.reduce((sum, t) => sum + (t.points_used || 0), 0);
  const totalReceived = allocations.reduce((sum, a) => sum + (a.allocated_points || 0), 0);

  return (
    <Html>
      <Head />
      <Preview>Your {monthName} Points Statement - Circle Platform</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>Circle Platform</Heading>
            <Text style={headerSubtext}>Monthly Points Statement</Text>
          </Section>

          {/* Account Summary */}
          <Section style={summarySection}>
            <Heading style={h2}>Hello {agentName},</Heading>
            <Text style={text}>
              Here's your points activity summary for {monthName}
            </Text>
            
            <Section style={balanceCard}>
              <Row>
                <Column style={balanceLeft}>
                  <Text style={balanceLabel}>Current Balance</Text>
                  <Text style={balanceAmount}>{totalPoints.toLocaleString()} Points</Text>
                  <Text style={balanceValue}>${totalPoints.toLocaleString()} Value</Text>
                </Column>
                <Column style={balanceRight}>
                  <Text style={balanceSmall}>Available to spend</Text>
                </Column>
              </Row>
            </Section>
          </Section>

          {/* Monthly Activity */}
          <Section style={activitySection}>
            <Heading style={h3}>{monthName} Activity</Heading>
            
            <Row style={statsRow}>
              <Column style={statColumn}>
                <Text style={statNumber}>+{totalReceived.toLocaleString()}</Text>
                <Text style={statLabel}>Points Received</Text>
              </Column>
              <Column style={statColumn}>
                <Text style={statNumber}>-{totalSpent.toLocaleString()}</Text>
                <Text style={statLabel}>Points Spent</Text>
              </Column>
              <Column style={statColumn}>
                <Text style={statNumber}>{allocations.length}</Text>
                <Text style={statLabel}>New Allocations</Text>
              </Column>
            </Row>
          </Section>

          {/* Recent Transactions */}
          {transactions.length > 0 && (
            <Section style={transactionsSection}>
              <Heading style={h3}>Recent Transactions</Heading>
              {transactions.slice(0, 5).map((transaction, index) => (
                <Row key={index} style={transactionRow}>
                  <Column style={transactionLeft}>
                    <Text style={transactionDate}>
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </Text>
                    <Text style={transactionDesc}>
                      {transaction.description || 'Service Purchase'}
                    </Text>
                  </Column>
                  <Column style={transactionRight}>
                    <Text style={transactionAmount}>
                      -{transaction.points_used} points
                    </Text>
                    <Text style={transactionValue}>
                      ${transaction.amount_covered}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>
          )}

          {/* Call to Action */}
          <Section style={ctaSection}>
            <Text style={ctaText}>
              💡 <strong>Ready to put your points to work?</strong>
            </Text>
            <Text style={text}>
              Discover exclusive services in our marketplace and maximize your points value. 
              From marketing campaigns to closing gifts, we've got everything you need to grow your business.
            </Text>
            
            <Link href={statementUrl} style={ctaButton}>
              View Full Statement & Shop Marketplace
            </Link>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions about your statement? Reply to this email or contact support.
            </Text>
            <Text style={footerText}>
              <Link href={statementUrl} style={footerLink}>View Online</Link> | 
              <Link href="mailto:support@circleplatform.com" style={footerLink}> Support</Link>
            </Text>
            <Text style={disclaimer}>
              This is an automated statement. Your points never expire and can be used 
              anytime in our marketplace.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default MonthlyStatementEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#2563eb',
  padding: '32px 24px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  lineHeight: '1.3',
};

const headerSubtext = {
  color: '#e2e8f0',
  fontSize: '16px',
  margin: '0',
};

const summarySection = {
  padding: '32px 24px 24px',
};

const h2 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const h3 = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const text = {
  color: '#6b7280',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const balanceCard = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const balanceLeft = {
  verticalAlign: 'top' as const,
};

const balanceRight = {
  verticalAlign: 'top' as const,
  textAlign: 'right' as const,
};

const balanceLabel = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 4px',
};

const balanceAmount = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 4px',
};

const balanceValue = {
  color: '#059669',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0',
};

const balanceSmall = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0',
};

const activitySection = {
  padding: '0 24px 24px',
};

const statsRow = {
  margin: '16px 0',
};

const statColumn = {
  textAlign: 'center' as const,
  padding: '16px 8px',
};

const statNumber = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 4px',
};

const statLabel = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const transactionsSection = {
  padding: '0 24px 24px',
};

const transactionRow = {
  borderBottom: '1px solid #f3f4f6',
  padding: '12px 0',
};

const transactionLeft = {
  verticalAlign: 'top' as const,
};

const transactionRight = {
  verticalAlign: 'top' as const,
  textAlign: 'right' as const,
};

const transactionDate = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0 0 4px',
};

const transactionDesc = {
  color: '#1f2937',
  fontSize: '14px',
  margin: '0',
};

const transactionAmount = {
  color: '#dc2626',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 2px',
};

const transactionValue = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0',
};

const ctaSection = {
  backgroundColor: '#fef7f0',
  border: '1px solid #fed7aa',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 24px 0',
  textAlign: 'center' as const,
};

const ctaText = {
  color: '#ea580c',
  fontSize: '18px',
  margin: '0 0 16px',
};

const ctaButton = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  padding: '12px 24px',
  textDecoration: 'none',
  margin: '16px 0 0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 24px',
};

const footer = {
  padding: '0 24px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 8px',
};

const footerLink = {
  color: '#2563eb',
  textDecoration: 'none',
  margin: '0 4px',
};

const disclaimer = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '16px 0 0',
  fontStyle: 'italic',
};