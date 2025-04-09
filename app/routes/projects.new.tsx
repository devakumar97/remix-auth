import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { z } from "zod";

import { createProject } from "~/routes/utils/projects.server";
import { requireUser } from "~/routes/utils/session.server";
import { getUserPermissions } from "~/routes/utils/rbac.server";

// Zod schema
const ProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  deadline: z.string().refine(
    (value) => !isNaN(Date.parse(value)),
    { message: "Valid deadline required" }
  ),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUser(request);
  const permissions = await getUserPermissions(user.id);

  const canCreateProject = permissions.some(
    (p) => p.action === "create" && p.entity === "project"
  );

  if (!canCreateProject) {
    console.error("403: User does not have permission to create projects");
    throw new Response("Forbidden: You do not have permission to create projects.", {
      status: 403,
    });
  }

  const formData = Object.fromEntries(await request.formData());


  const parseResult = ProjectSchema.safeParse(formData);
  if (!parseResult.success) {
    const errors = parseResult.error.flatten().fieldErrors;
    return json({ errors }, { status: 400 });
  }

  const { title, description, deadline, status } = parseResult.data;
// const imageFile = (await request.formData()).get("image");
// Here you can handle image upload to S3 or local filesystem, then store objectKey etc.

  const project = await createProject({
    title,
    description,
    deadline: new Date(deadline),
    status,
    ownerId: user.id,
  });
  console.log("Inserting into DB with status:", status);
  return redirect(`/projects/${project.id}`);
};


export default function NewProjectPage() {
  const actionData = useActionData<typeof action>();
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const deadlineRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actionData?.errors?.title) titleRef.current?.focus();
    else if (actionData?.errors?.description) descriptionRef.current?.focus();
    else if (actionData?.errors?.deadline) deadlineRef.current?.focus();
  }, [actionData]);

  return (
    <Form method="post" className="flex flex-col gap-4 w-full max-w-xl">
      <div>
        <label className="flex flex-col gap-1">
          <span>Title:</span>
          <input
            ref={titleRef}
            name="title"
            className="rounded-md border-2 border-blue-500 px-3 py-2 text-lg"
          />
        </label>
        {actionData?.errors?.title && (
          <div className="pt-1 text-red-700" id="title-error">
            {actionData.errors.title}
          </div>
        )}
      </div>

      <div>
        <label className="flex flex-col gap-1">
          <span>Description:</span>
          <textarea
            ref={descriptionRef}
            name="description"
            rows={5}
            className="rounded-md border-2 border-blue-500 px-3 py-2 text-lg"
          />
        </label>
        {actionData?.errors?.description && (
          <div className="pt-1 text-red-700" id="description-error">
            {actionData.errors.description}
          </div>
        )}
      </div>

      <div>
        <label className="flex flex-col gap-1">
          <span>Deadline:</span>
          <input
            ref={deadlineRef}
            type="date"
            name="deadline"
            className="rounded-md border-2 border-blue-500 px-3 py-2 text-lg"
          />
        </label>
        {actionData?.errors?.deadline && (
          <div className="pt-1 text-red-700" id="deadline-error">
            {actionData.errors.deadline}
          </div>
        )}
      </div>
        <div>
  <label className="flex flex-col gap-1">
    <span>Status:</span>
    <select
      name="status"
      className="rounded-md border-2 border-blue-500 px-3 py-2 text-lg"
      defaultValue="PENDING"
    >
      <option value="PENDING">Pending</option>
      <option value="IN_PROGRESS">In Progress</option>
      <option value="COMPLETED">Completed</option>
      <option value="ARCHIVED">Archived</option>
    </select>
  </label>
  {actionData?.errors?.status && (
    <div className="pt-1 text-red-700">{actionData.errors.status}</div>
  )}
</div>

<div>
  <label className="flex flex-col gap-1">
    <span>Project Image:</span>
    <input
      type="file"
      name="image"
      accept="image/*"
      className="rounded-md border-2 border-blue-500 px-3 py-2 text-lg"
    />
  </label>
</div>

      <div className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Create Project
        </button>
      </div>
    </Form>
  );
}
