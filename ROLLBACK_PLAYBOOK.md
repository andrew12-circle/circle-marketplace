# 🚨 Enterprise Security Rollback & Panic Playbook

## 🔥 Emergency Response Procedures

### **IMMEDIATE ACTIONS (Under Attack)**

#### 1. **Activate Under Attack Mode** (30 seconds)
```bash
# Via Admin Panel (Recommended)
- Navigate to /admin/security
- Toggle "Under Attack Mode" ON
- Confirm activation

# Via Environment Variable (Fallback)
export UNDER_ATTACK=true
# Restart application
```

#### 2. **Enable Maximum Protection** (1 minute)
```bash
# Via Admin Panel
- Enable "Always Require CAPTCHA"
- Enable "Enforce Proof of Work" 
- Enable "Close Signups"

# Via Database (Emergency)
UPDATE feature_flags SET enabled = true 
WHERE flag_name IN ('CAPTCHA_ALWAYS_ON', 'POW_ENFORCE_HIGH_RISK', 'CLOSE_SIGNUPS');
```

#### 3. **Activate Panic Mode** (2 minutes)
```bash
# Complete lockdown
- Click "Activate Panic Mode" in admin panel
- Or manually enable ALL security flags
- Monitor security dashboard for effectiveness
```

---

## 🛑 System Shutdown Procedures

### **Maintenance Mode** (Graceful)
```bash
# Via Admin Panel
- Enable "Maintenance Mode"
- Enable "Read Only Mode"
- Display maintenance page to users

# Via Database
UPDATE feature_flags SET enabled = true 
WHERE flag_name IN ('MAINTENANCE_MODE', 'READ_ONLY_MODE');
```

### **Emergency Shutdown** (Immediate)
```bash
# Complete system lockdown
1. Enable maintenance mode
2. Close all signups
3. Enable read-only mode
4. Block all non-admin access

# Via Admin Panel: Click "Emergency Shutdown"
```

---

## 🔄 Rollback Procedures

### **Security Feature Rollback**

#### **Level 1: Individual Feature Rollback**
```bash
# Disable specific security measures
# Via Admin Panel:
- Navigate to Security Controls
- Toggle OFF problematic feature
- Monitor system stability

# Via Database:
UPDATE feature_flags SET enabled = false 
WHERE flag_name = 'PROBLEMATIC_FEATURE';
```

#### **Level 2: Partial Security Rollback**
```bash
# Reset to baseline security
UPDATE feature_flags SET enabled = false 
WHERE flag_name IN (
  'UNDER_ATTACK',
  'CAPTCHA_ALWAYS_ON',
  'POW_ENFORCE_HIGH_RISK'
);

# Keep essential protections
UPDATE feature_flags SET enabled = true 
WHERE flag_name IN (
  'CLOSE_SIGNUPS',    -- If needed
  'READ_ONLY_MODE'    -- If needed
);
```

#### **Level 3: Full Security Reset**
```bash
# Reset ALL security flags to default
UPDATE feature_flags SET enabled = false;

# Or via Admin Panel:
- Click "Clear All Blocks"
- Confirm reset
- Monitor for 5 minutes
```

### **Rate Limiting Rollback**

#### **Clear Rate Limit Caches**
```bash
# Redis-based (Production)
redis-cli FLUSHDB

# In-memory (Development)  
# Restart application to clear memory cache

# Via Application:
import { rateLimiter } from '@/lib/security/rate-limiter';
rateLimiter.clearAll();
```

#### **Adjust Rate Limits**
```bash
# Temporary rate limit increase
export RATE_LIMIT_MULTIPLIER=10

# Or modify in admin panel:
- Increase rate limits by 10x
- Monitor for false positives
```

### **Database Rollback**

#### **RLS Policy Rollback**
```sql
-- Disable RLS temporarily (EMERGENCY ONLY)
ALTER TABLE sensitive_table DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing
ALTER TABLE sensitive_table ENABLE ROW LEVEL SECURITY;
```

#### **Feature Flag Table Reset**
```sql
-- Reset all flags to safe defaults
UPDATE feature_flags SET 
  enabled = CASE 
    WHEN flag_name = 'POW_ENFORCE_HIGH_RISK' THEN true
    ELSE false 
  END;
```

---

## 🔧 Circuit Breaker Recovery

### **Reset Circuit Breakers**
```typescript
// Via Admin Panel
import { circuitBreakers } from '@/lib/security/circuit-breaker';

// Reset all breakers
circuitBreakers.resetAll();

// Reset specific breaker
circuitBreakers.reset('stripe');
circuitBreakers.reset('email');
```

### **Service Recovery**
```bash
# Check breaker status
GET /admin/api/circuit-breakers/status

# Force reset if needed
POST /admin/api/circuit-breakers/reset
{
  "breakerName": "all"
}
```

---

## 🛠️ Infrastructure Rollback

### **Cloudflare Rollback**
```bash
# Via Terraform
cd terraform/cloudflare
terraform plan -var="under_attack_mode=false"
terraform apply

# Or via Cloudflare Dashboard:
- Security > Settings
- Disable "Under Attack Mode"
- Reset security level to "Medium"
```

### **AWS WAF Rollback**
```bash
# Disable specific rules
aws wafv2 update-web-acl \
  --scope CLOUDFRONT \
  --id WAF-ACL-ID \
  --default-action Allow={}

# Via Terraform
cd terraform/aws  
terraform plan -var="enable_strict_waf=false"
terraform apply
```

---

## 📊 Recovery Verification

### **System Health Checks** (Post-Rollback)
```bash
# Run security tests
node scripts/test-security.js

# Check RLS policies
node scripts/test-rls.js

# Verify functionality
curl -I https://your-domain.com
# Should return 200 OK with security headers
```

### **Monitoring Checklist**
- [ ] Application responds normally
- [ ] User authentication works
- [ ] Payment processing functional
- [ ] No excessive error rates
- [ ] Security headers present
- [ ] Rate limiting active (but not blocking legitimate users)

### **User Communication**
```bash
# If issues affected users:
1. Status page update
2. Email notification to affected users
3. Security incident report (if applicable)
4. Post-mortem documentation
```

---

## 🔍 Post-Incident Analysis

### **Data Collection**
```bash
# Export security logs
SELECT * FROM audit_log 
WHERE created_at >= 'INCIDENT_START_TIME'
ORDER BY created_at DESC;

# Export attack logs  
SELECT * FROM attack_logs
WHERE created_at >= 'INCIDENT_START_TIME'
ORDER BY created_at DESC;

# Feature flag change history
SELECT * FROM audit_log 
WHERE action LIKE '%feature_flag%'
AND created_at >= 'INCIDENT_START_TIME';
```

### **Performance Impact Assessment**
```bash
# Check metrics
- Response time impact
- Error rate changes  
- Legitimate user blocking
- Security effectiveness

# Via observability dashboard
- Review security metrics
- Analyze false positive rates
- Document lessons learned
```

---

## 📞 Emergency Contacts & Escalation

### **Internal Escalation**
1. **L1**: Development Team Lead
2. **L2**: Security Team / CISO  
3. **L3**: CTO / Executive Team

### **External Contacts**
- **Cloudflare Support**: Enterprise support line
- **AWS Support**: Business/Enterprise support
- **Supabase Support**: Priority support channel

### **Communication Channels**
- **Slack**: #security-incidents
- **Email**: security-team@company.com
- **Phone**: Emergency escalation number

---

## ⚡ Quick Reference Commands

### **Most Common Rollback Actions**
```bash
# 1. Disable under attack mode
UPDATE feature_flags SET enabled = false WHERE flag_name = 'UNDER_ATTACK';

# 2. Clear rate limits  
redis-cli FLUSHDB

# 3. Reset circuit breakers
POST /admin/api/circuit-breakers/reset

# 4. Enable maintenance mode
UPDATE feature_flags SET enabled = true WHERE flag_name = 'MAINTENANCE_MODE';

# 5. Full security reset
UPDATE feature_flags SET enabled = false;
```

### **Validation Commands**
```bash
# Test basic functionality
curl -I https://your-domain.com

# Test authentication
curl -X POST https://your-domain.com/api/auth/login

# Test security headers
curl -I https://your-domain.com | grep -E "(Content-Security-Policy|X-Frame-Options)"

# Test rate limiting (should not block)
for i in {1..10}; do curl https://your-domain.com; done
```

---

## 📋 Recovery Checklist

### **Immediate (0-5 minutes)**
- [ ] Identify affected systems
- [ ] Disable problematic security feature
- [ ] Verify system responsiveness
- [ ] Check error rates

### **Short Term (5-30 minutes)**  
- [ ] Clear rate limit caches
- [ ] Reset circuit breakers
- [ ] Run health checks
- [ ] Monitor user reports

### **Medium Term (30 minutes - 2 hours)**
- [ ] Root cause analysis
- [ ] Security posture review
- [ ] Update monitoring alerts
- [ ] Document incident

### **Long Term (2+ hours)**
- [ ] Post-mortem meeting
- [ ] Security improvements
- [ ] Process refinements
- [ ] Team training updates

**Remember**: Security is a balance. The goal is maximum protection with minimum user friction. When in doubt, err on the side of availability while maintaining core security protections.