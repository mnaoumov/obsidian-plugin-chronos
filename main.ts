/* eslint-disable @typescript-eslint/no-explicit-any */
import { Plugin, setTooltip } from "obsidian";
import { DataSet, Timeline } from "vis-timeline/standalone";

import { ChronosMdParser } from "./lib/ChronosMdParser";
import { Marker } from "./types";

import crosshairsSvg from "./assets/icons/crosshairs.svg";

interface ChronosPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: ChronosPluginSettings = {
  mySetting: "default",
};

export default class ChronosPlugin extends Plugin {
  settings: ChronosPluginSettings;

  async onload() {
    console.log("Loading Chronos Timeline Plugin");
    await this.loadSettings();
    this.registerMarkdownCodeBlockProcessor(
      "chronos",
      this.renderChronosBlock.bind(this)
    );
  }

  onunload() {
    // Clean up if necessary
  }

  async loadSettings() {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private renderChronosBlock(source: string, el: HTMLElement) {
    const parser = new ChronosMdParser();
    const container = el.createEl("div", { cls: "chronos-timeline-container" });

    try {
      const { items, markers } = parser.parse(source);
      this.initializeTimeline(container, items, markers);
    } catch (error) {
      this.handleParseError(error, container);
    }
  }

  private initializeTimeline(
    container: HTMLElement,
    items: any[],
    markers: Marker[]
  ) {
    const options = this.getTimelineOptions();
    const timeline = new Timeline(container, items, options);

    setTimeout(() => timeline.fit(), 0); // Ensure fit after rendering
    this.addMarkers(timeline, markers);
    this.setupTooltip(timeline, items);
    this.createRefitButton(container, timeline);

    return timeline;
  }

  private getTimelineOptions() {
    return {
      zoomable: true,
      selectable: true,
      minHeight: "150px",
      start: new Date("2023-01-01"),
      end: new Date("2024-01-01"),
    };
  }

  private addMarkers(timeline: Timeline, markers: Marker[]) {
    markers.forEach((marker, index) => {
      const id = `marker_${index}`;
      timeline.addCustomTime(new Date(marker.start), id);
      timeline.setCustomTimeMarker(marker.content, id, true);
    });
  }

  private setupTooltip(timeline: Timeline, items: any[]) {
    timeline.on("itemover", (event) => {
      const itemId = event.item;
      if (itemId) {
        const item = new DataSet(items).get(itemId) as any;
        const text = item?.cDescription ?? "";
        setTooltip(event.event.target, text);
      }
    });
  }

  private createRefitButton(container: HTMLElement, timeline: Timeline) {
    const refitButton = container.createEl("button", {
      cls: "chronos-timeline-refit-button",
    });
    refitButton.innerHTML = crosshairsSvg;
    setTooltip(refitButton, "Fit all");
    refitButton.addEventListener("click", () => timeline.fit());
  }

  private handleParseError(error: Error, container: HTMLElement) {
    const errorMsgContainer = container.createEl("div", {
      cls: "chronos-error-message-container",
    });
    errorMsgContainer.innerHTML = `<p>Error(s) parsing chronos markdown. Hover to edit:<ul> ${this.formatErrorMessages(
      error
    )}</ul></p>`;
  }

  private formatErrorMessages(error: Error): string {
    return error.message
      .split(";;")
      .map((msg) => `<li>${msg}</li>`)
      .join("");
  }
}
