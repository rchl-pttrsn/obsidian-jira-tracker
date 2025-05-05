import { App, Editor, MarkdownView, Notice, Plugin } from 'obsidian'
import { JiraIssueSettingTab } from './settings'
import JiraClient from './client/jiraClient'
import ObjectsCache from './objectsCache'
import { ColumnsSuggest } from './suggestions/columnsSuggest'
import { CountFenceRenderer } from './rendering/countFenceRenderer'
import { InlineIssueRenderer } from './rendering/inlineIssueRenderer'
import { IssueFenceRenderer } from './rendering/issueFenceRenderer'
import { SearchFenceRenderer } from './rendering/searchFenceRenderer'
import { SearchWizardModal } from './modals/searchWizardModal'
import { ViewPluginManager } from './rendering/inlineIssueViewPlugin'
import { QuerySuggest } from './suggestions/querySuggest'
import { setupIcons } from './icons/icons'
import API from './api/api'
import { FolderSuggest } from './suggestions/contentSuggest'

export let ObsidianApp: App = null

export default class JiraIssuePlugin extends Plugin {
    private _settingTab: JiraIssueSettingTab
    private _columnsSuggest: ColumnsSuggest
    private _querySuggest: QuerySuggest
    private _inlineIssueViewPlugin: ViewPluginManager

    async onload() {
        ObsidianApp = this.app
        // TODO: Verify API features; DISABLED until then.
        // this.registerAPI()

        // Register Settings
        this._settingTab = new JiraIssueSettingTab(this.app, this)
        await this._settingTab.loadSettings()
        this.addSettingTab(this._settingTab)
        JiraClient.updateCustomFieldsCache()
        setupIcons()

        // Register Code Blocks
        this.registerMarkdownCodeBlockProcessor('jira-issue', IssueFenceRenderer)
        this.registerMarkdownCodeBlockProcessor('jira-search', SearchFenceRenderer)
        this.registerMarkdownCodeBlockProcessor('jira-count', CountFenceRenderer)

        // Register Query Suggestions
        this.app.workspace.onLayoutReady(() => {
            this._columnsSuggest = new ColumnsSuggest(this.app)
            this.registerEditorSuggest(this._columnsSuggest)
        })

        // TODO
        // this.app.workspace.onLayoutReady(() => {
        //     this._querySuggest = new QuerySuggest(this.app)
        //     this.registerEditorSuggest(this._querySuggest)
        // })

        // Reading mode inline issue rendering
        this.registerMarkdownPostProcessor(InlineIssueRenderer)

        // Render Live preview
        this._inlineIssueViewPlugin = new ViewPluginManager()
        this._inlineIssueViewPlugin.getViewPlugins().forEach(vp => this.registerEditorExtension(vp))

        // Register Settings Refresh
        this._settingTab.onChange(() => {
            ObjectsCache.clear()
            JiraClient.updateCustomFieldsCache()
            this._inlineIssueViewPlugin.update()
        })

        // Register Commands
        this.addCommand({
            id: 'obsidian-jira-tracker-clear-cache',
            name: 'Clear cache',
            callback: () => {
                ObjectsCache.clear()
                JiraClient.updateCustomFieldsCache()
                new Notice('JiraIssue: Cache cleaned')
            }
        })
        this.addCommand({
            id: 'obsidian-jira-tracker-template-fence',
            name: 'Insert issue template',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                editor.replaceRange('```jira-issue\n\n```', editor.getCursor())
            }
        })
        this.addCommand({
            id: 'obsidian-jira-search-wizard-fence',
            name: 'Search wizard',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                new SearchWizardModal(this.app, (result) => {
                    editor.replaceRange(result, editor.getCursor())
                }).open()
            }
        })
        this.addCommand({
            id: 'obsidian-jira-count-template-fence',
            name: 'Insert count template',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                editor.replaceRange('```jira-count\n\n```', editor.getCursor())
            }
        })
    }

    onunload() {
        this._settingTab = null
        this._columnsSuggest = null
        this._inlineIssueViewPlugin = null
    }

    private registerAPI() {
        // @ts-ignore
        window.$ji = API
    }
}

