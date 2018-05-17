import { Component, ContentChildren, DebugElement, ViewChild } from "@angular/core";
import { async, ComponentFixture, TestBed} from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { IgxComboComponent, IgxComboModule } from "./combo.component";

describe("Combo", () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [/*BasicComboComponent*/],
            imports: [IgxComboModule]
        }).compileComponents();
    }));

    // General
    it("Combo's input textbox should be read-only", () => {
    // TO DO
    });

    // Rendering
    it("All appropriate classes should be applied on combo initialization", () => {
        // TO DO
    });
    it("Combo grouping rendering", () => {
        // TO DO
    });
    it("Item selection rendering", () => {
        // TO DO
    });
    it("Combo focused items rendering", () => {
        // TO DO
    });

    // Binding
    it("Combo data binding - array of primitive data", () => {
        // TO DO
    });
    it("Combo data binding - array of objects", () => {
        // TO DO
    });
    it("Combo data binding - remote service", () => {
        // TO DO
    });
    it("Combo data binding - asynchronous pipe", () => {
        // TO DO
    });
    it("Combo data binding - streaming of data", () => {
        // TO DO
    });
    it("The empty template should be rendered When combo data source is not set", () => {
        // TO DO
    });
    it("Combo data binding - change data source runtime", () => {
        // TO DO
    });

    // Dropdown
    it("Dropdown list open/close - dropdown button", () => {
        // TO DO
    });
    it("Dropdown list open/close - key navigation", () => {
        // TO DO
    });
    it("Dropdown list open/close events", () => {
        // TO DO
    });
    it("Home key should scroll up to the first item in the dropdown list", () => {
        // TO DO
    });
    it("End key should scroll down to the last item in the dropdown list", () => {
        // TO DO
    });

    // Selection
    it("Selected items should be appended to the input separated by comma", () => {
        // TO DO
    });
    it("Selected items should be highlighted in the dropdown list", () => {
        // TO DO
    });
    it("Deselected item should be removed from the input", () => {
        // TO DO
    });
    it("Clear button should dismiss all selected items", () => {
        // TO DO
    });
    it("Item selection - checkbox", () => {
        // TO DO
    });
    it("Item selection - key navigation", () => {
        // TO DO
    });
    it("SelectAll option should select/deselect all list items", () => {
        // TO DO
    });
    it("Item selection/deselection should trigger onSelectionChange event ", () => {
        // TO DO
    });
    it("Groupped items should be selectable ", () => {
        // TO DO
    });
    it("Groupped item headdings should not be selectable ", () => {
        // TO DO
    });

    // Filtering
    it("Typing in the textbox input filters the dropdown items", () => {
        // TO DO
    });
    it("Typing in the textbox input filters the dropdown items", () => {
        // TO DO
    });
    it("Typing in the textbox should fire onFilterChanged event", () => {
        // TO DO
    });
    it("Clearing the filter textbox should restore the initial combo dropdown list", () => {
        // TO DO
    });
    it("Enter key should select and append the closest suggestion item from the filtered items list", () => {
        // TO DO
    });

    // Templates
    it("Combo header template", () => {
        // TO DO
    });
    it("Combo footer template", () => {
        // TO DO
    });

    // Grouping
    it("Combo should group items correctly", () => {
        // TO DO
    });

    // Suggestions
    it("Combo should complete the input with the first text match", () => {
        // TO DO
    });
    it("Combo should not display any suggestions when the text match does not begin with the current input", () => {
        // TO DO
    });
    it("Combo should not display any suggestions when there is not any text match", () => {
        // TO DO
    });

    // Custom values
    it("Custom values - combo should display info icon when typing in the input", () => {
        // TO DO
    });
    it("Custom values - Enter key adds the new item in the dropdown list", () => {
        // TO DO
    });
    it("Custom values - clear button dismisses the input text", () => {
        // TO DO
    });
    it("Custom values - typing a value that matches an item from the list selects it", () => {
        // TO DO
    });
    it("Custom values - typing a value that matches an already selected item should remove the corresponding tag", () => {
        // TO DO
    });
});
