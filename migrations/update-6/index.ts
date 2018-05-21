import * as path from "path";

// tslint:disable:no-implicit-dependencies
import { normalize } from "@angular-devkit/core";
import {
  chain,
  FileEntry,
  filter,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree
} from "@angular-devkit/schematics";
import { UpdateChanges } from "../common/UpdateChanges";

export default function(): Rule {
  return (host: Tree, context: SchematicContext) => {
    // let config /*: CliConfig*/; // requires @schematics/angular
    // // tslint:disable-next-line:arrow-parens
    // const configPath = ["/.angular.json", "/angular.json"].find(x => host.exists(x));
    // let sourcePath = "./src";
    // const templateFiles: FileEntry[] = [];

    // if (configPath) {
    //   config = JSON.parse(host.read(configPath).toString());
    //   // TODO: Multi-project support
    //   sourcePath = path.join("/", config.projects[config.defaultProject].sourceRoot);
    //   if (config.schematics && config.schematics["@schematics/angular:component"]) {
    //     sourcePath = path.join(sourcePath, config.schematics["@schematics/angular:component"].prefix);
    //   }
    // } else {
    //   context.logger.warn("Couldn't find angular.json. This may take slightly longer to search all files.");
    // }

    // // https://github.com/angular/devkit/blob/master/packages/angular_devkit/schematics/src/tree/filesystem.ts
    // const srcDir = host.getDir(sourcePath);
    // srcDir.visit((fulPath, entry) => {
    //   if (fulPath.endsWith("component.html")) {
    //     templateFiles.push(entry);
    //   }
    // });

    // // tslint:disable-next-line:arrow-parens
    // // const pathFragments = srcDir.subfiles.filter(x => x.endsWith("component.html"));
    // for (const entry of templateFiles) {
    //     let fileContent = entry.content.toString();
    //     if (fileContent.indexOf("<igx-tab-bar") !== -1 || fileContent.indexOf("igxForRemote") !== -1) {
    //         fileContent = fileContent.replace(/\<(\/?)igx-tab-bar/g, "<$1igx-bottom-nav");
    //         fileContent = fileContent.replace(/\s*?\[?igxForRemote\]?=(["']).*?\1(?=\s|\>)/g, ""); // delete
    //         host.overwrite(entry.path, fileContent);

    //         // TODO
    //         const attr = "igxForRemote";
    //         const regSource = String.raw`\[?${attr}\]?=(["']).*?\1(?=\s|\>)`;
    //     }
    // }

    const update = new UpdateChanges(__dirname, host, context);
    update.applyChanges();

    // if (typeof config !== "object" || Array.isArray(config) || config === null) {
    //   throw new SchematicsException("Invalid angular-cli.json configuration; expected an object.");
    // }

    // return host;
    // return chain([
    //   filter((x) => x.endsWith("component.html")),
    //   // tslint:disable-next-line:no-shadowed-variable
    //   (host: Tree, context: SchematicContext) => {
    //     const templates = (host as any).files;
    //     // tslint:disable-next-line:no-debugger
    //     debugger;
    //     context.logger.warn(`Updating html tempalte files.`);
    //     return host;
    //   }
    // ])(host, context);
  };
}
