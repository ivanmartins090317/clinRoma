export const metadata = { title: "Estoque" };

export default function EstoquePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-zinc-200 bg-white p-8">
      <h2 className="text-2xl font-semibold">Estoque e insumos</h2>
      <p className="text-zinc-600">
        Cadastro via foto da planilha de compra, QR code por pacote e alertas no
        painel para todos os usuários.
      </p>
      <ul className="list-inside list-disc text-sm text-zinc-600">
        <li>Tipos: unitário, caixa, rolo, frasco</li>
        <li>Críticos + grande porte + próteses</li>
        <li>Scan em /estoque/scan para retirada</li>
      </ul>
      <p className="text-sm text-zinc-500">Módulo em implementação.</p>
    </div>
  );
}
