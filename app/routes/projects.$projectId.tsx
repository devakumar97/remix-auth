import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
  useNavigation,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import invariant from "tiny-invariant";

import { requireUserId } from "~/routes/utils/session.server";
import {
  getProjectById,
  updateProject,
  deleteProject,
} from "~/routes/utils/projects.server";
import {
  getUserPermissions,
  hasPermission,
} from "./utils/rbac.server";
import { z } from "zod";

const projectUpdateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  deadline: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid date",
  }),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]),
});
// --- Loader ---
export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  invariant(params.projectId, "projectId not found");

  const project = await getProjectById(params.projectId);
  if (!project) throw new Response("Not Found", { status: 404 });

  const permissions = await getUserPermissions(userId);
  const canRead = hasPermission(
    permissions,
    "read",
    "project",
    project.ownerId,
    userId
  );

  if (!canRead) {
    console.warn("Forbidden read attempt by", userId, "for project", project.id);
    throw new Response("Forbidden", { status: 403 });
  }

  return json({ project });
};

// --- Action ---
export const action = async ({ params, request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  invariant(params.projectId, "projectId not found");

  const formData = await request.formData();
  const _action = formData.get("_action");

  if (typeof _action !== "string") {
    return new Response("Invalid form submission", { status: 400 });
  }

  const project = await getProjectById(params.projectId);
  if (!project) throw new Response("Not Found", { status: 404 });

  const permissions = await getUserPermissions(userId);

  switch (_action) {
    case "delete": {
      const canDelete = hasPermission(
        permissions,
        "delete",
        "project",
        project.ownerId,
        userId
      );
      if (!canDelete) {
        console.warn("Forbidden delete by", userId);
        throw new Response("Forbidden", { status: 403 });
      }

      await deleteProject(project.id);
      return redirect("/projects");
    }

    case "update": {
      const canEdit = hasPermission(
        permissions,
        "edit",
        "project",
        project.ownerId,
        userId
      );
      if (!canEdit) {
        console.warn("Forbidden update by", userId);
        throw new Response("Forbidden", { status: 403 });
      }

      const raw = Object.fromEntries(formData);
      const result = projectUpdateSchema.safeParse(raw);

      if (!result.success) {
        const errorMessage = JSON.stringify(result.error.flatten().fieldErrors);
        return new Response(`Validation failed: ${errorMessage}`, { status: 400 });
      }

      const { title, description, deadline, status } = result.data;

      await updateProject(project.id, {
        title,
        description,
        deadline: new Date(deadline),
        status,
      });

      return redirect(`/projects/${project.id}`);
    }

    default:
      return new Response("Invalid action", { status: 400 });
  }
};


// --- Component ---
export default function ProjectDetailsPage() {
  const { project } = useLoaderData<typeof loader>();
  const [isEditing, setIsEditing] = useState(false);
  const [wasUpdated, setWasUpdated] = useState(false);
  const navigation = useNavigation();

  const isSubmittingUpdate =
    navigation.state === "submitting" &&
    navigation.formData?.get("_action") === "update";

  useEffect(() => {
    if (isSubmittingUpdate) {
      setWasUpdated(true);
    } else if (wasUpdated && navigation.state === "idle") {
      setIsEditing(false);
      setWasUpdated(false);
    }
  }, [isSubmittingUpdate, navigation.state, wasUpdated]);

  return (
    <div className="max-w-xl space-y-6">
      <h3 className="text-2xl font-bold">{project.title}</h3>
      <p className="text-gray-700">{project.description}</p>
      <p className="text-sm text-gray-500">
        Deadline: {new Date(project.deadline).toLocaleDateString()}
      </p>
      <p className="text-sm text-gray-500">Status: {project.status}</p>
      {/* {project.images?.length > 0 && (
  <div className="mt-4">
    <h4 className="font-medium">Images:</h4>
    <div className="mt-2 grid grid-cols-2 gap-4">
      {project.images.map((img) => (
        <img
          key={img.id}
          src={`/uploads/${img.objectKey}`} // Adjust based on where you're storing images
          alt={img.altText || ""}
          className="rounded shadow"
        />
      ))}
    </div>
  </div>
)} */}
      <div className="mt-4 flex gap-4">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>

        <Form method="post">
          <button
            type="submit"
            name="_action"
            value="delete"
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Delete Project
          </button>
        </Form>
      </div>

      {isEditing && (
        <Form method="post" className="space-y-4 pt-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="title"
              type="text"
              name="title"
              defaultValue={project.title}
              required
              className="mt-1 block w-full rounded border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              defaultValue={project.description}
              required
              className="mt-1 block w-full rounded border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
              Deadline
            </label>
            <input
              id="deadline"
              type="date"
              name="deadline"
              defaultValue={project.deadline.slice(0, 10)}
              required
              className="mt-1 block w-full rounded border-gray-300 shadow-sm"
            />
          </div>
          <div>
  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
    Status
  </label>
  <select
    id="status"
    name="status"
    defaultValue={project.status ?? "PENDING"}
    className="mt-1 block w-full rounded border-gray-300 shadow-sm"
  >
    <option value="PENDING">Pending</option>
    <option value="IN_PROGRESS">In Progress</option>
    <option value="COMPLETED">Completed</option>
    <option value="ARCHIVED">Archived</option>
  </select>
</div>

<div>
  <label htmlFor="image" className="block text-sm font-medium text-gray-700">
    Upload Image
  </label>
  <input
    id="image"
    type="file"
    name="image"
    accept="image/*"
    className="mt-1 block w-full rounded border-gray-300 shadow-sm"
  />
</div>

          <button
            type="submit"
            name="_action"
            value="update"
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Save Changes
          </button>
        </Form>
      )}
    </div>
  );
}

// --- Error Boundary ---
export function ErrorBoundary() {
  const error = useRouteError();

  if (error instanceof Error) {
    return <div>An unexpected error occurred: {error.message}</div>;
  }

  if (!isRouteErrorResponse(error)) {
    return <h1>Unknown Error</h1>;
  }

  if (error.status === 404) {
    return <div>Project not found</div>;
  }

  if (error.status === 403) {
    return <div>Forbidden: You don’t have permission to access this project</div>;
  }

  return <div>An unexpected error occurred: {error.statusText}</div>;
}
