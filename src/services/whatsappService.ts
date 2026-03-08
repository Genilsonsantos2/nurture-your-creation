import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WhatsAppSettings {
    whatsapp_enabled: boolean;
    whatsapp_api_url: string | null;
    whatsapp_api_key: string | null;
    whatsapp_instance_name: string | null;
    whatsapp_bot_type: 'manual' | 'evolution';
    school_phone: string | null;
}

class WhatsAppService {
    private static instance: WhatsAppService;

    private constructor() { }

    public static getInstance(): WhatsAppService {
        if (!WhatsAppService.instance) {
            WhatsAppService.instance = new WhatsAppService();
        }
        return WhatsAppService.instance;
    }

    async getSettings(): Promise<WhatsAppSettings | null> {
        const { data, error } = await supabase
            .from("settings")
            .select("whatsapp_enabled, whatsapp_api_url, whatsapp_api_key, whatsapp_instance_name, whatsapp_bot_type, school_phone")
            .single();

        if (error) {
            console.error("Error fetching WhatsApp settings:", error);
            return null;
        }
        return data as any as WhatsAppSettings;
    }

    /**
     * Sends a WhatsApp message. 
     * Uses Evolution API if configured, otherwise returns a wa.me link for manual sending.
     */
    async sendMessage(phone: string, text: string): Promise<{ success: boolean; manualLink?: string }> {
        const settings = await this.getSettings();
        const cleanPhone = phone.replace(/\D/g, "");

        if (!settings?.whatsapp_enabled) {
            return { success: false };
        }

        // Manual fallback always available
        const manualLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

        if (settings.whatsapp_bot_type === 'evolution' && settings.whatsapp_api_url && settings.whatsapp_api_key && settings.whatsapp_instance_name) {
            try {
                const url = `${settings.whatsapp_api_url}/message/sendText/${settings.whatsapp_instance_name}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': settings.whatsapp_api_key
                    },
                    body: JSON.stringify({
                        number: cleanPhone,
                        options: {
                            delay: 1200,
                            presence: "composing",
                            linkPreview: false
                        },
                        textMessage: {
                            text: text
                        }
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                return { success: true };
            } catch (error) {
                console.error("Evolution API Error:", error);
                toast.error("Erro no envio automático. Use o link manual.");
                return { success: false, manualLink };
            }
        }

        return { success: false, manualLink };
    }

    /**
     * Checks if the Evolution API instance is online
     */
    async checkInstanceStatus(): Promise<{ success: boolean; status?: string }> {
        const settings = await this.getSettings();
        if (!settings?.whatsapp_api_url || !settings?.whatsapp_api_key || !settings?.whatsapp_instance_name) {
            return { success: false };
        }

        try {
            const url = `${settings.whatsapp_api_url}/instance/connectionStatus/${settings.whatsapp_instance_name}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'apikey': settings.whatsapp_api_key
                }
            });

            if (!response.ok) return { success: false };
            const data = await response.json();
            return { success: true, status: data.instance?.state };
        } catch (error) {
            console.error("Status Check Error:", error);
            return { success: false };
        }
    }
}

export const whatsappService = WhatsAppService.getInstance();
