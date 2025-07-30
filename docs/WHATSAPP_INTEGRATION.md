# WhatsApp Integration Documentation

## Overview

The D4 Media Task Management System includes WhatsApp integration using the DXing API service for sending automated notifications, particularly for password reset notifications.

## Features

- **Password Reset Notifications**: Automatically send new passwords via WhatsApp when admin resets user passwords
- **Indian Phone Number Support**: Optimized for Indian mobile numbers with +91 country code
- **Secure Message Templates**: Pre-formatted messages with D4 Media branding
- **Service Testing**: Admin panel to test WhatsApp connectivity
- **Multiple Notification Types**: Support for various notification types (tasks, bookings, etc.)

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
# WhatsApp Service (DXing API)
WHATSAPP_ACCOUNT_ID=17503326891534b76d325a8f591b52d302e71813316853f511cb619
WHATSAPP_SECRET_KEY=9d07dd4538190fc918a5ef6833bb95e8a7b5659a
```

### DXing API Details

- **Service Provider**: DXing.net
- **API Documentation**: https://dxing.net/dxapi/doc#documentation
- **Account ID**: 17503326891534b76d325a8f591b52d302e71813316853f511cb619
- **Secret Key**: 9d07dd4538190fc918a5ef6833bb95e8a7b5659a

## Usage

### Password Reset with WhatsApp

When a super admin resets a user's password:

1. A secure password is automatically generated
2. The password is updated in the database
3. If the user has a phone number, a WhatsApp message is sent
4. The message includes the new password and security instructions

### Message Format

```
🔐 *D4 Media - Password Reset*

Hello [User Name],

Your account password has been reset by [Admin Name].

*New Password:* [Generated Password]

⚠️ *Important Security Notice:*
- Please login and change this password immediately
- Do not share this password with anyone
- Delete this message after changing your password

Login at: https://d4media.app

For support, contact: +91-XXXXXXXXXX

*D4 Media Team*
```

## API Endpoints

### Reset User Password
```
PUT /api/v1/users/:id/reset-password
Authorization: Bearer [token] (Super Admin only)
Body: { "newPassword": "string" }
```

Response includes WhatsApp notification status:
```json
{
  "success": true,
  "message": "User password reset successfully",
  "whatsappNotification": {
    "status": "sent|failed|no_phone",
    "message": "Status description"
  }
}
```

### Test WhatsApp Service
```
POST /api/v1/users/test-whatsapp
Authorization: Bearer [token] (Super Admin only)
Body: { "phoneNumber": "+919876543210" }
```

## Phone Number Format

The service automatically formats Indian phone numbers:

- **Input**: `9876543210` → **Output**: `+919876543210`
- **Input**: `919876543210` → **Output**: `+919876543210`
- **Input**: `+919876543210` → **Output**: `+919876543210`

## WhatsApp Service Class

### Core Methods

#### `sendMessage(phoneNumber, message)`
Send a basic WhatsApp message to a phone number.

#### `sendPasswordResetNotification(phoneNumber, userName, newPassword, adminName)`
Send a formatted password reset notification.

#### `sendNotification(phoneNumber, title, content, options)`
Send a general notification with customizable options.

#### `sendTaskNotification(phoneNumber, taskData)`
Send task-related notifications.

#### `sendBookingConfirmation(phoneNumber, bookingData)`
Send booking confirmation messages.

#### `testService(testPhoneNumber)`
Test the WhatsApp service connectivity.

#### `generateSecurePassword(length)`
Generate a secure random password.

## Error Handling

The service includes comprehensive error handling:

- **Service Not Configured**: Missing environment variables
- **Invalid Phone Number**: Incorrect format or missing number
- **API Errors**: DXing API failures
- **Network Timeouts**: 10-second timeout for API calls

## Security Considerations

1. **Environment Variables**: Store API credentials securely
2. **Password Generation**: Uses cryptographically secure random generation
3. **Logging**: Security events are logged for audit trails
4. **Access Control**: Only super admins can reset passwords and test service
5. **Message Deletion**: Users are instructed to delete password messages

## Frontend Components

### PasswordResetModal
- Auto-generates secure passwords
- Shows WhatsApp notification status
- Displays user phone number if available
- Provides password regeneration option

### WhatsAppTest (Admin Component)
- Test WhatsApp service connectivity
- Validate phone number format
- Display API response details
- Service status indicators

## Integration Points

### User Management
- Password reset functionality in user list and detail pages
- WhatsApp status indicators in admin interface
- Phone number validation in user forms

### Notification System
- Extensible for other notification types
- Template-based message formatting
- Multi-channel notification support

## Troubleshooting

### Common Issues

1. **Messages Not Sending**
   - Check environment variables
   - Verify phone number format
   - Test API connectivity

2. **Invalid Phone Numbers**
   - Ensure 10-digit Indian numbers
   - Check for proper formatting
   - Validate country code

3. **API Errors**
   - Check DXing service status
   - Verify account credentials
   - Review API rate limits

### Testing

Use the admin WhatsApp test component to:
- Verify service configuration
- Test phone number formatting
- Check API connectivity
- Validate message delivery

## Future Enhancements

1. **Multi-language Support**: Localized message templates
2. **Message Templates**: Customizable message formats
3. **Delivery Reports**: Track message delivery status
4. **Bulk Messaging**: Send messages to multiple users
5. **Rich Media**: Support for images and documents
6. **International Numbers**: Support for non-Indian numbers

## Support

For WhatsApp integration issues:
1. Check service configuration
2. Test with known working phone numbers
3. Review server logs for error details
4. Contact DXing support if API issues persist

## Compliance

- Messages include opt-out instructions
- User data is handled securely
- Audit logs maintain message history
- GDPR compliance for user data