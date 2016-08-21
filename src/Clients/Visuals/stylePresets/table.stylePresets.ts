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

module powerbi.visuals.stylePresets {
    import DataViewObjectDefinitions = data.DataViewObjectDefinitions;
    import SQExprBuilder = data.SQExprBuilder;

    import Utility = jsCommon.Utility;
    import createSolidFillDefinition = fillDefinitionHelpers.createSolidFillDefinition;

    function wrapTableStylePresetElements(stylePresetName: string, theme: IVisualStyle): DataViewObjectDefinitions {

        let elements = getTablixStylePresetElements(stylePresetName, theme);

        if (!elements) // Invalid stylePresetName
            return {};

        return {
            grid: [{
                properties: {
                    outlineColor: createSolidFillDefinition(elements.outlineColor),
                    outlineWeight: SQExprBuilder.integer(Utility.valueOrDefault(elements.outlineWeight, TablixStylePresetDefaults.outlineWeight)),
                    gridVertical: SQExprBuilder.boolean(elements.gridVerticalEnabledTable),
                    gridVerticalColor: createSolidFillDefinition(elements.gridColor),
                    gridVerticalWeight: SQExprBuilder.integer(Utility.valueOrDefault(elements.gridVerticalWeight, TablixStylePresetDefaults.gridlineVerticalWeight)),
                    gridHorizontal: SQExprBuilder.boolean(elements.gridHorizontalEnabledTable),
                    gridHorizontalColor: createSolidFillDefinition(elements.gridColor),
                    gridHorizontalWeight: SQExprBuilder.integer(Utility.valueOrDefault(elements.gridHorizontalWeight, TablixStylePresetDefaults.gridHorizontalWeight)),
                    rowPadding: SQExprBuilder.integer(elements.rowPadding),
                },
            }],

            columnHeaders: [{
                properties: {
                    outline: SQExprBuilder.text(Utility.valueOrDefault(elements.outlineModeColumnHeaders, TablixStylePresetDefaults.columnsOutline)),
                    fontColor: createSolidFillDefinition(elements.fontColorHeaders),
                    backColor: createSolidFillDefinition(elements.backColorHeaders),
                }
            }],

            values: [{
                properties: {
                    outline: SQExprBuilder.text(Utility.valueOrDefault(elements.outlineModeValues, TablixStylePresetDefaults.valuesOutline)),
                    fontColorPrimary: createSolidFillDefinition(elements.fontColorValues1),
                    backColorPrimary: createSolidFillDefinition(elements.backColorValues1),
                    fontColorSecondary: createSolidFillDefinition(elements.fontColorValues2),
                    backColorSecondary: createSolidFillDefinition(elements.backColorValues2),
                }
            }],

            total: [{
                properties: {
                    outline: SQExprBuilder.text(Utility.valueOrDefault(elements.outlineModeTotals, TablixStylePresetDefaults.tableTotalOutline)),
                    fontColor: createSolidFillDefinition(elements.fontColorTotals),
                    backColor: createSolidFillDefinition(elements.backColorTotals),
                }
            }],
        };
    }

    export function tableStylePresets(): VisualStylePresets {
        return {
            sectionTitle: data.createDisplayNameGetter('Visual_Table_StylePreset_SectionTitle'),
            sliceTitle: data.createDisplayNameGetter('Visual_Table_StylePreset_SliceTitle'),
            defaultPresetName: TablixStylePresetsName.None,
            presets: {
                [TablixStylePresetsName.None]: {
                    name: TablixStylePresetsName.None,
                    displayName: data.createDisplayNameGetter('Visual_Table_StylePreset_None'),
                    evaluate: (theme: IVisualStyle) => wrapTableStylePresetElements(TablixStylePresetsName.None, theme),
                },

                [TablixStylePresetsName.Minimal]: {
                    name: TablixStylePresetsName.Minimal,
                    displayName: data.createDisplayNameGetter('Visual_Table_StylePreset_Minimal'),
                    evaluate: (theme: IVisualStyle) => wrapTableStylePresetElements(TablixStylePresetsName.Minimal, theme),
                },

                [TablixStylePresetsName.BoldHeader]: {
                    name: TablixStylePresetsName.BoldHeader,
                    displayName: data.createDisplayNameGetter('Visual_Table_StylePreset_BoldHeader'),
                    evaluate: (theme: IVisualStyle) => wrapTableStylePresetElements(TablixStylePresetsName.BoldHeader, theme),
                },

                [TablixStylePresetsName.AlternatingRows]: {
                    name: TablixStylePresetsName.AlternatingRows,
                    displayName: data.createDisplayNameGetter('Visual_Table_StylePreset_AlternatingRows'),
                    evaluate: (theme: IVisualStyle) => wrapTableStylePresetElements(TablixStylePresetsName.AlternatingRows, theme),
                },

                [TablixStylePresetsName.ContrastAlternatingRows]: {
                    name: TablixStylePresetsName.ContrastAlternatingRows,
                    displayName: data.createDisplayNameGetter('Visual_Table_StylePreset_ContrastAlternatingRows'),
                    evaluate: (theme: IVisualStyle) => wrapTableStylePresetElements(TablixStylePresetsName.ContrastAlternatingRows, theme),
                },

                [TablixStylePresetsName.FlashyRows]: {
                    name: TablixStylePresetsName.FlashyRows,
                    displayName: data.createDisplayNameGetter('Visual_Table_StylePreset_FlashyRows'),
                    evaluate: (theme: IVisualStyle) => wrapTableStylePresetElements(TablixStylePresetsName.FlashyRows, theme),
                },

                [TablixStylePresetsName.BoldHeaderFlashyRows]: {
                    name: TablixStylePresetsName.BoldHeaderFlashyRows,
                    displayName: data.createDisplayNameGetter('Visual_Table_StylePreset_BoldHeaderFlashyRows'),
                    evaluate: (theme: IVisualStyle) => wrapTableStylePresetElements(TablixStylePresetsName.BoldHeaderFlashyRows, theme),
                },

                [TablixStylePresetsName.Sparse]: {
                    name: TablixStylePresetsName.Sparse,
                    displayName: data.createDisplayNameGetter('Visual_Table_StylePreset_Sparse'),
                    evaluate: (theme: IVisualStyle) => wrapTableStylePresetElements(TablixStylePresetsName.Sparse, theme),
                },

                [TablixStylePresetsName.Condensed]: {
                    name: TablixStylePresetsName.Condensed,
                    displayName: data.createDisplayNameGetter('Visual_Table_StylePreset_Condensed'),
                    evaluate: (theme: IVisualStyle) => wrapTableStylePresetElements(TablixStylePresetsName.Condensed, theme),
                },
            },
        };
    }
}