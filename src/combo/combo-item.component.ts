import {
    Component,
    ElementRef,
    forwardRef,
    HostBinding,
    HostListener,
    Inject,
    Input
} from "@angular/core";
import { IgxCheckboxComponent } from "../checkbox/checkbox.component";
import { IgxSelectionAPIService } from "../core/selection";
import { IgxDropDownItemBase } from "../drop-down/drop-down-item.component";
import { IgxComboDropDownComponent } from "./combo.component";

@Component({
    selector: "igx-combo-item",
    templateUrl: "combo-item.component.html"
})
export class IgxComboItemComponent extends IgxDropDownItemBase {
    /**
     * Gets if the item is the currently selected one in the dropdown
     */

    @Input()
    public itemData;

    public get itemID() {
        // A row in the grid is identified either by:
        // primaryKey data value,
        // or if the primaryKey is omitted, then the whole rowData is used instead.
        const valueKey = this.parentElement.parentElement.valueKey;
        return valueKey ? this.itemData[valueKey] : this.itemData;
    }

    constructor(
        @Inject(forwardRef(() => IgxComboDropDownComponent)) public parentElement: IgxComboDropDownComponent,
        protected elementRef: ElementRef,
        protected selectionAPI: IgxSelectionAPIService
    ) {
        super(parentElement, elementRef);
    }

    get isSelected() {
        return this.parentElement.selectedItem.indexOf(this.itemID) > -1;
    }

    markItemSelected() {
        this.parentElement.setSelectedItem(this.itemID);
    }
}
