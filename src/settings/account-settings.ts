import { Setting } from 'obsidian'
import { JiraIssueSettingTab, SettingsData } from 'src/settings'
import { JiraAccountSettings } from './settings.interfaces'
import { AccountSettingsModal } from './account-settings-modal'
import { createJiraAccountTile } from './account-settings-mixin'

export class AccountSettings {
	parent: JiraIssueSettingTab
	account: JiraAccountSettings
	constructor(parent: JiraIssueSettingTab) {
		this.parent = parent
		this.account = SettingsData.account
	}

	displayPanel() {
		this.addHeading()
		this.addJiraAccountTile()
	}

	private addHeading() {
		const { containerEl } = this.parent
		const openAccountSettingsModal = () => {
			const saveSettingCb = () => this.parent.display()
			new AccountSettingsModal(
				this.parent.app,
				this.account,
				saveSettingCb
			).open()
		}
		new Setting(containerEl)
			.setName('Account')
			.setHeading()
			.addExtraButton((button) =>
				button
					.setIcon('settings')
					.setTooltip('Options')
					.onClick(openAccountSettingsModal)
			)
	}

	private addJiraAccountTile() {
		const { containerEl } = this.parent
		createJiraAccountTile(containerEl, this.account)
	}
}
