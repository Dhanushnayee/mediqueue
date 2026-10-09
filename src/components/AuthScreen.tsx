import React from 'react';
import { AuthPortal } from './auth/AuthPortal';

interface AuthScreenProps {
  onSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = () => {
  return <AuthPortal />;
};
