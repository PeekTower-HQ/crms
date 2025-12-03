import { NextResponse } from "next/server";
import * as whatsappBot from "@/src/services/whatsapp_service";

export async function POST(request: Request) {
  const body = await request.json();

  // Check if webhook contains a message before processing
  if (!body.messages || !body.messages[0]) {
    // This is likely a status update, delivery receipt, or other non-message webhook
    return NextResponse.json(
      { message: "No message to process" },
      { status: 200 }
    );
  }

  try {
    
    await whatsappBot.init(body);

    return NextResponse.json({ message: "Success" }, { status: 200 });
    
  } catch (error) {
    console.error("WhatsApp API error:", error);
    return NextResponse.json(
      { message: "Something went wrong", error },
      { status: 500 }
    );
  }
}