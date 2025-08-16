import { AlertTriangle, Shield, CheckCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export interface ServiceCategory {
  id: string;
  name: string;
  riskLevel: 'high' | 'medium' | 'low';
  respaType: 'settlement' | 'adjacent' | 'non-respa';
  subcategories: string[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'settlement-services',
    name: 'Settlement Services',
    riskLevel: 'high',
    respaType: 'settlement',
    subcategories: [
      'Mortgage Lenders',
      'Title Companies', 
      'Home Inspectors',
      'Appraisers',
      'Real Estate Attorneys'
    ]
  },
  {
    id: 'home-services',
    name: 'Home Services',
    riskLevel: 'medium',
    respaType: 'adjacent',
    subcategories: [
      'Home Warranty',
      'Homeowner\'s Insurance',
      'Contractors/Renovation',
      'Security Systems'
    ]
  },
  {
    id: 'moving-relocation',
    name: 'Moving & Relocation',
    riskLevel: 'low',
    respaType: 'non-respa',
    subcategories: [
      'Moving Companies',
      'Storage Facilities',
      'Relocation Services'
    ]
  },
  {
    id: 'property-services',
    name: 'Property Services',
    riskLevel: 'low',
    respaType: 'non-respa',
    subcategories: [
      'Photography/Video',
      'Staging Companies',
      'Cleaning Services',
      'Landscaping'
    ]
  },
  {
    id: 'professional-services',
    name: 'Professional Services',
    riskLevel: 'low',
    respaType: 'non-respa',
    subcategories: [
      'Marketing Agencies',
      'Print Shops',
      'Sign Companies',
      'Web Developers'
    ]
  },
  {
    id: 'coaching-training',
    name: 'Coaching & Training',
    riskLevel: 'low',
    respaType: 'non-respa',
    subcategories: [
      'Business Coaching',
      'Sales Training',
      'Real Estate Education',
      'Professional Development',
      'Leadership Training'
    ]
  }
];

export const getRiskBadge = (riskLevel: 'high' | 'medium' | 'low') => {
  switch (riskLevel) {
    case 'low':
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3" />
          Non-RESPA
        </Badge>
      );
    case 'high':
    case 'medium':
    default:
      return null; // No badge for RESPA-covered services
  }
};

export const getComplianceAlert = (riskLevel: 'high' | 'medium' | 'low') => {
  switch (riskLevel) {
    case 'high':
      return (
        <Alert className="border-amber-200 bg-amber-50 p-2 relative z-10">{/* Ensure alert stays within container */}
          <AlertTriangle className="h-3 w-3 text-amber-600" />
          <AlertDescription className="text-amber-800 text-xs">
            <span className="font-medium">Strict compliance required.</span>
            <span className="ml-1 text-amber-600 cursor-help" title="Co-marketing limited to TRUE ADVERTISING only. No referral fees or expectations permitted. Violations can result in fines up to $10,000 per violation.">
              Hover for details
            </span>
          </AlertDescription>
        </Alert>
      );
    case 'medium':
      return (
        <Alert className="border-amber-200 bg-amber-50 p-2 relative z-10">{/* Ensure alert stays within container */}
          <Shield className="h-3 w-3 text-amber-600" />
          <AlertDescription className="text-amber-800 text-xs">
            <span className="font-medium">Exercise caution.</span>
            <span className="ml-1 text-amber-600 cursor-help" title="May be considered settlement-related. Ensure all co-marketing is compliant and for advertising value only.">
              Hover for details
            </span>
          </AlertDescription>
        </Alert>
      );
    case 'low':
      return null; // No alert needed for low-risk services
  }
};

// Main function that checks manual overrides first, then falls back to keyword analysis
export const determineVendorRisk = (vendor: { name: string; description?: string; is_respa_regulated?: boolean; respa_risk_level?: string }): 'high' | 'medium' | 'low' => {
  // Check manual overrides first
  if (vendor.is_respa_regulated !== null && vendor.is_respa_regulated !== undefined) {
    if (vendor.is_respa_regulated === false) {
      return 'low'; // Non-RESPA services are always low risk
    } else if (vendor.is_respa_regulated === true && vendor.respa_risk_level) {
      return vendor.respa_risk_level as 'high' | 'medium' | 'low';
    }
  }
  
  // Fall back to automatic keyword analysis
  return determineServiceRisk(vendor.name, vendor.description);
};

// Original keyword-based analysis (kept for backward compatibility)
export const determineServiceRisk = (category: string, subcategory?: string): 'high' | 'medium' | 'low' => {
  const categoryLower = category.toLowerCase();
  const subcategoryLower = subcategory?.toLowerCase() || '';
  
  // High-risk RESPA settlement services
  const settlementKeywords = [
    'mortgage', 'lender', 'loan', 'financing',
    'title', 'closing', 'escrow',
    'inspection', 'inspector', 'home inspection',
    'appraisal', 'appraiser', 'valuation',
    'attorney', 'legal', 'real estate law'
  ];
  
  // Medium-risk RESPA-adjacent services
  const adjacentKeywords = [
    'warranty', 'home warranty', 'protection plan',
    'insurance', 'homeowners insurance',
    'contractor', 'renovation', 'repair',
    'security', 'alarm', 'monitoring'
  ];
  
  // Check for high-risk keywords
  if (settlementKeywords.some(keyword => 
    categoryLower.includes(keyword) || subcategoryLower.includes(keyword)
  )) {
    return 'high';
  }
  
  // Check for medium-risk keywords
  if (adjacentKeywords.some(keyword => 
    categoryLower.includes(keyword) || subcategoryLower.includes(keyword)
  )) {
    return 'medium';
  }
  
  // Default to low risk
  return 'low';
};

export const getComplianceGuidelines = (riskLevel: 'high' | 'medium' | 'low') => {
  switch (riskLevel) {
    case 'high':
      return {
        title: "RESPA Settlement Service Compliance",
        guidelines: [
          "Co-marketing MUST be for TRUE ADVERTISING only",
          "Both parties must be equally featured in all materials",
          "No referral fees or expectations permitted",
          "Costs must be split proportionally to benefit received",
          "Document all arrangements for compliance purposes",
          "Consult legal counsel before proceeding"
        ],
        warnings: [
          "Violations can result in fines up to $10,000 per violation",
          "Both criminal and civil penalties may apply",
          "Loss of professional licenses possible"
        ]
      };
    case 'medium':
      return {
        title: "RESPA-Adjacent Service Guidelines", 
        guidelines: [
          "Exercise caution in all co-marketing arrangements",
          "Ensure arrangements are for advertising value only",
          "Avoid any appearance of quid pro quo",
          "Document legitimate business purpose",
          "Regular compliance review recommended"
        ],
        warnings: [
          "May be scrutinized under RESPA guidelines",
          "Better to err on the side of caution"
        ]
      };
    case 'low':
      return {
        title: "Non-RESPA Service Best Practices",
        guidelines: [
          "Standard co-marketing arrangements typically acceptable",
          "Ensure professional relationship boundaries",
          "Document business purposes for arrangements",
          "Maintain proportional cost sharing",
          "Follow general business ethics"
        ],
        warnings: [
          "Still avoid exclusive referral arrangements",
          "Maintain professional standards"
        ]
      };
  }
};