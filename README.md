# life360-api.js

An unofficial client for the Life360 API.

## Features

- Simple and lightweight Life360 API client
- Promise-based API (works with `async` / `await`)
- Typescript support
- Isomorphic (works with Node / browsers)

## Install

```bash
$ npm add life360-api.js
```

## Quickstart

Show your Life360 circles. ▶️ [Try it out](https://runkit.com/).

```ts
import util from "util";
import { Life360Handler } from "life360-api.js";

async function main() {
    const l360 = new Life360Handler("<EMAIL_ADDRESS>", '<SECRET_PASSWORD>');

    //  Login to Life360 API with the credentials above
    console.log(await l360.login());

    //  Get all the user's Life360 circles
    const circles = await l360.getCircles();

    //  Get the members of the first returned Life360 circle
    const members = await l360.getCircleMembers(circles[0].id);
    console.log(util.inspect(members, false, null, true /* enable colors */));

    //  Get the places of the first returned Life360 circle
    const places = await l360.getCirclePlaces(circles[0].id);
    console.log(util.inspect(places, false, null, true /* enable colors */));
}

main();
```

## Changelog

0.1.0

- (MiGoller) First public release. Enjoy ;-)  

## License

### MIT License

Copyright (c) 2021 MiGoller (https://github.com/MiGoller/)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
