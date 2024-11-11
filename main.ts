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
    // Detach any leaves if necessary
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private renderChronosBlock(source: string, el: HTMLElement) {
    const parser = new ChronosMdParser();
    const container = el.createEl("div", { cls: "chronos-timeline-container" });

    try {
      const { items, markers } = parser.parse(source);
      const timeline = this.initializeTimeline(container, items, markers);

      timeline.fit();
    } catch (error) {
      this.handleParseError(error, container);
    }
  }

  private initializeTimeline(
    container: HTMLElement,
    items: any[],
    markers: Marker[]
  ) {
    const options = {
      zoomable: true,
      selectable: true,
      // TODO
      //   editable: true,
      minHeight: "150px",
      // make it not default to current date, which causes flicker
      // setting to 1 year range, so default viewis at month level in most widths
      start: new Date("2023-01-01"),
      end: new Date("2024-01-01"),
    };

    const timeline = new Timeline(container, items, options);

    // set default view to fit min/max range of dataset
    setTimeout(() => {
      timeline.fit();
    }, 0);

    this.addMarkers(timeline, markers);
    this.setupTooltip(timeline, items);
    this.createRefitButton(container, timeline);

    return timeline;
  }

  private addMarkers(timeline: Timeline, markers: any[]) {
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
        const text = item.content as string;
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

  private handleParseError(error: any, container: HTMLElement) {
    const errorMsgContainer = container.createEl("div", {
      cls: "chronos-error-message-container",
    });
    errorMsgContainer.innerHTML = `<p>Error(s) parsing chronos markdown. Hover to edit:<ul> ${error.message
      .split(";;")
      .map((msg: string) => `<li>${msg}</li>`)
      .join("")}</ul></p>`;
  }
}
