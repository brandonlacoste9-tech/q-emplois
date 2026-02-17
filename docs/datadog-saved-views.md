# Datadog Log Explorer — Saved Views (RBQ)

Copy/paste-ready queries and analytics setups for RBQ verification logs. Assumes `ddsource:q-emplois`, `service`/`env` from `DD_SERVICE`/`DD_ENV`, and the JSON shape below.

---

## Shipped event shape

**Top-level attributes** (Datadog reserved / `ddtags`):

| Attribute   | Example                    | Source                    |
|------------|----------------------------|---------------------------|
| `source`   | `q-emplois`                | `ddsource`                |
| `service`  | `q-emplois-backend`        | `DD_SERVICE`              |
| `env`      | `production`               | `DD_ENV`                  |
| `path`     | `api.verify.rbq`           | from `path`               |
| `http_status` | `200`                  | from `status`             |
| `valid`    | `true` / `false` / `unknown` | from `valid`          |

**Reserved attributes:** Datadog treats fields like `status` as reserved for special processing. We use `http_status` instead to avoid unexpected remapping. [Docs](https://docs.datadoghq.com/logs/log_configuration/attributes_naming_convention/)

**JSON `message`** (parsed into attributes):

```json
{
  "schema_version": "rbq_metrics_v1",
  "request_id": "req-abc123",
  "timestamp": "2025-02-17T12:00:00.000Z",
  "method": "POST",
  "path": "/api/verify/rbq",
  "status": 200,
  "latency_ms": 123.45,
  "licence_prefix": "1234",
  "valid": true,
  "error": null,
  "user_agent": "Mozilla/5.0..."
}
```

**Facets and measures:** Promote stable attributes (`error_type`, `path`, `valid`, `http_status`) to **facets** for filtering and grouping. Promote numeric values (`latency_ms`) to a **measure** so percentiles and aggregations work. [Docs](https://docs.datadoghq.com/logs/explorer/facets/) `error_type` is present only when `status >= 400`.

---

## View 1 — RBQ Success Rate

**Name:** `RBQ – Success rate (valid vs invalid vs errors)`  
**Where:** Logs → Explorer

**Query**

```
source:q-emplois service:q-emplois-backend env:production path:api.verify.rbq
```

*(Replace `q-emplois-backend` / `production` with your `DD_SERVICE` / `DD_ENV` if different.)*

**Recommended facets (left panel)**

- Facets: `path`, `http_status`, `valid`, `error_type`
- Measures: `latency_ms` (optional for this view)

**Analytics tab**

- Visualization: Timeseries
- Compute: `count()`
- Split by: `valid` (and optionally `http_status`)

**Common filters**

| Filter | Query |
|--------|-------|
| Only HTTP 200 | `http_status:200` |
| Only errors | `http_status:[400 TO 599]` |
| Invalid but not error (if you return 200 for invalid) | `valid:false http_status:200` |

**Single success-rate number:** Create log-based metrics (counts) from queries like `valid:true` and “all”, then chart the ratio in a dashboard. [Docs](https://docs.datadoghq.com/logs/log_configuration/logs_to_metrics/)

---

## View 2 — RBQ p95 Latency

**Name:** `RBQ – Latency p95/p99`  
**Where:** Logs → Explorer → Analytics

**Query**

```
source:q-emplois service:q-emplois-backend env:production path:api.verify.rbq
```

**Facet/measure setup**

- Promote `latency_ms` as a *measure* (numeric) so percentiles work in log analytics.

**Analytics tab**

- Visualization: Timeseries
- Compute: `p95(latency_ms)` (add a second line `p99(latency_ms)` if useful)
- Split by (optional): `valid` or `http_status` to see “errors are slower” patterns

**Useful variants**

- **Latency for successful checks only:** add `http_status:200`
- **Latency for retryable failures only:** add `error_type:(timeout OR http_500 OR http_502 OR http_503)` (adjust to your exact values)

---

## View 3 — Top Error Types

**Name:** `RBQ – Top error types (group by error_type)`  
**Where:** Logs → Explorer → Analytics

**Query (errors only)**

```
source:q-emplois service:q-emplois-backend env:production path:api.verify.rbq http_status:[400 TO 599]
```

**Analytics tab**

- Visualization: Top List (or Table)
- Compute: `count()`
- Group by: `error_type` (facet)
- Optional second group-by: `http_status` (to separate `http_500` vs e.g. `http_429`)

**Note:** Using `error_type` (low cardinality) is the recommended approach versus grouping by raw error text. [Docs](https://docs.datadoghq.com/logs/guide/best-practices-for-log-management/)

---

## Quick reference

| View | Query base | Key attributes |
|------|------------|----------------|
| Success rate | `source:q-emplois service:q-emplois-backend env:production path:api.verify.rbq` | `valid`, `http_status` |
| p95 latency | same | `latency_ms` (measure) |
| Top errors | same + `http_status:[400 TO 599]` | `error_type` |

---

## Log Monitors (alerts)

Log monitors use the same query syntax as Log Explorer. [Docs](https://docs.datadoghq.com/monitors/types/log/)

### Monitor 1 — Error-rate spike

**Type:** Log Monitor → "Log count"

**Query**

```
source:q-emplois service:q-emplois-backend env:production path:api.verify.rbq http_status:[400 TO 599]
```

**Alert condition (defaults — conservative for early-stage)**

- Warning: `count > 3` in `5m`
- Alert: `count > 10` in `5m`

**Recommended**

- Multi alert grouped by `error_type` to see which class is spiking (timeouts vs 5xx vs format).

---

### Monitor 2 — p95 latency regression

**Type:** Log Monitor → "Measure" (uses numeric log measures)

**Query**

```
source:q-emplois service:q-emplois-backend env:production path:api.verify.rbq
```

**Measure**

- `latency_ms` (must be promoted as a measure).

**Alert condition (defaults — conservative for early-stage)**

- Warning: `p95(latency_ms) > 2500` over `10m`
- Alert: `p95(latency_ms) > 3500` over `10m`

**Recommended**

- Multi alert grouped by `valid` (or `http_status`) if you want to distinguish "slow failures" vs "slow successes".

---

### Monitor 3 — Error type threshold (top `error_type`)

**Type:** Log Monitor → "Log count" with group-by (multi alert)

**Query**

```
source:q-emplois service:q-emplois-backend env:production path:api.verify.rbq http_status:[400 TO 599]
```

**Group by**

- `error_type` (facet).

**Alert condition (defaults — conservative for early-stage)**

- Warning: `count > 2` per type in `5m`
- Alert: `count > 5` per type in `5m`
- Optional: create a second monitor just for `error_type:timeout` with a tighter threshold.

---

### Monitor notes

- **Simple vs Multi alert:** Simple alert aggregates; Multi alert fires per group-by facet. Use Multi alert to avoid noisy "one alert per line" behavior. [Docs](https://docs.datadoghq.com/monitors/types/log/)
- **Ratios (error rate %, success rate %):** Convert logs to log-based metrics, then alert on the metric query. [Docs](https://docs.datadoghq.com/logs/log_configuration/logs_to_metrics/)

### Minimum volume guard (log-based metrics)

For early traffic, "2 errors on 2 requests" can trigger an alert with no real signal. Use **log-based metrics** to get a true error-rate % with a denominator guard. [Docs](https://docs.datadoghq.com/logs/log_configuration/logs_to_metrics/)

**Create these 3 log-based metrics:**

| Metric name | Type | Query | Notes |
|-------------|------|-------|-------|
| `rbq.verify.requests.total` | count | `source:q-emplois service:q-emplois-backend env:production path:api.verify.rbq` | All requests |
| `rbq.verify.requests.errors` | count | same + `http_status:[400 TO 599]` | Errors only |
| `rbq.verify.latency_ms` | distribution | base query, field `latency_ms` | Enable p95/p99 |

**Alert with denominator guard:**

- **Error rate:** Metric monitor on `errors / total`, with condition `total >= N` (min-volume guard).
- **p95 latency:** Metric monitor on the distribution metric (more stable than log-analytics percentiles).

Keep `group by` low-cardinality (e.g. `service`, `env`, `path`); avoid unbounded attributes like `request_id`. [Docs](https://docs.datadoghq.com/logs/log_configuration/logs_to_metrics/)

**Suggested `N` and error-rate thresholds by volume band:**

| Volume | N (min requests per 10m) | Warning | Alert |
|--------|--------------------------|---------|-------|
| Low (under 100/h) | 10 | 10% | 25% |
| Medium (100–1,000/h) | 30 | 5% | 10% |
| High (over 1,000/h) | 100 | 2% | 5% |

### Evaluation noise controls

- **Latency monitors:** Use longer evaluation windows (e.g. 10m) to reduce flapping. [Docs](https://docs.datadoghq.com/monitors/configuration/)
- **Multi-alert grouping:** Group by `error_type` (or `valid`/`http_status`) so alerts are actionable and not one-per-line. This matches Datadog’s guidance to use group-by/multi-alert for per-dimension alerting without redundant monitors.

### Final threshold set (recommended defaults)

Assumes **Low volume** (under 100/h) and **p95 target 3000 ms**. Use log-based metrics for ratio alerts with a denominator guard. [Docs](https://docs.datadoghq.com/logs/log_configuration/logs_to_metrics/)

**Volume guard:** `total_requests >= 10` over `10m` (avoids paging on "2 errors on 2 requests").

**Error-rate monitor (log-based metrics)**

| Level | Condition | Window |
|-------|-----------|--------|
| Warning | `errors / total > 0.10` AND `total >= 10` | 10m |
| Alert | `errors / total > 0.25` AND `total >= 10` | 10m |

**p95 latency monitor (distribution metric from `latency_ms`)**

| Level | Condition | Window |
|-------|-----------|--------|
| Warning | `p95(latency_ms) > 3000` | 10m |
| Alert | `p95(latency_ms) > 3500` | 10m |

**Log monitors:** Keep multi-alerts grouped by `error_type` for diagnostic / faster signal on specific failure modes.

**Re-tune when you have real data:** Set warning around baseline p95 + 20%, alert around baseline p95 + 50%. Keep grouping low-cardinality.

---

### Monitor query templates (metric monitors)

**Setup:** Metric monitors (not log monitors) for error rate and p95 latency. Create the 3 log-based metrics first (`rbq.verify.requests.total`, `rbq.verify.requests.errors`, `rbq.verify.latency_ms`).

**Error-rate monitor — exact formula with min-volume guard**

Datadog’s `is_greater(b, N)` returns 0 when total ≤ N (no alert) and 1 when total > N (evaluate error rate). [Docs](https://docs.datadoghq.com/monitors/guide/add-a-minimum-request-threshold-for-error-rate-alerts/)

```
((a/b)*100)*is_greater(b,10)
```

- **a** = `sum:rbq.verify.requests.errors{*}.as_count()`
- **b** = `sum:rbq.verify.requests.total{*}.as_count()`
- **10** = min requests in window (N)

**Thresholds:** Warning `> 10`, Alert `> 25`. Recovery: Warning recovery `<= 8`, Alert recovery `<= 20` (reduces flapping).

**p95 latency monitor**

- **Query:** `p95:rbq.verify.latency_ms{*}` (distribution metric)
- **Thresholds:** Warning `> 3000`, Alert `> 3500`. Recovery: Warning recovery `<= 2500`, Alert recovery `<= 3000`.

---

### Recovery thresholds

To reduce flapping, set recovery thresholds slightly below the trigger thresholds. Datadog recovers when the metric crosses the recovery value. [Docs](https://docs.datadoghq.com/monitors/configuration/)

| Monitor | Trigger | Recovery (optional) |
|---------|---------|---------------------|
| Error rate | Warning > 10%, Alert > 25% | Recover when ≤ 8%, ≤ 20% |
| p95 latency | Warning > 3000 ms, Alert > 3500 ms | Recover when ≤ 2500 ms, ≤ 3000 ms |

---

### Tuning thresholds

To tailor warning/alert values and evaluation windows to your traffic:

1. **Target SLA:** p95 latency for `/api/verify/rbq` should be under ___ ms?
2. **Typical volume:** RBQ verify requests per hour (and peak/hour)? If unknown: low (under 100/h), medium (100–1,000/h), or high (over 1,000/h).

---

## Ops note

Saved views capture filters, columns, time range, and analytics config—the full “lens”—so teammates get the same view for onboarding and consistent debugging. [Docs](https://docs.datadoghq.com/logs/explorer/saved_views/)
