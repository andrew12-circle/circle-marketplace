import { useEffect, useState } from "react";
import { useAuthBootstrap } from "@/lib/useAuthBootstrap";
import { createHealthEndpoint } from "@/lib/diagnostics";

export default function Health() {
  const { status, session } = useAuthBootstrap();
  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    const data = {
      ...createHealthEndpoint(),
      auth: {
        status,
        hasSession: !!session,
        userId: session?.user?.id || null,
        bootstrapReady: status === "ready"
      }
    };
    setHealthData(data);
  }, [status, session]);

  // Return JSON response for API usage
  if (window.location.search.includes('format=json')) {
    return (
      <pre style={{ fontFamily: 'monospace', padding: '20px' }}>
        {JSON.stringify(healthData, null, 2)}
      </pre>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">System Health</h1>
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Authentication Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Bootstrap Status: <span className="font-mono">{status}</span></div>
            <div>Has Session: <span className="font-mono">{String(!!session)}</span></div>
            <div>User ID: <span className="font-mono">{session?.user?.id || 'null'}</span></div>
            <div>Ready: <span className="font-mono">{String(status === "ready")}</span></div>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Raw Health Data</h2>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
            {JSON.stringify(healthData, null, 2)}
          </pre>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Access JSON format: <code>/health?format=json</code></p>
        </div>
      </div>
    </div>
  );
}