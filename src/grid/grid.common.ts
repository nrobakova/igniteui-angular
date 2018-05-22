import { DOCUMENT } from "@angular/common";
import {
    ChangeDetectorRef,
    Directive,
    ElementRef,
    HostBinding,
    HostListener,
    Inject,
    Input,
    NgZone,
    OnDestroy,
    OnInit,
    Output,
    Renderer2,
    TemplateRef
} from "@angular/core";
import { animationFrameScheduler, fromEvent, interval, Observable, Subject } from "rxjs";
import { map, switchMap, takeUntil, throttle } from "rxjs/operators";
import { IgxColumnMovingService } from "./column-moving.service";
import { IgxGridAPIService } from "./api.service";
import { IgxColumnComponent } from "./column.component";
import { IgxForOfDirective } from "../main";

export interface IColumnMovingInfo {
    column: IgxColumnComponent;
    clientX: number;
}

@Directive({
    selector: "[igxResizer]"
})
export class IgxColumnResizerDirective implements OnInit, OnDestroy {

    @Input()
    public restrictHResizeMin: number = Number.MIN_SAFE_INTEGER;

    @Input()
    public restrictHResizeMax: number = Number.MAX_SAFE_INTEGER;

    @Input()
    public resizeEndTimeout = 0;

    @Output()
    public resizeEnd = new Subject<any>();

    @Output()
    public resizeStart = new Subject<any>();

    @Output()
    public resize = new Subject<any>();

    private _left;
    private _destroy = new Subject<boolean>();

    constructor(public element: ElementRef, @Inject(DOCUMENT) public document, public zone: NgZone) {

        this.resizeStart.pipe(
            map((event) => event.clientX),
            takeUntil(this._destroy),
            switchMap((offset) => this.resize.pipe(
                map((event) => event.clientX - offset),
                takeUntil(this.resizeEnd)
            ))
        ).subscribe((pos) => {
            const left = this._left + pos;

            this.left = left < this.restrictHResizeMin ? this.restrictHResizeMin + "px" : left + "px";

            if (left > this.restrictHResizeMax) {
                this.left = this.restrictHResizeMax + "px";
            } else if (left > this.restrictHResizeMin) {
                this.left = left + "px";
            }
        });

    }

    ngOnInit() {
        this.zone.runOutsideAngular(() => {
            fromEvent(this.document.defaultView, "mousedown").pipe(takeUntil(this._destroy))
                .subscribe((res) => this.onMousedown(res));

            fromEvent(this.document.defaultView, "mousemove").pipe(
                takeUntil(this._destroy),
                throttle(() => interval(0, animationFrameScheduler))
            ).subscribe((res) => this.onMousemove(res));

            fromEvent(this.document.defaultView, "mouseup").pipe(takeUntil(this._destroy))
                .subscribe((res) => this.onMouseup(res));
        });
    }

    ngOnDestroy() {
        this._destroy.next(true);
        this._destroy.unsubscribe();
    }

    public set left(val) {
        requestAnimationFrame(() => this.element.nativeElement.style.left = val);
    }

    onMouseup(event) {
        setTimeout(() => {
            this.resizeEnd.next(event);
            this.resizeEnd.complete();
        }, this.resizeEndTimeout);
    }

    onMousedown(event) {
        this.resizeStart.next(event);
        event.preventDefault();

        const elStyle = this.document.defaultView.getComputedStyle(this.element.nativeElement);
        this._left = Number.isNaN(parseInt(elStyle.left, 10)) ? 0 : parseInt(elStyle.left, 10);
    }

    onMousemove(event) {
        this.resize.next(event);
        event.preventDefault();
    }
}

@Directive({
    selector: "[igxMovable]"
})
export class IgxColumnMovingDirective {

    @Input("igxMovable")
    set movable(val: IgxColumnComponent) {
        this._column = val;
    }

    @HostBinding('draggable')
    get draggable() {
      return this.column.movable;
    }

    get column() : IgxColumnComponent {
        return this._column;
    }

    private _column: IgxColumnComponent;
    private _effect = "move";
    private _ghostImageClass = "igx-grid__col-moving-image";

    constructor(private cms: IgxColumnMovingService, private renderer: Renderer2) { }

    @HostListener("dragstart", ["$event"])
    public onDragStart(event) {
        this.cms.columMovingInfo = {
            column: this.column,
            clientX: event.clientX
        };

        event.dataTransfer.effectAllowed = this._effect;

        this.column.grid.isColumnMoving = true;
        this.renderer.addClass(event.currentTarget, this._ghostImageClass);
    }

    @HostListener("dragend", ["$event"])
    public onDragEnd(event) {
        this.column.grid.isColumnMoving = false;
        this.renderer.removeClass(event.currentTarget, this._ghostImageClass);
    }
}

@Directive({
    selector: "[igxDroppable]"
})
export class IgxDroppableDirective implements OnDestroy {

    @Input("igxDroppable")
    set droppable(val: any) {
        if (val instanceof IgxColumnComponent) {
            this._column = val;
        }

        if (val instanceof IgxForOfDirective) {
            this._hVirtDir = val;
        }
    }

    @Input()
    public direction: string;

    get column() : IgxColumnComponent {
        return this._column;
    }

    get isDropTarget(): boolean {
        return this._column && this._column.grid.hasMovableColumns;
    }

    get horizontalScroll(): any {
        if (this._hVirtDir) {
            return this._hVirtDir;
        }
    }

    private _dropIndicator: any = null;
    private _column: IgxColumnComponent;
    private _hVirtDir: IgxForOfDirective<any>;
    private _dragLeave = new Subject<boolean>();
    private _scrollStep: number;
    private _effect = "move";
    private _ghostImageClass = "igx-grid__col-moving-image";
    private _dropIndicatorClass = "igx-grid__drop-indicator-active";

    constructor(private elementRef: ElementRef, private cms: IgxColumnMovingService, private renderer: Renderer2) {}

    public ngOnDestroy() {
        this._dragLeave.next(true);
        this._dragLeave.unsubscribe();
    }

    @HostListener("dragenter", ["$event"])
    public onDragEnter(event) {
        if (this.column && this.isDropTarget && this.cms.columMovingInfo.column !== this.column) {
            if (!this.column.pinned || (this.column.pinned && this.column.grid.getPinnedWidth() + parseFloat(this.cms.columMovingInfo.column.width) <= this.column.grid.calcPinnedContainerMaxWidth)) {
                event.preventDefault();
                event.dataTransfer.dropEffect = this._effect;

                this._dropIndicator = this.cms.columMovingInfo.clientX < event.clientX ? this.elementRef.nativeElement.children[4] :
                    this.elementRef.nativeElement.children[0];

                this.renderer.addClass(this._dropIndicator, this._dropIndicatorClass);
            }
        }

        if (this.column && this.cms.columMovingInfo.column === this.column) {
            this.renderer.removeClass(event.currentTarget, this._ghostImageClass);
        }

        if (this.horizontalScroll) {
            this._scrollStep = this.horizontalScroll.getHorizontalScroll().scrollLeft;

            interval(100).pipe(takeUntil(this._dragLeave)).subscribe((val) => {
                this._scrollStep += this.direction === "right" ? 20 : -20;
                this.horizontalScroll.getHorizontalScroll().scrollTo(this._scrollStep, 0);
            });
        }
    }

    @HostListener("dragover", ["$event"])
    public onDragOver(event) {
        if (this.column && this.isDropTarget && this.cms.columMovingInfo.column !== this.column) {
            if (!this.column.pinned || (this.column.pinned && this.column.grid.getPinnedWidth() + parseFloat(this.cms.columMovingInfo.column.width) <= this.column.grid.calcPinnedContainerMaxWidth)) {
                event.preventDefault();
                event.dataTransfer.dropEffect = this._effect;
            }
        }
    }

    @HostListener("dragleave", ["$event"])
    public onDragLeave(event) {
        if (this._dropIndicator && this.cms.columMovingInfo.column !== this.column) {
            this.renderer.removeClass(this._dropIndicator, this._dropIndicatorClass);
        }

        if (this.horizontalScroll) {
            this._dragLeave.next(true);
        }
    }

    @HostListener("drop", ["$event"])
    public onDragDrop(event) {
        event.stopPropagation();

        if (this.horizontalScroll) {
            this._dragLeave.next(true);
        }

        if (this.column && this.isDropTarget) {
            this.renderer.removeClass(this._dropIndicator, this._dropIndicatorClass);

            this.column.grid.isColumnMoving = false;
            this.column.grid.moveColumn(this.cms.columMovingInfo.column, this.column);
        }
    }
}


@Directive({
    selector: "[igxCell]"
})
export class IgxCellTemplateDirective {

    constructor(public template: TemplateRef<any>) { }
}

@Directive({
    selector: "[igxHeader]"
})
export class IgxCellHeaderTemplateDirective {

    constructor(public template: TemplateRef<any>) { }

}

@Directive({
    selector: "[igxFooter]"
})
export class IgxCellFooterTemplateDirective {

    constructor(public template: TemplateRef<any>) { }
}

@Directive({
    selector: "[igxCellEditor]"
})
export class IgxCellEditorTemplateDirective {

    constructor(public template: TemplateRef<any>) { }
}

export interface IGridBus {
    gridID: string;
    cdr: ChangeDetectorRef;
    gridAPI: IgxGridAPIService;
}

/**
 * Decorates a setter or a method of a component implementing the IGridBus
 * interface triggering change detection in the parent grid when it is called.
 * If `markForCheck` is set to true it will also mark for check the instance
 * containing the setter/method.
 */
export function autoWire(markForCheck = false) {
    return function decorator(target: IGridBus, name: string, descriptor: any) {
        const old = descriptor.value || descriptor.set;

        const wrapped = function(...args) {
            const result = old.apply(this, args);
            if (markForCheck) {
                this.cdr.markForCheck();
            }
            this.gridAPI.notify(this.gridID);
            return result;
        };

        if (descriptor.set) {
            descriptor.set = wrapped;
        } else if (descriptor.value) {
            descriptor.value = wrapped;
        } else {
            throw Error("Can bind only to setter properties and methods");
        }

        return descriptor;
    };
}
