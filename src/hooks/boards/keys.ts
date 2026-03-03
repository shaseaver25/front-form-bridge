// ============ Query Keys ============
export const boardKeys = {
  all: ['boards'] as const,
  lists: () => [...boardKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...boardKeys.lists(), filters] as const,
  details: () => [...boardKeys.all, 'detail'] as const,
  detail: (id: string) => [...boardKeys.details(), id] as const,
  members: (id: string) => [...boardKeys.detail(id), 'members'] as const,
  cards: (id: string) => [...boardKeys.detail(id), 'cards'] as const,
  cardDetails: (cardId: string) => ['card-details', cardId] as const,
};
