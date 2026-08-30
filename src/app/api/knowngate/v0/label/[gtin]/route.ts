import { getLabel } from "@/lib/knowngate/api";
import { routeError } from "@/lib/knowngate/http";
import { ContractError } from "@/lib/knowngate/validation";

export async function GET(_request: Request, context: { params: Promise<{ gtin: string }> }) {
  try {
    const { gtin } = await context.params;
    if (!/^\d{8,14}$/.test(gtin)) throw new ContractError("GTIN is invalid", "invalid_gtin", "gtin");
    const label = await getLabel(gtin);
    return label ? Response.json(label) : Response.json({ error: { code: "not_found", message: "Label was not found" } }, { status: 404 });
  } catch (error) { return routeError(error); }
}
