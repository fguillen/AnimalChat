$(document).ready(function(){

  // Radio
  module( "Radio" );
  
  test( "initialize", function() {
    var radio = new Radio( { address: "address" } );
  
    equal( "address", radio.get( "address" ) );
  });
  
  test( "broadcast", function() {
    var radio = new Radio( { address: "address" } );
    radio.socket = { send: function() {} };
  
    var mock =
      sinon
        .mock( radio.socket )
        .expects( "send" )
        .withExactArgs( "{\"message\":\"wadus\"}" )
        .once();
  
    radio.broadcast( { message: "wadus" } );
  
    mock.verify();
    radio.socket.send.restore();
  });
  
  test( "connect", function() {
    var radio = new Radio( { address: "address" } );
  
    BrowserSocket =
      function( address ){
        this.address = address;
      };
  
    radio.connect();
    equal( "ws://address:8080/", radio.socket.address );
  
    // onmessage
    var spyMessageReceived = sinon.spy();
    radio.bind( "messageReceived" , spyMessageReceived );
    radio.socket.onmessage( { data: "this is data" } );
    equal( true, spyMessageReceived.called );
  
    // onclose
    var spyConnectionError = sinon.spy();
    radio.bind( "connectionError" , spyConnectionError );
    radio.socket.onclose();
    equal( true, spyConnectionError.called );
  
    // onopen
    var spyConnected = sinon.spy();
    radio.bind( "connected" , spyConnected );
    radio.socket.onopen();
    equal( true, spyConnected.called );
  
  });
  
  
  module( "AppView" );
  
  test( "initialize", function(){
    var mock =
      sinon
        .mock( AlertView.prototype )
        .expects( "render" )
        .once();
  
    var app = new AppView({ address: "address" });
  
    equal( typeof(app.radio)      , "object" );
    equal( typeof(app.alert)      , "object" );
    equal( typeof(app.alertView)  , "object" );
    equal( typeof(app.actors)     , "object" );
    equal( typeof(app.actorsView) , "object" );
    equal( typeof(app.keys)       , "object" );
    equal( typeof(app.keysView)   , "object" );
  
    equal( app.radio.get( "address" ) , "address" );
    equal( app.alertView.model        , app.alert );
    equal( app.actorsView.collection  , app.actors );
    equal( app.keysView.collection  , app.keys );
  
    mock.verify();
    AlertView.prototype.render.restore();
  });
  
  test( "connect", function() {
    var app = new AppView({});
  
    var mock =
      sinon
        .mock( app.radio )
        .expects( "connect" )
        .once();
  
    app.connect();
  
    mock.verify();
    app.radio.connect.restore();
  });

  test( "event keypress", function() {
    var mock =
      sinon
        .mock( AppView.prototype )
        .expects( "sendKey" )
        .once();
    
    var app = new AppView({});
    
    $("body").keypress();
    
    mock.verify();
    AppView.prototype.sendKey.restore();
  });
  
  // test( "event retry-connection", function() {
  //   var mock =
  //     sinon
  //       .mock( AppView.prototype )
  //       .expects( "connect" )
  //       .once();
  //   
  //   var app = new AppView({});
  //   
  //   $("#retry-connection").click();
  //   
  //   mock.verify();
  //   AppView.prototype.connect.restore();
  // });
  
  test( "messageReceived hello", function() {
    var app = new AppView({});
    equal( app.me, null );
    equal( app.actors.length, 0 );
  
    var message = JSON.stringify({ type: "hello", actor: { id: "id", color: "color" } });
    app.messageReceived( message );
  
    equal( app.me.id, "id" );
    equal( app.me.color, "color" );
    equal( app.actors.length, 1 );
    equal( app.actors.get( "id" ), app.me );
  });
  
  test( "messageReceived actor", function() {
    var app = new AppView({});
    equal( app.actors.length, 0 );
  
    var message = JSON.stringify({ type: "actor", actor: { id: "id", color: "color" } });
    app.messageReceived( message );
  
    equal( app.actors.length, 1 );  
    equal( app.actors.get( "id" ).get( "color" ), "color" );
  });
  
  test( "messageReceived actors", function() {
    var app = new AppView({});
    equal( app.actors.length, 0 );
  
    var message = 
      JSON.stringify({ 
        type: "actors", 
        actors: [
          { id: "id1", color: "color1" },
          { id: "id2", color: "color2" },
        ],
      });
      
    app.messageReceived( message );
  
    equal( app.actors.length, 2 );
    equal( app.actors.get( "id2" ).get( "color" ), "color2" );
  });
  
  test( "messageReceived goodbye", function() {
    var app = new AppView({});
    
    var actor = new Actor({ id: "id", color: "color" });
    app.actors.add( actor );
    
    equal( app.actors.length, 1 );
  
    var message = JSON.stringify({ type: "goodbye", actor: { id: "id" } });
    app.messageReceived( message );
  
    equal( app.actors.length, 0 );
  });
  
  test( "messageReceived key", function() {
    var app = new AppView({});
    equal( app.keys.length, 0 );
  
    var message = 
      JSON.stringify({ 
        type: "key", 
        actor: { id: "id", color: "color" },
        key: "x"
      });
      
    app.messageReceived( message );
  
    equal( app.keys.length, 1 );
  });
  
  test( "sendKey", function() {
    var app = new AppView({});
    
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