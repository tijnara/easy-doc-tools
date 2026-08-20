'use client';
import { useEffect } from 'react';

export default function ActiveHeartbeat() {
    useEffect(() => {
        const pingServer = async () => {
            // Ping only if the user tab is visible/active
            if (document.visibilityState === 'visible') {
                try {
                    await fetch('/api/heartbeat', { method: 'HEAD' });
                } catch (err) {
                    // Silently ignore network blips
                }
            }
        };

        // Ping immediately on tab load/focus
        pingServer();

        // Send a lightweight ping every 2 minutes (120,000 ms)
        const interval = setInterval(pingServer, 120000);

        // Ping when user switches back to the tab
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                pingServer();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return null;
}