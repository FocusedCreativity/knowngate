import { checkPlace } from "@/lib/knowngate/api";
import { readJson, routeError } from "@/lib/knowngate/http";
import { parseCheckPlaceRequest } from "@/lib/knowngate/validation";

export async function POST(request: Request) {
  try { return Response.json(await checkPlace(parseCheckPlaceRequest(await readJson(request)))); }
  catch (error) { return routeError(error); }
}
