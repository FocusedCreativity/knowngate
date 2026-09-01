# Publishing to the MCP Registry

Steps verified against the official quickstart and the remote-server guide on
2026-09-01. The registry is in preview, so re-read the docs before running
these if much time has passed.

KnownGate is a **remote** server. The npm-package steps in the quickstart do
not apply: the registry hosts metadata, and our artifact is a live endpoint,
not a package.

## Before publishing

`server.json` at the repo root is the manifest. It is already written and
validated against
`https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json`.

Two constraints worth knowing, because both have already caught us:

- **`description` is capped at 100 characters.** The canonical KnownGate
  sentence is 217, so the manifest carries a shortened form and keeps the full
  sentence in `_meta` as `fullDescription`. Shorten it, never reword it.
- **The name must match the auth method.** GitHub login only permits
  `io.github.<owner>/*`, which is why the name is
  `io.github.FocusedCreativity/knowngate`.

## Steps

1. Install the CLI:

   ```bash
   brew install mcp-publisher
   ```

2. Authenticate. This is what proves the `io.github.*` namespace is ours, so
   log in as the account that owns the repository:

   ```bash
   mcp-publisher login github
   ```

   It prints a device code and a URL to enter it at.

3. Publish from the repo root, where `server.json` is:

   ```bash
   mcp-publisher publish
   ```

4. Confirm it landed:

   ```bash
   curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.FocusedCreativity/knowngate"
   ```

## What publishing means

Entries propagate to directories that mirror the registry, and a mirrored
entry cannot be retracted. Publish only what is true at the moment of
publishing, and only when the endpoint answers cleanly:

```bash
curl -s -X POST https://mcp.knowngate.com/ \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

That is also why the published endpoint is the subdomain and not
`/api/knowngate/v0/mcp`: the versioned path would put `v0` into every mirror,
where it could never be corrected.

## Other directories

The official registry is the propagation root; most directories mirror it.
The rest take a pull request or a form, and each one is a separate decision:

- awesome-mcp-servers (punkpeye): PR, one line, follow CONTRIBUTING
- Glama: auto-indexes public repos; claim the listing to control metadata
- PulseMCP: "Add server" form, submitted in a browser
- mcp.so: submit form
- Smithery: connect the repo, confirm it lists as remote HTTP rather than stdio

Listing copy lives in `server.json` and the server card, so those two stay the
source of truth for every listing.
