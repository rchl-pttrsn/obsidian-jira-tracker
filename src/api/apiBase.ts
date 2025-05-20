import { ESprintState, IJiraBoard, IJiraIssue, IJiraSearchResults, IJiraSprint, IJiraUser } from "../interfaces/issueInterfaces"
import { JiraAccountSettings } from "../settings/settings.interfaces"
import ObjectsCache from "../objectsCache"
import JiraClient from "../client/jiraClient"

type InferArgs<T> = T extends (...t: [...infer Arg]) => any ? Arg : never
type InferReturn<T> = T extends (...t: [...infer Arg]) => infer Res ? Res : never

function cacheWrapper<TFunc extends (...args: any[]) => any>(func: TFunc)
    : (...args: InferArgs<TFunc>) => InferReturn<TFunc> {
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

export async function getIssue(issueKey: string, options: { fields?: string[], account?: JiraAccountSettings } = {}): Promise<IJiraIssue> {
    return cacheWrapper(JiraClient.getIssue)(issueKey, options)
}

export async function getSearchResults(query: string, options: { limit?: number, offset?: number, fields?: string[], account?: JiraAccountSettings } = {}): Promise<IJiraSearchResults> {
    return cacheWrapper(JiraClient.getSearchResults)(query, options)
}

export async function getBoards(projectKeyOrId: string, options: { limit?: number, offset?: number, account?: JiraAccountSettings } = {}): Promise<IJiraBoard[]> {
    return cacheWrapper(JiraClient.getBoards)(projectKeyOrId, options)
}

export async function getSprint(sprintId: number, options: { account?: JiraAccountSettings } = {}): Promise<IJiraSprint> {
    return cacheWrapper(JiraClient.getSprint)(sprintId, options)
}

export async function getSprints(boardId: number, options: { limit?: number, offset?: number, state?: ESprintState[], account?: JiraAccountSettings } = {}): Promise<IJiraSprint[]> {
    return cacheWrapper(JiraClient.getSprints)(boardId, options)
}

export async function getLoggedUser(account: JiraAccountSettings = null): Promise<IJiraUser> {
    return cacheWrapper(JiraClient.getLoggedUser)(account)
}
