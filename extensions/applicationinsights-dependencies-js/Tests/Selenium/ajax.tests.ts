﻿/// <reference path="../TestFramework/TestClass.ts" />
import { AjaxMonitor } from "../../src/ajax";
import { RemoteDependencyData } from "@microsoft/applicationinsights-common";
import { AppInsightsCore, IConfiguration, ITelemetryItem, ITelemetryPlugin, IChannelControls } from "@microsoft/applicationinsights-core-js";

export class AjaxTests extends TestClass {
    
    private appInsightsMock = {
        trackDependency: (id: string, method: string, absoluteUrl: string, isAsync: boolean, totalTime: number, success: boolean) => { },
        trackDependencyData: (dependency: RemoteDependencyData) => { },
        context: {
            operation: {
                id: "asdf"
            },
            appId: () => "someid"
        },
        config: {
            disableCorrelationHeaders: false,
            enableCorsCorrelation: false
        }
    }
    private trackDependencySpy;

    public testInitialize() {
        this.trackDependencySpy = this.sandbox.spy(this.appInsightsMock, "trackDependencyData");
        this.trackDependencySpy.reset();
        var xhr = sinon.useFakeXMLHttpRequest();
    }

    public testCleanup() {
    }

    public registerTests() {
        this.testCase({
            name: "Dependencies Configuration: Config can be set from root config",
            test: () => {
                let ajaxMonitor = new AjaxMonitor();
                ajaxMonitor.initialize({
                    instrumentationKey: "instrumentation_key",
                    maxAjaxCallsPerView: 999,
                }, new AppInsightsCore(), []);

                Assert.equal(999, ajaxMonitor["_config"].maxAjaxCallsPerView, "Config options can be set from root config");
        }

        });

        this.testCase({
            name: "Ajax: xhr.open gets instrumented",
            test: () => {
                let ajaxMonitor = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = { instrumentationKey: "instrumentationKey", extensionConfig: {"AjaxPlugin": {}}};
                appInsightsCore.initialize(coreConfig, [ajaxMonitor, new TestChannelPlugin()]);
        
                // act
                var xhr = new XMLHttpRequest();                
                xhr.open("GET", "http://microsoft.com");

                // assert
                var ajaxData = (<any>xhr).ajaxData;
                Assert.equal("http://microsoft.com", ajaxData.requestUrl, "RequestUrl is collected correctly");
            }
        });

        this.testCase({
            name: "Ajax: successful request, ajax monitor doesn't change payload",
            test: () => {
                var callback = this.sandbox.spy();
                let ajaxMonitor = new AjaxMonitor();
                let appInsightsCore = new AppInsightsCore();
                let coreConfig = { instrumentationKey: "instrumentationKey", extensionConfig: {"AjaxPlugin": {}}};
                appInsightsCore.initialize(coreConfig, [ajaxMonitor, new TestChannelPlugin()]);

                // Act
                var xhr = new XMLHttpRequest();
                xhr.onload = callback;
                xhr.open("GET", "/bla");
                xhr.send();

                
                // Emulate response
                (<any>xhr).respond(200, { "Content-Type": "application/json" }, "bla");
                Assert.ok((<any>ajaxMonitor)._trackAjaxAttempts === 1, "TrackAjax is called");
                                
                // Assert
                var result = callback.args[0][0].target;
                Assert.ok(callback.called, "Ajax callback is called");
                Assert.equal("bla", result.responseText, "Expected result match");
                Assert.equal(200, result.status, "Expected 200 response code");
                Assert.equal(4, xhr.readyState, "Expected readyState is 4 after request is finished");
            }
        });

        // Todo: uncomment tests
        // this.testCase({
        //     name: "Ajax: custom onreadystatechange gets called",
        //     test: () => {
        //         var onreadystatechangeSpy = this.sandbox.spy();
        //         var ajax = new AjaxMonitor();

        //         // Act
        //         var xhr = new XMLHttpRequest();
        //         xhr.onreadystatechange = onreadystatechangeSpy;
        //         xhr.open("GET", "/bla");
        //         xhr.send();

        //         Assert.ok(!this.trackDependencySpy.called, "TrackAjax should not be called yet");

        //         // Emulate response                
        //         (<any>xhr).respond();

        //         // Assert
        //         Assert.ok(this.trackDependencySpy.called, "TrackAjax is called");
        //         Assert.ok(onreadystatechangeSpy.called, "custom onreadystatechange should be called");

        //     }
        // });

        // this.testCase({
        //     name: "Ajax: 200 means success",
        //     test: () => {
        //         var ajax = new AjaxMonitor();
        //         // Act
        //         var xhr = new XMLHttpRequest();
        //         xhr.open("GET", "/bla");
        //         xhr.send();
                
        //         // Emulate response                
        //         (<any>xhr).respond(200, {}, "");

        //         // Assert
        //         Assert.equal(true, this.trackDependencySpy.args[0][0].success, "TrackAjax should receive true as a 'success' argument");

        //     }
        // });

        // this.testCase({
        //     name: "Ajax: non 200 means failure",
        //     test: () => {
        //         var ajax = new AjaxMonitor();

        //         // Act
        //         var xhr = new XMLHttpRequest();
        //         xhr.open("GET", "/bla");
        //         xhr.send();
                
        //         // Emulate response                
        //         (<any>xhr).respond(404, {}, "");

        //         // Assert
        //         Assert.equal(false, this.trackDependencySpy.args[0][0].success, "TrackAjax should receive false as a 'success' argument");

        //     }
        // });

        // [200, 201, 202, 203, 204, 301, 302, 303, 304].forEach((responseCode) => {
        //     this.testCase({
        //         name: "Ajax: test success http response code: " + responseCode,
        //         test: () => {
        //             this.testAjaxSuccess(responseCode, true);
        //         }
        //     })
        // });

        // [400, 401, 402, 403, 404, 500, 501].forEach((responseCode) => {
        //     this.testCase({
        //         name: "Ajax: test failure http response code: " + responseCode,
        //         test: () => {
        //             this.testAjaxSuccess(responseCode, false);
        //         }
        //     })
        // });

        // this.testCase({
        //     name: "Ajax: overriding ready state change handlers in all possible ways",
        //     test: () => {
        //         var ajax = new AjaxMonitor();
        //         var cb1 = this.sandbox.spy();
        //         var cb2 = this.sandbox.spy();
        //         var cb3 = this.sandbox.spy();
        //         var cb4 = this.sandbox.spy();
        //         var cb5 = this.sandbox.spy();
        //         var cb6 = this.sandbox.spy();
        //         var cb7 = this.sandbox.spy();

        //         // Act
        //         var xhr = new XMLHttpRequest();
        //         xhr.addEventListener("readystatechange", cb1);
        //         xhr.addEventListener("readystatechange", cb2);
        //         xhr.open("GET", "/bla");
        //         xhr.onreadystatechange = cb3;
        //         xhr.addEventListener("readystatechange", cb4);
        //         xhr.addEventListener("readystatechange", cb5);
        //         xhr.send();
        //         xhr.addEventListener("readystatechange", cb6);
        //         xhr.addEventListener("readystatechange", cb7);

        //         Assert.ok(!this.trackDependencySpy.called, "TrackAjax should not be called yet");

        //         // Emulate response                
        //         (<any>xhr).respond(404, {}, "");

        //         // Assert
        //         Assert.ok(this.trackDependencySpy.calledOnce, "TrackAjax should be called");
        //         Assert.ok(cb1.called, "callback 1 should be called");
        //         Assert.ok(cb2.called, "callback 2 should be called");
        //         Assert.ok(cb3.called, "callback 3 should be called");
        //         Assert.ok(cb4.called, "callback 4 should be called");
        //         Assert.ok(cb5.called, "callback 5 should be called");
        //         Assert.ok(cb6.called, "callback 6 should be called");
        //         Assert.ok(cb7.called, "callback 7 should be called");

        //     }
        // });

        // this.testCase({
        //     name: "Ajax: test ajax duration is calculated correctly",
        //     test: () => {
        //         var initialPerformance = window.performance;
        //         try {
        //             // Mocking window performance (sinon doesn't have it).
        //             // tick() is similar to sinon's clock.tick()
        //             (<any>window).performance = <any>{
        //                 current: 0,

        //                 now: function () {
        //                     return this.current;
        //                 },

        //                 tick: function (ms: number) {
        //                     this.current += ms;
        //                 },

        //                 timing: initialPerformance.timing
        //             };

        //             var ajax = new AjaxMonitor();
        //             // tick to set the initial time be non zero
        //             (<any>window.performance).tick(23);
                
        //             // Act
        //             var xhr = new XMLHttpRequest();
        //             var clock = this.clock;
        //             var expectedResponseDuration = 50;
        //             xhr.onreadystatechange = () => {
        //                 if (xhr.readyState == 3) {
        //                     (<any>window.performance).tick(expectedResponseDuration);
        //                 }
        //             }
        //             xhr.open("GET", "/bla");
        //             xhr.send();
        //             // Emulate response                
        //             (<any>xhr).respond(404, {}, "");

        //             // Assert
        //             Assert.ok(this.trackDependencySpy.calledOnce, "TrackAjax should be called");
        //             Assert.equal("00:00:00.050", this.trackDependencySpy.args[0][0].duration, "Ajax duration should match expected duration");
        //         } finally {
        //             (<any>window.performance).performance = initialPerformance;
        //         }
        //     }
        // });

        // this.testCase({
        //     name: "Ajax: 2nd invokation of xhr.send doesn't cause send wrapper to execute 2nd time",
        //     test: () => {
        //         var ajax = new AjaxMonitor();
        //         var spy = this.sandbox.spy(ajax, "sendHandler");
                
        //         // Act
        //         var xhr = new XMLHttpRequest();
        //         xhr.open("GET", "/bla");
        //         xhr.send();

        //         try {
        //             xhr.send();
        //         } catch (e) { }
                                

        //         // Assert
        //         Assert.ok(spy.calledOnce, "sendPrefixInstrumentor should be called only once");
        //     }
        // });

        // this.testCase({
        //     name: "Ajax: 2 invokation of xhr.open() doesn't cause send wrapper to execute 2nd time",
        //     test: () => {
        //         var ajax = new AjaxMonitor();
        //         var spy = this.sandbox.spy(ajax, "openHandler");
                
        //         // Act
        //         var xhr = new XMLHttpRequest();
        //         xhr.open("GET", "/bla");

        //         try {
        //             xhr.open("GET", "/bla");
        //         } catch (e) { }
                                

        //         // Assert
        //         Assert.ok(spy.calledOnce, "sendPrefixInstrumentor should be called only once");
        //     }
        // });
    }

    private testAjaxSuccess(responseCode: number, success: boolean) {
        var ajax = new AjaxMonitor();

        // Act
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/bla");
        xhr.send();
                
        // Emulate response                
        (<any>xhr).respond(responseCode, {}, "");

        // Assert
        Assert.equal(success, this.trackDependencySpy.args[0][0].success, "TrackAjax should receive " + success + " as a 'success' argument");
    }
}

class TestChannelPlugin implements IChannelControls {

    public isFlushInvoked = false;
    public isTearDownInvoked = false;
    public isResumeInvoked = false;
    public isPauseInvoked = false;

    constructor() {
        this.processTelemetry = this._processTelemetry.bind(this);
    }
    public pause(): void {
        this.isPauseInvoked = true;
    }    
    
    public resume(): void {
        this.isResumeInvoked = true;
    }

    public teardown(): void {
        this.isTearDownInvoked = true;
    }

    flush(async?: boolean, callBack?: () => void): void {
        this.isFlushInvoked = true;
        if (callBack) {
            callBack();
        }
    }

    public processTelemetry;

    public identifier = "Sender";
    
    setNextPlugin(next: ITelemetryPlugin) {
        // no next setup
    }

    public priority: number = 201;

    public initialize = (config: IConfiguration) => {
    }

    private _processTelemetry(env: ITelemetryItem) {

    }
}

class TestAjaxMonitor extends AjaxMonitor {

}