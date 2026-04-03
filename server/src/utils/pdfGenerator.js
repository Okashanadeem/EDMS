const pdf = require('html-pdf-node');
const path = require('path');
const fs = require('fs');

/**
 * Generates a professional PDF from document data.
 * 
 * @param {Object} doc - Document data (subject, body_html, outward_number, inward_number, etc.)
 * @param {Object} options - Options (baseUrl, signatureUrl, senderDept, receiverDept)
 * @returns {Promise<Buffer>} - PDF Buffer
 */
const generateOfficialPdf = async (doc, options) => {
  const { baseUrl, signatureUrl, senderDept, receiverDept, currentPovNumber } = options;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          margin: 2cm;
        }
        body { 
          font-family: 'Times New Roman', Times, serif; 
          color: #000; 
          line-height: 1.5;
          margin: 0;
          padding: 0;
        }
        .header { 
          text-align: center; 
          border-bottom: 2px solid #000; 
          margin-bottom: 30px; 
          padding-bottom: 10px;
        }
        .govt-text {
          font-size: 18px;
          font-weight: bold;
          margin: 0;
          text-transform: uppercase;
        }
        .dept-name { 
          font-size: 22px; 
          font-weight: bold; 
          text-transform: uppercase; 
          margin: 5px 0; 
        }
        
        .meta-section { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 40px; 
          font-size: 14px; 
        }
        .meta-left { width: 60%; }
        .meta-right { text-align: right; }
        
        .subject-section {
          margin-bottom: 30px;
        }
        .subject-label {
          font-weight: bold;
          float: left;
          width: 80px;
        }
        .subject-text {
          font-weight: bold;
          text-decoration: underline;
          display: block;
          margin-left: 85px;
          text-transform: uppercase;
        }
        
        .body-content { 
          font-size: 15px; 
          min-height: 350px; 
          text-align: justify;
          margin-bottom: 50px;
        }
        
        .signature-block { 
          float: right;
          width: 250px;
          text-align: center;
        }
        .signature-img { 
          max-height: 50px; 
          max-width: 180px; 
          margin-bottom: 5px; 
          object-fit: contain;
        }
        .signature-name { 
          font-weight: bold; 
          font-size: 15px; 
          margin: 0; 
          text-transform: uppercase;
        }
        .signature-title { 
          font-size: 13px; 
          margin: 2px 0;
          font-style: italic;
        }
        .dept-title {
          font-size: 13px;
          font-weight: bold;
          margin: 0;
        }
        
        .footer { 
          position: fixed; 
          bottom: 0; 
          left: 0; 
          right: 0; 
          font-size: 10px; 
          color: #555; 
          border-top: 1px solid #ccc; 
          padding-top: 10px;
          text-align: center;
        }
        .clearfix::after {
          content: "";
          clear: both;
          display: table;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <p class="govt-text">Government of the Punjab</p>
        <p class="dept-name">${senderDept || 'Police Department'}</p>
      </div>

      <div class="meta-section">
        <div class="meta-left">
          To,<br>
          <div style="margin-left: 20px; margin-top: 5px;">
            <strong>The ${receiverDept || 'Concerned Authority'},</strong><br>
            Punjab, Lahore.
          </div>
        </div>
        <div class="meta-right">
          <strong>No:</strong> ${currentPovNumber || doc.outward_number || '---'}<br>
          <strong>Dated:</strong> ${new Date(doc.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div class="subject-section clearfix">
        <span class="subject-label">Subject:</span>
        <span class="subject-text">${doc.subject}</span>
      </div>

      <div class="body-content">
        ${doc.body_html || `<p>${doc.body || 'No content provided.'}</p>`}
      </div>

      <div class="clearfix">
        <div class="signature-block">
          ${signatureUrl ? `<img src="${signatureUrl}" class="signature-img"><br>` : '<div style="height: 50px;"></div>'}
          <p class="signature-name">${options.senderName || ''}</p>
          <p class="signature-title">${options.senderPosition || ''}</p>
          <p class="dept-title">${senderDept || ''}</p>
        </div>
      </div>

      <div class="footer">
        This is an electronically generated document. Authentic copy available in EDMS Registry.<br>
        Reference ID: ${doc.id} | System Hash: ${Buffer.from(doc.subject).toString('hex').substring(0, 8).toUpperCase()}
      </div>
    </body>
    </html>
  `;

  const file = { content: html };
  const pdfOptions = { 
    format: 'A4',
    margin: { top: '1in', bottom: '1in', left: '1in', right: '1in' },
    printBackground: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };

  return pdf.generatePdf(file, pdfOptions);
};

module.exports = {
  generateOfficialPdf
};
