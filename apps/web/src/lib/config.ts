const DEFAULT_THRESHOLDS = {
  classify: { min_confidence: 0.6 },
  dedup: { candidate_radius_m: 40, attach_min: 0.85, ask_min: 0.45 },
  priority: { context_radius_m: 150 },
  proof: { max_refs: 6, approve: 0.75, reject: 0.35, require_time_after_first_report: true, warn_distance_m: 50 },
  recurrence: { window_days: 30 }
}

const DEFAULT_SLA: Record<string, { sla_hours: number; escalation_multiplier: number }> = {
  pothole: { sla_hours: 72, escalation_multiplier: 1.5 },
  road_damage: { sla_hours: 48, escalation_multiplier: 1.5 },
  electrical_hazard: { sla_hours: 6, escalation_multiplier: 2.0 },
  drainage: { sla_hours: 48, escalation_multiplier: 1.5 },
  garbage: { sla_hours: 24, escalation_multiplier: 1.5 },
  fallen_tree: { sla_hours: 12, escalation_multiplier: 1.8 },
  street_light: { sla_hours: 72, escalation_multiplier: 1.2 },
  general_damage: { sla_hours: 72, escalation_multiplier: 1.2 },
}

export function getThresholds() {
  return DEFAULT_THRESHOLDS
}

export function getSlaConfig() {
  return DEFAULT_SLA
}
