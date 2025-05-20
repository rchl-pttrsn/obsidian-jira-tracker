import {
	App,
	normalizePath,
	Notice,
	PluginSettingTab,
	Setting,
	TextComponent,
} from 'obsidian'
import JiraClient from './client/jiraClient'
import {
	AuthenticationTypes,
	JiraFields,
	JiraAccountSettings,
	JiraTrackerSettings,
	AUTHENTICATION_TYPES
} from './settings/settings.interfaces'
import JiraIssuePlugin from './main'
import { getRandomHexColor } from './utils'
import { FileSuggest, FolderSuggest } from './suggestions/contentSuggest'
import { ColumnSettings } from './settings/column-settings'

export const DEFAULT_SETTINGS: JiraTrackerSettings = {
	accounts: [],
	apiBasePath: '/rest/api/latest',
	cacheTime: '15m',
	searchResultsLimit: 10,
	cache: {
		columns: [],
	},
	inlineIssueUrlToTag: true,
	inlineIssuePrefix: 'JIRA:',
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
		[JiraFields.CREATOR]: false,
		[JiraFields.SUB_TASKS]: false,
		[JiraFields.WATCHES]: false,
		[JiraFields.ATTACHMENT]: false,
		[JiraFields.COMMENT]: false,
		[JiraFields.ISSUE_RESTRICTION]: false,
		[JiraFields.SECURITY]: false,
		[JiraFields.THUMBNAIL]: false,
		[JiraFields.TIME_TRACKING]: false,
		[JiraFields.VERSIONS]: false,
		[JiraFields.VOTES]: false,
		[JiraFields.WORKLOG]: false,
		[JiraFields.WORK_RATIO]: false,
		[JiraFields.CUSTOM_FIELD]: false,
		[JiraFields.NOTES]: false
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
	logRequestsResponses: false,
	logImagesFetch: false,
}

export const DEFAULT_ACCOUNT: JiraAccountSettings = {
	alias: 'Default',
	host: 'https://mycompany.atlassian.net',
	authenticationType: AuthenticationTypes.OPEN,
	password: '',
	priority: 1,
	color: '#000000',
	cache: {
		statusColor: {},
		customFieldsIdToName: {},
		customFieldsNameToId: {},
		customFieldsType: {},
		jqlAutocomplete: {
			fields: [],
			functions: {},
		},
	},
}

function deepCopy(obj: any): any {
	return JSON.parse(JSON.stringify(obj))
}

export class JiraIssueSettingTab extends PluginSettingTab {
	private _plugin: JiraIssuePlugin
	private _onChangeListener: (() => void) | null = null
	private _showPassword: boolean = false

	constructor(app: App, plugin: JiraIssuePlugin) {
		super(app, plugin)
		this._plugin = plugin
	}

	async loadSettings(): Promise<void> {
		Object.assign(SettingsData, DEFAULT_SETTINGS, await this._plugin.loadData())
		for (const i in SettingsData.accounts) {
			SettingsData.accounts[i] = Object.assign(
				{},
				DEFAULT_ACCOUNT,
				SettingsData.accounts[i]
			)
		}
		SettingsData.cache = deepCopy(DEFAULT_SETTINGS.cache)

		if (
			SettingsData.accounts.length === 0 ||
			SettingsData.accounts[0] === null
		) {
			SettingsData.accounts = [DEFAULT_ACCOUNT]
			this.saveSettings()
		}
		this.accountsConflictsFix()
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
		settingsToStore.accounts.forEach(
			(account) => (account.cache = DEFAULT_ACCOUNT.cache)
		)
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
		this.displayAccountsSettings()
		this.displayRenderingSettings()
		this.displayNoteTemplateSettings()
		this.displaySearchColumnsSettings()
		this.displayExtraSettings()
		this.displayFooter()
	}

	displayFooter() {
		const { containerEl } = this
		// Custom GitHub star button
		
		new Setting(containerEl).setName('🦖 Support development').setHeading

		const starDiv = containerEl.createDiv({ cls: 'styleSettingsButton prism-star' })
		const starLink = starDiv.createEl('a', {
			href: 'https://marc0l92.github.io/obsidian-jira-issue/',
			attr: { target: '_blank', rel: 'noopener nofollow' }
		})
		const starEmoji = starLink.createSpan({ cls: 'styleSettingsButtonEmoji' })
		starEmoji.textContent = '🌠'
		starLink.append('Star the project on GitHub')
		const issueDiv = containerEl.createDiv({ cls: 'styleSettingsButton prism-issue' })
		const issueLink = issueDiv.createEl('a', {
			href: 'https://github.com/marc0l92/obsidian-jira-issue/issues',
			attr: { target: '_blank', rel: 'noopener nofollow' }
		})
		const issueEmoji = issueLink.createSpan({ cls: 'styleSettingsButtonEmoji' })
		issueEmoji.textContent = '⚠️'
		issueLink.append('Submit an issue')

		const coffeeDiv = containerEl.createDiv({ cls: 'styleSettingsButton prism-coffee' })
		const coffeeLink = coffeeDiv.createEl('a', {
			href: 'https://ko-fi.com/marc0l92',
			attr: { target: '_blank', rel: 'noopener nofollow' }
		})
		const coffeeEmoji = coffeeLink.createSpan({ cls: 'styleSettingsButtonEmoji' })
		coffeeEmoji.textContent = '☕'
		coffeeLink.append('Buy me a coffee')
	}

	displayAccountsSettings() {
		const { containerEl } = this
		new Setting(containerEl).setName('Account').setHeading()

		for (const account of SettingsData.accounts) {
			const accountSetting = new Setting(containerEl)
				.setName(account.alias)
				.setDesc(account.host)
				.addExtraButton((button) =>
					button
						.setIcon('pencil')
						.setTooltip('Modify')
						.onClick(async () => {
							this.displayModifyAccountPage(account)
						})
				)
				.addExtraButton((button) =>
					button
						.setIcon('trash')
						.setTooltip('Delete')
						.setDisabled(SettingsData.accounts.length <= 1)
						.onClick(async () => {
							SettingsData.accounts.remove(account)
							this.accountsConflictsFix()
							await this.saveSettings()
							// Force refresh
							this.display()
						})
				)
			accountSetting.infoEl.setAttr(
				'style',
				'padding-left:5px;border-left:5px solid ' + account.color
			)
		}
	}

	displayModifyAccountPage(
		prevAccount: JiraAccountSettings,
		newAccount: JiraAccountSettings = null
	) {
		if (!newAccount) newAccount = Object.assign({}, prevAccount)
		const { containerEl } = this
		containerEl.empty()
		new Setting(containerEl).setName('Modify account').setHeading()

		new Setting(containerEl)
			.setName('Alias')
			.setDesc('Name of this account.')
			.addText((text) =>
				text
					.setPlaceholder('Example: Company name')
					.setValue(newAccount.alias)
					.onChange(async (value) => {
						newAccount.alias = value
					})
			)
		new Setting(containerEl)
			.setName('Host')
			.setDesc('Hostname of your company Jira server.')
			.addText((text) =>
				text
					.setPlaceholder('Example: ' + DEFAULT_ACCOUNT.host)
					.setValue(newAccount.host)
					.onChange(async (value) => {
						newAccount.host = value
					})
			)
		new Setting(containerEl)
			.setName('Authentication type')
			.setDesc('Select how the plugin should authenticate in your Jira server.')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(AUTHENTICATION_TYPES)
					.setValue(newAccount.authenticationType)
					.onChange(async (value) => {
						newAccount.authenticationType = value as AuthenticationTypes
						this._showPassword = false
						// Force refresh
						this.displayModifyAccountPage(prevAccount, newAccount)
					})
			)
		if (newAccount.authenticationType === AuthenticationTypes.BASIC) {
			new Setting(containerEl)
				.setName('Username')
				.setDesc(
					'Username to access your Jira Server account using HTTP basic authentication.'
				)
				.addText((text) =>
					text
						// .setPlaceholder('')
						.setValue(newAccount.username)
						.onChange(async (value) => {
							newAccount.username = value
						})
				)
			new Setting(containerEl)
				.setName('Password')
				.setDesc(
					'Password to access your Jira Server account using HTTP basic authentication.'
				)
				.addText((text) =>
					text
						// .setPlaceholder('')
						.setValue(newAccount.password)
						.onChange(async (value) => {
							newAccount.password = value
						})
						.inputEl.setAttr('type', this._showPassword ? 'text' : 'password')
				)
				.addExtraButton((button) =>
					button
						.setIcon(
							this._showPassword ? 'jira-issue-hidden' : 'jira-issue-visible'
						)
						.setTooltip(this._showPassword ? 'Hide password' : 'Show password')
						.onClick(async () => {
							this._showPassword = !this._showPassword
							// Force refresh
							this.displayModifyAccountPage(prevAccount, newAccount)
						})
				)
		} else if (newAccount.authenticationType === AuthenticationTypes.CLOUD) {
			new Setting(containerEl)
				.setName('Email')
				.setDesc('Email of your Jira Cloud account.')
				.addText((text) =>
					text
						// .setPlaceholder('')
						.setValue(newAccount.username)
						.onChange(async (value) => {
							newAccount.username = value
						})
				)
			const apiTokenDescription = new Setting(containerEl)
				.setName('API Token')
				.addText((text) =>
					text
						// .setPlaceholder('')
						.setValue(newAccount.password)
						.onChange(async (value) => {
							newAccount.password = value
						})
						.inputEl.setAttr('type', this._showPassword ? 'text' : 'password')
				)
				.addExtraButton((button) =>
					button
						.setIcon(
							this._showPassword ? 'jira-issue-hidden' : 'jira-issue-visible'
						)
						.setTooltip(this._showPassword ? 'Hide password' : 'Show password')
						.onClick(async () => {
							this._showPassword = !this._showPassword
							// Force refresh
							this.displayModifyAccountPage(prevAccount, newAccount)
						})
				).descEl
			apiTokenDescription.appendText('API token of your Jira Cloud account (')
			apiTokenDescription.appendChild(
				createEl('a', {
					text: 'Official Documentation',
					href: 'https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/',
				})
			)
			apiTokenDescription.appendText(').')
		} else if (
			newAccount.authenticationType === AuthenticationTypes.BEARER_TOKEN
		) {
			new Setting(containerEl)
				.setName('Bearer token')
				.setDesc(
					'Token to access your Jira account using OAuth3 Bearer token authentication.'
				)
				.addText((text) =>
					text
						// .setPlaceholder('')
						.setValue(newAccount.bareToken)
						.onChange(async (value) => {
							newAccount.bareToken = value
						})
						.inputEl.setAttr('type', this._showPassword ? 'text' : 'password')
				)
				.addExtraButton((button) =>
					button
						.setIcon(
							this._showPassword ? 'jira-issue-hidden' : 'jira-issue-visible'
						)
						.setTooltip(this._showPassword ? 'Hide password' : 'Show password')
						.onClick(async () => {
							this._showPassword = !this._showPassword
							// Force refresh
							this.displayModifyAccountPage(prevAccount, newAccount)
						})
				)
		}
		new Setting(containerEl)
			.setName('Priority')
			.setDesc('Accounts search priority.')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(this.createPriorityOptions())
					.setValue(newAccount.priority.toString())
					.onChange(async (value) => {
						newAccount.priority = parseInt(value)
					})
			)
		let colorTextComponent: TextComponent = null
		const colorInput = new Setting(containerEl)
			.setName('Color band')
			.setDesc(
				'Color of the tags border. Use colors in hexadecimal notation (Example: #000000).'
			)
			.addText((text) => {
				text
					.setPlaceholder('Example: #000000')
					.setValue(newAccount.color)
					.onChange(async (value) => {
						newAccount.color = value.replace(/[^#0-9A-Fa-f]/g, '')
						if (newAccount.color[0] != '#')
							newAccount.color = '#' + newAccount.color
						colorInput.setAttr(
							'style',
							'border-left: 5px solid ' + newAccount.color
						)
					})
				colorTextComponent = text
			})
			.addExtraButton((button) =>
				button
					.setIcon('dice')
					.setTooltip('New random color')
					.onClick(async () => {
						newAccount.color = getRandomHexColor()
						if (colorTextComponent != null)
							colorTextComponent.setValue(newAccount.color)
						colorInput.setAttr(
							'style',
							'border-left: 5px solid ' + newAccount.color
						)
					})
			).controlEl.children[0]
		colorInput.setAttr('style', 'border-left: 5px solid ' + newAccount.color)

		new Setting(containerEl)
			.addButton((button) =>
				button
					.setButtonText('Back')
					.setWarning()
					.onClick(async (value) => {
						this._showPassword = false
						this.display()
					})
			)
			.addButton((button) =>
				button.setButtonText('Test Connection').onClick(async (value) => {
					button.setDisabled(true)
					button.setButtonText('Testing...')
					try {
						await JiraClient.testConnection(newAccount)
						new Notice('JiraIssue: Connection established!')
						try {
							const loggedUser = await JiraClient.getLoggedUser(newAccount)
							new Notice(`JiraIssue: Logged as ${loggedUser.displayName}`)
						} catch (e) {
							new Notice('JiraIssue: Logged as Guest')
							console.error('JiraIssue:TestConnection', e)
						}
					} catch (e) {
						console.error('JiraIssue:TestConnection', e)
						new Notice('JiraIssue: Connection failed!')
					}
					button.setButtonText('Test Connection')
					button.setDisabled(false)
				})
			)
			.addButton((button) =>
				button
					.setButtonText('Save')
					.setCta()
					.onClick(async (value) => {
						this._showPassword = false
						// Swap priority with another existing account
						SettingsData.accounts.find(
							(a) => a.priority === newAccount.priority
						).priority = prevAccount.priority
						Object.assign(prevAccount, newAccount)
						this.accountsConflictsFix()
						await this.saveSettings()
						this.display()
					})
			)
	}

	displayRenderingSettings() {
		const { containerEl } = this
		new Setting(containerEl).setName('Inline display').setHeading()
		new Setting(containerEl)
			.setName('Alias prefix')
			.setDesc(
				(() => {
					const frag = document.createDocumentFragment()
					frag.append('Prefix used to display alias. Leave empty to disable.')
					frag.appendChild(document.createElement('br'))
					frag.append('Example: JIRA:AAA-123')
					return frag
				})()
			)
			.addText((text) =>
				text
					.setValue(SettingsData.inlineIssuePrefix)
					.onChange(async (value) => {
						SettingsData.inlineIssuePrefix = value
						await this.saveSettings()
					})
			)

		new Setting(containerEl)
			.setName('Convert to aliases')
			.setDesc(
				(() => {
					const frag = document.createDocumentFragment()
					frag.append('Convert Jira work item URLs to an alias. Example:')
					frag.appendChild(document.createElement('br'))
					const url = document.createElement('em')
					url.textContent = 'https://yourcompany.atlassian.net/browse/AAA-123'
					frag.appendChild(url)
					frag.append(' converts to ')
					const alias = document.createElement('em')
					alias.textContent = 'JIRA:AAA-123'
					frag.appendChild(alias)
					return frag
				})()
			)
			.addToggle((toggle) =>
				toggle
					.setValue(SettingsData.inlineIssueUrlToTag)
					.onChange(async (value) => {
						SettingsData.inlineIssueUrlToTag = value
						await this.saveSettings()
					})
			)
	}

	displayNoteTemplateSettings() {
		const { containerEl, app } = this
		new Setting(containerEl).setName('Work item notes').setHeading()
		new Setting(containerEl)
			.setName('Template')
			.setDesc('Template to track work item notes. Leave blank to ignore')
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
			.setName('Folder')
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
			const inputEl = setting.controlEl.getElementsByTagName('input')[0]
			const errorEl = setting.descEl.createEl('div', {
				text: errText,
				cls: ['error'],
			})
			errorEl.toggleVisibility(false)

			inputEl.addEventListener('blur', (event) => {
				const value = (event.target as HTMLInputElement).value
				if (!isValidCb(value)) {
					errorEl.toggleVisibility(true)
					inputEl.addClass('error')
				}
			})
			inputEl.addEventListener('focus', (_event) => {
				errorEl.toggleVisibility(false)
				inputEl.removeClass('error')
			})
		}
	}

	displaySearchColumnsSettings() {
		new ColumnSettings(
			this.containerEl,
			this.saveSettings.bind(this),
			this.display.bind(this),
			this.app
		).render()
	}

	displayExtraSettings() {
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
			.setName('Log data request and responses')
			.setDesc(
				'Log in the console (CTRL+Shift+I) all the API requests and responses performed by the plugin.'
			)
			.addToggle((toggle) =>
				toggle
					.setValue(SettingsData.logRequestsResponses)
					.onChange(async (value) => {
						SettingsData.logRequestsResponses = value
						await this.saveSettings()
					})
			)
		new Setting(containerEl)
			.setName('Log images requests and responses')
			.setDesc(
				'Log in the console (CTRL+Shift+I) all the images fetch requests and responses performed by the plugin.'
			)
			.addToggle((toggle) =>
				toggle.setValue(SettingsData.logImagesFetch).onChange(async (value) => {
					SettingsData.logImagesFetch = value
					await this.saveSettings()
				})
		)
	}

	createNewEmptyAccount() {
		const newAccount = JSON.parse(JSON.stringify(DEFAULT_ACCOUNT))
		newAccount.priority = SettingsData.accounts.length + 1
		this.accountsConflictsFix()
		return newAccount
	}

	accountsConflictsFix() {
		const aliases: string[] = []
		SettingsData.accounts.sort((a, b) => a.priority - b.priority)
		let priority = 1
		for (const account of SettingsData.accounts) {
			while (aliases.indexOf(account.alias) >= 0) account.alias += '1'
			aliases.push(account.alias)

			account.priority = priority
			priority++
		}
	}

	createPriorityOptions(): Record<string, string> {
		const options: Record<string, string> = {}
		for (let i = 1; i <= SettingsData.accounts.length; i++) {
			options[i.toString()] = i.toString()
		}
		return options
	}
}
export const SettingsData: JiraTrackerSettings = deepCopy(DEFAULT_SETTINGS)
