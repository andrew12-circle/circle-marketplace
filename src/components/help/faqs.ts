export interface FAQItem {
  question: string;
  answer: string;
  tags?: string[];
  links?: Array<{
    text: string;
    url: string;
  }>;
}

export interface FAQSection {
  title: string;
  items: FAQItem[];
}

export interface FAQData {
  routes: Record<string, FAQSection[]>;
}

export const faqs: FAQData = {
  routes: {
    '/': [
      {
        title: 'Getting Started',
        items: [
          {
            question: 'How do I get started with the platform?',
            answer: 'Welcome! Start by completing your profile setup, then explore the Academy for training content and the Marketplace for services. Use the AI Dashboard for personalized recommendations.',
            tags: ['getting started', 'onboarding', 'setup'],
            links: [
              { text: 'Complete Your Profile', url: '/profile-settings' },
              { text: 'Explore Academy', url: '/academy' }
            ]
          },
          {
            question: 'What are the main features?',
            answer: 'The platform includes:\n• Academy: Training content and courses\n• Marketplace: Professional services\n• AI Dashboard: Personalized insights\n• Command Center: Analytics and data\n• Vendor Dashboard: For service providers',
            tags: ['features', 'overview', 'navigation']
          }
        ]
      }
    ],
    '/academy': [
      {
        title: 'Academy Help',
        items: [
          {
            question: 'How do I access courses?',
            answer: 'Browse available courses in the Academy section. Click on any course to view details and enroll. Some courses may require a subscription.',
            tags: ['courses', 'enrollment', 'access']
          },
          {
            question: 'Can I track my progress?',
            answer: 'Yes! Your progress is automatically saved as you complete lessons. You can see your completion status in each course.',
            tags: ['progress', 'tracking', 'completion']
          },
          {
            question: 'How do I download content?',
            answer: 'Look for the download button on videos, PDFs, and other downloadable content. Some content may be streaming-only.',
            tags: ['download', 'offline', 'content']
          }
        ]
      }
    ],
    '/marketplace': [
      {
        title: 'Marketplace Help',
        items: [
          {
            question: 'How do I find the right service?',
            answer: 'Use the search and filter options to narrow down services by category, price, location, and ratings. Read reviews and compare providers.',
            tags: ['search', 'filters', 'selection']
          },
          {
            question: 'How does payment work?',
            answer: 'Payments are processed securely through our platform. You can pay by credit card or other accepted methods. Some services offer co-pay options.',
            tags: ['payment', 'billing', 'copay']
          },
          {
            question: 'What if I need to cancel?',
            answer: 'Cancellation policies vary by service provider. Check the service details before booking. Contact support if you need help with cancellations.',
            tags: ['cancellation', 'refund', 'policy']
          }
        ]
      }
    ],
    '/vendor-dashboard': [
      {
        title: 'Vendor Dashboard',
        items: [
          {
            question: 'How do I create a service listing?',
            answer: 'Go to your Vendor Dashboard and click "Add Service". Fill in all required information including pricing, description, and images.',
            tags: ['vendor', 'services', 'listing']
          },
          {
            question: 'How do I manage bookings?',
            answer: 'All bookings appear in your dashboard. You can accept, decline, or reschedule appointments. Communicate with clients through the platform.',
            tags: ['bookings', 'scheduling', 'management']
          },
          {
            question: 'When do I get paid?',
            answer: 'Payments are processed weekly for completed services. You can track your earnings and payment history in the dashboard.',
            tags: ['payments', 'earnings', 'schedule']
          }
        ]
      }
    ],
    '/admin': [
      {
        title: 'Admin Functions',
        items: [
          {
            question: 'How do I manage users?',
            answer: 'Use the User Management section to view, edit, or deactivate user accounts. Always follow proper procedures for account changes.',
            tags: ['users', 'management', 'admin']
          },
          {
            question: 'How do I monitor system health?',
            answer: 'Check the Health Dashboard for real-time system status, error rates, and performance metrics. Set up alerts for critical issues.',
            tags: ['monitoring', 'health', 'system']
          }
        ]
      }
    ],
    'general': [
      {
        title: 'Account & Billing',
        items: [
          {
            question: 'How do I reset my password?',
            answer: 'Click "Forgot Password" on the login page and enter your email. Check your inbox for reset instructions.',
            tags: ['password', 'reset', 'login']
          },
          {
            question: 'How do I update my billing information?',
            answer: 'Go to Profile Settings > Billing to update your payment methods and billing address.',
            tags: ['billing', 'payment', 'profile']
          },
          {
            question: 'Can I cancel my subscription?',
            answer: 'Yes, you can cancel anytime from your Profile Settings. Your access will continue until the end of your billing period.',
            tags: ['subscription', 'cancellation', 'billing']
          }
        ]
      },
      {
        title: 'Technical Support',
        items: [
          {
            question: 'The page is loading slowly. What should I do?',
            answer: 'Try refreshing the page or clearing your browser cache. If the issue persists, check your internet connection or contact support.',
            tags: ['performance', 'loading', 'troubleshooting']
          },
          {
            question: 'I found a bug. How do I report it?',
            answer: 'Use the Contact tab in this help widget to report bugs. Include details about what you were doing and what browser you\'re using.',
            tags: ['bugs', 'reporting', 'support']
          }
        ]
      }
    ]
  }
};