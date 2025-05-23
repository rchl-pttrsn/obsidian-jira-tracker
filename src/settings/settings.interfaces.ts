import {
	IJiraAutocompleteDataField,
	IJiraFieldSchema,
} from '../interfaces/issueInterfaces'

export const COMPACT_SYMBOL = '-'
export const AVATAR_RESOLUTION = '16x16'
export const COMMENT_REGEX = /^\s*#/
export const JIRA_KEY_REGEX = '[A-Z][A-Z0-9_]*-[0-9]+'

export interface JiraTrackerSettings {
	account: JiraAccountSettings
	apiBasePath: string
	cacheTime: string
	searchResultsLimit: number
	cache: {
		columns: string[]
	}
	inlineIssueUrlToTag: boolean
	inlinePrefix: string
	searchColumns: ISearchColumn[]
	jiraFieldOptions: JiraFieldVisibility
	debugMode: boolean
	noteFolder?: string
	noteTemplate?: string
}

export interface JiraAccountSettings {
	alias: string
	host: string
	username?: string
	password?: string
	color: string
	cache: {
		statusColor: Record<string, string>
		customFieldsIdToName: Record<string, string>
		customFieldsNameToId: Record<string, string>
		customFieldsType: Record<string, IJiraFieldSchema>
		jqlAutocomplete: {
			fields: IJiraAutocompleteDataField[]
			functions: {
				[key: string]: [string]
			}
		}
	}
}

export enum SearchResultFormats {
	TABLE = 'TABLE',
	LIST = 'LIST',
}
export const SEARCH_RESULTS_FORMATS: Record<SearchResultFormats, string> = {
	[SearchResultFormats.TABLE]: 'Table',
	[SearchResultFormats.LIST]: 'List',
}

export enum JiraFields {
	AGGREGATE_PROGRESS = 'AGGREGATE_PROGRESS',
	AGGREGATE_TIME_ESTIMATED = 'AGGREGATE_TIME_ESTIMATED',
	AGGREGATE_TIME_ORIGINAL_ESTIMATE = 'AGGREGATE_TIME_ORIGINAL_ESTIMATE',
	AGGREGATE_TIME_SPENT = 'AGGREGATE_TIME_SPENT',
	ASSIGNEE = 'ASSIGNEE',
	COMPONENTS = 'COMPONENTS',
	CREATED = 'CREATED',
	DESCRIPTION = 'DESCRIPTION',
	DUE_DATE = 'DUE_DATE',
	ENVIRONMENT = 'ENVIRONMENT',
	FIX_VERSIONS = 'FIX_VERSIONS',
	LINKED_ISSUES = 'LINKED_ISSUES',
	KEY = 'KEY',
	LABELS = 'LABELS',
	LAST_VIEWED = 'LAST_VIEWED',
	PARENT = 'PARENT',
	PRIORITY = 'PRIORITY',
	PROGRESS = 'PROGRESS',
	PROJECT = 'PROJECT',
	REPORTER = 'REPORTER',
	RESOLUTION = 'RESOLUTION',
	RESOLUTION_DATE = 'RESOLUTION_DATE',
	STATUS = 'STATUS',
	SUMMARY = 'SUMMARY',
	TIME_ESTIMATE = 'TIME_ESTIMATE',
	TIME_ORIGINAL_ESTIMATE = 'TIME_ORIGINAL_ESTIMATE',
	TIME_SPENT = 'TIME_SPENT',
	TYPE = 'TYPE',
	UPDATED = 'UPDATED',
	CREATOR = 'CREATOR',
	SUB_TASKS = 'SUB_TASKS',
	WATCHES = 'WATCHES',
	VOTES = 'VOTES',

	// wont support
	// SECURITY = 'SECURITY',
	// WORK_RATIO = 'WORK_RATIO',
	// COMMENT = 'COMMENT',
	// ATTACHMENT = 'ATTACHMENT',
	// THUMBNAIL = 'THUMBNAIL',
	// ISSUE_RESTRICTION = 'ISSUE_RESTRICTION',
	// VERSIONS = 'VERSIONS',
	// WORKLOG = 'WORKLOG',
	CUSTOM_FIELD = 'CUSTOM_FIELD',
	NOTES = 'NOTES',
}
export const JIRA_FIELDS = {
	[JiraFields.KEY]: 'Key',
	[JiraFields.SUMMARY]: 'Summary',
	[JiraFields.DESCRIPTION]: 'Description',
	[JiraFields.TYPE]: 'Type',
	[JiraFields.CREATED]: 'Created',
	[JiraFields.UPDATED]: 'Updated',
	[JiraFields.REPORTER]: 'Reporter',
	[JiraFields.ASSIGNEE]: 'Assignee',
	[JiraFields.PRIORITY]: 'Priority',
	[JiraFields.STATUS]: 'Status',
	[JiraFields.DUE_DATE]: 'Due Date',
	[JiraFields.PARENT]: 'Parent',
	[JiraFields.RESOLUTION]: 'Resolution',
	[JiraFields.RESOLUTION_DATE]: 'Resolution Date',
	[JiraFields.PROJECT]: 'Project',
	[JiraFields.ENVIRONMENT]: 'Environment',
	[JiraFields.PROGRESS]: 'Progress',
	[JiraFields.LABELS]: 'Labels',
	[JiraFields.COMPONENTS]: 'Components',
	[JiraFields.LAST_VIEWED]: 'Last Viewed',
	[JiraFields.FIX_VERSIONS]: 'Fix Versions',
	[JiraFields.LINKED_ISSUES]: 'Linked Issues',
	[JiraFields.AGGREGATE_PROGRESS]: 'Σ Progress',
	[JiraFields.AGGREGATE_TIME_ESTIMATED]: 'Σ Remaining Estimated',
	[JiraFields.AGGREGATE_TIME_ORIGINAL_ESTIMATE]: 'Σ Original Estimate',
	[JiraFields.AGGREGATE_TIME_SPENT]: 'Σ Time Spent',
	[JiraFields.TIME_SPENT]: 'Time Spent',
	[JiraFields.TIME_ESTIMATE]: 'Remaining Estimate',
	[JiraFields.TIME_ORIGINAL_ESTIMATE]: 'Original Estimate',
	// FIX ME
	[JiraFields.CUSTOM_FIELD]: 'Custom field',
	[JiraFields.NOTES]: 'Notes',
	// coming soon
	[JiraFields.CREATOR]: 'Creator',
	[JiraFields.SUB_TASKS]: 'Sub Tasks',
	[JiraFields.WATCHES]: 'Watches',
	[JiraFields.VOTES]: 'Votes',
	// // wont support
	// [JiraFields.SECURITY]: 'Comment (Not Supported)',
	// [JiraFields.WORK_RATIO]: 'Work Ratio (Not Supported)',
	// [JiraFields.COMMENT]: 'Comment (Not Supported)',
	// [JiraFields.ATTACHMENT]: 'Attachment (Not Supported)',
	// [JiraFields.THUMBNAIL]: 'Thumbnail (Not Supported)',
	// [JiraFields.ISSUE_RESTRICTION]: 'Issue Restriction (Not Supported)',
	// [JiraFields.VERSIONS]: 'Versions (Not Supported)',
	// [JiraFields.WORKLOG]: 'Work Log (Not Supported)',
}

export interface ISearchColumn {
	type: JiraFields
	compact: boolean
	extra?: string
}

export type JiraFieldVisibility = Record<JiraFields, boolean>
