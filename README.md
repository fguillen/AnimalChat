# Animal Chat

![screenshot](https://github.com/fguillen/AnimalChat/blob/master/etc/art/animal_chat.jpg)

**Animal Chat** is a _massive multi user on live web chat_ developed using the _HTML5 WebSocket_ technology.

It is just a programming experiment to taste how the WebSocket technology works, how to implement it and how is its performance.

## The conclusions

The result can't be more satisfactory:

* Very easy and intuitive API based in events
* Good Ruby support in the server side with [EventMachine WebSocket](https://github.com/igrigorik/em-websocket)
* Very Good performance, with my very poor Internet connection the response is almost immediate.


## How to play with it in local

### Clone the repo

    git clone git@github.com:fguillen/AnimalChat.git

### Prepare the server

    cd AnimalChat/server/
    bundle install
    ./bin/animal_chat_server 127.0.0.1  # run the server

### Open the client

    cd AnimalChat/client
    open index.html


## Status

For the experiment concerns this project is already in *production* status. I don't think is gonna be improvements in this project.

Next step is gonna be **build a game** :).

## More technologies used

### BackBone.js

It is also my first time with [BackBone.js](http://documentcloud.github.com/backbone/) and I have to say I'm not going to develop any other _spaghetti_ JS code any more. MVC rules, event driven development rules.

### Jasmine.js

I have tried to make the JS tests using [Qunit](http://docs.jquery.com/QUnit) which simplicity I love, but the fail error messages were very ambiguous and I had to move all the tests to [Jasmine](http://pivotal.github.com/jasmine/) which I don't like to much the _sugar syntax Rspec style_ but its messages are more helpful.

### Sinon.js

Incredible helpful [JS mock library](http://sinonjs.org/).

