var AppView;
var Radio;
var AlertView;
var BrowserSocket = ("MozWebSocket" in window) ? MozWebSocket : WebSocket;

$(function(){
  Radio = Backbone.Model.extend({
    defaults: {
      "address": "127.0.0.1",
    },
    
    initialize: function(){
      console.log( "Radio initialize address: ", this.get( "address" ) );
    },
    
    broadcast: function( message ){
      console.log( "broadcast: ", message );
      this.socket.send( JSON.stringify( message ) );
    },

    connect: function(){
      console.log( "connecting to: ", this.address );
      var _self = this;
      this.trigger( "connecting" );

      this.socket = new BrowserSocket("ws://" + this.get("address") + ":8080/");

      this.socket.onmessage = function( message ) {
        console.log( "message received: " + message );
        _self.trigger( "messageReceived", message.data );
      };

      this.socket.onclose = function() {
        console.log("socket closed");
        _self.trigger( "connectionError" );
      };

      this.socket.onerror = function() {
        console.log("socket error!");
      };

      this.socket.onopen = function() {
        console.log("connected...");
        _self.trigger( "connected" );
      };
    }

  });

  AppView = Backbone.View.extend({
    defaults: {
      "address": "127.0.0.1",
    },

    el: "body",
    
    events: {
      "keypress":                 "sendKey",
      "click #retry-connection":  "connect",
    },

    initialize: function( options ){
      this.address     = options.address;
      
      console.log( "AlertView initialize address: ", this.address );
      
      this.radio      = new Radio({ address: this.address });
      this.alert      = new Alert();
      this.alertView  = new AlertView({ model: this.alert });
      this.actors     = new Actors();
      this.actorsView = new ActorsView({ collection: this.actors });
      this.keys       = new Keys();
      this.keysView   = new KeysView({ collection: this.keys });
      
      this.me         = null;
      
      // events
      this.radio.bind( "connectionError" , this.alert.error      , this.alert );
      this.radio.bind( "connecting"      , this.alert.connecting , this.alert );
      this.radio.bind( "connected"       , this.alert.connected  , this.alert );
      this.radio.bind( "messageReceived" , this.messageReceived  , this );
      
      // show alert
      this.alertView.render();
    },
    
    connect: function(){
      console.log( "ActorsView.connect" );
      this.radio.connect();
    },

    messageReceived: function( data ){
      var data = jQuery.parseJSON( data );
      console.log( "messageReceived: ", data );
      console.log( "messageReceived type: ", data.type );

      switch( data.type ){
        case "hello":
          console.log( "message hello received" );
          this.me = new Actor( data.actor );
          this.actors.add( this.me );
          break;
          
        case "actor":
          console.log( "message actor received" );
          var actor = new Actor( data.actor );
          this.actors.add( actor );
          break;

        case "actors":
          console.log( "message actors received" );
          var _self = this;
          this.actors.reset( data.actors );
          break;
          
        case "goodbye":
          console.log( "message goodbye received" );
          var actor = new Actor( data.actor );
          this.actors.remove( actor );
          break;

        case "key":
          console.log( "message key received" );
          var key = new Key({ color: data.actor.color, key: data.key });
          this.keys.add( key );
          break;
          
        default:
          console.error( "message type unknown: " + data.type );
      }
    },

    sendKey: function( event ){
      console.log( "key pressed: ", event );
      this.radio.broadcast( { type: "key", actor: this.me, key: String.fromCharCode( event.which ) } );
    }


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

    connected: function(){
      console.log( "alert to connected" );
      this.set({ status: "connected" });
      this.set({ status: "hidden" });
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

  AlertView = Backbone.View.extend({
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

          $('#light-box #connecting-problem').stop(true).fadeOut('fast');
          $('#light-box #connecting').stop(true).fadeOut('fast');
          $('#light-box').stop(true).fadeOut('fast');

          break;
        case "error":
          console.log( "alert status error" );

          $('#light-box').stop(true).show();
          $('#light-box #connecting').stop(true).fadeOut();
          $('#light-box #connecting-problem').stop(true).fadeIn('slow');

          break;
        case "connecting":
          console.log( "alert status connecting" );

          $('#light-box #connecting-problem').stop(true).hide();
          $('#light-box').stop(true).show();
          $('#light-box #connecting').stop(true).show();


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
      console.log( "initialize actor: ", data );
      this.id     = data.id;
      this.color  = data.color;
    }
  });

  var Actors = Backbone.Collection.extend({
    model: Actor,

    initialize: function(){
    },

  });

  var ActorsView = Backbone.View.extend({
    el: "#actors ul",

    initialize: function( options ){
      console.log( "ActorsView initialize" );

      this.collection.bind( 'add',      this.addActor,    this );
      this.collection.bind( 'reset',    this.render,      this );
      this.collection.bind( 'remove',   this.removeActor, this );
    },

    addActor: function( actor ){
      console.log( "addActor: ", actor );
      var view = new ActorView({ model: actor });
      $(this.el).append( view.render() );
    },
    
    removeActor: function( actor ){
      console.log( "removeActor: ", actor );
      $(this.el).find("li#actor-" + actor.id ).fadeOut('slow');
    },

    render: function(){
      console.log( "ActorsView render" );

      var _self = this;
      this.collection.each( function( actor ){
        console.log( "creating new ActorView: ", actor );
        var view = new ActorView({ model: actor });
        console.log( "this: ", _self );  
        console.log( "el: ", $(_self.el) );
        $(_self.el).append( view.render() );
      });
    }




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

  var Key = Backbone.Model.extend({
    initialize: function( options ){
      console.log( "creating key: ", options );
      this.color = options.color;
      this.key   = options.key;
    }
  });

  var Keys = Backbone.Collection.extend({
    initialize: function( options ){
    }
  });

  var KeyView = Backbone.View.extend({
    template: _.template( "<span style='color: <%= color %>'><%= key %></span>" ),
    render:   function(){
      console.log( "rendering KeyView: ", this.model.toJSON() );
      return this.template( this.model.toJSON() );
    }
  });

  var KeysView = Backbone.View.extend({
    el: "#scene",
    
    initialize: function(){
      console.log( "KeysView initialize" );
      
      this.collection.bind( "add", this.addKey, this );
    },
    
    addKey: function( key ){
      console.log( "addKey: ", key );
      console.log( "addKey escaped: ", escape( key.key ) );
      key.key = escape( key.key );
      console.log( "addKey: ", key );
      var view = new KeyView({ model: key });
      $(this.el).append( view.render() );
    }
  });


  // window.App = new AppView({ address: '127.0.0.1' }); #animalchat.fernandoguillen.info
  // window.App.connect();
});
