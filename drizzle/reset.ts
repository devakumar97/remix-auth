import { db } from "./client";
import {
  users,
  userImages,
  projects,
  projectImages,
  passwords,
  sessions,
  permissions,
  roles,
  userRoles,
  rolePermissions,
} from "./schema";

async function resetDb() {
  console.log("🧹 Resetting database...");

  // The order matters due to foreign key constraints
  await db.delete(rolePermissions);
  await db.delete(userRoles);
  await db.delete(permissions);
  await db.delete(roles);
  await db.delete(sessions);
  await db.delete(passwords);
  await db.delete(projectImages);
  await db.delete(projects);
  await db.delete(userImages);
  await db.delete(users);

  console.log("✅ Database reset complete.");
}

resetDb()
  .catch((err) => {
    console.error("❌ Error resetting database:", err);
  })
  .finally(() => {
    process.exit();
  });
