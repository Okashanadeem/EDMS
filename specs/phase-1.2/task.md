# Phase 1.2: Detailed Task Breakdown

## 🧩 Milestone 11: Signature Intelligence & Management
100. [ ] Create migration: `ALTER TABLE users ADD COLUMN signature_path TEXT`.
101. [ ] Install and configure `sharp` for server-side image processing.
102. [ ] Implement `signature.js` utility for background removal (alpha thresholding).
103. [ ] Implement `PATCH /api/v1/users/signature` in `users.controller.js`.
104. [ ] Create `SignatureManager.jsx` component for Officer Dashboard.
105. [ ] Update `UserManagement.jsx` to allow Super Admin to set signatures for Officers.
106. [ ] Add `signature_url` to User profile API response.

## 🧩 Milestone 12: Official Correspondence PDF Engine
107. [ ] Install and configure `puppeteer` or `html-pdf-node` for PDF generation.
108. [ ] Design `official_letter.html` template with standard department headers.
109. [ ] Implement `pdf.service.js` for dynamic document-to-PDF rendering.
110. [ ] Update `documents.controller.js`: Implement `downloadDocumentPdf` with POV naming.
111. [ ] Logic: If sent on behalf of Officer, embed their signature into the PDF footer.
112. [ ] Logic: Use Outward # for sender and Inward # for receiver in PDF header.
113. [ ] Add "Download PDF" button to `DocumentDetail.jsx`.
114. [ ] Final E2E: Verify signature quality and PDF layout consistency.
