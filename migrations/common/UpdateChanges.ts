// tslint:disable-next-line:no-implicit-dependencies
import { FileEntry, SchematicContext, Tree } from "@angular-devkit/schematics";

import * as fs from "fs";
import * as path from "path";
import { SelectorChange, SelectorChanges } from "./selectors-schema";

// tslint:disable:arrow-parens
export class UpdateChanges {
    private selectorChanges: SelectorChanges;

    private _templateFiles: FileEntry[] = [];
    public get templateFiles(): FileEntry[] {
        if (!this._templateFiles.length) {
            // https://github.com/angular/devkit/blob/master/packages/angular_devkit/schematics/src/tree/filesystem.ts
            this.host.visit((fulPath, entry) => {
                if (fulPath.endsWith("component.html")) {
                    this._templateFiles.push(entry);
                }
            });
        }
        return this._templateFiles;
    }

    /**
     * Create a new base schematic to apply changes
     * @param rootPath Root folder for the schematic to read configs, pass __dirname
     */
    constructor(private rootPath: string, private host: Tree, private context: SchematicContext) {
        this.selectorChanges = JSON.parse(
            fs.readFileSync(path.join(this.rootPath, "changes", "selectors.json"), "utf-8")
        );
    }

    /** Apply configured changes to the Host Tree */
    public applyChanges() {
        if (this.selectorChanges.changes.length) {
            for (const entry of this.templateFiles) {
                this.updateSelectors(entry);
            }
        }
    }

    protected updateSelectors(entry: FileEntry) {
        let fileContent = entry.content.toString();
        let overwrite = false;
        for (const change of this.selectorChanges.changes) {
            let searchPttrn = change.type === "component" ? "<" : "";
            searchPttrn += change.selector;
            if (fileContent.indexOf(searchPttrn) !== -1) {
                fileContent = this.applySelectorChange(fileContent, change);
                overwrite = true;
            }
        }
        if (overwrite) {
            this.host.overwrite(entry.path, fileContent);
        }
    }

    protected applySelectorChange(fileContent: string, change: SelectorChange): string {
        let regSource: string;
        let replace: string;
        switch (change.type) {
            case "component":
                if (change.remove) {
                    regSource = String.raw`\<${change.selector}[\s\S]*\<\/${change.selector}\>`;
                    replace = "";
                } else {
                    regSource = String.raw`\<(\/?)${change.selector}`;
                    replace = `<$1${change.replaceWith}`;
                }
                break;
            case "directive":
                if (change.remove) {
                    regSource = String.raw`\s*?\[?${change.selector}\]?=(["']).*?\1(?=\s|\>)`;
                    replace = "";
                } else {
                    regSource = change.selector;
                    replace = change.replaceWith;
                }
                break;
            default:
                break;
        }
        fileContent = fileContent.replace(new RegExp(regSource, "g"), replace);
        return fileContent;
    }
}
