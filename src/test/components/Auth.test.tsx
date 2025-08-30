import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Auth } from '../../pages/Auth'

// Mock hooks
vi.mock('../../hooks/useUserRegistration', () => ({
  useUserRegistration: () => {},
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, profile: null }),
}))

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  },
}))

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

describe('Auth Component Accessibility', () => {
  it('should have proper labels for form inputs', () => {
    renderWithProviders(<Auth />)

    // Check for email input label
    const emailLabel = screen.getByLabelText(/email address/i)
    expect(emailLabel).toBeInTheDocument()
    expect(emailLabel).toHaveAttribute('type', 'email')
    expect(emailLabel).toHaveAttribute('aria-label', 'Email address')

    // Check for password input label  
    const passwordLabel = screen.getByLabelText(/^password$/i)
    expect(passwordLabel).toBeInTheDocument()
    expect(passwordLabel).toHaveAttribute('type', 'password')
    expect(passwordLabel).toHaveAttribute('aria-label', 'Password')
  })

  it('should have descriptive aria-describedby attributes', () => {
    renderWithProviders(<Auth />)

    const emailInput = screen.getByLabelText(/email address/i)
    expect(emailInput).toHaveAttribute('aria-describedby', 'email-help')

    const passwordInput = screen.getByLabelText(/^password$/i)
    expect(passwordInput).toHaveAttribute('aria-describedby', 'password-help')
  })

  it('should have proper button labels', () => {
    renderWithProviders(<Auth />)

    const showPasswordButton = screen.getByLabelText(/show password/i)
    expect(showPasswordButton).toBeInTheDocument()
  })
})