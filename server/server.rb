require 'ostruct'
require 'em-websocket'
require 'json'


class Actor
  attr_accessor :id, :color, :sid, :socket
  
  def to_json
    {
      :id     => @id,
      :color  => @color,
    }
  end
end

@colors = [
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
]

def get_color( index )
  @colors[ (index - 1) % @colors.size ]
end

def create_id
  "#{rand(1000)}#{Time.now.to_i}".to_i
end

@sockets    = []
@actors     = []
@channel    = EM::Channel.new
@last_index = 0

def send_actors( actor )
  actor.socket.send(
    {:type => "actors", :actors => @actors.map{ |e| e.to_json }}.to_json
  )
end

def next_index
  @last_index += 1
end


EventMachine.run {

  EventMachine::WebSocket.start(:host => "0.0.0.0", :port => 8080, :debug => true) do |socket|

    actor = Actor.new
    actor.socket  = socket
    actor.id      = create_id
    actor.color   = get_color( actor.id )

    socket.onopen {
      # actor = {:socket => socket}


      # socket.send( {:type => "hello", :id => actor[:id]}.to_json )

      # @actors << actor

      # @channel.push({:type => "actor", :id => actor[:id]}.to_json)
      
      actor.socket.send({ :type => "hello", :actor => actor.to_json}.to_json )

      send_actors( actor )
      
      @actors << actor
      
      @channel.push( {:type => "actor", :actor => actor.to_json}.to_json )
      
      sid = @channel.subscribe { |msg|
        puts "XXX: msg: #{msg.inspect}"
        actor.socket.send( msg )
      }
      
      actor.sid = sid
      
      

    }

    socket.onmessage do |msg|
      puts "XXX: msg: #{msg}"
      msg = JSON.parse( msg )
      puts "XXX: msg JSON: #{msg}"
      
      @channel.push( msg.to_json )
    end

    socket.onclose {
      puts "XXX: actor closing: #{actor.id}"
      @channel.unsubscribe( actor.sid )
      @channel.push(
        {:type => "goodbye", :actor => actor.to_json}.to_json
      )
      @actors.delete( actor )
    }
  end

  puts "Server started"
}
