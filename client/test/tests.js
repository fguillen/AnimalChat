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


});