import { CommonModule } from "@angular/common";
import {
    ChangeDetectorRef,
    Component,
    ContentChildren,
    Directive,
    ElementRef,
    EventEmitter,
    forwardRef,
    HostListener,
    Inject,
    Injectable,
    Input,
    NgModule,
    OnInit,
    Optional,
    Output,
    QueryList,
    Self,
    ViewChild
} from "@angular/core";
import { IgxComboItemComponent } from "../combo/combo-item.component";
import { IToggleView } from "../core/navigation";
import { IgxSelectionAPIService } from "../core/selection";
import { IgxToggleDirective, IgxToggleModule } from "../directives/toggle/toggle.directive";
import { IgxDropDownItemBase, IgxDropDownItemComponent } from "./drop-down-item.component";

export interface ISelectionEventArgs {
    oldSelection: IgxDropDownItemComponent;
    newSelection: IgxDropDownItemComponent;
}

export enum MoveDirection {
    Up = -1,
    Down = 1
}

/**
 * **Ignite UI for Angular DropDown** -
 * [Documentation](https://www.infragistics.com/products/ignite-ui-angular/angular/components/drop-down.html)
 *
 * The Ignite UI for Angular Drop Down displays a scrollable list of items which may be visually grouped and
 * supports selection of a single item. Clicking or tapping an item selects it and closes the Drop Down
 *
 * Example:
 * ```html
 * <igx-drop-down>
 *   <igx-drop-down-item *ngFor="let item of items" isDisabled={{item.disabled}} isHeader={{item.header}}>
 *     {{ item.value }}
 *   </igx-drop-down-item>
 * </igx-drop-down>
 * ```
 */
export class IgxDropDownBase implements IToggleView, OnInit {
    protected _initiallySelectedItem: IgxDropDownItemComponent = null;
    protected _focusedItem: any = null;
    protected _width;
    protected _height;
    protected _id = "DropDown_0";
    @ContentChildren(forwardRef(() => IgxDropDownItemComponent))
    protected children: QueryList<IgxDropDownItemBase>;

    @ViewChild(IgxToggleDirective)
    protected toggleDirective: IgxToggleDirective;

    /**
     * Emitted when item selection is changing, before the selection completes
     * @type {EventEmitter<any>}
     */
    @Output()
    public onSelection = new EventEmitter<any>();

    /**
     * Emitted before the dropdown is opened
     * @type {EventEmitter}
     */
    @Output()
    public onOpening = new EventEmitter();

    /**
     * Emitted after the dropdown is opened
     * @type {EventEmitter}
     */
    @Output()
    public onOpened = new EventEmitter();

    /**
     * Emitted before the dropdown is closed
     * @type {EventEmitter}
     */
    @Output()
    public onClosing = new EventEmitter();

    /**
     * Emitted after the dropdown is closed
     * @type {EventEmitter}
     */
    @Output()
    public onClosed = new EventEmitter();

    /**
     * Gets/sets the width of the drop down
     */
    @Input()
    get width() {
        return this._width;
    }
    set width(value) {
        this._width = value;
        this.toggleDirective.element.style.width = value;
    }

    /**
     * Gets/sets the height of the drop down
     */
    @Input()
    get height() {
        return this._height;
    }
    set height(value) {
        this._height = value;
        this.toggleDirective.element.style.height = value;
    }

    /**
     * Gets/sets whether items will be able to take focus. If set to true, default value,
     * user will be able to use keyboard navigation.
     */
    @Input()
    public allowItemsFocus = true;

    /**
     * Gets/sets the drop down's id
     */
    @Input()
    get id(): string {
        return this._id;
    }
    set id(value: string) {
        this._id = value;
        this.toggleDirective.id = value;
    }
    /**
     * Get dropdown html element
     */
    public get element() {
        return this.elementRef.nativeElement;
    }

    /**
     * Gets if the dropdown is collapsed
     */
    public get collapsed(): boolean {
        return this.toggleDirective.collapsed;
    }

    /**
     * Get currently selected item
     */
    public get selectedItem(): any {
        const selection = this.selectionAPI.get_selection(this.id);
        return selection && selection.length > 0 ? selection[0] as IgxDropDownItemComponent : null;
    }

    /**
     * Get all non-header items
     */
    public get items(): any[] {
        const items: any[] = [];
        if (this.children !== undefined) {
            for (const child of this.children.toArray()) {
                if (!child.isHeader) {
                    items.push(child);
                }
            }
        }

        return items;
    }

    /**
     * Get all header items
     */
    public get headers(): any[] {
        const headers: any[] = [];
        if (this.children !== undefined) {
            for (const child of this.children.toArray()) {
                if (child.isHeader) {
                    headers.push(child);
                }
            }
        }

        return headers;
    }

    protected changeSelectedItem(newSelection?: IgxDropDownItemComponent) {
        const oldSelection = this.selectedItem;
        if (!newSelection) {
            newSelection = this._focusedItem;
        }

        this.selectionAPI.set_selection(this.id, [newSelection]);
        const args: ISelectionEventArgs = { oldSelection, newSelection };
        this.onSelection.emit(args);
    }

    /**
     * Select an item by index
     * @param index of the item to select
     */
    setSelectedItem(index: number): any {
        if (index < 0 || index >= this.items.length) {
            return;
        }

        const newSelection = this.items.find((item) => item.index === index);
        if (newSelection.isDisabled) {
            return;
        }

        this.changeSelectedItem(newSelection);
    }

    constructor(
        protected elementRef: ElementRef,
        protected cdr: ChangeDetectorRef,
        protected selectionAPI: IgxSelectionAPIService) {
    }

    /**
     * Opens the dropdown
     */
    open() {
        this.toggleDirective.open(true);
    }

    /**
     * Closes the dropdown
     */
    close() {
        this.toggleDirective.close(true);
    }

    /**
     * Toggles the dropdown
     */
    toggle() {
        if (this.toggleDirective.collapsed) {
            this.open();
        } else {
            this.close();
        }
    }

    protected navigate(direction: MoveDirection, currentIndex?: number) {
        let index = -1;
        if (this._focusedItem) {
            index = currentIndex ? currentIndex : this._focusedItem.index;
        }
        const newIndex = this.getNearestSiblingFocusableItemIndex(index, direction);
        this.changeFocusedItem(newIndex);
    }

    navigateFirst() {
        this.navigate(MoveDirection.Down, -1);
    }

    navigateLast() {
        this.navigate(MoveDirection.Up, this.items.length);
    }

    navigateNext() {
        this.navigate(MoveDirection.Down);
    }

    navigatePrev() {
        this.navigate(MoveDirection.Up);
    }

    ngOnInit() {
        this.toggleDirective.id = this.id;
    }

    onToggleOpening() {
        this.toggleDirective.collapsed = false;
        this.cdr.detectChanges();
        this.scrollToItem(this.selectedItem);
        this.onOpening.emit();
    }

    onToggleOpened() {
        this._initiallySelectedItem = this.selectedItem;
        this._focusedItem = this.selectedItem;
        if (this._focusedItem) {
            this._focusedItem.isFocused = true;
        } else if (this.allowItemsFocus) {
            const firstItemIndex = this.getNearestSiblingFocusableItemIndex(-1, MoveDirection.Down);
            if (firstItemIndex !== -1) {
                this.changeFocusedItem(firstItemIndex);
            }
        }
        this.onOpened.emit();
    }

    onToggleClosing() {
        this.onClosing.emit();
    }

    onToggleClosed() {
        if (this._focusedItem) {
            this._focusedItem.isFocused = false;
        }

        this.onClosed.emit();
    }

    protected scrollToItem(item: IgxDropDownItemComponent | IgxComboItemComponent) {
        const itemPosition = this.calculateScrollPosition(item);
        this.toggleDirective.element.scrollTop = (itemPosition);
    }

    public selectItem(item?) {
        if (!item) {
            item = this._focusedItem;
        }
        this.setSelectedItem(this._focusedItem.index);
        this.toggleDirective.close(true);
    }

    protected calculateScrollPosition(item: IgxDropDownItemComponent | IgxComboItemComponent): number {
        if (!item) {
            return 0;
        }

        const elementRect = item.element.nativeElement.getBoundingClientRect();
        const parentRect = this.toggleDirective.element.getBoundingClientRect();
        const scrollDelta = parentRect.top - elementRect.top;
        let scrollPosition = this.toggleDirective.element.scrollTop - scrollDelta;

        const dropDownHeight = this.toggleDirective.element.clientHeight;
        scrollPosition -= dropDownHeight / 2;
        scrollPosition += item.elementHeight / 2;

        return Math.floor(scrollPosition);
    }

    protected getNearestSiblingFocusableItemIndex(startIndex: number, direction: MoveDirection): number {
        let index = startIndex;
        while (this.items[index + direction] && this.items[index + direction].isDisabled) {
            index += direction;
        }

        index += direction;
        if (index >= 0 && index < this.items.length) {
            return index;
        } else {
            return -1;
        }
    }

    public changeFocusedItem(newIndex: number) {
        if (newIndex !== -1) {
            const oldItem = this._focusedItem;
            const newItem = this.items[newIndex];
            if (oldItem) {
                oldItem.isFocused = false;
            }

            this._focusedItem = newItem;
            const elementRect = this._focusedItem.element.nativeElement.getBoundingClientRect();
            const parentRect = this.toggleDirective.element.getBoundingClientRect();
            if (parentRect.top > elementRect.top) {
                this.toggleDirective.element.scrollTop -= (parentRect.top - elementRect.top);
            }

            if (parentRect.bottom < elementRect.bottom) {
                this.toggleDirective.element.scrollTop += (elementRect.bottom - parentRect.bottom);
            }

            this._focusedItem.isFocused = true;
        }
    }
}

@Directive({
    selector: "[igxDropDownItemNavigation]"
})
export class IgxDropDownItemNavigationDirective {

    private _target;

    constructor(private element: ElementRef, @Self() @Optional() public dropdown: IgxDropDownComponent) { }

    get target() {
        return this._target;
    }

    @Input("igxDropDownItemNavigation")
    set target(target: IgxDropDownBase) {
        this._target = target ? target : this.dropdown;
    }

    @HostListener("keydown.Escape", ["$event"])
    onEscapeKeyDown(event) {
        this.target.close();
    }

    // @HostListener("keydown.Space", ["$event"])
    // onSpaceKeyDown(event) {
    //     this.target.selectItem();
    //     event.preventDefault();
    // }

    @HostListener("keydown.Enter", ["$event"])
    onEnterKeyDown(event) {
        this.target.selectItem();
        event.preventDefault();
    }

    @HostListener("keydown.ArrowDown", ["$event"])
    onArrowDownKeyDown(event) {
        this.target.navigateNext();
        event.preventDefault();
    }

    @HostListener("keydown.ArrowUp", ["$event"])
    onArrowUpKeyDown(event) {
        this.target.navigatePrev();
        event.preventDefault();
    }

    @HostListener("keydown.End", ["$event"])
    onEndKeyDown(event) {
        this.target.navigateLast();
        event.preventDefault();
    }

    @HostListener("keydown.Home", ["$event"])
    onHomeKeyDown(event) {
        this.target.navigateFirst();
        event.preventDefault();
    }
}

@Component({
    selector: "igx-drop-down",
    templateUrl: "./drop-down.component.html"
})
export class IgxDropDownComponent extends IgxDropDownBase {

    constructor(
        protected elementRef: ElementRef,
        protected cdr: ChangeDetectorRef,
        protected selectionAPI: IgxSelectionAPIService) {
        super(elementRef, cdr, selectionAPI);
    }

    @HostListener("keydown.Space", ["$event"])
    onSpaceKeyDown(event) {
        this.selectItem();
        event.preventDefault();
    }
}
@NgModule({
    declarations: [IgxDropDownComponent, IgxDropDownItemComponent, IgxDropDownItemNavigationDirective],
    exports: [IgxDropDownComponent, IgxDropDownItemComponent, IgxDropDownItemNavigationDirective],
    imports: [CommonModule, IgxToggleModule],
    providers: [IgxSelectionAPIService]
})
export class IgxDropDownModule { }
