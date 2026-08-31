export const TOOL_MANIFEST = [
  {
    name: "propose_premise",
    page: "ruling-room",
    readOnly: false,
    takes: "what must be absent, or what must stay under a number",
  },
  { name: "check_item", page: "ruling-room", readOnly: false, takes: "one dish or product" },
  { name: "check_place", page: "ruling-room", readOnly: false, takes: "a whole menu" },
  { name: "get_board", page: "ruling-room", readOnly: true, takes: "nothing; returns what is on the board" },
  { name: "freeze_check", page: "ruling-room", readOnly: false, takes: "a ruling, saved as a dated record" },
  { name: "get_label_facts", page: "evidence", readOnly: true, takes: "a GTIN; returns the panel as filed" },
  { name: "check_here", page: "evidence", readOnly: false, takes: "the subject on this page" },
] as const;

export const TOOL_BUDGETS = { name: 30, description: 500, parameterDescription: 150, outputBytes: 1536 } as const;
