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

module powerbi.data {
    import inheritSingle = powerbi.Prototype.inheritSingle;
    
    /** Responsible for evaluating and setting DataViewCategorical's values grouped() function. */
    export module DataViewCategoricalEvalGrouped {
        export function apply(categorical: DataViewCategorical): void {
            debug.assertValue(categorical, 'categorical');
            
            let valueColumns = categorical.values;
            if (!valueColumns)
                return;

            let isDynamicSeries = !!valueColumns.source;

            // Dynamic or not, always update the return values of grouped() to have the rewritten 'source' property
            let valueGroups: DataViewValueColumnGroup[];
            if (isDynamicSeries) {
                // We have a dynamic series, so update the return value of grouped() to have the DataViewValueColumn objects with rewritten 'source'.
                // Also, exclude any column that belongs to a static series.
                valueGroups = inheritSingle(valueColumns.grouped());

                // This function gets invoked twice, 1st time after column sources have been rewritten, and 2nd time if values column gets removed or reordered by projection. 
                // When a DataViewCategorical has no data (i.e. empty data source or everything gets filtered out), there is no way to distinguish
                // whether a measure column is for the dynamic or static series scope, because its identity is undefined.
                // But in the no-data case, it is OK to err on the side of putting the measure in the empty dynamic series group instance, because:
                // 1) If this is a categorical with scalarKeys, then in the 1st invocation the empty scalarKeys column will get incorrectly grouped under the empty dynamic value group,
                //    but on 2nd invocation it will get removed anyway because the column has no roles.
                // 2) If this is the "column values split" of a categorical for combo chart, then any static series measure will just get removed before the 2nd invocation.
                // 3) If this is the "line values split" of a categorical for combo chart, then any secondary axis field and dynamic series measures will get removed before the 2nd invocation.
                let isDataEmpty = DataViewCategoricalUtils.getRowCount(categorical) === 0;
                let isFirstColumnInDynamicSeries = valueColumns.length >= 1 && 
                    (isDataEmpty || _.first(valueColumns).identity !== undefined);

                if (!_.isEmpty(valueColumns) && isFirstColumnInDynamicSeries) {
                    let nextSeriesGroupIndex = 0;
                    let currentSeriesGroup: DataViewValueColumnGroup;
                    for (let i = 0, ilen = valueColumns.length; i < ilen; i++) {
                        let currentValueColumn = valueColumns[i];
                        if (!currentSeriesGroup || (currentValueColumn.identity !== currentSeriesGroup.identity)) {
                            let existingSeriesGroup = valueGroups[nextSeriesGroupIndex];
                            if (existingSeriesGroup) {
                                currentSeriesGroup = inheritSingle(existingSeriesGroup);
                            }
                            else {
                                debug.assert(!currentValueColumn.identity, '!currentValueColumn.identity -- Extra valueGroup items should be statics (no identity).');
                                currentSeriesGroup = existingSeriesGroup = valueGroups[nextSeriesGroupIndex] = { values: null };
                            }
                            
                            valueGroups[nextSeriesGroupIndex] = currentSeriesGroup;
                            currentSeriesGroup.values = [];
                            nextSeriesGroupIndex++;
                            debug.assert(currentValueColumn.identity === currentSeriesGroup.identity, 'expecting the value columns are sequenced by series groups');
                        }
                        currentSeriesGroup.values.push(currentValueColumn);
                    }
                }
                else {
                    // If there are no measures under dynamic series, just make sure that the .values of each valueGroup is empty.
                    for (let i = 0, ilen = valueGroups.length; i < ilen; i++) {
                        let group = valueGroups[i];
                        if (!_.isEmpty(group.values)) {
                            valueGroups[i] = group = inheritSingle(group);
                            group.values = [];
                        }
                    }
                }
            }
            else {
                // We are in a static series, so we should throw away the grouped and recreate it using the static values
                //   which have already been filtered
                valueGroups = [{ values: valueColumns }];
            }

            valueColumns.grouped = () => valueGroups;
            categorical.values = valueColumns;
        }
    }   
}
