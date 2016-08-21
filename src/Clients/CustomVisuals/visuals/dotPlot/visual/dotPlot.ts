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

/// <reference path="../../../_references.ts"/>

module powerbi.visuals.samples {
    import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;
    import getAnimationDuration = powerbi.visuals.AnimatorCommon.GetAnimationDuration;
    import CreateClassAndSelector = jsCommon.CssConstants.createClassAndSelector;
    import AxisScale = powerbi.visuals.axisScale;
    import PixelConverter = jsCommon.PixelConverter;
    import IEnumType = powerbi.IEnumType;
    import createEnumType = powerbi.createEnumType;
    import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
    import SelectionId = powerbi.visuals.SelectionId;
    import IGenericAnimator = powerbi.visuals.IGenericAnimator;
    import IMargin = powerbi.visuals.IMargin;
    import TooltipDataItem = powerbi.visuals.TooltipDataItem;
    import IValueFormatter = powerbi.visuals.IValueFormatter;
    import SelectableDataPoint = powerbi.visuals.SelectableDataPoint;
    import IVisual = powerbi.IVisual;
    import IViewport = powerbi.IViewport;
    import VisualCapabilities = powerbi.VisualCapabilities;
    import VisualDataRoleKind = powerbi.VisualDataRoleKind;
    import IInteractiveBehavior = powerbi.visuals.IInteractiveBehavior;
    import IDataColorPalette = powerbi.IDataColorPalette;
    import IInteractivityService = powerbi.visuals.IInteractivityService;
    import TextProperties = powerbi.TextProperties;
    import dataLabelUtils = powerbi.visuals.dataLabelUtils;
    import DataView = powerbi.DataView;
    import DataViewObjects = powerbi.DataViewObjects;
    import SelectionIdBuilder = powerbi.visuals.SelectionIdBuilder;
    import VisualInitOptions = powerbi.VisualInitOptions;
    import createInteractivityService = powerbi.visuals.createInteractivityService;
    import appendClearCatcher = powerbi.visuals.appendClearCatcher;
    import VisualUpdateOptions = powerbi.VisualUpdateOptions;
    import SVGUtil = powerbi.visuals.SVGUtil;
    import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
    import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
    import ObjectEnumerationBuilder = powerbi.visuals.ObjectEnumerationBuilder;
    import valueFormatter = powerbi.visuals.valueFormatter;
    import ILabelLayout = powerbi.visuals.ILabelLayout;
    import TooltipManager = powerbi.visuals.TooltipManager;
    import TooltipEvent = powerbi.visuals.TooltipEvent;
    import IAxisProperties = powerbi.visuals.IAxisProperties;
    import AxisHelper = powerbi.visuals.AxisHelper;
    import TextMeasurementService = powerbi.TextMeasurementService;
    import ISelectionHandler = powerbi.visuals.ISelectionHandler;
    import LabelTextProperties = powerbi.visuals.dataLabelUtils.LabelTextProperties;
    import ISize = powerbi.visuals.shapes.ISize;
    var DefaultRadius: number = 5;
    var DefaultStrokeWidth: number = 1;

    export enum DotPlotLabelsOrientation {
        Horizontal = <any>"Horizontal",
        Vertical = <any>"Vertical",
    };

    export interface DotPlotSelectors {
        scrollableContainer: ClassAndSelector;
        svgPlotSelector: ClassAndSelector;
        plotSelector: ClassAndSelector;
        plotGroupSelector: ClassAndSelector;
        axisSelector: ClassAndSelector;
        xAxisSelector: ClassAndSelector;
        circleSeletor: ClassAndSelector;
    }

    export interface DotPlotChartCategory {
        value: string;
        selectionId: SelectionId;
        //textWidth: number;
    }

    export interface DotPlotConstructorOptions {
        animator?: IGenericAnimator;
        svg?: D3.Selection;
        margin?: IMargin;
        radius?: number;
        strokeWidth?: number;
    }

    export interface DotPlotDataPoint {
        y: number;
        tooltipInfo: TooltipDataItem[];
    }

    export interface DotPlotDataGroup extends SelectableDataPoint, IDataLabelInfo {
        label: string;
        value: number;
        category: DotPlotChartCategory;
        color: string;
        tooltipInfo: TooltipDataItem[];
        dataPoints: DotPlotDataPoint[];
        highlight: boolean;
        index: number;
        labelFontSize: string;
    }

    export interface DotPlotData {
        dataGroups: DotPlotDataGroup[];
        settings: DotPlotSettings;
        categoryAxisName: string;
        maxXAxisHeight: number;
        categoryLabelHeight: number;
        categoryColumn: DataViewCategoryColumn;
        dotsTotalHeight: number;
        maxLabelWidth: number;
        labelFontSize: number;
        maxCategoryWidth: number;
    }

    class VisualLayout {
        private marginValue: IMargin;
        private viewportValue: IViewport;
        private viewportInValue: IViewport;
        private minViewportValue: IViewport;
        private originalViewportValue: IViewport;
        private previousOriginalViewportValue: IViewport;

        public defaultMargin: IMargin;
        public defaultViewport: IViewport;

        constructor(defaultViewport?: IViewport, defaultMargin?: IMargin) {
            this.defaultViewport = defaultViewport || { width: 0, height: 0 };
            this.defaultMargin = defaultMargin || { top: 0, bottom: 0, right: 0, left: 0 };
        }

        public get viewport(): IViewport {
            return this.viewportValue || (this.viewportValue = this.defaultViewport);
        }

        public get viewportCopy(): IViewport {
            return _.clone(this.viewport);
        }

        //Returns viewport minus margin
        public get viewportIn(): IViewport {
            return this.viewportInValue || this.viewport;
        }

        public get minViewport(): IViewport {
            return this.minViewportValue || { width: 0, height: 0 };
        }

        public get margin(): IMargin {
            return this.marginValue || (this.marginValue = this.defaultMargin);
        }

        public set minViewport(value: IViewport) {
            this.setUpdateObject(value, v => this.minViewportValue = v, VisualLayout.restrictToMinMax);
        }

        public set viewport(value: IViewport) {
            this.previousOriginalViewportValue = _.clone(this.originalViewportValue);
            this.originalViewportValue = _.clone(value);
            this.setUpdateObject(value,
                v => this.viewportValue = v,
                o => VisualLayout.restrictToMinMax(o, this.minViewport));
        }

        public set margin(value: IMargin) {
            this.setUpdateObject(value, v => this.marginValue = v, VisualLayout.restrictToMinMax);
        }

        //Returns true if viewport has updated after last change.
        public get viewportChanged(): boolean {
            return !!this.originalViewportValue && (!this.previousOriginalViewportValue
                || this.previousOriginalViewportValue.height !== this.originalViewportValue.height
                || this.previousOriginalViewportValue.width !== this.originalViewportValue.width);
        }

        public get viewportInIsZero(): boolean {
            return this.viewportIn.width === 0 || this.viewportIn.height === 0;
        }

        public resetMargin(): void {
            this.margin = this.defaultMargin;
        }

        private update(): void {
            this.viewportInValue = VisualLayout.restrictToMinMax({
                width: this.viewport.width - (this.margin.left + this.margin.right),
                height: this.viewport.height - (this.margin.top + this.margin.bottom)
            }, this.minViewportValue);
        }

        private setUpdateObject<T>(object: T, setObjectFn: (T) => void, beforeUpdateFn?: (T) => void): void {
            object = _.clone(object);
            setObjectFn(VisualLayout.createNotifyChangedObject(object, o => {
                if(beforeUpdateFn) beforeUpdateFn(object);
                this.update();
            }));

            if(beforeUpdateFn) beforeUpdateFn(object);
            this.update();
        }

        private static createNotifyChangedObject<T>(object: T, objectChanged: (o?: T, key?: string) => void): T {
            var result: T = <any>{};
            _.keys(object).forEach(key => Object.defineProperty(result, key, {
                    get: () => object[key],
                    set: (value) => { object[key] = value; objectChanged(object, key); },
                    enumerable: true,
                    configurable: true
                }));
            return result;
        }

        private static restrictToMinMax<T>(value: T, minValue?: T): T {
            _.keys(value).forEach(x => value[x] = Math.max(minValue && minValue[x] || 0, value[x]));
            return value;
        }
    }

    export class DotPlotSettings {
        public static get Default() { 
            return new this();
        }

        public static parse(dataView: DataView, capabilities: VisualCapabilities) {
            var settings = new this();
            if(!dataView || !dataView.metadata || !dataView.metadata.objects) {
                return settings;
            }

            var properties = this.getProperties(capabilities);
            for(var objectKey in capabilities.objects) {
                for(var propKey in capabilities.objects[objectKey].properties) {
                    if(!settings[objectKey] || !_.has(settings[objectKey], propKey)) {
                        continue;
                    }

                    var type = capabilities.objects[objectKey].properties[propKey].type;
                    var getValueFn = this.getValueFnByType(type);
                    settings[objectKey][propKey] = getValueFn(
                        dataView.metadata.objects,
                        properties[objectKey][propKey],
                        settings[objectKey][propKey]);
                }
            }

            return settings;
        }

        public static getProperties(capabilities: VisualCapabilities)
            : { [i: string]: { [i: string]: DataViewObjectPropertyIdentifier } } & { 
                general: { formatString: DataViewObjectPropertyIdentifier },
                dataPoint: { fill: DataViewObjectPropertyIdentifier } } {
            var objects  = _.merge({ 
                general: { properties: { formatString: {} } } 
            }, capabilities.objects);
            var properties = <any>{};
            for(var objectKey in objects) {
                properties[objectKey] = {};
                for(var propKey in objects[objectKey].properties) {
                    properties[objectKey][propKey] = <DataViewObjectPropertyIdentifier> {
                        objectName: objectKey,
                        propertyName: propKey
                    };
                }
            }

            return properties;
        }

        public static createEnumTypeFromEnum(type: any): IEnumType {
            var even: any = false;
            return createEnumType(Object.keys(type)
                .filter((key,i) => ((!!(i % 2)) === even && type[key] === key
                    && !void(even = !even)) || (!!(i % 2)) !== even)
                .map(x => <IEnumMember>{ value: x, displayName: x }));
        }

        private static getValueFnByType(type: powerbi.data.DataViewObjectPropertyTypeDescriptor) {
            switch(_.keys(type)[0]) {
                case "fill": 
                    return DataViewObjects.getFillColor;
                default:
                    return DataViewObjects.getValue;
            }
        }

        public static enumerateObjectInstances(
            settings = new this(),
            options: EnumerateVisualObjectInstancesOptions,
            capabilities: VisualCapabilities): ObjectEnumerationBuilder {

            var enumeration = new ObjectEnumerationBuilder();
            var object = settings && settings[options.objectName];
            if(!object) {
                return enumeration;
            }

            var instance = <VisualObjectInstance>{
                objectName: options.objectName,
                selector: null,
                properties: {}
            };

            for(var key in object) {
                if(_.has(object,key)) {
                    instance.properties[key] = object[key];
                }
            }

            enumeration.pushInstance(instance);
            return enumeration;
        }

        public originalSettings: DotPlotSettings;
        public createOriginalSettings(): void {
            this.originalSettings = _.cloneDeep(this);
        }

        //Default Settings
        public categoryAxis = {
            show: true,
            showAxisTitle: true,
            labelColor: dataLabelUtils.defaultLabelColor
        };
        public dataPoint = {
            fill: "#00B8AA",
        };
        public labels = {
            show: true,
            color: dataLabelUtils.defaultLabelColor,
            labelDisplayUnits: 0,
            labelPrecision: 2,
            fontSize: dataLabelUtils.DefaultFontSizeInPt
        };
    }

    export class DotPlot implements IVisual {
        private static DataLabelXOffset: number = 2;
        private static DataLabelYOffset: number = 1.5;

        private static DataLabelAngle: number = -90;
        private static DataLabelXOffsetIndex: number = 0.3;

        public static capabilities: VisualCapabilities = {
            dataRoles: [
                {
                    name: "Category",
                    kind: VisualDataRoleKind.Grouping,
                    displayName: "Category"
                },
                {
                    name: "Values",
                    kind: VisualDataRoleKind.Measure,
                    displayName: "Values"
                }
            ],
            dataViewMappings: [{
                conditions: [
                    { "Category": { max: 1 }, "Values": { max: 1 } },
                ],
                categorical: {
                    categories: {
                        for: { in: "Category" },
                        dataReductionAlgorithm: { top: {} }
                    },
                    values: {
                        group: {
                            by: "Series",
                            select: [{ for: { in: "Values" } }],
                            dataReductionAlgorithm: { top: {} }
                        }
                    }
                },
            }],
            objects: {
                general: {
                    displayName: "General",
                    properties: {
                        formatString: {
                            type: { formatting: { formatString: true } },
                        },
                    },
                },
                categoryAxis: {
                    displayName: "X-Axis",
                    properties: {
                        show: {
                            displayName: "Show",
                            type: { bool: true },
                        },
                        showAxisTitle: {
                            displayName: "Title",
                            description: "Title options",
                            type: { bool: true }
                        },
                        labelColor: {
                            displayName: "Label color",
                            type: { fill: { solid: { color: true } } }
                        }
                    }
                },
                dataPoint: {
                    displayName: "Data colors",
                    properties: {
                        fill: {
                            displayName: "Fill",
                            type: { fill: { solid: { color: true } } }
                        }
                    }
                },
                labels: {
                    displayName: "Data labels",
                    description: "Display data label options",
                    properties: {
                        show: {
                            displayName: "Show",
                            type: { bool: true }
                        },
                        color: {
                            displayName: "Color",
                            description: "Select color for data labels",
                            type: { fill: { solid: { color: true } } }
                        },
                        labelDisplayUnits: {
                            displayName: "Display units",
                            description: "Select the units (millions, billions, etc.)",
                            type: { formatting: { labelDisplayUnits: true } },
                            suppressFormatPainterCopy: true
                        },
                        labelPrecision: {
                            displayName: "Decimal places",
                            description: "Select the number of decimal places to display",
                            placeHolderText: "Auto",
                            type: { numeric: true },
                            suppressFormatPainterCopy: true
                        },
                        fontSize: {
                            displayName: "Text Size",
                            type: { formatting: { fontSize: true } }
                        }
                    }
                }
            }
        };

        private static getCategoryTextProperties(text?: string): TextProperties {
            return {
                text: text,
                fontFamily: "'Segoe UI',wf_segoe-ui_normal,helvetica,arial,sans-serif",
                fontSize: PixelConverter.toString(11),
            };
        }

        private static getValueTextProperties(fontSize: number, text?: string): TextProperties {
            return {
                text: text,
                fontFamily: "'Segoe UI',wf_segoe-ui_normal,helvetica,arial,sans-serif",
                fontSize: PixelConverter.toString(fontSize),
            };
        }

        private get settings() {
            return this.data && this.data.settings;
        }

        private layout: VisualLayout;
        private divContainer: D3.Selection;
        private svg: D3.Selection;
        private xAxisSelection: D3.Selection;
        private dotPlot: D3.Selection;
        private clearCatcher: D3.Selection;
        private behavior: IInteractiveBehavior;

        private colors: IDataColorPalette;
        private animator: IGenericAnimator;
        private durationAnimations: number = 200;
        private data: DotPlotData;
        private dataViewport: IViewport;
        private xAxisProperties: IAxisProperties;

        private radius: number;
        private strokeWidth: number;
        private interactivityService: IInteractivityService;
        private scaleType: string = AxisScale.linear;

        private dotPlotSelectors: DotPlotSelectors =
        {
            scrollableContainer: CreateClassAndSelector("dotPlotScrollableContainer"),
            svgPlotSelector: CreateClassAndSelector("dotplot"),
            plotSelector: CreateClassAndSelector("dotplotSelector"),
            plotGroupSelector: CreateClassAndSelector("dotplotGroup"),
            axisSelector: CreateClassAndSelector("axisGraphicsContext"),
            xAxisSelector: CreateClassAndSelector("x axis"),
            circleSeletor: CreateClassAndSelector("circleSelector"),
        };

        private static DefaultValues = {
            labelOrientation: DotPlotLabelsOrientation.Horizontal
        };

        private static getTooltipData(value: any): TooltipDataItem[] {
            return [{
                displayName: "Value",
                value: value.toString()
            }];
        }

        public static converter(dataView: DataView, height: number, colors: IDataColorPalette, radius: number): DotPlotData {
            if (!dataView || !dataView.categorical || _.isEmpty(dataView.categorical.values) || _.isEmpty(dataView.categorical.categories)) {
                return null;
            }

            var properties = DotPlotSettings.getProperties(this.capabilities);
            var settings = this.parseSettings(dataView);
            var categoryColumn = dataView.categorical.categories[0];
            var valueColumn = dataView.categorical.values[0];

            var valueValues = valueColumn.values.map(x => x || 0);
            
            var minValue = <number>_.min(valueValues);
            var maxValue = <number>_.max(valueValues);

            var valuesFormatter: IValueFormatter = valueFormatter.create({
                format: valueFormatter.getFormatString(valueColumn.source, properties.general.formatString),
                precision: settings.labels.labelPrecision,
                value: settings.labels.labelDisplayUnits || maxValue
            });

            var formattedValues = valueValues.map(valuesFormatter.format);

            var categoriesFormatter: IValueFormatter = valueFormatter.create({
                format: valueFormatter.getFormatString(categoryColumn.source, properties.general.formatString)
            });

            var categories: DotPlotChartCategory[] = categoryColumn.values.map((x, i) => <DotPlotChartCategory>{
                value: categoriesFormatter.format(x),
                selectionId: SelectionId.createWithId(categoryColumn.identity[i])
            });

            var labelFontSize: number = PixelConverter.fromPointToPixel(settings.labels.fontSize);
            var categoryLabelHeight = 15;
            var maxXAxisHeight = (settings.categoryAxis.show ? 20 : 0) + (settings.categoryAxis.showAxisTitle ? categoryLabelHeight : 0);

            var maxCategoryLength = _.max(categories.map(x => x.value.length));
            var maxCategoryWidth = maxCategoryLength * TextMeasurementService.measureSvgTextWidth(DotPlot.getCategoryTextProperties("W"));

            var maxLabelLength = _.max(formattedValues.map(x => x.length));
            var maxLabelWidth = Math.max(70, maxLabelLength * TextMeasurementService.measureSvgTextWidth(DotPlot.getValueTextProperties(labelFontSize, "0")) * 0.8);

            var diameter: number = 2 * radius + 1;
            var dotsTotalHeight: number = height - maxXAxisHeight - radius*2 - labelFontSize;
            var maxDots: number = Math.floor(dotsTotalHeight / diameter);

            var yScale: D3.Scale.LinearScale = d3.scale.linear()
                .domain([0, maxDots])
                .range([dotsTotalHeight, 0]);

            var dataPointsGroup: DotPlotDataGroup[] = [];

            var color = settings.dataPoint.fill;
            var minDots = minValue / (maxValue / maxDots);
            var dotScale = d3.scale.log()
                    .domain([minValue < 0 ? 1 : minValue, maxValue])
                    .range([minDots <= 0 ? 1 : minDots, maxDots])
                    .clamp(true);

            for (var vi = 0, length = valueValues.length; vi < length; vi++) {
                var value = <number>valueValues[vi];

                var scaledValue = dotScale(value);
                var dataPoints: DotPlotDataPoint[] = [];

                for (var level = 0; level < scaledValue && maxDots > 0; level++) {
                    dataPoints.push({
                        y: yScale(level),
                        tooltipInfo: DotPlot.getTooltipData(value.toFixed(settings.labels.labelPrecision).toString())
                    });
                }

                var categorySelectionId = SelectionIdBuilder.builder().withCategory(categoryColumn, vi).createSelectionId(),
                    tooltipInfo = DotPlot.getTooltipData(value.toFixed(settings.labels.labelPrecision));

                dataPointsGroup.push({
                    category: categories[vi],
                    selected: false,
                    value: value,
                    label: formattedValues[vi],
                    color: color,
                    identity: categorySelectionId,
                    tooltipInfo: tooltipInfo,
                    dataPoints: dataPoints,
                    highlight: false,
                    index: dataPointsGroup.length,
                    labelFontSize: labelFontSize + "px"
                });
            }

            return {
                dataGroups: dataPointsGroup,
                categoryAxisName: categoryColumn.source.displayName,
                categoryColumn: categoryColumn,
                settings: settings,
                maxXAxisHeight: maxXAxisHeight,
                labelFontSize: labelFontSize,
                categoryLabelHeight: categoryLabelHeight,
                dotsTotalHeight: dotsTotalHeight,
                maxLabelWidth: maxLabelWidth,
                maxCategoryWidth: maxCategoryWidth
            };
        }

        private static parseSettings(dataView: DataView): DotPlotSettings {
            var settings = DotPlotSettings.parse(dataView, this.capabilities);
            settings.labels.labelPrecision = Math.min(Math.max(0, settings.labels.labelPrecision), 17);

            settings.createOriginalSettings();
            return settings;
        }

        public constructor(options?: DotPlotConstructorOptions) {
            if (options) {
                if (options.svg) {
                    this.svg = options.svg;
                }
                if (options.animator) {
                    this.animator = options.animator;
                }

                this.radius = options.radius || DefaultRadius;
                this.strokeWidth = options.strokeWidth || DefaultStrokeWidth;
            }
        }

        public init(options: VisualInitOptions): void {
            var element = options.element;
            this.behavior = new DotplotBehavior();

            this.interactivityService = createInteractivityService(options.host);
            this.radius = DefaultRadius;
            this.strokeWidth = DefaultStrokeWidth;
            this.colors = options.style.colorPalette.dataColors;
            this.layout = new VisualLayout(options.viewport, { top: 5, bottom: 15, right: 0, left: 0 });

            this.divContainer = d3.select(element.get(0))
                .append("div")
                .classed(this.dotPlotSelectors.scrollableContainer.class, true);

            this.svg = this.divContainer
                .append("svg")
                .classed(this.dotPlotSelectors.svgPlotSelector.class, true);

            this.clearCatcher = appendClearCatcher(this.svg);

            var axisGraphicsContext = this.svg
                .append("g")
                .classed(this.dotPlotSelectors.axisSelector.class, true);

            this.dotPlot = this.svg
                .append("g")
                .classed(this.dotPlotSelectors.plotSelector.class, true);

            this.xAxisSelection = axisGraphicsContext
                .append("g")
                .classed(this.dotPlotSelectors.xAxisSelector.class, true);
        }

        public update(options: VisualUpdateOptions): void {
            if (!options.dataViews || !options.dataViews[0]) return;

            this.layout.viewport = options.viewport;

            var data = DotPlot.converter(options.dataViews[0], this.layout.viewportIn.height, this.colors, this.radius);

            if(!data) {
                this.clear();
                return;
            }

            this.data = data;

            this.durationAnimations = getAnimationDuration(this.animator, options.suppressAnimations);

            this.dataViewport = {
                height: this.layout.viewportIn.height,
                width: Math.max(this.layout.viewportIn.width, this.data.dataGroups.length * (this.radius * 2 + 2) + this.data.maxLabelWidth)
            };

            this.svg.style({
                height: PixelConverter.toString(this.dataViewport.height),
                width: PixelConverter.toString(this.dataViewport.width)
            });

            this.divContainer.style({
                width: `${this.layout.viewport.width}px`,
                height: `${this.layout.viewport.height}px`
            });

            if (this.interactivityService) {
                this.interactivityService.applySelectionStateToData(this.data.dataGroups);
            }

            this.calculateAxes(false);

            this.renderAxis(this.durationAnimations);

            this.drawDotPlot();

            if (this.settings.labels.show) {
                var layout: ILabelLayout = this.getDotPlotLabelsLayout();

                var labels: D3.UpdateSelection = dataLabelUtils.drawDefaultLabelsForDataPointChart(
                    this.data.dataGroups,
                    this.svg,
                    layout,
                    this.dataViewport,
                    !options.suppressAnimations,
                    this.durationAnimations);

                if (labels) {
                    labels.attr("transform", (dataGroup: DotPlotDataGroup) => {
                        var size: ISize = dataGroup.size;

                        if (DotPlot.DefaultValues.labelOrientation === DotPlotLabelsOrientation.Vertical) {
                            var px: number = dataGroup.anchorPoint.x;
                            var py: number = dataGroup.anchorPoint.y;
                            var dx = size.width / DotPlot.DataLabelXOffset + size.height * DotPlot.DataLabelXOffsetIndex;
                            var dy = size.height + size.height / DotPlot.DataLabelYOffset;

                            return SVGUtil.translateAndRotate(dx, -dy, px, py, DotPlot.DataLabelAngle);
                        } else {
                            var dx = size.width / DotPlot.DataLabelXOffset;
                            var dy = size.height / DotPlot.DataLabelYOffset;

                            return SVGUtil.translate(dx, dy);
                        }
                    });
                }
            }
            else {
                dataLabelUtils.cleanDataLabels(this.svg);
            }
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            if(!this.settings || !this.settings.originalSettings) {
                return [];
            }

            var enumeration = DotPlotSettings.enumerateObjectInstances(this.settings.originalSettings, options, DotPlot.capabilities);

            return enumeration.complete();
        }

        private drawDotPlot(): void {
            var dotGroupSelection: D3.UpdateSelection = this.dotPlot.selectAll(this.dotPlotSelectors.plotGroupSelector.selector).data(this.data.dataGroups);
            var hasSelection = this.interactivityService && this.interactivityService.hasSelection();
            
            dotGroupSelection
                .enter()
                .append("g")
                .classed(this.dotPlotSelectors.plotGroupSelector.class, true);

            dotGroupSelection.attr({
                'transform': (d: DotPlotDataGroup) => SVGUtil.translate(this.getXDotPositionByIndex(d.index), this.layout.margin.top + this.data.labelFontSize),
                'stroke': "black",
                "stroke-width": this.strokeWidth
            })
            .style("fill-opacity", (item: DotPlotDataGroup) => dotPlotUtils.getFillOpacity(item.selected, item.highlight, hasSelection, false));

            var circleSelection = dotGroupSelection.selectAll(this.dotPlotSelectors.circleSeletor.selector)
                .data((d: DotPlotDataGroup) => { return d.dataPoints; });

            circleSelection
                .enter()
                .append("circle")
                .classed(this.dotPlotSelectors.circleSeletor.class, true);

            circleSelection.attr(
                {
                    cy: (point: DotPlotDataPoint) => { return point.y; },
                    r: this.radius,
                    fill: this.settings.dataPoint.fill
                });

            this.renderTooltip(dotGroupSelection);

            circleSelection
                .exit()
                .remove();

            dotGroupSelection
                .exit()
                .remove();

            var interactivityService = this.interactivityService;
            if (interactivityService) {
                interactivityService.applySelectionStateToData(this.data.dataGroups);

                var behaviorOptions: DotplotBehaviorOptions = {
                    columns: dotGroupSelection,
                    clearCatcher: this.clearCatcher,
                    interactivityService: this.interactivityService,
                };

                interactivityService.bind(this.data.dataGroups, this.behavior, behaviorOptions);
            }
        }

        private getXDotPositionByIndex(index: number): number {
            var scale: D3.Scale.OrdinalScale = <any>this.xAxisProperties.scale;
            return this.data.maxLabelWidth/2 + scale(index);
        }

        private getDotPlotLabelsLayout(): ILabelLayout {
            return {
                labelText: (dataGroup: DotPlotDataGroup) => {
                    return dataLabelUtils.getLabelFormattedText({
                        label: dataGroup.label,
                        fontSize: parseFloat(<any>this.settings.labels.fontSize),
                        maxWidth: this.dataViewport.width,
                    });
                },
                labelLayout: {
                    x: (dataGroup: DotPlotDataGroup) => {
                        var x = this.getXDotPositionByIndex(dataGroup.index);
                        var dx = dataGroup.size.width / DotPlot.DataLabelXOffset;
                        return x - dx;
                    },
                    y: (dataGroup: DotPlotDataGroup) => {
                        var y = (_.isEmpty(dataGroup.dataPoints) ? this.data.dotsTotalHeight + this.radius * 2 : _.last(dataGroup.dataPoints).y) + this.data.labelFontSize;
                        var dy = dataGroup.size.height;
                        return y - dy;
                    }
                },
                filter: (dataGroup: DotPlotDataGroup) => {
                    return !!(dataGroup && dataGroup.dataPoints && this.layout.viewportIn.height - this.data.maxXAxisHeight + this.radius * 2 > this.data.labelFontSize);
                },
                style: {
                    "fill": this.settings.labels.color,
                    "font-size": this.data.labelFontSize + "px",
                    "font-family": LabelTextProperties.fontFamily
                },
            };
        }

        private clear(): void {
            this.dotPlot.selectAll("*").remove();
            this.xAxisSelection.selectAll("*").remove();
            dataLabelUtils.cleanDataLabels(this.svg);
        }

        private renderTooltip(selection: D3.UpdateSelection): void {
            TooltipManager.addTooltip(selection, (tooltipEvent: TooltipEvent) =>
                (<DotPlotDataGroup>tooltipEvent.data).tooltipInfo);
        }

        private calculateAxes(scrollbarVisible: boolean): void {
            var pixelSpan = this.dataViewport.width - this.data.maxLabelWidth;
            var xAxisProperties = AxisHelper.createAxis({
                pixelSpan: pixelSpan,
                dataDomain: [0, this.data.dataGroups.length - 1],
                metaDataColumn: null,
                formatString: null,
                outerPadding: 0,
                isScalar: true,
                isVertical: false,
                forcedTickCount: Math.min(this.data.dataGroups.length,
                    Math.floor((pixelSpan + this.data.maxCategoryWidth) / Math.min(55, this.data.maxCategoryWidth))),
                useTickIntervalForDisplayUnits: true,
                isCategoryAxis: false,
                scaleType: this.scaleType,
                axisDisplayUnits: 0
            });

            var scale = xAxisProperties.axis.scale();
            scale.domain([0, this.data.dataGroups.length - 1]);
            var tickValues = xAxisProperties.axis.tickValues().filter(x => x < this.data.dataGroups.length);
            xAxisProperties.axis.tickValues(tickValues);
            var tickWidth = (tickValues.length > 1 ? scale(tickValues[1]) - scale(tickValues[0]) : pixelSpan) - 3;
            xAxisProperties.axis.tickFormat((index: number) => {
                if(!this.settings.categoryAxis.show || !this.data.dataGroups[index]) {
                    return "";
                }
                var textProperties = DotPlot.getCategoryTextProperties(this.data.dataGroups[index].category.value);
                return TextMeasurementService.getTailoredTextOrDefault(textProperties, tickWidth);
            });

            if (this.settings.categoryAxis.show) {
                // Should handle the label, units of the label and the axis style
                xAxisProperties.axisLabel = this.data.categoryAxisName;
            }

            this.xAxisProperties = xAxisProperties;
        }

        private renderAxis(duration: number): void {

            var height = this.dataViewport.height - this.data.maxXAxisHeight;
            this.xAxisSelection.attr({ transform: SVGUtil.translate(this.data.maxLabelWidth/2, height) });

            var xAxis = this.xAxisProperties.axis.orient("bottom");

            this.xAxisSelection
                .transition()
                .duration(duration)
                .call(xAxis)
                .selectAll("g.tick text")
                .style("fill", this.settings.categoryAxis.labelColor);

            this.xAxisSelection.selectAll(".tick text")
                .append("title")
                .text((index: number) => this.data.dataGroups[index] && this.data.dataGroups[index].category.value);

            this.xAxisSelection
                .selectAll("line")
                .style("opacity", this.settings.categoryAxis.show ? 1 : 0);

            this.xAxisSelection
                .selectAll(".xAxisLabel")
                .remove();

            if (this.settings.categoryAxis.showAxisTitle) {
                var titleWidth = TextMeasurementService.measureSvgTextWidth(DotPlot.getCategoryTextProperties(this.data.categoryAxisName));
                this.xAxisSelection.append("text")
                    .text(this.data.categoryAxisName)
                    .style("text-anchor", "middle")
                    .attr("class", "xAxisLabel")
                    .style("fill", this.settings.categoryAxis.labelColor)
                    .attr("transform", SVGUtil.translate(this.dataViewport.width / 2 - titleWidth/2, this.data.maxXAxisHeight - this.data.categoryLabelHeight + 13));
            }
        }
    }

    export interface DotplotBehaviorOptions {
        columns: D3.Selection;
        clearCatcher: D3.Selection;
        interactivityService: IInteractivityService;
    }

    export class DotplotBehavior implements IInteractiveBehavior {
        private columns: D3.Selection;
        private clearCatcher: D3.Selection;
        private interactivityService: IInteractivityService;

        public bindEvents(options: DotplotBehaviorOptions, selectionHandler: ISelectionHandler): void {
            this.columns = options.columns;
            this.clearCatcher = options.clearCatcher;
            this.interactivityService = options.interactivityService;

            this.columns.on("click", (d: SelectableDataPoint, i: number) => {
                selectionHandler.handleSelection(d, d3.event.ctrlKey);
            });

            options.clearCatcher.on("click", () => {
                selectionHandler.handleClearSelection();
            });
        }

        public renderSelection(hasSelection: boolean) {
            var hasHighlights = this.interactivityService.hasSelection();

            this.columns.style("fill-opacity", (d: DotPlotDataGroup) => {
                return dotPlotUtils.getFillOpacity(d.selected, d.highlight, !d.highlight && hasSelection, !d.selected && hasHighlights);
            });
        }
    }

    export module dotPlotUtils {
        export var DimmedOpacity: number = 0.4;
        export var DefaultOpacity: number = 1.0;

        export function getFillOpacity(selected: boolean, highlight: boolean, hasSelection: boolean, hasPartialHighlights: boolean): number {
            if ((hasPartialHighlights && !highlight) || (hasSelection && !selected)) {
                return DimmedOpacity;
            }

            return DefaultOpacity;
        }
    }
}
