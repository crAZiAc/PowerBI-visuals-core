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
    import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;
    import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;
    import convertToPx = jsCommon.PixelConverter.toString;
    import convertToPt = jsCommon.PixelConverter.fromPoint;
    import fromPointToPixel = jsCommon.PixelConverter.fromPointToPixel;

    // powerbi
    import createEnumType = powerbi.createEnumType;
    import IEnumType = powerbi.IEnumType;
    import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
    import IVisual = powerbi.IVisual;
    import IVisualHostServices = powerbi.IVisualHostServices;
    import VisualUpdateOptions = powerbi.VisualUpdateOptions;
    import VisualCapabilities = powerbi.VisualCapabilities;
    import VisualInitOptions = powerbi.VisualInitOptions;
    import IViewport = powerbi.IViewport;
    import DataViewCategorical = powerbi.DataViewCategorical;
    import DataView = powerbi.DataView;
    import DataViewObjects = powerbi.DataViewObjects;
    import VisualObjectInstancesToPersist = powerbi.VisualObjectInstancesToPersist;
    import TextMeasurementService = powerbi.TextMeasurementService;
    import VisualObjectInstance = powerbi.VisualObjectInstance;
    import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
    import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
    import VisualDataRoleKind = powerbi.VisualDataRoleKind;
    import TextProperties = powerbi.TextProperties;

    // powerbi.data
    import SQColumnRefExpr = powerbi.data.SQColumnRefExpr;
    import SQConstantExpr = powerbi.data.SQConstantExpr;
    import SQExprBuilder = powerbi.data.SQExprBuilder;
    import SemanticFilter = powerbi.data.SemanticFilter;
    import SQHierarchyLevelExpr = powerbi.data.SQHierarchyLevelExpr;

    // powerbi.visuals
    import appendClearCatcher = powerbi.visuals.appendClearCatcher;
    import SVGUtil = powerbi.visuals.SVGUtil;
    import LabelFormattedTextOptions = powerbi.visuals.LabelFormattedTextOptions;
    import getLabelFormattedText = powerbi.visuals.dataLabelUtils.getLabelFormattedText;
    import ObjectEnumerationBuilder = powerbi.visuals.ObjectEnumerationBuilder;

    // powerbi.visuals.utility
    import SelectionManager = powerbi.visuals.utility.SelectionManager;

    export const Months: IEnumType = createEnumType([
        { value: 1, displayName: 'January' },
        { value: 2, displayName: 'February' },
        { value: 3, displayName: 'March' },
        { value: 4, displayName: 'April' },
        { value: 5, displayName: 'May' },
        { value: 6, displayName: 'June' },
        { value: 7, displayName: 'July' },
        { value: 8, displayName: 'August' },
        { value: 9, displayName: 'September' },
        { value: 10, displayName: 'October' },
        { value: 11, displayName: 'November' },
        { value: 12, displayName: 'December' }
    ]);

    export const WeekDays: IEnumType = createEnumType([
        { value: 0, displayName: 'Sunday' },
        { value: 1, displayName: 'Monday' },
        { value: 2, displayName: 'Tuesday' },
        { value: 3, displayName: 'Wednesday' },
        { value: 4, displayName: 'Thursday' },
        { value: 5, displayName: 'Friday' },
        { value: 6, displayName: 'Saturday' }
    ]);

    export const Granularities: IEnumType = createEnumType([
        { value: 0, displayName: 'Year' },
        { value: 1, displayName: 'Quarter' },
        { value: 2, displayName: 'Month' },
        { value: 3, displayName: 'Week' },
        { value: 4, displayName: 'Day' }
    ]);

    export enum GranularityType {
        year,
        quarter,
        month,
        week,
        day
    }

    export interface GranularityName {
        granularityType: GranularityType;
        name: string;
    }

    export interface TimelineMargins {
        LeftMargin: number;
        RightMargin: number;
        TopMargin: number;
        BottomMargin: number;
        CellWidth: number;
        CellHeight: number;
        StartXpoint: number;
        StartYpoint: number;
        ElementWidth: number;
        MinCellWidth: number;
        MaxCellHeight: number;
        PeriodSlicerRectWidth: number;
        PeriodSlicerRectHeight: number;
    }

    export interface DefaultTimelineProperties {
        DefaultLabelsShow: boolean;
        TimelineDefaultTextSize: number;
        TimelineDefaultCellColor: string;
        TimelineDefaultCellColorOut: string;
        TimelineDefaultTimeRangeShow: boolean;
        DefaultTimeRangeColor: string;
        DefaultLabelColor: string;
        DefaultScaleColor: string;
        DefaultSliderColor: string;
        DefaultGranularity: GranularityType;
        DefaultFirstMonth: number;
        DefaultFirstDay: number;
        DefaultFirstWeekDay: number;
    }

    export interface TimelineSelectors {
        TimelineVisual: ClassAndSelector;
        SelectionRangeContainer: ClassAndSelector;
        textLabel: ClassAndSelector;
        LowerTextCell: ClassAndSelector;
        UpperTextCell: ClassAndSelector;
        UpperTextArea: ClassAndSelector;
        LowerTextArea: ClassAndSelector;
        RangeTextArea: ClassAndSelector;
        CellsArea: ClassAndSelector;
        CursorsArea: ClassAndSelector;
        MainArea: ClassAndSelector;
        SelectionCursor: ClassAndSelector;
        Cell: ClassAndSelector;
        CellRect: ClassAndSelector;
        VertLine: ClassAndSelector;
        TimelineSlicer: ClassAndSelector;
        PeriodSlicerGranularities: ClassAndSelector;
        PeriodSlicerSelection: ClassAndSelector;
        PeriodSlicerSelectionRect: ClassAndSelector;
        PeriodSlicerRect: ClassAndSelector;
    }

    export interface TimelineLabel {
        title: string;
        text: string;
        id: number;
    }

    export interface ExtendedLabel {
        yearLabels?: TimelineLabel[];
        quarterLabels?: TimelineLabel[];
        monthLabels?: TimelineLabel[];
        weekLabels?: TimelineLabel[];
        dayLabels?: TimelineLabel[];
    }

    const SelectedCellColorProp: DataViewObjectPropertyIdentifier = {
        objectName: 'cells',
        propertyName: 'fillSelected'
    };

    const UnselectedCellColorProp: DataViewObjectPropertyIdentifier = {
        objectName: 'cells',
        propertyName: 'fillUnselected'
    };

    const GranularityProp: DataViewObjectPropertyIdentifier = {
        objectName: 'granularity',
        propertyName: 'granularity'
    };

    const ScaleColorProp: DataViewObjectPropertyIdentifier = {
        objectName: 'granularity',
        propertyName: 'scaleColor'
    };

    const SliderColorProp: DataViewObjectPropertyIdentifier = {
        objectName: 'granularity',
        propertyName: 'sliderColor'
    };
    const TimeRangeColorProp: DataViewObjectPropertyIdentifier = {
        objectName: 'rangeHeader',
        propertyName: 'fontColor'
    };

    const TimeRangeSizeProp: DataViewObjectPropertyIdentifier = {
        objectName: 'rangeHeader',
        propertyName: 'textSize'
    };

    const TimeRangeShowProp: DataViewObjectPropertyIdentifier = {
        objectName: 'rangeHeader',
        propertyName: 'show'
    };

    const LabelsColorProp: DataViewObjectPropertyIdentifier = {
        objectName: 'labels',
        propertyName: 'fontColor'
    };

    const LabelsSizeProp: DataViewObjectPropertyIdentifier = {
        objectName: 'labels',
        propertyName: 'textSize'
    };

    const LabelsShowProp: DataViewObjectPropertyIdentifier = {
        objectName: 'labels',
        propertyName: 'show'
    };

    const CalendarMonthProp: DataViewObjectPropertyIdentifier = {
        objectName: 'calendar',
        propertyName: 'month'
    };

    const CalendarDayProp: DataViewObjectPropertyIdentifier = {
        objectName: 'calendar',
        propertyName: 'day'
    };

    const WeekDayProp: DataViewObjectPropertyIdentifier = {
        objectName: 'weekDay',
        propertyName: 'day'
    };

    const GranularityNames: GranularityName[] = [
        {
            granularityType: GranularityType.year,
            name: "year"
        }, {
            granularityType: GranularityType.quarter,
            name: "quarter"
        }, {
            granularityType: GranularityType.month,
            name: "month"
        }, {
            granularityType: GranularityType.week,
            name: "week"
        }, {
            granularityType: GranularityType.day,
            name: "day"
        }
    ];

    export interface DatePeriod {
        identifierArray: (string | number)[];
        startDate: Date;
        endDate: Date;
        year: number;
        week: number[];
        fraction: number;
        index: number;
    }

    export interface Granularity {
        getType(): GranularityType;
        splitDate(date: Date): (string | number)[];
        getDatePeriods(): DatePeriod[];
        resetDatePeriods(): void;
        getExtendedLabel(): ExtendedLabel;
        setExtendedLabel(extendedLabel: ExtendedLabel): void;
        createLabels(granularity: Granularity): TimelineLabel[];
        sameLabel(firstDatePeriod: DatePeriod, secondDatePeriod: DatePeriod): boolean;
        generateLabel(datePeriod: DatePeriod): TimelineLabel;
        addDate(date: Date, identifierArray: (string | number)[]);
        setNewEndDate(date: Date): void;
        splitPeriod(index: number, newFraction: number, newDate: Date): void;
    }

    export interface TimelineCursorOverElement {
        index: number;
        datapoint: TimelineDatapoint;
    }

    export class TimelineGranularity {
        private datePeriods: DatePeriod[] = [];
        private extendedLabel: ExtendedLabel;

        /**
        * Returns the short month name of the given date (e.g. Jan, Feb, Mar)
        */
        public shortMonthName(date: Date): string {
            return date.toString().split(' ')[1];
        }

        public resetDatePeriods(): void {
            this.datePeriods = [];
        }

        public getDatePeriods() {
            return this.datePeriods;
        }

        public getExtendedLabel(): ExtendedLabel {
            return this.extendedLabel;
        }

        public setExtendedLabel(extendedLabel: ExtendedLabel): void {
            this.extendedLabel = extendedLabel;
        }

        public createLabels(granularity: Granularity): TimelineLabel[] {
            let labels: TimelineLabel[] = [],
                lastDatePeriod: DatePeriod;

            this.datePeriods.forEach((x) => {
                if (_.isEmpty(labels) || !granularity.sameLabel(x, lastDatePeriod)) {
                    lastDatePeriod = x;
                    labels.push(granularity.generateLabel(x));
                }
            });

            return labels;
        }

        /**
        * Adds the new date into the given datePeriods array
        * If the date corresponds to the last date period, given the current granularity,
        * it will be added to that date period. Otherwise, a new date period will be added to the array.
        * i.e. using Month granularity, Feb 2 2015 corresponds to Feb 3 2015.
        * It is assumed that the given date does not correspond to previous date periods, other than the last date period
        */
        public addDate(date: Date, identifierArray: (string | number)[]): void {
            let datePeriods: DatePeriod[] = this.getDatePeriods(),
                lastDatePeriod: DatePeriod = datePeriods[datePeriods.length - 1];

            if (datePeriods.length === 0 || !_.isEqual(lastDatePeriod.identifierArray, identifierArray)) {
                if (datePeriods.length > 0) {
                    lastDatePeriod.endDate = date;
                }

                datePeriods.push({
                    identifierArray: identifierArray,
                    startDate: date,
                    endDate: date,
                    week: this.determineWeek(date),
                    year: this.determineYear(date),
                    fraction: 1,
                    index: datePeriods.length
                });
            }
            else {
                lastDatePeriod.endDate = date;
            }
        }

        public setNewEndDate(date: Date): void {
            _.last(this.datePeriods).endDate = date;
        }

        /**
         * Splits a given period into two periods.
         * The new period is added after the index of the old one, while the old one is simply updated.
         * @param index The index of the date priod to be split
         * @param newFraction The fraction value of the new date period
         * @param newDate The date in which the date period is split
         */
        public splitPeriod(index: number, newFraction: number, newDate: Date): void {
            let oldDatePeriod: DatePeriod = this.datePeriods[index];

            oldDatePeriod.fraction -= newFraction;

            let newDateObject: DatePeriod = {
                identifierArray: oldDatePeriod.identifierArray,
                startDate: newDate,
                endDate: oldDatePeriod.endDate,
                week: this.determineWeek(newDate),
                year: this.determineYear(newDate),
                fraction: newFraction,
                index: oldDatePeriod.index + oldDatePeriod.fraction
            };

            oldDatePeriod.endDate = newDate;

            this.datePeriods.splice(index + 1, 0, newDateObject);
        }

        private previousMonth(month: number): number {
            return (month > 0) ? month - 1 : 11;
        }

        private nextMonth(month: number): number {
            return (month < 11) ? month + 1 : 0;
        }

        private countWeeks(startDate: Date, endDate: Date): number {
            let totalDays: number;

            if (endDate.getFullYear() === startDate.getFullYear()
                && endDate.getMonth() === startDate.getMonth()
                && endDate.getDate() >= startDate.getDate()
            ) {
                totalDays = endDate.getDate() - startDate.getDate();
            }
            else {
                totalDays = endDate.getDate() - 1;

                let lastMonth: number = this.nextMonth(startDate.getMonth()),
                    month: number = endDate.getMonth();

                while (month !== lastMonth) {
                    totalDays += new Date(endDate.getFullYear(), month, 0).getDate();
                    month = this.previousMonth(month);
                }

                totalDays += new Date(endDate.getFullYear(), lastMonth, 0).getDate() - startDate.getDate();
            }

            return 1 + Math.floor(totalDays / 7);
        }

        public determineWeek(date: Date): number[] {
            var year = date.getFullYear();

            if (this.inPreviousYear(date)) {
                year--;
            }

            let dateOfFirstWeek: Date = Timeline.calendar.getDateOfFirstWeek(year),
                weeks: number = this.countWeeks(dateOfFirstWeek, date);

            return [weeks, year];
        }

        private inPreviousYear(date: Date): boolean {
            let dateOfFirstWeek: Date = Timeline.calendar.getDateOfFirstWeek(date.getFullYear());
            return date < dateOfFirstWeek;
        }

        public determineYear(date: Date): number {
            let firstDay: Date = new Date(
                date.getFullYear(),
                Timeline.calendar.getFirstMonthOfYear(),
                Timeline.calendar.getFirstDayOfYear());

            return date.getFullYear() - ((firstDay <= date) ? 0 : 1);
        }
    }

    export class DayGranularity extends TimelineGranularity implements Granularity {
        public getType(): GranularityType {
            return GranularityType.day;
        }

        public splitDate(date: Date): (string | number)[] {
            return [
                this.shortMonthName(date),
                date.getDate(),
                date.getFullYear()
            ];
        }

        public sameLabel(firstDatePeriod: DatePeriod, secondDatePeriod: DatePeriod): boolean {
            return firstDatePeriod.startDate.getTime() === secondDatePeriod.startDate.getTime();
        }

        public generateLabel(datePeriod: DatePeriod): TimelineLabel {
            return {
                title: this.shortMonthName(datePeriod.startDate)
                    + ' '
                    + datePeriod.startDate.getDate()
                    + ' - '
                    + datePeriod.year,
                text: datePeriod.startDate.getDate().toString(),
                id: datePeriod.index
            };
        }
    }

    export class MonthGranularity extends TimelineGranularity implements Granularity {
        public getType(): GranularityType {
            return GranularityType.month;
        }

        public splitDate(date: Date): (string | number)[] {
            return [this.shortMonthName(date), date.getFullYear()];
        }

        public sameLabel(firstDatePeriod: DatePeriod, secondDatePeriod: DatePeriod): boolean {
            return this.shortMonthName(firstDatePeriod.startDate) === this.shortMonthName(secondDatePeriod.startDate);
        }

        public generateLabel(datePeriod: DatePeriod): TimelineLabel {
            let shortMonthName = this.shortMonthName(datePeriod.startDate);

            return {
                title: shortMonthName,
                text: shortMonthName,
                id: datePeriod.index
            };
        }
    }

    export class WeekGranularity extends TimelineGranularity implements Granularity {
        public getType(): GranularityType {
            return GranularityType.week;
        }

        public splitDate(date: Date): (string | number)[] {
            return this.determineWeek(date);
        }

        public sameLabel(firstDatePeriod: DatePeriod, secondDatePeriod: DatePeriod): boolean {
            return _.isEqual(firstDatePeriod.week, secondDatePeriod.week);
        }

        public generateLabel(datePeriod: DatePeriod): TimelineLabel {
            return {
                title: 'Week ' + datePeriod.week[0] + ' - ' + datePeriod.week[1],
                text: 'W' + datePeriod.week[0],
                id: datePeriod.index
            };
        }
    }

    export class QuarterGranularity extends TimelineGranularity implements Granularity {
        /**
         * Returns the date's quarter name (e.g. Q1, Q2, Q3, Q4)
         * @param date A date 
         */
        private quarterText(date: Date): string {
            let quarter: number = 3,
                year: number = date.getFullYear();

            while (date < Timeline.calendar.getQuarterStartDate(year, quarter))
                if (quarter > 0)
                    quarter--;
                else {
                    quarter = 3;
                    year--;
                }

            quarter++;

            return 'Q' + quarter;
        }

        public getType(): GranularityType {
            return GranularityType.quarter;
        }

        public splitDate(date: Date): (string | number)[] {
            return [this.quarterText(date), date.getFullYear()];
        }

        public sameLabel(firstDatePeriod: DatePeriod, secondDatePeriod: DatePeriod): boolean {
            return this.quarterText(firstDatePeriod.startDate) === this.quarterText(secondDatePeriod.startDate)
                && firstDatePeriod.year === secondDatePeriod.year;
        }

        public generateLabel(datePeriod: DatePeriod): TimelineLabel {
            let quarter: string = this.quarterText(datePeriod.startDate);

            return {
                title: quarter + ' ' + datePeriod.year,
                text: quarter,
                id: datePeriod.index
            };
        }
    }

    export class YearGranularity extends TimelineGranularity implements Granularity {
        public getType(): GranularityType {
            return GranularityType.year;
        }

        public splitDate(date: Date): (string | number)[] {
            return [date.getFullYear()];
        }

        public sameLabel(firstDatePeriod: DatePeriod, secondDatePeriod: DatePeriod): boolean {
            return firstDatePeriod.year === secondDatePeriod.year;
        }

        public generateLabel(datePeriod: DatePeriod): TimelineLabel {
            return {
                title: 'Year ' + datePeriod.year,
                text: datePeriod.year.toString(),
                id: datePeriod.index
            };
        }
    }

    export class TimelineGranularityData {
        private dates: Date[];
        private granularities: Granularity[];
        private endingDate: Date;

        /**
         * Returns the date of the previos day 
         * @param date The following date
         */
        public static previousDay(date: Date): Date {
            let prevDay: Date = new Date(date.getTime());

            prevDay.setDate(prevDay.getDate() - 1);

            return prevDay;
        }

        /**
         * Returns the date of the next day 
         * @param date The previous date
         */
        public static nextDay(date: Date): Date {
            let nextDay: Date = new Date(date.getTime());

            nextDay.setDate(nextDay.getDate() + 1);

            return nextDay;
        }

        /**
        * Returns an array of dates with all the days between the start date and the end date
        */
        private setDatesRange(startDate: Date, endDate: Date): void {
            let date: Date = startDate;

            this.dates = [];

            while (date <= endDate) {
                this.dates.push(date);
                date = TimelineGranularityData.nextDay(date);
            }
        }

        constructor(startDate: Date, endDate: Date) {
            this.granularities = [];
            this.setDatesRange(startDate, endDate);

            let lastDate: Date = this.dates[this.dates.length - 1];

            this.endingDate = TimelineGranularityData.nextDay(lastDate);
        }

        /**
         * Adds a new granularity to the array of granularities.
         * Resets the new granularity, adds all dates to it, and then edits the last date period with the ending date.
         * @param granularity The new granularity to be added
         */
        public addGranularity(granularity: Granularity): void {
            granularity.resetDatePeriods();

            for (let date of this.dates) {
                let identifierArray: (string | number)[] = granularity.splitDate(date);

                granularity.addDate(date, identifierArray);
            }

            granularity.setNewEndDate(this.endingDate);

            this.granularities.push(granularity);
        }

        /**
         * Returns a specific granularity from the array of granularities
         * @param index The index of the requested granularity
         */
        public getGranularity(index: number): Granularity {
            return this.granularities[index];
        }

        public createGranularities(): void {
            this.granularities = [];

            this.addGranularity(new YearGranularity());
            this.addGranularity(new QuarterGranularity());
            this.addGranularity(new MonthGranularity());
            this.addGranularity(new WeekGranularity());
            this.addGranularity(new DayGranularity());
        }

        public createLabels(): void {
            this.granularities.forEach((x) => {
                x.setExtendedLabel({
                    dayLabels: x.getType() >= GranularityType.day
                        ? x.createLabels(this.granularities[GranularityType.day])
                        : [],
                    weekLabels: x.getType() >= GranularityType.week
                        ? x.createLabels(this.granularities[GranularityType.week])
                        : [],
                    monthLabels: x.getType() >= GranularityType.month
                        ? x.createLabels(this.granularities[GranularityType.month])
                        : [],
                    quarterLabels: x.getType() >= GranularityType.quarter
                        ? x.createLabels(this.granularities[GranularityType.quarter])
                        : [],
                    yearLabels: x.getType() >= GranularityType.year
                        ? x.createLabels(this.granularities[GranularityType.year])
                        : [],
                });
            });
        }
    }

    export class Utils {
        public static isValueEmpty(value: any): boolean {
            return value === undefined || value === null || isNaN(value);
        }

        /**
         * Returns the date of the start of the selection
         * @param timelineData The TimelineData which contains all the date periods
         */
        public static getStartSelectionDate(timelineData: TimelineData): Date {
            return timelineData.currentGranularity.getDatePeriods()[timelineData.selectionStartIndex].startDate;
        }

        /**
         * Returns the date of the end of the selection
         * @param timelineData The TimelineData which contains all the date periods
         */
        public static getEndSelectionDate(timelineData: TimelineData): Date {
            return timelineData.currentGranularity.getDatePeriods()[timelineData.selectionEndIndex].endDate;
        }

        /**
         * Returns the date period of the end of the selection
         * @param timelineData The TimelineData which contains all the date periods
         */
        public static getEndSelectionPeriod(timelineData: TimelineData): DatePeriod {
            return timelineData.currentGranularity.getDatePeriods()[timelineData.selectionEndIndex];
        }

        /**
         * Returns the color of a cell, depending on whether its date period is between the selected date periods.
         * CellRects should be transparent filled by default if there isn't any color sets.
         * @param d The TimelineDataPoint of the cell
         * @param timelineData The TimelineData with the selected date periods
         * @param timelineFormat The TimelineFormat with the chosen colors
         */
        public static getCellColor(d: TimelineDatapoint, timelineData: TimelineData, cellFormat: CellFormat): string {
            let inSelectedPeriods: boolean = d.datePeriod.startDate >= Utils.getStartSelectionDate(timelineData)
                && d.datePeriod.endDate <= Utils.getEndSelectionDate(timelineData);

            return inSelectedPeriods
                ? cellFormat.colorInProperty
                : (cellFormat.colorOutProperty || 'transparent');
        }

        /**
         * Returns the granularity type of the given granularity name
         * @param granularityName The name of the granularity
         */
        public static getGranularityType(granularityName: string): GranularityType {
            let index: number = _.findIndex(GranularityNames, x => x.name === granularityName);
            return GranularityNames[index].granularityType;
        }

        /**
         * Returns the name of the granularity type
         * @param granularity The type of granularity
         */
        public static getGranularityName(granularity: GranularityType): string {
            let index: number = _.findIndex(GranularityNames, x => x.granularityType === granularity);
            return GranularityNames[index].name;
        }

        /**
         * Splits the date periods of the current granularity, in case the stard and end of the selection is in between a date period.
         * i.e. for a quarter granularity and a selection between Feb 6 and Dec 23, the date periods for Q1 and Q4 will be split accordingly
         * @param timelineData The TimelineData that contains the date periods
         * @param startDate The starting date of the selection
         * @param endDate The ending date of the selection
         */
        public static separateSelection(timelineData: TimelineData, startDate: Date, endDate: Date): void {
            let datePeriods: DatePeriod[] = timelineData.currentGranularity.getDatePeriods(),
                startDateIndex: number = _.findIndex(datePeriods, x => startDate < x.endDate),
                endDateIndex: number = _.findIndex(datePeriods, x => endDate <= x.endDate);

            timelineData.selectionStartIndex = startDateIndex;
            timelineData.selectionEndIndex = endDateIndex;

            let startRatio: number = Utils.getDateRatio(datePeriods[startDateIndex], startDate, true),
                endRatio: number = Utils.getDateRatio(datePeriods[endDateIndex], endDate, false);

            if (endRatio > 0) {
                timelineData.currentGranularity.splitPeriod(endDateIndex, endRatio, endDate);
            }

            if (startRatio > 0) {
                let startFration: number = datePeriods[startDateIndex].fraction - startRatio;

                timelineData.currentGranularity.splitPeriod(startDateIndex, startFration, startDate);

                timelineData.selectionStartIndex++;
                timelineData.selectionEndIndex++;
            }
        }

        /**
         * Returns the ratio of the given date compared to the whole date period.
         * The ratio is calculated either from the start or the end of the date period.
         * i.e. the ratio of Feb 7 2016 compared to the month of Feb 2016,
         * is 0.2142 from the start of the month, or 0.7857 from the end of the month.
         * @param datePeriod The date period that contain the specified date
         * @param date The date
         * @param fromStart Whether to calculater the ratio from the start of the date period.
         */
        public static getDateRatio(datePeriod: DatePeriod, date: Date, fromStart: boolean): number {
            let dateDifference: number = fromStart
                ? date.getTime() - datePeriod.startDate.getTime()
                : datePeriod.endDate.getTime() - date.getTime();

            let periodDifference: number = datePeriod.endDate.getTime() - datePeriod.startDate.getTime();

            return periodDifference === 0
                ? 0
                : dateDifference / periodDifference;
        }

        /**
        * Returns the time range text, depending on the given granularity (e.g. "Feb 3 2014 - Apr 5 2015", "Q1 2014 - Q2 2015")
        */
        public static timeRangeText(timelineData: TimelineData): string {
            let startSelectionDateArray: (string | number)[] = timelineData.currentGranularity
                .splitDate(Utils.getStartSelectionDate(timelineData));

            let endSelectionDateArray: (string | number)[] = timelineData.currentGranularity
                .splitDate(Utils.getEndSelectionPeriod(timelineData).startDate);

            return startSelectionDateArray.join(' ') + ' - ' + endSelectionDateArray.join(' ');
        }

        public static dateRangeText(datePeriod: DatePeriod): string {
            return datePeriod.startDate.toDateString()
                + ' - '
                + TimelineGranularityData.previousDay(datePeriod.endDate).toDateString();
        }

        /**
         * Combines the first two partial date periods, into a single date period.
         * Returns whether a partial date period was found.
         * i.e. combines "Feb 1 2016 - Feb 5 2016" with "Feb 5 2016 - Feb 29 2016" into "Feb 1 2016 - Feb 29 2016"
         * @param datePeriods The list of date periods
         */
        public static unseparateSelection(datePeriods: DatePeriod[]): boolean {
            let separationIndex: number = _.findIndex(datePeriods, x => x.fraction < 1);

            if (separationIndex >= 0) {
                datePeriods[separationIndex].endDate = datePeriods[separationIndex + 1].endDate;
                datePeriods[separationIndex].fraction += datePeriods[separationIndex + 1].fraction;

                datePeriods.splice(separationIndex + 1, 1);

                return true;
            }

            return false;
        }
    }

    export interface TimelineProperties {
        leftMargin: number;
        rightMargin: number;
        topMargin: number;
        bottomMargin: number;
        textYPosition: number;
        startXpoint: number;
        startYpoint: number;
        elementWidth: number;
        element: any;
        cellWidth: number;
        cellHeight: number;
        cellsYPosition: number;
    }

    export interface TimelineFormat {
        cellFormat?: CellFormat;
        rangeTextFormat?: LabelFormat;
        labelFormat?: LabelFormat;
        calendarFormat?: CalendarFormat;
        granularityFormat?: GranularityFormat;
    }

    export interface LabelFormat {
        showProperty: boolean;
        sizeProperty: number;
        colorProperty: string;
    }

    export interface CalendarFormat {
        firstMonthProperty: number;
        firstDayProperty: number;
        weekDayProperty: number;
    }

    export interface CellFormat {
        colorInProperty: string;
        colorOutProperty: string;
    }

    export interface GranularityFormat {
        scaleColorProperty: string;
        sliderColorProperty: string;
    }

    export interface TimelineData {
        dragging?: boolean;
        categorySourceName?: string;
        columnIdentity?: SQColumnRefExpr;
        timelineDatapoints?: TimelineDatapoint[];
        elementsCount?: number;
        selectionStartIndex?: number;
        selectionEndIndex?: number;
        cursorDataPoints?: CursorDatapoint[];
        currentGranularity?: Granularity;
    }

    export interface CursorDatapoint {
        x: number;
        cursorIndex: number;
        selectionIndex: number;
    }

    export interface TimelineDatapoint {
        index: number;
        datePeriod: DatePeriod;
    }

    export interface DateDictionary {
        [year: number]: Date;
    }

    export class Calendar {
        private firstDayOfWeek: number;
        private firstMonthOfYear: number;
        private firstDayOfYear: number;
        private dateOfFirstWeek: DateDictionary;
        private quarterFirstMonths: number[];

        public getFirstDayOfWeek(): number {
            return this.firstDayOfWeek;
        }

        public getFirstMonthOfYear(): number {
            return this.firstMonthOfYear;
        }

        public getFirstDayOfYear(): number {
            return this.firstDayOfYear;
        }

        public getQuarterStartDate(year: number, quarterIndex: number): Date {
            return new Date(year, this.quarterFirstMonths[quarterIndex], this.firstDayOfYear);
        }

        public isChanged(calendarFormat: CalendarFormat): boolean {
            return this.firstMonthOfYear !== (calendarFormat.firstMonthProperty - 1)
                || this.firstDayOfYear !== calendarFormat.firstDayProperty
                || this.firstDayOfWeek !== calendarFormat.weekDayProperty;
        }

        constructor(calendarFormat: CalendarFormat) {
            this.firstDayOfWeek = calendarFormat.weekDayProperty;
            this.firstMonthOfYear = calendarFormat.firstMonthProperty - 1;
            this.firstDayOfYear = calendarFormat.firstDayProperty;

            this.dateOfFirstWeek = {};

            this.quarterFirstMonths = [0, 3, 6, 9].map((x: number) => {
                return x + this.firstMonthOfYear;
            });
        }

        private calculateDateOfFirstWeek(year: number): Date {
            let date: Date = new Date(year, this.firstMonthOfYear, this.firstDayOfYear);

            while (date.getDay() !== this.firstDayOfWeek) {
                date = TimelineGranularityData.nextDay(date);
            }

            return date;
        }

        public getDateOfFirstWeek(year: number): Date {
            if (!this.dateOfFirstWeek[year]) {
                this.dateOfFirstWeek[year] = this.calculateDateOfFirstWeek(year);
            }

            return this.dateOfFirstWeek[year];
        }
    }

    export class Timeline implements IVisual {
        private static MinSizeOfViewport: number = 0;

        private datasetsChangedState: boolean = false;
        private timelineProperties: TimelineProperties;
        private timelineFormat: TimelineFormat;
        private timelineData: TimelineData;
        private timelineGranularityData: TimelineGranularityData;
        private hostServices: IVisualHostServices;

        private svg: D3.Selection;
        private timelineDiv: D3.Selection;
        private body: D3.Selection;
        private rangeText: D3.Selection;
        private mainGroupElement: D3.Selection;
        private yearLabelsElement: D3.Selection;
        private quarterLabelsElement: D3.Selection;
        private monthLabelsElement: D3.Selection;
        private weekLabelsElement: D3.Selection;
        private dayLabelsElement: D3.Selection;
        private cellsElement: D3.Selection;
        private cursorGroupElement: D3.Selection;
        private selectorContainer: D3.Selection;
        private options: VisualUpdateOptions;
        private periodSlicerRect: D3.Selection;
        private selectedText: D3.Selection;
        private vertLine: D3.Selection;
        private horizLine: D3.Selection;
        private textLabels: D3.Selection;

        private granularitySelectors: string[] = ['Y', 'Q', 'M', 'W', 'D'];

        private initialized: boolean;
        private selectionManager: SelectionManager;
        private clearCatcher: D3.Selection;
        private dataView: DataView;
        private valueType: string;
        private values: any[];
        private svgWidth: number;
        private newGranularity: GranularityType;
        public requiresNoUpdate: boolean = false;

        public static calendar: Calendar;

        public static capabilities: VisualCapabilities = {
            dataRoles: [{
                name: 'Time',
                kind: VisualDataRoleKind.Grouping,
                displayName: 'Time'
            }],
            dataViewMappings: [{
                conditions: [
                    { 'Time': { max: 1 } }
                ],
                categorical: {
                    categories: {
                        for: { in: 'Time' },
                        dataReductionAlgorithm: { sample: {} }
                    },
                    values: {
                        select:[{
                            bind: { to: 'Time' }
                        }]
                    },
                }
            }],
            objects: {
                general: {
                    displayName: 'General',
                    properties: {
                        formatString: {
                            type: {
                                formatting: {
                                    formatString: true
                                }
                            },
                        },
                        selected: {
                            type: { bool: true }
                        },
                        filter: {
                            type: { filter: {} },
                            rule: {
                                output: {
                                    property: 'selected',
                                    selector: ['Time'],
                                }
                            }
                        },
                    },
                },
                calendar: {
                    displayName: 'Fiscal Year Start',
                    properties: {
                        month: {
                            displayName: 'Month',
                            type: { enumeration: Months }
                        },
                        day: {
                            displayName: 'Day',
                            type: { numeric: true }
                        }
                    }
                },
                weekDay: {
                    displayName: 'First Day of Week',
                    properties: {
                        day: {
                            displayName: 'Day',
                            type: { enumeration: WeekDays }
                        }
                    }
                },
                rangeHeader: {
                    displayName: 'Range Header',
                    properties: {
                        show: {
                            displayName: 'Show',
                            type: { bool: true }
                        },
                        fontColor: {
                            displayName: 'Font color',
                            type: { fill: { solid: { color: true } } }
                        },
                        textSize: {
                            displayName: 'Text Size',
                            type: { numeric: true }
                        }
                    }
                },
                cells: {
                    displayName: 'Cells',
                    properties: {
                        fillSelected: {
                            displayName: 'Selected cell color',
                            type: { fill: { solid: { color: true } } }
                        },
                        fillUnselected: {
                            displayName: 'Unselected cell color',
                            type: { fill: { solid: { color: { nullable: true } } } }
                        }
                    }
                },
                granularity: {
                    displayName: 'Granularity',
                    properties: {
                        scaleColor: {
                            displayName: 'Scale color',
                            type: { fill: { solid: { color: true } } }
                        },
                        sliderColor: {
                            displayName: 'Slider color',
                            type: { fill: { solid: { color: true } } }
                        },
                        granularity: {
                            displayName: "Granularity",
                            type: { enumeration: Granularities }
                        }
                    }
                },
                labels: {
                    displayName: 'Labels',
                    properties: {
                        show: {
                            displayName: 'Show',
                            type: { bool: true }
                        },
                        fontColor: {
                            displayName: 'Font color',
                            type: { fill: { solid: { color: true } } }
                        },
                        textSize: {
                            displayName: 'Text Size',
                            type: { numeric: true }
                        }
                    }
                }
            }
        };

        private timelineMargins: TimelineMargins =
        {
            LeftMargin: 15,
            RightMargin: 15,
            TopMargin: 15,
            BottomMargin: 10,
            CellWidth: 40,
            CellHeight: 25,
            StartXpoint: 10,
            StartYpoint: 20,
            ElementWidth: 30,
            MinCellWidth: 30,
            MaxCellHeight: 60,
            PeriodSlicerRectWidth: 15,
            PeriodSlicerRectHeight: 23
        };

        private defaultTimelineProperties: DefaultTimelineProperties =
        {
            DefaultLabelsShow: true,
            TimelineDefaultTextSize: 9,
            TimelineDefaultCellColor: "#ADD8E6",
            TimelineDefaultCellColorOut: "", // transparent by default
            TimelineDefaultTimeRangeShow: true,
            DefaultTimeRangeColor: "#777777",
            DefaultLabelColor: "#777777",
            DefaultScaleColor: "#000000",
            DefaultSliderColor: "#AAAAAA",
            DefaultGranularity: GranularityType.month,
            DefaultFirstMonth: 1,
            DefaultFirstDay: 1,
            DefaultFirstWeekDay: 0
        };

        private timelineSelectors: TimelineSelectors =
        {
            TimelineVisual: createClassAndSelector('timeline'),
            SelectionRangeContainer: createClassAndSelector('selectionRangeContainer'),
            textLabel: createClassAndSelector('label'),
            LowerTextCell: createClassAndSelector('lowerTextCell'),
            UpperTextCell: createClassAndSelector('upperTextCell'),
            UpperTextArea: createClassAndSelector('upperTextArea'),
            LowerTextArea: createClassAndSelector('lowerTextArea'),
            RangeTextArea: createClassAndSelector('rangeTextArea'),
            CellsArea: createClassAndSelector('cellsArea'),
            CursorsArea: createClassAndSelector('cursorsArea'),
            MainArea: createClassAndSelector('mainArea'),
            SelectionCursor: createClassAndSelector('selectionCursor'),
            Cell: createClassAndSelector('cell'),
            CellRect: createClassAndSelector('cellRect'),
            VertLine: createClassAndSelector('timelineVertLine'),
            TimelineSlicer: createClassAndSelector('timelineSlicer'),
            PeriodSlicerGranularities: createClassAndSelector('periodSlicerGranularities'),
            PeriodSlicerSelection: createClassAndSelector('periodSlicerSelection'),
            PeriodSlicerSelectionRect: createClassAndSelector('periodSlicerSelectionRect'),
            PeriodSlicerRect: createClassAndSelector('periodSlicerRect')
        };

        public static getIndexByPosition(
            elements: number[],
            widthOfElement: number,
            position: number): number {

            elements = elements || [];

            let length: number = elements.length;

            if (!Utils.isValueEmpty(elements[0])
                && !Utils.isValueEmpty(elements[1])
                && position <= elements[1] * widthOfElement) {
    
                return 0;
            } else if (
                !Utils.isValueEmpty(elements[length - 1])
                && position >= elements[length - 1] * widthOfElement) {
                return length - 1;
            }

            for (var i: number = 1; i < length; i++) {
                var left: number = elements[i] * widthOfElement,
                    right: number = elements[i + 1] * widthOfElement;

                if (position >= left && position <= right) {
                    return i;
                }
            }

            return 0;
        }

        /**
         * Changes the current granularity depending on the given granularity type
         * Separates the new granularity's date periods which contain the start/end selection
         * Unseparates the date periods of the previous granularity.
         * @param granularity The new granularity type
         */
        public changeGranularity(granularity: GranularityType, startDate: Date, endDate: Date): void {
            if (Utils.unseparateSelection(this.timelineData.currentGranularity.getDatePeriods())) {
                Utils.unseparateSelection(this.timelineData.currentGranularity.getDatePeriods());
            }

            this.timelineData.currentGranularity = this.timelineGranularityData.getGranularity(granularity);
            Utils.separateSelection(this.timelineData, startDate, endDate);
        }

        public init(options: VisualInitOptions): void {
            let element: JQuery = options.element;

            this.hostServices = options.host;
            this.initialized = false;

            this.selectionManager = new SelectionManager({
                hostServices: options.host
            });

            this.timelineProperties = {
                element: element,
                textYPosition: 50,
                cellsYPosition: this.timelineMargins.TopMargin * 3 + 65,
                topMargin: this.timelineMargins.TopMargin,
                bottomMargin: this.timelineMargins.BottomMargin,
                leftMargin: this.timelineMargins.LeftMargin,
                startXpoint: this.timelineMargins.StartXpoint,
                startYpoint: this.timelineMargins.StartYpoint,
                cellWidth: this.timelineMargins.CellWidth,
                cellHeight: this.timelineMargins.CellHeight,
                elementWidth: this.timelineMargins.ElementWidth,
                rightMargin: this.timelineMargins.RightMargin
            };

            this.body = d3.select(element.get(0));

            this.timelineDiv = this.body.append('div');

            this.svg = this.timelineDiv
                .append('svg')
                .attr('width', convertToPx(options.viewport.width))
                .classed(this.timelineSelectors.TimelineVisual.class, true);

            this.addWrappElements();
        }

        private addWrappElements(): void {
            this.clearCatcher = appendClearCatcher(this.svg);

            this.clearCatcher.data([this])
                .on("click", (timeline: Timeline) => timeline.clear())
                .on("touchstart", (timeline: Timeline) => timeline.clear());

            this.rangeText = this.svg.append('g')
                .classed(this.timelineSelectors.RangeTextArea.class, true)
                .append('text');

            this.mainGroupElement = this.svg
                .append('g')
                .classed(this.timelineSelectors.MainArea.class, true);

            this.yearLabelsElement = this.mainGroupElement.append('g');
            this.quarterLabelsElement = this.mainGroupElement.append('g');
            this.monthLabelsElement = this.mainGroupElement.append('g');
            this.weekLabelsElement = this.mainGroupElement.append('g');
            this.dayLabelsElement = this.mainGroupElement.append('g');

            this.cellsElement = this.mainGroupElement
                .append('g')
                .classed(this.timelineSelectors.CellsArea.class, true);

            this.cursorGroupElement = this.svg
                .append('g')
                .classed(this.timelineSelectors.CursorsArea.class, true);
        }

        private clear(): void {
            if (this.initialized) {
                this.selectionManager.clear();

                if (this.timelineData) {
                    this.timelineData.selectionStartIndex = 0;

                    this.timelineData.selectionEndIndex =
                        this.timelineData.currentGranularity.getDatePeriods().length - 1;

                    if (_.any(this.timelineData.timelineDatapoints, (x) => x.index % 1 !== 0)) {
                        this.selectPeriod(this.timelineData.currentGranularity.getType());
                    }
                    else {
                        Timeline.updateCursors(this.timelineData, this.timelineProperties.cellWidth);

                        this.fillCells(this.timelineFormat.cellFormat);

                        this.renderCursors(
                            this.timelineData,
                            this.timelineFormat,
                            this.timelineProperties.cellHeight,
                            this.timelineProperties.cellsYPosition);

                        this.renderTimeRangeText(this.timelineData, this.timelineFormat.rangeTextFormat);
                        this.fillColorGranularity(this.timelineFormat.granularityFormat);
                    }

                    this.setSelection(this.timelineData);
                }
            }
        }

        private drawGranular(timelineProperties: TimelineProperties, type: GranularityType): void {
            let startXpoint: number = timelineProperties.startXpoint,
                startYpoint: number = timelineProperties.startYpoint,
                elementWidth: number = timelineProperties.elementWidth,
                selectorPeriods: string[] = this.granularitySelectors;

            this.selectorContainer = this.svg
                .append('g')
                .classed(this.timelineSelectors.TimelineSlicer.class, true);

            let dragPeriodRect: D3.Behavior.Drag = d3.behavior.drag()
                .on("drag", () => {
                    this.selectPeriod(this.getGranularityIndexByPosition(d3.event.x));
                });

            this.selectorContainer.call(dragPeriodRect);

            // create horiz. line
            this.horizLine = this.selectorContainer.append('rect');

            this.horizLine.attr({
                x: convertToPx(startXpoint),
                y: convertToPx(startYpoint + 2),
                height: convertToPx(1),
                width: convertToPx((selectorPeriods.length - 1) * elementWidth)
            });

            // create vert. lines
            this.vertLine = this.selectorContainer
                .selectAll("vertLines")
                .data(selectorPeriods)
                .enter()
                .append('rect');

            this.vertLine
                .classed(this.timelineSelectors.VertLine.class, true)
                .attr({
                    x: (d, index) => convertToPx(startXpoint + index * elementWidth),
                    y: convertToPx(startYpoint),
                    width: convertToPx(2),
                    height: convertToPx(3)
                });

            // create text lables
            let text = this.selectorContainer
                .selectAll(this.timelineSelectors.PeriodSlicerGranularities.selector)
                .data(selectorPeriods)
                .enter()
                .append("text")
                .classed(this.timelineSelectors.PeriodSlicerGranularities.class, true);

            this.textLabels = text
                .text((value: string) => value)
                .attr({
                    x: (d, index) => convertToPx(startXpoint - 3 + index * elementWidth),
                    y: convertToPx(startYpoint - 3),
                    dx: "0.5em"
                });

            // create selected period text
            this.selectedText = this.selectorContainer
                .append("text")
                .classed(this.timelineSelectors.PeriodSlicerSelection.class, true);

            this.selectedText
                .text(Utils.getGranularityName(type))
                .attr({
                    x: convertToPx(startXpoint + 2 * elementWidth),
                    y: convertToPx(startYpoint + 17),
                });

            let selRects = this.selectorContainer
                .selectAll(this.timelineSelectors.PeriodSlicerSelectionRect.selector)
                .data(selectorPeriods)
                .enter()
                .append('rect')
                .classed(this.timelineSelectors.PeriodSlicerSelectionRect.class, true);

            let clickHandler = (d: any, index: number) => {
                this.selectPeriod(index);
            };

            selRects
                .attr({
                    x: (d, index) => convertToPx(startXpoint - elementWidth / 2 + index * elementWidth),
                    y: convertToPx(3),
                    width: convertToPx(elementWidth),
                    height: convertToPx(23)
                })
                .on('mousedown', clickHandler)
                .on('touchstart', clickHandler);

            this.periodSlicerRect = this.selectorContainer
                .append('rect')
                .classed(this.timelineSelectors.PeriodSlicerRect.class, true)
                .attr({
                    y: convertToPx(timelineProperties.startYpoint - 16),
                    rx: convertToPx(4),
                    width: convertToPx(15),
                    height: convertToPx(23)
                });

            this.setPeriodSlicerRectPosition(type);
        }

        public getGranularityIndexByPosition(position: number): number {
            let selectorIndexes: number[] = this.granularitySelectors.map((selector: string, index: number) => {
                return index;
            });

            return Timeline.getIndexByPosition(
                selectorIndexes,
                this.timelineProperties.elementWidth,
                position);
        }

        public setPeriodSlicerRectPosition(granularity: GranularityType): boolean {
            if (this.periodSlicerRect.datum() === granularity) {
                return false;
            }

            this.periodSlicerRect.data([granularity]);

            this.periodSlicerRect
                .transition()
                .attr({
                    x: convertToPx(
                        this.timelineProperties.startXpoint
                        - 6
                        + granularity
                        * this.timelineProperties.elementWidth)
                });

            this.selectedText.text(Utils.getGranularityName(granularity));

            return true;
        }

        public fillColorGranularity(granularityFormat: GranularityFormat): void {
            this.periodSlicerRect.style("stroke", granularityFormat.sliderColorProperty);
            this.selectedText.attr('fill', granularityFormat.scaleColorProperty);
            this.textLabels.attr('fill', granularityFormat.scaleColorProperty);
            this.vertLine.attr('fill', granularityFormat.scaleColorProperty);
            this.horizLine.attr('fill', granularityFormat.scaleColorProperty);
        }

        public redrawPeriod(granularity: GranularityType): void {
            if (this.setPeriodSlicerRectPosition(granularity)) {
                let startDate: Date = Utils.getStartSelectionDate(this.timelineData);
                let endDate: Date = Utils.getEndSelectionDate(this.timelineData);
                this.changeGranularity(granularity, startDate, endDate);
            }
        }

        private static setMeasures(
            labelFormat: LabelFormat,
            granularityType: GranularityType,
            datePeriodsCount: number,
            viewport: IViewport,
            timelineProperties: TimelineProperties,
            timelineMargins: TimelineMargins) {

            timelineProperties.cellsYPosition = timelineProperties.textYPosition;

            let labelSize = fromPointToPixel(labelFormat.sizeProperty);

            if (labelFormat.showProperty) {
                timelineProperties.cellsYPosition += labelSize * 1.5 * (granularityType + 1);
            }

            let svgHeight = Math.max(0, viewport.height - timelineMargins.TopMargin),
                maxHeight = viewport.width - timelineMargins.RightMargin - timelineMargins.MinCellWidth * datePeriodsCount,
                height = Math.max(
                    timelineMargins.MinCellWidth,
                    Math.min(timelineMargins.MaxCellHeight, maxHeight, svgHeight - timelineProperties.cellsYPosition - 20)),
                width = Math.max(
                    timelineMargins.MinCellWidth,
                    (viewport.width - height - timelineMargins.RightMargin) / datePeriodsCount);

            timelineProperties.cellHeight = height;
            timelineProperties.cellWidth = width;
        }

        private visualChangeOnly(options: VisualUpdateOptions): boolean {
            if (options
                && options.dataViews
                && options.dataViews[0]
                && options.dataViews[0].metadata
                && this.options
                && this.options.dataViews
                && this.options.dataViews[0]
                && this.options.dataViews[0].metadata) {

                let newObjects = options.dataViews[0].metadata.objects,
                    oldObjects = this.options.dataViews[0].metadata.objects,
                    properties = ['rangeHeader', 'cells', 'labels', 'granularity'],
                    metadataChanged = !properties.every((x) => {
                        return _.isEqual(
                            newObjects
                                ? newObjects[x]
                                : undefined,
                            oldObjects
                                ? oldObjects[x]
                                : undefined);
                    });

                return options.suppressAnimations || metadataChanged;
            }
            return false;
        }

        /**
         * Note: Public for testability.
         */
        public datasetsChanged(options: VisualUpdateOptions): boolean {
            if (options
                && options.dataViews
                && options.dataViews[0]
                && options.dataViews[0].categorical
                && options.dataViews[0].categorical.categories
                && options.dataViews[0].categorical.categories[0]
                && options.dataViews[0].categorical.categories[0].source
                && this.options
                && this.options.dataViews
                && this.options.dataViews[0]
                && this.options.dataViews[0].categorical
                && this.options.dataViews[0].categorical.categories
                && this.options.dataViews[0].categorical.categories[0]
                && this.options.dataViews[0].categorical.categories[0].source) {

                var newObjects: string = options.dataViews[0].categorical.categories[0].source.displayName,
                    oldObjects: string = this.options.dataViews[0].categorical.categories[0].source.displayName;

                if (!_.isEqual(newObjects, oldObjects)) {
                    return true;
                }
            }

            return false;
        }

        private unavailableType(dataViewCategorical: DataViewCategorical): boolean {
            return !dataViewCategorical.categories
                || dataViewCategorical.categories.length !== 1
                || !dataViewCategorical.categories[0].values
                || dataViewCategorical.categories[0].values.length === 0
                || !dataViewCategorical.categories[0].source
                || !dataViewCategorical.categories[0].source.type;
        }

        private createTimelineOptions(dataView: DataView): boolean {
            this.dataView = dataView;

            if (!dataView.categorical
                || !dataView.metadata
                || this.unavailableType(dataView.categorical)) {

                return false;
            }

            let columnExp: SQHierarchyLevelExpr = <SQHierarchyLevelExpr>dataView.categorical.categories[0].source.expr;

            this.valueType = columnExp
                ? columnExp.level
                : null;

            if (!(dataView.categorical.categories[0].source.type.dateTime
                || (dataView.categorical.categories[0].source.type.numeric
                    && (this.valueType === 'Year' || this.valueType === 'Date')))) {
                return false;
            }

            this.values = this.prepareDates(
                this.dataView.categorical.categories[0].values,
                this.valueType);

            return true;
        }

        /**
         * Public for testability.
         */
        public prepareDates(values: any[], valueType?: string): Date[] {
            let dates: Date[] = [];

            values.forEach((value: any) => {
                if (!value) {
                    return;
                }

                let typeOfValue: string = typeof value;

                if (typeOfValue === "string" || typeOfValue === "number") {
                    let date: Date;

                    if (valueType === "Year") {
                        date = new Date(value, 0);
                    } else {
                        date = new Date(value);
                    }

                    if (date && date.toString() !== "Invalid Date") {
                        dates.push(date);
                    }
                } else if (_.isDate(value)) {
                    dates.push(value);
                }
            });

            return dates;
        }

        private createTimelineData(dataView: DataView) {
            let startDate: Date,
                endDate: Date;

            startDate = _.min(this.values);
            endDate = _.max(this.values);

            this.timelineFormat = Timeline.fillTimelineFormat(
                this.options.dataViews[0].metadata.objects,
                this.defaultTimelineProperties);

            if (!this.initialized) {
                this.drawGranular(this.timelineProperties, this.newGranularity);
                this.fillColorGranularity(this.timelineFormat.granularityFormat);
            }

            if (this.initialized) {
                let actualEndDate = TimelineGranularityData.nextDay(endDate),
                    daysPeriods = this.timelineGranularityData
                        .getGranularity(GranularityType.day)
                        .getDatePeriods(),
                    prevStartDate = daysPeriods[0].startDate,
                    prevEndDate = daysPeriods[daysPeriods.length - 1].endDate;

                let changedSelection =
                    startDate.getTime() >= prevStartDate.getTime()
                    &&
                    actualEndDate.getTime() <= prevEndDate.getTime();

                if (changedSelection) {
                    this.changeGranularity(this.newGranularity, startDate, actualEndDate);
                }
                else {
                    if (actualEndDate < prevEndDate)
                        endDate = daysPeriods[daysPeriods.length - 1].startDate;
                    if (startDate > prevStartDate)
                        startDate = prevStartDate;
                    this.initialized = false;
                }
            }

            if (!this.initialized) {
                this.timelineGranularityData = new TimelineGranularityData(startDate, endDate);

                this.timelineData = {
                    elementsCount: 0,
                    timelineDatapoints: [],
                    cursorDataPoints: new Array<CursorDatapoint>()
                };
            }
        }

        public update(options: VisualUpdateOptions): void {
            let visualChange: boolean = this.visualChangeOnly(options);

            this.datasetsChangedState = this.datasetsChanged(options);

            this.requiresNoUpdate = this.requiresNoUpdate && !this.datasetsChangedState && !visualChange;

            if (this.requiresNoUpdate) {
                this.requiresNoUpdate = false;
                return;
            }

            this.options = options;

            if (!options.dataViews || !options.dataViews[0]) {
                return;
            }

            let validOptions: boolean = this.createTimelineOptions(options.dataViews[0]);

            if (!validOptions) {
                this.clearData();
                return;
            }

            this.newGranularity = DataViewObjects.getValue(
                options.dataViews[0].metadata.objects,
                GranularityProp,
                this.defaultTimelineProperties.DefaultGranularity);

            if (!visualChange) {
                this.createTimelineData(options.dataViews[0]);
            }

            if (this.initialized) {
                this.redrawPeriod(this.newGranularity);
            }

            this.timelineFormat = Timeline.converter(
                this.timelineData,
                this.timelineProperties,
                this.defaultTimelineProperties,
                this.timelineGranularityData,
                options.dataViews[0],
                this.initialized,
                this.newGranularity,
                options.viewport,
                this.timelineMargins);

            this.render(this.timelineData, this.timelineFormat, this.timelineProperties, options);

            this.initialized = true;
        }

        private selectPeriod(periodNameIndex: GranularityType): void {
            if (this.timelineData.currentGranularity.getType() !== periodNameIndex) {
                this.hostServices.persistProperties(<VisualObjectInstancesToPersist>{
                    merge: [{
                        objectName: "granularity",
                        selector: null,
                        properties: { granularity: periodNameIndex }
                    }]
                });
            }

            this.redrawPeriod(periodNameIndex);

            this.timelineFormat = Timeline.converter(
                this.timelineData,
                this.timelineProperties,
                this.defaultTimelineProperties,
                this.timelineGranularityData,
                this.options.dataViews[0],
                this.initialized,
                this.timelineData.currentGranularity.getType(),
                this.options.viewport,
                this.timelineMargins);

            this.render(this.timelineData, this.timelineFormat, this.timelineProperties, this.options);
        }

        private static isDataNotMatch(dataView): boolean {
            if (dataView.categorical.categories.length <= 0 ||
                dataView.categorical.categories[0] === undefined ||
                dataView.categorical.categories[0].identityFields === undefined ||
                dataView.categorical.categories[0].identityFields.length <= 0) {

                return true;
            }

            return false;
        }

        public static converter(
            timelineData: TimelineData,
            timelineProperties: TimelineProperties,
            defaultTimelineProperties: DefaultTimelineProperties,
            timelineGranularityData: TimelineGranularityData,
            dataView: DataView,
            initialized: boolean,
            granularityType: GranularityType,
            viewport: IViewport,
            timelineMargins: TimelineMargins): TimelineFormat {

            let timelineFormat = Timeline.fillTimelineFormat(dataView.metadata.objects, defaultTimelineProperties);

            if (!initialized) {
                timelineData.cursorDataPoints.push({ x: 0, selectionIndex: 0, cursorIndex: 0 });
                timelineData.cursorDataPoints.push({ x: 0, selectionIndex: 0, cursorIndex: 1 });
            }

            if (!initialized || Timeline.calendar.isChanged(timelineFormat.calendarFormat)) {
                Timeline.calendar = new Calendar(timelineFormat.calendarFormat);

                timelineGranularityData.createGranularities();
                timelineGranularityData.createLabels();
                timelineData.currentGranularity = timelineGranularityData.getGranularity(granularityType);
                timelineData.selectionStartIndex = 0;
                timelineData.selectionEndIndex = timelineData.currentGranularity.getDatePeriods().length - 1;
            }

            timelineData.categorySourceName = dataView.categorical.categories[0].source.displayName;
            timelineData.columnIdentity = <SQColumnRefExpr>dataView.categorical.categories[0].identityFields[0];

            if (dataView.categorical.categories[0].source.type.numeric) {
                timelineData.columnIdentity.ref = "Date";
            }

            if (this.isDataNotMatch(dataView)) {
                return;
            }

            let timelineElements: DatePeriod[] = timelineData.currentGranularity.getDatePeriods();

            timelineData.elementsCount = timelineElements.length;
            timelineData.timelineDatapoints = [];

            for (let currentTimePeriod of timelineElements) {
                let datapoint: TimelineDatapoint = {
                    index: currentTimePeriod.index,
                    datePeriod: currentTimePeriod
                };

                timelineData.timelineDatapoints.push(datapoint);
            }

            let countFullCells = timelineData.currentGranularity
                .getDatePeriods()
                .filter((x: DatePeriod) => {
                    return x.index % 1 === 0;
                })
                .length;

            Timeline.setMeasures(
                timelineFormat.labelFormat,
                timelineData.currentGranularity.getType(),
                countFullCells,
                viewport,
                timelineProperties,
                timelineMargins);

            Timeline.updateCursors(timelineData, timelineProperties.cellWidth);

            return timelineFormat;
        }

        private render(
            timelineData: TimelineData,
            timelineFormat: TimelineFormat,
            timelineProperties: TimelineProperties,
            options: VisualUpdateOptions): void {

            let timelineDatapointsCount = this.timelineData.timelineDatapoints
                .filter((x) => {
                    return x.index % 1 === 0;
                })
                .length;

            this.svgWidth = 1
                + this.timelineProperties.cellHeight
                + timelineProperties.cellWidth * timelineDatapointsCount;

            this.renderTimeRangeText(timelineData, timelineFormat.rangeTextFormat);
            this.fillColorGranularity(this.timelineFormat.granularityFormat);

            this.timelineDiv
                .attr({
                    height: convertToPx(options.viewport.height),
                    width: convertToPx(options.viewport.width),
                    'drag-resize-disabled': true
                })
                .style({
                    'overflow-x': 'auto',
                    'overflow-y': 'auto'
                });

            this.svg.attr({
                height: convertToPx(Math.max(
                    Timeline.MinSizeOfViewport,
                    options.viewport.height - this.timelineMargins.TopMargin)),
                width: convertToPx(Math.max(
                    Timeline.MinSizeOfViewport,
                    this.svgWidth))
            });

            let fixedTranslateString: string = SVGUtil.translate(
                timelineProperties.leftMargin,
                timelineProperties.topMargin);

            let translateString: string = SVGUtil.translate(
                timelineProperties.cellHeight / 2,
                timelineProperties.topMargin);

            this.mainGroupElement.attr('transform', translateString);
            this.selectorContainer.attr('transform', fixedTranslateString);
            this.cursorGroupElement.attr('transform', translateString);

            let extendedLabels = this.timelineData.currentGranularity.getExtendedLabel(),
                granularityType = this.timelineData.currentGranularity.getType();

            let yPos: number = 0,
                yDiff: number = 1.50;

            this.renderLabels(extendedLabels.yearLabels, this.yearLabelsElement, yPos, granularityType === 0);

            yPos += yDiff;

            this.renderLabels(extendedLabels.quarterLabels, this.quarterLabelsElement, yPos, granularityType === 1);

            yPos += yDiff;

            this.renderLabels(extendedLabels.monthLabels, this.monthLabelsElement, yPos, granularityType === 2);

            yPos += yDiff;

            this.renderLabels(extendedLabels.weekLabels, this.weekLabelsElement, yPos, granularityType === 3);

            yPos += yDiff;

            this.renderLabels(extendedLabels.dayLabels, this.dayLabelsElement, yPos, granularityType === 4);
            this.renderCells(timelineData, timelineFormat, timelineProperties, options.suppressAnimations);

            this.renderCursors(
                timelineData,
                timelineFormat,
                timelineProperties.cellHeight,
                timelineProperties.cellsYPosition);
        }

        private renderLabels(
            labels: TimelineLabel[],
            labelsElement: D3.Selection,
            index: number,
            isLast: boolean): void {

            let labelTextSelection: D3.Selection = labelsElement.selectAll(this.timelineSelectors.textLabel.selector);

            if (!this.timelineFormat.labelFormat.showProperty) {
                labelTextSelection.remove();

                return;
            }

            let labelsGroupSelection: D3.UpdateSelection = labelTextSelection.data(labels);

            labelsGroupSelection
                .enter()
                .append('text')
                .classed(this.timelineSelectors.textLabel.class, true);

            labelsGroupSelection
                .text((x: TimelineLabel, id: number) => {
                    if (!isLast && id === 0 && labels.length > 1) {
                        let fontSize = convertToPt(this.timelineFormat.labelFormat.sizeProperty);

                        let textProperties: TextProperties = {
                            text: labels[0].text,
                            fontFamily: 'arial',
                            fontSize: fontSize
                        };

                        let halfFirstTextWidth = TextMeasurementService.measureSvgTextWidth(textProperties) / 2;

                        textProperties = {
                            text: labels[1].text,
                            fontFamily: 'arial',
                            fontSize: fontSize
                        };

                        let halfSecondTextWidth = TextMeasurementService.measureSvgTextWidth(textProperties) / 2,
                            diff = this.timelineProperties.cellWidth * (labels[1].id - labels[0].id);

                        if (diff < halfFirstTextWidth + halfSecondTextWidth) {
                            return "";
                        }
                    }

                    let labelFormattedTextOptions: LabelFormattedTextOptions = {
                        label: x.text,
                        maxWidth: this.timelineProperties.cellWidth * (isLast ? 0.90 : 3),
                        fontSize: this.timelineFormat.labelFormat.sizeProperty
                    };

                    return getLabelFormattedText(labelFormattedTextOptions);
                })
                .style('font-size', convertToPt(this.timelineFormat.labelFormat.sizeProperty))
                .attr({
                    x: (x: TimelineLabel) => (x.id + 0.5) * this.timelineProperties.cellWidth,
                    y: this.timelineProperties.textYPosition
                        + (1 + index) * fromPointToPixel(this.timelineFormat.labelFormat.sizeProperty),
                    fill: this.timelineFormat.labelFormat.colorProperty
                })
                .append('title')
                .text((x: TimelineLabel) => x.title);

            labelsGroupSelection
                .exit()
                .remove();
        }

        private clearData(): void {
            this.initialized = false;

            this.mainGroupElement
                .selectAll(this.timelineSelectors.CellRect.selector)
                .remove();

            this.mainGroupElement
                .selectAll(this.timelineSelectors.textLabel.selector)
                .remove();

            this.rangeText.text("");

            this.cursorGroupElement
                .selectAll(this.timelineSelectors.SelectionCursor.selector)
                .remove();

            this.svg
                .attr("width", 0)
                .selectAll(this.timelineSelectors.TimelineSlicer.selector)
                .remove();

            this.mainGroupElement
                .selectAll(this.timelineSelectors.textLabel.selector)
                .remove();
        }

        private static updateCursors(timelineData: TimelineData, cellWidth: number): void {
            let startDate: DatePeriod = timelineData.timelineDatapoints[timelineData.selectionStartIndex].datePeriod,
                endDate: DatePeriod = timelineData.timelineDatapoints[timelineData.selectionEndIndex].datePeriod;

            timelineData.cursorDataPoints[0].selectionIndex = startDate.index;
            timelineData.cursorDataPoints[1].selectionIndex = (endDate.index + endDate.fraction);
        }

        private static fillTimelineFormat(objects: any, timelineProperties: DefaultTimelineProperties): TimelineFormat {
            let timelineFormat: TimelineFormat =
                {
                    rangeTextFormat: {
                        showProperty: DataViewObjects.getValue<boolean>(
                            objects,
                            TimeRangeShowProp,
                            timelineProperties.TimelineDefaultTimeRangeShow),
                        colorProperty: DataViewObjects.getFillColor(
                            objects,
                            TimeRangeColorProp,
                            timelineProperties.DefaultTimeRangeColor),
                        sizeProperty: DataViewObjects.getValue<number>(
                            objects,
                            TimeRangeSizeProp,
                            timelineProperties.TimelineDefaultTextSize)
                    },
                    cellFormat: {
                        colorInProperty: DataViewObjects.getFillColor(
                            objects,
                            SelectedCellColorProp,
                            timelineProperties.TimelineDefaultCellColor),
                        colorOutProperty: DataViewObjects.getFillColor(
                            objects,
                            UnselectedCellColorProp,
                            timelineProperties.TimelineDefaultCellColorOut)
                    },
                    granularityFormat: {
                        scaleColorProperty: DataViewObjects.getFillColor(
                            objects,
                            ScaleColorProp,
                            timelineProperties.DefaultScaleColor),
                        sliderColorProperty: DataViewObjects.getFillColor(
                            objects,
                            SliderColorProp,
                            timelineProperties.DefaultSliderColor)
                    },
                    labelFormat: {
                        showProperty: DataViewObjects.getValue<boolean>(
                            objects,
                            LabelsShowProp,
                            timelineProperties.DefaultLabelsShow),
                        colorProperty: DataViewObjects.getFillColor(
                            objects,
                            LabelsColorProp,
                            timelineProperties.DefaultLabelColor),
                        sizeProperty: DataViewObjects.getValue<number>(
                            objects,
                            LabelsSizeProp,
                            timelineProperties.TimelineDefaultTextSize)
                    },
                    calendarFormat: {
                        firstMonthProperty: DataViewObjects.getValue<number>(objects, CalendarMonthProp, 1),
                        firstDayProperty: Math.max(1, Math.min(31, DataViewObjects.getValue<number>(
                            objects,
                            CalendarDayProp,
                            timelineProperties.DefaultFirstDay))),
                        weekDayProperty: Math.max(0, Math.min(6, DataViewObjects.getValue<number>(
                            objects,
                            WeekDayProp,
                            timelineProperties.DefaultFirstWeekDay)))
                    }
                };

            return timelineFormat;
        }

        public fillCells(cellFormat: CellFormat): void {
            let dataPoints = this.timelineData.timelineDatapoints,
                cellSelection = this.mainGroupElement
                    .selectAll(this.timelineSelectors.CellRect.selector)
                    .data(dataPoints);

            cellSelection.attr('fill', d => Utils.getCellColor(d, this.timelineData, cellFormat));
        }

        public renderCells(
            timelineData: TimelineData,
            timelineFormat: TimelineFormat,
            timelineProperties: TimelineProperties,
            suppressAnimations: any): void {

            let allDataPoints: TimelineDatapoint[] = timelineData.timelineDatapoints,
                totalX: number = 0;

            let cellsSelection = this.cellsElement
                .selectAll(this.timelineSelectors.CellRect.selector)
                .data(allDataPoints);

            cellsSelection
                .enter()
                .append('rect')
                .classed(this.timelineSelectors.CellRect.class, true);

            cellsSelection
                .attr({
                    height: convertToPx(timelineProperties.cellHeight),
                    width: (d: TimelineDatapoint) => convertToPx(d.datePeriod.fraction * timelineProperties.cellWidth),
                    x: (d: TimelineDatapoint) => {
                        let value = totalX;
                        totalX += d.datePeriod.fraction * timelineProperties.cellWidth;
                        return convertToPx(value);
                    },
                    y: convertToPx(timelineProperties.cellsYPosition),
                    id: (d: TimelineDatapoint) => d.index
                });

            let clickHandler: (d: TimelineDatapoint, index: number) => void = (d: TimelineDatapoint, index: number) => {
                d3.event.preventDefault();

                let cursorDataPoints: CursorDatapoint[] = this.timelineData.cursorDataPoints,
                    keyEvent: D3.D3Event = d3.event;

                if (keyEvent.altKey || keyEvent.shiftKey) {
                    if (this.timelineData.selectionEndIndex < index) {
                        cursorDataPoints[1].selectionIndex = (d.datePeriod.index + d.datePeriod.fraction);
                        timelineData.selectionEndIndex = index;
                    }
                    else {
                        cursorDataPoints[0].selectionIndex = d.datePeriod.index;
                        timelineData.selectionStartIndex = index;
                    }
                } else {
                    timelineData.selectionStartIndex = index;
                    timelineData.selectionEndIndex = index;

                    cursorDataPoints[0].selectionIndex = d.datePeriod.index;
                    cursorDataPoints[1].selectionIndex = (d.datePeriod.index + d.datePeriod.fraction);
                }

                this.fillCells(timelineFormat.cellFormat);

                this.renderCursors(
                    timelineData,
                    timelineFormat,
                    timelineProperties.cellHeight,
                    timelineProperties.cellsYPosition);

                this.renderTimeRangeText(timelineData, timelineFormat.rangeTextFormat);
                this.fillColorGranularity(this.timelineFormat.granularityFormat);
                this.setSelection(timelineData);
            };

            cellsSelection
                .on('click', clickHandler)
                .on("touchstart", clickHandler);

            this.fillCells(timelineFormat.cellFormat);

            cellsSelection
                .exit()
                .remove();
        }

        public dragged(currentCursor: CursorDatapoint): void {
            let xScale = 1,
                container = d3.select(this.timelineSelectors.TimelineVisual.selector);

            if (container) {
                let transform = container.style("transform");
                if (transform !== undefined && transform !== 'none') {
                    let str = transform.split("(")[1];
                    xScale = Number(str.split(", ")[0]);
                }
            }

            let cursorOverElement: TimelineCursorOverElement = this.findCursorOverElement(d3.event.x);

            if (!cursorOverElement) {
                return;
            }

            let currentlyMouseOverElement: TimelineDatapoint = cursorOverElement.datapoint,
                currentlyMouseOverElementIndex: number = cursorOverElement.index;

            if (currentCursor.cursorIndex === 0 && currentlyMouseOverElementIndex <= this.timelineData.selectionEndIndex) {
                this.timelineData.selectionStartIndex = currentlyMouseOverElementIndex;
                this.timelineData.cursorDataPoints[0].selectionIndex = currentlyMouseOverElement.datePeriod.index;
            }

            if (currentCursor.cursorIndex === 1 && currentlyMouseOverElementIndex >= this.timelineData.selectionStartIndex) {
                this.timelineData.selectionEndIndex = currentlyMouseOverElementIndex;

                this.timelineData.cursorDataPoints[1].selectionIndex =
                    currentlyMouseOverElement.datePeriod.index + currentlyMouseOverElement.datePeriod.fraction;
            }

            this.fillCells(this.timelineFormat.cellFormat);

            this.renderCursors(
                this.timelineData,
                this.timelineFormat,
                this.timelineProperties.cellHeight,
                this.timelineProperties.cellsYPosition);

            this.renderTimeRangeText(this.timelineData, this.timelineFormat.rangeTextFormat);
            this.fillColorGranularity(this.timelineFormat.granularityFormat);
        }

        /**
         * Note: Public for testability.
         */
        public findCursorOverElement(position: number): TimelineCursorOverElement {
            let timelineDatapoints: TimelineDatapoint[] = this.timelineData.timelineDatapoints || [],
                cellWidth: number = this.timelineProperties.cellWidth,
                timelineDatapointIndexes: number[],
                index: number;

            timelineDatapointIndexes = timelineDatapoints.map((datapoint: TimelineDatapoint) => {
                return datapoint.index;
            });

            index = Timeline.getIndexByPosition(
                timelineDatapointIndexes,
                cellWidth,
                position);

            if (!timelineDatapoints[index]) {
                return null;
            }

            return {
                index: index,
                datapoint: timelineDatapoints[index]
            };
        }

        public dragended(): void {
            this.setSelection(this.timelineData);
        }

        private drag: D3.Behavior.Drag = d3.behavior.drag()
            .origin((cursorDataPoint: CursorDatapoint) => {
                cursorDataPoint.x = cursorDataPoint.selectionIndex * this.timelineProperties.cellWidth;

                return cursorDataPoint;
            })
            .on("drag", (cursorDataPoint: CursorDatapoint) => {
                this.dragged(cursorDataPoint);
            })
            .on("dragend", () => {
                this.dragended();
            });

        public renderCursors(
            timelineData: TimelineData,
            timelineFormat: TimelineFormat,
            cellHeight: number,
            cellsYPosition: number): D3.UpdateSelection {

            let cursorSelection = this.cursorGroupElement
                .selectAll(this.timelineSelectors.SelectionCursor.selector)
                .data(timelineData.cursorDataPoints);

            cursorSelection
                .enter()
                .append('path')
                .classed(this.timelineSelectors.SelectionCursor.class, true);

            cursorSelection
                .attr("transform", (cursorDataPoint: CursorDatapoint) => {
                    var dx: number,
                        dy: number;

                    dx = cursorDataPoint.selectionIndex * this.timelineProperties.cellWidth;
                    dy = cellHeight / 2 + cellsYPosition;

                    return SVGUtil.translate(dx, dy);
                })
                .attr({
                    d: d3.svg.arc()
                        .innerRadius(0)
                        .outerRadius(cellHeight / 2)
                        .startAngle((cursorDataPoint: CursorDatapoint) => cursorDataPoint.cursorIndex * Math.PI + Math.PI)
                        .endAngle((cursorDataPoint: CursorDatapoint) => cursorDataPoint.cursorIndex * Math.PI + 2 * Math.PI)
                })
                .call(this.drag);

            cursorSelection
                .exit()
                .remove();

            return cursorSelection;
        }

        public renderTimeRangeText(timelineData: TimelineData, timeRangeFormat: LabelFormat): void {
            let leftMargin: number = (GranularityNames.length + 2) * this.timelineProperties.elementWidth,
                maxWidth: number = this.svgWidth
                    - leftMargin
                    - this.timelineProperties.leftMargin
                    - timeRangeFormat.sizeProperty;

            if (timeRangeFormat.showProperty && maxWidth > 0) {
                let timeRangeText: string = Utils.timeRangeText(timelineData);

                let labelFormattedTextOptions: LabelFormattedTextOptions = {
                    label: timeRangeText,
                    maxWidth: maxWidth,
                    fontSize: timeRangeFormat.sizeProperty
                };

                let actualText: string = getLabelFormattedText(labelFormattedTextOptions);

                this.rangeText
                    .classed(this.timelineSelectors.SelectionRangeContainer.class, true)
                    .attr({
                        x: GranularityNames.length
                            * (this.timelineProperties.elementWidth + this.timelineProperties.leftMargin),
                        y: 40,
                        fill: timeRangeFormat.colorProperty
                    })
                    .style({
                        'font-size': convertToPt(timeRangeFormat.sizeProperty)
                    })
                    .text(actualText)
                    .append('title').text(timeRangeText);;
            }
            else {
                this.rangeText.text("");
            }
        }

        public setSelection(timelineData: TimelineData): void {
            this.requiresNoUpdate = true;

            let lower: SQConstantExpr = SQExprBuilder.dateTime(Utils.getStartSelectionDate(timelineData)),
                upper: SQConstantExpr = SQExprBuilder.dateTime(
                    new Date(Utils.getEndSelectionDate(timelineData).getTime() - 1)),
                filterExpr = SQExprBuilder.between(timelineData.columnIdentity, lower, upper),
                filter: SemanticFilter = SemanticFilter.fromSQExpr(filterExpr);

            let objects: VisualObjectInstancesToPersist = {
                merge: [
                    <VisualObjectInstance>{
                        objectName: "general",
                        selector: undefined,
                        properties: {
                            "filter": filter,
                        }
                    }
                ]
            };

            this.hostServices.persistProperties(objects);
            this.hostServices.onSelect({ visualObjects: [] });
        }

        /**
         * This function retruns the values to be displayed in the property pane for each object.
         * Usually it is a bind pass of what the property pane gave you, but sometimes you may want to do
         * validation and return other values/defaults.
         */
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            let enumeration: ObjectEnumerationBuilder = new ObjectEnumerationBuilder(),
                objects: DataViewObjects = this.dataView && this.dataView.metadata
                    ? this.dataView.metadata.objects
                    : undefined;

            switch (options.objectName) {
                case 'rangeHeader': {
                    this.enumerateRangeHeader(enumeration, objects);
                    break;
                }
                case 'cells': {
                    this.enumerateCells(enumeration, objects);
                    break;
                }
                case 'granularity': {
                    this.enumerateGranularity(enumeration, objects);
                    break;
                }
                case 'labels': {
                    this.enumerateLabels(enumeration, objects);
                    break;
                }
                case 'calendar': {
                    this.enumerateCalendar(enumeration, objects);
                    break;
                }
                case 'weekDay': {
                    this.enumerateWeekDay(enumeration, objects);
                    break;
                }
            }

            return enumeration.complete();
        }

        public enumerateRangeHeader(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects): void {
            enumeration.pushInstance({
                objectName: 'rangeHeader',
                displayName: 'Selection Color',
                selector: null,
                properties: {
                    show: DataViewObjects.getValue<boolean>(
                        objects,
                        TimeRangeShowProp,
                        this.defaultTimelineProperties.TimelineDefaultTimeRangeShow),
                    fontColor: DataViewObjects.getFillColor(
                        objects,
                        TimeRangeColorProp,
                        this.defaultTimelineProperties.DefaultTimeRangeColor),
                    textSize: DataViewObjects.getValue<number>(
                        objects,
                        TimeRangeSizeProp,
                        this.defaultTimelineProperties.TimelineDefaultTextSize)
                }
            });
        }

        public enumerateCells(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects): void {
            enumeration.pushInstance({
                objectName: 'cells',
                selector: null,
                properties: {
                    fillSelected: DataViewObjects.getFillColor(
                        objects,
                        SelectedCellColorProp,
                        this.defaultTimelineProperties.TimelineDefaultCellColor),
                    fillUnselected: DataViewObjects.getFillColor(
                        objects,
                        UnselectedCellColorProp,
                        this.defaultTimelineProperties.TimelineDefaultCellColorOut)
                }
            });
        }

        public enumerateGranularity(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects): void {
            enumeration.pushInstance({
                objectName: 'granularity',
                selector: null,
                properties: {
                    granularity: DataViewObjects.getValue(
                        objects,
                        GranularityProp,
                        this.defaultTimelineProperties.DefaultGranularity),
                    scaleColor: DataViewObjects.getFillColor(
                        objects,
                        ScaleColorProp,
                        this.defaultTimelineProperties.DefaultScaleColor),
                    sliderColor: DataViewObjects.getFillColor(
                        objects,
                        SliderColorProp,
                        this.defaultTimelineProperties.DefaultSliderColor),
                }
            });
        }

        public enumerateLabels(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects): void {
            enumeration.pushInstance({
                objectName: 'labels',
                selector: null,
                properties: {
                    show: DataViewObjects.getValue<boolean>(
                        objects,
                        LabelsShowProp,
                        this.defaultTimelineProperties.DefaultLabelsShow),
                    fontColor: DataViewObjects.getFillColor(
                        objects,
                        LabelsColorProp,
                        this.defaultTimelineProperties.DefaultLabelColor),
                    textSize: DataViewObjects.getValue<number>(
                        objects,
                        LabelsSizeProp,
                        this.defaultTimelineProperties.TimelineDefaultTextSize)
                }
            });
        }

        public enumerateCalendar(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects): void {
            enumeration.pushInstance({
                objectName: 'calendar',
                selector: null,
                properties: {
                    month: Math.max(1, Math.min(12, DataViewObjects.getValue<number>(objects, CalendarMonthProp, 1))),
                    day: Math.max(1, Math.min(31, DataViewObjects.getValue<number>(objects, CalendarDayProp, 1))),
                }
            });
        }

        public enumerateWeekDay(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects): void {
            enumeration.pushInstance({
                objectName: 'weekDay',
                selector: null,
                properties: {
                    day: Math.max(0, Math.min(6, DataViewObjects.getValue<number>(objects, WeekDayProp, 0)))
                }
            });
        }
    }
}
