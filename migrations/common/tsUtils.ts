// tslint:disable-next-line:no-implicit-dependencies
import * as ts from "typescript";

/** Returns an source file */
// export function getFileSource(sourceText: string): ts.SourceFile {
//     return ts.createSourceFile("", sourceText, ts.ScriptTarget.Latest, true);
// }

export function getIdentifierPositions(sourceText: string, name: string): Array<{start: number, end: number}> {
    const source = ts.createSourceFile("", sourceText, ts.ScriptTarget.Latest, true);
    const positions = [];

    const checkIdentifier = (node: ts.Node): boolean => {
        if (node.kind !== ts.SyntaxKind.Identifier || !node.parent) {
            return false;
        }
        if (node.parent.kind === ts.SyntaxKind.PropertyDeclaration) {
            return false;
        }
        if (node.parent.kind === ts.SyntaxKind.PropertyAssignment ||
            node.parent.kind === ts.SyntaxKind.PropertySignature) {
            // make sure it's not prop assign  `= { IgxClass: "fake"}`
            //                  definition `prop: { IgxClass: string; }`
            //                                     name: initializer
           const propAssign: ts.PropertyAssignment | ts.PropertySignature = node.parent as ts.PropertyAssignment | ts.PropertySignature;
           if (propAssign.name.getText() === name) {
               return false;
           }
        }
        return (node as ts.Identifier).text === name;
    };

    const findIdentifiers = (node: ts.Node) => {
        if (checkIdentifier(node)) {
            // Use `.getStart()` as node.pos includes the space(s) before the identifier text
            positions.push({ start: node.getStart(), end: node.end });
        }
        ts.forEachChild(node, findIdentifiers);
    };
    source.forEachChild(findIdentifiers);
    return positions;
}
