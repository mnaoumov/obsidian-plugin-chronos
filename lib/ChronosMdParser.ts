import { ParseResult, Marker, ChronosDataItem, Group } from "../types";
import { Color, Opacity } from "../enums";

export class ChronosMdParser {
  private errors: string[] = [];
  private items: ChronosDataItem[] = [];
  private markers: Marker[] = [];
  private groups: Group[] = [];
  private groupMap: { [key: string]: number } = {};

  parse(data: string): ParseResult {
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
      } else if (line.startsWith("=")) {
        // Marker
        this._parseMarker(line, lineNumber);
      } else if (line) {
        this._addParserError(lineNumber, `Unrecognized format: ${line}`);
      }
    });

    if (this.errors.length > 0) {
      throw new Error(this.errors.join(";;"));
    }

    const items = this.items;
    const markers = this.markers;
    const groups = this.groups;

    return { items, markers, groups };
  }

  private _parseEvent(line: string, lineNumber: number) {
    const eventLineRegex = new RegExp(
      /^-\s*\[(.*?)(?:~(.*?))?\]\s*(#(\w+))?\s*(\{([^}]+)\})?\s*(.*?)(?:\s*\|\s*(.*))?$/
    );
    const eventMatch = line.match(eventLineRegex);

    if (eventMatch) {
      const [, start, end, , color, , groupName, content, description] =
        eventMatch;

      const groupId = groupName ? this._getOrCreateGroupId(groupName) : null;

      this.items.push({
        content: content || "",
        start: this._parseDate(start),
        end: end ? this._parseDate(end) : undefined,
        group: groupId,
        style: color
          ? `background-color: ${this._mapToObsidianColor(
              color as Color,
              Opacity.Solid
            )};`
          : undefined,
        cDescription: description || undefined,
      });
    } else {
      this._addParserError(lineNumber, `Invalid event format: ${line}`);
    }
  }

  private _parsePeriod(line: string, lineNumber: number) {
    const periodLineRegex = new RegExp(
      /^@\s*\[(.*?)(?:~(.*?))?\]\s*(#(\w+))?\s*(\{([^}]+)\})?\s*(.*?)$/
    );
    const periodMatch = line.match(periodLineRegex);

    if (periodMatch) {
      const [, start, end, , color, , groupName, content] = periodMatch;

      const groupId = groupName ? this._getOrCreateGroupId(groupName) : null;

      this.items.push({
        content: content || "",
        start: this._parseDate(start),
        end: end ? this._parseDate(end) : undefined,
        type: "background",
        group: groupId,
        style: color
          ? `background-color: ${this._mapToObsidianColor(
              color as Color,
              Opacity.Opaque
            )};`
          : undefined,
      });
    } else {
      this._addParserError(lineNumber, `Invalid period format: ${line}`);
    }
  }

  private _parseMarker(line: string, lineNumber: number) {
    const markerMatch = line.match(/^=\s*\[(.*?)]\s*(.*)?$/);

    if (markerMatch) {
      const [, start, content] = markerMatch;

      this.markers.push({
        start: this._parseDate(start),
        content: content || "",
      });
    } else {
      this._addParserError(lineNumber, `Invalid marker format: ${line}`);
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

  private _parseDate(dateString: string): string {
    // Handle "lazy dates"
    const parts = dateString.split(/[-T: ]/); // Split date components
    const [
      year,
      month = "01",
      day = "01",
      hour = "00",
      minute = "00",
      second = "00",
    ] = parts;

    // Check if a valid year was provided
    if (!year || year.length !== 4) {
      throw new Error(`Invalid date format: ${dateString}`);
    }

    // Construct the datetime string
    return `${year}-${month.padStart(2, "0")}-${day.padStart(
      2,
      "0"
    )}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:${second.padStart(
      2,
      "0"
    )}`;
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

  private _resetVars() {
    this._clearErrors();
    this._clearItems();
    this._clearMarkers();
    this._clearGroups();
  }
}
