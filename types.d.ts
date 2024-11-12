// shim
import "vis-timeline";
import { DataItem } from "vis-timeline";

export interface Marker {
  start: string;
  content: string;
}

interface ChronosDataItem extends DataItem {
  cDescription?: string; // for event tooltips
}

export interface ParseResult {
  items: ChronosDataItem[];
  markers: Marker[];
}
declare module "vis-timeline" {
  /** Add method override bc this method exists and is documented, but not registered in type definitions from library */
  interface Timeline {
    setCustomTimeMarker(content: string, id: string, show: boolean): void;
  }
}
