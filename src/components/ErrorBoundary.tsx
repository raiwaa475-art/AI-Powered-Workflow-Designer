import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught an uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 m-4 rounded-2xl border border-rose-500/20 bg-slate-950/40 backdrop-blur-xl shadow-2xl shadow-rose-950/10 text-center space-y-4 animate-fade-in-node">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
            <AlertTriangle className="w-8 h-8 text-rose-500 animate-pulse" />
          </div>
          
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-sm font-bold text-slate-200 tracking-wide">
              {this.props.fallbackMessage || 'Something went wrong'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-mono select-all bg-slate-900/60 p-2 rounded-lg border border-white/5 break-all max-h-32 overflow-y-auto">
              {this.state.error?.message || 'Unknown runtime error'}
            </p>
          </div>

          <button
            onClick={this.handleReset}
            className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recover Component</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
