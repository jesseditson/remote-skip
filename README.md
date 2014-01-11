remote-skip
===========

A server to run on a mac that allows programatic skip button pressing via an http endpoint

Blog post with details on why I made this and how it works: [http://jesseditson.com/a-democratic-music-player-for-offices](http://jesseditson.com/a-democratic-music-player-for-offices)


Usage:
====

First, install [ngrok](https://ngrok.com)

Then, follow these steps.

- Clone this repo
- `npm install`
- `heroku create <yourappname>`
- git push heroku
- `./serve`

Requests to `yourappname.herokuapp.com/skip?user=somename` will now trigger a popup on your local machine, and after approving or 15 seconds, the song will be skipped.

This is especially useful when coupled with the included hubot script - when installed, your coworkers can now skip songs that you put on. Of course this could be abused, so the script allows you to deny any reuest for 15 seconds.

Supported music players:
====

- Last.fm
- iTunes
- Spotify