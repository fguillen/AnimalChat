$(function(){
  var Radio = Backbone.Model.extend({
    initialize: function( options ){
      this.address = options.address;
    },
    
    broadcast: function( message ){
      console.log( "broadcast: ", message );
      this.socket.send( JSON.stringify( message ) );
    },

    connect: function(){
      console.log( "connecting to: ", this.address );
      
      _self = this;
      this.trigger( "connecting" );
      
      var Socket = ("MozWebSocket" in window) ? MozWebSocket : WebSocket;
      this.socket = new Socket("ws://" + this.address + ":8080/");

      this.socket.onmessage = function( message ) {
        console.log( "message received: " + message );
        _self.trigger( "messageReceived", message.data );
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
        _self.trigger( "connected" );
      };
    }
    
  });

  var AppView = Backbone.View.extend({
    defaults: {
      // "address": "127.0.0.1",
      "address": "animalchat.fernandoguillen.info"
      
    },
    
    el: "body",
    

    initialize: function( options ){
      console.log( "initialize AppView" );
      console.log( "AppView.address: ", options.address );
      
      this.address  = options.address;
      
      var meId    = Math.floor(Math.random() * 1000) + "" + (new Date()).getTime();
      var meColor = AppView.colors[ (meId - 1) % AppView.colors.length ]
      
      this.me       = new Actor({ id: meId , color: meColor });
      this.actors   = new Actors();
      this.scene    = new MessagesView();
      this.alert    = new Alert();
      
      console.log( "alert.status: ", this.alert.get('status') );
      
      this.radio    = new Radio({ address: this.address });
      
      this.alertView = new AlertView({ model: this.alert });
      this.alertView.render();
      
      this.radio.bind( "connectionError" , this.alert.error      , this.alert );
      this.radio.bind( "connecting"      , this.alert.connecting , this.alert );
      this.radio.bind( "connected"       , this.sayHello         , this );
      this.radio.bind( "messageReceived" , this.messageReceived  , this );
      
      this.radio.connect();
      
      this.actors.bind( 'add', this.addActor, this );
      this.actors.add( this.me );
    },
    
    messageReceived: function( data ){
      console.log( "messageReceived: ", data );
    },
    
    sayHello: function(){
      console.log( "sayHello" );
      
      this.radio.broadcast({
        type: "hello",
        actor: this.me.toJSON()
      })
    },
    
    addActor: function( actor ){
      console.log( "addActor: ", actor );
      var view = new ActorView({ model: actor });
      $("#actors ul").append( view.render() );
    },

    events: {
      "keypress": "sendKey"
    },
    
    sendKey: function( event ){
      console.log( "key pressed: ", event );
      this.radio.broadcast( event.which );
    }


  }, {
    colors: [
      "#00FF00",
      "#00FFFF",
      "#FFFF00",
      "#006600",
      "#0066FF",
      "#003300",
      "#0033FF",
      "#000000",
      "#FF6600",
      "#FF66FF",
      "#FF3300"
    ], 
  });


  var Alert = Backbone.Model.extend({
    initialize: function( options ){
    },
    
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
    initialize: function( options ){
      console.log( "initalizing AlertView" );
      this.model = options.model;
      this.model.bind( "change", this.render, this );
      console.log( "initalizing AlertView, model.status: ", this.model.get( 'status' ) );
    },
    
    render: function(){
      console.log( "rendering alert: ", this.model.get( 'status' ) );
      switch( this.model.get( 'status' ) ){
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
          console.error( "alert status not found: ", this.model.get( 'status' ) );
      }
    }
  });

  var Actor = Backbone.Model.extend({
    defaults: {
    },

    initialize: function( data ){
      this.id     = data.id;
      this.color  = data.color;
    }
  });

  var Actors = Backbone.Collection.extend({
    model: Actor
  });

  var ActorView = Backbone.View.extend({
    template: _.template( "<li id='actor-<%= id %>' style='background-color: <%= color %>'>xx</li>" ),
    bump:     function(){},
    unbump:   function(){},
    render:   function(){
      console.log( "rendering ActorView: ", this.model.toJSON() );
      return this.template( this.model.toJSON() );
    }
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


  window.App = new AppView({ address: '127.0.0.1' });
});
