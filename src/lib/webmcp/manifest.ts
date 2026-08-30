export const TOOL_MANIFEST = [
  { name: "propose_premise", page: "ruling-room", readOnly: false },
  { name: "check_item", page: "ruling-room", readOnly: false },
  { name: "check_place", page: "ruling-room", readOnly: false },
  { name: "get_board", page: "ruling-room", readOnly: true },
  { name: "freeze_check", page: "ruling-room", readOnly: false },
  { name: "get_label_facts", page: "evidence", readOnly: true },
  { name: "check_here", page: "evidence", readOnly: false },
] as const;

export const TOOL_BUDGETS = { name: 30, description: 500, parameterDescription: 150, outputBytes: 1536 } as const;
