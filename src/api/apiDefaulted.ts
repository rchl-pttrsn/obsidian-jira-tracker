import { IJiraIssue, IJiraSearchResults, toDefaultedIssue } from "../interfaces/issueInterfaces"
import { JiraAccountSettings } from "../settings/settings.interfaces"
import API from "./api"

export async function getIssueDefaulted(issueKey: string, options: { fields?: string[], account?: JiraAccountSettings } = {}): Promise<IJiraIssue> {
    return toDefaultedIssue(await API.base.getIssue(issueKey, options))
}

export async function getDefaultedSearchResults(query: string, options: { limit?: number, fields?: string[], account?: JiraAccountSettings } = {}): Promise<IJiraSearchResults> {
    const searchResults = await API.base.getSearchResults(query, options)
    if (searchResults && searchResults.issues) {
        searchResults.issues = searchResults.issues.map(toDefaultedIssue)
    }
    return searchResults
}