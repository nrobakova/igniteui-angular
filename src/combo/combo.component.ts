import { CommonModule } from "@angular/common";
import {
    ChangeDetectorRef, Component, ContentChild, ContentChildren,
    ElementRef, EventEmitter, forwardRef, HostBinding, HostListener,
    Input, NgModule, OnDestroy, OnInit, Output, QueryList, TemplateRef, ViewChild, ViewChildren
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IgxSelectionAPIService } from "../core/selection";
import { cloneArray } from "../core/utils";
import { STRING_FILTERS } from "../data-operations/filtering-condition";
import { FilteringLogic, IFilteringExpression } from "../data-operations/filtering-expression.interface";
import { IgxRippleModule } from "../directives/ripple/ripple.directive";
import { IgxToggleModule } from "../directives/toggle/toggle.directive";
import { IgxDropDownItemTemplate } from "../drop-down/drop-down-item.component";
import { IgxDropDownTemplate, MoveDirection } from "../drop-down/drop-down.component";
import { IgxInputGroupComponent, IgxInputGroupModule } from "../input-group/input-group.component";
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
    public value = "";
    public searchValue = "";

    constructor(
        protected elementRef: ElementRef,
        protected cdr: ChangeDetectorRef,
        protected selectionAPI: IgxSelectionAPIService) {
        super(elementRef, cdr, selectionAPI);
    }
    @ViewChildren(forwardRef(() => IgxComboItemComponent))
    protected children: QueryList<any>;

    @ViewChild(IgxInputGroupComponent, { read: IgxInputGroupComponent })
    public inputGroup: IgxInputGroupComponent;

    @ViewChild("primitive", { read: TemplateRef })
    protected primitiveTemplate: TemplateRef<any>;

    @ViewChild("searchInput", { read: TemplateRef })
    protected searchInput: TemplateRef<any>;

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

    @HostBinding("style.width")
    @Input()
    public width;

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

    @Input()
    public filterable;

    @Output()
    public onSelection = new EventEmitter<IComboSelectionChangeEventArgs>();
    /* */

    public get headers(): any[] {
        const headers: IgxComboItemComponent[] = [];
        if (this.children !== undefined) {
            for (const child of this.children.toArray()) {
                if (child.isHeader) {
                    headers.push(child);
                }
            }
        }

        return headers;
    }
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
        if (this.filterable) {
            this.filter(evt.target.value, STRING_FILTERS.contains,
                true, this.getDataType() === DataTypes.PRIMITIVE ? undefined : this.valueKey);
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

    protected changeSelectedItem(newItem: any, select?: boolean) {
        const oldSelection = this.selectedItem;
        const newSelection = select ?
            this.selectionAPI.select_item(this.id, newItem) :
            this.selectionAPI.deselect_item(this.id, newItem);
        if (oldSelection !== newSelection) {
            this.selectionAPI.set_selection(this.id, newSelection);
            this.value = this.selectionAPI.get_selection(this.id).join(", ");
            const args: IComboSelectionChangeEventArgs = { oldSelection, newSelection };
            this.onSelection.emit(args);
        }
    }

    onToggleOpening() {
        this.cdr.detectChanges();
        if (this._lastSelected) {
            this.scrollToItem(this._lastSelected);
        }
        this.onOpening.emit();
    }

    onToggleOpened() {
        this._initiallySelectedItem = this._lastSelected;
        this._focusedItem = this._lastSelected;
        if (this._focusedItem) {
            this._focusedItem.isFocused = true;
        } else if (this.allowItemsFocus) {
            const firstItemIndex = this.getNearestSiblingFocusableItemIndex(-1, MoveDirection.Down);
            if (firstItemIndex !== -1) {
                this.changeFocusedItem(this.items[firstItemIndex]);
            }
        }
        this.onOpened.emit();
    }

    /**
     * Get all non-header items
     */
    public get items(): any[] {
        const items: IgxComboItemComponent[] = [];
        if (this.children !== undefined) {
            for (const child of this.children.toArray()) {
                if (!child.isHeader) {
                    items.push(child);
                }
            }
        }

        return items;
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

    /**
     * Get all header items
     */

    public ngOnInit() {
        this._filteredData = this.data;
        this.id += currentItem++;
        this.allowItemsFocus = false;
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
    imports: [IgxRippleModule, CommonModule, IgxInputGroupModule, FormsModule, IgxToggleModule]
})
export class IgxComboModule { }
