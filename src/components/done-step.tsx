import { DownloadIcon, TriangleAlertIcon } from "lucide-react";
import { useEffect, useRef } from "react";

import type { AgedResult } from "@/hooks/use-aged";
import { CopyButton } from "@/components/copy-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";

interface DoneStepProps {
  result: AgedResult;
  outputName: string;
  /** The name the file is actually saved under (fallback already applied). */
  downloadName: string;
  onOutputNameChange: (name: string) => void;
  onReset: () => void;
}

export function DoneStep({
  result,
  outputName,
  downloadName,
  onOutputNameChange,
  onReset,
}: DoneStepProps) {
  const objectUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrl.current !== null) {
        URL.revokeObjectURL(objectUrl.current);
      }
    };
  }, []);

  function download() {
    if (objectUrl.current !== null) {
      URL.revokeObjectURL(objectUrl.current);
    }
    const blob = new Blob([result.bytes as BlobPart], {
      type: "application/octet-stream",
    });
    objectUrl.current = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl.current;
    anchor.download = downloadName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }

  return (
    <div className="flex flex-col gap-4">
      {result.generatedPassphrase !== null && (
        <GeneratedPassphrase passphrase={result.generatedPassphrase} />
      )}

      {result.textPreview !== null && (
        <div className="relative">
          <Textarea
            aria-label="Decrypted text"
            className="min-h-32 pe-10 font-mono text-sm"
            data-gramm="false"
            readOnly
            spellCheck={false}
            translate="no"
            value={result.textPreview}
          />
          <div className="absolute end-1.5 top-1.5">
            <CopyButton size="icon-xs" subject="decrypted text" value={result.textPreview} />
          </div>
        </div>
      )}

      <Field className="flex flex-col gap-2" name="filename">
        <FieldLabel>Save as</FieldLabel>
        <div className="flex gap-2">
          <InputGroup className="min-w-0 flex-1">
            <InputGroupInput
              aria-label="Output file name"
              onChange={(event) => onOutputNameChange(event.target.value)}
              type="text"
              value={outputName}
            />
          </InputGroup>
          <Button onClick={download}>
            <DownloadIcon aria-hidden="true" />
            Download
          </Button>
        </div>
        {result.nameFellBack && (
          <FieldDescription>
            The file name had no .age ending to strip, so it's saved as {result.suggestedName}.
          </FieldDescription>
        )}
      </Field>

      <Button className="self-center" onClick={onReset} size="sm" variant="ghost">
        {result.mode === "encrypt" ? "Encrypt something else" : "Decrypt something else"}
      </Button>
    </div>
  );
}

function GeneratedPassphrase({ passphrase }: { passphrase: string }) {
  return (
    <div className="flex flex-col gap-3">
      {/* translate="no": page translation transmits document text to the
          translation service; the passphrase must never be part of it. */}
      <div
        className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3"
        translate="no"
      >
        <p className="min-w-0 flex-1 select-all break-words font-mono text-sm leading-relaxed">
          {passphrase}
        </p>
        <CopyButton size="icon-xs" subject="passphrase" value={passphrase} />
      </div>
      <Alert variant="warning">
        <TriangleAlertIcon aria-hidden="true" />
        <AlertTitle>Save this passphrase now</AlertTitle>
        <AlertDescription>
          It's the only key to this file and it can't be recovered — not by you, not by
          anyone.
        </AlertDescription>
      </Alert>
    </div>
  );
}
