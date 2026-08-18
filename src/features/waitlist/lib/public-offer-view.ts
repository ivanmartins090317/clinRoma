import { isSlotOfferExpired } from "@/features/waitlist/domain/slot-offer-expiry";
import {
  formatDentistFirstName,
  formatPartialPatientName,
} from "@/features/waitlist/domain/partial-patient-name";
import { hashSlotOfferToken } from "@/features/waitlist/domain/token-hash";
import { loadOfferByToken } from "@/features/waitlist/lib/accept-slot-offer";
import {
  formatClinicDateTime,
  formatClinicTime,
} from "@/features/agenda/types";

export type PublicOfferPageState =
  "invalid" | "expired" | "already_responded" | "valid";

export interface PublicSlotOfferView {
  state: PublicOfferPageState;
  partialPatientName?: string;
  dentistFirstName?: string;
  offeredAtLabel?: string;
  endsAtLabel?: string;
  expiresAt?: string;
  response?: "accept" | "decline";
}

export async function getPublicSlotOfferView(
  token: string,
): Promise<PublicSlotOfferView> {
  if (!token || token.length < 16) {
    return { state: "invalid" };
  }

  try {
    const offer = await loadOfferByToken(token);

    if (!offer?.waitlist_entries) {
      return { state: "invalid" };
    }

    const supabasePatient = offer.waitlist_entries;
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    const { data: patient } = await supabase
      .from("patients")
      .select("full_name")
      .eq("id", supabasePatient.patient_id)
      .maybeSingle();

    const { data: dentist } = await supabase
      .from("dentists")
      .select("full_name")
      .eq("id", offer.dentist_id)
      .maybeSingle();

    const partialPatientName = formatPartialPatientName(
      patient?.full_name ?? "Paciente",
    );
    const dentistFirstName = formatDentistFirstName(dentist?.full_name);
    const offeredAtLabel = formatClinicDateTime(offer.offered_at);
    const endsAtLabel = formatClinicTime(offer.ends_at);

    if (offer.status === "accepted" || offer.status === "declined") {
      return {
        state: "already_responded",
        partialPatientName,
        dentistFirstName,
        offeredAtLabel,
        endsAtLabel,
        response: offer.status === "accepted" ? "accept" : "decline",
      };
    }

    if (
      offer.status !== "pending" ||
      isSlotOfferExpired(new Date(offer.expires_at))
    ) {
      return {
        state: "expired",
        partialPatientName,
        dentistFirstName,
        offeredAtLabel,
        endsAtLabel,
      };
    }

    return {
      state: "valid",
      partialPatientName,
      dentistFirstName,
      offeredAtLabel,
      endsAtLabel,
      expiresAt: offer.expires_at,
    };
  } catch {
    return { state: "invalid" };
  }
}

// re-export for tests if needed
export { hashSlotOfferToken };
