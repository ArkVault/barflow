"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/hooks/use-language";
import { ROLE_LABELS, StaffRole } from "@/lib/roles";
import {
  listTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getTeamCountsByRole,
  TeamMemberDTO,
} from "@/lib/team/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Users,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";

const ROLES: StaffRole[] = ["admin", "jefe_de_piso", "jefe_de_barra", "mesero"];

const roleBadgeColor: Record<StaffRole, string> = {
  admin:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  jefe_de_piso:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  jefe_de_barra:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  mesero:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

interface FormState {
  name: string;
  role: StaffRole;
  pin: string;
  pinConfirm: string;
  canApproveCancellations: boolean;
}

const emptyForm = (): FormState => ({
  name: "",
  role: "mesero",
  pin: "",
  pinConfirm: "",
  canApproveCancellations: false,
});

export default function TeamManagement() {
  const { language } = useLanguage();
  const es = language === "es";

  const [members, setMembers] = useState<TeamMemberDTO[]>([]);
  const [counts, setCounts] = useState<Record<StaffRole, number>>({
    admin: 0,
    jefe_de_piso: 0,
    jefe_de_barra: 0,
    mesero: 0,
  });
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, c] = await Promise.all([
        listTeamMembers(),
        getTeamCountsByRole(),
      ]);
      setMembers(m);
      setCounts(c);
    } catch {
      toast.error(es ? "Error al cargar el equipo" : "Error loading team");
    } finally {
      setLoading(false);
    }
  }, [es]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (member: TeamMemberDTO) => {
    setEditingId(member.id);
    setForm({
      name: member.name,
      role: member.role,
      pin: "",
      pinConfirm: "",
      canApproveCancellations: member.can_approve_cancellations,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!form.name.trim()) {
      setFormError(es ? "El nombre es requerido" : "Name is required");
      return;
    }
    if (!editingId) {
      // Creating: PIN required
      if (!/^\d{4}$/.test(form.pin)) {
        setFormError(
          es ? "El PIN debe ser de 4 dígitos" : "PIN must be 4 digits",
        );
        return;
      }
      if (form.pin !== form.pinConfirm) {
        setFormError(es ? "Los PINs no coinciden" : "PINs do not match");
        return;
      }
    } else if (form.pin) {
      // Editing with PIN rotation
      if (!/^\d{4}$/.test(form.pin)) {
        setFormError(
          es
            ? "El nuevo PIN debe ser de 4 dígitos"
            : "New PIN must be 4 digits",
        );
        return;
      }
      if (form.pin !== form.pinConfirm) {
        setFormError(es ? "Los PINs no coinciden" : "PINs do not match");
        return;
      }
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateTeamMember(editingId, {
          name: form.name,
          role: form.role,
          pin: form.pin || undefined,
          canApproveCancellations: form.canApproveCancellations,
        });
        toast.success(es ? "Miembro actualizado" : "Member updated");
      } else {
        await createTeamMember({
          name: form.name,
          role: form.role,
          pin: form.pin,
          canApproveCancellations: form.canApproveCancellations,
        });
        toast.success(es ? "Miembro creado" : "Member created");
      }
      setDialogOpen(false);
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (member: TeamMemberDTO) => {
    try {
      await updateTeamMember(member.id, { isActive: !member.is_active });
      toast.success(
        es
          ? member.is_active
            ? "Miembro desactivado"
            : "Miembro activado"
          : member.is_active
            ? "Member deactivated"
            : "Member activated",
      );
      await load();
    } catch {
      toast.error(es ? "Error al actualizar" : "Error updating member");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteTeamMember(deleteId);
      toast.success(es ? "Miembro eliminado" : "Member deleted");
      setDeleteId(null);
      await load();
    } catch {
      toast.error(es ? "Error al eliminar" : "Error deleting member");
    } finally {
      setDeleting(false);
    }
  };

  const totalMembers = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2
          className="text-4xl font-bold mb-2"
          style={{ fontFamily: "Satoshi, sans-serif" }}
        >
          {es ? "Equipo" : "Team"}
        </h2>
        <p className="text-muted-foreground">
          {es
            ? "Gestiona los miembros de tu equipo y sus accesos"
            : "Manage your team members and their access"}
        </p>
      </div>

      {/* Role count cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROLES.map((r) => (
          <div
            key={r}
            className="rounded-2xl border border-border/50 bg-muted/30 px-4 py-3 text-center"
          >
            <p className="text-2xl font-bold">{counts[r]}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {ROLE_LABELS[r][es ? "es" : "en"]}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground -mt-4">
        <Users className="inline h-3.5 w-3.5 mr-1" />
        {es
          ? `${totalMembers} miembro${totalMembers !== 1 ? "s" : ""} activo${totalMembers !== 1 ? "s" : ""} en total — el plan escala con el tamaño del equipo`
          : `${totalMembers} active member${totalMembers !== 1 ? "s" : ""} total — plan scales with team size`}
      </p>

      {/* Add button */}
      <div className="flex justify-end">
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {es ? "Agregar miembro" : "Add member"}
        </Button>
      </div>

      {/* Members list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {es ? "Sin miembros de equipo" : "No team members yet"}
          </p>
          <p className="text-sm mt-1">
            {es
              ? "Agrega meseros, jefes de barra y más"
              : "Add servers, bar managers and more"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition-opacity ${
                member.is_active
                  ? "border-border/50 bg-background"
                  : "border-border/30 bg-muted/20 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div>
                  <p className="font-medium text-sm truncate">{member.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeColor[member.role]}`}
                    >
                      {ROLE_LABELS[member.role][es ? "es" : "en"]}
                    </span>
                    {member.can_approve_cancellations && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                        <ShieldCheck className="h-3 w-3" />
                        {es ? "Aprueba cancelaciones" : "Approves cancels"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleToggleActive(member)}
                  title={
                    member.is_active
                      ? es
                        ? "Desactivar"
                        : "Deactivate"
                      : es
                        ? "Activar"
                        : "Activate"
                  }
                  className="h-8 w-8 rounded-lg inline-flex items-center justify-center hover:bg-muted transition-colors"
                >
                  {member.is_active ? (
                    <ToggleRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => openEdit(member)}
                  title={es ? "Editar" : "Edit"}
                  className="h-8 w-8 rounded-lg inline-flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteId(member.id)}
                  title={es ? "Eliminar" : "Delete"}
                  className="h-8 w-8 rounded-lg inline-flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? es
                  ? "Editar miembro"
                  : "Edit member"
                : es
                  ? "Agregar miembro"
                  : "Add member"}
            </DialogTitle>
            <DialogDescription>
              {es
                ? "El PIN de 4 dígitos es la contraseña del turno en el dispositivo"
                : "The 4-digit PIN is the shift password on the device"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {es ? "Nombre" : "Name"}
              </label>
              <Input
                placeholder={es ? "Nombre completo" : "Full name"}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {es ? "Rol" : "Role"}
              </label>
              <Select
                value={form.role}
                onValueChange={(v) => {
                  const r = v as StaffRole;
                  setForm({
                    ...form,
                    role: r,
                    canApproveCancellations: r !== "mesero",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r][es ? "es" : "en"]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* PIN */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {editingId
                  ? es
                    ? "Nuevo PIN (dejar vacío para no cambiar)"
                    : "New PIN (leave blank to keep current)"
                  : es
                    ? "PIN de 4 dígitos"
                    : "4-digit PIN"}
              </label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="• • • •"
                value={form.pin}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pin: e.target.value.replace(/\D/g, "").slice(0, 4),
                  })
                }
                className="font-mono tracking-widest"
              />
            </div>

            {/* PIN confirm — only when PIN is entered */}
            {(!editingId || form.pin) && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {es ? "Confirmar PIN" : "Confirm PIN"}
                </label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="• • • •"
                  value={form.pinConfirm}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      pinConfirm: e.target.value.replace(/\D/g, "").slice(0, 4),
                    })
                  }
                  className="font-mono tracking-widest"
                />
              </div>
            )}

            {/* Approve cancellations toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.canApproveCancellations}
                onChange={(e) =>
                  setForm({
                    ...form,
                    canApproveCancellations: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded"
              />
              <span className="text-sm">
                {es
                  ? "Puede aprobar cancelaciones de meseros"
                  : "Can approve server cancellations"}
              </span>
            </label>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              {es ? "Cancelar" : "Cancel"}
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : es ? (
                "Guardar"
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {es ? "¿Eliminar miembro?" : "Delete member?"}
            </DialogTitle>
            <DialogDescription>
              {es
                ? "Esta acción es permanente y no se puede deshacer."
                : "This action is permanent and cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              {es ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : es ? (
                "Eliminar"
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
