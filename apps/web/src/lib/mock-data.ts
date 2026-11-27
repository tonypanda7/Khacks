export const FALLBACK_SEED_ISSUES = [
  {
    id: "issue-kcsn-college",
    title: "K.C.S. Kasi Nadar College - Road Pothole & Water Depression",
    road: "96 Ellaya Street (outside K.C.S. Kasi Nadar College, R.K. Nagar)",
    category: "pothole",
    lat: 13.1205,
    lon: 80.2805,
    status: "REPORTED",
    severity: 3,
    priorityScore: 74,
    priorityBand: "HIGH",
    priorityRationale: "Depression retaining stagnant water near college access gate. Pedestrian and two-wheeler traffic hazard.",
    severityRationale: "Medium-sized depression in road surface with significant water pooling and crumbling asphalt edges.",
    reportCount: 1,
    isSeed: false,
    flags: [],
    imageUrl: "/api/images/report/2bc783f2509ea06755813038439efaa82835f15207ea32ef6e6a8016b2cfa51f.jpg",
    createdAt: new Date().toISOString(),
    reports: [
      {
        id: "rep-kcsn-001",
        capturedAt: "2026-11-27T15:15:48.000Z",
        lat: 13.1205,
        lon: 80.2805,
        image: {
          path: "/report/2bc783f2509ea06755813038439efaa82835f15207ea32ef6e6a8016b2cfa51f.jpg",
          sha256: "2bc783f2509ea06755813038439efaa82835f15207ea32ef6e6a8016b2cfa51f"
        },
        classification: {
          is_civic_issue: true,
          category: "pothole",
          severity_1_5: 3,
          severity_rationale: "The image shows a medium-sized depression in the road surface with significant water pooling. While it is located near the edge of the road/curb rather than mid-lane, the depth is sufficient to retain water and the surrounding asphalt is crumbling, fitting the criteria for a level 3 pothole.",
          confidence: 0.95,
          visible_cues: [
            "standing water in a road depression",
            "deteriorated asphalt edges",
            "surface erosion near the curb",
            "accumulation of debris within the hole"
          ]
        }
      }
    ],
    events: [
      { id: "ev-kcsn-01", type: "ISSUE_CREATED", createdAt: new Date().toISOString() },
      { id: "ev-kcsn-02", type: "PRIORITY_EVALUATED", createdAt: new Date().toISOString(), payload: { priority: 74, band: "HIGH" } }
    ],
    fixAttempts: []
  }
]
