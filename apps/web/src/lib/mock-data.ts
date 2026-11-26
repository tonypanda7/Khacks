export const FALLBACK_SEED_ISSUES = [
  {
    id: "issue-gcc-001",
    category: "pothole",
    lat: 13.0827,
    lon: 80.2707,
    status: "REPORTED",
    severity: 4,
    priorityScore: 78,
    priorityBand: "HIGH",
    priorityRationale: "Large pothole in carriageway near Central Railway Station. High bus frequency.",
    severityRationale: "Crater depth > 15cm affecting lane width. Risk to two-wheelers.",
    reportCount: 3,
    isSeed: true,
    flags: [],
    createdAt: new Date().toISOString(),
    reports: [
      {
        id: "rep-001",
        capturedAt: new Date().toISOString(),
        image: { path: "/seed/pothole1.jpg", sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" }
      },
      {
        id: "rep-002",
        capturedAt: new Date().toISOString(),
        image: { path: "/seed/pothole2.jpg", sha256: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb" }
      }
    ],
    events: [
      { id: "ev-01", type: "ISSUE_CREATED", createdAt: new Date().toISOString() },
      { id: "ev-02", type: "REPORT_ATTACHED", createdAt: new Date().toISOString() }
    ],
    fixAttempts: []
  },
  {
    id: "issue-gcc-002",
    category: "pothole",
    lat: 13.0604,
    lon: 80.2496,
    status: "ROUTED",
    severity: 3,
    priorityScore: 55,
    priorityBand: "MEDIUM",
    priorityRationale: "Moderate surface breakup near Anna Nagar roundtana. Routed to Roads & Infrastructure.",
    severityRationale: "Shallow pothole ~8cm deep near curb.",
    reportCount: 1,
    isSeed: true,
    flags: [],
    createdAt: new Date().toISOString(),
    reports: [
      {
        id: "rep-003",
        capturedAt: new Date().toISOString(),
        image: { path: "/seed/pothole3.jpg", sha256: "3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d" }
      }
    ],
    events: [
      { id: "ev-03", type: "ISSUE_CREATED", createdAt: new Date().toISOString() },
      { id: "ev-04", type: "ROUTED", createdAt: new Date().toISOString(), payload: { department: "Roads & Infrastructure" } }
    ],
    fixAttempts: []
  },
  {
    id: "issue-gcc-003",
    category: "drainage",
    lat: 13.0878,
    lon: 80.2785,
    status: "ACKNOWLEDGED",
    severity: 5,
    priorityScore: 92,
    priorityBand: "CRITICAL",
    priorityRationale: "Severe storm-water drain blockage causing road flooding near school zone.",
    severityRationale: "Complete blockage, standing blackwater overflowing onto sidewalk.",
    reportCount: 4,
    isSeed: true,
    flags: ["ESCALATED"],
    createdAt: new Date().toISOString(),
    reports: [
      {
        id: "rep-004",
        capturedAt: new Date().toISOString(),
        image: { path: "/seed/drainage1.jpg", sha256: "2e7d2c03a9507ae265ecf5b5356885a53393a2029d241394997265a1a25aefc6" }
      }
    ],
    events: [
      { id: "ev-05", type: "ISSUE_CREATED", createdAt: new Date().toISOString() },
      { id: "ev-06", type: "ACKNOWLEDGED", createdAt: new Date().toISOString() }
    ],
    fixAttempts: []
  },
  {
    id: "issue-gcc-004",
    category: "garbage",
    lat: 13.0524,
    lon: 80.2508,
    status: "IN_PROGRESS",
    severity: 2,
    priorityScore: 35,
    priorityBand: "MEDIUM",
    priorityRationale: "Commercial waste overflow, municipal truck dispatched.",
    severityRationale: "Accumulation of dry cardboard and plastic waste beside bin.",
    reportCount: 2,
    isSeed: true,
    flags: [],
    createdAt: new Date().toISOString(),
    reports: [
      {
        id: "rep-005",
        capturedAt: new Date().toISOString(),
        image: { path: "/seed/garbage1.jpg", sha256: "18ac3e7343f016890c510e93f935261169d9e3f565436429830faf0934005ab4" }
      }
    ],
    events: [
      { id: "ev-07", type: "WORK_STARTED", createdAt: new Date().toISOString() }
    ],
    fixAttempts: []
  },
  {
    id: "issue-gcc-005",
    category: "pothole",
    lat: 13.0674,
    lon: 80.2376,
    status: "FIX_VERIFIED",
    severity: 4,
    priorityScore: 65,
    priorityBand: "HIGH",
    priorityRationale: "Repaired asphalt patch verified via Proof-of-Fix engine.",
    severityRationale: "Deep cavity filled and sealed with bitumen cold mix.",
    reportCount: 2,
    isSeed: true,
    flags: [],
    createdAt: new Date().toISOString(),
    reports: [
      {
        id: "rep-006",
        capturedAt: new Date().toISOString(),
        image: { path: "/seed/pothole_fixed_before.jpg", sha256: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a" }
      }
    ],
    events: [
      { id: "ev-08", type: "FIX_SUBMITTED", createdAt: new Date().toISOString() },
      { id: "ev-09", type: "FIX_APPROVED", createdAt: new Date().toISOString(), payload: { fixScore: 0.892, decision: "APPROVED" } }
    ],
    fixAttempts: [
      {
        id: "fix-att-001",
        fixScore: 0.892,
        decision: "APPROVED",
        pairOutputs: [
          { same_location_prob: 0.94, defect_repaired_prob: 0.95, pair_score: 0.893, rationale: "Same curb markings and lamp post visible. Pothole filled flush with asphalt." }
        ],
        receipt: {
          fix_attempt_id: "fix-att-001",
          model: "qwen/qwen2.5-vl-72b-instruct",
          prompt_hash: "a89cf129b012",
          pair_count: 1,
          fix_score: 0.892,
          decision: "APPROVED",
          timestamp: Date.now() / 1000
        }
      }
    ]
  },
  {
    id: "issue-gcc-006",
    category: "drainage",
    lat: 13.0756,
    lon: 80.2611,
    status: "FIX_SUBMITTED",
    severity: 3,
    priorityScore: 48,
    priorityBand: "MEDIUM",
    priorityRationale: "Silt cleared from roadside drain grating. Awaiting Proof-of-Fix verification.",
    severityRationale: "Slow drainage causing 5cm ponding after rain.",
    reportCount: 1,
    isSeed: true,
    flags: [],
    createdAt: new Date().toISOString(),
    reports: [
      {
        id: "rep-007",
        capturedAt: new Date().toISOString(),
        image: { path: "/seed/drainage2.jpg", sha256: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d" }
      }
    ],
    events: [
      { id: "ev-10", type: "FIX_SUBMITTED", createdAt: new Date().toISOString() }
    ],
    fixAttempts: []
  },
  {
    id: "issue-gcc-007",
    category: "garbage",
    lat: 13.0912,
    lon: 80.2893,
    status: "REPORTED",
    severity: 4,
    priorityScore: 70,
    priorityBand: "HIGH",
    priorityRationale: "Illegal dumping near Royapuram market entrance. High pedestrian zone.",
    severityRationale: "Accumulation blocking pedestrian footpath.",
    reportCount: 3,
    isSeed: true,
    flags: [],
    createdAt: new Date().toISOString(),
    reports: [
      {
        id: "rep-008",
        capturedAt: new Date().toISOString(),
        image: { path: "/seed/garbage2.jpg", sha256: "0000000000000000000000000000000000000000000000000000000000000001" }
      }
    ],
    events: [
      { id: "ev-11", type: "ISSUE_CREATED", createdAt: new Date().toISOString() }
    ],
    fixAttempts: []
  },
  {
    id: "issue-gcc-008",
    category: "pothole",
    lat: 13.0481,
    lon: 80.2399,
    status: "FIX_REJECTED",
    severity: 5,
    priorityScore: 88,
    priorityBand: "CRITICAL",
    priorityRationale: "Fix photos showed wrong street location. Rejected by Proof-of-Fix engine.",
    severityRationale: "Massive crater on arterial road.",
    reportCount: 5,
    isSeed: true,
    flags: ["OVERDUE"],
    createdAt: new Date().toISOString(),
    reports: [
      {
        id: "rep-009",
        capturedAt: new Date().toISOString(),
        image: { path: "/seed/pothole4.jpg", sha256: "0000000000000000000000000000000000000000000000000000000000000002" }
      }
    ],
    events: [
      { id: "ev-12", type: "FIX_REJECTED", createdAt: new Date().toISOString(), payload: { fixScore: 0.12, decision: "REJECTED" } }
    ],
    fixAttempts: [
      {
        id: "fix-att-002",
        fixScore: 0.12,
        decision: "REJECTED",
        pairOutputs: [
          { same_location_prob: 0.15, defect_repaired_prob: 0.80, pair_score: 0.12, rationale: "Background buildings and road curvature do not match reference bundle." }
        ],
        receipt: {
          fix_attempt_id: "fix-att-002",
          model: "qwen/qwen2.5-vl-72b-instruct",
          prompt_hash: "a89cf129b012",
          pair_count: 1,
          fix_score: 0.12,
          decision: "REJECTED",
          timestamp: Date.now() / 1000
        }
      }
    ]
  }
]
