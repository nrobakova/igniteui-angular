// generate schema:
// npx typescript-json-schema migrations/common/selectors-schema.ts SelectorChanges -o migrations/common/selectors.schema.json --required

// tslint:disable:interface-name
export interface SelectorChanges {
    /** An array of changes to component/directive selectors */
    changes: SelectorChange[];
}

export interface SelectorChange {
    /** Type of selector the change applies to - either component or directive */
    type: ChangeType;
    /** Original selector to apply change to */
    selector: string;
    /** Replace original selector with new one */
    replaceWith?: string;
    /** Remove directive/component */
    remove?: boolean;
}

enum ChangeType {
    directive = "directive",
    component = "component"
}
