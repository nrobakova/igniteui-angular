import { Component, ViewChild } from '@angular/core';
import { async, discardPeriodicTasks, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Calendar } from '../calendar/index';
import { KEYCODES } from '../core/utils';
import { DataType } from '../data-operations/data-util';
import { SortingDirection } from '../data-operations/sorting-expression.interface';
import { IgxGridCellComponent } from './cell.component';
import { IgxColumnComponent } from './column.component';
import { IgxGridHeaderComponent } from './grid-header.component';
import { IGridCellEventArgs, IgxGridComponent } from './grid.component';
import { IgxGridModule } from './index';
import { IgxStringFilteringOperand } from '../../public_api';

describe('IgxGrid - Column Pinning ', () => {
    const COLUMN_HEADER_CLASS = '.igx-grid__th';
    const CELL_CSS_CLASS = '.igx-grid__td';
    const FIXED_CELL_CSS = 'igx-grid__th--pinned';

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                DefaultGridComponent,
                GridPinningComponent,
                GridFeaturesComponent
            ],
            imports: [NoopAnimationsModule, IgxGridModule.forRoot()]
        }).compileComponents();
    }));

    it('should correctly initialize when there are initially pinned columns.', () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.detectChanges();
        const grid = fix.componentInstance.instance;

        // verify pinned/unpinned collections
        expect(grid.pinnedColumns.length).toEqual(2);
        expect(grid.unpinnedColumns.length).toEqual(9);

        // verify DOM
        const firstIndexCell = grid.getCellByColumn(0, 'CompanyName');
        expect(firstIndexCell.visibleColumnIndex).toEqual(0);

        const lastIndexCell = grid.getCellByColumn(0, 'ContactName');
        expect(lastIndexCell.visibleColumnIndex).toEqual(1);
        expect(lastIndexCell.nativeElement.classList.contains(FIXED_CELL_CSS)).toBe(true);

        const headers = fix.debugElement.queryAll(By.css(COLUMN_HEADER_CLASS));

        expect(headers[0].context.column.field).toEqual('CompanyName');

        expect(headers[1].context.column.field).toEqual('ContactName');
        expect(headers[1].classes[FIXED_CELL_CSS]).toBe(true);

        // verify container widths
        expect(grid.pinnedWidth).toEqual(400);
        expect(grid.unpinnedWidth).toEqual(400);
    });

    it('should allow pinning/unpinning via the grid API', () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.detectChanges();
        const grid = fix.componentInstance.instance;

        // Unpin column
        grid.unpinColumn('CompanyName');
        fix.detectChanges();

        // verify column is unpinned
        expect(grid.pinnedColumns.length).toEqual(1);
        expect(grid.unpinnedColumns.length).toEqual(10);

        const col = grid.getColumnByName('CompanyName');
        expect(col.pinned).toBe(false);
        expect(col.visibleIndex).toEqual(2);

        // verify DOM
        let cell = grid.getCellByColumn(0, 'CompanyName');
        expect(cell.visibleColumnIndex).toEqual(2);
        expect(cell.nativeElement.classList.contains(FIXED_CELL_CSS)).toBe(false);

        const headers = fix.debugElement.queryAll(By.css(COLUMN_HEADER_CLASS));

        expect(headers[2].context.column.field).toEqual('CompanyName');
        expect(headers[2].classes[FIXED_CELL_CSS]).toBe(false);

        // verify container widths
        expect(grid.pinnedWidth).toEqual(200);
        expect(grid.unpinnedWidth).toEqual(600);

        // pin back the column.
        grid.pinColumn('CompanyName');
        fix.detectChanges();

        // verify column is pinned
        expect(grid.pinnedColumns.length).toEqual(2);
        expect(grid.unpinnedColumns.length).toEqual(9);

        // verify container widths
        expect(grid.pinnedWidth).toEqual(400);
        expect(grid.unpinnedWidth).toEqual(400);

        expect(col.pinned).toBe(true);
        expect(col.visibleIndex).toEqual(1);

        cell = grid.getCellByColumn(0, 'CompanyName');
        expect(cell.visibleColumnIndex).toEqual(1);
        expect(cell.nativeElement.classList.contains(FIXED_CELL_CSS)).toBe(true);
    });

    it('should allow pinning/unpinning via the column API', () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.detectChanges();
        const grid = fix.componentInstance.instance;

        const col = grid.getColumnByName('ID');

        col.pin();
        fix.detectChanges();

        // verify column is pinned
        expect(col.pinned).toBe(true);
        expect(col.visibleIndex).toEqual(2);

        expect(grid.pinnedColumns.length).toEqual(3);
        expect(grid.unpinnedColumns.length).toEqual(8);

        // verify container widths
        expect(grid.pinnedWidth).toEqual(600);
        expect(grid.unpinnedWidth).toEqual(200);

        col.unpin();

        // verify column is unpinned
        expect(col.pinned).toBe(false);
        expect(col.visibleIndex).toEqual(2);

        expect(grid.pinnedColumns.length).toEqual(2);
        expect(grid.unpinnedColumns.length).toEqual(9);

        // verify container widths
        expect(grid.pinnedWidth).toEqual(400);
        expect(grid.unpinnedWidth).toEqual(400);
    });

    it('on unpinning should restore the original location(index) of the column', () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.detectChanges();
        const grid = fix.componentInstance.instance;
        const col = grid.getColumnByName('ContactName');
        expect(col.index).toEqual(2);

        // unpin
        col.unpin();
        fix.detectChanges();

        // check props
        expect(col.index).toEqual(2);
        expect(col.visibleIndex).toEqual(2);

        // check DOM

        const headers = fix.debugElement.queryAll(By.css(COLUMN_HEADER_CLASS));

        expect(headers[2].context.column.field).toEqual('ContactName');
        expect(headers[2].classes[FIXED_CELL_CSS]).toBe(false);

    });

    it('should emit onColumnPinning event and allow changing the insertAtIndex param.', () => {
        const fix = TestBed.createComponent(GridPinningComponent);
        fix.detectChanges();
        const grid = fix.componentInstance.instance;

        let col = grid.getColumnByName('ID');
        col.pin();
        fix.detectChanges();

        expect(col.visibleIndex).toEqual(0);

        col = grid.getColumnByName('City');
        col.pin();

        fix.detectChanges();
        expect(col.visibleIndex).toEqual(0);

        // check DOM
        const headers = fix.debugElement.queryAll(By.css(COLUMN_HEADER_CLASS));
        expect(headers[0].context.column.field).toEqual('City');
        expect(headers[1].context.column.field).toEqual('ID');
    });

    it('should allow filter pinned columns', () => {
        const fix = TestBed.createComponent(GridFeaturesComponent);
        fix.detectChanges();

        const grid = fix.componentInstance.grid;

        // Contains filter
        grid.filter('ProductName', 'Ignite', IgxStringFilteringOperand.instance().condition('contains'), true);
        fix.detectChanges();
        expect(grid.rowList.length).toEqual(2);
        expect(grid.getCellByColumn(0, 'ID').value).toEqual(1);
        expect(grid.getCellByColumn(1, 'ID').value).toEqual(3);

        // Unpin column
        grid.unpinColumn('ProductName');
        fix.detectChanges();
        expect(grid.rowList.length).toEqual(2);
        expect(grid.getCellByColumn(0, 'ID').value).toEqual(1);
        expect(grid.getCellByColumn(1, 'ID').value).toEqual(3);
    });

    it('should allow sorting pinned columns', () => {
        const fix = TestBed.createComponent(GridFeaturesComponent);
        fix.detectChanges();

        const grid = fix.componentInstance.grid;
        const currentColumn = 'ProductName';
        const releasedColumn = 'Released';

        grid.sort(currentColumn, SortingDirection.Asc);

        fix.detectChanges();

        let expectedResult: any = null;
        expect(grid.getCellByColumn(0, currentColumn).value).toEqual(expectedResult);
        expectedResult = true;
        expect(grid.getCellByColumn(0, releasedColumn).value).toEqual(expectedResult);
        expectedResult = 'Some other item with Script';
        expect(grid.getCellByColumn(grid.data.length - 1, currentColumn).value).toEqual(expectedResult);
        expectedResult = null;
        expect(grid.getCellByColumn(grid.data.length - 1, releasedColumn).value).toEqual(expectedResult);

        // Unpin column
        grid.unpinColumn('ProductName');
        fix.detectChanges();

        expectedResult = null;
        expect(grid.getCellByColumn(0, currentColumn).value).toEqual(expectedResult);
        expectedResult = true;
        expect(grid.getCellByColumn(0, releasedColumn).value).toEqual(expectedResult);
        expectedResult = 'Some other item with Script';
        expect(grid.getCellByColumn(grid.data.length - 1, currentColumn).value).toEqual(expectedResult);
        expectedResult = null;
        expect(grid.getCellByColumn(grid.data.length - 1, releasedColumn).value).toEqual(expectedResult);
    });

    it('should not allow pinning new column if start pinned area becomes greater than the grid width', () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.detectChanges();
        const grid = fix.componentInstance.instance;
        let tryPin = false;

        // pin columns to start.
        tryPin = grid.pinColumn('ID');
        fix.detectChanges();
        expect(tryPin).toEqual(true);

        // try to pin the visible unpinned column
        tryPin = grid.pinColumn('ContactTitle');
        fix.detectChanges();
        expect(tryPin).toEqual(false);

        // check DOM
        const headers = fix.debugElement.queryAll(By.css(COLUMN_HEADER_CLASS));
        expect(headers[0].context.column.field).toEqual('CompanyName');
        expect(headers[0].parent.name).toEqual('div');
        expect(headers[1].context.column.field).toEqual('ContactName');
        expect(headers[1].parent.name).toEqual('div');
        expect(headers[2].context.column.field).toEqual('ID');
        expect(headers[2].parent.name).toEqual('div');
        expect(headers[3].context.column.field).toEqual('ContactTitle');
        expect(headers[3].parent.name).toEqual('igx-display-container');
    });

    it('should not allow pinning if pinned areas become greater than the grid width and there are hidden pinned cols', () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.detectChanges();
        const grid = fix.componentInstance.instance;
        let tryPin = false;

        // pin column.
        tryPin = grid.pinColumn('ID');
        fix.detectChanges();
        expect(tryPin).toEqual(true);

        grid.getColumnByName('ID').hidden = true;
        fix.detectChanges();

        // check DOM
        let headers = fix.debugElement.queryAll(By.css(COLUMN_HEADER_CLASS));
        expect(headers[0].context.column.field).toEqual('CompanyName');
        expect(headers[0].parent.name).toEqual('div');
        expect(headers[1].context.column.field).toEqual('ContactName');
        expect(headers[1].parent.name).toEqual('div');
        expect(headers[2].context.column.field).toEqual('ContactTitle');
        expect(headers[2].parent.name).toEqual('igx-display-container');
        expect(headers[3].context.column.field).toEqual('Address');
        expect(headers[3].parent.name).toEqual('igx-display-container');

        // try to pin the visible unpinned column
        tryPin = grid.pinColumn('ContactTitle');
        fix.detectChanges();
        expect(tryPin).toEqual(false);

        // check DOM
        headers = fix.debugElement.queryAll(By.css(COLUMN_HEADER_CLASS));
        expect(headers[0].context.column.field).toEqual('CompanyName');
        expect(headers[0].parent.name).toEqual('div');
        expect(headers[1].context.column.field).toEqual('ContactName');
        expect(headers[1].parent.name).toEqual('div');
        expect(headers[2].context.column.field).toEqual('ContactTitle');
        expect(headers[2].parent.name).toEqual('igx-display-container');
        expect(headers[3].context.column.field).toEqual('Address');
        expect(headers[3].parent.name).toEqual('igx-display-container');
    });

    it('should allow unpinning even if new cols cannot be pinned', () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.detectChanges();
        const grid = fix.componentInstance.instance;
        let tryPin = false;

        // pin column.
        tryPin = grid.pinColumn('ID');
        fix.detectChanges();
        expect(tryPin).toEqual(true);

        // try to pin the visible unpinned column
        tryPin = grid.pinColumn('ContactTitle');
        fix.detectChanges();
        expect(tryPin).toEqual(false);

        grid.unpinColumn('ContactName');
        fix.detectChanges();

        // check DOM
        const headers = fix.debugElement.queryAll(By.css(COLUMN_HEADER_CLASS));
        expect(headers[0].context.column.field).toEqual('CompanyName');
        expect(headers[0].parent.name).toEqual('div');
        expect(headers[1].context.column.field).toEqual('ID');
        expect(headers[1].parent.name).toEqual('div');
        expect(headers[2].context.column.field).toEqual('ContactName');
        expect(headers[2].parent.name).toEqual('igx-display-container');
        expect(headers[3].context.column.field).toEqual('ContactTitle');
        expect(headers[3].parent.name).toEqual('igx-display-container');
    });

    it('should allow horizontal keyboard navigation between start pinned area and unpinned area.', fakeAsync(() => {
        discardPeriodicTasks();
        const fix = TestBed.createComponent(GridPinningComponent);
        fix.detectChanges();
        const grid = fix.componentInstance.instance;
        grid.getColumnByName('CompanyName').pin();
        grid.getColumnByName('ContactName').pin();

        fix.detectChanges();
        const cells = fix.debugElement.queryAll(By.css(CELL_CSS_CLASS));
        let cell = cells[0];
        const mockEvent = { preventDefault: () => { } };

        cell.triggerEventHandler('focus', {});
        tick();
        fix.detectChanges();

        expect(fix.componentInstance.selectedCell.value).toEqual('Maria Anders');
        expect(fix.componentInstance.selectedCell.column.field).toMatch('ContactName');

        cell.triggerEventHandler('keydown.arrowright', mockEvent);
        fix.detectChanges();
        expect(fix.componentInstance.selectedCell.value).toEqual('Alfreds Futterkiste');
        expect(fix.componentInstance.selectedCell.column.field).toMatch('CompanyName');
        cell = cells[1];

        cell.triggerEventHandler('keydown.arrowright', mockEvent);
        fix.detectChanges();
        expect(fix.componentInstance.selectedCell.value).toEqual('ALFKI');
        expect(fix.componentInstance.selectedCell.column.field).toMatch('ID');
        cell = cells[2];

        cell.triggerEventHandler('keydown.arrowleft', mockEvent);
        tick();
        fix.detectChanges();
        expect(fix.componentInstance.selectedCell.value).toEqual('Alfreds Futterkiste');
        expect(fix.componentInstance.selectedCell.column.field).toMatch('CompanyName');
        cell.triggerEventHandler('blur', {});
        cell = cells[0];

        cell.triggerEventHandler('keydown.arrowright', mockEvent);
        tick();
        fix.detectChanges();
        cell = cells[1];

        cell.triggerEventHandler('keydown.arrowright', mockEvent);
        tick();
        fix.detectChanges();
        expect(fix.componentInstance.selectedCell.value).toEqual('ALFKI');
        expect(fix.componentInstance.selectedCell.column.field).toMatch('ID');
        discardPeriodicTasks();
    }));

    it('should allow vertical keyboard navigation in pinned area.', fakeAsync(() => {
        discardPeriodicTasks();
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.detectChanges();
        const grid = fix.componentInstance.instance;
        fix.detectChanges();
        const cells = fix.debugElement.queryAll(By.css(CELL_CSS_CLASS));
        let cell = cells[0];
        const mockEvent = { preventDefault: () => { } };

        cell.triggerEventHandler('focus', {});
        tick();
        fix.detectChanges();

        expect(fix.componentInstance.selectedCell.value).toEqual('Alfreds Futterkiste');
        expect(fix.componentInstance.selectedCell.column.field).toMatch('CompanyName');

        cell.triggerEventHandler('keydown.arrowdown', mockEvent);
        tick();
        fix.detectChanges();

        expect(fix.componentInstance.selectedCell.value).toEqual('Ana Trujillo Emparedados y helados');
        expect(fix.componentInstance.selectedCell.column.field).toMatch('CompanyName');
        cell = cells[4];
        cell.triggerEventHandler('keydown.arrowup', mockEvent);
        tick();
        fix.detectChanges();

        expect(fix.componentInstance.selectedCell.value).toEqual('Alfreds Futterkiste');
        expect(fix.componentInstance.selectedCell.column.field).toMatch('CompanyName');
        discardPeriodicTasks();
    }));

    it('should allow keyboard navigation to first/last cell with Ctrl when there are the pinned columns.', fakeAsync(() => {
        discardPeriodicTasks();
        const fix = TestBed.createComponent(GridPinningComponent);
        fix.detectChanges();
        const mockEvent = { preventDefault: () => { } };
        const grid = fix.componentInstance.instance;
        grid.getColumnByName('CompanyName').pin();
        grid.getColumnByName('ContactName').pin();
        fix.detectChanges();
        const cells = fix.debugElement.queryAll(By.css(CELL_CSS_CLASS));
        let cell = cells[0];
        cell.triggerEventHandler('focus', {});
        fix.detectChanges();
        expect(fix.componentInstance.selectedCell.value).toEqual('Maria Anders');
        expect(fix.componentInstance.selectedCell.column.field).toMatch('ContactName');

        cell.triggerEventHandler('keydown.control.arrowright', null);
        tick();
        fix.detectChanges();

        expect(fix.componentInstance.selectedCell.value).toEqual('Sales Representative');
        expect(fix.componentInstance.selectedCell.column.field).toMatch('ContactTitle');
        cell = cells[cells.length - 1];

        cell.triggerEventHandler('keydown.control.arrowleft', null);
        tick();
        fix.detectChanges();

        expect(fix.componentInstance.selectedCell.value).toEqual('Maria Anders');
        expect(fix.componentInstance.selectedCell.column.field).toMatch('ContactName');
        discardPeriodicTasks();
    }));

    it('should allow hiding/showing pinned column.', () => {
        const fix = TestBed.createComponent(GridPinningComponent);
        fix.detectChanges();
        const grid = fix.componentInstance.instance;
        const col = grid.getColumnByName('CompanyName');
        col.pin();
        fix.detectChanges();
        expect(grid.pinnedColumns.length).toEqual(1);
        expect(grid.unpinnedColumns.length).toEqual(9);

        col.hidden = true;
        fix.detectChanges();

        expect(grid.pinnedColumns.length).toEqual(0);
        expect(grid.unpinnedColumns.length).toEqual(9);

        let headers = fix.debugElement.queryAll(By.css(COLUMN_HEADER_CLASS));

        expect(headers[0].context.column.field).toEqual('ID');
        expect(headers[0].classes[FIXED_CELL_CSS]).toBe(false);

        col.hidden = false;
        fix.detectChanges();

        expect(grid.pinnedColumns.length).toEqual(1);
        expect(grid.unpinnedColumns.length).toEqual(9);

        headers = fix.debugElement.queryAll(By.css(COLUMN_HEADER_CLASS));

        expect(headers[0].context.column.field).toEqual('CompanyName');
        expect(headers[0].classes[FIXED_CELL_CSS]).toBe(true);
    });

    it('should allow pinning a hidden column.', () => {
        const fix = TestBed.createComponent(GridPinningComponent);
        fix.detectChanges();
        const grid = fix.componentInstance.instance;
        const col = grid.getColumnByName('CompanyName');

        col.hidden = true;
        col.pin();
        fix.detectChanges();

        expect(grid.pinnedColumns.length).toEqual(0);
        expect(grid.unpinnedColumns.length).toEqual(9);

        col.hidden = false;
        fix.detectChanges();

        expect(grid.pinnedColumns.length).toEqual(1);
        expect(grid.unpinnedColumns.length).toEqual(9);
    });
    it('should allow hiding columns in the unpinned area.', () => {

        const fix = TestBed.createComponent(GridPinningComponent);
        fix.detectChanges();
        const grid = fix.componentInstance.instance;
        const col1 = grid.getColumnByName('CompanyName');
        const col2 = grid.getColumnByName('ID');

        col1.pin();
        fix.detectChanges();
        col2.hidden = true;
        fix.detectChanges();

        expect(grid.pinnedColumns.length).toEqual(1);
        expect(grid.unpinnedColumns.length).toEqual(8);

        const headers = fix.debugElement.queryAll(By.css(COLUMN_HEADER_CLASS));

        expect(headers[0].context.column.field).toEqual('CompanyName');
        expect(headers[1].context.column.field).toEqual('ContactName');
    });

    it('should correctly initialize pinned columns z-index values.', () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.detectChanges();
        const grid = fix.componentInstance.instance;

        let headers = fix.debugElement.queryAll(By.directive(IgxGridHeaderComponent));

        // First two headers are pinned
        expect(headers[0].componentInstance.zIndex).toEqual(9999);
        expect(headers[1].componentInstance.zIndex).toEqual(9998);

        grid.pinColumn('Region');
        fix.detectChanges();

        // First three headers are pinned
        headers = fix.debugElement.queryAll(By.directive(IgxGridHeaderComponent));
        expect(headers[2].componentInstance.zIndex).toEqual(9997);
    });

    it('should not pin/unpin columns which are already pinned/unpinned', () => {
        const fix = TestBed.createComponent(DefaultGridComponent);
        fix.detectChanges();

        const grid = fix.componentInstance.instance;
        const pinnedColumnsLength = grid.pinnedColumns.length;
        const unpinnedColumnsLength = grid.unpinnedColumns.length;

        let col = grid.getColumnByName('CompanyName');

        let result = col.pin();
        fix.detectChanges();

        expect(grid.pinnedColumns.length).toEqual(pinnedColumnsLength);
        expect(result).toBe(false);

        col = grid.getColumnByName('City');

        result = col.unpin();
        fix.detectChanges();

        expect(grid.unpinnedColumns.length).toEqual(unpinnedColumnsLength);
        expect(result).toBe(false);
    });

    it('should reject pinning a column if unpinned area width is less than 20% of the grid width', () => {
        const fix = TestBed.createComponent(GridPinningComponent);
        const grid = fix.componentInstance.instance;
        fix.detectChanges();
        grid.columns.forEach((column) => {
            if (column.index === 0 || column.index === 1 || column.index === 4 ||
                    column.index === 6) {
                column.pin();
            }
        });
        fix.detectChanges();
        expect(grid.columns[0].pinned).toBe(true);
        expect(grid.columns[1].pinned).toBe(true);
        expect(grid.columns[4].pinned).toBe(false);
        expect(grid.columns[6].pinned).toBe(true);
        expect(grid.unpinnedWidth).toBeGreaterThanOrEqual(grid.unpinnedAreaMinWidth);
    });
});
@Component({
    template: `
        <igx-grid
            [width]='"800px"'
            [height]='"300px"'
            [data]="data"
            (onColumnInit)="initColumns($event)"
            (onSelection)="cellSelected($event)"
            [autoGenerate]="true">
        </igx-grid>
    `
})
export class DefaultGridComponent {
    public selectedCell;
    /* tslint:disable */
    public data = [
        { "ID": "ALFKI", "CompanyName": "Alfreds Futterkiste", "ContactName": "Maria Anders", "ContactTitle": "Sales Representative", "Address": "Obere Str. 57", "City": "Berlin", "Region": null, "PostalCode": "12209", "Country": "Germany", "Phone": "030-0074321", "Fax": "030-0076545" },
        { "ID": "ANATR", "CompanyName": "Ana Trujillo Emparedados y helados", "ContactName": "Ana Trujillo", "ContactTitle": "Owner", "Address": "Avda. de la Constitución 2222", "City": "México D.F.", "Region": null, "PostalCode": "05021", "Country": "Mexico", "Phone": "(5) 555-4729", "Fax": "(5) 555-3745" },
        { "ID": "ANTON", "CompanyName": "Antonio Moreno Taquería", "ContactName": "Antonio Moreno", "ContactTitle": "Owner", "Address": "Mataderos 2312", "City": "México D.F.", "Region": null, "PostalCode": "05023", "Country": "Mexico", "Phone": "(5) 555-3932", "Fax": null },
        { "ID": "AROUT", "CompanyName": "Around the Horn", "ContactName": "Thomas Hardy", "ContactTitle": "Sales Representative", "Address": "120 Hanover Sq.", "City": "London", "Region": null, "PostalCode": "WA1 1DP", "Country": "UK", "Phone": "(171) 555-7788", "Fax": "(171) 555-6750" },
        { "ID": "BERGS", "CompanyName": "Berglunds snabbköp", "ContactName": "Christina Berglund", "ContactTitle": "Order Administrator", "Address": "Berguvsvägen 8", "City": "Luleå", "Region": null, "PostalCode": "S-958 22", "Country": "Sweden", "Phone": "0921-12 34 65", "Fax": "0921-12 34 67" },
        { "ID": "BLAUS", "CompanyName": "Blauer See Delikatessen", "ContactName": "Hanna Moos", "ContactTitle": "Sales Representative", "Address": "Forsterstr. 57", "City": "Mannheim", "Region": null, "PostalCode": "68306", "Country": "Germany", "Phone": "0621-08460", "Fax": "0621-08924" },
        { "ID": "BLONP", "CompanyName": "Blondesddsl père et fils", "ContactName": "Frédérique Citeaux", "ContactTitle": "Marketing Manager", "Address": "24, place Kléber", "City": "Strasbourg", "Region": null, "PostalCode": "67000", "Country": "France", "Phone": "88.60.15.31", "Fax": "88.60.15.32" },
        { "ID": "BOLID", "CompanyName": "Bólido Comidas preparadas", "ContactName": "Martín Sommer", "ContactTitle": "Owner", "Address": "C/ Araquil, 67", "City": "Madrid", "Region": null, "PostalCode": "28023", "Country": "Spain", "Phone": "(91) 555 22 82", "Fax": "(91) 555 91 99" },
        { "ID": "BONAP", "CompanyName": "Bon app'", "ContactName": "Laurence Lebihan", "ContactTitle": "Owner", "Address": "12, rue des Bouchers", "City": "Marseille", "Region": null, "PostalCode": "13008", "Country": "France", "Phone": "91.24.45.40", "Fax": "91.24.45.41" },
        { "ID": "BOTTM", "CompanyName": "Bottom-Dollar Markets", "ContactName": "Elizabeth Lincoln", "ContactTitle": "Accounting Manager", "Address": "23 Tsawassen Blvd.", "City": "Tsawassen", "Region": "BC", "PostalCode": "T2F 8M4", "Country": "Canada", "Phone": "(604) 555-4729", "Fax": "(604) 555-3745" },
        { "ID": "BSBEV", "CompanyName": "B's Beverages", "ContactName": "Victoria Ashworth", "ContactTitle": "Sales Representative", "Address": "Fauntleroy Circus", "City": "London", "Region": null, "PostalCode": "EC2 5NT", "Country": "UK", "Phone": "(171) 555-1212", "Fax": null },
        { "ID": "CACTU", "CompanyName": "Cactus Comidas para llevar", "ContactName": "Patricio Simpson", "ContactTitle": "Sales Agent", "Address": "Cerrito 333", "City": "Buenos Aires", "Region": null, "PostalCode": "1010", "Country": "Argentina", "Phone": "(1) 135-5555", "Fax": "(1) 135-4892" },
        { "ID": "CENTC", "CompanyName": "Centro comercial Moctezuma", "ContactName": "Francisco Chang", "ContactTitle": "Marketing Manager", "Address": "Sierras de Granada 9993", "City": "México D.F.", "Region": null, "PostalCode": "05022", "Country": "Mexico", "Phone": "(5) 555-3392", "Fax": "(5) 555-7293" },
        { "ID": "CHOPS", "CompanyName": "Chop-suey Chinese", "ContactName": "Yang Wang", "ContactTitle": "Owner", "Address": "Hauptstr. 29", "City": "Bern", "Region": null, "PostalCode": "3012", "Country": "Switzerland", "Phone": "0452-076545", "Fax": null },
        { "ID": "COMMI", "CompanyName": "Comércio Mineiro", "ContactName": "Pedro Afonso", "ContactTitle": "Sales Associate", "Address": "Av. dos Lusíadas, 23", "City": "Sao Paulo", "Region": "SP", "PostalCode": "05432-043", "Country": "Brazil", "Phone": "(11) 555-7647", "Fax": null },
        { "ID": "CONSH", "CompanyName": "Consolidated Holdings", "ContactName": "Elizabeth Brown", "ContactTitle": "Sales Representative", "Address": "Berkeley Gardens 12 Brewery", "City": "London", "Region": null, "PostalCode": "WX1 6LT", "Country": "UK", "Phone": "(171) 555-2282", "Fax": "(171) 555-9199" },
        { "ID": "DRACD", "CompanyName": "Drachenblut Delikatessen", "ContactName": "Sven Ottlieb", "ContactTitle": "Order Administrator", "Address": "Walserweg 21", "City": "Aachen", "Region": null, "PostalCode": "52066", "Country": "Germany", "Phone": "0241-039123", "Fax": "0241-059428" },
        { "ID": "DUMON", "CompanyName": "Du monde entier", "ContactName": "Janine Labrune", "ContactTitle": "Owner", "Address": "67, rue des Cinquante Otages", "City": "Nantes", "Region": null, "PostalCode": "44000", "Country": "France", "Phone": "40.67.88.88", "Fax": "40.67.89.89" },
        { "ID": "EASTC", "CompanyName": "Eastern Connection", "ContactName": "Ann Devon", "ContactTitle": "Sales Agent", "Address": "35 King George", "City": "London", "Region": null, "PostalCode": "WX3 6FW", "Country": "UK", "Phone": "(171) 555-0297", "Fax": "(171) 555-3373" },
        { "ID": "ERNSH", "CompanyName": "Ernst Handel", "ContactName": "Roland Mendel", "ContactTitle": "Sales Manager", "Address": "Kirchgasse 6", "City": "Graz", "Region": null, "PostalCode": "8010", "Country": "Austria", "Phone": "7675-3425", "Fax": "7675-3426" },
        { "ID": "FAMIA", "CompanyName": "Familia Arquibaldo", "ContactName": "Aria Cruz", "ContactTitle": "Marketing Assistant", "Address": "Rua Orós, 92", "City": "Sao Paulo", "Region": "SP", "PostalCode": "05442-030", "Country": "Brazil", "Phone": "(11) 555-9857", "Fax": null },
        { "ID": "FISSA", "CompanyName": "FISSA Fabrica Inter. Salchichas S.A.", "ContactName": "Diego Roel", "ContactTitle": "Accounting Manager", "Address": "C/ Moralzarzal, 86", "City": "Madrid", "Region": null, "PostalCode": "28034", "Country": "Spain", "Phone": "(91) 555 94 44", "Fax": "(91) 555 55 93" },
        { "ID": "FOLIG", "CompanyName": "Folies gourmandes", "ContactName": "Martine Rancé", "ContactTitle": "Assistant Sales Agent", "Address": "184, chaussée de Tournai", "City": "Lille", "Region": null, "PostalCode": "59000", "Country": "France", "Phone": "20.16.10.16", "Fax": "20.16.10.17" },
        { "ID": "FOLKO", "CompanyName": "Folk och fä HB", "ContactName": "Maria Larsson", "ContactTitle": "Owner", "Address": "Åkergatan 24", "City": "Bräcke", "Region": null, "PostalCode": "S-844 67", "Country": "Sweden", "Phone": "0695-34 67 21", "Fax": null },
        { "ID": "FRANK", "CompanyName": "Frankenversand", "ContactName": "Peter Franken", "ContactTitle": "Marketing Manager", "Address": "Berliner Platz 43", "City": "München", "Region": null, "PostalCode": "80805", "Country": "Germany", "Phone": "089-0877310", "Fax": "089-0877451" },
        { "ID": "FRANR", "CompanyName": "France restauration", "ContactName": "Carine Schmitt", "ContactTitle": "Marketing Manager", "Address": "54, rue Royale", "City": "Nantes", "Region": null, "PostalCode": "44000", "Country": "France", "Phone": "40.32.21.21", "Fax": "40.32.21.20" },
        { "ID": "FRANS", "CompanyName": "Franchi S.p.A.", "ContactName": "Paolo Accorti", "ContactTitle": "Sales Representative", "Address": "Via Monte Bianco 34", "City": "Torino", "Region": null, "PostalCode": "10100", "Country": "Italy", "Phone": "011-4988260", "Fax": "011-4988261" }
    ];
    /* tslint:enable */
    @ViewChild(IgxGridComponent, { read: IgxGridComponent })
    public instance: IgxGridComponent;

    public initColumns(column: IgxColumnComponent) {
        if (column.field === 'CompanyName' || column.field === 'ContactName') {
            column.pinned = true;
        }
        column.width = '200px';
    }

    public cellSelected(event: IGridCellEventArgs) {
        this.selectedCell = event.cell;
    }
}

@Component({
    template: `
        <igx-grid
            [width]='"800px"'
            [height]='"300px"'
            [data]="data"
            (onSelection)="cellSelected($event)"
            (onColumnPinning)="columnPinningHandler($event)"
          >
        <igx-column  *ngFor="let c of columns" [field]="c.field" [header]="c.field" [width]="c.width">
        </igx-column>
        </igx-grid>
    `
})
export class GridPinningComponent {
    public selectedCell;
    public data = [{
        ID: 'ALFKI',
        CompanyName: 'Alfreds Futterkiste',
        ContactName: 'Maria Anders',
        ContactTitle: 'Sales Representative',
        Address: 'Obere Str. 57',
        City: 'Berlin',
        Region: null,
        PostalCode: '12209',
        Country: 'Germany',
        Phone: '030-0074321',
        Fax: '030-0076545'
    }];
    public columns = [
        { field: 'ID', width: 100 },
        { field: 'CompanyName', width: 300 },
        { field: 'ContactName', width: 200 },
        { field: 'ContactTitle', width: 200 },
        { field: 'Address', width: 300 },
        { field: 'City', width: 100 },
        { field: 'Region', width: 100 },
        { field: 'PostalCode', width: 100 },
        { field: 'Phone', width: 150 },
        { field: 'Fax', width: 150 }
    ];

    @ViewChild(IgxGridComponent, { read: IgxGridComponent })
    public instance: IgxGridComponent;

    public columnPinningHandler($event) {
        $event.insertAtIndex = 0;
    }
    public cellSelected(event: IGridCellEventArgs) {
        this.selectedCell = event.cell;
    }
}

@Component({
    template: `<igx-grid [data]="data">
        <igx-column [field]="'ID'" [header]="'ID'"></igx-column>
        <igx-column [field]="'ProductName'" [filterable]="true" [sortable]="true" [pinned]="true" dataType="string"></igx-column>
        <igx-column [field]="'Downloads'" [filterable]="true" dataType="number"></igx-column>
        <igx-column [field]="'Released'" [filterable]="true" dataType="boolean"></igx-column>
        <igx-column [field]="'ReleaseDate'" [header]="'ReleaseDate'"
            [filterable]="true" dataType="date">
        </igx-column>
    </igx-grid>`
})
export class GridFeaturesComponent {

    public timeGenerator: Calendar = new Calendar();
    public today: Date = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0);

    public data = [
        {
            Downloads: 254,
            ID: 1,
            ProductName: 'Ignite UI for JavaScript',
            ReleaseDate: this.timeGenerator.timedelta(this.today, 'day', 15),
            Released: false
        },
        {
            Downloads: 127,
            ID: 2,
            ProductName: 'NetAdvantage',
            ReleaseDate: this.timeGenerator.timedelta(this.today, 'month', -1),
            Released: true
        },
        {
            Downloads: 20,
            ID: 3,
            ProductName: 'Ignite UI for Angular',
            ReleaseDate: null,
            Released: null
        },
        {
            Downloads: null,
            ID: 4,
            ProductName: null,
            ReleaseDate: this.timeGenerator.timedelta(this.today, 'day', -1),
            Released: true
        },
        {
            Downloads: 100,
            ID: 5,
            ProductName: '',
            ReleaseDate: undefined,
            Released: ''
        },
        {
            Downloads: 702,
            ID: 6,
            ProductName: 'Some other item with Script',
            ReleaseDate: this.timeGenerator.timedelta(this.today, 'day', 1),
            Released: null
        },
        {
            Downloads: 0,
            ID: 7,
            ProductName: null,
            ReleaseDate: this.timeGenerator.timedelta(this.today, 'month', 1),
            Released: true
        },
        {
            Downloads: 1000,
            ID: 8,
            ProductName: null,
            ReleaseDate: this.today,
            Released: false
        }
    ];

    @ViewChild(IgxGridComponent) public grid: IgxGridComponent;
}
