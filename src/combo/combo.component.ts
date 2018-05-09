import { CommonModule } from "@angular/common";
import {
    ChangeDetectorRef, Component, ElementRef,
    EventEmitter, Input, NgModule, OnDestroy, OnInit, Output, TemplateRef, ViewChild
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IgxSelectionAPIService } from "../core/selection";
import { IgxRippleModule } from "../directives/ripple/ripple.directive";
import { IgxDropDownItemComponent } from "../drop-down/drop-down-item.component";
import { IgxDropDownComponent, IgxDropDownModule } from "../drop-down/drop-down.component";
import { IgxInputGroupModule } from "../input-group/input-group.component";

@Component({
    selector: "igx-combo",
    templateUrl: "combo.component.html"
})
export class IgxComboComponent implements OnInit, OnDestroy {

    public value = "";

    @ViewChild(IgxDropDownComponent, { read: IgxDropDownComponent })
    public dropDown: IgxDropDownComponent;

    @ViewChild("primitive", { read: TemplateRef })
    protected primitiveTemplate: TemplateRef<any>;

    @ViewChild("primaryKey", { read: TemplateRef })
    protected primaryKeyTemplate: TemplateRef<any>;

    @ViewChild("data", { read: TemplateRef })
    protected dataTemplate: TemplateRef<any>;

    @ViewChild("empty", { read: TemplateRef })
    protected emptyTemplate: TemplateRef<any>;

    @ViewChild("empty", { read: TemplateRef })
    protected customTemplateRef: TemplateRef<any>;

    @Input()
    public evalDisabled: (args) => boolean;

    @Input()
    public customTemplate;

    @Input()
    public data;

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
        console.log("Combo init");
        console.log(this.data);
    }

    public ngOnDestroy() {

    }

    public onSelection(event) {
        if (event.newSelection) {
            if (event.newSelection !== event.oldSelection) {
                this.value = this.data[event.newSelection.index];
            }
        }
    }

    public toggleDropDown(event, state?) {
        if (state !== undefined) {
            if (state) {
                this.dropDown.open();
                console.log("Opening");
            }
        }
    }

    public get template(): TemplateRef<any> {
        if (!this.data || !this.data.length) {
            return this.emptyTemplate;
        }
        if (typeof this.data[0] === "object") {
            if (this.customTemplate !== undefined) {
                return this.customTemplateRef;
            }
            if (this.primaryKey !== undefined) {
                return this.primaryKeyTemplate;
            }
            return this.dataTemplate;
        }
        return this.primitiveTemplate;
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
