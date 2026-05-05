import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("terms-and-conditions", "routes/terms.tsx"),
  route("privacy-policy", "routes/privacy.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),

  // Super Admin Routes
  layout("routes/super-admin/layout.tsx", [
    route("super-admin", "routes/super-admin/dashboard.tsx"),
    route("super-admin/buildings", "routes/super-admin/buildings.tsx"),
    route("super-admin/admins", "routes/super-admin/admins.tsx"),
    route("super-admin/admins-assign/:id", "routes/super-admin/admins-assign.$id.tsx"),
    route("super-admin/locations", "routes/super-admin/locations.tsx"),
    route("super-admin/settings", "routes/super-admin/settings.tsx"),
    route("super-admin/upi-settings", "routes/super-admin/upi-settings.tsx"),
  ]),

  // Admin Routes
  layout("routes/admin/layout.tsx", [
    route("admin", "routes/admin/dashboard.tsx"),
    route("admin/buildings", "routes/admin/buildings.tsx"),
    route("admin/residents", "routes/admin/residents.tsx"),
    route("admin/residents/:id", "routes/admin/resident-profile.tsx"),
    route("admin/residents/:id/edit", "routes/admin/residents-edit.tsx"),
    route("admin/residents/add", "routes/admin/residents-add.tsx"),
    route("admin/buildings/:id/layout", "routes/admin/buildings-manage.tsx"),
    route("admin/payments", "routes/admin/payments.tsx"),
    route("admin/expenses", "routes/admin/expenses.tsx"),
    route("admin/reminders", "routes/admin/reminders.tsx"),
    route("admin/reports", "routes/admin/reports.tsx"),
    route("admin/upi-settings", "routes/admin/upi-settings.tsx"),
    route("admin/room-types", "routes/admin/room-types.tsx"),
    route("admin/settings", "routes/admin/settings.tsx"),
  ]),

  // Resident Routes
  layout("routes/resident/layout.tsx", [
    route("resident", "routes/resident/dashboard.tsx"),
    route("resident/payments", "routes/resident/payments.tsx"),
    route("resident/profile", "routes/resident/profile.tsx"),
  ]),
] satisfies RouteConfig;
