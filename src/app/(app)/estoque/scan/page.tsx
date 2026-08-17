export const metadata = { title: "Scan QR" };

export default function EstoqueScanPage() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-zinc-200 bg-white p-8 text-center">
      <h2 className="text-2xl font-semibold">Scan QR · retirada</h2>
      <p className="mt-3 text-zinc-600">
        Auxiliar de sala escaneia o QR do pacote e confirma a baixa no estoque.
      </p>
      <div className="mx-auto mt-8 flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500">
        Câmera / leitor
        <br />
        (em breve)
      </div>
    </div>
  );
}
