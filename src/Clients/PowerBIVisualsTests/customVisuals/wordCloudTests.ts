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
    powerbitests.mocks.setLocale();
    import VisualClass = powerbi.visuals.samples.WordCloud;
    import colorAssert = powerbitests.helpers.assertColorsMatch;
    import WordCloudData = powerbitests.customVisuals.sampleDataViews.WordCloudData;
    import VisualSettings = powerbi.visuals.samples.WordCloudSettings;

    describe("WordCloud", () => {
        let visualBuilder: WordCloudBuilder;
        let defaultDataViewBuilder: WordCloudData;
        let dataView: powerbi.DataView;
        let settings:VisualSettings;

        beforeEach(() => {
            visualBuilder = new WordCloudBuilder(1000,500);
            defaultDataViewBuilder = new WordCloudData();
            dataView = defaultDataViewBuilder.getDataView();
            settings = dataView.metadata.objects = <any>new VisualSettings();
        });

        describe('capabilities', () => {
            it("registered capabilities", () => expect(VisualClass.capabilities).toBeDefined());
        });

        // function that returns afghanistan from an array
        const func = e => e.innerHTML === "Afghanistan" || e.textContent === "Afghanistan";

        // function that uses grep to filter
        const grep = (val) => {
            return $.grep(val, func);
        };

        describe("DOM tests", () => {
            it("svg element created", () => expect(visualBuilder.mainElement[0]).toBeInDOM());

            it("basic update", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.wordsText.length)
                        .toBeGreaterThan(0);
                    done();
                });
            });

            it("Word stop property change", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(grep(visualBuilder.wordsText.toArray()).length)
                        .toBeGreaterThan(0);

                    settings.stopWords.show = true;
                    settings.stopWords.words = "Afghanistan";

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        expect(grep(visualBuilder.wordsText.toArray()).length)
                            .toBe(0);
                        done();
                    });
                }, 500);
            });

            it("Word returns after word stop property is changed back", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(grep(visualBuilder.wordsText.toArray()).length)
                        .toBeGreaterThan(0);

                    settings.stopWords.show = true;
                    settings.stopWords.words = "Afghanistan";

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        expect(grep(visualBuilder.wordsText.toArray()).length)
                            .toBe(0);

                        settings.stopWords.show = false;

                        visualBuilder.updateRenderTimeout(dataView, () => {
                            expect(grep(visualBuilder.wordsText.toArray()).length)
                                .toBeGreaterThan(0);
                            done();
                        });
                    }, 500);
                }, 300);
            });

            xit("change color for first country (Afghanistan)", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    let baseWordColor = $(grep(visualBuilder.wordsText.toArray())).css('fill');

                    dataView.categorical.categories[0].objects = [{ dataPoint: { fill: { solid: { color: "#00B8AA" } } } }];

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        colorAssert($(grep(visualBuilder.wordsText.toArray())).css('fill'), baseWordColor);
                        done();
                    });
                }, 100);
            });

            it("click on first visual, then click on the second visual doesn't remove items", (done) => {
                let secondVisualBuilder = new WordCloudBuilder(500, 1000);

                visualBuilder.update(dataView);

                secondVisualBuilder.updateRenderTimeout(dataView, () => {
                    let firstWord = visualBuilder.wordsText.first();
                    firstWord.d3Click(parseInt(firstWord.attr("x"), 10), parseInt(firstWord.attr("y"), 10));
                    setTimeout(() => {
                        let secondWord = secondVisualBuilder.wordsText.first();
                        secondWord.d3Click(parseInt(secondWord.attr("x"), 10), parseInt(secondWord.attr("y"), 10));
                        setTimeout(() => {
                            expect(secondVisualBuilder.wordsText.length).toBe(
                                visualBuilder.wordsText.length);
                            done();
                        });
                    });
                }, 100);
            });

            it("click on first visual, then click on the second visual doesn't remove items", (done) => {
                defaultDataViewBuilder.valuesCategoryValues = [
                    ["car collision hallway fall crash hallway", 1],
                    ["car collision hallway hallway", 2],
                    ["car collision person person car injure", 3]
                ];

                dataView = defaultDataViewBuilder.getDataView();

                visualBuilder.updateflushAllD3TransitionsRenderTimeout(dataView, () => {
                    var texts = visualBuilder.wordsText.toArray().map((e) => $(e).text());
                    expect(texts.length).toEqual(_.difference(texts).length);
                    done();
                }, 100);
            });

            it("multiple selection test", (done) => {
                visualBuilder.updateflushAllD3TransitionsRenderTimeout(dataView, () => {
                    visualBuilder.wordClick("Afghanistan");
                    helpers.renderTimeout(() => {
                        expect(visualBuilder.selectedWords.length).toBe(1);

                        visualBuilder.wordClick("Albania", true);
                        helpers.renderTimeout(() => {
                            expect(visualBuilder.selectedWords.length).toBe(2);

                            done();
                        });
                    });

                }, 300);
            });

            it("max number of words test", (done) => {
                var maxNumberOfWords = 30;
                defaultDataViewBuilder.valuesCategoryValues.forEach((x, i) => x[1] = 1000 + i);
                dataView = defaultDataViewBuilder.getDataView();
                settings = dataView.metadata.objects = <any>new VisualSettings();

                settings.general.isBrokenText = false;
                settings.general.maxNumberOfWords = maxNumberOfWords;
                visualBuilder.updateflushAllD3TransitionsRenderTimeout(dataView, () => {
                    expect(visualBuilder.wordsText.length).toEqual(maxNumberOfWords);
                    done();
                }, 300);
            });

            it("null word values test", () => {
                dataView.categorical.categories[0].values = dataView.categorical.categories[0].values
                    .map((x, i) => (i % 2 === 0) ? null : x);
                expect(() => visualBuilder.update(dataView)).not.toThrowError();
            });
        });
    });

    class WordCloudBuilder extends VisualBuilderBase<VisualClass> {
        constructor(width: number, height: number, isMinervaVisualPlugin: boolean = false) {
            super(width, height, isMinervaVisualPlugin);
        }

        protected build() {
            return new VisualClass();
        }

        public get mainElement() {
            return this.element.children("svg.wordCloud");
        }

        public get words() {
            return this.mainElement.children("g").children("g.words").children("g.word");
        }

        public get wordsText() {
            return this.words.children("text");
        }

        public get wordsRects() {
            return this.words.children("rect");
        }

        public wordClick(text: string, ctrl = false) {
            var elements = this.words.toArray().filter(e => $(e).children("text").text() === text);
            if(_.isEmpty(elements)) {
                return;
            }

            var element = $(elements[0]).children("rect");

            element.d3Click(
                parseFloat(element.attr("x")),
                parseFloat(element.attr("y")),
                ctrl ? powerbitests.helpers.ClickEventType.CtrlKey : undefined);
        }

        public get selectedWords() {
            return this.wordsText.filter((i, e) => parseFloat($(e).css('fill-opacity')) === 1);
        }
    }
}
