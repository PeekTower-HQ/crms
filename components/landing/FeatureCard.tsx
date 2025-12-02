import { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <Card
      className={cn(
        "group border border-gray-100 hover:border-blue-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 ring-1 ring-blue-100 group-hover:ring-blue-200 transition-all">
          <Icon className="h-7 w-7 text-blue-700 group-hover:scale-110 transition-transform duration-300" />
        </div>
        <CardTitle className="text-xl font-semibold tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
