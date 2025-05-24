import { components } from 'src/client/jira.schema'
import { JiraAccountSettings } from '../settings/settings.models'

// foundational api: https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/#about
// Jira API types related to Jira schema or API responses
export namespace JiraApi {
	export type Fields = components['schemas']['Fields']
	export type FieldDetails = components['schemas']['FieldDetails']
	export type Issue = components['schemas']['IssueBean']
	export type IssueLink = components['schemas']['IssueLink']
	export type User = components['schemas']['UserDetails']
	export type Worklog = components['schemas']['Worklog']
	export type Component = components['schemas']['ComponentJsonBean']
	export type Schema = components['schemas']['JsonTypeBean']
	export type Version = components['schemas']['Version']
	export type IssueType = components['schemas']['IssueTypeDetails'] & { iconUrl?: string }
	export type Project = components['schemas']['ProjectDetails']
	export type Resolution = components['schemas']['Resolution']
	export type StatusCategory = components['schemas']['StatusCategory']
	export type Votes = components['schemas']['Votes']
	export type Watchers = components['schemas']['Watchers']
	export type SearchResults = components['schemas']['SearchAndReconcileResults']
	export type Progress = { readonly progress: number; readonly total: number }
}

// software development api add ons: https://developer.atlassian.com/cloud/jira/software/rest/intro/#introduction
export namespace JiraAgileApi {
	export interface Board {
		id: number
		name: string
		type: string
	}

	export interface Sprint {
		id: number
		state: SprintState
		name: string
		startDate: string
		endDate: string
		completeDate: string
		activatedDate: string
		originBoardId: number
		goal: string
	}

	export enum SprintState {
		CLOSED = 'closed',
		ACTIVE = 'active',
		FUTURE = 'future',
	}
}
export type JiraIssue = JiraApi.Issue & {
	readonly fields: JiraSearchField
}

export type JiraSearchResults = JiraApi.SearchResults & {
	issues: JiraIssue[]
	total: number
}



type JiraSearchField = JiraApi.Fields & {
	[key: string]: unknown
	readonly aggregateprogress?: JiraApi.Progress
	readonly aggregatetimeestimate?: number
	readonly aggregatetimeoriginalestimate?: number
	readonly aggregatetimespent?: number
	readonly components?: JiraApi.Component[]
	readonly created?: string
	readonly creator?: JiraApi.User
	readonly description?: string
	readonly duedate?: string
	readonly environment?: string
	readonly fixVersions?: JiraApi.Version[]
	readonly issuelinks?: JiraApi.IssueLink[]
	readonly issuetype?: JiraApi.IssueType
	readonly labels?: string[]
	readonly lastViewed?: string
	readonly parent?: JiraIssue
	readonly progress?: JiraApi.Progress
	readonly project?: JiraApi.Project
	readonly reporter?: JiraApi.User
	readonly resolution?: JiraApi.Resolution
	readonly resolutiondate?: string
	readonly statusCategory?: JiraApi.StatusCategory
	readonly subtasks?: JiraIssue[]
	readonly timeestimate?: number
	readonly timeoriginalestimate?: number
	readonly timespent?: number
	readonly updated?: string
	readonly versions?: JiraApi.Version[]
	readonly votes?: JiraApi.Votes
	readonly watches?: JiraApi.Watchers
	readonly worklog?: {
		worklogs: JiraApi.Worklog[]
	}
}

const JIRA_USER_TEMPLATE = (): JiraApi.User => {
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

const JIRA_ISSUE_TEMPLATE = (): JiraIssue =>
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
				assignee: JIRA_USER_TEMPLATE(),
				components: [],
				created: '',
				creator: JIRA_USER_TEMPLATE(),
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
				reporter: JIRA_USER_TEMPLATE(),
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
		})
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

export function toDefaultedIssue(originalIssue: JiraIssue): JiraIssue {
	if (originalIssue) {
		return mergeDeep(JIRA_ISSUE_TEMPLATE(), originalIssue)
	}
	return originalIssue
}
