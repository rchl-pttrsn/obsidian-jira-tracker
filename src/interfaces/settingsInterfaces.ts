import { IJiraAutocompleteDataField, IJiraFieldSchema } from "./issueInterfaces"

export enum EAuthenticationTypes {
    OPEN = 'OPEN',
    BASIC = 'BASIC',
    CLOUD = 'CLOUD',
    BEARER_TOKEN = 'BEARER_TOKEN',
}
export enum EColorSchema {
    FOLLOW_OBSIDIAN = 'FOLLOW_OBSIDIAN',
    LIGHT = 'LIGHT',
    DARK = 'DARK',
}
export const COLOR_SCHEMA_DESCRIPTION = {
    [EColorSchema.FOLLOW_OBSIDIAN]: 'Follow Obsidian',
    [EColorSchema.LIGHT]: 'Light',
    [EColorSchema.DARK]: 'Dark',
}

export const COMPACT_SYMBOL = '-'
export const AVATAR_RESOLUTION = '16x16'
export const COMMENT_REGEX = /^\s*#/
export const JIRA_KEY_REGEX = '[A-Z][A-Z0-9_]*-[0-9]+'

export interface IJiraIssueSettings {
    accounts: IJiraIssueAccountSettings[]
    apiBasePath: string
    cacheTime: string
    searchResultsLimit: number
    cache: {
        columns: string[]
    }
    colorSchema: EColorSchema
    inlineIssueUrlToTag: boolean
    inlineIssuePrefix: string
    searchColumns: ISearchColumn[]
    logRequestsResponses: boolean
    logImagesFetch: boolean
    showColorBand: boolean
    showJiraLink: boolean
    noteFolder?: string
    noteTemplate?: string
}

export interface IJiraIssueAccountSettings {
    alias: string
    host: string
    authenticationType: EAuthenticationTypes
    username?: string
    password?: string
    bareToken?: string
    priority: number
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

export enum ESearchResultsRenderingTypes {
    TABLE = 'TABLE',
    LIST = 'LIST',
}
export const SEARCH_RESULTS_RENDERING_TYPE_DESCRIPTION = {
    [ESearchResultsRenderingTypes.TABLE]: 'Table',
    [ESearchResultsRenderingTypes.LIST]: 'List',
}

export enum ESearchColumnsTypes {
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
    LINKED_ISSUES = "LINKED_ISSUES",
    KEY = 'KEY',
    LABELS = 'LABELS',
    LAST_VIEWED = 'LAST_VIEWED',
    PARENT = "PARENT",
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
    CREATOR = "CREATOR",
    SUB_TASKS = "SUB_TASKS",
    WATCHES = "WATCHES",
    ATTACHMENT = 'ATTACHMENT',
    COMMENT = "COMMENT",
    ISSUE_RESTRICTION = "ISSUE_RESTRICTION",
    SECURITY = "SECURITY",
    THUMBNAIL = "THUMBNAIL",
    TIME_TRAKING = "TIME_TRACKING",
    VERSIONS = "VERSIONS",
    VOTES = "VOTES",
    WORKLOG = "WORKLOG",
    WORK_RATIO = "WORK_RATIO",
    CUSTOM_FIELD = 'CUSTOM_FIELD',
    NOTES = 'NOTES',
}
export const SEARCH_COLUMNS_DESCRIPTION = {
    [ESearchColumnsTypes.KEY]: 'Key',
    [ESearchColumnsTypes.SUMMARY]: 'Summary',
    [ESearchColumnsTypes.DESCRIPTION]: 'Description',
    [ESearchColumnsTypes.TYPE]: 'Type',
    [ESearchColumnsTypes.CREATED]: 'Created',
    [ESearchColumnsTypes.UPDATED]: 'Updated',
    [ESearchColumnsTypes.REPORTER]: 'Reporter',
    [ESearchColumnsTypes.ASSIGNEE]: 'Assignee',
    [ESearchColumnsTypes.PRIORITY]: 'Priority',
    [ESearchColumnsTypes.STATUS]: 'Status',
    [ESearchColumnsTypes.DUE_DATE]: 'Due Date',
    [ESearchColumnsTypes.PARENT]: 'Parent',
    [ESearchColumnsTypes.RESOLUTION]: 'Resolution',
    [ESearchColumnsTypes.RESOLUTION_DATE]: 'Resolution Date',
    [ESearchColumnsTypes.PROJECT]: 'Project',
    [ESearchColumnsTypes.ENVIRONMENT]: 'Environment',
    [ESearchColumnsTypes.PROGRESS]: 'Progress',
    [ESearchColumnsTypes.LABELS]: 'Labels',
    [ESearchColumnsTypes.COMPONENTS]: 'Components',
    [ESearchColumnsTypes.LAST_VIEWED]: 'Last Viewed',
    [ESearchColumnsTypes.FIX_VERSIONS]: 'Fix Versions',
    [ESearchColumnsTypes.LINKED_ISSUES]: 'Linked Issues',
    [ESearchColumnsTypes.AGGREGATE_PROGRESS]: 'Σ Progress',
    [ESearchColumnsTypes.AGGREGATE_TIME_ESTIMATED]: 'Σ Remaining Estimated',
    [ESearchColumnsTypes.AGGREGATE_TIME_ORIGINAL_ESTIMATE]: 'Σ Original Estimate',
    [ESearchColumnsTypes.AGGREGATE_TIME_SPENT]: 'Σ Time Spent',
    [ESearchColumnsTypes.TIME_SPENT]: 'Time Spent',
    [ESearchColumnsTypes.TIME_ESTIMATE]: 'Remaining Estimate',
    [ESearchColumnsTypes.TIME_ORIGINAL_ESTIMATE]: 'Original Estimate',
    // FIX ME
    [ESearchColumnsTypes.CUSTOM_FIELD]: 'Custom field',
    [ESearchColumnsTypes.NOTES]: 'Notes',
    // coming soon
    [ESearchColumnsTypes.CREATOR]: 'Creator (Coming Soon)',
    [ESearchColumnsTypes.SUB_TASKS]: 'Sub Tasks (Coming Soon)',
    [ESearchColumnsTypes.WATCHES]: 'Watches (Coming Soon)',
    [ESearchColumnsTypes.TIME_TRAKING]: 'Time Tracking (Coming Soon)',
    [ESearchColumnsTypes.VOTES]: 'Votes (Coming Soon)',
    // wont support
    [ESearchColumnsTypes.SECURITY]: 'Comment (Not Supported)',
    [ESearchColumnsTypes.WORK_RATIO]: 'Work Ratio (Not Supported)',
    [ESearchColumnsTypes.COMMENT]: 'Comment (Not Supported)',
    [ESearchColumnsTypes.ATTACHMENT]: 'Attachment (Not Supported)',
    [ESearchColumnsTypes.THUMBNAIL]: 'Thumbnail (Not Supported)',
    [ESearchColumnsTypes.ISSUE_RESTRICTION]: 'Issue Restriction (Not Supported)',
    [ESearchColumnsTypes.VERSIONS]: 'Versions (Not Supported)',
    [ESearchColumnsTypes.WORKLOG]: 'Work Log (Not Supported)',
}

export interface ISearchColumn {
    type: ESearchColumnsTypes
    compact: boolean
    extra?: string
}