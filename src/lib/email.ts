export async function sendAccountEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const turboConsumerKey = process.env.TURBOSMTP_CONSUMER_KEY;
  const turboConsumerSecret = process.env.TURBOSMTP_CONSUMER_SECRET;
  const from = process.env.EMAIL_FROM;

  if (turboConsumerKey && turboConsumerSecret && from) {
    const response = await fetch(process.env.TURBOSMTP_API_URL || "https://api.turbo-smtp.com/api/v2/mail/send", {
      method: "POST",
      headers: { consumerKey: turboConsumerKey, consumerSecret: turboConsumerSecret, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html_content: html }),
    });
    if (!response.ok) throw new Error(`TurboSMTP returned ${response.status}.`);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[email-preview] ${to} | ${subject}\n${html}`);
      return;
    }
    throw new Error("RESEND_API_KEY and EMAIL_FROM are required in production.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!response.ok) throw new Error(`Email provider returned ${response.status}.`);
}