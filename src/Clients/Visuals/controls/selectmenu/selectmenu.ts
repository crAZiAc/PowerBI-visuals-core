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

module powerbi.visual.controls {
    const DisableDragAttribute: string = "drag-resize-disabled";
    const DefaultPaddingTop: number = 6;
    const DefaultPaddingBottom: number = 12;

    export interface SelectMenuOption {
        text: string;
        value: string;
    }

    export interface SelectMenuSettings {
        onChange?: (value: string) => void;
        options?: SelectMenuOption[];
        selectedValue?: string;
        container?: JQuery;
        css?: _.Dictionary<string | number>;
    }
    
    export class SelectMenu {
        private select: JQuery;
        private settings: SelectMenuSettings;
        private widget: JQuery;
        private menuWidget: JQuery;

        constructor(settings: SelectMenuSettings) {
            debug.assertValue(settings.container, "container");
            this.settings = settings;
            this.init();
            this.applyStyles();
            this.setValue(this.settings.selectedValue);
        }
        /**
         * Update styles and selected value for the select menu. 
         */
        public update(settings: SelectMenuSettings) {
            $.extend(this.settings, settings);
            if (this.settings.selectedValue != null) {
                this.setValue(this.settings.selectedValue);
            }

            this.applyStyles();
        }

        /**
         * Sets selected value.
         */
        private setValue(value: string): void {
            this.select.val(value);
            this.select.selectmenu("refresh");
        }

        private init(): void {
            this.select = InJs.DomFactory.select();
            this.select
                .attr(DisableDragAttribute, "true")
                .appendTo(this.settings.container);

            SelectMenu.populateOptions(this.select, this.settings.options);
            this.select.selectmenu({
                appendTo: this.settings.container,
                open: () => {
                    this.fixScalePosition();
                }
            });

            if (this.settings.onChange) {
                this.select.on("selectmenuchange", (event, element) => {
                    let value = element.item.value;
                    this.settings.onChange(value);
                });
            }

            this.widget = this.select.selectmenu("widget");
            this.menuWidget = this.select.selectmenu("menuWidget").parent();
        }

        private applyStyles() {
            if (this.settings.css) {
                this.widget.css(this.settings.css);
                this.menuWidget.css(this.settings.css);
            }
        }

        /**
         * Updates popup position with respect to scale;
         */
        private fixScalePosition(): void {
            let scale = SelectMenu.getScale(this.settings.container);
            let widgetElement: HTMLElement = this.widget.get(0);
            let parentRect = this.menuWidget.offsetParent().get(0).getBoundingClientRect();
            let rect = widgetElement.getBoundingClientRect();
            let top = rect.top + rect.height;
            let left = rect.left;
            this.menuWidget.css({
                left: ((left - parentRect.left) / scale) - DefaultPaddingBottom,
                top: ((top - parentRect.top) / scale) + DefaultPaddingTop
            });
        }

        //Gets currently applied scale to the element.
        // Made public for testability.
        public static getScale(element: JQuery): number {
            if (!element) {
                return 1;
            }
            let width = element.width();
            if(width === 0) {
                return 1;
            }
            let scaledWidth = element.get(0).getBoundingClientRect().width;
            return scaledWidth / width;
        }

        private static populateOptions(select: JQuery, options: SelectMenuOption[]): void {
            for (let option of options) {
                $("<option />")
                    .attr("value", option.value)
                    .text(option.text)
                    .appendTo(select);
            }
        }
    }
}