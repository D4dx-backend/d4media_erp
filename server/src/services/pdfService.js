const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate PDF for invoice
 */
const generateInvoicePDF = async (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('D4 MEDIA', 50, 50);
      doc.fontSize(10).text('Digital Agency & Studio Services', 50, 75);
      doc.text('Phone: +91 XXXXXXXXXX | Email: info@d4media.com', 50, 90);
      
      // Invoice title
      doc.fontSize(24).text('INVOICE', 400, 50);
      doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber}`, 400, 80);
      doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 400, 95);
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 110);

      // Client details
      doc.fontSize(14).text('Bill To:', 50, 150);
      doc.fontSize(12).text(invoice.clientDetails?.name || invoice.client?.name || 'N/A', 50, 170);
      if (invoice.clientDetails?.email || invoice.client?.email) {
        doc.text(invoice.clientDetails?.email || invoice.client?.email, 50, 185);
      }
      if (invoice.clientDetails?.phone || invoice.client?.phone) {
        doc.text(invoice.clientDetails?.phone || invoice.client?.phone, 50, 200);
      }
      if (invoice.clientDetails?.address) {
        doc.text(invoice.clientDetails.address, 50, 215);
      }

      // Items table
      let yPosition = 260;
      doc.fontSize(12).text('Description', 50, yPosition);
      doc.text('Qty', 300, yPosition);
      doc.text('Rate', 350, yPosition);
      doc.text('Amount', 450, yPosition);
      
      // Draw line under header
      doc.moveTo(50, yPosition + 15).lineTo(550, yPosition + 15).stroke();
      yPosition += 25;

      // Items
      invoice.items.forEach(item => {
        doc.fontSize(10);
        doc.text(item.description, 50, yPosition, { width: 240 });
        doc.text(item.quantity.toString(), 300, yPosition);
        doc.text(`₹${item.rate.toFixed(2)}`, 350, yPosition);
        doc.text(`₹${item.amount.toFixed(2)}`, 450, yPosition);
        yPosition += 20;
      });

      // Totals
      yPosition += 20;
      doc.moveTo(350, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;
      
      doc.fontSize(12);
      doc.text('Subtotal:', 350, yPosition);
      doc.text(`₹${invoice.subtotal.toFixed(2)}`, 450, yPosition);
      yPosition += 15;
      
      doc.text(`Tax (${invoice.tax}%):`, 350, yPosition);
      doc.text(`₹${invoice.taxAmount.toFixed(2)}`, 450, yPosition);
      yPosition += 15;
      
      doc.fontSize(14).text('Total:', 350, yPosition);
      doc.text(`₹${invoice.total.toFixed(2)}`, 450, yPosition);

      // Notes and terms
      if (invoice.notes) {
        yPosition += 40;
        doc.fontSize(12).text('Notes:', 50, yPosition);
        doc.fontSize(10).text(invoice.notes, 50, yPosition + 15, { width: 500 });
      }

      if (invoice.terms) {
        yPosition += 60;
        doc.fontSize(12).text('Terms & Conditions:', 50, yPosition);
        doc.fontSize(10).text(invoice.terms, 50, yPosition + 15, { width: 500 });
      }

      // Footer
      doc.fontSize(8).text('Thank you for your business!', 50, 750);
      doc.text('This is a computer generated invoice.', 50, 760);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF for quotation
 */
const generateQuotationPDF = async (quotation) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('D4 MEDIA', 50, 50);
      doc.fontSize(10).text('Digital Agency & Studio Services', 50, 75);
      doc.text('Phone: +91 XXXXXXXXXX | Email: info@d4media.com', 50, 90);
      
      // Quotation title
      doc.fontSize(24).text('QUOTATION', 400, 50);
      doc.fontSize(12).text(`Quotation #: ${quotation.quotationNumber}`, 400, 80);
      doc.text(`Date: ${new Date(quotation.createdAt).toLocaleDateString()}`, 400, 95);
      doc.text(`Valid Until: ${new Date(quotation.validUntil).toLocaleDateString()}`, 400, 110);

      // Client details
      doc.fontSize(14).text('Quote For:', 50, 150);
      doc.fontSize(12).text(quotation.clientDetails?.name || quotation.client?.name || 'N/A', 50, 170);
      if (quotation.clientDetails?.email || quotation.client?.email) {
        doc.text(quotation.clientDetails?.email || quotation.client?.email, 50, 185);
      }
      if (quotation.clientDetails?.phone || quotation.client?.phone) {
        doc.text(quotation.clientDetails?.phone || quotation.client?.phone, 50, 200);
      }
      if (quotation.clientDetails?.address) {
        doc.text(quotation.clientDetails.address, 50, 215);
      }

      // Items table
      let yPosition = 260;
      doc.fontSize(12).text('Description', 50, yPosition);
      doc.text('Qty', 300, yPosition);
      doc.text('Rate', 350, yPosition);
      doc.text('Amount', 450, yPosition);
      
      // Draw line under header
      doc.moveTo(50, yPosition + 15).lineTo(550, yPosition + 15).stroke();
      yPosition += 25;

      // Items
      quotation.items.forEach(item => {
        doc.fontSize(10);
        doc.text(item.description, 50, yPosition, { width: 240 });
        doc.text(item.quantity.toString(), 300, yPosition);
        doc.text(`₹${item.rate.toFixed(2)}`, 350, yPosition);
        doc.text(`₹${item.amount.toFixed(2)}`, 450, yPosition);
        yPosition += 20;
      });

      // Totals
      yPosition += 20;
      doc.moveTo(350, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;
      
      doc.fontSize(12);
      doc.text('Subtotal:', 350, yPosition);
      doc.text(`₹${quotation.subtotal.toFixed(2)}`, 450, yPosition);
      yPosition += 15;
      
      doc.text(`Tax (${quotation.tax}%):`, 350, yPosition);
      doc.text(`₹${quotation.taxAmount.toFixed(2)}`, 450, yPosition);
      yPosition += 15;
      
      doc.fontSize(14).text('Total:', 350, yPosition);
      doc.text(`₹${quotation.total.toFixed(2)}`, 450, yPosition);

      // Notes and terms
      if (quotation.notes) {
        yPosition += 40;
        doc.fontSize(12).text('Notes:', 50, yPosition);
        doc.fontSize(10).text(quotation.notes, 50, yPosition + 15, { width: 500 });
      }

      if (quotation.terms) {
        yPosition += 60;
        doc.fontSize(12).text('Terms & Conditions:', 50, yPosition);
        doc.fontSize(10).text(quotation.terms, 50, yPosition + 15, { width: 500 });
      }

      // Footer
      doc.fontSize(8).text('Thank you for considering D4 Media!', 50, 750);
      doc.text('This quotation is valid until the date mentioned above.', 50, 760);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF,
  generateQuotationPDF
};