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
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface VendorReportData {
  vendor_name: string
  vendor_email: string
  report_month: string
  total_clicks: number
  unique_agents: number
  top_services: Array<{
    service_name: string
    clicks: number
    unique_agents: number
  }>
  geographic_breakdown: Array<{
    location: string
    clicks: number
    agents: number
  }>
  agent_profiles: Array<{
    agent_name: string
    experience_level: string
    location: string
    clicks: number
  }>
  commission_rate: number
  estimated_commission: number
}

export const VendorMonthlyReport = ({
  vendor_name,
  vendor_email,
  report_month,
  total_clicks,
  unique_agents,
  top_services,
  geographic_breakdown,
  agent_profiles,
  commission_rate,
  estimated_commission,
}: VendorReportData) => (
  <Html>
    <Head />
    <Preview>Circle Platform - Monthly Traffic Report for {report_month}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Circle Platform</Heading>
        <Text style={subtitle}>Monthly Traffic Report - {report_month}</Text>
        
        <Section style={section}>
          <Text style={greeting}>Hello {vendor_name} Team,</Text>
          <Text style={text}>
            Here's your monthly traffic report showing the qualified real estate agents we've sent to your platform. 
            This data helps track the value of our partnership and support commission calculations.
          </Text>
        </Section>

        <Section style={section}>
          <Heading style={h2}>Traffic Summary</Heading>
          <Table style={table}>
            <Tbody>
              <Tr>
                <Td style={tableCell}><strong>Total Clicks</strong></Td>
                <Td style={tableCell}>{total_clicks.toLocaleString()}</Td>
              </Tr>
              <Tr>
                <Td style={tableCell}><strong>Unique Agents</strong></Td>
                <Td style={tableCell}>{unique_agents.toLocaleString()}</Td>
              </Tr>
              <Tr>
                <Td style={tableCell}><strong>Commission Rate</strong></Td>
                <Td style={tableCell}>{commission_rate}%</Td>
              </Tr>
              <Tr>
                <Td style={tableCell}><strong>Estimated Commission Value</strong></Td>
                <Td style={tableCell}>${estimated_commission.toLocaleString()}</Td>
              </Tr>
            </Tbody>
          </Table>
        </Section>

        <Section style={section}>
          <Heading style={h2}>Top Performing Services</Heading>
          <Table style={table}>
            <Thead>
              <Tr>
                <Th style={tableHeader}>Service</Th>
                <Th style={tableHeader}>Clicks</Th>
                <Th style={tableHeader}>Unique Agents</Th>
              </Tr>
            </Thead>
            <Tbody>
              {top_services.map((service, index) => (
                <Tr key={index}>
                  <Td style={tableCell}>{service.service_name}</Td>
                  <Td style={tableCell}>{service.clicks}</Td>
                  <Td style={tableCell}>{service.unique_agents}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Section>

        <Section style={section}>
          <Heading style={h2}>Geographic Distribution</Heading>
          <Table style={table}>
            <Thead>
              <Tr>
                <Th style={tableHeader}>Location</Th>
                <Th style={tableHeader}>Clicks</Th>
                <Th style={tableHeader}>Agents</Th>
              </Tr>
            </Thead>
            <Tbody>
              {geographic_breakdown.map((location, index) => (
                <Tr key={index}>
                  <Td style={tableCell}>{location.location}</Td>
                  <Td style={tableCell}>{location.clicks}</Td>
                  <Td style={tableCell}>{location.agents}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Section>

        <Section style={section}>
          <Heading style={h2}>Agent Quality Profile</Heading>
          <Text style={text}>
            Sample of agents who clicked through to your services this month:
          </Text>
          <Table style={table}>
            <Thead>
              <Tr>
                <Th style={tableHeader}>Agent</Th>
                <Th style={tableHeader}>Experience</Th>
                <Th style={tableHeader}>Location</Th>
                <Th style={tableHeader}>Clicks</Th>
              </Tr>
            </Thead>
            <Tbody>
              {agent_profiles.slice(0, 10).map((agent, index) => (
                <Tr key={index}>
                  <Td style={tableCell}>{agent.agent_name}</Td>
                  <Td style={tableCell}>{agent.experience_level}</Td>
                  <Td style={tableCell}>{agent.location}</Td>
                  <Td style={tableCell}>{agent.clicks}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Section>

        <Section style={section}>
          <Text style={text}>
            This report demonstrates the quality leads we're delivering to your platform. 
            We track every click with agent attribution to ensure accurate commission calculations.
          </Text>
          <Text style={text}>
            For questions about this report or commission payments, please contact our partnerships team.
          </Text>
        </Section>

        <Text style={footer}>
          Circle Platform - Real Estate Professional Marketplace
        </Text>
      </Container>
    </Body>
  </Html>
)

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
}

const h2 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '30px 0 15px',
  padding: '0',
}

const subtitle = {
  color: '#666',
  fontSize: '18px',
  margin: '0 0 30px',
}

const greeting = {
  color: '#333',
  fontSize: '16px',
  margin: '20px 0 15px',
}

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
}

const section = {
  margin: '24px 0',
  padding: '0',
}

const table = {
  border: '1px solid #eee',
  borderRadius: '5px',
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const tableHeader = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #eee',
  padding: '12px',
  textAlign: 'left' as const,
  fontWeight: 'bold',
  fontSize: '14px',
}

const tableCell = {
  border: '1px solid #eee',
  padding: '12px',
  fontSize: '14px',
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '40px',
  textAlign: 'center' as const,
}

export default VendorMonthlyReport