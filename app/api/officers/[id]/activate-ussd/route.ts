/**
 * USSD Activation API Endpoint
 * 
 * POST /api/officers/[id]/activate-ussd
 * 
 * Admin-initiated USSD activation with auto-generated Quick PIN
 * Generates all required fields for proper USSD authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Validate session & permissions
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SuperAdmin and Admin can activate USSD
    if (
      !hasPermission(session as any, "officers", "update", "national") &&
      !hasPermission(session as any, "officers", "update", "station")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: officerId } = await params;

    // 2. Find officer
    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
      include: {
        station: true,
        role: true,
      },
    });

    if (!officer) {
      await prisma.$disconnect();
      return NextResponse.json({ error: "Officer not found" }, { status: 404 });
    }

    // Check if officer is active
    if (!officer.active) {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: "Cannot activate USSD for inactive officer" },
        { status: 400 }
      );
    }

    // 3. Validate phone exists
    if (!officer.phone) {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: "Officer does not have a phone number on record" },
        { status: 400 }
      );
    }

    // 4. Check if already registered
    if (officer.ussdPhoneNumber && officer.ussdQuickPinHash) {
      await prisma.$disconnect();
      return NextResponse.json(
        {
          error: "Officer already has USSD access",
          alreadyRegistered: true,
          officer: {
            id: officer.id,
            badge: officer.badge,
            name: officer.name,
            ussdEnabled: officer.ussdEnabled,
            ussdRegisteredAt: officer.ussdRegisteredAt,
          },
        },
        { status: 400 }
      );
    }

    // Check if phone is already registered to another officer
    const existingPhone = await prisma.officer.findFirst({
      where: {
        ussdPhoneNumber: officer.phone,
        NOT: {
          id: officer.id,
        },
      },
    });

    if (existingPhone) {
      await prisma.$disconnect();
      return NextResponse.json(
        {
          error: `Phone number already registered to officer ${existingPhone.badge}`,
        },
        { status: 400 }
      );
    }

    // 5. Generate random 4-digit Quick PIN
    const quickPin = Math.floor(1000 + Math.random() * 9000).toString();

    // 6. Hash with Argon2id
    const quickPinHash = await hash(quickPin);

    // 7. Update officer with all USSD fields atomically
    const updatedOfficer = await prisma.officer.update({
      where: { id: officerId },
      data: {
        ussdPhoneNumber: officer.phone,
        ussdQuickPinHash: quickPinHash,
        ussdEnabled: true,
        ussdRegisteredAt: new Date(),
        ussdDailyLimit: 50, // Default limit
      },
      include: {
        station: true,
        role: true,
      },
    });

    // 8. Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "officer",
        entityId: officerId,
        officerId: session.user.id,
        action: "update",
        success: true,
        details: {
          action: "ussd_activation",
          targetOfficer: officer.badge,
          targetOfficerName: officer.name,
          phoneNumber: officer.phone,
          activatedBy: session.user.badge,
          timestamp: new Date().toISOString(),
        },
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      },
    });

    await prisma.$disconnect();

    // 9. Return success with Quick PIN (shown once only)
    return NextResponse.json(
      {
        success: true,
        quickPin, // IMPORTANT: Only returned on successful activation
        officer: {
          id: updatedOfficer.id,
          badge: updatedOfficer.badge,
          name: updatedOfficer.name,
          phone: updatedOfficer.phone,
          ussdPhoneNumber: updatedOfficer.ussdPhoneNumber,
          ussdEnabled: updatedOfficer.ussdEnabled,
          ussdRegisteredAt: updatedOfficer.ussdRegisteredAt,
          ussdDailyLimit: updatedOfficer.ussdDailyLimit,
          station: {
            name: updatedOfficer.station.name,
            code: updatedOfficer.station.code,
          },
          role: {
            name: updatedOfficer.role.name,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Activate USSD Error]", error);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: "Failed to activate USSD. Please try again." },
      { status: 500 }
    );
  }
}
