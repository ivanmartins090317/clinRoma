export const metadata = { title: "Pacientes" };

export default function PacientesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-zinc-200 bg-white p-8">
      <h2 className="text-2xl font-semibold">Pacientes e prontuário</h2>
      <p className="text-zinc-600">
        Anamnese digital (formulário Dr. Fellipe S. Roma), odontograma FDI,
        evolução com foto da etiqueta e áudio transcrito.
      </p>
      <ul className="list-inside list-disc text-sm text-zinc-600">
        <li>Assinatura: checkbox + nome</li>
        <li>Revalidação anamnese: 12 meses</li>
        <li>Storage privado para anexos clínicos</li>
      </ul>
      <p className="text-sm text-zinc-500">Módulo em implementação.</p>
    </div>
  );
}
