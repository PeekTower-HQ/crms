/**
 * Cases API Routes
 *
 * Endpoints:
 * GET /api/cases - List cases with filters
 * POST /api/cases - Create new case
 *
 * Authentication: Required (NextAuth session)
 * Permissions: cases:read, cases:create
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { ValidationError } from "@/src/lib/errors";
import type { CaseFilters } from "@/src/domain/interfaces/repositories/ICaseRepository";
import type { CaseStatus, CaseCategory, CaseSeverity } from "@/src/domain/entities/Case";

/**
 * GET /api/cases
 * List cases with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const severity = searchParams.get("severity");
    const search = searchParams.get("search");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // Build filters
    const filters: CaseFilters = {
      stationId: session.user.stationId, // Filter by user's station
    };

    if (status) filters.status = status as CaseStatus;
    if (category) filters.category = category as CaseCategory;
    if (severity) filters.severity = severity as CaseSeverity;
    if (search) filters.search = search;
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    // Get cases
    const cases = await container.caseService.listCases(
      filters,
      session.user.id
    );

    return NextResponse.json({
      cases,
      count: cases.length,
    });
  } catch (error) {
    console.error("GET /api/cases error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cases
 * Create a new case
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Create case
    const newCase = await container.caseService.createCase(
      {
        title: body.title,
        description: body.description,
        category: body.category,
        severity: body.severity,
        incidentDate: body.incidentDate,
        location: body.location,
        stationId: session.user.stationId,
        officerId: session.user.id,
      },
      session.user.id,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json(
      { case: newCase },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/cases error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
