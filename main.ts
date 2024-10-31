import { WorkspaceLeaf, Plugin } from "obsidian";
import { DataItem, DataSet } from "vis-timeline/standalone";
import {
  ChronosTimelineView,
  VIEW_TYPE_CHRONOS_TIMELINE,
} from "./views/ChronosTimelineView";

interface ChronosPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: ChronosPluginSettings = {
  mySetting: "default",
};

// TODO: MAKE SURE TO DETACH LEAVES ON PLUGIN REMOVAL
// Unless explicitly removed, any leaves that a plugin add to the workspace remain even after the plugin is disabled. Plugins are responsible for removing any leaves they add to the workspace.

// To remove a leaf from the workspace, call detach() on the leaf you want to remove. You can also remove all leaves of a certain type, by using detachLeavesOfType().

export default class ChronosPlugin extends Plugin {
  settings: ChronosPluginSettings;

  onload = async () => {
    // await this.loadSettings();

    console.log("Loading Chronos Timeline Plugin");
    // custom css

    this.registerView(
      VIEW_TYPE_CHRONOS_TIMELINE,
      (leaf) => new ChronosTimelineView(leaf)
    );

    this.addCommand({
      id: "timeline",
      name: "Render timeline",
      callback: () => {
        const items = new DataSet([
          {
            id: 1,
            start: new Date(700, 7, 15),
            end: new Date(700, 8, 2), // end is optional
            content: "Trajectory A",
          },
          {
            id: 2,
            start: new Date(700, 8, 1),
            // end: new Date(700, 8, 15), // end is optional
            content: "Trajectory B",
          },
          {
            id: 3,
            start: new Date(700, 9, 1),
            // end: new Date(700, 8, 15), // end is optional
            content: "Trajectory C",
          },
          {
            id: "A",
            start: new Date(700, 8, 1),
            end: new Date(700, 9, 15),
            content: "Period A",
            type: "background",
          },
        ]);

        this.activateView(items);
      },
    });
  };

  async activateView(timelineData?: DataSet<DataItem>) {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_CHRONOS_TIMELINE);

    if (leaves.length > 0) {
      // A leaf with our view already exists, use that
      leaf = leaves[0];

      if (timelineData) {
        (leaf.view as ChronosTimelineView).updateTimeline(timelineData);
      }
    } else {
      // Our view could not be found in the workspace, create a new leaf
      // in the right sidebar for it
      leaf = workspace.getRightLeaf(false) as WorkspaceLeaf;
      await leaf.setViewState({
        type: VIEW_TYPE_CHRONOS_TIMELINE,
        active: true,
      });
    }

    // "Reveal" the leaf in case it is in a collapsed sidebar
    workspace.revealLeaf(leaf);
  }

  onunload = () => {};

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
