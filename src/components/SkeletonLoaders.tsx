import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const ProductCardSkeleton = () => (
  <Card className="overflow-hidden">
    <div className="aspect-square bg-muted animate-pulse" />
    <CardContent className="p-3">
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded animate-pulse w-12" />
        </div>
        <div className="h-3 bg-muted rounded animate-pulse w-full" />
        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-4 bg-muted rounded animate-pulse w-16" />
            <div className="h-3 bg-muted rounded animate-pulse w-20" />
          </div>
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const ProductListSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-4">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 bg-muted rounded-lg animate-pulse flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-full" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              <div className="flex items-center gap-2">
                <div className="h-4 bg-muted rounded animate-pulse w-16" />
                <div className="h-3 bg-muted rounded animate-pulse w-20" />
                <div className="h-4 bg-muted rounded animate-pulse w-12" />
              </div>
            </div>
            <div className="h-8 w-8 bg-muted rounded animate-pulse flex-shrink-0" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const FarmCardSkeleton = () => (
  <div className="flex-shrink-0 w-64 mr-4">
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="h-32 bg-muted animate-pulse" />
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-3 bg-muted rounded animate-pulse w-full" />
          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </CardContent>
    </Card>
  </div>
);

export const QuickActionSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-4 text-center">
      <div className="h-8 w-8 bg-muted rounded animate-pulse mx-auto mb-2" />
      <div className="h-4 bg-muted rounded animate-pulse w-3/4 mx-auto" />
    </CardContent>
  </Card>
);