"use client";

import { useState } from "react";

import { CollaboratorRow } from "@/features/team/components/collaborator-row";
import type { CollaboratorListItem } from "@/features/team/queries";

interface CollaboratorListProps {
  collaborators: CollaboratorListItem[];
  currentUserId: string;
}

interface Feedback {
  message?: string;
  error?: string;
}

export function CollaboratorList({
  collaborators,
  currentUserId,
}: CollaboratorListProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  if (collaborators.length === 0) {
    return (
      <p className="rounded-(--radius) border border-[#f0e3db] bg-neo-white p-5 text-[14.5px] text-muted-foreground shadow-neo">
        Nenhum colaborador cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {feedback?.error ? (
        <p role="alert" className="text-sm text-priority-red">
          {feedback.error}
        </p>
      ) : null}
      {feedback?.message ? (
        <p role="status" className="text-sm text-priority-green">
          {feedback.message}
        </p>
      ) : null}

      <ul className="overflow-hidden rounded-(--radius) border border-[#f0e3db] bg-neo-white shadow-neo">
        {collaborators.map((collaborator) => (
          <CollaboratorRow
            key={collaborator.id}
            collaborator={collaborator}
            isCurrentUser={collaborator.id === currentUserId}
            onFeedback={setFeedback}
          />
        ))}
      </ul>
    </div>
  );
}
