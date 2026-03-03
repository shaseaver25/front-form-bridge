/**
 * @deprecated Import from '@/hooks/boards' instead. This file is maintained for backwards compatibility.
 * 
 * This file re-exports all board-related hooks from the new modular structure.
 * The original 1,189-line file has been split into focused modules:
 * - keys.ts: Query key factory
 * - queries.ts: useBoard, useBoards, useBoardMembers, useCardDetails
 * - boardMutations.ts: useCreateBoard, useUpdateBoard, useDeleteBoard
 * - columnMutations.ts: useCreateColumn, useUpdateColumn, useDeleteColumn, useReorderColumns
 * - cardMutations.ts: useCreateCard, useUpdateCard, useMoveCard, useDeleteCard, useDuplicateCard
 * - subtaskMutations.ts: useAddSubtask, useToggleSubtask, useDeleteSubtask
 * - commentMutations.ts: useAddComment, useUpdateComment, useDeleteComment
 * - timerMutations.ts: useStartTimer, useStopTimer, useLogTime
 * - memberMutations.ts: useAddBoardMember, useUpdateBoardMemberRole, useRemoveBoardMember
 * - dependencyMutations.ts: useCardDependencies, useAddDependency, useRemoveDependency
 */

// Re-export everything from the new modular structure
export * from './boards';
