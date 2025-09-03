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

interface AffiliateClickNotificationProps {
  affiliateName: string;
  clickData: {
    source_url: string;
    user_agent: string;
    referrer: string;
    utm_source?: string;
    utm_campaign?: string;
    timestamp: string;
  };
}

export const AffiliateClickNotification = ({
  affiliateName,
  clickData,
}: AffiliateClickNotificationProps) => {
  const formattedTime = new Date(clickData.timestamp).toLocaleString();

  return (
    <Html>
      <Head />
      <Preview>Someone just clicked your affiliate link!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 New Click Alert!</Heading>
          
          <Text style={text}>
            Hi {affiliateName},
          </Text>
          
          <Text style={text}>
            Great news! Someone just clicked on your affiliate link. Here are the details:
          </Text>

          <Section style={infoBox}>
            <Text style={infoItem}>
              <strong>Time:</strong> {formattedTime}
            </Text>
            <Text style={infoItem}>
              <strong>Source URL:</strong> {clickData.source_url}
            </Text>
            {clickData.utm_source && (
              <Text style={infoItem}>
                <strong>UTM Source:</strong> {clickData.utm_source}
              </Text>
            )}
            {clickData.utm_campaign && (
              <Text style={infoItem}>
                <strong>Campaign:</strong> {clickData.utm_campaign}
              </Text>
            )}
            {clickData.referrer && clickData.referrer !== 'Direct' && (
              <Text style={infoItem}>
                <strong>Referrer:</strong> {clickData.referrer}
              </Text>
            )}
          </Section>

          <Text style={text}>
            Keep up the great work! Remember, you earn commission on any purchases made within 30 days of this click.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href="https://circle.andrewheisley.com/affiliate">
              View Your Dashboard
            </Button>
          </Section>

          <Text style={footer}>
            Best regards,<br />
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
  backgroundColor: '#007bff',
  borderRadius: '5px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  width: '200px',
  padding: '12px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '32px 0',
  padding: '0 40px',
};