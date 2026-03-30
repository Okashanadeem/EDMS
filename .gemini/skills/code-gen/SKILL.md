---
name: code-gen
description: Skill for generating full-stack EDMS components, including Express modules (routes, controllers, services) and React pages/components, ensuring adherence to the Phase 1 MVP architecture.
---

# 🛠️ Skill: Code Generation (EDMS)

## 🎯 Goal
Automate the creation of production-ready, role-gated full-stack components following the "Service-Controller-Route" pattern for the backend and "Context-Layout-Page" pattern for the frontend.

## 📋 Available Resources
- `Doc/V1.0/MainDoc.md`: Source of truth for schema, API routes, and business logic.
- `server/src/config/db.js`: Database connection pool.
- `client/src/api/axios.js`: Authorized API client.

## 🔄 Procedural Workflow

### 1. Discovery & Alignment
- Scan `Doc/V1.0/MainDoc.md` for the specific module requirements (e.g., "Departments" or "Documents").
- Verify the required database schema in the documentation.

### 2. Backend Implementation (Atomic)
- **Service:** Create `[module].service.js` with PostgreSQL transaction-safe logic. Use `client` parameter for transactions where required.
- **Controller:** Create `[module].controller.js` to handle request parsing and response formatting (consistent JSON structure).
- **Routes:** Create `[module].routes.js` using `auth` and `rbac` middleware.
- **Integration:** Mount the router in `server/src/app.js`.

### 3. Frontend Implementation (Atomic)
- **Component/Page:** Create the React component in `client/src/pages/` or `client/src/components/`.
- **State:** Utilize `AuthContext.jsx` for role-based UI rendering.
- **API Call:** Use the Axios interceptor for JWT-authenticated requests.
- **Routing:** Add the route to `App.jsx` within the appropriate `ProtectedRoute` wrapper.

### 4. Validation
- Check for proper error handling (try/catch blocks with 4xx/5xx status codes).
- Ensure JSDoc comments are present for all exported functions.
- Verify that no hardcoded credentials or environment variables are leaked.

## ⚠️ Constraints
- **Database:** Must use `INSERT...RETURNING *` for creation.
- **Security:** Every route must have `auth` and `rbac` guards.
- **Logic:** Business logic MUST reside in the `Service` layer, not the `Controller`.
- **RBAC:** Strictly enforce `super_admin` vs `worker` access per `MainDoc.md`.
