import { ChronosPluginSettings } from "types";
import { moment } from "vis-timeline/standalone";

/**
 * Creates a localized moment instance without affecting the global locale settings. Moment has strange behavior of impacting global moment when settings are changed - don't want to spill outside of Chronos

 * @returns An encapsulated moment instance with the specified locale and UTC setting
 */
export function chronosMoment(date: Date, settings: ChronosPluginSettings) {
	// Capture the current default locale
	const defaultLocale = moment.locale();

	// Create moment with the requested locale
	const m = moment(date).locale(settings.selectedLocale);
	const result = settings.useUtc ? m.utc() : m;

	// Restore default locale (for global use)
	moment.locale(defaultLocale);

	return result;
}
