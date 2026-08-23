import {
  CopyIcon,
  DownloadIcon,
  EllipsisIcon,
  PlusIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { maxPreviewBytes, type AgedResult } from "@/hooks/use-aged";
import { CopyButton } from "@/components/copy-button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cell } from "@/components/lattice";
import { armorBytes, armorText } from "@/lib/crypto/armor";
import { ageSuffix, stripAgeSuffix } from "@/lib/crypto/filename";
import { formatBytes } from "@/lib/format";
import { secretFieldProps } from "@/lib/secret-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/menu";
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

/** Base64 plus line breaks; enough to judge the cap before doing the work. */
const armorOverhead = 1.4;

interface DoneStepProps {
  result: AgedResult;
  outputName: string;
  /** The name the file is actually saved under (fallback already applied). */
  downloadName: string;
  /**
   * The chosen name is the input's, so the taught command names one file on
   * both sides of `-o`.
   */
  sameNameAsInput: boolean;
  onOutputNameChange: (name: string) => void;
  onReset: () => void;
}

export function DoneStep({
  result,
  outputName,
  downloadName,
  sameNameAsInput,
  onOutputNameChange,
  onReset,
}: DoneStepProps) {
  const generatedPassphrase = result.generatedPassphrase;
  const pending = useRef(new Map<ReturnType<typeof setTimeout>, string>());
  // Only encrypting appends a suffix of aged's own, so only encrypting has
  // one to pin. Local state rather than derived from the name, so clearing
  // the field doesn't silently drop the suffix along with it.
  const encrypting = result.mode === "encrypt";
  const { copyToClipboard, isCopied: copiedArmored } = useCopyToClipboard();
  const [suffixed, setSuffixed] = useState(encrypting);

  // Armoring is a re-encoding of a finished ciphertext, so the choice lives
  // here rather than before the ~1s of scrypt: changing it costs nothing.
  //
  // Both exits want the same armored form, so it is produced once, as the
  // string it natively is. Capped because nobody pastes a hundred megabytes
  // and it keeps a giant string from ever being built — and measured on the
  // armored length, which is what both the cap and the clipboard care about.
  const armoredText = useMemo(
    () =>
      encrypting && result.bytes.length * armorOverhead < maxPreviewBytes
        ? armorText(result.bytes)
        : null,
    [encrypting, result.bytes],
  );
  // Only decrypting has something worth reading. Ciphertext is nobody's
  // reading material, "Copy as text" is the exit that matters for it, and
  // showing the armored block is what pushes this step past its band when a
  // generated passphrase is on screen too.
  const preview = encrypting ? null : result.textPreview;

  // What Copy hands over, which is not what Download saves. A file cannot be
  // put on the clipboard by a web page at all — only text can — so copying
  // an encrypted result means armoring it, whatever the download is set to.
  const copyText = encrypting ? armoredText : result.textPreview;

  const suffix = encrypting && suffixed ? ageSuffix : "";
  const stem = suffix === "" ? outputName : stripAgeSuffix(outputName);

  // An empty stem stays empty rather than becoming a bare ".age", so the
  // caller's fallback to the suggested name still fires.
  function compose(nextStem: string, nextSuffix: string) {
    onOutputNameChange(nextStem === "" ? "" : nextStem + nextSuffix);
  }

  useEffect(() => {
    const timers = pending.current;
    // Revoking, not just cancelling: the handoff is long done by the time
    // this runs, and a cancelled timer would leave the blob — a full copy of
    // the output — pinned for the life of the document.
    return () => {
      for (const [timer, url] of timers) {
        clearTimeout(timer);
        URL.revokeObjectURL(url);
      }
      timers.clear();
    };
  }, []);

  function save(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    // Long enough for the browser to take the handoff, short enough that a
    // full-size copy is not pinned for as long as this step is on screen.
    const timer = setTimeout(() => {
      URL.revokeObjectURL(url);
      pending.current.delete(timer);
    }, 60_000);
    pending.current.set(timer, url);
  }

  function copyArmored() {
    if (copyText !== null) {
      copyToClipboard(copyText);
    }
  }

  // Armored on the click that asks for it, never before: at the size cap it
  // is close to a second of frozen tab, and nothing on screen needs the bytes.
  function downloadResult(armored: boolean) {
    const bytes = armored ? armorBytes(result.bytes) : result.bytes;
    save(new Blob([bytes as BlobPart], { type: "application/octet-stream" }), downloadName);
  }

  function downloadPassphrase(passphrase: string) {
    // Named from the suggested output, not the editable field: the file is a
    // record of this operation, not a variant of whatever the user typed.
    save(new Blob([passphrase], { type: "text/plain" }), `${result.suggestedName}.passphrase.txt`);
  }

  return (
    <div className={cell.stepBody}>
      {generatedPassphrase !== null && (
        <>
          {/* Above the artefact: the caveat should frame the passphrase, not
              trail after the part people copy and move on from. */}
          <Alert variant="warning">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertTitle>Save this passphrase now</AlertTitle>
            <AlertDescription>
              It's the only key to this file and it can't be recovered — not by you, not by anyone.
            </AlertDescription>
          </Alert>
          {/* translate="no": page translation transmits document text to the
              translation service; the passphrase must never be part of it. */}
          <InputGroup className="**:[textarea]:min-h-0 **:[textarea]:max-sm:min-h-0" translate="no">
            <InputGroupTextarea
              {...secretFieldProps}
              aria-label="Generated passphrase"
              className="font-mono leading-relaxed"
              readOnly
              rows={1}
              value={generatedPassphrase}
            />
            <InputGroupAddon align="block-end">
              <CopyButton
                className={addonButton}
                label="Copy"
                size="sm"
                subject="passphrase"
                value={generatedPassphrase}
              />
              <Button
                className={addonButton}
                aria-label="Download passphrase"
                onClick={() => downloadPassphrase(generatedPassphrase)}
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

      {preview !== null && (
        <InputGroup className="**:[textarea]:h-40 **:[textarea]:field-sizing-fixed">
          <InputGroupTextarea
            {...secretFieldProps}
            aria-label="Decrypted text"
            className="font-mono"
            readOnly
            value={preview}
          />
        </InputGroup>
      )}

      <Field className="flex w-full flex-col gap-2.5" name="filename">
        <FieldLabel className="text-base">Save as</FieldLabel>
        <InputGroup className="w-full">
            <InputGroupInput
              onChange={(event) => compose(event.target.value, suffix)}
              size="lg"
              type="text"
              value={stem}
            />
            {/* aged's own suffix, pinned beside the name instead of sitting
                inside it: it is a property of the operation, not something
                you should have to select around to rename the file. */}
            {encrypting && (
              <InputGroupAddon align="inline-end">
                <Badge
                  aria-pressed={suffixed}
                  className="font-mono"
                  onClick={() => {
                    setSuffixed(!suffixed);
                    compose(stem, suffixed ? "" : ageSuffix);
                  }}
                  render={<button type="button" />}
                  title={suffixed ? `Drop ${ageSuffix}` : `Add ${ageSuffix} back`}
                  variant={suffixed ? "secondary" : "outline"}
                >
                  {ageSuffix}
                  {suffixed ? <XIcon aria-hidden="true" /> : <PlusIcon aria-hidden="true" />}
                </Badge>
              </InputGroupAddon>
            )}
        </InputGroup>
        {/* One way out by default, and the rest behind the menu. Armoring
            used to be a checkbox here, which meant a mode that silently
            changed what Download did while Copy ignored it — a relationship
            that needed a sentence to explain. An item that names its own
            outcome needs none. */}
        <div className="flex w-full gap-2">
          <Button className="flex-1" onClick={() => downloadResult(false)} size="lg">
            <DownloadIcon aria-hidden="true" />
            Download
          </Button>
          {encrypting ? (
            <Menu>
              <MenuTrigger
                render={<Button aria-label="Other ways to take this" size="icon-lg" variant="outline" />}
              >
                <EllipsisIcon aria-hidden="true" />
              </MenuTrigger>
              <MenuPopup>
                {/* The label carries both the term and what it means, so
                    neither item has to and nothing needs hovering to read.
                    Both items are the same re-encoding, applied on the click
                    that asks for it. */}
                <MenuGroup>
                  <MenuGroupLabel>ASCII armor — printable text you can paste</MenuGroupLabel>
                  {/* There is no "copy the file": a page may put only text,
                      HTML or PNG on a clipboard, which is the whole reason
                      armoring exists. Copying an encrypted result IS this. */}
                  <MenuItem disabled={copyText === null} onClick={copyArmored}>
                    <CopyIcon aria-hidden="true" />
                    {copiedArmored ? "Copied" : "Copy as text"}
                  </MenuItem>
                  <MenuItem onClick={() => downloadResult(true)}>
                    <DownloadIcon aria-hidden="true" />
                    Download as text
                  </MenuItem>
                </MenuGroup>
              </MenuPopup>
            </Menu>
          ) : (
            copyText !== null && (
              <CopyButton label="Copy" size="lg" subject="decrypted text" value={copyText} variant="outline" />
            )
          )}
        </div>
        {/* The pinned suffix sits at the far end of the field, not against
            the text, so the two never read as one string. */}
        {encrypting && (
          <FieldDescription>
            Saves as <span className="font-mono text-foreground/80">{downloadName}</span> ·{" "}
            {formatBytes(result.bytes.length)}
            {/* Only true of a name the user actually set: an empty field
                falls back to the suggested name, which carries the suffix
                whatever the badge says. */}
            {!suffixed &&
              outputName.trim() !== "" &&
              " — nothing in the name will say it's encrypted."}
          </FieldDescription>
        )}
        {/* About the command in the footer and nothing else — but it sits
            under the name field, so it has to lead with which of the two it
            means. age rejects this on the names alone, before it opens
            anything, so there is no overwrite to warn about. */}
        {sameNameAsInput && (
          <FieldDescription>
            The command below won't run — age refuses to read and write one file at once.
            Downloading is unaffected.
          </FieldDescription>
        )}
        {result.nameFellBack && (
          <FieldDescription>
            The file name had no .age ending to strip, so it's saved as {result.suggestedName}.
          </FieldDescription>
        )}
      </Field>

      {/* Distinct from the margin's Back, which steps back to the passphrase
          with the input intact. This lets go of everything. */}
      <Button className="self-center" onClick={onReset} variant="ghost">
        {encrypting ? "Encrypt something else" : "Decrypt something else"}
      </Button>
    </div>
  );
}
