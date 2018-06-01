import { DOCUMENT } from "@angular/common";
import {
    ChangeDetectorRef,
    Directive,
    ElementRef,
    HostBinding,
    HostListener,
    Inject,
    Injectable,
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
import { IgxGridAPIService } from "./api.service";
import { IgxColumnComponent } from "./column.component";
import { IgxForOfDirective } from "../main";
import { url } from "inspector";

export interface IColumnMovingInfo {
    column: IgxColumnComponent;
    clientX: number;
}

@Injectable()
export class IgxColumnMovingService {
    private _columMovingInfo: IColumnMovingInfo;

    get columMovingInfo(): IColumnMovingInfo {
        return this._columMovingInfo;
    }
    set columMovingInfo(val: IColumnMovingInfo) {
        if (val) {
            this._columMovingInfo = val;
        }
    }
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
            fromEvent(this.document.defaultView, "pointerdown").pipe(takeUntil(this._destroy))
                .subscribe((res) => this.onMousedown(res));

            fromEvent(this.document.defaultView, "pointermove").pipe(
                takeUntil(this._destroy),
                throttle(() => interval(0, animationFrameScheduler))
            ).subscribe((res) => this.onMousemove(res));

            fromEvent(this.document.defaultView, "pointerup").pipe(takeUntil(this._destroy))
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

    @HostBinding("draggable")
    get draggable() {
        if (this.column) {
            return this.column.movable;
        }
    }

    get column() : IgxColumnComponent {
        return this._column;
    }

    private _effect = "move";
    private _column: IgxColumnComponent;
    private _ghostImageClass = "igx-grid__col-moving-image";

    constructor(private cms: IgxColumnMovingService, private renderer: Renderer2, private elementRef: ElementRef, private zone: NgZone) { }

    @HostListener("dragstart", ["$event"])
    public onDragStart(event) {
        this.cms.columMovingInfo = {
            column: this.column,
            clientX: event.clientX
        };

        event.dataTransfer.effectAllowed = this._effect;

        this.column.grid.isColumnMoving = true;

        this.renderer.addClass(this.elementRef.nativeElement, this._ghostImageClass);
        setImmediate(() => this.renderer.removeClass(this.elementRef.nativeElement, this._ghostImageClass));

        // dragging will not work in FF unless we set the data
        event.dataTransfer.setData("Text", "");

        const args = {
            source: this.column
        };
        this.column.grid.onColumnMovingStart.emit(args);
    }

    @HostListener("dragend", ["$event"])
    public onDragEnd(event) {
        this.column.grid.isColumnMoving = false;
        this.renderer.removeClass(this.elementRef.nativeElement, this._ghostImageClass);
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

    get column() : IgxColumnComponent {
        return this._column;
    }

    get isDropTarget(): boolean {
        return this._column && this._column.grid.hasMovableColumns;
    }

    get hVirtDir(): any {
        if (this._hVirtDir) {
            return this._hVirtDir;
        }
    }

    private _dropIndicator: any = null;
    private _column: IgxColumnComponent;
    private _hVirtDir: IgxForOfDirective<any>;
    private _dragLeave = new Subject<boolean>();
    private _effect = "move";
    private _ghostImageClass = "igx-grid__col-moving-image";
    private _dropIndicatorClass = "igx-grid__drop-indicator-active";

    constructor(private elementRef: ElementRef, private cms: IgxColumnMovingService, private renderer: Renderer2, private zone: NgZone) { }

    public ngOnDestroy() {
        this._dragLeave.next(true);
        this._dragLeave.unsubscribe();
    }

    @HostListener("dragenter", ["$event"])
    public onDragEnter(event): boolean {
        if (this.column && this.isDropTarget && this.cms.columMovingInfo.column !== this.column) {
            if (!this.column.pinned || (this.column.pinned && this.column.grid.getPinnedWidth() + parseFloat(this.cms.columMovingInfo.column.width) <= this.column.grid.calcPinnedContainerMaxWidth)) {

                const args = {
                    source: this.cms.columMovingInfo.column,
                    target: this.column,
                    cancel: false
                };
                this.column.grid.onColumnMoving.emit(args);

                if (args.cancel) {
                    return;
                }

                event.preventDefault();
                event.dataTransfer.dropEffect = this._effect;

                this._dropIndicator = this.cms.columMovingInfo.clientX < event.clientX ? this.elementRef.nativeElement.children[4] :
                    this.elementRef.nativeElement.children[0];

                this.renderer.addClass(this._dropIndicator, this._dropIndicatorClass);
            }
        }

        if (this.hVirtDir) {
            interval(100).pipe(takeUntil(this._dragLeave)).subscribe((val) => {
                event.target.id === "right" ? this.hVirtDir.getHorizontalScroll().scrollLeft += 15 :
                    this.hVirtDir.getHorizontalScroll().scrollLeft -= 15;
            });
        }
    }

    @HostListener("dragover", ["$event"])
    public onDragOver(event): boolean {
        if (this.column && this.isDropTarget && this.cms.columMovingInfo.column !== this.column) {
            if (!this.column.pinned || (this.column.pinned && this.column.grid.getPinnedWidth() + parseFloat(this.cms.columMovingInfo.column.width) <= this.column.grid.calcPinnedContainerMaxWidth)) {

                const args = {
                    source: this.cms.columMovingInfo.column,
                    target: this.column,
                    cancel: false
                };
                this.column.grid.onColumnMoving.emit(args);

                if (args.cancel) {
                    return;
                }

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

        if (this.hVirtDir) {
            this._dragLeave.next(true);
        }
    }

    @HostListener("drop", ["$event"])
    public onDragDrop(event): boolean {
        event.stopPropagation();

        if (this.hVirtDir) {
            this._dragLeave.next(true);
        }

        if (this.column && this.isDropTarget) {
            this.renderer.removeClass(this._dropIndicator, this._dropIndicatorClass);

            this.column.grid.isColumnMoving = false;

            const args = {
                source: this.cms.columMovingInfo.column,
                target: this.column,
                cancel: false
            };
            this.column.grid.onColumnMovingEnd.emit(args);

            if (args.cancel) {
                return;
            }

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

@Directive({
    selector: "[igxDrag]"
})
export class IgxDragDirective implements OnInit, OnDestroy {

    @Input()
    public dragToleration = 5;

    @Output()
    public dragEnd = new Subject<any>();

    @Output()
    public dragStart = new Subject<any>();

    @Output()
    public drag = new Subject<any>();

    @HostBinding("style.touchAction")
    public touch = "none";

    protected _startX = 0;
    protected _startY = 0;
    protected _dragOffsetX;
    protected _dragOffsetY;
    protected _dragGhost;
    protected _dragStarted = false;
    protected _lastDropArea = null;

    protected _destroy = new Subject<boolean>();

    constructor(public element: ElementRef, public zone: NgZone) {
    }

    ngOnInit() {
        this.zone.runOutsideAngular(() => {
            fromEvent(this.element.nativeElement, "pointerdown").pipe(takeUntil(this._destroy))
                .subscribe((res) => this.onPointerDown(res));

            fromEvent(this.element.nativeElement, "pointermove").pipe(
                takeUntil(this._destroy),
                throttle(() => interval(0, animationFrameScheduler))
            ).subscribe((res) => this.onPointerMove(res));

            fromEvent(this.element.nativeElement, "pointerup").pipe(takeUntil(this._destroy))
                .subscribe((res) => this.onPointerUp(res));
        });
    }

    ngOnDestroy() {
        this._destroy.next(true);
        this._destroy.unsubscribe();
    }

    public set left(val: number) {
        requestAnimationFrame(() => this._dragGhost.style.left = val + "px");
    }

    public set top(val: number) {
        requestAnimationFrame(() => this._dragGhost.style.top = val + "px");
    }

    public onPointerDown(event) {
        this.element.nativeElement.setPointerCapture(event.pointerId);
        this._dragStarted = true;

        this._startX = event.pageX;
        this._startY = event.pageY;

        this._dragOffsetX = event.pageX - (event.pageX - this.element.nativeElement.getBoundingClientRect().left);
        this._dragOffsetY = event.pageY - (event.pageY - this.element.nativeElement.getBoundingClientRect().top);

        event.preventDefault();
    }

    public onPointerMove(event) {
        if (this._dragStarted) {
            const totalMovedX = event.pageX - this._startX;
            const totalMovedY = event.pageY - this._startY;

            if (!this._dragGhost &&
                 (Math.abs(totalMovedX) > this.dragToleration || Math.abs(totalMovedY) > this.dragToleration)) {
                this.createDragGhost();
                return;
            } else if (!this._dragGhost) {
                // no drag grost and not moved enough for drag to occur
                return;
            }

            this.left = totalMovedX + this._dragOffsetX;
            this.top = totalMovedY + this._dragOffsetY;

            this.dispatchDragEvents(event.pageX, event.pageY);
            event.preventDefault();
        }
    }

    public onPointerUp(event) {
        if (this._dragStarted) {
            this._dragStarted = false;

            if (!this._dragGhost) {
                return;
            }

            this._dragGhost.parentNode.removeChild(this._dragGhost);
            this._dragGhost = null;
            this.dispatchDropEvent(event.pageX, event.pageY);
        }
    }

    protected createDragGhost() {
        const elStyle = document.defaultView.getComputedStyle(this.element.nativeElement);
        this._dragGhost = this.element.nativeElement.cloneNode(true);

        this._dragGhost.style.background = "lightgray";
        this._dragGhost.style.border = "0.2px solid red";
        this._dragGhost.style.width = elStyle.width;
        this._dragGhost.style.height = elStyle.height;
        this._dragGhost.style.position = "absolute";
        this._dragGhost.style.cursor = "not-allowed";
        this._dragGhost.style.zIndex  = "20";
        this.left = this._dragOffsetX;
        this.top = this._dragOffsetY;

        document.body.appendChild(this._dragGhost);
        document.body.style.cursor = "url(this._dragGhost)";
    }

    protected dispatchDragEvents(pageX: number, pageY: number) {
        let topDropArea;
        let elementsFromPoint;
        const eventArgs = {
            detail: {
                startX: this._startX,
                startY: this._startY,
                clientX: pageX,
                clientY: pageY,
                owner: this
            }
        };

        elementsFromPoint = document.msElementsFromPoint ?
            document.msElementsFromPoint(pageX, pageY) : // Edge and IE special snowflakes
            document.elementsFromPoint(pageX, pageY); // Other browsers like Chrome, Firefox, Opera

        for (let i = 0; i < elementsFromPoint.length; i++) {
            if (elementsFromPoint[i].getAttribute("droppable") === "true" &&
                !elementsFromPoint[i].isEqualNode(this._dragGhost)) {
                topDropArea = elementsFromPoint[i];
                break;
            }
        }

        if (topDropArea &&
             (!this._lastDropArea || (this._lastDropArea && !this._lastDropArea.isEqualNode(topDropArea)))) {
            if (this._lastDropArea) {
                this._lastDropArea.dispatchEvent(new CustomEvent("igxDragLeave", eventArgs));
            }
            topDropArea.dispatchEvent(new CustomEvent("igxDragEnter", eventArgs));
            this._lastDropArea = topDropArea;
        } else if (!topDropArea && this._lastDropArea) {
            this._lastDropArea.dispatchEvent(new CustomEvent("igxDragLeave", eventArgs));
            this._lastDropArea = null;
        }
    }

    protected dispatchDropEvent(pageX: number, pageY: number) {
        const eventArgs = {
            detail: {
                startX: this._startX,
                startY: this._startY,
                clientX: pageX,
                clientY: pageY,
                owner: this
            }
        };

        this._lastDropArea.dispatchEvent(new CustomEvent("igxDragLeave", eventArgs));
        this._lastDropArea.dispatchEvent(new CustomEvent("igxDrop", eventArgs));
    }
}

@Directive({
    selector: "[igxColumnMovingDrag]"
})
export class IgxColumnMovingDragDirective extends IgxDragDirective {

    public get draggable() {
        return this.column.movable;
    }

    @Input("igxColumnMovingDrag")
    set data(val: IgxColumnComponent) {
        this._column = val;
    }

    get column(): IgxColumnComponent {
        return this._column;
    }

    private _column: IgxColumnComponent;

    constructor(_element: ElementRef, _zone: NgZone) {
        super(_element, _zone);
    }

    public onPointerMove(event) {
        super.onPointerMove(event);

        if (this._dragStarted && this._dragGhost && !this.column.grid.isColumnMoving) {
            this.column.grid.isColumnMoving = true;
        }
    }

    public onPointerUp(event) {
        super.onPointerUp(event);

        if (this._dragStarted) {
            this.column.grid.isColumnMoving = false;
        }
    }
}

@Directive({
    selector: "[igxDrop]"
})
export class IgxDropDirective {

    @HostListener("igxDragEnter", ["$event"])
    public onDragEnter(event) {
        // To do for generic scenario
    }

    @HostListener("igxDragLeave", ["$event"])
    public onDragLeave(event) {
        // To do for generic scenario
    }

    @HostListener("igxDrop", ["$event"])
    public onDragDrop(event) {
        // To do for generic scenario
    }
}

@Directive({
    selector: "[igxColumnMovingDrop]"
})
export class IgxColumnMovingDropDirective extends IgxDropDirective implements OnDestroy  {

    @Input("igxColumnMovingDrop")
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

    get column(): IgxColumnComponent {
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

    constructor(private elementRef: ElementRef, private cms: IgxColumnMovingService, private renderer: Renderer2) {
        super();
    }

    public ngOnDestroy() {
        this._dragLeave.next(true);
        this._dragLeave.unsubscribe();
    }

    public onDragEnter(event) {
        if (this.column && this.column.grid.isColumnMoving && this.isDropTarget && event.detail.owner.column !== this.column) {
            if (!this.column.pinned || (this.column.pinned && this.column.grid.getPinnedWidth() + parseFloat(event.detail.owner.column.width) <= this.column.grid.calcPinnedContainerMaxWidth)) {
                event.preventDefault();

                this._dropIndicator = event.detail.startX < event.detail.clientX ? this.elementRef.nativeElement.children[4] :
                    this.elementRef.nativeElement.children[0];

                this.renderer.addClass(this._dropIndicator, this._dropIndicatorClass);
            }
        }

        if (this.horizontalScroll) {
            event.preventDefault();
            interval(100).pipe(takeUntil(this._dragLeave)).subscribe((val) => {
                this.direction === "right" ? this.horizontalScroll.getHorizontalScroll().scrollLeft += 15 :
                    this.horizontalScroll.getHorizontalScroll().scrollLeft -= 15;
            });
        }
    }

    public onDragLeave(event) {
        if (this._dropIndicator && event.detail.owner.column !== this.column) {
            this.renderer.removeClass(this._dropIndicator, this._dropIndicatorClass);
        }

        if (this.horizontalScroll) {
            this._dragLeave.next(true);
        }
    }

    public onDragDrop(event) {
        event.stopPropagation();
        this.column.grid.isColumnMoving = false;

        if (this.horizontalScroll) {
            this._dragLeave.next(true);
        }

        if (this.column && this.isDropTarget) {
            if (this._dropIndicator) {
                this.renderer.removeClass(this._dropIndicator, this._dropIndicatorClass);
            }

            this.column.grid.isColumnMoving = false;
            this.column.grid.moveColumn(event.detail.owner.column, this.column);
        }
    }
}
