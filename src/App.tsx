import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { Dashboard } from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { createClient } from './utils/supabase/client';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';

type Page = 'login' | 'signup' | 'dashboard';

interface User {
  id: string;
  email: string;
  name: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const supabase = createClient();
  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2f7701f6`;

  useEffect(() => {
    checkExistingSession();
    
    // Set up auth state listener to handle token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setAccessToken('');
        setCurrentPage('login');
      } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        if (session?.access_token) {
          setAccessToken(session.access_token);
        }
      } else if (event === 'USER_UPDATED' && session?.access_token) {
        setAccessToken(session.access_token);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkExistingSession = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error checking session:', sessionError);
        setIsCheckingSession(false);
        return;
      }

      if (session?.access_token && session?.user) {
        setAccessToken(session.access_token);
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || 'User',
        });
        setCurrentPage('dashboard');
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
    } finally {
      setIsCheckingSession(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setError('');
    try {
      // First check if user exists by attempting to sign in
      const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        let errorMessage = signInError.message;
        
        // Provide more helpful error messages
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = '⚠️ Invalid email or password.\n\n' +
            '• If you don\'t have an account yet, click "Create an Account" below\n' +
            '• If you forgot your password, use the password reset option\n' +
            '• Make sure your email and password are correct';
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = '📧 Please confirm your email address.\n\nCheck your inbox for a confirmation email from Supabase.';
        } else if (errorMessage.includes('User not found')) {
          errorMessage = '👤 No account found with this email.\n\nPlease click "Create an Account" to sign up first.';
        }
        
        setError(errorMessage);
        toast.error('Login failed', {
          description: errorMessage.split('\n')[0],
          duration: 5000,
        });
        return;
      }

      if (!session?.access_token || !session?.user) {
        const errorMsg = 'Login failed. Please try again or contact support.';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      setAccessToken(session.access_token);
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name || 'User',
      });
      setCurrentPage('dashboard');
      toast.success('Welcome back!', {
        description: `Successfully logged in as ${session.user.email}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error during login:', error);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    setError('');
    try {
      // Validate inputs
      if (!email || !password || !name) {
        const errorMsg = 'Please fill in all fields';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (password.length < 6) {
        const errorMsg = 'Password must be at least 6 characters long';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      toast.info('Creating your account...', { duration: 2000 });

      const response = await fetch(`${serverUrl}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, name }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Signup error:', result);
        let errorMessage = result.error || 'Signup failed';
        
        // Provide more helpful error messages
        if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
          errorMessage = '📧 This email is already registered.\n\nPlease use the "Sign In" page to login instead.';
        } else if (errorMessage.includes('invalid email')) {
          errorMessage = '⚠️ Please enter a valid email address.';
        }
        
        setError(errorMessage);
        toast.error('Signup failed', {
          description: errorMessage.split('\n')[0],
          duration: 5000,
        });
        return;
      }

      toast.success('🎉 Account created successfully!', {
        description: 'Logging you in...',
        duration: 3000,
      });
      
      // Auto-login after successful signup
      await handleLogin(email, password);
    } catch (error) {
      console.error('Error during signup:', error);
      const errorMsg = 'An unexpected error occurred during signup. Please try again.';
      setError(errorMsg);
      toast.error('An error occurred during signup');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAccessToken('');
      setCurrentPage('login');
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error during logout');
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {currentPage === 'login' && (
        <LoginPage
          onLogin={handleLogin}
          onNavigateToSignup={() => {
            setError('');
            setCurrentPage('signup');
          }}
          error={error}
        />
      )}

      {currentPage === 'signup' && (
        <SignupPage
          onSignup={handleSignup}
          onNavigateToLogin={() => {
            setError('');
            setCurrentPage('login');
          }}
          error={error}
        />
      )}

      {currentPage === 'dashboard' && user && (
        <Dashboard
          user={user}
          accessToken={accessToken}
          onLogout={handleLogout}
        />
      )}

      <Toaster position="top-right" richColors closeButton />
    </ErrorBoundary>
  );
}
