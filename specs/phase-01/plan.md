# EDMS Phase 01: MVP Implementation Plan

## 🎯 Phase Goals
The primary goal of Phase 1 is to deliver a functional MVP that replaces the paper correspondence routing within the police department. This involves building a robust backend with role-based security, a relational database schema for document tracking, and a React-based frontend for worker and admin interactions.

## 📋 Scope Definition
- **Included Features:**
  - Login (JWT) and RBAC (Super Admin, Worker).
  - Department management (CRUD, soft-delete).
  - User management (Worker CRUD, one-time password sharing).
  - Document workflow (Create, Inbox, Pickup, Start, Forward, Complete).
  - Atomic Inward/Outward numbering sequences.
  - Audit logging for all state changes.
- **Excluded Features:**
  - File storage in S3 (Phase 2).
  - OCR and full-text search (Phase 2).
  - Legacy data import (Phase 2).
  - Password recovery emails (out of scope for MVP).

## ✅ Success Criteria
1. Super Admin can create a department and a worker.
2. Worker can create a document and dispatch it to another department.
3. Worker in the target department can see the document in their inbox and pick it up.
4. All actions generate corresponding audit log entries.
5. Frontend UI reflects document status changes in real-time.
6. Race conditions during document "pickup" are handled correctly by the database.

## 🔗 Implementation Roadmap (Phase 1)
- **Step 1:** BackendFoundation (DB, Auth, Middleware).
- **Step 2:** Admin Module (Depts, Users).
- **Step 3:** Document Routing (Creation, Numbering, Inbox).
- **Step 4:** Document Lifecycle (Pickup, Forward, Complete).
- **Step 5:** UI/UX Development (Dashboards, Timeline, Action Buttons).
- **Step 6:** System Validation and Audit Review.
