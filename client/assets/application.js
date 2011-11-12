
var colors = [
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
];

function color( index ){
  return colors[ (index - 1) % colors.length ];
}

function debug( string ) {
  console.log( string );
};

var normalSize = 40;

function actorWriting( json ){
  $("#scene").append( "<span style='color: " + color( json.id ) + "'>" + json.char + "</span>" );
  
  $('#actor-' + json.id).stop(true);

  $('#actor-' + json.id).animate({
    scale: '2'
  }, 200).animate({
    scale: '1'
  }, 100);
  
  
  // $('#actor-' + json.id).animate({
  //   width: ($('#actor-' + json.id).width() + 5) + "px",
  //   height: ($('#actor-' + json.id).height() + 5) + "px"
  // }, 200).animate({
  //   width: normalSize + "px",
  //   height: normalSize + "px"
  // }, 100);
}

function message( message ){
  var json = jQuery.parseJSON( message );

  switch( json.type ){
    case "message":
      actorWriting( json );
      break;
    case "hello":
      break;
    case "goodbye":
      removeActor( json.id );
      break;
    case "actor":
      addActor( json.id );
      break;
    case "actors":
      for( index in json.actors ){
        addActor( json.actors[index] );
      }
      break;
    default:
      debug( "message type unknown:" + json.type );
  }


}

function addActor( id ){
  $("#actors ul").append( "<li id='actor-" + id + "' style='display:none; background-color: " + color( id ) + "'></li>");
  $("#actor-" + id).fadeIn( "slow" );
}

function removeActor( id ){
  $("#actor-" + id).fadeOut( "slow" );
}

function connectionError( webSocket ){
  showConnectionError();
  webSocket.close();
}

function showConnectionError() {
  $('#light-box #connecting-problem .spinner').fadeOut('fast');
  
  $('#light-box #connecting').stop().fadeOut('fast');
  
  $('#light-box').stop().fadeIn(
    'fast',
    function(){
      $('#light-box #connecting-problem').stop().fadeIn('slow');
    }
  );
}

function showConnecting() {
  $('#light-box #connecting').show();
  
  $('#light-box').show();
}

function hideLightBox(){
  $('#light-box #connecting-problem .spinner').fadeOut('fast');
  $('#light-box #connecting-problem').fadeOut('fast');
  $('#light-box #connecting').fadeOut('fast');
  $('#light-box').stop(true).fadeOut('fast');
}

var ws = null;
function connect() {
  // var address = "127.0.0.1";
  var address = "animalchat.fernandoguillen.info";
  
  var Socket = ("MozWebSocket" in window) ? MozWebSocket : WebSocket;
  ws = new Socket("ws://" + address + ":8080/");

  ws.onmessage = function(evt) {
    debug( "message received:" + evt.data );
    message( evt.data )
  };

  ws.onclose = function() {
    debug("socket closed");
    connectionError( ws );
  };

  ws.onerror = function() {
    debug("socket error!");
    connectionError( ws );
  };

  ws.onopen = function() {
    debug("connected...");
    hideLightBox();
  };

  debug( "connect end" );
};

$(function(){
  showConnecting();
  connect();

  $("body").keypress(
    function( event ){
      event.preventDefault();

      var key = String.fromCharCode( event.which );

      debug( "key pressed:" + key );

      if( ws.readyState != 1 ){
        debug( "socket not ready" );
        return;
      }

      ws.send( key );
    }
  );
  
  $("#retry-connection").click( function(){
    $('#light-box #connecting-problem .spinner').fadeIn('fast');
    connect();
  });

});