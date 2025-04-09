import {  redirect } from "@remix-run/node";

export const loader = async () => {
  return redirect("/login");
};

export default function Index() {
  return null;
}
