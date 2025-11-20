
import { NextRequest, NextResponse } from "next/server";
import { container } from "@/src/di/container";

export async function GET(req: NextRequest) {
  const officerRepository = container.officerRepository;
  const roleRepository = container.roleRepository;
  const stationRepository = container.stationRepository;
  
  const { searchParams } = new URL(req.url);
  const badge = searchParams.get("badge");

  if (!badge) {
    return NextResponse.json({ error: "Badge number is required" }, { status: 400 });
  }

  try {
    const officer = await officerRepository.findByBadge(badge);
    
    if (!officer) {
      return NextResponse.json(null, { status: 404 });
    }

    // Fetch role and station details to enrich the response
    const role = await roleRepository.findById(officer.roleId);
    const station = await stationRepository.findById(officer.stationId);

    // Return enriched DTO (Data Transfer Object) for frontend consumption
    return NextResponse.json({
      id: officer.id,
      badge: officer.badge,
      name: officer.name,
      phone: officer.phone,
      email: officer.email,
      active: officer.active,
      role: {
        id: role?.id || officer.roleId,
        name: role?.name || "Unknown",
        level: role?.level || 99,
      },
      station: {
        id: station?.id || officer.stationId,
        name: station?.name || "Unknown",
        code: station?.code || "N/A",
      },
      // USSD fields for checking registration status
      ussdPhoneNumber: officer.ussdPhoneNumber,
      ussdEnabled: officer.ussdEnabled,
      ussdRegisteredAt: officer.ussdRegisteredAt,
    });
  } catch (error) {
    console.error("Error searching for officer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
