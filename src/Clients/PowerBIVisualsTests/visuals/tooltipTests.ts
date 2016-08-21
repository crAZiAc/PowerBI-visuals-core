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

/// <reference path="../_references.ts"/>

module powerbitests {
    import SVGUtil = powerbi.visuals.SVGUtil;
    import Rect = powerbi.visuals.Rect;
    import TooltipBuilder = powerbi.visuals.TooltipBuilder;
    import TooltipManager = powerbi.visuals.TooltipManager;
    import TooltipEvent = powerbi.visuals.TooltipEvent;
    import TooltipContainer = powerbi.visuals.TooltipContainer;
    import ValueType = powerbi.ValueType;
    import VisualTooltipDataItem = powerbi.VisualTooltipDataItem;

    powerbitests.mocks.setLocale();

    describe("Tooltip DOM tests", () => {
        let element: JQuery;
        let tooltipInfo: VisualTooltipDataItem[];
        let tooltip: TooltipContainer;

        beforeEach(() => {
            createDomElement();
        });

        it('DOM container exists', () => {
            // Show tooltip
            let clickedArea = new Rect(200, 200, 0, 0);
            tooltip.show(tooltipInfo, clickedArea);

            let tooltipContainer = getTooltipContainer();
            expect(tooltipContainer.length).toBe(1);
        });

        it('Has single instance of DOM container', () => {
            // Show tooltip
            let clickedArea = new Rect(200, 200, 0, 0);
            tooltip.show(tooltipInfo, clickedArea);

            // Hide
            hideTooltip();

            // Show
            tooltip.show(tooltipInfo, clickedArea);

            // Hide
            hideTooltip();

            // Show
            tooltip.show(tooltipInfo, clickedArea);

            // Show
            tooltip.show(tooltipInfo, clickedArea);

            let tooltipContainer = getTooltipContainer();
            expect(tooltipContainer.length).toBe(1);
        });

        it('DOM two rows exist', () => {
            // Show tooltip
            let clickedArea = new Rect(200, 200, 0, 0);
            tooltip.show(tooltipInfo, clickedArea);

            let tooltipRow = getTooltipContainer().find('.tooltip-row');

            expect(tooltipRow.length).toBe(2);
        });

        it('DOM two title cells exist', () => {
            // Show tooltip
            let clickedArea = new Rect(200, 200, 0, 0);
            tooltip.show(tooltipInfo, clickedArea);

            let tooltipTitle = getTooltipContainer().find('.tooltip-title-cell');

            expect(tooltipTitle.length).toBe(2);
        });

        it('DOM two value cells exist', () => {
            // Show tooltip
            let clickedArea = new Rect(200, 200, 0, 0);
            tooltip.show(tooltipInfo, clickedArea);

            let tooltipValue = getTooltipContainer().find('.tooltip-value-cell');

            expect(tooltipValue.length).toBe(2);
        });

        it('DOM content container exists', () => {
            // Show tooltip
            let clickedArea = new Rect(200, 200, 0, 0);
            tooltip.show(tooltipInfo, clickedArea);

            let tooltipContentContainer = getTooltipContainer().find('.tooltip-content-container');
            expect(tooltipContentContainer.length).toBe(1);
        });

        it('DOM container visible', () => {
            // Show tooltip
            let clickedArea = new Rect(200, 200, 0, 0);
            tooltip.show(tooltipInfo, clickedArea);

            let tooltipContainer = getTooltipContainer();
            expect(tooltipContainer).toBeVisible();
        });

        it('DOM container is visible - Show ToolTip', () => {
            // Show tooltip
            let clickedArea = new Rect(200, 200, 0, 0);
            tooltip.show(tooltipInfo, clickedArea);

            let tooltipContainerVisibility = getTooltipContainer();
            expect(tooltipContainerVisibility).toBeVisible();
        });

        it('DOM container style Opacity is 1 - Show ToolTip', () => {
            // Show tooltip
            let clickedArea = new Rect(200, 200, 0, 0);
            tooltip.show(tooltipInfo, clickedArea);

            powerbi.visuals.SVGUtil.flushAllD3Transitions();

            let tooltipContainerOpacity = getTooltipContainer().css('opacity');
            expect(tooltipContainerOpacity).toBeCloseTo(1, 2);
        });

        it('DOM container hiden - Hide ToolTip', () => {
            // Show tooltip
            let clickedArea = new Rect(200, 200, 0, 0);
            tooltip.show(tooltipInfo, clickedArea);
            
            // Hide
            hideTooltip();

            let tooltipContainer = getTooltipContainer();
            let visibility = tooltipContainer.css("visibility");
            expect("hidden").toBe(visibility);
        });

        it('DOM container style Opacity is 1 - Hide ToolTip', () => {
            // Show tooltip
            let clickedArea = new Rect(200, 200, 0, 0);
            tooltip.show(tooltipInfo, clickedArea);
            
            // Hide
            hideTooltip();

            let tooltipContainerOpacity = getTooltipContainer().css('opacity');
            expect(tooltipContainerOpacity).toBe('0');
        });

        it('DOM arrow exists', () => {
            // Show tooltip
            let clickedArea = new Rect(200, 200, 0, 0);
            tooltip.show(tooltipInfo, clickedArea);

            let tooltipContainer = getTooltipContainer();
            let arrow = tooltipContainer.find('.arrow');
            expect(arrow.length).toBe(1);
        });

        it('DOM arrow position test', () => {
            let clickedArea: Rect;

            // Set test screen size
            tooltip.setTestScreenSize(1000, 700);

            // Show tooltip at top left of the screen
            clickedArea = new Rect(200, 200, 0, 0);
            tooltip.show(tooltipInfo, clickedArea);

            let arrowClass: string;
            let tooltipContainer = getTooltipContainer();
            let arrow = tooltipContainer.find('.arrow');

            arrowClass = arrow.attr('class');
            expect(arrowClass).toBe('arrow top left');

            // Hide
            hideTooltip();

            // Show tooltip at top right of the screen
            clickedArea = new Rect(600, 100, 0, 0);
            tooltip.show(tooltipInfo, clickedArea);

            arrowClass = arrow.attr('class');
            expect(arrowClass).toBe('arrow top right');

            // Hide
            hideTooltip();

            // Show tooltip at bottom left of the screen
            clickedArea = new Rect(300, 500, 0, 0);
            tooltip.show(tooltipInfo, clickedArea);

            arrowClass = arrow.attr('class');
            expect(arrowClass).toBe('arrow bottom left');

            // Hide
            hideTooltip();

            // Show tooltip at bottom right of the screen
            clickedArea = new Rect(700, 800, 0, 0);
            tooltip.show(tooltipInfo, clickedArea);

            arrowClass = arrow.attr('class');
            expect(arrowClass).toBe('arrow bottom right');

            // Hide
            hideTooltip();

            // Reset test screen size
            tooltip.setTestScreenSize(null, null);
        });

        describe("Linechart tooltip", () => {
            beforeEach(() => {
                tooltipInfo = [
                    { header: "Jan", color: "#bbbbaa", displayName: "test 1", value: "111" },
                    { header: "Jan", color: "#bbaaee", displayName: "test 2", value: "222" }
                ];
            });

            it('should have header', () => {
                // Show tooltip
                let clickedArea = new Rect(200, 200, 0, 0);
                tooltip.show(tooltipInfo, clickedArea);

                let tooltipHeader = getTooltipContainer().find('.tooltip-header');

                expect(tooltipHeader.length).toBe(1);
                expect(tooltipHeader.html()).toBe("Jan");
            });

            it('should have dots with color', () => {
                // Show tooltip
                let clickedArea = new Rect(200, 200, 0, 0);
                tooltip.show(tooltipInfo, clickedArea);

                let tooltipColor = getTooltipContainer().find('.tooltip-color-cell');

                expect(tooltipColor.length).toBe(2);
            });

            it('should have the right content', () => {
                // Show tooltip
                let clickedArea = new Rect(200, 200, 0, 0);
                tooltip.show(tooltipInfo, clickedArea);

                let tooltipRow = getTooltipContainer().find('.tooltip-row');
                let firstRow = $(tooltipRow[0]);
                let children = firstRow.children();

                let color = $(children[0]).find('circle')[0].style["fill"];
                let name = $(children[1]).html();
                let value = $(children[2]).html();

                helpers.assertColorsMatch(color, "#bbbbaa");
                expect(name).toBe("test 1");
                expect(value).toBe("111");
            });
        });

        function hideTooltip() {
            tooltip.hide();
            SVGUtil.flushAllD3Transitions();
        }

        function getTooltipContainer(): JQuery {
            return element.find('.tooltip-container');
        }

        function createDomElement() {
            element = powerbitests.helpers.testDom('500', '500');

            tooltipInfo = [
                { displayName: "test 1", value: "111" },
                { displayName: "test 2", value: "222" }
            ];
            
            let options: powerbi.visuals.TooltipOptions = {
                animationDuration: 10,
                opacity: 1,
                offsetX: 10,
                offsetY: 10,
            };

            tooltip = new TooltipContainer(element.get(0), options);
        }
    });

    describe("Legacy Tooltip", () => {
        it('Tooltip has localization options defined', () => {
            expect(powerbi.visuals.ToolTipComponent.localizationOptions).toBeDefined();
        });
    });

    describe("Legacy TooltipManager", () => {
        let element: JQuery;
        let d3Element: D3.Selection;
        let originalMouseOverDelay = TooltipManager.tooltipMouseOverDelay;

        beforeEach(() => {
            createDomElement();
            TooltipManager.tooltipMouseOverDelay = 40;

            hideTooltip();
            expect(getTooltipVisibility()).toEqual('hidden');
        });

        afterEach(() => {
            TooltipManager.tooltipMouseOverDelay = originalMouseOverDelay;
        });

        it('Tooltip instance created', () => {
            expect(TooltipManager.ToolTipInstance).toBeDefined();
        });

        it('tooltip is not visible before delay', (done) => {
            emulateShowTooltip();

            setTimeout(() => {
                let visibility = getTooltipVisibility();
                expect(visibility).toEqual('hidden');
                done();
            }, TooltipManager.tooltipMouseOverDelay - 10);
        });

        it('tooltip is visible after delay', (done) => {
            emulateShowTooltip();
            
            setTimeout(() => {
                let visibility = getTooltipVisibility();
                expect(visibility).toEqual('visible');
                done();
            }, TooltipManager.tooltipMouseOverDelay + 10);
        });

        it("mouseover event should be ignored immediately after touch click", (done) => {
            emulateTouchClick();
            emulateShowTooltip();

            setTimeout(() => {
                let visibility = getTooltipVisibility();
                expect(visibility).toEqual('hidden');
                done();
            }, TooltipManager.tooltipMouseOverDelay + 10);
        });

        it("mouseover event should be valid after touch click + delay", (done) => {
            emulateTouchClick();

            setTimeout(() => {
                emulateShowTooltip();

                setTimeout(() => {
                    let visibility = getTooltipVisibility();
                    expect(visibility).toEqual('visible');
                    done();
                }, TooltipManager.tooltipMouseOverDelay + 10);
            }, TooltipManager.handleTouchDelay + 10);
        });

        function getTooltipContainer(): JQuery {
            return $('.tooltip-container');
        }

        function getTooltipVisibility() {
            let tooltipContainer = getTooltipContainer();
            return tooltipContainer.length > 0 ? tooltipContainer.css("visibility") : "hidden";
        }

        function emulateShowTooltip() {
            $(d3Element.node()).d3MouseOver(2, 2);
        }

        function emulateTouchClick() {
            let $element = $(d3Element.node());
            $element.d3TouchStart();
            $element.d3TouchEnd();
        }

        function hideTooltip() {
            TooltipManager.ToolTipInstance.hide();
            SVGUtil.flushAllD3Transitions();
        }

        function createDomElement() {
            element = powerbitests.helpers.testDom('500', '500');
            d3Element = d3.select(element.get(0));

            TooltipManager.addTooltip(d3Element, getMockTooltipData);
        }

        function getMockTooltipData(tooltipEvent: TooltipEvent): powerbi.visuals.TooltipDataItem[] {
            return [
                { displayName: "test 1", value: "111" },
                { displayName: "test 2", value: "222" }
            ];
        }
    });

    describe("Tooltip Builder tests", () => {

        it('createTooltipInfo: category & measure', () => {
            let columns: powerbi.DataViewMetadataColumn[] = [
                {
                    displayName: 'cat',
                    type: ValueType.fromDescriptor({ text: true })
                }, {
                    displayName: 'val',
                    isMeasure: true,
                    type: ValueType.fromDescriptor({ numeric: true })
                },
            ];
            let categoryIdentities = [
                mocks.dataViewScopeIdentity("abc"),
                mocks.dataViewScopeIdentity("def"),
                mocks.dataViewScopeIdentity("ghi")];
            let dataView: powerbi.DataView = {
                metadata: { columns: columns },
                categorical: {
                    categories: [{
                        source: columns[0],
                        values: ['abc', 'def', 'ghi'],
                        identity: categoryIdentities,
                        identityFields: [],
                    }],
                    values: powerbi.data.DataViewTransform.createValueColumns([
                        {
                            source: columns[1],
                            values: [123.321, 234.789, 456.001],
                        }])
                }
            };

            let tooltipInfo = TooltipBuilder.createTooltipInfo(
                null,
                dataView.categorical,
                'abc',
                123.321);

            expect(tooltipInfo).toEqual([
                { displayName: 'cat', value: 'abc' },
                { displayName: 'val', value: '123.321' }]);
        });

        it('createTooltipInfo: category, series & measure', () => {
            let columns: powerbi.DataViewMetadataColumn[] = [
                {
                    displayName: 'cat',
                    type: ValueType.fromDescriptor({ text: true })
                }, {
                    displayName: 'ser',
                    type: ValueType.fromDescriptor({ text: true }),
                }, {
                    displayName: 'val',
                    isMeasure: true,
                    type: ValueType.fromDescriptor({ numeric: true }),
                    groupName: 'ser1',
                },
            ];
            let dataView: powerbi.DataView = {
                metadata: { columns: columns },
                categorical: {
                    categories: [{
                        source: columns[0],
                        values: ['abc', 'def'],
                        identity: [mocks.dataViewScopeIdentity("abc"), mocks.dataViewScopeIdentity("def")],
                    }],
                    values: powerbi.data.DataViewTransform.createValueColumns([
                        {
                            source: columns[2],
                            values: [123, 234],
                            identity: mocks.dataViewScopeIdentity("ABC"),
                        }, {
                            source: columns[2],
                            values: [345, 456],
                            identity: mocks.dataViewScopeIdentity("DEF"),
                        }],
                        undefined,
                        columns[1])
                }
            };

            let tooltipInfo = TooltipBuilder.createTooltipInfo(
                null,
                dataView.categorical,
                'abc',
                123.321);

            expect(tooltipInfo).toEqual([
                { displayName: 'cat', value: 'abc' },
                { displayName: 'ser', value: 'ser1' },
                { displayName: 'val', value: '123.321' }]);
        });

        it('createTooltipInfo: self cross-joined category & measure', () => {
            let columns: powerbi.DataViewMetadataColumn[] = [
                {
                    displayName: 'cat',
                    type: ValueType.fromDescriptor({ text: true })
                }, {
                    displayName: 'val',
                    isMeasure: true,
                    type: ValueType.fromDescriptor({ numeric: true })
                },
            ];
            let categoryIdentities = [
                mocks.dataViewScopeIdentity("abc"),
                mocks.dataViewScopeIdentity("def"),
                mocks.dataViewScopeIdentity("ghi")];
            let dataView = powerbi.data.DataViewSelfCrossJoin.apply({
                metadata: { columns: columns },
                categorical: {
                    categories: [{
                        source: columns[0],
                        values: ['abc', 'def', 'ghi'],
                        identity: categoryIdentities,
                        identityFields: [],
                    }],
                    values: powerbi.data.DataViewTransform.createValueColumns([
                        {
                            source: columns[1],
                            values: [123.321, 234.789, 456.001],
                        }])
                }
            });

            let tooltipInfo = TooltipBuilder.createTooltipInfo(
                null,
                dataView.categorical,
                'abc',
                123.321);

            expect(tooltipInfo).toEqual([
                { displayName: 'cat', value: 'abc' },
                { displayName: 'val', value: '123.321' }]);
        });

        it('addTooltipBucketItem', () => {
            let dataViewMetadata: powerbi.DataViewMetadata = {
                columns: [
                    { displayName: 'col1', queryName: 'col1', roles: { Category: true } },
                    { displayName: 'col2', queryName: 'col2', isMeasure: true, roles: { Y: true } },
                    { displayName: 'col3', queryName: 'col3', isMeasure: true, roles: { Tooltips: true } }]
            };

            let dataView: powerbi.DataView = {
                metadata: dataViewMetadata,
                categorical: {
                    categories: [{
                        source: dataViewMetadata.columns[0],
                        values: ['a'],
                        identity: [mocks.dataViewScopeIdentity('a')]
                    }],
                    values: powerbi.data.DataViewTransform.createValueColumns([{
                        source: dataViewMetadata.columns[1],
                        values: [100],
                    }, {
                        source: dataViewMetadata.columns[2],
                        values: [10],
                    }])
                }
            };

            let extraTooltipInfo = [];
            let reader = powerbi.data.createIDataViewCategoricalReader(dataView);

            TooltipBuilder.addTooltipBucketItem(reader, extraTooltipInfo, 0, 0);

            expect(extraTooltipInfo).toEqual([
                { displayName: 'col3', value: '10' }
            ]);
        });

    });
}
