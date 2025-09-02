import React, { Component, ErrorInfo, ReactNode } from 'react';
import { devError } from '@/lib/dev-logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Filter out extension-related errors
    const errorMessage = error.message || '';
    const errorStack = error.stack || '';
    
    const isExtensionError = [
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://',
      'ms-browser-extension://',
      'Invalid frameId',
      'Extension context invalidated',
      'background-redux-new.js',
      'LastPass',
      'duplicate id'
    ].some(pattern => 
      errorMessage.includes(pattern) || errorStack.includes(pattern)
    );

    // Don't treat extension errors as app errors
    if (isExtensionError) {
      return { hasError: false };
    }

    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Filter out extension errors from logging
    const errorMessage = error.message || '';
    const errorStack = error.stack || '';
    
    const isExtensionError = [
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://',
      'ms-browser-extension://',
      'Invalid frameId',
      'Extension context invalidated',
      'background-redux-new.js',
      'LastPass',
      'duplicate id'
    ].some(pattern => 
      errorMessage.includes(pattern) || errorStack.includes(pattern)
    );

    if (!isExtensionError) {
      devError('React Error Boundary caught an error:', error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-red-800 font-semibold">Something went wrong</h2>
          <p className="text-red-600 text-sm mt-1">
            An error occurred while rendering this component.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;