export const sendSMS = async (opts: {
  to: string;
  message: string;
}): Promise<void> => {
  // plug in Twilio / AWS SNS here
};