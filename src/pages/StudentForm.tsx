import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Upload, User, AlertCircle, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function StudentForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "", series: "", class: "", enrollment: "", exitLimit: "",
    guardianName: "", guardianPhone: "", guardianRelation: "",
    whatsappEnabled: false, active: true, modality: "technical",
    photoUrl: "", bloodType: "", allergies: "", medicalNotes: "",
  });
  const [uploading, setUploading] = useState(false);

  // Load student data if editing
  const { data: student } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("students").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  const { data: guardian } = useQuery({
    queryKey: ["guardian", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase.from("guardians").select("*").eq("student_id", id).limit(1).single();
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (student) {
      const s = student as any;
      setForm(f => ({
        ...f,
        name: s.name, series: s.series, class: s.class,
        enrollment: s.enrollment, exitLimit: s.exit_limit ? String(s.exit_limit) : "",
        active: s.active, modality: s.modality || "technical",
        photoUrl: s.photo_url || "", bloodType: s.blood_type || "",
        allergies: s.allergies || "", medicalNotes: s.medical_notes || "",
      }));
    }
  }, [student]);

  useEffect(() => {
    if (guardian) {
      setForm(f => ({
        ...f,
        guardianName: guardian.name, guardianPhone: guardian.phone,
        guardianRelation: guardian.relation || "", whatsappEnabled: guardian.whatsapp_enabled || false,
      }));
    }
  }, [guardian]);

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Foto muito grande. Máximo 2MB.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('student-photos')
        .getPublicUrl(filePath);

      update("photoUrl", publicUrl);
      toast.success("Foto carregada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao carregar foto: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEditing) {
        // Update student
        const { error: studentErr } = await supabase.from("students").update({
          name: form.name, series: form.series, class: form.class,
          enrollment: form.enrollment, exit_limit: form.exitLimit ? parseInt(form.exitLimit) : null,
          active: form.active, modality: form.modality,
          photo_url: form.photoUrl, blood_type: form.bloodType,
          allergies: form.allergies, medical_notes: form.medicalNotes,
          qr_code: form.enrollment
        }).eq("id", id);
        if (studentErr) throw studentErr;

        // Upsert guardian
        if (form.guardianName && form.guardianPhone) {
          if (guardian) {
            await supabase.from("guardians").update({
              name: form.guardianName, phone: form.guardianPhone,
              relation: form.guardianRelation || null, whatsapp_enabled: form.whatsappEnabled,
            }).eq("id", guardian.id);
          } else {
            await supabase.from("guardians").insert({
              student_id: id!, name: form.guardianName, phone: form.guardianPhone,
              relation: form.guardianRelation || null, whatsapp_enabled: form.whatsappEnabled,
            });
          }
        }
      } else {
        // Create student
        const { data: newStudent, error: studentErr } = await supabase.from("students").insert({
          name: form.name, series: form.series, class: form.class,
          enrollment: form.enrollment, exit_limit: form.exitLimit ? parseInt(form.exitLimit) : null,
          modality: form.modality,
          photo_url: form.photoUrl, blood_type: form.bloodType,
          allergies: form.allergies, medical_notes: form.medicalNotes,
          qr_code: form.enrollment // Default qr_code to enrollment
        }).select().single();
        if (studentErr) throw studentErr;

        if (form.guardianName && form.guardianPhone) {
          await supabase.from("guardians").insert({
            student_id: newStudent.id, name: form.guardianName, phone: form.guardianPhone,
            relation: form.guardianRelation || null, whatsapp_enabled: form.whatsappEnabled,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success(isEditing ? "Aluno atualizado!" : "Aluno cadastrado!");
      navigate("/alunos");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) toast.error("Matrícula já cadastrada.");
      else toast.error("Erro ao salvar aluno.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); mutation.mutate(); };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isEditing ? "Editar Aluno" : "Cadastrar Aluno"}</h1>
          <p className="text-sm text-muted-foreground">Preencha os dados do aluno e responsável</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card rounded-lg border p-5 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Photo Upload Section */}
            <div className="relative group self-center sm:self-start">
              <div className="h-32 w-32 rounded-3xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 relative">
                {form.photoUrl ? (
                  <>
                    <img src={form.photoUrl} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => update("photoUrl", "")}
                      className="absolute top-1 right-1 p-1 bg-destructive/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <User className="h-10 w-10 text-muted-foreground mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">Adicionar Foto</p>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <label className="absolute inset-0 cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>

            <div className="flex-1 space-y-4 w-full">
              <h2 className="font-semibold text-foreground">Dados Acadêmicos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground mb-1 block">Nome Completo *</label>
                  <input required value={form.name} onChange={(e) => update("name", e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Série *</label>
              <select required value={form.series} onChange={(e) => update("series", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecione...</option>
                {["6º Ano", "7º Ano", "8º Ano", "9º Ano", "1ª Série EM", "2ª Série EM", "3ª Série EM"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Turma *</label>
              <select required value={form.class} onChange={(e) => update("class", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecione...</option>
                {["A", "B", "C"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Matrícula *</label>
              <input required value={form.enrollment} onChange={(e) => update("enrollment", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Modalidade *</label>
              <select required value={form.modality} onChange={(e) => update("modality", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="technical">Ensino Técnico</option>
                <option value="integral">Ensino Integral</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Limite de Saídas/Semana</label>
              <input type="number" value={form.exitLimit} onChange={(e) => update("exitLimit", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground">Ficha Médica</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Tipo Sanguíneo</label>
              <select value={form.bloodType} onChange={(e) => update("bloodType", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Não informado</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 block">Alergias / Restrições</label>
              <input value={form.allergies} onChange={(e) => update("allergies", e.target.value)}
                placeholder="Ex: Amendoim, Lactose, Asma"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="sm:col-span-3">
              <label className="text-sm font-medium text-foreground mb-1 block">Observações Médicas Adicionais</label>
              <textarea value={form.medicalNotes} onChange={(e) => update("medicalNotes", e.target.value)}
                rows={3}
                placeholder="Informações relevantes para primeiros socorros..."
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Dados do Responsável</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 block">Nome do Responsável</label>
              <input value={form.guardianName} onChange={(e) => update("guardianName", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Telefone (WhatsApp)</label>
              <input placeholder="75988880001" value={form.guardianPhone} onChange={(e) => update("guardianPhone", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Parentesco</label>
              <select value={form.guardianRelation} onChange={(e) => update("guardianRelation", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecione...</option>
                {["Mãe", "Pai", "Avó", "Avô", "Tio(a)", "Outro"].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <input type="checkbox" id="whatsapp" checked={form.whatsappEnabled}
                onChange={(e) => update("whatsappEnabled", e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring" />
              <label htmlFor="whatsapp" className="text-sm text-foreground">Receber notificações via WhatsApp</label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="rounded-lg border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={mutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
            <Save className="h-4 w-4" /> {mutation.isPending ? "Salvando..." : "Salvar Aluno"}
          </button>
        </div>
      </form>
    </div>
  );
}
