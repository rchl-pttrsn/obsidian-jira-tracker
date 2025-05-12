import { App, Setting } from 'obsidian'
import {
	ESearchColumnsTypes,
	SEARCH_COLUMNS_DESCRIPTION,
} from 'src/interfaces/settingsInterfaces'
import { DEFAULT_SETTINGS, SettingsData } from 'src/settings'
import { ColumnSuggest } from 'src/suggestions/contentSuggest'

export class ColumnSettings {
	containerEl: HTMLElement
	saveCb: () => Promise<void>
	displayCb: () => Promise<void>
	app: App
	constructor(
		containerEl: HTMLElement,
		saveCb: () => Promise<void>,
		displayCb: () => Promise<void>,
		app: App
	) {
		this.containerEl = containerEl
		this.saveCb = saveCb
		this.displayCb = displayCb
		this.app = app
	}

	public render() {
		const { containerEl } = this
		new Setting(containerEl)
			.setName('Search constraints')
			.setHeading()
			.setDesc('Query constraints for `jira-search`')

		new Setting(containerEl)
			.setName('Limit')
			.setDesc(
				'Default number of results to be returned when a limit is not specified.'
			)
			.addText((text) =>
				text
					.setValue(SettingsData.searchResultsLimit.toString())
					.onChange(async (value) => {
						SettingsData.searchResultsLimit =
							parseInt(value) || DEFAULT_SETTINGS.searchResultsLimit
						await this.saveCb()
					})
			)

		new Setting(containerEl)
			.setName('Default fields')
			.setDesc('Default fields when fields are not specified in the query.')

		SettingsData.searchColumns.forEach((column, index) => {
			const setting = new Setting(containerEl).addDropdown((dropdown) =>
				dropdown
					.addOptions(SEARCH_COLUMNS_DESCRIPTION)
					.setValue(column.type)
					.onChange(async (value) => {
						SettingsData.searchColumns[index].type =
							value as ESearchColumnsTypes
						await this.saveCb()
						// Force refresh
						this.displayCb()
					})
					.selectEl.addClass('flex-grow-1')
			)

			setting.addExtraButton((button) =>
				button
					.setIcon(
						SettingsData.searchColumns[index].compact
							? 'compress-glyph'
							: 'enlarge-glyph'
					)
					.setTooltip(
						SettingsData.searchColumns[index].compact ? 'Compact' : 'Full width'
					)
					.onClick(async () => {
						SettingsData.searchColumns[index].compact =
							!SettingsData.searchColumns[index].compact
						await this.saveCb()
						// Force refresh
						this.displayCb()
					})
			)
			setting.addExtraButton((button) =>
				button
					.setIcon('up-chevron-glyph')
					.setTooltip('Move up')
					.setDisabled(index === 0)
					.onClick(async () => {
						const tmp = SettingsData.searchColumns[index]
						SettingsData.searchColumns[index] =
							SettingsData.searchColumns[index - 1]
						SettingsData.searchColumns[index - 1] = tmp
						await this.saveCb()
						// Force refresh
						this.displayCb()
					})
			)
			setting.addExtraButton((button) =>
				button
					.setIcon('down-chevron-glyph')
					.setTooltip('Move down')
					.setDisabled(index === SettingsData.searchColumns.length - 1)
					.onClick(async () => {
						const tmp = SettingsData.searchColumns[index]
						SettingsData.searchColumns[index] =
							SettingsData.searchColumns[index + 1]
						SettingsData.searchColumns[index + 1] = tmp
						await this.saveCb()
						// Force refresh
						this.displayCb()
					})
			)
			setting.addExtraButton((button) =>
				button
					.setIcon('trash')
					.setTooltip('Delete')
					.onClick(async () => {
						SettingsData.searchColumns.splice(index, 1)
						await this.saveCb()
						// Force refresh
						this.displayCb()
					})
			)
			setting.infoEl.remove()
		})
		new Setting(containerEl)
			.addButton((button) =>
				button
					.setButtonText('Reset columns')
					.setWarning()
					.onClick(async (value) => {
						SettingsData.searchColumns = [...DEFAULT_SETTINGS.searchColumns]
						await this.saveCb()
						// Force refresh
						this.displayCb()
					})
			)
			.addButton((button) =>
				button
					.setButtonText('Add Column')
					.setCta()
					.onClick(async (_value) => {
						SettingsData.searchColumns.push({
							type: ESearchColumnsTypes.KEY,
							compact: false,
						})
						await this.saveCb()
						// Force refresh
						this.displayCb()
					})
			)
			.addButton((button) =>
				button
					.setButtonText('Configure Column')
					.setCta()
					.onClick(async (_value) => {
						this.renderModifySettings()
					})
			)
	}

	private renderModifySettings() {
		this.containerEl.empty()
		new Setting(this.containerEl).setName('Column configuration').setHeading()
		this.containerEl.createDiv({
			text: 'place holder for config',
			cls: 'setting-item-description',
		})

		new Setting(this.containerEl)
			.setName('Search')
			.setDesc('Select the available columns in your JIRA project')
			.addSearch((search) =>
				search
					.setPlaceholder('Select columns')
					.then((search) => 
						new ColumnSuggest(search.inputEl, this.app)
				)
			)
		new Setting(this.containerEl)
			.setName('Selected')
			.setDesc(
				'The displayed columns when columns are not specifed in `jira-search` query'
			)

		SettingsData.searchColumns.forEach((column, index) => {
			const setting = new Setting(this.containerEl).then((setting) => {
				setting.settingEl.addClass('search-column-container')
				setting.infoEl.createDiv({
					text: SEARCH_COLUMNS_DESCRIPTION[column.type],
				})
			})

			setting.addExtraButton((button) =>
				button
					.setIcon(
						SettingsData.searchColumns[index].compact
							? 'compress-glyph'
							: 'enlarge-glyph'
					)
					.setTooltip(
						SettingsData.searchColumns[index].compact ? 'Compact' : 'Full width'
					)
					.onClick(async () => {
						SettingsData.searchColumns[index].compact =
							!SettingsData.searchColumns[index].compact
						await this.saveCb()
						this.renderModifySettings()
					})
			)
			setting.addExtraButton((button) =>
				button
					.setIcon('up-chevron-glyph')
					.setTooltip('Move up')
					.setDisabled(index === 0)
					.onClick(async () => {
						const tmp = SettingsData.searchColumns[index]
						SettingsData.searchColumns[index] =
							SettingsData.searchColumns[index - 1]
						SettingsData.searchColumns[index - 1] = tmp
						await this.saveCb()
						this.render()
					})
			)
			setting.addExtraButton((button) =>
				button
					.setIcon('down-chevron-glyph')
					.setTooltip('Move down')
					.setDisabled(index === SettingsData.searchColumns.length - 1)
					.onClick(async () => {
						const tmp = SettingsData.searchColumns[index]
						SettingsData.searchColumns[index] =
							SettingsData.searchColumns[index + 1]
						SettingsData.searchColumns[index + 1] = tmp
						await this.saveCb()
						// // Force refresh
						this.renderModifySettings()
					})
			)
			setting.addExtraButton((button) =>
				button
					.setIcon('trash')
					.setTooltip('Delete')
					.onClick(async () => {
						SettingsData.searchColumns.splice(index, 1)
						await this.saveCb()
						// // Force refresh
						this.renderModifySettings()
					})
			)
		})
		new Setting(this.containerEl).addButton((button) =>
			button
				.setButtonText('Back')
				.setWarning()
				.onClick(async (value) => {
					this.displayCb()
				})
		)
	}
}
