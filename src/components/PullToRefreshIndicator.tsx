import React from "react";
import { RotateCcw, ChevronDown } from "lucide-react";

interface PullToRefreshIndicatorProps {
  isVisible: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  shouldTrigger: boolean;
  transformY: number;
  opacity: number;
}

const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  isVisible,
  isRefreshing,
  pullDistance,
  shouldTrigger,
  transformY,
  opacity
}) => {
  if (!isVisible) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-40 flex justify-center pt-2 transition-all duration-200"
      style={{ 
        transform: `translateY(${Math.min(transformY, 50)}px)`,
        opacity: Math.min(opacity, 1)
      }}
    >
      <div className="bg-card/90 backdrop-blur-sm border rounded-full px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2 text-sm">
          {isRefreshing ? (
            <>
              <RotateCcw className="h-4 w-4 animate-spin text-primary" />
              <span className="text-primary font-medium">Refreshing...</span>
            </>
          ) : shouldTrigger ? (
            <>
              <ChevronDown className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium">Release to refresh</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Pull to refresh</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PullToRefreshIndicator;