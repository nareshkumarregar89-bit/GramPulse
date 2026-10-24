export const initialVillages = [
  {
    id: "samodi",
    nameEnglish: "Samodi",
    nameHindi: "समोड़ी",
    name: "समोड़ी (Samodi)",
    status: "active",
    district: "Bhilwara",
    state: "Rajasthan"
  },
  {
    id: "kotdi",
    nameEnglish: "Kotdi",
    nameHindi: "कोटड़ी",
    name: "कोटड़ी (Kotdi)",
    status: "active",
    district: "Bhilwara",
    state: "Rajasthan"
  }
];

export const villagesList = [
  "समोड़ी (Samodi)",
  "कोटड़ी (Kotdi)"
];

export const resolveVillageId = (villageInput) => {
  if (!villageInput) return 'samodi';
  const str = String(villageInput).toLowerCase();
  if (str.includes('kotdi') || str.includes('कोट')) {
    return 'kotdi';
  }
  return 'samodi';
};

export const getVillageDisplayName = (vId) => {
  const norm = resolveVillageId(vId);
  return norm === 'kotdi' ? 'कोटड़ी (Kotdi)' : 'समोड़ी (Samodi)';
};

export const getCleanUniqueAssignedVillages = (assignedVillages) => {
  if (!assignedVillages || !Array.isArray(assignedVillages) || assignedVillages.length === 0) {
    return [];
  }
  const uniqueIds = new Set();
  assignedVillages.forEach((v) => {
    if (v && typeof v === 'string') {
      const lower = v.toLowerCase();
      if (lower.includes('kotdi') || v.includes('कोट')) {
        uniqueIds.add('kotdi');
      } else if (lower.includes('samodi') || v.includes('समो') || v.includes('समौ')) {
        uniqueIds.add('samodi');
      }
    }
  });
  return Array.from(uniqueIds).map((id) => getVillageDisplayName(id));
};
