"use server";

import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";
import { StaffRole, defaultCanApprove } from "@/lib/roles";

export interface TeamMemberDTO {
  id: string;
  name: string;
  role: StaffRole;
  can_approve_cancellations: boolean;
  is_active: boolean;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

async function getEstablishmentId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("establishments")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (error || !data) throw new Error("Establishment not found");
  return data.id;
}

function validatePin(pin: string) {
  if (!/^\d{4}$/.test(pin)) throw new Error("PIN must be exactly 4 digits");
}

function mapRow(row: {
  id: string;
  name: string;
  role: string;
  can_approve_cancellations: boolean;
  is_active: boolean;
}): TeamMemberDTO {
  return {
    id: row.id,
    name: row.name,
    role: row.role as StaffRole,
    can_approve_cancellations: row.can_approve_cancellations,
    is_active: row.is_active,
  };
}

// ─── actions ─────────────────────────────────────────────────────────────────

export async function listTeamMembers(): Promise<TeamMemberDTO[]> {
  const supabase = await createClient();
  const establishmentId = await getEstablishmentId();

  const { data, error } = await supabase
    .from("team_members")
    .select("id, name, role, can_approve_cancellations, is_active")
    .eq("establishment_id", establishmentId)
    .order("role")
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function createTeamMember(input: {
  name: string;
  role: StaffRole;
  pin: string;
  canApproveCancellations?: boolean;
}): Promise<TeamMemberDTO> {
  validatePin(input.pin);
  const supabase = await createClient();
  const establishmentId = await getEstablishmentId();

  const pinHash = await bcrypt.hash(input.pin, 10);
  const canApprove =
    input.canApproveCancellations ?? defaultCanApprove(input.role);

  const { data, error } = await supabase
    .from("team_members")
    .insert({
      establishment_id: establishmentId,
      name: input.name.trim(),
      role: input.role,
      pin_hash: pinHash,
      can_approve_cancellations: canApprove,
    })
    .select("id, name, role, can_approve_cancellations, is_active")
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data);
}

export async function updateTeamMember(
  id: string,
  input: {
    name?: string;
    role?: StaffRole;
    pin?: string;
    canApproveCancellations?: boolean;
    isActive?: boolean;
  },
): Promise<TeamMemberDTO> {
  if (input.pin) validatePin(input.pin);
  const supabase = await createClient();
  const establishmentId = await getEstablishmentId();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.role !== undefined) updates.role = input.role;
  if (input.pin) updates.pin_hash = await bcrypt.hash(input.pin, 10);
  if (input.canApproveCancellations !== undefined)
    updates.can_approve_cancellations = input.canApproveCancellations;
  if (input.isActive !== undefined) updates.is_active = input.isActive;

  const { data, error } = await supabase
    .from("team_members")
    .update(updates)
    .eq("id", id)
    .eq("establishment_id", establishmentId)
    .select("id, name, role, can_approve_cancellations, is_active")
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data);
}

export async function deleteTeamMember(id: string): Promise<void> {
  const supabase = await createClient();
  const establishmentId = await getEstablishmentId();

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", id)
    .eq("establishment_id", establishmentId);

  if (error) throw new Error(error.message);
}

export async function loginStaffWithPin(
  pin: string,
): Promise<
  | { ok: true; member: TeamMemberDTO }
  | { ok: false; reason: "invalid" | "no_establishment" }
> {
  if (!/^\d{4}$/.test(pin)) return { ok: false, reason: "invalid" };

  const supabase = await createClient();
  let establishmentId: string;
  try {
    establishmentId = await getEstablishmentId();
  } catch {
    return { ok: false, reason: "no_establishment" };
  }

  const { data: members, error } = await supabase
    .from("team_members")
    .select("id, name, role, pin_hash, can_approve_cancellations, is_active")
    .eq("establishment_id", establishmentId)
    .eq("is_active", true);

  if (error || !members) return { ok: false, reason: "invalid" };

  for (const member of members) {
    const match = await bcrypt.compare(pin, member.pin_hash);
    if (match) {
      return {
        ok: true,
        member: mapRow(member),
      };
    }
  }

  return { ok: false, reason: "invalid" };
}

export async function verifyApprovalPin(
  pin: string,
): Promise<
  { ok: true; approverName: string; approverRole: StaffRole } | { ok: false }
> {
  if (!/^\d{4}$/.test(pin)) return { ok: false };

  const supabase = await createClient();
  let establishmentId: string;
  try {
    establishmentId = await getEstablishmentId();
  } catch {
    return { ok: false };
  }

  const { data: members, error } = await supabase
    .from("team_members")
    .select("id, name, role, pin_hash, can_approve_cancellations, is_active")
    .eq("establishment_id", establishmentId)
    .eq("is_active", true)
    .eq("can_approve_cancellations", true);

  if (error || !members) return { ok: false };

  for (const member of members) {
    const match = await bcrypt.compare(pin, member.pin_hash);
    if (match) {
      return {
        ok: true,
        approverName: member.name,
        approverRole: member.role as StaffRole,
      };
    }
  }

  return { ok: false };
}

export async function getTeamCountsByRole(): Promise<
  Record<StaffRole, number>
> {
  const supabase = await createClient();
  const establishmentId = await getEstablishmentId();

  const { data, error } = await supabase
    .from("team_members")
    .select("role")
    .eq("establishment_id", establishmentId)
    .eq("is_active", true);

  const counts: Record<StaffRole, number> = {
    admin: 0,
    jefe_de_piso: 0,
    jefe_de_barra: 0,
    mesero: 0,
  };

  if (!error && data) {
    for (const row of data) {
      const role = row.role as StaffRole;
      if (role in counts) counts[role]++;
    }
  }

  return counts;
}
