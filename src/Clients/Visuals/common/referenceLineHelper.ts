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

module powerbi.visuals {

    import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;
    import Selector = powerbi.data.Selector;

    export module ReferenceLineHelper {
        export interface ReferenceLine {
            type: string;
            selector: Selector;
            show: boolean;
            displayName: string;
            value: number;
            color: Fill;
            transparency: number;
            position: string;
            style: string;
            dataLabelProperties: DataLabelProperites;
            axis: AxisLocation;
        }

        export interface DataLabelProperites {
            show: boolean;
            color: Fill;
            text: string;
            decimalPoints: number;
            horizontalPosition: string;
            verticalPosition: string;
            displayUnits: number;
        }

        export module ReferenceLineProps {
            export const show = 'show';
            export const lineColor = 'lineColor';
            export const transparency = 'transparency';
            export const displayName = 'displayName';
            export const value = 'value';
            export const style = 'style';
            export const position = 'position';
            export const dataLabelShow = 'dataLabelShow';
            export const dataLabelColor = 'dataLabelColor';
            export const dataLabelText = 'dataLabelText';
            export const dataLabelDecimalPoints = 'dataLabelDecimalPoints';
            export const dataLabelHorizontalPosition = 'dataLabelHorizontalPosition';
            export const dataLabelVerticalPosition = 'dataLabelVerticalPosition';
            export const dataLabelDisplayUnits = 'dataLabelDisplayUnits';
        };

        export interface ReferenceLineOptions {
            graphicContext: D3.Selection;
            referenceLines: ReferenceLine[];
            axes: CartesianAxisProperties;
            viewport: IViewport;
        }

        export interface ReferenceLineDataLabelOptions {
            referenceLines: ReferenceLine[];
            axes: CartesianAxisProperties;
            viewport: IViewport;
            hostServices: IVisualHostServices;
        }

        export function isHorizontal(refLine: ReferenceLine, axes: CartesianAxisProperties): boolean {
            return (refLine.axis === AxisLocation.Y1) && !axes.y1.isCategoryAxis;
        }

        export function enumerateObjectInstances(enumeration: ObjectEnumerationBuilder, referenceLines: ReferenceLine[], defaultColor: string, objectName: string): void {
            debug.assertValue(enumeration, 'enumeration');

            if (_.isEmpty(referenceLines)) {
                // NOTE: We do not currently have support for object maps in the property pane. For now we will generate a single reference line 
                // object that the format pane can handle.In the future we will need property pane support for multiple reference lines. Also, we're
                // assuming that the user-defined IDs will be numeric strings, this may change in the future and will likley be controlled by the property pane.
                let instance: VisualObjectInstance = {
                    selector: {
                        id: '0'
                    },
                    properties: {
                        show: false,
                        value: '',
                        lineColor: { solid: { color: defaultColor } },
                        transparency: 50,
                        style: lineStyle.dashed,
                        position: referenceLinePosition.front,
                        dataLabelShow: false,
                    },
                    objectName: objectName
                };

                enumeration.pushInstance(instance);

                return;
            }

            for (let referenceLine of referenceLines) {
                let dataLabelShow = referenceLine.dataLabelProperties && referenceLine.dataLabelProperties.show;
                let instance: VisualObjectInstance = {
                    selector: referenceLine.selector,
                    properties: {
                        show: referenceLine.show,
                        displayName: referenceLine.displayName,
                        value: referenceLine.value,
                        lineColor: referenceLine.color,
                        transparency: referenceLine.transparency,
                        style: referenceLine.style,
                        position: referenceLine.position,
                        dataLabelShow: dataLabelShow,
                    },
                    objectName: referenceLine.type
                };

                // Show the data label properties only if the user chose to show the data label
                if (dataLabelShow) {
                    let dataLabelProperties = referenceLine.dataLabelProperties;
                    instance.properties[ReferenceLineProps.dataLabelColor] = dataLabelProperties.color;
                    instance.properties[ReferenceLineProps.dataLabelText] = dataLabelProperties.text;
                    instance.properties[ReferenceLineProps.dataLabelHorizontalPosition] = dataLabelProperties.horizontalPosition;
                    instance.properties[ReferenceLineProps.dataLabelVerticalPosition] = dataLabelProperties.verticalPosition;
                    instance.properties[ReferenceLineProps.dataLabelDisplayUnits] = dataLabelProperties.displayUnits;
                    instance.properties[ReferenceLineProps.dataLabelDecimalPoints] = dataLabelProperties.decimalPoints;
                }

                enumeration.pushInstance(instance);
            }
        }

        export function render(options: ReferenceLineOptions): void {
            let xScale = options.axes.x.scale;
            let yScale = options.axes.y1.scale;

            function setRefLineProperties(refLine: ReferenceLine) {
                if (!refLine.show || !_.isNumber(refLine.value))
                    return;

                let isHorizontal = ReferenceLineHelper.isHorizontal(refLine, options.axes);
                let viewport = options.viewport;
                let value = refLine.value;
                let line = d3.select(this);
                line.attr('x1', isHorizontal ? 0 : xScale(value));
                line.attr('y1', isHorizontal ? yScale(value) : 0);
                line.attr('x2', isHorizontal ? viewport.width : xScale(value));
                line.attr('y2', isHorizontal ? yScale(value) : viewport.height);

                let style: any = {};
                style['stroke'] = refLine.color.solid.color;

                let transparency = refLine.transparency;
                style['stroke-opacity'] = (100 - transparency) / 100;

                switch (refLine.style) {
                    case lineStyle.dotted:
                        {
                            style['stroke-dasharray'] = '1, 5';
                            style['stroke-linecap'] = 'round';
                        }
                        break;
                    case lineStyle.solid:
                        {
                            style['stroke-dasharray'] = null;
                            style['stroke-linecap'] = null;
                        }
                        break;
                    case lineStyle.dashed:
                    default:
                        {
                            style['stroke-dasharray'] = '5, 5';
                            style['stroke-linecap'] = null;
                        }
                        break;
                }

                line.style(style);
            }

            let graphicsContext = options.graphicContext;
            let frontClassAndSelector = createClassAndSelector('reference-line-front');
            let frontReferenceLines = _.filter(options.referenceLines, line => line.position === referenceLinePosition.front && line.show);
            let frontLines = graphicsContext.selectAll(frontClassAndSelector.selector).data(frontReferenceLines);
            frontLines.enter().append('line').classed(frontClassAndSelector.class, true);
            frontLines.each(setRefLineProperties);
            frontLines.exit().remove();

            let backClassAndSelector = createClassAndSelector('reference-line-back');
            let backReferenceLines = _.filter(options.referenceLines, line => line.position !== referenceLinePosition.front && line.show);
            let backLines = graphicsContext.selectAll(backClassAndSelector.selector).data(backReferenceLines);
            backLines.enter().insert('line', ':first-child').classed(backClassAndSelector.class, true);
            backLines.each(setRefLineProperties);
            backLines.exit().remove();
        }

        export function readDataView(objects: DataViewObjectMap, defaultColor: string, objectName: string, axis: AxisLocation, metaDataColumn?: string): ReferenceLine[] {
            if (!objects)
                return [];

            let referenceLines: ReferenceLine[] = [];
            for (let id in objects) {
                let referenceLineObject = objects[id];
                let show = DataViewObject.getValue(referenceLineObject, ReferenceLineProps.show, false);
                let displayName = DataViewObject.getValue(referenceLineObject, ReferenceLineProps.displayName, undefined);
                let value = DataViewObject.getValue(referenceLineObject, ReferenceLineProps.value, 0);
                let lineColor = DataViewObject.getValue(referenceLineObject, ReferenceLineProps.lineColor, { solid: { color: defaultColor } });
                let transparency = DataViewObject.getValue(referenceLineObject, ReferenceLineProps.transparency, 50);
                let style = DataViewObject.getValue(referenceLineObject, ReferenceLineProps.style, lineStyle.dashed);
                let position = DataViewObject.getValue(referenceLineObject, ReferenceLineProps.position, referenceLinePosition.front);
                let dataLabelShow = DataViewObject.getValue(referenceLineObject, ReferenceLineProps.dataLabelShow, false);
                let dataLabelColor = DataViewObject.getValue(referenceLineObject, ReferenceLineProps.dataLabelColor, { solid: { color: defaultColor } });
                let dataLabelText = DataViewObject.getValue(referenceLineObject, ReferenceLineProps.dataLabelText, labelText.value);
                let dataLabelHorizontalPosition = DataViewObject.getValue(referenceLineObject, ReferenceLineProps.dataLabelHorizontalPosition, referenceLineDataLabelHorizontalPosition.left);
                let dataLabelVerticalPosition = DataViewObject.getValue(referenceLineObject, ReferenceLineProps.dataLabelVerticalPosition, referenceLineDataLabelVerticalPosition.above);
                let decimalPoints = DataViewObject.getValue(referenceLineObject, ReferenceLineProps.dataLabelDecimalPoints, undefined);
                let dataLabelDecimalPoints = decimalPoints < 0 ? undefined : decimalPoints;
                let dataLabelDisplayUnits = DataViewObject.getValue(referenceLineObject, ReferenceLineProps.dataLabelDisplayUnits, 0);
                let selector: Selector = { id: id, metadata: metaDataColumn };

                referenceLines.push({
                    type: objectName,
                    selector: selector,
                    show: show,
                    displayName: displayName,
                    value: value,
                    color: lineColor,
                    transparency: transparency,
                    style: style,
                    position: position,
                    dataLabelProperties: {
                        show: dataLabelShow,
                        color: dataLabelColor,
                        text: dataLabelText,
                        horizontalPosition: dataLabelHorizontalPosition,
                        verticalPosition: dataLabelVerticalPosition,
                        decimalPoints: dataLabelDecimalPoints,
                        displayUnits: dataLabelDisplayUnits
                    },
                    axis: axis
                });
            }

            return referenceLines;
        }

        export function createLabelDataPoint(options: ReferenceLineDataLabelOptions): LabelDataPoint[] {
            if (_.isEmpty(options.referenceLines)) {
                return [];
            }

            let dataLabels: LabelDataPoint[] = [];
            let offsetRefLine = 5;
            let axes = options.axes;
            let viewport = options.viewport;
            let xScale = axes.x.scale;
            let yScale = axes.y1.scale;

            for (let referenceLine of options.referenceLines) {
                if (!referenceLine.dataLabelProperties.show) {
                    continue;
                }

                // Format the reference line data label text according to the matching axis formatter
                // When options is null default formatter is used either boolean, numeric, or text
                let isHorizontal = ReferenceLineHelper.isHorizontal(referenceLine, axes);
                let axisFormatter = isHorizontal ? axes.y1.formatter : axes.x.formatter;
                let formatterForReferenceLineDataLabel = axisFormatter;

                let refValue = referenceLine.value;
                let dataLabelProperties = referenceLine.dataLabelProperties;

                if (axisFormatter.options != null) {
                    let formatterOptions = Prototype.inherit(axisFormatter.options);
                    formatterOptions.precision = dataLabelProperties.decimalPoints;
                    formatterOptions.value = dataLabelProperties.displayUnits;
                    formatterForReferenceLineDataLabel = valueFormatter.create(formatterOptions);
                }

                let text: string = '';
                switch (dataLabelProperties.text) {
                    case labelText.name:
                        text = referenceLine.displayName;
                        break;
                    case labelText.nameAndValue:
                        {
                            if (!_.isNumber(refValue)) 
                                continue;

                            let formatString = options.hostServices.getLocalizedString("Visual_LabelText_Name_Value_Format");
                            text = jsCommon.StringExtensions.format(formatString, referenceLine.displayName, NewDataLabelUtils.getLabelFormattedText(formatterForReferenceLineDataLabel.format(<number>refValue)));
                        }
                        break;
                    case labelText.value:
                    default:
                        {
                            if (!_.isNumber(refValue)) 
                                continue;

                            text = NewDataLabelUtils.getLabelFormattedText(formatterForReferenceLineDataLabel.format(<number>refValue));
                        }
                }

                let properties: TextProperties = {
                    text: text,
                    fontFamily: dataLabelUtils.LabelTextProperties.fontFamily,
                    fontSize: dataLabelUtils.LabelTextProperties.fontSize,
                    fontWeight: dataLabelUtils.LabelTextProperties.fontWeight,
                };

                // Get the height and with of the text element that will be created in order to place it correctly
                let rectWidth: number = TextMeasurementService.measureSvgTextWidth(properties);
                let rectHeight: number = TextMeasurementService.estimateSvgTextHeight(properties);

                let dataLabelX: number;
                let dataLabelY: number;

                let x1 = isHorizontal ? 0 : xScale(refValue);
                let y1 = isHorizontal ? yScale(refValue) : 0;
                let x2 = isHorizontal ? viewport.width : xScale(refValue);
                let y2 = isHorizontal ? yScale(refValue) : viewport.height;
                let validPositions = [NewPointLabelPosition.Above];

                if (isHorizontal) {
                    // Horizontal line. y1 = y2
                    dataLabelX = (dataLabelProperties.horizontalPosition === referenceLineDataLabelHorizontalPosition.left) ? x1 + offsetRefLine : x2 - (rectWidth / 2) - offsetRefLine;
                    dataLabelY = y1;
                    validPositions = (dataLabelProperties.verticalPosition === referenceLineDataLabelVerticalPosition.above) ? [NewPointLabelPosition.Above] : [NewPointLabelPosition.Below];
                }
                else {
                    // Vertical line. x1 = x2 
                    dataLabelX = x1;
                    dataLabelY = (dataLabelProperties.verticalPosition === referenceLineDataLabelVerticalPosition.above) ? y1 + (rectHeight / 2) + offsetRefLine : y2 - (rectHeight / 2) - offsetRefLine;
                    validPositions = (dataLabelProperties.horizontalPosition === referenceLineDataLabelHorizontalPosition.left) ? [NewPointLabelPosition.Left] : [NewPointLabelPosition.Right];
                }

                let textWidth = TextMeasurementService.measureSvgTextWidth(properties);
                let textHeight = TextMeasurementService.estimateSvgTextHeight(properties, true /* tightFitForNumeric */);
                let parentShape: LabelParentPoint;

                parentShape = {
                    point: {
                        x: dataLabelX,
                        y: dataLabelY,
                    },
                    radius: 0,
                    validPositions: validPositions,
                };
                
                dataLabels.push({
                    isPreferred: true,
                    text: text,
                    textSize: {
                        width: textWidth,
                        height: textHeight,
                    },
                    outsideFill: dataLabelProperties.color.solid.color,
                    insideFill: null,
                    parentShape: parentShape,
                    parentType: LabelDataPointParentType.Point,
                    fontSize: 9,
                    identity: null,
                    secondRowText: null,
                    key: JSON.stringify({
                        type: referenceLine.type,
                        id: referenceLine.selector.id,
                    }),
                });
            }

            return dataLabels;
        }

        export function extractReferenceLineValue(referenceLineProperties: DataViewObject): number {
            let referenceLineValue: number = null;

            if (referenceLineProperties && DataViewObject.getValue(referenceLineProperties, ReferenceLineProps.show, false))
                referenceLineValue = DataViewObject.getValue(referenceLineProperties, ReferenceLineProps.value, null);

            return referenceLineValue;
        }
    }
}