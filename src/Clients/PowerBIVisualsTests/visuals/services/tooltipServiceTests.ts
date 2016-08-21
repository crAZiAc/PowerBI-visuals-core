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
    import SelectionId = powerbi.visuals.SelectionId;
    import TooltipEventArgs = powerbi.visuals.TooltipEventArgs;
    import visuals = powerbi.visuals;

    describe('createTooltipService', () => {
        it('returns legacy tooltip service when no host tooltip service is available', () => {
            let mockHostServices = mocks.createVisualHostServices();
            let tooltipService = powerbi.visuals.createTooltipService(mockHostServices);

            expect(tooltipService.constructor).toBe(powerbi.visuals.LegacyTooltipService);
        });
    });

    describe('TooltipService', () => {
        let tooltipService: visuals.TooltipService;
        let hostVisualTooltip: IMockHostTooltipService;

        beforeEach(() => {
            hostVisualTooltip = jasmine.createSpyObj('tooltipService', ['show', 'move', 'hide', 'container', 'enabled']);
            hostVisualTooltip.enabled.and.returnValue(true);
            tooltipService = new visuals.TooltipService(hostVisualTooltip, /* handleTouchDelay */ 10);
        });

        describe('addTooltip', () => {
            let onSpy: jasmine.Spy;
            let d3Selection: D3.Selection;
            let tooltipRoot: JQuery;
            let element: JQuery;

            beforeEach(() => {
                tooltipRoot = helpers.testDom('100px', '100px');
                element = $('<div>').appendTo(tooltipRoot);

                d3Selection = d3.select(element.get(0));
                onSpy = spyOn(d3Selection, 'on').and.callThrough();

                hostVisualTooltip.container.and.returnValue(tooltipRoot.get(0));
            });

            it('events are added to selection', () => {
                tooltipService.addTooltip(
                    d3Selection,
                    (args) => [],
                    (args) => undefined
                );

                expect(onSpy).toHaveBeenCalledWith('mouseover.tooltip', jasmine.any(Function));
                expect(onSpy).toHaveBeenCalledWith('mouseout.tooltip', jasmine.any(Function));
                expect(onSpy).toHaveBeenCalledWith('mousemove.tooltip', jasmine.any(Function));

                // NOTE: likely to be different under IE
                expect(onSpy).toHaveBeenCalledWith('touchstart.tooltip', jasmine.any(Function));
                expect(onSpy).toHaveBeenCalledWith('touchend.tooltip', jasmine.any(Function));
            });

            it('events are not added if service is disabled', () => {
                hostVisualTooltip.enabled.and.returnValue(false);
                tooltipService.addTooltip(
                    d3Selection,
                    (args) => [],
                    (args) => undefined
                );

                expect(onSpy).not.toHaveBeenCalledWith('mouseover.tooltip', jasmine.any(Function));
                expect(onSpy).not.toHaveBeenCalledWith('mouseout.tooltip', jasmine.any(Function));
                expect(onSpy).not.toHaveBeenCalledWith('mousemove.tooltip', jasmine.any(Function));

                // NOTE: likely to be different under IE
                expect(onSpy).not.toHaveBeenCalledWith('touchstart.tooltip', jasmine.any(Function));
                expect(onSpy).not.toHaveBeenCalledWith('touchend.tooltip', jasmine.any(Function));
            });

            describe('events', () => {
                let identity: SelectionId;
                let tooltipData: powerbi.VisualTooltipDataItem[];
                let getTooltipInfoDelegate: jasmine.Spy;
                let getDataPointIdentity: jasmine.Spy;

                beforeEach(() => {
                    identity = SelectionId.createWithSelectorForColumnAndMeasure(helpers.buildSelectorForColumn('select1', mocks.dataViewScopeIdentity('a')), 'measure');
                    tooltipData = [{
                        displayName: 'group',
                        value: '100',
                    }];

                    getTooltipInfoDelegate = jasmine.createSpy('getTooltipInfoDelegate', (args) => tooltipData).and.callThrough();
                    getDataPointIdentity = jasmine.createSpy('getDataPointIdentity', (args) => identity).and.callThrough();

                    tooltipService.addTooltip(
                        d3Selection,
                        getTooltipInfoDelegate,
                        getDataPointIdentity
                    );

                    d3Selection.data(['datum']);
                });

                describe('mouseover', () => {
                    it('shows tooltip', () => {
                        element.d3MouseOver(50, 50);

                        let mouseCoordinates = translateMouseCoordinates(50, 50, tooltipRoot);

                        expect(hostVisualTooltip.show).toHaveBeenCalledWith(<powerbi.VisualTooltipShowEventArgs>{
                            coordinates: mouseCoordinates,
                            isTouchEvent: false,
                            dataItems: tooltipData,
                            identities: [identity.getSelectorsByColumn()],
                        });
                    });

                    it('calls into visual to get identities and tooltip data', () => {
                        element.d3MouseOver(50, 50);

                        let mouseCoordinates = translateMouseCoordinates(50, 50, tooltipRoot);

                        let expectedTooltipEventArgs: TooltipEventArgs<string> = {
                            data: 'datum',
                            coordinates: mouseCoordinates,
                            elementCoordinates: translateMouseCoordinates(50, 50, element),
                            context: element.get(0),
                            isTouchEvent: false
                        };

                        expect(getTooltipInfoDelegate).toHaveBeenCalledWith(expectedTooltipEventArgs);
                        expect(getDataPointIdentity).toHaveBeenCalledWith(expectedTooltipEventArgs);
                    });

                    it('does not show tooltip immediately after touchend', () => {
                        element.d3TouchEnd();
                        element.d3MouseOver(50, 50);

                        expect(hostVisualTooltip.show).not.toHaveBeenCalled();
                    });
                });

                describe('mousemove', () => {
                    it('moves tooltip', () => {
                        element.d3MouseMove(50, 50);

                        let mouseCoordinates = translateMouseCoordinates(50, 50, tooltipRoot);

                        expect(hostVisualTooltip.move).toHaveBeenCalledWith(<powerbi.VisualTooltipShowEventArgs>{
                            coordinates: mouseCoordinates,
                            isTouchEvent: false,
                            dataItems: undefined,
                            identities: [identity.getSelectorsByColumn()],
                        });
                    });

                    it('calls into visual to get identities', () => {
                        element.d3MouseMove(50, 50);

                        let mouseCoordinates = translateMouseCoordinates(50, 50, tooltipRoot);

                        let expectedTooltipEventArgs: TooltipEventArgs<string> = {
                            data: 'datum',
                            coordinates: mouseCoordinates,
                            elementCoordinates: translateMouseCoordinates(50, 50, element),
                            context: element.get(0),
                            isTouchEvent: false
                        };

                        expect(getDataPointIdentity).toHaveBeenCalledWith(expectedTooltipEventArgs);
                    });

                    it('does not reload tooltip data if reloadTooltipDataOnMouseMove is false', () => {
                        // reloadTooltipDataOnMouseMove is false by default
                        element.d3MouseMove(50, 50);

                        expect(getTooltipInfoDelegate).not.toHaveBeenCalled();
                    });

                    it('reloads tooltip data if reloadTooltipDataOnMouseMove is true', () => {
                        tooltipService.addTooltip(
                            d3Selection,
                            getTooltipInfoDelegate,
                            getDataPointIdentity,
                            true /* reloadTooltipDataOnMouseMove */
                        );

                        element.d3MouseMove(50, 50);

                        let mouseCoordinates = translateMouseCoordinates(50, 50, tooltipRoot);

                        let expectedTooltipEventArgs: TooltipEventArgs<string> = {
                            data: 'datum',
                            coordinates: mouseCoordinates,
                            elementCoordinates: translateMouseCoordinates(50, 50, element),
                            context: element.get(0),
                            isTouchEvent: false
                        };

                        expect(getTooltipInfoDelegate).toHaveBeenCalledWith(expectedTooltipEventArgs);

                        expect(hostVisualTooltip.move).toHaveBeenCalledWith(<powerbi.VisualTooltipShowEventArgs>{
                            coordinates: mouseCoordinates,
                            isTouchEvent: false,
                            dataItems: tooltipData,
                            identities: [identity.getSelectorsByColumn()],
                        });
                    });
                });

                describe('mouseout', () => {
                    it('hides tooltip', () => {
                        element.d3MouseOut(0, 0);

                        expect(hostVisualTooltip.hide).toHaveBeenCalledWith(<powerbi.VisualTooltipHideEventArgs>{
                            isTouchEvent: false,
                            immediately: false,
                        });
                    });
                });

                describe('touchstart', () => {
                    it('shows tooltip', () => {
                        element.d3TouchStart(helpers.createTouchesList([helpers.createTouch(50, 50, element, /* id */ 0)]));

                        let touchCoordinates = translateTouchCoordinates(50, 50, tooltipRoot, 0);

                        expect(hostVisualTooltip.show).toHaveBeenCalledWith(<powerbi.VisualTooltipShowEventArgs>{
                            coordinates: touchCoordinates,
                            isTouchEvent: true,
                            dataItems: tooltipData,
                            identities: [identity.getSelectorsByColumn()],
                        });
                    });

                    it('calls into visual to get identities and tooltip data', () => {
                        element.d3TouchStart(helpers.createTouchesList([helpers.createTouch(50, 50, element, /* id */ 0)]));

                        let touchCoordinates = translateTouchCoordinates(50, 50, tooltipRoot, 0);

                        let expectedTooltipEventArgs: TooltipEventArgs<string> = {
                            data: 'datum',
                            coordinates: touchCoordinates,
                            elementCoordinates: translateTouchCoordinates(50, 50, element, 0),
                            context: element.get(0),
                            isTouchEvent: true
                        };

                        expect(getTooltipInfoDelegate).toHaveBeenCalledWith(expectedTooltipEventArgs);
                        expect(getDataPointIdentity).toHaveBeenCalledWith(expectedTooltipEventArgs);
                    });
                });

                describe('touchend', () => {
                    it('hides tooltip', () => {
                        element.d3TouchEnd();

                        expect(hostVisualTooltip.hide).toHaveBeenCalledWith(<powerbi.VisualTooltipHideEventArgs>{
                            isTouchEvent: true,
                            immediately: false,
                        });
                    });
                });

                it('mouseover does show tooltip after touchend delay', (done) => {
                    element.d3TouchEnd();

                    setTimeout(() => {
                        element.d3MouseOver(50, 50);

                        expect(hostVisualTooltip.show).toHaveBeenCalled();
                        done();
                    }, /* slightly more than handleTouchDelay */ 20);
                });
            });

            function translateTouchCoordinates(x: number, y: number, root: JQuery, id: number): number[] {
                let coordinates = translateMouseCoordinates(x, y, root);
                
                // The touch identifier ends up on the coordinates array.
                (<any>coordinates).identifier = id;

                return coordinates;
            }

            function translateMouseCoordinates(x: number, y: number, root: JQuery): number[] {
                // The root container may be offset in the test environment, so compensate here.
                let rect = root.get(0).getBoundingClientRect();
                return [x - rect.left, y - rect.top];
            }
        });

        describe('hide', () => {
            it('calls host tooltip service', () => {
                tooltipService.hide();

                expect(hostVisualTooltip.hide).toHaveBeenCalled();
            });
        });

        interface IMockHostTooltipService {
            show: jasmine.Spy;
            move: jasmine.Spy;
            hide: jasmine.Spy;
            container: jasmine.Spy;
            enabled: jasmine.Spy;
        }
    });

    describe('LegacyTooltipService', () => {
        it('calls legacy TooltipManager to add', () => {
            let tooltipService = new visuals.LegacyTooltipService();
            let addTooltipSpy = spyOn(visuals.TooltipManager, 'addTooltip');
            
            tooltipService.addTooltip(
                d3.select(null),
                (args) => undefined,
                (args) => undefined
            );

            expect(addTooltipSpy).toHaveBeenCalled();
        });

        it('calls legacy TooltipManager to hide', () => {
            let tooltipService = new visuals.LegacyTooltipService();
            let hideSpy = spyOn(visuals.TooltipManager.ToolTipInstance, 'hide');
            
            tooltipService.hide();

            expect(hideSpy).toHaveBeenCalled();
        });
    });
}