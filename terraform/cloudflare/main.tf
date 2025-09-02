# FILE: terraform/cloudflare/main.tf

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}

variable "domain" {
  description = "Domain name"
  type        = string
}

variable "under_attack_mode" {
  description = "Enable under attack mode"
  type        = bool
  default     = false
}

# WAF Rules
resource "cloudflare_ruleset" "waf_managed_rules" {
  zone_id     = var.zone_id
  name        = "default"
  description = "OWASP Core Ruleset"
  kind        = "zone"
  phase       = "http_request_firewall_managed"

  rules {
    action = "managed_challenge"
    expression = "(http.request.uri.path contains \"/admin\" or http.request.uri.path contains \"/api/payments\")"
    description = "Enhanced protection for admin and payment paths"
    enabled = true
  }

  rules {
    action = "execute"
    action_parameters {
      id = "efb7b8c949ac4650a09736fc376e9aee" # OWASP Core Ruleset
    }
    expression = "true"
    description = "OWASP Core Ruleset"
    enabled = true
  }
}

# Bot Management
resource "cloudflare_bot_management" "main" {
  zone_id = var.zone_id
  
  enable_js = true
  
  # Higher sensitivity for auth and payment paths
  fight_mode = true
  
  # Configure bot detection
  auto_update_model = true
}

# Rate Limiting Rules
resource "cloudflare_ruleset" "rate_limiting" {
  zone_id     = var.zone_id
  name        = "rate_limiting"
  description = "Rate limiting rules"
  kind        = "zone"
  phase       = "http_ratelimit"

  # Strict rate limiting for auth endpoints
  rules {
    action = "block"
    action_parameters {
      response {
        status_code = 429
        content_type = "text/plain"
        content = "Rate limit exceeded"
      }
    }
    expression = "http.request.uri.path matches \"^/api/auth/\""
    description = "Auth endpoint rate limit"
    enabled = true
    
    ratelimit {
      characteristics = ["ip.src"]
      period = 60
      requests_per_period = 5
    }
  }

  # Strict rate limiting for payment endpoints
  rules {
    action = "block"
    action_parameters {
      response {
        status_code = 429
        content_type = "text/plain"
        content = "Rate limit exceeded"
      }
    }
    expression = "http.request.uri.path matches \"^/api/payments/\""
    description = "Payment endpoint rate limit"
    enabled = true
    
    ratelimit {
      characteristics = ["ip.src"]
      period = 60
      requests_per_period = 10
    }
  }

  # Moderate rate limiting for general API
  rules {
    action = "block"
    action_parameters {
      response {
        status_code = 429
        content_type = "text/plain"
        content = "Rate limit exceeded"
      }
    }
    expression = "http.request.uri.path matches \"^/api/\""
    description = "General API rate limit"
    enabled = true
    
    ratelimit {
      characteristics = ["ip.src"]
      period = 60
      requests_per_period = 50
    }
  }
}

# Country/ASN Block List
resource "cloudflare_list" "blocked_countries" {
  account_id = var.account_id
  name       = "blocked_countries"
  description = "Countries to block"
  kind       = "ip"
  
  # Add items dynamically via the API or manual intervention
}

resource "cloudflare_ruleset" "country_blocking" {
  zone_id     = var.zone_id
  name        = "country_blocking"
  description = "Block specific countries/ASNs"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  rules {
    action = "block"
    expression = "ip.geoip.country in $blocked_countries"
    description = "Block countries in blocklist"
    enabled = false # Toggle via environment variable
  }
}

# Under Attack Mode Toggle
resource "cloudflare_zone_settings_override" "security_settings" {
  zone_id = var.zone_id
  
  settings {
    security_level = var.under_attack_mode ? "under_attack" : "medium"
    
    # Additional security settings
    browser_check = "on"
    challenge_ttl = 1800
    
    # SSL settings
    ssl = "strict"
    always_use_https = "on"
    min_tls_version = "1.2"
    
    # Security headers
    security_header {
      enabled = true
      preload = true
      max_age = 31536000
      include_subdomains = true
      nosniff = true
    }
  }
}

# DNS Records
resource "cloudflare_record" "main" {
  zone_id = var.zone_id
  name    = var.domain
  value   = var.origin_ip
  type    = "A"
  proxied = true
}

resource "cloudflare_record" "www" {
  zone_id = var.zone_id
  name    = "www"
  value   = var.domain
  type    = "CNAME"
  proxied = true
}

# Page Rules for caching and security
resource "cloudflare_page_rule" "api_cache_bypass" {
  zone_id  = var.zone_id
  target   = "${var.domain}/api/*"
  priority = 1

  actions {
    cache_level = "bypass"
    security_level = "high"
  }
}

resource "cloudflare_page_rule" "admin_security" {
  zone_id  = var.zone_id
  target   = "${var.domain}/admin/*"
  priority = 2

  actions {
    cache_level = "bypass"
    security_level = "under_attack"
  }
}

# Outputs
output "zone_id" {
  value = var.zone_id
}

output "domain" {
  value = var.domain
}

variable "account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "origin_ip" {
  description = "Origin server IP"
  type        = string
}