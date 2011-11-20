require 'em-websocket'
require 'json'

module AnimalChat
  class Logger
    def self.log( message )
      puts "[#{Time.now.strftime( "%F %T")}] #{message}"
    end
  end
end

module AnimalChat
  class Actor
    attr_reader :id, :color, :sid, :socket, :channel

    @@actors = []

    def self.actors
      @@actors
    end

    def self.get_color
      # cc -> no too much bright
      "#%02x%02x%02x" % [(rand * 0xcc), (rand * 0xcc), (rand * 0xcc)]
    end

    def self.create_id
      "#{rand(1000)}#{Time.now.to_i}".to_i
    end

    def initialize( socket, channel )
      @socket   = socket
      @channel  = channel
    end

    def setup
      @id     = AnimalChat::Actor.create_id
      @color  = AnimalChat::Actor.get_color( @id )

      init_socket

      AnimalChat::Actor.actors << self
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
      channel_subscribe
    end

    def channel_subscribe
      @sid = channel.subscribe { |msg| say( msg ) }
    end

    def close_communication
      AnimalChat::Logger.log "close_communication"

      channel.unsubscribe( sid )
      publish({ :type => "goodbye", :actor => self.to_hash })

      AnimalChat::Actor.actors.delete( self )
    end

    def say( message )
      AnimalChat::Logger.log "actor #{id} sais: #{message}"
      socket.send( message.to_json )
    end

    def say_hello
      say({ :type => "hello", :actor => self.to_hash })
    end

    def say_actors
      say({ :type => "actors", :actors => AnimalChat::Actor.actors.map { |e| e.to_hash } })
    end

    def publish_your_self
      publish({ :type => "actor", :actor => self.to_hash })
    end

    def publish( message )
      AnimalChat::Logger.log "actor #{id} publishs: #{message}"
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
    attr_reader :address, :channel

    def initialize( address )
      @address = address
      @channel = EM::Channel.new
    end

    def start
      AnimalChat::Logger.log "AnimalChat sever starting in #{address}:8080"

      EventMachine.run do
        EventMachine::WebSocket.start(:host => address, :port => 8080) do |socket|
          AnimalChat::Logger.log "new Actor connected"
          Actor.new( socket, channel ).setup
        end
      end
    end
  end
end