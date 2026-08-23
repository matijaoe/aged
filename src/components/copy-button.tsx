import { CheckIcon, CopyIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  value: string;
  /** What is being copied, for the accessible label: "Copy passphrase". */
  subject: string;
  size?: "icon-sm" | "icon-xs";
}

export function CopyButton({ value, subject, size = "icon-sm" }: CopyButtonProps) {
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  return (
    <Button
      aria-label={isCopied ? "Copied" : `Copy ${subject}`}
      onClick={() => copyToClipboard(value)}
      size={size}
      variant="ghost"
    >
      <AnimatePresence initial={false} mode="wait">
        {isCopied ? (
          <motion.span
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex"
            exit={{ opacity: 0, scale: 0.8 }}
            initial={{ opacity: 0, scale: 0.8 }}
            key="check"
            transition={{ duration: 0.12 }}
          >
            <CheckIcon aria-hidden="true" className="text-success-foreground" />
          </motion.span>
        ) : (
          <motion.span
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex"
            exit={{ opacity: 0, scale: 0.8 }}
            initial={{ opacity: 0, scale: 0.8 }}
            key="copy"
            transition={{ duration: 0.12 }}
          >
            <CopyIcon aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
