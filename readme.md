# [Splatoon2.ink](https://splatoon2.ink)

Splatoon2.ink shows the current and upcoming map schedules for Splatoon 2.

This site was built with [Vue.js](https://vuejs.org/) and [Bulma](http://bulma.io/).
All data comes from the SplatNet 2 API.

More information about Nintendo's API can be found [here](https://github.com/ZekeSnider/NintendoSwitchRESTAPI).

**Note:** The Splatnet updater script requires Node.js v8 or later.

## Getting Started

Clone this repo:

```shell
git clone git@github.com:misenhower/splatoon2.ink.git
```

Next, copy `.env.example` to `.env` and update its values.

```shell
cp .env.example .env
```

You can retrieve your `iksm_session` ID value (`NINTENDO_SESSION_ID` inside `.env`) using [Fiddler](http://www.telerik.com/fiddler) or a similar tool.
See [here](https://github.com/frozenpandaman/splatnet2statink#setup-instructions) for further instructions.

I recommend using [Yarn](https://yarnpkg.com/en/) to manage JS dependencies.

```shell
yarn install    # Install dependencies
yarn splatnet   # Retrieve updates from Splatnet and the Salmon Run calendar
yarn serve      # Start the webpack dev server
```

Data retrieved from Splatnet is stored in the `public/data` directory.

By default, the dev server will run on port 8080.
When running `yarn serve` you can access the site by going to http://localhost:8080.

## Production

Build minified assets for production:

```shell
yarn build
```

Retrieve updates from Splatnet every hour via [node-cron](https://github.com/kelektiv/node-cron):

```shell
yarn cron
```

## Docker

I use a Docker container on my production server to build production assets and retrieve data from Splatnet.

```shell
sudo docker-compose run --rm app yarn build     # Build production assets
sudo docker-compose up -d app                   # Start periodic updates
```
