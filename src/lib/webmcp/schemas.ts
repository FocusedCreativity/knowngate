export const restrictionsSchema = {
  type: "array", minItems: 1, items: { type: "object", required: ["key"], properties: { key: { type: "string", enum: ["milk", "egg", "fish", "shellfish", "tree_nut", "peanut", "wheat", "soy", "sesame", "other"] }, note: { type: "string", description: "Required when key is other." } } },
};
export const rulingRoomSchemas = {
  propose_premise: { type: "object", required: ["restrictions"], properties: { restrictions: restrictionsSchema, diners: { type: "string", description: "Optional household diners." }, location: { type: "string", description: "Optional location." } } },
  check_item: { type: "object", required: ["subject"], properties: { subject: { type: "object", required: ["kind", "value"], properties: { kind: { type: "string", enum: ["upc", "product_query", "menu_item", "ingredients"] }, value: { type: "string", description: "The product, UPC, menu item, or ingredients." }, venue: { type: "string", description: "Required for menu items." } } } } },
  check_place: { type: "object", required: ["venue"], properties: { venue: { type: "string", description: "Venue or chain name." }, location: { type: "string", description: "Optional location." } } },
  empty: { type: "object", properties: {} },
};
