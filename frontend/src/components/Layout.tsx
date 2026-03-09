import { Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { useGetBrandAssets } from '../hooks/useQueries';
import { useFileUrl } from '../blob-storage/FileStorage';
import { Header } from './Header';
import { LandingPage } from './LandingPage';
import { ProfileSetup } from './ProfileSetup';
import { BookOpen, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback } from 'react';

export function Layout() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: brandAssets, refetch: refetchBrandAssets } = useGetBrandAssets();
  const { data: logoUrl, refetch: refetchLogoUrl } = useFileUrl(brandAssets?.logoPath || '');

  const [logoError, setLogoError] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoKey, setLogoKey] = useState(0); // Force re-render key

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Aggressive auto-refresh for immediate asset updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await refetchBrandAssets();
        if (brandAssets?.logoPath) {
          await refetchLogoUrl();
        }
      } catch (error) {
        console.warn('Layout asset refresh failed:', error);
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [refetchBrandAssets, refetchLogoUrl, brandAssets]);

  // Force logo refresh when URL changes
  useEffect(() => {
    if (logoUrl) {
      setLogoError(false);
      setLogoLoading(false);
      setLogoKey(prev => prev + 1); // Force component re-render
    }
  }, [logoUrl]);

  const handleLogoError = useCallback(() => {
    setLogoError(true);
    setLogoLoading(false);
  }, []);

  const handleLogoLoad = useCallback(() => {
    setLogoError(false);
    setLogoLoading(false);
  }, []);

  const retryLogoLoad = useCallback(async () => {
    setLogoError(false);
    setLogoLoading(true);
    setLogoKey(prev => prev + 1);
    try {
      await refetchBrandAssets();
      await refetchLogoUrl();
    } catch (error) {
      console.error('Layout logo retry failed:', error);
      setLogoError(true);
    } finally {
      setLogoLoading(false);
    }
  }, [refetchBrandAssets, refetchLogoUrl]);

  // Create cache-busted URL for immediate updates
  const cacheBustedLogoUrl = logoUrl ? `${logoUrl}?t=${Date.now()}&k=${logoKey}` : null;

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Show profile setup for authenticated users without profile
  if (showProfileSetup) {
    return <ProfileSetup />;
  }

  // Show main application for authenticated users with profile
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-primary/10 p-2 rounded-lg relative">
                {cacheBustedLogoUrl && !logoError ? (
                  <img
                    key={`footer-${logoKey}`}
                    src={cacheBustedLogoUrl}
                    alt="Barshimha Logo"
                    className="h-6 w-6 object-contain"
                    onError={handleLogoError}
                    onLoad={handleLogoLoad}
                    style={{ display: logoLoading ? 'none' : 'block' }}
                  />
                ) : logoError ? (
                  <div className="h-6 w-6 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={retryLogoLoad}
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 rounded-full bg-background border"
                      title="Retry loading logo"
                    >
                      <RotateCcw className="h-2 w-2" />
                    </Button>
                  </div>
                ) : (
                  <BookOpen className="h-6 w-6 text-primary" />
                )}
                {logoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <span className="text-xl font-bold ml-2">Barshimha</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Transforming medical exam preparation with smart learning tools
            </p>
            <div className="text-sm text-muted-foreground">
              © 2025. Built with ❤️ using{' '}
              <a 
                href="https://caffeine.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline transition-colors"
              >
                caffeine.ai
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
