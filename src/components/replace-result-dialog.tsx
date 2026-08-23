import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Asked before something dropped or pasted onto a finished result takes its
 * place. Everywhere else the app loads what arrives without ceremony — this
 * is the one screen holding something that cannot be got back, so it is the
 * one screen that asks.
 */
export function ReplaceResultDialog({
  open,
  /** The result carries a passphrase that exists nowhere else yet. */
  losesGeneratedPassphrase,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  losesGeneratedPassphrase: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog onOpenChange={(next) => !next && onCancel()} open={open}>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Replace this result?</AlertDialogTitle>
          <AlertDialogDescription>
            {losesGeneratedPassphrase
              ? "The generated passphrase goes with it. Nothing you have already downloaded can be opened without it."
              : "What's on screen now is discarded."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>Keep it</AlertDialogClose>
          <Button onClick={onConfirm}>Replace</Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
