remote-skip
===========

A server to run on a mac that allows programatic skip button pressing via an http endpoint


Usage:
====

First, install [ngrok](https://ngrok.com)

Then, follow these steps.

- Clone this repo
- `npm install`
- `heroku create <yourappname>`
- git push heroku
- `./serve`

Requests to `yourappname.herokuapp.com/skip` will now trigger a popup on your local machine, and after approving or 15 seconds, the song will be skipped.

Supported music players:
====

- Last.fm