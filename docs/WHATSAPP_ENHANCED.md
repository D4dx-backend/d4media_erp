# Enhanced WhatsApp Service Documentation

## Overview
The enhanced WhatsApp service provides comprehensive messaging capabilities using the DXing API, supporting text messages, document attachments, and media files.

## Features
- ✅ Text messages with emoji and Unicode support
- ✅ Document attachments (PDF, DOC, DOCX, XLS, XLSX)
- ✅ Media attachments (Images, Videos, Audio)
- ✅ URL-based file sharing
- ✅ Priority messaging
- ✅ Link shortening
- ✅ Specialized invoice/quotation messaging
- ✅ Phone number validation and formatting

## API Functions

### Core Functions

#### `sendWhatsAppMessage(phoneNumber, message, fileBuffer, fileName, options)`
Main function for sending WhatsApp messages with optional attachments.

**Parameters:**
- `phoneNumber` (string): Recipient phone number in any format
- `message` (string): Message text or caption
- `fileBuffer` (Buffer, optional): File buffer for attachments
- `fileName` (string, optional): File name with extension
- `options` (object, optional): Additional options

**Options:**
```javascript
{
  mediaUrl: 'https://example.com/image.jpg',     // Direct URL to media
  documentUrl: 'https://example.com/doc.pdf',   // Direct URL to document
  priority: 1,                                  // 1=high, 2=normal
  shortener: 1                                  // DxLink shortener ID (1,2,3)
}
```

### Convenience Functions

#### `sendTextMessage(phoneNumber, message, options)`
Send a simple text message.

```javascript
await sendTextMessage(
  '+919876543210',
  'Hello! This is a test message.',
  { priority: 1 }
);
```

#### `sendDocumentMessage(phoneNumber, message, fileBuffer, fileName, options)`
Send a document attachment.

```javascript
const pdfBuffer = fs.readFileSync('invoice.pdf');
await sendDocumentMessage(
  '+919876543210',
  'Please find your invoice attached.',
  pdfBuffer,
  'invoice.pdf'
);
```

#### `sendDocumentFromUrl(phoneNumber, message, documentUrl, fileName, options)`
Send a document from URL.

```javascript
await sendDocumentFromUrl(
  '+919876543210',
  'Here is your document',
  'https://example.com/document.pdf',
  'document.pdf'
);
```

#### `sendMediaMessage(phoneNumber, caption, fileBuffer, fileName, options)`
Send media files (images, videos, audio).

```javascript
const imageBuffer = fs.readFileSync('image.jpg');
await sendMediaMessage(
  '+919876543210',
  'Check out this image!',
  imageBuffer,
  'image.jpg'
);
```

#### `sendMediaFromUrl(phoneNumber, caption, mediaUrl, fileName, options)`
Send media from URL.

```javascript
await sendMediaFromUrl(
  '+919876543210',
  'Beautiful sunset!',
  'https://example.com/sunset.jpg',
  'sunset.jpg'
);
```

### Business-Specific Functions

#### `sendInvoiceDocument(phoneNumber, invoiceNumber, pdfBuffer, options)`
Send invoice with standardized message format.

```javascript
await sendInvoiceDocument(
  '+919876543210',
  'INV-2025-001',
  invoicePdfBuffer
);
```

#### `sendQuotationDocument(phoneNumber, quotationNumber, pdfBuffer, options)`
Send quotation with standardized message format.

```javascript
await sendQuotationDocument(
  '+919876543210',
  'QUO-2025-001',
  quotationPdfBuffer
);
```

## Supported File Types

### Documents
- **PDF** (.pdf) - Portable Document Format
- **Word** (.doc, .docx) - Microsoft Word documents
- **Excel** (.xls, .xlsx) - Microsoft Excel spreadsheets

### Media Files
- **Images** (.jpg, .jpeg, .png, .gif)
- **Videos** (.mp4)
- **Audio** (.mp3, .ogg)

## Phone Number Formats
The service automatically handles various phone number formats:

```javascript
// All these formats work:
'9876543210'        // 10-digit Indian number
'+919876543210'     // E.164 format
'919876543210'      // With country code
'09876543210'       // With leading zero
```

## Error Handling

The service provides detailed error messages for common issues:

```javascript
try {
  await sendDocumentMessage(phone, message, buffer, 'file.txt');
} catch (error) {
  if (error.message.includes('Invalid document file type')) {
    // Handle unsupported file type
  } else if (error.message.includes('WhatsApp API credentials')) {
    // Handle missing credentials
  } else if (error.message.includes('Invalid phone number')) {
    // Handle phone number validation error
  }
}
```

## Environment Configuration

Required environment variables:

```env
WHATSAPP_ACCOUNT_ID=your_account_id
WHATSAPP_SECRET_KEY=your_secret_key
```

## Usage Examples

### Basic Text Message
```javascript
const { sendTextMessage } = require('./services/whatsappService');

await sendTextMessage(
  '+919876543210',
  'Hello! Your order is ready for pickup. 📦'
);
```

### Invoice with PDF
```javascript
const { sendInvoiceDocument } = require('./services/whatsappService');
const { generateInvoicePDF } = require('./services/pdfService');

const pdfBuffer = await generateInvoicePDF(invoiceData);
await sendInvoiceDocument(
  customer.phone,
  invoice.invoiceNumber,
  pdfBuffer
);
```

### Media from URL
```javascript
const { sendMediaFromUrl } = require('./services/whatsappService');

await sendMediaFromUrl(
  '+919876543210',
  'Your project preview is ready! 🎨',
  'https://cdn.example.com/preview.jpg',
  'project-preview.jpg',
  { priority: 1 }
);
```

### Document with Custom Options
```javascript
const { sendDocumentMessage } = require('./services/whatsappService');

await sendDocumentMessage(
  '+919876543210',
  'Contract for review',
  contractBuffer,
  'contract.pdf',
  {
    priority: 1,
    shortener: 1
  }
);
```

## Testing

Run the test suite to verify functionality:

```bash
node server/test-whatsapp-enhanced.js
```

## API Response Format

Successful responses:
```javascript
{
  success: true,
  messageId: 'dxing_1642678901234',
  status: 'sent',
  response: { /* DXing API response */ }
}
```

Error responses:
```javascript
{
  success: false,
  error: 'Error message',
  details: { /* Additional error details */ }
}
```

## Best Practices

1. **File Size Limits**: Keep attachments under 16MB for optimal delivery
2. **Phone Validation**: Always validate phone numbers before sending
3. **Error Handling**: Implement proper try-catch blocks
4. **Rate Limiting**: Respect API rate limits to avoid blocking
5. **Message Content**: Keep messages concise and professional
6. **File Types**: Use supported file formats only
7. **Testing**: Test with actual phone numbers in development

## Integration with Controllers

The service integrates seamlessly with existing controllers:

```javascript
// In invoiceController.js
const { sendInvoiceDocument } = require('../services/whatsappService');

exports.sendInvoiceToCustomer = async (req, res) => {
  try {
    const pdfBuffer = await generateInvoicePDF(invoice);
    const result = await sendInvoiceDocument(
      customer.phone,
      invoice.invoiceNumber,
      pdfBuffer
    );
    
    res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

## Troubleshooting

### Common Issues

1. **Invalid Credentials**: Verify WHATSAPP_ACCOUNT_ID and WHATSAPP_SECRET_KEY
2. **Phone Number Format**: Ensure phone numbers are valid Indian mobile numbers
3. **File Type Errors**: Check file extensions match supported types
4. **Network Timeouts**: API has 30-second timeout, check network connectivity
5. **Rate Limiting**: Space out messages to avoid API limits

### Debug Mode

Enable detailed logging by setting environment variable:
```env
DEBUG=whatsapp:*
```

This will show detailed request/response information for troubleshooting.