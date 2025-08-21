import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  section?: string;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundaryWithQA extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const isQAMode = new URLSearchParams(window.location.search).get('qa') === '1';
    
    console.error(`ErrorBoundary caught an error in ${this.props.section || 'Unknown'}:`, error, errorInfo);
    
    if (isQAMode) {
      // Enhanced logging for QA mode
      console.log('QA Mode - Enhanced Error Details:', {
        section: this.props.section,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        errorInfo,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    }
    
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isQAMode = new URLSearchParams(window.location.search).get('qa') === '1';
      
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4" data-error-boundary>
          <div className="max-w-lg w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">
                    Something went wrong in {this.props.section || 'this section'}
                  </p>
                  <p className="text-sm">
                    {this.state.error?.message || 'An unexpected error occurred'}
                  </p>
                  
                  {isQAMode && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-mono">
                        QA Mode - Error Details
                      </summary>
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-32">
                        <div><strong>Error:</strong> {this.state.error?.name}</div>
                        <div><strong>Message:</strong> {this.state.error?.message}</div>
                        <div><strong>Stack:</strong> {this.state.error?.stack}</div>
                        {this.state.errorInfo && (
                          <div><strong>Component Stack:</strong> {this.state.errorInfo.componentStack}</div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={this.handleRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={this.handleReload}>
                Reload Page
              </Button>
              {isQAMode && (
                <Button variant="outline" onClick={() => window.open('/qa', '_blank')}>
                  <Bug className="w-4 h-4 mr-2" />
                  QA Runner
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}