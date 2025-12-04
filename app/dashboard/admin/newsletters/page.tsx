/**
 * Newsletters List Page
 *
 * Admin page for managing WhatsApp newsletters
 * Pan-African Design: Multi-language broadcast capability
 */
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/permissions";
import { container } from "@/src/di/container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Radio, Users, TrendingUp } from "lucide-react";
import { NewsletterList } from "@/components/newsletters/NewsletterList";

async function getNewslettersData() {
  const result = await container.newsletterService.getNewsletters();
  const stats = await container.newsletterService.getStatistics();

  // Get creator details for each newsletter
  const newslettersWithCreator = await Promise.all(
    result.newsletters.map(async (newsletter) => {
      const creator = await container.officerRepository.findById(
        newsletter.createdById
      );

      return {
        id: newsletter.id,
        channelId: newsletter.channelId,
        name: newsletter.name,
        description: newsletter.description,
        status: newsletter.status,
        subscriberCount: newsletter.subscriberCount,
        createdBy: creator?.name || "Unknown",
        createdAt: newsletter.createdAt,
      };
    })
  );

  return { newsletters: newslettersWithCreator, stats };
}

export default async function NewslettersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!isAdmin(session)) {
    redirect("/dashboard");
  }

  const { newsletters, stats } = await getNewslettersData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            WhatsApp Newsletters
          </h1>
          <p className="text-muted-foreground">
            Manage WhatsApp channels for public broadcasts
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/newsletters/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Newsletter
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Newsletters
            </CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Subscribers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalSubscribers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {stats.averageSubscribers} per channel
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 30 Days</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.createdLast30Days}</div>
            <p className="text-xs text-muted-foreground">New channels</p>
          </CardContent>
        </Card>
      </div>

      {/* Newsletters Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Newsletters</CardTitle>
          <CardDescription>
            View and manage WhatsApp broadcast channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewsletterList newsletters={newsletters} />
        </CardContent>
      </Card>
    </div>
  );
}
