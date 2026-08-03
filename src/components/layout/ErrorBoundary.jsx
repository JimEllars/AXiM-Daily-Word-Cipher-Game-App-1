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
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] text-red-500 font-mono p-6">
          <div className="w-full max-w-lg p-8 border-2 border-red-500 bg-red-950/20 shadow-[0_0_20px_rgba(239,68,68,0.3)] text-center relative overflow-hidden">
            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-30"></div>

            <h1 className="text-2xl font-bold mb-6 animate-pulse">[ SYSTEM FAULT DETECTED ]</h1>

            <div className="text-sm opacity-90 text-left mb-8 bg-black/50 p-4 border border-red-500/30 overflow-x-auto whitespace-pre-wrap">
              <span className="text-red-400">ERR_CODE: </span>CRITICAL_COMPONENT_FAILURE
              <br/><br/>
              <span className="text-red-400">DETAILS: </span>{this.state.error && this.state.error.toString()}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 border-2 border-red-500 text-red-500 font-bold hover:bg-red-500 hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#050505] uppercase tracking-wider"
            >
              [ REBOOT TERMINAL ]
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
