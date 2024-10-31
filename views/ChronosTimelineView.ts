import { ItemView, WorkspaceLeaf } from "obsidian";
import { DataItem, Timeline, DataSet } from "vis-timeline/standalone";
import { exportHtmlToImage } from "../util/exportHtmlToImage";

export const VIEW_TYPE_CHRONOS_TIMELINE = `chronos-timeline`;

export class ChronosTimelineView extends ItemView {
  timelineData: DataSet<DataItem>;
  timelineContainer: HTMLDivElement;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.timelineData = new DataSet([]);
  }

  getViewType() {
    return VIEW_TYPE_CHRONOS_TIMELINE;
  }

  getDisplayText() {
    return "Chronos Timeline";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h4", { text: "Timeline" });
    this.timelineContainer = container.createEl("div", {
      cls: "chronos-timeline-container",
    });
    const exportBtn = container.createEl("button", {
      text: "Export",
    });
    exportBtn.onclick = () => exportHtmlToImage(this.timelineContainer);
  }

  updateTimeline(data: DataSet<DataItem>) {
    this.setTimelineData(data);
  }

  setTimelineData(data: DataSet<DataItem>) {
    this.timelineData = data;
    this.renderTimeline();
  }

  renderTimeline() {
    const container = this.timelineContainer;
    this.clearContainer(container);

    const options = {
      zoomable: true,
      selectable: true,
      //   stack: false,
      //   orientation: "top",
      minHeight: "150px",
      //   start: new Date(2010, 0, 1), // Start date
      //   end: new Date(2010, 11, 31), // End date
      // Add more options as needed
    };

    new Timeline(container, this.timelineData, options);
  }

  clearContainer(container: HTMLElement) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }

  async onClose() {
    // Nothing to clean up.
  }
}
