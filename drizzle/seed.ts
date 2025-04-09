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
import { faker } from "@faker-js/faker";
import "dotenv/config";
import { db } from "./client";
import { hash } from "bcryptjs";

const generateUUID = () => faker.string.uuid();

async function seed() {
  console.log("🌱 Seeding database...");

  // --- STEP 1: Create Roles ---
  const roleData = [
    { id: generateUUID(), name: "admin", description: "Administrator", createdAt: new Date(), updatedAt: new Date() },
    { id: generateUUID(), name: "editor", description: "Can edit content", createdAt: new Date(), updatedAt: new Date() },
    { id: generateUUID(), name: "viewer", description: "Can only view content", createdAt: new Date(), updatedAt: new Date() },
  ];

  await db.insert(roles).values(roleData);
  console.log("✅ Roles inserted");

  const roleMap = Object.fromEntries(roleData.map(role => [role.name, role.id]));

  // --- STEP 2: Create Known Users for Each Role ---
  const knownUsers = [
    { email: "admin@example.com", password: "admin123", role: "admin" },
    { email: "editor@example.com", password: "editor123", role: "editor" },
    { email: "viewer@example.com", password: "viewer123", role: "viewer" },
  ];

  for (const user of knownUsers) {
    const userId = generateUUID();
    const hashed = await hash(user.password, 10);

    await db.insert(users).values({
      id: userId,
      email: user.email,
      username: user.email.split("@")[0],
      name: faker.person.fullName(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(passwords).values({
      userId,
      hash: hashed,
    });

    await db.insert(userRoles).values({
      userId,
      roleId: roleMap[user.role],
    });

    await db.insert(userImages).values({
      id: generateUUID(),
      userId,
      altText: "Profile Image",
      objectKey: faker.image.avatar(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(sessions).values({
      id: generateUUID(),
      userId,
      expirationDate: faker.date.future(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add a project for the user
    const projectId = generateUUID();
    await db.insert(projects).values({
      id: projectId,
      title: faker.company.name(),
      description: faker.lorem.sentence(),
      status: "PENDING",
      deadline: faker.date.future(),
      ownerId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(projectImages).values({
      id: generateUUID(),
      projectId,
      altText: "Project image",
      objectKey: faker.image.url(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Created ${user.role} user: ${user.email} / ${user.password}`);
  }

  // --- STEP 3: Permissions ---
  const permissionData = [
    { id: generateUUID(), action: "create", entity: "project", access: "any", description: "Create any project", createdAt: new Date(), updatedAt: new Date() },
    { id: generateUUID(), action: "read", entity: "project", access: "any", description: "Read any project", createdAt: new Date(), updatedAt: new Date() },
    { id: generateUUID(), action: "read", entity: "project", access: "own", description: "Read own project", createdAt: new Date(), updatedAt: new Date() },
    { id: generateUUID(), action: "edit", entity: "project", access: "own", description: "Edit own project", createdAt: new Date(), updatedAt: new Date() },
    { id: generateUUID(), action: "delete", entity: "project", access: "any", description: "Delete any project", createdAt: new Date(), updatedAt: new Date() },
    { id: generateUUID(), action: "delete", entity: "user", access: "own", description: "Delete own user", createdAt: new Date(), updatedAt: new Date() },
    { id: generateUUID(), action: "edit", entity: "project", access: "any", description: "Edit any project", createdAt: new Date(), updatedAt: new Date() },
    
  ];
  

  await db.insert(permissions).values(permissionData);
  console.log("✅ Permissions inserted");

  const rolePermissionsData = [
    // Admin: full access
    { roleId: roleMap.admin, permissionId: permissionData[0].id }, // create any
    { roleId: roleMap.admin, permissionId: permissionData[1].id }, // read any
    { roleId: roleMap.admin, permissionId: permissionData[2].id }, // read own
    { roleId: roleMap.admin, permissionId: permissionData[3].id }, // edit own
    { roleId: roleMap.admin, permissionId: permissionData[4].id }, // delete any
    { roleId: roleMap.admin, permissionId: permissionData[5].id }, // delete own user
    { roleId: roleMap.admin, permissionId: permissionData[6].id }, // edit:any

  
    // Editor: partial access
    { roleId: roleMap.editor, permissionId: permissionData[0].id }, // create any
    { roleId: roleMap.editor, permissionId: permissionData[1].id }, // read any ✅ NEW
    { roleId: roleMap.editor, permissionId: permissionData[2].id }, // read own
    { roleId: roleMap.editor, permissionId: permissionData[3].id }, // edit own
  
    // Viewer: limited access
    { roleId: roleMap.viewer, permissionId: permissionData[1].id }, // read any ✅ NEW
    { roleId: roleMap.viewer, permissionId: permissionData[2].id }, // read own
    { roleId: roleMap.viewer, permissionId: permissionData[5].id }, // delete own user
  ];
  
  
  

  await db.insert(rolePermissions).values(rolePermissionsData);
  console.log("✅ Role Permissions assigned");
}

seed()
  .catch((err) => console.error("❌ Error seeding database:", err))
  .finally(() => process.exit());
