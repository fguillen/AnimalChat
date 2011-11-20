require 'em-websocket'
require 'json'

module AnimalChat
  class Actor
    attr_reader :id, :color, :sid, :socket, :channel

    @@actors = []

    COLORS = [
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
    
    def initialize( socket, channel )
      @socket  = socket
      @channel = channel
      @id      = create_id
      @color   = get_color( @id )
      
      init_socket
      
      @@actors << self
    end
    
    def init_socket
      socket.onopen do
        start_communication
      end

      socket.onmessage do |msg|
        msg = JSON.parse( msg )
        publish( msg )
      end

      socket.onclose do
        close_communication
      end
    end
    
    def start_communication
      say_hello
      say_actors
      publish_your_self

      @sid = channel.subscribe { |msg| say( msg ) }
    end
    
    def close_communication
      puts "close_communication"
      
      channel.unsubscribe( sid )
      publish({ :type => "goodbye", :actor => self.to_hash })
      
      @@actors.delete( self )
    end
    
    def get_color( index )
      COLORS[ (index - 1) % COLORS.size ]
    end

    def create_id
      "#{rand(1000)}#{Time.now.to_i}".to_i
    end
    
    def say( message )
      puts "actor #{id} sais: #{message}"
      socket.send( message.to_json )
    end
    
    def say_hello
      say({ :type => "hello", :actor => self.to_hash })
    end
    
    def say_actors
      say({ :type => "actors", :actors => @@actors.map { |e| e.to_hash } })
    end
    
    def publish_your_self
      publish({ :type => "actor", :actor => self.to_hash })
    end
    
    def publish( message )
      puts "actor #{id} publishs: #{message}"
      channel.push( message )
    end
      
    def to_hash
      {
        :id     => id,
        :color  => color,
      }
    end
    
  end
end

module AnimalChat
  class Server
    def initialize
      puts "AnimalChat sever initialization"
      @channel = EM::Channel.new
    end

    def connect
      EventMachine.run do
        EventMachine::WebSocket.start(:host => "0.0.0.0", :port => 8080, :debug => false) do |socket|
          puts "new Actor connected"
          Actor.new( socket, @channel )
        end
      end
    end
  end
end

AnimalChat::Server.new.connect