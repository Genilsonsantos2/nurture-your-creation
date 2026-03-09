import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const exportSystemBackup = async () => {
    try {
        const tables = ["students", "movements", "occurrences", "classes", "absence_justifications"];
        const workbook = XLSX.utils.book_new();

        for (const table of tables) {
            const { data, error } = await supabase.from(table as any).select("*");
            if (error) {
                console.error(`Error fetching ${table}:`, error);
                continue;
            }

            if (data && data.length > 0) {
                const worksheet = XLSX.utils.json_to_sheet(data);
                XLSX.utils.book_append_sheet(workbook, worksheet, table);
            } else {
                // If table is empty, create an empty sheet
                const worksheet = XLSX.utils.json_to_sheet([{ "Status": "Sem registros" }]);
                XLSX.utils.book_append_sheet(workbook, worksheet, table);
            }
        }

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const dataBlob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

        const dateStr = new Date().toISOString().split('T')[0];
        saveAs(dataBlob, `Backup_CETI_${dateStr}.xlsx`);
        return true;
    } catch (error) {
        console.error("Backup export failed:", error);
        return false;
    }
};
