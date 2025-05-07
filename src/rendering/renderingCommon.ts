import { FrontMatterCache, TFile, TFolder } from "obsidian"
import { IJiraIssue } from "../interfaces/issueInterfaces"
import { EColorSchema, IJiraIssueAccountSettings } from "../interfaces/settingsInterfaces"
import { ObsidianApp } from "../main"
import { SearchView } from "../searchView"
import { SettingsData } from "../settings"

export const JIRA_STATUS_COLOR_MAP: Record<string, string> = {
    'blue-gray': 'is-info',
    'yellow': 'is-warning',
    'green': 'is-success',
    'red': 'is-danger',
    'medium-gray': 'is-dark',
}

export const JIRA_STATUS_COLOR_MAP_BY_NAME: Record<string, string> = {
    'New': 'is-dark',
    'Planning': 'is-dark',
    'To Do': 'is-dark',
    'In Progress': 'is-info',
    'Code Review': 'is-info',
    'Review': 'is-info',
    'Dev Complete': 'is-info',
    'Testing': 'is-info',
    'Release Pending': 'is-success',
    'Closed': 'is-success'
}

export default {
    issueUrl(account: IJiraIssueAccountSettings, issueKey: string): string {
        try {
            return (new URL(`${account.host}/browse/${issueKey}`)).toString()
        } catch (e) { return '' }
    },

    searchUrl(account: IJiraIssueAccountSettings, searchQuery: string): string {
        try {
            return (new URL(`${account.host}/issues/?jql=${searchQuery}`)).toString()
        } catch (e) { return '' }
    },

    getNotes(): TFile[] {
        return ObsidianApp.vault.getMarkdownFiles()
    },

    getFrontMatter(file: TFile): FrontMatterCache {
        return ObsidianApp.metadataCache.getFileCache(file).frontmatter
    },

    readNote(file: any): Promise<string> {
        return ObsidianApp.vault.read(file)
    },

    createNote(path: string, contents: string): Promise<TFile> {
        return ObsidianApp.vault.create(path, contents)
    },

    createFolder(path: string): Promise<TFolder> {
        return ObsidianApp.vault.createFolder(path);
    },

    getAbstractFileByPath(path: string){
        return ObsidianApp.vault.getAbstractFileByPath(path);
    },

    renderContainer(children: HTMLElement[]): HTMLElement {
        const container = createDiv({ cls: 'jira-issue-container' })
        for (const child of children) {
            container.appendChild(child)
        }
        return container
    },

    renderLoadingItem(item: string, inline = false): HTMLElement {
        let tagsRow
        if (inline) {
            tagsRow = createSpan({ cls: 'ji-tags has-addons' })
        } else {
            tagsRow = createDiv({ cls: 'ji-tags has-addons' })
        }
        createSpan({ cls: 'spinner', parent: createSpan({ cls: `ji-tag`, parent: tagsRow }) })
        createEl('a', { cls: `ji-tag is-link`, text: item, parent: tagsRow })
        createSpan({ cls: `ji-tag`, text: 'Loading ...', parent: tagsRow })
        return tagsRow
    },

    renderSearchError(el: HTMLElement, message: string, searchView: SearchView): void {
        const tagsRow = createDiv('ji-tags has-addons')
        createSpan({ cls: 'ji-tag is-delete is-danger', parent: tagsRow })
        if (searchView) {
            createSpan({ cls: `ji-tag is-danger`, text: "Search error", parent: tagsRow })
        } else {
            createSpan({ cls: `ji-tag is-danger`, text: "Search error", parent: tagsRow })
        }
        createSpan({ cls: 'ji-tag is-danger', text: message, parent: tagsRow })
        el.replaceChildren(this.renderContainer([tagsRow]))
    },

    renderIssue(issue: IJiraIssue, compact = false): HTMLElement {
        const tagsRow = createDiv('ji-tags has-addons')
        createSpan({ cls: `ji-tag ji-band`, attr: { style: `background-color: ${issue.account.color}` }, title: issue.account.alias, parent: tagsRow })
        if (issue.fields.issuetype.iconUrl) {
            createEl('img', {
                cls: 'fit-content',
                attr: { src: issue.fields.issuetype.iconUrl, alt: issue.fields.issuetype.name },
                title: issue.fields.issuetype.name,
                parent: createSpan({ cls: `ji-tag ji-sm-tag`, parent: tagsRow })
            })
        }
        createEl('a', { cls: `ji-tag is-link no-wrap`, href: this.issueUrl(issue.account, issue.key), title: this.issueUrl(issue.account, issue.key), text: issue.key, parent: tagsRow })
        if (!compact) {
            createSpan({ cls: `ji-tag issue-summary`, text: issue.fields.summary, parent: tagsRow })
        }
        const statusColor = JIRA_STATUS_COLOR_MAP_BY_NAME[issue.fields.status.name] ||
            JIRA_STATUS_COLOR_MAP[issue.fields.status.statusCategory.colorName] ||
            'is-light'
        createSpan({ cls: `ji-tag no-wrap ${statusColor}`, text: issue.fields.status.name, title: issue.fields.status.description, attr: { 'data-status': issue.fields.status.name }, parent: tagsRow })
        return tagsRow
    },

    renderIssueError(issueKey: string, message: string): HTMLElement {
        const tagsRow = createDiv('ji-tags has-addons')
        createSpan({ cls: 'ji-tag is-delete is-danger', parent: tagsRow })
        createSpan({ cls: 'ji-tag is-danger is-light', text: issueKey, parent: tagsRow })
        createSpan({ cls: 'ji-tag is-danger', text: message, parent: tagsRow })
        return tagsRow
    },
}
