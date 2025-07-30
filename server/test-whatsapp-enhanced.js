const {
  sendTextMessage,
  sendDocumentMessage,
  sendDocumentFromUrl,
  sendMediaMessage,
  sendMediaFromUrl,
  sendInvoiceDocument,
  sendQuotationDocument
} = require('./src/services/whatsappService');
const fs = require('fs');
const path = require('path');

// Test phone number (replace with actual number for testing)
const testPhoneNumber = '919876543210';

async function testWhatsAppEnhancements() {
  console.log('🚀 Testing Enhanced WhatsApp Service...\n');

  try {
    // Test 1: Send simple text message
    console.log('1. Testing text message...');
    const textResult = await sendTextMessage(
      testPhoneNumber,
      'Hello! This is a test message from the enhanced WhatsApp service.',
      { priority: 1 }
    );
    console.log('✅ Text message sent:', textResult.messageId);

    // Test 2: Send document from URL
    console.log('\n2. Testing document from URL...');
    const docUrlResult = await sendDocumentFromUrl(
      testPhoneNumber,
      'Here is a sample PDF document from URL',
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      'sample.pdf',
      { priority: 1 }
    );
    console.log('✅ Document from URL sent:', docUrlResult.messageId);

    // Test 3: Send media from URL
    console.log('\n3. Testing media from URL...');
    const mediaUrlResult = await sendMediaFromUrl(
      testPhoneNumber,
      'Here is a sample image',
      'https://via.placeholder.com/300x200.png',
      'sample.png',
      { priority: 1 }
    );
    console.log('✅ Media from URL sent:', mediaUrlResult.messageId);

    // Test 4: Send document file (if exists)
    console.log('\n4. Testing document file...');
    const sampleDocPath = path.join(__dirname, 'sample-document.pdf');
    
    if (fs.existsSync(sampleDocPath)) {
      const docBuffer = fs.readFileSync(sampleDocPath);
      const docResult = await sendDocumentMessage(
        testPhoneNumber,
        'Here is a PDF document attachment',
        docBuffer,
        'sample-document.pdf'
      );
      console.log('✅ Document file sent:', docResult.messageId);
    } else {
      console.log('⚠️ Sample document not found, skipping file test');
    }

    // Test 5: Send invoice document (mock)
    console.log('\n5. Testing invoice document...');
    const mockInvoicePdf = Buffer.from('Mock PDF content for invoice');
    const invoiceResult = await sendInvoiceDocument(
      testPhoneNumber,
      'INV-2025-001',
      mockInvoicePdf
    );
    console.log('✅ Invoice document sent:', invoiceResult.messageId);

    // Test 6: Send quotation document (mock)
    console.log('\n6. Testing quotation document...');
    const mockQuotationPdf = Buffer.from('Mock PDF content for quotation');
    const quotationResult = await sendQuotationDocument(
      testPhoneNumber,
      'QUO-2025-001',
      mockQuotationPdf
    );
    console.log('✅ Quotation document sent:', quotationResult.messageId);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Show available options
    console.log('\n📋 Available WhatsApp Service Functions:');
    console.log('- sendTextMessage(phoneNumber, message, options)');
    console.log('- sendDocumentMessage(phoneNumber, message, fileBuffer, fileName, options)');
    console.log('- sendDocumentFromUrl(phoneNumber, message, documentUrl, fileName, options)');
    console.log('- sendMediaMessage(phoneNumber, caption, fileBuffer, fileName, options)');
    console.log('- sendMediaFromUrl(phoneNumber, caption, mediaUrl, fileName, options)');
    console.log('- sendInvoiceDocument(phoneNumber, invoiceNumber, pdfBuffer, options)');
    console.log('- sendQuotationDocument(phoneNumber, quotationNumber, pdfBuffer, options)');
    
    console.log('\n📝 Supported File Types:');
    console.log('Documents: pdf, doc, docx, xls, xlsx');
    console.log('Media: jpg, jpeg, png, gif, mp4, mp3, ogg');
    
    console.log('\n⚙️ Options:');
    console.log('- priority: 1 (high) or 2 (normal)');
    console.log('- shortener: 1, 2, or 3 for DxLink shortener');
    console.log('- documentUrl: Direct URL to document file');
    console.log('- mediaUrl: Direct URL to media file');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testWhatsAppEnhancements();
}

module.exports = { testWhatsAppEnhancements };