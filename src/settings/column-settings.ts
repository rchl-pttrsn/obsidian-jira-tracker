import { Setting } from 'obsidian'
import {
	ISearchColumn,
	SEARCH_COLUMNS_DESCRIPTION,
} from 'src/interfaces/settingsInterfaces'
import { SettingsData } from 'src/settings'

export class ColumnSettings {
	containerEl: HTMLElement
	saveCb: () => Promise<void>
	displayCb: () => Promise<void>
	constructor(
		containerEl: HTMLElement,
		saveCb: () => Promise<void>,
		displayCb: () => Promise<void>
	) {
		this.containerEl = containerEl
		this.saveCb = saveCb
		this.displayCb = displayCb
	}

	public render() {
		this.containerEl.empty()
		new Setting(this.containerEl).setName('Column configuration').setHeading()
		this.containerEl.createDiv({
			text: 'place holder for config',
			cls: 'setting-item-description',
		})

		new Setting(this.containerEl)
			.setName('Search')
			.setDesc('Select the available columns in your JIRA project')
			.addSearch((search) => search.setPlaceholder('Select columns'))
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
				// .addOptions(SEARCH_COLUMNS_DESCRIPTION)
				// .setValue(column.type)
				// .onChange(async (value) => {
				// 	SettingsData.searchColumns[index].type =
				// 		value as ESearchColumnsTypes
				// 	// await this.saveSettings()
				// 	// // Force refresh
				// 	// this.display()
				// })
				// .selectEl.addClass('flex-grow-1')
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
						// // Force refresh
						// this.display()
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
						// // Force refresh
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
						this.render()
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
						this.render()
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
