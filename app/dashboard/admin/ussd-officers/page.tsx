/**
 * USSD Officer Management Admin Page
 *
 * Features:
 * - View all officers with USSD registration status
 * - Enable/disable USSD access per officer
 * - View USSD query logs (filterable)
 * - View usage statistics
 * - Reset Quick PINs
 *
 * Permissions: SuperAdmin, Admin only
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Activity, Users, TrendingUp, Eye, PhoneOff, Clock } from "lucide-react";
import { format } from "date-fns";
import { ActivateUssdModal } from "@/components/officers/activate-ussd-modal";
import { container } from "@/src/di/container";

export const metadata = {
  title: "USSD Officer Management | CRMS",
  description: "Manage USSD access for field officers",
};

async function getUSSDOfficers() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ussd-officers`, {
      cache: 'no-store',
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.officers || [];
  } catch (error) {
    console.error("Error fetching USSD officers:", error);
    return [];
  }
}

async function getAllOfficersWithUssdStatus() {
  try {
    // Get all officers from repository
    const officers = await container.officerRepository.findAll({});
    
    // Get role and station info for each officer
    const officersWithDetails = await Promise.all(
      officers.map(async (officer) => {
        const role = await container.roleRepository.findById(officer.roleId);
        const station = await container.stationRepository.findById(officer.stationId);

        return {
          id: officer.id,
          badge: officer.badge,
          name: officer.name,
          phone: officer.phone,
          role: {
            name: role?.name || "Unknown",
            level: role?.level || 99,
          },
          station: {
            name: station?.name || "Unknown",
            code: station?.code || "N/A",
          },
          active: officer.active,
          ussdPhoneNumber: officer.ussdPhoneNumber,
          ussdEnabled: officer.ussdEnabled,
          ussdRegisteredAt: officer.ussdRegisteredAt,
          ussdLastUsed: officer.ussdLastUsed,
        };
      })
    );

    return officersWithDetails;
  } catch (error) {
    console.error("Error fetching officers:", error);
    return [];
  }
}

export default async function USSDOfficersPage() {
  // Authentication check
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Permission check: Only SuperAdmin and Admin can access
  if (
    !hasPermission(session as any, "officers", "update", "national") &&
    !hasPermission(session as any, "officers", "update", "station")
  ) {
    redirect("/dashboard");
  }

  const allOfficers = await getAllOfficersWithUssdStatus();
  const ussdOfficers = await getUSSDOfficers();

  // Calculate statistics
  const stats = {
    total: allOfficers.length,
    registered: allOfficers.filter((o: any) => o.ussdPhoneNumber).length,
    enabled: allOfficers.filter((o: any) => o.ussdEnabled).length,
    disabled: allOfficers.filter((o: any) => o.ussdPhoneNumber && !o.ussdEnabled).length,
    totalQueries: ussdOfficers.reduce((sum: number, o: any) => sum + (o.totalQueries || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">USSD Officer Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage field officer access to USSD services for low-connectivity scenarios
          </p>
        </div>
        <ActivateUssdModal />
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Officers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All officers in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">USSD Registered</CardTitle>
            <Phone className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.registered}</div>
            <p className="text-xs text-muted-foreground">Officers with USSD access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enabled</CardTitle>
            <Phone className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enabled}</div>
            <p className="text-xs text-muted-foreground">Active USSD access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQueries}</div>
            <p className="text-xs text-muted-foreground">All-time USSD queries</p>
          </CardContent>
        </Card>
      </div>

      {/* Officers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Officers - USSD Status</CardTitle>
        </CardHeader>
        <CardContent>
          {allOfficers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No officers found</p>
              <p className="text-sm mt-2">Add officers to the system first</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Officer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Station</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">USSD Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Used</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allOfficers.map((officer: any) => {
                    const hasUssd = !!officer.ussdPhoneNumber;
                    const isEnabled = officer.ussdEnabled;
                    
                    return (
                      <tr key={officer.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{officer.name}</div>
                            <div className="text-sm text-muted-foreground font-mono">{officer.badge}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {officer.phone ? (
                            <span className="text-sm font-mono">{officer.phone}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No phone</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">{officer.station.name}</td>
                        <td className="px-4 py-3">
                          {!hasUssd ? (
                            <Badge variant="outline" className="text-gray-600">
                              <PhoneOff className="h-3 w-3 mr-1" />
                              Not Registered
                            </Badge>
                          ) : isEnabled ? (
                            <Badge variant="default" className="bg-green-600">
                              <Phone className="h-3 w-3 mr-1" />
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-orange-600">
                              <PhoneOff className="h-3 w-3 mr-1" />
                              Disabled
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {officer.ussdRegisteredAt ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {format(new Date(officer.ussdRegisteredAt), "MMM d, yyyy")}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {officer.ussdLastUsed ? (
                            format(new Date(officer.ussdLastUsed), "MMM d, yyyy")
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {hasUssd ? (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/admin/ussd-officers/${officer.id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">About USSD Access</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Officers self-register by dialing the USSD shortcode from their phone</li>
          <li>Admins can enable/disable access and reset Quick PINs</li>
          <li>USSD allows field officers to check records without internet connectivity</li>
          <li>All USSD queries are logged and rate-limited for security</li>
        </ul>
      </div>
    </div>
  );
}
