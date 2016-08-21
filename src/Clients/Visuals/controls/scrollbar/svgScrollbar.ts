module powerbi.visuals.controls {
    import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;

    /**
     * Used to represent the extent that d3 uses for tracking the brush position.
     */
    export interface Extent {
        start: number;
        end: number;
    };

    enum ScrollingMode {
        None,
        DraggingThumb,
        BackgroundClicked,
        InitialPagingDelay,
        Paging
    }

    export class SvgScrollbar {
        public static InitialPagingDelayMS: number = 500;
        public static PagingDelayMS: number = 50;
        /**
         * Sets whether the brush is centered on background clicks or is moved extentLength.
         */
        private static CenterOnBackgroundClick: boolean = false;

        public scrollBarLength: number;

        private element: D3.Selection;
        private brushGraphicsContext: D3.Selection;
        private brush: D3.Svg.Brush;
        private brushWidth: number;
        private isHorizontal: boolean;
        private previousBrushExtent: Extent;
        private startBrushExtent: Extent;
        private pointerPosition: number;
        private scrollingMode = ScrollingMode.None;
        private scrollCallback: () => void;
        private timeoutId: number;
        private offset: number;

        private static events = {
            brushStart: 'brushstart',
            brush: 'brush',
            brushEnd: 'brushend'
        };

        private static Brush = createClassAndSelector('brush');

        constructor(brushWidth: number) {
            this.brush = d3.svg.brush();
            this.brushWidth = brushWidth;
        }

        public init(element: D3.Selection): void {
            this.element = element;
        }

        public remove(): void {
            this.element.selectAll(SvgScrollbar.Brush.selector).remove();
            // Remove the listeners
            this.brush
                .on(SvgScrollbar.events.brushStart, null)
                .on(SvgScrollbar.events.brush, null)
                .on(SvgScrollbar.events.brushEnd, null);
            this.brushGraphicsContext = undefined;
        }

        /**
         * Gets the extent. Note that this returns a new instance every time it's called.
         */
        public getExtent(): Extent {
            let extent = this.brush.extent();
            return { start: extent[0], end: extent[1] };
        }

        /**
         * Sets the extent. If start or end are missing, the extentLength will be used to calculate the missing value.
         * If either side of the extent is out of bounds, it will be moved (clamped) so that it's in bounds.
         */
        public setExtent(extent: Extent): void {
            debug.assert(extent.start != null || extent.end != null, 'At least the start or end value for the extent must be given.');
            let extentLength = this.getExtentLength();

            // Calculate the start/end position if one of the values are missing.
            if (extent.start == null) {
                extent.start = extent.end - extentLength;
            }
            else if (extent.end == null) {
                extent.end = extent.start + extentLength;
            }

            debug.assert(this.scrollBarLength >= extent.end - extent.start, 'extentLength should not be greater than scrollBarLength.');

            let oldStart = this.getExtent().start;
            extent = SvgScrollbar.clampExtent(extent, this.scrollBarLength, extentLength);

            // If we're scrolling while this is called, keep track of the offset distance between where the extent was and where it now is.
            // This typically happens in loadMore. More data is loaded, so the extent changes (is shrunk and is moved).
            // If the user was dragging and more data was loaded, when they move their mouse again D3 will jump the extent to the mouse position.
            // The offset allows us to reset the extent back to the position we want it at as the user drags.
            // Also update the previous extent since that's what we want to use as the baseline now.
            if (this.scrollingMode !== ScrollingMode.None) {
                this.offset = extent.start - oldStart;
                this.previousBrushExtent = extent;
            }

            this.brush.extent([extent.start, extent.end]);
        }

        public getExtentLength(): number {
            let extent = this.getExtent();
            return extent.end - extent.start;
        }

        /**
         * Sets the extent length by setting the end of the extent to be extentLength away from the start. 
         */
        public setExtentLength(extentLength: number) {
            debug.assert(extentLength >= 0, 'extentLength must be 0 or greater');
            let extent = this.getExtent();
            extent.end = extent.start + extentLength;
            this.setExtent(extent);
        }

        public setScale(scale: D3.Scale.OrdinalScale): void {
            if (this.isHorizontal)
                this.brush.x(scale);
            else
                this.brush.y(scale);
        }

        public setOrientation(isHorizontal: boolean): void {
            this.isHorizontal = isHorizontal;
        }

        public render(
            scrollbarX: number,
            scrollbarY: number,
            scrollCallback: () => void): void {

            // create graphics context if it doesn't exist
            if (!this.brushGraphicsContext) {
                this.brushGraphicsContext = this.element.append("g")
                    .classed(SvgScrollbar.Brush.class, true);
            }

            this.scrollCallback = scrollCallback;

            // events
            this.brush
                .on(SvgScrollbar.events.brushStart, () => {
                    this.previousBrushExtent = this.getExtent();
                })
                .on(SvgScrollbar.events.brush, () => {
                    let newExtent = this.getExtent();

                    if (this.scrollingMode === ScrollingMode.None) {

                        // Clicking on the edges of the scroll bar results in extents that go out of bounds (ex. [-0.5, 0] or [230, 230.5]).
                        // clampExtent preserves the extent length, which we don't want in this case. We want [-0.5, 0] to become [0, 0]
                        // since this only happens when they click the background.
                        if (newExtent.start < 0 && newExtent.end === 0) {
                            newExtent.start = 0;
                        }
                        else if (newExtent.start === this.scrollBarLength && newExtent.end > this.scrollBarLength) {
                            newExtent.end = this.scrollBarLength;
                        }

                        // If the extents are the same, they clicked on the background
                        this.scrollingMode = SvgScrollbar.isBackgroundClickExtent(newExtent) ? ScrollingMode.BackgroundClicked : ScrollingMode.DraggingThumb;
                        this.startBrushExtent = newExtent;
                    }

                    // Apply the offset (if any). See comment in the setter for extent for more background.
                    if (this.offset != null) {
                        newExtent.start += this.offset;
                        newExtent.end += this.offset;
                    }

                    // Always clamp 1st so we're in the bounds
                    let extentLength = this.getExtentLength();
                    newExtent = SvgScrollbar.clampExtent(newExtent, this.scrollBarLength, extentLength);
                    this.pointerPosition = this.getPointerPosition();

                    switch (this.scrollingMode) {
                        case ScrollingMode.DraggingThumb:
                            // If the thumb is being dragged around, just update the visual
                            this.refreshVisual();
                            break;
                        case ScrollingMode.BackgroundClicked:
                            if (!SvgScrollbar.CenterOnBackgroundClick) {
                                // If they clicked on the background, move the extent one step from where it was before then refresh.
                                let increasing = newExtent.start > this.previousBrushExtent.start;
                                newExtent = SvgScrollbar.stepExtent(this.previousBrushExtent, increasing);
                                this.refreshVisual();

                                // Set the timeout to detect if they're holding the mouse button down.
                                this.scrollingMode = ScrollingMode.InitialPagingDelay;
                                this.setStepTimeout(increasing, newExtent);
                            }
                            else {
                                // If we're centering on click, center the extent on the pointer then refresh
                                let halfWidth = extentLength / 2;
                                newExtent.start = this.pointerPosition - halfWidth;
                                newExtent.end = this.pointerPosition + halfWidth;
                                this.refreshVisual();
                            }
                            break;
                        case ScrollingMode.InitialPagingDelay:
                        case ScrollingMode.Paging:
                            // The user is dragging the mouse after initially clicking in the background.
                            // This causes D3 to change the extent. We don't want it to move, so restore its previous position.
                            newExtent = this.previousBrushExtent;
                            break;
                    }

                    // Set the extent to its new value and refresh
                    this.setExtent(newExtent);
                    this.refreshExtent();
                    this.previousBrushExtent = newExtent;
                })
                .on(SvgScrollbar.events.brushEnd, () => {
                    // Return the extent to the position it should be in
                    this.setExtent(this.previousBrushExtent);
                    this.refreshExtent();

                    // Clear the values
                    this.previousBrushExtent = null;
                    this.startBrushExtent = null;
                    this.pointerPosition = null;
                    this.scrollingMode = ScrollingMode.None;
                    this.offset = null;

                    if (this.timeoutId != null) {
                        window.clearTimeout(this.timeoutId);
                        this.timeoutId = null;
                    }
                });

            // position the graphics context
            let brushContext = this.brushGraphicsContext
                .attr({
                    "transform": SVGUtil.translate(scrollbarX, scrollbarY),
                    "drag-resize-disabled": "true" /* Disables resizing of the visual when dragging the scrollbar in edit mode */
                })
                .call(this.brush);

            // Disable the zooming feature by removing the resize elements
            brushContext.selectAll(".resize")
                .remove();

            if (this.isHorizontal)
                brushContext.selectAll("rect").attr("height", this.brushWidth);
            else
                brushContext.selectAll("rect").attr("width", this.brushWidth);
        }

        /**
         * Determines whether the brush should continue stepping. This assumes that a step has just been taken.
         * @return true if the extent isn't against the start or end of the scrollbar, and the pointer doesn't overlap with it.
         */
        private shouldContinueStepping(scrollBarLength: number, extent: Extent): boolean {
            let overlaps = this.pointerPosition >= extent.start && this.pointerPosition <= extent.end;

            return extent.start !== 0 && extent.end !== scrollBarLength && !overlaps;
        }

        /**
         * Gets the approximate location of the pointer. If the brush event was started in the background,
         * the position will be accurate. If not, it will use the center of the extent.
         */
        private getPointerPosition(): number {
            let extent = this.getExtent();

            // If we started in the background, the pointer is aligned with the extent that has changed since the start.
            if (SvgScrollbar.isBackgroundClickExtent(this.startBrushExtent)) {
                return extent.start < this.startBrushExtent.start ? extent.start : extent.end;
            }

            // Otherwise just get the center of the extent.
            return (extent.end - extent.start) / 2;
        }

        public refreshExtent() {
            let extent = this.getExtent();
            let extentLength = this.getExtentLength();

            if (this.isHorizontal) {
                this.brushGraphicsContext.select(".extent").attr("width", extentLength);
                this.brushGraphicsContext.select(".extent").attr('x', extent.start);
            }

            else {
                this.brushGraphicsContext.select(".extent").attr("height", extentLength);
                this.brushGraphicsContext.select(".extent").attr('y', extent.start);
            }
        }

        public refreshVisual() {
            if (this.scrollCallback) {
                window.requestAnimationFrame(this.scrollCallback);
            }
        }

        public refreshExtentAndVisual(): void {
            this.refreshExtent();
            this.refreshVisual();
        }

        private setStepTimeout(increasing: boolean, extent: Extent): void {
            if (this.shouldContinueStepping(this.scrollBarLength, extent)) {
                let delay: number = this.scrollingMode === ScrollingMode.InitialPagingDelay ? SvgScrollbar.InitialPagingDelayMS : SvgScrollbar.PagingDelayMS;
                this.timeoutId = _.delay(() => { this.onPagingTimeoutExpired(increasing); }, delay);
            }
        }

        /**
         * Determines whether the extent was created with a click in the background.
         * @returns true if extent.start === extent.end
         */
        private static isBackgroundClickExtent(extent: Extent): boolean {
            return extent.start === extent.end;
        }

        /**
         * Moves the extent over one "step" in the direction specified by `this.increasing`.
         * A step is the extent length;
         */
        private static stepExtent(extent: Extent, increasing: boolean): Extent {
            let length = extent.end - extent.start;

            extent.start = increasing ? extent.start + length : extent.start - length;
            extent.end = increasing ? extent.end + length : extent.end - length;

            return extent;
        }

        private onPagingTimeoutExpired(increasing: boolean): void {
            // If the timeout expired and we were in the inital waiting state, we're now in the paging state.
            if (this.scrollingMode !== ScrollingMode.Paging) {
                this.scrollingMode = ScrollingMode.Paging;
            }

            // Step the extent and refresh
            let extent = this.getExtent();
            let newExtent = SvgScrollbar.stepExtent(extent, increasing);
            this.setExtent(newExtent);
            this.refreshExtentAndVisual();
            this.previousBrushExtent = extent;

            // Setup the timeout for the next step
            this.setStepTimeout(increasing, newExtent);
        }

        private static clampExtent(extent: Extent, scrollBarLength: number, extentLength: number): Extent {
            debug.assert(scrollBarLength >= extentLength, 'extentLength should not be greater than scrollBarLength');

            if (extent.start < 0) {
                extent.start = 0;
                extent.end = extentLength;
            }

            if (extent.end > scrollBarLength) {
                extent.end = scrollBarLength;
                extent.start = scrollBarLength - extentLength;
            }

            return extent;
        }
    }
}