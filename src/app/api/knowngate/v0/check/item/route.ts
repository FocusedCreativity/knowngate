import { checkItem } from "@/lib/knowngate/api";
import { readJson, routeError } from "@/lib/knowngate/http";
import { parseCheckItemRequest } from "@/lib/knowngate/validation";

export async function POST(request: Request) {
  try { return Response.json(await checkItem(parseCheckItemRequest(await readJson(request)))); }
  catch (error) { return routeError(error); }
}
