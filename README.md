# KnownGate

KnownGate is the food verification layer for people and AI agents: it checks
food against what must not be in it, or a number it must stay under, and
returns evidence-backed verdicts with their sources and read dates.

## MCP endpoint

```
https://mcp.knowngate.com
```

Streamable HTTP and SSE. The versioned path
`https://www.knowngate.com/api/knowngate/v0/mcp` serves the same server and
stays documented, but the subdomain is the address to configure: it does not
bake a version number into anything you publish.

- Server card: <https://www.knowngate.com/.well-known/mcp/server-card.json>
- Evidence standard: <https://www.knowngate.com/standard> and, as a document
  you can build against, <https://www.knowngate.com/standard/v1.json>
- For agents: <https://www.knowngate.com/llms.txt>

**Authentication.** A Bearer key, and a free one is created in-band with the
`register` tool. There is no signup to call this.

## Tools

| Tool | Rules on |
| --- | --- |
| `check_item` | One product or dish |
| `check_venue` | A whole menu |
| `check_plan` | A set of items, a recipe, a basket |
| `register` | Mints a free key, in-band |

## Verdicts

Every check returns exactly one of four, with the source it rested on and the
date that source was read:

`no_conflict_found` · `conflict_found` · `ask_one_question` · `couldnt_verify`

Unknown counts as no. A claim can create a conflict but never a clear. The word
"safe" is not used anywhere in this system. What each verdict means, and the
highest verdict each kind of source can reach, is published in full at
[/standard](https://www.knowngate.com/standard).

Verdicts are not cryptographically signed in v1.0, and the profile says so
(`signed_verdicts: false`). A saved record at `/ck/{id}` is the durable
artifact: it carries the subject, the premise, the verdict, its source and read
date, and the standard version it was issued under.

## Licensing

- **Code:** MIT.
- **Evidence standard** (`/standard`, `/standard/v1.json`): **CC-BY-4.0**. Take
  it and build on it. A standard others build against is worth more to us than
  a database others cannot see.

## Project artifacts

- [KnownGate challenge brief](docs/challenge-brief.md): project context, challenge requirements, product direction, WebMCP contract, judging strategy, and open decisions captured on 30 August 2026.
- [KnownGate build brief](docs/build-brief.md): implementation requirements, product doctrine, screens, design system, WebMCP tools, API contracts, fixtures, evaluations, and delivery criteria.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
