import { Notice, Setting } from "obsidian"
import { JiraAccountSettings } from "./settings.interfaces"
import JiraClient from 'src/client/jiraClient'

export const ACCOUNT_TEMPLATE: JiraAccountSettings = {
	alias: 'default',
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
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout>
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

export function createJiraAccountTile(
	containerEl: HTMLElement,
	account: JiraAccountSettings
) {
	const setting = new Setting(containerEl)
		.setName(`${account.alias} Account`)
		.setDesc(account.host)
		.addButton((button) =>
			button.setButtonText('Test Connection').onClick(async () => {
				button.setDisabled(true)
				button.setButtonText('Testing...')
				try {
					const loggedUser = await JiraClient.getLoggedUser(account)
					new Notice(
						`Successfully connected to Jira - Logged as ${loggedUser.displayName}`
					)
				} catch (e) {
					new Notice('Failed to connect to Jira...')
					console.error('JiraTracker:TestConnection', e)
				}
				button.setButtonText('Test Connection')
				button.setDisabled(false)
			})
		)
	setting.infoEl.addClass('jira-account-tile')
	setting.infoEl.style.setProperty('--jira-account-color', account.color)
	return setting
}

export function addTextSetting(
	containerEl: HTMLElement,
	onChangeCb: (value: string) => void,
	options: { name: string; initialValue: string;  placeholder?: string; }
) {
	const debouncedUpdate = debounce(onChangeCb, 300)
	const {name, placeholder = '', initialValue } = options
	new Setting(containerEl)
		.setName(name)
		.addText((text) =>
			text
				.setPlaceholder(placeholder)
				.setValue(initialValue)
				.onChange(debouncedUpdate)
		)
}