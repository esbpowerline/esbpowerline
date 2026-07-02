'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Activity, RotateCcw } from 'lucide-react';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class PowerGridExplorerErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PowerGridExplorer]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid-explorer-chart-card card p-8 flex flex-col items-center justify-center text-center min-h-[20rem] gap-4">
          <div className="p-4 rounded-full bg-destructive/10 text-destructive">
            <Activity className="h-8 w-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-foreground mb-1">Grid Explorer failed to load</h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              A chart or data module encountered an error. Retry or refresh the page.
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}