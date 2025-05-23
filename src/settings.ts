import { App, normalizePath, PluginSettingTab, Setting } from 'obsidian'
import { JiraFields, JiraTrackerSettings } from './settings/settings.interfaces'
import JiraIssuePlugin from './main'
import { FileSuggest, FolderSuggest } from './suggestions/contentSuggest'
import { ColumnSettings } from './settings/column-settings'
import { ACCOUNT_TEMPLATE, AccountSettings } from './settings/account-settings'

export const DEFAULT_SETTINGS: JiraTrackerSettings = {
	account: ACCOUNT_TEMPLATE,
	apiBasePath: '/rest/api/latest',
	cacheTime: '15m',
	searchResultsLimit: 10,
	cache: {
		columns: [],
	},
	inlineIssueUrlToTag: true,
	inlinePrefix: 'JIRA:',
	jiraFieldOptions: {
		[JiraFields.AGGREGATE_PROGRESS]: false,
		[JiraFields.AGGREGATE_TIME_ESTIMATED]: false,
		[JiraFields.AGGREGATE_TIME_ORIGINAL_ESTIMATE]: false,
		[JiraFields.AGGREGATE_TIME_SPENT]: false,
		[JiraFields.ASSIGNEE]: false,
		[JiraFields.COMPONENTS]: false,
		[JiraFields.CREATED]: false,
		[JiraFields.DESCRIPTION]: false,
		[JiraFields.DUE_DATE]: false,
		[JiraFields.ENVIRONMENT]: false,
		[JiraFields.FIX_VERSIONS]: false,
		[JiraFields.LINKED_ISSUES]: false,
		[JiraFields.KEY]: false,
		[JiraFields.LABELS]: false,
		[JiraFields.LAST_VIEWED]: false,
		[JiraFields.PARENT]: false,
		[JiraFields.PRIORITY]: false,
		[JiraFields.PROGRESS]: false,
		[JiraFields.PROJECT]: false,
		[JiraFields.REPORTER]: false,
		[JiraFields.RESOLUTION]: false,
		[JiraFields.RESOLUTION_DATE]: false,
		[JiraFields.STATUS]: false,
		[JiraFields.SUMMARY]: false,
		[JiraFields.TIME_ESTIMATE]: false,
		[JiraFields.TIME_ORIGINAL_ESTIMATE]: false,
		[JiraFields.TIME_SPENT]: false,
		[JiraFields.TYPE]: false,
		[JiraFields.UPDATED]: false,
		[JiraFields.CUSTOM_FIELD]: false,
		[JiraFields.NOTES]: false,
	},
	searchColumns: [
		{ type: JiraFields.KEY, compact: false },
		{ type: JiraFields.SUMMARY, compact: false },
		{ type: JiraFields.TYPE, compact: true },
		{ type: JiraFields.CREATED, compact: false },
		{ type: JiraFields.UPDATED, compact: false },
		{ type: JiraFields.REPORTER, compact: false },
		{ type: JiraFields.ASSIGNEE, compact: false },
		{ type: JiraFields.PRIORITY, compact: true },
		{ type: JiraFields.STATUS, compact: false },
	],
	debugMode: false,
}

export const SettingsData: JiraTrackerSettings = deepCopy(DEFAULT_SETTINGS)

function deepCopy(obj: any): any {
	return JSON.parse(JSON.stringify(obj))
}

export class JiraIssueSettingTab extends PluginSettingTab {
	private _plugin: JiraIssuePlugin
	private _onChangeListener: (() => void) | null = null

	constructor(app: App, plugin: JiraIssuePlugin) {
		super(app, plugin)
		this._plugin = plugin
	}

	async loadSettings(): Promise<void> {
		Object.assign(SettingsData, DEFAULT_SETTINGS, await this._plugin.loadData())
		SettingsData.account = Object.assign(
			{},
			ACCOUNT_TEMPLATE,
			SettingsData.account
		)
		SettingsData.cache = deepCopy(DEFAULT_SETTINGS.cache)
	}

	async saveSettings() {
		const settingsToStore: JiraTrackerSettings = Object.assign(
			{},
			SettingsData,
			{
				cache: DEFAULT_SETTINGS.cache,
				jqlAutocomplete: null,
				customFieldsIdToName: null,
				customFieldsNameToId: null,
				statusColorCache: null,
			}
		)
		settingsToStore.account.cache = ACCOUNT_TEMPLATE.cache

		await this._plugin.saveData(settingsToStore)
		if (this._onChangeListener) {
			this._onChangeListener()
		}
	}

	onChange(listener: () => void) {
		this._onChangeListener = listener
	}

	display(): void {
		this.containerEl.empty()
		this.containerEl.addClass('jto')
		this.addAccountsSettings()
		this.addInlineSettings()
		this.addNoteSettings()
		this.addSearchColumnsSettings()
		this.addAdvanceSettings()
		this.displayFooter()
	}

	addAccountsSettings() {
		new AccountSettings(this).display()
	}

	addInlineSettings() {
		const { containerEl } = this
		new Setting(containerEl)
			.setName('Convert URLs inline')
			.setDesc('Convert work item URLs to use the inline format.')
			.addToggle((toggle) =>
				toggle
					.setValue(SettingsData.inlineIssueUrlToTag)
					.onChange(async (value) => {
						SettingsData.inlineIssueUrlToTag = value
						await this.saveSettings()
					})
			)

		new Setting(containerEl)
			.setName('Inline tag prefix')
			.setDesc(
				(() => {
					const frag = document.createDocumentFragment()
					frag.append(
						'Prefix to covert work items to inline format. Ex: JIRA:AAA-123'
					)
					frag.appendChild(createEl('div', { text: 'Leave blank to disable.' }))
					return frag
				})()
			)
			.addText((text) =>
				text.setValue(SettingsData.inlinePrefix).onChange(async (value) => {
					SettingsData.inlinePrefix = value
					await this.saveSettings()
				})
			)
	}

	addNoteSettings() {
		const { containerEl, app } = this
		new Setting(containerEl)
			.setName('Jira template')
			.setDesc('Template to track work item notes. Leave blank to disable.')
			.addText((text) => {
				const thisText = text
				text
					.setValue(SettingsData.noteTemplate)
					.onChange(async (value) => {
						SettingsData.noteTemplate = value
						await this.saveSettings()
					})
					.then(({ inputEl }) => {
						new FileSuggest(this.app, inputEl)
					})
			})
			.then((setting) => {
				function isValidFile(file: string) {
					return !file || !!app.vault.getFileByPath(normalizePath(file))
				}
				addErrorHandler(setting, 'File not found in vault', isValidFile)
			})

		new Setting(containerEl)
			.setName('Jira folder')
			.setDesc('Jira notes are saved here. Default is root folder.')
			.addText((text) =>
				text
					.setValue(SettingsData.noteFolder)
					.onChange(async (value) => {
						SettingsData.noteFolder = value
						await this.saveSettings()
					})
					.then(({ inputEl }) => {
						new FolderSuggest(this.app, inputEl)
					})
			)
			.then((setting) => {
				function isValidFolder(folder: string) {
					return !folder || !!app.vault.getFolderByPath(normalizePath(folder))
				}
				addErrorHandler(setting, 'Folder not found in vault', isValidFolder)
			})

		function addErrorHandler(
			setting: Setting,
			errText: string,
			isValidCb: (value: any) => boolean
		) {
			const { controlEl } = setting
			const inputEl = controlEl.getElementsByTagName('input')[0]
			const errEl = controlEl.createEl('div', { cls: ['error-msg'] })
			errEl.createEl('span', { text: errText })
			inputEl.addEventListener('blur', (event) => {
				const value = (event.target as HTMLInputElement).value
				if (!isValidCb(value)) {
					controlEl.addClass('error')
				}
			})
			inputEl.addEventListener('focus', (_event) => {
				controlEl.removeClass('error')
			})
		}
	}

	addSearchColumnsSettings() {
		new ColumnSettings(this).display()
	}

	addAdvanceSettings() {
		const { containerEl } = this

		new Setting(containerEl).setName('Advanced').setHeading()
		new Setting(containerEl)
			.setName('Cache')
			.setDesc(
				'How often the data refreshes. A low value will make more requests to Jira.'
			)
			.addText((text) =>
				text
					.setPlaceholder('Example: 15m, 24h, 5s')
					.setValue(SettingsData.cacheTime)
					.onChange(async (value) => {
						SettingsData.cacheTime = value
						await this.saveSettings()
					})
			)

		new Setting(containerEl)
			.setName('debug')
			.setDesc(
				'Log in the console (CTRL+Shift+I) all the API requests and responses performed by the plugin.'
			)
			.addToggle((toggle) =>
				toggle.setValue(SettingsData.debugMode).onChange(async (value) => {
					SettingsData.debugMode = value
					await this.saveSettings()
				})
			)
	}

	displayFooter() {
		const { containerEl } = this
		// Custom GitHub star button

		new Setting(containerEl).setName('🦖 Support development').setHeading

		const starDiv = containerEl.createDiv({
			cls: 'styleSettingsButton prism-star',
		})
		const starLink = starDiv.createEl('a', {
			href: 'https://marc0l92.github.io/obsidian-jira-issue/',
			attr: { target: '_blank', rel: 'noopener nofollow' },
		})
		const starEmoji = starLink.createSpan({ cls: 'styleSettingsButtonEmoji' })
		starEmoji.textContent = '🌠'
		starLink.append('Star the project on GitHub')
		const issueDiv = containerEl.createDiv({
			cls: 'styleSettingsButton prism-issue',
		})
		const issueLink = issueDiv.createEl('a', {
			href: 'https://github.com/marc0l92/obsidian-jira-issue/issues',
			attr: { target: '_blank', rel: 'noopener nofollow' },
		})
		const issueEmoji = issueLink.createSpan({ cls: 'styleSettingsButtonEmoji' })
		issueEmoji.textContent = '⚠️'
		issueLink.append('Submit an issue')

		const coffeeDiv = containerEl.createDiv({
			cls: 'styleSettingsButton prism-coffee',
		})
		const coffeeLink = coffeeDiv.createEl('a', {
			href: 'https://ko-fi.com/marc0l92',
			attr: { target: '_blank', rel: 'noopener nofollow' },
		})
		const coffeeEmoji = coffeeLink.createSpan({
			cls: 'styleSettingsButtonEmoji',
		})
		coffeeEmoji.textContent = '☕'
		coffeeLink.append('Buy me a coffee')
	}
}
