import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { logout } from "~/routes/utils/session.server";

// Loader-based logout: good for <Form method="get" action="/logout" />
export async function loader() {
  return redirect('/login');
}

// Action-based logout: good for <Form method="post" action="/logout" />
export async function action({ request }: ActionFunctionArgs) {
  return logout(request);
}
