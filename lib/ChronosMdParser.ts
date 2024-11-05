import { DataItem } from "vis-timeline/standalone";
import { ParseResult, Marker } from "../types";

export class ChronosMdParser {
  private errors: string[] = [];
  private items: DataItem[] = [];
  private markers: Marker[] = [];

  parse(data: string): ParseResult {
    const lines = data.split("\n");
    this._resetVars();

    lines.forEach((line, i) => {
      line = line.trim();
      const lineNumber = i + 1;

      if (line.startsWith("-")) {
        this.parseEvent(line, lineNumber);
      } else if (line.startsWith("@")) {
        this.parsePeriod(line, lineNumber);
      } else if (line.startsWith("=")) {
        this.parseMarker(line, lineNumber);
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

  private parseEvent(line: string, lineNumber: number) {
    const eventLineRegex = new RegExp(
      /^-\s*\[(\d{4}-\d{2}-\d{2})(?:~(\d{4}-\d{2}-\d{2}))?\]\s*(.*)?$/
    );
    const eventMatch = line.match(eventLineRegex);
    if (eventMatch) {
      const [, start, end, content] = eventMatch;
      this.items.push({
        content: content || "",
        start,
        end: end ? end : undefined,
      });
    } else {
      this._addParserError(lineNumber, `Invalid event format: ${line}`);
    }
  }

  private parsePeriod(line: string, lineNumber: number) {
    const periodMatch = line.match(
      /^@\s*\[(\d{4}-\d{2}-\d{2})~(\d{4}-\d{2}-\d{2})?\]\s*(.*)?$/
    );
    if (periodMatch) {
      const [, start, end, content] = periodMatch;
      this.items.push({
        content: content || "",
        start,
        end,
        type: "background",
      });
    } else {
      this._addParserError(lineNumber, `Invalid period format: ${line}`);
    }
  }

  private parseMarker(line: string, lineNumber: number) {
    const markerMatch = line.match(/^=\s*\[(\d{4}-\d{2}-\d{2})]\s*(.*)?$/);
    if (markerMatch) {
      const [, start, content] = markerMatch;
      this.markers.push({
        content: content || "",
        start,
      });
    } else {
      this._addParserError(lineNumber, `Invalid marker format: ${line}`);
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
  private _resetVars() {
    this._clearErrors();
    this._clearItems();
    this._clearMarkers();
  }
}
