/**
 * life360-api.js tests ...
 * 
 * Author:  MiGoller
 * 
 * Copyright (c) 2021-2022 MiGoller
 */

/* eslint-disable @typescript-eslint/no-var-requires */

"use strict";

const life360 = require("../dist/index");
require("dotenv").config();

async function main() {
    console.log("Starting Life360-API.js tests ...");

    //  Check essential environment variables
    if ((process.env.LIFE360_USERNAME && process.env.LIFE360_PASSWORD) || (process.env.LIFE360_COUNTRYCODE && process.env.LIFE360_PHONENUMBER && process.env.LIFE360_PASSWORD)) {
        try {
            console.log(process.env.LIFE360_USERNAME);

            //  Create Life360 client
            // const myClient = new life360.Life360Handler(
            //     process.env.LIFE360_USERNAME || "",
            //     process.env.LIFE360_PASSWORD || "",
            //     process.env.LIFE360_PHONENUMBER || "",
            //     process.env.LIFE360_COUNTRYCODE || 1,
            //     process.env.LIFE360_DEVICEID || "",
            //     process.env.LIFE360_CLIENTVERSION || "",
            //     process.env.LIFE360_USERAGENT || ""
            // );

            // //  "Classic" Life360API v1 constructor
            // const myClient = new life360.Life360API(
            //     process.env.LIFE360_USERNAME || "",
            //     process.env.LIFE360_PASSWORD || "",
            //     process.env.LIFE360_PHONENUMBER || "",
            //     process.env.LIFE360_COUNTRYCODE || 1,
            //     process.env.LIFE360_DEVICEID || "",
            //     process.env.LIFE360_CLIENTVERSION || "",
            //     process.env.LIFE360_USERAGENT || ""
            // );

            // //  Life360API v2 constructor
            // const myClient = new life360.Life360APIv2({
            //     username: process.env.LIFE360_USERNAME || "",
            //     password: process.env.LIFE360_PASSWORD || "",
            //     phonenumber: process.env.LIFE360_PHONENUMBER || "",
            //     countryCode: process.env.LIFE360_COUNTRYCODE || 1,
            //     deviceId: process.env.LIFE360_DEVICEID || "",
            //     clientVersion: process.env.LIFE360_CLIENTVERSION || "",
            //     userAgent: process.env.LIFE360_USERAGENT || ""
            // });

            // //  Life360API v2 factory method from username and password
            // const myClient = life360.Life360APIv2.fromUsername(
            //     process.env.LIFE360_USERNAME,
            //     process.env.LIFE360_PASSWORD, 
            //     {
            //         deviceId: process.env.LIFE360_DEVICEID || "",
            //         clientVersion: process.env.LIFE360_CLIENTVERSION || "",
            //         userAgent: process.env.LIFE360_USERAGENT || ""
            //     }
            // );

            // //  Life360API v2 factory method from phonenumber and password
            // const myClient = life360.Life360APIv2.fromPhonenumber(
            //     process.env.LIFE360_COUNTRYCODE,
            //     process.env.LIFE360_PHONENUMBER,
            //     process.env.LIFE360_PASSWORD,
            //     {
            //         deviceId: process.env.LIFE360_DEVICEID || "",
            //         clientVersion: process.env.LIFE360_CLIENTVERSION || "",
            //         userAgent: process.env.LIFE360_USERAGENT || ""
            //     }
            // );

            //  Life360API v2 factory method from connecttion settings object
            const myClient = life360.Life360APIv2.fromConnectionSettings({
                username: process.env.LIFE360_USERNAME || "",
                password: process.env.LIFE360_PASSWORD || "",
                phonenumber: process.env.LIFE360_PHONENUMBER || "",
                countryCode: process.env.LIFE360_COUNTRYCODE || 1,
                deviceId: process.env.LIFE360_DEVICEID || "",
                clientVersion: process.env.LIFE360_CLIENTVERSION || "",
                userAgent: process.env.LIFE360_USERAGENT || ""
            });

            //  Login with supplied Life360 credentials (see conf.json)
            console.log("- Logging in ...");
            myClient.login()
            .then(function(l360session) {
                //  We're logged in
                console.dir(l360session, { depth: 5 });

                //  Get Circles
                console.log("- Getting circles ...");
                myClient.getCircles()
                .then(function(myCircles) {
                    console.dir({ "circles": myCircles }, { depth: 5 });

                    if (myCircles.length > 0) {
                        //  Get first circle
                        myClient.getCircle(myCircles[0].id)
                        .then(function(myCircle) {
                            //  Show circle information
                            console.log("- Getting first circle ...");
                            console.dir({ "circle": myCircle }, { depth: 5 });

                            //  Get circle members
                            myClient.getCircleMembers(myCircle.id)
                            .then(function(circleMembers) {
                                console.log("- Getting circle members ...");
                                console.dir({ "members": circleMembers }, { depth: 5 });
                            });

                            //  Get circle places
                            myClient.getCirclePlaces(myCircle.id)
                            .then(function(circlePlaces) {
                                console.log("- Getting circle places ...");
                                console.dir({ "places": circlePlaces }, { depth: 5 });
                            });

                            //  Get members' location data --> Issue #13
                            myClient.getCircleMembersLocation(myCircle.id)
                            .then(function(locations) {
                                console.log("- Getting circle members' locations ...");
                                console.dir({ "locations": locations }, { depth: 5 });
                            });

                            //  Request location update for first member --> Issue #14
                            myClient.requestUserLocationUpdate(myCircle.id, myCircle.members[0].id)
                            .then(function(response) {
                                console.log("- Request first person location update ...");
                                console.dir({ "requestUserLocationUpdate": response }, { depth: 5 });
                            });
                        })
                        .catch(function(error) {
                            //  Getting circle failed.
                            console.log("Getting circle failed!");
                            console.dir(error, { depth: 5 });
                            process.exit(4);
                        });
                    }
                })
                .catch(function(error) {
                    //  Getting circles failed.
                    console.log("Getting circles failed!");
                    console.dir(error, { depth: 5 });
                    process.exit(3);
                });

                //  Take existing session to create another client without login credentials.
                // const anotherClient = life360.Life360APIv2.fromSession(l360session);
                const anotherClient = life360.Life360APIv2.fromAuthToken(
                    l360session.access_token,
                    l360session.token_type
                );

                //  WARNING: DO NOT call the method `login()`. This will reset the session and tries to login with credentials.
                //  Logging in with credentials would fail, because we did not provide any credentials to `anotherClient`.
                // anotherClient.login()
                anotherClient.getCircles()
                .then(function(myCircles) {
                    console.log("- Running with existing session from previous connection ...");
                    console.dir({ "circles with previous session": myCircles }, { depth: 5 });
                })
                .catch(function(error) {
                    //  Getting circles with existing session failed
                    console.log("Getting circle with existing session failed!");
                    console.dir(error, { depth: 5 });
                    process.exit(5);
                });

            })
            .catch(function(error) {
                //  Login failed.
                console.log("Login failed!");
                console.dir(error, { depth: 5 });
                process.exit(2);
            });
        } catch (error) {
            //  Failed to run tests.
            console.log("Failed to run tests!");
            console.dir(error, { depth: 5 });
            process.exit(2);
        }
    }
    else {
        console.error("You have to set essentials settings using environment variables!");
        process.exit(1);
    }
}

main();
