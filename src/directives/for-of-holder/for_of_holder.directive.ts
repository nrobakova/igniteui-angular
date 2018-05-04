import { CommonModule, NgForOf, NgForOfContext } from "@angular/common";
import {
    AfterContentInit,
    AfterViewInit,
    ChangeDetectorRef,
    ContentChild,
    ContentChildren,
    Directive,
    NgModule,
    NgZone,
    QueryList,
    ViewChildren,
    ViewContainerRef
} from "@angular/core";
import { debounceTime, delay, merge, repeat, take, takeUntil } from "rxjs/operators";
import { IgxGridRowComponent } from "../../grid/row.component";
import { IgxForOfDirective } from "../for-of/for_of.directive";

@Directive({ selector: "[igxForHolder]" })
export class IgxForOfHolderDirective<T> implements AfterViewInit {
    constructor(private _zone: NgZone, public cdr: ChangeDetectorRef) {

    }
    @ContentChild(IgxForOfDirective, { read: IgxForOfDirective})
    public verticalIgxFor: IgxForOfDirective<any>;

    @ContentChildren(IgxGridRowComponent, { read: IgxGridRowComponent, descendants: true })
    public rows: QueryList<IgxGridRowComponent>;

    public igxForHorizontal: Array<IgxForOfDirective<any>>;

    public ngAfterViewInit(): void {
        setTimeout(() => {
            this.igxForHorizontal = [];
            let hScroll;
            const rowsArray = this.rows.toArray();
            for (const row of rowsArray) {
                const virtFor = row.virtDirRow;
                virtFor.hScroll.removeEventListener("scroll", virtFor.func);
                this.igxForHorizontal.push(virtFor);
            }
            hScroll =  rowsArray[0].virtDirRow.hScroll;
            this._zone.runOutsideAngular(() => {
                hScroll.addEventListener("scroll", (evt) => {
                        this.globalHorizontalScroll(evt);
                });
            });
        }, 0);
    }

    public globalHorizontalScroll(evt) {
         for (const ixgFor of this.igxForHorizontal) {
             ixgFor.onHScroll(evt);
          }
    }
}

@NgModule({
    declarations: [IgxForOfHolderDirective],
    exports: [IgxForOfHolderDirective],
    imports: [CommonModule]
})

export class IgxForOfHolderModule {
}
