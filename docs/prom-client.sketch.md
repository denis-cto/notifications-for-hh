# Production metrics adapter sketch (prom-client)

1. `npm install prom-client`
2. Implement `MetricsRecorder` with Counter/Histogram
3. Expose `GET /metrics` returning `register.metrics()`

See comments in `noop-metrics.recorder.ts` for wiring points.
