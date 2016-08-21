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
    import PixelConverter = jsCommon.PixelConverter;
    import SlicerOrientation = slicerOrientation.Orientation;
    import SQExpr = powerbi.data.SQExpr;
    import DisplayNameKeys = SlicerUtil.DisplayNameKeys;

    const ItemWidthSampleSize = 50;
    const MinTextWidth = 80;
    const NavigationArrowWidth: number = 19;
    const LoadMoreDataThreshold = 0.8; // The value indicates the percentage of data already shown that triggers a loadMoreData call.
    const DefaultStyleProperties = {
        labelText: {
            marginRight: 2,
            paddingLeft: 8,
            paddingRight: 8,
        },
    };

    export class HorizontalSlicerRenderer implements ISlicerRenderer, SlicerValueHandler {
        private element: JQuery;
        private currentViewport: IViewport;
        private data: SlicerData;
        private interactivityService: IInteractivityService;
        private behavior: IInteractiveBehavior;
        private hostServices: IVisualHostServices;
        private dataView: DataView;
        private container: D3.Selection;
        private body: D3.Selection;
        private settings: SlicerSettings;
        private itemsContainer: D3.Selection;
        private rightNavigationArrow: D3.Selection;
        private leftNavigationArrow: D3.Selection;
        private dataStartIndex: number;
        private itemsToDisplay: number;
        private textProperties: TextProperties = {
            fontFamily: Font.Family.regular.css,
            fontSize: '14px'
        };
        private maxItemWidth: number;
        private availableWidth: number;
        private totalItemWidth: number;
        private loadMoreData: () => void;
        private domHelper: SlicerUtil.DOMHelper;
        private searchContainer: D3.Selection;

        constructor(options?: SlicerConstructorOptions) {
            if (options) {
                this.behavior = options.behavior;
            }
            this.domHelper = new SlicerUtil.DOMHelper();
            this.dataStartIndex = 0;
        }

        // SlicerValueHandler
        public getDefaultValue(): data.SQConstantExpr {
            if (this.data && this.data.defaultValue)
                return <data.SQConstantExpr>this.data.defaultValue.value;
        }

        public getIdentityFields(): SQExpr[] {
            return SlicerUtil.DefaultValueHandler.getIdentityFields(this.dataView);
        }

        public getUpdatedSelfFilter(searchKey: string): data.SemanticFilter {
            let metadata = this.dataView && this.dataView.metadata;
            if (this.data.searchKey === searchKey)
                return;

            return SlicerUtil.getUpdatedSelfFilter(searchKey, metadata);
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            return SlicerUtil.ObjectEnumerator.enumerateObjectInstances(options, this.data, this.settings, this.dataView);
        }

        public onModeChange(mode: string): void {
            // Doesn't require any changes except handle update on visual.
            this.hostServices.persistProperties({});
        }

        public init(slicerInitOptions: SlicerInitOptions, element: JQuery): IInteractivityService {
            this.element = element;
            this.currentViewport = slicerInitOptions.visualInitOptions.viewport;
            let hostServices = this.hostServices = slicerInitOptions.visualInitOptions.host;
            this.settings = DataConversion.DefaultSlicerProperties();
            if (this.behavior) {
                this.interactivityService = createInteractivityService(hostServices);
            }
            this.loadMoreData = () => slicerInitOptions.loadMoreData();

            let containerDiv = document.createElement('div');
            containerDiv.className = Selectors.container.class;
            let container: D3.Selection = this.container = d3.select(containerDiv);
            this.searchContainer = this.domHelper.addSearch(hostServices, container);
            let body = this.body = container.append('div').classed(SlicerUtil.Selectors.Body.class + " " + Selectors.FlexDisplay.class, true);

            this.leftNavigationArrow = body.append("button")
                .classed(Selectors.NavigationArrow.class + " " + Selectors.LeftNavigationArrow.class, true);

            this.itemsContainer = body.append("div")
                .classed(Selectors.ItemsContainer.class + " " + Selectors.FlexDisplay.class, true);

            this.rightNavigationArrow = body.append("button")
                .classed(Selectors.NavigationArrow.class + " " + Selectors.RightNavigationArrow.class, true);

            // Append container to DOM
            this.element.get(0).appendChild(containerDiv);

            this.bindNavigationEvents();

            return this.interactivityService;
        }

        public render(options: SlicerRenderOptions): void {
            let localizedSelectAllText = this.hostServices.getLocalizedString(DisplayNameKeys.SelectAll);
            let dataView = options.dataView;
            this.data = DataConversion.convert(dataView, localizedSelectAllText, this.interactivityService, this.hostServices);
            if (!dataView || !this.data || _.isEmpty(this.data.slicerDataPoints)) {
                this.itemsContainer.selectAll("*").remove();
                return;
            }

            this.dataView = dataView;
            this.settings = this.data.slicerSettings;
            let resized = this.currentViewport && options.viewport
                && (this.currentViewport.height !== options.viewport.height || this.currentViewport.width !== options.viewport.width);
            if (!(this.isMaxWidthCalculated() && resized)) {
                // Max width calculation is not required during resize, but required on data changes like changes to formatting properties fontSize, outline, outline weight, etc...
                // So calculating only on data updates
                this.calculateAndSetMaxItemWidth();
                this.calculateAndSetTotalItemWidth();
            }

            this.currentViewport = options.viewport;
            this.updateStyle();
            this.availableWidth = this.element.find(SlicerUtil.Selectors.Body.selector).width() - 2 * NavigationArrowWidth;
            this.itemsToDisplay = this.getNumberOfItemsToDisplay(this.availableWidth);
            if (this.itemsToDisplay === 0)
                return;

            this.renderCore();
        }

        private renderCore(): void {
            let data = this.data;
            if (!data || !data.slicerDataPoints)
                return;

            this.normalizePosition(data.slicerDataPoints);

            let itemsToDisplay = this.itemsToDisplay;
            let dataStartIndex = this.dataStartIndex;
            // Update Navigation Arrows
            this.container.classed(Selectors.CanScrollRight.class, dataStartIndex + this.itemsToDisplay <= data.slicerDataPoints.length - 1);
            this.container.classed(Selectors.CanScrollLeft.class, dataStartIndex > 0);

            // Manipulate DOM
            this.renderItems(data.slicerSettings);

            // Bind Interactivity Service
            this.bindInteractivityService();

            // Load More Data
            if (dataStartIndex + itemsToDisplay >= data.slicerDataPoints.length * LoadMoreDataThreshold) {
                this.loadMoreData();
            }
        }

        private updateStyle(): void {
            let data = this.data;
            let settings: SlicerSettings = data.slicerSettings;
            this.container
                .classed(Selectors.MultiSelectEnabled.class, !settings.selection.singleSelect);
            this.searchContainer.classed(SlicerUtil.Selectors.SearchHeaderShow.class, settings.search.enabled);
            this.searchContainer.classed(SlicerUtil.Selectors.SearchHeaderCollapsed.class, !settings.search.enabled);
        }

        private renderItems(defaultSettings: SlicerSettings): void {
            let itemsToDisplay = this.itemsToDisplay;
            debug.assert(itemsToDisplay > 0, 'items to display should be greater than zero');
            let dataStartIndex = this.dataStartIndex;
            let materializedDataPoints = this.data.slicerDataPoints.slice(dataStartIndex, dataStartIndex + itemsToDisplay);
            let items = this.itemsContainer
                .selectAll(SlicerUtil.Selectors.LabelText.selector)
                .data(materializedDataPoints, (d: SlicerDataPoint) => _.indexOf(this.data.slicerDataPoints, d));

            items
                .enter()
                .append("div")
                .classed(SlicerUtil.Selectors.LabelText.class + " " + Selectors.FlexDisplay.class, true);

            items.order();

            items
                .style({
                    "font-family": this.textProperties.fontFamily,
                    "padding-left": PixelConverter.toString(DefaultStyleProperties.labelText.paddingLeft),
                    "padding-right": PixelConverter.toString(DefaultStyleProperties.labelText.paddingRight),
                    "margin-right": (d: SlicerDataPoint, i) => this.isLastRowItem(i, itemsToDisplay) ? "0px" : PixelConverter.toString(DefaultStyleProperties.labelText.marginRight),
                });

            // Default style settings from formatting pane settings
            this.domHelper.setSlicerTextStyle(items, defaultSettings);

            items.exit().remove();

            window.setTimeout(() => {
                items
                    .attr("title", (d: SlicerDataPoint) => d.tooltip)
                    .text((d: SlicerDataPoint) => d.value);
                // Wrap long text into multiple columns based on height availbale
                let labels = this.element.find(SlicerUtil.Selectors.LabelText.selector);
                let item = labels.first();
                let itemHeight = item.height();
                let itemWidth = item.width();
                labels.each((i, element) => {
                    TextMeasurementService.wordBreakOverflowingText(element, itemWidth, itemHeight);
                });
            });
        }

        private bindInteractivityService(): void {
            if (this.interactivityService && this.body) {
                let body = this.body;
                let itemsContainer = body.selectAll(Selectors.ItemsContainer.selector);
                let itemLabels = body.selectAll(SlicerUtil.Selectors.LabelText.selector);
                let data = this.data;
                let searchInput = this.searchContainer.select('input');
                if (!searchInput.empty()) {
                    let element: HTMLInputElement = <HTMLInputElement>searchInput.node();
                    let existingSearchKey: string = element.value;
                    // When the existingSearchKey is empty, try set it using the searchKey from data.
                    // This is to ensure the search key is diplayed in the input box when the input box was first rendered.
                    // If the search key was reset from exploreUI when search is turned off, then the data.searchkey will be ''
                    // The input box value need to be reset to ''.
                    if (_.isEmpty(existingSearchKey) || _.isEmpty(data.searchKey))
                        searchInput
                            .property('value', data.searchKey);
                }
                let behaviorOptions: HorizontalSlicerBehaviorOptions = {
                    dataPoints: data.slicerDataPoints,
                    slicerContainer: this.container,
                    itemsContainer: itemsContainer,
                    itemLabels: itemLabels,
                    interactivityService: this.interactivityService,
                    settings: data.slicerSettings,
                    slicerValueHandler: this,
                    searchInput: searchInput,
                };

                let orientationBehaviorOptions: SlicerOrientationBehaviorOptions = {
                    behaviorOptions: behaviorOptions,
                    orientation: SlicerOrientation.Horizontal,
                };

                this.interactivityService.bind(data.slicerDataPoints, this.behavior, orientationBehaviorOptions, { overrideSelectionFromData: true, hasSelectionOverride: data.hasSelectionOverride });
                SlicerWebBehavior.styleSlicerItems(this.itemsContainer.selectAll(SlicerUtil.Selectors.LabelText.selector), this.interactivityService.hasSelection(), this.interactivityService.isSelectionModeInverted());
            }
            else {
                SlicerWebBehavior.styleSlicerItems(this.itemsContainer.selectAll(SlicerUtil.Selectors.LabelText.selector), false, false);
            }
        }

        private normalizePosition(points: SlicerDataPoint[]): void {
            let dataStartIndex = this.dataStartIndex;
            // if dataStartIndex >= points.length
            dataStartIndex = Math.min(dataStartIndex, points.length - 1);

            // if dataStartIndex < 0 
            this.dataStartIndex = Math.max(dataStartIndex, 0);
        }

        private bindNavigationEvents(): void {
            this.registerMouseWheelScrollEvents();
            this.registerMouseClickEvents();
        }

        private registerMouseClickEvents(): void {
            let rightNavigationArrow = this.container.selectAll(Selectors.RightNavigationArrow.selector);
            let leftNavigationArrow = this.container.selectAll(Selectors.LeftNavigationArrow.selector);

            rightNavigationArrow
                .on("click", () => {
                    this.scrollRight();
                });

            leftNavigationArrow
                .on("click", () => {
                    this.scrollLeft();
                });
        }

        // Register for mouse wheel scroll events
        private registerMouseWheelScrollEvents(): void {
            let scrollableElement = this.body.node();

            scrollableElement.addEventListener("mousewheel", (e) => {
                this.onMouseWheel((<MouseWheelEvent>e).wheelDelta);
            });

            scrollableElement.addEventListener("DOMMouseScroll", (e) => {
                this.onMouseWheel((<MouseWheelEvent>e).detail);
            });
        }

        private onMouseWheel(wheelDelta: number): void {
            if (wheelDelta < 0) {
                this.scrollRight();
            }
            else if (wheelDelta > 0) {
                this.scrollLeft();
            }
        }

        /* If there is only one item being displayed, we show the next item when navigation arrows are clicked 
        * But when there are more than 1 item, n-1 items are shown say we have 10 items in total , in initial page if we show 1 to 5 items when right button is clicked we will show items from 5 to 10
        */
        private scrollRight(): void {
            let itemsToDisplay = this.itemsToDisplay;
            let startIndex = this.dataStartIndex;
            let dataPointsLength = this.data.slicerDataPoints.length;
            let lastItemIndex = dataPointsLength - 1;

            // If it is the last page stay on the same page and don't navigate
            if (itemsToDisplay + startIndex > lastItemIndex) {
                return;
            }

            if (itemsToDisplay === 1) {
                startIndex += itemsToDisplay;
            }
            else {
                startIndex += itemsToDisplay - 1;
            }

            // Adjust the startIndex to show last n items if startIndex + itemsToDisplay is greater than total datapoints
            if (itemsToDisplay + startIndex > lastItemIndex) {
                startIndex = lastItemIndex - itemsToDisplay + 1;
            }

            this.dataStartIndex = startIndex;
            this.renderCore();
        }

        /* If there is only one item being displayed, we show the next item when navigation arrows are clicked 
        * But when there are more than 1 item, n-1 items are shown
        */
        private scrollLeft(): void {
            let itemsToDisplay = this.itemsToDisplay;
            let startIndex = this.dataStartIndex;
            let firstItemIndex = 0;
            // If it is the first page stay on the same page and don't navigate
            if (startIndex === 0) {
                return;
            }

            // If there is only item shown when left navigation button is clicked we want to navigate back to show previous item
            if (itemsToDisplay === 1) {
                startIndex -= itemsToDisplay;
            }

            if (startIndex - itemsToDisplay < firstItemIndex) {
                startIndex = firstItemIndex;
            }
            else {
                startIndex = startIndex - itemsToDisplay + 1;
            }
            this.dataStartIndex = startIndex;
            this.renderCore();
        }

        private isLastRowItem(fieldIndex: number, columnsToDisplay: number): boolean {
            return fieldIndex === columnsToDisplay - 1;
        }

        private getScaledTextWidth(textSize: number): number {
            return (textSize / jsCommon.TextSizeDefaults.TextSizeMin) * MinTextWidth;
        }

        private isMaxWidthCalculated(): boolean {
            return this.maxItemWidth !== undefined;
        }

        // Sampling a subset of total datapoints to calculate max item width
        private calculateAndSetMaxItemWidth(): void {
            let dataPointsLength: number = this.getDataPointsCount();
            let maxItemWidth = 0;
            if (dataPointsLength === 0) {
                this.maxItemWidth = maxItemWidth;
                return;
            }
            let data = this.data;
            let dataPoints = data.slicerDataPoints;
            let sampleSize = Math.min(dataPointsLength, ItemWidthSampleSize);
            let properties = jQuery.extend(true, {}, this.textProperties);
            let textSize = data.slicerSettings.slicerText.textSize;
            // Update text properties from formatting pane values
            properties.fontSize = PixelConverter.fromPoint(textSize);
            let getMaxWordWidth = jsCommon.WordBreaker.getMaxWordWidth;

            for (let i = 0; i < sampleSize; i++) {
                let itemText = dataPoints[i].value;
                properties.text = itemText;
                maxItemWidth = Math.max(maxItemWidth, getMaxWordWidth(itemText, TextMeasurementService.measureSvgTextWidth, properties));
            }
            this.maxItemWidth = Math.min(maxItemWidth, this.getScaledTextWidth(textSize));
        }

        /**
         * Adds to the text width boders, margin, padding.
         */
        private calculateAndSetTotalItemWidth(): void {
            let data = this.data;
            let itemPadding = DefaultStyleProperties.labelText.paddingLeft + DefaultStyleProperties.labelText.paddingRight + DefaultStyleProperties.labelText.marginRight;
            let borderWidth = this.domHelper.getRowsOutlineWidth(data.slicerSettings.slicerText.outline, data.slicerSettings.general.outlineWeight);
            this.totalItemWidth = this.maxItemWidth + itemPadding + borderWidth;
        }

        private getNumberOfItemsToDisplay(widthAvailable: number): number {
            let totalItemWidth = this.totalItemWidth;
            if (totalItemWidth === 0)
                return 0;

            let dataPointsLength = this.getDataPointsCount();
            let numberOfItems = Math.min(dataPointsLength, Math.round(widthAvailable / totalItemWidth));

            // Show atleast 1 item by default 
            return Math.max(numberOfItems, 1);

        }

        private getDataPointsCount(): number {
            return _.size(this.data.slicerDataPoints);
        }
    }

    module Selectors {
        import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;

        export const container = createClassAndSelector('horizontalSlicerContainer');
        export const ItemsContainer = createClassAndSelector('slicerItemsContainer');
        export const NavigationArrow = createClassAndSelector('navigationArrow');
        export const LeftNavigationArrow = createClassAndSelector('left');
        export const RightNavigationArrow = createClassAndSelector('right');
        export const MultiSelectEnabled = createClassAndSelector('isMultiSelectEnabled');
        export const FlexDisplay = createClassAndSelector('flexDisplay');
        export const CanScrollRight = createClassAndSelector('canScrollRight');
        export const CanScrollLeft = createClassAndSelector('canScrollLeft');
    }
}