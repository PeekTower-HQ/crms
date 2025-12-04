"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Calendar, User } from "lucide-react";

interface Newsletter {
  id: string;
  channelId: string;
  name: string;
  description: string | null;
  status: string;
  subscriberCount: number | null;
  createdBy: string;
  createdAt: Date;
}

interface NewsletterListProps {
  newsletters: Newsletter[];
}

export function NewsletterList({ newsletters }: NewsletterListProps) {
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

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (newsletters.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No newsletters found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create your first newsletter to get started
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Subscribers</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {newsletters.map((newsletter) => (
            <TableRow key={newsletter.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{newsletter.name}</p>
                  {newsletter.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {newsletter.description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(newsletter.status)}>
                  {getStatusText(newsletter.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {newsletter.subscriberCount?.toLocaleString() || 0}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm">{newsletter.createdBy}</p>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm" suppressHydrationWarning>
                    {new Date(newsletter.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/dashboard/admin/newsletters/${newsletter.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
