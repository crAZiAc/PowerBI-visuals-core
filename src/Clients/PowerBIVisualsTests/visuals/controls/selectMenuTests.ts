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

module powerbitests {
    import SelectMenu = powerbi.visual.controls.SelectMenu;
    import SelectMenuSettings = powerbi.visual.controls.SelectMenuSettings;

    const PopupSelector = ".ui-selectmenu-menu";
    const ButtonSelector = ".ui-selectmenu-button";
    const MenuSelector = "select";

    let settings: SelectMenuSettings;

    beforeEach(() => {
        let options = [{
            text: "Option 1",
            value: "1"
        }, {
                text: "Option 2",
                value: "2"
            },
            {
                text: "Option 4",
                value: "3"
            },
            {
                text: "Option 4",
                value: "4"
            }];
        settings = {
            onChange: null,
            options: options
        };
    });

    describe("SelectMenu", () => {
        describe(".getScale", () => {
            it("1 for null/undefined element", () => {
                expect(SelectMenu.getScale(null)).toBe(1);
                expect(SelectMenu.getScale(undefined)).toBe(1);
            });

            it("Exect value for parent element", () => {
                let scale = 2.34;
                let scaledElement = InJs.DomFactory.div().appendTo($("body"));
                scaledElement.css({
                    transform: "scale(" + scale + ")",
                    width: 100,
                    height: 100
                });

                let element = InJs.DomFactory.div().appendTo(scaledElement);
                expect(SelectMenu.getScale(element)).toBe(scale);
            });

            it("Exect 1 for parent element with no scale", () => {
                let parentElement = InJs.DomFactory.div().appendTo($("body"));
                parentElement.css({
                    width: 100,
                    height: 100,
                    transform: "rotatate(7deg)"
                });

                let element = InJs.DomFactory.div().appendTo(parentElement);
                expect(SelectMenu.getScale(element)).toBe(1);
            });

            it("Scaled parent on top of dom.", () => {
                let scale = 2.34;
                let scaledElement = InJs.DomFactory.div().appendTo($("body"));
                scaledElement.css({
                    transform: "scale(" + scale + ")",
                    width: 100,
                    height: 100
                });

                let element = scaledElement;
                for (let index = 0; index < 100; index++) {
                    element = InJs.DomFactory.div().appendTo(element);
                }

                expect(SelectMenu.getScale(element)).toBe(scale);
            });
        });

        describe(".render", () => {
            let container: JQuery;
            let menu = {
                render: (<any>SelectMenu.prototype).init,
                applyStyles: (<any>SelectMenu.prototype).applyStyles,
                settings: null,
                fixScalePosition: () => { }
            };

            beforeEach(() => {
                container = InJs.DomFactory.div().appendTo($("body"));
                menu.settings = settings;
                settings.container = container;
                menu.render();
            });

            afterEach(() => {
                container.remove();
                container = null;
            });

            it("Menu is created", () => {
                expect(settings.container.find(ButtonSelector).length).toBe(1);
                expect(settings.container.find(PopupSelector).length).toBe(1);
            });

            it("Options are set", () => {
                let select = container.find(MenuSelector);
                select.selectmenu("open");
                let popup = settings.container.find(PopupSelector);
                let text = popup.text();
                for (let option of settings.options) {
                    expect(text.indexOf(option.text)).toBeGreaterThan(-1);
                }
            });

            it("First option is selected by default", () => {
                let button = container.find(ButtonSelector);
                let text = button.text();
                expect(text.indexOf(settings.options[0].text)).toBeGreaterThan(-1);

            });

            it("Fix position gets called on open", () => {
                spyOn(menu, "fixScalePosition");
                let select = container.find(MenuSelector);
                select.selectmenu("open");
                expect(menu.fixScalePosition).toHaveBeenCalledTimes(1);
            });
        });

        describe(".applyStyles", () => {
            let container: JQuery;
            let menu = {
                render: (<any>SelectMenu.prototype).init,
                applyStyles: (<any>SelectMenu.prototype).applyStyles,
                settings: null,
            };

            beforeEach(() => {
                container = InJs.DomFactory.div().appendTo($("body"));
                settings.container = container;
                settings.css = {
                    padding: 2,
                    margin: 2
                };
                menu.settings = settings;
                menu.render();
                menu.applyStyles();
            });

            afterEach(() => {
                container.remove();
                container = null;
            });

            it("Style applied for button", () => {
                let button = container.find(ButtonSelector);
                expect(button.css("padding")).toBe("2px");
                expect(button.css("margin")).toBe("2px");
            });

            it("Style applied for menu", () => {
                let popup = container.find(PopupSelector);
                expect(popup.css("padding")).toBe("2px");
                expect(popup.css("margin")).toBe("2px");
            });
        });
    });
}