// Feature flags for phased rollout
export const FEATURE_FLAGS = {
  DOCUMENT_UPLOAD: true,
  KEYWORD_SEARCH: true,
  DOCUMENT_CATEGORIES: true,
  DOCUMENT_VERSIONING: true,
  SEMANTIC_SEARCH: true,
  AI_CONTENT_SUGGESTIONS: false,
  FUNDER_MATCHING: false,
  SMART_NBA: false,
  TEXT_EXTRACTION: false,
  BURNDOWN_CALCULATOR: true,
  VOICE_NOTES: true,
  DOCUMENT_SUMMARIZATION: false,
  AUTO_TAGGING: false,
  SIMILAR_DOCUMENTS: false,
} as const;

export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature];
};

export const FEATURE_METADATA: Record<keyof typeof FEATURE_FLAGS, { label: string; phase: number; description: string }> = {
  DOCUMENT_UPLOAD: { label: 'Document Upload', phase: 1, description: 'Upload and manage grant documents' },
  KEYWORD_SEARCH: { label: 'Keyword Search', phase: 1, description: 'Search documents by filename and content' },
  DOCUMENT_CATEGORIES: { label: 'Document Categories', phase: 1, description: 'Organize documents by type' },
  DOCUMENT_VERSIONING: { label: 'Document Versioning', phase: 1, description: 'Track document versions' },
  SEMANTIC_SEARCH: { label: 'AI Search', phase: 2, description: 'Search documents using natural language' },
  AI_CONTENT_SUGGESTIONS: { label: 'AI Content Suggestions', phase: 2, description: 'Get AI-powered content recommendations' },
  FUNDER_MATCHING: { label: 'Funder Matching', phase: 2, description: 'Match grants with potential funders' },
  SMART_NBA: { label: 'Smart Next Best Actions', phase: 2, description: 'AI-powered action recommendations' },
  TEXT_EXTRACTION: { label: 'Text Extraction', phase: 2, description: 'Extract text from uploaded documents' },
  BURNDOWN_CALCULATOR: { label: 'Financial Runway Calculator', phase: 0, description: 'Premium feature: Cash flow projections and runway analysis' },
  VOICE_NOTES: { label: 'Voice Notes', phase: 2, description: 'Capture contacts and notes via voice after networking events' },
  DOCUMENT_SUMMARIZATION: { label: 'Document Summarization', phase: 3, description: 'AI-generated document summaries' },
  AUTO_TAGGING: { label: 'Auto Tagging', phase: 3, description: 'Automatically tag documents' },
  SIMILAR_DOCUMENTS: { label: 'Similar Documents', phase: 3, description: 'Find similar documents across grants' },
};