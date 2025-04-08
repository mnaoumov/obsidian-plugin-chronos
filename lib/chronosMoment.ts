import { ChronosPluginSettings } from "types";
import { moment } from "vis-timeline/standalone";

// Create a cloned instance to avoid pollution global moment settings
const chronosMomentInstance = (moment as any).clone?.() || moment;

/**
 * Uses a localized moment instance without affecting the global locale settings. Moment has strange behavior of impacting global moment when settings are changed - don't want to spill outside of Chronos

 * @returns An encapsulated moment instance with the specified locale and UTC setting
 */
export function chronosMoment(date: Date, settings: ChronosPluginSettings) {
	// Capture the current default locale
	const defaultLocale = moment.locale();

	// Create moment with the requested locale
	const m = chronosMomentInstance(date).locale(settings.selectedLocale);
	const result = settings.useUtc ? m.utc() : m;

	return result;
}
