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
    import ArrayExtensions = jsCommon.ArrayExtensions;
    import DataViewMetadataColumnUtils = powerbi.data.DataViewMetadataColumnUtils;
    import inheritSingle = Prototype.inheritSingle;
    import INumberDictionary = jsCommon.INumberDictionary;
    import MetadataColumnAndProjectionIndex = powerbi.data.DataViewMetadataColumnUtils.MetadataColumnAndProjectionIndex;
    import VisualDataRole = powerbi.VisualDataRole;

    /**
     * Responsible for applying projection order and split selects to DataViewCategorical.
     * If the specified prototype DataView needs to get transformed, the transformed DataView will be returned.
     * Else, the prototype DataView itself will be returned.
     * 
     * Some terminologies that are used in this file (the exact wording might be different depending on who you talk to, but the concepts are the same):
     * 
     * category columns / categories:
     *   The fields on primary axis.  If there are multiple, they will be in one composite level on the hierarchy.
     * 
     * dynamic series measures:
     *   The measures that are under the scope of the secondary axis, repeated for every series group instance.  That implies there is a grouping field on the secondary axis.
     * 
     * static series measures:
     *   The measures that are NOT under the scope of the secondary axis.  In query DataView, it is possible to have static series measures 
     *   even if there is a grouping field on the secondary axis (e.g. the line measures in a combo chart.)
     * 
     * valueGroups:
     *   If the secondary axis has a grouping field, then valueGroups refers to the instances of that group.
     *   Otherwise, the secondary axis has no grouping field, and valueGroups will contain the single static instance that contains the static series measures.     
     */
    export module DataViewCategoricalProjectionOrder {
        export function apply(
            prototype: DataView,
            applicableRoleMappings: DataViewMapping[],
            dataRoles: VisualDataRole[],
            projectionOrdering: DataViewProjectionOrdering,
            splitSelects: INumberDictionary<boolean>): DataView {

            debug.assertValue(prototype, 'prototype');
            debug.assertAnyValue(applicableRoleMappings, 'applicableRoleMappings');
            debug.assertAnyValue(dataRoles, 'dataRoles');
            debug.assertAnyValue(projectionOrdering, 'projectionOrdering');
            debug.assertAnyValue(splitSelects, 'splitSelects');
           
            let transformedDataView: DataView;
            
            let categoricalRoleMappingsWithoutRegression: DataViewCategoricalMapping[] =
                _.chain(applicableRoleMappings)
                    .filter((mapping) => mapping.categorical && !DataViewMapping.getRegressionUsage(mapping))
                    .map((mapping) => mapping.categorical)
                    .value();

            if (prototype.categorical && categoricalRoleMappingsWithoutRegression.length >= 1) {
                let prototypeCategorical = prototype.categorical;

                // Apply projection order and split selects to categories.
                let transformedCategorical = applyToCategories(prototypeCategorical, categoricalRoleMappingsWithoutRegression, projectionOrdering, splitSelects);

                // Apply split selects to secondary axis and measures.
                transformedCategorical = applyToValuesAndGroups(
                    transformedCategorical || prototypeCategorical,
                    dataRoles,
                    projectionOrdering,
                    splitSelects);

                // Finally, if the categorical has been transformed, create an inherited dataView:
                if (transformedCategorical) {
                    transformedDataView = inheritSingle(prototype);
                    transformedDataView.categorical = transformedCategorical;
                }
            }

            return transformedDataView || prototype;
        }

        /**
         * Returns the combined projection ordering of the specified roles, filtered by splitSelects if specified.
         * Returns empty array if the columns for all category columns should get removed. 
         * Returns undefined if projection order cannot be computed.
         */
        function combineProjectionOrderAndSplitSelects(
            roles: string[],
            projectionOrdering: DataViewProjectionOrdering,
            splitSelects: INumberDictionary<boolean>): number[] {

            debug.assertValue(roles, 'roles');
            debug.assertAnyValue(projectionOrdering, 'projectionOrdering');
            debug.assertAnyValue(splitSelects, 'splitSelects');

            // If projectionOrdering is undefined, do not apply it.
            // But if projectionOrdering for roles is an empty array, this module should make sure nothing gets projected (by returning empty projection order).
            if (!projectionOrdering)
                return;

            let combinedProjectionOrder: number[] = _.reduce(
                roles,
                (combinedProjectionOrder, nextRole) => {
                    let projectionOrderOfNextRole: number[] = _.filter(projectionOrdering[nextRole], (selectIndex) => (!splitSelects || splitSelects[selectIndex]));
                    combinedProjectionOrder.push(...projectionOrderOfNextRole);

                    return combinedProjectionOrder;
                },
                <number[]>[]);

            return combinedProjectionOrder;
        }

        /**
         * If the specified prototypeCategorical.categories is not consistent with projectionOrder and splitSelects, apply them and return the result.
         * Else, returns undefined.
         */
        function applyToCategories(
            prototypeCategorical: DataViewCategorical,
            categoricalRoleMappingsWithoutRegression: DataViewCategoricalMapping[],
            projectionOrdering: DataViewProjectionOrdering,
            splitSelects: INumberDictionary<boolean>): DataViewCategorical {

            debug.assertValue(prototypeCategorical, 'prototypeCategorical');
            debug.assertValue(categoricalRoleMappingsWithoutRegression, 'categoricalRoleMappingsWithoutRegression');
            debug.assert(_.every(categoricalRoleMappingsWithoutRegression, (roleMapping) => !!roleMapping), 'categoricalRoleMappingsWithoutRegression must not contain falsy elements');
            debug.assertAnyValue(projectionOrdering, 'projectionOrdering');
            debug.assertAnyValue(splitSelects, 'splitSelects');

            if (!_.isEmpty(prototypeCategorical.categories)) {
                let categoryRoles = DataViewMapping.getRolesIfSameInAllCategoricalMappings(
                    categoricalRoleMappingsWithoutRegression,
                    DataViewMapping.getAllRolesInCategories);

                // if all applicable categorical role mappings have the same roles for categories (even if empty array)...
                if (categoryRoles) {
                    let projectionOrderFilteredBySplit = combineProjectionOrderAndSplitSelects(
                        categoryRoles,
                        projectionOrdering,
                        splitSelects);

                    // apply projectionOrderFilteredBySplit as long as it is defined, even if it is empty array
                    if (projectionOrderFilteredBySplit) {
                        return applyProjectionOrderToCategories(prototypeCategorical, projectionOrderFilteredBySplit, categoryRoles);
                    }
                }
            }
        }

        /**
         * If the specified prototypeCategorical.categories is not consistent with projectionOrder, apply projectionOrder and return the result.
         * Else, returns undefined.
         */
        function applyProjectionOrderToCategories(prototypeCategorical: DataViewCategorical, projectionOrder: number[], categoryRoles: string[]): DataViewCategorical {
            debug.assertValue(prototypeCategorical, 'prototypeCategorical');
            debug.assertValue(projectionOrder, 'projectionOrder');
            debug.assertValue(categoryRoles, 'categoryRoles');

            let prototypeCategories = prototypeCategorical.categories;

            if (_.isEmpty(prototypeCategories)) {
                debug.assert(_.isEmpty(projectionOrder), 'If DataViewCategory.categories is empty but projectionOrder of primary axis is non-empty, then something went wrong when projectionOrder was getting deserialized or reconstructed.  If projectionOrder for primary axis is truly non-empty, then the DSR and DataView should have some data there.');
                return;
            }

            if (isSelectIndexOrderEqual(prototypeCategories, projectionOrder))
                return;

            let originalMetadataColumns = _.map(prototypeCategories, (category) => category.source);
            let originalColumnInfos = DataViewMetadataColumnUtils.leftJoinMetadataColumnsAndProjectionOrder(
                originalMetadataColumns,
                projectionOrder,
                categoryRoles
            );

            // filter out the non-projected columns and sort the remaining ones by projection order:
            let projectionTargetColumnInfos = _.chain(originalColumnInfos)
                .filter((columnInfo) => columnInfo.projectionOrderIndex !== undefined)
                .sortBy((columnInfo) => columnInfo.projectionOrderIndex)
                .value();

            // construct a new array of category columns from the projection target array
            let transformedCategories = _.map(
                projectionTargetColumnInfos,
                (columnInfo) => prototypeCategories[columnInfo.sourceIndex]);

            let transformedCategorical = inheritSingle(prototypeCategorical);

            if (!_.isEmpty(transformedCategories)) {
                let dataViewObjects = DataViewCategoricalUtils.getCategoriesDataViewObjects(prototypeCategories);
                if (dataViewObjects) {
                    transformedCategories =
                        DataViewCategoricalUtils.setCategoriesDataViewObjects(transformedCategories, dataViewObjects) || transformedCategories;
                }

                transformedCategorical.categories = transformedCategories;
            } else {
                // if transformedCategories is an empty array, transformedCategorical.categories should become undefined
                transformedCategorical.categories = undefined;
            }
            
            return transformedCategorical;
        }

        function isSelectIndexOrderEqual(categories: DataViewCategoryColumn[], selectIndexOrder: number[]): boolean {
            debug.assertValue(categories, 'categories');
            debug.assertValue(selectIndexOrder, 'selectIndexOrder');

            return (categories.length === selectIndexOrder.length) &&
                _.every(selectIndexOrder, (selectIndex, i) => categories[i].source.index === selectIndex);
        }

        /**
         * If the specified prototypeCategorical.values is not consistent with projectionOrder and splitSelects, apply them and return the result.
         * Else, returns undefined.
         */
        function applyToValuesAndGroups(
            prototypeCategorical: DataViewCategorical,
            dataRoles: VisualDataRole[],
            projectionOrdering: DataViewProjectionOrdering,
            splitSelects: INumberDictionary<boolean>): DataViewCategorical {

            debug.assertValue(prototypeCategorical, 'prototypeCategorical');
            debug.assertAnyValue(dataRoles, 'dataRoles');
            debug.assertAnyValue(projectionOrdering, 'projectionOrdering');
            debug.assertAnyValue(splitSelects, 'splitSelects');

            let prototypeValues = prototypeCategorical.values;

            // Note: Even if prototypeCategorical.values is an empty array, it may still have a field for dynamic series, in which case the split selects should still get applied.
            if (prototypeValues) {
                // analyze the values and groups
                let prototypeValueColumnsInfo: DataViewCategoricalValueColumnsInfo = extractValueColumnsInfo(prototypeValues);

                // compute the target projection order of the measures
                let measureRolesProjectionOrder = computeMeasureRolesProjectionOrder(prototypeValueColumnsInfo, dataRoles, projectionOrdering, splitSelects);

                // apply to measures
                let transformedValues = applyProjectionOrderToMeasures(prototypeValues, prototypeValueColumnsInfo, measureRolesProjectionOrder);

                // apply to properties related to secondary axis
                transformedValues = 
                    applySplitSelectsToValueGroups(transformedValues || prototypeValues, splitSelects) ||
                    transformedValues;

                // finally, update transformedCategorical.values or its grouped() function based on the new state:
                if (transformedValues) { // if any transformation got applied...
                    let hasRemainingDynamicSeries = !!transformedValues.source;
                    let hasRemainingMeasures = transformedValues.length > 0;
                    
                    let transformedCategorical = inheritSingle(prototypeCategorical);
                    if (hasRemainingDynamicSeries || hasRemainingMeasures) {
                        transformedCategorical.values = transformedValues;

                        // Re-evaluate the return value of values.grouped() with the latest changes:
                        DataViewCategoricalEvalGrouped.apply(transformedCategorical);
                    } else {
                        transformedCategorical.values = undefined;
                    }

                    return transformedCategorical;
                }
            }
        }

        /**
         * Apply splitSelects on prototypeValues.
         * 
         * If any transformation is performed, returns the transformed version of prototypeValues (potentially inherited).
         * Else, returns undefined.
         */
        function applySplitSelectsToValueGroups(prototypeValues: DataViewValueColumns, splitSelects: INumberDictionary<boolean>): DataViewValueColumns {
            debug.assertValue(prototypeValues, 'prototypeValues');
            debug.assertAnyValue(splitSelects, 'splitSelects');
            
            // In the current code, there can be at most one select index in the secondary axis of a categorical, and whether it gets removed
            // is entirely controlled by DataViewTransformAction.splits.

            if (splitSelects && prototypeValues.source) {
                let shouldExcludeSecondaryAxisSource = !splitSelects[prototypeValues.source.index];
                if (shouldExcludeSecondaryAxisSource) {
                    // if processing a split and this is the split without series...
                    let transformingValues = inheritSingle(prototypeValues);
                    transformingValues.source = undefined;
                    transformingValues.identityFields = undefined;
                    
                    return transformingValues;
                } 
            }
        }

        function computeMeasureRolesProjectionOrder(
            valueColumnsInfo: DataViewCategoricalValueColumnsInfo,
            dataRoles: VisualDataRole[],
            projectionOrdering: DataViewProjectionOrdering,
            splitSelects: INumberDictionary<boolean>): number[] {

            debug.assertValue(valueColumnsInfo, 'valueColumnsInfo');
            debug.assertAnyValue(dataRoles, 'dataRoles');
            debug.assertAnyValue(projectionOrdering, 'projectionOrdering');
            debug.assertAnyValue(splitSelects, 'splitSelects');
            
            if (!projectionOrdering) {
                return computeMeasureRolesProjectionOrderFallback(valueColumnsInfo, splitSelects);
            }

            // In order to get the projection order, this code needs to first figure out the measure roles, because projection order is keyed on role.
            // Ideally, the best way to figure out the measure roles is to get it from the applicable DataViewMapping from visual capabilities.
            // In the case of combo chart with splits, however, there will be multiple applicable DataViewMapping (one for each split),
            // and currently there is no robost way of looking up the corresponding DataViewMapping of a given split in DataViewTransformAction.splits.
            // In the long term, we might want to add a name or ID to each DataViewMapping, and tie that name or ID to each split.
            // But until then, this code will just get the value roles from DataViewCategorical.values...
            //
            // And because this code does not get the exact list of value roles from DataViewMapping, if user creates a combo chart where the same measure fields
            // are used for role Y and Y2 with different projection orders, this code cannot correctly pick the projection order for role Y2:
            // Shared Axis (Category): [Country]
            // Legend (Series): []
            // Column values (Y): [Sum(Sales), Sum(SalesQuantity)]
            // Line values (Y2): [Sum(SalesQuantity), Sum(Sales)]
            // Luckly, the projection order of measures for the Line values does not significantly affect their visualization (they'll just be 2 lines with different colors).
            // The projection order for the column measures are much more important.
            // Hence, the projection order of Y has precedence over that of Y2 in this function, and that order is derived from the dataRoles property in visual capabilities.
            // Another implication with this implementation is that this code will not project duplicate measures, which actually makes sense for charts.

            let rolePrecedenceOrder: _.Dictionary<number> = _.reduce(
                dataRoles,
                (dataRolePrecedenceOrder, dataRole: VisualDataRole, i) => {
                    let role = dataRole.name;
                    if (dataRolePrecedenceOrder[role] === undefined) {
                        dataRolePrecedenceOrder[role] = i;
                    }
                    return dataRolePrecedenceOrder;
                },
                <_.Dictionary<number>>{});

            let dynamicMeasureSources = valueColumnsInfo.dynamicSeriesMeasureSources || [];
            let staticMeasureSources = valueColumnsInfo.staticSeriesMeasureSources || [];
            let measureSources: DataViewMetadataColumn[] = dynamicMeasureSources.concat(staticMeasureSources);

            let measureRoles: string[] = _.chain(measureSources)
                .filter((columnSource) => !splitSelects || !!splitSelects[columnSource.index])
                .uniq((columnSource) => columnSource.index)
                .map((columnSource) => {
                    let roles: _.Dictionary<boolean> = columnSource.roles;
                    return !!roles ? _.filter(Object.keys(roles), (role) => roles[role]) : [];
                })
                .flatten<string>()
                .uniq()
                .sortBy((role) => rolePrecedenceOrder[role])
                .value();

            // By having measureRoles in precedence order (Y and then Y2) and then do a uniq() at the end,
            // the projection order of the Y measures will be correct, but the projection order of Y2 measures
            // could be wrong if some or all columns are used in both Y and Y2 roles under a static series.
            // This side-effect is OK for now; see the above block of comments for more details. 
            let projectionOrder: number[] = _.chain(measureRoles)
                .map((role) => projectionOrdering[role] || [])
                .flatten<number>()
                .filter((selectIndex) => !splitSelects || !!splitSelects[selectIndex])
                .uniq()
                .value();

            return projectionOrder;
        }

        /**
         * projectionOrdering has always been an optional input to DataViewTransform,
         * but there is no documentation on when it can be undefined.
         * Also, there are also many test cases without projectionOrder, hence this code
         * will just fallback to using the current select order and filter by splitSelects.
         */
        function computeMeasureRolesProjectionOrderFallback(
            valueColumnsInfo: DataViewCategoricalValueColumnsInfo,
            splitSelects: INumberDictionary<boolean>): number[] {

            debug.assertValue(valueColumnsInfo, 'valueColumnsInfo');
            debug.assertAnyValue(splitSelects, 'splitSelects');

            let dynamicMeasureSources = valueColumnsInfo.dynamicSeriesMeasureSources || [];
            let staticMeasureSources = valueColumnsInfo.staticSeriesMeasureSources || [];
            let measureSources: DataViewMetadataColumn[] = dynamicMeasureSources.concat(staticMeasureSources);

            let selectOrder = _.chain(measureSources)
                .filter((columnSource) => !splitSelects || !!splitSelects[columnSource.index])
                .map((columnSource) => columnSource.index)
                .uniq()
                .value();

            return selectOrder;
        }

        /**
         * To exclude the values that are not in the currently transforming split, caller code should first filter the measure projection order 
         * by the split select index and then pass that intersection as the measureRolesProjectionOrder argument. 
         * 
         * If any transformation is performed, returns the transformed version of prototypeValues (potentially inherited).
         * Else, returns undefined.
         */
        function applyProjectionOrderToMeasures(
            prototypeValues: DataViewValueColumns,
            prototypeValueColumnsInfo: DataViewCategoricalValueColumnsInfo,
            measureRolesProjectionOrder: number[]): DataViewValueColumns {

            debug.assertValue(prototypeValues, 'prototypeValues');
            debug.assertValue(prototypeValueColumnsInfo, 'prototypeValueColumnsInfo');
            debug.assertValue(measureRolesProjectionOrder, 'measureRolesProjectionOrder');

            // Separately compute the new measures under the dynamic scope and static scope: 
            let projectedDynamicSeriesMeasures: DataViewValueColumn[] = getDynamicSeriesMeasuresInProjectionOrder(prototypeValues, prototypeValueColumnsInfo, measureRolesProjectionOrder);
            let projectedStaticSeriesMeasures: DataViewValueColumn[] = getStaticSeriesMeasuresInProjectionOrder(prototypeValues, prototypeValueColumnsInfo, measureRolesProjectionOrder);

            // Updates the DataViewValueColumns object if needed: 
            if (projectedDynamicSeriesMeasures || projectedStaticSeriesMeasures) {
                let transformedValues = inheritSingle(prototypeValues);
                if (projectedDynamicSeriesMeasures) {
                    if (projectedStaticSeriesMeasures) {
                        // both dynamic series measures and static series measures got transformed...
                        debug.assert(_.isEmpty(projectedDynamicSeriesMeasures) || _.isEmpty(projectedStaticSeriesMeasures), 'At least one of the two arrays should be empty, because visual DataView should not have a mix of dynamic and static measures.');

                        transformedValues.splice(0, transformedValues.length);
                        transformedValues.push(...projectedDynamicSeriesMeasures);
                        transformedValues.push(...projectedStaticSeriesMeasures);
                    } else {
                        // only dynamic series measures got transformed...
                        debug.assertValue(prototypeValueColumnsInfo.dynamicSeriesGroupCount, 'prototypeValueColumnsInfo.dynamicSeriesInstanceCount should have been populated if dynamic series measures got transformed');
                        debug.assertValue(prototypeValueColumnsInfo.dynamicSeriesMeasureSources, 'prototypeValueColumnsInfo.dynamicSeriesMeasureSources should have been populated if dynamic series measures got transformed');
                        
                        let dynamicSeriesMeasureSourceCount = prototypeValueColumnsInfo.dynamicSeriesMeasureSources.length;
                        let dynamicSeriesMeasureColumnCount = dynamicSeriesMeasureSourceCount * prototypeValueColumnsInfo.dynamicSeriesGroupCount;
                        transformedValues.splice(0, dynamicSeriesMeasureColumnCount, ...projectedDynamicSeriesMeasures);
                    }
                } else if (projectedStaticSeriesMeasures) {
                    // only static series measures got transformed...
                    debug.assertValue(prototypeValueColumnsInfo.staticSeriesMeasureSources, 'prototypeValueColumnsInfo.staticSeriesMeasureSources should have been populated if static series measures got transformed');
                    debug.assertValue(prototypeValueColumnsInfo.staticSeriesMeasureStartingIndex, 'prototypeValueColumnsInfo.staticSeriesMeasureStartingIndex should have been populated if static series measures got transformed');
                    
                    let staticSeriesMeasureSourceCount = prototypeValueColumnsInfo.staticSeriesMeasureSources.length;
                    transformedValues.splice(
                        prototypeValueColumnsInfo.staticSeriesMeasureStartingIndex,
                        staticSeriesMeasureSourceCount,
                        ...projectedStaticSeriesMeasures);
                }

                return transformedValues;
            }
        }

        /**
         * Returns an array containing the measures under dynamic series, ordered by projection order.
         * Returns an empty array of prototypeValues has dynamic series measures but they should be removed.
         * Returns undefined if prototypeValues already has all dyanmic series measure in the correct order.
         */
        function getDynamicSeriesMeasuresInProjectionOrder(
            prototypeValues: DataViewValueColumns,
            prototypeValueColumnsInfo: DataViewCategoricalValueColumnsInfo,
            measureRolesProjectionOrder: number[]): DataViewValueColumn[] {

            debug.assertValue(prototypeValues, 'prototypeValues');
            debug.assertValue(prototypeValueColumnsInfo, 'prototypeValueColumnsInfo');
            debug.assertValue(measureRolesProjectionOrder, 'measureRolesProjectionOrder');

            if (!prototypeValueColumnsInfo.dynamicSeriesGroupCount ||
                _.isEmpty(prototypeValueColumnsInfo.dynamicSeriesMeasureSources)) {
                return;
            }

            let projectedDynamicSeriesMeasureSources: MetadataColumnAndProjectionIndex[] =
                computeProjectedSourcesIfNeeded(
                    prototypeValueColumnsInfo.dynamicSeriesMeasureSources,
                    measureRolesProjectionOrder);

            if (projectedDynamicSeriesMeasureSources) {
                // number of measures under each of the dynamic series instance in the transformed values
                let projectedMeasureSourcesCount = projectedDynamicSeriesMeasureSources.length;
                if (projectedMeasureSourcesCount === 0) {
                    return [];
                }

                // number of measures under each of the dynamic series instance in the prototype values
                let prototypeMeaureSourcesCount = prototypeValueColumnsInfo.dynamicSeriesMeasureSources.length;

                let seriesCount = prototypeValueColumnsInfo.dynamicSeriesGroupCount;
                let projectedValues: DataViewValueColumn[] = [];

                // for each series group instance (e.g. 'Canada', 'US', ...)
                for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex++) {
                    let offsetInPrototypeValues = seriesIndex * prototypeMeaureSourcesCount;

                    // for each measure value source being projected (e.g. Revenue, Quantity, ...) 
                    for (let projectedMeasureIndex = 0; projectedMeasureIndex < projectedMeasureSourcesCount; projectedMeasureIndex++) {
                        let prototypeMeasureSourceIndex = projectedDynamicSeriesMeasureSources[projectedMeasureIndex].sourceIndex;
                        let valueColumn = prototypeValues[offsetInPrototypeValues + prototypeMeasureSourceIndex];
                        projectedValues.push(valueColumn);
                    }
                }

                return projectedValues;
            }
        }

        function getStaticSeriesMeasuresInProjectionOrder(
            prototypeValues: DataViewValueColumns,
            prototypeValueColumnsInfo: DataViewCategoricalValueColumnsInfo,
            measureRolesProjectionOrder: number[]): DataViewValueColumn[] {

            debug.assertValue(prototypeValues, 'prototypeValues');
            debug.assertValue(prototypeValueColumnsInfo, 'prototypeValueColumnsInfo');
            debug.assertValue(measureRolesProjectionOrder, 'measureRolesProjectionOrder');

            if (_.isEmpty(prototypeValueColumnsInfo.staticSeriesMeasureSources)) {
                return;
            }

            let projectedStaticSeriesMeasureSources: MetadataColumnAndProjectionIndex[] =
                computeProjectedSourcesIfNeeded(
                    prototypeValueColumnsInfo.staticSeriesMeasureSources,
                    measureRolesProjectionOrder);
            
            if (projectedStaticSeriesMeasureSources) {
                // number of measures under the static series in the transformed values
                let projectedMeasureSourcesCount = projectedStaticSeriesMeasureSources.length;
                if (projectedMeasureSourcesCount === 0) {
                    return [];
                }

                let offsetInPrototypeValues = prototypeValueColumnsInfo.staticSeriesMeasureStartingIndex;
                let projectedValues: DataViewValueColumn[] = [];

                // for each measure value source being projected (e.g. Revenue, Quantity, ...) 
                for (let projectedMeasureIndex = 0; projectedMeasureIndex < projectedMeasureSourcesCount; projectedMeasureIndex++) {
                    let prototypeMeasureSourceIndex = projectedStaticSeriesMeasureSources[projectedMeasureIndex].sourceIndex;
                    let valueColumn = prototypeValues[offsetInPrototypeValues + prototypeMeasureSourceIndex];
                    projectedValues.push(valueColumn);
                }

                return projectedValues;
            }
        }

        /**
         * Joins measureSources with projectionOrder and sorts the result by projection order.
         * If the resulting columns is in a different order than the specified measureSources, returns the result.
         * If the projection order indicates that the measures should be removed, returns an empty array.
         * Else, if measureSources is already in projection order, returns undefined. 
         */
        function computeProjectedSourcesIfNeeded(measureSources: DataViewMetadataColumn[], projectionOrder: number[]): MetadataColumnAndProjectionIndex[] {
            debug.assertValue(measureSources, 'measureSources');
            debug.assertValue(projectionOrder, 'projectionOrder');

            let jointMeasureSources: MetadataColumnAndProjectionIndex[] =
                DataViewMetadataColumnUtils.leftJoinMetadataColumnsAndProjectionOrder(
                    measureSources,
                    projectionOrder);
            
            // sorts by projection order and filters out non-projected sources:
            jointMeasureSources = _.chain(jointMeasureSources)
                .filter((column) => column.projectionOrderIndex !== undefined) // filter out the non-projected sources
                .sortBy((column) => column.projectionOrderIndex)
                .value();

            let isInProjectionOrder = ArrayExtensions.sequenceEqual(
                measureSources,
                jointMeasureSources,
                (a: DataViewMetadataColumn, b: MetadataColumnAndProjectionIndex) => a.index === b.metadataColumn.index);
            
            if (!isInProjectionOrder) {
                return jointMeasureSources;
            }
        }

        /** In the combo chart scenario, it is possible for a query DataView.categorical to have measures under both dynamic series and static series. */
        interface DataViewCategoricalValueColumnsInfo {
            secondaryAxisSource?: DataViewMetadataColumn;
            dynamicSeriesGroupCount?: number;
            dynamicSeriesMeasureSources?: DataViewMetadataColumn[];

            /**
             * The index of the first static measure column in the DataViewValueColumns array.
             * Undefined if there is no static series measure.
             */
            staticSeriesMeasureStartingIndex?: number;
            staticSeriesMeasureSources?: DataViewMetadataColumn[];
        }

        function extractValueColumnsInfo(values: DataViewValueColumns): DataViewCategoricalValueColumnsInfo {
            debug.assertValue(values, 'values');

            let secondaryAxisSource: DataViewMetadataColumn = values.source;
            let dynamicSeriesGroupCount;
            let dynamicSeriesMeasureSources: DataViewMetadataColumn[];
            let staticSeriesMeasureStartingIndex: number;
            let staticSeriesMeasureSources: DataViewMetadataColumn[];

            let valueGroups = values.grouped();
            if (secondaryAxisSource) {
                dynamicSeriesMeasureSources = getMeasureSourcesInFirstGroupInstance(valueGroups);

                // Note that it is possible for a query DataView's categorical to have measure(s) under both dynamic series 
                // and static series (e.g. for combo chart). In that case, the static series measures can be found in
                // the values array after all dynamic series measures.
                dynamicSeriesGroupCount = valueGroups.length;
                let dynamicSeriesMeasureSourceCount = _.size(dynamicSeriesMeasureSources);
                let dynamicSeriesMeasureColumnCount = dynamicSeriesGroupCount * dynamicSeriesMeasureSourceCount;
                let staticSeriesMeasureColumnCount = values.length - dynamicSeriesMeasureColumnCount;
                if (staticSeriesMeasureColumnCount > 0) {
                    staticSeriesMeasureStartingIndex = dynamicSeriesMeasureColumnCount;
                    staticSeriesMeasureSources = _.chain(values)
                        .takeRight(staticSeriesMeasureColumnCount)
                        .map((measureColumn) => measureColumn.source)
                        .value();
                }
            } else {
                staticSeriesMeasureStartingIndex = 0;
                staticSeriesMeasureSources = getMeasureSourcesInFirstGroupInstance(valueGroups);
            }

            return {
                secondaryAxisSource: secondaryAxisSource,
                dynamicSeriesGroupCount: dynamicSeriesGroupCount,
                dynamicSeriesMeasureSources: dynamicSeriesMeasureSources,
                staticSeriesMeasureStartingIndex: staticSeriesMeasureStartingIndex,
                staticSeriesMeasureSources: staticSeriesMeasureSources,
            };
        }

        /**
         * If the specified series is non-empty, returns the DataViewMetadataColumn objects 
         * from the measure columns in the first series instance.
         * If there is no measure under the series, returns empty array. 
         * If the specified series is empty (i.e. there are no series instances), returns undefined.
         */
        function getMeasureSourcesInFirstGroupInstance(groups: DataViewValueColumnGroup[]): DataViewMetadataColumn[] {
            debug.assertValue(groups, 'groups');

            if (!_.isEmpty(groups)) {
                let firstGroup = groups[0];
                return _.map(firstGroup.values, (measureColumn) => measureColumn.source);
            }
        }
    }
}
