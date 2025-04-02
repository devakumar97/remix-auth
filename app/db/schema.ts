import { 
  pgTable, text, timestamp, boolean, integer, bigint, unique, index, pgEnum,} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ✅ ENUM for Project Status
export const projectStatusEnum = pgEnum("project_status", ["PENDING", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]);

// ✅ User Table
export const users = pgTable("users", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique().notNull(),
  username: text("username").unique().notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ✅ User Image Table (One-to-One with User)
export const userImages = pgTable("user_images", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  altText: text("alt_text"),
  objectKey: text("object_key").notNull(),
  userId: text("user_id").unique().notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ✅ Password Table (One-to-One with User)
export const passwords = pgTable("passwords", {
  hash: text("hash").notNull(),
  userId: text("user_id").unique().notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

// ✅ Project Table
export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: projectStatusEnum("status").default("PENDING"),
    deadline: timestamp("deadline").notNull(),
    ownerId: text("owner_id").references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    ownerIndex: index("project_owner_idx").on(table.ownerId),
    ownerUpdatedIndex: index("project_owner_updated_idx").on(table.ownerId, table.updatedAt),
  })
);

// ✅ Project Images Table
export const projectImages = pgTable("project_images", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  altText: text("alt_text"),
  objectKey: text("object_key").notNull(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade", onUpdate: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ✅ Session Table
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    expirationDate: timestamp("expiration_date").notNull(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIndex: index("session_user_idx").on(table.userId),
  })
);

// ✅ Permission Table
export const permissions = pgTable(
  "permissions",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    access: text("access").notNull(),
    description: text("description").default(""),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    uniquePermission: unique("unique_permission").on(table.action, table.entity, table.access),
  })
);

// ✅ Role Table
export const roles = pgTable("roles", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").unique().notNull(),
  description: text("description").default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ✅ Verification Table
export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    type: text("type").notNull(),
    target: text("target").notNull(),
    secret: text("secret").notNull(),
    algorithm: text("algorithm").notNull(),
    digits: integer("digits").notNull(),
    period: integer("period").notNull(),
    charSet: text("char_set").notNull(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    uniqueVerification: unique("unique_verification").on(table.target, table.type),
  })
);

// ✅ Connection Table
export const connections = pgTable(
  "connections",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    providerName: text("provider_name").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    uniqueConnection: unique("unique_connection").on(table.providerName, table.providerId),
  })
);

// ✅ Passkey Table
export const passkeys = pgTable(
  "passkeys",
  {
    id: text("id").primaryKey(),
    aaguid: text("aaguid").notNull(),
    publicKey: bytea("public_key").notNull(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    webauthnUserId: text("webauthn_user_id").notNull(),
    counter: bigint("counter", { mode: "number" }).notNull(),
    deviceType: text("device_type").notNull(), // 'singleDevice' or 'multiDevice'
    backedUp: boolean("backed_up").notNull(),
    transports: text("transports"), // Stored as comma-separated values
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIndex: index("passkey_user_idx").on(table.userId),
  })
);
