
import type { LinksFunction } from "@remix-run/node";

import "./tailwind.css";
// import { Button } from "./routes/components/ui/button";
// import { UserDropdown } from "./routes/components/user-dropdown";
import { Link, Outlet,} from "react-router";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

// const async function loader (){

// }

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
       
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

export default function App() {
  // const user = useLoaderData<typeof loader>()

  return (
    <div className="">
      <header>
        <nav>
          <Logo/>
          {/* {user ? <UserDropdown/> : (<Button asChild>
            <Link to="/login">Login</Link>
          </Button>/>)} */}
        </nav>
      </header>
      <main>
        <Outlet/>
      </main>
      <footer>
        <Logo/> 
      </footer>
    </div>
  );
}

function Logo() {
  return <Link  to="/">Chat-on</Link>
}