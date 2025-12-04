/**
 * Create Newsletter Page
 *
 * Form for creating a new WhatsApp newsletter
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NewsletterForm } from "@/components/newsletters/NewsletterForm";

export default async function NewNewsletterPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!isAdmin(session)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Newsletter</h1>
        <p className="text-muted-foreground">
          Create a new WhatsApp broadcast channel
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Newsletter Details</CardTitle>
          <CardDescription>
            Enter the details for your new newsletter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewsletterForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
