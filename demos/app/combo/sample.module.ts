import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { IgxComboModule } from "../../lib/main";
import { PageHeaderModule } from "../pageHeading/pageHeading.module";
import { ComboSampleComponent } from "./sample.component";

@NgModule({
    declarations: [ComboSampleComponent],
    imports: [CommonModule, PageHeaderModule, IgxComboModule]
})
export class ComboSampleModule { }
