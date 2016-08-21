/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved. 
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *   
 *  The above copyright notice and this permission notice shall be included in 
 *  all copies or substantial portions of the Software.
 *   
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

/// <reference path="../../_references.ts"/>

module powerbitests {
    import Controls = powerbi.visuals.controls;
    import InternalControls = powerbi.visuals.controls.internal;
    import TablixLayoutManager = powerbi.visuals.controls.internal.TablixLayoutManager;

    describe("Tablix Control", () => {

        let fnGetColumnQueryName: (column: InternalControls.TablixColumn) => string;

        let colWidths: Controls.ColumnWidthCollection = {};
        colWidths["Column"] = {
            queryName: "Column",
            width: 50,
            isFixed: true,
        };
        let parentElement;

        beforeAll(() => {

            // Caching implementation before mocking
            fnGetColumnQueryName = Controls.TablixColumnWidthManager.getColumnQueryName;

            // mocking
            Controls.TablixColumnWidthManager.getColumnQueryName = (column: InternalControls.TablixColumn) => {
                return "Column";
            };
        });

        afterAll(() => {
            Controls.TablixColumnWidthManager.getColumnQueryName = fnGetColumnQueryName;
        });

        describe("TablixGrid", () => {
            it("onStartRenderingSession clear", () => {
                let control = createTablixControl();
                let grid = control.layoutManager.grid;
                let gridPresenter = grid._presenter;
                gridPresenter["_owner"] = grid;
                grid["_owner"] = control;

                grid.onStartRenderingIteration();

                grid.getOrCreateColumn(0);
                grid.getOrCreateColumn(1);
                grid.getOrCreateRow(0);
                grid.getOrCreateRow(1);
                grid.getOrCreateFootersRow();

                grid.onStartRenderingSession(true);

                expect(grid["_rows"]).toBe(null);
                expect(grid["_columns"]).toBe(null);
                expect(grid["_footerRow"]).toBe(null);
            });

            it("tablixGrid column resize", function () {
                let control = createTablixControl();
                let grid = control.layoutManager.grid;
                grid.onStartRenderingIteration();
                let col0 = grid.getOrCreateColumn(0);
                expect(col0.getContextualWidth()).toBe(50);
                col0.onResize(35);
                col0.onResizeEnd(35);
                expect(colWidths["Column"].width).toBe(35);
            });

            it("CalculateWidth AutoSize property off ", function () {
                let control = createTablixControl();
                let grid = control.layoutManager.grid;
                let gridPresenter = grid._presenter;
                gridPresenter["_owner"] = grid;
                grid["_owner"] = control;
                let layoutManager = control.layoutManager;

                // Mock setting of property to false
                let columnLayoutManager = layoutManager.columnLayoutManager;
                layoutManager.onStartRenderingIteration(false);
                let col0 = grid.getOrCreateColumn(0);
                spyOn(col0, "calculateSize").and.returnValue(35);
                let col1 = grid.getOrCreateColumn(1);
                spyOn(col1, "calculateSize").and.returnValue(50);
                columnLayoutManager.calculateContextualWidths();
                expect(layoutManager.columnWidthsToPersist.length).toBe(2);
                expect(layoutManager.columnWidthsToPersist[0].width).toBe(35);
                expect(layoutManager.columnWidthsToPersist[1].width).toBe(50);
            });
        });

        describe("TablixLayoutManager", () => {

            it("onStartRenderingSession clear", () => {
                let layoutManager = InternalControls.CanvasTablixLayoutManager.createLayoutManager(createMockBinder(), createMockColumnWidthManager());

                let grid = layoutManager.grid;
                let gridSpy = spyOn(grid, "onStartRenderingSession");
                layoutManager.rowLayoutManager["onStartRenderingSession"] = () => { };
                layoutManager.columnLayoutManager["onStartRenderingSession"] = () => { };
                layoutManager.onStartRenderingSession(null, null, true);
                expect(gridSpy).toHaveBeenCalledWith(true);
            });

            it('RowLayoutManager getRealizedItemsCount noItems', () => {
                let tableBinder = createMockBinder();
                let layoutManager = InternalControls.CanvasTablixLayoutManager.createLayoutManager(tableBinder, createMockColumnWidthManager());
                let rowLayoutManager = layoutManager.rowLayoutManager;
                rowLayoutManager["_realizedRows"] = null;
                let count = rowLayoutManager.getRealizedItemsCount();
                expect(count).toBe(0);
            });

            it('ColumnLayoutManager getRealizedItemsCount noItems', () => {
                let tableBinder = createMockBinder();
                let layoutManager = InternalControls.CanvasTablixLayoutManager.createLayoutManager(tableBinder, createMockColumnWidthManager());
                let columnLayoutManager = layoutManager.columnLayoutManager;
                columnLayoutManager["_realizedColumns"] = null;
                let count = columnLayoutManager.getRealizedItemsCount();
                expect(count).toBe(0);
            });

            it('DimensionLayoutManager getRealizedItemsCount', () => {
                let tableBinder = createMockBinder();
                let layoutManager = InternalControls.CanvasTablixLayoutManager.createLayoutManager(tableBinder, createMockColumnWidthManager());
                let rowLayoutManager = layoutManager.rowLayoutManager;
                spyOn(rowLayoutManager, "_getRealizedItems").and.returnValue([1, 2, 3]);
                let count = rowLayoutManager.getRealizedItemsCount();
                expect(count).toBe(3);
            });
        });

        describe("TablixControl", () => {

            let tablixControl: Controls.TablixControl;
            let layoutManager: TablixLayoutManager;

            beforeEach(() => {
                tablixControl = createTablixControl();
                layoutManager = tablixControl.layoutManager;
            });

            it("parentElement class name set to tablixContainer", () => {
                expect(parentElement.className).toBe('tablixContainer');
            });

            describe('with options', () => {
                it("fontSize option sets font-size property on container", () => {
                    tablixControl = createTablixControlWithOptions({
                        interactive: true,
                        enableTouchSupport: false,
                        layoutKind: Controls.TablixLayoutKind.Canvas,
                        fontSize: '24px',
                    });
                    layoutManager = tablixControl.layoutManager;

                    let actualFontSize = $(parentElement).find('.tablixCanvas').css('font-size');
                    expect(actualFontSize).toBe('24px');
                });
            });

            describe('clearRows', () => {
                it("Render clear calls clearRows once", () => {

                    // Force a few rendering iterations.
                    let counter: number = 3;
                    layoutManager["onEndRenderingIteration"] = () => { return 0 === counter--; };

                    let spy = spyOn(layoutManager.grid, "clearRows");
                    tablixControl.refresh(true);

                    expect(spy.calls.all().length).toBe(1);
                });

                it("Render clear false no clearRows call", () => {
                    let counter: number = 1;
                    layoutManager["onEndRenderingIteration"] = () => { return 0 === counter--; };

                    let spy = spyOn(layoutManager.grid, "clearRows");
                    tablixControl.refresh(false);
                    expect(spy).not.toHaveBeenCalled();
                });
            });

            describe('Scrolling with mousewheel', () => {
                let spyVerticalScrolling: jasmine.Spy;
                let spyHorizontalScrolling: jasmine.Spy;
                let evt: WheelEvent;

                beforeEach(() => {
                    spyVerticalScrolling = spyOn(tablixControl.rowDimension.scrollbar, "onMouseWheel");
                    spyVerticalScrolling.and.stub();
                    spyHorizontalScrolling = spyOn(tablixControl.columnDimension.scrollbar, "onMouseWheel");
                    spyHorizontalScrolling.and.stub();
                });

                describe("on Canvas", () => {

                    afterEach(() => {
                        expect(evt.defaultPrevented).toBeTruthy();
                    });

                    describe("in Y direction", () => {

                        it("doesn't scroll if Tablix has no scrollbars", () => {
                            showVerticalScroll(false);
                            showHorizontalScroll(false);
                            evt = scroll(0, 100);
                            assertWheelBehavior(false, false, true);
                        });

                        it("scrolls vertically if Tablix has only a vertical scrollbar", () => {
                            showVerticalScroll(true);
                            showHorizontalScroll(false);
                            evt = scroll(0, 100);
                            assertWheelBehavior(true, false, true);
                        });

                        it("scrolls horizontally if Tablix has only a horizontal scrollbar", () => {
                            showVerticalScroll(false);
                            showHorizontalScroll(true);
                            evt = scroll(0, 100);
                            assertWheelBehavior(false, true, true);
                        });

                        it("scrolls vertically if Tablix has both scrollbars", () => {
                            showVerticalScroll(true);
                            showHorizontalScroll(true);
                            evt = scroll(0, 100);
                            assertWheelBehavior(true, false, true);
                        });
                    });

                    describe("in X direction", () => {
                        it("doesn't scroll if Tablix has no scrollbars", () => {
                            showVerticalScroll(false);
                            showHorizontalScroll(false);
                            scroll(100, 0);
                            assertWheelBehavior(false, false, true);
                        });

                        it("doesn't scroll if Tablix has only a vertical scrollbar", () => {
                            showVerticalScroll(true);
                            showHorizontalScroll(false);
                            scroll(100, 0);
                            assertWheelBehavior(false, false, true);
                        });

                        it("scrolls horizontally if Tablix has only a horizontal scrollbar", () => {
                            showVerticalScroll(false);
                            showHorizontalScroll(true);
                            scroll(100, 0);
                            assertWheelBehavior(false, true, true);
                        });

                        it("scrolls horizontally if Tablix has both scrollbars", () => {
                            showVerticalScroll(true);
                            showHorizontalScroll(true);
                            scroll(100, 0);
                            assertWheelBehavior(false, true, true);
                        });
                    });

                    describe("in X/Y direction", () => {
                        it("doesn't scroll if Tablix has no scrollbars", () => {
                            showVerticalScroll(false);
                            showHorizontalScroll(false);
                            scroll(100, 100);
                            assertWheelBehavior(false, false, true);
                        });

                        it("scrolls vertically if Tablix has only a vertical scrollbar", () => {
                            showVerticalScroll(true);
                            showHorizontalScroll(false);
                            scroll(100, 100);
                            assertWheelBehavior(true, false, true);
                        });

                        it("scrolls horizontally if Tablix has only a horizontal scrollbar", () => {
                            showVerticalScroll(false);
                            showHorizontalScroll(true);
                            scroll(100, 100);
                            assertWheelBehavior(false, true, true);
                        });

                        it("scrolls in both directions if Tablix has both scrollbars", () => {
                            showVerticalScroll(true);
                            showHorizontalScroll(true);
                            scroll(100, 100);
                            assertWheelBehavior(true, true, true);
                        });
                    });
                });

                describe("On Dashboard", () => {
                    it("doesn't prevent default on event", () => {
                        tablixControl = createTablixControlWithOptions({
                            layoutKind: Controls.TablixLayoutKind.DashboardTile,
                        });

                        showVerticalScroll(false);
                        showHorizontalScroll(false);
                        evt = scroll(0, 100);
                        assertWheelBehavior(false, false, false);
                    });
                });

                function showHorizontalScroll(show: boolean) {
                    tablixControl.columnDimension.scrollbar["_visible"] = show;
                }

                function showVerticalScroll(show: boolean) {
                    tablixControl.rowDimension.scrollbar["_visible"] = show;
                }

                /**
                 * Simulates a mouse wheel scrolling
                 * @param {number} deltaX Horizontal scrolling amount
                 * @param {number} deltaY Vertical scrolling amount
                 * @returns MouseWheel event
                 */
                function scroll(deltaX: number, deltaY: number): WheelEvent {
                    let ev = helpers.createWheelEvent(deltaX, deltaY);
                    tablixControl.container.dispatchEvent(ev);
                    return ev;
                }

                function assertWheelBehavior(scrolledVertically: boolean, scrolledHorizontally: boolean, eventDefaultPrevented: boolean) {
                    expect(spyVerticalScrolling.calls.any()).toBe(scrolledVertically);
                    spyVerticalScrolling.calls.reset();
                    expect(spyHorizontalScrolling.calls.any()).toBe(scrolledHorizontally);
                    spyHorizontalScrolling.calls.reset();
                    expect(evt.defaultPrevented).toBe(eventDefaultPrevented);
                }
            });
            
            describe("Touch support - enabled", () => validateTouch(true));
            describe("Touch support - disabled", () => validateTouch(false));

            function validateTouch(isTouchEnabled: boolean) {
                it("touch validation", () => {
                    tablixControl = createTablixControlWithOptions({
                        interactive: true,
                        enableTouchSupport: isTouchEnabled,
                    });
                    expect(tablixControl.getIsTouchEventsBound()).toBe(isTouchEnabled);
                });

                it("toggling touch validation", () => {
                    tablixControl = createTablixControlWithOptions({
                        interactive: true,
                        enableTouchSupport: isTouchEnabled,
                    });

                    tablixControl.toggleTouchBindings(false);
                    expect(tablixControl.getIsTouchEventsBound()).toBe(false);
                    
                    tablixControl.toggleTouchBindings(true);
                    expect(tablixControl.getIsTouchEventsBound()).toBe(isTouchEnabled);
                    tablixControl.toggleTouchBindings(true); // second call should not influence touch
                    expect(tablixControl.getIsTouchEventsBound()).toBe(isTouchEnabled);
                });
            }
        });

        describe("Scrollbar", () => {

            let scrollbar: Controls.Scrollbar;
            let parentDiv: HTMLDivElement;

            beforeEach(() => {
                parentDiv = document.createElement("div");
                scrollbar = new Controls.Scrollbar(parentDiv, Controls.TablixLayoutKind.Canvas);
            });

            it("Uses mouse wheel range", () => {
                let scrollSpy = spyOn(scrollbar, "scrollBy");
                scrollSpy.and.stub();
                scrollbar.onMouseWheel(-10);

                expect(scrollSpy).toHaveBeenCalledWith(1);
            });

            it("Detects end of scroll", () => {
                let callbackCalled = false;
                let callback = () => { callbackCalled = true; };
                scrollbar._onscroll.push(() => callback());
                scrollbar.viewMin = 2;
                scrollbar.viewSize = 8;
                scrollbar.onMouseWheel(-240);

                expect(callbackCalled).toBeFalsy();
            });

            it("Scrollbar is attached for Canvas", (done) => {
                expect(parentDiv.children.length).toBe(1);
                done();
            });

            it("Scrollbar is not attached for Dashboard", (done) => {
                while (parentDiv.firstChild) {
                    parentDiv.removeChild(parentDiv.firstChild);
                }

                scrollbar = new Controls.Scrollbar(parentDiv, Controls.TablixLayoutKind.DashboardTile);
                expect(parentDiv.children.length).toBe(0);
                done();
            });
        });

        function createTablixControl(): Controls.TablixControl {
            let tableBinder = createMockBinder();
            let layoutManager = InternalControls.CanvasTablixLayoutManager.createLayoutManager(tableBinder, createMockColumnWidthManager());

            parentElement = document.createElement("div");

            let tablixOptions: Controls.TablixOptions = {
                interactive: true,
                enableTouchSupport: false,
                layoutKind: Controls.TablixLayoutKind.Canvas
            };
            return new Controls.TablixControl(createMockNavigator(), layoutManager, tableBinder, parentElement, tablixOptions);
        }

        function createTablixControlWithOptions(options: Controls.TablixOptions): Controls.TablixControl {
            let tableBinder = createMockBinder();
            let layoutManager = InternalControls.CanvasTablixLayoutManager.createLayoutManager(tableBinder, createMockColumnWidthManager());

            parentElement = document.createElement("div");

            let tablixOptions: Controls.TablixOptions = options;
            return new Controls.TablixControl(createMockNavigator(), layoutManager, tableBinder, parentElement, tablixOptions);
        }

        function createMockBinder(): Controls.ITablixBinder {
            return {
                onStartRenderingSession: () => { },
                onEndRenderingSession: () => { },
                bindRowHeader: (item: any, cell: Controls.ITablixCell) => { },
                unbindRowHeader: (item: any, cell: Controls.ITablixCell) => { },
                bindColumnHeader: (item: any, cell: Controls.ITablixCell) => { },
                unbindColumnHeader: (item: any, cell: Controls.ITablixCell) => { },
                bindBodyCell: (item: any, cell: Controls.ITablixCell) => { },
                unbindBodyCell: (item: any, cell: Controls.ITablixCell) => { },
                bindCornerCell: (item: any, cell: Controls.ITablixCell) => { },
                unbindCornerCell: (item: any, cell: Controls.ITablixCell) => { },
                bindEmptySpaceHeaderCell: (cell: Controls.ITablixCell) => { },
                unbindEmptySpaceHeaderCell: (cell: Controls.ITablixCell) => { },
                bindEmptySpaceFooterCell: (cell: Controls.ITablixCell) => { },
                unbindEmptySpaceFooterCell: (cell: Controls.ITablixCell) => { },
                getHeaderLabel: (item: any): string => { return "label"; },
                getCellContent: (item: any): string => { return "label"; },
                hasRowGroups: () => true
            };
        }

        function createMockNavigator(): Controls.ITablixHierarchyNavigator {
            return {
                getColumnHierarchyDepth: (): number => 1,
                getRowHierarchyDepth: (): number => 1,
                getLeafCount: (hierarchy: any): number => 1,
                getLeafAt: (hierarchy: any, index: number): any => 1,
                getParent: (item: any): any => { },
                getIndex: (item: any): number => 1,
                isLeaf: (item: any): boolean => true,
                isRowHierarchyLeaf: (cornerItem: any): boolean => true,
                isColumnHierarchyLeaf: (cornerItem: any): boolean => true,
                isLastItem: (item: any, items: any): boolean => true,
                getChildren: (item: any): any => { },
                getCount: (items: any): number => 1,
                getAt: (items: any, index: number): any => 1,
                getLevel: (item: any): number => 1,
                getIntersection: (rowItem: any, columnItem: any): any => { },
                getCorner: (rowLevel: number, columnLevel: number): any => { },
                headerItemEquals: (item1: any, item2: any): boolean => true,
                bodyCellItemEquals: (item1: any, item2: any): boolean => true,
                cornerCellItemEquals: (item1: any, item2: any): boolean => true,
                isFirstItem: (item: any, items: any): boolean => true,
                areAllParentsFirst: (item: any): boolean => true,
                areAllParentsLast: (item: any): boolean => true,
                getChildrenLevelDifference: (item: any): number => 1,
            };
        }

        function createMockColumnWidthManager(): Controls.TablixColumnWidthManager {
            let columnWidthManager = new Controls.TablixColumnWidthManager(null /* dataView*/, true, null);
            columnWidthManager.onColumnWidthChanged = (queryName: string, width: number) => {
                colWidths[queryName].width = width;
            };

            columnWidthManager['columnWidthObjects'] = colWidths;
            return columnWidthManager;
        }
    });
} 