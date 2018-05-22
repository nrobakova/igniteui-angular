import { Component, ContentChildren, DebugElement, ViewChild } from "@angular/core";
import { async, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { BrowserAnimationsModule, NoopAnimationsModule } from "@angular/platform-browser/animations";
import { IgxToggleActionDirective, IgxToggleDirective, IgxToggleModule } from "../directives/toggle/toggle.directive";
import { IgxComboItemComponent } from "./combo-item.component";
import { IgxComboComponent, IgxComboModule } from "./combo.component";

const selectedItemClass = ".igx-combo__item--selected";
const citiesData = [
    "New York",
    "Sofia",
    "Istanbul",
    "Paris",
    "Hamburg",
    "Berlin",
    "London",
    "Oslo",
    "Los Angeles",
    "Rome",
    "Madrid",
    "Ottawa",
    "Prague"];
const employeeData = [
    { ID: 1, Name: "Casey Houston", JobTitle: "Vice President", HireDate: "2017-06-19T11:43:07.714Z" },
    { ID: 2, Name: "Gilberto Todd", JobTitle: "Director", HireDate: "2015-12-18T11:23:17.714Z" },
    { ID: 3, Name: "Tanya Bennett", JobTitle: "Director", HireDate: "2005-11-18T11:23:17.714Z" },
    { ID: 4, Name: "Jack Simon", JobTitle: "Software Developer", HireDate: "2008-12-18T11:23:17.714Z" },
    { ID: 5, Name: "Celia Martinez", JobTitle: "Senior Software Developer", HireDate: "2007-12-19T11:23:17.714Z" },
    { ID: 6, Name: "Erma Walsh", JobTitle: "CEO", HireDate: "2016-12-18T11:23:17.714Z" },
    { ID: 7, Name: "Debra Morton", JobTitle: "Associate Software Developer", HireDate: "2005-11-19T11:23:17.714Z" },
    { ID: 8, Name: "Erika Wells", JobTitle: "Software Development Team Lead", HireDate: "2005-10-14T11:23:17.714Z" },
    { ID: 9, Name: "Leslie Hansen", JobTitle: "Associate Software Developer", HireDate: "2013-10-10T11:23:17.714Z" },
    { ID: 10, Name: "Eduardo Ramirez", JobTitle: "Manager", HireDate: "2011-11-28T11:23:17.714Z" }
];

function wrapPromise(callback, resolve, time) {
    return new Promise((res, rej) => {
        return setTimeout(() => {
            callback();
            return res(resolve);
        }, time);
    });
}

fdescribe("Combo", () => {
    beforeEach(async(() => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            declarations: [
                IgxComboTestComponent,
                IgxComboSampleComponent
            ],
            imports: [
                IgxComboModule,
                NoopAnimationsModule,
                IgxToggleModule
            ]
        }).compileComponents();
    }));

    // General

    xit("Should initialize the combo component properly", async(() => {
        const fixture = TestBed.createComponent(IgxComboSampleComponent);
        fixture.detectChanges();
        const combo = fixture.componentInstance.combo;
        const comboButton = fixture.debugElement.query(By.css("button"));
        expect(fixture.componentInstance).toBeDefined();
        expect(combo).toBeDefined();
        expect(combo.collapsed).toBeDefined();
        expect(combo.data).toBeDefined();
        expect(combo.collapsed).toBeTruthy();
        expect(combo.searchInput).toBeUndefined();
        expect(comboButton).toBeDefined();
        expect(combo.placeholder).toBeDefined();
        combo.toggle();
        fixture.whenStable().then(() => {
            return wrapPromise(() => {
                fixture.detectChanges();
                expect(combo.collapsed).toEqual(false);
                expect(combo.searchInput).toBeDefined();
                // expect(combo.searchInput).toEqual(comboButton);
            }, fixture.whenStable(), 1000);
        });
    }));

    // Unit tests
    fit("Should properly initialize templates", () => {
        const fixture = TestBed.createComponent(IgxComboSampleComponent);
        fixture.detectChanges();
        const combo = fixture.componentInstance.combo;
        expect(combo).toBeDefined();
        expect(combo.dropdownFooter).toBeDefined();
        expect(combo.dropdownHeader).toBeDefined();
        expect(combo.dropdownItemTemplate).toBeDefined();
        // Next two templates are not passed in the sample
        expect(combo.addItemTemplate).toBeUndefined();
        expect(combo.headerItemTemplate).toBeUndefined();
    });

    fit("Should properly accept input properties", () => {
        const fixture = TestBed.createComponent(IgxComboSampleComponent);
        fixture.detectChanges();
        const combo = fixture.componentInstance.combo;
        expect(combo.width).toEqual("400px");
        expect(combo.placeholder).toEqual("Location");
        expect(combo.filterable).toEqual(true);
        combo.width = "500px";
        fixture.detectChanges();
        expect(combo.width).toEqual("500px");
        combo.placeholder = "Destination";
        fixture.detectChanges();
        expect(combo.placeholder).toEqual("Destination");
        combo.filterable = false;
        fixture.detectChanges();
        expect(combo.filterable).toEqual(false);
    });

    fit("Should call toggle properly", async(() => {
        const fixture = TestBed.createComponent(IgxComboSampleComponent);
        fixture.detectChanges();
        const combo = fixture.componentInstance.combo;
        spyOn(combo, "open").and.callThrough();
        spyOn(combo, "close").and.callThrough();
        spyOn(combo, "onToggleOpening").and.callThrough();
        spyOn(combo, "onToggleOpened").and.callThrough();
        spyOn(combo, "onToggleClosing").and.callThrough();
        spyOn(combo, "onToggleClosed").and.callThrough();
        spyOn<any>(combo, "cdr").and.callThrough();
        expect(combo.collapsed).toEqual(true);
        combo.toggle();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            expect(combo.open).toHaveBeenCalledTimes(1);
            expect(combo.onToggleOpening).toHaveBeenCalledTimes(1);
            expect(combo.onToggleOpened).toHaveBeenCalledTimes(1);
            expect(combo.collapsed).toEqual(false);
            return fixture.whenStable();
        }).then(() => {
            fixture.detectChanges();
            // spyOnProperty(combo, "collapsed", "get").and.returnValue(false);
            combo.toggle();
            return fixture.whenStable();
        }).then(() => {
            wrapPromise(() => {
                fixture.detectChanges();
                expect(combo.close).toHaveBeenCalledTimes(1);
                expect(combo.onToggleClosed).toHaveBeenCalledTimes(1);
                expect(combo.onToggleClosing).toHaveBeenCalledTimes(1);
                expect(combo.collapsed).toEqual(true);
            }, fixture.whenStable(), 1000);
        });
    }));

    xit("Should properly accept width", () => {
        const fix = TestBed.createComponent(IgxComboSampleComponent);
        fix.detectChanges();
        const combo = fix.componentInstance.combo;
    });

    xit("Should properly accept width", () => {
        const fixture = TestBed.createComponent(IgxComboSampleComponent);
        fixture.detectChanges();
        const combo = fixture.componentInstance.combo;
        expect(combo.width).toEqual(400);
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

    it("Dropdown list open/close - textbox", () => {
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

    it("PageDown/PageUp key should scroll the list a single view down/up", () => {
        // TO DO
    });

    it("Vertical scrollbar should not be visible when the items fit inside the container", () => {
        // TO DO
    });
    it("Vertical scrollbar should be visible when the items does not fit inside the container", () => {
        // TO DO
    });

    // Selection
    it("Selected items should be appended to the input separated by comma", () => {
        // TO DO
    });

    it("Selected items should be appended to the input in the order they are selected", () => {
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
    it("Clear button should not throw exception when no items are selected", () => {
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

    it("Selecting items using the 'selectItems' method should add the items to the previously selected items", () => {
        // TO DO
    });

    it("Selecting items using the 'selectItems' method should override the previously selected items", () => {
        // TO DO
    });

    // Filtering
    it("The textbox input is placed correctly", () => {
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
    it("Escape key should clear the textbox input and close the dropdown list", () => {
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

@Component({
    template: `
    <igx-combo #combo
    [data]="citiesData"
    [width]="'800px'"
    [height]="'600px'"
>
</igx-combo>
`
})
class IgxComboTestComponent {

    @ViewChild("combo", { read: IgxComboComponent })
    public dropdown: IgxComboComponent;

}
@Component({
    template: `
        <p>Change data to:</p>
        <button class="igx-button" igxRipple (click)="changeData('primitive')">Primitve</button>
        <button class="igx-button" igxRipple (click)="changeData('complex')">Complex</button>
        <button class="igx-button" igxRipple (click)="changeData()">Initial</button>
        <igx-combo #combo [placeholder]="'Location'" [data]="items"
        [filterable]="true" [valueKey]="'field'" [groupKey]="'region'" [width]="'400px'">
            <ng-template #dropdownItemTemplate let-display let-key="valueKey">
                <div class="state-card--simple">
                    <span class="small-red-circle"></span>
                    <div class="display-value--main">State: {{display[key]}}</div>
                    <div class="display-value--sub">Region: {{display.region}}</div>
                </div>
            </ng-template>
            <ng-template #dropdownHeader>
                <div class="header-class">This is a header</div>
            </ng-template>
            <ng-template #dropdownFooter>
                <div class="footer-class">This is a footer</div>
            </ng-template>
        </igx-combo>
`
})
class IgxComboSampleComponent {

    @ViewChild("combo", { read: IgxComboComponent })
    public combo: IgxComboComponent;

    public items = [];
    public initData = [];

    constructor() {

        const division = {
            "New England 01": ["Connecticut", "Maine", "Massachusetts"],
            "New England 02": ["New Hampshire", "Rhode Island", "Vermont"],
            "Mid-Atlantic": ["New Jersey", "New York", "Pennsylvania"],
            "East North Central 02": ["Michigan", "Ohio", "Wisconsin"],
            "East North Central 01": ["Illinois", "Indiana"],
            "West North Central 01": ["Missouri", "Nebraska", "North Dakota", "South Dakota"],
            "West North Central 02": ["Iowa", "Kansas", "Minnesota"],
            "South Atlantic 01": ["Delaware", "Florida", "Georgia", "Maryland"],
            "South Atlantic 02": ["North Carolina", "South Carolina", "Virginia", "District of Columbia", "West Virginia"],
            "South Atlantic 03": ["District of Columbia", "West Virginia"],
            "East South Central 01": ["Alabama", "Kentucky"],
            "East South Central 02": ["Mississippi", "Tennessee"],
            "West South Central": ["Arkansas", "Louisiana", "Oklahome", "Texas"],
            "Mountain": ["Arizona", "Colorado", "Idaho", "Montana", "Nevada", "New Mexico", "Utah", "Wyoming"],
            "Pacific 01": ["Alaska", "California"],
            "Pacific 02": ["Hawaii", "Oregon", "Washington"]
        };
        const keys = Object.keys(division);
        for (const key of keys) {
            division[key].map((e) => {
                this.items.push({
                    field: e,
                    region: key.substring(0, key.length - 3)
                });
            });
        }

        this.initData = this.items;
    }

    changeData(type) {
        // switch (type) {
        //     case "complex":
        //         this.items = complex;
        //         this.currentDataType = "complex";
        //         console.log(this.items, complex);
        //         break;
        //     case "primitive":
        //         this.items = primitive;
        //         this.currentDataType = "primitive";
        //         console.log(this.items);
        //         break;
        //     default:
        //         this.items = this.initData;
        //         this.currentDataType = "initial";
        //         console.log(this.items);
        // }
    }
    onSelection(ev) {
    }
}
