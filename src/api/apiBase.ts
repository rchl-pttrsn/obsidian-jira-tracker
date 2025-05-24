import {
	JiraIssue,
	JiraSearchResults,
	JiraAgileApi,
} from '../client/jira.models'
import ObjectsCache from '../objectsCache'
import JiraClient from '../client/jiraClient'
import { SettingsData } from 'src/settings'

type InferArgs<T> = T extends (...t: [...infer Arg]) => any ? Arg : never
type InferReturn<T> = T extends (...t: [...infer Arg]) => infer Res
	? Res
	: never

function cacheWrapper<TFunc extends (...args: any[]) => any>(
	func: TFunc
): (...args: InferArgs<TFunc>) => InferReturn<TFunc> {
	return (...args: InferArgs<TFunc>) => {
		const cacheKey = `api-${func.name}-${JSON.stringify(args)}`
		const cacheVal = ObjectsCache.get(cacheKey)
		if (cacheVal) {
			return cacheVal.data
		}
		const returnValue = func(...args)
		ObjectsCache.add(cacheKey, returnValue)
		return returnValue
	}
}

export async function getIssue(
	issueKey: string,
	options: { fields?: string[] } = {}
): Promise<JiraIssue> {
	return cacheWrapper(JiraClient.getIssue)(issueKey, options)
}

export async function getSearchResults(
	query: string,
	options: { limit?: number; offset?: number; fields?: string[] } = {}
): Promise<JiraSearchResults> {
	return cacheWrapper(JiraClient.getSearchResults)(SettingsData.account, query, options)
}

export async function getBoards(
	projectKeyOrId: string,
	options: { limit?: number; offset?: number } = {}
): Promise<JiraAgileApi.Board[]> {
	return cacheWrapper(JiraClient.getBoards)(projectKeyOrId, options)
}

export async function getSprint(sprintId: number): Promise<JiraAgileApi.Sprint> {
	return cacheWrapper(JiraClient.getSprint)(sprintId)
}

export async function getSprints(
	boardId: number,
	options: { limit?: number; offset?: number; state?: JiraAgileApi.SprintState[] } = {}
): Promise<JiraAgileApi.Sprint[]> {
	return cacheWrapper(JiraClient.getSprints)(boardId, options)
}
