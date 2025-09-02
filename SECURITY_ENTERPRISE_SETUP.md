# Enterprise Security Setup Guide

## Quick Start

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

3. **Initialize Database**
```bash
# Database migrations already applied via Supabase
# Initialize feature flags
node -e "import('@/lib/security/feature-flags-db.js').then(m => m.featureFlagsManager.initializeFlags())"
```

4. **Deploy Terraform (Optional)**
```bash
cd terraform/cloudflare
terraform init
terraform plan
terraform apply
```

## Architecture Overview

**Request Flow:**
1. Cloudflare WAF → Rate Limiting → Bot Detection
2. App Middleware → CSP Headers → Risk Scoring  
3. Security Gates (CAPTCHA/PoW) → Action Token Validation
4. Application Logic → Audit Logging → Response

**Security Layers:**
- **Edge**: Cloudflare WAF, bot management, geo-blocking
- **Middleware**: CSP nonces, security headers, rate limiting
- **Application**: Risk scoring, anti-bot gates, session security
- **Database**: RLS policies, audit logging, encryption
- **CI/CD**: Dependency scanning, secret detection, pen testing

## Testing

Run security tests:
```bash
npm run build && npm run preview
node scripts/test-security.js
```

## Emergency Procedures

**Under Attack:**
1. Enable under attack mode: Set `UNDER_ATTACK=true`
2. Activate panic mode via admin panel
3. Monitor security dashboard

**Rollback:**
1. Reset all feature flags via admin panel
2. Clear rate limit caches
3. Restart application

## Key Features Implemented

✅ **Complete WAF/Edge Protection** (Cloudflare + AWS)
✅ **Advanced Middleware** (CSP, headers, rate limiting)  
✅ **Anti-Bot System** (Risk scoring, CAPTCHA, PoW)
✅ **Field Encryption** (PII protection with key rotation)
✅ **Immutable Audit Logs** (Tamper-proof logging)
✅ **Session Security** (Anti-fixation, secure cookies)
✅ **SSRF Protection** (URL validation, IP filtering)
✅ **File Security** (Upload scanning, malware detection)
✅ **Feature Flags** (Database-backed panic switches)
✅ **CI/CD Security** (Automated testing, secret scanning)

The system is production-ready with enterprise-grade hardening across all layers.