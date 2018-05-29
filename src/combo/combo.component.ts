import { CommonModule } from "@angular/common";
import {
    AfterViewInit, ChangeDetectorRef, Component, ContentChild,
    ContentChildren, ElementRef, EventEmitter, forwardRef,
    HostBinding, HostListener, Inject, Input, NgModule, OnDestroy, OnInit, Output, QueryList, TemplateRef, ViewChild, ViewChildren
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IgxCheckboxComponent, IgxCheckboxModule } from "../checkbox/checkbox.component";
import { IToggleView } from "../core/navigation";
import { IgxSelectionAPIService } from "../core/selection";
import { cloneArray } from "../core/utils";
import { BOOLEAN_FILTERS, STRING_FILTERS } from "../data-operations/filtering-condition";
import { FilteringLogic, IFilteringExpression } from "../data-operations/filtering-expression.interface";
import { ISortingExpression, SortingDirection } from "../data-operations/sorting-expression.interface";
import { IgxForOfDirective, IgxForOfModule } from "../directives/for-of/for_of.directive";
import { IForOfState } from "../directives/for-of/IForOfState";
import { IgxRippleModule } from "../directives/ripple/ripple.directive";
import { IgxToggleModule } from "../directives/toggle/toggle.directive";
import { IgxDropDownItemBase } from "../drop-down/drop-down-item.component";
import { IgxDropDownBase, IgxDropDownComponent, IgxDropDownModule, MoveDirection } from "../drop-down/drop-down.component";
import { IgxIconModule } from "../icon/index";
import { IgxInputGroupModule } from "../input-group/input-group.component";
import { IgxComboItemComponent } from "./combo-item.component";
import { IgxComboFilterConditionPipe, IgxComboFilteringPipe, IgxComboGroupingPipe, IgxComboSortingPipe } from "./combo.pipes";

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

export interface IComboItemAdditionEvent {
    oldCollection: any[];
    addedItem: any;
    newCollection: any[];
}
let currentItem = 0;

@Component({
    selector: "igx-combo-drop-down",
    templateUrl: "../drop-down/drop-down.component.html"
})
export class IgxComboDropDownComponent extends IgxDropDownBase {
    private _isFocused = false;
    constructor(
        protected elementRef: ElementRef,
        protected cdr: ChangeDetectorRef,
        protected selectionAPI: IgxSelectionAPIService,
        @Inject(forwardRef(() => IgxComboComponent))
        public parentElement: IgxComboComponent) {
        super(elementRef, cdr, selectionAPI);
        this.allowItemsFocus = false;
    }

    @ContentChildren(forwardRef(() => IgxComboItemComponent))
    protected children: QueryList<IgxDropDownItemBase>;

    get lastFocused(): IgxComboItemComponent {
        return this._focusedItem;
    }

    @HostListener("focus")
    onFocus() {
        this._isFocused = true;
        this._focusedItem = this._focusedItem ? this._focusedItem : this.items[0];
        this._focusedItem.isFocused = true;
    }

    @HostListener("blur")
    onBlur() {
        this._isFocused = false;
        this._focusedItem.isFocused = false;
        this._focusedItem = null;
    }

    public get selectedItem(): any[] {
        return this.selectionAPI.get_selection(this.parentElement.id) || [];
    }

    navigatePrev() {
        if (this._focusedItem.index === 0) {
            this.parentElement.searchInput.nativeElement.focus();
        } else {
            this.navigate(MoveDirection.Up);
        }
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
            this.parentElement.changeSelectedItem(itemID, true);
        } else {
            this.parentElement.changeSelectedItem(itemID, false);
        }
    }

    selectItem(item?: IgxComboItemComponent) {
        this.setSelectedItem(item ? item.itemID : this._focusedItem.itemID);
    }

    changeFocusedItem(newIndex: number) {
        // To implement for combo virtual items
        super.changeFocusedItem(newIndex);
    }

    onToggleOpening() {
        this.parentElement.searchValue = "";
        this.onOpening.emit();
        this.parentElement.filteredData = this.parentElement.data;
    }

    onToggleOpened() {
        this.parentElement.triggerCheck();
        this.parentElement.searchInput.nativeElement.focus();
        this.onOpened.emit();
    }

    onToggleClosed() {
        this.parentElement.comboInput.nativeElement.focus();
        this.onClosed.emit();
    }
}
@Component({
    selector: "igx-combo",
    templateUrl: "combo.component.html"
})
export class IgxComboComponent implements AfterViewInit, OnDestroy {
    protected _filteringLogic = FilteringLogic.Or;
    protected _filteringExpressions = [];
    protected _sortingExpressions = [];
    protected _groupKey: string | number;
    private _dataType = "";
    private _filteredData = [];
    protected _textKey = "";
    private _searchInput: ElementRef;
    public id = "";
    private _comboInput: any;

    get caller() {
        return this;
    }
    private _value = "";
    private _searchValue = "";

    constructor(
        protected elementRef: ElementRef,
        protected cdr: ChangeDetectorRef,
        protected selectionAPI: IgxSelectionAPIService) {
    }
    @ViewChild(IgxComboDropDownComponent, { read: IgxComboDropDownComponent })
    public dropdown: IgxComboDropDownComponent;

    @ViewChild("selectAllCheckbox", { read: IgxCheckboxComponent })
    public selectAllCheckbox: IgxCheckboxComponent;

    get searchInput() {
        return this._searchInput;
    }

    @ViewChild("searchInput")
    set searchInput(content: ElementRef) {
        this._searchInput = content;
    }

    get comboInput() {
        return this._comboInput;
    }

    @ViewChild("comboInput")
    set comboInput(content: ElementRef) {
        this._comboInput = content;
    }

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

    @Output()
    public onAddition = new EventEmitter();

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
    public set groupKey(val: string | number) {
        this.clearSorting(this._groupKey);
        this._groupKey = val;
        this.sort(this._groupKey);
    }

    public get groupKey(): string | number {
        return this._groupKey;
    }

    @Input()
    public placeholder;

    @Input()
    public valueKey;

    @Input()
    public data;

    @Input()
    public filteringLogic = FilteringLogic.Or;

    get textKey() {
        return this._textKey ? this._textKey : this.valueKey;
    }

    @Input()
    set textKey(val) {
        this._textKey = val;
    }

    @Input()
    public filterable;

    @Input()
    public defaultFallbackGroup = "Other";

    @Output()
    public onSelection = new EventEmitter<IComboSelectionChangeEventArgs>();

    public get filteringExpressions() {
        return this._filteringExpressions;
    }

    public set filteringExpressions(value) {
        this._filteringExpressions = cloneArray(value);
        this.cdr.markForCheck();
    }

    public get sortingExpressions() {
        return this._sortingExpressions;
    }

    public set sortingExpressions(value) {
        this._sortingExpressions = cloneArray(value);
        this.cdr.markForCheck();
    }

    protected clearSorting(field?: string | number) {
        if (field === undefined || field === null) {
            this.sortingExpressions = [];
            return;
        }
        const currentState = cloneArray(this.sortingExpressions);
        const index = currentState.findIndex((expr) => expr.fieldName === field);
        if (index > -1) {
            currentState.splice(index, 1);
            this.sortingExpressions = currentState;
        }
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
    /* */

    public get filteredData(): any[] {
        return this._filteredData;
    }

    public set filteredData(val: any[]) {
        this._filteredData = this.groupKey ? (val || []).filter((e) => e.isHeader !== true) : val;
    }

    public handleKeyDown(evt) {
        if (evt.key === "Enter") {
            if (this.filteredData.length === 1) {
                this.selectAllItems();
            }
        } else if (evt.key === "ArrowDown") {
            this.dropdown.element.focus();
        }
        if (this.filterable) {
            this.filter(this.searchValue, STRING_FILTERS.contains,
                true, this.getDataType() === DataTypes.PRIMITIVE ? undefined : this.textKey);
            this.isHeaderChecked();
        }
    }

    public sort(fieldName: string | number, dir: SortingDirection = SortingDirection.Asc, ignoreCase: boolean = true): void {
        if (!fieldName && fieldName !== 0) {
            return;
        }
        const sortingState = cloneArray(this.sortingExpressions, true);

        this.prepare_sorting_expression(sortingState, fieldName, dir, ignoreCase);
        this.sortingExpressions = sortingState;
    }

    protected prepare_sorting_expression(state, fieldName, dir, ignoreCase) {

        if (dir === SortingDirection.None) {
            state.splice(state.findIndex((expr) => expr.fieldName === fieldName), 1);
            return;
        }

        const expression = state.find((expr) => expr.fieldName === fieldName);

        if (!expression) {
            state.push({ fieldName, dir, ignoreCase });
        } else {
            Object.assign(expression, { fieldName, dir, ignoreCase });
        }
    }

    @HostListener("keydown.Alt.ArrowDown", ["$event"])
    onArrowDown(evt) {
        if (evt.altKey && evt.key === "ArrowDown" && this.dropdown.collapsed) {
            this.dropdown.toggle();
        }
    }

    @HostListener("keydown.Alt.ArrowUp", ["$event"])
    onArrowUp(evt) {
        if (evt.altKey && evt.key === "ArrowUp" && !this.dropdown.collapsed) {
            this.dropdown.toggle();
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

    public changeSelectedItem(newItem: any, select?: boolean) {
        const newSelection = select ?
            this.selectionAPI.select_item(this.id, newItem) :
            this.selectionAPI.deselect_item(this.id, newItem);
        this.triggerSelectionChange(newSelection);
    }

    public isItemSelected(item) {
        return this.selectionAPI.is_item_selected(this.id, item);
    }

    public isHeaderChecked() {
        if (!this.selectAllCheckbox) {
            return false;
        }
        const selectedItems = this.dropdown.selectedItem;
        if (this.filteredData.length > 0 && selectedItems.length > 0) {
            const compareData = this.filteredData;
            if (selectedItems.length >= this.filteredData.length) {
                let areAllSelected = true;
                let indeterminateFlag = false;
                for (const item of compareData) {
                    if (areAllSelected && !indeterminateFlag) {
                        indeterminateFlag = selectedItems.indexOf(item) > -1;
                    }
                    if (areAllSelected && indeterminateFlag) {
                        if (selectedItems.indexOf(item) < 0) {
                            areAllSelected = false;
                            this.selectAllCheckbox.indeterminate = indeterminateFlag;
                            this.selectAllCheckbox.checked = false;
                            return;
                        }
                    }
                }
                this.selectAllCheckbox.indeterminate = false;
                this.selectAllCheckbox.checked = true;
                return;
            } else if (selectedItems.length < this.filteredData.length) {
                for (const item of selectedItems) {
                    if (compareData.indexOf(item) > -1) {
                        this.selectAllCheckbox.indeterminate = true;
                        return;
                    }
                }
                this.selectAllCheckbox.checked = false;
                this.selectAllCheckbox.indeterminate = false;
                return;
            }
        }
        this.selectAllCheckbox.indeterminate = false;
        this.selectAllCheckbox.checked = false;
    }

    public selectAllItems() {
        const allVisible = this.selectionAPI.get_all_ids(this.filteredData);
        const newSelection = this.selectionAPI.select_items(this.id, allVisible);
        this.triggerSelectionChange(newSelection);
    }

    public deselectAllItems() {
        const newSelection = this.filteredData.length === this.data.length ?
            [] :
            this.selectionAPI.deselect_items(this.id, this.selectionAPI.get_all_ids(this.filteredData));
        this.triggerSelectionChange(newSelection);
    }

    public triggerSelectionChange(newSelection) {
        const oldSelection = this.dropdown.selectedItem;
        if (oldSelection !== newSelection) {
            const args: IComboSelectionChangeEventArgs = { oldSelection, newSelection };
            this.onSelection.emit(args);
            this.selectionAPI.set_selection(this.id, newSelection);
            this.value = this._dataType !== DataTypes.PRIMITIVE ?
                newSelection.map((e) => e[this.textKey]).join(", ") :
                newSelection.join(", ");
            this.isHeaderChecked();
        }
    }

    public triggerCheck() {
        this.cdr.detectChanges();
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
            [this.valueKey]: this.searchValue,
            [this.textKey]: this.searchValue
        };
        const oldCollection = this.data;
        const newCollection = [...this.data];
        newCollection.push(addedItem);
        const args: IComboItemAdditionEvent = {
            oldCollection, addedItem, newCollection
        };
        this.onAddition.emit(args);
        this.data.push(addedItem);
        this.filteredData.push(addedItem);
    }

    protected prepare_filtering_expression(searchVal, condition, ignoreCase, fieldName?) {
        const newArray = [...this.filteringExpressions];
        const expression = newArray.find((expr) => expr.fieldName === fieldName);
        const newExpression = { fieldName, searchVal, condition, ignoreCase };
        if (!expression) {
            newArray.push(newExpression);
        } else {
            Object.assign(expression, newExpression);
        }
        if (this.groupKey) {
            const expression2 = newArray.find((expr) => expr.fieldName === "isHeader");
            const headerExpression = { fieldName: "isHeader", searchVale: "", condition: BOOLEAN_FILTERS.true, ignoreCase: true };
            if (!expression2) {
                newArray.push(headerExpression);
            } else {
                Object.assign(expression2, headerExpression);
            }
        }
        this.filteringExpressions = newArray;
    }

    public filter(term, condition, ignoreCase, valueKey?) {
        this.prepare_filtering_expression(term, condition, ignoreCase, valueKey);
    }

    public ngAfterViewInit() {
        this.filteredData = this.data;
        this.id += currentItem++;
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
    declarations: [IgxComboComponent, IgxComboItemComponent, IgxComboFilterConditionPipe, IgxComboGroupingPipe,
        IgxComboFilteringPipe, IgxComboSortingPipe, IgxComboDropDownComponent],
    exports: [IgxComboComponent, IgxComboItemComponent, IgxComboDropDownComponent],
    imports: [IgxRippleModule, CommonModule, IgxInputGroupModule, FormsModule, IgxForOfModule, IgxToggleModule,
        IgxCheckboxModule, IgxDropDownModule, IgxIconModule],
    providers: [IgxSelectionAPIService]
})
export class IgxComboModule { }
