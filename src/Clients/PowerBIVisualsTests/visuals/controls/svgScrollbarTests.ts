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
    import SvgScrollbar = powerbi.visuals.controls.SvgScrollbar;
    import Extent = powerbi.visuals.controls.Extent;
    import IViewport = powerbi.IViewport;
    import Prototype = powerbi.Prototype;
    import MouseActions = helpers.MouseActions;

    describe("SVG Scrollbar", () => {
        // Run the tests for a few different configs
        let testOptions: _.Dictionary<SVGScrollbarOptions> = {
            vertical: {
                domHeight: 500,
                domWidth: 500,
                isHorizontal: false,
                scrollScale: d3.scale.ordinal().domain([0, 10]).range([0, 100]),
                scrollbarLength: 100,
                extentLength: 10,
                scrollbarX: 0,
                scrollbarY: 0,
                scrollCallback: () => { }
            },
            horizontal: {
                domHeight: 500,
                domWidth: 500,
                isHorizontal: true,
                scrollScale: d3.scale.ordinal().domain([0, 10]).range([0, 100]),
                scrollbarLength: 100,
                extentLength: 10,
                scrollbarX: 0,
                scrollbarY: 0,
                scrollCallback: () => { }
            }
        };

        // Loop through the configs and run the tests for each of them
        for (let testOptionName in testOptions) {
            let options = testOptions[testOptionName];
            describe(`(${testOptionName})`, () => {
                test(options);
            });
        }

        function test(originalOptions: SVGScrollbarOptions) {
            let scrollbar: SvgScrollbar;
            let $scrollbar: JQuery;
            let $scrollbarBackground: JQuery;
            let $scrollbarThumb: JQuery;
            let options: SVGScrollbarOptions;

            beforeEach(() => {
                // Always set the options as a copy of the original options so mutations don't change other tests
                options = Prototype.inherit(originalOptions);
            });

            describe('scrolling', () => {
                let startExtent: Extent;
                let center: number;
                let extentLength: number;
                let offset: JQueryCoordinates;

                let animationFrameSpy: jasmine.Spy;
                let expectedRenderCount: number;
                let expectedExtent: Extent;

                let thumbMover: MouseActions;
                let backgroundMover: MouseActions;

                beforeEach(() => {
                    // Center the thumb initially to make the tests easier
                    center = options.scrollbarLength / 2;
                    startExtent = {
                        start: center,
                        end: center + options.extentLength
                    };
                    options.startExtent = startExtent;

                    buildScrollbar();
                    renderScrollbar();

                    offset = $scrollbar.offset();
                    extentLength = options.extentLength;

                    if (options.isHorizontal) {
                        thumbMover = new MouseActions($scrollbarThumb, offset.left + center, offset.top);
                        backgroundMover = new MouseActions($scrollbarBackground, offset.left + center, offset.top);
                    }
                    else {
                        thumbMover = new MouseActions($scrollbarThumb, offset.left, offset.top + center);
                        backgroundMover = new MouseActions($scrollbarBackground, offset.left, offset.top + center);
                    }

                    animationFrameSpy = getVisualRenderSpy();
                    expectedRenderCount = 0;
                });

                describe('using thumb', () => {
                    it('does not moved when clicked', (done) => {
                        thumbMover.mouseDown(); // mouseDown instead of click since the D3 brush only looks for mousedown/up events
                        setExpectedExtent(0);
                        waitThenValidate(done);
                    });

                    it('can dragged down', (done) => {
                        let delta = extentLength;
                        moveThumb(delta);
                        setExpectedExtent(delta);
                        waitThenValidate(done);
                    });

                    it('can dragged up', (done) => {
                        let delta = -extentLength;
                        moveThumb(delta);
                        setExpectedExtent(delta);
                        waitThenValidate(done);
                    });

                    describe('stops at the', () => {
                        it('start', (done) => {
                            let scrollDistance: number = -2 * center;
                            moveThumb(scrollDistance);
                            expectedExtent = {
                                start: 0,
                                end: extentLength
                            };
                            waitThenValidate(done);
                        });

                        it('end', (done) => {
                            let scrollDistance: number = 2 * center;
                            moveThumb(scrollDistance);
                            expectedExtent = {
                                start: options.scrollbarLength - extentLength,
                                end: options.scrollbarLength
                            };
                            waitThenValidate(done);
                        });
                    });

                    function moveThumb(delta: number): void {
                        thumbMover.mouseDown();

                        if (options.isHorizontal) {
                            thumbMover.moveDelta(delta, 0);
                        }
                        else {
                            thumbMover.moveDelta(0, delta);
                        }

                        expectedRenderCount++;
                    }
                });

                describe('using background', () => {
                    it('pages when clicked before the thumb', (done) => {
                        moveMouseToBackground(true /*before*/);
                        clickBackground();
                        expectedExtent = {
                            start: startExtent.start - extentLength,
                            end: startExtent.end - extentLength
                        };
                        waitThenValidate(done);
                    });

                    it('pages when clicked after the thumb', (done) => {
                        moveMouseToBackground(false /*before*/);
                        clickBackground();
                        expectedExtent = {
                            start: startExtent.start + extentLength,
                            end: startExtent.end + extentLength
                        };
                        waitThenValidate(done);
                    });

                    describe('pages multiple times when the mouse is held down', () => {

                        let expectedNumPages: number;
                        let mouseDelta: number;
                        let thumbDelta: number;
                        let delay: number;

                        beforeEach(() => {
                            expectedNumPages = 3;
                            thumbDelta = expectedNumPages * extentLength;
                            // Subtract 1 since moveMouseToBackground takes care of moving the mouse to get us the 1st page
                            mouseDelta = (expectedNumPages - 1) * extentLength;
                            // Minus 1 here as well clickBackground takes care of adding 1 to the counter
                            expectedRenderCount += (expectedNumPages - 1);

                            delay = DefaultWaitForRender;
                            delay += SvgScrollbar.InitialPagingDelayMS;
                            // Actual delay is expectedNumPages - 1 (to account for the initial delay), but we wait longer to make sure we stop paging
                            delay += (expectedNumPages + 2) * SvgScrollbar.PagingDelayMS;
                        });

                        it('before the thumb', (done) => {
                            moveMouseToBackground(true /*before*/, -mouseDelta);
                            clickBackground();
                            expectedExtent = {
                                start: startExtent.start - thumbDelta,
                                end: startExtent.end - thumbDelta
                            };
                            waitThenValidate(done, delay);
                        });

                        it('after the thumb', (done) => {
                            moveMouseToBackground(false /*before*/, mouseDelta);
                            clickBackground();
                            expectedExtent = {
                                start: startExtent.start + thumbDelta,
                                end: startExtent.end + thumbDelta
                            };
                            waitThenValidate(done, delay);
                        });
                    });

                    function moveMouseToBackground(before: boolean = false, additionalDelta?: number): void {
                        let extent = scrollbar.getExtent();
                        let newPosition: number;
                        let isHorizontal: boolean = options.isHorizontal;

                        if (before) {
                            newPosition = extent.start + (isHorizontal ? offset.left : offset.top) + - 1;
                        }
                        else {
                            newPosition = extent.end + (isHorizontal ? offset.left : offset.top) + 1;
                        }

                        if (additionalDelta != null) {
                            newPosition += additionalDelta;
                        }

                        if (options.isHorizontal) {
                            backgroundMover.move(newPosition, 0);
                        }
                        else {
                            backgroundMover.move(0, newPosition);
                        }
                    }

                    function clickBackground(): void {
                        backgroundMover.mouseDown(); // mouseDown instead of click since the D3 brush only looks for mousedown/up events
                        expectedRenderCount++;
                    }
                });

                afterEach(() => {
                    thumbMover.reset();
                    backgroundMover.reset();
                });

                function waitThenValidate(done: () => void, delay: number = DefaultWaitForRender): void {
                    setTimeout(() => {
                        validateAll();
                        done();
                    }, delay);
                }

                function setExpectedExtent(deltaStart: number, deltaEnd?: number): Extent {
                    expectedExtent = {
                        start: startExtent.start + deltaStart,
                        end: startExtent.end + (deltaEnd != null ? deltaEnd : deltaStart)
                    };

                    return expectedExtent;
                }

                function validateAll(): void {
                    validateExtent();
                    validateRendered();
                }

                function validateExtent(): void {
                    let actualExtent = scrollbar.getExtent();
                    expect(actualExtent).toEqual(expectedExtent);
                }

                function validateRendered(): void {
                    if (expectedRenderCount > 0) {
                        expect(animationFrameSpy).toHaveBeenCalledTimes(expectedRenderCount);
                    } else {
                        expect(animationFrameSpy).not.toHaveBeenCalled();
                    }
                }
            });

            it('can be removed', () => {
                buildScrollbar();
                renderScrollbar();

                // Verify the scrollbar is in the DOM, remove it, and then verify it's no longer in the DOM
                expect($scrollbar.get(0)).toBeDefined();
                scrollbar.remove();
                $scrollbar = $('.brush');
                expect($scrollbar.get(0)).toBeUndefined();
            });

            describe('extent', () => {
                let inputExtent: Extent;
                let expectedExtent: Extent;
                let extentLength: number;
                let scrollbarLength: number;

                beforeEach(() => {
                    buildScrollbar();
                    extentLength = options.extentLength;
                    scrollbarLength = options.extentLength;
                });

                it('with normal values is set properly', () => {
                    inputExtent = { start: 0, end: extentLength };
                    expectedExtent = { start: 0, end: extentLength };
                    setAndValidateExtent();
                });

                it('with start outside the lower bound is set properly', () => {
                    inputExtent = { start: -1, end: extentLength - 1 };
                    expectedExtent = { start: 0, end: extentLength };
                    setAndValidateExtent();
                });

                it('with both values outside the lower bound is set properly', () => {
                    inputExtent = { start: extentLength - 1, end: -1 };
                    expectedExtent = { start: 0, end: extentLength };
                    setAndValidateExtent();
                });

                it('with end outside the upper bound is set properly', () => {
                    inputExtent = { start: scrollbarLength - extentLength + 1, end: scrollbarLength + 1 };
                    expectedExtent = { start: scrollbarLength - extentLength, end: scrollbarLength };
                    setAndValidateExtent();
                });

                it('with both values outside the upper bound is set properly', () => {
                    inputExtent = { start: scrollbarLength + 1, end: scrollbarLength + extentLength + 1 };
                    expectedExtent = { start: 0, end: extentLength };
                    setAndValidateExtent();
                });

                it('with no start is set properly', () => {
                    inputExtent = { start: null, end: extentLength };
                    expectedExtent = { start: 0, end: extentLength };
                    setAndValidateExtent();
                });

                it('with no start with end outside the upper bound is set properly', () => {
                    inputExtent = { start: null, end: scrollbarLength + 1 };
                    expectedExtent = { start: scrollbarLength - extentLength, end: scrollbarLength };
                    setAndValidateExtent();
                });

                it('with no end is set properly', () => {
                    inputExtent = { start: 0, end: null };
                    expectedExtent = { start: 0, end: extentLength };
                    setAndValidateExtent();
                });

                it('with no end with start outside the lower bound is set properly', () => {
                    inputExtent = { start: -1, end: null };
                    expectedExtent = { start: 0, end: extentLength };
                    setAndValidateExtent();
                });

                function setAndValidateExtent(): void {
                    scrollbar.setExtent(inputExtent);
                    let actualExtent = scrollbar.getExtent();
                    expect(actualExtent).toEqual(inputExtent);
                }
            });

            describe('extentLength', () => {
                let extentLength: number;

                beforeEach(() => {
                    buildScrollbar();
                    extentLength = options.extentLength;
                });

                it('can be expanded', () => {
                    extentLength *= 2;
                    setAndValidateExtentLength();
                });

                it('can be shrunk', () => {
                    extentLength = Math.floor(extentLength / 2);
                    setAndValidateExtentLength();
                });

                function setAndValidateExtentLength(): void {
                    scrollbar.setExtentLength(extentLength);
                    let actualExtent = scrollbar.getExtent();
                    let actualExtentLength = actualExtent.end - actualExtent.start;
                    expect(actualExtentLength).toEqual(extentLength);
                }
            });

            it('refreshVisual calls render function', (done) => {
                let spy = getVisualRenderSpy();
                buildScrollbar();
                renderScrollbar();
                scrollbar.refreshVisual();
                setTimeout(() => {
                    expect(spy).toHaveBeenCalledTimes(1);
                    done();
                }, DefaultWaitForRender);
            });

            describe('refreshExtent', () => {
                let $thumb: JQuery;
                let isHorizontal: boolean;

                beforeEach(() => {
                    buildScrollbar();
                    renderScrollbar();
                    $thumb = $('.extent');
                    isHorizontal = options.isHorizontal;
                });

                it('sets the correct thumb size', () => {
                    let expectedSize = options.extentLength;
                    let actualSize = +$thumb.attr(isHorizontal ? 'width' : 'height');
                    expect(actualSize).toEqual(expectedSize);
                });

                it('sets the proper start coordinate', () => {
                    let expectedCoordinate = isHorizontal ? options.scrollbarY : options.scrollbarX;
                    let actualCoordinate = +$thumb.attr(isHorizontal ? 'x' : 'y');
                    expect(actualCoordinate).toEqual(expectedCoordinate);
                });
            });

            it('refreshExtentAndVisual calls render function', () => {
                let spy = getVisualRenderSpy();
                buildScrollbar();
                renderScrollbar();
                scrollbar.refreshExtentAndVisual();
                expect(spy).toHaveBeenCalledTimes(1);
            });

            function buildScrollbar(): void {
                scrollbar = new SvgScrollbar(options.extentLength);
                let $element = powerbitests.helpers.testDom(options.domHeight.toString(), options.domWidth.toString());
                let $viewport = $('<div>');

                if (options.viewport) {
                    let viewport = options.viewport;
                    $viewport.height(viewport.height).width(viewport.width);
                }

                let chartAreaSvg = d3.select($element.get(0)).append('svg');
                chartAreaSvg.classed('cartesianChart', true);
                chartAreaSvg.style('position', 'absolute');
                scrollbar.init(chartAreaSvg);

                scrollbar.setOrientation(options.isHorizontal);
                scrollbar.setScale(options.scrollScale);
                scrollbar.scrollBarLength = options.scrollbarLength;
                scrollbar.setExtentLength(options.extentLength);

                scrollbar.setExtent(options.startExtent || { start: 0, end: null });
            }

            function renderScrollbar(): void {
                debug.assertValue(scrollbar, 'Scrollbar does not have a value');
                scrollbar.render(options.scrollbarX, options.scrollbarY, options.scrollCallback);
                $scrollbar = $('.brush');
                $scrollbarBackground = $('.background', $scrollbar);
                $scrollbarThumb = $('.extent', $scrollbar);
            }

            function getVisualRenderSpy(): jasmine.Spy {
                return spyOn(window, 'requestAnimationFrame');
            }
        }
    });

    interface SVGScrollbarOptions {
        domHeight: number;
        domWidth: number;
        viewport?: IViewport;
        isHorizontal: boolean;
        scrollScale: D3.Scale.OrdinalScale;
        scrollbarLength: number;
        extentLength: number;
        scrollbarX: number;
        scrollbarY: number;
        scrollCallback: () => void;
        startExtent?: Extent;
    }
};