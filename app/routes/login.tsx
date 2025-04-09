import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    MetaFunction,
  } from "@remix-run/node";
  import { json, redirect } from "@remix-run/node";
  import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
  import { useEffect, useRef } from "react";
  
  import { verifyLogin } from "~/routes/utils/auth.server";
  import { createUserSession, getUserId } from "~/routes/utils/session.server";
  import { safeRedirect } from "~/routes/utils/utils";
  import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Email is invalid"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password is too short"),
  redirectTo: z.string().optional(),
  remember: z.union([z.literal("on"), z.literal("off")]).optional(),
});

export type LoginSchemaType = z.infer<typeof LoginSchema>;

  export const loader = async ({ request }: LoaderFunctionArgs) => {
    const userId = await getUserId(request);
    if (userId) return redirect("/");
    return json({});
  };
  

  export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const rawFormData = Object.fromEntries(formData);
  
    const parsed = LoginSchema.safeParse(rawFormData);
  
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return json(
        {
          errors: {
            email: errors.email?.[0] ?? null,
            password: errors.password?.[0] ?? null,
          },
        },
        { status: 400 },
      );
    }
  
    const { email, password, redirectTo, remember } = parsed.data;
  
    const user = await verifyLogin(email, password);
    if (!user) {
      return json(
        { errors: { email: "Invalid email or password", password: null } },
        { status: 400 },
      );
    }
  
    return createUserSession({
      redirectTo: safeRedirect(redirectTo, "/"),
      remember: remember === "on",
      request,
      userId: user.id,
    });
  };
  
  export const meta: MetaFunction = () => [{ title: "Login" }];
  
  export default function LoginPage() {
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirectTo") || "/projects";
    const actionData = useActionData<typeof action>();
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
  
    useEffect(() => {
      if (actionData?.errors?.email) {
        emailRef.current?.focus();
      } else if (actionData?.errors?.password) {
        passwordRef.current?.focus();
      }
    }, [actionData]);
  
    return (
      <div className="flex min-h-full flex-col justify-center">
        <div className="mx-auto w-full max-w-md px-8 pt-12 space-y-6">
        <h1  className=" font-bold text-2xl ">Login</h1>
          
          <Form method="post" className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  ref={emailRef}
                  id="email"
                  required
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus={true}
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                />
                {actionData?.errors?.email ? (
                  <div className="pt-1 text-red-700" id="email-error">
                    {actionData.errors.email}
                  </div>
                ) : null}
              </div>
            </div>
  
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  ref={passwordRef}
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                />
                {actionData?.errors?.password ? (
                  <div className="pt-1 text-red-700" id="password-error">
                    {actionData.errors.password}
                  </div>
                ) : null}
              </div>
            </div>
  
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <button
              type="submit"
              className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
            >
              Log in
            </button>
            <div className="flex items-center justify-center">
            <div className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link
                  className="text-blue-500 underline"
                  to={{
                    pathname: "/signup",
                    search: searchParams.toString(),
                  }}
                >
                  Sign up
                </Link>
              </div>
            </div>
          </Form>
        </div>
      </div>
    );
  }
  