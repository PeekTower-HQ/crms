/**
 * Persons Export API Route
 *
 * GET /api/persons/export - Export person records to CSV
 *
 * Query parameters:
 * - isWanted: Filter wanted persons
 * - isHighRisk: Filter high-risk persons
 * - hasBiometrics: Filter by biometric data
 * - fromDate: Filter by start date (ISO 8601)
 * - toDate: Filter by end date (ISO 8601)
 *
 * Returns: CSV file download (PII is NOT included in export for security)
 * Requires: Station+ level permissions
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { unparse } from "papaparse";
import type { Person } from "@/src/domain/entities/Person";

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission check: Station+ level required
    if (!hasPermission(session, "reports", "export", "station")) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions to export person records" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const isWanted = searchParams.get("isWanted");
    const isHighRisk = searchParams.get("isHighRisk");
    const hasBiometrics = searchParams.get("hasBiometrics");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Build filters
    const filters: Record<string, unknown> = {};

    if (isWanted === "true") filters.isWanted = true;
    if (isWanted === "false") filters.isWanted = false;
    if (isHighRisk === "true") filters.isHighRisk = true;
    if (isHighRisk === "false") filters.isHighRisk = false;
    if (hasBiometrics === "true") filters.hasBiometrics = true;
    if (hasBiometrics === "false") filters.hasBiometrics = false;
    if (fromDate) filters.createdAfter = new Date(fromDate);
    if (toDate) filters.createdBefore = new Date(toDate);

    // Fetch persons
    const personRepo = container.personRepository;
    const persons: Person[] = await personRepo.findAll(filters);

    // Transform to CSV-friendly format
    // IMPORTANT: Do NOT include encrypted PII (addresses, phone, email)
    const csvData = persons.map((p) => ({
      "Person ID": p.id,
      NIN: p.nin || "N/A",
      "First Name": p.firstName,
      "Middle Name": p.middleName || "N/A",
      "Last Name": p.lastName,
      "Date of Birth": p.dateOfBirth ? p.dateOfBirth.toISOString().split("T")[0] : "N/A",
      Gender: p.gender,
      Nationality: p.nationality,
      "Is Wanted": p.isWanted ? "Yes" : "No",
      "Risk Level": p.riskLevel || "N/A",
      "Is Deceased or Missing": p.isDeceasedOrMissing ? "Yes" : "No",
      "Has Biometrics": p.hasBiometricData() ? "Yes" : "No",
      "Aliases": p.alias.join("; ") || "None",
      "Created At": p.createdAt.toISOString(),
      "Updated At": p.updatedAt.toISOString(),
      // PII fields are intentionally EXCLUDED for security
    }));

    // Generate CSV
    const csv = unparse(csvData);

    // Audit log
    await container.auditLogRepository.create({
      entityType: "person",
      entityId: "export",
      action: "export",
      officerId: session.user.id,
      stationId: session.user.stationId,
      success: true,
      details: {
        filters,
        recordCount: csvData.length,
        note: "PII excluded from export",
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="persons-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: unknown) {
    console.error("Persons export error:", error);

    // Audit failure
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await container.auditLogRepository.create({
        entityType: "person",
        entityId: "export",
        action: "export",
        officerId: session.user.id,
        stationId: session.user.stationId,
        success: false,
        details: { error: error instanceof Error ? error.message : String(error) },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      });
    }

    return NextResponse.json(
      { error: "Failed to export person records" },
      { status: 500 }
    );
  }
}
