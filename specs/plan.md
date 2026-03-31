# EDMS Global Project Plan

## 📝 Project Overview
The Electronic Document Management System (EDMS) is a centralized, digital workflow solution for police department correspondence. It replaces paper-based and informal processes (WhatsApp, email) with a role-controlled, traceable, and secure digital routing system.

## 🏗️ High-Level Architecture
- **Frontend:** React.js (Vite) for responsive, role-based user interfaces.
- **Backend:** Node.js (Express.js) for RESTful API services and business logic.
- **Database:** PostgreSQL for relational data persistence and audit logging.
- **Security:** JWT-based stateless authentication and server-side RBAC middleware.
- **Storage:** Local file system (`/uploads`) with an abstraction layer ready for S3.

## 🗺️ Phase Breakdown (Roadmap)
### Phase 1: MVP (Digital Correspondence) - 🚀 **Current**
- Core Role-Based Access Control (`super_admin`, `worker`).
- Department and User management.
- Digital document creation, routing, and lifecycle management.
- Inward/Outward department-wise auto-numbering.
- Atomic audit logging for all critical actions.

### Phase 1.1: Extended Correspondence - 🚀 **Current**
- New Roles: `officer`, `assistant`.
- Rich Text Editor (Tiptap) and Compose canvas.
- Draft & Review cycles (Officer/Assistant workflow).
- OTP-delegated document dispatch.
- CC / BCC and Reference Linking.
- Document access restriction.

### Phase 2: Enhanced Capabilities - 🛠️ **Future**
- S3/Object Storage integration.
- Full-Text Search (using PostgreSQL GIN indexes).
- OCR processing for file attachments.
- Legacy data import tooling.

## 🏆 Key Milestones
1. **Foundation:** Database schema initialization and backend boilerplate.
2. **Identity:** Authentication (JWT) and RBAC implementation.
3. **Admin Core:** Department and User management modules.
4. **Workflow:** Document creation, inbox, pickup, and processing logic.
5. **Auditing:** System-wide audit log generation and viewing.
6. **Frontend:** Role-gated React dashboards and document views.

## 🔗 Dependencies
- **Phase 1 -> Phase 2:** Phase 1 implements storage stubs and search vectors to ensure seamless migration to Phase 2 features.
