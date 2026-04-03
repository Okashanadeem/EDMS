# EDMS Phase 1.2: Signature Intelligence & PDF Engine

## 🎯 Phase Goals
The primary goal of Phase 1.2 is to professionalize document delivery. This involves enabling **Digital Signatures** for Officers with automated image cleanup (background removal) and providing a **PDF Download** feature that renders documents as official, letter-headed correspondence.

## 📋 Scope Definition (New Features)
- **Signature Processing Service:** Automated white-background removal and normalization of uploaded signature images.
- **Officer Profile Management:** Dedicated UI for Officers to upload and update their digital signatures.
- **Auto-Signature Application:** Automatic placement of the Officer's signature on documents dispatched by their Assistants via OTP.
- **Official PDF Engine:** Server-side PDF generation using a professional government-style template.
- **POV-Aware PDF Download:** Document body and subject rendered into a PDF with filename matching the POV (Inward/Outward #).

## ✅ Success Criteria
1. Super Admin or Officer can upload a signature image.
2. System automatically processes the image to remove background and normalize the ratio.
3. Documents sent by an Assistant on behalf of an Officer automatically include the Officer's signature at the bottom.
4. "Download PDF" button generates a professional letter with correct numbering, layout, and signature.
5. PDF filenames correctly reflect the Outward Number for senders and Inward Number for receivers.

## 🔗 Implementation Roadmap (Phase 1.2)
- **Step 1:** Database migration for `signature_path` in `users` table.
- **Step 2:** Integrate `sharp` for image processing (Thresholding & Transparency).
- **Step 3:** Implement `POST /api/v1/users/signature` for profile updates.
- **Step 4:** Integrate `puppeteer` or `pdfkit` for server-side HTML-to-PDF generation.
- **Step 5:** Create Official Letterhead CSS/HTML template.
- **Step 6:** Implement `GET /api/v1/documents/:id/pdf` with POV logic.
- **Step 7:** UI Update: Add Signature Manager to Officer Dashboard.
- **Step 8:** UI Update: Add PDF Download action to Document Detail.
