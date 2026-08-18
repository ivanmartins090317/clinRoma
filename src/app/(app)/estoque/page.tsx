import { getModuleAccess } from "@/lib/auth/roles";
import { requireAuthSession } from "@/lib/auth/session";
import {
  getSupplyDetail,
  listSupplies,
  listSuppliesForSelect,
} from "@/features/stock/queries";
import { StockPageShell } from "@/features/stock/components/stock-page-shell";

export const metadata = { title: "Estoque" };

interface EstoquePageProps {
  searchParams: Promise<{
    id?: string;
    novo?: string;
    compra?: string;
  }>;
}

export default async function EstoquePage({ searchParams }: EstoquePageProps) {
  const params = await searchParams;
  const session = await requireAuthSession("/estoque");
  const role = session.profile.role;

  const [supplies, supplyOptions, selectedSupply] = await Promise.all([
    listSupplies(),
    listSuppliesForSelect(),
    params.id ? getSupplyDetail(params.id) : Promise.resolve(null),
  ]);

  const canManage = getModuleAccess(role, "stock") === "write";
  const canRegisterPurchase = role === "admin" || role === "room_assistant";
  const canScan = getModuleAccess(role, "stock-scan") === "write";

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">
          Estoque e insumos
        </h2>
        <p className="mt-2 text-muted-foreground">
          Cadastro, planilha de compra, pacotes com QR e alertas de reposição.
        </p>
      </section>

      <StockPageShell
        supplies={supplies}
        selectedSupply={selectedSupply}
        supplyOptions={supplyOptions}
        canManage={canManage}
        canRegisterPurchase={canRegisterPurchase}
        canScan={canScan}
        showNewForm={params.novo === "1" && canManage}
        showPurchaseWizard={params.compra === "1" && canRegisterPurchase}
      />
    </div>
  );
}
