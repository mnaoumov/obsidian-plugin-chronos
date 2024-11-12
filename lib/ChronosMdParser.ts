import { ParseResult, Marker, ChronosDataItem } from "../types";
import { Color, Opacity } from "../enums";

export class ChronosMdParser {
  private errors: string[] = [];
  private items: ChronosDataItem[] = [];
  private markers: Marker[] = [];

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

    return { items, markers };
  }

  private _parseEvent(line: string, lineNumber: number) {
    const eventLineRegex = new RegExp(
      /^-\s*\[(\d{4}-\d{2}-\d{2})(?:~(\d{4}-\d{2}-\d{2}))?\]\s*(#(\w+))?\s*(\{([^}]+)\})?\s*(.*?)(?:\s*\|\s*(.*))?$/
    );
    const eventMatch = line.match(eventLineRegex);
    if (eventMatch) {
      const [, start, end, , color, , group, content, description] = eventMatch;

      this.items.push({
        content: content || "",
        start,
        end: end ? end : undefined,
        group: group || undefined,
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
      /^@\s*\[(\d{4}-\d{2}-\d{2})~(\d{4}-\d{2}-\d{2})?\]\s*(#(\w+))?\s*(\{([^}]+)\})?\s*(.*?)$/
    );
    const periodMatch = line.match(periodLineRegex);
    if (periodMatch) {
      const [, start, end, , color, , group, content] = periodMatch;

      this.items.push({
        content: content || "",
        start,
        end,
        type: "background",
        group: group || undefined,
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
    const markerMatch = line.match(/^=\s*\[(\d{4}-\d{2}-\d{2})\]\s*(.*)?$/);

    if (markerMatch) {
      const [, start, content] = markerMatch;

      this.markers.push({
        start,
        content: content || "",
      });
    } else {
      this._addParserError(lineNumber, `Invalid marker format: ${line}`);
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

  private _resetVars() {
    this._clearErrors();
    this._clearItems();
    this._clearMarkers();
  }
}
