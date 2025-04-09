import { db } from "drizzle/client";
import { projects, } from "drizzle/schema";
import { eq } from "drizzle-orm";
import type { ProjectStatus } from "drizzle/schema";


// Get all projects owned by a specific user
export async function getProjectsByOwner(ownerId: string) {
  return await db.query.projects.findMany({
    where: eq(projects.ownerId, ownerId),
    orderBy: (projects, { desc }) => [desc(projects.updatedAt)],
  });
}

// Create a new project
export async function createProject({
  title,
  description,
  deadline,
  ownerId,
  status,
}: {
  title: string;
  description: string;
  deadline: Date;
  ownerId: string;
  status: ProjectStatus; 
}) {
  const result = await db
    .insert(projects)
    .values({
      title,
      description,
      deadline,
      ownerId,
      status, 
    })
    .returning();

  return result[0];
}



// Get a project by ID (no access control applied)
export async function getProjectById(id: string) {
  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  return result[0] ?? null;
}

// Check if the user is the owner of a project
export async function isProjectOwner(projectId: string, userId: string) {
  const project = await getProjectById(projectId);
  return project?.ownerId === userId;
}


export async function updateProject(
  id: string,
  data: {
    title: string;
    description: string;
    deadline: Date;
    status: ProjectStatus; 
  }
) {
  return db.update(projects).set(data).where(eq(projects.id, id));
}

// Delete a project (assumes caller has already authorized the action)
export async function deleteProject(id: string) {
  await db.delete(projects).where(eq(projects.id, id));
}
