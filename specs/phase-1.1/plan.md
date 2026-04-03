# EDMS Phase 1.1: Extended Correspondence & Review Workflow

## 🎯 Phase Goals
The primary goal of Phase 1.1 is to evolve the MVP into a production-ready, feature-rich correspondence system. This includes moving from plain text to **Rich Text (Tiptap)**, implementing a **Draft/Review cycle** for Officers and Assistants, and adding secure **OTP-based delegated sending**.

## 📋 Scope Definition (New Features)
- **Position-Based Architecture:** Roles and departments are assigned to "Positions" (Seats), and Users are assigned to these Positions.
- **Rich Text Editor (Tiptap):** Full-page writing canvas with MS Word-style formatting.
- **Draft Management:** Create, auto-save, edit, and delete drafts.
- **Officer/Assistant Workflow:** Assistants link to Officers; drafts submitted for review; approve/revise cycle.
- **OTP-Delegated Sending:** Secure 6-digit OTP (10-minute TTL) for assistant dispatches.
- **Document Access Restriction:** 🔒 Restricted badge; body hidden except for designated recipient.
- **Multi-Destination (CC/BCC):** Simultaneous dispatch to primary, CC, and BCC departments.
- **Reference Linking:** Search and attach previous document IDs to create chains.
- **My Documents Workspace:** Renamed 'History' to 'My Documents'; serves as the user's active processing area.
- **Enhanced Pickup Logic:** 🔒 Restricted documents are visible in the inbox but only pickable by the authorized recipient.
- **Department-Wide History:** Dedicated page for all department members to view collective correspondence records.

## ✅ Success Criteria
1. Assistant can compose a rich-text draft and submit it to their assigned Officer.
2. Officer can review the draft, add a revision note, or approve it for dispatch.
3. Assistant can request an OTP, verify it, and send a document on behalf of the Officer.
4. Restricted documents correctly hide their body/attachments from unauthorized users.
5. CC/BCC departments receive the document in their respective inboxes.
6. Reference chains are visible and clickable on the Document Detail page.
7. Restricted documents can only be picked up by the user they are restricted to.
8. 'My Documents' page provides a clear view of all documents the user is currently processing.
9. 'History' page provides a unified view of all documents handled by any worker in the department.

## 🔗 Implementation Roadmap (Phase 1.1)
- **Step 1:** Position-Based Architecture Refactor (New `positions` table, migrate user roles).
- **Step 2:** Database Schema Evolution (Alters + New Tables).
- **Step 3:** Identity Update (New Roles, Position-Assistant Links).
- **Step 4:** Draft & Compose Backend (Draft CRUD, Rich Text Storage).
- **Step 5:** Review & OTP Workflow (Approval logic, OTP service).
- **Step 6:** Advanced Routing (CC/BCC, Restrictions, References).
- **Step 7:** UI/UX Update (RichTextEditor, Layouts, Dashboards).
- **Step 8:** Document Pickup Refinement & Workspace Rebranding.
- **Step 9:** Department-Wide History Restoration.
- **Step 10:** Dynamic File Naming & Multi-POV Attachment Access.
