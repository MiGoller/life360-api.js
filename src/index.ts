/*
 * life360-api.js
 *
 * Author: MiGoller
 * 
 * Copyright (c) 2022 MiGoller
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { EventEmitter  } from "events";

import * as Life360 from "./Life360Types";

/**
 * Hard-coded "CLIENT_SECRET": Has to be identified and verified after Life360 publishes a new version of the mobile app!
 */
const LIFE360_CLIENT_SECRET = "U3dlcUFOQWdFVkVoVWt1cGVjcmVrYXN0ZXFhVGVXckFTV2E1dXN3MzpXMnZBV3JlY2hhUHJlZGFoVVJhZ1VYYWZyQW5hbWVqdQ==";

/**
 * Default Life360 client version: Has to be identified and verified after Life360 publishes a new version of the mobile app!
 */
const DEFAULT_CLIENT_VERSION = "22.6.0.532";

/**
 * Default HTTP user agent string: Has to be identified and verified after Life360 publishes a new version of the mobile app!
 */
const DEFAULT_USER_AGENT = "SafetyMapKoko";

/**
 * Default Life360 API base URL
 */
const DEFAULT_API_BASE_URL = "https://www.life360.com";

/**
 * The Life360 API URIs.
 * - login URL
 * - circles URL
 */
const ENDPOINT = {
    "LOGIN": "/v3/oauth2/token.json",
    "CIRCLES": "/v3/circles"
};

/**
 * Creates a random Life360 device ID.
 * @returns Random Life360 device ID
 */
export function createLife360DeviceID(): string {
    const bytes = Buffer.alloc(8);
    for (let i = 0; i < 8; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes.toString('hex');
}

/**
 * Creates a status message from the Axios response of an API request
 * @param response  The Axios response to parse 
 * @returns Status object
 */
function _getStatusMessageFromResponse(response: AxiosResponse<any>): any {
    const myError: any = {
        status: response.status,
        statusText: response.statusText,
    };

    if (response.data != undefined) {
        if ((response.data+"").startsWith("")) {
            myError.data = {
                errorMessage: response.statusText,
                url: `${response.config.baseURL}${response.config.url}`,
                status: response.status
            };
        }
        else {
            myError.data = response.data;
        }
    }

    return myError;
}

/**
 * Sleep method
 * @param ms Time to sleep in milliseconds
 * @returns void
 */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Life360 API handler wrapper class.
 */
export class Life360Handler extends EventEmitter {
    private username: string | undefined;
    private password: string | undefined;
    private phonenumber: string | undefined;
    private countryCode: number | undefined;
    private auth: { access_token: string; token_type: string; };
    private deviceId = "";
    private clientVersion: string = DEFAULT_CLIENT_VERSION;
    private userAgent: string = DEFAULT_USER_AGENT;
    private apiBaseURL: string = DEFAULT_API_BASE_URL;
    private life360session: Life360.Session | undefined;
    private sessionCookies: { cookie: string, expiresAt: number, path: string }[] = [];
    private sessionCookieHeader = "";
    private lastError: any | undefined = undefined;
    private lastApiResponse: any = undefined;

    /**
     * Creates a new Life360 handler.
     * 
     * You MUST provide `username` and `password` *OR* `countryCode`, `phonenumber` and `password` to login.
     * 
     * @param username      E-mail address for login
     * @param password      Private and secret password
     * @param phonenumber   Phonenumber w/o countrycode for login
     * @param countryCode   Phonenumber's countrycode with the plus (+)
     * @param deviceId      Unique device ID (optional)
     * @param clientVersion Life360 client version (optional)
     * @param userAgent     Life360 HTTP user agent string (optional)
     * @param apiBaseURL    Life360 API base URL, e.g. https://www.life360.com (optional)
     */
    constructor(
        username?: string, 
        password?: string, 
        phonenumber?: string, 
        countryCode?: number, 
        deviceId?: string, 
        clientVersion?: string, 
        userAgent?: string,
        apiBaseURL?: string) {
        super();
        //  Check credentials
        if ((username && password) || (countryCode && phonenumber && password)) {
            //  Initialize properties
            this.username = username || "";
            this.password = password || "";
            this.phonenumber = phonenumber || "";
            this.countryCode = countryCode || 1;

            this.auth = {
                access_token: "",
                token_type: ""
            };

            this.life360session = undefined;

            this.sessionCookies = [];
        }
        else {
            // Too few credentials
            throw new Error("You MUST provide `username` and `password` *OR* `countryCode`, `phonenumber` and `password` to login.");
        }

        //  Generate temp. device ID?
        this.deviceId = deviceId || createLife360DeviceID();

        //  Set custom client version?
        this.clientVersion = clientVersion || DEFAULT_CLIENT_VERSION;

        //  Set user agent
        this.userAgent = userAgent || DEFAULT_USER_AGENT;

        //  Set Life360 API endpoint
        this.apiBaseURL = apiBaseURL || DEFAULT_API_BASE_URL;
    }

    /**
     * Returns the last error object if any.
     * @returns The last error object or undefined
     */
    getLastError(): any {
        return this.lastError;
    }

    /**
     * Returns the last Life360 API response.
     * @returns The last API response
     */
    getLastApiResponse(): any {
        return this.lastApiResponse;
    }

    /**
     * Creates an Life360 API request configuration object for Axios
     * @param endpointPath The request's `endpoint path`
     * @param method The axios request method; defaults to `get` (s. https://axios-http.com/docs/req_config)
     * @param apiBaseURL The Life360 API base URL or set to special URL e.g. `https://android.life360.com`
     * @returns An AxiosRequestConfig to match Life360 API requirements
     */
    getApiRequestConfig(endpointPath: string, method = "get", apiBaseURL = this.apiBaseURL): AxiosRequestConfig {
        if (!endpointPath) throw new Error("endpointPath is missing or empty!");
        if (!this.isLoggedIn()) throw new Error("Not logged in. Please log in to Life360 first.");

        return {
            method: method,
            baseURL: apiBaseURL,
            url: endpointPath,
            headers: {
                "Authorization": `${this.auth.token_type} ${this.auth.access_token}`,
                "X-Device-ID": this.deviceId,
                "User-Agent": `${this.userAgent}/${this.clientVersion}/${this.deviceId}`,
                "Cookie": this.sessionCookieHeader
            },
            responseType: "json"
        }
    }

    /**
     * Parses the `set-cookie` header from the Life360 API response
     * @param cookiesHeaders An array of session cookies from the response
     * @returns Session cookie for further requests
     */
    private parseLoginResponseCookies(cookiesHeaders: string[]): { cookie: string, expiresAt: number, path: string }[] {
        const myCookies = [];
        this.sessionCookies = [];
        for (let index = 0; index < cookiesHeaders.length; index++) {
            const cookieSettings = cookiesHeaders[index].split(";");
            this.sessionCookies.push( {
                cookie: cookieSettings[0].trim(),
                expiresAt: Date.parse(cookieSettings[1].trim()),
                path: cookieSettings[2].trim()
            } );

            myCookies.push(cookieSettings[0].trim());
        }

        //  Set session cookie header for further request.
        this.sessionCookieHeader = myCookies.join(";");

        return this.sessionCookies;
    }

    /**
     * Runs a request against the Lif360 API
     * @param requestConfig An `AxiosRequestConfig`
     * @returns The API's response object
     */
    async apiRequest(requestConfig: AxiosRequestConfig): Promise<AxiosResponse> {
        if (!requestConfig) throw new Error("requestConfig is missing or empty!");
        try {
            this.lastApiResponse = await axios.request(requestConfig);
            return this.lastApiResponse;
        } catch (error: any) {
            this.lastError = error;
            if (error.response) 
                throw _getStatusMessageFromResponse(error.response);
            else
                throw error;
        }
    }

    /**
     * Log in to the Life360 API
     * @returns Life360 `Session` object
     */
    async login(): Promise<Life360.Session> {
        //  Reset access token
        this.auth = {
            access_token: "",
            token_type: ""
        };

        this.life360session = undefined;

        let response: any;
        
        const authData = {
            grant_type: "password",
            username: this.username,
            password: this.password,
            countryCode: this.countryCode,
            phone: this.phonenumber
        };

        try {
            response = await axios.request({
                baseURL: this.apiBaseURL,
                url: ENDPOINT.LOGIN,
                method: "POST",
                data: authData,
                headers: {
                    "Authorization": `Authorization: Basic ${LIFE360_CLIENT_SECRET}`,
                    "Content-Type" : "application/json",
                    "X-Device-ID": this.deviceId,
                    "User-Agent": `${this.userAgent}/${this.clientVersion}/${this.deviceId}`
                },
                responseType: "json"
            });

            this.lastApiResponse = response;
        } catch (error: any) { 
            this.lastError = error;
            if (error.response) {
                // throw new Error(`${error.response.status} - ${error.response.statusText}`);
                throw _getStatusMessageFromResponse(error.response);
            }
            else
                throw error;
        }

        // No access token required?
        if (!response.data["access_token"]) {
            throw new Error("Failed to get access token!")
        }
        
        //  Login succeeded
        this.parseLoginResponseCookies(response.headers["set-cookie"]);

        this.life360session = new Life360.Session(response.data);

        this.auth = {
            access_token: response.data["access_token"],
            token_type: response.data["token_type"]

        };

        this.emit("loggedIn", this.life360session != undefined);

        // return this.auth;
        return this.life360session;
    }

    /**
     * Log out from the Life360 API
     * @returns true
     */
    logout(): boolean {
        //  Reset access token
        this.auth = {
            access_token: "",
            token_type: ""
        };

        this.life360session = undefined;

        this.emit("loggedIn", this.life360session != undefined);
        
        return true;
    }

    /**
     * Check if the current handler is logged in
     * @returns 
     */
    isLoggedIn(): boolean {
        return (this.life360session != undefined) && (this.life360session.access_token > "");
    }

    /**
     * Get the logged in user's Life360 circles.
     * @returns Array of Life360 circle objects
     */
    async getCircles(): Promise<Life360.Circle[]> {
        try {
            const response = await this.apiRequest(this.getApiRequestConfig(ENDPOINT.CIRCLES));
            
            if ((!response.data) || (!response.data.circles)) throw new Error("Suspicious API response: Circles object is missing.");

            if (response.data.circles.length == 0) console.warn("No circles in your Life360.");

            return Life360.ParseCircles(response.data.circles);

        } catch (error) {
            this.lastError = error;
            throw error;
        }
    }

    /**
     * Get a Life360 circle
     * @param circleId The Life360 circle's unique identifier
     * @returns A Life360 circle object
     */
    async getCircle(circleId: string): Promise<Life360.Circle> {
        try {
            const response = await this.apiRequest(this.getApiRequestConfig(`${ENDPOINT.CIRCLES}/${circleId}`));

            // console.log(response);
            if (response.data) {
                // return response.data;
                const myCircle = new Life360.Circle(response.data);
                return myCircle;
            }

            throw new Error(JSON.stringify(response));
        } catch (error) {
            this.lastError = error;
            throw error;
        }
    }

    /**
     * Get a Life360 circle's members
     * @param circleId The Life360 circle's unique identifier
     * @returns Array of Life360 member objects
     */
    async getCircleMembers(circleId: string): Promise<Life360.Member[]> {
        try {
            const response = await this.apiRequest(this.getApiRequestConfig(`${ENDPOINT.CIRCLES}/${circleId}/members`));

            if ((!response.data) || (!response.data.members)) throw new Error("Suspicious API response: Members object is missing.");

            return Life360.ParseMembers(response.data.members);
        } catch (error) {
            this.lastError = error;
            throw error;
        }
    }

    /**
     * Get a Life360 circle's members' location data.
     * @param circleId The Life360 circle's unique identifier
     * @returns Array of Life360 location objects
     */
    async getCircleMembersLocation(circleId: string): Promise<Life360.Location[]> {
        try {
            const response = await this.apiRequest(this.getApiRequestConfig(`${ENDPOINT.CIRCLES}/${circleId}/members/history`));

            if ((!response.data) || (!response.data.locations)) throw new Error("Suspicious API response: Locations object is missing.");

            return Life360.ParseLocations(response.data.locations);
        } catch (error) {
            this.lastError = error;
            throw error;
        }
    }

    /**
     * Request a location update for a circle member
     * @param circleId The Life360 circle's unique identifier
     * @param userId The Life360 member's unique identifier
     * @returns `ìsPollable` and `requestId` .
     */
    async requestUserLocationUpdate(circleId: string, userId: string): Promise<Life360.LocationRequest> {
        try {
            //  Build POST request config
            const requestConfig = this.getApiRequestConfig(`${ENDPOINT.CIRCLES}/${circleId}/members/${userId}/request`, "post");
            requestConfig.data = {
                "type": "location"
            };

            const response = await this.apiRequest(requestConfig);

            if ((!response.data) || (!response.data.requestId)) throw new Error("Suspicious API response: Object is missing.");

            return new Life360.LocationRequest(response.data);
        } catch (error) {
            this.lastError = error;
            throw error;
        }
    }

    /**
     * Get a Life360 circle's places
     * @param circleId The Life360 circle's unique identifier
     * @returns Array of Life360 place objects
     */
    async getCirclePlaces(circleId: string): Promise<Life360.Place[]> {
        try {
            const response = await this.apiRequest(this.getApiRequestConfig(`${ENDPOINT.CIRCLES}/${circleId}/places`));

            if ((!response.data) || (!response.data.places)) throw new Error("Suspicious API response: Places object is missing.");

            return Life360.ParsePlaces(response.data.places);
        } catch (error) {
            this.lastError = error;
            throw error;
        }
    }

    /**
     * Get the members' preferences for a circle
     * @param circleId The Life360 circle's unique identifier
     * @returns 
     */
    async getCircleMembersPreferences(circleId: string): Promise<Life360.MemberPreferences> {
        try {
            const response = await this.apiRequest(this.getApiRequestConfig(`${ENDPOINT.CIRCLES}/${circleId}/members/preferences`));

            if (response.data) {
                const myMembersPrefs= new Life360.MemberPreferences(response.data);
                return myMembersPrefs;
            }

            throw new Error(JSON.stringify(response));
        } catch (error) {
            this.lastError = error;
            throw error;
        }
    }
}

/**
 * Advanced Life360 API handler class
 */
export class Life360API extends Life360Handler {
    private autoReconnect = true;
    private msWaitForRetry = 1000;
    private maxTriesRequest = 3;

    constructor(
        username?: string, 
        password?: string, 
        phonenumber?: string, 
        countryCode?: number, 
        deviceId?: string, 
        clientVersion?: string, 
        userAgent?: string,
        apiBaseURL?: string,
        autoReconnect = true,
        msWaitForRetry = 1000,
        maxTriesRequest = 3) {
        super(username, password, phonenumber,countryCode, deviceId,clientVersion, userAgent, apiBaseURL);
        this.autoReconnect = autoReconnect;
        this.msWaitForRetry = msWaitForRetry;
        this.maxTriesRequest = maxTriesRequest;
    }
    
    /**
     * Runs a request against the Lif360 API
     * 
     * This method supports the `autoReconnect` feature and retries the requests a few times before failing.
     * @param requestConfig An `AxiosRequestConfig`
     * @returns The API's response object
     */
    async apiRequest(requestConfig: AxiosRequestConfig): Promise<AxiosResponse> {
        if (!this.isLoggedIn() && this.autoReconnect) {
            //  Try to reconnect (login) to the Life360 API
            console.log("Reconnecting ...");
            await this.login();
        }

        let myResponse: any = undefined;
        let tries = 0;

        do {
            try {
                if (tries > 0) await sleep(this.msWaitForRetry);
                tries++;
                console.log(`API-Request #${tries} ...`);

                //  Now call the super method!
                myResponse = await super.apiRequest(requestConfig);

            } catch (error: any) {
                myResponse = undefined;

                switch (error.status) {
                    case 403:
                        //  Access denied (Forbidden)
                        if (this.autoReconnect) {
                            //  Try to reconnect (login) and try again
                            this.logout();
                        }
                        else {
                            //  Fail.
                            tries = this.maxTriesRequest;
                        }
                        break;
                    case 404:
                        //  Not found
                        break;
                    default:
                        throw error;
                        break;
                }
            }
        } while ((tries < this.maxTriesRequest) && (myResponse == undefined));
        
        if (myResponse == undefined) {
            //  API request finally failed!
            throw _getStatusMessageFromResponse(this.getLastError().response);
        }

        return myResponse;
    }
}
