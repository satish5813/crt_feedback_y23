// Mirrors backend/config.js — field keys MUST match the backend exactly.
export const BRANCHES_FALLBACK = [
  'CSE-1', 'CSE-2', 'CSE-3', 'CSE-4', 'AI&DS', 'CS&IT', 'CSE(IOT)',
  'ECE', 'EEE', 'MECH', 'BioTechnology', 'BCA', 'MCA', 'M.Tech',
];

export const WEAK_THRESHOLD = 4;

// External training vendors
export const VENDORS = ['COIGN', 'GradsKey', 'Rsequence', 'Smart Interviews', 'Other'];

export const SECTIONS = {
  skills: [
    { key: 'aptitude', label: 'Aptitude' },
    { key: 'verbalQR', label: 'Verbal / Quantitative Reasoning (QR)' },
  ],
  oops: [
    { key: 'oops_principles', label: 'OOPs Principles' },
    { key: 'oops_class_object', label: 'Class & Object' },
    { key: 'oops_inheritance', label: 'Inheritance' },
    { key: 'oops_encapsulation', label: 'Encapsulation' },
    { key: 'oops_multithreading', label: 'Multithreading' },
  ],
  topics: [
    { group: 'DSA Topics', items: [
      { key: 'dsa_linkedlist', label: 'Linked List' },
      { key: 'dsa_sorting', label: 'Sorting' },
      { key: 'dsa_searching', label: 'Searching' },
      { key: 'dsa_trees', label: 'Trees' },
      { key: 'dsa_graphs', label: 'Graphs' },
    ]},
    { group: 'Programming (C) Topics', items: [
      { key: 'prog_control', label: 'Control Statements' },
      { key: 'prog_loops', label: 'Loops' },
      { key: 'prog_arrays', label: 'Arrays' },
      { key: 'prog_pointers', label: 'Pointers' },
      { key: 'prog_strings', label: 'Strings' },
      { key: 'prog_functions', label: 'Functions' },
      { key: 'prog_oops', label: 'OOPs' },
    ]},
    { group: 'ADS Topics', items: [
      { key: 'ads_rbtree', label: 'Red-Black Tree' },
      { key: 'ads_bptree', label: 'B+ Tree' },
    ]},
  ],
  written: [
    { key: 'cw_coding', label: 'Coding' },
    { key: 'cw_ds', label: 'Data Structures (DS)' },
    { key: 'cw_ads', label: 'Advanced Data Structures (ADS)' },
    { key: 'cw_quant', label: 'Quantitative' },
    { key: 'cw_reasoning', label: 'Reasoning' },
    { key: 'cw_verbal', label: 'Verbal' },
    { key: 'cw_oops', label: 'OOPs' },
  ],
  vendor: [
    { key: 'vendor_quant', label: 'Quantitative' },
    { key: 'vendor_reasoning', label: 'Reasoning' },
    { key: 'vendor_aptitude', label: 'Aptitude' },
    { key: 'vendor_coding', label: 'Coding' },
  ],
  internal: [
    { key: 'internal_qr', label: 'Quantitative Reasoning (QR)' },
    { key: 'internal_verbal', label: 'Verbal Skills' },
  ],
  coach: [
    { key: 'coach_teaching', label: 'Teaching Quality' },
    { key: 'coach_testcases', label: 'Test-Case Practice' },
    { key: 'coach_solving', label: 'Problem-Solving Approach' },
  ],
};

export const REQUIRED_RATINGS = [
  ...SECTIONS.skills.map((x) => x.key),
  'codingRating',
  ...SECTIONS.oops.map((x) => x.key),
  ...SECTIONS.topics.flatMap((g) => g.items.map((x) => x.key)),
  ...SECTIONS.written.map((x) => x.key),
  'newProblemFeel',
  ...SECTIONS.coach.map((x) => x.key),
];

// Heat color for a 1-10 value. higherIsBetter=false inverts (high difficulty = red).
export function heat(v, higherIsBetter = true) {
  if (v === null || v === undefined || v === '' || isNaN(v)) return {};
  const good = higherIsBetter ? Number(v) : 11 - Number(v);
  const hue = Math.max(0, Math.min(120, ((good - 1) / 9) * 120)); // 0 red -> 120 green
  return {
    backgroundColor: `hsl(${hue} 78% 90%)`,
    color: `hsl(${hue} 95% 20%)`,
    fontWeight: 700,
  };
}

// Heat for a percentage where high % is bad (e.g. % of weak students)
export function heatBadPct(pct) {
  if (pct === null || pct === undefined || isNaN(pct)) return {};
  const hue = Math.max(0, 120 - (pct / 100) * 120);
  return { backgroundColor: `hsl(${hue} 78% 90%)`, color: `hsl(${hue} 95% 20%)`, fontWeight: 700 };
}
