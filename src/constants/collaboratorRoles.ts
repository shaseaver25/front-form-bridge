export const COLLABORATOR_ROLES = {
  viewer: {
    label: 'Viewer',
    description: 'Can view documents and discussions',
    permissions: {
      view_documents: true,
      upload_documents: false,
      edit_documents: false,
      view_tasks: true,
      edit_tasks: false,
      add_comments: true,
      view_board: true,
      edit_board: false
    }
  },
  contributor: {
    label: 'Contributor',
    description: 'Can view, upload, and comment',
    permissions: {
      view_documents: true,
      upload_documents: true,
      edit_documents: false,
      view_tasks: true,
      edit_tasks: false,
      add_comments: true,
      view_board: true,
      edit_board: false
    }
  },
  editor: {
    label: 'Editor',
    description: 'Can view, edit, and manage project content',
    permissions: {
      view_documents: true,
      upload_documents: true,
      edit_documents: true,
      view_tasks: true,
      edit_tasks: true,
      add_comments: true,
      view_board: true,
      edit_board: true
    }
  }
} as const;

export type CollaboratorRole = keyof typeof COLLABORATOR_ROLES;
export type CollaboratorPermissions = typeof COLLABORATOR_ROLES[CollaboratorRole]['permissions'];

export function hasPermission(
  role: CollaboratorRole,
  permission: keyof CollaboratorPermissions
): boolean {
  return COLLABORATOR_ROLES[role].permissions[permission];
}

export function getCollaboratorRoleOptions() {
  return Object.entries(COLLABORATOR_ROLES).map(([value, config]) => ({
    value: value as CollaboratorRole,
    label: config.label,
    description: config.description
  }));
}