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
    export module forecastConfidenceIntervals {
        export const ninetyNine: string = '0.99';
        export const ninetyFive: string = '0.95';
        export const ninety: string = '0.90';
        export const eightyFive: string = '0.85';
        export const eighty: string = '0.80';
        export const seventyfive: string = '0.75';

        export const type: IEnumType = createEnumType([
            { value: ninetyNine, displayName: resources => '99%' },
            { value: ninetyFive, displayName: resources => '95%' },
            { value: ninety, displayName: resources => '90%' },
            { value: eightyFive, displayName: resources => '85%' },
            { value: eighty, displayName: resources => '80%' },
            { value: seventyfive, displayName: resources => '75%' },
        ]);
    }
}