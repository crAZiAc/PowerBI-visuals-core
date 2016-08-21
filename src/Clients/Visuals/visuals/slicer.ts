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
    import DOMHelper = SlicerUtil.DOMHelper;
    import SlicerOrientation = slicerOrientation.Orientation;
    import SlicerHeader = powerbi.visuals.controls.SlicerHeader;
    import SlicerHeaderSettings = powerbi.visuals.controls.ISlicerHeaderSettings;
    import PixelConverter = jsCommon.PixelConverter;

    const DefaultFontSizeInPt: number = 9;
    const DefaultFontFamily: string = Font.Family.regular.getCSS();
    const HeaderWrapperClass: string = "slicer-header-wrapper";
    const ContainerClass: string = "slicer-container";
    const ContentWrapperClass: string = "slicer-content-wrapper";

    export interface SlicerValueHandler {
        getDefaultValue(): data.SQConstantExpr;
        getIdentityFields(): data.SQExpr[];

        /** gets updated self filter based on the searchKey. 
         *  If the searchKey didn't change, then the updated filter will be undefined. */
        getUpdatedSelfFilter(searchKey: string): data.SemanticFilter;
    }

    export interface SlicerConstructorOptions {
        behavior?: IInteractiveBehavior;
        hostServices?: IVisualHostServices;
    }

    export interface ISlicerRenderer {
        init(options: SlicerInitOptions, element: JQuery): IInteractivityService;
        render(options: SlicerRenderOptions): void;
        onModeChange(mode: string);
        enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[];
    }

    export interface SlicerRenderOptions {
        dataView: DataView;
        viewport: IViewport;
        resetScrollbarPosition?: boolean;
    }

    interface VisualSlicerData {
        categorySourceName: string;
        orientation: SlicerOrientation;
    }

    export interface SlicerInitOptions {
        visualInitOptions: VisualInitOptions;
        loadMoreData: () => void;
    }

    export class Slicer implements IVisual {
        private element: JQuery;
        private currentViewport: IViewport;
        private dataView: DataView;
        private interactivityService: IInteractivityService;
        private behavior: IInteractiveBehavior;
        private hostServices: IVisualHostServices;
        private slicerRenderer: ISlicerRenderer;
        private slicerOrientation: SlicerOrientation;
        private waitingForData: boolean;
        private domHelper: DOMHelper;
        private initOptions: VisualInitOptions;
        private slicerHeader: SlicerHeader;
        private mode: string;
        private slicerContainer: JQuery;
        private headerContainer: JQuery;
        private data: VisualSlicerData;
        private container: JQuery;

        constructor(options?: SlicerConstructorOptions) {
            if (options) {
                this.behavior = options.behavior;
            }
            this.domHelper = new DOMHelper();
        }

        public init(options: VisualInitOptions): void {
            this.initOptions = options;
            this.element = options.element;
            this.currentViewport = options.viewport;
            this.hostServices = options.host;
            this.slicerOrientation = SlicerOrientation.Vertical;
            this.waitingForData = false;
            this.container = InJs.DomFactory.div()
                .addClass(ContainerClass)
                .appendTo(this.element);
            this.headerContainer = InJs.DomFactory.div()
                .appendTo(this.container)
                .addClass(HeaderWrapperClass);
            this.slicerContainer = InJs.DomFactory.div()
                .appendTo(this.container)
                .addClass(ContentWrapperClass);

            this.initializeSlicerRenderer(this.slicerOrientation);
        }

        public onDataChanged(options: VisualDataChangedOptions): void {
            debug.assertValue(options, 'options');

            let dataViews = options.dataViews;
            debug.assertValue(dataViews, 'dataViews');

            if (_.isEmpty(dataViews)) {
                return;
            }

            let existingDataView = this.dataView;
            this.dataView = dataViews[0];
            // Reset scrollbar by default, unless it's an Append operation or Selecting an item
            let resetScrollbarPosition = options.operationKind !== VisualDataChangeOperationKind.Append
                && !DataViewAnalysis.hasSameCategoryIdentity(existingDataView, this.dataView);

            this.render(resetScrollbarPosition, true);
        }

        public onResizing(finalViewport: IViewport): void {
            this.currentViewport = finalViewport;
            this.render(false /* resetScrollbarPosition */);
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            if (!this.dataView)
                return;

            switch (options.objectName) {
                case 'header':
                    return this.slicerHeader.enumerateObjectInstances(options);
                case 'general':
                    let objects = this.slicerHeader.enumerateObjectInstances(options);
                    let orientation = this.data ? this.data.orientation : SlicerOrientation.Vertical;
                    (<any>objects[0].properties).orientation = orientation;
                    return objects;
                default:
                    return this.slicerRenderer.enumerateObjectInstances(options);
            }
        }

        // public for testability
        public loadMoreData(): void {
            let dataView = this.dataView;
            if (!dataView)
                return;

            let dataViewMetadata = dataView.metadata;
            // Making sure that hostservices.loadMoreData is not invoked when waiting for server to load the next segment of data
            if (!this.waitingForData && dataViewMetadata && dataViewMetadata.segment) {
                this.hostServices.loadMoreData();
                this.waitingForData = true;
            }
        }

        public onClearSelection(): void {
            if (this.interactivityService) {
                this.interactivityService.clearSelection();
                // calls render so that default behavior can be applied after clear selection.
                this.render(false /* resetScrollbarPosition */);
            }
        }

        private get activeMode(): string {
            return this.mode || slicerMode.basic;
        }

        private static converter(dataView: DataView): VisualSlicerData {
            if (!dataView) {
                return;
            }

            let orientation: SlicerOrientation = SlicerOrientation.Vertical;
            let categorySourceName: string;
            if (dataView.metadata && dataView.metadata.objects) {
                let objects = dataView.metadata.objects;
                orientation = DataViewObjects.getValue<slicerOrientation.Orientation>(objects, slicerProps.general.orientation, orientation);
            }
            if (dataView.categorical && !_.isEmpty(dataView.categorical.categories)) {
                categorySourceName = dataView.categorical.categories[0].source.displayName;
            }

            return { orientation: orientation, categorySourceName: categorySourceName };
        }

        private render(resetScrollbarPosition: boolean, stopWaitingForData?: boolean): void {
            this.updateViewport();
            this.data = Slicer.converter(this.dataView);
            if (this.data) {
                if (this.orientationHasChanged(this.data.orientation)) {
                    this.slicerOrientation = this.data.orientation;
                    // Clear the previous slicer type when rendering the new slicer type
                    this.slicerContainer.empty();
                    this.initializeSlicerRenderer(this.data.orientation);
                }
            }

            this.renderSlicerHeader(this.interactivityService);
            this.slicerRenderer.render({ dataView: this.dataView, viewport: this.currentViewport, resetScrollbarPosition: resetScrollbarPosition });

            if (stopWaitingForData)
                this.waitingForData = false;
        }

        private updateViewport() {
            let css = {
                height: this.currentViewport.height,
                // Require filter pane properly notify the slicer in order to use width
                ["min-width"]: this.currentViewport.width
            };
            this.container.css(css);
        }

        private getMenuFontStyles(): _.Dictionary<string | number> {
            return {
                ["font-size"]: PixelConverter.fromPointToPixel(DefaultFontSizeInPt),
                ["font-family"]: DefaultFontFamily,
                ["font-weight"]: NewDataLabelUtils.LabelTextProperties.fontWeight
            };
        }

        private renderSlicerHeader(interactivityService: ISelectionHandler | IInteractivityService) {
            if (!this.dataView)
                return;

            let reader = powerbi.data.createIDataViewCategoricalReader(this.dataView);
            if (!this.slicerHeader) {
                let settings: SlicerHeaderSettings = {
                    onClear: () => {
                        (<ISelectionHandler>interactivityService).handleClearSelection();
                        (<ISelectionHandler>interactivityService).persistSelectionFilter(slicerProps.filterPropertyIdentifier);
                    },
                    onChange: (mode: string) => {
                        if (this.slicerRenderer) {
                            this.slicerRenderer.onModeChange(mode);
                        }
                    },
                    host: this.headerContainer,
                    menuCss: this.getMenuFontStyles(),
                    isMenuVisible: false,
                    text: this.data.categorySourceName,
                    selectedValue: this.activeMode,
                    hoverContainer: this.element
                };

                this.slicerHeader = new SlicerHeader(settings, this.hostServices.getLocalizedString);
            }

            this.slicerHeader.update(reader, { text: this.data.categorySourceName, selectedValue: this.activeMode });
        }

        private orientationHasChanged(slicerOrientation: SlicerOrientation): boolean {
            return this.slicerOrientation !== slicerOrientation;
        }

        private initializeSlicerRenderer(slicerOrientation: SlicerOrientation): void {
            switch (slicerOrientation) {
                case SlicerOrientation.Horizontal:
                    this.initializeHorizontalSlicer();
                    break;

                case SlicerOrientation.Vertical:
                    this.initializeVerticalSlicer();
                    break;
            }
        }

        private initializeVerticalSlicer(): void {
            let verticalSlicerRenderer = this.slicerRenderer = new VerticalSlicerRenderer({ hostServices: this.hostServices, behavior: this.behavior });
            let options = this.createInitOptions();
            this.interactivityService = verticalSlicerRenderer.init(options, this.slicerContainer);
        }

        private initializeHorizontalSlicer(): void {
            let horizontalSlicerRenderer = this.slicerRenderer = new HorizontalSlicerRenderer({ hostServices: this.hostServices, behavior: this.behavior });
            let options = this.createInitOptions();
            this.interactivityService = horizontalSlicerRenderer.init(options, this.slicerContainer);
        }

        private createInitOptions(): SlicerInitOptions {
            return {
                visualInitOptions: this.initOptions,
                loadMoreData: () => this.loadMoreData()
            };
        }
    }
}