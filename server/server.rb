require 'em-websocket'
require 'json'


@actors     = []
@channel    = EM::Channel.new
@last_index = 0

def send_actors( actor )
  actor[:ws].send(
    {:type => "actors", :actors => @actors.map{ |e| e[:id] }}.to_json
  )
end

def next_index
  @last_index += 1
end

EventMachine.run {

  EventMachine::WebSocket.start(:host => "0.0.0.0", :port => 8080, :debug => true) do |ws|
    
    actor = {}
    
    ws.onopen {
      actor = {:id => next_index, :ws => ws}

      ws.send( {:type => "hello", :id => actor[:id]}.to_json )
      
      @actors << actor
      
      @channel.push(
        {:type => "actor", :id => actor[:id]}.to_json
      )
      
      actor[:sid] = @channel.subscribe { |msg| actor[:ws].send( msg ) }
      
      send_actors( actor )
    }

    ws.onmessage { |msg|
      @channel.push(
        {:type => "message", :id => actor[:id], :char => msg.gsub(/[^\w\s]/, '-')}.to_json
      )
    }

    ws.onclose {
      @channel.unsubscribe( actor[:sid] )
      @channel.push( 
        {:type => "goodbye", :id => actor[:id]}.to_json
      )
      @actors.delete( actor )
    }

  end

  puts "Server started"
}
