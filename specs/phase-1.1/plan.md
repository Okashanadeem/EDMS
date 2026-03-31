# EDMS Phase 1.1: Extended Correspondence & Review Workflow

## 🎯 Phase Goals
The primary goal of Phase 1.1 is to evolve the MVP into a production-ready, feature-rich correspondence system. This includes moving from plain text to **Rich Text (Tiptap)**, implementing a **Draft/Review cycle** for Officers and Assistants, and adding secure **OTP-based delegated sending**.

## 📋 Scope Definition (New Features)
- **Rich Text Editor (Tiptap):** Full-page writing canvas with MS Word-style formatting.
- **Draft Management:** Create, auto-save, edit, and delete drafts.
- **Officer/Assistant Workflow:** Assistants link to Officers; drafts submitted for review; approve/revise cycle.
- **OTP-Delegated Sending:** Secure 6-digit OTP (10-minute TTL) for assistant dispatches.
- **Document Access Restriction:** 🔒 Restricted badge; body hidden except for designated recipient.
- **Multi-Destination (CC/BCC):** Simultaneous dispatch to primary, CC, and BCC departments.
- **Reference Linking:** Search and attach previous document IDs to create chains.

## ✅ Success Criteria
1. Assistant can compose a rich-text draft and submit it to their assigned Officer.
2. Officer can review the draft, add a revision note, or approve it for dispatch.
3. Assistant can request an OTP, verify it, and send a document on behalf of the Officer.
4. Restricted documents correctly hide their body/attachments from unauthorized users.
5. CC/BCC departments receive the document in their respective inboxes.
6. Reference chains are visible and clickable on the Document Detail page.

## 🔗 Implementation Roadmap (Phase 1.1)
- **Step 1:** Database Schema Evolution (Alters + New Tables).
- **Step 2:** Identity Update (New Roles, Officer-Assistant Links).
- **Step 3:** Draft & Compose Backend (Draft CRUD, Rich Text Storage).
- **Step 4:** Review & OTP Workflow (Approval logic, OTP service).
- **Step 5:** Advanced Routing (CC/BCC, Restrictions, References).
- **Step 6:** UI/UX Update (RichTextEditor, Layouts, Dashboards).
