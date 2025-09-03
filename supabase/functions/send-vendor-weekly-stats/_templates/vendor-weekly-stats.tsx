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
  Hr,
  Button,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface VendorWeeklyStatsEmailProps {
  vendorName: string
  weekStartDate: string
  weekEndDate: string
  cardViews: number
  funnelViews: number
  bookings: number
  revenue: number
  hasAgreement: boolean
  dashboardUrl: string
  includeViews?: boolean
  includeBookings?: boolean
  includeRevenue?: boolean
  includeConversions?: boolean
  showAgreementCTA?: boolean
}

export const VendorWeeklyStatsEmail = ({
  vendorName,
  weekStartDate,
  weekEndDate,
  cardViews,
  funnelViews,
  bookings,
  revenue,
  hasAgreement,
  dashboardUrl,
  includeViews = true,
  includeBookings = true,
  includeRevenue = true,
  includeConversions = true,
  showAgreementCTA = true,
}: VendorWeeklyStatsEmailProps) => (
  <Html>
    <Head />
    <Preview>Your weekly performance stats from Circle Marketplace</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>📊 Your Weekly Stats</Heading>
        
        <Text style={text}>
          Hi {vendorName},
        </Text>
        
        <Text style={text}>
          Here's how your services performed on Circle Marketplace from {weekStartDate} to {weekEndDate}:
        </Text>

        <Section style={statsContainer}>
          {includeViews && (
            <div style={statItem}>
              <div style={statNumber}>{cardViews.toLocaleString()}</div>
              <div style={statLabel}>Card Views</div>
            </div>
          )}
          {includeConversions && (
            <div style={statItem}>
              <div style={statNumber}>{funnelViews.toLocaleString()}</div>
              <div style={statLabel}>Funnel Views</div>
            </div>
          )}
          {includeBookings && (
            <div style={statItem}>
              <div style={statNumber}>{bookings.toLocaleString()}</div>
              <div style={statLabel}>Bookings</div>
            </div>
          )}
          {includeRevenue && (
            <div style={statItem}>
              <div style={statNumber}>${revenue.toLocaleString()}</div>
              <div style={statLabel}>Revenue Generated</div>
            </div>
          )}
        </Section>

        {showAgreementCTA && !hasAgreement && (
          <>
            <Hr style={hr} />
            <Section style={ctaSection}>
              <Heading style={h2}>🚀 Ready to Take It to the Next Level?</Heading>
              <Text style={text}>
                Your services are gaining traction! To unlock premium features, enhanced visibility, 
                and co-marketing opportunities, let's get your vendor agreement signed.
              </Text>
              <Button style={button} href={`${dashboardUrl}?tab=agreement`}>
                Complete Vendor Agreement
              </Button>
            </Section>
          </>
        )}

        {hasAgreement && (
          <>
            <Hr style={hr} />
            <Text style={text}>
              Great performance this week! Consider adding more services to capture even more leads 
              and grow your presence on the platform.
            </Text>
          </>
        )}

        <Hr style={hr} />
        
        <Text style={text}>
          <Link href={dashboardUrl} style={link}>
            View Full Dashboard →
          </Link>
        </Text>

        <Text style={footer}>
          <Link href="https://circle.com" target="_blank" style={{...link, color: '#898989'}}>
            Circle Marketplace
          </Link>
          <br />
          Driving real estate success through strategic partnerships
        </Text>
      </Container>
    </Body>
  </Html>
)

export default VendorWeeklyStatsEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '16px 0',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '16px 0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 20px',
}

const statsContainer = {
  display: 'flex',
  justifyContent: 'space-around',
  margin: '32px 0',
  padding: '20px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
}

const statItem = {
  textAlign: 'center' as const,
  flex: '1',
}

const statNumber = {
  fontSize: '32px',
  fontWeight: '700',
  color: '#0066cc',
  lineHeight: '40px',
}

const statLabel = {
  fontSize: '14px',
  color: '#666',
  fontWeight: '500',
  marginTop: '4px',
}

const ctaSection = {
  textAlign: 'center' as const,
  padding: '20px',
  backgroundColor: '#fff7ed',
  borderRadius: '8px',
  margin: '20px',
}

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '16px 0',
}

const link = {
  color: '#007ee6',
  textDecoration: 'underline',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 20px',
  textAlign: 'center' as const,
  marginTop: '32px',
}