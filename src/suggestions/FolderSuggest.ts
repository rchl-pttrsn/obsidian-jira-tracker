import { AbstractInputSuggest, App, SearchResult, prepareFuzzySearch } from "obsidian";


/*
 * Class that can be added to an existing inputElement to add suggestions.
 * It needs an implementation of `getContent` to provide the set of things to suggest from
 * By default it does a FuzzySearch over these: this can be changed to a simple search
 * by overriding `getSuggestions`
 * `targetMatch` is a regex that finds the part of the input to use as a search term
 * It should provide two groups: the first one is left alone, the second one is the
 * search term, and is replaced by the result of the suggestions. By default, it's
 * a comma separator.
 * 
 */
abstract class AddTextSuggest extends AbstractInputSuggest<string> {
    content: string[];
    targetMatch = /^(.*),\s*([^,]*)/


    constructor(private inputEl: HTMLInputElement, app: App, private onSelectCb: (value: string) => void = (v)=>{}) {
        super(app, inputEl);
        this.content = this.getContent();
    }
    getContent() {
        return this.app.vault.getAllFolders().map(({path})=> path)
    }

    getSuggestions(inputStr: string): string[] {
		// const target = this.getParts(inputStr)[1];
        // const m = target.match(/\s*\[\[(.*)/);
        // if( ! m || m.length < 2 || m[1].length < 1) return []
        // //console.log(m)
        // const newTarget = m[1]
        // //console.log("Got newTarget ",newTarget," from  ",target)
		// return this.doFuzzySearch(newTarget)
		return this.doFuzzySearch(this.getParts(inputStr)[1]);

    }
    
    /*
     * Returns the bit at the beginning to ignore [0] and the target bit [1]
     */
    getParts(input:string) : [string,string] {
        const m = input.match(this.targetMatch)
        if(m) {
            return [m[1],m[2]]
        } else {
            return ["",input]
        }
    }

    // doSimpleSearch(target:string) : string[] {
    //     if( ! target || target.length < 2 ) return []
    //     //fuzzySearch
    //     const lowerCaseInputStr = target.toLocaleLowerCase();
    //     const t = this.content.filter((content) =>
    //         content.toLocaleLowerCase().contains(lowerCaseInputStr)
    //     );
    //     return t
    // }

    doFuzzySearch(target:string,maxResults=20,minScore=-2) : string[] {
        if( ! target || target.length < 2 ) return this.content;
        const fuzzy = prepareFuzzySearch(target)
        const matches:[string,SearchResult][] = this.content.map((c)=>[c,fuzzy(c)])
        const goodMatches = matches.filter((i)=>(i[1] && i[1]['score'] > minScore))
        goodMatches.sort((c)=>c[1]['score'])
        const ret = goodMatches.map((c)=>c[0])
        return ret.slice(0,maxResults)
    }

    renderSuggestion(content: string, el: HTMLElement): void {
        el.setText(content);
    }

    selectSuggestion(content: string, evt: MouseEvent | KeyboardEvent): void {
        let [head,tail] = this.getParts(this.inputEl.value)
        //console.log(`Got '${head}','${tail}' from `, this.inputEl.value)
        if( head.length > 0 ) {
            this.onSelectCb(head + ", "+content);
            this.inputEl.value = head + ", " +this.wrapContent(content)
        }
        else {
            this.onSelectCb(content);
            this.inputEl.value = this.wrapContent(content) 
        }
        this.inputEl.dispatchEvent(new Event("change"))
        this.inputEl.setSelectionRange(0, 1)
        this.inputEl.setSelectionRange(this.inputEl.value.length,this.inputEl.value.length)
        this.inputEl.focus()
        this.close();
    }

    wrapContent(content:string):string {
        return content
    }
}

export class FolderSuggest extends AddTextSuggest {
	getContent() {
        return this.app.vault.getAllFolders().map(({path})=> path)
    }
}

export class FileSuggest extends AddTextSuggest {
	getContent() {
        return this.app.vault.getFiles().filter((f)=>f.extension === "md").map((f)=>f.basename)
    }
    
    // wrapContent(content:string):string {
    //     return `[[${content}]]`
    // }
}