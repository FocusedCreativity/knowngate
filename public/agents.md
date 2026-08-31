# Agents

Markdown mirror of https://www.knowngate.com/agents.

KnownGate answers one question: does this food conflict with this premise?

## Three ways in

- **WebMCP**: open https://www.knowngate.com/check and the page registers its tools in your model context. No key needed.
- **MCP**: `https://www.knowngate.com/api/knowngate/v0/mcp`. Tools: `check_item`, `check_venue`, `check_plan`, `register`. A free key is required for the check tools; your agent creates one with `register`, without leaving MCP.
- **REST**: `POST /api/knowngate/v0/check_item`, `check_venue`, `check_plan`; `GET /v0/stats`, `/v0/questions`, `/v0/corpus`; `POST /v0/keys`.

## Get a key

```
POST /api/knowngate/v0/keys
{ "agent_name": "cardia-meal-agent", "contact_email": "team@cardia.app" }
```

Returns `201 Created` with the key in the body. One key per email, rate limited per IP, free tier. There is no confirmation click.

## How to read a verdict

Four values, and only four: `no_conflict_found`, `conflict_found`, `ask_one_question`, `couldnt_verify`. Two of them are not answers, and they are the ones that make the other two worth anything.

- Unknown counts as no. Fail closed is the construction, not a setting.
- "May contain" blocks a clear. An advisory line cannot produce `no_conflict_found` for the allergen it names.
- KnownGate never says "safe". The word is not a valid rendering of any of the four values. Do not introduce it in your own copy.

Keep the verdict name, the source, the read date, and every `must_not_omit` line when you relay a result.
