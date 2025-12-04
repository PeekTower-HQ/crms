/**
 * Edit Newsletter Page
 *
 * Form for editing an existing WhatsApp newsletter
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
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewsletterForm } from "@/components/newsletters/NewsletterForm";

async function getNewsletterData(id: string) {
  try {
    const newsletter = await container.newsletterService.getNewsletterById(id);
    return newsletter;
  } catch {
    return null;
  }
}

export default async function EditNewsletterPage({
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
  const newsletter = await getNewsletterData(id);

  if (!newsletter) {
    notFound();
  }

  if (newsletter.status === "deleted") {
    redirect(`/dashboard/admin/newsletters/${id}`);
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" asChild>
        <Link href={`/dashboard/admin/newsletters/${id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Newsletter
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Newsletter</h1>
        <p className="text-muted-foreground">
          Update newsletter details and settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Newsletter Details</CardTitle>
          <CardDescription>
            Modify the newsletter information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewsletterForm
            mode="edit"
            newsletter={{
              id: newsletter.id,
              name: newsletter.name,
              description: newsletter.description || "",
              pictureUrl: newsletter.pictureUrl || "",
              reactionsEnabled: newsletter.reactionsEnabled,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
