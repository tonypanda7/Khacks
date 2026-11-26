const DEFAULT_THRESHOLDS = {
  classify: { min_confidence: 0.6 },
  dedup: { candidate_radius_m: 40, attach_min: 0.8, ask_min: 0.5 },
  priority: { context_radius_m: 150 },
  proof: { max_refs: 6, approve: 0.75, reject: 0.35, require_time_after_first_report: true, warn_distance_m: 50 },
  recurrence: { window_days: 30 }
}

const DEFAULT_SLA: Record<string, { sla_hours: number; escalation_multiplier: number }> = {
  pothole: { sla_hours: 72, escalation_multiplier: 1.5 },
  drainage: { sla_hours: 48, escalation_multiplier: 1.5 },
  garbage: { sla_hours: 24, escalation_multiplier: 1.5 },
}

export function getThresholds() {
  return DEFAULT_THRESHOLDS
}

export function getSlaConfig() {
  return DEFAULT_SLA
}
