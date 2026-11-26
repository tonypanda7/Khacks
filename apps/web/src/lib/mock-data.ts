export const FALLBACK_SEED_ISSUES = [
  {
    id: "issue-anna-salai",
    title: "Anna Salai (Mount Road) - Dangerous Carriageway Crater",
    road: "Anna Salai (near Thousand Lights Mosque)",
    category: "pothole",
    lat: 13.0528,
    lon: 80.2514,
    status: "REPORTED",
    severity: 5,
    priorityScore: 94,
    priorityBand: "CRITICAL",
    priorityRationale: "Major 4-lane arterial carriageway. Crater depth >18cm directly in fast lane heading towards Gemini Flyover.",
    severityRationale: "Extensive bitumen failure. Severe hazard to two-wheelers and night traffic.",
    reportCount: 6,
    isSeed: true,
    flags: ["ESCALATED"],
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    reports: [
      {
        id: "rep-001",
        capturedAt: new Date().toISOString(),
        image: { path: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80", sha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08" }
      }
    ],
    events: [
      { id: "ev-01", type: "ISSUE_CREATED", createdAt: new Date().toISOString() },
      { id: "ev-02", type: "PRIORITY_EVALUATED", createdAt: new Date().toISOString(), payload: { priority: 94, band: "CRITICAL" } }
    ],
    fixAttempts: []
  },
  {
    id: "issue-poonamallee-hr",
    title: "Poonamallee High Road - Sunken Asphalt & Edge Breakup",
    road: "Poonamallee High Rd (EVR Salai near Kilpauk Medical College)",
    category: "pothole",
    lat: 13.0782,
    lon: 80.2415,
    status: "IN_PROGRESS",
    severity: 4,
    priorityScore: 78,
    priorityBand: "HIGH",
    priorityRationale: "Hospital zone transit corridor. Ambulances experiencing delays due to sunken road surface.",
    severityRationale: "12cm deep depression with ragged asphalt edges.",
    reportCount: 3,
    isSeed: true,
    flags: [],
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    reports: [
      {
        id: "rep-002",
        capturedAt: new Date().toISOString(),
        image: { path: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80", sha256: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8" }
      }
    ],
    events: [
      { id: "ev-03", type: "WORK_STARTED", createdAt: new Date().toISOString(), payload: { by: "authority_demo" } }
    ],
    fixAttempts: []
  },
  {
    id: "issue-omr-it-corridor",
    title: "OMR IT Expressway - Storm Water Drain Overflow",
    road: "Rajiv Gandhi Salai (OMR near Thoraipakkam Toll)",
    category: "drainage",
    lat: 12.9620,
    lon: 80.2428,
    status: "ACKNOWLEDGED",
    severity: 5,
    priorityScore: 88,
    priorityBand: "CRITICAL",
    priorityRationale: "Blocked stormwater culvert causing blackwater pooling across two service lanes during evening peak hours.",
    severityRationale: "Complete sediment and silt blockage.",
    reportCount: 4,
    isSeed: true,
    flags: [],
    imageUrl: "https://images.unsplash.com/photo-1584463699027-e43e2e8587dc?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    reports: [
      {
        id: "rep-003",
        capturedAt: new Date().toISOString(),
        image: { path: "https://images.unsplash.com/photo-1584463699027-e43e2e8587dc?w=600&auto=format&fit=crop&q=80", sha256: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a" }
      }
    ],
    events: [
      { id: "ev-04", type: "ACKNOWLEDGED", createdAt: new Date().toISOString() }
    ],
    fixAttempts: []
  },
  {
    id: "issue-gst-guindy",
    title: "GST Road - Bus Stop Road Surface Caved-In",
    road: "Grand Southern Trunk (GST) Road (near Guindy Kathipara Junction)",
    category: "pothole",
    lat: 13.0067,
    lon: 80.2030,
    status: "FIX_VERIFIED",
    severity: 4,
    priorityScore: 72,
    priorityBand: "HIGH",
    priorityRationale: "Heavy Metropolitan Transport Corporation (MTC) bus corridor. Road patched and verified by AI Proof-of-Fix.",
    severityRationale: "Deep rutting filled and leveled with bituminous concrete.",
    reportCount: 2,
    isSeed: true,
    flags: [],
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    reports: [
      {
        id: "rep-004",
        capturedAt: new Date().toISOString(),
        image: { path: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80", sha256: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d" }
      }
    ],
    events: [
      { id: "ev-05", type: "FIX_APPROVED", createdAt: new Date().toISOString(), payload: { fixScore: 0.912, decision: "APPROVED" } }
    ],
    fixAttempts: [
      {
        id: "fix-att-001",
        fixScore: 0.912,
        decision: "APPROVED",
        pairOutputs: [
          { same_location_prob: 0.96, defect_repaired_prob: 0.95, pair_score: 0.912, rationale: "Kathipara metro pillar visible in background. Fresh hot-mix asphalt patch confirmed flush." }
        ],
        receipt: {
          fix_attempt_id: "fix-att-001",
          model: "qwen/qwen2.5-vl-72b-instruct",
          prompt_hash: "b712c98a01f4",
          pair_count: 1,
          fix_score: 0.912,
          decision: "APPROVED",
          timestamp: Date.now() / 1000
        }
      }
    ]
  },
  {
    id: "issue-ecr-thiruvanmiyur",
    title: "East Coast Road (ECR) - Waste Dump Blocking Sidewalk",
    road: "East Coast Road (ECR near Thiruvanmiyur Signal)",
    category: "garbage",
    lat: 12.9830,
    lon: 80.2594,
    status: "REPORTED",
    severity: 3,
    priorityScore: 50,
    priorityBand: "MEDIUM",
    priorityRationale: "Commercial debris dumped along footpath, forcing pedestrians into oncoming vehicular traffic.",
    severityRationale: "Approximately 3 cubic meters of mixed commercial debris.",
    reportCount: 2,
    isSeed: true,
    flags: [],
    imageUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    reports: [
      {
        id: "rep-005",
        capturedAt: new Date().toISOString(),
        image: { path: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80", sha256: "0000000000000000000000000000000000000000000000000000000000000001" }
      }
    ],
    events: [
      { id: "ev-06", type: "ISSUE_CREATED", createdAt: new Date().toISOString() }
    ],
    fixAttempts: []
  },
  {
    id: "issue-inner-ring-road",
    title: "100 Feet Inner Ring Road - Trench Left After Pipe Laying",
    road: "Jawaharlal Nehru Road (100 Feet Rd near Vadapalani Metro)",
    category: "pothole",
    lat: 13.0510,
    lon: 80.2120,
    status: "ROUTED",
    severity: 4,
    priorityScore: 68,
    priorityBand: "HIGH",
    priorityRationale: "Unfilled utility trench running perpendicular across 3 lanes under Vadapalani flyover.",
    severityRationale: "Sharp 10cm drop causing vehicle bottom-out.",
    reportCount: 4,
    isSeed: true,
    flags: [],
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    reports: [
      {
        id: "rep-006",
        capturedAt: new Date().toISOString(),
        image: { path: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80", sha256: "0000000000000000000000000000000000000000000000000000000000000002" }
      }
    ],
    events: [
      { id: "ev-07", type: "ROUTED", createdAt: new Date().toISOString(), payload: { department: "Metro Water & Highways" } }
    ],
    fixAttempts: []
  },
  {
    id: "issue-rajaji-salai",
    title: "Rajaji Salai - Damaged Storm Grate Hazard",
    road: "Rajaji Salai (near Chennai Central & High Court)",
    category: "drainage",
    lat: 13.0880,
    lon: 80.2885,
    status: "FIX_REJECTED",
    severity: 4,
    priorityScore: 76,
    priorityBand: "HIGH",
    priorityRationale: "Cast-iron grating missing near bus stop. Submitted fix photo was from a different ward.",
    severityRationale: "Open 40cm drop hazard on pedestrian crossing.",
    reportCount: 3,
    isSeed: true,
    flags: ["OVERDUE"],
    imageUrl: "https://images.unsplash.com/photo-1584463699027-e43e2e8587dc?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    reports: [
      {
        id: "rep-007",
        capturedAt: new Date().toISOString(),
        image: { path: "https://images.unsplash.com/photo-1584463699027-e43e2e8587dc?w=600&auto=format&fit=crop&q=80", sha256: "0000000000000000000000000000000000000000000000000000000000000003" }
      }
    ],
    events: [
      { id: "ev-08", type: "FIX_REJECTED", createdAt: new Date().toISOString(), payload: { fixScore: 0.18, decision: "REJECTED" } }
    ],
    fixAttempts: [
      {
        id: "fix-att-003",
        fixScore: 0.18,
        decision: "REJECTED",
        pairOutputs: [
          { same_location_prob: 0.20, defect_repaired_prob: 0.90, pair_score: 0.18, rationale: "Fix photo shows a drain grate in T. Nagar, completely mismatched from Rajaji Salai heritage buildings." }
        ],
        receipt: {
          fix_attempt_id: "fix-att-003",
          model: "qwen/qwen2.5-vl-72b-instruct",
          prompt_hash: "a89cf129b012",
          pair_count: 1,
          fix_score: 0.18,
          decision: "REJECTED",
          timestamp: Date.now() / 1000
        }
      }
    ]
  }
]
