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
			.setName('Default Jira search settings')
			.setHeading()

		this.containerEl.createDiv({
			text: 'Configure the default behavior and display options for your Jira search queries.',
			cls: 'setting-item-description',
			attr: {
				style: 'margin-bottom: 8px;',
			},
		})
		new Setting(containerEl)
			.setName('Link to note')
			.setDesc(
				'Add a backlink to your Jira issue note in the default search results.'
			)
			.addToggle((toggle) =>
				toggle
					.setValue(SettingsData.inlineIssueUrlToTag)
					.onChange(async (value) => {
						SettingsData.inlineIssueUrlToTag = value
						await this.saveCb()
					})
			)

		new Setting(containerEl)
			.setName('Limit')
			.setDesc('Maximum number of results to return for each query by default.')
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
			.setName('Column defaults')
			.setDesc(
				'Fields shown by default in search results when no columns are specified in your `jira-search` query.'
			)

		this.renderSelectedFields('Jira fields')

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
		this.renderHeader()
		this.renderAvailableFields()
		this.renderSelectedFields()
		this.renderBackButton()
	}

	private renderHeader() {
		new Setting(this.containerEl).setName('Configure Jira fields').setHeading()
		this.containerEl.createDiv({
			text: "Select which Jira fields to display by default in your `jira-search` query. Available fields depend on your organization's Jira configuration. If a field you need is missing, you can request it as a future feature.",
			cls: 'setting-item-description',
			attr: {
				style: 'margin-bottom: 8px;',
			},
		})
	}

	private renderAvailableFields() {
		const setting = new Setting(this.containerEl)
			.setName('Available fields')
			.addSearch((search) =>
				search.setPlaceholder('Search for fields. Ex. time').then((search) => {
					new ColumnSuggest(this.app, search.inputEl)
				})
			)

		setting.settingEl.addClass('column-settings-fields')
		const fieldOptionsContainerEl = setting.settingEl.createEl('div', {
			cls: 'field-options-container',
		})
		// Flexbox for up to 3 items per row, aligned
		let allFields: Record<string, boolean>
		if (!SettingsData.jiraFieldOptions) {
			const fields = Object.keys(ESearchColumnsTypes)
				.filter((field) => isNaN(Number(field)))
				.reduce((prev, curr) => {
					prev[curr] = false
					return prev
				}, {} as Record<string, boolean>)
			const selectedFields = SettingsData.searchColumns.reduce((prev, curr) => {
				prev[curr.type] = true
				return prev
			}, {} as Record<string, boolean>)
			allFields = Object.assign(fields, selectedFields)
		} else {
			allFields = { ...SettingsData.jiraFieldOptions }
		}
		const itemsPerRow = 3
		Object.entries(SEARCH_COLUMNS_DESCRIPTION).forEach(([field, desc]) => {
			const label = fieldOptionsContainerEl.createEl('label', {
				cls: 'field-option-label',
			})
			const checkbox = label.createEl('input', {
				type: 'checkbox',
				attr: { value: desc },
			})
			checkbox.checked = allFields[field]
			checkbox.addEventListener('change', async () => {
				allFields[field] = checkbox.checked
				const scIdx = SettingsData.searchColumns.findIndex(
					(sc) => sc.type === field
				)
				console.log({ scIdx })
				if (scIdx === -1) {
					SettingsData.searchColumns.push({
						type: field as ESearchColumnsTypes,
						compact: false,
					})
					console.log(SettingsData.searchColumns)
				} else {
					const start = SettingsData.searchColumns.slice(0, scIdx)
					const endSc = SettingsData.searchColumns.slice(scIdx + 1)
					console.log({ start, endSc })
					SettingsData.searchColumns = [...start, ...endSc]
					await this.saveCb()
					this.renderModifySettings()
				}
			})
			label.createSpan({
				text: desc,
				cls: 'field-option-label-text',
			})
		})
		// Add invisible spacers if needed to fill out the last row
		const remainder = Object.keys(allFields).length % itemsPerRow
		if (remainder !== 0) {
			for (let i = 0; i < itemsPerRow - remainder; i++) {
				fieldOptionsContainerEl.createEl('div', {
					cls: 'field-option-spacer',
				})
			}
		}
	}

	private renderSelectedFields(settingName?: string) {
		new Setting(this.containerEl).setName(settingName ?? 'Selected fields')

		// --- Drag and drop container for selected columns ---
		const selectedColumnsContainer = this.containerEl.createDiv({
			cls: 'selected-columns-dnd-container',
		})

		const renderSelectedColumns = () => {
			selectedColumnsContainer.empty()
			SettingsData.searchColumns.forEach((column, index) => {
				const setting = new Setting(selectedColumnsContainer)
				setting.settingEl.addClass('search-column-container')
				setting.settingEl.setAttr('draggable', 'true')
				setting.settingEl.setAttr('data-index', index)
				// Add drag handle SVG
				const dragHandle = document.createElement('span')
				dragHandle.className = 'drag-handle'
				dragHandle.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-vertical-icon lucide-grip-vertical"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
				`
				setting.settingEl.prepend(dragHandle)
				setting.infoEl.createDiv({
					text: SEARCH_COLUMNS_DESCRIPTION[
						column.type as keyof typeof SEARCH_COLUMNS_DESCRIPTION
					],
				})

				setting.addExtraButton((button) =>
					button
						.setIcon(
							SettingsData.searchColumns[index].compact
								? 'compress-glyph'
								: 'enlarge-glyph'
						)
						.setTooltip(
							SettingsData.searchColumns[index].compact
								? 'Compact'
								: 'Full width'
						)
						.onClick(async () => {
							SettingsData.searchColumns[index].compact =
								!SettingsData.searchColumns[index].compact
							await this.saveCb()
							renderSelectedColumns()
						})
				)
				setting.addExtraButton((button) =>
					button
						.setIcon('trash')
						.setTooltip('Delete')
						.onClick(async () => {
							SettingsData.searchColumns.splice(index, 1)
							await this.saveCb()
							renderSelectedColumns()
						})
				)
			})

			this.enableDragAndDrop(selectedColumnsContainer, renderSelectedColumns)
		}

		renderSelectedColumns()
	}

	private enableDragAndDrop(container: HTMLElement, rerender: () => void) {
		let dragSrcIdx: number | null = null
		container.querySelectorAll('.search-column-container').forEach((el) => {
			el.addEventListener('dragstart', (e: DragEvent) => {
				dragSrcIdx = Number(
					(e.currentTarget as HTMLElement).getAttribute('data-index')
				)
				;(e.currentTarget as HTMLElement).classList.add('dragging')
			})
			el.addEventListener('dragend', (e: DragEvent) => {
				;(e.currentTarget as HTMLElement).classList.remove('dragging')
			})
			el.addEventListener('dragover', (e: DragEvent) => {
				;(e as DragEvent).preventDefault()
				;(e.currentTarget as HTMLElement).classList.add('drag-over')
			})
			el.addEventListener('dragleave', (e: DragEvent) => {
				;(e.currentTarget as HTMLElement).classList.remove('drag-over')
			})
			el.addEventListener('drop', async (e) => {
				;(e as DragEvent).preventDefault()
				const targetIdx = Number(
					((e as DragEvent).currentTarget as HTMLElement).getAttribute(
						'data-index'
					)
				)
				if (dragSrcIdx !== null && dragSrcIdx !== targetIdx) {
					const moved = SettingsData.searchColumns.splice(dragSrcIdx, 1)[0]
					SettingsData.searchColumns.splice(targetIdx, 0, moved)
					await this.saveCb()
					rerender()
				}
				dragSrcIdx = null
			})
		})
	}

	private renderBackButton() {
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
