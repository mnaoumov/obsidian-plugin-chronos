// shim
import { ArrowSpec } from "timeline-arrows";
import { DataItem, IdType } from "vis-timeline";

export interface Marker {
	start: string;
	content: string;
}

type ArrowType = "--" | "->" | "<-" | "<>";

interface ArrowData extends Partial<ArrowSpec> {
	arrowType: ArrowType;
	block1: string;
	block2: string;
}

interface ChronosDataItem extends DataItem {
	arrowSpec?: ArrowSpec;
	cDescription?: string; // prefixed c for chronos - special prop for event tooltips
	cLink?: string; // optional link
	align?: "left" | "center" | "right";
}

export interface ChronosDataSetDataItem {
	content: string;
	start: Date;
	end: Date;
	cDescription?: string; // prefixed c for chronos - special prop for event tooltips
}

export interface ChronosPluginSettings {
	selectedLocale: string;
	key?: string;
	align: "left" | "center" | "right";
	clickToUse: boolean;
	roundRanges: boolean;
	useUtc: boolean;
	useAI: boolean;
}

export type Group = { id: IdType; content: string };

export type Flags = {
	orderBy?: string[];
	defaultView?: {
		start?: string;
		end?: string;
	};
	noToday?: boolean;
	height?: number;
};

export interface ParseResult {
	items: ChronosDataItem[];
	markers: Marker[];
	groups: Group[];
	flags: Flags;
}

interface ConstructItemParams {
	content: string;
	start: string;
	separator: string | undefined;
	end: string | undefined;
	groupName: string | undefined;
	color: string | undefined;
	lineNumber: number;
	type: "default" | "background" | "point";
	cLink?: string;
}

interface ChronosTimelineConstructor {
	container: HTMLElement;
	settings: ChronosPluginSettings;
}

declare module "vis-timeline" {
	/** Add method override bc this method exists and is documented, but not registered in type definitions from library */
	interface Timeline {
		setCustomTimeMarker(content: string, id: string, show: boolean): void;
	}
}
