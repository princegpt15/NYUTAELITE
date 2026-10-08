// src/components/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): State {
    const errorId = `ui_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    return { hasError: true, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Safe client-side logging (never leaks PII or tokens)
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary caught error]', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorId: undefined });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, errorId: undefined });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6 bg-[#FCFAF5]">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-[#E8DECB] shadow-sm text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#C6A15B]">
                TEMPORARY ISSUE
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#092218]">
                Something went wrong
              </h2>
              <p className="text-xs text-[#68756E] leading-relaxed">
                An unexpected interface error occurred. Your order and shopping cart data remain safe.
              </p>
              {this.state.errorId && (
                <p className="text-[11px] font-mono text-[#8C9B90] pt-1">
                  Reference ID: <span className="font-semibold text-[#1C1C1C]">{this.state.errorId}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[#C6A15B]" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#E8DECB] hover:bg-[#F7F1E5] text-[#1C1C1C] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4 text-[#123B2A]" />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
