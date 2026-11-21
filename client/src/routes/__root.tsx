import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

const RootLayout = () => (
  <>
    <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
      <Link
        to="/"
        className="text-lg font-bold tracking-tight text-slate-900 uppercase"
      >
        Route Forecaster
      </Link>

      <Link
        to="/"
        className="rounded-lg bg-emerald-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
        Plan a journey
      </Link>
    </header>
    <hr />
    <Outlet />
  </>
);

export const Route = createRootRoute({ component: RootLayout });
