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
    
    // Legacy credentials
    host?: string
    authenticationType?: EAuthenticationTypes
    username?: string
    password?: string
    bareToken?: string
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

    // %%% HIGH PRIORITY %%% 
    // "PARENT"
    // TODO: additional asignee
    // "ISSUELINKS",
    // "TIMESPENT",

    // %%% MID PRIORITY %%% 
    // "CREATOR",
    // "ENVIRONMENT",
    // "SUBTASKS"
    // "WATCHES",
    
    // %%% LOW PRIORITY %%% 
    // ATTACHMENT = 'ATTACHMENT'
    // "COMMENT",
    // "ISSUERESTRICTION",
    // "SECURITY",
    // "THUMBNAIL",
    // "TIMETRACKING",
    // "VERSIONS",
    // "VOTES",
    // "WORKLOG",
    // "WORKRATIO"

    KEY = 'KEY',
    LABELS = 'LABELS',
    LAST_VIEWED = 'LAST_VIEWED',
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


    // not a part of the search results
    DEV_STATUS = 'DEV_STATUS', //DOES NOT EXSIT!
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
    [ESearchColumnsTypes.RESOLUTION]: 'Resolution',
    [ESearchColumnsTypes.RESOLUTION_DATE]: 'Resolution Date',
    [ESearchColumnsTypes.PROJECT]: 'Project',
    [ESearchColumnsTypes.ENVIRONMENT]: 'Environment',
    [ESearchColumnsTypes.AGGREGATE_PROGRESS]: '#Progress',
    [ESearchColumnsTypes.AGGREGATE_TIME_ESTIMATED]: '#🕑Estimated',
    [ESearchColumnsTypes.AGGREGATE_TIME_ORIGINAL_ESTIMATE]: '#🕑Original Estimate',
    [ESearchColumnsTypes.AGGREGATE_TIME_SPENT]: '#🕑Spent',
    [ESearchColumnsTypes.FIX_VERSIONS]: 'Fix Versions',
    // [ESearchColumnsTypes.LINKS]: 'Links', // TODO
    [ESearchColumnsTypes.LABELS]: 'Labels',
    [ESearchColumnsTypes.COMPONENTS]: 'Components',
    [ESearchColumnsTypes.LAST_VIEWED]: 'Last Viewed',
    [ESearchColumnsTypes.PROGRESS]: 'Progress',
    // [ESearchColumnsTypes.SUBTASKS]: 'Subtasks', // TODO
    [ESearchColumnsTypes.TIME_ESTIMATE]: '🕑Estimate',
    [ESearchColumnsTypes.TIME_ORIGINAL_ESTIMATE]: '🕑Original Estimate',
    [ESearchColumnsTypes.TIME_SPENT]: '🕑Spent',
    [ESearchColumnsTypes.DEV_STATUS]: 'Dev Status',

    [ESearchColumnsTypes.CUSTOM_FIELD]: 'Custom field',
    [ESearchColumnsTypes.NOTES]: 'Notes',
}

export interface ISearchColumn {
    type: ESearchColumnsTypes
    compact: boolean
    extra?: string
}