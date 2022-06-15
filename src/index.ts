/*
 * life360api.js
 *
 * Author: MiGoller
 * 
 * Copyright (c) 2022 MiGoller
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { v4 as uuidv4} from "uuid";

/**
 * Hard-coded "CLIENT_SECRET": Has to be identified and verified after Life360 publishes a new version of the mobile app!
 */
const LIFE360_CLIENT_SECRET = "YnJ1czR0ZXZhcHV0UmVadWNydUJSVXdVYnJFTUVDN1VYZTJlUEhhYjpSdUt1cHJBQ3JhbWVzV1UydVRyZVF1bXVtYTdhemFtQQ==";
const DEFAULT_CLIENT_VERSION = "22.6.0.532";
const DEFAULT_USER_AGENT = "SafetyMapKoko";

/**
 * The Life360 API URIs.
 * - login URL
 * - circles URL
 */
const ENDPOINT = {
    "LOGIN": "https://api-cloudfront.life360.com/v3/oauth2/token.json",
    "CIRCLES": "https://api-cloudfront.life360.com/v3/circles"
};

/**
 * Hooks into Life360 API.
 */
export class Life360Handler {
    private username: string | undefined;
    private password: string | undefined;
    private phonenumber: string | undefined;
    private countryCode: number | undefined;
    private auth: { access_token: string; token_type: string; };
    private deviceId: string | undefined;
    private clientVersion: string | undefined;
    private userAgent: string | undefined;

    /**
     * Creates a new Life360 handler.
     * 
     * You MUST provide `username` and `password` *OR* `countryCode`, `phonenumber` and `password` to login.
     * 
     * @param username E-mail address for login
     * @param password Private and secret password
     * @param phonenumber Phonenumber w/o countrycode for login
     * @param countryCode Phonenumber's countrycode with the plus (+)
     */
    constructor(username?: string, password?: string, phonenumber?: string, countryCode?: number, deviceId?: string, clientVersion?: string, userAgent?: string) {
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
        }
        else {
            // Too few credentials
            throw new Error("You MUST provide `username` and `password` *OR* `countryCode`, `phonenumber` and `password` to login.");
        }

        //  Generate temp. device ID?
        this.deviceId = deviceId || uuidv4();
        // if (deviceId) {
        //     this.deviceId = uuidParse(this.deviceId);
        // }
        // else {
        //     this.deviceId = uuidv4();
        // }

        //  Set custom client version?
        this.clientVersion = clientVersion || DEFAULT_CLIENT_VERSION;

        //  Set user agent
        this.userAgent = userAgent || DEFAULT_USER_AGENT;
    }

    /**
     * Creates an Life360 API request configuration object for Axios
     * @param url The request's `url`
     * @returns An AxiosRequestConfig to match Life360 API requirements
     */
    getApiRequestConfig(url: string): AxiosRequestConfig {
        if (!url) throw new Error("URL is missing or empty!");
        if (!this.isLoggedIn()) throw new Error("Not logged in. Please log in to Life360 first.");

        return {
            url: url,
            headers: {
                "Authorization": `${this.auth.token_type} ${this.auth.access_token}`,
                "X-Device-ID": this.deviceId,
                "User-Agent": `${this.userAgent}/${this.clientVersion}/${this.deviceId}`
            },
            responseType: "json"
        }
    }

    /**
     * Runs a request against the Lif360 API
     * @param requestConfig An `AxiosRequestConfig`
     * @returns The API's response object
     */
    private async apiRequest(requestConfig: AxiosRequestConfig): Promise<AxiosResponse> {
        if (!requestConfig) throw new Error("requestConfig is missing or empty!");
        try {
            return await axios.request(requestConfig);
        } catch (error: any) {
            if (error.response) 
                throw new Error(`${error.response.status} - ${error.response.statusText}`);
            else
                throw error;
        }
    }

    /**
     * Log in to the Life360 API
     * @returns Life360 `Auth` object
     */
    async login(): Promise<any> {
        //  Reset access token
        this.auth = {
            access_token: "",
            token_type: ""
        };

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
        } catch (error: any) { 
            if (error.response) 
                throw new Error(`${error.response.status} - ${error.response.statusText}`);
            else
                throw error;
        }

        // No access token required?
        if (!response.data["access_token"]) {
            throw new Error("Failed to get access token!")
        }
        
        //  Login succeeded
        this.auth = {
            access_token: response.data["access_token"],
            token_type: response.data["token_type"]

        };

        return this.auth;
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

        return true;
    }

    /**
     * Check if the current handler is logged in
     * @returns 
     */
    isLoggedIn(): boolean {
        return this.auth.access_token > "";
    }

    /**
     * Get the logged in user's Life360 circles.
     * @returns Array of Life360 circle objects
     */
    async getCircles(): Promise<any> {
        try {
            const response = await this.apiRequest(this.getApiRequestConfig(ENDPOINT.CIRCLES));
            
            if ((!response.data) || (!response.data.circles)) throw new Error("Suspicious API response: Circles object is missing.");

            if (response.data.circles.length == 0) console.warn("No circles in your Life360.");

            // console.log(response);
            return response.data.circles;
        } catch (error) {
            return { error };
        }
    }

    /**
     * Get a Life360 circle
     * @param circleId The Life360 circle's unique identifier
     * @returns A Life360 circle object
     */
    async getCircle(circleId: string): Promise<any> {
        try {
            const response = await this.apiRequest(this.getApiRequestConfig(`${ENDPOINT.CIRCLES}/${circleId}`));

            // console.log(response);
            if (response.data) return response.data;

            throw new Error(JSON.stringify(response));
        } catch (error) {
            return { error };
        }
    }

    /**
     * Get a Life360 circle's members
     * @param circleId The Life360 circle's unique identifier
     * @returns Array of Life360 member objects
     */
    async getCircleMembers(circleId: string): Promise<any> {
        try {
            const response = await this.apiRequest(this.getApiRequestConfig(`${ENDPOINT.CIRCLES}/${circleId}/members`));

            if ((!response.data) || (!response.data.members)) throw new Error("Suspicious API response: Members object is missing.");

            return response.data.members;

            // if (response.data) return response.data;
            // throw new Error(JSON.stringify(response));
        } catch (error) {
            return { error };
        }
    }

    /**
     * Get a Life360 circle's places
     * @param circleId The Life360 circle's unique identifier
     * @returns Array of Life360 place objects
     */
    async getCirclePlaces(circleId: string): Promise<any> {
        try {
            const response = await this.apiRequest(this.getApiRequestConfig(`${ENDPOINT.CIRCLES}/${circleId}/places`));

            if ((!response.data) || (!response.data.places)) throw new Error("Suspicious API response: Places object is missing.");

            return response.data.places;
            // // console.log(response);
            // if (response.data) return response.data;
            // throw new Error(JSON.stringify(response));
        } catch (error) {
            return { error };
        }
    }
}
