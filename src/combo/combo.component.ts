import { CommonModule } from "@angular/common";
import {
    ChangeDetectorRef, Component, ElementRef,
    EventEmitter, Input, NgModule, OnDestroy, OnInit, Output, TemplateRef, ViewChild, HostListener
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IgxSelectionAPIService } from "../core/selection";
import { IgxRippleModule } from "../directives/ripple/ripple.directive";
import { IgxDropDownItemComponent } from "../drop-down/drop-down-item.component";
import { IgxDropDownComponent, IgxDropDownModule } from "../drop-down/drop-down.component";
import { IgxInputGroupModule, IgxInputGroupComponent } from "../input-group/input-group.component";

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

    @Input()
    public evalDisabled: (args) => boolean;

    @Input()
    public customTemplate: TemplateRef<any>;

    @Input()
    public data;

    @Input()
    public filter;

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

    public get displayedData() {
        if (this.filter) {
            return this._filteredData;
        }
        return this.data;
    }
    public hanldeKeyDown(evt) {
        this._filteredData = this.data.filter((e) => this.getDataByType(e).indexOf(evt.target.value) > -1);
    }

    public onSelection(event) {
        if (event.newSelection) {
            if (event.newSelection !== event.oldSelection) {
                this.value = this.getData();
            }
        }
    }

    public toggleDropDown(event, state?) {
        if (state !== undefined) {
            if (state) {
                this.dropDown.open();
            }
        }
    }

    private getDataType() {
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
        if (this.customTemplate) {
            return this.customTemplate;
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
    declarations: [IgxComboComponent],
    exports: [IgxComboComponent],
    imports: [IgxRippleModule, IgxDropDownModule, CommonModule, IgxInputGroupModule, FormsModule]
})
export class IgxComboModule { }
