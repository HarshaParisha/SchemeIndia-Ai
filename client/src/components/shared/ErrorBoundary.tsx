import { Component, type ReactNode } from 'react'

export default class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-2xl rounded-card border border-brand-border bg-brand-card p-6 shadow-subtle">
          <div className="text-lg font-medium">Something went wrong</div>
          <div className="mt-2 text-sm text-brand-dark/80">
            Please refresh the page. If this keeps happening, try again in a minute.
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

