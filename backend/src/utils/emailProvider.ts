export const sendEmail = async (opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> => {
  // plug in SendGrid / AWS SES / Resend here
};