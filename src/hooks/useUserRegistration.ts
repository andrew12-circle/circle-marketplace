// @ts-nocheck
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSpiritualCoverage } from '@/contexts/SpiritualCoverageContext';

export const useUserRegistration = () => {
  const { user } = useAuth();
  const { applyGuard } = useSpiritualCoverage();

  useEffect(() => {
    if (user) {
      const applyNewUserBlessing = async () => {
        await applyGuard('USER_REGISTRATION', {
          userId: user.id,
          email: user.email,
          registeredAt: new Date().toISOString(),
          blessing_type: 'new_user_welcome'
        });
      };

      applyNewUserBlessing();
    }
  }, [user, applyGuard]);

  return { user };
};