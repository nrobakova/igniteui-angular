import { CommonModule } from "@angular/common";
import {
    ChangeDetectorRef, Component, ContentChild, ContentChildren,
    ElementRef, EventEmitter, forwardRef, HostBinding, HostListener,
    Input, NgModule, OnDestroy, OnInit, Output, QueryList, TemplateRef, ViewChild, ViewChildren
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IgxCheckboxComponent, IgxCheckboxModule } from "../checkbox/checkbox.component";
import { IgxSelectionAPIService } from "../core/selection";
import { cloneArray } from "../core/utils";
import { STRING_FILTERS } from "../data-operations/filtering-condition";
import { FilteringLogic, IFilteringExpression } from "../data-operations/filtering-expression.interface";
import { IgxForOfDirective, IgxForOfModule } from "../directives/for-of/for_of.directive";
import { IForOfState } from "../directives/for-of/IForOfState";
import { IgxRippleModule } from "../directives/ripple/ripple.directive";
import { IgxToggleModule } from "../directives/toggle/toggle.directive";
import { IgxDropDownItemTemplate } from "../drop-down/drop-down-item.component";
import { IgxDropDownTemplate, MoveDirection } from "../drop-down/drop-down.component";
import { IgxInputGroupModule } from "../input-group/input-group.component";
import { IgxComboItemComponent } from "./combo-item.component";
import { IgxComboFilterConditionPipe, IgxComboFilteringPipe } from "./combo.pipes";

export enum DataTypes {
    EMPTY = "empty",
    PRIMITIVE = "primitive",
    COMPLEX = "complex",
    PRIMARYKEY = "valueKey"
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
let currentItem = 0;
@Component({
    selector: "igx-combo",
    templateUrl: "combo.component.html"
})
export class IgxComboComponent extends IgxDropDownTemplate implements OnInit, OnDestroy {
    protected _filteringLogic = FilteringLogic.And;
    protected _pipeTrigger = 0;
    protected _filteringExpressions = [];
    private _dataType = "";
    private _filteredData = [];
    protected _id = "ComboItem_";
    private _lastSelected = null;
    public dropdownVisible = false;

    get caller() {
        return this;
    }
    private _value = "";
    private _searchValue = "";

    constructor(
        protected elementRef: ElementRef,
        protected cdr: ChangeDetectorRef,
        protected selectionAPI: IgxSelectionAPIService) {
        super(elementRef, cdr, selectionAPI);
    }
    @ViewChildren(forwardRef(() => IgxComboItemComponent))
    protected children: QueryList<any>;

    @ViewChild("selectAllCheckbox", { read: IgxCheckboxComponent })
    public selectAllCheckbox: IgxCheckboxComponent;

    @ViewChild("searchInput")
    public searchInput: ElementRef;

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

    @ContentChild("addItemTemplate", { read: TemplateRef })
    public addItemTemplate: TemplateRef<any>;

    @ContentChild("headerItemTemplate", { read: TemplateRef })
    public headerItemTemplate: TemplateRef<any>;

    @HostBinding("style.width")
    @Input()
    public width;

    @Input()
    public height;

    @Input()
    public listHeight = 300;

    @Input()
    public listItemHeight = 30;

    @Input()
    public groupKey;

    @Input()
    public placeholder;

    @Input()
    public valueKey;

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

    get pipeTrigger(): number {
        return this._pipeTrigger;
    }

    get lastSelected(): IgxComboItemComponent {
        return this._lastSelected;
    }

    get lastFocused(): IgxComboItemComponent {
        return this._focusedItem;
    }

    get value(): string {
        return this._value;
    }

    set value(val) {
        this._value = val;
    }

    get searchValue() {
        return this._searchValue;
    }

    set searchValue(val: string) {
        this._searchValue = val;
    }
    @Input()
    public filterable;

    @Output()
    public onSelection = new EventEmitter<IComboSelectionChangeEventArgs>();
    /* */

    public get filteredData(): any[] {
        return this._filteredData;
    }

    public set filteredData(val: any[]) {
        this._filteredData = val;
    }

    public get selectedItem(): any[] {
        return this.selectionAPI.get_selection(this.id) || [];
    }

    public handleKeyDown(evt) {
        if (evt.key === "Enter") {
            if (this.filteredData.length === 1) {
                this.selectAllItems();
            }
        }
        if (this.filterable) {
            this.filter(evt.target.value, STRING_FILTERS.contains,
                true, this.getDataType() === DataTypes.PRIMITIVE ? undefined : this.valueKey);
            this.isHeaderChecked();
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

    setSelectedItem(itemID: any) {
        if (itemID === undefined || itemID === null) {
            return;
        }
        const newItem = this.items.find((item) => item.itemID === itemID);
        if (newItem.isDisabled || newItem.isHeader) {
            return;
        }
        if (!newItem.isSelected) {
            this.changeSelectedItem(itemID, true);
        } else {
            this.changeSelectedItem(itemID, false);
        }
        this._lastSelected = newItem;
    }

    public changeSelectedItem(newItem: any, select?: boolean) {
        const newSelection = select ?
            this.selectionAPI.select_item(this.id, newItem) :
            this.selectionAPI.deselect_item(this.id, newItem);
        this.triggerSelectionChange(newSelection);
    }

    public isHeaderChecked() {
        const selectedItems = this.selectedItem;
        if (this.filteredData.length > 0 && selectedItems.length > 0) {
            const compareData = this.valueKey ?
                this.filteredData.map((e) => e[this.valueKey]) :
                this.filteredData;
            if (selectedItems.length >= this.filteredData.length) {
                for (const item of compareData) {
                    if (selectedItems.indexOf(item) > -1) {
                        this.selectAllCheckbox.indeterminate = true;
                        return;
                    }
                }
                this.selectAllCheckbox.indeterminate = false;
                return;
            } else if (selectedItems.length < this.filteredData.length) {
                for (const item of selectedItems) {
                    if (compareData.indexOf(item) > -1) {
                        this.selectAllCheckbox.indeterminate = true;
                        return;
                    }
                }
                this.selectAllCheckbox.indeterminate = false;
                return;
            }
        }
        this.selectAllCheckbox.indeterminate = false;
        this.selectAllCheckbox.checked = false;
    }

    public selectAllItems() {
        const allVisible = this.selectionAPI.get_all_ids(this.filteredData, this.valueKey);
        const newSelection = this.selectionAPI.select_items(this.id, allVisible);
        this.triggerSelectionChange(newSelection);
    }

    public deselectAllItems() {
        const newSelection = this.filteredData.length === this.data.length ?
            [] :
            this.selectionAPI.deselect_items(this.id, this.selectionAPI.get_all_ids(this.filteredData, this.valueKey));
        this.triggerSelectionChange(newSelection);
    }

    public triggerSelectionChange(newSelection) {
        const oldSelection = this.selectedItem;
        if (oldSelection !== newSelection) {
            this.selectionAPI.set_selection(this.id, newSelection);
            this.value = newSelection.join(", ");
            const args: IComboSelectionChangeEventArgs = { oldSelection, newSelection };
            this.onSelection.emit(args);
            this.isHeaderChecked();
        }
    }

    public handleSelectAll(evt) {
        if (evt.checked) {
            this.selectAllItems();
        } else {
            this.deselectAllItems();
        }
    }

    public addItemToCollection() {
        if (!this.searchValue) {
            return false;
        }
        const addedItem = {
            [this.valueKey]: this.searchValue
        };
        this.data.push(addedItem);
        this.filteredData.push(addedItem);
    }

    onToggleOpening() {
        this.cdr.detectChanges();
        this.searchValue = "";
        this.searchInput.nativeElement.focus();
        this.onOpening.emit();
    }

    onToggleOpened() {
        this._initiallySelectedItem = this._lastSelected;
        this._focusedItem = this._lastSelected;
        this.onOpened.emit();
    }

    protected prepare_filtering_expression(searchVal, condition, ignoreCase, fieldName?) {
        if (fieldName !== undefined) {
            return [{ fieldName, searchVal, condition, ignoreCase }];
        }
        return [{ searchVal, condition, ignoreCase }];
    }

    public filter(term, condition, ignoreCase, valueKey?) {
        this.filteringExpressions = this.prepare_filtering_expression(term, condition, ignoreCase, valueKey);
    }

    public ngOnInit() {
        this.filteredData = this.data;
        this.id += currentItem++;
        if (this.groupKey !== undefined) {
            const dataWithHeaders = this.data.sort((a, b) => {
                if (a[this.groupKey] > b[this.groupKey]) {
                    return 1;
                }
                if (a[this.groupKey] < b[this.groupKey]) {
                    return -1;
                }
                return 0;
            });
            const crawl = [...dataWithHeaders];
            let inserts = 0;
            let currentHeader = null;
            for (let i = 0; i < crawl.length; i++) {
                if (currentHeader !== crawl[i][this.groupKey]) {
                    currentHeader = crawl[i][this.groupKey];
                    dataWithHeaders.splice(i + inserts, 0, {
                        [this.valueKey]: currentHeader,
                        isHeader: true
                    });
                    inserts++;
                }
            }
            this.data = dataWithHeaders;
        }
    }

    ngOnDestroy() {

    }

    public get template(): TemplateRef<any> {
        this._dataType = this.getDataType();
        if (!this.filteredData || !this.filteredData.length) {
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
}

@NgModule({
    declarations: [IgxComboComponent, IgxComboItemComponent, IgxComboFilterConditionPipe, IgxComboFilteringPipe],
    exports: [IgxComboComponent, IgxComboItemComponent],
    imports: [IgxRippleModule, CommonModule, IgxInputGroupModule, FormsModule, IgxForOfModule, IgxToggleModule, IgxCheckboxModule]
})
export class IgxComboModule { }
