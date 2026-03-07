import type { Access, FieldAccess } from "payload";

type UserWithRoles = {
  roles?: string[] | null;
};

function hasRole(user: null | UserWithRoles | undefined, role: string) {
  return Boolean(user && Array.isArray(user.roles) && user.roles.includes(role));
}

function hasAdminRole(user: null | UserWithRoles | undefined) {
  return hasRole(user, "admin");
}

function hasEditorRole(user: null | UserWithRoles | undefined) {
  return hasRole(user, "editor");
}

export const isAdmin: Access = ({ req }) => hasAdminRole(req.user as UserWithRoles | null | undefined);

export const isAdminFieldLevel: FieldAccess = ({ req }) => hasAdminRole(req.user as UserWithRoles | null | undefined);

export const isEditor: Access = ({ req }) => {
  const user = req.user as UserWithRoles | null | undefined;
  return hasAdminRole(user) || hasEditorRole(user);
};

export const isEditorFieldLevel: FieldAccess = ({ req }) => {
  const user = req.user as UserWithRoles | null | undefined;
  return hasAdminRole(user) || hasEditorRole(user);
};

export const isAdminOrSelf: Access = ({ id, req }) => {
  const user = req.user as ({ id?: number | string } & UserWithRoles) | null | undefined;

  if (hasAdminRole(user)) {
    return true;
  }

  return Boolean(user && user.id && String(user.id) === String(id));
};

export const isAdminOrSelfFieldLevel: FieldAccess = ({ req }) => {
  const user = req.user as ({ id?: number | string } & UserWithRoles) | null | undefined;
  return Boolean(user && (hasAdminRole(user) || user.id));
};

export const publicRead: Access = () => true;
