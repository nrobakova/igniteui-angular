// tslint:disable-next-line:no-implicit-dependencies
import { FileEntry, SchematicContext, Tree } from "@angular-devkit/schematics";

import * as fs from "fs";
import * as path from "path";
import { SelectorChange, SelectorChanges } from "./selectors-schema";

// tslint:disable:arrow-parens
export class UpdateChanges {

    protected configPaths = ["/.angular.json", "/angular.json"];
    protected sourcePaths = ["./src"];

    private selectorChanges: SelectorChanges;

    private _templateFiles: FileEntry[] = [];
    public get templateFiles(): FileEntry[] {
        if (!this._templateFiles.length) {
            for (const sourcePath of this.sourcePaths) {
                // https://github.com/angular/devkit/blob/master/packages/angular_devkit/schematics/src/tree/filesystem.ts
                const srcDir = this.host.getDir(sourcePath);
                srcDir.visit((fulPath, entry) => {
                    if (fulPath.endsWith("component.html")) {
                        this._templateFiles.push(entry);
                    }
                });
            }
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
        this.updateSourceDirs();
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

    /**
     * name
     */
    protected updateSourceDirs() {
        let config /*: CliConfig*/; // requires @schematics/angular
        const configPath = this.configPaths.find(x => this.host.exists(x));

        if (configPath) {
            config = JSON.parse(this.host.read(configPath).toString());
            // TODO: Multi-project support
            this.sourcePaths = this.getProjectPaths(config);
          } else {
            this.context.logger.warn("Couldn't find angular.json. This may take slightly longer to search all files.");
            this.sourcePaths = this.host.root.subdirs.filter(x => x.indexOf("node_modules") !== -1);
          }
    }

    private getProjectPaths(config /*: CliConfig*/): string[] {
        const sourceDirs = [];
        let globalPrefix;

        if (config.schematics && config.schematics["@schematics/angular:component"]) {
            // updated projects have global prefix rather than per-project:
            globalPrefix = config.schematics["@schematics/angular:component"].prefix;
        }

        for (const projName of Object.keys(config.projects)) {
            const proj = config.projects[projName];
            if (proj.architect && proj.architect.e2e) {
                // filter out e2e apps
                continue;
            }
            let sourcePath = proj.sourceRoot;
            if (proj.prefix || globalPrefix) {
                sourcePath = path.join(sourcePath, proj.prefix || globalPrefix);
            }
            sourceDirs.push(sourcePath);
        }
        return sourceDirs;
    }
}
