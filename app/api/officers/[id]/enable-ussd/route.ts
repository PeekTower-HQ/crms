
import { NextRequest, NextResponse } from "next/server";
import { container } from "@/src/di/container";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: officerId } = await params;
  const officerRepository = container.officerRepository;

  try {
    const officer = await officerRepository.findById(officerId);

    if (!officer) {
      return NextResponse.json({ error: "Officer not found" }, { status: 404 });
    }

    if (!officer.phone) {
      return NextResponse.json({ error: "Officer does not have a phone number" }, { status: 400 });
    }

    const updatedOfficer = await officerRepository.update(officerId, {
      ussdEnabled: true,
      ussdPhoneNumber: officer.phone,
      ussdRegisteredAt: new Date(),
    });

    return NextResponse.json(updatedOfficer);
  } catch (error) {
    console.error("Error enabling USSD access:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
