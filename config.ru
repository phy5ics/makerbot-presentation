$stdout.sync = true

require 'sinatra/base'
require './app'

map '/' do
  run Makerbot::App
end

map '/js' do 
  run Rack::Directory.new("./views/js")  
end

map '/gfx' do 
  run Rack::Directory.new("./views/gfx")  
end