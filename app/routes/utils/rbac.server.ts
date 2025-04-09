import { db } from "drizzle/client";
import { eq } from "drizzle-orm";
import {
  permissions,
  roles,
  userRoles,
  rolePermissions,
} from "drizzle/schema";

export type Permission = {
  action: string;
  entity: string;
  access: "own" | "any";
};

export function hasPermission(
  permissions: Permission[],
  action: string,
  entity: string,
  resourceOwnerId: string,
  userId: string
): boolean {
  return permissions.some((p) => {
    return (
      p.action === action &&
      p.entity === entity &&
      (p.access === "any" || (p.access === "own" && resourceOwnerId === userId))
    );
  });
}

export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const result = await db
    .select({
      action: permissions.action,
      entity: permissions.entity,
      access: permissions.access,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, userId));

  // Cast access string to "own" | "any"
  return result.map((p) => ({
    action: p.action,
    entity: p.entity,
    access: p.access === "any" ? "any" : "own", // cast safely
  }));
}

export function canReadProject({
  userId,
  project,
  permissions,
}: {
  userId: string;
  project: { ownerId: string; isPublic: boolean };
  permissions: Permission[];
}) {
  return (
    project.isPublic ||
    permissions.some((p) =>
      p.action === "read" && p.entity === "project" && (
        p.access === "any" ||
        (p.access === "own" && project.ownerId === userId)
      )
    )
  );
}

export function canEditProject({
  userId,
  project,
  permissions,
}: {
  userId: string;
  project: { ownerId: string };
  permissions: Permission[];
}) {
  return permissions.some((p) =>
    p.action === "edit" && p.entity === "project" && (
      p.access === "any" ||
      (p.access === "own" && project.ownerId === userId)
    )
  );
}
