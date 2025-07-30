const axios = require('axios');
const FormData = require('form-data');

/**
 * Send WhatsApp message with optional file attachment using DXing API
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - Message text or caption
 * @param {Buffer} fileBuffer - File buffer (optional)
 * @param {string} fileName - File name with extension (optional)
 * @param {Object} options - Additional options
 * @param {string} options.mediaUrl - Direct URL to media file (alternative to fileBuffer)
 * @param {string} options.documentUrl - Direct URL to document file (alternative to fileBuffer)
 * @param {number} options.priority - Message priority (1=high, 2=normal)
 * @param {number} options.shortener - Link shortener ID (1, 2, or 3 for DxLink)
 */
const sendWhatsAppMessage = async (phoneNumber, message, fileBuffer = null, fileName = null, options = {}) => {
  try {
    const account = process.env.WHATSAPP_ACCOUNT_ID;
    const secret = process.env.WHATSAPP_SECRET_KEY;
    
    if (!account || !secret) {
      throw new Error('WhatsApp API credentials not configured');
    }

    // Validate and format phone number
    const formattedPhone = validatePhoneNumber(phoneNumber);
    
    console.log('Sending WhatsApp message via DXing API to:', formattedPhone);
    console.log('Message:', message);
    
    // DXing API endpoint
    const apiUrl = 'https://app.dxing.in/api/send/whatsapp';
    
    const formData = new FormData();
    formData.append('secret', secret);
    formData.append('account', account);
    formData.append('recipient', formattedPhone);
    formData.append('message', message);
    formData.append('priority', options.priority || '1'); // High priority by default
    
    // Add shortener if specified
    if (options.shortener) {
      formData.append('shortener', options.shortener.toString());
    }
    
    // Determine message type and add attachment
    const messageType = determineMessageType(fileBuffer, fileName, options);
    formData.append('type', messageType);
    
    if (messageType === 'document') {
      await handleDocumentMessage(formData, fileBuffer, fileName, options);
    } else if (messageType === 'media') {
      await handleMediaMessage(formData, fileBuffer, fileName, options);
    }
    
    const response = await axios.post(apiUrl, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 30000 // 30 seconds timeout
    });
    
    console.log('DXing API Response:', response.data);
    
    // Check for successful response
    if (response.data && (response.data.success === true || response.data.status === 'success' || response.status === 200)) {
      return {
        success: true,
        messageId: response.data.message_id || response.data.id || `dxing_${Date.now()}`,
        status: 'sent',
        response: response.data
      };
    } else {
      throw new Error(response.data?.message || response.data?.error || 'Failed to send message via DXing API');
    }
    
  } catch (error) {
    console.error('Error sending WhatsApp message via DXing API:', error);
    
    if (error.response) {
      console.error('API Response Status:', error.response.status);
      console.error('API Response Data:', error.response.data);
      const errorMessage = error.response.data?.message || error.response.data?.error || error.response.statusText;
      throw new Error(`DXing API Error (${error.response.status}): ${errorMessage}`);
    } else if (error.request) {
      throw new Error('Network error: Unable to reach DXing API');
    } else {
      throw new Error('Failed to send WhatsApp message: ' + error.message);
    }
  }
};

/**
 * Determine message type based on file and options
 */
const determineMessageType = (fileBuffer, fileName, options) => {
  if (options.documentUrl || (fileBuffer && fileName && isDocumentFile(fileName))) {
    return 'document';
  } else if (options.mediaUrl || (fileBuffer && fileName && isMediaFile(fileName))) {
    return 'media';
  }
  return 'text';
};

/**
 * Handle document message setup
 */
const handleDocumentMessage = async (formData, fileBuffer, fileName, options) => {
  if (options.documentUrl) {
    // Using document URL
    formData.append('document_url', options.documentUrl);
    formData.append('document_name', fileName || 'document.pdf');
    formData.append('document_type', getDocumentType(fileName || options.documentUrl));
  } else if (fileBuffer && fileName) {
    // Using document file buffer
    console.log('Adding document attachment:', fileName, 'Size:', fileBuffer.length, 'bytes');
    formData.append('document_file', fileBuffer, {
      filename: fileName,
      contentType: getDocumentContentType(fileName)
    });
  }
};

/**
 * Handle media message setup
 */
const handleMediaMessage = async (formData, fileBuffer, fileName, options) => {
  if (options.mediaUrl) {
    // Using media URL
    formData.append('media_url', options.mediaUrl);
    formData.append('media_type', getMediaType(fileName || options.mediaUrl));
  } else if (fileBuffer && fileName) {
    // Using media file buffer
    console.log('Adding media attachment:', fileName, 'Size:', fileBuffer.length, 'bytes');
    formData.append('media_file', fileBuffer, {
      filename: fileName,
      contentType: getMediaContentType(fileName)
    });
  }
};

/**
 * Check if file is a document type
 */
const isDocumentFile = (fileName) => {
  const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
  const extension = fileName.split('.').pop().toLowerCase();
  return documentExtensions.includes(extension);
};

/**
 * Check if file is a media type
 */
const isMediaFile = (fileName) => {
  const mediaExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'ogg'];
  const extension = fileName.split('.').pop().toLowerCase();
  return mediaExtensions.includes(extension);
};

/**
 * Get document type for API
 */
const getDocumentType = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  const typeMap = {
    'pdf': 'pdf',
    'doc': 'doc',
    'docx': 'docx',
    'xls': 'xls',
    'xlsx': 'xlsx'
  };
  return typeMap[extension] || 'pdf';
};

/**
 * Get media type for API
 */
const getMediaType = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif'];
  const videoTypes = ['mp4'];
  const audioTypes = ['mp3', 'ogg'];
  
  if (imageTypes.includes(extension)) return 'image';
  if (videoTypes.includes(extension)) return 'video';
  if (audioTypes.includes(extension)) return 'audio';
  return 'image'; // default
};

/**
 * Get document content type for form data
 */
const getDocumentContentType = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  const contentTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  return contentTypes[extension] || 'application/pdf';
};

/**
 * Get media content type for form data
 */
const getMediaContentType = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  const contentTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg',
    'ogg': 'audio/ogg'
  };
  return contentTypes[extension] || 'application/octet-stream';
};

/**
 * Send WhatsApp template message
 */
const sendWhatsAppTemplate = async (phoneNumber, templateName, templateParams = []) => {
  try {
    console.log('Sending WhatsApp template to:', phoneNumber);
    console.log('Template:', templateName);
    console.log('Parameters:', templateParams);

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      messageId: `template_${Date.now()}`,
      status: 'sent'
    };
  } catch (error) {
    console.error('Error sending WhatsApp template:', error);
    throw new Error('Failed to send WhatsApp template: ' + error.message);
  }
};

/**
 * Validate and format phone number for WhatsApp (E.164 format)
 */
const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) {
    throw new Error('Phone number is required');
  }
  
  // Remove all non-digit characters
  let cleaned = phoneNumber.toString().replace(/\D/g, '');
  
  // Handle different formats and convert to E.164 format (+91xxxxxxxxxx)
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    // Already has country code, add + prefix
    return `+${cleaned}`;
  } else if (cleaned.length === 10) {
    // Indian mobile number without country code
    if (cleaned.match(/^[6-9]\d{9}$/)) {
      return `+91${cleaned}`;
    } else {
      throw new Error('Invalid Indian mobile number format');
    }
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    // Remove leading 0 and add country code
    const withoutZero = cleaned.substring(1);
    if (withoutZero.match(/^[6-9]\d{9}$/)) {
      return `+91${withoutZero}`;
    }
  } else if (cleaned.startsWith('91') && cleaned.length === 13) {
    // Handle +91 prefix that was converted to digits
    const number = cleaned.substring(2);
    if (number.match(/^[6-9]\d{9}$/)) {
      return `+91${number}`;
    }
  }
  
  throw new Error('Invalid phone number format. Please provide a valid Indian mobile number (10 digits starting with 6-9)');
};

/**
 * Get WhatsApp message status
 */
const getMessageStatus = async (messageId) => {
  try {
    // Mock implementation
    return {
      messageId,
      status: 'delivered',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting message status:', error);
    throw new Error('Failed to get message status: ' + error.message);
  }
};

/**
 * Send WhatsApp text message
 */
const sendTextMessage = async (phoneNumber, message, options = {}) => {
  return await sendWhatsAppMessage(phoneNumber, message, null, null, options);
};

/**
 * Send WhatsApp document message
 */
const sendDocumentMessage = async (phoneNumber, message, fileBuffer, fileName, options = {}) => {
  if (!fileBuffer || !fileName) {
    throw new Error('Document file buffer and filename are required');
  }
  
  if (!isDocumentFile(fileName)) {
    throw new Error('Invalid document file type. Supported: pdf, doc, docx, xls, xlsx');
  }
  
  return await sendWhatsAppMessage(phoneNumber, message, fileBuffer, fileName, options);
};

/**
 * Send WhatsApp document from URL
 */
const sendDocumentFromUrl = async (phoneNumber, message, documentUrl, fileName, options = {}) => {
  if (!documentUrl || !fileName) {
    throw new Error('Document URL and filename are required');
  }
  
  const enhancedOptions = {
    ...options,
    documentUrl
  };
  
  return await sendWhatsAppMessage(phoneNumber, message, null, fileName, enhancedOptions);
};

/**
 * Send WhatsApp media message (image, video, audio)
 */
const sendMediaMessage = async (phoneNumber, caption, fileBuffer, fileName, options = {}) => {
  if (!fileBuffer || !fileName) {
    throw new Error('Media file buffer and filename are required');
  }
  
  if (!isMediaFile(fileName)) {
    throw new Error('Invalid media file type. Supported: jpg, png, gif, mp4, mp3, ogg');
  }
  
  return await sendWhatsAppMessage(phoneNumber, caption, fileBuffer, fileName, options);
};

/**
 * Send WhatsApp media from URL
 */
const sendMediaFromUrl = async (phoneNumber, caption, mediaUrl, fileName, options = {}) => {
  if (!mediaUrl) {
    throw new Error('Media URL is required');
  }
  
  const enhancedOptions = {
    ...options,
    mediaUrl
  };
  
  return await sendWhatsAppMessage(phoneNumber, caption, null, fileName, enhancedOptions);
};

/**
 * Send invoice document via WhatsApp
 */
const sendInvoiceDocument = async (phoneNumber, invoiceNumber, pdfBuffer, options = {}) => {
  const message = `📄 Invoice ${invoiceNumber}\n\nYour invoice is ready. Please find the attached PDF document.`;
  const fileName = `invoice_${invoiceNumber}.pdf`;
  
  return await sendDocumentMessage(phoneNumber, message, pdfBuffer, fileName, {
    priority: 1,
    ...options
  });
};

/**
 * Send quotation document via WhatsApp
 */
const sendQuotationDocument = async (phoneNumber, quotationNumber, pdfBuffer, options = {}) => {
  const message = `📋 Quotation ${quotationNumber}\n\nYour quotation is ready. Please find the attached PDF document.`;
  const fileName = `quotation_${quotationNumber}.pdf`;
  
  return await sendDocumentMessage(phoneNumber, message, pdfBuffer, fileName, {
    priority: 1,
    ...options
  });
};

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  sendTextMessage,
  sendDocumentMessage,
  sendDocumentFromUrl,
  sendMediaMessage,
  sendMediaFromUrl,
  sendInvoiceDocument,
  sendQuotationDocument,
  validatePhoneNumber,
  getMessageStatus,
  isDocumentFile,
  isMediaFile
};