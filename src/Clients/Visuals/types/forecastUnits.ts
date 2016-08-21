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
    export module forecastUnits {
        export const year: string = '0';
        export const quarter: string = '1';
        export const month: string = '2';
        export const day: string = '3';
        export const hour: string = '4';
        export const minute: string = '5';
        export const second: string = '6';
        export const point: string = '7';

        export const type: IEnumType = createEnumType([
            { value: year, displayName: resources => resources.get('Visual_Forecast_Units_Year') },
            { value: quarter, displayName: resources => resources.get('Visual_Forecast_Units_Quarter') },
            { value: month, displayName: resources => resources.get('Visual_Forecast_Units_Month') },
            { value: day, displayName: resources => resources.get('Visual_Forecast_Units_Day') },
            { value: hour, displayName: resources => resources.get('Visual_Forecast_Units_Hour') },
            { value: minute, displayName: resources => resources.get('Visual_Forecast_Units_Minute') },
            { value: second, displayName: resources => resources.get('Visual_Forecast_Units_Second') },
            { value: point, displayName: resources => resources.get('Visual_Forecast_Units_Point') },
        ]);
    }
}