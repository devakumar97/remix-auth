import { db } from "../db"; // Import your Drizzle DB instance
import { users, passwords, projects, roles, permissions } from "../db/schema"; // Import tables
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

// 🔹 Hash password function
async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

async function seed() {
  console.log("🌱 Seeding database...");

  // 🔹 Create users
  const userId1 = "user-1";
  const userId2 = "user-2";

  await db.insert(users).values([
    { id: userId1, email: "alice@example.com", username: "alice", name: "Alice" },
    { id: userId2, email: "bob@example.com", username: "bob", name: "Bob" },
  ]);

  // 🔹 Hash and store passwords
  await db.insert(passwords).values([
    { userId: userId1, hash: await hashPassword("password123") },
    { userId: userId2, hash: await hashPassword("password456") },
  ]);

  // 🔹 Create projects
  await db.insert(projects).values([
    {
      id: "project-1",
      title: "First Project",
      description: "This is the first test project",
      status: "PENDING",
      deadline: new Date("2025-12-31"),
      ownerId: userId1,
    },
    {
      id: "project-2",
      title: "Second Project",
      description: "This is the second test project",
      status: "IN_PROGRESS",
      deadline: new Date("2025-10-15"),
      ownerId: userId2,
    },
  ]);

  // 🔹 Create roles
  await db.insert(roles).values([
    { id: "role-admin", name: "Admin", description: "Administrator role" },
    { id: "role-user", name: "User", description: "Regular user role" },
  ]);

  // 🔹 Create permissions
  await db.insert(permissions).values([
    { id: "perm-create", action: "create", entity: "project", access: "own" },
    { id: "perm-read", action: "read", entity: "project", access: "any" },
  ]);

  console.log("✅ Seeding complete!");
}

// Run the seeding function
seed()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
  })
  .finally(() => {
    process.exit();
  });
