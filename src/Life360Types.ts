/*
 * life360-api.js
 *
 * Author: MiGoller
 * 
 * Copyright (c) 2021-2022 MiGoller
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

class TypeBase {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    constructor(data?: any) {
        Object.assign(this, data);
    }
}

/**
 * Life360 communication detail
 */
export interface Communication {
    channel: string;
    value:   string;
    type:    null | string;
}


/**
 * Life360 session information
 */
export interface Session {
    access_token: string;
    token_type:   string;
    onboarding:   boolean;
    user:         User;
    cobranding:   any[];
    promotions:   any[];
    state:        null;
}

/**
 * Life360 user (login account) information
 */
export interface User {
    id:             string;
    firstName:      string;
    lastName:       string;
    loginEmail:     string;
    loginPhone:     string;
    avatar:         string;
    locale:         string;
    language:       string;
    created:        number;
    avatarAuthor:   null;
    settings:       UserSettings;
    communications: Communication[];
    cobranding:     any[];
}

/**
 * Life360 user settings
 */
export interface UserSettings {
    map:           MapSettings;
    alerts:        AlertsSettings;
    zendrive:      null;
    locale:        string;
    unitOfMeasure: string;
    dateFormat:    string;
    timeZone:      string;
}

/**
 * Life360 alerts settings (user setting)
 */
export interface AlertsSettings {
    crime: boolean;
    sound: boolean;
}

/**
 * Life360 maps settings (user setting)
 */
export interface MapSettings {
    police:        boolean;
    fire:          boolean;
    hospital:      boolean;
    sexOffenders:  boolean;
    crime:         boolean;
    crimeDuration: string;
    family:        boolean;
    advisor:       boolean;
    placeRadius:   boolean;
    memberRadius:  boolean;
}

/**
 * Life360 circle
 */
export interface Circle {
    id:                  string;
    name:                string;
    color:               string;
    type:                string;
    createdAt:           number;
    memberCount:         number;
    unreadMessages:      number;
    unreadNotifications: number;
    features:            CircleFeatures;
    members:             Member[];
}

/**
 * Life360 circle's features
 */
export interface CircleFeatures {
    ownerId:             null;
    skuId:               null;
    premium:             boolean;
    locationUpdatesLeft: number;
    priceMonth:          number;
    priceYear:           number;
    skuTier:             null;
}

/**
 * Life360 location detail
 */
export interface Location {
    latitude:       number;
    longitude:      number;
    accuracy:       number;
    startTimestamp: number;
    endTimestamp:   number;
    since:          number;
    timestamp:      number;
    name:           null | string;
    placeType:      null;
    source:         null | string;
    sourceId:       null | string;
    address1:       null | string;
    address2:       null | string;
    shortAddress:   string;
    inTransit:      boolean;
    tripId:         null;
    driveSDKStatus: null;
    battery:        number;
    charge:         boolean;
    wifiState:      boolean;
    speed:          number;
    isDriving:      boolean;
    userActivity:   null;
    userId:         null | string;
}

/**
 * Life360 circle member
 */
export interface Member {
    features:       MemberFeatures;
    issues:         MemberIssues;
    location:       Location;
    communications: Communication[];
    medical:        null;
    relation:       null;
    createdAt:      number;
    activity:       null;
    id:             string;
    firstName:      string;
    lastName:       string;
    isAdmin:        boolean;
    avatar:         null | string;
    pinNumber:      null;
    loginEmail:     string;
    loginPhone:     string;
}

/**
 * Life360 circle member's features
 */
export interface MemberFeatures {
    device:                boolean;
    smartphone:            boolean;
    nonSmartphoneLocating: boolean;
    geofencing:            boolean;
    shareLocation:         boolean;
    shareOffTimestamp:     null;
    disconnected:          boolean;
    pendingInvite:         boolean;
    mapDisplay:            boolean;
}

/**
 * Life360 circle member's issues
 */
export interface MemberIssues {
    disconnected:    boolean;
    type:            null;
    status:          null;
    title:           null;
    dialog:          null;
    action:          null;
    troubleshooting: boolean;
}

/**
 * Life360 circle place
 */
export interface Place {
    id:        string;
    ownerId:   string;
    circleId:  string;
    name:      string;
    latitude:  number;
    longitude: number;
    radius:    number;
    type:      null;
    typeLabel: null;
}

/**
 * Life360 location request's response
 */
export interface LocationRequest {
    requestId:  string;
    isPollable: boolean;
}

/**
 * Life360 circle members' preferences
 */
export interface MemberPreferences {
    email:         boolean;
    sms:           boolean;
    push:          boolean;
    shareLocation: boolean;
}

/**
 * Life360 session
 */
export class Session extends TypeBase implements Session {
    constructor(responseData: any) {
        super(responseData);

        //  Parsing and type-converting some properties
        if (responseData.onboarding != undefined) this.onboarding = ( responseData.onboarding == 1);
        if (responseData.user != undefined) this.user = new User(responseData.user);
    }
}

/**
 * Life360 user
 */
export class User extends TypeBase implements User {
    constructor(responseData: any) {
        super(responseData);

        //  Parsing and type-converting some properties
        if (responseData.created != undefined) this.created = Date.parse(responseData.created);
        if (responseData.settings != undefined) this.settings = new UserSettings(responseData.settings);
        if (responseData.communications != undefined) this.communications = ParseCommuncations(responseData.communications);
    }
}

/**
 * Life360 user settings
 */
export class UserSettings extends TypeBase implements UserSettings {
    constructor(responseData: any) {
        super(responseData);

        //  Parsing and type-converting some properties
        if (responseData.map != undefined) this.map = new MapSettings(responseData.map);
        if (responseData.alerts != undefined) this.alerts = new AlertsSettings(responseData.alerts);
    }
}

/**
 * Life360 user's maps settings
 */
export class MapSettings extends TypeBase implements MapSettings {
    constructor(responseData: any) {
        super({});

        //  Parsing and type-converting some properties
        if (responseData.police != undefined) this.police = ( responseData.police == "1" );
        if (responseData.fire != undefined) this.fire = ( responseData.fire == "1" );
        if (responseData.hospital != undefined) this.hospital = ( responseData.hospital == "1" );
        if (responseData.sexOffenders != undefined) this.sexOffenders = ( responseData.sexOffenders == "1" );
        if (responseData.crime != undefined) this.crime = ( responseData.crime == "1" );
        if (responseData.crimeDuration != undefined) this.crimeDuration = `${responseData.crimeDuration}`;
        if (responseData.family != undefined) this.family = ( responseData.family == "1" );
        if (responseData.advisor != undefined) this.advisor = ( responseData.advisor == "1" );
        if (responseData.placeRadius != undefined) this.placeRadius = ( responseData.placeRadius == "1" );
        if (responseData.memberRadius != undefined) this.memberRadius = ( responseData.memberRadius == "1" );
    }
}

/**
 * Life360 user's alerts settings
 */
export class AlertsSettings extends TypeBase implements AlertsSettings {
    constructor(responseData: any) {
        super({});

        //  Parsing and type-converting some properties
        if (responseData.crime != undefined) this.crime = ( responseData.crime == "1" );
        if (responseData.sound != undefined) this.sound = ( responseData.sound == "1" );
    }
}

/**
 * Life360 communication detail
 */
export class Communication extends TypeBase implements Communication {
    constructor(responseData: any) {
        super(responseData);
    }
}

/**
 * Life360 circle
 */
export class Circle extends TypeBase implements Circle {
    constructor(responseData: any) {
        super(responseData);

        //  Parsing and type-converting some properties
        if (responseData.createdAt != undefined) this.createdAt = Number.parseInt(responseData.createdAt);
        if (responseData.memberCount != undefined) this.memberCount = Number.parseInt(responseData.memberCount);
        if (responseData.unreadMessages != undefined) this.unreadMessages = Number.parseInt(responseData.unreadMessages);
        if (responseData.unreadNotifications != undefined) this.unreadNotifications = Number.parseInt(responseData.unreadNotifications);

        //  Has to parse features?
        if (responseData.features != undefined) this.features = new CircleFeatures(responseData.features);

        //  Has to parse members?
        if (responseData.members != undefined) this.members = ParseMembers(responseData.members);
    }
}

/**
 * Life360 circle's features
 */
export class CircleFeatures extends TypeBase implements CircleFeatures {
    constructor(responseData: any) {
        super(responseData);

        //  Parsing and type-converting some properties
        if (responseData.premium != undefined) this.premium = ( responseData.premium == "1" );
        if (responseData.priceMonth != undefined) this.priceMonth = Number.parseFloat(responseData.priceMonth);
        if (responseData.priceYear != undefined) this.priceYear = Number.parseFloat(responseData.priceYear);
    }
}

/**
 * Life360 circle member
 */
export class Member extends TypeBase implements Member {
    constructor(responseData: any) {
        super(responseData);

        //  Parsing and type-converting some properties
        if (responseData.createdAt != undefined) this.createdAt = Number.parseInt(responseData.createdAt);
        if (responseData.isAdmin != undefined) this.isAdmin = ( responseData.isAdmin == "1" );
        
        if (responseData.features != undefined) this.features = new MemberFeatures(responseData.features);
        if (responseData.issues != undefined) this.issues = new MemberIssues(responseData.issues);
        if (responseData.location != undefined) this.location = new Location(responseData.location);

        //  Has to parse communication details ?
        if (responseData.communications != undefined) this.communications = ParseCommuncations(responseData.communications);
    }
}

/**
 * Life360 circle member's features
 */
export class MemberFeatures extends TypeBase implements MemberFeatures {
    constructor(responseData: any) {
        super({});

        //  Parsing and type-converting some properties
        if (responseData.device != undefined) this.device = ( responseData.device == "1" );
        if (responseData.smartphone != undefined) this.smartphone = ( responseData.smartphone == "1" );
        if (responseData.nonSmartphoneLocating != undefined) this.nonSmartphoneLocating = ( responseData.nonSmartphoneLocating == "1" );
        if (responseData.geofencing != undefined) this.geofencing = ( responseData.geofencing == "1" );
        if (responseData.shareLocation != undefined) this.shareLocation = ( responseData.shareLocation == "1" );
        if (responseData.disconnected != undefined) this.disconnected = ( responseData.disconnected == "1" );
        if (responseData.pendingInvite != undefined) this.pendingInvite = ( responseData.pendingInvite == "1" );
        if (responseData.mapDisplay != undefined) this.mapDisplay = ( responseData.mapDisplay == "1" );
    }
}

/**
 * Life360 circle member's issues
 */
export class MemberIssues extends TypeBase implements MemberIssues {
    constructor(responseData: any) {
        super(responseData);

        //  Parsing and type-converting some properties
        if (responseData.disconnected != undefined) this.disconnected = ( responseData.disconnected == "1" );
        if (responseData.troubleshooting != undefined) this.troubleshooting = ( responseData.troubleshooting == "1" );
    }
}

/**
 * Life360 location detail
 */
export class Location extends TypeBase implements Location {
    constructor(responseData: any) {
        super(responseData);

        //  Parsing and type-converting some properties
        if (responseData.latitude != undefined) this.latitude = Number.parseFloat(responseData.latitude);
        if (responseData.longitude != undefined) this.longitude = Number.parseFloat(responseData.longitude);
        if (responseData.accuracy != undefined) this.accuracy = Number.parseInt(responseData.accuracy);
        if (responseData.endTimestamp != undefined) this.endTimestamp = Number.parseInt(responseData.endTimestamp);
        if (responseData.timestamp != undefined) this.timestamp = Number.parseInt(responseData.timestamp);
        if (responseData.inTransit != undefined) this.inTransit = ( responseData.inTransit == "1" );
        if (responseData.battery != undefined) this.battery = Number.parseInt(responseData.battery);
        if (responseData.wifiState != undefined) this.wifiState = ( responseData.wifiState == "1" );
        if (responseData.isDriving != undefined) this.isDriving = ( responseData.isDriving == "1" );
        if (responseData.charge != undefined) this.charge = ( responseData.charge == "1" );
    }
}

/**
 * Life360 circle's place
 */
export class Place extends TypeBase implements Place {
    constructor(responseData: any) {
        super(responseData);
        
        //  Parsing and type-converting some properties
        if (responseData.latitude != undefined) this.latitude = Number.parseFloat(responseData.latitude);
        if (responseData.longitude != undefined) this.longitude = Number.parseFloat(responseData.longitude);
        if (responseData.radius != undefined) this.radius = Number.parseFloat(responseData.radius);
    }
}

/**
 * Life360 location request's response
 */
export class LocationRequest extends TypeBase implements LocationRequest {
    constructor(responseData: any) {
        super(responseData);
        
        //  Parsing and type-converting some properties
        if (responseData.isPollable != undefined) this.isPollable = ( responseData.isPollable == "1" );
    }
}

/**
 * Life360 circle members' preferences
 */
export class MemberPreferences extends TypeBase implements MemberPreferences {
    constructor(responseData: any) {
        super(responseData);
        
        //  Parsing and type-converting some properties
        if (responseData.email != undefined) this.email = ( responseData.email == "1" );
        if (responseData.sms != undefined) this.sms = ( responseData.sms == "1" );
        if (responseData.push != undefined) this.push = ( responseData.push == "1" );
        if (responseData.shareLocation != undefined) this.shareLocation = ( responseData.shareLocation == "1" );
    }
}

/**
 * Parse Life360 circle places from raw API response object
 * @param data Life360 API response object for places
 * @returns Array of Life360 places
 */
export function ParsePlaces(data: any): Place[] {
    const myData = [];
    for (let index = 0; index < data.length; index++) {
        myData.push(new Place(data[index]));
    }

    return myData;
}

/**
 * Parse Life360 communication details from raw API response object
 * @param data Life360 API response object for communication details
 * @returns Array of Life360 ommunication details
 */
export function ParseCommuncations(data: any): Communication[] {
    const myData = [];
    for (let index = 0; index < data.length; index++) {
        myData.push(new Communication(data[index]));
    }

    return myData;
}

/**
 * Parse Life360 circles from raw API response object
 * @param data Life360 API response object for circles
 * @returns Array of Life360 circles
 */
export function ParseCircles(data: any): Circle[] {
    const myData = [];
    for (let index = 0; index < data.length; index++) {
        myData.push(new Circle(data[index]));
    }

    return myData;
}

/**
 * Parse Life360 circle members from raw API response object
 * @param data Life360 API response object for members
 * @returns Array of Life360 memebers
 */
export function ParseMembers(data: any): Member[] {
    const myData = [];
    for (let index = 0; index < data.length; index++) {
        myData.push(new Member(data[index]));
    }

    return myData;
}

/**
 * Parse Life360 location details from raw API response object
 * @param data Life360 API response object for location details
 * @returns Array of Life360 location details
 */
export function ParseLocations(data: any): Location[] {
    const myData = [];
    for (let index = 0; index < data.length; index++) {
        myData.push(new Location(data[index]));
    }

    return myData;
}
