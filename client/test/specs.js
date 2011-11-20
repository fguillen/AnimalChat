describe( "AnimalChat.Radio", function() {
  beforeEach( function() {
    this.radio = new AnimalChat.Radio({ address: "address" });
  });

  it( "initialize", function() {
    expect( this.radio.get( "address" ) ).toEqual( "address" );
  });

  it( "broadcast", function() {
    this.radio.socket = { send: function() {} };

    var mock =
      sinon
        .mock( this.radio.socket )
        .expects( "send" )
        .withExactArgs( "{\"message\":\"wadus\"}" )
        .once();

    this.radio.broadcast( { message: "wadus" } );

    mock.verify();
    this.radio.socket.send.restore();
  });

  it( "connect", function() {
    BrowserSocket =
      function( address ){
        this.address = address;
      };

    this.radio.connect();
    expect( this.radio.socket.address ).toEqual( "ws://address:8080/" );

    // onmessage
    var spyMessageReceived = sinon.spy();
    this.radio.bind( "messageReceived" , spyMessageReceived );
    this.radio.socket.onmessage( { data: "this is data" } );
    expect( spyMessageReceived.called ).toBeTruthy();

    // onclose
    var spyConnectionError = sinon.spy();
    this.radio.bind( "connectionError" , spyConnectionError );
    this.radio.socket.onclose();
    expect( spyConnectionError.called ).toBeTruthy();

    // onopen
    var spyConnected = sinon.spy();
    this.radio.bind( "connected" , spyConnected );
    this.radio.socket.onopen();
    expect( spyConnected.called ).toBeTruthy();
  });
});

describe( "AnimalChat.AppView", function() {
  beforeEach( function() {
  });

  it( "initialize", function() {
    var mock =
      sinon
        .mock( AnimalChat.AlertView.prototype )
        .expects( "render" )
        .once();

    var app = new AnimalChat.AppView({ address: "address" });

    expect( typeof(app.radio) ).toEqual( "object" );
    expect( typeof(app.alert) ).toEqual( "object" );
    expect( typeof(app.alertView) ).toEqual( "object" );
    expect( typeof(app.actors) ).toEqual( "object" );
    expect( typeof(app.actorsView) ).toEqual( "object" );
    expect( typeof(app.keys) ).toEqual( "object" );
    expect( typeof(app.keysView) ).toEqual( "object" );

    expect( app.radio.get( "address" ) ).toEqual( "address" );
    expect( app.alertView.model ).toEqual( app.alert );
    expect( app.actorsView.collection ).toEqual( app.actors );
    expect( app.keysView.collection ).toEqual( app.keys );


    AnimalChat.AlertView.prototype.render.restore();
    mock.verify();

  });

  it( "connect", function() {
    var app = new AnimalChat.AppView({});

    var mock =
      sinon
        .mock( app.radio )
        .expects( "connect" )
        .once();

    app.connect();

    mock.verify();
    app.radio.connect.restore();
  });

  it( "event keypress", function() {
    var mock =
      sinon
        .mock( AnimalChat.AppView.prototype )
        .expects( "sendKey" )
        .once();

    var container = $("<div id='container' />")
    $("body").append( container );

    var app = new AnimalChat.AppView({});

    $(document).keypress();

    mock.verify();
    AnimalChat.AppView.prototype.sendKey.restore();
    container.remove();
  });

  it( "event retry-connection", function() {
    var mock =
      sinon
        .mock( AnimalChat.AppView.prototype )
        .expects( "connect" )
        .once();

    var retryConnection = $("<div id='retry-connection' />")
    $("body").append( retryConnection );

    var app = new AnimalChat.AppView({});

    $("#retry-connection").click();

    mock.verify();
    AnimalChat.AppView.prototype.connect.restore();
    retryConnection.remove();
  });

  it( "messageReceived hello", function() {
    var app = new AnimalChat.AppView({});
    expect( app.me ).toBeNull();
    expect( app.actors.length ).toEqual( 0 );

    var message = JSON.stringify({ type: "hello", actor: { id: "id", color: "color" } });
    app.messageReceived( message );

    expect( app.me.get( "id" ) ).toEqual( "id" );
    expect( app.me.get( "color" ) ).toEqual( "color" );
    expect( app.actors.length ).toEqual( 1 );
    expect( app.actors.get( "id" ).get( "id" ) ).toEqual( app.me.get( "id" ) );
  });

  it( "messageReceived actor", function() {
    var app = new AnimalChat.AppView({});
    expect( app.actors.length, 0 );

    var message = JSON.stringify({ type: "actor", actor: { id: "id", color: "color" } });
    app.messageReceived( message );

    expect( app.actors.length ).toEqual( 1 );
    expect( app.actors.get( "id" ).get( "color" ) ).toEqual( "color" );
  });

  it( "messageReceived actors", function() {
    var app = new AnimalChat.AppView({});
    expect( app.actors.length, 0 );

    var message =
      JSON.stringify({
        type: "actors",
        actors: [
          { id: "id1", color: "color1" },
          { id: "id2", color: "color2" },
        ],
      });

    app.messageReceived( message );

    expect( app.actors.length ).toEqual( 2 );
    expect( app.actors.get( "id2" ).get( "color" ) ).toEqual( "color2" );
  });

  it( "messageReceived goodbye", function() {
    var app = new AnimalChat.AppView({});

    var actor = new AnimalChat.Actor({ id: "id", color: "color" });
    app.actors.add( actor );

    expect( app.actors.length ).toEqual( 1 );

    var message = JSON.stringify({ type: "goodbye", actor: { id: "id" } });
    app.messageReceived( message );

    expect( app.actors.length ).toEqual( 0 );
  });

  it( "messageReceived key", function() {
    var app = new AnimalChat.AppView({});
    expect( app.keys.length ).toEqual( 0 );

    var message =
      JSON.stringify({
        type: "key",
        actor: { id: "id", color: "color" },
        key: "x"
      });

    app.messageReceived( message );

    expect( app.keys.length ).toEqual( 1 );
  });

  it( "sendKey", function() {
    var app = new AnimalChat.AppView({});

    var message = { type: "key", actor: app.me, key: "x" }

    var mock =
      sinon
        .mock( app.radio )
        .expects( "broadcast" )
        .withExactArgs( message )
        .once();

    app.sendKey({ which: 120 });

    mock.verify();
    app.radio.broadcast.restore();
  });
});

describe( "AnimalChat.Alert", function() {
  beforeEach( function(){
    this.alert = new AnimalChat.Alert();
  });

  it( "initialize", function() {
    expect( this.alert.get( "status" ) ).toEqual( "hidden" );
  });

  it( "error", function() {
    this.alert.error();
    expect( this.alert.get( "status" ) ).toEqual( "error" );
  });

  it( "connecting", function() {
    this.alert.connecting();
    expect( this.alert.get( "status" ) ).toEqual( "connecting" );
  });

  it( "connected", function() {
    this.alert.connected();
    expect( this.alert.get( "status" ) ).toEqual( "hidden" );
  });

  it( "hidden", function() {
    this.alert.hidden();
    expect( this.alert.get( "status" ) ).toEqual( "hidden" );
  });
});

describe( "AnimalChat.AlertView", function() {
  beforeEach( function() {
    this.ligthBoxDiv = $("<div id='light-box' />");
    this.ligthBoxDiv.append( "<div id='connecting-problem' />" );
    this.ligthBoxDiv.append( "<div id='connecting' />" );

    $("body").append( this.ligthBoxDiv );
  });

  afterEach( function() {
    this.ligthBoxDiv.remove();
  });

  it( "initialize", function() {
    var alert = new AnimalChat.Alert();
    var alertView = new AnimalChat.AlertView({ model: alert });

    expect( alertView.model ).toEqual( alert );
  });

  it( "event when model change", function() {
    var mock =
      sinon
        .mock( AnimalChat.AlertView.prototype )
        .expects( "render" )
        .once();

    var alert = new AnimalChat.Alert();
    var alertView = new AnimalChat.AlertView({ model: alert });

    alert.set({ status: "other" });

    mock.verify();
    AnimalChat.AlertView.prototype.render.restore();
  });

  it( "render hidden", function() {
    var clock = sinon.useFakeTimers();
    var alert = new AnimalChat.Alert({ status: "hidden" });
    var alertView = new AnimalChat.AlertView({ model: alert });

    $("#light-box #connecting-problem").show();
    $("#light-box #connecting").show();
    $("#light-box").show();

    expect( $("#light-box #connecting-problem").css( "display" ) ).toEqual( "block" );
    expect( $("#light-box #connecting").css( "display" ) ).toEqual( "block" );
    expect( $("#light-box").css( "display" ) ).toEqual( "block" );

    alertView.render();
    clock.tick( 300 );

    expect( $("#light-box #connecting-problem").css( "display" ) ).toEqual( "none" );
    expect( $("#light-box #connecting").css( "display" ) ).toEqual( "none" );
    expect( $("#light-box").css( "display" ) ).toEqual( "none" );

    clock.restore();
  });

  it( "render error", function() {
    var clock = sinon.useFakeTimers();
    var alert = new AnimalChat.Alert({ status: "error" });
    var alertView = new AnimalChat.AlertView({ model: alert });

    $("#light-box #connecting-problem").hide();
    $("#light-box #connecting").show();
    $("#light-box").hide();

    expect( $("#light-box #connecting-problem").css( "display" ) ).toEqual( "none" );
    expect( $("#light-box #connecting").css( "display" ) ).toEqual( "block" );
    expect( $("#light-box").css( "display" ) ).toEqual( "none" );

    alertView.render();
    clock.tick( 700 );

    expect( $("#light-box #connecting-problem").css( "display" ) ).toEqual( "block" );
    expect( $("#light-box #connecting").css( "display" ) ).toEqual( "none" );
    expect( $("#light-box").css( "display" ) ).toEqual( "block" );

    clock.restore();
  });

  it( "render connecting", function() {
    var alert = new AnimalChat.Alert({ status: "connecting" });
    var alertView = new AnimalChat.AlertView({ model: alert });

    $("#light-box #connecting-problem").show();
    $("#light-box #connecting").hide();
    $("#light-box").hide();

    expect( $("#light-box #connecting-problem").css( "display" ) ).toEqual( "block" );
    expect( $("#light-box #connecting").css( "display" ) ).toEqual( "none" );
    expect( $("#light-box").css( "display" ) ).toEqual( "none" );

    alertView.render();

    expect( $("#light-box #connecting-problem").css( "display" ) ).toEqual( "none" );
    expect( $("#light-box #connecting").css( "display" ) ).toEqual( "block" );
    expect( $("#light-box").css( "display" ) ).toEqual( "block" );
  });
});

describe( "AnimalChat.Actor", function() {
  it( "initialize defaults", function() {
    var actor = new AnimalChat.Actor();

    expect( actor.get( "id" ) ).toEqual( "none" );
    expect( actor.get( "color" ), "none" );
  });

  it( "initialize with params", function() {
    var actor = new AnimalChat.Actor({ id: "id", color: "color" });

    expect( actor.get( "id" ) ).toEqual( "id" );
    expect( actor.get( "color" ) ).toEqual( "color" );
  });
});

describe( "AnimalChat.Actors", function() {
  it( "initialize", function() {
    var actors = new AnimalChat.Actors();
  });
});


describe( "AnimalChat.ActorsView", function() {
  beforeEach( function() {
    this.actorsDiv = $("<div id='actors' />");
    this.actorsDiv.append( "<ul />" );

    $("body").append( this.actorsDiv );
  });

  afterEach( function() {
    this.actorsDiv.remove();
  });

  it( "initialize", function() {
    console.log( "pepe" );
    var actors = new AnimalChat.Actors();
    var actorsView = new AnimalChat.ActorsView({ collection: actors });

    expect( actorsView.collection ).toEqual( actors );
  });

  it( "event when collection add", function() {
    var mock =
      sinon
        .mock( AnimalChat.ActorsView.prototype )
        .expects( "addActor" )
        .once();

    var actors = new AnimalChat.Actors();
    var actorsView = new AnimalChat.ActorsView({ collection: actors });

    actors.add( new AnimalChat.Actor() );

    mock.verify();
    AnimalChat.ActorsView.prototype.addActor.restore();
  });

  it( "event when collection reset", function() {
    var mock =
      sinon
        .mock( AnimalChat.ActorsView.prototype )
        .expects( "render" )
        .once();

    var actors = new AnimalChat.Actors();
    var actorsView = new AnimalChat.ActorsView({ collection: actors });

    actors.reset();

    mock.verify();
    AnimalChat.ActorsView.prototype.render.restore();
  });

  it( "event when collection remove", function() {
    var mock =
      sinon
        .mock( AnimalChat.ActorsView.prototype )
        .expects( "removeActor" )
        .once();

    var actors = new AnimalChat.Actors();
    var actor = new AnimalChat.Actor({ id: "id" });
    actors.add( actor );

    var actorsView = new AnimalChat.ActorsView({ collection: actors });

    actors.remove( "id" );

    mock.verify();
    AnimalChat.ActorsView.prototype.removeActor.restore();
  });

  it( "addActor", function() {
    var actors = new AnimalChat.Actors();
    var actorsView = new AnimalChat.ActorsView({ collection: actors });
    var actor = new AnimalChat.Actor({ id: "id", color: "color" });

    expect( $(actorsView.el).find("div").length ).toEqual( 0 );

    actorsView.addActor( actor );

    expect( $(actorsView.el).find("div").length ).toEqual( 1 );
  });

  it( "removeActor", function() {
    var clock = sinon.useFakeTimers();

    var actors = new AnimalChat.Actors();
    var actorsView = new AnimalChat.ActorsView({ collection: actors });
    var actor1 = new AnimalChat.Actor({ id: "id1", color: "color1" });
    var actor2 = new AnimalChat.Actor({ id: "id2", color: "color2" });

    actorsView.addActor( actor1 );
    actorsView.addActor( actor2 );
    expect( $(actorsView.el).find("div").length ).toEqual( 2 );

    $(actorsView.el).find("div").css( { color: "black" } );

    actorsView.removeActor( actor1 );

    clock.tick( 700 );

    expect( $(actorsView.el).find("div").length ).toEqual( 1 );

    clock.restore();
  });

  it( "render", function() {
    var actor1 = new AnimalChat.Actor({ id: "id1", color: "color1" });
    var actor2 = new AnimalChat.Actor({ id: "id2", color: "color2" });
    var actors = new AnimalChat.Actors();
    actors.add( actor1 );
    actors.add( actor2 );

    var actorsView = new AnimalChat.ActorsView({ collection: actors });

    expect( $(actorsView.el).find("div").length ).toEqual( 0 );

    $(actorsView.el).html( "<div id='delete' />" );
    expect( $(actorsView.el).find("div#delete").length ).toEqual( 1 );

    actorsView.render();

    expect( $(actorsView.el).find("div").length ).toEqual( 2 );
    expect( $(actorsView.el).find("div#delete").length ).toEqual( 0 );
  });

});

describe( "AnimalChat.ActorView", function(){
  it( "initialize", function(){
    var actor = new AnimalChat.Actor({ id: "id", color: "color" });
    var actorView = new AnimalChat.ActorView({ model: actor });

    expect( actorView.model ).toEqual( actor );
  });

  it( "render", function(){
    var actor = new AnimalChat.Actor({ id: "id", color: "color" });
    var actorView = new AnimalChat.ActorView({ model: actor });

    expect( actorView.render().el )
      .toEqual( "<div id='actor-id' style='background-color: color' />" );
  });
});


describe( "AnimalChat.Key", function(){
  it( "initialize defaults", function(){
    var key = new AnimalChat.Key();

    expect( key.get( "key" ) ).toEqual( "x" );
    expect( key.get( "color" ) ).toEqual( "none" );
  });

  it( "initialize with args", function(){
    var key = new AnimalChat.Key({ key: "a", color: "color" });

    expect( key.get( "key" ) ).toEqual( "a" );
    expect( key.get( "color" ) ).toEqual( "color" );
  });
});

describe( "AnimalChat.Keys", function(){
  it( "initialize", function(){
    var keys = new AnimalChat.Keys();
  });
});

describe( "AnimalChat.KeysView", function(){
  it( "initialize", function(){
    var key = new AnimalChat.Key();
    var keyView = new AnimalChat.KeyView({ model: key });

    expect( keyView.model ).toEqual( key );
  });

  it( "render", function(){
    var key = new AnimalChat.Key({ key: "a", color: "color" });
    var keyView = new AnimalChat.KeyView({ model: key });

    expect( keyView.render().el ).toEqual( "<li style='color: color'>a</li>" );
  });
});

describe( "AnimalChat.KeysView", function(){
  beforeEach( function() {
    this.sceneDiv = $("<div id='scene' />");
    this.sceneDiv.append( $("<ul />") );
    $("body").append( this.sceneDiv );
  });

  afterEach( function(){
    this.sceneDiv.remove();
  });

  it( "initialize", function(){
    var keys = new AnimalChat.Keys();
    var keysView = new AnimalChat.KeysView({ collection: keys });

    expect( keysView.collection ).toEqual( keys );
  });

  it( "event when colleciton add", function(){
    var mock =
      sinon
        .mock( AnimalChat.KeysView.prototype )
        .expects( "addKey" )
        .once();

    var keys = new AnimalChat.Keys();
    var keysView = new AnimalChat.KeysView({ collection: keys });

    keys.add( new AnimalChat.Key() );

    mock.verify();
    AnimalChat.KeysView.prototype.addKey.restore();
  });

  it( "addKey", function(){
    var keys = new AnimalChat.Keys();
    var keysView = new AnimalChat.KeysView({ collection: keys });
    var key = new AnimalChat.Key({ key: "a", color: "color" });

    expect( $(keysView.el).find("li").length ).toEqual( 0 );

    keysView.addKey( key );

    expect( $(keysView.el).find("li").length ).toEqual( 1 );
  });
});


