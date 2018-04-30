import {Component, ElementRef, forwardRef, HostBinding, HostListener, Inject, Input, OnInit} from "@angular/core";
import {IgxDropDownComponent, ISelectionEventArgs} from "./drop-down.component";

@Component({
    selector: "igx-drop-down-item",
    templateUrl: "drop-down-item.component.html"
})

export class IgxDropDownItemComponent implements OnInit {
    @HostBinding("class.igx-drop-down__item")
    public cssClass = "igx-drop-down__item";

    private _isFocused = false;

    get isSelected() {
        return this.dropDown.selectedItem === this;
    }

    @Input() set isSelected(value: boolean) {
        if (this.isSelected === value) {
            return;
        }

        const oldSelection = this.dropDown.selectedItem;
        this.dropDown.selectedItem = value ? this : null;
        const args: ISelectionEventArgs = {oldSelection, newSelection: this.dropDown.selectedItem};
        this.dropDown.onSelection.emit(args);
    }

    @HostBinding("attr.aria-selected")
    @HostBinding("class.igx-drop-down__item--selected")
    get selectedStyle(): boolean {
        return this.isSelected;
    }

    @HostBinding("class.igx-drop-down__item--focused")
    get isFocused() {
        return this._isFocused;
    }

    set isFocused(value: boolean) {
        if (this.isDisabled || this.isHeader) {
            this._isFocused = false;
            this.element.nativeElement.blur();
            return;
        }

        if (value) {
            this.element.nativeElement.focus();
            this.element.nativeElement.scrollIntoView(true);
        }
        this._isFocused = value;
    }

    @Input()
    @HostBinding("class.igx-drop-down__header")
    public isHeader = false;

    @Input()
    @HostBinding("class.igx-drop-down__item--disabled")
    public isDisabled = false;

    constructor(
        @Inject(forwardRef(() => IgxDropDownComponent)) public dropDown: IgxDropDownComponent,
        private elementRef: ElementRef
    ) {
    }

    @HostListener("click", ["$event"]) clicked(event) {
        if (this.isDisabled || this.isHeader) {
            return;
        }

        const oldSelection = this.dropDown.selectedItem;
        this.dropDown.selectedItem = this;
        const args: ISelectionEventArgs = {oldSelection, newSelection: this.dropDown.selectedItem, event};
        this.dropDown.onSelection.emit(args);
        this.dropDown.toggleDropDown();
    }

    @HostListener("keydown.ArrowDown", ["$event"])
    onArrowDownKeyDown(event) {
        this.dropDown.focusNext();
        event.stopPropagation();
        event.preventDefault();
    }

    @HostListener("keydown.ArrowUp", ["$event"])
    onArrowUpKeyDown(event) {
        this.dropDown.focusPrev();
        event.stopPropagation();
        event.preventDefault();
    }

    ngOnInit() {
        this.element.nativeElement.tabIndex = 0;
    }

    public get index(): number {
        return this.dropDown.items.toArray().indexOf(this);
    }

    public get elementHeight(): number {
        return this.elementRef.nativeElement.clientHeight;
    }

    public get element() {
        return this.elementRef;
    }
}
