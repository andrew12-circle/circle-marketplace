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
  Link,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface AffiliateWelcomeEmailProps {
  affiliateName: string;
  affiliateId: string;
}

export const AffiliateWelcomeEmail = ({
  affiliateName,
  affiliateId,
}: AffiliateWelcomeEmailProps) => {
  const dashboardUrl = `https://circle.andrewheisley.com/affiliate`;
  const affiliateLink = `https://circle.andrewheisley.com/?aff=${affiliateId}`;

  return (
    <Html>
      <Head />
      <Preview>Welcome to the Circle Affiliate Program - Start earning today!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 Welcome to Circle Affiliates!</Heading>
          
          <Text style={text}>
            Hi {affiliateName},
          </Text>
          
          <Text style={text}>
            Congratulations! You've successfully joined the Circle Affiliate Program. We're excited to have you as a partner and help you start earning commissions right away.
          </Text>

          <Section style={highlightBox}>
            <Text style={highlightText}>
              <strong>Your Commission Rate: 15%</strong><br />
              Earn 15% commission on all Circle Pro signups and marketplace purchases from your referrals!
            </Text>
          </Section>

          <Text style={sectionHeader}>🔗 Your Unique Affiliate Link:</Text>
          <Section style={linkBox}>
            <Text style={linkText}>
              <Link href={affiliateLink} style={linkStyle}>
                {affiliateLink}
              </Link>
            </Text>
          </Section>

          <Text style={text}>
            <strong>How it works:</strong>
          </Text>
          
          <Section style={stepsList}>
            <Text style={stepItem}>
              <strong>1.</strong> Share your unique affiliate link with your network
            </Text>
            <Text style={stepItem}>
              <strong>2.</strong> When someone clicks your link, they're cookied for 30 days
            </Text>
            <Text style={stepItem}>
              <strong>3.</strong> You earn 15% commission on any purchases they make
            </Text>
            <Text style={stepItem}>
              <strong>4.</strong> Get paid monthly via your preferred payment method
            </Text>
          </Section>

          <Text style={sectionHeader}>💰 What You Earn Commission On:</Text>
          <Section style={earningsBox}>
            <Text style={earningItem}>• Circle Pro subscriptions ($99/month = $14.85 commission)</Text>
            <Text style={earningItem}>• Marketplace service purchases</Text>
            <Text style={earningItem}>• Consultation bookings</Text>
            <Text style={earningItem}>• All future purchases from your referrals</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              Access Your Dashboard
            </Button>
          </Section>

          <Text style={text}>
            Your dashboard includes:
          </Text>
          
          <Section style={featuresList}>
            <Text style={featureItem}>📊 Real-time click and conversion tracking</Text>
            <Text style={featureItem}>🔗 Link generator and management tools</Text>
            <Text style={featureItem}>💳 Payment history and pending commissions</Text>
            <Text style={featureItem}>📈 Performance analytics and insights</Text>
            <Text style={featureItem}>🎨 Marketing assets and banners</Text>
          </Section>

          <Text style={tipBox}>
            <strong>💡 Pro Tip:</strong> Add UTM parameters to track which marketing channels work best for you. Your dashboard will show detailed analytics for each campaign.
          </Text>

          <Text style={text}>
            Questions? Reply to this email or check out our affiliate resources in your dashboard.
          </Text>

          <Text style={footer}>
            Welcome to the team!<br />
            The Circle Affiliate Team<br />
            <Link href="mailto:affiliates@circle.andrewheisley.com" style={linkStyle}>
              affiliates@circle.andrewheisley.com
            </Link>
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

const sectionHeader = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  lineHeight: '24px',
  margin: '24px 0 12px',
  padding: '0 40px',
};

const highlightBox = {
  backgroundColor: '#e8f5e8',
  border: '2px solid #28a745',
  borderRadius: '12px',
  margin: '24px 40px',
  padding: '20px',
  textAlign: 'center' as const,
};

const highlightText = {
  color: '#155724',
  fontSize: '16px',
  lineHeight: '22px',
  margin: '0',
};

const linkBox = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #dee2e6',
  borderRadius: '8px',
  margin: '16px 40px 24px',
  padding: '16px',
  textAlign: 'center' as const,
};

const linkText = {
  color: '#333',
  fontSize: '14px',
  margin: '0',
  wordBreak: 'break-all' as const,
};

const linkStyle = {
  color: '#007bff',
  textDecoration: 'none',
};

const stepsList = {
  margin: '16px 40px',
};

const stepItem = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
};

const earningsBox = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffeaa7',
  borderRadius: '8px',
  margin: '16px 40px 24px',
  padding: '16px',
};

const earningItem = {
  color: '#856404',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '4px 0',
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
  width: '220px',
  padding: '12px 0',
};

const featuresList = {
  margin: '16px 40px',
};

const featureItem = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '6px 0',
};

const tipBox = {
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
  textAlign: 'center' as const,
};