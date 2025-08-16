import { CreatorOnboarding } from '@/components/creator/CreatorOnboarding';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function CreatorOnboardingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Become a Creator</h1>
        <p className="text-muted-foreground mt-2">
          Join our creator program and start monetizing your content
        </p>
      </div>
      
      <CreatorOnboarding />
    </div>
  );
}