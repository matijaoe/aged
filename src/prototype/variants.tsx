import {
  Card,
  CardFrame,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
  CardFrameDescription,
  CardPanel,
} from "@/components/ui/card";
import { CliLine, DropZoneLg, ModeSwitchLg, WriteInstead, Wordmark } from "./parts";
import { GridLines } from "./grid-lines";

export interface Variant {
  id: string;
  name: string;
  note: string;
  render: () => React.ReactElement;
}

/** A — the grid lines are the card. No surface, no border, just structure. */
function GridIsTheCard() {
  return (
    <div className="w-full max-w-lg">
      <GridLines className="px-8 py-9">
        <div className="flex flex-col gap-6">
          <Wordmark />
          <ModeSwitchLg />
          <DropZoneLg bare />
          <WriteInstead />
        </div>
      </GridLines>
      <CliLine className="px-8 pt-4" />
    </div>
  );
}

/** B — grid lines around a CardFrame whose extension sits above. */
function FrameHeaderAbove() {
  return (
    <div className="w-full max-w-lg">
      <GridLines className="p-8">
        <CardFrame>
          <CardFrameHeader>
            <CardFrameTitle>aged</CardFrameTitle>
            <CardFrameDescription>
              age encryption, entirely in your browser.
            </CardFrameDescription>
          </CardFrameHeader>
          <Card>
            <CardPanel className="flex flex-col gap-6 py-6">
              <ModeSwitchLg />
              <DropZoneLg />
              <WriteInstead />
            </CardPanel>
          </Card>
          <CardFrameFooter>
            <CliLine />
          </CardFrameFooter>
        </CardFrame>
      </GridLines>
    </div>
  );
}

/** C — wordmark floats on the grid; the frame's extension carries the CLI. */
function FrameFooterExtension() {
  return (
    <div className="w-full max-w-lg">
      <GridLines className="px-8 pt-8 pb-9">
        <div className="flex flex-col gap-7">
          <Wordmark centered />
          <CardFrame>
            <Card>
              <CardPanel className="flex flex-col gap-6 py-6">
                <ModeSwitchLg />
                <DropZoneLg />
                <WriteInstead />
              </CardPanel>
            </Card>
            <CardFrameFooter>
              <CliLine />
            </CardFrameFooter>
          </CardFrame>
        </div>
      </GridLines>
    </div>
  );
}

/**
 * D — the grid is page structure, not a border: lines sit out at the page
 * margins like the COSS site, with the card floating free in the middle.
 */
function PageGrid() {
  return (
    <div className="relative w-full max-w-5xl">
      <GridLines className="px-10 py-16" marks>
        <div className="mx-auto w-full max-w-md">
          <CardFrame>
            <Card>
              <CardPanel className="flex flex-col gap-6 py-6">
                <ModeSwitchLg />
                <DropZoneLg />
                <WriteInstead />
              </CardPanel>
            </Card>
            <CardFrameFooter>
              <CliLine />
            </CardFrameFooter>
          </CardFrame>
        </div>
      </GridLines>
    </div>
  );
}

/**
 * E — the grid draws the extension pattern itself: one rectangle for the
 * flow, a shorter cell beneath it for the CLI, sharing a hairline.
 */
function GridCells() {
  return (
    <div className="w-full max-w-lg">
      <GridLines className="flex flex-col">
        <div className="flex flex-col gap-6 px-8 py-9">
          <Wordmark />
          <ModeSwitchLg />
          <DropZoneLg bare />
          <WriteInstead />
        </div>
        <div className="border-t px-8 py-4">
          <CliLine />
        </div>
      </GridLines>
    </div>
  );
}

export const variants: Variant[] = [
  {
    id: "grid",
    name: "A · Grid is the card",
    note: "Four hairlines form the rectangle. No surface at all — the structure is drawn, not boxed.",
    render: GridIsTheCard,
  },
  {
    id: "frame-header",
    name: "B · Frame, extension above",
    note: "Grid frames a CardFrame: title on the muted surface, flow in the inner card, CLI below.",
    render: FrameHeaderAbove,
  },
  {
    id: "frame-footer",
    name: "C · Frame, extension below",
    note: "Wordmark floats on the grid; the frame's only extension is the CLI hint under the card.",
    render: FrameFooterExtension,
  },
  {
    id: "page-grid",
    name: "D · Page grid + card",
    note: "Grid lines sit out at the page margins as structure — like coss.com — with the card floating free inside.",
    render: PageGrid,
  },
  {
    id: "grid-cells",
    name: "E · Grid cells",
    note: "The grid draws the extension pattern itself: a flow cell and a CLI cell sharing one hairline. No card surface.",
    render: GridCells,
  },
];
