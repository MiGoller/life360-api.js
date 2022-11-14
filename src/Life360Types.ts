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

// export interface Circles {
//     circles: Circle[];
// }

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

// export interface Member {
//     features:       MemberFeatures;
//     issues:         Issues;
//     location:       Location;
//     communications: Communication[];
//     medical:        null;
//     relation:       null;
//     createdAt:      string;
//     activity:       null;
//     id:             string;
//     firstName:      string;
//     lastName:       string;
//     isAdmin:        string;
//     avatar:         null | string;
//     pinNumber:      null;
//     loginEmail:     string;
//     loginPhone:     string;
// }

// export interface Communication {
//     channel: string;
//     value:   string;
//     type:    null | string;
// }

// export interface MemberFeatures {
//     device:                string;
//     smartphone:            string;
//     nonSmartphoneLocating: string;
//     geofencing:            string;
//     shareLocation:         string;
//     shareOffTimestamp:     null;
//     disconnected:          string;
//     pendingInvite:         string;
//     mapDisplay:            string;
// }

// export interface Issues {
//     disconnected:    string;
//     type:            null;
//     status:          null;
//     title:           null;
//     dialog:          null;
//     action:          null;
//     troubleshooting: string;
// }

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

// export interface Location {
//     latitude:       string;
//     longitude:      string;
//     accuracy:       string;
//     startTimestamp: number;
//     endTimestamp:   string;
//     since:          number;
//     timestamp:      string;
//     name:           string;
//     placeType:      null;
//     source:         string;
//     sourceId:       string;
//     address1:       string;
//     address2:       string;
//     shortAddress:   string;
//     inTransit:      string;
//     tripId:         null;
//     driveSDKStatus: null;
//     battery:        string;
//     charge:         string;
//     wifiState:      string;
//     speed:          number;
//     isDriving:      string;
//     userActivity:   null;
// }


// export interface Members {
//     members: Member[];
// }

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

// export interface Communication {
//     channel: string;
//     value:   string;
//     type:    null | string;
// }

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

// export interface Places {
//     places: Place[];
// }

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
 * Life360 type based classes
 */
export class Session extends TypeBase implements Session {
    constructor(responseData: any) {
        super(responseData);

        this.onboarding = ( responseData.onboarding == 1);
        this.user = new User(responseData.user);
    }
}

/**
 * Life360 user
 */
export class User extends TypeBase implements User {
    constructor(responseData: any) {
        super(responseData);

        this.created = Date.parse(responseData.created);
        this.settings = new UserSettings(responseData.settings);

        this.communications = ParseCommuncations(responseData.communications);
    }
}

/**
 * Life360 user settings
 */
export class UserSettings extends TypeBase implements UserSettings {
    constructor(responseData: any) {
        super(responseData);

        this.map = new MapSettings(responseData.map);
        this.alerts = new AlertsSettings(responseData.alerts);
    }
}

/**
 * Life360 user's maps settings
 */
export class MapSettings extends TypeBase implements MapSettings {
    constructor(responseData: any) {
        super({});

        this.police = ( responseData.police == "1" );
        this.fire = ( responseData.fire == "1" );
        this.hospital = ( responseData.hospital == "1" );
        this.sexOffenders = ( responseData.sexOffenders == "1" );
        this.crime = ( responseData.crime == "1" );
        this.crimeDuration = `${responseData.crimeDuration}`;
        this.family = ( responseData.family == "1" );
        this.advisor = ( responseData.advisor == "1" );
        this.placeRadius = ( responseData.placeRadius == "1" );
        this.memberRadius = ( responseData.memberRadius == "1" );
    }
}

/**
 * Life360 user's alerts settings
 */
export class AlertsSettings extends TypeBase implements AlertsSettings {
    constructor(responseData: any) {
        super({});

        this.crime = ( responseData.crime == "1" );
        this.sound = ( responseData.sound == "1" );
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

// export class Circles extends TypeBase implements Circles {
//     constructor(responseData: any) {
//         super({});

//         this.circles = ParseCircles(responseData.circles);
//     }
// }

/**
 * Life360 circle
 */
export class Circle extends TypeBase implements Circle {
    constructor(responseData: any) {
        super(responseData);

        this.createdAt = Number.parseInt(responseData.createdAt);
        this.memberCount = Number.parseInt(responseData.memberCount);
        this.unreadMessages = Number.parseInt(responseData.unreadMessages);
        this.unreadNotifications = Number.parseInt(responseData.unreadNotifications);

        if (responseData.features) this.features = new CircleFeatures(responseData.features);

        if (responseData.members) {
            this.members = ParseMembers(responseData.members);
        }
    }
}

/**
 * Life360 circle's features
 */
export class CircleFeatures extends TypeBase implements CircleFeatures {
    constructor(responseData: any) {
        super(responseData);

        this.premium = ( responseData.premium == "1" );
        this.priceMonth = Number.parseFloat(responseData.priceMonth);
        this.priceYear = Number.parseFloat(responseData.priceYear);
    }
}

// export class Members extends TypeBase implements Members {
//     constructor(responseData: any) {
//         super(responseData);
//     }
// }

/**
 * Life360 circle member
 */
export class Member extends TypeBase implements Member {
    constructor(responseData: any) {
        super(responseData);

        this.createdAt = Number.parseInt(responseData.createdAt);
        this.isAdmin = ( responseData.isAdmin == "1" );

        if (responseData.features) this.features = new MemberFeatures(responseData.features);

        if (responseData.issues) this.issues = new MemberIssues(responseData.issues);

        if (responseData.location) this.location = new Location(responseData.location);

        if (responseData.communications) {
            this.communications = ParseCommuncations(responseData.communications);
        }

    }
}

/**
 * Life360 circle member's features
 */
export class MemberFeatures extends TypeBase implements MemberFeatures {
    constructor(responseData: any) {
        super({});

        this.device = ( responseData.device == "1" );
        this.smartphone = ( responseData.smartphone == "1" );
        this.nonSmartphoneLocating = ( responseData.nonSmartphoneLocating == "1" );
        this.geofencing = ( responseData.geofencing == "1" );
        this.shareLocation = ( responseData.shareLocation == "1" );
        this.disconnected = ( responseData.disconnected == "1" );
        this.pendingInvite = ( responseData.pendingInvite == "1" );
        this.mapDisplay = ( responseData.mapDisplay == "1" );
    }
}

/**
 * Life360 circle member's issues
 */
export class MemberIssues extends TypeBase implements MemberIssues {
    constructor(responseData: any) {
        super(responseData);

        this.disconnected = ( responseData.disconnected == "1" );
        this.troubleshooting = ( responseData.troubleshooting == "1" );
    }
}

/**
 * Life360 location detail
 */
export class Location extends TypeBase implements Location {
    constructor(responseData: any) {
        super(responseData);

        this.latitude = Number.parseFloat(responseData.latitude);
        this.longitude = Number.parseFloat(responseData.longitude);
        this.accuracy = Number.parseInt(responseData.accuracy);
        this.endTimestamp = Number.parseInt(responseData.endTimestamp);
        this.timestamp = Number.parseInt(responseData.timestamp);
        this.inTransit = ( responseData.inTransit == "1" );
        this.battery = Number.parseInt(responseData.battery);
        this.wifiState = ( responseData.wifiState == "1" );
        this.isDriving = ( responseData.isDriving == "1" );
        this.charge = ( responseData.charge == "1" );
    }
}

// export class Members extends TypeBase implements Members {
//     constructor(responseData: any) {
//         super(responseData);
//     }
// }

// export class Places extends TypeBase implements Places {
//     constructor(responseData: any) {
//         super({});

//         this.places = ParsePlaces(responseData.places);
//     }
// }

/**
 * Life360 circle's place
 */
export class Place extends TypeBase implements Place {
    constructor(responseData: any) {
        super(responseData);
        this.latitude = Number.parseFloat(responseData.latitude);
        this.longitude = Number.parseFloat(responseData.longitude);
        this.radius = Number.parseFloat(responseData.radius);
    }
}

/**
 * Life360 location request's response
 */
export class LocationRequest extends TypeBase implements LocationRequest {
    constructor(responseData: any) {
        super(responseData);
        this.isPollable = ( responseData.isPollable == "1" );
    }
}

/**
 * Life360 circle members' preferences
 */
export class MemberPreferences extends TypeBase implements MemberPreferences {
    constructor(responseData: any) {
        super(responseData);
        this.email = ( responseData.email == "1" );
        this.sms = ( responseData.sms == "1" );
        this.push = ( responseData.push == "1" );
        this.shareLocation = ( responseData.shareLocation == "1" );
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
