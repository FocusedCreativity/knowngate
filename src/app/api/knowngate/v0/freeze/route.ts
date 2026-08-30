import { createFreeze } from "@/lib/knowngate/api";
import { readJson, routeError } from "@/lib/knowngate/http";
import { parseFreezeRequest } from "@/lib/knowngate/validation";

export async function POST(request: Request) {
  try { return Response.json(await createFreeze(parseFreezeRequest(await readJson(request))), { status: 201 }); }
  catch (error) { return routeError(error); }
}
