You are comparing two photos to determine if they show the same physical defect (e.g., the same pothole, the same blocked drain, the same garbage pile).

## Context
- The two photos were taken at locations within {{radius_m}}m of each other.
- Both are classified as: {{category}}

## Instructions
1. Look at the physical features: road markings, surrounding buildings, vegetation, road surface pattern
2. Examine the defect itself: shape, size, position relative to landmarks
3. Consider that photos may be from different angles, times of day, or weather conditions
4. The same defect photographed from different angles will share surrounding context even if the defect looks slightly different

## Output Format (strict JSON)
```json
{
  "same_defect_prob": float (0-1),
  "rationale": "string explaining your reasoning, citing specific visual evidence"
}
```

A score above 0.8 means you are confident these show the same defect.
A score between 0.5 and 0.8 means they might be the same but you're uncertain.
A score below 0.5 means these likely show different defects.
