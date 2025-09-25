import React, { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AnimatedTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  error?: string;
  success?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
}

export const AnimatedTextarea: React.FC<AnimatedTextareaProps> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  error,
  success,
  disabled,
  required,
  className,
  rows = 4,
  maxLength,
  showCharCount = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setHasValue(value.length > 0);
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const isLabelFloated = isFocused || hasValue || placeholder;
  const charCount = value.length;
  const charCountColor = maxLength
    ? charCount > maxLength * 0.8
      ? charCount >= maxLength
        ? "text-destructive"
        : "text-amber-500"
      : "text-muted-foreground"
    : "text-muted-foreground";

  return (
    <div className={cn("relative group", className)}>
      {/* Floating Label */}
      <Label
        htmlFor={id}
        className={cn(
          "absolute left-3 transition-all duration-200 ease-in-out pointer-events-none z-10",
          "text-muted-foreground",
          isLabelFloated
            ? "top-1 text-xs translate-y-0 scale-100"
            : "top-3 text-sm translate-y-0 scale-100",
          isFocused && "text-primary",
          error && "text-destructive",
          success && "text-green-600"
        )}
        style={{
          transformOrigin: 'left center'
        }}
      >
        {label} {required && <span className="text-destructive">*</span>}
      </Label>

      {/* Textarea Container */}
      <div className="relative">
        {/* Textarea Field */}
        <Textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={isFocused ? placeholder : ""}
          rows={rows}
          maxLength={maxLength}
          className={cn(
            "pt-6 pb-2 resize-none transition-all duration-200 ease-in-out",
            "border-2 bg-background/50 backdrop-blur-sm",
            "hover:bg-background/80",
            "focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20",
            error && "border-destructive focus:border-destructive focus:ring-destructive/20",
            success && "border-green-500 focus:border-green-500 focus:ring-green-500/20",
            disabled && "opacity-50 cursor-not-allowed",
            showCharCount && maxLength && "pb-8"
          )}
        />

        {/* Character Count */}
        {showCharCount && maxLength && (
          <div className={cn(
            "absolute bottom-2 right-3 text-xs transition-all duration-200",
            "animate-in fade-in-0 slide-in-from-bottom-1",
            charCountColor
          )}>
            {charCount}/{maxLength}
          </div>
        )}

        {/* Focus Ring Animation */}
        <div
          className={cn(
            "absolute inset-0 rounded-md border-2 border-transparent transition-all duration-200",
            "pointer-events-none",
            isFocused && "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
          )}
        />
      </div>

      {/* Validation Messages */}
      {(error || success) && (
        <div className={cn(
          "mt-1 text-xs transition-all duration-200 ease-in-out",
          "animate-in slide-in-from-top-1 fade-in-0",
          error && "text-destructive",
          success && "text-green-600"
        )}>
          {error || success}
        </div>
      )}

      {/* Subtle Background Glow */}
      <div
        className={cn(
          "absolute inset-0 -z-10 rounded-md transition-all duration-300",
          "bg-gradient-to-r from-primary/5 via-transparent to-primary/5",
          "opacity-0 scale-95",
          isFocused && "opacity-100 scale-100"
        )}
      />
    </div>
  );
};

export default AnimatedTextarea;