import { CommonModule } from "@angular/common";
import {
    ChangeDetectorRef, Component, ContentChild,
    ElementRef, EventEmitter, HostBinding, HostListener, Input, NgModule, OnDestroy, OnInit, Output, TemplateRef, ViewChild
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IgxSelectionAPIService } from "../core/selection";
import { cloneArray } from "../core/utils";
import { STRING_FILTERS } from "../data-operations/filtering-condition";
import { FilteringLogic, IFilteringExpression } from "../data-operations/filtering-expression.interface";
import { IgxRippleModule } from "../directives/ripple/ripple.directive";
import { IgxDropDownItemComponent } from "../drop-down/drop-down-item.component";
import { IgxDropDownComponent, IgxDropDownModule } from "../drop-down/drop-down.component";
import { IgxInputGroupComponent, IgxInputGroupModule } from "../input-group/input-group.component";
import { IgxComboFilterConditionPipe, IgxComboFilteringPipe} from "./combo.pipes";

export enum DataTypes {
    EMPTY = "empty",
    PRIMITIVE = "primitive",
    COMPLEX = "complex",
    PRIMARYKEY = "primaryKey"
}
@Component({
    selector: "igx-combo",
    templateUrl: "combo.component.html"
})
export class IgxComboComponent implements OnInit, OnDestroy {

    protected _filteringLogic = FilteringLogic.And;
    protected _pipeTrigger = 0;
    protected _filteringExpressions = [];
    private _dataType = "";
    private _filteredData = [];
    private _dropdownVisible = false;
    public value = "";

    @ViewChild(IgxDropDownComponent, { read: IgxDropDownComponent })
    public dropDown: IgxDropDownComponent;

    @ViewChild(IgxInputGroupComponent, { read: IgxInputGroupComponent })
    public inputGroup: IgxInputGroupComponent;

    @ViewChild("primitive", { read: TemplateRef })
    protected primitiveTemplate: TemplateRef<any>;

    @ViewChild("complex", { read: TemplateRef })
    protected complexTemplate: TemplateRef<any>;

    @ViewChild("empty", { read: TemplateRef })
    protected emptyTemplate: TemplateRef<any>;

    @ContentChild("dropdownHeader", { read: TemplateRef })
    public dropdownHeader: TemplateRef<any>;

    @ContentChild("dropdownFooter", { read: TemplateRef })
    public dropdownFooter: TemplateRef<any>;

    @ContentChild("dropdownItemTemplate", { read: TemplateRef })
    public dropdownItemTemplate: TemplateRef<any>;

    @Input()
    public evalDisabled: (args) => boolean;

    @Input()
    public data;

    @Input()
    public filteringLogic = FilteringLogic.And;

    @Input()
    get filteringExpressions() {
        return this._filteringExpressions;
    }

    set filteringExpressions(value) {
        this._filteringExpressions = cloneArray(value);
        this.cdr.markForCheck();
    }

    get caller() {
        return this;
    }

    get pipeTrigger(): number {
        return this._pipeTrigger;
    }

    @Input()
    public filterable;

    @Input()
    public placeholder;

    @HostBinding("style.width")
    @Input()
    public width;

    @Input()
    public groupKey;

    @Input()
    public primaryKey;

    @Output()
    public onDropDownOpen = new EventEmitter<IComboDropDownOpenEventArgs>();

    @Output()
    public onDropDownClosed = new EventEmitter<IComboDropDownClosedEventArgs>();

    @Output()
    public onSelectionChange = new EventEmitter<IComboSelectionChangeEventArgs>();

    constructor(
        public selectionApi: IgxSelectionAPIService,
        public cdr: ChangeDetectorRef,
        private element: ElementRef) { }

    public ngOnInit() {
        this._dataType = this.getDataType();
        this._filteredData = this.data;
        this.dropDown.onOpened.subscribe(() => {
            this._dropdownVisible = true;
        });
        this.dropDown.onClosed.subscribe(() => {
            this._dropdownVisible = false;
        });
    }

    public ngOnDestroy() {

    }

    protected prepare_filtering_expression(searchVal, condition, ignoreCase, fieldName?) {
        if (fieldName !== undefined) {
            return [{ fieldName, searchVal, condition, ignoreCase }];
        }
        return [{ searchVal, condition, ignoreCase }];
    }

    public filter(term, condition, ignoreCase, primaryKey?) {
        this.filteringExpressions = this.prepare_filtering_expression(term, condition, ignoreCase, primaryKey);
    }

    public get displayedData() {
        // if (this.filterable) {
        //     return this._filteredData;
        // }
        return this.data;
    }
    public hanldeKeyDown(evt) {
        if (this.filterable) {
            this.filter(evt.target.value, STRING_FILTERS.contains,
                true, this.getDataType() === DataTypes.PRIMITIVE ? undefined : this.primaryKey);
        }
    }

    public onSelection(event) {
        if (event.newSelection) {
            if (event.newSelection !== event.oldSelection) {
                this.value = this.getData();
                this.inputGroup.isFilled = true;
            }
        }
    }

    public toggleDropDown(event, state?) {
        if (state !== undefined) {
            if (state) {
                this.dropDown.open();
                this.inputGroup.isFilled = true;
            }
        }
    }

    public getDataType(): string {
        if (!this.data || !this.data.length) {
            return DataTypes.EMPTY;
        }
        if (typeof this.data[0] === "object") {
            return DataTypes.COMPLEX;
        }
        return DataTypes.PRIMITIVE;
    }

    public get template(): TemplateRef<any> {
        this._dataType = this.getDataType();
        if (!this.displayedData || !this.displayedData.length) {
            return this.emptyTemplate;
        }
        if (this.dropdownItemTemplate) {
            return this.dropdownItemTemplate;
        }
        if (this._dataType === DataTypes.COMPLEX) {
            return this.complexTemplate;
        }
        return this.primitiveTemplate;
    }

    public get context(): any {
        return {
            $implicit: this
        };
    }

    public get filteredData(): any[] {
        return this._filteredData;
    }

    public set filteredData(val: any[]) {
        this._filteredData = val;
    }

    private getDataByType(dataObj) {
        if (this._dataType === DataTypes.PRIMITIVE || this._dataType === DataTypes.EMPTY) {
            return dataObj;
        }
        if (this._dataType === DataTypes.PRIMARYKEY || this._dataType === DataTypes.COMPLEX) {
            return dataObj[this.primaryKey];
        }
    }
    private getCurrentSelected() {
        return this.dropDown.selectedItem.index;
    }
    private getData(): any {
        return this.getDataByType(this._filteredData[this.getCurrentSelected()]);
    }
}

export interface IComboDropDownOpenEventArgs {
    event?: Event;
}

export interface IComboDropDownClosedEventArgs {
    event?: Event;
}

export interface IComboSelectionChangeEventArgs {
    oldSelection: any[];
    newSelection: any[];
    event?: Event;
}

@NgModule({
    declarations: [IgxComboComponent, IgxComboFilterConditionPipe, IgxComboFilteringPipe],
    exports: [IgxComboComponent],
    imports: [IgxRippleModule, IgxDropDownModule, CommonModule, IgxInputGroupModule, FormsModule]
})
export class IgxComboModule { }
