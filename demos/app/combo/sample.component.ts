import { Component, OnInit, ViewChild } from "@angular/core";
import { IgxComboComponent } from "../../lib/main";

const primitive = ["1", "2", "3", "4", "5", "6"];
const complex = [{
    field: 1,
    value: 1
}, {
    field: 2,
    value: 2
}, {
    field: 3,
    value: 3
}, {
    field: 4,
    value: 4
}, {
    field: 5,
    value: 5
}, {
    field: 6,
    value: 6
}];
@Component({
    // tslint:disable-next-line:component-selector
    selector: "combo-sample",
    templateUrl: "./sample.component.html",
    styleUrls: ["sample.component.css"]
})
export class ComboSampleComponent implements OnInit {
    private width = "160px";
    @ViewChild(IgxComboComponent) public igxCombo: IgxComboComponent;

    private initData: any[] = [];
    public items: any[] = [];
    private currentDataType = "";

    ngOnInit() {

    }

    constructor() {
        // const states = [
        //     "New England",
        //     "Connecticut",
        //     "Maine",
        //     "Massachusetts",
        //     "New Hampshire",
        //     "Rhode Island",
        //     "Vermont",
        //     "Mid-Atlantic",
        //     "New Jersey",
        //     "New York",
        //     "Pennsylvania",
        //     "East North Central",
        //     "Illinois",
        //     "Indiana",
        //     "Michigan",
        //     "Ohio",
        //     "Wisconsin",
        //     "West North Central",
        //     "Iowa",
        //     "Kansas",
        //     "Minnesota",
        //     "Missouri",
        //     "Nebraska",
        //     "North Dakota",
        //     "South Dakota",
        //     "South Atlantic",
        //     "Delaware",
        //     "Florida",
        //     "Georgia",
        //     "Maryland",
        //     "North Carolina",
        //     "South Carolina",
        //     "Virginia",
        //     "District of Columbia",
        //     "West Virginia",
        //     "East South Central",
        //     "Alabama",
        //     "Kentucky",
        //     "Mississippi",
        //     "Tennessee",
        //     "West South Central",
        //     "Arkansas",
        //     "Louisiana",
        //     "Oklahoma",
        //     "Texas",
        //     "Mountain",
        //     "Arizona",
        //     "Colorado",
        //     "Idaho",
        //     "Montana",
        //     "Nevada",
        //     "New Mexico",
        //     "Utah",
        //     "Wyoming",
        //     "Pacific",
        //     "Alaska",
        //     "California",
        //     "Hawaii",
        //     "Oregon",
        //     "Washington"];

        // const areas = [
        //     "New England",
        //     "Mid-Atlantic",
        //     "East North Central",
        //     "West North Central",
        //     "South Atlantic",
        //     "East South Central",
        //     "West South Central",
        //     "Mountain",
        //     "Pacific"
        // ];

        // for (let i = 0; i < states.length; i += 1) {
        //     const item = { field: states[i] };
        //     if (areas.indexOf(states[i]) !== -1) {
        //         item["header"] = true;
        //     } else if (i % 7 === 4 || i > 49) {
        //         item["disabled"] = true;
        //     }
        //     this.items.push(item);
        //     this.initData = this.items;
        // }

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
                this.initData = this.items;
            });
        }
    }

    changeData(type) {
        switch (type) {
            case "complex":
                this.items = complex;
                this.currentDataType = "complex";
                console.log(this.items, complex);
                break;
            case "primitive":
                this.items = primitive;
                this.currentDataType = "primitive";
                console.log(this.items);
                break;
            default:
                this.items = this.initData;
                this.currentDataType = "initial";
                console.log(this.items);
        }
    }

    onSelection(ev) {
    }

    handleAddition(evt) {
        console.log(evt);
    }
}
