# WhatsApp Integration Debugging Guide

## Quick Setup Checklist

### 1. Environment Variables
Ensure these are set in your `.env` file:
```env
WHATSAPP_ACCOUNT_ID=17503326891534b76d325a8f591b52d302e71813316853f511cb619
WHATSAPP_SECRET_KEY=9d07dd4538190fc918a5ef6833bb95e8a7b5659a
```

### 2. DXing API Endpoint
- **Base URL**: `https://app.dxing.in/api`
- **Send Endpoint**: `https://app.dxing.in/api/send/whatsapp`
- **Bulk Endpoint**: `https://app.dxing.in/api/send/whatsapp.bulk`
- **Method**: POST
- **Content-Type**: `application/json`

### 3. Request Format
```json
{
  "secret": "your_api_secret",
  "account": "your_account_id",
  "recipient": "+919876543210",
  "type": "text",
  "message": "Your message text"
}
```

## Common Issues & Solutions

### Issue 1: "WhatsApp service not configured"
**Cause**: Missing environment variables
**Solution**: 
1. Check if `.env` file exists in server directory
2. Verify `WHATSAPP_ACCOUNT_ID` and `WHATSAPP_SECRET_KEY` are set
3. Restart the server after adding variables

### Issue 2: "Authentication failed"
**Cause**: Invalid credentials
**Solution**:
1. Verify account ID and secret key are correct
2. Check for extra spaces or characters
3. Ensure credentials are active on DXing platform

### Issue 3: "Invalid phone number format"
**Cause**: Phone number not in correct format
**Solution**:
- Use Indian numbers: `9876543210` or `+919876543210`
- Service automatically formats to `+91XXXXXXXXXX`
- Ensure 10-digit mobile number

### Issue 4: "API endpoint not found"
**Cause**: Incorrect API URL or service down
**Solution**:
1. Verify DXing service is operational
2. Check API documentation for endpoint changes
3. Test with curl command

### Issue 5: "Rate limit exceeded"
**Cause**: Too many requests in short time
**Solution**:
- Wait before retrying
- Implement request throttling
- Check DXing rate limits

## Testing Steps

### 1. Environment Test
```bash
# In server directory
node -e "console.log('Account ID:', process.env.WHATSAPP_ACCOUNT_ID?.substring(0,10) + '...'); console.log('Secret Key:', process.env.WHATSAPP_SECRET_KEY ? 'Set' : 'Not set');"
```

### 2. Service Test
Use the admin WhatsApp test component:
1. Login as super admin
2. Navigate to user management
3. Use WhatsApp test component
4. Enter a test phone number
5. Check response details

### 3. Manual API Test
```bash
curl -X POST https://app.dxing.in/api/send/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "your_api_secret",
    "account": "your_account_id",
    "recipient": "+919876543210",
    "type": "text",
    "message": "Test message"
  }'
```

## Response Formats

### Success Response
```json
{
  "status": "success",
  "message_id": "msg_123456",
  "phone": "+919876543210"
}
```

### Error Response
```json
{
  "status": "error",
  "error": "Invalid phone number",
  "code": 400
}
```

## Debugging Logs

### Server Logs
Check server console for:
- "WhatsApp service configured with account ID: ..."
- "Sending WhatsApp message to: +91XXXXXXXXXX"
- "WhatsApp API response: ..."
- Error details with status codes

### Security Logs
Password reset events are logged in `logs/security.log`:
```
2024-01-01T12:00:00.000Z [info]: PASSWORD_RESET {"targetUserId":"...","adminUserId":"..."}
```

## Phone Number Validation

### Supported Formats
- `9876543210` → `+919876543210`
- `919876543210` → `+919876543210`
- `+919876543210` → `+919876543210`

### Invalid Formats
- Numbers with less than 10 digits
- Non-Indian country codes
- Landline numbers (not supported by WhatsApp)

## Message Formatting

### Supported Features
- **Bold text**: `*bold*`
- **Italic text**: `_italic_`
- **Monospace**: ``` `code` ```
- **Line breaks**: `\n`
- **Emojis**: 🔐 📱 ✅ ❌

### Message Limits
- Maximum length: 4096 characters
- Recommended: Keep under 1000 characters
- Use line breaks for readability

## Troubleshooting Commands

### Check Service Status
```javascript
// In Node.js console
const whatsappService = require('./src/utils/whatsappService');
whatsappService.testService('+919876543210').then(console.log).catch(console.error);
```

### Validate Phone Number
```javascript
const whatsappService = require('./src/utils/whatsappService');
console.log(whatsappService.formatIndianPhoneNumber('9876543210'));
```

### Test Password Generation
```javascript
const whatsappService = require('./src/utils/whatsappService');
console.log(whatsappService.generateSecurePassword(12));
```

## Production Considerations

### Security
- Never log secret keys
- Use environment variables only
- Rotate credentials periodically
- Monitor for suspicious activity

### Performance
- Implement retry logic for failed messages
- Add request queuing for high volume
- Monitor API rate limits
- Cache account status checks

### Monitoring
- Log all message attempts
- Track delivery success rates
- Monitor API response times
- Set up alerts for failures

## Support Contacts

### DXing Support
- Website: https://dxing.net
- Documentation: https://dxing.net/dxapi/doc
- Support: Check their website for contact details

### Internal Support
- Check server logs in `logs/` directory
- Review security logs for audit trail
- Use admin test component for diagnostics
- Contact system administrator for credential issues