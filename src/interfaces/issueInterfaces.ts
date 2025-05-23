import { components } from 'src/client/jira.schema'
import { JiraAccountSettings } from '../settings/settings.interfaces'

export type IJiraSearchField = components['schemas']['Fields'] & {
	[key: string]: unknown
	readonly aggregateprogress?: IJiraProgress
	readonly aggregatetimeestimate?: number
	readonly aggregatetimeoriginalestimate?: number
	readonly aggregatetimespent?: number
	readonly components?: components['schemas']['ComponentJsonBean'][]
	readonly created?: string
	readonly creator?: IJiraUser
	readonly description?: string
	readonly duedate?: string
	readonly environment?: string
	readonly fixVersions?: components['schemas']['Version'][]
	readonly issuelinks?: components['schemas']['IssueLink'][]
	readonly issuetype?: components['schemas']['IssueTypeDetails'] & {
		iconUrl?: string
	}
	readonly labels?: string[]
	readonly lastViewed?: string
	readonly parent?: IJiraIssue
	readonly progress?: IJiraProgress
	readonly project?: components['schemas']['ProjectDetails']
	readonly reporter?: IJiraUser
	readonly resolution?: components['schemas']['Resolution']
	readonly resolutiondate?: string
	readonly statusCategory?: components['schemas']['StatusCategory']
	readonly subtasks?: IJiraIssue[]
	readonly timeestimate?: number
	readonly timeoriginalestimate?: number
	readonly timespent?: number
	readonly updated?: string
	readonly versions?: components['schemas']['Version'][]
	readonly votes?: components['schemas']['Votes']
	readonly watches?: components['schemas']['Watchers']
	readonly worklog?: {
		worklogs: IJiraWorklog[]
	}
	// readonly attachment?: components['schemas']['Attachment']; NEW
	// readonly comment?: components['schemas']['Comment']; or page of comment? NEW
	// readonly thumbnail?: string;
	// readonly security?: components['schemas']['SecurityLevel'];
	// readonly issuerestriction?: components['schemas']['issuerestriction'];
	// readonly workratio?: number; NEW
}
export type IJiraIssue = components['schemas']['IssueBean'] & {
	readonly id: string
	readonly key: string
	readonly fields: IJiraSearchField
	account?: JiraAccountSettings
}

export type IJiraProgress = {
	readonly progress: number
	readonly total: number
}
export type IJiraUser = components['schemas']['UserDetails']
export type IJiraWorklog = components['schemas']['Worklog']

export type IJiraSearchResults =
	components['schemas']['SearchAndReconcileResults'] & {
		issues: IJiraIssue[]
		account: JiraAccountSettings
		total: number
	}

export interface IJiraField {
	custom: boolean
	id: string
	name: string
	schema: IJiraFieldSchema
}

export interface IJiraFieldSchema {
	customId: number
	type: string
	items?: string
}

export interface IJiraAutocompleteDataField {
	value: string
	displayName: string
	auto: string
	orderable: string
	searchable: string
	cfid: string
	operators: [string]
	types: [string]
}

export interface IJiraAutocompleteData {
	visibleFieldNames: IJiraAutocompleteDataField[]
	visibleFunctionNames: [
		{
			value: string
			displayName: string
			isList?: string
			types: [string]
		}
	]
	jqlReservedWords: [string]
}

export interface IJiraAutocompleteField {
	results: [
		{
			value: string
			displayName: string
		}
	]
}

export interface IJiraBoard {
	id: number
	name: string
	type: string
}

export interface IJiraSprint {
	id: number
	state: ESprintState
	name: string
	startDate: string
	endDate: string
	completeDate: string
	activatedDate: string
	originBoardId: number
	goal: string
}

export enum ESprintState {
	CLOSED = 'closed',
	ACTIVE = 'active',
	FUTURE = 'future',
}

const newEmptyUser = (): IJiraUser => {
	return {
		active: false,
		avatarUrls: {
			'16x16': '',
			'24x24': '',
			'32x32': '',
			'48x48': '',
		},
		displayName: '',
		self: '',
	}
}

const buildEmptyIssue = (): IJiraIssue =>
	JSON.parse(
		JSON.stringify({
			key: '',
			id: '',
			account: null,
			fields: {
				aggregateprogress: { progress: 0, total: 0 },
				aggregatetimeestimate: 0,
				aggregatetimeoriginalestimate: 0,
				aggregatetimespent: 0,
				assignee: newEmptyUser(),
				components: [],
				created: '',
				creator: newEmptyUser(),
				description: '',
				duedate: '',
				environment: '',
				fixVersions: [],
				issueLinks: [],
				issuetype: { iconUrl: '', name: '' },
				labels: [],
				lastViewed: '',
				priority: { iconUrl: '', name: '' },
				progress: { progress: 0, total: 0 },
				project: { key: '', name: '' },
				reporter: newEmptyUser(),
				resolution: { name: '', description: '' },
				resolutiondate: '',
				status: {
					description: '',
					name: '',
					statusCategory: { colorName: '' },
				},
				summary: '',
				timeestimate: 0,
				timeoriginalestimate: 0,
				timespent: 0,
				updated: '',
				worklog: {
					worklogs: [],
				},
			},
		} as IJiraIssue)
	)

function isObject(item: any): boolean {
	return item && typeof item === 'object' && !Array.isArray(item)
}

function mergeDeep(target: any, ...sources: any[]): any {
	if (!sources.length) return target
	const source = sources.shift()

	if (isObject(target) && isObject(source)) {
		for (const key in source) {
			if (isObject(source[key])) {
				if (!target[key]) {
					Object.assign(target, {
						[key]: {},
					})
				}
				mergeDeep(target[key], source[key])
			} else {
				if (source[key]) {
					Object.assign(target, {
						[key]: source[key],
					})
				}
			}
		}
	}

	return mergeDeep(target, ...sources)
}

export function toDefaultedIssue(originalIssue: IJiraIssue): IJiraIssue {
	if (originalIssue) {
		return mergeDeep(buildEmptyIssue(), originalIssue)
	}
	return originalIssue
}
