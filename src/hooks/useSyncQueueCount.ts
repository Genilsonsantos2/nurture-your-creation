import { useState, useEffect } from "react";
import { getSyncQueue } from "@/lib/offlineStorage";

export function useSyncQueueCount() {
    const [count, setCount] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        const fetchCount = async () => {
            try {
                const queue = await getSyncQueue();
                setCount(queue.length);
            } catch (err) {
                console.error("Failed to fetch sync queue count", err);
            }
        };

        fetchCount();

        // If offline, poll the queue length periodically
        // If online, we still poll for a short while after reconnecting to see the queue drain
        interval = setInterval(fetchCount, 2000);

        return () => clearInterval(interval);
    }, [isOnline]);

    return { count, isOnline };
}
