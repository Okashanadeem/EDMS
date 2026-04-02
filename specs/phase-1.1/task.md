# Phase 1.1: Detailed Task Breakdown

## 🧩 Milestone 6: Identity & Schema Evolution
30. [x] Update `user_role` enum with `officer` and `assistant`.
31. [x] Add `officer_id` and `can_send_on_behalf` columns to `users` table.
32. [x] Update `doc_status` enum with `draft`.
33. [x] Add `body_html` and other Phase 1.1 columns to `documents` table.
34. [x] Create `document_recipients` table (CC/BCC).
35. [x] Create `document_references` table (Linking).
36. [x] Create `document_otps` table (Delegated sending).
37. [x] Update `server/src/modules/users` to handle new role creation/update.

## 🧩 Milestone 7: Draft & Compose Backend
38. [x] Implement Drafts Module: `POST /drafts`, `GET /drafts`, `PATCH /drafts/:id`, `DELETE /drafts/:id`.
39. [x] Update `POST /documents` to support `body_html`, `cc`, `bcc`, `references`, and `is_restricted`.
40. [x] Implement `GET /documents/:id` with server-side restriction enforcement and reference inclusion.
41. [x] Refactor inward/outward number generation to support multi-destination (CC/BCC) scenarios.

## 🧩 Milestone 8: Officer-Assistant Review & OTP
42. [x] Implement `POST /drafts/:id/submit` (Assistant → Officer submission).
43. [x] Implement `POST /drafts/:id/approve` and `POST /drafts/:id/revise` (Officer actions).
44. [x] Implement OTP Service (`otp.service.js`) with Node Mailer integration.
45. [x] Implement `POST /otp/request` and `POST /otp/verify` endpoints.
46. [x] Add audit logging for all new Phase 1.1 action strings.

## 🧩 Milestone 9: UI/UX & Layout Updates
47. [x] Scaffold `OfficerLayout` and `AssistantLayout`.
48. [x] Integrate **Tiptap** and create `RichTextEditor` component.
49. [x] Implement `Compose.jsx` with full-width word-processing canvas.
50. [x] Create `DraftReviewPanel` for Officer review flow.
51. [x] Implement `OtpModal` for delegated sending.
52. [x] Create `RestrictionSelector`, `ReferenceSearch`, and `CcBccSelector` components.
53. [x] Update `DocumentDetail` to show reference chains and CC/BCC lists.
53a. [x] Implement automatic File Preview (Image/PDF) in Compose page.

## 🧩 Milestone 10: Validation & Governance
54. [x] End-to-end testing of Assistant → Officer review workflow.
55. [x] Verify OTP-based sending and audit log capture.
56. [x] Ensure restricted documents are inaccessible to unauthorized users.
57. [x] Create `Doc/V1.1/API_BOOK.md` with visual examples.
58. [x] Final Project Review for Phase 1.1.

## 🧩 Milestone 11: Pickup Refinement & Workspace
59. [x] Update `pickupDocument` in `documents.service.js` to enforce `is_restricted` at the database level.
60. [x] Rebrand "History" to "My Documents" in `WorkerLayout`, `OfficerLayout`, and `AssistantLayout`.
61. [x] Update `DeptInbox.jsx` to disable "Pick Up" for unauthorized restricted documents.
62. [x] Update `CorrespondenceHistory.jsx` to reflect the "My Documents" branding and focus.
63. [x] Verify atomic pickup for CC/BCC recipients (Inward Number generation per department).

## 🧩 Milestone 12: Department History Restoration
64. [x] Implement `getDepartmentHistory` in `documents.service.js`.
65. [x] Create `GET /api/v1/documents/department` endpoint.
66. [x] Create `DepartmentHistory.jsx` component for universal department view.
67. [x] Add "History" link to `WorkerLayout`, `OfficerLayout`, and `AssistantLayout`.
68. [x] Register routes for `/history` in `App.jsx`.
