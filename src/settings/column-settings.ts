import { App, Setting } from 'obsidian'
import { JiraFields, JIRA_FIELDS } from 'src/settings/settings.models'
import {
	DEFAULT_SETTINGS,
	SettingsData,
	JiraIssueSettingTab,
} from 'src/settings'

export class SearchPresetSettings {
	parent: JiraIssueSettingTab
	app: App
	containerEl: HTMLElement

	constructor(parent: JiraIssueSettingTab) {
		this.parent = parent
		this.app = parent.app
		this.containerEl = parent.containerEl
	}

	public display() {
		this.addHeading()
		this.addLimitField()
		this.addNotesColumnField()
		this.addSelectedFields()
		this.addColumnActions()
	}

	private addHeading() {
		const { containerEl } = this
		new Setting(containerEl).setName('Search presets').setHeading()
		containerEl.createEl('div', {
			text: 'Default search criteria for Jira issues. These will be used for all searches unless specify different options in the Search Wizard or jira-search block. (table format only)',
			cls: 'setting-item-description',
			attr: {
				style: 'margin-bottom: 8px;',
			},
		})
	}

	private addLimitField() {
		const { containerEl } = this
		new Setting(containerEl)
			.setName('Limit')
			.setDesc('Maximum number of results to return for each search.')
			.addSlider((slider) =>
				slider
					.setLimits(1, 50, 1)
					.setValue(SettingsData.searchResultsLimit)
					.setDynamicTooltip()
					.onChange(async (value) => {
						SettingsData.searchResultsLimit = value
						await this.parent.saveSettings()
					})
			)
	}

	private addNotesColumnField() {
		const { containerEl } = this
		new Setting(containerEl)
			.setName('Include notes column')
			.setDesc(
				'Display a link to notes in Obsidian related to your search results for easy reference.'
			)
			.addToggle((toggle) =>
				toggle
					.setValue(SettingsData.inlineIssueUrlToTag)
					.onChange(async (value) => {
						SettingsData.inlineIssueUrlToTag = value
						await this.parent.saveSettings()
					})
			)
	}

	private addSelectedFields() {
		const { containerEl } = this
		addSelectedFields(
			containerEl,
			'Selected Jira Fields',
			'Data from Jira that will be included in the search results',
			async () => await this.parent.saveSettings()
		)
	}

	private addColumnActions() {
		const { containerEl } = this
		new Setting(containerEl)
			.addButton((button) =>
				button
					.setButtonText('Reset columns')
					.setWarning()
					.onClick(async (_value) => {
						SettingsData.searchColumns = [...DEFAULT_SETTINGS.searchColumns]
						await this.parent.saveSettings()
						this.parent.display()
					})
			)
			.addButton((button) =>
				button
					.setButtonText('Change Columns')
					.setCta()
					.onClick(async (_value) => {
						new ColumnSettingsPage(this.parent).display()
					})
			)
	}
}

class ColumnSettingsPage {
	parent: JiraIssueSettingTab
	app: App
	containerEl: HTMLElement

	constructor(parent: JiraIssueSettingTab) {
		this.parent = parent
		this.app = parent.app
		this.containerEl = parent.containerEl
	}

	public display() {
		this.containerEl.empty()
		this.containerEl.addClass('jto')
		this.addHeaderField()
		this.addAvailableFields()
		this.addSelectedFields()
		this.addBackButton()
	}

	private addHeaderField() {
		new Setting(this.containerEl).setName('Jira fields').setHeading()
		this.containerEl.createDiv({
			text: 'Select from the list of available fields provided by your Jira organization to add to your default search query. The current fields are Jira defaults. Support for custom fields is coming soon—if you’d like a specific field included, please let me know on GitHub.',
			cls: 'setting-item-description',
			attr: {
				style: 'margin-bottom: 8px;',
			},
		})
	}

	private addAvailableFields() {
		const setting = new Setting(this.containerEl).setName('Available fields')

		let searchValue = ''
		// Simple fuzzy search implementation
		function fuzzyMatch(needle: string, haystack: string) {
			needle = needle.toLowerCase()
			haystack = haystack.toLowerCase()
			let hIdx = 0
			for (let nIdx = 0; nIdx < needle.length; nIdx++) {
				const nChar = needle[nIdx]
				hIdx = haystack.indexOf(nChar, hIdx)
				if (hIdx === -1) return false
				hIdx++
			}
			return true
		}
		const filterFields = () => {
			const lower = searchValue.toLowerCase()
			if (!lower) return Object.entries(JIRA_FIELDS)
			return Object.entries(JIRA_FIELDS).filter(
				([field, desc]) => fuzzyMatch(lower, field) || fuzzyMatch(lower, desc)
			)
		}

		const fieldContainerEl = setting.settingEl.createEl('div', {
			cls: 'field-options-container',
		})
		const fieldOptionsContainerEl = fieldContainerEl.createEl('div', {
			cls: 'flex',
		})
		const renderCheckboxes = () => {
			fieldOptionsContainerEl.empty()
			let allFields: Record<string, boolean>
			const fields = Object.keys(JiraFields)
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

			const itemsPerRow = 3
			const filtered = filterFields()
			filtered.forEach(([field, desc]) => {
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
					if (scIdx === -1) {
						SettingsData.searchColumns.push({
							type: field as JiraFields,
							compact: false,
						})
					} else {
						const start = SettingsData.searchColumns.slice(0, scIdx)
						const endSc = SettingsData.searchColumns.slice(scIdx + 1)
						SettingsData.searchColumns = [...start, ...endSc]
					}
					await this.parent.saveSettings()
					this.display()
				})
				label.createSpan({
					text: desc,
					cls: 'field-option-label-text',
				})
			})
			const remainder = filtered.length % itemsPerRow
			if (remainder !== 0) {
				for (let i = 0; i < itemsPerRow - remainder; i++) {
					fieldOptionsContainerEl.createEl('div', {
						cls: 'field-option-spacer',
					})
				}
			}
		}

		setting.addSearch((search) => {
			search.setPlaceholder('Filter available fields. Example: sum')
			search.onChange((val) => {
				searchValue = val
				renderCheckboxes()
			})
		})
		setting.settingEl.addClass('column-settings-fields')
		renderCheckboxes()
	}

	private addSelectedFields() {
		addSelectedFields(
			this.containerEl,
			'Selected fields',
			'',
			async () => await this.parent.saveSettings()
		)
	}

	private addBackButton() {
		new Setting(this.containerEl).addButton((button) =>
			button
				.setButtonText('Back')
				.setWarning()
				.onClick(async (_value) => {
					this.parent.display()
				})
		)
	}
}

const addSelectedFields = (
	containerEl: HTMLElement,
	title: string,
	description: string,
	saveCb: () => Promise<void>
) => {
	new Setting(containerEl).setName(title).setDesc(description)

	const selectedColumnsContainer = containerEl.createDiv({
		cls: 'selected-columns-dnd-container',
	})

	const renderSelectedColumns = () => {
		selectedColumnsContainer.empty()
		SettingsData.searchColumns.forEach((column, index) => {
			const setting = new Setting(selectedColumnsContainer)
			setting.settingEl.addClass('search-column-container')
			setting.settingEl.setAttr('draggable', 'true')
			setting.settingEl.setAttr('data-index', index)
			const dragHandle = document.createElement('span')
			dragHandle.className = 'drag-handle'
			dragHandle.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-vertical-icon lucide-grip-vertical"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
				`
			setting.settingEl.prepend(dragHandle)
			setting.infoEl.createDiv({
				text: JIRA_FIELDS[column.type as keyof typeof JIRA_FIELDS],
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
						await saveCb()
						renderSelectedColumns()
					})
			)
			setting.addExtraButton((button) =>
				button
					.setIcon('trash')
					.setTooltip('Delete')
					.onClick(async () => {
						SettingsData.searchColumns.splice(index, 1)
						await saveCb()
						renderSelectedColumns()
					})
			)
		})

		enableDragAndDrop(selectedColumnsContainer, renderSelectedColumns, saveCb)
	}

	renderSelectedColumns()
}

const enableDragAndDrop = (
	container: HTMLElement,
	rerender: () => void,
	saveCb: () => Promise<void>
) => {
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
				await saveCb()
				rerender()
			}
			dragSrcIdx = null
		})
	})
}

// In the fuzzyMatch function:
// - `needle` is the user's search input (the string they are typing).
// - `haystack` is the string being checked (either the field name or description).
// The function checks if all characters of `needle` appear in order (but not necessarily consecutively) in `haystack`.
// For example, fuzzyMatch('abc', 'alphabetical') returns true because 'a', 'b', 'c' appear in order in 'alphabetical'.
// If any character in `needle` is not found in `haystack` after the previous match, it returns false.
