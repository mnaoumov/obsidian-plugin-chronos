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

  private _parseLineWithRegex(line: string, regex: RegExp, lineNumber: number) {
    const match = line.match(regex);
    if (!match) {
      this._addParserError(lineNumber, `Invalid format: ${line}`);
      return null;
    }
    return match;
  }

  // Helper to construct item object with common properties
  private _constructItem(
    content: string,
    start: string,
    end: string | undefined,
    groupName: string | undefined,
    color: string | undefined,
    lineNumber: number,
    type: "default" | "background" = "default"
  ) {
    this._ensureChronologicalDates(start, end, lineNumber);

    const groupId = groupName ? this._getOrCreateGroupId(groupName) : null;

    return {
      content: content || "",
      start: this._parseDate(start),
      end: end ? this._parseDate(end) : undefined,
      group: groupId,
      style: color
        ? `background-color: ${this._mapToObsidianColor(
            color as Color,
            type === "background" ? Opacity.Opaque : Opacity.Solid
          )};`
        : undefined,
      ...(type === "background" ? { type: "background" } : {}),
    };
  }

  // Refactored _parseEvent method
  private _parseEvent(line: string, lineNumber: number) {
    const eventLineRegex =
      /^-\s*\[(.*?)(?:~(.*?))?\]\s*(#(\w+))?\s*(\{([^}]+)\})?\s*(.*?)(?:\s*\|\s*(.*))?$/;
    const eventMatch = this._parseLineWithRegex(
      line,
      eventLineRegex,
      lineNumber
    );

    if (eventMatch) {
      const [, start, end, , color, , groupName, content, description] =
        eventMatch;
      this.items.push({
        ...this._constructItem(
          content,
          start,
          end,
          groupName,
          color,
          lineNumber
        ),
        cDescription: description || undefined,
      });
    }
  }

  // Refactored _parsePeriod method
  private _parsePeriod(line: string, lineNumber: number) {
    const periodLineRegex =
      /^@\s*\[(.*?)(?:~(.*?))?\]\s*(#(\w+))?\s*(\{([^}]+)\})?\s*(.*?)$/;
    const periodMatch = this._parseLineWithRegex(
      line,
      periodLineRegex,
      lineNumber
    );

    if (periodMatch) {
      const [, start, end, , color, , groupName, content] = periodMatch;
      this.items.push(
        this._constructItem(
          content,
          start,
          end,
          groupName,
          color,
          lineNumber,
          "background"
        )
      );
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
    const parts = dateString.split(/[-T: ]/);
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
    // TODO: validate other components of date time

    return `${year}-${month.padStart(2, "0")}-${day.padStart(
      2,
      "0"
    )}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:${second.padStart(
      2,
      "0"
    )}`;
  }

  private _ensureChronologicalDates(
    start: string,
    end: string | undefined,
    lineNumber: number
  ) {
    if (start && end && new Date(start) > new Date(end)) {
      this._addParserError(
        lineNumber,
        `Start date (${start}) is after end date (${end}).`
      );
    }
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
