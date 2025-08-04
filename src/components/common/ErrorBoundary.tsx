import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Sentry } from '@/lib/sentry';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  section?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.section || 'application'}:`, error);
    console.error('Error info:', errorInfo);
    
    // Send error to Sentry with additional context
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', true);
      scope.setTag('section', this.props.section || 'unknown');
      scope.setExtra('errorInfo', {
        componentStack: errorInfo.componentStack
      });
      Sentry.captureException(error);
    });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      return (
        <Card className="p-6 m-4 border-destructive/20">
          <div className="flex items-center gap-3 text-destructive mb-4">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">
              Something went wrong in {this.props.section || 'this section'}
            </h3>
          </div>
          
          <p className="text-muted-foreground mb-4">
            We've encountered an error, but the rest of the application should continue working normally.
          </p>
          
          <div className="flex gap-2">
            <Button onClick={this.handleRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="destructive" 
              size="sm"
            >
              Reload Page
            </Button>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 p-3 bg-muted rounded text-xs">
              <summary className="cursor-pointer font-mono">Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap">{this.state.error.stack}</pre>
            </details>
          )}
        </Card>
      );
    }

    return this.props.children;
  }
}