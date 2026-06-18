import { Injectable } from '@nestjs/common';
import { MetricsRecorder } from '../../application/ports/repositories';

@Injectable()
export class NoOpMetricsRecorder implements MetricsRecorder {
  incrementDecision(_decision: string, _reason: string): void {
    // Wire prom-client here:
    // decisionsTotal.labels(decision, reason).inc();
  }

  observeEvaluateDuration(_durationMs: number): void {
    // Wire prom-client here:
    // evaluateDuration.observe(durationMs);
  }
}
