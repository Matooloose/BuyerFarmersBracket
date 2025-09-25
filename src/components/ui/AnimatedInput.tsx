import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AnimatedInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  success?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  id,
  label,
  type = "text",
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
  icon,
  endIcon,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasValue(value.length > 0);
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const isLabelFloated = isFocused || hasValue || placeholder;

  return (
    <div className={cn("relative group", className)}>
      {/* Floating Label */}
      <Label
        htmlFor={id}
        className={cn(
          "absolute left-3 transition-all duration-200 ease-in-out pointer-events-none",
          "text-muted-foreground",
          isLabelFloated
            ? "top-1 text-xs translate-y-0 scale-100"
            : "top-1/2 text-sm -translate-y-1/2 scale-100",
          isFocused && "text-primary",
          error && "text-destructive",
          success && "text-green-600",
          icon && (isLabelFloated ? "left-10" : "left-10")
        )}
        style={{
          transformOrigin: 'left center'
        }}
      >
        {label} {required && <span className="text-destructive">*</span>}
      </Label>

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200">
            {icon}
          </div>
        )}

        {/* Input Field */}
        <Input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={isFocused ? placeholder : ""}
          className={cn(
            "pt-6 pb-2 transition-all duration-200 ease-in-out",
            "border-2 bg-background/50 backdrop-blur-sm",
            "hover:bg-background/80",
            "focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20",
            icon && "pl-10",
            endIcon && "pr-10",
            error && "border-destructive focus:border-destructive focus:ring-destructive/20",
            success && "border-green-500 focus:border-green-500 focus:ring-green-500/20",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        />

        {/* Right Icon */}
        {endIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200">
            {endIcon}
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

export default AnimatedInput;