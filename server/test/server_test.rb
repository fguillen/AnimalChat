require_relative "./test_helper"

module EventMachine
  def self.run( &block )
    block.call
  end
end

module EventMachine::WebSocket
  def self.start( opts, &block )
    block.call( "socket" )
  end
end

class ServerTest < Test::Unit::TestCase
  def setup
    AnimalChat::Logger.stubs( :log )
    @server = AnimalChat::Server.new( "address" )
  end

  def test_initialize
    assert_equal( "address", @server.address )
    assert_not_nil( @server.channel )
  end

  def test_start
    AnimalChat::Actor.any_instance.expects(:setup)
    @server.start
  end
end