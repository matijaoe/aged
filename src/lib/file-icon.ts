import {
  FileArchiveIcon,
  FileAudioIcon,
  FileCodeIcon,
  FileIcon,
  FileImageIcon,
  FileLockIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileVideoIcon,
} from "lucide-react";

/**
 * The extension is the only signal available without reading the bytes, so
 * the icon is a hint about the file rather than a claim about its contents.
 */
const byExtension: Record<string, typeof FileIcon> = {
  age: FileLockIcon,
  aac: FileAudioIcon,
  avi: FileVideoIcon,
  bz2: FileArchiveIcon,
  css: FileCodeIcon,
  csv: FileSpreadsheetIcon,
  doc: FileTextIcon,
  docx: FileTextIcon,
  flac: FileAudioIcon,
  gif: FileImageIcon,
  gz: FileArchiveIcon,
  heic: FileImageIcon,
  html: FileCodeIcon,
  jpeg: FileImageIcon,
  jpg: FileImageIcon,
  js: FileCodeIcon,
  json: FileCodeIcon,
  md: FileTextIcon,
  mkv: FileVideoIcon,
  mov: FileVideoIcon,
  mp3: FileAudioIcon,
  mp4: FileVideoIcon,
  pdf: FileTextIcon,
  png: FileImageIcon,
  rar: FileArchiveIcon,
  rtf: FileTextIcon,
  svg: FileImageIcon,
  tar: FileArchiveIcon,
  ts: FileCodeIcon,
  tsx: FileCodeIcon,
  txt: FileTextIcon,
  wav: FileAudioIcon,
  webm: FileVideoIcon,
  webp: FileImageIcon,
  xlsx: FileSpreadsheetIcon,
  zip: FileArchiveIcon,
};

export function fileIconFor(name: string): typeof FileIcon {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  return byExtension[extension] ?? FileIcon;
}
