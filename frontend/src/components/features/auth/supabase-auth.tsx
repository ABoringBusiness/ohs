import React, { useState } from 'react';
import { supabase } from '#/services/supabase';
import { useSupabaseUser } from '#/hooks/query/use-supabase-user';
import { BrandButton } from '../settings/brand-button';
import { SettingsInput } from '../settings/settings-input';
import { LoadingSpinner } from '#/components/shared/loading-spinner';
import { cn } from '#/utils/utils';

type AuthMode = 'signIn' | 'signUp' | 'forgotPassword';

export function SupabaseAuth() {
  const { data: user, isLoading: isUserLoading } = useSupabaseUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('signIn');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      setMessage({ text: 'Signed in successfully!', type: 'success' });
    } catch (error) {
      console.error('Error signing in:', error);
      setMessage({ 
        text: error instanceof Error ? error.message : 'An error occurred during sign in', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      setMessage({ 
        text: 'Check your email for the confirmation link!', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error signing up:', error);
      setMessage({ 
        text: error instanceof Error ? error.message : 'An error occurred during sign up', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      setMessage({ 
        text: 'Check your email for the password reset link!', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      setMessage({ 
        text: error instanceof Error ? error.message : 'An error occurred during password reset', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setMessage({ text: 'Signed out successfully!', type: 'success' });
    } catch (error) {
      console.error('Error signing out:', error);
      setMessage({ 
        text: error instanceof Error ? error.message : 'An error occurred during sign out', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with GitHub:', error);
      setMessage({ 
        text: error instanceof Error ? error.message : 'An error occurred during GitHub sign in', 
        type: 'error' 
      });
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <h2 className="text-2xl font-bold">Welcome, {user.email}</h2>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p>You are currently signed in.</p>
          <BrandButton 
            variant="secondary" 
            onClick={handleSignOut}
            isDisabled={isLoading}
            className="mt-4"
          >
            Sign Out
            {isLoading && <LoadingSpinner size="small" className="ml-2" />}
          </BrandButton>
        </div>
        {message && (
          <div className={cn(
            "p-3 rounded mt-4",
            message.type === 'success' ? 'bg-green-700' : 'bg-red-700'
          )}>
            {message.text}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold">
        {authMode === 'signIn' ? 'Sign In' : 
         authMode === 'signUp' ? 'Create Account' : 'Reset Password'}
      </h2>

      <form onSubmit={
        authMode === 'signIn' ? handleSignIn : 
        authMode === 'signUp' ? handleSignUp : 
        handleForgotPassword
      } className="flex flex-col gap-4">
        <SettingsInput
          label="Email"
          type="email"
          value={email}
          onChange={(value) => setEmail(value)}
          placeholder="your.email@example.com"
          required
        />

        {authMode !== 'forgotPassword' && (
          <SettingsInput
            label="Password"
            type="password"
            value={password}
            onChange={(value) => setPassword(value)}
            placeholder="Your password"
            required
          />
        )}

        <BrandButton
          variant="primary"
          type="submit"
          isDisabled={isLoading}
          className="mt-2"
        >
          {authMode === 'signIn' ? 'Sign In' : 
           authMode === 'signUp' ? 'Sign Up' : 
           'Send Reset Link'}
          {isLoading && <LoadingSpinner size="small" className="ml-2" />}
        </BrandButton>
      </form>

      <div className="flex flex-col gap-4 mt-2">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900 text-gray-400">Or continue with</span>
          </div>
        </div>

        <BrandButton
          variant="secondary"
          onClick={handleGitHubSignIn}
          isDisabled={isLoading}
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Sign in with GitHub
        </BrandButton>
      </div>

      <div className="text-center mt-4">
        {authMode === 'signIn' ? (
          <>
            <button 
              type="button"
              onClick={() => setAuthMode('forgotPassword')}
              className="text-blue-400 hover:underline"
            >
              Forgot password?
            </button>
            <div className="mt-2">
              Don't have an account?{' '}
              <button 
                type="button"
                onClick={() => setAuthMode('signUp')}
                className="text-blue-400 hover:underline"
              >
                Sign up
              </button>
            </div>
          </>
        ) : authMode === 'signUp' ? (
          <div>
            Already have an account?{' '}
            <button 
              type="button"
              onClick={() => setAuthMode('signIn')}
              className="text-blue-400 hover:underline"
            >
              Sign in
            </button>
          </div>
        ) : (
          <div>
            Remember your password?{' '}
            <button 
              type="button"
              onClick={() => setAuthMode('signIn')}
              className="text-blue-400 hover:underline"
            >
              Sign in
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className={cn(
          "p-3 rounded mt-4",
          message.type === 'success' ? 'bg-green-700' : 'bg-red-700'
        )}>
          {message.text}
        </div>
      )}
    </div>
  );
}