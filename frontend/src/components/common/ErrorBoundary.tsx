import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button.js";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
    console.error("Uncaught error in UI:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center border border-hairline rounded-2xl bg-paper dark:bg-card">
          <AlertCircle className="w-10 h-10 text-destructive mb-3" />
          <h2 className="text-lg font-normal text-ink dark:text-paper">
            {this.props.fallbackTitle || "Something went wrong"}
          </h2>
          <p className="mt-1 text-sm text-ash max-w-md">
            {this.state.error?.message || "An unexpected error occurred in this view."}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
