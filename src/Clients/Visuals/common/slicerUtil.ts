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
    import Color = jsCommon.Color;
    import PixelConverter = jsCommon.PixelConverter;
    import SQExpr = powerbi.data.SQExpr;
    import SQExprBuilder = powerbi.data.SQExprBuilder;
    import SemanticFilter = powerbi.data.SemanticFilter;

    /** Utility class for slicer*/
    export module SlicerUtil {
        /** CSS selectors for slicer elements. */
        export module Selectors {
            import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;

            export const HeaderContainer = createClassAndSelector('headerContainer');
            export const Header = createClassAndSelector('slicerHeader');
            export const TitleHeader = createClassAndSelector('titleHeader');
            export const HeaderText = createClassAndSelector('headerText');
            export const Body = createClassAndSelector('slicerBody');
            export const Label = createClassAndSelector('slicerLabel');
            export const LabelText = createClassAndSelector('slicerText');
            export const LabelImage = createClassAndSelector('slicerImage');
            export const CountText = createClassAndSelector('slicerCountText');
            export const Clear = createClassAndSelector('clear');
            export const SearchHeader = createClassAndSelector('searchHeader');
            export const SearchInput = createClassAndSelector('searchInput');
            export const SearchHeaderCollapsed = createClassAndSelector('collapsed');
            export const SearchHeaderShow = createClassAndSelector('show');
            export const MultiSelectEnabled = createClassAndSelector('isMultiSelectEnabled');
        }

        /** Const declarations*/
        export module DisplayNameKeys {
            export const Clear = 'Slicer_Clear';
            export const SelectAll = 'Slicer_SelectAll';
            export const Search = 'SearchBox_Text';
        }

        /** Helper class for slicer settings  */
        export module SettingsHelper {
            export function areSettingsDefined(data: SlicerData): boolean {
                return data != null && data.slicerSettings != null;
            }
        }

        /** Helper class for handling slicer default value  */
        export module DefaultValueHandler {
            export function getIdentityFields(dataView: DataView): SQExpr[] {
                if (!dataView)
                    return;

                let dataViewCategorical = dataView.categorical;
                if (!dataViewCategorical || _.isEmpty(dataViewCategorical.categories))
                    return;

                return <SQExpr[]>dataViewCategorical.categories[0].identityFields;
            }
        }

        export function getContainsFilter(expr: SQExpr, containsText: string): SemanticFilter {
            let containsTextExpr = SQExprBuilder.text(containsText);
            let filterExpr = SQExprBuilder.contains(expr, containsTextExpr);
            return SemanticFilter.fromSQExpr(filterExpr);
        }

        // Compare the sqExpr of the scopeId with sqExprs of the retained values. 
        // If match found, remove the item from the retainedValues list, and return true, 
        // otherwise return false.
        export function tryRemoveValueFromRetainedList(value: DataViewScopeIdentity, selectedScopeIds: DataViewScopeIdentity[], caseInsensitive?: boolean): boolean {
            if (!value || _.isEmpty(selectedScopeIds))
                return false;

            for (let i = 0, len = selectedScopeIds.length; i < len; i++) {
                let retainedValueScopeId = selectedScopeIds[i];
                if (DataViewScopeIdentity.equals(value, retainedValueScopeId, caseInsensitive)) {
                    selectedScopeIds.splice(i, 1);
                    return true;
                }
            }

            return false;
        }

        export function getUpdatedSelfFilter(searchKey: string, metaData: DataViewMetadata): data.SemanticFilter {
            if (!metaData || _.isEmpty(searchKey))
                return;

            debug.assert(_.size(metaData.columns) === 1, 'slicer should not have more than one column based on the capability');
            let column = _.first(metaData.columns);
            if (column && column.expr)
                return SlicerUtil.getContainsFilter(<SQExpr>column.expr, searchKey);
        }

        /** Helper class for creating and measuring slicer DOM elements  */
        export class DOMHelper {
            public addSearch(hostServices: IVisualHostServices, container: D3.Selection): D3.Selection {
                let slicerSearch = container.append('div')
                    .classed(Selectors.SearchHeader.class, true)
                    .classed(Selectors.SearchHeaderCollapsed.class, true);
                slicerSearch.append('span')
                    .classed('powervisuals-glyph search', true)
                    .attr('title', hostServices.getLocalizedString(DisplayNameKeys.Search));

                slicerSearch.append('input')
                    .attr('type', 'text')
                    .classed(Selectors.SearchInput.class, true)
                    .attr('drag-resize-disabled', 'true');

                return slicerSearch;
            }

            public getRowHeight(settings: SlicerSettings, textProperties: TextProperties): number {
                return TextMeasurementService.estimateSvgTextHeight(this.getTextProperties(settings.slicerText.textSize, textProperties)) + this.getRowsOutlineWidth(settings.slicerText.outline, settings.general.outlineWeight);
            }

            public setSlicerTextStyle(slicerText: D3.Selection, settings: SlicerSettings): void {
                slicerText
                    .style({
                        'color': settings.slicerText.color,
                        'background-color': settings.slicerText.background,
                        'border-style': 'solid',
                        'border-color': settings.general.outlineColor,
                        'border-width': VisualBorderUtil.getBorderWidth(settings.slicerText.outline, settings.general.outlineWeight),
                        'font-size': PixelConverter.fromPoint(settings.slicerText.textSize),
                         // Makes height consistent between browsers. 1.79 was found by aproximating current chrome line-height: normal calculation.
                        "line-height": Math.floor(1.79 * settings.slicerText.textSize) + "px"
                    });
                let color = this.calculateSlicerTextHighlightColor(settings.slicerText.color);
                slicerText.on('mouseover', function (d) {
                    d3.select(this).style({
                        'color': color,
                    });
                });

                slicerText.on('mouseout', function (d) {
                    d3.select(this).style({
                        'color': settings.slicerText.color,
                    });
                });
            }

            public getRowsOutlineWidth(outlineElement: string, outlineWeight: number): number {
                switch (outlineElement) {
                    case outline.none:
                    case outline.leftRight:
                        return 0;
                    case outline.bottomOnly:
                    case outline.topOnly:
                        return outlineWeight;
                    case outline.topBottom:
                    case outline.frame:
                        return outlineWeight * 2;
                    default:
                        return 0;
                }
            }

            private calculateSlicerTextHighlightColor(color: string): string {
                let rgbColor = Color.parseColorString(color);

                // If it's white, use the @neutralTertiaryAltColor
                if (rgbColor.R === 255 && rgbColor.G === 255 && rgbColor.B === 255)
                    return '#C8C8C8';

                return Color.calculateHighlightColor(rgbColor, 0.8, 0.2);
            }

            private getTextProperties(textSize: number, textProperties: TextProperties): TextProperties {
                textProperties.fontSize = PixelConverter.fromPoint(textSize);
                return textProperties;
            }
        }
    }

     /** Helper class for calculating the current slicer settings. */
    export module SlicerUtil.ObjectEnumerator {
        export function enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions, data: SlicerData, settings: SlicerSettings, dataView: DataView): VisualObjectInstance[] {
            if (!data)
                return;

            switch (options.objectName) {
                case 'items':
                    return enumerateItems(data, settings);
                case 'selection':
                    if (shouldShowSelectionOption(dataView))
                        return enumerateSelection(data, settings);
            }
        }

        function shouldShowSelectionOption(dataView: DataView): boolean {
            return !(dataView &&
                dataView.metadata &&
                dataView.metadata.columns &&
                _.some(dataView.metadata.columns, (column) => column.discourageAggregationAcrossGroups));
        }

        function enumerateSelection(data: SlicerData, settings: SlicerSettings): VisualObjectInstance[] {
            let slicerSettings = settings;
            let areSelectionSettingsDefined = SettingsHelper.areSettingsDefined(data) && data.slicerSettings.selection;
            let selectAllCheckboxEnabled = areSelectionSettingsDefined && data.slicerSettings.selection.selectAllCheckboxEnabled ?
                data.slicerSettings.selection.selectAllCheckboxEnabled : slicerSettings.selection.selectAllCheckboxEnabled;
            let singleSelect = data && data.slicerSettings && data.slicerSettings.selection && data.slicerSettings.selection.singleSelect !== undefined ?
                data.slicerSettings.selection.singleSelect : slicerSettings.selection.singleSelect;

            return [{
                selector: null,
                objectName: 'selection',
                properties: {
                    selectAllCheckboxEnabled: selectAllCheckboxEnabled,
                    singleSelect: singleSelect,
                }
            }];
        }

        function enumerateItems(data: SlicerData, settings: SlicerSettings): VisualObjectInstance[] {
            let slicerSettings = settings;
            let areTextSettingsDefined = SettingsHelper.areSettingsDefined(data) && data.slicerSettings.slicerText;
            let fontColor = areTextSettingsDefined && data.slicerSettings.slicerText.color ?
                data.slicerSettings.slicerText.color : slicerSettings.slicerText.color;
            let background = areTextSettingsDefined && data.slicerSettings.slicerText.background ?
                data.slicerSettings.slicerText.background : slicerSettings.slicerText.background;
            return [{
                selector: null,
                objectName: 'items',
                properties: {
                    fontColor: fontColor,
                    background: background,
                    outline: slicerSettings.slicerText.outline,
                    textSize: slicerSettings.slicerText.textSize,
                }
            }];
        }
    }
}