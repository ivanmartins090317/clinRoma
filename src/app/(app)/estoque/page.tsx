import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Estoque" };

export default function EstoquePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-xl border border-border bg-card p-8">
      <div>
        <h2 className="text-2xl font-semibold">Estoque e insumos</h2>
        <p className="mt-2 text-muted-foreground">
          Cadastro via foto da planilha de compra, QR code por pacote e alertas
          no painel para todos os usuários.
        </p>
      </div>

      <ul className="list-inside list-disc text-sm text-muted-foreground">
        <li>Tipos: unitário, caixa, rolo, frasco</li>
        <li>Críticos + grande porte + próteses</li>
      </ul>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/estoque/scan">Scan QR · retirada</Link>
        </Button>
        <Button variant="outline" disabled>
          Cadastrar insumo
        </Button>
      </div>

      <div className="space-y-2">
        <label htmlFor="estoque-busca" className="text-sm font-medium">
          Buscar insumo (demo shadcn)
        </label>
        <Input
          id="estoque-busca"
          placeholder="Ex.: luva, alginate..."
          disabled
        />
      </div>

      <p className="text-sm text-muted-foreground">Módulo em implementação.</p>
    </div>
  );
}
