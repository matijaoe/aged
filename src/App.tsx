import { MotionConfig } from "motion/react";
import { useDropzone } from "react-dropzone";

import { useAged } from "@/hooks/use-aged";
import { cliCommand } from "@/lib/cli";
import { textFileName } from "@/lib/crypto/filename";
import { CliHint } from "@/components/cli-hint";
import { DoneStep } from "@/components/done-step";
import { cell, Lattice, LatticeRow } from "@/components/lattice";
import { ModeStatement } from "@/components/mode-statement";
import { PassphraseStep } from "@/components/passphrase-step";
import { PickStep } from "@/components/pick-step";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";

/**
 * The outer bands are fixed; the body takes what is left, capped so the
 * composition stays centred with slack outside the rules on a tall screen
 * and shrinks rather than overflowing on a short one.
 */
const bands = {
  top: "h-24 shrink-0",
  body: "min-h-0 max-h-[30rem] flex-1",
  bottom: "h-24 shrink-0",
} as const;

export function App() {
  const aged = useAged();
  const { result } = aged;

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: aged.loadFiles,
    noClick: true,
    noKeyboard: true,
    disabled: aged.working,
  });

  const inputName =
    aged.input === null
      ? null
      : aged.input.kind === "file"
        ? aged.input.name
        : aged.mode === "encrypt"
          ? textFileName
          : null;

  const outputName = aged.outputNameOverride ?? result?.suggestedName ?? "";
  const downloadName =
    outputName.trim() === "" ? (result?.suggestedName ?? "") : outputName;

  const done = aged.step === "done" && result !== null;
  const command = cliCommand(
    done ? result.mode : aged.mode,
    inputName,
    done ? downloadName : null,
  );

  return (
    <MotionConfig reducedMotion="user">
      <div {...getRootProps({ className: "isolate" })}>
        <input {...getInputProps()} />
        <Lattice active={isDragActive}>
          <LatticeRow
            center={
              <div className="flex w-full flex-col justify-end gap-4 px-4 pb-4 md:contents">
                {/* Below md the margins are too narrow to hold the wordmark,
                    so identity joins the mode in the centre cell. */}
                <div className="pt-6 md:hidden">
                  <Wordmark />
                </div>
                <ModeStatement
                  disabled={aged.working}
                  mode={aged.mode}
                  onModeChange={aged.setMode}
                />
              </div>
            }
            left={
              <div
                className={`hidden w-full justify-end md:flex ${cell.gutter} ${cell.sitsOnRule}`}
              >
                <Wordmark align="end" />
              </div>
            }
            className={bands.top}
            right={
              <div className={`hidden w-full md:flex ${cell.gutter} ${cell.sitsOnRule}`}>
                <ThemeToggle />
              </div>
            }
          />
          <LatticeRow
            active={isDragActive}
            center={
              <div
                className={`flex min-h-0 w-full flex-col pb-6 ${cell.gutter} ${cell.hangsFromRule}`}
              >
                {aged.step === "pick" && (
                  <PickStep
                    isDragActive={isDragActive}
                    mode={aged.mode}
                    notice={aged.notice}
                    onBrowse={open}
                    onText={aged.loadText}
                  />
                )}
                {(aged.step === "passphrase" || aged.step === "working") &&
                  aged.input !== null && (
                    <PassphraseStep
                      input={aged.input}
                      mode={aged.mode}
                      onClearInput={aged.clearInput}
                      onSubmit={aged.submit}
                      submitError={aged.submitError}
                      working={aged.working}
                    />
                  )}
                {done && (
                  <DoneStep
                    downloadName={downloadName}
                    onOutputNameChange={aged.setOutputName}
                    onReset={aged.reset}
                    outputName={outputName}
                    result={result}
                  />
                )}
              </div>
            }
            className={bands.body}
            rule
          />
          <LatticeRow
            active={isDragActive}
            center={
              <div className={`flex w-full pb-4 ${cell.gutter} ${cell.hangsFromRule}`}>
                <CliHint command={command} />
              </div>
            }
            className={bands.bottom}
            rule
          />
        </Lattice>
        {/* The margins disappear below md, so the toggle needs a home there. */}
        <div className="fixed top-3 right-3 z-30 md:hidden">
          <ThemeToggle />
        </div>
      </div>
    </MotionConfig>
  );
}
