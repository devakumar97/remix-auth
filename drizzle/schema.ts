import { 
  uuid, pgTable, text, timestamp, unique, index, pgEnum, primaryKey 
} from "drizzle-orm/pg-core";


export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(), 
  email: text("email").unique().notNull(),
  username: text("username").unique().notNull(),
  name: text("name"), 

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userImages = pgTable("user_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  altText: text("alt_text"),
  objectKey: text("object_key").notNull(),

  userId: uuid("user_id").unique().notNull().references(() => users.id, { 
    onDelete: "cascade", 
    onUpdate: "cascade" 
  }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectStatusEnum = pgEnum("project_status", ["PENDING", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]);
export type ProjectStatus = (typeof projectStatusEnum.enumValues)[number];


export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: projectStatusEnum("status").default("PENDING"), 
    deadline: timestamp("deadline").notNull(),

    ownerId: uuid("owner_id").references(() => users.id, { 
      onDelete: "cascade", 
      onUpdate: "cascade" 
    }),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    ownerIndex: index("project_owner_idx").on(table.ownerId), // Index for owner queries
    ownerUpdatedIndex: index("project_owner_updated_idx").on(table.ownerId, table.updatedAt), // Optimized query index
  })
);

export const projectImages = pgTable(
  "project_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    altText: text("alt_text"),
    objectKey: text("object_key").notNull(),

    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { 
        onDelete: "cascade", 
        onUpdate: "cascade" 
      }),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    projectIndex: index("project_image_project_idx").on(table.projectId), // Index for project queries
  })
);

export const passwords = pgTable("passwords", {
  hash: text("hash").notNull(),

  userId: uuid("user_id")
    .unique() // Ensures one password per user
    .notNull()
    .references(() => users.id, { 
      onDelete: "cascade", 
      onUpdate: "cascade" 
    }),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    expirationDate: timestamp("expiration_date").notNull(),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { 
        onDelete: "cascade", 
        onUpdate: "cascade" 
      }),
  },
  (table) => ({
    userIndex: index("session_user_idx").on(table.userId), // Non-unique index on userId
  })
);


export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    action: text("action").notNull(), // e.g., create, read, update, delete
    entity: text("entity").notNull(), //
    access: text("access").notNull(), // e.g., own or any
    description: text("description").default(""), // Default empty string

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    uniquePermission: unique("unique_permission").on(
      table.action,
      table.entity,
      table.access
    ),
  })
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").unique().notNull(),
    description: text("description").default(""),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }
);

//UserRoles Join Table (Users ↔ Roles)
export const userRoles = pgTable("user_roles", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
}));

//RolePermissions Join Table (Roles ↔ Permissions)
export const rolePermissions = pgTable("role_permissions", {
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

