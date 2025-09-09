export interface GuideStep {
  id: string;
  title: string;
  content: string;
  selector?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    type: 'click' | 'input' | 'wait';
    value?: string;
    delay?: number;
  };
}

export interface Guide {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  routes: string[]; // Which routes this guide applies to
  steps: GuideStep[];
}

export const guides: Guide[] = [
  {
    id: 'marketplace-complete-guide',
    title: 'Master the Circle Marketplace',
    description: 'Complete guide to shopping, categories, funnels, and getting vendor help in the marketplace.',
    difficulty: 'beginner',
    estimatedTime: '6 min',
    routes: ['/marketplace', '/'],
    steps: [
      {
        id: 'step-1',
        title: 'Explore Service Categories',
        content: 'Start by browsing the category blocks. Each category shows different types of services like CRMs, Marketing Tools, and Lead Generation. Click any category to filter services.',
        selector: '.category-blocks, [data-tour="category-blocks"]',
        position: 'bottom'
      },
      {
        id: 'step-2',
        title: 'Use Smart Search',
        content: 'Use the search bar to find specific services. You can search by service name, category, or keywords. The search will suggest relevant services as you type.',
        selector: '[data-tour="search-container"], .search-container, input[type="search"], input[placeholder*="Search"], .sticky-search',
        position: 'bottom'
      },
      {
        id: 'step-3',
        title: 'Apply Filters & Sort',
        content: 'Use the filter options to narrow down services by price range, features (like Co-Pay Available), or verification status. Sort by featured, rating, or price to find what works best for you.',
        selector: '[data-tour="filters"], .marketplace-filters, .filters-container, .filter-section',
        position: 'right'
      },
      {
        id: 'step-4',
        title: 'Browse Service Cards',
        content: 'Each service card shows key details: price, Circle Pro discount, ratings, and special badges. Look for "Co-Pay Available" and "Circle Pro" badges for extra savings.',
        selector: '[data-tour="service-card"]:first-child',
        position: 'top'
      },
      {
        id: 'step-5',
        title: 'View Service Funnels',
        content: 'Click "View Details" on any service to open the service funnel. This shows detailed information, pricing options, ROI data, and booking/contact options.',
        selector: '[data-tour="service-card"]:first-child .view-details-button, [data-tour="service-card"]:first-child button',
        position: 'top',
        action: { type: 'click' }
      },
      {
        id: 'step-6',
        title: 'Request Vendor Help',
        content: 'In any service funnel, look for "Contact Vendor" or "Book Consultation" buttons. These let you get personalized help, request quotes, or book calls with verified vendors.',
        selector: '.contact-vendor-button, .book-consultation-button, [data-tour="contact-vendor"]',
        position: 'bottom'
      },
      {
        id: 'step-7',
        title: 'Explore Co-Pay Options',
        content: 'Many services offer "Co-Pay" where Circle-vetted vendors can help cover costs in exchange for partnership opportunities. Look for the Co-Pay badge and "Get Vendor Help" options.',
        selector: '.copay-badge, .vendor-help-button, [data-tour="copay-option"]',
        position: 'top'
      },
      {
        id: 'step-8',
        title: 'Save & Compare Services',
        content: 'Use the heart icon to save services you like. Your saved services help us recommend similar options and make it easy to compare later.',
        selector: '.save-service-button, [data-tour="save-button"]',
        position: 'left'
      }
    ]
  },
  {
    id: 'academy-course-enrollment',
    title: 'Enroll in Your First Course',
    description: 'Discover how to find and enroll in Academy courses to advance your skills.',
    difficulty: 'beginner',
    estimatedTime: '2 min',
    routes: ['/academy', '/'],
    steps: [
      {
        id: 'step-1',
        title: 'Navigate to Academy',
        content: 'Go to the Academy section to explore available courses and content.',
        selector: '[data-tour="academy-tab"]',
        position: 'bottom'
      },
      {
        id: 'step-2',
        title: 'Browse Course Categories',
        content: 'Use the sidebar to filter courses by category, difficulty, or content type.',
        selector: '.academy-sidebar',
        position: 'right'
      },
      {
        id: 'step-3',
        title: 'Select a Course',
        content: 'Click on any course card to view the curriculum and enroll.',
        selector: '.course-card:first-child',
        position: 'top',
        action: { type: 'click' }
      }
    ]
  },
  {
    id: 'vendor-service-creation',
    title: 'Create Your First Service',
    description: 'Step-by-step guide to creating and publishing your first service listing.',
    difficulty: 'intermediate',
    estimatedTime: '8 min',
    routes: ['/vendor-dashboard'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Service Management',
        content: 'Find the service management section in your vendor dashboard.',
        selector: '[data-testid="service-management-tab"]',
        position: 'bottom'
      },
      {
        id: 'step-2',
        title: 'Add New Service',
        content: 'Click the "Add Service" button to start creating your listing.',
        selector: '[data-testid="add-service-button"]',
        position: 'bottom',
        action: { type: 'click' }
      },
      {
        id: 'step-3',
        title: 'Service Basic Information',
        content: 'Fill in your service title, description, and category.',
        selector: '[data-testid="service-form-basic"]',
        position: 'right'
      },
      {
        id: 'step-4',
        title: 'Set Pricing',
        content: 'Configure your pricing structure and any available packages.',
        selector: '[data-testid="service-pricing"]',
        position: 'left'
      },
      {
        id: 'step-5',
        title: 'Upload Images',
        content: 'Add high-quality images to showcase your service.',
        selector: '[data-testid="service-images"]',
        position: 'top'
      },
      {
        id: 'step-6',
        title: 'Publish Service',
        content: 'Review all details and publish your service to make it live.',
        selector: '[data-testid="publish-service"]',
        position: 'top'
      }
    ]
  },
  {
    id: 'ai-dashboard-setup',
    title: 'Set Up AI Recommendations',
    description: 'Configure your AI dashboard to get personalized business insights.',
    difficulty: 'intermediate',
    estimatedTime: '5 min',
    routes: ['/ai-dashboard', '/'],
    steps: [
      {
        id: 'step-1',
        title: 'Open AI Concierge',
        content: 'Click on your user menu and select "AI Concierge" to access intelligent recommendations.',
        selector: '[data-tour="ai-concierge-link"], a[href="/ai-dashboard"]',
        position: 'bottom'
      },
      {
        id: 'step-2',
        title: 'Generate Recommendations',
        content: 'Click the button to generate your personalized business growth recommendations.',
        selector: '[data-tour="generate-recommendations-button"]',
        position: 'right'
      },
      {
        id: 'step-3',
        title: 'Review Recommendations',
        content: 'Once generated, explore your personalized AI recommendations and growth strategies.',
        selector: '[data-tour="ai-plan-display"], .space-y-6, .ai-recommendations',
        position: 'top'
      }
    ]
  },
  {
    id: 'profile-optimization',
    title: 'Optimize Your Profile',
    description: 'Complete and optimize your profile for better visibility and trust.',
    difficulty: 'beginner',
    estimatedTime: '4 min',
    routes: ['*'], // Available on all routes
    steps: [
      {
        id: 'step-1',
        title: 'Access Profile Settings',
        content: 'Click on your avatar to open the user menu, then select "Profile Settings" to update your information.',
        selector: '[data-tour="user-menu"], .relative button[variant="ghost"], button:has(.avatar)',
        position: 'bottom'
      },
      {
        id: 'step-2',
        title: 'Navigate to Profile Settings',
        content: 'Click on "Profile Settings" in the dropdown menu to access your profile customization options.',
        selector: '[data-tour="profile-settings-link"], a[href="/profile-settings"]',
        position: 'left'
      },
      {
        id: 'step-3',
        title: 'Complete Your Profile',
        content: 'Once in Profile Settings, upload a professional photo, complete your bio, and add your contact information to build trust with other users.',
        selector: '.profile-form, .settings-form, form, main',
        position: 'right'
      },
      {
        id: 'step-4',
        title: 'Save Changes',
        content: 'Make sure to save any changes to your profile information. A complete profile helps build trust and improves your experience on the platform.',
        selector: 'button[type="submit"], .save-button, button:has-text("Save")',
        position: 'top'
      }
    ]
  }
];