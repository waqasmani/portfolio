Most React Server Components confusion comes from asking the wrong question. Developers ask *"when does this run?"* — and get tangled in hydration, streaming, and directives. The question that makes RSC click is simpler: **"does this component's output ever need to change without a request?"**

## Two kinds of components, honestly

- A **server component** runs during a request (or at build time) and produces UI *description* — not JavaScript shipped to the browser. It can read the database, the filesystem, secrets. It can never re-render on the client, because it isn't there.
- A **client component** (`'use client'`) is regular React: it ships to the browser, hydrates, and can hold state, effects, and event handlers.

That's the whole model. Everything else — streaming, Suspense, serialization rules — is machinery in service of it.

The litmus test for every component: *if the user never triggers another request, does this UI ever change?* A project card, a blog article, a footer — no. Server component. A search input, a carousel, a chat window — yes. Client component.

## The boundary is a door, not a wall

`'use client'` doesn't mean "this file and below is client-side forever." It marks a **door** in the tree: everything imported *by* a client component becomes client code, but server components can still be passed *through* the door as `children`.

```tsx
// ServerPage.tsx — server component
import { Reveal } from '@/components/reveal';        // client
import { ProjectCard } from '@/components/project-card'; // server

export default async function Page() {
  const projects = await db.project.findMany();
  return (
    <Reveal>
      {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
    </Reveal>
  );
}
```

`Reveal` is a client component that animates its children into view. The project cards it wraps stay server-rendered — their markup is serialized and slotted in, and none of their code ships to the browser. This *children-through-the-door* pattern is the single most useful trick in RSC apps: interactivity at the edges, data-heavy rendering in the middle.

## Push `'use client'` to the leaves

The most common performance mistake is planting the directive too high. One `'use client'` on a page-level component drags every import — markdown renderer, syntax highlighter, date library — into the bundle.

Instead of a client page with a bit of interactivity, build a server page with small client islands:

```
BlogArticle (server: markdown → HTML, syntax highlighting at request time)
├── ReadingProgress (client: 1KB scroll listener)
├── TableOfContents (client: IntersectionObserver highlight)
└── CopyCodeButtons (client: event delegation on the article)
```

The heavy work — parsing markdown, running the highlighter — happens once on the server and ships as HTML. The interactive bits are tiny, purpose-built leaves. This site's blog does exactly this: the highlighter never reaches the browser.

## Serialization is the contract

Props crossing the server→client boundary must survive serialization: plain objects, arrays, strings, numbers, dates — not class instances, functions, or Prisma model objects with hidden prototypes. The practical consequence: **map your database rows to plain view models before passing them down.** It feels like ceremony until the first time it stops a `passwordHash` from riding an object into the client bundle.

```ts
const view = posts.map(({ id, slug, title, excerpt, publishedAt }) =>
  ({ id, slug, title, excerpt, publishedAt: publishedAt.toISOString() }));
```

Explicit picking doubles as a security boundary — you can audit exactly what the browser will ever see.

## When you actually need the client

Don't contort state management to avoid `'use client'` — needing it isn't failure. Forms with validation feedback, optimistic UI, anything with `useState`: client components are the right tool, and React 19's `useActionState` + server actions make the round trip pleasant.

The goal was never "no JavaScript." It's *proportionate* JavaScript: pages that are mostly HTML, sprinkled with exactly the interactivity they need. Once you sort components by "does it change without a request?", the architecture almost draws itself.
