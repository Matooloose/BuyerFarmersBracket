import React from "react";
import { RotateCcw, ChevronDown } from "lucide-react";
import "./pull-to-refresh.css";

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

  // Calculate transform and opacity values within safe bounds
  const safeTransformY = Math.min(transformY, 50);
  const safeOpacity = Math.min(opacity, 1);

  return (
    <div 
      className="pull-to-refresh-indicator"
      data-transform-y
      style={{ 
        '--transform-y': `${safeTransformY}px`,
        '--opacity': safeOpacity
      } as React.CSSProperties}
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