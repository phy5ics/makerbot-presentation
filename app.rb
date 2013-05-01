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

require_relative './models/venue'

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
		# Omniauth
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

		# ---------------------------------------------------------
		# Foursquare API
		#	---------------------------------------------------------
		
		get '/foursquare/checkins' do
		  if !session[:auth_token]
		    redirect '/auth/foursquare'
		  end
		  
			client = Foursquare2::Client.new(oauth_token: session[:auth_token])
			checkins = client.user_checkins(limit: 250, offset: 1250)
			@items = checkins.items
			
			@venues = []
			checkins.items.each do |c|
			  if c.venue? and c.venue.id?
					if Venue.where(venueId: c.venue.id).count == 0
						puts 'Venue not found, adding location to database...'
				    # venue = client.venue c.venue.id
				    Venue.create!(venueId: c.venue.id, name: c.venue.name, location: [c.venue.location.lat, c.venue.location.lng], checkins: c.venue.beenHere['count'])
				    # @venues << venue
					end
			  end
			end
			
			haml :checkins
		end
		
		# ---------------------------------------------------------
		# Demos
		#	---------------------------------------------------------
		
		get '/stloader' do
			
			
			@css = ['/css/base.css']
			@js = ['http://use.typekit.net/ibh0xgn.js', '/js/three-older.js', '/js/stloader.js']
		
			haml :stloader
		end
		
		get '/foursquare/1' do
			# Greenpoint only:
			nwBounds = [40.739584, -73.966570]
			# More of NYC:
			# nwBounds = [40.760423, -74.003520]
			seBounds = [40.706799, -73.941336]
			
			gridLatResolution = 10
			gridLngResolution = 6
			
			@coordsGrid = getCheckinsInGrid(nwBounds, seBounds, gridLatResolution, gridLngResolution)
			@coordsJson = @coordsGrid.to_json
			
			@venues = Venue.within_box(location: [nwBounds, seBounds])
			
			@css = ['/css/base.css']
			@js = ['https://maps.googleapis.com/maps/api/js?key=AIzaSyAHvGsSD0S4K-VD982cUq2tzMDHIEqBzsI&sensor=false', '/js/foursquare1.js']
			haml :foursquare1
		end

		get '/foursquare/2' do
			nwBounds = [40.739584, -73.966570]
			seBounds = [40.706799, -73.941336]
			
			gridLatResolution = 10
			gridLngResolution = 6
			
			coordsGrid = getCheckinsInGrid nwBounds, seBounds, gridLatResolution, gridLngResolution
			@coordsJson = coordsGrid.to_json
			
			@css = ['/css/base.css']
			@js = ['http://use.typekit.net/ibh0xgn.js', '/js/three.js', '/js/orbit.js', '/js/FileSaver.js', '/js/mesh.js', '/js/detector.js', '/js/foursquare2.js']
			haml :foursquare2
		end
		
		
		# ---------------------------------------------------------
		# Methods
		#	---------------------------------------------------------
		
		def getCheckinsInGrid nwBounds, seBounds, gridLatResolution, gridLngResolution
			unitsLat = (nwBounds[0] - seBounds[0]) / gridLatResolution
			unitsLng = (nwBounds[1] - seBounds[1]) / gridLngResolution
			
			coordsGrid = []
			
			(0..gridLatResolution-1).each do |row|
				(0..gridLngResolution-1).each do |col|
					lat1 = nwBounds[0] - (row * unitsLat)
					lng1 = nwBounds[1] - (col * unitsLng)
					
					lat2 = nwBounds[0] - ((row + 1) * unitsLat)
					lng2 = nwBounds[1] - ((col + 1)* unitsLng)
					
					coords = {nw: [lat1, lng1], se: [lat2, lng2]}
					coordsGrid << coords
				end
			end
			
			coordsGrid.each_with_index do |c, i|
				venuesInBox = Venue.within_box(location: [c[:nw], c[:se]])
				checkinCount = 0
				
				venuesInBox.each do |v|
					checkinCount += v.checkins
				end
				
				c[:checkins] = checkinCount
				
				puts checkinCount
				puts "Grid box #{i}: #{venuesInBox.count}"
			end
			
			coordsGrid
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
