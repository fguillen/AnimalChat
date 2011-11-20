require_relative "./test_helper"

class FakeSocket
  def onopen( &block )
    @onopen = block
  end

  def onmessage( &block )
    @onmessage = block
  end

  def onclose( &block )
    @onclose = block
  end

  def call_onopen
    @onopen.call
  end

  def call_onmessage( message )
    @onmessage.call( message )
  end

  def call_onclose
    @onclose.call
  end
end

class FakeChannel
  def subscribe( &block )
    @subscribe = block
    
    return "sid"
  end

  def call_subscribe( message )
    @subscribe.call( message )
  end
end

class ActorTest < Test::Unit::TestCase
  def setup
    AnimalChat::Logger.stubs( :log )
  end

  def test_actors
    assert_equal( [], AnimalChat::Actor.actors )
  end

  def test_get_color
    20.times do
      assert_match( /#[0-9a-f]{6}/, AnimalChat::Actor.get_color )
    end
  end

  def test_create_id
    assert_not_equal( AnimalChat::Actor.create_id, AnimalChat::Actor.create_id )
    assert( AnimalChat::Actor.create_id.is_a? Integer )
  end

  def test_initialize
    actor = AnimalChat::Actor.new( "socket", "channel" )
    assert_equal( "socket", actor.socket )
    assert_equal( "channel", actor.channel )
  end

  def test_setup
    AnimalChat::Actor.any_instance.expects(:init_socket).once
    AnimalChat::Actor.expects(:create_id).returns( "id" ).once
    AnimalChat::Actor.expects(:get_color).with( "id" ).returns( "color" ).once

    actor = AnimalChat::Actor.new( "socket", "channel" )
    actor.setup

    assert_equal( "socket", actor.socket )
    assert_equal( "channel", actor.channel )
    assert_equal( "id", actor.id )
    assert_equal( "color", actor.color )
    assert_equal( 1, AnimalChat::Actor.actors.size )
    assert_equal( actor, AnimalChat::Actor.actors.first )
  end

  def test_init_socket
    actor = AnimalChat::Actor.new( "socket", "channel" )

    actor.socket.expects(:onopen).once
    actor.socket.expects(:onmessage).once
    actor.socket.expects(:onclose).once

    actor.init_socket
  end

  def test_socket_onopen
    actor = AnimalChat::Actor.new( "socket", "channel" )
    fakeSocket = FakeSocket.new

    actor.expects(:start_communication).once
    actor.stubs(:socket).returns( fakeSocket )

    actor.init_socket

    fakeSocket.call_onopen
  end

  def test_socket_onmessage
    actor = AnimalChat::Actor.new( "socket", "channel" )
    fakeSocket = FakeSocket.new

    message = { "type" => "fake-message" }
    actor.expects(:publish).with( message ).once
    actor.stubs(:socket).returns( fakeSocket )

    actor.init_socket

    fakeSocket.call_onmessage( message.to_json )
  end


  def test_socket_onclose
    actor = AnimalChat::Actor.new( "socket", "channel" )
    fakeSocket = FakeSocket.new

    actor.expects(:close_communication)
    actor.stubs(:socket).returns( fakeSocket )

    actor.init_socket

    fakeSocket.call_onclose
  end

  def test_start_communication
    actor = AnimalChat::Actor.new( "socket", "channel" )

    actor.expects(:say_hello).once
    actor.expects(:say_actors).once
    actor.expects(:publish_your_self).once
    actor.expects(:channel_subscribe).once

    actor.start_communication
  end

  def test_channel_subscribe
    actor = AnimalChat::Actor.new( "socket", "channel" )
    
    fakeChannel = FakeChannel.new
    actor.stubs(:channel).returns( fakeChannel )

    actor.channel_subscribe
    
    assert_equal( "sid", actor.sid )

    actor.expects(:say).with( "message" )
    
    actor.channel.call_subscribe( "message" )
  end
  
  def test_close_communication
    actor = AnimalChat::Actor.new( "socket", "channel" )
    
    actor.stubs(:sid).returns( "sid" )
    actor.stubs(:to_hash).returns( "to-hash" )
    
    actor.channel.expects(:unsubscribe).with( "sid" ).once
    actor.expects(:publish).with({ :type => "goodbye", :actor => "to-hash" })
    
    AnimalChat::Actor.actors.expects(:delete).with( actor ).once
    
    actor.close_communication
  end
  
  def test_say
    actor = AnimalChat::Actor.new( "socket", "channel" )
    message = { "type" => "test" }
    actor.socket.expects(:send).with( message.to_json ).once
    
    actor.say message
  end
  
  def test_say_hello
    actor = AnimalChat::Actor.new( "socket", "channel" )
    actor.stubs(:to_hash).returns( "to-hash" )
    actor.expects(:say).with({ :type => "hello", :actor => "to-hash" })
    
    actor.say_hello
  end
  
  def test_say_actors
    actor1 = AnimalChat::Actor.new( "socket", "channel" )
    actor2 = AnimalChat::Actor.new( "socket", "channel" )
    actor1.expects(:to_hash).returns( "to-hash1" ).once
    actor2.expects(:to_hash).returns( "to-hash2" ).once
    AnimalChat::Actor.expects(:actors).returns( [actor1, actor2] ).once
    
    actor = AnimalChat::Actor.new( "socket", "channel" )
    actor.expects(:say).with({ :type => "actors", :actors => ["to-hash1", "to-hash2"] })
    
    actor.say_actors
  end
  
  def test_publish_your_self
    actor = AnimalChat::Actor.new( "socket", "channel" )
    actor.stubs(:to_hash).returns( "to-hash" )
    actor.expects(:publish).with({ :type => "actor", :actor => "to-hash" })
    
    actor.publish_your_self
  end
  
  def test_publish
    actor = AnimalChat::Actor.new( "socket", "channel" )
    actor.channel.expects(:push).with( "message" )
    
    actor.publish( "message" )
  end
  
  def test_to_hash
    actor = AnimalChat::Actor.new( "socket", "channel" )
    actor.stubs(:id).returns( "id" )
    actor.stubs(:color).returns( "color" )    
    
    assert_equal( "id", actor.to_hash[:id] )
    assert_equal( "color", actor.to_hash[:color] )
  end
  
end
