import { NextRequest, NextResponse } from "next/server";

const sendEmail = async (payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) => {
  // Replace this with your email provider integration
  // Example: SendGrid, Mailgun, SMTP via nodemailer, etc.
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    await sendEmail({ name, email, subject, message });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("contact error:", err);
    return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  }
}