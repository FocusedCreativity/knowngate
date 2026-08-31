# Developers

Markdown mirror of https://www.knowngate.com/developers.

## Quickstart

MCP, key in the server config:

```json
{ "mcpServers": { "knowngate": {
  "url": "https://mcp.knowngate.com",
  "headers": { "Authorization": "Bearer kg_live_…" }
} } }
```

REST:

```
curl https://www.knowngate.com/api/knowngate/v0/check_item \
  -H "Authorization: Bearer kg_live_…" \
  -d '{"subject":{"kind":"upc","value":"0001111004969"},
       "restrictions":["peanut"],
       "thresholds":[{"nutrient":"sodium","max":600,"unit":"mg","basis":"per_serving"}]}'
```

## How to render this correctly

| Rule | Why |
| --- | --- |
| Pass verdicts through unchanged | A model summarising four verdicts tends to collapse them into two. The casualty is always "couldn't verify". |
| Never render any verdict as "safe" | The word is not used anywhere in this system and is not a valid rendering of any of the four. |
| Never drop must_not_omit items | If your summary does not mention them, it is wrong. |
| Always show the date | A verdict is a statement about a date. Undated, it is worth nothing. |
| Render summary_line verbatim where you can | It is canonical, and it is counts rather than judgement. |

## What we do not offer yet

- No guarantee, on any tier.
- No SDKs. MCP and REST only.
- No uptime history. We launched on 30 August 2026.
- No numeric premise outside beta.
