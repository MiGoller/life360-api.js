/**
 * life360-api.js
 *
 * @author MiGoller
 * @copyright 2021-2023 MiGoller 
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

import * as Life360 from "./Life360Types";

/**
 * Hard-coded "CLIENT_SECRET": Has to be identified and verified after Life360 publishes a new version of the mobile app!
 */
const LIFE360_CLIENT_SECRET = "YnJ1czR0ZXZhcHV0UmVadWNydUJSVXdVYnJFTUVDN1VYZTJlUEhhYjpSdUt1cHJBQ3JhbWVzV1UydVRyZVF1bXVtYTdhemFtQQ==";

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
const DEFAULT_API_BASE_URL = "https://api-cloudfront.life360.com";

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
 * Default value for automated reconnects
 */
const DEFAULT_AUTORECONNECT = true;

/**
 * Default value for time period in ms between tries to reconnect
 */
const DEFAULT_MSWAITFORRETRY = 1000;

/**
 * Default value for the maximum count of reconnects
 */
const DEFAULT_MAXRETRIESREQUEST = 3;

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
 * Life360Handler options for connection settings
 */
export type ConnectionSettings = {
    username?: string; 
    password?: string; 
    phonenumber?: string; 
    countryCode?: number; 
    deviceId?: string; 
    clientVersion?: string; 
    userAgent?: string;
    apiBaseURL?: string;
    autoReconnect?: boolean,
    msWaitForRetry?: number,
    maxTriesRequest?: number,
    session?: Life360.Session;
}

/**
 * Life360 API handler wrapper class.
 * @class
 * @name Life360Handler
 * @description Life360 API handler wrapper class.
 */
export class Life360Handler {
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
     * You MUST provide `username` and `password` *OR* `countryCode`, `phonenumber` and `password` *OR* `session` to login.
     * 
     * @constructor
     * @param username      E-mail address for login
     * @param password      Private and secret password
     * @param phonenumber   Phonenumber w/o countrycode for login
     * @param countryCode   Phonenumber's countrycode with the plus (+)
     * @param deviceId      Unique device ID (optional)
     * @param clientVersion Life360 client version (optional)
     * @param userAgent     Life360 HTTP user agent string (optional)
     * @param apiBaseURL    Life360 API base URL, e.g. https://www.life360.com (optional)
     * @param session       Life360 session (optional) e.g. previous session object
     */
    constructor(options: {
        username?: string, 
        password?: string, 
        phonenumber?: string, 
        countryCode?: number, 
        deviceId?: string, 
        clientVersion?: string, 
        userAgent?: string,
        apiBaseURL?: string
        session?: Life360.Session}) {
        
        //  Generate temp. device ID?
        this.deviceId = options.deviceId || createLife360DeviceID();
    
        //  Set custom client version?
        this.clientVersion = options.clientVersion || DEFAULT_CLIENT_VERSION;
    
        //  Set user agent
        this.userAgent = options.userAgent || DEFAULT_USER_AGENT;
    
        //  Set Life360 API endpoint
        this.apiBaseURL = options.apiBaseURL || DEFAULT_API_BASE_URL;

        //  Check credentials and session
        if ((options.username && options.password) || (options.countryCode && options.phonenumber && options.password) || options.session) {
            //  Initialize properties
            this.username = options.username || "";
            this.password = options.password || "";
            this.phonenumber = options.phonenumber || "";
            this.countryCode = options.countryCode || 1;
    
            //  Reuse previous session?
            if (options.session) {
                //  Reuse previous session.
                //  WARNING: The session might be outdated!
                this.life360session = new Life360.Session(options.session);

                this.auth = {
                    access_token: options.session.access_token,
                    token_type: options.session.token_type
                };
            }
            else {
                //  No session and no authentication token
                this.auth = {
                    access_token: "",
                    token_type: ""
                };
        
                this.life360session = undefined;
            }
    
            this.sessionCookies = [];
        }
        else {
            // Too few credentials
            throw new Error("You MUST provide `username` and `password` *OR* `countryCode`, `phonenumber` and `password` *OR* `session` to login.");
        }
    }

    /**
     * Returns the current Life360 session cookies
     * @returns Life360 session cookies
     */
    getSessionCookies(): any {
        return this.sessionCookies;
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
     * @function
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
     * @function
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
     * @function
     * @param requestConfig An `AxiosRequestConfig`
     * @returns The API's response object
     */
    async apiRequest(requestConfig: AxiosRequestConfig, checkResponseDataProperty?: string): Promise<AxiosResponse> {
        if (!requestConfig) throw new Error("requestConfig is missing or empty!");
        try {
            this.lastApiResponse = await axios.request(requestConfig);

            //  Check for required response data property?
            if (checkResponseDataProperty != undefined) {
                if ((!this.lastApiResponse.data) || (!this.lastApiResponse.data[checkResponseDataProperty])) {
                    //  Hopefully this will be a suspicious API response missing the data.
                    throw {
                        status: 406,
                        statusText: "Not Acceptable",
                        data: this.lastApiResponse.data
                    };
                }
            }

            //  Return the response
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
     * @function
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
                    "Authorization": `Basic ${LIFE360_CLIENT_SECRET}`,
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

        // return this.auth;
        return this.life360session;
    }

    /**
     * Log out from the Life360 API
     * @function
     * @returns true
     */
    logout(): boolean {
        //  Reset access token
        this.auth = {
            access_token: "",
            token_type: ""
        };

        this.life360session = undefined;
        
        return true;
    }

    /**
     * Check if the current handler is logged in
     * @function
     * @returns 
     */
    isLoggedIn(): boolean {
        return (this.life360session != undefined) && (this.life360session.access_token > "");
    }

    /**
     * Get the logged in user's Life360 circles.
     * @function
     * @returns Array of Life360 circle objects
     */
    async getCircles(): Promise<Life360.Circle[]> {
        try {
            const response = await this.apiRequest(this.getApiRequestConfig(ENDPOINT.CIRCLES), "circles");
            
            if (response.data.circles.length == 0) console.warn("No circles in your Life360.");

            return Life360.ParseCircles(response.data.circles);

        } catch (error) {
            this.lastError = error;
            throw error;
        }
    }

    /**
     * Get a Life360 circle
     * @function
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
     * @function
     * @param circleId The Life360 circle's unique identifier
     * @returns Array of Life360 member objects
     */
    async getCircleMembers(circleId: string): Promise<Life360.Member[]> {
        try {
            const response = await this.apiRequest(this.getApiRequestConfig(`${ENDPOINT.CIRCLES}/${circleId}/members`), "members");

            return Life360.ParseMembers(response.data.members);
        } catch (error) {
            this.lastError = error;
            throw error;
        }
    }

    /**
     * Get a Life360 circle's members' location data.
     * @function
     * @param circleId The Life360 circle's unique identifier
     * @returns Array of Life360 location objects
     */
    async getCircleMembersLocation(circleId: string): Promise<Life360.Location[]> {
        try {
            const response = await this.apiRequest(this.getApiRequestConfig(`${ENDPOINT.CIRCLES}/${circleId}/members/history`), "locations");

            return Life360.ParseLocations(response.data.locations);
        } catch (error) {
            this.lastError = error;
            throw error;
        }
    }

    /**
     * Request a location update for a circle member
     * @function
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

            const response = await this.apiRequest(requestConfig, "requestId");

            return new Life360.LocationRequest(response.data);
        } catch (error) {
            this.lastError = error;
            throw error;
        }
    }

    /**
     * Get a Life360 circle's places
     * @function
     * @param circleId The Life360 circle's unique identifier
     * @returns Array of Life360 place objects
     */
    async getCirclePlaces(circleId: string): Promise<Life360.Place[]> {
        try {
            const response = await this.apiRequest(this.getApiRequestConfig(`${ENDPOINT.CIRCLES}/${circleId}/places`), "places");

            return Life360.ParsePlaces(response.data.places);
        } catch (error) {
            this.lastError = error;
            throw error;
        }
    }

    /**
     * Get the members' preferences for a circle
     * @function
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
 * Advanced Life360 API handler class v2
 * @class
 */
export class Life360APIv2 extends Life360Handler {
    private autoReconnect = true;
    private msWaitForRetry = 1000;
    private maxTriesRequest = 3;

    /**
     * Creates a new advanced Life360 API v2 handler class.
     * 
     * You MUST provide `username` and `password` *OR* `countryCode`, `phonenumber` and `password` *OR* `session` to login.
     * 
     * @constructor
     * @param username          E-mail address for login
     * @param password          Private and secret password
     * @param phonenumber       Phonenumber w/o countrycode for login
     * @param countryCode       Phonenumber's countrycode with the plus (+)
     * @param deviceId          Unique device ID (optional)
     * @param clientVersion     Life360 client version (optional)
     * @param userAgent         Life360 HTTP user agent string (optional)
     * @param apiBaseURL        Life360 API base URL, e.g. https://www.life360.com (optional) 
     * @param autoReconnect     Set to `true` to let the handler automatically try to recconect after authorization issues.
     * @param msWaitForRetry    Time to wait (ms) before trying a requst again after failure
     * @param maxTriesRequest   Maximum amout of retries for a single request
     * @param options           Life360 connection settings
     */
    constructor(options: ConnectionSettings) {
        //assign defaults
        Object.assign({ 
            autoReconnect: DEFAULT_AUTORECONNECT, 
            msWaitForRetry: DEFAULT_MSWAITFORRETRY, 
            maxTriesRequest: DEFAULT_MAXRETRIESREQUEST }, 
            options);
        super(options);
        this.autoReconnect = options.autoReconnect || DEFAULT_AUTORECONNECT;
        this.msWaitForRetry = options.msWaitForRetry || DEFAULT_MSWAITFORRETRY;
        this.maxTriesRequest = options.maxTriesRequest || DEFAULT_MAXRETRIESREQUEST;
    }
    
    /**
     * Factory method to create a Life360API v2 instance from connection settings
     * @static
     * @function
     * @param options           Life360 connection settings
     * @returns                 Life360API v2 instance
     */
    public static fromConnectionSettings(
        options: ConnectionSettings): Life360APIv2 {
        return new Life360APIv2(options);
    }

    /**
     * Factory method to create a Life360API v2 instance from an existing session
     * @static
     * @function
     * @param session           Life360 session e.g. previous session object
     * @param options           Life360 connection settings (optional)
     * @returns                 Life360API v2 instance
     */
    public static fromSession(
        session: Life360.Session, 
        options: ConnectionSettings = {}): Life360APIv2 {
        return this.fromConnectionSettings(Object.assign(
            Object.assign({}, options),
            { session: session }));
    }

    /**
     * Factory method to create a Life360API v2 instance from an existing authentication token
     * @static
     * @function
     * @param authToken         Life360 authenticaton token
     * @param token_type        Token type (optional, defaults to `Bearer`)
     * @param options           Life360 connection settings (optional)
     * @returns                 Life360API v2 instance
     */
    public static fromAuthToken(
        authToken: string,
        token_type = "Bearer",
        options: ConnectionSettings = {}): Life360APIv2 {
            return this.fromConnectionSettings(Object.assign(
                Object.assign({}, options),
                { session: {
                    access_token: authToken,
                    token_type: token_type
                } }));
    }

    /**
     * Factory method to create a Life360API v2 instance from username (e-mail) and password
     * @static
     * @function
     * @param username          E-mail address for login
     * @param password          Private and secret password
     * @param options           Life360 connection settings (optional)
     * @returns                 Life360API v2 instance
     */
    public static fromUsername(
        username: string, 
        password: string, 
        options: ConnectionSettings = {}): Life360APIv2 {
        return this.fromConnectionSettings(
            Object.assign(Object.assign({}, options), 
            {
                username: username,
                password: password
            }));
    }

    /**
     * Factory method to create a Life360API v2 instance from phonenumber and password
     * @static
     * @function
     * @param countryCode       Phonenumber's countrycode with the plus (+)
     * @param phonenumber       Phonenumber w/o countrycode for login
     * @param password          Private and secret password
     * @param options           Life360 connection settings (optional)
     * @returns                 Life360API v2 instance
     */
    public static fromPhonenumber(
        countryCode: number,
        phonenumber: string, 
        password: string, 
        options: ConnectionSettings = {}): Life360APIv2 {
        return this.fromConnectionSettings(
            Object.assign(Object.assign({}, options), 
            {
                countryCode: countryCode,
                phonenumber: phonenumber,
                password: password
            }));
    }

    /**
     * Factory method to create a Life360API v2 instance from Life360API v1 paramater block
     * @static
     * @function
     * @param username          E-mail address for login
     * @param password          Private and secret password
     * @param phonenumber       Phonenumber w/o countrycode for login
     * @param countryCode       Phonenumber's countrycode with the plus (+)
     * @param deviceId          Unique device ID (optional)
     * @param clientVersion     Life360 client version (optional)
     * @param userAgent         Life360 HTTP user agent string (optional)
     * @param apiBaseURL        Life360 API base URL, e.g. https://www.life360.com (optional) 
     * @param autoReconnect     Set to `true` to let the handler automatically try to recconect after authorization issues.
     * @param msWaitForRetry    Time to wait (ms) before trying a requst again after failure
     * @param maxTriesRequest   Maximum amout of retries for a single request
     * @param session           Life360 session e.g. previous session object
     * @returns                 Life360API v2 instance
     */
    public static fromV1(
        username?: string, 
        password?: string, 
        phonenumber?: string, 
        countryCode?: number, 
        deviceId?: string, 
        clientVersion?: string, 
        userAgent?: string,
        apiBaseURL?: string,
        autoReconnect = DEFAULT_AUTORECONNECT,
        msWaitForRetry = DEFAULT_MSWAITFORRETRY,
        maxTriesRequest = DEFAULT_MAXRETRIESREQUEST,
        session?: Life360.Session): Life360APIv2 {
            return this.fromConnectionSettings(
                Object.assign(Object.assign({}, 
                {
                    username: username,
                    password: password,
                    countryCode: countryCode,
                    phonenumber: phonenumber,
                    deviceId: deviceId,
                    clientVersion: clientVersion,
                    userAgent: userAgent,
                    apiBaseURL: apiBaseURL,
                    autoReconnect: autoReconnect,
                    msWaitForRetry: msWaitForRetry,
                    maxTriesRequest: maxTriesRequest,
                }), 
                { session: session }));
    }

    /**
     * Runs a request against the Lif360 API
     * 
     * This method supports the `autoReconnect` feature and retries the requests a few times before failing.
     * @function
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

        // Wrapper for automated retries for temp. failing queries
        do {
            try {
                if (tries > 0) await sleep(this.msWaitForRetry);
                tries++;

                //  Now call the super method!
                myResponse = await super.apiRequest(requestConfig);

            } catch (error: any) {
                myResponse = undefined;

                //  Further actions depend on the status code
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
                    case 406:
                        //  Not acceptable
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

/**
 * Advanced Life360 API handler class v1
 * @deprecated since v0.3.1 . Switch to Life360v2 instead.
 * @class
 */
export class Life360API extends Life360APIv2 {
    /**
     * Creates a new advanced Life360 API handler class.
     * 
     * You MUST provide `username` and `password` *OR* `countryCode`, `phonenumber` and `password` *OR* `session` to login.
     * 
     * @constructor
     * @param username          E-mail address for login
     * @param password          Private and secret password
     * @param phonenumber       Phonenumber w/o countrycode for login
     * @param countryCode       Phonenumber's countrycode with the plus (+)
     * @param deviceId          Unique device ID (optional)
     * @param clientVersion     Life360 client version (optional)
     * @param userAgent         Life360 HTTP user agent string (optional)
     * @param apiBaseURL        Life360 API base URL, e.g. https://www.life360.com (optional) 
     * @param autoReconnect     Set to `true` to let the handler automatically try to recconect after authorization issues.
     * @param msWaitForRetry    Time to wait (ms) before trying a requst again after failure
     * @param maxTriesRequest   Maximum amout of retries for a single request
     * @param session           Life360 session (optional) e.g. previous session object
     */
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
        maxTriesRequest = 3,
        session?: Life360.Session) {
        super({
            username: username,
            password: password,
            phonenumber: phonenumber,
            countryCode: countryCode,
            deviceId: deviceId,
            clientVersion: clientVersion,
            userAgent: userAgent,
            apiBaseURL: apiBaseURL,
            autoReconnect: autoReconnect,
            msWaitForRetry: msWaitForRetry,
            maxTriesRequest: maxTriesRequest,
            session: session
        });
    }
}
