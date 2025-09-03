import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface AffiliateConversionNotificationProps {
  affiliateName: string;
  conversionData: {
    conversion_type: string;
    amount_gross: number;
    commission_amount: number;
    order_id?: string;
    subscription_id?: string;
    service_title?: string;
    timestamp: string;
  };
}

export const AffiliateConversionNotification = ({
  affiliateName,
  conversionData,
}: AffiliateConversionNotificationProps) => {
  const formattedTime = new Date(conversionData.timestamp).toLocaleString();
  const conversionTypeDisplay = conversionData.conversion_type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <Html>
      <Head />
      <Preview>🎉 You earned ${conversionData.commission_amount.toFixed(2)} commission!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>💰 Commission Earned!</Heading>
          
          <Text style={text}>
            Congratulations {affiliateName}!
          </Text>
          
          <Section style={commissionBox}>
            <Text style={commissionText}>
              You just earned <strong style={commissionAmount}>${conversionData.commission_amount.toFixed(2)}</strong> in commission!
            </Text>
          </Section>

          <Text style={text}>
            Here are the conversion details:
          </Text>

          <Section style={infoBox}>
            <Text style={infoItem}>
              <strong>Conversion Type:</strong> {conversionTypeDisplay}
            </Text>
            <Text style={infoItem}>
              <strong>Total Sale Amount:</strong> ${conversionData.amount_gross.toFixed(2)}
            </Text>
            <Text style={infoItem}>
              <strong>Your Commission:</strong> ${conversionData.commission_amount.toFixed(2)}
            </Text>
            {conversionData.service_title && (
              <Text style={infoItem}>
                <strong>Service:</strong> {conversionData.service_title}
              </Text>
            )}
            <Text style={infoItem}>
              <strong>Date:</strong> {formattedTime}
            </Text>
            {conversionData.order_id && (
              <Text style={infoItem}>
                <strong>Order ID:</strong> {conversionData.order_id}
              </Text>
            )}
          </Section>

          <Text style={text}>
            Your commission will be added to your next monthly payout. Keep sharing your affiliate links to earn more!
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href="https://circle.andrewheisley.com/affiliate">
              View Your Earnings Dashboard
            </Button>
          </Section>

          <Text style={encouragementText}>
            🚀 <strong>Pro Tip:</strong> Share your success story with your network! Social proof drives more conversions.
          </Text>

          <Text style={footer}>
            Keep up the fantastic work!<br />
            The Circle Affiliate Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
};

const commissionBox = {
  backgroundColor: '#d4edda',
  border: '2px solid #28a745',
  borderRadius: '12px',
  margin: '24px 40px',
  padding: '24px',
  textAlign: 'center' as const,
};

const commissionText = {
  color: '#155724',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '24px',
};

const commissionAmount = {
  color: '#28a745',
  fontSize: '24px',
};

const infoBox = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px',
};

const infoItem = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#28a745',
  borderRadius: '5px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  width: '250px',
  padding: '12px 0',
};

const encouragementText = {
  backgroundColor: '#e3f2fd',
  border: '1px solid #2196f3',
  borderRadius: '8px',
  color: '#1976d2',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 40px',
  padding: '16px',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '32px 0',
  padding: '0 40px',
};