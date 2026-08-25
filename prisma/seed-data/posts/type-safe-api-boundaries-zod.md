TypeScript types vanish at runtime — and runtime is exactly where the untrusted data lives. Every API boundary in a TypeScript app is a place where your carefully-modelled types meet a `JSON.parse` result that could be anything. Zod closes that gap, and used with a little discipline, it becomes the backbone of your API architecture rather than just a validation library.

## One schema, both directions

The core move: define the schema once, derive the type from it, and let both the client and server import the same definition.

```ts
// lib/schemas/contact.ts
import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  email: z.email('Please enter a valid email address'),
  company: z.string().trim().max(120).optional(),
  subject: z.string().trim().min(3).max(150),
  budget: z.string().max(50).optional(),
  message: z.string().trim().min(20, 'Tell me a bit more — 20 characters minimum').max(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;
```

The error messages live *in* the schema. That means the API and the form can't disagree about what valid means, and the copy the user sees is written once.

## The route handler pattern

Every handler follows the same three-line prologue — parse, branch, proceed with a *typed* value:

```ts
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { ok: false, errors: z.flattenError(parsed.error).fieldErrors },
      { status: 422 }
    );
  }

  // parsed.data is ContactInput — trusted from here on
  await db.contactMessage.create({ data: parsed.data });
  return Response.json({ ok: true });
}
```

Two habits worth engraving:

- **`safeParse`, never `parse`, at boundaries.** Throwing on bad input turns user mistakes into 500s and log noise.
- **`.catch(() => null)` on `req.json()`.** Malformed JSON is a client error, not an exception. `null` fails validation with a clean 422 like everything else.

The flattened `fieldErrors` shape — `{ email: ['Please enter…'] }` — maps directly onto form fields, so the client renders server-side errors with zero translation.

## Coercion at the edges

Query strings and form data arrive as strings. Instead of sprinkling `Number(...)` casts around, put the coercion in the schema, where it's validated:

```ts
const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(12),
  category: z.enum(['WEB_APP', 'SAAS', 'ECOMMERCE', 'CRM', 'API', 'OPEN_SOURCE']).optional(),
  q: z.string().trim().max(100).optional(),
});

const query = listQuery.parse(Object.fromEntries(new URL(req.url).searchParams));
```

Note `.max(50)` on `perPage`: validation is also where you enforce resource limits. A pagination parameter without an upper bound is a self-inflicted denial-of-service endpoint.

## Don't trust your own database blindly either

JSON columns are boundaries too. A `Json` field holding "the AI brief" or "site settings" is exactly as untyped as a request body, so give it a schema and parse on read:

```ts
const settingsSchema = z.object({
  availability: z.enum(['AVAILABLE', 'LIMITED', 'UNAVAILABLE']).default('AVAILABLE'),
  responseTime: z.string().default('Within 24 hours'),
  socials: z.record(z.string(), z.url()).default({}),
});

export function readSettings(raw: unknown) {
  const parsed = settingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : settingsSchema.parse({});
}
```

The `.default()` calls mean a partially-written or older-shaped row degrades to sensible values instead of crashing a page. Schema evolution becomes additive rather than a migration fire drill.

## Where the boundary is — and isn't

Validate at *trust* boundaries: HTTP handlers, webhook receivers, queue consumers, JSON columns, third-party API responses. Don't re-validate between your own functions — that's what the type system is for. One parse at the edge, typed values everywhere inside.

The payoff compounds: forms and API can't drift, invalid states are rejected with messages a human can act on, resource limits live next to the fields they protect, and `z.infer` means there is no second, hand-written type to fall out of sync. The schema *is* the contract.
