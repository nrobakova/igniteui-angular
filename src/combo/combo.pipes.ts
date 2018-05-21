import { Pipe, PipeTransform } from "@angular/core";
import { cloneArray } from "../core/utils";
import { DataUtil } from "../data-operations/data-util";
import { FilteringLogic, IFilteringExpression } from "../data-operations/filtering-expression.interface";
import { IgxComboComponent } from "../main";

@Pipe({
    name: "comboFiltering",
    pure: true
})
export class IgxComboFilteringPipe implements PipeTransform {

    constructor() { }

    public transform(collection: any[], expressions: IFilteringExpression | IFilteringExpression[],
        logic: FilteringLogic, caller: IgxComboComponent, pipeTrigger: number) {
        const state = { expressions: [], logic };
        state.expressions = caller.filteringExpressions;

        if (!state.expressions.length) {
            return collection;
        }

        const result = DataUtil.filter(cloneArray(collection), state);
        caller.filteredData = result;
        return result;
    }
}

@Pipe({
    name: "filterCondition",
    pure: true
})

export class IgxComboFilterConditionPipe implements PipeTransform {

    public transform(value: string): string {
        return value.split(/(?=[A-Z])/).join(" ");
    }
}
