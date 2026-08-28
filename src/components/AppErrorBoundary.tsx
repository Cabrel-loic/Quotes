"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Daybook failed to render", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-error" role="alert">
          <strong>Daybook could not start.</strong>
          <span>{this.state.error.message}</span>
        </div>
      );
    }
    return this.props.children;
  }
}
