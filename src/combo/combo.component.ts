import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, NgModule, OnDestroy, OnInit, Output } from "@angular/core";
import { IgxSelectionAPIService } from "../core/selection";
import { IgxRippleModule } from "../directives/ripple/ripple.directive";

@Component({
    selector: "igx-combo",
    templateUrl: "combo.component.html"
})
export class IgxComboComponent implements OnInit, OnDestroy {
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

    }

    public ngOnDestroy() {

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
    imports: [IgxRippleModule]
})
export class IgxComboModule { }
