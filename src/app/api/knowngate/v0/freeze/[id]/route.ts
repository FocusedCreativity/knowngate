import { getFreeze } from "@/lib/knowngate/api";
import { routeError } from "@/lib/knowngate/http";
import { ContractError, isFreezeId } from "@/lib/knowngate/validation";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!isFreezeId(id)) throw new ContractError("Freeze ID is invalid", "invalid_freeze_id", "id");
    const record = await getFreeze(id);
    return record ? Response.json(record) : Response.json({ error: { code: "not_found", message: "Frozen check was not found" } }, { status: 404 });
  } catch (error) { return routeError(error); }
}
