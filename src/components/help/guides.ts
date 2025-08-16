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
    id: 'marketplace-first-service',
    title: 'Find Your First Service',
    description: 'Learn how to search, filter, and book your first service in the marketplace.',
    difficulty: 'beginner',
    estimatedTime: '3 min',
    routes: ['/marketplace', '/'],
    steps: [
      {
        id: 'step-1',
        title: 'Open the Marketplace',
        content: 'First, navigate to the Marketplace to see all available services.',
        selector: 'nav a[href="/marketplace"]',
        position: 'bottom'
      },
      {
        id: 'step-2',
        title: 'Use Search & Filters',
        content: 'Use the search bar and filters to find services that match your needs.',
        selector: '[data-testid="marketplace-search"]',
        position: 'bottom'
      },
      {
        id: 'step-3',
        title: 'Browse Service Cards',
        content: 'Each service card shows key information like price, rating, and provider details.',
        selector: '.marketplace-grid .vendor-card:first-child',
        position: 'top'
      },
      {
        id: 'step-4',
        title: 'View Service Details',
        content: 'Click on a service to see full details, reviews, and booking options.',
        selector: '.marketplace-grid .vendor-card:first-child',
        position: 'top',
        action: { type: 'click' }
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
        selector: 'nav a[href="/academy"]',
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
        title: 'Open AI Dashboard',
        content: 'Navigate to the AI Dashboard to access intelligent insights.',
        selector: 'nav a[href="/ai-dashboard"]',
        position: 'bottom'
      },
      {
        id: 'step-2',
        title: 'Configure Preferences',
        content: 'Set your business goals and preferences for better recommendations.',
        selector: '[data-testid="ai-preferences"]',
        position: 'right'
      },
      {
        id: 'step-3',
        title: 'Review Recommendations',
        content: 'Explore the AI-generated recommendations and insights.',
        selector: '[data-testid="ai-recommendations"]',
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
        content: 'Go to your profile settings to update your information.',
        selector: '[data-testid="user-menu"]',
        position: 'bottom'
      },
      {
        id: 'step-2',
        title: 'Upload Profile Photo',
        content: 'Add a professional photo to build trust with other users.',
        selector: '[data-testid="profile-photo"]',
        position: 'right'
      },
      {
        id: 'step-3',
        title: 'Complete Bio',
        content: 'Write a compelling bio that describes your experience and expertise.',
        selector: '[data-testid="profile-bio"]',
        position: 'left'
      },
      {
        id: 'step-4',
        title: 'Add Contact Information',
        content: 'Ensure your contact details are up to date for better communication.',
        selector: '[data-testid="contact-info"]',
        position: 'top'
      }
    ]
  }
];