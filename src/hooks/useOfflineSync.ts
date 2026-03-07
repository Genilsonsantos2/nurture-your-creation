import { useEffect } from "react";
import { getSyncQueue, removeFromSyncQueue } from "@/lib/offlineStorage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useOfflineSync() {
    useEffect(() => {
        const handleOnline = async () => {
            console.log("Internet restored. Checking sync queue...");
            const queue = await getSyncQueue();

            if (queue.length > 0) {
                toast.info(`Sincronizando ${queue.length} registros off-line...`);
                let successCount = 0;

                for (const item of queue) {
                    try {
                        if (item.action_type === 'movement') {
                            const { error } = await supabase
                                .from("movements")
                                .insert([{ student_id: item.payload.studentId, type: item.payload.type }]);

                            if (!error) {
                                await removeFromSyncQueue(item.id);
                                successCount++;
                            }
                        }
                    } catch (err) {
                        console.error("Sync error for item", item, err);
                    }
                }

                if (successCount > 0) {
                    toast.success(`${successCount} registros sincronizados com o servidor!`);
                }
            }
        };

        window.addEventListener('online', handleOnline);

        // Optionally try to sync on startup if already online
        if (navigator.onLine) {
            handleOnline();
        }

        return () => window.removeEventListener('online', handleOnline);
    }, []);
}
