import { Setting } from 'obsidian'
import { JiraIssueSettingTab, SettingsData } from 'src/settings'
import { JiraAccountSettings } from './settings.interfaces'
import { AccountSettingsModal } from './account-settings-modal'
import {
	ACCOUNT_TEMPLATE,
	createJiraAccountTile,
} from './account-settings-mixin'

export class AccountSettings {
	parent: JiraIssueSettingTab
	account: JiraAccountSettings

	constructor(parent: JiraIssueSettingTab) {
		this.parent = parent
		this.account = SettingsData.account
	}

	displayPanel() {
		// this.addHeading()
		this.addJiraAccountTile()
	}

	private addHeading() {
		const { containerEl } = this.parent
		new Setting(containerEl)
			.setName('Account')
			.setHeading()
			.addExtraButton((button) =>
				button
					.setIcon('settings')
					.setTooltip('Options')
					.onClick(this.openAccountSettingsModal)
			)
	}

	private addJiraAccountTile() {
		const { containerEl } = this.parent
		const needsAccountSetup = !this.account.password || !this.account.username || !this.account.host
		if (needsAccountSetup) {
			createJiraAccountTile(containerEl, this.account, (button) =>
				button
					.setButtonText('Setup account')
					.setCta()
					.onClick(this.openAccountSettingsModal)
			)
		} else {
			createJiraAccountTile(containerEl, this.account, undefined, (button) =>
				button
					.setIcon('settings')
					.setTooltip('Options')
					.onClick(this.openAccountSettingsModal)
			)
		}
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
