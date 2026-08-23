import { MotionConfig } from "motion/react";
import { useDropzone } from "react-dropzone";

import { useAged } from "@/hooks/use-aged";
import { cliCommand } from "@/lib/cli";
import { textFileName } from "@/lib/crypto/filename";
import { AnimateHeight } from "@/components/animate-height";
import { CliHint } from "@/components/cli-hint";
import { DoneStep } from "@/components/done-step";
import { ModeSwitch } from "@/components/mode-switch";
import { PassphraseStep } from "@/components/passphrase-step";
import { PickStep } from "@/components/pick-step";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";

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

  // The passphrase form stays mounted while the worker runs, so the two
  // states share one animation key.
  const stepKey = aged.step === "working" ? "passphrase" : aged.step;

  return (
    <MotionConfig reducedMotion="user">
      <div
        {...getRootProps({
          // pb-[12vh] lifts the card slightly above true center, where it
          // reads as centered.
          className:
            "relative flex min-h-dvh flex-col items-center justify-center bg-background p-4 pb-[12vh] sm:p-6 sm:pb-[12vh]",
        })}
      >
        <input {...getInputProps()} />
        <div className="absolute end-4 top-4">
          <ThemeToggle />
        </div>
        <main className="flex w-full max-w-md flex-col items-center gap-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="font-semibold tracking-tight">aged</CardTitle>
              <CardDescription>age encryption, entirely in your browser.</CardDescription>
            </CardHeader>
            <CardPanel className="flex flex-col gap-4">
              <ModeSwitch
                disabled={aged.working}
                mode={aged.mode}
                onModeChange={aged.setMode}
              />
              <AnimateHeight>
                {/* A CSS entrance instead of a JS-driven crossfade: it can't
                    stall when steps swap mid-animation. */}
                <div className="animate-step-in" key={stepKey}>
                  {stepKey === "pick" && (
                    <PickStep
                      isDragActive={isDragActive}
                      mode={aged.mode}
                      notice={aged.notice}
                      onBrowse={open}
                      onText={aged.loadText}
                    />
                  )}
                  {stepKey === "passphrase" && aged.input !== null && (
                    <PassphraseStep
                      input={aged.input}
                      mode={aged.mode}
                      onClearInput={aged.clearInput}
                      onSubmit={aged.submit}
                      submitError={aged.submitError}
                      working={aged.working}
                    />
                  )}
                  {stepKey === "done" && result !== null && (
                    <DoneStep
                      downloadName={downloadName}
                      onOutputNameChange={aged.setOutputName}
                      onReset={aged.reset}
                      outputName={outputName}
                      result={result}
                    />
                  )}
                </div>
              </AnimateHeight>
            </CardPanel>
            <CardFooter className="border-t py-3">
              <CliHint command={command} />
            </CardFooter>
          </Card>
          <p className="text-center text-muted-foreground/72 text-xs">
            Works offline · compatible with the{" "}
            <a
              className="underline underline-offset-2 hover:text-muted-foreground"
              href="https://age-encryption.org"
              rel="noreferrer"
              target="_blank"
            >
              age
            </a>{" "}
            CLI
          </p>
        </main>
      </div>
    </MotionConfig>
  );
}
