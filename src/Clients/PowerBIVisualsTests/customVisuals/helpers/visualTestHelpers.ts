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

module powerbitests.customVisuals.helpers {
    //(<any>jasmine).DEFAULT_TIMEOUT_INTERVAL = 999999;
    import Rect = powerbi.visuals.Rect;

    export type isInRange = (value: number, min: number, max: number) => boolean;
    export type compareValues = (value1: number, value2) => boolean;

    export let d3TimerEnabled: boolean = (() => {
        let d3Timer = d3.timer;
        let d3DisabledTimer = _.merge(callback => d3Timer(callback, 0, 0), d3Timer);

        Object.defineProperty(helpers, 'd3TimerEnabled', { enumerable: true, 
            get: () => d3Timer === d3.timer,
            set: (value) => {
                if(d3TimerEnabled===!value) {
                    (<any>d3).timer = value ? d3Timer : d3DisabledTimer;
                }
            }
        });

        return true;
    })();

    export function getRelativePosition(fromElement: JQuery, toElement: JQuery): powerbi.visuals.shapes.IPoint {
        if(!fromElement.length || !toElement.length) {
            return null;
        }

        let fromElementRect = fromElement[0].getBoundingClientRect();
        let toElementRect = toElement[0].getBoundingClientRect();

        return {
                x: toElementRect.left - fromElementRect.left,
                y: toElementRect.top - fromElementRect.top  
            };
    }

    export function renderTimeout(fn: Function, timeout: number = powerbitests.DefaultWaitForRender): number {
        return setTimeout(fn, timeout);
    }

    export function getTextElementRects(textElement: Element): Rect {
        var clientRect = textElement.getBoundingClientRect();
        var fontSizeString = window.getComputedStyle(textElement).fontSize;
        debug.assert(fontSizeString.indexOf("em") === -1,"em fontSize is not supported");
        var fontSize = fontSizeString.indexOf("pt") === -1
            ? parseFloat(fontSizeString)
            : jsCommon.PixelConverter.fromPointToPixel(parseFloat(fontSizeString));
        return <Rect>{ 
                left: clientRect.left,
                top: clientRect.bottom - fontSize,
                height: fontSize,
                width: clientRect.width
            };
    }

    export function isSomeTextElementOverlapped(textElements: Element[], isInRange: isInRange): boolean {
        return isSomeRectangleOverlapped(textElements.map(getTextElementRects), isInRange);
    }

    export function isSomeElementOverlapped(elements: Element[], isInRange: isInRange): boolean {
        var rects = elements.map(x => <Rect>x.getBoundingClientRect());
        return isSomeRectangleOverlapped(rects, isInRange);
    }

    export function isSomeRectangleOverlapped(rects: powerbi.visuals.Rect[], isInRange: isInRange): boolean {
        return rects.some((rect1, i1) =>
            rects.some((rect2, i2) => i1 !== i2 && isRectangleOverlapped(rect1, rect2, isInRange)));
    }

    export function isRectangleOverlapped(rect1: Rect, rect2: Rect, isInRange: isInRange): boolean {
        var xOverlap = isInRange(rect1.left, rect2.left, rect2.left + rect2.width)
            || isInRange(rect2.left, rect1.left, rect1.left + rect1.width);
        var yOverlap = isInRange(rect1.top, rect2.top, rect2.top + rect2.height)
            || isInRange(rect2.top, rect1.top, rect1.top + rect1.height);
        return xOverlap && yOverlap;
    }

    export function isTextElementInOrOutElement(mainElement: Element, textElement: Element, compareValues: compareValues) {
        return isRectangleInOrOutRectangle(
            <Rect>mainElement.getBoundingClientRect(),
            <Rect>textElement.getBoundingClientRect(),
            compareValues);
    }

    export function isElementInOrOutElement(mainElement: Element, element: Element, compareValues: compareValues) {
        return isRectangleInOrOutRectangle(
            <Rect>mainElement.getBoundingClientRect(),
            <Rect>getTextElementRects(element),
            compareValues);
    }

    export function isRectangleInOrOutRectangle(
        mainRect: Rect,
        rect: Rect,
        compareValues: compareValues): boolean {
        return compareValues(rect.left, mainRect.left) && compareValues(rect.top, mainRect.top)
            && compareValues(mainRect.left + mainRect.width, rect.left + rect.width)
            && compareValues(mainRect.top + mainRect.height, rect.top + rect.height);
    }

    export function convertColorToRgbColor(color: string): jsCommon.Color.RgbColor {
        if(!(<any>convertColorToRgbColor).colorHex) {
            (<any>convertColorToRgbColor).colorHex = {
                "aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff","beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000",
                "blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887","cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e",
                "coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff","darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b",
                "darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f","darkorange":"#ff8c00","darkorchid":"#9932cc",
                "darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1","darkviolet":"#9400d3",
                "deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff","firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
                "gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f","honeydew":"#f0fff0",
                "hotpink":"#ff69b4","indianred ":"#cd5c5c","indigo":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c","lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00",
                "lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2","lightgrey":"#d3d3d3","lightgreen":"#90ee90",
                "lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de","lightyellow":"#ffffe0",
                "lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6","magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3",
                "mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee","mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585",
                "midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5","navajowhite":"#ffdead","navy":"#000080","oldlace":"#fdf5e6","olive":"#808000",
                "olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6","palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee",
                "palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
                "red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1","saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee",
                "sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
                "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0","violet":"#ee82ee","wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
                "yellow":"#ffff00","yellowgreen":"#9acd32"};
        }

        let result = jsCommon.Color.parseColorString(color);
        if(!result) {
            result = jsCommon.Color.parseColorString((<any>convertColorToRgbColor).colorHex[color.toLowerCase()]);
        }

        return result;
    }

    export function convertColorToHexString(color: string): string {
        return jsCommon.Color.hexString(convertColorToRgbColor(color));
    }

    export function convertColorToRgbString(color: string): string {
        return jsCommon.Color.rgbString(convertColorToRgbColor(color));
    }
}