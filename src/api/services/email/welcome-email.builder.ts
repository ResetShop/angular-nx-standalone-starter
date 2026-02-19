interface WelcomeEmailParams {
	firstName: string;
	email: string;
	password: string;
}

interface EmailContent {
	subject: string;
	html: string;
	text: string;
}

/**
 * Build welcome email content for new user accounts
 * Returns subject, HTML, and plain text email content
 *
 * @param params User details and temporary password
 * @returns Email content with subject, HTML, and text versions
 */
export function buildWelcomeEmail(params: WelcomeEmailParams): EmailContent {
	const subject = 'Your new account has been created';

	const text = buildTextContent(params);
	const html = buildHtmlContent(params);

	return { subject, html, text };
}

function buildTextContent({ firstName, email, password }: WelcomeEmailParams): string {
	return `Hello ${firstName},

Welcome! Your account has been created successfully.

Your login credentials:
Email: ${email}
Temporary Password: ${password}

IMPORTANT: Please change your password immediately after your first login for security reasons.

This is an automated message. Please do not reply to this email.

Best regards,
The Team`;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function buildHtmlContent({ firstName, email, password }: WelcomeEmailParams): string {
	const safeFirstName = escapeHtml(firstName);
	const safeEmail = escapeHtml(email);
	const safePassword = escapeHtml(password);

	return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2c3e50;">Hello ${safeFirstName},</h1>

    <p>Welcome! Your account has been created successfully.</p>

    <div style="background-color: #f4f4f4; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
        <h2 style="margin-top: 0; color: #2c3e50;">Your login credentials:</h2>
        <p style="margin: 10px 0;"><strong>Email:</strong> ${safeEmail}</p>
        <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background-color: #e8e8e8; padding: 2px 6px; border-radius: 3px;">${safePassword}</code></p>
    </div>

    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>IMPORTANT:</strong> Please change your password immediately after your first login for security reasons.</p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>

    <p>Best regards,<br>The Team</p>
</body>
</html>`;
}
