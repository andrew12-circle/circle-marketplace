import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download, Shield, AlertTriangle, CheckCircle, Eye } from 'lucide-react';

const RESPA_DOCUMENTS = {
  'attorney-review': {
    title: 'Attorney Review Package',
    description: 'Executive summary and complete documentation package for legal review',
    status: 'current',
    lastUpdated: '2025-01-04',
    content: `# RESPA Compliance Documentation Package
## Platform Review for Legal Attorney

### Executive Summary

This documentation package provides a comprehensive overview of the Circle Platform's RESPA compliance framework, designed for attorney review and sign-off. The platform implements automated compliance controls, risk assessment procedures, and audit trails to ensure adherence to Real Estate Settlement Procedures Act (RESPA) Section 8 requirements.

### Package Contents

1. **Technical Architecture Documentation**
2. **Policy and Procedure Manual**
3. **Sample Data and Reports**
4. **Legal Framework Integration**
5. **System Demonstration Materials**

---

## Document Overview

**Platform Name:** Circle Real Estate Services Platform  
**Review Date:** January 2025  
**Documentation Version:** 1.0  
**Compliance Framework:** RESPA Section 8 - Anti-Kickback Provisions  

### Key Compliance Features

- **Automated Risk Assessment**: Service categorization with risk scoring
- **Multi-Stage Approval Workflow**: Vendor → Compliance → Final approval
- **Document Collection & Verification**: Required evidence collection
- **Digital Agreement Management**: Co-marketing agreement templates and e-signatures
- **Complete Audit Trail**: Immutable compliance record keeping
- **Split Percentage Controls**: Automated fair market value validation

### Legal Contact Information

**For Questions or Clarifications:**  
- Technical Team: [Contact Information]
- Compliance Officer: [Contact Information]
- Legal Counsel: [Contact Information]

---

*This package contains confidential and proprietary information. Distribution is restricted to authorized legal counsel for compliance review purposes only.*`
  },
  'technical-architecture': {
    title: 'Technical Architecture',
    description: 'Comprehensive system design and security framework documentation',
    status: 'current',
    lastUpdated: '2025-01-04',
    content: `# Technical Architecture Documentation
## RESPA Compliance System Design

### System Overview

The Circle Platform implements a comprehensive RESPA compliance system with automated controls, risk assessment, and audit capabilities designed to prevent prohibited kickbacks and referral fees under RESPA Section 8.

### Database Architecture

#### Core Compliance Tables

**\`co_pay_requests\`** - Primary transaction records
- Unique identifier and participant tracking
- Split percentage and service details
- Multi-stage status progression
- Immutable audit timestamps

**\`compliance_workflow_log\`** - Complete audit trail
- Every action and status change recorded
- User identification and timestamps
- IP address and user agent tracking
- Document attachment references

**\`compliance_documents\`** - Evidence collection
- Required documentation by service type
- File integrity verification
- Approval status tracking
- Retention period management

**\`agreement_signatures\`** - Legal agreement management
- Dual-party e-signature capture
- Digital signature verification
- Agreement template versioning
- Legal enforceability metadata

### Security Framework

#### Data Integrity
- **Immutable Records**: Core compliance data cannot be deleted
- **Cryptographic Hashing**: Document integrity verification
- **Audit Timestamps**: All changes tracked with precise timing
- **Role-Based Access**: Segregation of duties enforcement

#### Access Controls
- **Multi-Factor Authentication**: Required for all compliance actions
- **Permission Matrix**: Granular access control by user role
- **Session Management**: Secure session handling with timeouts
- **IP Tracking**: Geographic and network-based monitoring

### Workflow Engine

#### Automated State Transitions
\`\`\`
Pending Vendor → Vendor Approved → Pending Compliance → 
Compliance Approved → Final Approved
\`\`\`

#### Validation Rules
- **Service Risk Assessment**: Automated categorization
- **Split Percentage Limits**: Fair market value enforcement
- **Documentation Requirements**: Service-specific evidence collection
- **Approval Authority**: Role-based approval routing

### Integration Points

#### External Systems
- **Payment Processing**: Stripe integration for transaction handling
- **Document Storage**: Secure cloud storage with encryption
- **Notification Services**: Multi-channel alert system
- **Backup Systems**: Automated data preservation

#### API Security
- **JWT Authentication**: Secure API access
- **Rate Limiting**: Abuse prevention
- **CORS Protection**: Cross-origin request security
- **Input Validation**: SQL injection and XSS prevention

### Performance & Scalability

#### Database Optimization
- **Indexed Queries**: Fast compliance data retrieval
- **Partitioned Tables**: Efficient large dataset handling
- **Connection Pooling**: Resource optimization
- **Query Caching**: Performance enhancement

#### Monitoring & Alerts
- **Real-time Monitoring**: System health tracking
- **Compliance Metrics**: Key performance indicators
- **Error Alerting**: Immediate notification of issues
- **Capacity Planning**: Proactive scaling

### Disaster Recovery

#### Backup Strategy
- **Daily Automated Backups**: Complete system state preservation
- **Geographic Redundancy**: Multi-region data replication
- **Point-in-time Recovery**: Granular restoration capabilities
- **Integrity Verification**: Backup validation procedures

#### Business Continuity
- **Failover Procedures**: Automated system switching
- **Data Recovery Testing**: Regular validation exercises
- **Communication Plans**: Stakeholder notification protocols
- **Compliance Continuity**: Uninterrupted regulatory adherence`
  },
  'policies-procedures': {
    title: 'Policy and Procedure Manual',
    description: 'Detailed compliance framework, risk assessment, and operational procedures',
    status: 'current',
    lastUpdated: '2025-01-04',
    content: `# Policy and Procedure Manual
## RESPA Compliance Framework

### 1. RESPA Compliance Policy

#### Objective
To ensure all co-marketing arrangements and referral relationships comply with RESPA Section 8 anti-kickback provisions while facilitating legitimate business relationships in real estate transactions.

#### Scope
This policy applies to all:
- Real estate agents and brokers
- Service providers (vendors)
- Marketing arrangements
- Referral relationships
- Co-marketing activities

### 2. Risk Assessment Methodology

#### Service Category Classification

**HIGH RISK SERVICES** (Requires Enhanced Review)
- Mortgage lending and financing
- Title insurance and settlement services
- Home inspection services
- Real estate appraisal services
- Property insurance services

**MEDIUM RISK SERVICES** (Standard Review)
- Home warranty services
- Moving and relocation services
- Home improvement contractors
- Property management services
- Real estate photography

**LOW RISK SERVICES** (Expedited Review)
- General marketing services
- Technology tools and software
- Office supplies and equipment
- Professional development
- Non-real estate business services

#### Risk Assessment Criteria

**Automated Scoring Factors:**
- Service category classification
- Split percentage requested
- Transaction volume history
- Geographic market conditions
- Service provider qualifications

**Manual Review Triggers:**
- Split percentage > 50%
- New service provider relationships
- High-volume transaction patterns
- Unusual geographic arrangements
- Complex service structures

### 3. Documentation Requirements

#### Standard Documentation (All Transactions)
- Co-marketing agreement execution
- Service scope documentation
- Fair market value justification
- Marketing activity evidence
- Performance metrics tracking

#### Enhanced Documentation (High Risk)
- Independent market analysis
- Service provider qualifications
- Detailed marketing plan
- Consumer benefit documentation
- Competitive analysis report

#### Prohibited Documentation
- Referral volume agreements
- Fee-for-referral arrangements
- Exclusive dealing requirements
- Market allocation agreements
- Price-fixing arrangements

### 4. Review and Approval Procedures

#### Vendor Review Stage
**Timeline:** 5 business days maximum
**Responsibilities:**
- Service scope verification
- Pricing reasonableness assessment
- Capability confirmation
- Market positioning validation

#### Compliance Review Stage
**Timeline:** 7 business days maximum
**Responsibilities:**
- RESPA compliance verification
- Documentation completeness check
- Risk assessment validation
- Legal requirement confirmation

#### Final Approval Stage
**Timeline:** 3 business days maximum
**Responsibilities:**
- Executive sign-off
- Implementation authorization
- Monitoring setup
- Stakeholder notification

### 5. Monitoring and Surveillance

#### Ongoing Monitoring Requirements
- Monthly transaction volume analysis
- Quarterly performance reviews
- Annual compliance audits
- Continuous risk assessment updates

#### Key Performance Indicators
- Average approval timeline
- Documentation compliance rate
- Risk assessment accuracy
- Audit finding resolution

#### Red Flag Indicators
- Excessive split percentages
- Unusual transaction patterns
- Documentation discrepancies
- Consumer complaints
- Regulatory inquiries`
  },
  'sample-data': {
    title: 'Sample Data and Reports',
    description: 'Compliance examples, audit trails, and performance metrics',
    status: 'current',
    lastUpdated: '2025-01-04',
    content: `# Sample Data and Reports
## Compliance Examples and Audit Materials

### 1. Compliant Transaction Examples

#### Example 1: Marketing Services Co-Pay (APPROVED)

**Transaction Details:**
- Agent: Sarah Johnson, ABC Realty
- Vendor: Premier Marketing Solutions
- Service: Digital marketing campaign
- Split Percentage: 30%
- Total Service Cost: $2,500
- Agent Contribution: $750

**Compliance Factors:**
- ✅ Service provides genuine marketing value
- ✅ Split percentage within market range (25-40%)
- ✅ Independent service delivery
- ✅ Consumer receives direct benefit
- ✅ No referral volume requirements

**Documentation Provided:**
- Detailed marketing plan and timeline
- Portfolio of previous work samples
- Market rate comparison analysis
- Performance measurement criteria
- Consumer benefit documentation

### 2. Non-Compliant Transaction Examples

#### Example 1: Excessive Split Percentage (REJECTED)

**Transaction Details:**
- Agent: Robert Davis, Metro Realty
- Vendor: Luxury Home Inspections
- Service: Home inspection services
- Split Percentage: 75%
- Total Service Cost: $600
- Requested Agent Contribution: $450

**Rejection Reasons:**
- ❌ Split percentage exceeds fair market value
- ❌ High-risk service category (settlement services)
- ❌ Potential RESPA Section 8 violation
- ❌ Insufficient business justification
- ❌ Consumer may bear increased costs

### 3. Performance Metrics Dashboard

#### Key Compliance Metrics (YTD 2024)

**Volume Metrics:**
- Total Requests: 10,247
- Approved Requests: 7,581 (74.0%)
- Rejected Requests: 2,666 (26.0%)
- Average Processing Time: 6.2 days

**Quality Metrics:**
- Documentation Compliance: 97.3%
- Audit Finding Rate: 0.8%
- Training Completion: 100%
- Customer Satisfaction: 4.6/5.0

**Risk Metrics:**
- High-Risk Approval Rate: 31%
- Medium-Risk Approval Rate: 76%
- Low-Risk Approval Rate: 92%
- Appeals Filed: 42 (0.4%)
- Appeals Upheld: 8 (19%)`
  },
  'legal-framework': {
    title: 'Legal Framework Integration',
    description: 'RESPA Section 8 compliance analysis and legal requirements',
    status: 'current',
    lastUpdated: '2025-01-04',
    content: `# Legal Framework Integration
## RESPA Section 8 Compliance Analysis

### 1. RESPA Section 8 Overview

#### Anti-Kickback Provisions
Real Estate Settlement Procedures Act (RESPA) Section 8 prohibits:
- Kickbacks for referrals of settlement service business
- Unearned fees in connection with real estate transactions
- Fee splitting arrangements that provide no legitimate service

#### Key Legal Requirements
- **Legitimate Services**: All fees must be for services actually performed
- **Fair Market Value**: Compensation must not exceed reasonable market rates
- **Consumer Benefit**: Arrangements must benefit consumers, not harm them
- **Disclosure**: Material relationships must be disclosed to consumers

### 2. Platform Compliance Strategy

#### Automated Compliance Controls
1. **Service Validation**: Ensures all arrangements involve legitimate marketing services
2. **Fair Value Assessment**: Validates split percentages against market rates
3. **Documentation Requirements**: Mandates evidence of actual services performed
4. **Consumer Protection**: Prohibits arrangements that increase consumer costs

#### Legal Safeguards
1. **Co-Marketing Focus**: Platform specifically limited to marketing arrangements
2. **Market Rate Enforcement**: Automated checks prevent excessive splits
3. **Service Evidence**: Required documentation of actual services rendered
4. **Transparency Requirements**: Full disclosure of all arrangement terms

### 3. Risk Mitigation Framework

#### High-Risk Service Controls
- Enhanced review for settlement services
- Independent market value analysis
- Additional documentation requirements
- Elevated approval authority

#### Compliance Monitoring
- Real-time transaction analysis
- Pattern recognition for suspicious activity
- Automated alert generation
- Regular audit procedures

### 4. Legal Documentation

#### Agreement Template Features
- RESPA compliance language
- Service scope definitions
- Fair market value attestations
- Consumer benefit statements
- Termination clauses

#### Audit Trail Requirements
- Complete transaction history
- Decision point documentation
- Approval authority records
- Compliance review notes

### 5. Regulatory Reporting

#### Compliance Metrics
- Transaction volume by risk category
- Approval/rejection rates and reasons
- Documentation compliance rates
- Training completion statistics

#### Risk Indicators
- Split percentage distributions
- Service category analysis
- Geographic pattern review
- Vendor relationship mapping`
  },
  'system-demo': {
    title: 'System Demonstration Materials',
    description: 'Walkthrough documentation and compliance workflow examples',
    status: 'current',
    lastUpdated: '2025-01-04',
    content: `# System Demonstration Materials
## Compliance Workflow Walkthrough

### 1. User Interface Overview

#### Agent Dashboard
- Co-pay request submission interface
- Service provider selection tools
- Documentation upload system
- Request status tracking
- Approval notifications

#### Vendor Portal
- Request review and approval interface
- Service capability confirmation
- Pricing validation tools
- Documentation submission
- Agreement execution

#### Compliance Dashboard
- Risk assessment interface
- Documentation review tools
- Approval workflow management
- Audit trail monitoring
- Performance metrics

### 2. Workflow Demonstration

#### Step 1: Request Initiation
**Agent Actions:**
1. Navigate to marketplace and select service
2. Choose co-pay option and specify split percentage
3. Add notes explaining marketing arrangement
4. Submit request for vendor review

**System Actions:**
- Validates service eligibility
- Calculates risk assessment score
- Routes to appropriate approval queue
- Generates audit log entry

#### Step 2: Vendor Review
**Vendor Actions:**
1. Review service scope and split terms
2. Confirm capability to deliver services
3. Upload required documentation
4. Accept or decline arrangement

**System Actions:**
- Updates request status
- Notifies relevant parties
- Triggers documentation requirements
- Advances workflow stage

#### Step 3: Compliance Review
**Compliance Officer Actions:**
1. Review risk assessment results
2. Validate documentation completeness
3. Verify RESPA compliance
4. Approve or request additional information

**System Actions:**
- Records compliance decision
- Generates approval documentation
- Updates audit trail
- Notifies stakeholders

#### Step 4: Agreement Execution
**Final Actions:**
1. Digital signature collection
2. Agreement generation and storage
3. Implementation authorization
4. Monitoring setup activation

### 3. Compliance Controls Demonstration

#### Risk Assessment Engine
- Automated service categorization
- Split percentage validation
- Market rate comparison
- Documentation requirement generation

#### Approval Workflow
- Multi-stage review process
- Role-based access controls
- Timeline enforcement
- Escalation procedures

#### Audit Trail System
- Immutable record creation
- Complete action tracking
- User identification logging
- Document integrity verification

### 4. Reporting and Analytics

#### Compliance Dashboards
- Real-time transaction monitoring
- Risk metric visualization
- Performance trend analysis
- Alert management interface

#### Audit Reports
- Transaction detail reports
- Compliance status summaries
- Risk assessment analytics
- Documentation completion tracking

### 5. Security Features

#### Data Protection
- Encryption at rest and in transit
- Role-based access controls
- Session management
- Audit logging

#### Fraud Prevention
- Pattern recognition algorithms
- Suspicious activity alerts
- Rate limiting controls
- IP monitoring

#### Business Continuity
- Automated backup systems
- Disaster recovery procedures
- High availability architecture
- Performance monitoring`
  }
};

export default function RESPADocumentationViewer() {
  const [selectedDoc, setSelectedDoc] = useState('attorney-review');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'current':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Current</Badge>;
      case 'draft':
        return <Badge variant="secondary" className="flex items-center gap-1"><Eye className="h-3 w-3" />Draft</Badge>;
      case 'outdated':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Outdated</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const downloadDocument = (docKey: string) => {
    const doc = RESPA_DOCUMENTS[docKey as keyof typeof RESPA_DOCUMENTS];
    const blob = new Blob([doc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          RESPA Compliance Documentation
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comprehensive legal documentation package for attorney review and compliance verification
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document List */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Documents</h3>
            {Object.entries(RESPA_DOCUMENTS).map(([key, doc]) => (
              <Button
                key={key}
                variant={selectedDoc === key ? "default" : "ghost"}
                className="w-full justify-start h-auto p-3"
                onClick={() => setSelectedDoc(key)}
              >
                <div className="flex flex-col items-start space-y-1 w-full">
                  <div className="flex items-center gap-2 w-full">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium text-sm">{doc.title}</span>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    {getStatusBadge(doc.status)}
                    <span className="text-xs text-muted-foreground">
                      {doc.lastUpdated}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    {doc.description}
                  </p>
                </div>
              </Button>
            ))}
          </div>

          {/* Document Viewer */}
          <div className="lg:col-span-2">
            {selectedDoc && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {RESPA_DOCUMENTS[selectedDoc as keyof typeof RESPA_DOCUMENTS].title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Last updated: {RESPA_DOCUMENTS[selectedDoc as keyof typeof RESPA_DOCUMENTS].lastUpdated}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadDocument(selectedDoc)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>

                <ScrollArea className="h-[600px] border rounded-lg p-4">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm">
                      {RESPA_DOCUMENTS[selectedDoc as keyof typeof RESPA_DOCUMENTS].content}
                    </pre>
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}