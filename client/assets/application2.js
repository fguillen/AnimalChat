var AppView;
var Radio;
var AlertView;
var Actor;
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
    el: "body",

    events: {
      "keypress":                 "sendKey",
      "click #retry-connection":  "connect",
    },

    initialize: function( options ){
      this.address     = options.address || "127.0.0.1";

      this.radio      = new Radio({ address: this.address });
      this.alert      = new Alert();
      this.alertView  = new AlertView({ model: this.alert });
      this.actors     = new Actors();
      this.actorsView = new ActorsView({ collection: this.actors });
      this.keys       = new Keys();
      this.keysView   = new KeysView({ collection: this.keys });

      this.me         = null; // initialized in the 'hello' message

      // events
      this.radio.bind( "connectionError" , this.alert.error      , this.alert );
      this.radio.bind( "connecting"      , this.alert.connecting , this.alert );
      this.radio.bind( "connected"       , this.alert.connected  , this.alert );
      this.radio.bind( "messageReceived" , this.messageReceived  , this );

      // show alert
      this.alertView.render();
    },

    connect: function(){
      this.radio.connect();
    },

    messageReceived: function( data ){
      var data = jQuery.parseJSON( data );

      switch( data.type ){
        case "hello":
          console.log( "messageReceived hello" );
          this.me = new Actor( data.actor );
          this.actors.add( this.me );
          break;

        case "actor":
          var actor = new Actor( data.actor );
          this.actors.add( actor );
          break;

        case "actors":
          this.actors.reset( data.actors );
          break;

        case "goodbye":
          this.actors.remove( data.actor.id );
          break;

        case "key":
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
    defaults: {
      "status": "hidden",
    },

    error: function(){
      this.set({ status: "error" });
    },

    connecting: function(){
      this.set({ status: "connecting" });
    },

    connected: function(){
      this.set({ status: "connected" });
      this.set({ status: "hidden" });
    },

    hidden: function(){
      this.set({ status: "hidden" });
    },

  });

  AlertView = Backbone.View.extend({
    initialize: function( options ){
      this.model = options.model;
      this.model.bind( "change", this.render, this );
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

  Actor = Backbone.Model.extend({
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
