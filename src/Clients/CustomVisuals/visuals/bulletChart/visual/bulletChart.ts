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
    // jsCommon
    import PixelConverter = jsCommon.PixelConverter;

    // powerbi
    import IEnumType = powerbi.IEnumType;
    import createEnumType = powerbi.createEnumType;
    import IVisual = powerbi.IVisual;
    import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
    import VisualCapabilities = powerbi.VisualCapabilities;
    import VisualDataRoleKind = powerbi.VisualDataRoleKind;
    import IVisualHostServices = powerbi.IVisualHostServices;
    import IViewport = powerbi.IViewport;
    import TextProperties = powerbi.TextProperties;
    import VisualUpdateOptions = powerbi.VisualUpdateOptions;
    import DataView = powerbi.DataView;
    import DataViewObjects = powerbi.DataViewObjects;
    import TextMeasurementService = powerbi.TextMeasurementService;
    import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
    import VisualInitOptions = powerbi.VisualInitOptions;
    import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
    import VisualObjectInstance = powerbi.VisualObjectInstance;
    import IEnumMember = powerbi.IEnumMember;
    import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
    import DataViewValueColumns = powerbi.DataViewValueColumns;
    import DataViewCategoricalColumn = powerbi.DataViewCategoricalColumn;
    import DataViewValueColumn = powerbi.DataViewValueColumn;

    // powerbi.data
    import DataViewObjectPropertyTypeDescriptor = powerbi.data.DataViewObjectPropertyTypeDescriptor;

    // powerbi.visuals
    import SelectableDataPoint = powerbi.visuals.SelectableDataPoint;
    import TooltipDataItem = powerbi.visuals.TooltipDataItem;
    import IInteractiveBehavior = powerbi.visuals.IInteractiveBehavior;
    import ISelectionHandler = powerbi.visuals.ISelectionHandler;
    import TooltipManager = powerbi.visuals.TooltipManager;
    import TooltipEvent = powerbi.visuals.TooltipEvent;
    import appendClearCatcher = powerbi.visuals.appendClearCatcher;
    import createInteractivityService = powerbi.visuals.createInteractivityService;
    import valueFormatter = powerbi.visuals.valueFormatter;
    import TooltipBuilder = powerbi.visuals.TooltipBuilder;
    import IInteractivityService = powerbi.visuals.IInteractivityService;
    import IAxisProperties = powerbi.visuals.IAxisProperties;
    import IMargin = powerbi.visuals.IMargin;
    import ObjectEnumerationBuilder = powerbi.visuals.ObjectEnumerationBuilder;
    import converterHelper = powerbi.visuals.converterHelper;
    import SelectionIdBuilder = powerbi.visuals.SelectionIdBuilder;
    import AxisHelper = powerbi.visuals.AxisHelper;
    import axisScale = powerbi.visuals.axisScale;

    export interface BarData {
        scale: any;
        barIndex: number;
        categoryLabel: string;
        xAxisProperties: IAxisProperties;
        x: number;
        y: number;
        key: string;
    }

    export interface BarRect extends SelectableDataPoint {
        barIndex: number;
        start: number;
        end: number;
        fill: string;
        tooltipInfo?: TooltipDataItem[];
        key: string;
        highlight?: boolean;
    }

    export interface TargetValue {
        barIndex: number;
        value: number;
        value2: number;
        fill: string;
        key: string;
    }

    export interface ScaledValues {
        firstScale: number;
        secondScale: number;
        thirdScale: number;
        fourthScale: number;
        fifthScale: number;
    }

    export interface BarValueRect extends BarRect { }

    export interface BulletChartAxis {
        axis: boolean;
        axisColor: string;
        measureUnits: string;
        unitsColor: string;
    }

    //Model
    export interface BulletChartModel {
        bars: BarData[];
        settings: BulletChartSettings;
        barRects: BarRect[];
        valueRects: BarValueRect[];
        targetValues: TargetValue[];
        hasHighlights: boolean;
        viewportLength: number;
        labelHeight: number;
        labelHeightTop: number;
        spaceRequiredForBarHorizontally: number;
    }

    export enum BulletChartOrientation {
        HorizontalLeft = <any>"Horizontal Left",
        HorizontalRight = <any>"Horizontal Right",
        VerticalTop = <any>"Vertical Top",
        VerticalBottom = <any>"Vertical Bottom"
    }

    export interface BulletChartProperty {
        [propertyName: string]: DataViewObjectPropertyIdentifier;
    }

    export interface BulletChartProperties {
        [propertyName: string]: BulletChartProperty;
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

    export class BulletChartSettings {
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

        private static getValueFnByType(type: DataViewObjectPropertyTypeDescriptor) {
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

        public originalSettings: BulletChartSettings;
        public createOriginalSettings(): void {
            this.originalSettings = _.cloneDeep(this);
        }

        //Default Settings
        public values = {
            targetValue: null,
            targetValue2: null,
            minimumPercent: 0,
            needsImprovementPercent: null,
            satisfactoryPercent: null,
            goodPercent: null,
            veryGoodPercent: null,
            maximumPercent: null
        };
        public labels = {
            show: true,
            labelColor: "Black",
            fontSize: 11
        };
        public orientation = {
            orientation: BulletChartOrientation.HorizontalLeft
        };
        public colors = {
            minColor: "Darkred",
            needsImprovementColor: "Red",
            satisfactoryColor: "Yellow",
            goodColor: "Green",
            veryGoodColor: "Darkgreen",
            bulletColor: "Black"
        };
        public axis = {
            axis: true,
            axisColor: "Grey",
            measureUnits: "",
            unitsColor: "Grey",
        };
    }

    export class BulletChartColumns<T> {
        public static Roles = Object.freeze(
            _.mapValues(new BulletChartColumns<string>(), (x, i) => i));

        public static getColumnSources(dataView: DataView) {
            return this.getColumnSourcesT<DataViewMetadataColumn>(dataView);
        }

        public static getTableValues(dataView: DataView) {
            var table = dataView && dataView.table;
            var columns = this.getColumnSourcesT<any[]>(dataView);
            return columns && table && _.mapValues(
                columns, (n: DataViewMetadataColumn, i) => n && table.rows.map(row => row[n.index]));
        }

        public static getTableRows(dataView: DataView) {
            var table = dataView && dataView.table;
            var columns = this.getColumnSourcesT<any[]>(dataView);
            return columns && table && table.rows.map(row =>
                _.mapValues(columns, (n: DataViewMetadataColumn, i) => n && row[n.index]));
        }

        public static getCategoricalValues(dataView: DataView) {
            var categorical = dataView && dataView.categorical;
            var categories = categorical && categorical.categories || [];
            var values = categorical && categorical.values || <DataViewValueColumns>[];
            var series = categorical && values.source && this.getSeriesValues(dataView);
            return categorical && _.mapValues(new this<any[]>(), (n, i) =>
                (<DataViewCategoricalColumn[]>_.toArray(categories)).concat(_.toArray(values))
                    .filter(x => x.source.roles && x.source.roles[i]).map(x => x.values)[0]
                || values.source && values.source.roles && values.source.roles[i] && series);
        }

        public static getSeriesValues(dataView: DataView) {
            return dataView && dataView.categorical && dataView.categorical.values
                && dataView.categorical.values.map(x => converterHelper.getSeriesName(x.source));
        }

        public static getCategoricalColumns(dataView: DataView) {
            var categorical = dataView && dataView.categorical;
            var categories = categorical && categorical.categories || [];
            var values = categorical && categorical.values || <DataViewValueColumns>[];
            return categorical && _.mapValues(
                new this<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns>(),
                (n, i) => categories.filter(x => x.source.roles && x.source.roles[i])[0]
                    || values.source && values.source.roles && values.source.roles[i] && values
                    || values.filter(x => x.source.roles && x.source.roles[i]));
        }

        public static getGroupedValueColumns(dataView: DataView) {
            var categorical = dataView && dataView.categorical;
            var values = categorical && categorical.values;
            var grouped = values && values.grouped();
            return grouped && grouped.map(g => _.mapValues(
                new this<DataViewValueColumn>(),
                (n,i) => g.values.filter(v => v.source.roles[i])[0]));
        }

        private static getColumnSourcesT<T>(dataView: DataView) {
            var columns = dataView && dataView.metadata && dataView.metadata.columns;
            return columns && _.mapValues(
                new this<T>(), (n, i) => columns.filter(x => x.roles && x.roles[i])[0]);
        }

        //Data Roles
        public Category: T = null;
        public Value: T = null;
        public TargetValue: T = null;
        public Minimum: T = null;
        public NeedsImprovement: T = null;
        public Satisfactory: T = null;
        public Good: T = null;
        public VeryGood: T = null;
        public Maximum: T = null;
        public TargetValue2: T = null;
    }

    export class BulletChart implements IVisual {
        private static ScrollBarSize = 22;
        private static SpaceRequiredForBarVertically = 100;
        private static XMarginHorizontalLeft = 20;
        private static XMarginHorizontalRight = 55;
        private static YMarginHorizontal = 30;
        private static XMarginVertical = 70;
        private static YMarginVertical = 10;
        private static BulletSize = 25;
        private static DefaultSubtitleFontSizeInPt = 9;
        private static BarMargin = 10;
        private static MaxLabelWidth = 80;
        private static MaxMeasureUnitWidth = BulletChart.MaxLabelWidth - 20;
        private static SubtitleMargin = 10;
        private static AxisFontSizeInPt = 8;
        private static SecondTargetLineSize = 7;

        private static MarkerMarginHorizontal = BulletChart.BulletSize / 3;
        private static MarkerMarginVertical = BulletChart.BulletSize / 4;

        private static FontFamily: string = "Segoe UI";
        private baselineDelta: number = 0;

        public static capabilities: VisualCapabilities = {
            dataRoles: [
                {
                    name: 'Category',
                    kind: VisualDataRoleKind.Grouping,
                    displayName: 'Category',
                }, {
                    name: 'Value',
                    kind: VisualDataRoleKind.Measure,
                    displayName: 'Value',
                }, {
                    name: 'TargetValue',
                    kind: VisualDataRoleKind.Measure,
                    displayName: 'Target Value',
                }, {
                    name: 'Minimum',
                    kind: VisualDataRoleKind.Measure,
                    displayName: 'Minimum',
                }, {
                    name: 'NeedsImprovement',
                    kind: VisualDataRoleKind.Measure,
                    displayName: 'Needs Improvement',
                }, {
                    name: 'Satisfactory',
                    kind: VisualDataRoleKind.Measure,
                    displayName: 'Satisfactory',
                }, {
                    name: 'Good',
                    kind: VisualDataRoleKind.Measure,
                    displayName: 'Good',
                }, {
                    name: 'VeryGood',
                    kind: VisualDataRoleKind.Measure,
                    displayName: 'Very Good',
                }, {
                    name: 'Maximum',
                    kind: VisualDataRoleKind.Measure,
                    displayName: 'Maximum',
                }, {
                    name: 'TargetValue2',
                    kind: VisualDataRoleKind.Measure,
                    displayName: 'Target Value 2'
                }
            ],
            objects: {
                general: {
                    displayName: "General",
                    properties: {
                        formatString: {
                            type: { formatting: { formatString: true } },
                        },
                    },
                },
                values: {
                    displayName: 'Data values',
                    properties: {
                        targetValue: {
                            displayName: 'Target Value',
                            type: { numeric: true }
                        },
                        targetValue2: {
                            displayName: 'Target Value 2',
                            type: { numeric: true },
                        },
                        minimumPercent: {
                            displayName: 'Minimum %',
                            type: { numeric: true }
                        },
                        needsImprovementPercent: {
                            displayName: 'Needs Improvement %',
                            type: { numeric: true },
                        },
                        satisfactoryPercent: {
                            displayName: 'Satisfactory %',
                            type: { numeric: true }
                        },
                        goodPercent: {
                            displayName: 'Good %',
                            type: { numeric: true }
                        },
                        veryGoodPercent: {
                            displayName: 'Very Good %',
                            type: { numeric: true },
                        },
                        maximumPercent: {
                            displayName: 'Maximum %',
                            type: { numeric: true }
                        },
                    }
                },
                labels: {
                    displayName: 'Category labels',
                    properties: {
                        show: {
                            displayName: "Show",
                            type: { bool: true },
                        },
                        labelColor: {
                            displayName: "Color",
                            description: "Select color for data labels",
                            type: { fill: { solid: { color: true } } }
                        },
                        fontSize: {
                            displayName: "Text Size",
                            type: { formatting: { fontSize: true } },
                        },
                    },
                },
                orientation: {
                    displayName: 'Orientation',
                    properties: {
                        orientation: {
                            displayName: 'Orientation',
                            type: { enumeration: BulletChartSettings.createEnumTypeFromEnum(BulletChartOrientation) }
                        }
                    }
                },
                colors: {
                    displayName: 'Colors',
                    properties: {
                        minColor: {
                            type: { fill: { solid: { color: true } } },
                            displayName: 'Minimum Color'
                        },
                        needsImprovementColor: {
                            type: { fill: { solid: { color: true } } },
                            displayName: 'Needs Improvement Color',
                        },
                        satisfactoryColor: {
                            type: { fill: { solid: { color: true } } },
                            displayName: 'Satisfactory Color'
                        },
                        goodColor: {
                            type: { fill: { solid: { color: true } } },
                            displayName: 'Good Color'
                        },
                        veryGoodColor: {
                            type: { fill: { solid: { color: true } } },
                            displayName: 'Very Good Color',
                        },
                        bulletColor: {
                            type: { fill: { solid: { color: true } } },
                            displayName: 'Bullet Color'
                        }
                    },
                },
                axis: {
                    displayName: 'Axis',
                    properties: {
                        axis: {
                            displayName: 'Axis',
                            type: { bool: true }
                        },
                        axisColor: {
                            type: { fill: { solid: { color: true } } },
                            displayName: 'Axis Color'
                        },
                        measureUnits: {
                            type: { text: true },
                            displayName: 'Measure Units '
                        },
                        unitsColor: {
                            type: { fill: { solid: { color: true } } },
                            displayName: 'Units Color'
                        },
                    }
                }
            },
            dataViewMappings: [{
                conditions: [
                    {
                        'Category': { max: 1 }, 'Value': { max: 1 }, 'TargetValue': { max: 1 }, 'Minimum': { max: 1 }, 'NeedsImprovement': { max: 1 },
                        'Satisfactory': { max: 1 }, 'Good': { max: 1 }, 'VeryGood': { max: 1 }, 'Maximum': { max: 1 }, 'TargetValue2': { max: 1 },
                    },
                ],
                categorical: {
                    categories: {
                        for: { in: 'Category' },
                        dataReductionAlgorithm: { top: {} }
                    },
                    values: {
                        select: [
                            { bind: { to: 'Value' } },
                            { bind: { to: 'TargetValue' } },
                            { bind: { to: 'TargetValue2' } },
                            { bind: { to: 'Minimum' } },
                            { bind: { to: 'NeedsImprovement' } },
                            { bind: { to: 'Satisfactory' } },
                            { bind: { to: 'Good' } },
                            { bind: { to: 'VeryGood' } },
                            { bind: { to: 'Maximum' } },
                        ]
                    },
                },
            }],
            supportsHighlight: true,
            sorting: {
                default: {},
            },
            drilldown: {
                roles: ['Category']
            }
        };

        //Variables
        private clearCatcher: D3.Selection;
        private bulletBody: D3.Selection;
        private scrollContainer: D3.Selection;
        private labelGraphicsContext: D3.Selection;
        private bulletGraphicsContext: D3.Selection;
        private data: BulletChartModel;
        private behavior: BulletWebBehavior;
        private interactivityService: IInteractivityService;
        private hostService: IVisualHostServices;
        private layout: VisualLayout;

        private get settings(): BulletChartSettings {
            return this.data && this.data.settings;
        }

        private get reverse(): boolean {
            switch(this.settings && this.settings.orientation.orientation) {
                case BulletChartOrientation.HorizontalRight:
                case BulletChartOrientation.VerticalBottom:
                    return true;
                default:
                    return false;
            }
        }

        private get vertical(): boolean {
            switch(this.settings && this.settings.orientation.orientation) {
                case BulletChartOrientation.VerticalTop:
                case BulletChartOrientation.VerticalBottom:
                    return true;
                default:
                    return false;
            }
        }

        private get viewportScroll(): IViewport {
            return <IViewport>{
                width: Math.max(0, this.layout.viewportIn.width - BulletChart.ScrollBarSize),
                height: Math.max(0, this.layout.viewportIn.height - BulletChart.ScrollBarSize)
            };
        }

        private static getTextProperties(text: string, fontSize: number): TextProperties {
            return <TextProperties>{
                fontFamily: BulletChart.FontFamily,
                fontSize: PixelConverter.fromPoint(fontSize),
                text: text,
            };
        }

        // Convert a DataView into a view model
        public static converter(dataView: DataView, options: VisualUpdateOptions): BulletChartModel {
            let categorical = BulletChartColumns.getCategoricalColumns(dataView);

            if(!categorical || !categorical.Category || _.isEmpty(categorical.Category.values) || !categorical.Value || !categorical.Value[0]) {
                return null;
            }

            let categoricalValues = BulletChartColumns.getCategoricalValues(dataView);
            let settings = BulletChart.parseSettings(dataView);
            let properties = BulletChartSettings.getProperties(BulletChart.capabilities);

            let bulletModel: BulletChartModel = <BulletChartModel>{
                settings: settings,
                bars: [],
                barRects: [],
                valueRects: [],
                targetValues: [],
                viewportLength: 0
            };

            let verticalOrientation = settings.orientation.orientation === BulletChartOrientation.VerticalBottom
                || settings.orientation.orientation === BulletChartOrientation.VerticalTop;

            let reversedOrientation = settings.orientation.orientation === BulletChartOrientation.HorizontalRight
                || settings.orientation.orientation === BulletChartOrientation.VerticalBottom;

            bulletModel.labelHeight = (settings.labels.show || 0) && parseFloat(PixelConverter.fromPoint(settings.labels.fontSize));
            bulletModel.labelHeightTop = (settings.labels.show || 0) && parseFloat(PixelConverter.fromPoint(settings.labels.fontSize)) / 1.4;
            bulletModel.spaceRequiredForBarHorizontally = Math.max(60, bulletModel.labelHeight + 20);
            bulletModel.viewportLength = Math.max(0, (verticalOrientation
                ? (options.viewport.height - bulletModel.labelHeightTop - BulletChart.SubtitleMargin - 20 - BulletChart.YMarginVertical * 2)
                : (options.viewport.width - BulletChart.MaxLabelWidth - BulletChart.XMarginHorizontalLeft - BulletChart.XMarginHorizontalRight)) - BulletChart.ScrollBarSize);
            bulletModel.hasHighlights = !!(dataView.categorical.values.length > 0 && dataView.categorical.values[0].highlights);

            let valueFormatString =  valueFormatter.getFormatString(categorical.Value[0].source, properties.general.formatString);
            let categoryFormatString = valueFormatter.getFormatString(categorical.Category.source, properties.general.formatString);

            for (let idx = 0, length = categoricalValues.Category.length; idx < length; idx++) {
                let category = valueFormatter.format(categoricalValues.Category[idx], categoryFormatString);
                category = TextMeasurementService.getTailoredTextOrDefault(
                    BulletChart.getTextProperties(category, settings.labels.fontSize),
                    BulletChart.MaxLabelWidth);

                let toolTipItems = [];
                let value = categoricalValues.Value[idx] || 0;
                toolTipItems.push({ value: value, metadata: categorical.Value[0] });

                let targetValue: number = categoricalValues.TargetValue ? categoricalValues.TargetValue[idx] : settings.values.targetValue;
                if(_.isNumber(targetValue)) {
                    toolTipItems.push({ value: targetValue, metadata: categorical.TargetValue[0] });
                }

                let targetValue2: number = categoricalValues.TargetValue2 ? categoricalValues.TargetValue2[idx] : settings.values.targetValue2;
                if(_.isNumber(targetValue2)) {
                    toolTipItems.push({ value: targetValue2, metadata: categorical.TargetValue2[0] });
                }

                let getRangeValue = (cValues: number[], sValue: number) => cValues ? cValues[idx] :
                    (_.isNumber(targetValue) && _.isNumber(sValue) ? (sValue * targetValue / 100) : null);

                let minimum: number = getRangeValue(categoricalValues.Minimum, settings.values.minimumPercent);
                let needsImprovement: number = getRangeValue(categoricalValues.NeedsImprovement, settings.values.needsImprovementPercent);
                let satisfactory: number = getRangeValue(categoricalValues.Satisfactory, settings.values.satisfactoryPercent);
                let good: number = getRangeValue(categoricalValues.Good, settings.values.goodPercent);
                let veryGood: number = getRangeValue(categoricalValues.VeryGood, settings.values.veryGoodPercent);
                let maximum: number = getRangeValue(categoricalValues.Maximum, settings.values.maximumPercent);

                let anyRangeIsDefined: boolean = [needsImprovement, satisfactory, good, veryGood].some(_.isNumber);

                minimum = _.isNumber(minimum) ? Math.max(minimum, 0) : 0;
                needsImprovement = _.isNumber(needsImprovement) ? Math.max(minimum, needsImprovement) : needsImprovement;
                satisfactory = _.isNumber(satisfactory) ? Math.max(satisfactory, needsImprovement) : satisfactory;
                good = _.isNumber(good) ? Math.max(good, satisfactory) : good;
                veryGood = _.isNumber(veryGood) ? Math.max(veryGood, good) : veryGood;

                let minMaxValue = _.max([minimum, needsImprovement, satisfactory, good,  veryGood, value, targetValue, targetValue2].filter(_.isNumber));
                maximum = _.isNumber(maximum) ? Math.max(maximum, minMaxValue) : minMaxValue;

                veryGood = _.isNumber(veryGood) ? veryGood : maximum;
                good = _.isNumber(good) ? good : veryGood;
                satisfactory = _.isNumber(satisfactory) ? satisfactory : good;
                needsImprovement = _.isNumber(needsImprovement) ? needsImprovement : satisfactory;

                let scale = (d3.scale.linear()
                    .clamp(true)
                    .domain([minimum, maximum])
                    .range(verticalOrientation ? [bulletModel.viewportLength, 0] : [0, bulletModel.viewportLength]));

                let firstScale = scale(minimum);
                let secondScale = scale(needsImprovement);
                let thirdScale = scale(satisfactory);
                let fourthScale = scale(good);
                let fifthScale = scale(veryGood);
                let lastScale = scale(maximum);
                let valueScale = scale(value);

                let firstColor = settings.colors.minColor,
                    secondColor = settings.colors.needsImprovementColor,
                    thirdColor = settings.colors.satisfactoryColor,
                    fourthColor = settings.colors.goodColor,
                    lastColor = settings.colors.veryGoodColor;

                let highlight = categorical.Value[0].highlights && categorical.Value[0].highlights[idx] !== null;
                if(anyRangeIsDefined) {
                    BulletChart.addItemToBarArray(bulletModel.barRects, idx, firstScale, secondScale, firstColor, properties.general.formatString, toolTipItems, categorical.Category, idx, highlight);
                    BulletChart.addItemToBarArray(bulletModel.barRects, idx, secondScale, thirdScale, secondColor, properties.general.formatString, toolTipItems, categorical.Category, idx, highlight);
                    BulletChart.addItemToBarArray(bulletModel.barRects, idx, thirdScale, fourthScale, thirdColor, properties.general.formatString, toolTipItems, categorical.Category, idx, highlight);
                    BulletChart.addItemToBarArray(bulletModel.barRects, idx, fourthScale, fifthScale, fourthColor, properties.general.formatString, toolTipItems, categorical.Category, idx, highlight);
                    BulletChart.addItemToBarArray(bulletModel.barRects, idx, fifthScale, lastScale, lastColor, properties.general.formatString, toolTipItems, categorical.Category, idx, highlight);
                }

                BulletChart.addItemToBarArray(bulletModel.valueRects, idx, firstScale, valueScale, settings.colors.bulletColor, properties.general.formatString, toolTipItems, categorical.Category, idx, highlight);

                // markerValue
                bulletModel.targetValues.push({
                    barIndex: idx,
                    value: targetValue && scale(targetValue),
                    fill: settings.colors.bulletColor,
                    key: SelectionIdBuilder.builder()
                        .withCategory(categorical.Category, idx)
                        .withMeasure(scale(targetValue || 0).toString())
                        .createSelectionId().getKey(),
                    value2: targetValue2 && scale(targetValue2),
                });

                let xAxisProperties: IAxisProperties = null;
                if (settings.axis.axis) {
                    xAxisProperties = AxisHelper.createAxis({
                        pixelSpan: bulletModel.viewportLength,
                        dataDomain: scale.domain(),
                        metaDataColumn: categorical.Value[0].source,
                        formatString: valueFormatString,
                        outerPadding: 0,
                        isScalar: true,
                        isVertical: verticalOrientation,
                        isCategoryAxis: false,
                        scaleType: axisScale.linear,
                    });
                }

                let bar: BarData = {
                    scale: scale,
                    barIndex: idx,
                    categoryLabel: category,
                    x: verticalOrientation
                        ? (BulletChart.XMarginVertical + BulletChart.SpaceRequiredForBarVertically * idx)
                        : (reversedOrientation ? BulletChart.XMarginHorizontalRight : BulletChart.XMarginHorizontalLeft),
                    y: verticalOrientation
                        ? (BulletChart.YMarginVertical)
                        : (BulletChart.YMarginHorizontal + bulletModel.spaceRequiredForBarHorizontally * idx),
                    xAxisProperties: xAxisProperties,
                    key: SelectionIdBuilder.builder().withCategory(categorical.Category, idx).createSelectionId().getKey(),
                };

                bulletModel.bars.push(bar);
            }

            return bulletModel;
        }

        private static parseSettings(dataView: DataView): BulletChartSettings {
            var settings = BulletChartSettings.parse(dataView, BulletChart.capabilities);
            settings.values.minimumPercent = Math.max(settings.values.minimumPercent, 0);
            let minValue = settings.values.minimumPercent;

            settings.values.needsImprovementPercent = _.isNumber(settings.values.needsImprovementPercent)
                ? (minValue = Math.max(minValue, settings.values.needsImprovementPercent))
                : settings.values.needsImprovementPercent;

             settings.values.satisfactoryPercent = _.isNumber(settings.values.satisfactoryPercent)
                ? (minValue = Math.max(minValue, settings.values.satisfactoryPercent))
                : settings.values.satisfactoryPercent;

             settings.values.goodPercent = _.isNumber(settings.values.goodPercent)
                ? (minValue = Math.max(minValue, settings.values.goodPercent))
                : settings.values.goodPercent;

            settings.values.veryGoodPercent = _.isNumber(settings.values.veryGoodPercent)
                ? (minValue = Math.max(minValue, settings.values.veryGoodPercent))
                : settings.values.veryGoodPercent;

            settings.values.maximumPercent = _.isNumber(settings.values.maximumPercent)
                ? (minValue = Math.max(minValue, settings.values.maximumPercent, 100))
                : settings.values.maximumPercent;

            settings.createOriginalSettings();
            settings.axis.measureUnits = TextMeasurementService.getTailoredTextOrDefault(BulletChart.getTextProperties(
                settings.axis.measureUnits,
                BulletChart.DefaultSubtitleFontSizeInPt), BulletChart.MaxLabelWidth);
            return settings;
        }

        private static addItemToBarArray(
            collection: BarRect[],
            barIndex: number,
            start: number,
            end: number,
            fill: string,
            formatString: DataViewObjectPropertyIdentifier,
            tooltipInfo: any[],
            column: DataViewCategoryColumn,
            index: number,
            highlight: boolean): void {
            if (!isNaN(start) && !isNaN(end))
                collection.push({
                    barIndex: barIndex,
                    start: start,
                    end: end,
                    fill: fill,
                    tooltipInfo: TooltipBuilder.createTooltipInfo(formatString, null, null, null, null, tooltipInfo),
                    selected: false,
                    identity: SelectionIdBuilder.builder().withCategory(column, index).createSelectionId(),
                    key: SelectionIdBuilder.builder()
                        .withCategory(column, index)
                        .withMeasure(start + " " + end).createSelectionId().getKey(),
                    highlight: highlight,
                });
        }

        /* One time setup*/
        public init(options: VisualInitOptions): void {
            let body = d3.select(options.element.get(0));
            this.layout = new VisualLayout(options.viewport);
            this.hostService = options.host;

            this.bulletBody = body
                .append('div')
                .classed('bulletChart', true)
                .attr("drag-resize-disabled", true);

            this.scrollContainer = this.bulletBody.append('svg')
                .classed('bullet-scroll-region', true);
            this.clearCatcher = appendClearCatcher(this.scrollContainer);

            this.labelGraphicsContext = this.scrollContainer.append('g');
            this.bulletGraphicsContext = this.scrollContainer.append('g');

            this.behavior = new BulletWebBehavior();

            this.interactivityService = createInteractivityService(options.host);
        }

        /* Called for data, size, formatting changes*/
        public update(options: VisualUpdateOptions) {
            if (!options.dataViews || !options.dataViews[0]) {
                return;
            }

            let dataView = options.dataViews[0];
            this.layout.viewport = options.viewport;
            let data = BulletChart.converter(dataView, options);

            //TODO: Calculating the baseline delta of the text. needs to be removed once the TExtMeasurementService.estimateSVGTextBaselineDelta is available.
            this.ClearViewport();
            if (!data) {
                return;
            }

            this.data = data;

            this.baselineDelta = TextMeasurementHelper.estimateSvgTextBaselineDelta(BulletChart.getTextProperties("1", this.data.settings.labels.fontSize));

            if (this.interactivityService) {
                this.interactivityService.applySelectionStateToData(this.data.barRects);
            }

            this.bulletBody.style({
                'height': this.layout.viewportIn.height + 'px',
                'width': this.layout.viewportIn.width + 'px',
            });
            if (this.vertical) {
                this.scrollContainer.attr({
                    width: (this.data.bars.length * BulletChart.SpaceRequiredForBarVertically + BulletChart.XMarginVertical) + 'px',
                    height: this.viewportScroll.height + 'px'
                });
            }
            else {
                this.scrollContainer.attr({
                    height: (this.data.bars.length * (this.data.spaceRequiredForBarHorizontally || 0)) + 'px',
                    width: this.viewportScroll.width + 'px'
                });
            }

            if (this.vertical) {
                this.setUpBulletsVertically(this.bulletBody, this.data, this.reverse);
            } else {
                this.setUpBulletsHorizontally(this.bulletBody, this.data, this.reverse);
            }

            this.behavior.renderSelection(this.interactivityService.hasSelection());
        }

        private ClearViewport() {
            this.labelGraphicsContext.selectAll("text").remove();
            this.bulletGraphicsContext.selectAll("rect").remove();
            this.bulletGraphicsContext.selectAll("text").remove();
            this.bulletGraphicsContext.selectAll('axis').remove();
            this.bulletGraphicsContext.selectAll('path').remove();
            this.bulletGraphicsContext.selectAll('line').remove();
            this.bulletGraphicsContext.selectAll('tick').remove();
            this.bulletGraphicsContext.selectAll('g').remove();
        }

        public onClearSelection(): void {
            if (this.interactivityService)
                this.interactivityService.clearSelection();
        }

        private calculateLabelWidth(barData: BarData, bar?: BarRect, reversed?: boolean) {
            return (reversed
                ? BulletChart.XMarginHorizontalRight
                : barData.x + BulletChart.MaxLabelWidth + BulletChart.XMarginHorizontalLeft) 
                + (bar ? bar.start : 0);
        }

        private calculateLabelHeight(barData: BarData, bar?: BarRect, reversed?: boolean) {
            return BulletChart.YMarginVertical + (reversed ? 5 :
                barData.y + this.data.labelHeightTop + BulletChart.BarMargin + BulletChart.SubtitleMargin)
                + (bar ? bar.end : 0);
        }

        private setUpBulletsHorizontally(bulletBody: D3.Selection, model: BulletChartModel, reveresed: boolean) {
            let bars = model.bars;
            let rects = model.barRects;
            let valueRects = model.valueRects;
            let targetValues = model.targetValues;
            let barSelection = this.labelGraphicsContext.selectAll('text').data(bars, (d: BarData) => d.key);
            let rectSelection = this.bulletGraphicsContext.selectAll('rect.range').data(rects, (d: BarRect) => d.key);

            // Draw bullets
            let bullets = rectSelection.enter().append('rect').attr({
                'x': ((d: BarRect) => Math.max(0, this.calculateLabelWidth(bars[d.barIndex], d, reveresed))),
                'y': ((d: BarRect) => Math.max(0, bars[d.barIndex].y - BulletChart.BulletSize / 2)),
                'width': ((d: BarRect) => Math.max(0, d.end - d.start)),
                'height': BulletChart.BulletSize,
            }).classed('range', true).style({
                'fill': (d: BarRect) => d.fill
            });

            rectSelection.exit();

            // Draw value rects
            let valueSelection = this.bulletGraphicsContext.selectAll('rect.value').data(valueRects, (d: BarValueRect) => d.key);
            valueSelection.enter().append('rect').attr({
                'x': ((d: BarValueRect) => Math.max(0, this.calculateLabelWidth(bars[d.barIndex], d, reveresed))),
                'y': ((d: BarValueRect) => Math.max(0, bars[d.barIndex].y - BulletChart.BulletSize / 8)),
                'width': ((d: BarValueRect) => Math.max(0, d.end - d.start)),
                'height': BulletChart.BulletSize * 1 / 4,
            }).classed('value', true).style({
                'fill': (d: BarValueRect) => d.fill
            });

            valueSelection.exit();
            // Draw markers
            this.drawFirstTargets(targetValues,
                (d: TargetValue) => this.calculateLabelWidth(bars[d.barIndex], null, reveresed) + d.value,
                (d: TargetValue) => this.calculateLabelWidth(bars[d.barIndex], null, reveresed) + d.value,
                (d: TargetValue) => bars[d.barIndex].y - BulletChart.MarkerMarginHorizontal,
                (d: TargetValue) => bars[d.barIndex].y + BulletChart.MarkerMarginHorizontal);

            this.drawSecondTargets(
                    targetValues,
                    (d: TargetValue) => this.calculateLabelWidth(bars[d.barIndex], null, reveresed) + d.value2,
                    (d: TargetValue) => bars[d.barIndex].y);

            // Draw axes
            if (model.settings.axis.axis) {
                // Using var instead of let since you can't pass let parameters to functions inside loops.
                // needs to be changed to let when typescript 1.8 comes out.
                for (var idx = 0; idx < bars.length; idx++) {
                    let bar = bars[idx];
                    let barGroup = this.bulletGraphicsContext.append("g");

                    barGroup.append("g").attr({
                        'transform': () => {
                            let xLocation = this.calculateLabelWidth(bar, null, reveresed);
                            let yLocation = bar.y + BulletChart.BulletSize / 2;

                            return 'translate(' + xLocation + ',' + yLocation + ')';
                        },
                    }).classed("axis", true).call(bar.xAxisProperties.axis).style({
                        'fill': model.settings.axis.axisColor,
                        'font-size': PixelConverter.fromPoint(BulletChart.AxisFontSizeInPt)
                    }).selectAll('line').style({
                        'stroke': model.settings.axis.axisColor,
                    });

                    barGroup.selectAll(".tick text").call(
                        AxisHelper.LabelLayoutStrategy.clip,
                        bar.xAxisProperties.xLabelMaxWidth,
                        TextMeasurementService.svgEllipsis);
                }
            }

            // Draw Labels
            if (model.settings.labels.show) {
                barSelection.enter().append('text').classed("title", true).attr({
                    'x': ((d: BarData) => {
                        if (reveresed)
                            return BulletChart.XMarginHorizontalLeft + BulletChart.XMarginHorizontalRight + model.viewportLength;
                        return d.x;
                    }),
                    'y': ((d: BarData) => d.y + this.baselineDelta),
                    'fill': model.settings.labels.labelColor,
                    'font-size': PixelConverter.fromPoint(model.settings.labels.fontSize),
                }).text((d: BarData) => d.categoryLabel);
            }

            let measureUnitsText = TextMeasurementService.getTailoredTextOrDefault(
                BulletChart.getTextProperties(model.settings.axis.measureUnits, BulletChart.DefaultSubtitleFontSizeInPt),
                BulletChart.MaxMeasureUnitWidth);

            // Draw measure label
            if (model.settings.axis.measureUnits) {
                barSelection.enter().append('text').attr({
                    'x': ((d: BarData) => {
                        if (reveresed)
                            return BulletChart.XMarginHorizontalLeft + BulletChart.XMarginHorizontalRight + model.viewportLength + BulletChart.SubtitleMargin;
                        return d.x - BulletChart.SubtitleMargin;
                    }),
                    'y': ((d: BarData) => d.y + this.data.labelHeight / 2 + 12),
                    'fill': model.settings.axis.unitsColor,
                    'font-size': PixelConverter.fromPoint(BulletChart.DefaultSubtitleFontSizeInPt)
                }).text(measureUnitsText);
            }

            if (this.interactivityService) {
                let behaviorOptions: BulletBehaviorOptions = {
                    rects: bullets,
                    valueRects: valueSelection,
                    clearCatcher: this.clearCatcher,
                    interactivityService: this.interactivityService,
                    bulletChartSettings: this.data.settings,
                    hasHighlights: this.data.hasHighlights,
                };

                let targetCollection = this.data.barRects.concat(this.data.valueRects);
                this.interactivityService.bind(targetCollection, this.behavior, behaviorOptions);
            }

            barSelection.exit();
            TooltipManager.addTooltip(valueSelection, (tooltipEvent: TooltipEvent) => tooltipEvent.data.tooltipInfo, true);
            TooltipManager.addTooltip(rectSelection, (tooltipEvent: TooltipEvent) => tooltipEvent.data.tooltipInfo, true);
        }

        private setUpBulletsVertically(bulletBody: D3.Selection, model: BulletChartModel, reveresed: boolean) {
            let bars = model.bars;
            let rects = model.barRects;
            let valueRects = model.valueRects;
            let targetValues = model.targetValues;
            let barSelection = this.labelGraphicsContext.selectAll('text').data(bars, (d: BarData) => d.key);
            let rectSelection = this.bulletGraphicsContext.selectAll('rect.range').data(rects, (d: BarRect) => d.key);

            // Draw bullets
            let bullets = rectSelection.enter().append('rect').attr({
                'x': ((d: BarRect) => Math.max(0, bars[d.barIndex].x)),
                'y': ((d: BarRect) => Math.max(0, this.calculateLabelHeight(bars[d.barIndex], d, reveresed))),
                'height': ((d: BarRect) => Math.max(0, d.start - d.end)),
                'width': BulletChart.BulletSize,
            }).classed('range', true).style({
                'fill': (d: BarRect) => d.fill
            });

            rectSelection.exit();

            // Draw value rects
            let valueSelection = this.bulletGraphicsContext.selectAll('rect.value').data(valueRects, (d: BarValueRect) => d.key);
            valueSelection.enter().append('rect').attr({
                'x': ((d: BarValueRect) => Math.max(0, bars[d.barIndex].x + BulletChart.BulletSize / 3)),
                'y': ((d: BarValueRect) => Math.max(0, this.calculateLabelHeight(bars[d.barIndex], d, reveresed))),
                'height': ((d: BarValueRect) => Math.max(0, d.start - d.end)),
                'width': BulletChart.BulletSize * 1 / 4,
            }).classed('value', true).style({
                'fill': (d: BarValueRect) => d.fill
            });

            valueSelection.exit();

            // Draw markers
            this.drawFirstTargets(
                targetValues,
                (d: TargetValue) => bars[d.barIndex].x + BulletChart.MarkerMarginVertical,
                (d: TargetValue) => bars[d.barIndex].x + (BulletChart.MarkerMarginVertical * 3),
                (d: TargetValue) => this.calculateLabelHeight(bars[d.barIndex], null, reveresed) + d.value,
                (d: TargetValue) => this.calculateLabelHeight(bars[d.barIndex], null, reveresed) + d.value);

            this.drawSecondTargets(targetValues,
                    (d: TargetValue) => bars[d.barIndex].x + BulletChart.BulletSize / 3 + BulletChart.BulletSize / 8,
                    (d: TargetValue) => this.calculateLabelHeight(bars[d.barIndex], null, reveresed) + d.value2);

            // // Draw axes
            if (model.settings.axis.axis) {

                // Using var instead of let since you can't pass let parameters to functions inside loops.
                // needs to be changed to let when typescript 1.8 comes out.
                for (var idx = 0; idx < bars.length; idx++) {
                    var bar = bars[idx];
                    this.bulletGraphicsContext.append("g").attr({
                        'transform': () => {
                            let xLocation = bar.x;
                            let yLocation = this.calculateLabelHeight(bar, null, reveresed);
                            // let yLocation = bar.y + BulletChart.BulletSize / 2;
                            return 'translate(' + xLocation + ',' + yLocation + ')';
                        },
                    }).classed("axis", true).call(bar.xAxisProperties.axis).style({
                        'fill': model.settings.axis.axisColor,
                        'font-size': PixelConverter.fromPoint(BulletChart.AxisFontSizeInPt),
                    }).selectAll('line').style({
                        'stroke': model.settings.axis.axisColor,
                    });
                }

                this.bulletGraphicsContext.selectAll("g.axis > .tick text").call(
                    AxisHelper.LabelLayoutStrategy.clip,
                    BulletChart.XMarginVertical - 10,
                    TextMeasurementService.svgEllipsis);
            }

            let labelsStartPos = BulletChart.YMarginVertical + (reveresed ? model.viewportLength + 15 : 0) + this.data.labelHeightTop;

            // Draw Labels
            if (model.settings.labels.show) {
                barSelection.enter().append('text').classed("title", true).attr({
                    'x': ((d: BarData) => d.x),
                    'y': ((d: BarData) => {
                        return labelsStartPos;
                    }),
                    'fill': model.settings.labels.labelColor,
                    'font-size': PixelConverter.fromPoint(model.settings.labels.fontSize),
                }).text((d: BarData) => d.categoryLabel);
            }

            let measureUnitsText = TextMeasurementService.getTailoredTextOrDefault(
                BulletChart.getTextProperties(model.settings.axis.measureUnits, BulletChart.DefaultSubtitleFontSizeInPt),
                BulletChart.MaxMeasureUnitWidth);

            // Draw measure label
            if (model.settings.axis.measureUnits) {
                barSelection.enter().append('text').attr({
                    'x': ((d: BarData) => d.x + BulletChart.BulletSize),
                    'y': ((d: BarData) => {
                        return labelsStartPos + BulletChart.SubtitleMargin + 12;
                    }),
                    'fill': model.settings.axis.unitsColor,
                    'font-size': PixelConverter.fromPoint(BulletChart.DefaultSubtitleFontSizeInPt)
                }).text(measureUnitsText);
            }

            if (this.interactivityService) {
                let behaviorOptions: BulletBehaviorOptions = {
                    rects: bullets,
                    valueRects: valueSelection,
                    clearCatcher: this.clearCatcher,
                    interactivityService: this.interactivityService,
                    bulletChartSettings: this.data.settings,
                    hasHighlights: false,
                };

                let targetCollection = this.data.barRects.concat(this.data.valueRects);
                this.interactivityService.bind(targetCollection, this.behavior, behaviorOptions);
            }

            barSelection.exit();
            TooltipManager.addTooltip(valueSelection, (tooltipEvent: TooltipEvent) => tooltipEvent.data.tooltipInfo, true);
            TooltipManager.addTooltip(rectSelection, (tooltipEvent: TooltipEvent) => tooltipEvent.data.tooltipInfo, true);
        }

        private drawFirstTargets(
            targetValues: TargetValue[],
            x1: (d: TargetValue) => number,
            x2: (d: TargetValue) => number,
            y1: (d: TargetValue) => number,
            y2: (d: TargetValue) => number) {

            let selection = this.bulletGraphicsContext.selectAll('line.target').data(targetValues.filter(x => _.isNumber(x.value)));

            selection.enter().append('line').attr({
                'x1': x1,
                'x2': x2,
                'y1': y1,
                'y2': y2,
            }).style({
                'stroke': ((d: TargetValue) => d.fill),
                'stroke-width': 2,
            }).classed("target", true);

            selection.exit().remove();
        }

        private drawSecondTargets(
            targetValues: TargetValue[],
            getX: (d: TargetValue) => number,
            getY: (d: TargetValue) => number): void {

            let selection = this.bulletGraphicsContext
                .selectAll('line.target2')
                .data(targetValues.filter(x => _.isNumber(x.value2)));
            let enterSelection = selection.enter();

            let targetStyle = {
                'stroke': ((d: TargetValue) => d.fill),
                'stroke-width': 2
            };

            enterSelection.append('line').attr({
                'x1': ((d: TargetValue) => getX(d) - BulletChart.SecondTargetLineSize),
                'y1': ((d: TargetValue) => getY(d) - BulletChart.SecondTargetLineSize),
                'x2': ((d: TargetValue) => getX(d) + BulletChart.SecondTargetLineSize),
                'y2': ((d: TargetValue) => getY(d) + BulletChart.SecondTargetLineSize),
            }).style(targetStyle).classed("target2", true);
                
            enterSelection.append('line').attr({
                'x1': ((d: TargetValue) => getX(d) + BulletChart.SecondTargetLineSize),
                'y1': ((d: TargetValue) => getY(d) - BulletChart.SecondTargetLineSize),
                'x2': ((d: TargetValue) => getX(d) - BulletChart.SecondTargetLineSize),
                'y2': ((d: TargetValue) => getY(d) + BulletChart.SecondTargetLineSize),
            }).style(targetStyle).classed("target2", true);;

            selection.exit().remove();
        }

        /*About to remove your visual, do clean up here */
        public destroy() { }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions) {
            if (!this.settings) {
                return;
            }

            var enumeration = BulletChartSettings.enumerateObjectInstances(this.settings.originalSettings, options, BulletChart.capabilities);
            return enumeration.complete();
        }
    }

    //TODO: This module should be removed once TextMeasruementService exports the "estimateSvgTextBaselineDelta" function.
    export module TextMeasurementHelper {

        interface CanvasContext {
            font: string;
            measureText(text: string): { width: number };
        }

        interface CanvasElement extends HTMLElement {
            getContext(name: string);
        }

        let spanElement: JQuery;
        let svgTextElement: D3.Selection;
        let canvasCtx: CanvasContext;

        export function estimateSvgTextBaselineDelta(textProperties: TextProperties): number {
            let rect = estimateSvgTextRect(textProperties);
            return rect.y + rect.height;
        }

        function ensureDOM(): void {
            if (spanElement)
                return;

            spanElement = $('<span/>');
            $('body').append(spanElement);
            //The style hides the svg element from the canvas, preventing canvas from scrolling down to show svg black square.
            svgTextElement = d3.select($('body').get(0))
                .append('svg')
                .style({
                    'height': '0px',
                    'width': '0px',
                    'position': 'absolute'
                })
                .append('text');
            canvasCtx = (<CanvasElement>$('<canvas/>').get(0)).getContext("2d");
        }

        function measureSvgTextRect(textProperties: TextProperties): SVGRect {
            debug.assertValue(textProperties, 'textProperties');

            ensureDOM();

            svgTextElement.style(null);
            svgTextElement
                .text(textProperties.text)
                .attr({
                    'visibility': 'hidden',
                    'font-family': textProperties.fontFamily,
                    'font-size': textProperties.fontSize,
                    'font-weight': textProperties.fontWeight,
                    'font-style': textProperties.fontStyle,
                    'white-space': textProperties.whiteSpace || 'nowrap'
                });

            // We're expecting the browser to give a synchronous measurement here
            // We're using SVGTextElement because it works across all browsers 
            return svgTextElement.node<SVGTextElement>().getBBox();
        }

        function estimateSvgTextRect(textProperties: TextProperties): SVGRect {
            debug.assertValue(textProperties, 'textProperties');

            let estimatedTextProperties: TextProperties = {
                fontFamily: textProperties.fontFamily,
                fontSize: textProperties.fontSize,
                text: "M",
            };

            let rect = measureSvgTextRect(estimatedTextProperties);

            return rect;
        }
    }

    export interface BulletBehaviorOptions {
        rects: D3.Selection;
        valueRects: D3.Selection;
        clearCatcher: D3.Selection;
        interactivityService: IInteractivityService;
        bulletChartSettings: BulletChartSettings;
        hasHighlights: boolean;
    }

    export class BulletWebBehavior implements IInteractiveBehavior {
        private static DimmedOpacity: number = 0.4;
        private static DefaultOpacity: number = 1.0;

        private static getFillOpacity(selected: boolean, highlight: boolean, hasSelection: boolean, hasPartialHighlights: boolean): number {
            if ((hasPartialHighlights && !highlight) || (hasSelection && !selected))
                return BulletWebBehavior.DimmedOpacity;
            return BulletWebBehavior.DefaultOpacity;
        }

        private options: BulletBehaviorOptions;

        public bindEvents(options: BulletBehaviorOptions, selectionHandler: ISelectionHandler) {
            this.options = options;
            let clearCatcher = options.clearCatcher;

            options.valueRects.on('click', (d: BarValueRect) => {
                selectionHandler.handleSelection(d, d3.event.ctrlKey);
            });

            options.rects.on('click', (d: BarRect) => {
                selectionHandler.handleSelection(d, d3.event.ctrlKey);
            });

            clearCatcher.on('click', () => {
                selectionHandler.handleClearSelection();
            });
        }

        public renderSelection(hasSelection: boolean) {
            let options = this.options;
            let hasHighlights = options.hasHighlights;

            options.valueRects.style("opacity", (d: BarValueRect) =>
                BulletWebBehavior.getFillOpacity(d.selected, d.highlight, !d.highlight && hasSelection, !d.selected && hasHighlights));

            options.rects.style("opacity", (d: BarRect) =>
                BulletWebBehavior.getFillOpacity(d.selected, d.highlight, !d.highlight && hasSelection, !d.selected && hasHighlights));
        }
    }
}
