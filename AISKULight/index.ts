// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IConfiguration,
    AppInsightsCore,
    IAppInsightsCore,
    _InternalMessageId,
    CoreUtils,
    ITelemetryItem
} from "@microsoft/applicationinsights-core-js";
import { IConfig } from "@microsoft/applicationinsights-common";
import { Sender } from "@microsoft/applicationinsights-channel-js";

"use strict";

/**
 * @export
 * @class ApplicationInsights
 */
export class ApplicationInsights {
    public config: IConfiguration;
    private core: IAppInsightsCore;

    /**
     * Creates an instance of ApplicationInsights.
     * @param {IConfiguration & IConfig} config
     * @memberof ApplicationInsights
     */
    constructor(config: IConfiguration & IConfig) {
        // initialize the queue and config in case they are undefined
        if (
            CoreUtils.isNullOrUndefined(config) ||
            CoreUtils.isNullOrUndefined(config.instrumentationKey)
        ) {
            throw new Error("Invalid input configuration");
        }
        this.config = config;

        this.initialize();
    }

    /**
     * Initialize this instance of ApplicationInsights
     *
     * @memberof ApplicationInsights
     */
    public initialize(): void {
        this.core = new AppInsightsCore();
        let extensions = [];
        let appInsightsChannel: Sender = new Sender();

        extensions.push(appInsightsChannel);

        // initialize core
        this.core.initialize(this.config, extensions);

        // initialize extensions
        appInsightsChannel.initialize(this.config, this.core, extensions);
    }

    /**
     * Send a manually constructed custom event
     *
     * @param {ITelemetryItem} item
     * @memberof ApplicationInsights
     */
    public track(item: ITelemetryItem) {
        this.core.track(item);
    }

    /**
     * Immediately send all batched telemetry
     * @param {boolean} [async=true]
     * @memberof ApplicationInsights
     */
    public flush(async: boolean = true) {
        this.core.getTransmissionControls().forEach(controls => {
            controls.forEach(plugin => {
                async
                    ? (<Sender>plugin).flush()
                    : (<Sender>plugin).triggerSend(async);
            });
        });
    }
}

export {
    IConfiguration,
    AppInsightsCore,
    IAppInsightsCore,
    CoreUtils,
    ITelemetryItem
} from "@microsoft/applicationinsights-core-js";
export {
    SeverityLevel,
    Event,
    Exception,
    Metric,
    PageView,
    PageViewPerformance,
    RemoteDependencyData,
    Trace
} from "@microsoft/applicationinsights-common";
export { Sender } from "@microsoft/applicationinsights-channel-js";