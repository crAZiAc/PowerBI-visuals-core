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
    // powerbi
    import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;

    // powerbi.visuals
    import axisStyle = powerbi.visuals.axisStyle;
    import SelectionId = powerbi.visuals.SelectionId;
    import SelectableDataPoint = powerbi.visuals.SelectableDataPoint;
    import SVGUtil = powerbi.visuals.SVGUtil;

    // powerbi.visuals.samples
    import VisualClass = powerbi.visuals.samples.Histogram;
    import HistogramBehavior = powerbi.visuals.samples.HistogramBehavior;
    import histogramUtils = powerbi.visuals.samples.histogramUtils;
    import HistogramDataPoint = powerbi.visuals.samples.HistogramDataPoint;
    import StateOfDataPoint = powerbi.visuals.samples.StateOfDataPoint;

    // powerbitests.helpers
    import assertColorsMatch = powerbitests.helpers.assertColorsMatch;

    // powerbitests.customVisuals.sampleDataViews
    import ValueByAgeData = powerbitests.customVisuals.sampleDataViews.ValueByAgeData;

    describe("HistogramChart", () => {
        describe("capabilities", () => {
            it("registered capabilities", () => expect(VisualClass.capabilities).toBeDefined());
        });

        describe("DOM tests", () => {
            let visualBuilder: HistogramChartBuilder,
                defaultDataViewBuilder: ValueByAgeData,
                dataView: powerbi.DataView;

            beforeEach(() => {
                visualBuilder = new HistogramChartBuilder(1000, 500);
                defaultDataViewBuilder = new ValueByAgeData();

                dataView = defaultDataViewBuilder.getDataView();
            });

            it("svg element created", () => expect(visualBuilder.mainElement[0]).toBeInDOM());

            it("update", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    let binsNumber = d3.layout
                        .histogram()
                        .frequency(true)(dataView.categorical.categories[0].values).length;

                    expect(visualBuilder.mainElement.find(".column").length).toBe(binsNumber);

                    done();
                });
            });
        });

        describe("labels", () => {
            let visualBuilder: HistogramChartBuilder,
                defaultDataViewBuilder: ValueByAgeData,
                dataView: powerbi.DataView;

            beforeEach(() => {
                visualBuilder = new HistogramChartBuilder(1000, 500);
                defaultDataViewBuilder = new ValueByAgeData();

                dataView = defaultDataViewBuilder.getDataView();
            });

            it('Validate Data Label', (done) => {
                dataView.metadata.objects = {
                    labels: {
                        show: true
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let columns: JQuery = visualBuilder.mainElement.find(".columns rect"),
                        dataLabels: JQuery = visualBuilder.mainElement.find(".labels text");

                    expect(dataLabels.length).toBeLessThan(columns.length);

                    done();
                });
            });

            it("Display units - millions", done => {
                dataView.metadata.objects = {
                    labels: {
                        show: true,
                        displayUnits: 1000000,
                    },
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let labelText: string = visualBuilder
                        .mainElement
                        .find('.labels text')
                        .first()
                        .text();

                    expect(labelText).toMatch(/[0-9.]*M/);

                    done();
                });

            });

            it("Display units - thousands", done => {
                dataView.metadata.objects = {
                    labels: {
                        show: true,
                        displayUnits: 1000,
                    },
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let labelText: string = visualBuilder
                        .mainElement
                        .find('.labels text')
                        .first()
                        .text();

                    expect(labelText).toMatch(/[0-9.]*K/);

                    done();
                });

            });

            it("Limit Decimal Places value", done => {
                dataView.metadata.objects = {
                    labels: {
                        show: true,
                        displayUnits: 0,
                        precision: 4,
                    },
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let labelText: string = visualBuilder
                        .mainElement
                        .find('.labels text')
                        .first()
                        .text();

                    expect(labelText).toMatch(/\d*[.]\d{4}/);

                    done();
                });

            });

            it("Data labels font-size", done => {
                dataView.metadata.objects = {
                    labels: {
                        show: true,
                        fontSize: 15,
                    },
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let fontSize: string = visualBuilder
                        .mainElement
                        .find('.labels text')
                        .first()
                        .css('font-size');

                    expect(fontSize).toBe("20px");

                    done();
                });
            });

            it("data labels position validation", (done) => {
                defaultDataViewBuilder.valuesCategory = [
                    10, 11, 12, 15, 16, 20,
                    21, 25, 26, 27, 28, 29,
                    30, 31, 40, 50, 60, 70
                ];

                defaultDataViewBuilder.valuesValue = [
                    7, 6, 10, 4, 3, 3,
                    3, 6, 10, 4, 1, 7,
                    9, 2, 9, 4, 5, 7
                ];

                dataView = defaultDataViewBuilder.getDataView();

                dataView.metadata.objects = {
                    labels: {
                        show: true
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let labels: Element[] = visualBuilder.labels.get();

                    labels.forEach((label: Element) => {
                        let jqueryLabel: JQuery = $(label),
                            x: number,
                            y: number,
                            dx: number,
                            dy: number,
                            transform: { x: string, y: string },
                            currentX: number,
                            currentY: number;

                        x = Number(jqueryLabel.attr("x"));
                        y = Number(jqueryLabel.attr("y"));

                        transform = SVGUtil.parseTranslateTransform(jqueryLabel.attr("transform"));

                        dx = Number(transform.x);
                        dy = Number(transform.y);

                        currentX = x + dx;
                        currentY = y + dy;

                        expect(currentX).toBeGreaterThan(0);
                        expect(currentY).toBeGreaterThan(0);

                        expect(currentX).toBeLessThan(visualBuilder.viewport.width);
                        expect(currentY).toBeLessThan(visualBuilder.viewport.height);

                        done();
                    });
                });
            });
        });

        describe("property pane changes", () => {
            let visualBuilder: HistogramChartBuilder,
                defaultDataViewBuilder: ValueByAgeData,
                dataView: powerbi.DataView;

            beforeEach(() => {
                visualBuilder = new HistogramChartBuilder(1000, 500);
                defaultDataViewBuilder = new ValueByAgeData();

                dataView = defaultDataViewBuilder.getDataView();
            });

            it("Validate data point color change", (done) => {
                dataView.metadata.objects = {
                    dataPoint: {
                        fill: {
                            solid: { color: "#ff0000" }
                        }
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let elements = visualBuilder.mainElement.find(".column");

                    elements.each((index, elem) => {
                        assertColorsMatch($(elem).css("fill"), "#ff0000");
                    });

                    done();
                });
            });

            it("Validate bins count change", (done) => {
                dataView.metadata.objects = { general: { bins: 3 } };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let binsCount: number = visualBuilder
                        .mainElement
                        .find(".column")
                        .length;

                    dataView.metadata.objects = { general: { bins: 6 } };

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        let binsAfterUpdate: number = visualBuilder
                            .mainElement
                            .find(".column")
                            .length;

                        expect(binsCount).toBe(3);

                        expect(binsAfterUpdate).toBeGreaterThan(binsCount);
                        expect(binsAfterUpdate).toBe(6);

                        done();
                    });
                });
            });
        });

        describe("Axes", () => {
            let visualBuilder: HistogramChartBuilder,
                defaultDataViewBuilder: ValueByAgeData,
                dataView: powerbi.DataView;

            beforeEach(() => {
                visualBuilder = new HistogramChartBuilder(1000, 500);
                defaultDataViewBuilder = new ValueByAgeData();

                dataView = defaultDataViewBuilder.getDataView();
            });

            describe("X-axis", () => {
                it("settings change", (done) => {
                    dataView.metadata.objects = {
                        xAxis: {
                            axisColor: {
                                solid: { color: "#ff0011" }
                            }
                        }
                    };

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        let elements: JQuery = visualBuilder.xAxis.find(".tick text");

                        elements.each((index, elem) => {
                            assertColorsMatch($(elem).first().css("fill"), "#ff0011");
                        });

                        done();
                    });
                });

                it("the latest labels should contain three dots when the precision is 17", (done) => {
                    dataView.metadata.objects = {
                        xAxis: {
                            precision: 17
                        }
                    };

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        let labels: JQuery = visualBuilder.xAxis.find(".tick text");

                        expectTextContainsThreeDots(labels.get(0).textContent);
                        expectTextContainsThreeDots(labels.get(labels.length - 1).textContent);

                        done();
                    });
                });

                function expectTextContainsThreeDots(text: string): void {
                    expect(text).toMatch("…");
                }
            });

            describe("Y-axis", () => {
                it("Validate start bigger than end at y axis", (done) => {
                    dataView.metadata.objects = {
                        yAxis: {
                            start: 65,
                            end: 33
                        }
                    };

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        let firstY: string = visualBuilder
                            .yAxis
                            .find(".tick:first text")
                            .text();

                        expect(parseInt(firstY, 10)).toBe(0);

                        done();
                    });
                });

                it('Validate position right y axis', (done) => {
                    dataView.metadata.objects = {
                        yAxis: {
                            position: "Right"
                        }
                    };

                    visualBuilder.update(dataView);

                    setTimeout(() => {
                        let firstY: string = visualBuilder
                            .yAxis
                            .attr("transform")
                            .split(',')[0]
                            .split('(')[1];

                        let lastX: string = visualBuilder
                            .xAxis
                            .find('.tick:last')
                            .attr("transform")
                            .split(',')[0]
                            .split('(')[1];

                        expect(parseInt(firstY, 10)).toBe(parseInt(lastX, 10));

                        done();
                    }, DefaultWaitForRender);
                });

                it('Validate title disabled', (done) => {
                    dataView.metadata.objects = {
                        yAxis: {
                            title: false
                        }
                    };

                    visualBuilder.update(dataView);

                    setTimeout(() => {
                        var titleIndex: number = visualBuilder
                            .mainElement
                            .find('.legends text:last')
                            .attr("style")
                            .indexOf("display: none");

                        expect(titleIndex > -1).toBe(true);

                        done();
                    }, DefaultWaitForRender);
                });
            });

            it("settings change", (done) => {
                dataView.metadata.objects = {
                    yAxis: {
                        axisColor: {
                            solid: { color: "#ff0022" }
                        }
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let elements: JQuery = visualBuilder.yAxis.find(".tick text");

                    elements.each((index, elem) => {
                        assertColorsMatch($(elem).first().css("fill"), "#ff0022");
                    });

                    done();
                });
            });

            it("amount of ticks should be greater than 1 when frequency is false", (done) => {
                dataView.metadata.objects = {
                    general: {
                        frequency: false
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let ticks: JQuery = visualBuilder.yAxis.find(".tick");

                    expect(ticks.length).toBeGreaterThan(1);

                    done();
                });
            });
        });

        describe("getLegend", () => {
            it("getLegend should return the title without any modifications", () => {
                let title: string = "Power BI",
                    legendTitle: string;

                legendTitle = VisualClass.getLegend(title, axisStyle.showTitleOnly, 0);

                expect(legendTitle).toBe(title);
            });

            it("getLegend shouldn't throw any exceptions when axisStyle.showUnitOnly and displayUnits is NaN", () => {
                expect(() => {
                    VisualClass.getLegend("Power BI", axisStyle.showUnitOnly, NaN);
                }).not.toThrow();
            });

            it("getLegend shouldn't throw any exceptions when axisStyle.showBoth and displayUnits is NaN", () => {
                expect(() => {
                    VisualClass.getLegend("Power BI", axisStyle.showBoth, NaN);
                }).not.toThrow();
            });
        });

        describe("areValuesNumbers", () => {
            it("the method should return true when category is integer", () => {
                let areValuesNumbers: boolean,
                    categoryColumn = createCategoryColumn(true);

                areValuesNumbers = VisualClass.areValuesNumbers(categoryColumn);

                expect(areValuesNumbers).toBeTruthy();
            });

            it("the method should return true when category is numeric", () => {
                let areValuesNumbers: boolean,
                    categoryColumn = createCategoryColumn(undefined, true);

                areValuesNumbers = VisualClass.areValuesNumbers(categoryColumn);

                expect(areValuesNumbers).toBeTruthy();
            });

            it("the method should return false when category isn't numeric or integer", () => {
                let areValuesNumbers: boolean,
                    categoryColumn = createCategoryColumn();

                areValuesNumbers = VisualClass.areValuesNumbers(categoryColumn);

                expect(areValuesNumbers).toBeFalsy();
            });

            function createCategoryColumn(
                isInteger: boolean = undefined,
                isNumeric: boolean = undefined): DataViewCategoryColumn {

                return {
                    source: {
                        displayName: undefined,
                        type: {
                            integer: isInteger,
                            numeric: isNumeric
                        }
                    },
                    values: []
                };
            }
        });

        describe("getCorrectXAxisValue", () => {
            it("the method should return a value that equals MaxXAxisEndValue", () => {
                checkCorrectXAxisValue(Number.MAX_VALUE, VisualClass.MaxXAxisEndValue);
            });

            it("the method should return a value that equals MinXAxisStartValue", () => {
                checkCorrectXAxisValue(-Number.MIN_VALUE, VisualClass.MinXAxisStartValue);
            });

            it("the method should return the same value", () => {
                let value: number = 42;

                checkCorrectXAxisValue(value, value);
            });

            function checkCorrectXAxisValue(
                actualValue: number,
                expectedValue: number): void {

                let value: number = VisualClass.getCorrectXAxisValue(actualValue);

                expect(value).toBe(expectedValue);
            }
        });

        describe("histogramUtils", () => {
            describe("getFillOpacity", () => {
                it("method should return DimmedOpacity when hasSelection is true, selected is false", () => {
                    let fillOpacity: number;

                    fillOpacity = histogramUtils.getFillOpacity(false, false, true, false);

                    expect(fillOpacity).toBe(histogramUtils.DimmedOpacity);
                });

                it("method should return DefaultOpacity when hasSelection is true, selected is true", () => {
                    let fillOpacity: number;

                    fillOpacity = histogramUtils.getFillOpacity(true, false, true, false);

                    expect(fillOpacity).toBe(histogramUtils.DefaultOpacity);
                });
            });

            describe("getStateOfDataPoint", () => {
                it("method should return { selected: false, highlight: false } when the dataPoint isn't selected", () => {
                    checkStateOfDataPoint(false, false);
                });

                it("method should return { selected: true, highlight: true } when the dataPoint is selected", () => {
                    checkStateOfDataPoint(true, true);
                });

                function checkStateOfDataPoint(selected: boolean, highlight: boolean): void {
                    let dataPoint: HistogramDataPoint = createDataPoint(selected, highlight),
                        stateOfDataPoint: StateOfDataPoint;

                    stateOfDataPoint = histogramUtils.getStateOfDataPoint(dataPoint);

                    expect(stateOfDataPoint.selected).toBe(selected);
                    expect(stateOfDataPoint.highlight).toBe(highlight);
                }

                function createDataPoint(selected: boolean, highlight: boolean): HistogramDataPoint {
                    let dataPoint: HistogramDataPoint = <HistogramDataPoint>[];

                    dataPoint.subDataPoints = [{
                        selected: selected,
                        highlight: highlight,
                        identity: null
                    }];

                    return dataPoint;
                }
            });
        });

        describe("HistogramBehavior", () => {
            describe("areDataPointsSelected", () => {
                it("method should return false when dataPoint aren't the same", () => {
                    let areDataPointsSelected: boolean,
                        firstDataPoint: SelectableDataPoint[] = [createSelectableDataPoint()],
                        secondDataPoint: SelectableDataPoint[] = [
                            createSelectableDataPoint(true, null)
                        ];

                    areDataPointsSelected = HistogramBehavior.areDataPointsSelected(
                        firstDataPoint, secondDataPoint);

                    expect(areDataPointsSelected).toBeFalsy();
                });

                it("method should return true when dataPoint are the same", () => {
                    let areDataPointsSelected: boolean,
                        selectableDataPoint: SelectableDataPoint[] = [createSelectableDataPoint()];

                    areDataPointsSelected = HistogramBehavior.areDataPointsSelected(
                        selectableDataPoint, selectableDataPoint);

                    expect(areDataPointsSelected).toBeTruthy();
                });
            });

            function createSelectableDataPoint(
                selected: boolean = false,
                identity: SelectionId = SelectionId.createNull()): SelectableDataPoint {

                return {
                    selected: selected,
                    identity: identity
                };
            }
        });
    });

    class HistogramChartBuilder extends VisualBuilderBase<VisualClass> {
        constructor(width: number, height: number, isMinervaVisualPlugin: boolean = false) {
            super(width, height, isMinervaVisualPlugin);
        }

        protected build(): VisualClass {
            return new VisualClass();
        }

        public get mainElement(): JQuery {
            return this.element.children("svg");
        }

        public get labelsContainer(): JQuery {
            return this.mainElement.find(".labelGraphicsContext");
        }

        public get labels(): JQuery {
            return this.labelsContainer.find(".data-labels");
        }

        public get axes(): JQuery {
            return this.mainElement.find(".axes");
        }

        public get xAxis(): JQuery {
            return this.axes.find(".xAxis");
        }

        public get yAxis(): JQuery {
            return this.axes.find(".yAxis");
        }
    }
}
