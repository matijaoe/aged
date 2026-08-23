import { DownloadIcon, TriangleAlertIcon } from "lucide-react";
import { useEffect, useRef } from "react";

import type { AgedResult } from "@/hooks/use-aged";
import { CopyButton } from "@/components/copy-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";

/**
 * An addon's icon rule (`[&_svg]:-mx-0.5`) is tuned for bare icons sitting
 * directly in the addon, which crushes the gap on a labelled button. These
 * actions carry labels, so the pull-in is cancelled here.
 */
const addonButton = "[&_svg]:mx-0";

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

  function save(blob: Blob, name: string) {
    if (objectUrl.current !== null) {
      URL.revokeObjectURL(objectUrl.current);
    }
    objectUrl.current = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl.current;
    anchor.download = name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }

  function downloadResult() {
    save(
      new Blob([result.bytes as BlobPart], { type: "application/octet-stream" }),
      downloadName,
    );
  }

  function downloadPassphrase(passphrase: string) {
    save(new Blob([passphrase], { type: "text/plain" }), `${downloadName}.passphrase.txt`);
  }

  return (
    <div className="flex min-h-0 w-full flex-col gap-5 overflow-y-auto overscroll-contain">
      {result.generatedPassphrase !== null && (
        <>
          {/* Above the artefact: the caveat should frame the passphrase, not
              trail after the part people copy and move on from. */}
          <Alert variant="warning">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertTitle>Save this passphrase now</AlertTitle>
            <AlertDescription>
              It's the only key to this file and it can't be recovered — not by you, not by
              anyone.
            </AlertDescription>
          </Alert>
          {/* translate="no": page translation transmits document text to the
              translation service; the passphrase must never be part of it. */}
          <InputGroup
            className="**:[textarea]:min-h-0 **:[textarea]:max-sm:min-h-0"
            translate="no"
          >
            <InputGroupTextarea
              aria-label="Generated passphrase"
              className="font-mono leading-relaxed"
              data-gramm="false"
              readOnly
              rows={1}
              spellCheck={false}
              value={result.generatedPassphrase}
            />
            <InputGroupAddon align="block-end">
              <CopyButton
                className={addonButton}
                label="Copy"
                size="sm"
                subject="passphrase"
                value={result.generatedPassphrase}
              />
              <Button
                className={addonButton}
                onClick={() => downloadPassphrase(result.generatedPassphrase ?? "")}
                size="sm"
                variant="ghost"
              >
                <DownloadIcon aria-hidden="true" />
                Download
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </>
      )}

      {result.textPreview !== null && (
        <InputGroup translate="no">
          <InputGroupTextarea
            aria-label="Decrypted text"
            className="font-mono"
            data-gramm="false"
            readOnly
            spellCheck={false}
            value={result.textPreview}
          />
          <InputGroupAddon align="block-end">
            <CopyButton
              className={addonButton}
              label="Copy"
              size="sm"
              subject="decrypted text"
              value={result.textPreview}
            />
          </InputGroupAddon>
        </InputGroup>
      )}

      <Field className="flex w-full flex-col gap-2.5" name="filename">
        <FieldLabel className="text-base">Save as</FieldLabel>
        <div className="flex w-full gap-2">
          <InputGroup className="min-w-0 flex-1">
            <InputGroupInput
              aria-label="Output file name"
              onChange={(event) => onOutputNameChange(event.target.value)}
              size="lg"
              type="text"
              value={outputName}
            />
          </InputGroup>
          <Button onClick={downloadResult} size="lg">
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

      <Button className="self-center" onClick={onReset} variant="ghost">
        {result.mode === "encrypt" ? "Encrypt something else" : "Decrypt something else"}
      </Button>
    </div>
  );
}
