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

module powerbitests.customVisuals {
    // powerbi.data
    import SQColumnRefExpr = powerbi.data.SQColumnRefExpr;

    // powerbi.visuals.samples
    import GranularityType = powerbi.visuals.samples.GranularityType;
    import VisualClass = powerbi.visuals.samples.Timeline;
    import TimelineCursorOverElement = powerbi.visuals.samples.TimelineCursorOverElement;

    // powerbitests.helpers
    import colorAssert = powerbitests.helpers.assertColorsMatch;
    import findElementText = powerbitests.helpers.findElementText;

    // powerbitests.customVisuals.sampleDataViews
    import TimelineData = powerbitests.customVisuals.sampleDataViews.TimelineData;

    powerbitests.mocks.setLocale();

    describe("Timeline", () => {
        let visualBuilder: TimelineBuilder,
            defaultDataViewBuilder: TimelineData,
            dataView: powerbi.DataView,
            unWorkableDataView: powerbi.DataView;

        beforeEach(() => {
            visualBuilder = new TimelineBuilder(1000, 500);
            defaultDataViewBuilder = new TimelineData();

            dataView = defaultDataViewBuilder.getDataView();
            unWorkableDataView = defaultDataViewBuilder.getUnWorkableDataView();
        });

        describe('capabilities', () => {
            it("registered capabilities", () => expect(VisualClass.capabilities).toBeDefined());
        });

        describe("converter", () => {
            it("prepareValues", () => {
                let prepareValuesResults: Date[],
                    values: any;

                values = [
                    new Date("2001-01-01"),
                    null,
                    undefined,
                    NaN
                ];

                prepareValuesResults = visualBuilder.visualObject.prepareDates(values);

                expect(prepareValuesResults).toBeDefined();
                expect(prepareValuesResults.length).toEqual(1);
                expect(prepareValuesResults[0].getTime()).toEqual(new Date("2001-01-01").getTime());
            });

            it("identity column name is not changed for non-hierarchical source", () => {
                visualBuilder.update(dataView);

                let column = <SQColumnRefExpr>dataView.categorical.categories[0].identityFields[0];

                expect(column.ref).toEqual(sampleDataViews.TimelineData.ColumnCategory);
            });
        });

        describe("DOM tests", () => {
            it("svg element created", () => expect(visualBuilder.mainElement[0]).toBeInDOM());

            it("basic update", (done) => {
                visualBuilder.setGranularity(dataView, GranularityType.day);
                visualBuilder.update(dataView);

                helpers.renderTimeout(() => {
                    let countOfDays: number = visualBuilder
                        .mainElement
                        .children("g.mainArea")
                        .children(".cellsArea")
                        .children(".cellRect")
                        .length;

                    let countOfTextItems: number = visualBuilder
                        .mainElement
                        .children("g.mainArea")
                        .children("g")
                        .eq(4)
                        .children(".label")
                        .children()
                        .length;

                    expect(countOfDays).toBe(dataView.categorical.categories[0].values.length);
                    expect(countOfTextItems).toBe(dataView.categorical.categories[0].values.length);

                    let cellRects: JQuery = visualBuilder.mainElement.find(".cellRect");

                    cellRects
                        .last()
                        .d3Click(0, 0);

                    let unselectedCellRect: JQuery = visualBuilder
                        .mainElement
                        .find(".cellRect")
                        .first();

                    colorAssert(unselectedCellRect.attr("fill"), 'transparent');

                    let cellHeightStr: string = cellRects[0].attributes.getNamedItem("height").value,
                        cellHeight: number = parseInt(cellHeightStr.replace("px", ""), 10);

                    expect(cellHeight).toBeLessThan(60.1);
                    expect(cellHeight).toBeGreaterThan(29.9);

                    done();
                });
            });

            it("apply blank row data", (done) => {
                visualBuilder.setGranularity(dataView, GranularityType.day);
                visualBuilder.update(dataView);

                helpers.renderTimeout(() => {
                    dataView.categorical.categories[0].values.push(null);

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        let countOfDays: number = visualBuilder
                            .mainElement
                            .children("g.mainArea")
                            .children(".cellsArea")
                            .children(".cellRect")
                            .length;

                        expect(countOfDays).toBe(dataView.categorical.categories[0].values.length - 1);

                        done();
                    });
                });
            });

            it("basic update", (done) => {
                visualBuilder.setGranularity(dataView, GranularityType.year);
                visualBuilder.update(dataView);

                setTimeout(() => {
                    let textLabels: JQuery = $(".selectionRangeContainer");
                    //TimeRangeText check visibility when visual is small
                    let textRangeText: string = findElementText(textLabels);

                    expect(textRangeText).toContain('2016');

                    done();
                }, DefaultWaitForRender);
            });

            it("change color for header", (done) => {
                visualBuilder.setGranularity(dataView, GranularityType.day);
                visualBuilder.update(dataView);

                helpers.renderTimeout(() => {
                    let fillColor: string = visualBuilder
                        .mainElement
                        .children('g.rangeTextArea')
                        .children('text')
                        .css('fill');

                    colorAssert(fillColor, '#777777');

                    dataView.metadata.objects = {
                        rangeHeader: {
                            fontColor: {
                                solid: {
                                    color: "#00B8AA"
                                }
                            }
                        }
                    };

                    visualBuilder.setGranularity(dataView, GranularityType.day);

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        let fillColor: string = visualBuilder
                            .mainElement
                            .children('g.rangeTextArea')
                            .children('text')
                            .css('fill');

                        colorAssert(fillColor, '#00B8AA');

                        done();
                    });
                });
            });

            it("range text cut off with small screen size", (done) => {
                let visualBuilder: TimelineBuilder = new TimelineBuilder(300, 500);

                visualBuilder.setGranularity(dataView, GranularityType.month);
                visualBuilder.update(dataView);

                helpers.renderTimeout(() => {
                    visualBuilder.updateRenderTimeout(dataView, () => {
                        let textLabels: JQuery = $(".selectionRangeContainer"),
                            textRangeText = powerbitests.helpers.findElementText(textLabels);

                        expect(textRangeText.indexOf('…') !== -1).toBe(true);

                        done();
                    });
                });
            });

            it("change color for selected cell color", (done) => {
                dataView.metadata.objects = {};
                visualBuilder.setGranularity(dataView, GranularityType.day);
                visualBuilder.update(dataView);

                helpers.renderTimeout(() => {
                    let fillColor: string = visualBuilder
                        .mainElement
                        .children("g.mainArea")
                        .children(".cellsArea")
                        .children(".cellRect")
                        .css('fill');

                    colorAssert(fillColor, '#ADD8E6');

                    dataView.metadata.objects = {
                        cells: {
                            fillSelected: {
                                solid: {
                                    color: "#00B8AA"
                                }
                            }
                        }
                    };

                    visualBuilder.setGranularity(dataView, GranularityType.day);

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        let fillColor: string = visualBuilder
                            .mainElement
                            .children("g.mainArea")
                            .children(".cellsArea")
                            .children(".cellRect")
                            .css('fill');

                        colorAssert(fillColor, '#00B8AA');

                        done();
                    });
                });
            });

            it("change color for granularity scale", (done) => {
                visualBuilder.setGranularity(dataView, GranularityType.day);
                visualBuilder.update(dataView);

                function checkGranularityScaleElements(color): void {
                    let horizLine: JQuery = visualBuilder
                        .element
                        .find(".timelineSlicer")
                        .children("rect")
                        .first();

                    let vertLine: JQuery = visualBuilder
                        .element
                        .find(".timelineVertLine")
                        .first();

                    let perLetters: JQuery = visualBuilder
                        .element
                        .find(".periodSlicerGranularities")
                        .first();

                    let perText: JQuery = visualBuilder
                        .element
                        .find(".periodSlicerSelection");

                    colorAssert(horizLine.css('fill'), color);
                    colorAssert(vertLine.css('fill'), color);
                    colorAssert(perLetters.css('fill'), color);
                    colorAssert(perText.css('fill'), color);
                }

                helpers.renderTimeout(() => {
                    let defaultColor: string = 'rgb(0, 0, 0)',
                        presetColor: string = 'rgb(255, 0, 0)';

                    checkGranularityScaleElements(defaultColor);

                    dataView.metadata.objects = {
                        granularity: {
                            scaleColor: {
                                solid: { color: presetColor }
                            }
                        }
                    };

                    visualBuilder.setGranularity(dataView, GranularityType.day);

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        checkGranularityScaleElements(presetColor);

                        done();
                    });
                });
            });

            it("change color for granularity slider", (done) => {
                visualBuilder.setGranularity(dataView, GranularityType.day);
                visualBuilder.update(dataView);

                helpers.renderTimeout(() => {
                    let strokeColor: string = visualBuilder
                        .element
                        .find(".periodSlicerRect")
                        .css('stroke');

                    colorAssert(strokeColor, 'rgb(170, 170, 170)');

                    dataView.metadata.objects = {
                        granularity: {
                            sliderColor: {
                                solid: { color: 'rgb(255, 0, 0)' }
                            }
                        }
                    };

                    visualBuilder.setGranularity(dataView, GranularityType.day);

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        let strokeColor: string = visualBuilder
                            .element
                            .find(".periodSlicerRect")
                            .css('stroke');

                        colorAssert(strokeColor, 'rgb(255, 0, 0)');

                        done();
                    });
                });
            });

            it("change color for notselected cell color", (done) => {
                visualBuilder.setGranularity(dataView, GranularityType.day);
                visualBuilder.update(dataView);

                helpers.renderTimeout(() => {
                    let fillColor: string = visualBuilder
                        .mainElement
                        .children("g.mainArea")
                        .children(".cellsArea")
                        .children(".cellRect")
                        .css('fill');

                    colorAssert(fillColor, '#ADD8E6');

                    dataView.categorical.categories[0].values = [new Date(2016, 0, 2)];

                    dataView.metadata.objects = {
                        cells: {
                            fillUnselected: {
                                solid: {
                                    color: "#00B8AA"
                                }
                            }
                        }
                    };

                    visualBuilder.setGranularity(dataView, GranularityType.day);

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        let fillColor: string = visualBuilder
                            .mainElement
                            .children("g.mainArea")
                            .children(".cellsArea")
                            .children(".cellRect")
                            .css('fill');

                        colorAssert(fillColor, '#00B8AA');

                        done();
                    });
                });
            });

            describe("clearCatcher", () => {
                let clearCatcherElement: JQuery;

                beforeEach((done) => {
                    visualBuilder.setGranularity(dataView, GranularityType.day);
                    visualBuilder.update(dataView);

                    spyOn(visualBuilder.visualObject, "clear");

                    helpers.renderTimeout(() => {
                        clearCatcherElement = visualBuilder.element.find(".clearCatcher");

                        done();
                    });
                });

                it("click - event", () => {
                    clearCatcherElement.d3Click(0, 0);

                    expectToCallMethodClear();
                });

                it("touchstart - event", () => {
                    clearCatcherElement.d3TouchStart();

                    expectToCallMethodClear();
                });

                function expectToCallMethodClear(): void {
                    expect(visualBuilder.visualObject["clear"]).toHaveBeenCalled();
                }
            });

            describe("granularity", () => {
                let periodSlicerSelectionRectElements: JQuery;

                beforeEach((done) => {
                    visualBuilder.setGranularity(dataView, GranularityType.month);
                    visualBuilder.update(dataView);

                    spyOn(visualBuilder.visualObject, "redrawPeriod");

                    helpers.renderTimeout(() => {
                        periodSlicerSelectionRectElements = visualBuilder.element.find(".periodSlicerSelectionRect");
                        done();
                    });
                });

                it("mousedown - event", () => {
                    $(periodSlicerSelectionRectElements[0]).d3MouseDown(0, 0);

                    expectToCallRedrawPeriod(GranularityType.year);
                });

                it("settings - event", () => {
                    visualBuilder.setGranularity(dataView, GranularityType.day);

                    visualBuilder.update(dataView);

                    expectToCallRedrawPeriod(GranularityType.day);
                });

                function expectToCallRedrawPeriod(granularity: GranularityType): void {
                    expect(visualBuilder.visualObject.redrawPeriod).toHaveBeenCalledWith(granularity);
                }
            });
        });

        describe('selection', () => {
            it("persist while update", (done) => {
                visualBuilder.setGranularity(dataView, GranularityType.month);
                visualBuilder.update(dataView);

                let countOfMonth: number = visualBuilder
                    .mainElement
                    .find(".cellRect")
                    .length;

                helpers.renderTimeout(() => {
                    visualBuilder.setGranularity(dataView, GranularityType.day);

                    visualBuilder.updateflushAllD3TransitionsRenderTimeout(_.clone(dataView), () => {
                        visualBuilder
                            .mainElement
                            .find(".cellRect")
                            .last()
                            .d3Click(0, 0);

                        visualBuilder.updateflushAllD3TransitionsRenderTimeout(dataView, () => {
                            dataView = defaultDataViewBuilder.getDataView();

                            visualBuilder.setGranularity(dataView, GranularityType.month);

                            visualBuilder.updateflushAllD3TransitionsRenderTimeout(dataView, () => {
                                let countMonthOfSelectedDays: number = visualBuilder
                                    .mainElement
                                    .find(".cellRect")
                                    .length;

                                expect(countMonthOfSelectedDays).toEqual(countOfMonth + 1);

                                done();
                            });
                        });
                    });
                });
            });
        });

        describe("getIndexByPosition", () => {
            let indexes: number[] = [0, 1, 2, 3, 3.14, 4, 4.15, 5],
                widthOfElement: number = 25;

            it("should return 0 when position is lower than 0", () => {
                let position: number = -99,
                    index: number;

                index = getIndexByPosition(position);

                expect(index).toBe(0);
            });

            it("should return max index when position is greater than widthOfElement * maxIndex", () => {
                let position: number = indexes[indexes.length - 1] * widthOfElement * 2,
                    index: number;

                index = getIndexByPosition(position);

                expect(index).toBe(indexes.length - 1);
            });

            it("should return 4 when position is between 3.14 and 4", () => {
                let position: number = 80,
                    index: number;

                index = getIndexByPosition(position);

                expect(index).toBe(4);
            });

            function getIndexByPosition(position: number): number {
                return VisualClass.getIndexByPosition(
                    indexes,
                    widthOfElement,
                    position);
            }
        });

        describe("findCursorOverElement", () => {
            beforeEach((done) => {
                visualBuilder.setGranularity(dataView, GranularityType.day);

                visualBuilder.update(dataView);

                helpers.renderTimeout(done);
            });

            it("-9999", () => {
                expectToCallFindCursorOverElement(-9999, 0);
            });

            it("9999", () => {
                expectToCallFindCursorOverElement(9999, 8);
            });

            it("120", () => {
                expectToCallFindCursorOverElement(120, 1);
            });

            it("220", () => {
                expectToCallFindCursorOverElement(220, 2);
            });

            function expectToCallFindCursorOverElement(x: number, expectedIndex: number): void {
                let cursorOverElement: TimelineCursorOverElement = visualBuilder
                    .visualObject
                    .findCursorOverElement(x);

                expect(cursorOverElement).not.toBeNull();
                expect(cursorOverElement.index).toEqual(expectedIndex);
                expect(cursorOverElement.datapoint).not.toBeNull();
                expect(cursorOverElement.datapoint).not.toBeUndefined();
            }
        });

        describe("datasetsChanged", () => {
            beforeEach((done) => {
                visualBuilder.setGranularity(dataView, GranularityType.day);

                visualBuilder.update(dataView);

                helpers.renderTimeout(done);
            });

            it("workable", (done) => {
                expectToCallDatasetsChanged(false);

                done();
            });

            it("unworkable", (done) => {
                visualBuilder.update(unWorkableDataView);

                helpers.renderTimeout(() => {
                    expectToCallDatasetsChanged(true);

                    done();
                });
            });

            function expectToCallDatasetsChanged(expectedResult: boolean): void {
                let state: boolean = visualBuilder.visualObject['datasetsChangedState'];

                expect(state).toEqual(expectedResult);
            }
        });
    });

    class TimelineBuilder extends VisualBuilderBase<VisualClass> {
        constructor(width: number, height: number, isMinervaVisualPlugin: boolean = false) {
            super(width, height, isMinervaVisualPlugin);
        }

        protected build() {
            return new VisualClass();
        }

        public get visualObject(): VisualClass {
            return this.visual;
        }

        public get mainElement() {
            return this.element
                .children("div")
                .children("svg.timeline");
        }

        public setGranularity(dataView: powerbi.DataView, granularity: GranularityType) {
            if (!dataView.metadata.objects) {
                dataView.metadata.objects = {};
            }

            if (!(<any>dataView.metadata.objects).granularity) {
                (<any>dataView.metadata.objects).granularity = {};
            }

            (<any>dataView.metadata.objects).granularity.granularity = granularity;
        }
    }
}
