Most slow queries we get called in to look at are not exotic. They are ordinary queries against ordinary tables that grew past the point where sequential scans stay cheap. Here is the mental checklist we run through before reaching for anything clever.

## Start with evidence, not intuition

PostgreSQL will tell you exactly what it is doing — ask it:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders
WHERE customer_id = 4821 AND status = 'PAID'
ORDER BY created_at DESC
LIMIT 20;
```

The three things we read first in the output:

1. **Node type** — `Seq Scan` on a large table under a `LIMIT` usually means a missing index.
2. **Rows expected vs. returned** — a big gap means stale statistics (`ANALYZE` the table) or a data distribution the planner can't see.
3. **Buffers** — `shared read` counts translate directly into disk I/O. Fast queries touch few pages.

`pg_stat_statements` turns this from spot-checking into a habit: sort by `total_exec_time` weekly and the worst offenders reveal themselves.

## The composite index, in the right order

The single most valuable pattern is the multi-column index that matches *equality columns first, then the sort*:

```sql
CREATE INDEX CONCURRENTLY idx_orders_customer_status_created
ON orders (customer_id, status, created_at DESC);
```

That one index turns the query above into an index scan that reads exactly 20 tuples. The ordering rule: **equality filters → range filter or sort column**. An index on `(created_at, customer_id)` — same columns, wrong order — barely helps at all, because the equality filter can't narrow the leading edge.

And always `CONCURRENTLY` in production. It takes longer and can't run in a transaction, but it doesn't lock writes while it builds.

## Partial indexes for skewed data

Most status columns are heavily skewed: 98% of rows are `COMPLETED` and every query cares about the other 2%.

```sql
CREATE INDEX idx_orders_open
ON orders (customer_id, created_at DESC)
WHERE status IN ('PENDING', 'PROCESSING');
```

The index stays tiny, stays hot in cache, and writes to completed orders never touch it. Partial indexes are our favorite disproportionate win: we have replaced 40GB of bloated full-column indexes with a few hundred megabytes of partials.

## Covering indexes to kill heap fetches

When a hot query needs only two or three columns, `INCLUDE` lets the index answer it alone:

```sql
CREATE INDEX idx_products_sku
ON products (sku) INCLUDE (name, price_cents);
```

An `Index Only Scan` never visits the table heap — but it depends on the visibility map being current, so if you see `Heap Fetches: <big number>` in the plan, the table needs a vacuum.

## Know the other index types

B-tree is right 90% of the time. The other 10%:

- **GIN** — `jsonb` containment (`@>`), arrays, and full-text search. Essential the moment you query into JSON.
- **BRIN** — huge append-only tables (events, logs) where physical order correlates with a timestamp. A BRIN index on a billion-row events table can be a few hundred **kilobytes**.
- **GiST** — ranges and geometric/geospatial data, plus exclusion constraints like "no overlapping bookings".

```sql
-- Find events for a device in a time window, on a 2TB table
CREATE INDEX idx_events_time_brin ON events USING brin (created_at);
```

## The discipline part

Indexes are not free: every write pays for each one, and unused indexes are pure overhead. Twice a year, run:

```sql
SELECT indexrelid::regclass AS index, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexrelid > 16384
ORDER BY pg_relation_size(indexrelid) DESC;
```

Anything with zero scans and real size is a candidate for deletion — after checking it isn't enforcing uniqueness or serving a rare-but-critical report.

Indexing is not a dark art. It's a loop: measure, add the smallest index that serves the query shape, measure again, and periodically prune. The database is telling you what it needs — the whole skill is listening.
