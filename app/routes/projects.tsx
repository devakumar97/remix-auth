import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";

import { getProjectsByOwner } from "~/routes/utils/projects.server";
import { requireUserId } from "~/routes/utils/session.server";
import { useUser } from "~/routes/utils/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const projects = await getProjectsByOwner(userId);
  return json({ projects });
};

export default function ProjectsPage() {
  const data = useLoaderData<typeof loader>();
  const user = useUser();

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 bg-gray-100">
  <h1 className="text-3xl font-bold">
    <Link to=".">Projects</Link>
  </h1>

  <div className="flex items-center gap-4">
    <p className="text-sm text-gray-700">{user.email}</p>
    <Form action="/logout" method="post">
      <button
        type="submit"
        className="rounded bg-slate-600 px-4 py-2 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
      >
        Logout
      </button>
    </Form>
  </div>
</header>


      <main className="flex h-full bg-white">
        <div className="h-full w-80 border-r bg-gray-50">
          <Link to="new" className="block p-4 text-xl text-blue-500">
            + New Project
          </Link>

          <hr />

          {data.projects.length === 0 ? (
            <p className="p-4">No projects yet</p>
          ) : (
            <ol>
              {data.projects.map((project) => (
                <li key={project.id}>
                  <NavLink
                    className={({ isActive }) =>
                      `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
                    }
                    to={project.id}
                  >
                    {project.title}
                  </NavLink>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
