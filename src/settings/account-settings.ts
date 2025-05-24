import { App, Modal, Notice, Setting } from 'obsidian'
import { JiraIssueSettingTab, SettingsData } from 'src/settings'
import { JiraAccountSettings } from './settings.models'
import JiraClient from '../client/jiraClient'

export const ACCOUNT_TEMPLATE: JiraAccountSettings = {
	alias: 'Jira',
	host: 'https://mycompany.atlassian.net',
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

export class AccountSettings {
	parent: JiraIssueSettingTab
	account: JiraAccountSettings

	constructor(parent: JiraIssueSettingTab) {
		this.parent = parent
		this.account = SettingsData.account
	}

	display() {
		const needsAccountSetup =
			!this.account.password || !this.account.username || !this.account.host
		needsAccountSetup ? this.addSetUpAccountTile() : this.addAccountTile()
	}

	private addSetUpAccountTile() {
		const { containerEl } = this.parent
		createJiraAccountTile(containerEl, this.account, (button) =>
			button
				.setButtonText('Setup account')
				.setCta()
				.onClick(this.openAccountSettingsModal)
		)
	}

	private addAccountTile() {
		const { containerEl } = this.parent
		createJiraAccountTile(containerEl, this.account, undefined, (button) =>
			button
				.setIcon('settings')
				.setTooltip('Options')
				.onClick(this.openAccountSettingsModal)
		)
	}

	private openAccountSettingsModal = () => {
		const saveSettingCb = () => {
			this.parent.saveSettings()
			this.parent.display()
		}
		new AccountSettingsModal(
			this.parent.app,
			this.account,
			saveSettingCb
		).open()
	}
}

export class AccountSettingsModal extends Modal {
	account: JiraAccountSettings
	onSubmit: () => void
	private showPassword = false

	constructor(app: App, account: JiraAccountSettings, onSubmit: () => void) {
		super(app)
		this.account = account
		this.onSubmit = onSubmit
		this.display()
	}

	private display() {
		this.contentEl.style.marginTop = '0.75em'
		this.contentEl.empty()
		this.addAccountTile()
		this.addColorField()
		this.addAliasField()
		this.addHostField()
		this.addUsernameField()
		this.addApiTokenField()
		this.addSave()
	}

	private addAccountTile() {
		const { contentEl, account } = this
		createJiraAccountTile(contentEl, account)
	}

	private addColorField() {
		const { contentEl, account } = this
		new Setting(contentEl)
			.setName('Color')
			.addColorPicker((colorPicker) =>
				colorPicker
					.setValue(account.color)
					.onChange(this.onSettingChange('color'))
			)
	}

	private addAliasField() {
		const { contentEl, account } = this
		const options = {
			name: 'Alias',
			placeholder: 'My Company',
			initialValue: account.alias,
		}

		addTextSetting(contentEl, this.onSettingChange('alias'), options)
	}

	private addHostField() {
		const { contentEl, account } = this
		const options = {
			name: 'Host',
			placeholder: ACCOUNT_TEMPLATE.host,
			initialValue: account.host,
		}

		addTextSetting(contentEl, this.onSettingChange('host'), options)
	}

	private addUsernameField() {
		const { contentEl, account } = this
		const options = {
			name: 'Email',
			placeholder: 'me@company.com',
			initialValue: account.username,
		}

		addTextSetting(contentEl, this.onSettingChange('username'), options)
	}

	private addApiTokenField() {
		const { contentEl, account } = this
		new Setting(contentEl)
			.setName('API Token')
			.setDesc(
				(() => {
					const frag = document.createDocumentFragment()
					frag.append('Your API token to connect to Jira. ')
					frag.appendChild(
						createEl('a', {
							text: 'manage token',
							href: 'https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/#Create-an-API-token',
						})
					)
					return frag
				})()
			)
			.addExtraButton((button) =>
				button
					.setIcon(this.showPassword ? 'eye-off' : 'eye')
					.setTooltip(this.showPassword ? 'Hide password' : 'Show password')
					.onClick(async () => {
						this.showPassword = !this.showPassword
						this.display()
					})
			)
			.addText((text) =>
				text
					.setValue(account.password)
					.onChange(async (val) => (account.password = val))
					.inputEl.setAttr('type', this.showPassword ? 'text' : 'password')
			)
	}

	private addSave() {
		new Setting(this.contentEl).addButton((button) =>
			button
				.setButtonText('Save')
				.setCta()
				.onClick(async () => {
					this.close()
					this.onSubmit()
				})
		)
	}

	private onSettingChange(accountKey: StringKeys<JiraAccountSettings>) {
		return (value: string) => {
			this.account[accountKey] = value
			this.display()
		}
	}
}

type StringKeys<T> = {
	[K in keyof T]: T[K] extends string ? K : never
}[keyof T]

function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
	let timeout: ReturnType<typeof setTimeout>
	return function (this: any, ...args: Parameters<T>) {
		clearTimeout(timeout)
		timeout = setTimeout(() => func.apply(this, args), wait)
	}
}

function addTextSetting(
	containerEl: HTMLElement,
	onChangeCb: (value: string) => void,
	options: { name: string; initialValue: string; placeholder?: string }
) {
	const debouncedUpdate = debounce(onChangeCb, 1000)
	const { name, placeholder = '', initialValue } = options
	const setting = new Setting(containerEl)
		.setName(name)
		.addText((text) =>
			text
				.setPlaceholder(placeholder)
				.setValue(initialValue)
				.onChange(debouncedUpdate)
		)
	return setting
}

function createJiraAccountTile(
	containerEl: HTMLElement,
	account: JiraAccountSettings,
	buttonOverride?: (button: import('obsidian').ButtonComponent) => void,
	extraButtonCb?: (button: import('obsidian').ExtraButtonComponent) => void
) {
	const setting = new Setting(containerEl)
		.setName(`${account.alias || ACCOUNT_TEMPLATE.alias} Account`)
		.setDesc(account.host || ACCOUNT_TEMPLATE.host)

	if (extraButtonCb) {
		setting.addExtraButton(extraButtonCb)
	}

	setting.addButton((button) => {
		if (buttonOverride) {
			buttonOverride(button)
		} else {
			button.setButtonText('Test connection').onClick(async () => {
				button.setDisabled(true)
				button.setButtonText('Testing...')
				try {
					const loggedUser = await JiraClient.getLoggedUser()
					new Notice(
						`Successfully connected to Jira - Logged as ${loggedUser.displayName}`
					)
				} catch (e) {
					new Notice('Failed to connect to Jira...')
					console.error('JiraTracker:TestConnection', e)
				}
				button.setButtonText('Test connection')
				button.setDisabled(false)
			})
		}
	})

	setting.infoEl.addClass('jira-account-tile')
	setting.infoEl.style.setProperty('--jira-account-color', account.color)
	return setting
}
