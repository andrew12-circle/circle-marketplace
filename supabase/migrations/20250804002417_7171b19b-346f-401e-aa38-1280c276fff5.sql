-- Insert new RESPA-compliant co-marketing agreement template
INSERT INTO public.comarketing_agreement_templates (
  template_name,
  version,
  is_active,
  template_content,
  created_by
) VALUES (
  'Enhanced RESPA Compliance Agreement',
  '2.0',
  true,
  '# ✅ **CIRCLE CO-MARKETING AGREEMENT**
## **Enhanced Compliance Version**

This Co-Marketing Agreement ("Agreement") is entered into on **{{agreement_date}}** between:

**REAL ESTATE AGENT:**
- Name: **{{agent_name}}**
- Email: **{{agent_email}}**
- Brokerage: **{{agent_brokerage}}**
- License #: **{{agent_license}}**

**VENDOR/SERVICE PROVIDER:**
- Company: **{{vendor_name}}**
- Contact: **{{vendor_contact}}**
- Email: **{{vendor_email}}**
- Type of Business: **{{vendor_business_type}}**

**MARKETING SERVICE DETAILS:**
- Service Description: **{{service_title}}**
- Total Campaign Cost: **${{total_cost}}**
- Vendor Contribution: **${{vendor_contribution}}** ({{vendor_percentage}}%)
- Agent Contribution: **${{agent_contribution}}** ({{agent_percentage}}%)
- Campaign Start Date: **{{campaign_start_date}}**
- Campaign End Date: **{{campaign_end_date}}**

---

## **1. PURPOSE & SCOPE**

This Agreement documents a legitimate co-marketing arrangement where both parties contribute toward the actual cost of pre-approved marketing services coordinated by Circle Consulting LLC. The marketing services are intended solely to promote the agent''s brand and enhance their client-facing presence through legitimate advertising and marketing activities.

## **2. RESPA COMPLIANCE & LEGAL FRAMEWORK**

Both parties acknowledge and agree that:

a) This Agreement is structured to comply with:
   - RESPA Section 8 (12 U.S.C. § 2607)
   - HUD/DOJ Joint Statement on Marketing Services Agreements (1996-2)
   - All applicable federal, state, and local laws and regulations

b) **This Agreement explicitly DOES NOT:**
   - Compensate any party for referrals of settlement service business
   - Condition marketing services on the referral of business
   - Create any obligation to refer business between the parties
   - Include payment for leads, client lists, or consumer information
   - Create an exclusive relationship or preferred vendor arrangement

c) **Fair Market Value Certification:**
   - All services are provided at fair market value
   - Pricing is based on: ☐ Competitive bids ☐ Industry rate cards ☐ Historical pricing data
   - Documentation of fair market value is attached as **Exhibit A**

## **3. COST-SHARING STRUCTURE & PROPORTIONALITY**

a) **Payment Structure:**
   - Each party pays their own portion directly to Circle Consulting LLC
   - Contributions are proportional to marketing exposure/benefit received
   - No party subsidizes another party''s marketing costs

b) **Proportionality Analysis:**
   - Agent receives {{agent_percentage}}% of advertising space/time/exposure
   - Vendor receives {{vendor_percentage}}% of advertising space/time/exposure
   - Cost allocation matches benefit distribution

c) **Voluntary Participation:**
   - Vendor participation is entirely voluntary
   - No consumer transaction is contingent upon this arrangement
   - Either party may decline participation without business consequences

## **4. PERMITTED MARKETING SERVICES**

The co-marketing campaign may include only the following legitimate advertising services:

☐ **Print Advertising:** Newspapers, magazines, direct mail pieces
☐ **Digital Advertising:** Social media ads, display ads, email campaigns
☐ **Event Marketing:** Trade shows, open houses, community events
☐ **Branded Materials:** Business cards, brochures, promotional items
☐ **Media Production:** Photography, videography, graphic design

**Explicitly Excluded:** Lead generation services, consumer data, client lists, preferential placement in agent marketing, or any service that could be construed as payment for referrals.

## **5. MARKETING MATERIAL REQUIREMENTS**

All co-branded marketing materials must:

a) **Include Clear Disclosure:**
   - "This is a paid advertisement by [Agent Name] and [Vendor Name]"
   - Font size no smaller than 10pt or clearly visible/audible

b) **Avoid Steering Language:**
   - No "preferred," "recommended," or "exclusive" vendor references
   - No implications that consumers must use specific vendors

c) **Approval Process:**
   - All materials require written approval from both parties before publication
   - Circle Consulting LLC maintains final approval authority for compliance

## **6. PAYMENT TERMS & DOCUMENTATION**

a) **Payment Timeline:**
   - Full payment required before campaign launch
   - Payments made directly to Circle Consulting LLC, not between parties
   - No payments tied to closings, referrals, or transaction volume

b) **Required Documentation:**
   - Itemized invoices showing actual services rendered
   - Proof of campaign execution (copies, screenshots, etc.)
   - Fair market value substantiation

c) **Audit Trail:**
   - Circle Consulting LLC maintains complete transaction records
   - Monthly reconciliation reports provided to both parties

## **7. COMPLIANCE MONITORING & AUDIT RIGHTS**

a) **Record Retention:**
   - All parties maintain records for minimum 7 years
   - Records include: agreements, invoices, campaign materials, correspondence

b) **Audit Rights:**
   - Circle Consulting LLC may audit for compliance annually
   - Regulatory authorities have full access to records upon request
   - Internal compliance reviews conducted quarterly

c) **Compliance Certification:**
   - Annual certification of continued RESPA compliance required
   - Material changes require new agreement and compliance review

## **8. REPRESENTATIONS & WARRANTIES**

Each party represents and warrants that:

a) They have authority to enter this Agreement
b) Participation is not conditioned on referrals or expected business
c) They will not use this arrangement to steer consumers
d) They understand RESPA requirements and agree to comply
e) All information provided is accurate and complete

## **9. INDEMNIFICATION**

Each party agrees to indemnify and hold harmless the other party and Circle Consulting LLC from any claims, damages, or regulatory actions arising from that party''s breach of this Agreement or violation of applicable laws.

## **10. TERMINATION**

a) **Termination Rights:**
   - Either party may terminate with 30 days written notice
   - Immediate termination for compliance violations
   - No termination after campaign funds are committed

b) **Post-Termination:**
   - Record retention obligations survive termination
   - No refunds for completed marketing services
   - Compliance obligations continue for historical campaigns

## **11. MISCELLANEOUS PROVISIONS**

a) **Entire Agreement:** This Agreement constitutes the complete understanding between parties
b) **Modifications:** Must be in writing and signed by all parties
c) **Governing Law:** {{state}} law governs this Agreement
d) **Severability:** Invalid provisions do not affect remaining terms
e) **No Assignment:** Rights cannot be assigned without written consent

## **12. COMPLIANCE ACKNOWLEDGMENT**

**By signing below, each party acknowledges that:**

1. They have read and understood this Agreement
2. They have consulted with legal counsel if desired
3. This is a legitimate marketing arrangement, not a disguised referral fee
4. They will comply with all applicable laws and regulations
5. False statements may result in civil and criminal penalties

---

**REAL ESTATE AGENT:**

Signature: _________________________________ Date: _______________

Print Name: {{agent_name}}

**VENDOR/SERVICE PROVIDER:**

Signature: _________________________________ Date: _______________

Print Name: {{vendor_contact}}

**CIRCLE CONSULTING LLC:**

Signature: _________________________________ Date: _______________

Print Name: ________________________________

Title: Compliance Officer

---

## **EXHIBIT A: FAIR MARKET VALUE DOCUMENTATION**
*(Attach supporting documentation)*

## **EXHIBIT B: MARKETING CAMPAIGN DETAILS**
*(Attach campaign specifications, distribution plan, and mockups)*

## **EXHIBIT C: PROPORTIONALITY ANALYSIS**
*(Attach breakdown of exposure/benefit allocation)*',
  NULL
);

-- Deactivate old templates
UPDATE public.comarketing_agreement_templates 
SET is_active = false 
WHERE template_name != 'Enhanced RESPA Compliance Agreement';