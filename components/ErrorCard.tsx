import { AlertTriangle, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <AlertTriangle className="size-8 text-destructive" />
        <p className="font-medium">{message}</p>
        <p className="text-sm text-muted-foreground">
          Check the link and make sure the content is public or you&apos;re
          authorized to download it, then try again.
        </p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="mt-1">
            <RotateCcw /> Try another URL
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
