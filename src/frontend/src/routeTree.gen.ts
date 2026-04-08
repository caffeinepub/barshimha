import { createRootRoute, createRoute } from "@tanstack/react-router";
import { Layout } from "./components/Layout";
import { Admin } from "./pages/Admin";
import { CsvPreview } from "./pages/CsvPreview";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { Study } from "./pages/Study";

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: Dashboard,
});

const studyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/study",
  component: Study,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: Profile,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: Admin,
});

const csvPreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/csv-preview/$previewId",
  component: CsvPreview,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  studyRoute,
  profileRoute,
  adminRoute,
  csvPreviewRoute,
]);
