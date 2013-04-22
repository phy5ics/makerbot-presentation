require 'rubygems'
require 'sinatra'
require 'sinatra/flash'
require "sinatra/reloader" if development?
require 'haml'
require 'sass'
require 'compass'
require 'mongoid'
require 'susy'
require 'omniauth'
require 'omniauth-foursquare'
require 'foursquare2'

require_relative './models/checkins'

set :environment, ENV['RACK_ENV']

configure do
	Mongoid.configure do |config|
		Mongoid.load!('config/mongoid.yml')
		# Mongoid.logger = nil
	end
	
	Compass.configuration do |config|
		config.project_path = File.dirname __FILE__
		config.sass_dir = 'views/css'
	end

	set :sass, Compass.sass_engine_options
end

module Makerbot
  class App < Sinatra::Base
		set :sessions, true
		
		use OmniAuth::Builder do
			provider :foursquare, ENV['FOURSQUARE_CLIENT_ID'], ENV['FOURSQUARE_CLIENT_SECRET']
		end
   
    get '/' do
			@js = ['/js/jquery-1.9.1.min.js', 'http://use.typekit.net/ibh0xgn.js', '/js/three.min.js', '/js/mesh.js', '/js/FileSaver.js', '/js/detector.js', '/js/base-basic-3d.js']
			@css = ['/css/base.css']
      haml :index
    end

		get '/fullscreen' do
			@js = ['/js/jquery-1.9.1.min.js', 'http://use.typekit.net/ibh0xgn.js', '/js/three.js', '/js/orbit.js', '/js/detector.js', '/js/base.js']
			@css = ['/css/fullscreen.css']
      haml :fullscreen
		end

		get '/printer' do
			@js = ['/js/jquery-1.9.1.min.js', 'http://use.typekit.net/ibh0xgn.js', '/js/three.min.js', '/js/requestAnimationFrame.js', '/js/mesh.js', '/js/FileSaver.js', '/js/detector.js', '/js/base-export-stl.js']
			@css = ['/css/base.css']
      haml :index
    end

		# ---------------------------------------------------------
		# Foursquare + Omniauth
		#	---------------------------------------------------------
		
		get '/auth/:name/callback' do
			auth = request.env['omniauth.auth']
			puts auth['credentials']['token']
			session[:auth_token] = auth['credentials']['token']
			# haml "%pre #{auth.inspect}"
			redirect '/checkins'
		end
		
		get '/auth/failure' do
			haml "%h1 Fail: #{params}"
		end
		
		get '/auth/:provider/deauthorized' do
			haml "%h1 #{params[:provider]} deauthorized the app"
		end
		
		get '/auth/logout' do
			session[:authenticated] = false
			redirect '/'
		end
		
		get '/checkins' do
		  if !session[:auth_token]
		    redirect '/auth/foursquare'
		  end
		  
			client = Foursquare2::Client.new(oauth_token: session[:auth_token])
			checkins = client.user_checkins(afterTimestamp: 1325376000, limit: 10)
			@items = checkins.items
			
			@venues = []
			checkins.items.each do |c|
			  if c.venue? and c.venue.id?
			    # venue = client.venue c.venue.id
			    venue = new Checkin
			    
			    
			    @venues << venue
			  end
			end
			
			haml :checkins
		end

		# ---------------------------------------------------------
		# Helpers
		#	---------------------------------------------------------
	
		get '/css/:name.css' do
			content_type 'text/css', :charset => 'utf-8'
			sass :"css/#{params[:name]}", Compass.sass_engine_options
		end
		
		def render_file(filename)
      contents = File.read('views/' + filename)
      Haml::Engine.new(contents).render
    end
  
  end
end
