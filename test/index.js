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
            const myClient = new life360.Life360Handler(
                process.env.LIFE360_USERNAME || "",
                process.env.LIFE360_PASSWORD || "",
                process.env.LIFE360_PHONENUMBER || "",
                process.env.LIFE360_COUNTRYCODE || "",
                process.env.LIFE360_DEVICEID || undefined,
                process.env.LIFE360_CLIENTVERSION || undefined,
                process.env.LIFE360_USERAGENT || undefined
            );

            //  Login with supplied Life360 credentials (see conf.json)
            myClient.login()
            .then(function(l360auth) {
                //  We're logged in
                console.dir(l360auth);

                //  Get Circles
                myClient.getCircles()
                .then(function(myCircles) {
                    console.dir({ "circles": myCircles }, { depth: 5 });

                    if (myCircles.length > 0) {
                        //  Get first circle
                        myClient.getCircle(myCircles[0].id)
                        .then(function(myCircle) {
                            //  Show circle information
                            console.dir({ "circle": myCircle }, { depth: 5 });

                            //  Get circle members
                            myClient.getCircleMembers(myCircle.id)
                            .then(function(circleMembers) {
                                console.dir({ "members": circleMembers }, { depth: 5 });
                            });

                            //  Get circle placers
                            myClient.getCirclePlaces(myCircle.id)
                            .then(function(circlePlaces) {
                                console.dir({ "places": circlePlaces }, { depth: 5 });
                            });

                            //  Get members' location data --> Issue #13
                            myClient.getCircleMembersLocation(myCircle.id)
                            .then(function(locations) {
                                console.dir({ "locations": locations }, { depth: 5 });
                            });

                            //  Request location update for first member --> Issue #14
                            myClient.requestUserLocationUpdate(myCircle.id, myCircle.members[0].id)
                            .then(function(response) {
                                console.dir({ "requestUserLocationUpdate": response }, { depth: 5 });
                            });
                        });
                    }
                });
            });
        } catch (error) {
            //  Failed to run tests.
            console.error(error);
            process.exit(1);
        }
    }
    else {
        console.error("You have to set essentials settings using environment variables!");
        process.exit(2);
    }
}

main();
