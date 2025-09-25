import {
	ParseResult,
	Marker,
	ChronosDataItem,
	Group,
	ConstructItemParams,
	Flags,
	ChronosPluginSettings,
	ArrowData,
	ArrowType,
} from "../types";
import { Color, Opacity } from "../enums";
import { DEFAULT_LOCALE } from "../constants";
import { toPaddedISOZ, toUTCDate, validateUTCDate } from "../util/utcUtil";
import { FLAGS_PREFIX } from "./flags";
import JSON5 from "json5";

export class ChronosMdParser {
	private errors: string[] = [];
	private items: ChronosDataItem[] = [];
	private markers: Marker[] = [];
	private groups: Group[] = [];
	private groupMap: { [key: string]: number } = {};
	private locale: string;
	private flags: Flags = {};
	private settings: ChronosPluginSettings;

	constructor(locale = DEFAULT_LOCALE) {
		this.locale = locale;
	}

	parse(data: string, settings: ChronosPluginSettings): ParseResult {
		this.settings = settings;
		const lines = data.split("\n");
		this._resetVars();

		lines.forEach((line, i) => {
			line = line.trim();
			const lineNumber = i + 1;

			if (line.startsWith("#")) {
				// Comment (skip)
				return;
			} else if (line.startsWith("-")) {
				// Event
				this._parseEvent(line, lineNumber);
			} else if (line.startsWith("@")) {
				// Period
				this._parsePeriod(line, lineNumber);
			} else if (line.startsWith("*")) {
				// Period
				this._parsePoint(line, lineNumber);
			} else if (line.startsWith("=")) {
				// Marker
				this._parseMarker(line, lineNumber);
			} else if (line.startsWith(FLAGS_PREFIX)) {
				// Flag
				this._parseFlag(line, lineNumber);
			} else if (line.startsWith("~")) {
				this._parseArrow(line, lineNumber);
			} else if (line) {
				this._addParserError(
					lineNumber,
					`Unrecognized format: ${line}`,
				);
			}
		});

		if (this.errors.length > 0) {
			throw new Error(this.errors.join(";;"));
		}

		const flags = this.flags;
		const items = this.items;
		const markers = this.markers;
		const groups = this.groups;

		return { items, markers, groups, flags };
	}

	private _parseTimeItem(line: string, lineNumber: number) {
		const itemTypeP = `[-@=\\*]`;
		const dateP = `(-?\\d{1,}(-?(\\d{2})?-?(\\d{2})?T?(\\d{2})?:?(\\d{2})?:?(\\d{2})?)?)`;
		const optSp = `\\s*`;

		const separatorP = `([^-\\d\\s]*?)?`;
		const colorP = `(#(\\w+))?`;
		const groupP = `(\\{([^}]+)\\})?`;

		const contentP = `(.+?)`;
		const descriptionP = `(\\|\\s*(?<!\\[\\[[^\\]]*)\\s*(.*))?`;

		const re = new RegExp(
			`${itemTypeP}${optSp}\\[${optSp}${dateP}?${optSp}${separatorP}${optSp}${dateP}?${optSp}\\]${optSp}${colorP}${optSp}${groupP}${optSp}${contentP}${optSp}${descriptionP}$`,
		);

		const match = line.match(re);
		if (!match) {
			this._addParserError(lineNumber, `Invalid format: ${line}`);
			return null;
		} else {
			const [
				,
				start,
				,
				,
				,
				,
				,
				,
				separator,
				end,
				,
				,
				,
				,
				,
				,
				,
				color,
				,
				groupName,
				content,
				,
				description,
			] = match;

			// get current date for default start/end date
			const now = new Date().toISOString().split("T")[0];

			// Check for links in content and description - extract the first one
			const contentLink = content ? this._extractWikiLink(content) : null;
			const descriptionLink = description
				? this._extractWikiLink(description)
				: undefined;
			const link = contentLink || descriptionLink;

			return {
				start: start ? toPaddedISOZ(start) : toPaddedISOZ(now),
				separator,
				end: separator
					? end
						? toPaddedISOZ(end)
						: toPaddedISOZ(now)
					: undefined,
				color,
				groupName,
				content,
				description,
				cLink: link,
			};
		}
	}

	// Helper to construct item object with common properties
	private _constructItem({
		content,
		start,
		separator,
		end,
		groupName,
		color,
		lineNumber,
		type = "default",
		cLink,
	}: ConstructItemParams) {
		this._validateDates(start, end, separator, lineNumber);

		const groupId = groupName ? this._getOrCreateGroupId(groupName) : null;

		let style = "";
		if (color) {
			style += `background-color: ${this._mapToObsidianColor(
				color as Color,
				type === "background" ? Opacity.Opaque : Opacity.Solid,
			)};`;
		}

		if (type === "point") {
			// make text readable on bg and colored items
			style += color
				? "color: black !important;"
				: "color: var(--text-normal) !important;";
		}

		// add link style for points and events with link
		const isLink = (type === "point" || type === "default") && cLink;

		let classes = "";
		classes += isLink ? "is-link" : "";
		if (start && end && this.settings.roundRanges) {
			classes += " with-caps";
		}
		return {
			content: content || "",
			start: toUTCDate(start),
			end:
				end && toUTCDate(start) !== toUTCDate(end)
					? toUTCDate(end)
					: undefined,
			group: groupId,
			style: style.length ? style : undefined,
			className: classes,
			cLink,
			...(type === "default" ? {} : { type }),
			id: lineNumber,
		};
	}

	// Refactored _parseEvent method
	private _parseEvent(line: string, lineNumber: number) {
		const components = this._parseTimeItem(line, lineNumber);

		if (components) {
			const {
				start,
				separator,
				end,
				color,
				groupName,
				content,
				description,
				cLink,
			} = components;

			this.items.push({
				...this._constructItem({
					content: content ? content : "\u00A0", // non-breaking space hack to keep blank items same height as items with title
					start,
					separator,
					end,
					groupName,
					color,
					lineNumber,
					type: "default",
					cLink,
				}),
				cDescription: description || undefined,
				cLink,
			});
		}
	}

	private _parseArrow(line: string, lineNumber: number) {
		let arrowData: ArrowData;
		try {
			arrowData = JSON5.parse(line.slice(1)) as ArrowData;
		} catch {
			this._addParserError(lineNumber, `Invalid arrow format: ${line}`);
			return;
		}
		const block1 = this.items.find((item) => item.content === arrowData.block1);
		if (!block1) {
			this._addParserError(lineNumber, `Block 1 not found: ${arrowData.block1}`);
			return;
		}
		const block2 = this.items.find((item) => item.content === arrowData.block2);
		if (!block2) {
			this._addParserError(lineNumber, `Block 2 not found: ${arrowData.block2}`);
			return;
		}
		this.items.push({
			id: lineNumber,
			type: "arrow",
			content: "",
			start: "",
			arrowSpec: {
				...arrowData,
				id: lineNumber,
				id_item_1: block1.id!,
				id_item_2: block2.id!,
				direction: getArrowDirection(arrowData.arrowType)
			}
		});
	}

	private _parsePeriod(line: string, lineNumber: number) {
		const components = this._parseTimeItem(line, lineNumber);

		if (components) {
			const {
				start,
				separator,
				end,
				color,
				groupName,
				content,
				description,
			} = components;
			this.items.push(
				this._constructItem({
					content: description
						? content + " | " + description
						: content,
					start,
					separator,
					end,
					groupName,
					color,
					lineNumber,
					type: "background",
				}),
			);
		}
	}

	private _parsePoint(line: string, lineNumber: number) {
		const components = this._parseTimeItem(line, lineNumber);

		if (components) {
			const {
				start,
				separator,
				color,
				groupName,
				content,
				description,
				cLink,
			} = components;
			this.items.push({
				...this._constructItem({
					content: content ? content : "\u00A0", // non-breaking space hack to keep blank items same height as items with title
					start,
					separator,
					end: undefined,
					groupName,
					color,
					lineNumber,
					type: "point",
					cLink,
				}),
				cDescription: description || undefined,
				cLink,
			});
		}
	}

	private _parseMarker(line: string, lineNumber: number) {
		const markerMatch = line.match(/^=\s*\[(.*?)]\s*(.*)?$/);

		if (markerMatch) {
			const [, start, content] = markerMatch;

			this.markers.push({
				start: toUTCDate(start).toISOString(),
				content: content || "",
			});
		} else {
			this._addParserError(lineNumber, `Invalid marker format: ${line}`);
		}
	}

	private _parseFlag(line: string, lineNumber: number) {
		const flagPattern = `(\\w+)(?:\\s+(.+))?$`;
		const re = new RegExp(`${FLAGS_PREFIX}\\s*${flagPattern}`, "i");
		const match = line.match(re);

		if (!match) return;

		const flagName = match[1]?.toLocaleLowerCase();
		const flagContent = match[2]?.split("|") || [];

		switch (flagName) {
			case "orderby":
				this.flags.orderBy = flagContent;
				break;

			case "defaultview":
				if (!flagContent.length) {
					this._addParserError(
						lineNumber,
						`Missing dates in DEFAULTVIEW flag: ${line}`,
					);
					return;
				}
				if (flagContent.length < 2) {
					this._addParserError(
						lineNumber,
						`Must provide a start and end date for DEFAULTVIEW flag in format start|end: ${line}`,
					);
					return;
				}

				try {
					this._validateDates(
						toUTCDate(flagContent[0]).toISOString().split("T")[0],
						toUTCDate(flagContent[1]).toISOString().split("T")[0],
						"~", // Hijacking _validateDates function for validation
						lineNumber,
					);

					this.flags.defaultView = {
						start: toUTCDate(flagContent[0]).toISOString(),
						end: toUTCDate(flagContent[1]).toISOString(),
					};
				} catch (e) {
					this._addParserError(lineNumber, `${e.message}: ${line}`);
				}
				break;
			case "notoday":
				console.log("no today flag detected");
				this.flags.noToday = true;
				break;

			case "height":
				if (!flagContent.length) {
					this._addParserError(
						lineNumber,
						`Must provide number of pixels for HEIGHT flag (ex: 500): ${line}`,
					);
					return;
				}
				const arg = flagContent[0].trim();
				if (arg.match(/\s/)) {
					this._addParserError(
						lineNumber,
						`Must provide a single number (of pixels) for HEIGHT flag (ex: 500): ${line}`,
					);
					return;
				}
				if (isNaN(Number(arg))) {
					this._addParserError(
						lineNumber,
						`Must provide a number (of pixels) for HEIGHT flag (ex: 500): ${line}`,
					);
					return;
				}

				this.flags.height = Number(arg);
				break;
			default:
				this._addParserError(lineNumber, `Unrecognized flag: ${line}`);
				break;
		}
	}

	private _getOrCreateGroupId(groupName: string): number {
		if (this.groupMap[groupName] !== undefined) {
			return this.groupMap[groupName];
		} else {
			const groupId = this.groups.length + 1;
			this.groups.push({ id: groupId, content: groupName });
			this.groupMap[groupName] = groupId;
			return groupId;
		}
	}

	private _extractWikiLink(text: string): string | undefined {
		const wikiLinkRegex = /\[\[([^\]]+)(\|([^\]]+))?\]\]/;
		const match = text.match(wikiLinkRegex);
		return match ? match[1] : undefined;
	}

	private _mapToObsidianColor(color: Color, opacity: Opacity) {
		const colorMap = {
			red: "red",
			green: "green",
			blue: "blue",
			yellow: "yellow",
			orange: "orange",
			purple: "purple",
			pink: "pink",
			cyan: "cyan",
		};

		if (!colorMap[color]) {
			console.warn(`Color "${color}" not recognized.`);
			return undefined;
		}

		return opacity === "solid"
			? `var(--color-${colorMap[color]})`
			: `rgba(var(--color-${colorMap[color]}-rgb), var(--chronos-opacity))`;
	}

	private _ensureChronologicalDates(
		start: string,
		end: string | undefined,
		lineNumber: number,
	) {
		if (start && end) {
			const startDate = toUTCDate(start);
			const endDate = toUTCDate(end);
			if (startDate > endDate) {
				this._addParserError(
					lineNumber,
					`Start date (${start}) is after end date (${end}).`,
				);
			}
		}
	}

	private _ensureCorrectDateSeparator(
		separator: string,
		lineNumber: number,
	): void {
		if (separator !== "~") {
			const msg = `Invalid date separator "${separator}". Dates in a range must be separated by a tilde (~).`;
			this._addParserError(lineNumber, msg);
		}
	}

	private _validateDate(dateString: string, lineNumber: number): void {
		try {
			validateUTCDate(dateString);
		} catch (e) {
			this._addParserError(lineNumber, e.message);
		}
	}

	private _validateDates(
		start: string,
		end: string | undefined,
		separator: string | undefined,
		lineNumber: number,
	) {
		this._validateDate(start, lineNumber);
		end && this._validateDate(end, lineNumber);
		separator && this._ensureCorrectDateSeparator(separator, lineNumber);
		this._ensureChronologicalDates(start, end, lineNumber);
	}

	private _addParserError(lineNumber: number, message: string) {
		this.errors.push(`Line ${lineNumber + 1}: ${message}`);
	}

	private _clearErrors() {
		this.errors = [];
	}

	private _clearItems() {
		this.items = [];
	}

	private _clearMarkers() {
		this.markers = [];
	}

	private _clearGroups() {
		this.groups = [];
	}

	private _clearFlags() {
		this.flags = {};
	}

	private _resetVars() {
		this._clearErrors();
		this._clearItems();
		this._clearMarkers();
		this._clearGroups();
		this._clearFlags();
	}
}
function getArrowDirection(arrowType: ArrowType): number {
	switch (arrowType) {
		case "--":
			return 0;
		case "->":
			return 1;
		case "<-":
			return 2;
		case "<>":
			return 3;
		default:
			throw new Error(`Invalid arrow type: ${arrowType}`);
	}
}

