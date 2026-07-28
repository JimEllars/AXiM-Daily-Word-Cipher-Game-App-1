import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);

    // Attempt telemetry logging of the error (fail silently)
    try {
      const eventPayload = {
        eventName: 'GLOBAL_ERROR',
        payload: {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        }
      };

      if (navigator.onLine) {
        fetch('/api/telemetry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        }).catch(err => {
          // silently catch
        });
      } else {
        const queue = JSON.parse(localStorage.getItem('axim_telemetry_queue') || '[]');
        queue.push(eventPayload);
        localStorage.setItem('axim_telemetry_queue', JSON.stringify(queue));
      }
    } catch (e) {
      console.warn('Failed to log error telemetry', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-lg p-6 border-2 border-red-500 text-red-500 bg-red-500/10 font-mono text-center my-6 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
          <h2 className="text-xl font-bold mb-4">[ COMPONENT OFFLINE - SYSTEM REMAINS ACTIVE ]</h2>
          <p className="text-sm opacity-80">A sub-system failure has been detected and logged.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
