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
    import TablixObjects = visuals.controls.internal.TablixObjects;
    import Color = jsCommon.Color;

    export module TablixStylePresetDefaults {
        // Default for values common to most presets to avoid repeating declaring them
        export const outlineWeight = TablixObjects.PropGridOutlineWeight.defaultValue;
        export const columnsOutline = TablixObjects.PropColumnsOutline.defaultValue;
        export const rowsOutline = TablixObjects.PropRowsOutline.defaultValue;
        export const valuesOutline = TablixObjects.PropValuesOutline.defaultValue;
        export const tableTotalOutline = TablixObjects.PropTotalOutline.defaultValue;

        export const gridHorizontalWeight = TablixObjects.PropGridHorizontalWeight.defaultValue;
        export const gridlineVerticalWeight = TablixObjects.PropGridVerticalWeight.defaultValue;

        export const rowPaddingCondensed = 0;
        export const rowPaddingNormal = 3;
        export const rowPaddingSparse = 6;
    }

    export module TablixStylePresetsName {
        export const None = "None";
        export const Minimal = "Minimal";
        export const BoldHeader = "BoldHeader";
        export const AlternatingRows = "AlternatingRows";
        export const ContrastAlternatingRows = "ContrastAlternatingRows";
        export const FlashyRows = "FlashyRows";
        export const BoldHeaderFlashyRows = "BoldHeaderFlashyRows";
        export const Sparse = "Sparse";
        export const Condensed = "Condensed";
    }

    export interface TablixStylePresetElements {
        outlineColor: string;
        outlineWeight?: number;
        outlineModeColumnHeaders?: string;
        outlineModeRowHeaders?: string;
        outlineModeValues?: string;
        outlineModeTotals?: string;

        gridColor: string;
        gridVerticalEnabledTable: boolean;
        gridVerticalEnabledMatrix: boolean;
        gridVerticalWeight?: number;
        gridHorizontalEnabledTable: boolean;
        gridHorizontalEnabledMatrix: boolean;
        gridHorizontalWeight?: number;

        rowPadding: number;

        backColorHeaders: string;
        fontColorHeaders: string;

        backColorValues1: string;
        fontColorValues1: string;
        backColorValues2: string;
        fontColorValues2: string;

        backColorTotals: string;
        fontColorTotals: string;
    }

    export function getTablixStylePresetElements(stylePresetName: string, theme: IVisualStyle): TablixStylePresetElements {
        let backColor: string = theme.colorPalette.background.value,
            foreColor: string = theme.colorPalette.foreground.value,
            accent: string = theme.colorPalette.tableAccent.value,
            gridColor: string;

        switch (stylePresetName) {
            case TablixStylePresetsName.None: {
                return {
                    outlineColor: TablixObjects.PropGridOutlineColor.defaultValue,

                    gridColor: TablixObjects.PropGridVerticalColor.defaultValue,
                    gridVerticalEnabledTable: TablixObjects.PropGridVertical.defaultValue,
                    gridVerticalEnabledMatrix: TablixObjects.PropGridVertical.defaultValue,
                    gridHorizontalEnabledTable: TablixObjects.PropGridHorizontalTable.defaultValue,
                    gridHorizontalEnabledMatrix: TablixObjects.PropGridHorizontalMatrix.defaultValue,

                    rowPadding: TablixObjects.PropGridRowPadding.defaultValue,

                    fontColorHeaders: TablixObjects.PropColumnsFontColor.defaultValue,
                    backColorHeaders: TablixObjects.PropColumnsBackColor.defaultValue,

                    fontColorValues1: TablixObjects.PropValuesFontColorPrimary.defaultValue,
                    backColorValues1: TablixObjects.PropValuesBackColorPrimary.defaultValue,
                    fontColorValues2: TablixObjects.PropValuesFontColorSecondary.defaultValue,
                    backColorValues2: TablixObjects.PropValuesBackColorSecondary.defaultValue,

                    fontColorTotals: TablixObjects.PropTotalFontColor.defaultValue,
                    backColorTotals: TablixObjects.PropTotalBackColor.defaultValue,
                };
            }

            case TablixStylePresetsName.Minimal: {
                gridColor = Color.hexBlend(foreColor, 0.12, backColor);

                return {
                    outlineColor: accent,

                    gridColor: gridColor,
                    gridVerticalEnabledTable: false,
                    gridVerticalEnabledMatrix: false,
                    gridHorizontalEnabledTable: true,
                    gridHorizontalEnabledMatrix: true,

                    rowPadding: TablixStylePresetDefaults.rowPaddingNormal,

                    fontColorHeaders: foreColor,
                    backColorHeaders: backColor,

                    fontColorValues1: foreColor,
                    backColorValues1: backColor,
                    fontColorValues2: foreColor,
                    backColorValues2: backColor,

                    fontColorTotals: foreColor,
                    backColorTotals: backColor,
                };
            }

            case TablixStylePresetsName.BoldHeader: {
                backColor = theme.colorPalette.background.value;
                foreColor = theme.colorPalette.foreground.value;
                accent = theme.colorPalette.tableAccent.value;
                gridColor = Color.hexBlend(foreColor, 0.12, backColor);

                return {
                    outlineColor: accent,

                    gridColor: gridColor,
                    gridVerticalEnabledTable: false,
                    gridVerticalEnabledMatrix: false,
                    gridHorizontalEnabledTable: true,
                    gridHorizontalEnabledMatrix: true,

                    rowPadding: TablixStylePresetDefaults.rowPaddingNormal,

                    backColorHeaders: foreColor,
                    fontColorHeaders: backColor,

                    fontColorValues1: foreColor,
                    backColorValues1: backColor,
                    fontColorValues2: foreColor,
                    backColorValues2: backColor,

                    fontColorTotals: foreColor,
                    backColorTotals: backColor,
                };
            }

            case TablixStylePresetsName.AlternatingRows: {
                backColor = theme.colorPalette.background.value;
                foreColor = theme.colorPalette.foreground.value;
                accent = theme.colorPalette.tableAccent.value;
                gridColor = Color.hexBlend(foreColor, 0.12, backColor);

                return {
                    outlineColor: accent,

                    gridColor: gridColor,
                    gridVerticalEnabledTable: false,
                    gridVerticalEnabledMatrix: false,
                    gridHorizontalEnabledTable: true,
                    gridHorizontalEnabledMatrix: true,

                    rowPadding: TablixStylePresetDefaults.rowPaddingNormal,

                    fontColorHeaders: backColor,
                    backColorHeaders: foreColor,

                    fontColorValues1: foreColor,
                    backColorValues1: backColor,
                    fontColorValues2: foreColor,
                    backColorValues2: Color.hexBlend(foreColor, 0.08, backColor),

                    fontColorTotals: backColor,
                    backColorTotals: foreColor,
                };
            }

            case TablixStylePresetsName.ContrastAlternatingRows: {
                backColor = theme.colorPalette.background.value;
                foreColor = theme.colorPalette.foreground.value;
                accent = theme.colorPalette.tableAccent.value;
                gridColor = Color.hexBlend(foreColor, 0.12, backColor);

                return {
                    outlineColor: accent,

                    gridColor: gridColor,
                    gridVerticalEnabledTable: false,
                    gridVerticalEnabledMatrix: false,
                    gridHorizontalEnabledTable: true,
                    gridHorizontalEnabledMatrix: true,

                    rowPadding: TablixStylePresetDefaults.rowPaddingNormal,

                    fontColorHeaders: backColor,
                    backColorHeaders: foreColor,

                    fontColorValues1: backColor,
                    backColorValues1: Color.hexBlend(foreColor, 0.75, backColor),
                    fontColorValues2: foreColor,
                    backColorValues2: Color.hexBlend(foreColor, 0.25, backColor),

                    fontColorTotals: backColor,
                    backColorTotals: foreColor,
                };
            }

            case TablixStylePresetsName.FlashyRows: {
                backColor = theme.colorPalette.background.value;
                foreColor = theme.colorPalette.foreground.value;
                accent = theme.colorPalette.tableAccent.value;
                gridColor = backColor;

                return {
                    outlineColor: foreColor,

                    gridColor: gridColor,
                    gridVerticalEnabledTable: false,
                    gridVerticalEnabledMatrix: false,
                    gridHorizontalEnabledTable: false,
                    gridHorizontalEnabledMatrix: false,

                    rowPadding: TablixStylePresetDefaults.rowPaddingNormal,

                    fontColorHeaders: foreColor,
                    backColorHeaders: backColor,

                    fontColorValues1: foreColor,
                    backColorValues1: Color.hexBlend(accent, 0.40, backColor),
                    fontColorValues2: foreColor,
                    backColorValues2: Color.hexBlend(accent, 0.80, backColor),

                    fontColorTotals: foreColor,
                    backColorTotals: backColor,
                };
            }

            case TablixStylePresetsName.BoldHeaderFlashyRows: {
                backColor = theme.colorPalette.background.value;
                foreColor = theme.colorPalette.foreground.value;
                accent = theme.colorPalette.tableAccent.value;
                gridColor = backColor;

                return {
                    outlineColor: backColor,

                    gridColor: gridColor,
                    gridVerticalEnabledTable: false,
                    gridVerticalEnabledMatrix: false,
                    gridHorizontalEnabledTable: false,
                    gridHorizontalEnabledMatrix: false,

                    rowPadding: TablixStylePresetDefaults.rowPaddingNormal,

                    fontColorHeaders: backColor,
                    backColorHeaders: foreColor,

                    fontColorValues1: foreColor,
                    backColorValues1: Color.hexBlend(accent, 0.40, backColor),
                    fontColorValues2: foreColor,
                    backColorValues2: Color.hexBlend(accent, 0.80, backColor),

                    fontColorTotals: backColor,
                    backColorTotals: foreColor,
                };
            }

            case TablixStylePresetsName.Sparse: {
                backColor = theme.colorPalette.background.value;
                foreColor = theme.colorPalette.foreground.value;
                accent = theme.colorPalette.tableAccent.value;
                gridColor = Color.hexBlend(foreColor, 0.20, backColor);

                return {
                    outlineColor: accent,

                    gridColor: gridColor,
                    gridVerticalEnabledTable: false,
                    gridVerticalEnabledMatrix: false,
                    gridHorizontalEnabledTable: false,
                    gridHorizontalEnabledMatrix: false,

                    rowPadding: TablixStylePresetDefaults.rowPaddingSparse,

                    fontColorHeaders: backColor,
                    backColorHeaders: foreColor,

                    fontColorValues1: foreColor,
                    backColorValues1: backColor,
                    fontColorValues2: foreColor,
                    backColorValues2: backColor,

                    fontColorTotals: backColor,
                    backColorTotals: foreColor,
                };
            }

            case TablixStylePresetsName.Condensed: {
                backColor = theme.colorPalette.background.value;
                foreColor = theme.colorPalette.foreground.value;
                accent = theme.colorPalette.tableAccent.value;
                gridColor = Color.hexBlend(foreColor, 0.20, backColor);

                return {
                    outlineColor: accent,

                    gridColor: gridColor,
                    gridVerticalEnabledTable: true,
                    gridVerticalEnabledMatrix: true,
                    gridHorizontalEnabledTable: true,
                    gridHorizontalEnabledMatrix: true,

                    rowPadding: TablixStylePresetDefaults.rowPaddingCondensed,

                    fontColorHeaders: backColor,
                    backColorHeaders: foreColor,

                    fontColorValues1: foreColor,
                    backColorValues1: backColor,
                    fontColorValues2: foreColor,
                    backColorValues2: backColor,

                    fontColorTotals: backColor,
                    backColorTotals: foreColor,
                };
            }

            default: {
                debug.assertFail("Attempt to get Tablix style elements with invalid preset name [" + stylePresetName + "].");
                return undefined;
            }
        }
    }
}