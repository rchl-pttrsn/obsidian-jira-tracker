import { App, Modal, Setting } from 'obsidian'
import { JiraAccountSettings } from './settings.interfaces'
import { ACCOUNT_TEMPLATE, addTextSetting, createJiraAccountTile } from './account-settings-mixin'

type StringKeys<T> = {
	[K in keyof T]: T[K] extends string ? K : never
}[keyof T]

export class AccountSettingsModal extends Modal {
	account: JiraAccountSettings
	onSubmit: () => void
	private showPassword = false

	constructor(app: App, account: JiraAccountSettings, onSubmit: () => void) {
		super(app)
		this.account = account
		this.onSubmit = onSubmit
		this.renderSettings()
	}

	private renderSettings() {
		this.contentEl.empty()
		// new Setting(this.contentEl).setName('Account').setHeading()
		this.addAccountTile()
		this.addColor()
		this.addAlias()
		this.addHost()
		this.addUsername()
		this.addPassword()
		this.addSave()
	}

	private addAccountTile() {
		const { contentEl } = this
		createJiraAccountTile(contentEl, this.account)
	}

	private addColor() {
		new Setting(this.contentEl)
			.setName('Color')
			.addColorPicker((colorPicker) =>
				colorPicker
					.setValue(this.account.color)
					.onChange(this.onSettingChange('color'))
		)
	}

	private addAlias() {
		const { contentEl } = this
		const options = {
			name: 'Alias',
			placeholder: 'My Company',
			initialValue: this.account.alias,
		}

		addTextSetting(contentEl, this.onSettingChange('alias'), options)
	}

	private addHost() {
		const { contentEl } = this
		const options = {
			name: 'Host',
			placeholder: ACCOUNT_TEMPLATE.host,
			initialValue: this.account.host,
		}

		addTextSetting(contentEl, this.onSettingChange('host'), options)
	}

	private addUsername() {
		const { contentEl } = this
		const options = {
			name: 'Email',
			placeholder: 'me@company.com',
			initialValue: this.account.username,
		}

		addTextSetting(contentEl, this.onSettingChange('username'), options)
	}

	private addPassword() {
		new Setting(this.contentEl)
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
						this.renderSettings()
					})
			)
			.addText((text) =>
				text
					.setValue(this.account.password)
					.onChange(async (val) => (this.account.password = val))
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
			this.renderSettings()
		}
	}
}
