/**
 * Newsletter Detail Page
 *
 * View and manage individual newsletter
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/permissions";
import { container } from "@/src/di/container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit, ArrowLeft } from "lucide-react";
import { BroadcastForm } from "@/components/newsletters/BroadcastForm";

async function getNewsletterData(id: string) {
  try {
    const newsletter = await container.newsletterService.getNewsletterById(id);
    const creator = await container.officerRepository.findById(
      newsletter.createdById
    );

    return { newsletter, creator };
  } catch {
    return null;
  }
}

export default async function NewsletterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!isAdmin(session)) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const data = await getNewsletterData(id);

  if (!data) {
    notFound();
  }

  const { newsletter, creator } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-yellow-500";
      case "deleted":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" asChild>
        <Link href="/dashboard/admin/newsletters">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Newsletters
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {newsletter.name}
            </h1>
            <Badge className={getStatusColor(newsletter.status)}>
              {newsletter.status}
            </Badge>
          </div>
          {newsletter.description && (
            <p className="text-muted-foreground mt-2">
              {newsletter.description}
            </p>
          )}
        </div>
        {newsletter.status !== "deleted" && (
          <Button asChild>
            <Link href={`/dashboard/admin/newsletters/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        )}
      </div>

      {/* Newsletter Info */}
      <Card>
        <CardHeader>
          <CardTitle>Newsletter Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Channel ID
              </p>
              <p className="text-sm font-mono mt-1">{newsletter.channelId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Subscribers
              </p>
              <p className="text-sm mt-1">
                {newsletter.subscriberCount?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Created By
              </p>
              <p className="text-sm mt-1">{creator?.name || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Created
              </p>
              <p className="text-sm mt-1">
                {new Date(newsletter.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Reactions
              </p>
              <p className="text-sm mt-1">
                {newsletter.reactionsEnabled ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Broadcast Form */}
      {newsletter.status === "active" && (
        <Card>
          <CardHeader>
            <CardTitle>Send Broadcast</CardTitle>
            <CardDescription>
              Send a message to all newsletter subscribers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BroadcastForm newsletterId={id} />
          </CardContent>
        </Card>
      )}

      {newsletter.status === "inactive" && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              This newsletter is inactive. Activate it to send broadcasts.
            </p>
          </CardContent>
        </Card>
      )}

      {newsletter.status === "deleted" && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              This newsletter has been deleted and cannot send broadcasts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
