import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class OrganizerErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('OrganizerErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoToLogin = () => {
    window.history.pushState({}, '', '/organizer/login');
    window.dispatchEvent(new Event('popstate'));
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 antialiased">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-2xl mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Unable to load your organizer account</h2>
              <p className="text-xs text-slate-400">
                {this.state.error?.message || 'An unexpected error occurred while rendering the organizer workspace.'}
              </p>
            </div>

            <div className="flex flex-col space-y-3 pt-2">
              <button
                onClick={this.handleRetry}
                className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Dashboard</span>
              </button>

              <button
                onClick={this.handleGoToLogin}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-6 rounded-xl transition-all text-xs flex items-center justify-center space-x-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#00b894]" />
                <span>Return to Organizer Login</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
