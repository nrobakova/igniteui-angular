// tslint:disable:no-implicit-dependencies
import { EmptyTree } from "@angular-devkit/schematics";
// tslint:disable-next-line:no-submodule-imports
import { UnitTestTree } from "@angular-devkit/schematics/testing";
import * as fs from "fs";
import * as path from "path";
import { OutputChanges, SelectorChanges } from "./schema";
import { UpdateChanges } from "./UpdateChanges";

describe("UpdateChanges", () => {
    let appTree: UnitTestTree;

    class UnitUpdateChanges extends UpdateChanges {
        public getSelectorChanges() { return this.selectorChanges; }
        public getClassChanges() { return this.classChanges; }
        public getOutputChanges() { return this.outputChanges; }
    }

    beforeEach(() => {
        appTree = new UnitTestTree(new EmptyTree());
    });

    // tslint:disable:arrow-parens
    it("should replace/remove components", done => {
        const selectorsJson: SelectorChanges = {
            changes: [
                { type: "component" as any, selector: "igx-component", replaceWith: "igx-replaced" },
                { type: "component" as any, selector: "igx-remove", remove: true }
            ]
        };
        const jsonPath = path.join(__dirname, "changes", "selectors.json");
        spyOn(fs, "existsSync").and.callFake((filePath: string) => {
            if (filePath === jsonPath) {
                return true;
            }
            return false;
        });
        spyOn(fs, "readFileSync").and.returnValue(JSON.stringify(selectorsJson));

        appTree.create(
            "test.component.html",
            "<igx-component> <content> <igx-remove></igx-remove> </igx-component> <igx-remove> <content> </igx-remove>"
        );
        appTree.create(
            "test2.component.html",
            "<igx-remove attr></igx-remove><igx-component>"
        );

        const update = new UnitUpdateChanges(__dirname, appTree);
        expect(fs.existsSync).toHaveBeenCalledWith(jsonPath);
        expect(fs.readFileSync).toHaveBeenCalledWith(jsonPath, "utf-8");
        expect(update.getSelectorChanges()).toEqual(selectorsJson);

        update.applyChanges();
        expect(appTree.readContent("test.component.html")).toEqual("<igx-replaced> <content>  </igx-replaced> ");
        expect(appTree.readContent("test2.component.html")).toEqual("<igx-replaced>");
        done();
    });

    it("should replace/remove directives", done => {
        const selectorsJson: SelectorChanges = {
            changes: [
                { type: "directive" as any, selector: "igxDirective", replaceWith: "igxReplaced" },
                { type: "directive" as any, selector: "igxRemove", remove: true }
            ]
        };
        const jsonPath = path.join(__dirname, "changes", "selectors.json");
        spyOn(fs, "existsSync").and.callFake((filePath: string) => {
            if (filePath === jsonPath) {
                return true;
            }
            return false;
        });
        spyOn(fs, "readFileSync").and.returnValue(JSON.stringify(selectorsJson));

        appTree.create(
            "test.component.html",
            `<igx-component [igxDirective]="val" igxRemove> <content igxDirective [igxRemove]="val"> </igx-component>` +
            `<igx-component2 [igxRemove]='val'> <content> </igx-component2>`
        );

        const update = new UnitUpdateChanges(__dirname, appTree);
        expect(update.getSelectorChanges()).toEqual(selectorsJson);

        update.applyChanges();
        expect(appTree.readContent("test.component.html")).toEqual(
            `<igx-component [igxReplaced]="val"> <content igxReplaced> </igx-component>` +
            `<igx-component2> <content> </igx-component2>`);
        done();
    });

    it("should replace/remove outputs", done => {
        const outputJson: OutputChanges = {
            changes: [
                {
                    name: "onReplaceMe", replaceWith: "replaced",
                    owner: { type: "component" as any, selector: "comp" }
                },
                {
                    name: "onOld", remove: true,
                    owner: { type: "component" as any, selector: "another" }
                }
            ]
        };
        const jsonPath = path.join(__dirname, "changes", "outputs.json");
        spyOn(fs, "existsSync").and.callFake((filePath: string) => {
            if (filePath === jsonPath) {
                return true;
            }
            return false;
        });
        spyOn(fs, "readFileSync").and.callFake(() => JSON.stringify(outputJson));

        const fileContent = `<one (onReplaceMe)="a"> <comp\r\ntag (onReplaceMe)="dwdw" (onOld)=""> </other> <another (onOld)="b" />`;
        appTree.create("test.component.html", fileContent);

        const update = new UnitUpdateChanges(__dirname, appTree);
        expect(fs.existsSync).toHaveBeenCalledWith(jsonPath);
        expect(fs.readFileSync).toHaveBeenCalledWith(jsonPath, "utf-8");
        expect(update.getOutputChanges()).toEqual(outputJson);

        update.applyChanges();
        expect(appTree.readContent("test.component.html")).toEqual(
            `<one (onReplaceMe)="a"> <comp\r\ntag (replaced)="dwdw" (onOld)=""> </other> <another />`);

        outputJson.changes[0].owner = { type: "directive" as any, selector: "tag" };
        outputJson.changes[1].owner = { type: "directive" as any, selector: "tag" };
        appTree.overwrite("test.component.html", fileContent);
        const update2 = new UnitUpdateChanges(__dirname, appTree);
        update2.applyChanges();
        expect(appTree.readContent("test.component.html")).toEqual(
            `<one (onReplaceMe)="a"> <comp\r\ntag (replaced)="dwdw"> </other> <another (onOld)="b" />`);
        done();
    });
});
