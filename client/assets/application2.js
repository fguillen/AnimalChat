$(function(){
  var Radio = Backbone.Model.extend({
    broadcast: function( key ){
      console.log( "broadcast: ", key );
    },

    connect: function(){
      console.log( "connecting" );
      
      _self = this;
      this.trigger( "connecting" );
      
      var Socket = ("MozWebSocket" in window) ? MozWebSocket : WebSocket;
      this.socket = new Socket("ws://" + this.address + ":8080/");

      this.socket.onmessage = function( evt ) {
        console.log( "message received:" + evt.data );
        this.messageReceived( evt.data )
      };

      this.socket.onclose = function() {
        console.log("socket closed");
        _self.trigger( "connectionError" );
        // connectionError( this.socket );
      };

      this.socket.onerror = function() {
        console.log("socket error!");
        // connectionError( ws );
      };

      this.socket.onopen = function() {
        console.log("connected...");
        // hideLightBox();
      };
    },

    messageReceived: function( message ){
      console.log( "mesage received: ", mesage );
    }
  });

  var AppView = Backbone.View.extend({
    defaults: {
      // "address": "127.0.0.1",
      "address": "animalchat.fernandoguillen.info";
      
    },
    
    el: "body",
    

    initialize: function( options ){
      this.me       = new Actor();
      this.actors   = new Actors();
      this.scene    = new MessagesView();
      this.alert    = new Alert({ status: 'pepe' });
      
      console.log( "alert.status: ", this.alert.get('status') );
      
      this.radio    = new Radio();
      
      this.alertView = new AlertView({ model: this.alert });
      this.alertView.render();
      
      this.radio.bind( "connectionError" , this.alert.error      , this.alert );
      this.radio.bind( "connecting"      , this.alert.connecting , this.alert );
      
      this.radio.connect();
    },

    events: {
      "keypress": "sendKey"
    },
    
    sendKey: function( event ){
      console.log( "key pressed: ", event );
      this.radio.broadcast( event.which );
    }


  });


  var Alert = Backbone.Model.extend({
    defaults: {
      "status": "hidden",
    },
    
    error: function(){
      console.log( "alert to error" );
      console.log( "this.get('status'): ", this.get('status') );
      this.set({ status: "error" });
      console.log( "this.get('status'): ", this.get('status') );
    },
    
    connecting: function(){
      console.log( "alert to connecting" );
      this.set({ status: "connecting" });
    },
    
    hidden: function(){
      console.log( "alert to hidden" );
      this.set({ status: "hidden" });
    },
    
    initialize: function(){
      console.log( "Alert initialize" );
      console.log( "Alert status: " + this.get('status') );

      
    }
  });

  var AlertView = Backbone.View.extend({
    initialize: function(){
      console.log( "initalizing AlertView" );
      this.model.bind( "change", this.render, this );
      console.log( "initalizing AlertView, model.status: ", this.model );
    },
    
    render: function(){
      console.log( "rendering alert: ", this.model );
      switch( this.model.status ){
        case "hidden":
          console.log( "alert status hidden" );
          break;
        case "error":
          console.log( "alert status error" );
          break;
        case "connecting":
          console.log( "alert status connecting" );
          break;
        default:
          console.error( "alert status not found: ", this.model.status );
      }
    }
  });

  var Actor = Backbone.Model.extend({
    defaults: {
    },

    initialize: function( data ){
      this.id     = data.id;
      this.color  = data.color;
    },

    messageReceived: function( key ){}
  });

  var Actors = Backbone.Collection.extend({
    model: Actor
  })

  var ActorView = Backbone.View.extend({
    tagName:  "li",
    model:    Actor,
    bump:     function(){},
    unbump:   function(){}
  });

  var ActorsView = Backbone.View.extend({
    el:           "#actors ul",
    collection:   Actors
  });

  var Message = Backbone.Model.extend({
    initialize: function( message ){
      console.log( "creating message: ", message );
    }
  });

  var Messages = Backbone.Collection.extend({
    model: Message
  });

  var MessagesView = Backbone.View.extend({
    el: "scene",
    collection: Messages
  });


  window.App = new AppView();
});
