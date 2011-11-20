//
// Animal Chat
// Code: https://github.com/fguillen/AnimalChat
// Author: Fernando Guillen (http://fernandoguillen.info)
// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
//

var BrowserSocket = ("MozWebSocket" in window) ? MozWebSocket : WebSocket;
var AnimalChat = {};


function clean( string ) {
  result =
    string
      .replace(/&/g, "&amp;")
      .replace(/>/g, "&gt;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;")
      .replace(/"/g, "&quot;")
      .replace(/\s/g, "&nbsp;");
  
  return result;
}

$(function(){
  AnimalChat.Radio = Backbone.Model.extend({
    defaults: {
      "address": "127.0.0.1",
    },

    broadcast: function( message ){
      console.log( "broadcast: ", message );
      this.socket.send( JSON.stringify( message ) );
    },

    connect: function(){
      console.log( "connecting to: ", this.get( "address" ) );
      this.trigger( "connecting" );
      this.socket = new BrowserSocket("ws://" + this.get( "address" ) + ":8080/");

      var _self = this;

      this.socket.onmessage = function( message ) {
        console.log( "message received: ", message.data );
        _self.trigger( "messageReceived", message.data );
      };

      this.socket.onclose = function() {
        console.log("socket closed");
        _self.trigger( "connectionError" );
      };

      this.socket.onerror = function() {
        console.error("socket error!");
      };

      this.socket.onopen = function() {
        console.log("connected...");
        _self.trigger( "connected" );
      };
    }

  });

  AnimalChat.AppView = Backbone.View.extend({
    el: "body",

    events: {
      "click #retry-connection":  "connect",
    },

    initialize: function( options ){
      this.address     = options.address || "127.0.0.1";

      this.radio      = new AnimalChat.Radio({ address: this.address });
      this.alert      = new AnimalChat.Alert();
      this.alertView  = new AnimalChat.AlertView({ model: this.alert });
      this.actors     = new AnimalChat.Actors();
      this.actorsView = new AnimalChat.ActorsView({ collection: this.actors });
      this.keys       = new AnimalChat.Keys();
      this.keysView   = new AnimalChat.KeysView({ collection: this.keys });

      this.me         = null; // initialized in the "hello" message

      // events
      this.radio.bind( "connectionError" , this.alert.error      , this.alert );
      this.radio.bind( "connecting"      , this.alert.connecting , this.alert );
      this.radio.bind( "connected"       , this.alert.connected  , this.alert );
      this.radio.bind( "messageReceived" , this.messageReceived  , this );

      // keypress event
      $(document).keypress( $.proxy( this.sendKey, this ) );

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
          this.me = new AnimalChat.Actor( data.actor );
          this.actors.add( this.me );
          break;

        case "actor":
          var actor = new AnimalChat.Actor( data.actor );
          this.actors.add( actor );
          break;

        case "actors":
          this.actors.reset( data.actors );
          break;

        case "goodbye":
          this.actors.remove( data.actor.id );
          break;

        case "key":
          var key = new AnimalChat.Key({ color: data.actor.color, key: data.key });
          this.keys.add( key );
          $("#actor-" + data.actor.id ).stop( true );
          $("#actor-" + data.actor.id ).css({ transform: "scale(1.5)", zIndex: "10"  });
          $("#actor-" + data.actor.id ).animate({ transform: 'scale(1)', zIndex: "0"  }, 300 );
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


  AnimalChat.Alert = Backbone.Model.extend({
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

  AnimalChat.AlertView = Backbone.View.extend({
    initialize: function( options ){
      this.model.bind( "change", this.render, this );
    },

    render: function(){
      switch( this.model.get( "status" ) ){
        case "hidden":
          $("#light-box #connecting-problem").stop(true).fadeOut( 200 );
          $("#light-box #connecting").stop(true).fadeOut( 200 );
          $("#light-box").stop(true).fadeOut( 200 );
          break;

        case "error":
          $("#light-box").stop(true).fadeIn( 100 );
          $("#light-box #connecting").stop(true).hide();
          $("#light-box #connecting-problem").stop(true).fadeIn( 600 );
          break;

        case "connecting":
          $("#light-box #connecting-problem").stop(true).hide();
          $("#light-box").stop(true).show();
          $("#light-box #connecting").stop(true).show();
          break;

        default:
          console.error( "alert status not found: ", this.model.get( "status" ) );
      }
    }
  });

  AnimalChat.Actor = Backbone.Model.extend({
    defaults: {
      "id":     "none",
      "color":  "none"
    }
  });

  AnimalChat.ActorView = Backbone.View.extend({
    model: AnimalChat.Actor,
    template: _.template( "<div id='actor-<%= id %>' style='background-color: <%= color %>' />" ),

    bump:     function(){},
    unbump:   function(){},

    render:   function(){
      this.el = this.template( this.model.attributes );
      return this;
    }
  });

  AnimalChat.Actors = Backbone.Collection.extend({
    model: AnimalChat.Actor
  });

  AnimalChat.ActorsView = Backbone.View.extend({
    collection: AnimalChat.Actors,
    el: "#actors",

    initialize: function( options ){
      this.collection.bind( "add",    this.addActor,    this );
      this.collection.bind( "reset",  this.render,      this );
      this.collection.bind( "remove", this.removeActor, this );
    },

    addActor: function( actor ){
      var view = new AnimalChat.ActorView({ model: actor });
      $(this.el).append( view.render().el );
    },

    removeActor: function( actor ){
      $(this.el).find("div#actor-" + actor.get( "id" ) ).stop( true ).fadeOut( 600, function(){
        $(this).remove();
      });
    },

    render: function(){
      $(this.el).empty();
      this.collection.each( $.proxy( this.addActor, this ) );
    }
  });



  AnimalChat.Key = Backbone.Model.extend({
    defaults: {
      "key":    "x",
      "color":  "none"
    }
  });

  AnimalChat.KeyView = Backbone.View.extend({
    model: AnimalChat.Key,
    template: _.template( "<li style='color: <%= color %>'><%= clean( key ) %></li>" ),
    render: function(){
      this.el = this.template( this.model.attributes );
      return this;
    }
  });

  AnimalChat.Keys = Backbone.Collection.extend({
    model: AnimalChat.Key
  });

  AnimalChat.KeysView = Backbone.View.extend({
    collection: AnimalChat.Keys,
    el: "#scene ul",

    initialize: function(){
      this.collection.bind( "add", this.addKey, this );
    },

    addKey: function( key ){
      var view = new AnimalChat.KeyView({ model: key });
      var element = $(view.render().el);
      element.css({ transform: "scale(1.5)" });
      element.animate({ transform: 'scale(1)' }, 100 );
      $(this.el).append( element );
    }
  });
});
