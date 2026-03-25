
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DetectionMetadata {
    confidence: number;
    cameraName: string;
    zone?: string;
}

export const videoAiService = {
    /**
     * Processes a face detection and automatically registers movement if in a gate zone.
     */
    async handleFaceDetection(studentId: string, metadata: DetectionMetadata) {
        try {
            // 1. Log the recognition event
            const { error: logError } = await supabase
                .from("face_recognition_logs")
                .insert({
                    student_id: studentId,
                    similarity_score: metadata.confidence,
                    camera_name: metadata.cameraName,
                    timestamp: new Date().toISOString()
                });

            if (logError) throw logError;

            // 2. Automate movement registration if it's a "Portaria" (Gate) camera
            if (metadata.cameraName.toLowerCase().includes("portaria")) {
                // Determine type based on current state or simple logic (defaulting to entry for this demo)
                // In a real scenario, we'd check the student's last state
                const { data: lastMovement } = await supabase
                    .from("movements")
                    .select("type")
                    .eq("student_id", studentId)
                    .order("registered_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                const nextType = lastMovement?.type === 'entry' ? 'exit' : 'entry';

                const { error: movError } = await supabase
                    .from("movements" as any)
                    .insert({
                        student_id: studentId,
                        type: nextType,
                        source_type: 'face',
                        camera_id: metadata.cameraName,
                        registered_at: new Date().toISOString()
                    } as any);

                if (!movError) {
                    toast.success(`Portaria: ${nextType === 'entry' ? 'Entrada' : 'Saída'} automática via Face ID detectada.`);
                    return { success: true, type: nextType };
                }
            }

            return { success: true };
        } catch (err) {
            console.error("AI Service Error:", err);
            return { success: false, error: err };
        }
    },

    /**
     * Broadcasts a voice message via Speech Synthesis API.
     */
    broadcastEvent(message: string) {
        if (!('speechSynthesis' in window)) return;
        
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.95;
        utterance.volume = 1;

        // Visual feedback could be added here if needed
        window.speechSynthesis.speak(utterance);
    },

    /**
     * Detects anomalies based on detection data and school schedules.
     */
    async processAnomalyDetection(cameraId: string, personCount: number, studentId?: string) {
        // Example: If personCount > 0 in a hallway during class time, create an alert
        if (cameraId.toLowerCase().includes("corredor") && personCount > 0 && studentId) {
            const { error } = await supabase.from("alerts").insert({
               student_id: studentId,
               type: 'irregular_time',
               message: `Detectado no corredor durante o período de aula (Câmera: ${cameraId}).`,
               status: 'pending'
            });
            if (!error) toast.warning("Alerta de IA: Movimentação irregular detectada.");
        }
    }
};
