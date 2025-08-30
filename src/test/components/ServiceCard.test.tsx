import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ServiceCard } from '../../components/marketplace/ServiceCard'

// Mock all the hooks and contexts
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock('../../contexts/CartContext', () => ({
  useCart: () => ({ addToCart: vi.fn() }),
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: null, user: null }),
}))

vi.mock('../../hooks/useServiceViewTracker', () => ({
  useServiceViewTracker: () => ({ trackView: vi.fn() }),
}))

vi.mock('../../hooks/useCurrency', () => ({
  useCurrency: () => ({ formatPrice: (price: number) => `$${price}` }),
}))

vi.mock('../../hooks/useServiceRatings', () => ({
  useServiceRatings: () => ({ averageRating: 0, totalReviews: 0, loading: false }),
}))

vi.mock('../../hooks/useActiveDisclaimer', () => ({
  useActiveDisclaimer: () => ({ disclaimer: null }),
}))

vi.mock('../../hooks/useBulkServiceRatings', () => ({
  useServiceRatingFromBulk: () => ({ averageRating: 0, totalReviews: 0 }),
}))

vi.mock('../../hooks/useProviderTracking', () => ({
  useProviderTracking: () => ({ trackEvent: vi.fn() }),
}))

vi.mock('../../hooks/useFeatureFlag', () => ({
  useFeatureFlag: () => false,
}))

vi.mock('../../hooks/useABTest', () => ({
  useABTest: () => ({ variant: 'control' }),
}))

vi.mock('../../hooks/useSponsoredTracking', () => ({
  useSponsoredTracking: () => ({ trackClick: vi.fn() }),
}))

const mockService = {
  id: 'test-service-1',
  title: 'Test Service',
  description: 'Test service description',
  image_url: 'https://example.com/image.jpg',
  retail_price: '$100',
  vendor: { 
    name: 'Test Vendor',
    rating: 4.5,
    review_count: 10,
    is_verified: true
  },
  tags: ['test', 'service'],
  requires_quote: false,
  website_url: 'https://example.com',
  category: 'test-category',
  is_featured: false,
  is_top_pick: false,
  copay_allowed: false,
  respa_split_limit: null,
  co_pay_price: null,
  pro_price: null,
  is_verified: false,
  price_duration: 'mo',
  direct_purchase_enabled: false,
} as any

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('ServiceCard Performance', () => {
  it('should have explicit width and height on images to prevent CLS', () => {
    renderWithProviders(<ServiceCard service={mockService} />)

    const image = screen.getByAltText('Test Service')
    expect(image).toHaveAttribute('width', '200')
    expect(image).toHaveAttribute('height', '150')
  })

  it('should have proper alt text for accessibility', () => {
    renderWithProviders(<ServiceCard service={mockService} />)

    const image = screen.getByAltText('Test Service')
    expect(image).toBeInTheDocument()
  })
})