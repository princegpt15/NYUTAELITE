import React, { useEffect, useRef, useState } from 'react';
import { authService } from '../services/auth';
import { ApiError } from '../services/api';
import { trackLogin, trackSignUp } from '../services/analytics';
import type { User } from '../types';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  mode?: 'login' | 'register';
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  mode = 'login',
  onSuccess,
  onError,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [showConfigHint, setShowConfigHint] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const handleCredentialResponse = async (response: { credential?: string }) => {
    if (!response || !response.credential) {
      onError?.('No credential received from Google.');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.loginWithGoogle(response.credential);
      if (mode === 'register') {
        trackSignUp('google');
      } else {
        trackLogin('google');
      }
      onSuccess?.(user);
    } catch (err: any) {
      if (err instanceof ApiError) {
        onError?.(err.message || 'Google authentication failed');
      } else {
        onError?.(err?.message || 'Google authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!clientId) {
      return;
    }

    const initGsi = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          // NOTE: use_fedcm_for_prompt conflicts with ux_mode:'popup' on Android Chrome 120+
          // FedCM is left at its default (browser-controlled). Explicit popup mode is used instead.
          ux_mode: 'popup',
        });

        // Compute responsive button width for mobile screens
        const containerWidth = googleBtnRef.current.parentElement?.clientWidth || window.innerWidth || 360;
        const buttonWidth = Math.min(360, Math.max(220, Math.floor(containerWidth - 16)));

        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: mode === 'register' ? 'signup_with' : 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: buttonWidth,
        });

        setGsiLoaded(true);
      } catch (e) {
        console.warn('Failed to render Google Sign-In button:', e);
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
      return;
    }

    const scriptId = 'google-identity-services-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGsi();
      };
      script.onerror = () => {
        console.warn('Could not load Google Identity Services SDK');
      };
      document.body.appendChild(script);
    } else {
      script.addEventListener('load', initGsi);
      return () => script?.removeEventListener('load', initGsi);
    }
  }, [clientId, mode]);

  const handleManualClick = () => {
    if (!clientId) {
      setShowConfigHint(true);
      return;
    }
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Loading state indicator */}
      {loading ? (
        <div className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-[#FCFAF5] border border-[#E8DECB] text-[#123B2A] text-xs font-semibold">
          <div className="w-4 h-4 border-2 border-[#123B2A] border-t-transparent rounded-full animate-spin" />
          <span>Authenticating with Google...</span>
        </div>
      ) : (
        <>
          {/* Container for official Google Identity Services rendered button */}
          <div
            ref={googleBtnRef}
            className={`w-full flex justify-center ${gsiLoaded ? 'block' : 'hidden'}`}
          />

          {/* Fallback button when Google Identity Services is loading or unconfigured */}
          {!gsiLoaded && (
            <button
              type="button"
              onClick={handleManualClick}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white hover:bg-[#FCFAF5] border border-[#E8DECB] hover:border-[#C6A15B] text-[#123B2A] text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-xs cursor-pointer disabled:opacity-60"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{mode === 'register' ? 'Sign up with Google' : 'Continue with Google'}</span>
            </button>
          )}

          {showConfigHint && (
            <div className="mt-3 p-3 rounded-lg bg-[#F7F1E5] border border-[#E8DECB] text-[11px] text-[#68756E] leading-relaxed">
              <p className="font-bold text-[#123B2A] mb-1">Google OAuth Setup Guide:</p>
              <p>
                To complete sign-in, add your Google OAuth Client ID to <code className="text-[#123B2A] font-semibold">.env</code> as <code className="text-[#123B2A] font-semibold">VITE_GOOGLE_CLIENT_ID</code> and in <code className="text-[#123B2A] font-semibold">backend/.env</code> as <code className="text-[#123B2A] font-semibold">GOOGLE_CLIENT_ID</code>.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
