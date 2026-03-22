import { supabase } from "@/integrations/supabase/client";

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'SETTINGS_CHANGE';

export const logAudit = async (
    actionType: AuditAction,
    entityName: string,
    entityId?: string,
    details?: Record<string, any>
) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return; // Must be authenticated

        await supabase.from('audit_logs' as any).insert({
            action_type: actionType,
            entity_name: entityName,
            entity_id: entityId || null,
            user_id: session.user.id,
            details: details || null
        });
    } catch (err) {
        console.error("Failed to log audit event:", err);
    }
};
