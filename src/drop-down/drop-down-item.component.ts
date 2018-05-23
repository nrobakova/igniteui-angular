import {
    Component,
    ElementRef,
    forwardRef,
    HostBinding,
    HostListener,
    Inject,
    Input
} from "@angular/core";
import { IgxDropDownComponent, ISelectionEventArgs } from "./drop-down.component";

export class IgxDropDownItemBase {
    protected _isFocused = false;
    /**
     * Gets item element height
     */
    public get elementHeight(): number {
        return this.elementRef.nativeElement.clientHeight;
    }

    /**
     * Get item html element
     */
    public get element() {
        return this.elementRef;
    }

    /**
     * Get item selection status
     */
    get isSelected() {
        return this.parentElement.selectedItem === this;
    }

    public get index(): number {
        return this.parentElement.items.indexOf(this);
    }

    /**
     * Sets/gets if the given item is header
     */
    @Input()
    @HostBinding("class.igx-drop-down__header")
    public isHeader = false;

    /**
     * Sets/gets if the given item is disabled
     */
    @Input()
    @HostBinding("class.igx-drop-down__item--disabled")
    public isDisabled = false;

    /**
     * Sets/gets if the given item is focused
     */
    @HostBinding("class.igx-drop-down__item--focused")
    get isFocused() {
        return this._isFocused;
    }
    set isFocused(value: boolean) {
        if (this.isDisabled || this.isHeader) {
            this._isFocused = false;
            return;
        }

        if (value && !this.parentElement.collapsed) {
            this.elementRef.nativeElement.focus();
        }
        this._isFocused = value;
    }

    @HostBinding("attr.aria-selected")
    @HostBinding("class.igx-drop-down__item--selected")
    get selectedStyle(): boolean {
        return this.isSelected;
    }

    @HostBinding("attr.tabindex")
    get setTabIndex() {
        const shouldSetTabIndex = this.parentElement.allowItemsFocus && !(this.isDisabled || this.isHeader);
        if (shouldSetTabIndex) {
            return 0;
        } else {
            return null;
        }
    }

    @HostListener("click", ["$event"])
    clicked(event) {
        if (this.isDisabled || this.isHeader) {
            const focusedItem = this.parentElement.items.find((item) => item.isFocused);
            focusedItem.elementRef.nativeElement.focus({ preventScroll: true });
            return;
        }

        this.parentElement.selectItem();
    }

    @HostBinding("class.igx-drop-down__item")
    get itemStyle(): boolean {
        return !this.isHeader;
    }

    markItemSelected() {
        this.parentElement.setSelectedItem(this.index);
        this.parentElement.toggleDirective.close(true);
    }

    constructor(
        public parentElement: any,
        protected elementRef: ElementRef) {
        }
}
/**
 * The `<igx-drop-down-item> is a container intended for row items in
 * a `<igx-drop-down>` container.
 */
@Component({
    selector: "igx-drop-down-item",
    templateUrl: "drop-down-item.component.html"
})
export class IgxDropDownItemComponent extends IgxDropDownItemBase {
    constructor(
        @Inject(forwardRef(() => IgxDropDownComponent)) public parentElement: IgxDropDownComponent,
        protected elementRef: ElementRef
    ) {
        super(parentElement, elementRef);
    }
}
