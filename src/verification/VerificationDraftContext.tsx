import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { submitCitizenVerification } from "../auth/api";
import type { IdDocumentType, VerificationSubmitBody } from "../auth/types";

export type VerificationDraft = {
  fullName: string;
  idNumber: string;
  idDocumentType: IdDocumentType;
  /** Public URL in Supabase `crime-media` after upload */
  idDocumentUrl: string | null;
  street: string;
  city: string;
  zip: string;
  phone: string;
};

const defaultDraft: VerificationDraft = {
  fullName: "",
  idNumber: "",
  idDocumentType: "national_id",
  idDocumentUrl: null,
  street: "",
  city: "",
  zip: "",
  phone: "",
};

type Ctx = {
  draft: VerificationDraft;
  setDraft: React.Dispatch<React.SetStateAction<VerificationDraft>>;
  resetDraft: () => void;
  submit: () => Promise<void>;
  submitting: boolean;
  submitError: string | null;
};

const VerificationDraftContext = createContext<Ctx | null>(null);

export function VerificationDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<VerificationDraft>(defaultDraft);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetDraft = useCallback(() => {
    setDraft(defaultDraft);
    setSubmitError(null);
  }, []);

  const submit = useCallback(async () => {
    setSubmitError(null);
    const body: VerificationSubmitBody = {
      idDocumentType: draft.idDocumentType,
      idDocumentUrl: draft.idDocumentUrl ?? undefined,
      applicant: {
        fullName: draft.fullName.trim(),
        idNumber: draft.idNumber.trim(),
        address: {
          street: draft.street.trim(),
          city: draft.city.trim(),
          zip: draft.zip.trim(),
        },
        phone: draft.phone.trim() || undefined,
      },
    };
    setSubmitting(true);
    try {
      await submitCitizenVerification(body);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Submission failed";
      setSubmitError(msg);
      throw e;
    } finally {
      setSubmitting(false);
    }
  }, [draft]);

  const value = useMemo(
    () => ({ draft, setDraft, resetDraft, submit, submitting, submitError }),
    [draft, resetDraft, submit, submitting, submitError]
  );

  return <VerificationDraftContext.Provider value={value}>{children}</VerificationDraftContext.Provider>;
}

export function useVerificationDraft() {
  const ctx = useContext(VerificationDraftContext);
  if (!ctx) throw new Error("useVerificationDraft must be used within VerificationDraftProvider");
  return ctx;
}
