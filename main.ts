/* eslint-disable @typescript-eslint/no-explicit-any */
import { Plugin, setTooltip } from "obsidian";
import { DataSet, Timeline } from "vis-timeline/standalone";

import { ChronosMdParser } from "./lib/ChronosMdParser";
import { Marker, Group } from "./types";

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
      const { items, markers, groups } = parser.parse(source);

      if (!el.dataset.initialized) {
        this.initializeTimeline(container, items, markers, groups);
        el.dataset.initialized = "true";
      }
    } catch (error) {
      this.handleParseError(error, container);
    }
  }

  private initializeTimeline(
    container: HTMLElement,
    items: any[],
    markers: Marker[],
    groups: Group[]
  ) {
    const options = this.getTimelineOptions();
    const timeline = this.createTimeline(container, items, groups, options);

    this.addMarkers(timeline, markers);
    this.setupTooltip(timeline, items);
    this.createRefitButton(container, timeline);
    this.adjustZoomAfterRender(timeline);
    return timeline;
  }

  private getTimelineOptions() {
    return {
      zoomable: true,
      selectable: true,
      minHeight: "200px",
      start: new Date("2023-01-01"),
      end: new Date("2024-01-01"),
    };
  }

  private createTimeline(
    container: HTMLElement,
    items: any[],
    groups: Group[],
    options: any
  ) {
    let timeline: Timeline;
    if (groups.length) {
      const { updatedItems, updatedGroups } = this.assignItemsToGroups(
        items,
        groups
      );
      timeline = new Timeline(
        container,
        updatedItems,
        this.createDataGroups(updatedGroups),
        options
      );
    } else {
      timeline = new Timeline(container, items, options);
    }

    return timeline;
  }

  private addMarkers(timeline: Timeline, markers: Marker[]) {
    markers.forEach((marker, index) => {
      const id = `marker_${index}`;
      timeline.addCustomTime(new Date(marker.start), id);
      timeline.setCustomTimeMarker(marker.content, id, true);
    });
  }

  private createDataGroups(rawGroups: Group[]) {
    return new DataSet<Group>(
      rawGroups.map((g) => ({ id: g.id, content: g.content }))
    );
  }

  private setupTooltip(timeline: Timeline, items: any[]) {
    timeline.on("itemover", (event) => {
      const itemId = event.item;
      const item = new DataSet(items).get(itemId) as any;
      if (itemId) {
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

  private assignItemsToGroups(items: any[], groups: Group[]) {
    let updatedItems = items;
    let updatedGroups = groups;

    // Only add group properties if there are groups
    const DEFAULT_GROUP_ID = 0; // group ids start at 1 in parser
    if (groups.length > 0) {
      // Ensure the default group exists
      if (!groups.some((group) => group.id === DEFAULT_GROUP_ID)) {
        groups.push({ id: DEFAULT_GROUP_ID, content: " " });
      }

      // Assign ungrouped items to the default group
      updatedItems = items.map((item) => {
        if (!item.group) {
          item.group = DEFAULT_GROUP_ID; // Assign ungrouped items to the default group
        }
        return item;
      });

      updatedGroups = groups; // Update the groups if necessary
    }

    return { updatedItems, updatedGroups };
  }

  private adjustZoomAfterRender(timeline: Timeline) {
    setTimeout(() => this.zoomOutMinimally(timeline), 200);
    setTimeout(() => timeline.fit(), 300);
  }

  private zoomOutMinimally(timeline: Timeline) {
    const range = timeline.getWindow();
    const zoomFactor = 1.05;
    const newStart = new Date(
      range.start.valueOf() -
        ((range.end.valueOf() - range.start.valueOf()) * (zoomFactor - 1)) / 2
    );
    const newEnd = new Date(
      range.end.valueOf() +
        ((range.end.valueOf() - range.start.valueOf()) * (zoomFactor - 1)) / 2
    );

    timeline.setWindow(newStart, newEnd, { animation: true });
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
