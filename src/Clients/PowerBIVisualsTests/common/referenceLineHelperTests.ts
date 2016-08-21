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
    import lineStyle = powerbi.visuals.lineStyle;
    import referenceLinePosition = powerbi.visuals.referenceLinePosition;
    import labelText = powerbi.visuals.labelText;
    import referenceLineDataLabelHorizontalPosition = powerbi.visuals.referenceLineDataLabelHorizontalPosition;
    import referenceLineDataLabelVerticalPosition = powerbi.visuals.referenceLineDataLabelVerticalPosition;
    import ObjectEnumerationBuilder = powerbi.visuals.ObjectEnumerationBuilder;
    import ReferenceLineHelper = powerbi.visuals.ReferenceLineHelper;
    import DataViewObject = powerbi.DataViewObject;
    import DataViewObjectMap = powerbi.DataViewObjectMap;
    import AxisLocation = powerbi.visuals.AxisLocation;

    describe('ReferenceLineHelper', () => {
        describe('enumerateObjectInstances', () => {
            // TODO: Remove this when we have support for user-defined objects in the format pane
            it('with no reference lines generates a single reference line object', () => {
                let enumerationBuilder = new ObjectEnumerationBuilder();
                ReferenceLineHelper.enumerateObjectInstances(enumerationBuilder, [], 'red', 'xAxisReferenceLine');
                let instances = enumerationBuilder.complete().instances;

                expect(instances.length).toBe(1);
                expect(instances[0]).toEqual({
                    selector: {
                        id: '0'
                    },
                    properties: {
                        show: false,
                        value: '',
                        lineColor: { solid: { color: 'red' } },
                        transparency: 50,
                        style: lineStyle.dashed,
                        position: referenceLinePosition.front,
                        dataLabelShow: false,
                    },
                    objectName: 'xAxisReferenceLine',
                });
            });

            it('enumerates all reference lines', () => {
                let enumerationBuilder = new ObjectEnumerationBuilder();
                let objects: DataViewObjectMap = {
                    '0': referenceLineObjects.redLine,
                    '1': referenceLineObjects.blueLine,
                };
                let refLines = ReferenceLineHelper.readDataView(objects, 'black', 'xAxisReferenceLine', null);
                ReferenceLineHelper.enumerateObjectInstances(enumerationBuilder, refLines, 'black', 'xAxisReferenceLine');
                let instances = enumerationBuilder.complete().instances;

                expect(instances.length).toBe(2);
                expect(instances[0]).toEqual({
                    selector: {
                        id: '0',
                        metadata: undefined
                    },
                    properties: objects['0'],
                    objectName: 'xAxisReferenceLine',
                });
                expect(instances[1]).toEqual({
                    selector: {
                        id: '1',
                        metadata: undefined
                    },
                    properties: objects['1'],
                    objectName: 'xAxisReferenceLine',
                });
            });

            it('default color is used if none is present', () => {
                let enumerationBuilder = new ObjectEnumerationBuilder();

                let object: DataViewObject = $.extend({}, referenceLineObjects.redLine);
                object[ReferenceLineHelper.ReferenceLineProps.lineColor] = undefined;
                object[ReferenceLineHelper.ReferenceLineProps.dataLabelColor] = undefined;

                let objects: DataViewObjectMap = {
                    '0': object,
                };
                let refLines = ReferenceLineHelper.readDataView(objects, 'red', 'xAxisReferenceLine', AxisLocation.Y1);
                ReferenceLineHelper.enumerateObjectInstances(enumerationBuilder, refLines, 'red', 'xAxisReferenceLine');
                let instances = enumerationBuilder.complete().instances;

                expect(instances[0].properties[ReferenceLineHelper.ReferenceLineProps.lineColor]).toEqual({ solid: { color: 'red' } });
                expect(instances[0].properties[ReferenceLineHelper.ReferenceLineProps.dataLabelColor]).toEqual({ solid: { color: 'red' } });
            });
        });

        describe('readDataView', () => {
            it('no reference lines generates an empty list', () => {
                let refLines = ReferenceLineHelper.readDataView(null, '#ffffff', 'minimum', AxisLocation.Y1);
                expect(refLines.length).toEqual(0);
            });

            it('read red line and blue line objects', () => {
                let objects: DataViewObjectMap = {
                    '0': referenceLineObjects.redLine,
                    '1': referenceLineObjects.blueLine,
                };
                let refLines = ReferenceLineHelper.readDataView(objects, '#ffffff', 'minimum', AxisLocation.Y1);
                expect(refLines.length).toEqual(2);

                let redLine = refLines[0];
                expect(redLine.show).toBeTruthy();
                expect(redLine.value).toEqual('1');
                expect(redLine.color.solid.color).toEqual('red');
                expect(redLine.transparency).toEqual(10);
                expect(redLine.style).toEqual(lineStyle.dashed);
                expect(redLine.position).toEqual(referenceLinePosition.back);

                expect(redLine.dataLabelProperties.show).toBeTruthy();
                expect(redLine.dataLabelProperties.color.solid.color).toEqual('green');
                expect(redLine.dataLabelProperties.decimalPoints).toEqual(3);
                expect(redLine.dataLabelProperties.horizontalPosition).toEqual(referenceLineDataLabelHorizontalPosition.left);
                expect(redLine.dataLabelProperties.verticalPosition).toEqual(referenceLineDataLabelVerticalPosition.above);
                expect(redLine.dataLabelProperties.displayUnits).toEqual(100000);
                expect(redLine.dataLabelProperties.text).toEqual(labelText.value);

                let blueLine = refLines[1];
                expect(blueLine.show).toBeTruthy();
                expect(blueLine.value).toEqual('2');
                expect(blueLine.color.solid.color).toEqual('blue');
                expect(blueLine.transparency).toEqual(20);
                expect(blueLine.style).toEqual(lineStyle.dotted);
                expect(blueLine.position).toEqual(referenceLinePosition.front);

                expect(blueLine.dataLabelProperties.show).toBeTruthy();
                expect(blueLine.dataLabelProperties.color.solid.color).toEqual('purple');
                expect(blueLine.dataLabelProperties.decimalPoints).toEqual(2);
                expect(blueLine.dataLabelProperties.horizontalPosition).toEqual(referenceLineDataLabelHorizontalPosition.right);
                expect(blueLine.dataLabelProperties.verticalPosition).toEqual(referenceLineDataLabelVerticalPosition.under);
                expect(blueLine.dataLabelProperties.displayUnits).toEqual(0);
                expect(blueLine.dataLabelProperties.text).toEqual(labelText.name);
            });

            it('read line with defaults', () => {
                let defaultObject: DataViewObject = {
                    show: true,
                    value: '1',
                    transparency: 10,
                    style: lineStyle.dashed,
                    position: referenceLinePosition.back,
                };

                let objects: DataViewObjectMap = {
                    '0': defaultObject
                };

                let refLines = ReferenceLineHelper.readDataView(objects, 'white', 'minimum', AxisLocation.Y1);
                expect(refLines.length).toEqual(1);

                let defaultLine = refLines[0];
                expect(defaultLine.show).toBeTruthy();
                expect(defaultLine.value).toEqual('1');
                expect(defaultLine.color.solid.color).toEqual('white');
                expect(defaultLine.transparency).toEqual(10);
                expect(defaultLine.style).toEqual(lineStyle.dashed);
                expect(defaultLine.position).toEqual(referenceLinePosition.back);
                expect(defaultLine.dataLabelProperties.show).toBeFalsy();
            });

            it('read line with name and value label', () => {
                let objects: DataViewObjectMap = {
                    '0': referenceLineObjects.greenLine
                };

                let refLines = ReferenceLineHelper.readDataView(objects, 'green', 'minimum', AxisLocation.Y1);
                expect(refLines.length).toEqual(1);
                let greenLine = refLines[0];
                expect(greenLine.show).toBeTruthy();
                expect(greenLine.value).toEqual('3');
                expect(greenLine.color.solid.color).toEqual('green');
                expect(greenLine.dataLabelProperties.show).toBeTruthy();
                expect(greenLine.dataLabelProperties.text).toEqual(labelText.nameAndValue);
            });
        });
    });

    module referenceLineObjects {
        export const redLine: DataViewObject = {
            show: true,
            displayName: 'red',
            value: '1',
            lineColor: { solid: { color: 'red' } },
            transparency: 10,
            style: lineStyle.dashed,
            position: referenceLinePosition.back,
            dataLabelShow: true,
            dataLabelColor: { solid: { color: 'green' } },
            dataLabelText: labelText.value,
            dataLabelDecimalPoints: 3,
            dataLabelHorizontalPosition: referenceLineDataLabelHorizontalPosition.left,
            dataLabelVerticalPosition: referenceLineDataLabelVerticalPosition.above,
            dataLabelDisplayUnits: 100000,
        };

        export const blueLine: DataViewObject = {
            show: true,
            displayName: 'blue',
            value: '2',
            lineColor: { solid: { color: 'blue' } },
            transparency: 20,
            style: lineStyle.dotted,
            position: referenceLinePosition.front,
            dataLabelShow: true,
            dataLabelColor: { solid: { color: 'purple' } },
            dataLabelText: labelText.name,
            dataLabelDecimalPoints: 2,
            dataLabelHorizontalPosition: referenceLineDataLabelHorizontalPosition.right,
            dataLabelVerticalPosition: referenceLineDataLabelVerticalPosition.under,
            dataLabelDisplayUnits: 0,
        };

        export const greenLine: DataViewObject = {
            show: true,
            displayName: 'green',
            value: '3',
            lineColor: { solid: { color: 'green' } },
            transparency: 20,
            style: lineStyle.dotted,
            position: referenceLinePosition.front,
            dataLabelShow: true,
            dataLabelColor: { solid: { color: 'green' } },
            dataLabelText: labelText.nameAndValue,
            dataLabelDecimalPoints: 2,
            dataLabelHorizontalPosition: referenceLineDataLabelHorizontalPosition.right,
            dataLabelVerticalPosition: referenceLineDataLabelVerticalPosition.under,
            dataLabelDisplayUnits: 0,
        };
    }
}
