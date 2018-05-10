import { Injectable } from "@angular/core";
import { IColumnMovingInfo } from "./grid.common";

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
