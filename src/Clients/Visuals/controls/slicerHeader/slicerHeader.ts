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

module powerbi.visuals.controls {
    import IDataViewCategoricalReader = powerbi.data.IDataViewCategoricalReader;
    import DisplayNameKeys = powerbi.visuals.SlicerUtil.DisplayNameKeys;
    import SelectMenu = powerbi.visual.controls.SelectMenu;
    import SelectMenuOption = powerbi.visual.controls.SelectMenuOption;
    import SelectMenuSettings = powerbi.visual.controls.SelectMenuSettings;
    import PixelConverter = jsCommon.PixelConverter;

    const HeaderClass: string = "slicer-header";
    const TitleClass: string = "slicer-header-title";
    const ClearClass: string = "slicer-header-clear";
    const TextClass: string = "slicer-header-text";
    const SelectMenuContainerClass: string = "slicer-header-selectmenu";

    interface SlicerHeaderData {
        borderBottomWidth: number;
        show: boolean;
        outline: string;
        fontColor: string;
        background?: string;
        textSize: number;
        outlineColor: string;
        outlineWeight: number;
        searchEnabled: boolean;
    }

    export interface ISlicerHeaderSettings {
        onChange?: (mode: string) => void;
        onClear?: () => void;
        isMenuVisible?: boolean;
        selectedValue?: string;
        host?: JQuery;
        hoverContainer?: JQuery;
        menuCss?: _.Dictionary<string | number>;
        text?: string;
        scale?: number;
    }

    /**
     * Common header for all the slicer. Includes selectmenu and title. 
     * Responsible for enumerating properties and parsing data view. 
     */
    export class SlicerHeader {

        private static DefaultData(): SlicerHeaderData {
            return {
                borderBottomWidth: 1,
                show: true,
                outline: visuals.outline.bottomOnly,
                fontColor: '#000000',
                textSize: 10,
                outlineColor: '#808080',
                outlineWeight: 1,
                searchEnabled: false
            };
        }

        private header: JQuery;
        private title: JQuery;
        private textElement: JQuery;
        private selectMenuContainer: JQuery;

        private data: SlicerHeaderData;
        private settings: ISlicerHeaderSettings;
        private localize: (name: string) => string;
        private selectMenu: SelectMenu;

        constructor(settings: ISlicerHeaderSettings, localize: (name: string) => string) {
            this.localize = localize;
            this.settings = settings;
            this.render();
        }

        /**
         * Should be called by the visual when enumerate object properties happens.
         */
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            if (!this.data)
                return;

            if (options.objectName === "header") {
                return [{
                    selector: null,
                    objectName: 'header',
                    properties: {
                        show: this.data.show,
                        fontColor: this.data.fontColor,
                        background: this.data.background,
                        outline: this.data.outline,
                        textSize: this.data.textSize,
                        outlineColor: this.data.outlineColor,
                        outlineWeight: this.data.outlineWeight
                    }
                }];
                //ToDo: Version upgrade
            } else if (options.objectName === "general") {
                return [{
                    selector: null,
                    objectName: 'general',
                    properties: {
                        outlineColor: this.data.outlineColor,
                        outlineWeight: this.data.outlineWeight
                    }
                }];
            }
        }

        /**
       * Should be called on every visual update/data change.
       */
        public update(reader: IDataViewCategoricalReader, settings?: ISlicerHeaderSettings) {
            debug.assertValue(reader, "Reader");

            $.extend(this.settings, settings);
            this.data = SlicerHeader.converter(reader);
            this.updateTitle();
            this.updateSelectMenu();
        }

        private static converter(reader: IDataViewCategoricalReader): SlicerHeaderData {
            debug.assertValue(reader, "Reader");
            let data: SlicerHeaderData = SlicerHeader.DefaultData();
            let objects = reader.getStaticObjects();
            if (objects) {
                data.show = DataViewObjects.getValue<boolean>(objects, slicerProps.header.show, data.show);
                data.fontColor = DataViewObjects.getFillColor(objects, slicerProps.header.fontColor, data.fontColor);
                data.background = DataViewObjects.getFillColor(objects, slicerProps.header.background, data.background);
                //ToDo: Move the header specific outline properties to header section.
                data.outlineColor = DataViewObjects.getFillColor(objects, slicerProps.general.outlineColor, data.outlineColor);
                data.outlineWeight = DataViewObjects.getValue<number>(objects, slicerProps.general.outlineWeight, data.outlineWeight);

                data.outline = DataViewObjects.getValue<string>(objects, slicerProps.header.outline, data.outline);
                data.textSize = DataViewObjects.getValue<number>(objects, slicerProps.header.textSize, data.textSize);
                data.searchEnabled = DataViewObjects.getValue<boolean>(objects, slicerProps.general.selfFilterEnabled, data.searchEnabled);
            }

            return data;
        }

        private render(): void {
            this.header = InJs.DomFactory.div()
                .addClass(HeaderClass)
                .appendTo(this.settings.host);

            this.addTitle();
            this.addSelectMenu();
        }

        private addSelectMenu(): void {
            this.selectMenuContainer = InJs.DomFactory.div()
                .addClass(SelectMenuContainerClass)
                .appendTo(this.header);

            let selectMenuOptions: SelectMenuOption[] = [];
            let options = slicerMode.type.members();
            for (let option of options) {
                let displayName: string = (<any>option.displayName)({ get: this.localize });
                selectMenuOptions.push({
                    text: displayName,
                    value: <string>option.value
                });
            }

            let settings: SelectMenuSettings = {
                onChange: (val) => {
                    if (this.settings.onChange) {
                        this.settings.onChange(val);
                    }
                },
                container: this.selectMenuContainer,
                options: selectMenuOptions,
                selectedValue: this.settings.selectedValue,
                css: this.settings.menuCss
            };

            this.selectMenu = new SelectMenu(settings);
        }

        /**
         * Creates the title and initializes all the events.
         */
        private addTitle(): void {
            this.title = InJs.DomFactory.div()
                .addClass(TitleClass)
                .appendTo(this.header);

            let clearButton = InJs.DomFactory.span()
                .addClass(ClearClass)
                .attr('title', this.localize(DisplayNameKeys.Clear))
                .appendTo(this.title);

            clearButton.hide();

            this.settings.hoverContainer.hover(
                () => {
                    clearButton.show();
                },
                () => {
                    clearButton.hide();
                });

            clearButton.click(() => {
                if (this.settings.onClear) {
                    this.settings.onClear();
                }

            });

            this.textElement = $("<h2 />")
                .addClass(TextClass)
                .appendTo(this.title);
        }

        /**
         * Update visibility, styles and text for the title.
         */
        private updateTitle() {
            if (this.data.show) {
                 let hideOutline = false;

                // When search is enabled, we will hide the default outline if the outline properties haven't been customized by user.
                if (this.data.searchEnabled) {
                    let defaultData = SlicerHeader.DefaultData();
                    hideOutline = (this.data.outline === defaultData.outline
                        && this.data.outlineWeight === defaultData.outlineWeight
                        && this.data.outlineColor === defaultData.outlineColor);
                }
                this.title.show();
                this.title
                    .css({
                        'border-style': hideOutline ? 'none' : 'solid',
                        'border-color': this.data.outlineColor,
                        'border-width': VisualBorderUtil.getBorderWidth(this.data.outline, this.data.outlineWeight),
                        'background-color': this.data.background,
                    });

                this.textElement.css({
                    'font-size': PixelConverter.fromPoint(this.data.textSize),
                    'color': this.data.fontColor,
                });

                this.textElement
                    .text(this.settings.text)
                    .attr("title", this.settings.text);
            } else {
                this.title.hide();
            }
        }

        private updateSelectMenu(): void {
            if (this.settings.isMenuVisible === false) {
                this.selectMenuContainer.hide();
            } else {
                this.selectMenuContainer.show();
                this.selectMenu.update({
                    selectedValue: this.settings.selectedValue,
                    css: this.settings.menuCss,
                });
            }
        }
    }
}
