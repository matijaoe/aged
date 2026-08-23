import { CheckIcon, CopyIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ComponentType } from "react";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  /** What is being copied, for the accessible label: "Copy passphrase". */
  subject: string;
  /** Shown beside the icon; omit for an icon-only button. */
  label?: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  size?: "icon-sm" | "icon-xs" | "sm";
  className?: string;
}

export function CopyButton({
  value,
  subject,
  label,
  icon: Icon = CopyIcon,
  size = "icon-sm",
  className,
}: CopyButtonProps) {
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  return (
    <Button
      aria-label={label === undefined ? `Copy ${subject}` : undefined}
      className={className}
      onClick={() => copyToClipboard(value)}
      size={size}
      variant="ghost"
    >
      <span className={cn("relative inline-flex", label !== undefined && "shrink-0")}>
        {/* Keeps the button from resizing as the icon swaps. */}
        <Icon aria-hidden={true} className="invisible" />
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 inline-flex items-center justify-center"
            exit={{ opacity: 0, scale: 0.8 }}
            initial={{ opacity: 0, scale: 0.8 }}
            key={isCopied ? "check" : "copy"}
            transition={{ duration: 0.12 }}
          >
            {isCopied ? (
              <CheckIcon aria-hidden={true} className="text-success-foreground" />
            ) : (
              <Icon aria-hidden={true} />
            )}
          </motion.span>
        </AnimatePresence>
      </span>
      {label !== undefined && (isCopied ? "Copied" : label)}
    </Button>
  );
}
